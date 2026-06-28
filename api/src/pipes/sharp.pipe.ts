import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface SharpPipeOptions {
  /** Yüklənən şəkillərin yerləşdiriləcəyi subfolder (`uploads/<folder>`). */
  folder?: string;
  /**
   * Şəkilin ən uzun tərəfi bu ölçüdə (px) olacaq. Daha kiçik şəkillər yenidən
   * böyüdülmür. İdeal olaraq istehlak olunan maksimal görünmə ölçüsü.
   */
  maxDimension?: number;
  /**
   * WebP kodlayıcı üçün keyfiyyət (0-100). Produksiya üçün 78-85 optimal
   * balansdır (görünüşdə fərq yox, amma ~30-40% daha az bayt).
   */
  quality?: number;
  /**
   * WebP effort (0-6). Daha yüksək → daha yaxşı sıxılma, daha çox CPU.
   * Upload-da bir dəfə çağırılır, ona görə 5 qəbul ediləndir.
   */
  effort?: number;
}

const DEFAULTS: Required<Omit<SharpPipeOptions, 'folder'>> = {
  maxDimension: 1024,
  quality: 82,
  effort: 5,
};

/**
 * Yüklənən şəkilləri `sharp` ilə normal hala gətirən pipe:
 *  1. EXIF orientation-a əsasən avtomatik çevirir (`.rotate()`)
 *  2. Ən uzun tərəfi `maxDimension` olana kimi kiçildir (böyütmür)
 *  3. WebP-ə konvertasiya edir (`quality`, `effort`)
 *  4. `uploads/<folder>/<name>-<ts>.webp` yaddaş yeri
 *
 * Geri uyğunluq: köhnə konstruktor `new SharpPipe('folder', 1024)` formatı da
 * dəstəklənir — ikinci arqument rəqəmdirsə `maxDimension` kimi qəbul edilir.
 */
@Injectable()
export class SharpPipe
  implements PipeTransform<Express.Multer.File, Promise<string>>
{
  private readonly folder: string;
  private readonly maxDimension: number;
  private readonly quality: number;
  private readonly effort: number;

  constructor(
    folderOrOptions?: string | SharpPipeOptions,
    legacyMaxDimension?: number,
  ) {
    let opts: SharpPipeOptions;
    if (typeof folderOrOptions === 'object' && folderOrOptions !== null) {
      opts = folderOrOptions;
    } else {
      opts = {
        folder: folderOrOptions as string | undefined,
        maxDimension: legacyMaxDimension,
      };
    }

    this.folder = opts.folder ?? '';
    this.maxDimension = opts.maxDimension ?? DEFAULTS.maxDimension;
    this.quality = opts.quality ?? DEFAULTS.quality;
    this.effort = opts.effort ?? DEFAULTS.effort;
  }

  async transform(image: Express.Multer.File): Promise<string> {
    if (!image) return null;

    const originalName = path.parse(image.originalname).name;
    const filename = `${originalName}-${Date.now()}.webp`;
    const uploadPath = path.join(process.cwd(), 'uploads', this.folder);
    const outputPath = path.join(uploadPath, filename);

    try {
      await fs.mkdir(uploadPath, { recursive: true });

      await sharp(image.buffer)
        // EXIF orientation-a əsasən avtomatik döndür, sonra metadata-nı sıfırla
        .rotate()
        .resize(this.maxDimension, this.maxDimension, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .flatten({ background: '#ffffff' })
        .webp({
          quality: this.quality,
          effort: this.effort,
          // `smartSubsample` rəng nümunələrini daha optimal yerləşdirir
          smartSubsample: true,
        })
        .toFile(outputPath);

      return filename;
    } catch (error) {
      console.error('Sharp processing error:', error);
      try {
        await fs.unlink(outputPath).catch(() => {});
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      throw new BadRequestException(
        `Image processing failed: ${error.message}`,
      );
    }
  }
}
