import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaService } from 'src/prisma.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';

@Injectable()
export class GalleryService {
  private readonly uploadDir = 'uploads';
  private readonly galleryImageDir = 'gallery';

  constructor(private prisma: PrismaService) {}

  private getRelativeImagePath(filename: string | null): string | null {
    return filename ? path.join(this.galleryImageDir, filename) : null;
  }

  private getAbsoluteImagePath(filename: string): string {
    return path.join(
      process.cwd(),
      this.uploadDir,
      this.galleryImageDir,
      filename,
    );
  }

  private processMultilingualFields(dto: any) {
    const result: any = {};
    if (dto['title[az]'] !== undefined || dto['title[ru]'] !== undefined) {
      result.title = {
        az: dto['title[az]'] ?? '',
        ru: dto['title[ru]'] ?? '',
      };
    }
    if (dto['imageAlt[az]'] !== undefined || dto['imageAlt[ru]'] !== undefined) {
      result.imageAlt = {
        az: dto['imageAlt[az]'] ?? '',
        ru: dto['imageAlt[ru]'] ?? '',
      };
    }
    return result;
  }

  async create(createGalleryDto: CreateGalleryDto & { imageUrl: string }) {
    try {
      const totalImages = await this.prisma.gallery.count();
      const imageUrl = this.getRelativeImagePath(createGalleryDto.imageUrl);
      const { title, imageAlt } = this.processMultilingualFields(createGalleryDto);

      return await this.prisma.gallery.create({
        data: {
          title,
          imageAlt: imageAlt ?? undefined,
          imageUrl,
          order: totalImages,
        },
      });
    } catch (error) {
      if (createGalleryDto.imageUrl) {
        await this.cleanupImage(createGalleryDto.imageUrl);
      }
      throw error;
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    order: 'asc' | 'desc' = 'asc',
    sortBy: 'order' | 'createdAt' = 'order',
  ) {
    try {
      const skip = (page - 1) * limit;
      const orderBy =
        sortBy === 'createdAt'
          ? { createdAt: Prisma.SortOrder[order] }
          : { order: Prisma.SortOrder[order] };

      const [total, items] = await Promise.all([
        this.prisma.gallery.count(),
        this.prisma.gallery.findMany({
          skip,
          take: +limit,
          orderBy,
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
    const gallery = await this.prisma.gallery.findUnique({
      where: { id },
    });

    if (!gallery) {
      throw new NotFoundException(`Gallery image with ID ${id} not found`);
    }

    return gallery;
  }

  async update(
    id: string,
    updateGalleryDto: UpdateGalleryDto & { imageUrl?: string | null },
  ) {
    const existingGallery = await this.findOne(id);
    const oldImageUrl = existingGallery.imageUrl;
    const { imageUrl, order, ...rest } = updateGalleryDto;
    const restSafe =
      rest && typeof rest === 'object' ? rest : ({} as Record<string, unknown>);
    const { title, imageAlt } = this.processMultilingualFields(restSafe);

    const updateData: Record<string, unknown> = {};
    if (title && (title.az !== undefined || title.ru !== undefined)) {
      updateData.title = { az: title.az ?? '', ru: title.ru ?? '' };
    }
    if (imageUrl && typeof imageUrl === 'string') {
      const path = this.getRelativeImagePath(imageUrl);
      if (path) updateData.imageUrl = path;
    }

    if (Object.keys(updateData).length === 0) {
      if (typeof order !== 'number') {
        return existingGallery;
      }
    }

    if (typeof order === 'number') {
      const newOrder = order;
      const currentOrder = existingGallery.order;
      const allImages = await this.prisma.gallery.findMany({
        orderBy: { order: 'asc' },
      });

      if (newOrder < 0 || newOrder >= allImages.length) {
        throw new InternalServerErrorException('Invalid order value');
      }

      if (newOrder !== currentOrder) {
        if (newOrder < currentOrder) {
          await this.prisma.$transaction([
            this.prisma.gallery.updateMany({
              where: {
                AND: [
                  { order: { gte: newOrder } },
                  { order: { lt: currentOrder } },
                  { id: { not: id } },
                ],
              },
              data: { order: { increment: 1 } },
            }),
            this.prisma.gallery.update({
              where: { id },
              data: {
                ...updateData,
                order: newOrder,
              },
            }),
          ]);
        } else {
          await this.prisma.$transaction([
            this.prisma.gallery.updateMany({
              where: {
                AND: [
                  { order: { gt: currentOrder } },
                  { order: { lte: newOrder } },
                  { id: { not: id } },
                ],
              },
              data: { order: { decrement: 1 } },
            }),
            this.prisma.gallery.update({
              where: { id },
              data: {
                ...updateData,
                order: newOrder,
              },
            }),
          ]);
        }

        return this.findOne(id);
      }
    }

    try {
      let updatedGallery = await this.prisma.gallery.update({
        where: { id },
        data: updateData,
      });

      if (
        imageAlt &&
        (imageAlt.az !== undefined || imageAlt.ru !== undefined)
      ) {
        try {
          updatedGallery = await this.prisma.gallery.update({
            where: { id },
            data: {
              imageAlt: { az: imageAlt.az ?? '', ru: imageAlt.ru ?? '' },
            },
          });
        } catch {
          // imageAlt may not exist in schema yet; title/imageUrl already saved
        }
      }

      if (imageUrl && oldImageUrl && oldImageUrl !== updatedGallery.imageUrl) {
        const oldFilename = oldImageUrl.replace(`${this.galleryImageDir}/`, '');
        await this.cleanupImage(oldFilename);
      }

      return updatedGallery;
    } catch (error) {
      if (imageUrl) {
        await this.cleanupImage(imageUrl);
      }
      const err = error as { message?: string };
      const msg = err.message ?? String(error);
      console.error('[GalleryService.update]', msg, error);
      throw new InternalServerErrorException(msg || 'Gallery update failed');
    }
  }

  async remove(id: string) {
    try {
      const gallery = await this.findOne(id);

      await this.prisma.$transaction([
        this.prisma.gallery.delete({
          where: { id },
        }),
        this.prisma.gallery.updateMany({
          where: {
            order: {
              gt: gallery.order,
            },
          },
          data: {
            order: {
              decrement: 1,
            },
          },
        }),
      ]);

      if (gallery.imageUrl) {
        const filename = gallery.imageUrl.replace(
          `${this.galleryImageDir}/`,
          '',
        );
        await this.cleanupImage(filename);
      }

      const remainingImages = await this.prisma.gallery.findMany({
        orderBy: { order: 'asc' },
      });

      const needsFix = remainingImages.some((img, index) => img.order !== index);

      if (needsFix) {
        await this.prisma.$transaction(
          remainingImages.map((img, index) =>
            this.prisma.gallery.update({
              where: { id: img.id },
              data: { order: index },
            }),
          ),
        );
      }

      return { id };
    } catch (error) {
      throw error;
    }
  }

  private async cleanupImage(filename: string) {
    if (!filename) return;

    try {
      const absolutePath = this.getAbsoluteImagePath(filename);
      const exists = await fs
        .access(absolutePath)
        .then(() => true)
        .catch(() => false);

      if (exists) {
        await fs.unlink(absolutePath);
      }
    } catch (error) {
      console.error('Error cleaning up image:', error);
    }
  }
}
