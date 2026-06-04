// src/app/[locale]/page.tsx
import { Suspense } from "react";
import Hero from "@/components/views/landing/home/hero";
import CoursesSlider from "@/components/views/landing/home/courses";
import AboutUs from "@/components/views/landing/home/about-us";
import Reviews from "@/components/views/landing/home/reviews";
import Projects from "@/components/views/landing/home/projects";
import Gallery from "@/components/views/landing/home/gallery";
import Blogs from "@/components/views/landing/home/blogs";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Locale } from "@/i18n/request";
import { trimMetaTitle, trimMetaDescription, buildCanonicalUrl, buildHreflangUrl } from "@/utils/seo";
import JsonLd from "@/components/seo/json-ld";
import { buildHomePageGraph, SITE_SCHEMA } from "@/data/site-schema";
import { getPageMeta } from "@/utils/api/page-meta";
import { getFaqByPage } from "@/utils/api/faq";
import FaqSection from "@/components/views/landing/faq/faq-section";
import { CONTENT_ISR_SECONDS } from "@/constants/content-isr";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = params.locale;
  const t = await getTranslations({
    locale,
    namespace: "Metadata",
  });
  const meta = await getPageMeta("home", locale);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const canonical = buildCanonicalUrl(baseUrl);
  const ogUrl = buildHreflangUrl(baseUrl, locale);

  const title = meta?.title
    ? trimMetaTitle(meta.title)
    : trimMetaTitle(t("title"));
  const description = meta?.description
    ? trimMetaDescription(meta.description)
    : trimMetaDescription(t("description"));
  const ogTitle = meta?.title ? trimMetaTitle(meta.title) : trimMetaTitle(t("ogTitle"));
  const ogDescription = meta?.description
    ? trimMetaDescription(meta.description)
    : trimMetaDescription(t("ogDescription"));

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    keywords: t("keywords"),
    alternates: {
      canonical,
      languages: {
        az: buildHreflangUrl(baseUrl, "az"),
        ru: buildHreflangUrl(baseUrl, "ru"),
        "x-default": baseUrl,
      },
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: ogUrl,
      siteName: "JET School",
      images: [{ url: SITE_SCHEMA.ogImagePath, width: 1200, height: 630, alt: t("ogImageAlt") }],
      locale: params.locale === "az" ? "az_AZ" : "ru_RU",
      alternateLocale: params.locale === "az" ? "ru_RU" : "az_AZ",
      type: "website",
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    twitter: { card: "summary_large_image", title: ogTitle, description: ogDescription, images: [SITE_SCHEMA.ogImagePath] },
  };
}

export const revalidate = CONTENT_ISR_SECONDS;

export default async function Home({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);

  const locale = params.locale as Locale;
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const base = `${baseUrl}/${locale}`;
  const homeLabel = locale === "az" ? "Ana Səhifə" : "Главная";

  const [metaT, homeMeta, faqItems] = await Promise.all([
    getTranslations({ locale: params.locale, namespace: "Metadata" }),
    getPageMeta("home", locale),
    getFaqByPage("home"),
  ]);

  const pageTitle = homeMeta?.title
    ? trimMetaTitle(homeMeta.title)
    : trimMetaTitle(metaT("title"));
  const pageDescription = homeMeta?.description
    ? trimMetaDescription(homeMeta.description)
    : trimMetaDescription(metaT("description"));

  const schemaGraph = buildHomePageGraph({
    name: pageTitle,
    description: pageDescription,
    url: base,
    locale,
    baseUrl,
    breadcrumbItems: [{ name: homeLabel, url: base }],
    primaryImageUrl: SITE_SCHEMA.image,
  });

  return (
    <main className="bg-background">
      <JsonLd data={schemaGraph} />
      <div
        className="
          container
          mx-auto
          px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16
          2xl:px-10 3xl:px-24 4xl:px-32
          relative z-10
        "
      >
        <Hero locale={locale} />
        <Suspense
          fallback={
            <div
              className="my-10 h-80 rounded-2xl bg-neutral-100/90 animate-pulse"
              aria-hidden
            />
          }
        >
          <CoursesSlider />
        </Suspense>

        <Suspense fallback={<div className="my-16 h-96" />}>
          <AboutUs />
        </Suspense>
        <Suspense fallback={<div className="my-16 h-80" />}>
          <Reviews />
        </Suspense>
        <Suspense fallback={<div className="my-16 h-80" />}>
          <Projects />
        </Suspense>
        <Suspense fallback={<div className="my-16 h-80" />}>
          <Gallery />
        </Suspense>
        {faqItems.length > 0 && (
          <FaqSection items={faqItems} locale={locale} />
        )}

        <Suspense fallback={<div className="my-16 h-72" />}>
          <Blogs />
        </Suspense>
      </div>
    </main>
  );
}
