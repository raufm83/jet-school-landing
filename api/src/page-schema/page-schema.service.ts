import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PageSchemaService {
  constructor(private prisma: PrismaService) {}

  async findByKeyAndLocale(pageKey: string, locale: string) {
    return this.prisma.pageSchema.findFirst({
      where: { pageKey, locale },
    });
  }

  async findAll(pageKey?: string) {
    const where = pageKey ? { pageKey } : {};
    return this.prisma.pageSchema.findMany({
      where,
      orderBy: [{ pageKey: 'asc' }, { locale: 'asc' }],
    });
  }

  async upsert(
    pageKey: string,
    locale: string,
    data: { schemaJson: object | object[] },
  ) {
    const existing = await this.prisma.pageSchema.findFirst({
      where: { pageKey, locale },
    });
    const payload = data.schemaJson as object;
    if (existing) {
      return this.prisma.pageSchema.update({
        where: { id: existing.id },
        data: { schemaJson: payload },
      });
    }
    return this.prisma.pageSchema.create({
      data: {
        pageKey,
        locale,
        schemaJson: payload,
      },
    });
  }
}
