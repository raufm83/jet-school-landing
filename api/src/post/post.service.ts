import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma, PostType, EventStatus, Role } from '@prisma/client';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import * as path from 'path';
import { startOfDay } from 'date-fns';
import { slugifyText } from 'src/utils/slugify';

@Injectable()
export class PostService {
  private readonly uploadDir = 'uploads-acad';
  private readonly teamImageDir = 'post';

  private getRelativeImagePath(filename: string | null): string | null {
    return filename ? path.join(this.teamImageDir, filename) : null;
  }

  /** Normalize tags from DB to { az: string[]; ru: string[] } for API response */
  private normalizeTags(raw: unknown): { az: string[]; ru: string[] } {
    const pushStrings = (arr: unknown): string[] => {
      if (Array.isArray(arr)) {
        return arr.filter((x): x is string => typeof x === 'string' && x.trim() !== '');
      }
      if (typeof arr === 'string' && arr.trim() !== '') return [arr.trim()];
      return [];
    };

    if (raw == null) return { az: [], ru: [] };

    // Bir sənəddə birbaşa { az, ru } (massiv deyil)
    if (typeof raw === 'object' && !Array.isArray(raw)) {
      const o = raw as Record<string, unknown>;
      if (o.az !== undefined || o.ru !== undefined) {
        return { az: pushStrings(o.az), ru: pushStrings(o.ru) };
      }
    }

    if (Array.isArray(raw) && raw.length > 0) {
      const az: string[] = [];
      const ru: string[] = [];
      for (const el of raw) {
        if (el && typeof el === 'object' && !Array.isArray(el)) {
          const o = el as Record<string, unknown>;
          if (o.az !== undefined || o.ru !== undefined) {
            az.push(...pushStrings(o.az));
            ru.push(...pushStrings(o.ru));
          }
        } else if (typeof el === 'string' && el.trim() !== '') {
          az.push(el.trim());
          ru.push(el.trim());
        }
      }
      if (az.length > 0 || ru.length > 0) {
        return { az, ru };
      }
    }
    return { az: [], ru: [] };
  }

  /** URL-dən gələn teq bu postun istənilən dil siyahısında varmı (trim, case-insensitive) */
  private postHasTag(rawTags: unknown, needle: string): boolean {
    const n = needle.trim().toLowerCase();
    if (!n) return false;
    const { az, ru } = this.normalizeTags(rawTags);
    const match = (s: string) => s.trim().toLowerCase() === n;
    return az.some(match) || ru.some(match);
  }

  /** Normalize imageUrl from DB (string legacy or Json) to { az?, ru? } for API response */
  private normalizeImageUrl(raw: unknown): { az?: string; ru?: string } | null {
    if (raw == null) return null;
    if (typeof raw === 'string' && raw.trim() !== '') {
      return { az: raw, ru: raw };
    }
    if (typeof raw === 'object' && raw !== null && ('az' in raw || 'ru' in raw)) {
      const o = raw as Record<string, string>;
      const az = o.az?.trim();
      const ru = o.ru?.trim();
      if (!az && !ru) return null;
      return { ...(az && { az }), ...(ru && { ru }) };
    }
    return null;
  }

  private getAbsoluteImagePath(filename: string): string {
    return path.join(
      process.cwd(),
      this.uploadDir,
      this.teamImageDir,
      filename,
    );
  }

  /** JSON və multipart/form-data üçün published sahəsinin təhlükəsiz oxunması */
  private coercePublishedInput(value: unknown): boolean | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'boolean') return value;
    const s = String(value).trim().toLowerCase();
    if (s === 'true' || s === '1') return true;
    if (s === 'false' || s === '0') return false;
    return undefined;
  }

  private processMultilingualFields(dto: any) {
    const multilingualFields = ['title', 'content', 'slug', 'imageAlt'];
    const processedData: any = { ...dto };
    const result: any = {};

    multilingualFields.forEach((field) => {
      if (dto[`${field}[az]`] || dto[`${field}[ru]`]) {
        result[field] = {
          az: dto[`${field}[az]`],
          ru: dto[`${field}[ru]`],
        };
        delete processedData[`${field}[az]`];
        delete processedData[`${field}[ru]`];
      }
    });

    // tags: per-language arrays (tagsAz, tagsRu) or legacy flat tags
    const tagsAzRaw = dto['tagsAz'];
    const tagsRuRaw = dto['tagsRu'];
    const arr = (v: unknown): string[] => {
      if (Array.isArray(v)) return v.filter((x) => typeof x === 'string');
      if (typeof v === 'string' && v.trim()) return [v.trim()];
      return [];
    };
    const az = arr(tagsAzRaw);
    const ru = arr(tagsRuRaw);
    if (tagsAzRaw !== undefined || tagsRuRaw !== undefined) {
      result['tags'] = [{ az, ru }];
      delete processedData['tagsAz'];
      delete processedData['tagsRu'];
    } else {
      const rawTags = dto['tags'];
      if (rawTags !== undefined && rawTags !== null) {
        const flat = Array.isArray(rawTags) ? rawTags.filter(Boolean) : typeof rawTags === 'string' && rawTags ? [rawTags] : [];
        result['tags'] = flat.length ? [{ az: flat, ru: flat }] : undefined;
        delete processedData['tags'];
      } else {
        let i = 0;
        const bracketTags: string[] = [];
        while (dto[`tags[${i}]`] !== undefined) {
          bracketTags.push(dto[`tags[${i}]`]);
          delete processedData[`tags[${i}]`];
          i++;
        }
        if (bracketTags.length > 0) {
          const flat = bracketTags.filter(Boolean);
          result['tags'] = [{ az: flat, ru: flat }];
        }
      }
    }

    // Remove any remaining unknown bracket-notation keys from processedData
    Object.keys(processedData).forEach((key) => {
      if (/^\w+\[\w+\]$/.test(key)) {
        delete processedData[key];
      }
    });

    const merged = { ...processedData, ...result };
    this.normalizeSlugInPayload(merged);
    return merged;
  }

  /** Transliterate slug fields to URL-safe Latin before persist (multipart or JSON). */
  private normalizeSlugInPayload(payload: Record<string, unknown>): void {
    if (
      payload.slug == null ||
      typeof payload.slug !== 'object' ||
      Array.isArray(payload.slug)
    ) {
      return;
    }
    const s = payload.slug as Record<string, unknown>;
    const next: Record<string, unknown> = { ...s };
    for (const key of ['az', 'ru'] as const) {
      if (next[key] === undefined) continue;
      const raw = String(next[key]).trim();
      next[key] = raw === '' ? '' : slugifyText(raw);
    }
    payload.slug = next;
  }

  private buildPostSlugWhereOr(slugParam: string) {
    let decoded = slugParam.trim();
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      /* use trimmed */
    }
    const normalized = slugifyText(decoded);
    const variants = [...new Set([decoded, normalized].filter((s) => s.length > 0))];
    return variants.flatMap((s) => [
      { slug: { is: { az: { equals: s } } } },
      { slug: { is: { ru: { equals: s } } } },
    ]);
  }

  /** 24 hex — Mongo ObjectId; slug sorğusu nəticə verməyəndə (əlaqəli postlar blokları üçün) tək post açmaq üçün */
  private looksLikeMongoObjectId(id: string): boolean {
    return /^[a-f\d]{24}$/i.test(id.trim());
  }

  /**
   * Determines the EventStatus based on the offer dates
   */
  private determineOfferStatus(
    offerStartDate?: Date | null,
    offerEndDate?: Date | null,
    eventDate?: Date | string | null,
  ): EventStatus {
    const now = new Date();

    if (offerEndDate) {
      const endDate = new Date(offerEndDate);
      return endDate >= now ? EventStatus.ONGOING : EventStatus.PAST;
    }

    if (eventDate) {
      const eDate = new Date(eventDate);
      if (!isNaN(eDate.getTime())) {
        return eDate >= now ? EventStatus.ONGOING : EventStatus.PAST;
      }
    }

    return EventStatus.ONGOING;
  }

  /**
   * Determines the EventStatus based on the event date
   */
  private determineEventStatus(eventDate?: Date | string | null): EventStatus | undefined {
    if (!eventDate) return undefined;
    const date = new Date(eventDate);
    const now = new Date();

    if (isNaN(date.getTime())) return undefined;

    return date > now ? EventStatus.UPCOMING : EventStatus.PAST;
  }

  constructor(private prisma: PrismaService) { }

  async create(
    createPostDto: CreatePostDto & { imageUrl?: string | { az?: string; ru?: string } },
    authorId: string,
    userRole?: Role,
  ) {
    try {
      // AUTHOR can only create BLOG posts
      const effectivePostType = userRole === Role.AUTHOR ? PostType.BLOG : (createPostDto.postType ?? PostType.BLOG);
      const raw = createPostDto.imageUrl ?? null;
      let imageUrlJson: { az?: string; ru?: string } | null = null;
      if (typeof raw === 'string' && raw.trim() !== '') {
        const path = this.getRelativeImagePath(raw);
        if (path) imageUrlJson = { az: path, ru: path };
      } else if (raw != null && typeof raw === 'object') {
        const azPath = raw.az ? this.getRelativeImagePath(raw.az) : null;
        const ruPath = raw.ru ? this.getRelativeImagePath(raw.ru) : null;
        if (azPath || ruPath) imageUrlJson = { ...(azPath && { az: azPath }), ...(ruPath && { ru: ruPath }) };
      }
      const processedData = this.processMultilingualFields(createPostDto);

      let eventStatus = createPostDto.eventStatus;

      if (createPostDto.postType === PostType.OFFERS && (createPostDto.offerEndDate || createPostDto.eventDate)) {
        eventStatus = this.determineOfferStatus(
          createPostDto.offerStartDate as any,
          createPostDto.offerEndDate as any,
          createPostDto.eventDate,
        );
      } else if (createPostDto.eventDate) {
        eventStatus = this.determineEventStatus(createPostDto.eventDate);
      }

      let isPublished = String(createPostDto.published) === 'true';
      if (createPostDto.postType === PostType.OFFERS && eventStatus === EventStatus.PAST) {
        isPublished = false;
      }

      const created = await this.prisma.post.create({
        data: {
          ...processedData,
          postType: effectivePostType,
          ...(imageUrlJson && { imageUrl: imageUrlJson }),
          published: isPublished,
          eventStatus: eventStatus,
          author: {
            connect: { id: authorId },
          },
        },
      });
      return {
        ...created,
        imageUrl: this.normalizeImageUrl(created.imageUrl),
        tags: this.normalizeTags(created.tags),
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to create post: ${error.message}`);
      }
      throw error;
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    includeUnpublished = false,
    postType?: PostType,
    includeBlogs = false,
    eventStatus?: string,
    authorId?: string,
    userRole?: Role,
    tag?: string,
    excludeOffers = false,
  ) {
    try {
      const skip = (page - 1) * limit;
      let whereClause: any = includeUnpublished ? {} : { published: true };

      // AUTHOR sees only their own BLOG posts
      if (userRole === Role.AUTHOR && authorId) {
        whereClause = { ...whereClause, authorId, postType: PostType.BLOG };
      } else if (postType !== null && postType !== undefined) {
        whereClause = { ...whereClause, postType };

        // Hide expired OFFERS from the frontend
        if (postType === PostType.OFFERS && !includeUnpublished) {
          const now = new Date();
          whereClause = {
            ...whereClause,
            OR: [{ offerEndDate: null }, { offerEndDate: { gte: now } }],
          };
        }
      } else if (!Boolean(includeBlogs)) {
        // Bloq olmadan: əvvəl NEWS + EVENT + OFFERS; excludeOffers ilə yalnız NEWS + EVENT
        if (excludeOffers) {
          whereClause = {
            ...whereClause,
            postType: { in: [PostType.NEWS, PostType.EVENT] },
          };
        } else {
          whereClause = { ...whereClause, postType: { not: PostType.BLOG } };
        }
      } else if (excludeOffers) {
        // Bloq və Media (ümumi axın): BLOG + NEWS + EVENT, Kampaniyalar (OFFERS) yox
        whereClause = { ...whereClause, postType: { not: PostType.OFFERS } };
      }

      // Handle event specific filtering based on eventDate
      if (postType === PostType.EVENT && eventStatus) {
        const now = startOfDay(new Date());
        if (eventStatus === 'UPCOMING') {
          // Future or today
          whereClause = {
            ...whereClause,
            eventDate: { gte: now },
          };
        } else if (eventStatus === 'PAST') {
          // Past events
          whereClause = {
            ...whereClause,
            eventDate: { lt: now },
          };
        }
      }

      this.updateOfferStatuses().catch(() => {});
      this.updateEventStatuses().catch(() => {});

      const tagTrim = typeof tag === 'string' ? tag.trim() : '';
      if (tagTrim) {
        const candidates = await this.prisma.post.findMany({
          where: whereClause,
          select: { id: true, tags: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        });
        const matched = candidates.filter((p) =>
          this.postHasTag(p.tags, tagTrim),
        );
        const total = matched.length;
        const slice = matched.slice(skip, skip + +limit);
        const pageIds = slice.map((p) => p.id);
        if (pageIds.length === 0) {
          return {
            items: [],
            meta: {
              total: 0,
              page,
              limit,
              totalPages: 0,
            },
          };
        }
        const items = await this.prisma.post.findMany({
          where: { id: { in: pageIds } },
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
        const orderMap = new Map(pageIds.map((id, i) => [id, i]));
        items.sort(
          (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
        );
        const normalizedItems = items.map((p) => ({
          ...p,
          imageUrl: this.normalizeImageUrl(p.imageUrl),
          tags: this.normalizeTags(p.tags),
        }));
        return {
          items: normalizedItems,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 0,
          },
        };
      }

      const [total, items] = await Promise.all([
        this.prisma.post.count({
          where: whereClause,
        }),
        this.prisma.post.findMany({
          where: whereClause,
          skip,
          take: +limit,
          orderBy: postType === PostType.EVENT
            ? { eventDate: 'desc' }
            : { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
      ]);

      const normalizedItems = items.map((p) => ({
        ...p,
        imageUrl: this.normalizeImageUrl(p.imageUrl),
        tags: this.normalizeTags(p.tags),
      }));
      return {
        items: normalizedItems,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Database query failed:', error);
      return {
        items: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }
  }

  async findOne(id: string, userId?: string, userRole?: Role) {
    await this.updateOfferStatus(id);

    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            role: true,
            profile: {
              select: { avatarUrl: true, profession: true },
            },
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // AUTHOR can only view their own posts
    if (userRole === Role.AUTHOR && userId && post.authorId !== userId) {
      throw new ForbiddenException('You can only view your own posts');
    }

    if (post.postType === PostType.EVENT && post.eventDate) {
      const newStatus = this.determineEventStatus(post.eventDate);
      if (newStatus && post.eventStatus !== newStatus) {
        const updated = await this.prisma.post.update({
          where: { id },
          data: { eventStatus: newStatus },
          include: { author: { select: { id: true, name: true } } }
        });
        return {
          ...updated,
          imageUrl: this.normalizeImageUrl(updated.imageUrl),
          tags: this.normalizeTags(updated.tags),
        };
      }
    }

    return {
      ...post,
      imageUrl: this.normalizeImageUrl(post.imageUrl),
      tags: this.normalizeTags(post.tags),
    };
  }

  async update(id: string, updatePostDto: UpdatePostDto, userId?: string, userRole?: Role) {
    try {
      const existingPost = await this.findOne(id, userId, userRole);

      // AUTHOR can only update their own posts and cannot change postType from BLOG
      if (userRole === Role.AUTHOR) {
        if (existingPost.authorId !== userId) {
          throw new ForbiddenException('You can only edit your own posts');
        }
        if (updatePostDto.postType !== undefined && updatePostDto.postType !== PostType.BLOG) {
          throw new ForbiddenException('Authors can only have BLOG type posts');
        }
      }
      const processedData = this.processMultilingualFields(updatePostDto);

      ['title', 'content', 'slug'].forEach((field) => {
        if (processedData[field]) {
          processedData[field] = {
            ...(existingPost[field] as any),
            ...processedData[field],
          };
        }
      });

      let imageData: { imageUrl?: { az?: string; ru?: string } } = {};
      const raw = updatePostDto.imageUrl ?? null;
      if (typeof raw === 'string' && raw.trim() !== '') {
        const path = this.getRelativeImagePath(raw);
        if (path) imageData = { imageUrl: { az: path, ru: path } };
      } else if (raw != null && typeof raw === 'object' && ('az' in raw || 'ru' in raw)) {
        const existing = (existingPost.imageUrl as { az?: string; ru?: string }) || {};
        const azPath = raw.az ? this.getRelativeImagePath(raw.az) : existing.az;
        const ruPath = raw.ru ? this.getRelativeImagePath(raw.ru) : existing.ru;
        imageData = { imageUrl: { ...(azPath && { az: azPath }), ...(ruPath && { ru: ruPath }) } };
      }

      const postType = updatePostDto.postType || existingPost.postType;
      let eventStatus = existingPost.eventStatus;

      if (postType === PostType.OFFERS) {
        const offerEndDate = updatePostDto.offerEndDate || existingPost.offerEndDate;
        const offerStartDate = updatePostDto.offerStartDate || existingPost.offerStartDate;
        const eventDate = updatePostDto.eventDate || existingPost.eventDate;
        eventStatus = this.determineOfferStatus(
          offerStartDate as any,
          offerEndDate as any,
          eventDate,
        );
      } else {
        eventStatus = updatePostDto.eventStatus || existingPost.eventStatus;
        const eventDate = updatePostDto.eventDate || existingPost.eventDate;
        if (eventDate) {
          eventStatus = this.determineEventStatus(eventDate);
        }
      }

      const wantsPublished = this.coercePublishedInput(updatePostDto.published);

      if (postType === PostType.OFFERS && eventStatus === EventStatus.PAST) {
        processedData.published = false;
      } else if (wantsPublished !== undefined) {
        processedData.published = wantsPublished;
      }

      const updateData: any = {
        ...processedData,
        ...imageData,
        eventStatus: eventStatus,
      };

      const updated = await this.prisma.post.update({
        where: { id },
        data: updateData,
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      return {
        ...updated,
        imageUrl: this.normalizeImageUrl(updated.imageUrl),
        tags: this.normalizeTags(updated.tags),
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to update post: ${error.message}`);
      }
      throw error;
    }
  }

  async remove(id: string, userId?: string, userRole?: Role) {
    try {
      const post = await this.findOne(id, userId, userRole);
      if (userRole === Role.AUTHOR && post.authorId !== userId) {
        throw new ForbiddenException('You can only delete your own posts');
      }
      await this.prisma.post.delete({ where: { id } });
      return { id };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to delete post: ${error.message}`);
      }
      throw error;
    }
  }

  async findBySlug(slug: string) {
    const raw = slug?.trim() ?? '';
    if (!raw) {
      throw new NotFoundException('Post slug is required');
    }
    try {
      const slugOr = this.buildPostSlugWhereOr(raw);
      let post =
        slugOr.length > 0
          ? await this.prisma.post.findFirst({
              where: {
                OR: slugOr,
                published: true,
              },
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    profile: {
                      select: { avatarUrl: true, profession: true },
                    },
                  },
                },
              },
            })
          : null;

      if (!post && this.looksLikeMongoObjectId(raw)) {
        post = await this.prisma.post.findFirst({
          where: { id: raw, published: true },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                role: true,
                profile: {
                  select: { avatarUrl: true, profession: true },
                },
              },
            },
          },
        });
      }

      if (!post) {
        throw new NotFoundException(`Post with slug ${raw} not found`);
      }

      if (post.postType === PostType.OFFERS) {
        await this.updateOfferStatus(post.id);
        const refreshed = await this.prisma.post.findUnique({
          where: { id: post.id },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                role: true,
                profile: {
                  select: { avatarUrl: true, profession: true },
                },
              },
            },
          },
        });
        const offerPost = refreshed ?? post;
        return {
          ...offerPost,
          imageUrl: this.normalizeImageUrl(offerPost.imageUrl),
          tags: this.normalizeTags(offerPost.tags),
        };
      }

      if (post.postType === PostType.EVENT && post.eventDate) {
        const newStatus = this.determineEventStatus(post.eventDate);
        if (newStatus && post.eventStatus !== newStatus) {
          const updated = await this.prisma.post.update({
            where: { id: post.id },
            data: { eventStatus: newStatus },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                  profile: {
                    select: { avatarUrl: true, profession: true },
                  },
                },
              },
            },
          });
          return {
            ...updated,
            imageUrl: this.normalizeImageUrl(updated.imageUrl),
            tags: this.normalizeTags(updated.tags),
          };
        }
      }

      return {
        ...post,
        imageUrl: this.normalizeImageUrl(post.imageUrl),
        tags: this.normalizeTags(post.tags),
      };
    } catch (error) {
      throw error;
    }
  }

  async getPostsByType(
    type: PostType,
    page = 1,
    limit = 10,
    includeUnpublished = false,
    eventStatus?: any,
    authorId?: string,
    userRole?: Role,
    tag?: string,
  ) {
    // AUTHOR can only request BLOG type
    if (userRole === Role.AUTHOR && type !== PostType.BLOG) {
      return { items: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }
    return this.findAll(
      page,
      limit,
      includeUnpublished,
      type,
      false,
      eventStatus,
      authorId,
      userRole,
      tag,
      false,
    );
  }

  /**
   * Updates the status of a specific offer post
   */
  async updateOfferStatus(postId: string): Promise<void> {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        select: {
          postType: true,
          offerStartDate: true,
          offerEndDate: true,
          eventDate: true,
          eventStatus: true,
          published: true,
        },
      });

      if (!post || post.postType !== PostType.OFFERS) {
        return;
      }

      const newStatus = this.determineOfferStatus(
        post.offerStartDate,
        post.offerEndDate,
        post.eventDate,
      );

      if (post.eventStatus !== newStatus || (newStatus === EventStatus.PAST && post.published)) {
        await this.prisma.post.update({
          where: { id: postId },
          data: {
            eventStatus: newStatus,
            published: newStatus === EventStatus.PAST ? false : post.published
          },
        });
      }
    } catch (error) {
      console.error(`Failed to update offer status for post ${postId}:`, error);
    }
  }

  /**
   * Updates the status of all offer posts
   */
  async updateOfferStatuses(): Promise<void> {
    try {
      const offerPosts = await this.prisma.post.findMany({
        where: {
          postType: PostType.OFFERS,
          published: true,
        },
        select: {
          id: true,
          offerStartDate: true,
          offerEndDate: true,
          eventDate: true,
          eventStatus: true,
          published: true,
        },
      });

      const updates = offerPosts.map((post) => {
        const newStatus = this.determineOfferStatus(
          post.offerStartDate,
          post.offerEndDate,
          post.eventDate,
        );

        if (post.eventStatus !== newStatus || (newStatus === EventStatus.PAST && post.published)) {
          return this.prisma.post.update({
            where: { id: post.id },
            data: {
              eventStatus: newStatus,
              published: newStatus === EventStatus.PAST ? false : post.published
            },
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updates);
    } catch (error) {
      console.error('Failed to update offer statuses:', error);
    }
  }

  /**
   * Updates the status of all event posts
   */
  async updateEventStatuses(): Promise<void> {
    try {
      const eventPosts = await this.prisma.post.findMany({
        where: {
          postType: PostType.EVENT,
        },
        select: {
          id: true,
          eventDate: true,
          eventStatus: true,
        },
      });

      const updates = eventPosts.map((post) => {
        const newStatus = this.determineEventStatus(post.eventDate);

        if (newStatus && post.eventStatus !== newStatus) {
          return this.prisma.post.update({
            where: { id: post.id },
            data: { eventStatus: newStatus },
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updates);
    } catch (error) {
      console.error('Failed to update event statuses:', error);
    }
  }
}
