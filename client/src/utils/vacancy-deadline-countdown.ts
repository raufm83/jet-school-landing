import type { Vacancy } from "@/types/vacancy";

function bakuDayKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Baku",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function dayKeyUtcMs(yyyyMmDd: string): number {
  const parts = yyyyMmDd.split("-").map((p) => Number.parseInt(p, 10));
  if (
    parts.length !== 3 ||
    parts.some((n) => !Number.isFinite(n))
  ) {
    return Number.NaN;
  }
  const [y, m, d] = parts;
  return Date.UTC(y, m - 1, d);
}

/** Bakı tarixçə günlərinə əsasən bu gündən möhlətə qədər qalan tam günlərin sayı; eyni gün üçün 0. */
export function vacancyCalendarDaysRemainingBakuUntil(
  deadline: string | null | undefined,
): number | null {
  if (deadline == null || deadline === "") return null;
  const dl = new Date(deadline);
  if (Number.isNaN(dl.getTime())) return null;
  const endKey = bakuDayKey(dl);
  const startKey = bakuDayKey(new Date());
  const endMs = dayKeyUtcMs(endKey);
  const startMs = dayKeyUtcMs(startKey);
  if (!Number.isFinite(endMs) || !Number.isFinite(startMs)) return null;
  return Math.round((endMs - startMs) / 86_400_000);
}

export function vacancyDeadlineIsExpiredByNow(
  deadline: Vacancy["deadline"],
): boolean {
  return (
    Boolean(deadline) &&
    !Number.isNaN(new Date(deadline as string).getTime()) &&
    new Date(deadline as string) < new Date()
  );
}

export function vacancyCardDeadlineCountdownText(
  vacancy: Vacancy,
  t: {
    countdown: (count: number) => string;
    today: () => string;
  },
  options?: {
    /** Yazı yalnız qalan günlər bu həddələ *daha az* olduqda (məs. kart badge üçin 7). Yoxdursa həmişə. */
    onlyWhenDaysRemainBelow?: number;
  },
): string | null {
  const deadline = vacancy.deadline;
  if (
    vacancyDeadlineIsExpiredByNow(deadline) ||
    deadline == null ||
    deadline === "" ||
    Number.isNaN(new Date(deadline).getTime())
  ) {
    return null;
  }
  const days = vacancyCalendarDaysRemainingBakuUntil(deadline);
  if (days == null || days < 0) return null;
  const cap = options?.onlyWhenDaysRemainBelow;
  if (cap !== undefined && days >= cap) return null;
  if (days === 0) return t.today();
  return t.countdown(days);
}
