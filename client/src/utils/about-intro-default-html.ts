import az from "@/messages/az.json";
import ru from "@/messages/ru.json";

type Locale = "az" | "ru";

const titleMap: Record<Locale, string> = {
  az: az.aboutPage.introduction.title || "Haqqimizda",
  ru: ru.aboutPage.introduction.title || "O nas",
};

const desc1Map: Record<Locale, string> = {
  az: az.aboutPage.introduction.description1 || "",
  ru: ru.aboutPage.introduction.description1 || "",
};

const desc2Map: Record<Locale, string> = {
  az: az.aboutPage.introduction.description2 || "",
  ru: ru.aboutPage.introduction.description2 || "",
};

export function defaultAboutIntroHtml(locale: Locale): string {
  return `<h1>${titleMap[locale]}</h1><p>${desc1Map[locale]}</p><p>${desc2Map[locale]}</p>`;
}
