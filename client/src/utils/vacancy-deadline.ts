const BAKU_TZ = "Asia/Baku";

function toBakuDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BAKU_TZ }).format(date);
}

function parseDeadline(deadline: string | null | undefined): Date | null {
  if (!deadline) return null;
  const d = new Date(deadline);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Son müraciət tarixinə qədər Bakı təqvim günü ilə qalan gün sayı (0 = bu gün). */
export function daysUntilVacancyDeadline(
  deadline: string | Date | null | undefined
): number | null {
  const d = typeof deadline === "string" || deadline instanceof Date
    ? parseDeadline(typeof deadline === "string" ? deadline : deadline.toISOString())
    : null;
  if (!d) return null;

  const todayKey = toBakuDateKey(new Date());
  const deadlineKey = toBakuDateKey(d);
  const today = new Date(`${todayKey}T00:00:00`);
  const end = new Date(`${deadlineKey}T00:00:00`);
  return Math.round((end.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

export function isVacancyDeadlineExpired(
  deadline: string | Date | null | undefined
): boolean {
  const days = daysUntilVacancyDeadline(deadline);
  return days !== null && days < 0;
}

export function formatVacancyDaysRemaining(
  locale: "az" | "ru",
  days: number
): string {
  if (days < 0) {
    return locale === "ru" ? "Срок истек" : "Müraciət müddəti bitib";
  }
  if (days === 0) {
    return locale === "ru" ? "Сегодня последний день" : "Bu gün bitir";
  }
  if (locale === "ru") {
    const mod10 = days % 10;
    const mod100 = days % 100;
    if (mod10 === 1 && mod100 !== 11) {
      return `Остался ${days} день`;
    }
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      return `Осталось ${days} дня`;
    }
    return `Осталось ${days} дней`;
  }
  return days === 1 ? "1 gün qalıb" : `${days} gün qalıb`;
}
