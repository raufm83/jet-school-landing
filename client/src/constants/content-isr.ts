/**
 * SSR/RSC fetch və segment ISR üçün məzmun keş müddəti (saniyyə).
 * CONTENT_ISR_SECONDS — əsas bloklar (əsas səhifə, meta, xəbərlər axını və s.).
 * CONTENT_ISR_LONG_SECONDS — daha az dəyişən data (əlaqə, footer).
 *
 * Deploy-da daha aqressiv yeniləmə üçün məs.: CONTENT_ISR_SECONDS=30
 * (.env və ya Docker/Kubernetes env — server tərəfi oxuyur).
 */
function parseSecondsEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  const n = raw != null ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return fallback;
  const clamped = Math.floor(n);
  if (clamped < 10) return 10;
  if (clamped > 3600) return 3600;
  return clamped;
}

export const CONTENT_ISR_SECONDS = parseSecondsEnv("CONTENT_ISR_SECONDS", 45);

export const CONTENT_ISR_LONG_SECONDS = parseSecondsEnv(
  "CONTENT_ISR_LONG_SECONDS",
  Math.min(300, Math.max(CONTENT_ISR_SECONDS * 4, 120)),
);
