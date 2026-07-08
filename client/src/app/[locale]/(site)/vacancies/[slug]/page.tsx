import JsonLd from "@/components/seo/json-ld";
import { buildHomePageGraph } from "@/data/site-schema";
import type { Locale } from "@/i18n/request";
import { getVacancyBySlugPublic } from "@/utils/api/vacancy";
import { getPageMeta } from "@/utils/api/page-meta";
import {
  ensureTrailingSlash,
  trimMetaDescription,
  trimMetaTitle,
  buildHreflangUrl,
} from "@/utils/seo";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, permanentRedirect } from "next/navigation";
import Breadcrumbs from "@/components/views/landing/bread-crumbs/bread-crumbs";
import BreadcrumbContextWrapper from "@/hooks/BreadcrumbContextWrapper";
import { getFaqByPage } from "@/utils/api/faq";
import FaqSection from "@/components/views/landing/faq/faq-section";
import { formatDate } from "@/utils/formatters/formatDate";
import { employmentLabel, experienceLabel } from "@/utils/vacancy-labels";
import { vacancyPageHeading } from "@/utils/vacancy-display";
import { vacancyCardDeadlineCountdownText } from "@/utils/vacancy-deadline-countdown";
import { MdCalendarToday, MdTrendingUp, MdWorkOutline } from "react-icons/md";

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function excerpt(text: string, max = 165): string {
  const t = stripHtml(text.replace(/\s+/g, " ").trim());
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const locale = params.locale as Locale;
  const vacancy = await getVacancyBySlugPublic(params.slug);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(
    /\/+$/,
    ""
  );
  if (!vacancy) {
    const [meta, t] = await Promise.all([
      getPageMeta("vacancies", locale),
      getTranslations({ locale, namespace: "vacanciesPage" }),
    ]);
    const title = meta?.title
      ? trimMetaTitle(meta.title)
      : trimMetaTitle(t("metaTitle"));
    return { title, robots: { index: false, follow: true } };
  }

  const descText =
    locale === "ru" ? vacancy.description.ru : vacancy.description.az;
  const titleText = vacancyPageHeading(locale, vacancy.title);
  const title = trimMetaTitle(`${titleText} | JET School`);
  const description = trimMetaDescription(excerpt(descText));

  const currentSlug = locale === "ru" ? vacancy.slug.ru : vacancy.slug.az;
  const canonicalUrl = buildHreflangUrl(baseUrl, locale, `vacancies/${currentSlug}`);
  const azVacUrl = buildHreflangUrl(baseUrl, "az", `vacancies/${vacancy.slug.az}`);
  const ruVacUrl = buildHreflangUrl(baseUrl, "ru", `vacancies/${vacancy.slug.ru}`);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        az: azVacUrl,
        ru: ruVacUrl,
        "x-default": azVacUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: buildHreflangUrl(baseUrl, locale, `vacancies/${params.slug}`),
      type: "article",
      locale: locale === "az" ? "az_AZ" : "ru_RU",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export const revalidate = 120;

export default async function VacancyDetailPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;
  
  try {
    const vacancy = await getVacancyBySlugPublic(params.slug);
    if (!vacancy) return permanentRedirect(`/${locale}/vacancies`);

    const [t, tList, faqItems] = await Promise.all([
      getTranslations({ locale, namespace: "vacancyDetail" }),
      getTranslations({ locale, namespace: "vacanciesPage" }),
      getFaqByPage("vacancies"),
    ]);

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(
      /\/+$/,
      ""
    );
    const base = locale === "az" ? baseUrl : `${baseUrl}/${locale}`;
    const listPath = ensureTrailingSlash(`${base}/vacancies`);
    const pageUrl = ensureTrailingSlash(`${base}/vacancies/${params.slug}`);

    const title = vacancyPageHeading(locale, vacancy.title);
    const description =
      locale === "ru" ? vacancy.description.ru : vacancy.description.az;
    const homeLabel = locale === "az" ? "Ana Səhifə" : "Главная";

    const isExpired =
      vacancy.deadline && !Number.isNaN(new Date(vacancy.deadline).getTime())
        ? new Date(vacancy.deadline) < new Date()
        : false;

    const deadlineText =
      vacancy.deadline && !Number.isNaN(new Date(vacancy.deadline).getTime())
        ? formatDate(vacancy.deadline)
        : null;
    const regimeText = employmentLabel(locale, vacancy.employmentType);
    const expText = experienceLabel(locale, vacancy.experienceLevel);
    const metaL =
      locale === "ru"
        ? {
            deadline: "Срок",
            regime: "Режим",
            exp: "Опыт",
            dash: "—",
            expired: "Срок приема заявок по этой вакансии истек.",
          }
        : {
            deadline: "Bitmə tarixi",
            regime: "Rejim",
            exp: "Təcrübə",
            dash: "—",
            expired: "Bu vakansiya üzrə müraciət müddəti bitmişdir.",
          };
    const a11y = (label: string, value: string) => `${label}: ${value}`;
    const listTitle = tList("title");

    /** Başlıq panelində qırmızı pill (< 7 gün), kartlarla eyni məntiqlə. */
    const deadlineHeaderBadge = vacancyCardDeadlineCountdownText(
      vacancy,
      {
        countdown: (c) => tList("deadlineBadgeDays", { count: c }),
        today: () => tList("deadlineBadgeToday"),
      },
      { onlyWhenDaysRemainBelow: 7 },
    );

    const expiredShortLabel =
      locale === "ru" ? "Срок истек" : "Müraciət müddəti bitib";

    const experienceInline = `${t("experiencePrefix")} ${expText ?? metaL.dash}`
      .replace(/\s+/g, " ")
      .trim();

    const schemaGraph = buildHomePageGraph({
      name: title,
      description: excerpt(description, 200),
      url: pageUrl,
      locale,
      baseUrl,
      breadcrumbItems: [
        { name: homeLabel, url: ensureTrailingSlash(`${base}/`) },
        { name: listTitle, url: listPath },
        { name: title, url: pageUrl },
      ],
    });

    const headingAbout = locale === "az" ? "İş Haqqında" : "О вакансии";
    const headingReq = locale === "az" ? "Namizədə Tələblər" : "Требования к кандидату";
    const headingWork = locale === "az" ? "İş şəraiti" : "Условия работы";
    const vacancyBadge = locale === "az" ? "Vakansiya" : "Вакансия";
    const headerBg = isExpired ? "bg-gray-500" : "bg-jsyellow";

    const requirementsHtml =
      vacancy.requirements?.[locale as "az" | "ru"]?.trim() ?? "";
    const workConditionsHtml =
      vacancy.workConditions?.[locale as "az" | "ru"]?.trim() ?? "";

    const isMeaningfulHtml = (html: string) =>
      stripHtml(html).length > 0;

    return (
      <BreadcrumbContextWrapper title={title}>
        <div className="w-full min-w-0 bg-transparent">
          <JsonLd data={schemaGraph} />

          <section className="w-full min-w-0 pb-16 pt-6 sm:pb-20 sm:pt-8 md:pt-10">
            <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 [@media(min-width:2500px)]:px-24 [@media(min-width:3000px)]:px-28">
              <div className="mx-auto mb-6 w-full max-w-4xl text-sm text-gray-500 sm:mb-8 sm:text-base">
                <Breadcrumbs dynamicTitle={title} />
              </div>

              <article
                className="
                  mx-auto w-full max-w-4xl overflow-hidden rounded-3xl
                  border border-slate-200/90 bg-white
                  shadow-[0_12px_48px_rgba(21,96,189,0.12)]
                "
              >
                <header className={`px-5 py-6 sm:px-8 sm:py-8 ${headerBg}`}>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white ring-1 ring-white/35">
                      {vacancyBadge}
                    </span>
                    {!isExpired && deadlineHeaderBadge ? (
                      <span className="inline-flex items-center rounded-full bg-red-500/95 px-2.5 py-0.5 text-[10px] font-semibold leading-tight text-white ring-1 ring-red-700/40">
                        {deadlineHeaderBadge}
                      </span>
                    ) : null}
                    {isExpired ? (
                      <span className="inline-flex items-center rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white ring-1 ring-black/15">
                        {expiredShortLabel}
                      </span>
                    ) : null}
                  </div>
                  <h1 className="text-pretty text-2xl font-bold leading-tight text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)] sm:text-3xl md:text-[2rem] md:leading-[1.2]">
                    {title}
                  </h1>
                </header>

                <div className="border-b border-neutral-200 bg-white">
                  <div
                    className="
                      grid min-h-[3.75rem] w-full grid-cols-1 divide-y divide-neutral-200
                      px-5 py-4 sm:px-8 sm:py-5
                      sm:grid-cols-3 sm:divide-x sm:divide-y-0
                    "
                    aria-label={locale === "az" ? "Vakansiya qısa məlumat" : "Кратко о вакансии"}
                  >
                    <div
                      className="flex min-h-[3.25rem] items-center justify-center gap-3 px-3 sm:min-h-0 sm:px-4"
                      role="group"
                      aria-label={a11y(metaL.deadline, deadlineText ?? metaL.dash)}
                    >
                      <MdCalendarToday
                        className={`shrink-0 text-2xl ${isExpired ? "text-gray-400" : "text-jsyellow"}`}
                        aria-hidden
                      />
                      <p
                        className={`text-center text-sm font-normal leading-snug text-[#1F2937] sm:text-base ${isExpired ? "line-through decoration-gray-400/70" : ""}`}
                      >
                        {deadlineText ?? metaL.dash}
                      </p>
                    </div>
                    <div
                      className="flex min-h-[3.25rem] items-center justify-center gap-3 px-3 sm:min-h-0 sm:px-4"
                      role="group"
                      aria-label={a11y(metaL.regime, regimeText ?? metaL.dash)}
                    >
                      <MdWorkOutline
                        className={`shrink-0 text-2xl ${isExpired ? "text-gray-400" : "text-jsyellow"}`}
                        aria-hidden
                      />
                      <p className="text-center text-sm font-normal leading-snug text-[#1F2937] sm:text-base">
                        {regimeText ?? metaL.dash}
                      </p>
                    </div>
                    <div
                      className="flex min-h-[3.25rem] items-center justify-center gap-3 px-3 sm:min-h-0 sm:px-4"
                      role="group"
                      aria-label={experienceInline}
                    >
                      <MdTrendingUp
                        className={`shrink-0 text-2xl ${isExpired ? "text-gray-400" : "text-jsyellow"}`}
                        aria-hidden
                      />
                      <p className="text-center text-sm font-normal leading-snug text-[#1F2937] sm:text-base">
                        {experienceInline}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-b border-neutral-200 px-5 py-8 sm:px-8 sm:py-10">
                  {isExpired && (
                    <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 sm:text-[15px]">
                      {metaL.expired}
                    </div>
                  )}

                  <h2 className="mb-4 text-lg font-bold text-[#111827] sm:text-xl">{headingAbout}</h2>
                  <div
                    className="prose prose-neutral max-w-none text-base leading-relaxed text-neutral-700 prose-p:my-3 prose-headings:text-[#111827] prose-li:marker:text-jsyellow prose-a:text-jsyellow prose-ul:my-2 prose-ol:my-2"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                </div>

                {isMeaningfulHtml(requirementsHtml) ? (
                  <section className="border-b border-neutral-200 px-5 py-8 sm:px-8 sm:py-10">
                    <h2 className="mb-4 text-lg font-bold text-[#111827] sm:text-xl">{headingReq}</h2>
                    <div
                      className="prose prose-neutral max-w-none text-base leading-relaxed text-neutral-700 prose-ul:list-disc prose-ul:pl-5 prose-li:my-1 prose-li:marker:text-jsyellow prose-a:text-jsyellow prose-p:my-2"
                      dangerouslySetInnerHTML={{ __html: requirementsHtml }}
                    />
                  </section>
                ) : null}

                {isMeaningfulHtml(workConditionsHtml) ? (
                  <section className="border-b border-neutral-200 px-5 py-8 sm:px-8 sm:py-10">
                    <h2 className="mb-4 text-lg font-bold text-[#111827] sm:text-xl">{headingWork}</h2>
                    <div
                      className="prose prose-neutral max-w-none text-base leading-relaxed text-neutral-700 prose-ul:list-disc prose-ul:pl-5 prose-li:my-1 prose-li:marker:text-jsyellow prose-a:text-jsyellow prose-p:my-2"
                      dangerouslySetInnerHTML={{ __html: workConditionsHtml }}
                    />
                  </section>
                ) : null}

                {!isExpired ? (
                  <footer className="px-5 py-8 text-center sm:px-8 sm:py-10">
                    <p className="mx-auto max-w-2xl text-[15px] leading-relaxed text-[#4B5563] sm:text-base">
                      {t("cvCta")}
                      {" "}
                      <a
                        href="mailto:career@jetacademy.az"
                        className="font-semibold text-jsyellow underline decoration-jsyellow/50 underline-offset-[3px] hover:opacity-90"
                      >
                        career@jetacademy.az
                      </a>
                      {t("cvCtaa", { vacancyName: title })}
                    </p>
                  </footer>
                ) : null}
              </article>

              {faqItems.length > 0 ? (
                <div className="mx-auto mt-12 max-w-4xl sm:mt-16">
                  <FaqSection items={faqItems} locale={locale} />
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </BreadcrumbContextWrapper>
    );
  } catch (error) {
    console.error("Vacancy detail page error:", error);
    return notFound();
  }
}
