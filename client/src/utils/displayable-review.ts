/**
 * Ana səhifə və navbar ilə eyni məntiq: yalnız linki olan və şəkil və ya YouTube linki olan rəylər ictimai siyahıda göstərilir.
 */
export function isDisplayablePublicReview(r: {
  link?: string | null;
  imageUrl?: string | null;
}): boolean {
  const link = r.link?.trim();
  if (!link) return false;
  const hasThumb = Boolean(r.imageUrl?.trim());
  const isYoutube = /youtube|youtu\.be/i.test(link);
  return hasThumb || isYoutube;
}

export function hasDisplayablePublicReview(items: unknown): boolean {
  if (!Array.isArray(items)) return false;
  return items.some((r) => isDisplayablePublicReview(r as { link?: string | null; imageUrl?: string | null }));
}
