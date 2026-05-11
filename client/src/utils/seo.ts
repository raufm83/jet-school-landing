/**
 * SEO utility functions for trimming meta titles and descriptions
 */

/**
 * Ensures URL ends with trailing slash (before query string if present)
 * @param url - The URL to normalize
 * @returns URL with trailing slash
 */
export function ensureTrailingSlash(url: string): string {
  if (!url || typeof url !== "string") return url;
  const [path, query] = url.split("?");
  const pathWithSlash = path.endsWith("/") ? path : `${path}/`;
  return query ? `${pathWithSlash}?${query}` : pathWithSlash;
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
