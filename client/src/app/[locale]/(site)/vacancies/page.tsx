import JsonLd from "@/components/seo/json-ld";
import Breadcrumbs from "@/components/views/landing/bread-crumbs/bread-crumbs";
import VacancyCard from "@/components/views/landing/vacancies/vacancy-card";
import OffersEmptyState from "@/components/views/landing/post/offers-empty-state";
import { buildCollectionPageGraph } from "@/data/site-schema";
import type { Locale } from "@/i18n/request";

import { getVacanciesPublic } from "@/utils/api/vacancy";
import { getPageMeta } from "@/utils/api/page-meta";
import {
  ensureTrailingSlash,
  trimMetaDescription,
  trimMetaTitle,
  buildCanonicalUrl,
  buildHreflangUrl,
} from "@/utils/seo";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getFaqByPage } from "@/utils/api/faq";
import FaqSection from "@/components/views/landing/faq/faq-section";
import { vacancyCardDeadlineCountdownText } from "@/utils/vacancy-deadline-countdown";
import { vacancyPageHeading } from "@/utils/vacancy-display";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "vacanciesPage" });
  const meta = await getPageMeta("vacancies", locale);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(
    /\/+$/,
    ""
  );
  const canonicalUrl = buildCanonicalUrl(baseUrl, "vacancies");

  const title = meta?.title
    ? trimMetaTitle(meta.title)
    : trimMetaTitle(t("metaTitle"));
  const description = meta?.description
    ? trimMetaDescription(meta.description)
    : trimMetaDescription(t("metaDescription"));

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        az: buildHreflangUrl(baseUrl, "az", "vacancies"),
        ru: buildHreflangUrl(baseUrl, "ru", "vacancies"),
        "x-default": baseUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: buildHreflangUrl(baseUrl, locale, "vacancies"),
      type: "website",
      locale: locale === "az" ? "az_AZ" : "ru_RU",
      alternateLocale: locale === "az" ? "ru_RU" : "az_AZ",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export const dynamic = "force-dynamic";

export default async function VacanciesPage({
  params,
}: {
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;
  const t = await getTranslations({ namespace: "vacanciesPage", locale });
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(
    /\/+$/,
    ""
  );
  const listPath = locale === "az" ? "/vacancies" : `/${locale}/vacancies`;
  const pageUrl = ensureTrailingSlash(`${baseUrl}${listPath}`);

  const [vacancies, faqItems] = await Promise.all([
    getVacanciesPublic(),
    getFaqByPage("vacancies"),
  ]);

  const homeLabel = locale === "az" ? "Ana Səhifə" : "Главная";
  const base = locale === "az" ? baseUrl : `${baseUrl}/${locale}`;

  const itemList = vacancies.map((v) => ({
    name: vacancyPageHeading(locale, v.title),
    url: ensureTrailingSlash(
      `${base}/vacancies/${locale === "ru" ? v.slug.ru : v.slug.az}`
    ),
  }));

  const schemaGraph = buildCollectionPageGraph({
    name: t("metaTitle"),
    description: t("metaDescription"),
    url: pageUrl,
    locale,
    baseUrl,
    breadcrumbItems: [
      { name: homeLabel, url: ensureTrailingSlash(`${base}/`) },
      { name: t("title"), url: pageUrl },
    ],
    itemList,
  });

  const sectionPad =
    vacancies.length === 0
      ? "pt-10 pb-2 -mb-4 sm:pt-12 sm:pb-3 sm:-mb-6 md:pt-14 md:pb-4 md:-mb-8"
      : "pt-10 pb-6 sm:pt-12 sm:pb-8 md:pt-14 md:pb-10";

  return (
    <section className={`relative w-full min-w-0 overflow-hidden bg-transparent ${sectionPad}`}>
      <JsonLd data={schemaGraph} />
      <div className="container relative mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 [@media(min-width:2500px)]:px-24 [@media(min-width:3000px)]:px-28">
        <div className="pt-2 sm:pt-0">
          <Breadcrumbs />
        </div>
        <header className="mb-8 text-center sm:mb-10">
          <h1 className="mb-3 font-bold text-jsblack text-2xl sm:text-3xl md:text-4xl">
            {t("title")}
          </h1>
          <p className="mx-auto max-w-[42rem] text-pretty text-sm text-jsblack/70 sm:text-base lg:text-[15px]">
            {t("description")}
          </p>
        </header>

        {vacancies.length === 0 ? (
          <OffersEmptyState
            imageSrc="/images/no-vacancies.svg"
            title={t("emptyTitle")}
            line1={t("emptyLine1")}
            line2={t("emptyLine2")}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5 md:gap-6 items-stretch">
            {vacancies.map((v) => (
              <li key={v.id} className="flex min-h-0 min-w-0">
                <VacancyCard
                  vacancy={v}
                  locale={locale}
                  deadlineBadgeLabel={vacancyCardDeadlineCountdownText(
                    v,
                    {
                      countdown: (c) => t("deadlineBadgeDays", { count: c }),
                      today: () => t("deadlineBadgeToday"),
                    },
                    { onlyWhenDaysRemainBelow: 7 },
                  )}
                />
              </li>
            ))}
          </ul>
        )}

        {faqItems.length > 0 && (
          <FaqSection items={faqItems} locale={locale} />
        )}
      </div>
    </section>
  );
}
