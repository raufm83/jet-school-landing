import type { Locale } from "@/i18n/request";
import az from "@/messages/az.json";
import ru from "@/messages/ru.json";
import { escapeHtml } from "@/utils/escapeHtml";

function paragraphsFromPlain(text: string): string {
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("");
}

/** Tərcümə faylından ilkin hero HTML (CMS boş olanda) */
export function defaultHeroBodyHtml(locale: Locale): string {
  const h = locale === "az" ? az.hero : ru.hero;
  return [
    `<p><strong>${escapeHtml(h.badge)}</strong></p>`,
    `<h1>${escapeHtml(h.toJetSchool)} <span style="color:#FCAE1E">${escapeHtml(h.welcome)}</span>!</h1>`,
    paragraphsFromPlain(h.description),
  ].join("");
}
