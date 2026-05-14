import type { Locale } from "@/i18n/request";
import type { Vacancy } from "@/types/vacancy";

/** Vakansiya detal səhifəsi və kart üçün vahid başlıq (AZ/RU vəziyyətinə görə). */
export function vacancyPageHeading(
  locale: Locale,
  title: Vacancy["title"],
): string {
  const raw = (locale === "ru" ? title.ru : title.az).trim();
  if (!raw) return "";
  if (locale === "ru") {
    return `Вакансия ${raw}`.trim();
  }
  return `${raw} vakansiyası`.trim();
}
