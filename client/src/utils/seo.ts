/**
 * SEO utility functions for trimming meta titles and descriptions
 */

/**
 * Sayt `trailingSlash: false` ilə işləyir, ona görə bütün URL-lər slash-sız olmalıdır.
 * Ad tarixi səbəbdən qalıb: funksiya sona slash ƏLAVƏ ETMİR, əksinə silir (query string saxlanılır).
 * Also normalizes any accidental double-slashes in the path.
 */
export function ensureTrailingSlash(url: string): string {
  if (!url || typeof url !== "string") return url;
  const [path, query] = url.split("?");
  // Remove double slashes from path while preserving the protocol (e.g. https://)
  const normalizedPath = path.replace(/([^:])\/\/+/g, "$1/");
  const pathNoSlash = normalizedPath.replace(/\/+$/, "");
  return query ? `${pathNoSlash}?${query}` : pathNoSlash;
}

/**
 * Builds a canonical URL WITHOUT locale prefix and WITHOUT trailing slash.
 *   buildCanonicalUrl("https://jetschool.az")           → "https://jetschool.az"
 *   buildCanonicalUrl("https://jetschool.az", "blog")   → "https://jetschool.az/blog"
 *   buildCanonicalUrl("https://jetschool.az", "/az/blog/my-post") → strips locale → "https://jetschool.az/blog/my-post"
 */
export function buildCanonicalUrl(
  baseUrl: string,
  path: string = "",
  queryString?: string,
): string {
  const cleaned = path
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    // Strip leading locale segment (az or ru) from path if present
    .replace(/^(az|ru)(\/|$)/, "")
    .replace(/\/+$/, ""); // Remove any remaining trailing slash
  // Normalize double-slashes while preserving protocol
  const base = (cleaned ? `${baseUrl}/${cleaned}` : baseUrl)
    .replace(/([^:])\/\/+/g, "$1/");
  // No trailing slash on canonical URLs
  const result = base.replace(/\/+$/, "");
  return queryString ? `${result}?${queryString}` : result;
}

/**
 * Builds a hreflang URL WITH locale prefix, WITHOUT trailing slash.
 *   buildHreflangUrl("https://jetschool.az", "az")              → "https://jetschool.az/az"
 *   buildHreflangUrl("https://jetschool.az", "ru", "blog")      → "https://jetschool.az/ru/blog"
 *   buildHreflangUrl("https://jetschool.az", "az", "blog/slug") → "https://jetschool.az/az/blog/slug"
 */
export function buildHreflangUrl(
  baseUrl: string,
  locale: string,
  path: string = "",
): string {
  const cleaned = path
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/^(az|ru)(\/|$)/, ""); // Strip leading locale if accidentally included
  const url = cleaned ? `${baseUrl}/${locale}/${cleaned}` : `${baseUrl}/${locale}`;
  // Normalize double-slashes, no trailing slash
  return url.replace(/([^:])\/\/+/g, "$1/").replace(/\/+$/, "");
}

/**
 * Trims a string to a maximum length, ensuring it doesn't cut words in the middle
 * @param text - The text to trim
 * @param maxLength - Maximum length in characters
 * @returns Trimmed text
 */
export function trimMetaText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }

  // Trim to max length
  let trimmed = text.substring(0, maxLength);

  // Try to find the last space to avoid cutting words
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.8) {
    // Only use last space if it's not too early (at least 80% of max length)
    trimmed = trimmed.substring(0, lastSpace);
  }

  // Remove trailing punctuation if any
  trimmed = trimmed.replace(/[.,;:!?]+$/, '');

  return trimmed.trim();
}

/**
 * Trims meta title to 60 characters
 * @param title - The title to trim
 * @returns Trimmed title
 */
export function trimMetaTitle(title: string): string {
  return trimMetaText(title, 60);
}

/**
 * Trims meta description to 160 characters
 * @param description - The description to trim
 * @returns Trimmed description
 */
export function trimMetaDescription(description: string): string {
  return trimMetaText(description, 160);
}

/**
 * hreflang/alternate dil xəritəsi: hər dil ÖZ slug-ı ilə, yalnız həmin dildə məzmun varsa.
 * x-default həmişə az versiyadır (az yoxdursa ru).
 */
export function buildLocaleAlternates(
  baseUrl: string,
  prefix: string,
  slugs: { az?: string | null; ru?: string | null },
): Record<string, string> {
  const out: Record<string, string> = {};
  const az = typeof slugs.az === "string" ? slugs.az.trim() : "";
  const ru = typeof slugs.ru === "string" ? slugs.ru.trim() : "";
  if (az) out.az = buildHreflangUrl(baseUrl, "az", `${prefix}/${az}`);
  if (ru) out.ru = buildHreflangUrl(baseUrl, "ru", `${prefix}/${ru}`);
  const def = out.az ?? out.ru;
  if (def) out["x-default"] = def;
  return out;
}
