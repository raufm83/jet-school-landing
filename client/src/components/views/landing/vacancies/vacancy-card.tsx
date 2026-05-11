import { Link } from "@/i18n/routing";
import type { Vacancy } from "@/types/vacancy";
import type { Locale } from "@/i18n/request";
import { formatDate } from "@/utils/formatters/formatDate";
import { employmentLabel, experienceLabel } from "@/utils/vacancy-labels";
import {
  MdArrowForward,
  MdOutlineCalendarToday,
  MdOutlineTrendingUp,
  MdOutlineWorkOutline,
} from "react-icons/md";

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
}: {
  vacancy: Vacancy;
  locale: Locale;
}) {
  const title = locale === "ru" ? vacancy.title.ru : vacancy.title.az;
  const slug = locale === "ru" ? vacancy.slug.ru : vacancy.slug.az;
  const applyLabel = locale === "ru" ? "Подробнее" : "Daha ətraflı";
  const vacancyLabel = locale === "ru" ? "Вакансия" : "Vakansiya";

  const isExpired =
    vacancy.deadline && !Number.isNaN(new Date(vacancy.deadline).getTime())
      ? new Date(vacancy.deadline) < new Date()
      : false;

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

  const headerTone = isExpired ? "bg-gray-500" : "bg-jsyellow";

  return (
    <Link
      href={(isExpired ? "#" : `/vacancies/${slug}`) as never}
      className={`group relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-[18px] border border-black/5 bg-white shadow-[0_10px_40px_-12px_rgba(28,28,28,0.18)] transition-all duration-300 ${
        isExpired
          ? "cursor-not-allowed opacity-90"
          : "hover:-translate-y-0.5 hover:shadow-[0_16px_44px_-10px_rgba(252,174,30,0.35)]"
      }`}
    >
      <div className={`relative shrink-0 px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6 ${headerTone}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-white/25 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white ring-1 ring-white/30">
            {vacancyLabel}
          </span>
          {isExpired && (
            <span className="inline-flex items-center rounded-full bg-black/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              {expiredLabel}
            </span>
          )}
        </div>
        <h2 className="mt-3 text-pretty text-xl font-bold leading-snug text-white break-words sm:text-2xl sm:leading-tight">
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
            className={`flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2.5 sm:py-3 ${
              isExpired ? "opacity-70" : ""
            }`}
            title={deadlineText ?? L.noData}
          >
            <MdOutlineCalendarToday
              className={`size-5 shrink-0 sm:size-[22px] ${
                isExpired ? "text-gray-400" : "text-jsyellow"
              }`}
              aria-hidden
            />
            <span className="min-w-0 text-sm font-medium leading-snug text-jsblack">
              {deadlineText ?? L.noData}
            </span>
          </div>

          <div
            className={`flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2.5 sm:py-3 ${
              isExpired ? "opacity-70" : ""
            }`}
          >
            <MdOutlineWorkOutline
              className={`size-5 shrink-0 sm:size-[22px] ${
                isExpired ? "text-gray-400" : "text-jsyellow"
              }`}
              aria-hidden
            />
            <span className="min-w-0 text-sm font-medium leading-snug text-jsblack">
              {regimeText ?? L.noData}
            </span>
          </div>

          <div
            className={`flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2.5 sm:py-3 ${
              isExpired ? "opacity-70" : ""
            }`}
          >
            <MdOutlineTrendingUp
              className={`size-5 shrink-0 sm:size-[22px] ${
                isExpired ? "text-gray-400" : "text-jsyellow"
              }`}
              aria-hidden
            />
            <span className="min-w-0 text-sm font-medium leading-snug text-jsblack">
              {expText ?? L.noData}
            </span>
          </div>
        </div>

        <div className="mt-auto flex justify-end pt-4 sm:pt-6">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition ${
              isExpired
                ? "bg-gray-200 text-gray-500"
                : "bg-jsyellow text-white shadow-jsyellow/25 group-hover:bg-[#e59d10]"
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
