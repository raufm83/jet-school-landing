import { Prisma } from '@prisma/client';

export function serializeBlogCategoryName(
  raw: Prisma.JsonValue | null | undefined,
): { az: string; ru: string } {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { az: '', ru: '' };
  }
  const o = raw as Record<string, unknown>;
  const az = typeof o.az === 'string' ? o.az : '';
  const ru = typeof o.ru === 'string' ? o.ru : '';
  return { az, ru };
}
