import { Prisma } from '@prisma/client';

/**
 * Tələbə layihəsi kateqoriya adı: DB-də Json (string və ya { az, ru }) → API üçün UTF-8 string.
 */
export function serializeStudentProjectCategoryName(
  name: Prisma.JsonValue | null | undefined,
): string {
  if (name == null) return '';
  if (typeof name === 'string') return name;
  if (typeof name === 'object' && !Array.isArray(name) && name !== null) {
    const o = name as Record<string, unknown>;
    const az = o.az;
    const ru = o.ru;
    if (typeof az === 'string' && typeof ru === 'string' && az && ru) {
      return `${az} · ${ru}`;
    }
    if (typeof az === 'string' && az) return az;
    if (typeof ru === 'string' && ru) return ru;
  }
  try {
    return JSON.stringify(name);
  } catch {
    return '';
  }
}
