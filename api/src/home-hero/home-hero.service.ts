import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaService } from 'src/prisma.service';
import { UpdateHomeHeroJsonDto } from './dto/update-home-hero-json.dto';

@Injectable()
export class HomeHeroService {
  private readonly uploadDir = 'uploads';
  private readonly imageSubdir = 'home-hero';

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
      console.error('home-hero cleanupImage:', e);
    }
  }

  async findPublic() {
    return this.prisma.homeHero.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
  }

  private meaningfulTextFromHtml(html: string | undefined | null): string {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * JSON ilə yeniləmə — şəkil ayrıca POST /home-hero/image ilə yüklənir,
   * burada yalnız `imageUrl` (relative path) ötürülür. Əvvəlki multipart
   * bodyHtml[az] bəzi hostlarda itirdi.
   */
  async updateFromJson(dto: UpdateHomeHeroJsonDto) {
    const existing = await this.prisma.homeHero.findFirst({
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
        'Şəkil yoxdur — əvvəlcə "Hero şəkli yüklə" ilə fayl göndərin və ya mövcud imageUrl daxil edin',
      );
    }

    const bh = dto.bodyHtml;
    if (
      !bh ||
      !this.meaningfulTextFromHtml(bh.az) ||
      !this.meaningfulTextFromHtml(bh.ru)
    ) {
      throw new BadRequestException(
        'Hər iki dil üçün hero mətni (HTML) lazımdır',
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

    if (existing) {
      const previousUrl = existing.imageUrl;
      if (
        previousUrl &&
        previousUrl !== nextImageRel &&
        previousUrl.startsWith(`${this.imageSubdir}/`)
      ) {
        await this.cleanupImage(previousUrl);
      }

      return this.prisma.homeHero.update({
        where: { id: existing.id },
        data: {
          bodyHtml,
          ...(imageAlt !== undefined && { imageAlt }),
          imageUrl: nextImageRel,
        },
      });
    }

    return this.prisma.homeHero.create({
      data: {
        bodyHtml,
        imageUrl: nextImageRel,
        ...(imageAlt !== undefined && { imageAlt }),
      },
    });
  }
}
