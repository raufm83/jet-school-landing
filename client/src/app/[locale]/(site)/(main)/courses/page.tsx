// app/[locale]/courses/page.tsx
import CourseListingClient from "@/components/views/landing/courses/course-listing-client";
import JsonLd from "@/components/seo/json-ld";
import { buildCollectionPageGraph } from "@/data/site-schema";
import { Locale } from "@/i18n/request";
import type { Course } from "@/types/course";
import { getAllCourses } from "@/utils/api/course";
import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getPageMeta } from "@/utils/api/page-meta";
import { trimMetaTitle, trimMetaDescription, ensureTrailingSlash } from "@/utils/seo";
import { getFaqByPage } from "@/utils/api/faq";
import FaqSection from "@/components/views/landing/faq/faq-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("coursesPage");
  const locale = (await getLocale()) as Locale;

  const meta = await getPageMeta("courses", locale);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const canonicalUrl = ensureTrailingSlash(`${baseUrl}/${locale}/courses`);

  const title = meta?.title
    ? trimMetaTitle(meta.title)
    : trimMetaTitle(t("metaTitle"));
  const description = meta?.description
    ? trimMetaDescription(meta.description)
    : trimMetaDescription(t("metaDescription"));

  const openGraph: Metadata["openGraph"] = {
    title,
    description,
    url: canonicalUrl,
    type: "website",
    locale: locale === "az" ? "az_AZ" : "ru_RU",
    alternateLocale: locale === "az" ? "ru_RU" : "az_AZ",
  };
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        az: ensureTrailingSlash(`${baseUrl}/az/courses`),
        ru: ensureTrailingSlash(`${baseUrl}/ru/courses`),
        "x-default": ensureTrailingSlash(`${baseUrl}/az/courses`),
      },
    },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CoursesPage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("coursesPage");
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const base = `${baseUrl}/${locale}`;
  const coursesUrl = `${base}/courses`;

  const [courses, meta, faqItems] = await Promise.all([
    getAllCourses({ limit: 24, page: 1 }),
    getPageMeta("courses", locale),
    getFaqByPage("courses"),
  ]);

  const pageTitle = meta?.title ? trimMetaTitle(meta.title) : trimMetaTitle(t("title"));
  const pageDescription = meta?.description ? trimMetaDescription(meta.description) : trimMetaDescription(t("description"));

  const coursesLabel = locale === "az" ? "Kurslarımız" : "Курсы";
  const homeLabel = locale === "az" ? "Ana Səhifə" : "Главная";

  const normalizedLocale = locale as "az" | "ru";
  const itemList = (courses.items ?? []).slice(0, 24).map((c: Course) => ({
    name: c.title[normalizedLocale],
    url: `${base}/course/${c.slug[normalizedLocale]}`,
  }));
  const schemaGraph = buildCollectionPageGraph({
    name: pageTitle,
    description: pageDescription,
    url: coursesUrl,
    locale,
    baseUrl,
    breadcrumbItems: [
      { name: homeLabel, url: base },
      { name: coursesLabel, url: coursesUrl },
    ],
    itemList,
  });

  return (
    <main className="min-h-screen [@media(min-width:2500px)]:min-h-full py-12 sm:py-16">
      <JsonLd data={schemaGraph} />
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 [@media(min-width:2500px)]:px-24 [@media(min-width:3000px)]:px-28">
        <div className="mb-8 text-center sm:mb-10">
          <h1 className="mb-3 font-bold text-jsblack text-2xl sm:text-3xl md:text-4xl">
            {pageTitle}
          </h1>
          <p className="mx-auto max-w-3xl text-pretty text-sm leading-snug text-jsblack/70 sm:text-base">
            {pageDescription}
          </p>
        </div>

        <CourseListingClient courses={courses} locale={locale} />

        {faqItems.length > 0 && (
          <FaqSection items={faqItems} locale={locale} />
        )}
      </div>
    </main>
  );
}
