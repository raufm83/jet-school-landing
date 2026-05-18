import {
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
    const row = await this.prisma.blogCategory.create({
      data: {
        name: createDto.name as unknown as Prisma.InputJsonValue,
      },
    });
    return this.map(row);
  }

  async findAll(limit = 500) {
    const take = Math.min(Math.max(1, Number(limit) || 500), 500);
    const rows = await this.prisma.blogCategory.findMany({
      orderBy: { createdAt: 'desc' },
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
    await this.findOne(id);
    const data: Prisma.BlogCategoryUpdateInput = {};
    if (updateDto.name !== undefined) {
      data.name = updateDto.name as unknown as Prisma.InputJsonValue;
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

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.blogCategory.delete({ where: { id } });
    return { id };
  }
}
