import JsonLd from "@/components/seo/json-ld";
import { buildHomePageGraph } from "@/data/site-schema";
import type { Locale } from "@/i18n/request";
import { getVacancyBySlugPublic } from "@/utils/api/vacancy";
import { getPageMeta } from "@/utils/api/page-meta";
import {
  ensureTrailingSlash,
  trimMetaDescription,
  trimMetaTitle,
} from "@/utils/seo";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/views/landing/bread-crumbs/bread-crumbs";
import BreadcrumbContextWrapper from "@/hooks/BreadcrumbContextWrapper";
import { getFaqByPage } from "@/utils/api/faq";
import FaqSection from "@/components/views/landing/faq/faq-section";
import { formatDate } from "@/utils/formatters/formatDate";
import { employmentLabel, experienceLabel } from "@/utils/vacancy-labels";
import {
  MdOutlineCalendarToday,
  MdOutlineTrendingUp,
  MdOutlineWorkOutline,
} from "react-icons/md";

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function excerpt(text: string, max = 165): string {
  const t = stripHtml(text.replace(/\s+/g, " ").trim());
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function vacancyPageHeading(locale: Locale, titleAz: string, titleRu: string): string {
  const raw = (locale === "ru" ? titleRu : titleAz).trim();
  if (locale === "ru") {
    return `Вакансия ${raw}`.trim();
  }
  return `${raw} vakansiyası`.trim();
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
  const titleText = vacancyPageHeading(
    locale,
    vacancy.title.az,
    vacancy.title.ru
  );
  const title = trimMetaTitle(`${titleText} | JET School`);
  const description = trimMetaDescription(excerpt(descText));

  const canonicalUrl = ensureTrailingSlash(
    `${baseUrl}/${locale}/vacancies/${params.slug}`
  );
  const azVacUrl = ensureTrailingSlash(
    `${baseUrl}/az/vacancies/${vacancy.slug.az}`
  );
  const ruVacUrl = ensureTrailingSlash(
    `${baseUrl}/ru/vacancies/${vacancy.slug.ru}`
  );

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
      url: canonicalUrl,
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
    if (!vacancy) return notFound();

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

    const title = vacancyPageHeading(
      locale,
      vacancy.title.az,
      vacancy.title.ru
    );
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
        <section className="w-full min-w-0 bg-transparent pb-16 pt-6 sm:pb-20 sm:pt-8 md:pt-10">
          <JsonLd data={schemaGraph} />

          <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 [@media(min-width:2500px)]:px-24 [@media(min-width:3000px)]:px-28">
            <div className="mx-auto max-w-4xl">
              <div className="mb-6 text-sm text-gray-500 sm:mb-8 sm:text-base">
                <Breadcrumbs dynamicTitle={title} />
              </div>

              <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_10px_40px_-12px_rgba(28,28,28,0.12)]">
                {/* Banner — brend rəngi */}
                <div className={`px-6 py-8 sm:px-8 sm:py-10 ${headerBg}`}>
                  <span className="inline-flex items-center rounded-full bg-white/25 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white ring-1 ring-white/30 sm:text-[11px]">
                    {vacancyBadge}
                  </span>
                  <h1 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-[2.5rem] md:leading-[1.2]">
                    {title}
                  </h1>
                </div>

                {/* Meta sətri — üfüqi, ayırıcı xətt */}
                <div
                  className="flex flex-col gap-4 border-b border-gray-200 bg-white px-5 py-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-6 sm:px-8 sm:py-6"
                  aria-label={locale === "az" ? "Vakansiya qısa məlumat" : "Кратко о вакансии"}
                >
                  <div
                    className="flex min-w-0 items-center gap-3"
                    title={a11y(metaL.deadline, deadlineText ?? metaL.dash)}
                  >
                    <MdOutlineCalendarToday
                      className={`size-6 shrink-0 sm:size-7 ${isExpired ? "text-gray-400" : "text-jsyellow"}`}
                      aria-hidden
                    />
                    <span className="text-sm font-medium text-jsblack sm:text-base">
                      {deadlineText ?? metaL.dash}
                    </span>
                  </div>
                  <div
                    className="flex min-w-0 items-center gap-3"
                    title={a11y(metaL.regime, regimeText ?? metaL.dash)}
                  >
                    <MdOutlineWorkOutline
                      className={`size-6 shrink-0 sm:size-7 ${isExpired ? "text-gray-400" : "text-jsyellow"}`}
                      aria-hidden
                    />
                    <span className="text-sm font-medium text-jsblack sm:text-base">
                      {regimeText ?? metaL.dash}
                    </span>
                  </div>
                  <div
                    className="flex min-w-0 items-center gap-3"
                    title={a11y(metaL.exp, expText ?? metaL.dash)}
                  >
                    <MdOutlineTrendingUp
                      className={`size-6 shrink-0 sm:size-7 ${isExpired ? "text-gray-400" : "text-jsyellow"}`}
                      aria-hidden
                    />
                    <span className="text-sm font-medium text-jsblack sm:text-base">
                      {expText ?? metaL.dash}
                    </span>
                  </div>
                </div>

                <article className="px-5 pb-8 pt-8 sm:px-8 sm:pb-10 sm:pt-10">
                  {isExpired && (
                    <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 sm:text-[15px]">
                      {metaL.expired}
                    </div>
                  )}

                  <div className="border-b border-gray-200 pb-8">
                    <h2 className="mb-4 text-lg font-bold text-jsblack sm:text-xl">{headingAbout}</h2>
                    <div
                      className="prose prose-neutral max-w-none text-base leading-relaxed text-neutral-700 sm:text-[17px] prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-headings:text-jsblack"
                      dangerouslySetInnerHTML={{ __html: description }}
                    />
                  </div>

                  {isMeaningfulHtml(requirementsHtml) && (
                    <div className="border-b border-gray-200 py-8">
                      <h2 className="mb-4 text-lg font-bold text-jsblack sm:text-xl">{headingReq}</h2>
                      <div
                        className="prose prose-neutral max-w-none text-base leading-relaxed text-neutral-700 sm:text-[17px] prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-headings:text-jsblack"
                        dangerouslySetInnerHTML={{ __html: requirementsHtml }}
                      />
                    </div>
                  )}

                  {isMeaningfulHtml(workConditionsHtml) && (
                    <div className="border-b border-gray-200 py-8">
                      <h2 className="mb-4 text-lg font-bold text-jsblack sm:text-xl">{headingWork}</h2>
                      <div
                        className="prose prose-neutral max-w-none text-base leading-relaxed text-neutral-700 sm:text-[17px] prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-headings:text-jsblack"
                        dangerouslySetInnerHTML={{ __html: workConditionsHtml }}
                      />
                    </div>
                  )}

                  {!isExpired && (
                    <footer className="pt-8 text-center">
                      <p className="mx-auto max-w-2xl text-sm leading-relaxed text-neutral-700 sm:text-base">
                        {t("cvCta")}{" "}
                        <a
                          href="mailto:career@jetacademy.az"
                          className="font-semibold text-jsyellow underline decoration-jsyellow/40 underline-offset-2 transition hover:text-jsblack hover:decoration-jsblack/30"
                        >
                          career@jetacademy.az
                        </a>
                        {t("cvCtaa", { vacancyName: title })}
                      </p>
                    </footer>
                  )}
                </article>
              </div>

              {faqItems.length > 0 && (
                <div className="mx-auto mt-14 max-w-4xl sm:mt-16">
                  <FaqSection items={faqItems} locale={locale} />
                </div>
              )}
            </div>
          </div>
        </section>
      </BreadcrumbContextWrapper>
    );
  } catch (error) {
    console.error("Vacancy detail page error:", error);
    return notFound();
  }
}
