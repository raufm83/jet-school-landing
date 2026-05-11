/**
 * Normalizes any image URL from the API into a valid, properly-encoded HTTPS URL.
 *
 * API returns these formats:
 *  - Full HTTP:  "http://api.jetschool.az/uploads/courses/file.png"  → upgraded to HTTPS
 *  - Full HTTPS: "https://api.jetschool.az/uploads/..."              → passed through
 *  - Bare path:  "gallery/WhatsApp Image 2025-01-22.webp"            → fully constructed + encoded
 *  - /uploads:   "/uploads/team/photo.webp"                          → fully constructed + encoded
 *
 * Spaces and special characters in file names (e.g. WhatsApp exports) are percent-encoded.
 */
export function buildImageUrl(
  imageUrl: string | undefined | null,
  fallback = ""
): string {
  if (!imageUrl || !imageUrl.trim()) return fallback;

  // Windows API cavablarında bəzən "\" olur — URL üçün "/" normallaşdırılır
  const url = imageUrl.trim().replace(/\\/g, "/");

  // Already a full HTTPS URL — pass through as-is
  if (url.startsWith("https://")) return url;

  // HTTP: lokal inkişaf üçün localhost/127.0.0.1 üzərində https-ə keçmə (şəkil sorğusu uğursuz olur)
  if (url.startsWith("http://")) {
    try {
      const u = new URL(url);
      if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
        return url;
      }
    } catch {
      /* ignore */
    }
    return url.replace("http://", "https://");
  }

  // Derive base host from CDN env var (strip trailing /uploads...)
  const cdnRaw =
    process.env.NEXT_PUBLIC_CDN_URL || "https://api.jetschool.az/uploads";
  const host = cdnRaw
    .replace(/\/+$/, "")               // remove trailing slashes
    .replace(/\/uploads(\/.*)?$/, ""); // strip /uploads path → "https://api.jetschool.az"

  // Normalize path: remove leading slashes and "uploads/" prefix
  const rawPath = url.replace(/^\/+/, "").replace(/^uploads\//, "");

  // Encode each path segment to handle spaces and special chars in filenames
  // decodeURIComponent first to avoid double-encoding already-encoded parts
  const encodedPath = rawPath
    .split("/")
    .map((segment) => {
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join("/");

  return `${host}/uploads/${encodedPath}`;
}
