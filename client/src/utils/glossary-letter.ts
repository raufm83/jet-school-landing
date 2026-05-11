/**
 * Lüğət hərf filtri (?letter=) — trailingSlash və səhv URL-lərdə parametrdə
 * artıq "/" qalırsa çıxarılır.
 */
export function normalizeGlossaryLetterParam(
  raw: string | undefined
): string | undefined {
  if (raw === undefined) return undefined;
  const t = raw.replace(/\/+$/, "").trim();
  return t.length > 0 ? t : undefined;
}
