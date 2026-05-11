import type { Locale } from "@/i18n/request";

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "REMOTE" | "FREELANCE";
export type ExperienceLevel = "NONE" | "Y1" | "Y1_3" | "Y3_5" | "Y5_PLUS";

const EMPLOYMENT: Record<Locale, Record<EmploymentType, string>> = {
  az: {
    FULL_TIME: "Full time",
    PART_TIME: "Half time",
    REMOTE: "Remote",
    FREELANCE: "Freelance",
  },
  ru: {
    FULL_TIME: "Полная занятость",
    PART_TIME: "Частичная занятость",
    REMOTE: "Удалённо",
    FREELANCE: "Фриланс",
  },
};

const EXPERIENCE: Record<Locale, Record<ExperienceLevel, string>> = {
  az: {
    NONE: "Tələb olunmur",
    Y1: "1 il",
    Y1_3: "1 – 3 il",
    Y3_5: "3 – 5 il",
    Y5_PLUS: "5 ildən yuxarı",
  },
  ru: {
    NONE: "Не требуется",
    Y1: "1 год",
    Y1_3: "1 – 3 года",
    Y3_5: "3 – 5 лет",
    Y5_PLUS: "Более 5 лет",
  },
};

export function employmentLabel(
  locale: Locale,
  value: string | null | undefined
): string | null {
  if (!value || !EMPLOYMENT[locale][value as EmploymentType]) return null;
  return EMPLOYMENT[locale][value as EmploymentType];
}

export function experienceLabel(
  locale: Locale,
  value: string | null | undefined
): string | null {
  if (!value || !EXPERIENCE[locale][value as ExperienceLevel]) return null;
  return EXPERIENCE[locale][value as ExperienceLevel];
}
