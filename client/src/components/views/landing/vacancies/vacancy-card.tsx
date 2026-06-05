import { Link } from "@/i18n/routing";
import type { Vacancy } from "@/types/vacancy";
import type { Locale } from "@/i18n/request";
import { formatDate } from "@/utils/formatters/formatDate";
import { vacancyPageHeading } from "@/utils/vacancy-display";
import { employmentLabel, experienceLabel } from "@/utils/vacancy-labels";
import { isVacancyDeadlineExpired } from "@/utils/vacancy-deadline";
import {
  MdArrowForward,
  MdOutlineCalendarToday,
  MdOutlineTrendingUp,
  MdOutlineWorkOutline,
} from "react-icons/md";

/** Kart üçün üst banner və aksent — saytın əsas rəngi (jsyellow). */
const CARD_ACCENT = {
  hero: "bg-jsyellow",
  icon: "text-jsyellow",
  hoverShadow: "hover:shadow-[0_18px_48px_-12px_rgba(252,174,30,0.45)]",
  btn: "bg-jsyellow text-white shadow-jsyellow/25 hover:bg-[#e59d10]",
} as const;

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function descriptionPlainText(vacancy: Vacancy, locale: Locale): string {
  const raw =
    vacancy.description?.[locale === "ru" ? "ru" : "az"]?.trim() ?? "";
  if (!raw) return "";
  return stripHtml(raw);
}

export default function VacancyCard({
  vacancy,
  locale,
  deadlineBadgeLabel = null,
}: {
  vacancy: Vacancy;
  locale: Locale;
  /** Siyahı səhifəsindən: <7 gün üçün qısa tərcüməli badge mətni */
  deadlineBadgeLabel?: string | null;
}) {
  const title = vacancyPageHeading(locale, vacancy.title);
  const slug = locale === "ru" ? vacancy.slug.ru : vacancy.slug.az;
  const applyLabel = locale === "ru" ? "Подробнее" : "Daha ətraflı";
  const vacancyLabel = locale === "ru" ? "Вакансия" : "Vakansiya";

  const isExpired = isVacancyDeadlineExpired(vacancy.deadline);

  const deadlineText =
    vacancy.deadline && !Number.isNaN(new Date(vacancy.deadline).getTime())
      ? formatDate(vacancy.deadline)
      : null;

  const expiredLabel = locale === "ru" ? "Срок истек" : "Müraciət müddəti bitib";
  const regimeText = employmentLabel(locale, vacancy.employmentType);
  const expText = experienceLabel(locale, vacancy.experienceLevel);

  const L =
    locale === "ru"
      ? {
          noData: "—",
        }
      : {
          noData: "—",
        };

  const plainDescription = descriptionPlainText(vacancy, locale);

  const headerTone = isExpired ? "bg-gray-500" : CARD_ACCENT.hero;

  const calendarRowTitle = (() => {
    const parts = [
      deadlineText,
      !isExpired && deadlineBadgeLabel ? deadlineBadgeLabel : null,
    ].filter((v): v is string => typeof v === "string" && v.length > 0);
    const j = parts.join(" — ");
    if (j) return j;
    return deadlineText ?? L.noData;
  })();

  return (
    <Link
      href={(isExpired ? "#" : `/vacancies/${slug}`) as never}
      className={`group relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-[22px] border border-black/[0.06] bg-white shadow-[0_10px_40px_-12px_rgba(28,28,28,0.16)] transition-all duration-300 ${
        isExpired
          ? "cursor-not-allowed opacity-[0.93]"
          : `-translate-y-0 hover:-translate-y-1 ${CARD_ACCENT.hoverShadow}`
      }`}
    >
      <div
        className={`relative shrink-0 px-5 pb-6 pt-5 sm:px-6 sm:pb-7 sm:pt-6 ${headerTone}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white ring-1 ring-white/35">
            {vacancyLabel}
          </span>
          {!isExpired && deadlineBadgeLabel ? (
            <span className="inline-flex items-center rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold leading-none text-white shadow-sm ring-1 ring-red-600/40">
              {deadlineBadgeLabel}
            </span>
          ) : null}
          {isExpired ? (
            <span className="inline-flex items-center rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white ring-1 ring-black/15">
              {expiredLabel}
            </span>
          ) : null}
        </div>
        <h2 className="mt-3.5 text-pretty text-xl font-bold leading-snug text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)] break-words sm:text-2xl sm:leading-[1.2] [@media(min-width:3500px)]:text-4xl [@media(min-width:3500px)]:leading-tight">
          {title}
        </h2>
      </div>

      <div className="flex min-h-0 flex-1 flex-col bg-white px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
        {plainDescription ? (
          <p
            className="mb-4 line-clamp-3 min-h-0 break-words text-pretty text-sm leading-relaxed text-gray-600 sm:text-[15px]"
            title={plainDescription}
          >
            {plainDescription}
          </p>
        ) : null}

        <div className="flex flex-col gap-2.5">
          <div
            className={`flex items-center gap-3 rounded-xl bg-neutral-100/90 px-3 py-2.5 sm:py-3 ${
              isExpired ? "opacity-70" : ""
            }`}
            title={calendarRowTitle}
          >
            <MdOutlineCalendarToday
              className={`size-5 shrink-0 sm:size-[22px] ${
                isExpired ? "text-gray-400" : CARD_ACCENT.icon
              }`}
              aria-hidden
            />
            <span className="min-w-0 text-sm font-medium leading-snug text-gray-800">
              {deadlineText ?? L.noData}
            </span>
          </div>

          <div
            className={`flex items-center gap-3 rounded-xl bg-neutral-100/90 px-3 py-2.5 sm:py-3 ${
              isExpired ? "opacity-70" : ""
            }`}
          >
            <MdOutlineWorkOutline
              className={`size-5 shrink-0 sm:size-[22px] ${
                isExpired ? "text-gray-400" : CARD_ACCENT.icon
              }`}
              aria-hidden
            />
            <span className="min-w-0 text-sm font-medium leading-snug text-gray-800">
              {regimeText ?? L.noData}
            </span>
          </div>

          <div
            className={`flex items-center gap-3 rounded-xl bg-neutral-100/90 px-3 py-2.5 sm:py-3 ${
              isExpired ? "opacity-70" : ""
            }`}
          >
            <MdOutlineTrendingUp
              className={`size-5 shrink-0 sm:size-[22px] ${
                isExpired ? "text-gray-400" : CARD_ACCENT.icon
              }`}
              aria-hidden
            />
            <span className="min-w-0 text-sm font-medium leading-snug text-gray-800">
              {locale === "ru" ? "Опыт:" : "Təcrübə:"} {expText ?? L.noData}
            </span>
          </div>
        </div>

        <div className="mt-auto flex justify-end pt-5 sm:pt-6">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
              isExpired ? "bg-gray-300 text-gray-600 shadow-none" : CARD_ACCENT.btn
            }`}
          >
            {isExpired ? (locale === "ru" ? "Завершено" : "Bitib") : applyLabel}
            {!isExpired && (
              <MdArrowForward
                size={18}
                className="text-white transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
