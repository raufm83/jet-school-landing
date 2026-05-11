import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateCourseEligibilityDto } from './dto/create-course-eligibility.dto';
import { UpdateCourseEligibilityDto } from './dto/update-course-eligibility.dto';
import { i18nJsonContainsSubstring } from 'src/utils/i18n-json-search';

@Injectable()
export class CourseEligibilityService {
  constructor(private prisma: PrismaService) {}

  async create(createCourseEligibilityDto: CreateCourseEligibilityDto) {
    try {
      return await this.prisma.courseEligibility.create({
        data: createCourseEligibilityDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(
          `Failed to create course eligibility: ${error.message}`,
        );
      }
      throw error;
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    courseId?: string,
    search?: string,
  ) {
    try {
      const skip = (page - 1) * limit;

      const where: Prisma.CourseEligibilityWhereInput = {};

      if (courseId === 'unassigned') {
        where.courses = { none: {} };
      } else if (courseId && courseId !== 'all') {
        where.courses = { some: { courseId } };
      }

      const searchTrimmed = (search ?? '').trim();
      if (searchTrimmed.length > 0) {
        const q = searchTrimmed;
        const all = await this.prisma.courseEligibility.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 5000,
          include: {
            courses: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        });

        const filtered = all.filter(
          (row) =>
            i18nJsonContainsSubstring(row.title, q) ||
            i18nJsonContainsSubstring(row.description, q),
        );
        const total = filtered.length;
        const items = filtered.slice(skip, skip + limit);

        return {
          items,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 0,
          },
        };
      }

      const [total, items] = await Promise.all([
        this.prisma.courseEligibility.count({ where }),
        this.prisma.courseEligibility.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            courses: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
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
        console.error('Database query failed:', error);
      }
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
    try {
      const eligibility = await this.prisma.courseEligibility.findUnique({
        where: { id },
        include: {
          courses: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      });

      if (!eligibility) {
        throw new NotFoundException(
          `Course eligibility with ID ${id} not found`,
        );
      }

      return eligibility;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to fetch course eligibility: ${error.message}`);
      }
      throw error;
    }
  }

  async update(
    id: string,
    updateCourseEligibilityDto: UpdateCourseEligibilityDto,
  ) {
    try {
      await this.findOne(id);

      return await this.prisma.courseEligibility.update({
        where: { id },
        data: updateCourseEligibilityDto,
        include: {
          courses: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(
          `Failed to update course eligibility: ${error.message}`,
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const eligibility = await this.findOne(id);

      await this.prisma.courseEligibility.delete({
        where: { id },
      });

      return eligibility;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(
          `Failed to delete course eligibility: ${error.message}`,
        );
      }
      throw error;
    }
  }

  async addToCourse(eligibilityId: string, courseId: string, order = 0) {
    try {
      return await this.prisma.courseToEligibility.create({
        data: {
          courseId,
          eligibilityId,
          order: Number.isFinite(Number(order)) ? Math.trunc(Number(order)) : 0,
        },
        include: {
          course: true,
          eligibility: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('This eligibility is already assigned to the course');
        }
        throw new Error(
          `Failed to add eligibility to course: ${error.message}`,
        );
      }
      throw error;
    }
  }

  async updateCourseOrder(
    eligibilityId: string,
    courseId: string,
    order: number,
  ) {
    try {
      return await this.prisma.courseToEligibility.update({
        where: {
          courseId_eligibilityId: {
            courseId,
            eligibilityId,
          },
        },
        data: {
          order: Number.isFinite(order) ? Math.trunc(order) : 0,
        },
        include: {
          course: true,
          eligibility: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(
          `Failed to update eligibility order: ${error.message}`,
        );
      }
      throw error;
    }
  }

  async removeFromCourse(eligibilityId: string, courseId: string) {
    try {
      return await this.prisma.courseToEligibility.delete({
        where: {
          courseId_eligibilityId: {
            courseId,
            eligibilityId,
          },
        },
        include: {
          course: true,
          eligibility: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(
          `Failed to remove eligibility from course: ${error.message}`,
        );
      }
      throw error;
    }
  }
}
