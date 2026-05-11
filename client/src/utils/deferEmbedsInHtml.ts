/**
 * CMS-dən gələn HTML-də iframe/video/img üçün şəbəkə yükünü azaldır:
 * - iframe: src viewport-a yaxınlaşana qədər təxirə salınır (LazyHtmlContent ilə)
 * - video: preload="none"
 * - img: loading="lazy" (yoxdursa)
 */
export function deferEmbedsInHtml(html: string): string {
  if (html == null || typeof html !== "string") return "";

  let out = html.replace(
    /<iframe(\s[^>]*)>/gi,
    (full, inner: string) => {
      if (/data-deferred-src\s*=/i.test(inner)) return full;
      const srcMatch = inner.match(/\ssrc\s*=\s*(["'])([^"']+)\1/i);
      if (!srcMatch) return full;
      const src = srcMatch[2];
      const innerWithoutSrc = inner.replace(/\ssrc\s*=\s*(["'])([^"']+)\1/i, "");
      return `<iframe${innerWithoutSrc} data-deferred-src="${encodeURIComponent(src)}" src="about:blank" loading="lazy">`;
    },
  );

  out = out.replace(/<video(\s[^>]*)>/gi, (full, inner: string) => {
    if (/preload\s*=/i.test(inner)) return full;
    return `<video${inner} preload="none">`;
  });

  out = out.replace(/<img(\s[^>]*)>/gi, (full, inner: string) => {
    if (/loading\s*=/i.test(inner)) return full;
    return `<img${inner} loading="lazy" decoding="async">`;
  });

  return out;
}
