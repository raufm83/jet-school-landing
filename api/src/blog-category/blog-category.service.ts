import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { UpdateBlogCategoryDto } from './dto/update-blog-category.dto';
import { Prisma } from '@prisma/client';
import { serializeBlogCategoryName } from './blog-category-name.util';

@Injectable()
export class BlogCategoryService {
  constructor(private prisma: PrismaService) {}

  private map<
    T extends { name: Prisma.JsonValue; [key: string]: unknown },
  >(row: T): Omit<T, 'name'> & { name: { az: string; ru: string } } {
    const { name, ...rest } = row;
    return {
      ...(rest as Omit<T, 'name'>),
      name: serializeBlogCategoryName(name),
    };
  }

  async create(createDto: CreateBlogCategoryDto) {
    const total = await this.prisma.blogCategory.count();
    let order = typeof createDto.order === 'number' ? createDto.order : total;
    if (order < 0) order = 0;
    if (order > total) order = total;

    if (order < total) {
      await this.prisma.blogCategory.updateMany({
        where: { order: { gte: order } },
        data: { order: { increment: 1 } },
      });
    }

    const row = await this.prisma.blogCategory.create({
      data: {
        name: createDto.name as unknown as Prisma.InputJsonValue,
        order,
      },
    });
    return this.map(row);
  }

  async findAll(limit = 500) {
    const take = Math.min(Math.max(1, Number(limit) || 500), 500);
    const rows = await this.prisma.blogCategory.findMany({
      orderBy: { order: 'asc' },
      take,
      include: {
        _count: { select: { posts: true } },
      },
    });
    return { items: rows.map((row) => this.map(row)) };
  }

  async findOne(id: string) {
    const row = await this.prisma.blogCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { posts: true } },
      },
    });
    if (!row) throw new NotFoundException(`Blog category ${id} not found`);
    return this.map(row);
  }

  async update(id: string, updateDto: UpdateBlogCategoryDto) {
    const existing = await this.prisma.blogCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Blog category ${id} not found`);

    const data: Prisma.BlogCategoryUpdateInput = {};
    if (updateDto.name !== undefined) {
      data.name = updateDto.name as unknown as Prisma.InputJsonValue;
    }

    // Handle reorder
    if (typeof updateDto.order === 'number') {
      const all = await this.prisma.blogCategory.findMany({
        orderBy: { order: 'asc' },
      });
      const newOrder = updateDto.order;
      const currentOrder = existing.order;

      if (newOrder < 0 || newOrder >= all.length) {
        throw new BadRequestException('Invalid order value');
      }

      if (newOrder !== currentOrder) {
        if (newOrder < currentOrder) {
          await this.prisma.$transaction([
            this.prisma.blogCategory.updateMany({
              where: {
                AND: [
                  { order: { gte: newOrder } },
                  { order: { lt: currentOrder } },
                  { id: { not: id } },
                ],
              },
              data: { order: { increment: 1 } },
            }),
            this.prisma.blogCategory.update({
              where: { id },
              data: { ...data, order: newOrder },
              include: { _count: { select: { posts: true } } },
            }),
          ]);
        } else {
          await this.prisma.$transaction([
            this.prisma.blogCategory.updateMany({
              where: {
                AND: [
                  { order: { gt: currentOrder } },
                  { order: { lte: newOrder } },
                  { id: { not: id } },
                ],
              },
              data: { order: { decrement: 1 } },
            }),
            this.prisma.blogCategory.update({
              where: { id },
              data: { ...data, order: newOrder },
              include: { _count: { select: { posts: true } } },
            }),
          ]);
        }
        return this.findOne(id);
      }
    }

    if (Object.keys(data).length === 0) {
      return this.findOne(id);
    }

    const row = await this.prisma.blogCategory.update({
      where: { id },
      data,
      include: { _count: { select: { posts: true } } },
    });
    return this.map(row);
  }

  async reorder(id: string, order: number) {
    return this.update(id, { order } as UpdateBlogCategoryDto);
  }

  async remove(id: string) {
    const existing = await this.prisma.blogCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Blog category ${id} not found`);

    await this.prisma.blogCategory.delete({ where: { id } });

    // Close gap left by deletion
    await this.prisma.blogCategory.updateMany({
      where: { order: { gt: existing.order } },
      data: { order: { decrement: 1 } },
    });

    return { id };
  }
}
