import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateFaqItemDto } from './dto/create-faq-item.dto';
import { UpdateFaqItemDto } from './dto/update-faq-item.dto';

type LangBlock = { az: string; ru: string };

function normalizeMultilingual(input: unknown): LangBlock {
  if (!input || typeof input !== 'object') {
    return { az: '', ru: '' };
  }
  const o = input as Record<string, unknown>;
  return {
    az: typeof o.az === 'string' ? o.az : '',
    ru: typeof o.ru === 'string' ? o.ru : '',
  };
}

function normalizePagesFromDto(dto: {
  pages?: string[];
  page?: string | null;
}): string[] {
  const fromArr = Array.isArray(dto.pages)
    ? dto.pages
        .filter((p): p is string => typeof p === 'string')
        .map((p) => p.trim())
        .filter(Boolean)
    : [];
  const single =
    typeof dto.page === 'string' && dto.page.trim() ? dto.page.trim() : '';
  const set = new Set(fromArr);
  if (single) set.add(single);
  return [...set];
}

@Injectable()
export class FaqService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFaqItemDto) {
    const question = normalizeMultilingual(dto.question);
    const answer = normalizeMultilingual(dto.answer);
    const pages = normalizePagesFromDto(dto);

    let order: number;
    if (
      typeof dto.order === 'number' &&
      Number.isFinite(dto.order) &&
      dto.order !== 0
    ) {
      order = Math.trunc(dto.order);
    } else {
      const last = await this.prisma.faqItem.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = last ? last.order + 1 : 0;
    }

    return this.prisma.faqItem.create({
      data: {
        question,
        answer,
        order,
        pages,
        page: null,
      },
    });
  }

  async findAll(page = 1, limit = 20) {
    const safePage = Math.max(1, +page || 1);
    const safeLimit = Math.min(100, Math.max(1, +limit || 20));
    const skip = (safePage - 1) * safeLimit;

    const [total, items] = await Promise.all([
      this.prisma.faqItem.count(),
      this.prisma.faqItem.findMany({
        skip,
        take: safeLimit,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
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
    const item = await this.prisma.faqItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`FAQ elementi tapılmadı: ${id}`);
    }
    return item;
  }

  async update(id: string, dto: UpdateFaqItemDto) {
    await this.findOne(id);

    const data: {
      question?: LangBlock;
      answer?: LangBlock;
      order?: number;
      page?: string | null;
      pages?: string[];
    } = {};

    if (dto.question !== undefined) {
      data.question = normalizeMultilingual(dto.question);
    }
    if (dto.answer !== undefined) {
      data.answer = normalizeMultilingual(dto.answer);
    }
    if (dto.order !== undefined && Number.isFinite(dto.order)) {
      data.order = Math.trunc(dto.order);
    }
    if (dto.pages !== undefined || dto.page !== undefined) {
      const pages = normalizePagesFromDto(dto);
      data.pages = pages;
      data.page = null;
    }

    if (Object.keys(data).length === 0) {
      return this.findOne(id);
    }

    return this.prisma.faqItem.update({
      where: { id },
      data,
    });
  }

  async findByPage(pageKey: string) {
    const key = pageKey.trim();
    return this.prisma.faqItem.findMany({
      where: {
        OR: [{ pages: { has: key } }, { page: key }],
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.faqItem.delete({ where: { id } });
  }
}
