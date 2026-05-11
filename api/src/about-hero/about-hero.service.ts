import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UpdateAboutHeroJsonDto } from './dto/update-about-hero-json.dto';

@Injectable()
export class AboutHeroService {
  private readonly uploadDir = 'uploads';
  private readonly imageSubdir = 'about-hero';

  constructor(private prisma: PrismaService) {}

  private getAbsoluteImagePath(relPath: string): string {
    const normalized = relPath.replace(/^uploads\//, '').replace(/\\/g, '/');
    const parts = normalized.split('/');
    const sub = parts[0];
    const file = parts.slice(1).join('/');
    return path.join(process.cwd(), this.uploadDir, sub, file);
  }

  private async cleanupImage(relativePath: string | null | undefined) {
    if (!relativePath?.trim()) return;
    try {
      const abs = this.getAbsoluteImagePath(relativePath);
      const exists = await fs
        .access(abs)
        .then(() => true)
        .catch(() => false);
      if (exists) await fs.unlink(abs);
    } catch (e) {
      console.error('about-hero cleanupImage:', e);
    }
  }

  async findPublic() {
    return this.prisma.aboutHero.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
  }

  private meaningfulTextFromHtml(html: string | undefined | null): string {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private normalizeMissionVision(dto: UpdateAboutHeroJsonDto): Record<string, unknown> | undefined {
    const mv = dto.missionVision;
    if (!mv || typeof mv !== 'object') return undefined;
    const norm = (v?: { az?: string; ru?: string }) => ({
      az: (v?.az ?? '').trim(),
      ru: (v?.ru ?? '').trim(),
    });
    return {
      sectionTitle: norm(mv.sectionTitle),
      missionTitle: norm(mv.missionTitle),
      missionDescription: norm(mv.missionDescription),
      visionTitle: norm(mv.visionTitle),
      visionDescription: norm(mv.visionDescription),
      imageUrl: (mv.imageUrl ?? '').trim(),
      imageAlt: norm(mv.imageAlt),
    };
  }

  async updateFromJson(dto: UpdateAboutHeroJsonDto) {
    const existing = await this.prisma.aboutHero.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    let nextImageRel: string | null = null;
    if (dto.imageUrl != null && String(dto.imageUrl).trim() !== '') {
      nextImageRel = String(dto.imageUrl).trim();
    } else {
      nextImageRel = existing?.imageUrl ?? null;
    }

    if (!nextImageRel) {
      throw new BadRequestException(
        'Shekil yoxdur - evvelce "Shekil yukle" ile fayl gonderin ve ya movcud imageUrl daxil edin',
      );
    }

    const bh = dto.bodyHtml;
    if (
      !bh ||
      !this.meaningfulTextFromHtml(bh.az) ||
      !this.meaningfulTextFromHtml(bh.ru)
    ) {
      throw new BadRequestException(
        'Her iki dil ucun giris metni (HTML) lazimdir',
      );
    }

    const bodyHtml = { az: bh.az ?? '', ru: bh.ru ?? '' };
    const imageAlt =
      dto.imageAlt != null
        ? {
            az: dto.imageAlt.az ?? '',
            ru: dto.imageAlt.ru ?? '',
          }
        : undefined;

    const missionVision = this.normalizeMissionVision(dto);

    if (existing) {
      const previousUrl = existing.imageUrl;
      if (
        previousUrl &&
        previousUrl !== nextImageRel &&
        previousUrl.startsWith(`${this.imageSubdir}/`)
      ) {
        await this.cleanupImage(previousUrl);
      }

      return this.prisma.aboutHero.update({
        where: { id: existing.id },
        data: {
          bodyHtml,
          ...(imageAlt !== undefined && { imageAlt }),
          imageUrl: nextImageRel,
          ...(missionVision !== undefined && {
            missionVision: missionVision as Prisma.InputJsonValue,
          }),
        },
      });
    }

    return this.prisma.aboutHero.create({
      data: {
        bodyHtml,
        imageUrl: nextImageRel,
        ...(imageAlt !== undefined && { imageAlt }),
        ...(missionVision !== undefined && {
          missionVision: missionVision as Prisma.InputJsonValue,
        }),
      },
    });
  }
}
