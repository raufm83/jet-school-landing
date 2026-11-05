/**
 * Schema.org uploadDate üçün: tarixi Bakı saatı (UTC+4, yay/qış vaxtı yoxdur) ilə
 * "2026-10-15T10:00:00+04:00" formatında qaytarır. Tarix yoxdursa və ya səhvdirsə undefined.
 */
export function toBakuIsoDate(input?: string | Date | null): string | undefined {
  if (!input) return undefined;
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return undefined;
  const shifted = new Date(d.getTime() + 4 * 60 * 60 * 1000);
  return shifted.toISOString().replace(/\.\d{3}Z$/, "+04:00");
}
