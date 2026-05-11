/**
 * Production-da NEXT_PUBLIC_API_URL CI/build-da verilməsə belə frontend API-yə düzgün ünvandan çıxsın.
 * Lokal: .env.local → NEXT_PUBLIC_API_URL=http://localhost:3002/api
 */
export function resolvePublicApiBaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_API_URL;
  if (typeof v === "string" && v.trim()) {
    return v.trim().replace(/\/+$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3002/api";
  }
  return "https://api.jetschool.az/api";
}

export const PUBLIC_API_BASE = resolvePublicApiBaseUrl();

/** Şəkil /uploads üçün host (API path olmadan) */
export const PUBLIC_API_ORIGIN =
  PUBLIC_API_BASE.replace(/\/api\/?$/i, "") || "https://api.jetschool.az";
