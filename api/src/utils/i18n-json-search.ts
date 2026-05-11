import { Prisma } from '@prisma/client';

/**
 * Json dəyərindən bütün mətnləri (string, nested obyektlər, massivlar) toplayır.
 * Yalnız `az` / `ru` açarları yox, istənilən quruluşda saxlanan i18n və ya köhnə məlumat üçün.
 */
function collectJsonStrings(value: Prisma.JsonValue | null | undefined, out: string[]) {
  if (value == null) return;
  if (typeof value === 'string') {
    out.push(value);
    return;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    out.push(String(value));
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectJsonStrings(item, out);
    }
    return;
  }
  if (typeof value === 'object' && value !== null) {
    for (const v of Object.values(value as Record<string, Prisma.JsonValue>)) {
      collectJsonStrings(v, out);
    }
  }
}

/**
 * JSON / Json sahələrdə axtarış (substring, case-insensitive).
 * Prisma+MongoDB üçün `string_contains` + path etibarlı deyil; server tərəfdə bütün mətn yarpaqlarında axtarış.
 */
export function i18nJsonContainsSubstring(
  value: Prisma.JsonValue | null | undefined,
  qRaw: string,
): boolean {
  if (value == null) return false;
  const q = qRaw.trim().toLowerCase();
  if (q.length === 0) return false;

  const parts: string[] = [];
  collectJsonStrings(value, parts);
  if (parts.some((s) => s.toLowerCase().includes(q))) {
    return true;
  }

  // Bəzi sənədlərdə HTML/qalıq; bir sətirlik fallback
  try {
    const blob = JSON.stringify(value).toLowerCase();
    return blob.includes(q);
  } catch {
    return false;
  }
}
