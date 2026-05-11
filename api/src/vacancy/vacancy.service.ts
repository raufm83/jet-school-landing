import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateVacancyDto } from './dto/create-vacancy.dto';
import { UpdateVacancyDto } from './dto/update-vacancy.dto';
import slugify from 'slugify';

type LangBlock = { az: string; ru: string };
type SlugBlock = { az: string; ru: string };

function tagsFromDto(input: unknown): { az: string[]; ru: string[] } {
  if (!input || typeof input !== 'object') {
    return { az: [], ru: [] };
  }
  const o = input as Record<string, unknown>;
  const toArr = (v: unknown) =>
    Array.isArray(v)
      ? v
          .filter((x): x is string => typeof x === 'string')
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 40)
      : [];
  return { az: toArr(o.az), ru: toArr(o.ru) };
}

function normalizeLang(input: unknown): LangBlock {
  if (!input || typeof input !== 'object') {
    return { az: '', ru: '' };
  }
  const o = input as Record<string, unknown>;
  return {
    az: typeof o.az === 'string' ? o.az : '',
    ru: typeof o.ru === 'string' ? o.ru : '',
  };
}

const EMPLOYMENT_TYPES = new Set([
  'FULL_TIME',
  'PART_TIME',
  'REMOTE',
  'FREELANCE',
]);
const EXPERIENCE_LEVELS = new Set(['NONE', 'Y1', 'Y1_3', 'Y3_5', 'Y5_PLUS']);

function parseDeadlineInput(
  v: unknown,
): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeEmployment(
  v: unknown,
): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const s = String(v);
  return EMPLOYMENT_TYPES.has(s) ? s : null;
}

function normalizeExperience(
  v: unknown,
): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const s = String(v);
  return EXPERIENCE_LEVELS.has(s) ? s : null;
}

function slugFromText(text: string, fallback: string, locale: string): string {
  const t = (text || '').trim();
  const s = t
    ? slugify(t, { lower: true, strict: true, locale })
    : '';
  return s || fallback;
}

@Injectable()
export class VacancyService {
  constructor(private readonly prisma: PrismaService) {}

  private buildSlugPair(
    title: LangBlock,
    inputSlug?: { az?: string; ru?: string },
  ): SlugBlock {
    const az =
      (inputSlug?.az || '').trim() ||
      slugFromText(title.az, 'vakansiya', 'az');
    const ru =
      (inputSlug?.ru || '').trim() ||
      slugFromText(title.ru, 'vakansiya', 'ru');
    return { az, ru };
  }

  private async assertSlugValuesUnique(
    slug: SlugBlock,
    excludeId?: string,
  ): Promise<void> {
    const others = await this.prisma.vacancy.findMany({
      where: excludeId ? { id: { not: excludeId } } : {},
      select: { slug: true },
    });
    const used = new Set<string>();
    for (const o of others) {
      const s = o.slug as SlugBlock;
      if (s.az) used.add(s.az);
      if (s.ru) used.add(s.ru);
    }
    if (used.has(slug.az) || used.has(slug.ru)) {
      throw new ConflictException(
        'Bu slug artıq istifadə olunur; başqa slug seçin və ya başlıqları dəyişin.',
      );
    }
  }

  async create(dto: CreateVacancyDto) {
    const title = normalizeLang(dto.title);
    const description = normalizeLang(dto.description);
    const requirements = normalizeLang(dto.requirements);
    const workConditions = normalizeLang(dto.workConditions);
    if (!title.az.trim() || !title.ru.trim()) {
      throw new ConflictException('Başlıq hər iki dil üçün məcburidir.');
    }
    if (!description.az.trim() || !description.ru.trim()) {
      throw new ConflictException('Təsvir hər iki dil üçün məcburidir.');
    }

    const slug = this.buildSlugPair(title, dto.slug);
    await this.assertSlugValuesUnique(slug);

    const order =
      typeof dto.order === 'number' && Number.isFinite(dto.order)
        ? Math.trunc(dto.order)
        : 0;
    const isActive = dto.isActive !== false;

    const tagsPayload =
      dto.tags !== undefined ? tagsFromDto(dto.tags) : undefined;

    const deadline = parseDeadlineInput(dto.deadline);
    const employmentType = normalizeEmployment(dto.employmentType);
    const experienceLevel = normalizeExperience(dto.experienceLevel);

    return this.prisma.vacancy.create({
      data: {
        title,
        description,
        requirements,
        workConditions,
        slug,
        isActive,
        order,
        ...(tagsPayload !== undefined ? { tags: tagsPayload } : {}),
        ...(deadline !== undefined ? { deadline } : {}),
        ...(employmentType !== undefined ? { employmentType } : {}),
        ...(experienceLevel !== undefined ? { experienceLevel } : {}),
      },
    });
  }

  /**
   * Publik siyahı: Mongo-də yalnız açıq şəkildə `isActive: false` olanları istisna et.
   * (`NOT false` köhnə sənədlərdə sahə yoxdursa da uyğun gələ bilər.)
   */
  private publicVisibilityWhere(): { NOT: { isActive: false } } {
    return { NOT: { isActive: false } };
  }

  /**
   * Köhnə avtomatik deaktivasiya və ya toplu `isActive: false` sonrası: bütün deaktiv
   * vakansiyaları yenidən aktiv edir (admin bir dəfə çağıra bilər; lazım olmayanları sonra söndürün).
   */
  async repairLegacyDeactivatedVacancies() {
    return this.prisma.vacancy.updateMany({
      where: { isActive: false },
      data: { isActive: true },
    });
  }

  /** Sayt üçün — aktiv və ya köhnə “sahəsi yox” vakansiyalar */
  async findAllPublic() {
    return this.prisma.vacancy.findMany({
      where: this.publicVisibilityWhere(),
      orderBy: [{ order: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /** Sayt üçün tək vakansiya */
  async findBySlugPublic(slug: string) {
    const trimmed = slug.trim();
    const row = await this.prisma.vacancy.findFirst({
      where: {
        AND: [
          this.publicVisibilityWhere(),
          {
            OR: [
              { slug: { is: { az: { equals: trimmed } } } },
              { slug: { is: { ru: { equals: trimmed } } } },
            ],
          },
        ],
      },
    });
    if (!row) {
      throw new NotFoundException('Vakansiya tapılmadı');
    }
    return row;
  }

  async findAllManage(page = 1, limit = 20) {
    const safePage = Math.max(1, +page || 1);
    const safeLimit = Math.min(100, Math.max(1, +limit || 20));
    const skip = (safePage - 1) * safeLimit;

    const [total, items] = await Promise.all([
      this.prisma.vacancy.count(),
      this.prisma.vacancy.findMany({
        skip,
        take: safeLimit,
        orderBy: [{ order: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    return {
      items,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit) || 0,
      },
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.vacancy.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Vakansiya tapılmadı: ${id}`);
    }
    return item;
  }

  async update(id: string, dto: UpdateVacancyDto) {
    const existing = await this.findOne(id);
    const curSlug = existing.slug as SlugBlock;
    const nextTitle =
      dto.title !== undefined
        ? normalizeLang(dto.title)
        : (existing.title as LangBlock);
    const nextDesc =
      dto.description !== undefined
        ? normalizeLang(dto.description)
        : (existing.description as LangBlock);
    const nextReq =
      dto.requirements !== undefined
        ? normalizeLang(dto.requirements)
        : (existing.requirements as LangBlock | null);
    const nextWorkCond =
      dto.workConditions !== undefined
        ? normalizeLang(dto.workConditions)
        : (existing.workConditions as LangBlock | null);

    if (dto.title !== undefined) {
      if (!nextTitle.az.trim() || !nextTitle.ru.trim()) {
        throw new ConflictException('Başlıq hər iki dil üçün məcburidir.');
      }
    }
    if (dto.description !== undefined) {
      if (!nextDesc.az.trim() || !nextDesc.ru.trim()) {
        throw new ConflictException('Təsvir hər iki dil üçün məcburidir.');
      }
    }

    let newSlug = curSlug;
    if (dto.slug !== undefined) {
      newSlug = this.buildSlugPair(nextTitle, {
        az: dto.slug.az !== undefined ? dto.slug.az : curSlug.az,
        ru: dto.slug.ru !== undefined ? dto.slug.ru : curSlug.ru,
      });
    }

    const data: {
      title?: LangBlock;
      description?: LangBlock;
      requirements?: LangBlock;
      workConditions?: LangBlock;
      slug?: SlugBlock;
      isActive?: boolean;
      order?: number;
      tags?: { az: string[]; ru: string[] };
      deadline?: Date | null;
      employmentType?: string | null;
      experienceLevel?: string | null;
    } = {};

    if (dto.title !== undefined) data.title = nextTitle;
    if (dto.description !== undefined) data.description = nextDesc;
    if (dto.requirements !== undefined) data.requirements = nextReq;
    if (dto.workConditions !== undefined) data.workConditions = nextWorkCond;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.order !== undefined && Number.isFinite(dto.order)) {
      data.order = Math.trunc(dto.order);
    }
    if (dto.tags !== undefined) {
      data.tags = tagsFromDto(dto.tags);
    }

    if (dto.deadline !== undefined) {
      data.deadline = parseDeadlineInput(dto.deadline) ?? null;
    }
    if (dto.employmentType !== undefined) {
      data.employmentType = normalizeEmployment(dto.employmentType) ?? null;
    }
    if (dto.experienceLevel !== undefined) {
      data.experienceLevel = normalizeExperience(dto.experienceLevel) ?? null;
    }

    const slugChanged =
      newSlug.az !== curSlug.az || newSlug.ru !== curSlug.ru;
    if (dto.slug !== undefined && slugChanged) {
      await this.assertSlugValuesUnique(newSlug, id);
      data.slug = newSlug;
    }

    if (Object.keys(data).length === 0) {
      return existing;
    }

    return this.prisma.vacancy.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.vacancy.delete({ where: { id } });
  }
}
