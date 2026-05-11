import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { CreateStudentReviewDto } from './dto/create-student-review.dto';
import { UpdateStudentReviewDto } from './dto/update-student-review.dto';

@Injectable()
export class StudentReviewService {
  constructor(private prisma: PrismaService) {}

  private parseYoutubeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        if (urlObj.pathname.startsWith('/shorts/')) {
          const videoId = urlObj.pathname.split('/shorts/')[1];
          return videoId.split('?')[0];
        }
        return urlObj.searchParams.get('v') || '';
      }
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1);
      }
      if (url.match(/^[a-zA-Z0-9_-]{11}$/)) return url;
      return '';
    } catch {
      const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      if (watchMatch?.[1]) return watchMatch[1];
      const shortMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shortMatch?.[1]) return shortMatch[1];
      const youtuBeMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
      if (youtuBeMatch?.[1]) return youtuBeMatch[1];
      return '';
    }
  }

  private getYoutubeThumbnailUrl(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }

  private normalizeYoutubeUrl(videoId: string): string {
    if (!videoId) return '';
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  private async validateCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }
    return course;
  }

  async create(dto: CreateStudentReviewDto) {
    await this.validateCourse(dto.courseId);
    const videoId = this.parseYoutubeUrl(dto.link);
    const imageUrl = videoId ? this.getYoutubeThumbnailUrl(videoId) : null;
    const normalizedLink = videoId ? this.normalizeYoutubeUrl(videoId) : dto.link;

    return this.prisma.$transaction(async (tx) => {
      await tx.studentReview.updateMany({
        data: {
          order: {
            increment: 1,
          },
        },
      });

      return tx.studentReview.create({
        data: {
          title: dto.title,
          description: dto.description,
          courseId: dto.courseId,
          link: normalizedLink,
          imageUrl,
          order: 0,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    });
  }

  async findAll(
    page = 1,
    limit = 10,
    order: 'asc' | 'desc' = 'desc',
    sortBy: 'order' | 'createdAt' = 'createdAt',
  ) {
    try {
      const skip = (page - 1) * limit;
      const orderBy =
        sortBy === 'createdAt'
          ? { createdAt: Prisma.SortOrder[order] }
          : { order: Prisma.SortOrder[order] };
      const [total, items] = await Promise.all([
        this.prisma.studentReview.count(),
        this.prisma.studentReview.findMany({
          skip,
          take: limit,
          orderBy,
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        }),
      ]);
      return {
        items,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Student reviews fetch failed:', error);
      }
      return {
        items: [],
        meta: { total: 0, page, limit, totalPages: 0 },
      };
    }
  }

  async findOne(id: string) {
    const review = await this.prisma.studentReview.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
    if (!review) {
      throw new NotFoundException(`Student review with ID ${id} not found`);
    }
    return review;
  }

  async update(id: string, dto: UpdateStudentReviewDto) {
    const existing = await this.findOne(id);

    if (dto.courseId) {
      await this.validateCourse(dto.courseId);
    }

    let imageUrl: string | null | undefined = undefined;
    let normalizedLink: string | undefined = undefined;

    if (dto.link && dto.link !== existing.link) {
      const videoId = this.parseYoutubeUrl(dto.link);
      if (videoId) {
        imageUrl = this.getYoutubeThumbnailUrl(videoId);
        normalizedLink = this.normalizeYoutubeUrl(videoId);
      }
    }

    const updateData: Parameters<typeof this.prisma.studentReview.update>[0]['data'] = {
      ...(dto.title && { title: dto.title }),
      ...(dto.description && { description: dto.description }),
      ...(dto.courseId && { courseId: dto.courseId }),
      ...(normalizedLink && { link: normalizedLink }),
      ...(imageUrl !== undefined && { imageUrl }),
    };

    if (typeof dto.order === 'number') {
      const newOrder = dto.order;
      const currentOrder = existing.order;
      const allReviews = await this.prisma.studentReview.findMany({
        orderBy: { order: 'asc' },
      });

      if (newOrder < 0 || newOrder >= allReviews.length) {
        throw new Error('Invalid order value');
      }

      if (newOrder !== currentOrder) {
        if (newOrder < currentOrder) {
          await this.prisma.$transaction([
            this.prisma.studentReview.updateMany({
              where: {
                AND: [
                  { order: { gte: newOrder } },
                  { order: { lt: currentOrder } },
                  { id: { not: id } },
                ],
              },
              data: { order: { increment: 1 } },
            }),
            this.prisma.studentReview.update({
              where: { id },
              data: { ...updateData, order: newOrder },
              include: {
                course: { select: { id: true, title: true } },
              },
            }),
          ]);
        } else {
          await this.prisma.$transaction([
            this.prisma.studentReview.updateMany({
              where: {
                AND: [
                  { order: { gt: currentOrder } },
                  { order: { lte: newOrder } },
                  { id: { not: id } },
                ],
              },
              data: { order: { decrement: 1 } },
            }),
            this.prisma.studentReview.update({
              where: { id },
              data: { ...updateData, order: newOrder },
              include: {
                course: { select: { id: true, title: true } },
              },
            }),
          ]);
        }
        return this.findOne(id);
      }
    }

    if (Object.keys(updateData).length === 0) {
      return this.findOne(id);
    }

    return this.prisma.studentReview.update({
      where: { id },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const review = await this.findOne(id);
    await this.prisma.studentReview.delete({ where: { id } });
    const list = await this.prisma.studentReview.findMany({
      orderBy: { order: 'asc' },
    });
    for (let i = 0; i < list.length; i++) {
      if (list[i].order !== i) {
        await this.prisma.studentReview.update({
          where: { id: list[i].id },
          data: { order: i },
        });
      }
    }
    return review;
  }
}
