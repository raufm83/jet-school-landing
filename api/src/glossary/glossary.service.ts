import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateGlossaryDto } from './dto/create-glossary.dto';
import { UpdateGlossaryDto } from './dto/update-glossary.dto';

@Injectable()
export class GlossaryService {
  constructor(private prisma: PrismaService) { }

  private processMultilingualFields(dto: any) {
    const multilingualFields = ['term', 'definition', 'slug'];
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

    return { ...processedData, ...result };
  }

  private readonly includeRelations = {
    category: true,
    author: {
      select: {
        id: true,
        name: true,
        role: true,
      },
    },
  };

  async create(createGlossaryDto: CreateGlossaryDto, authorId?: string) {
    try {
      const processedData = this.processMultilingualFields(createGlossaryDto);
      delete processedData.tags;

      return await this.prisma.glossary.create({
        data: {
          ...processedData,
          tags: [],
          authorId,
        },
        include: this.includeRelations,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to create glossary term: ${error.message}`);
      }
      throw error;
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    includeUnpublished: boolean | string = false,
    letter = '',
    sortBy = 'term',
    sortOrder?: string,
  ) {
    try {
      const skip = (page - 1) * limit;
      const unpublished = includeUnpublished === true || includeUnpublished === 'true';

      const allItems = await this.prisma.glossary.findMany({
        where: unpublished ? {} : { published: true },
        include: this.includeRelations,
      });

      const filteredItems = letter
        ? allItems.filter((item) =>
          item.term?.az?.toLowerCase().startsWith(letter.toLowerCase()),
        )
        : allItems;

      const useCreatedAt = sortBy === 'createdAt';
      const createdDir =
        useCreatedAt && sortOrder === 'asc' ? 'asc' : 'desc';

      const sorted = useCreatedAt
        ? [...filteredItems].sort((a, b) => {
            const ta = new Date(a.createdAt).getTime();
            const tb = new Date(b.createdAt).getTime();
            return createdDir === 'desc' ? tb - ta : ta - tb;
          })
        : [...filteredItems].sort(
            (a, b) => a.term?.az?.localeCompare(b.term?.az || '') || 0,
          );

      const paginated = sorted.slice(skip, skip + limit);

      return {
        items: paginated,
        meta: {
          total: filteredItems.length,
          page,
          limit,
          totalPages: Math.ceil(filteredItems.length / limit),
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

  async findAllBrief(limit = 10, includeUnpublished = false, page = 1) {
    try {
      const skip = (page - 1) * limit;
      const whereClause = includeUnpublished ? {} : { published: true };

      const [total, items] = await Promise.all([
        this.prisma.glossary.count({
          where: whereClause,
        }),
        this.prisma.glossary.findMany({
          where: whereClause,
          skip,
          take: limit,
          select: {
            id: true,
            term: true,
            slug: true,
            categoryId: true,
            published: true,
            category: {
              select: {
                name: true,
              },
            },
            author: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            term: {
              az: 'asc',
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

  async findOne(id: string) {
    const glossaryTerm = await this.prisma.glossary.findUnique({
      where: { id },
      include: {
        ...this.includeRelations,
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!glossaryTerm) {
      throw new NotFoundException(`Glossary term with ID ${id} not found`);
    }

    return glossaryTerm;
  }

  async findMyTerms(authorId: string, page = 1, limit = 10, includeUnpublished: boolean | string = true) {
    try {
      const skip = (page - 1) * limit;
      const unpublished = includeUnpublished === true || includeUnpublished === 'true';

      const whereClause = {
        authorId,
        ...(unpublished ? {} : { published: true }),
      };

      const [total, items] = await Promise.all([
        this.prisma.glossary.count({ where: whereClause }),
        this.prisma.glossary.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: this.includeRelations,
          orderBy: {
            createdAt: 'desc',
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
      console.error('Failed to fetch author terms:', error);
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

  async update(id: string, updateGlossaryDto: UpdateGlossaryDto, userId?: string, userRole?: string) {
    try {
      const existingTerm = await this.findOne(id);

      // Check permissions: ADMIN/STAFF/CONTENTMANAGER can update any term.
      // AUTHOR can only update their own terms.
      if (userRole === 'AUTHOR' && existingTerm.authorId !== userId) {
        throw new Error('You do not have permission to update this term');
      }

      const processedData = this.processMultilingualFields(updateGlossaryDto);

      ['term', 'definition', 'slug'].forEach((field) => {
        if (processedData[field]) {
          processedData[field] = {
            ...(existingTerm[field] as any),
            ...processedData[field],
          };
        }
      });

      delete processedData.tags;

      return await this.prisma.glossary.update({
        where: { id },
        data: processedData,
        include: this.includeRelations,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to update glossary term: ${error.message}`);
      }
      throw error;
    }
  }

  async remove(id: string, userId?: string, userRole?: string) {
    try {
      const existingTerm = await this.findOne(id);

      // Check permissions
      if (userRole === 'AUTHOR' && existingTerm.authorId !== userId) {
        throw new Error('You do not have permission to delete this term');
      }

      await this.prisma.glossary.delete({ where: { id } });
      return { id };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to delete glossary term: ${error.message}`);
      }
      throw error;
    }
  }

  async findBySlug(slug: string) {
    try {
      const glossaryTerm = await this.prisma.glossary.findFirst({
        where: {
          OR: [
            {
              slug: {
                is: {
                  az: {
                    equals: slug,
                  },
                },
              },
            },
            {
              slug: {
                is: {
                  ru: {
                    equals: slug,
                  },
                },
              },
            },
          ],
          published: true,
        },
        include: this.includeRelations,
      });

      if (!glossaryTerm) {
        throw new NotFoundException(
          `Glossary term with slug ${slug} not found`,
        );
      }

      if (glossaryTerm.relatedTerms && glossaryTerm.relatedTerms.length > 0) {
        const relatedTermsData = await this.prisma.glossary.findMany({
          where: {
            id: {
              in: glossaryTerm.relatedTerms as string[],
            },
            published: true,
          },
          select: {
            id: true,
            term: true,
            slug: true,
          },
        });

        return {
          ...glossaryTerm,
          relatedTermsData: relatedTermsData,
        };
      }

      return {
        ...glossaryTerm,
        relatedTermsData: [],
      };
    } catch (error) {
      throw error;
    }
  }

  async findByCategory(categoryId: string, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const whereClause = {
        categoryId,
        published: true,
      };

      const [total, items] = await Promise.all([
        this.prisma.glossary.count({
          where: whereClause,
        }),
        this.prisma.glossary.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: this.includeRelations,
          orderBy: {
            term: {
              az: 'asc',
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

  async searchGlossary(
    query: string,
    page = 1,
    limit = 10,
    categoryId?: string,
    excludeId?: string,
    includeUnpublished = false,
  ) {
    try {
      const skip = (page - 1) * limit;
      const lowerQuery = (query || '').toLowerCase(); // Fix for empty query

      const allItems = await this.prisma.glossary.findMany({
        where: includeUnpublished ? {} : { published: true },
        include: this.includeRelations,
      });

      const filtered = allItems.filter((item) => {
        if (excludeId && item.id === excludeId) return false;

        const termAz = item.term?.az?.toLowerCase() || '';
        const termRu = item.term?.ru?.toLowerCase() || '';
        const defAz = item.definition?.az?.toLowerCase() || '';
        const defRu = item.definition?.ru?.toLowerCase() || '';
        return (
          termAz.includes(lowerQuery) ||
          termRu.includes(lowerQuery) ||
          defAz.includes(lowerQuery) ||
          defRu.includes(lowerQuery)
        );
      });

      // Sort: 
      // 1. Same category first
      // 2. Alphabetical by term.az
      const sorted = filtered.sort((a, b) => {
        if (categoryId) {
          const aSameCategory = a.categoryId === categoryId;
          const bSameCategory = b.categoryId === categoryId;

          if (aSameCategory && !bSameCategory) return -1;
          if (!aSameCategory && bSameCategory) return 1;
        }

        // Secondary sort: Alphabetical
        const aTerm = a.term?.az || '';
        const bTerm = b.term?.az || '';
        return aTerm.localeCompare(bTerm);
      });

      const paginated = sorted.slice(skip, skip + limit);

      return {
        items: paginated,
        meta: {
          total: sorted.length,
          page,
          limit,
          totalPages: Math.ceil(sorted.length / limit),
        },
      };
    } catch (error) {
      console.error('Search query failed:', error);
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
}
