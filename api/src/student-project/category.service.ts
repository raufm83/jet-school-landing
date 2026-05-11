import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateStudentProjectCategoryDto } from './dto/create-category.dto';
import { UpdateStudentProjectCategoryDto } from './dto/update-category.dto';
import { Prisma } from '@prisma/client';
import { serializeStudentProjectCategoryName } from './category-name.util';

@Injectable()
export class StudentProjectCategoryService {
  constructor(private prisma: PrismaService) {}

  private mapCategoryItem<
    T extends { name: Prisma.JsonValue | null; [key: string]: unknown },
  >(row: T): Omit<T, 'name'> & { name: string } {
    const { name, ...rest } = row;
    return {
      ...(rest as Omit<T, 'name'>),
      name: serializeStudentProjectCategoryName(name),
    };
  }

  private parsePositiveInt(value: unknown, fallback: number): number {
    if (value === undefined || value === null) return fallback;
    const raw = Array.isArray(value) ? value[0] : value;
    const s = String(raw).trim();
    if (s === '' || s === 'null' || s === 'undefined') return fallback;
    const n = Number(s);
    if (!Number.isFinite(n) || n < 1) return fallback;
    return Math.min(Math.floor(n), 500);
  }

  async create(createCategoryDto: CreateStudentProjectCategoryDto) {
    try {
      const row = await this.prisma.studentProjectsCategory.create({
        data: {
          name: createCategoryDto.name as unknown as Prisma.InputJsonValue,
        },
      });
      return this.mapCategoryItem(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to create category: ${error.message}`);
      }
      throw error;
    }
  }

  async findAll(pageRaw: unknown, limitRaw: unknown) {
    const page = this.parsePositiveInt(pageRaw, 1);
    const limit = Math.max(1, this.parsePositiveInt(limitRaw, 10));

    try {
      const skip = (page - 1) * limit;

      const [total, rows] = await Promise.all([
        this.prisma.studentProjectsCategory.count(),
        this.prisma.studentProjectsCategory.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { projects: true },
            },
          },
        }),
      ]);

      return {
        items: rows.map((row) => this.mapCategoryItem(row)),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 0,
        },
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Database query failed (student-project-categories):', error);
      } else {
        console.error('Unexpected error (student-project-categories findAll):', error);
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
      const category = await this.prisma.studentProjectsCategory.findUnique({
        where: { id },
        include: {
          projects: true,
          _count: {
            select: { projects: true },
          },
        },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      return this.mapCategoryItem(category);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to fetch category: ${error.message}`);
      }
      throw error;
    }
  }

  async update(id: string, updateCategoryDto: UpdateStudentProjectCategoryDto) {
    try {
      const existing = await this.prisma.studentProjectsCategory.findUnique({
        where: { id },
      });
      if (!existing) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      const data: Prisma.StudentProjectsCategoryUpdateInput = {};
      if (updateCategoryDto.name !== undefined) {
        data.name = updateCategoryDto.name as unknown as Prisma.InputJsonValue;
      }

      if (Object.keys(data).length === 0) {
        return this.findOne(id);
      }

      return await this.prisma.studentProjectsCategory
        .update({
          where: { id },
          data,
          include: {
            _count: {
              select: { projects: true },
            },
          },
        })
        .then((row) => this.mapCategoryItem(row));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to update category: ${error.message}`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const existing = await this.prisma.studentProjectsCategory.findUnique({
        where: { id },
      });
      if (!existing) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      return await this.prisma.studentProjectsCategory.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to delete category: ${error.message}`);
      }
      throw error;
    }
  }
}
