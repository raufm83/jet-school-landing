import GalleryClient from "@/components/views/landing/gallery/gallery-client";
import JsonLd from "@/components/seo/json-ld";
import { buildCollectionPageGraph } from "@/data/site-schema";
import { GalleryResponse } from "@/types/gallery";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import { cache } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPageMeta } from "@/utils/api/page-meta";
import { trimMetaTitle, trimMetaDescription, buildHreflangUrl } from "@/utils/seo";
import { getFaqByPage } from "@/utils/api/faq";
import FaqSection from "@/components/views/landing/faq/faq-section";
import { notFound } from "next/navigation";

/** ISR: qalereya tez-tez dəyişmir; API yükü və TTFB azalır */
export const revalidate = 120;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const [t, meta] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata" }),
    getPageMeta("gallery", locale),
  ]);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const canonicalUrl = buildHreflangUrl(baseUrl, locale, "gallery");

  const title = meta?.title
    ? trimMetaTitle(meta.title)
    : trimMetaTitle(t("galleryPageTitle") || "Qalereya");
  const description = meta?.description
    ? trimMetaDescription(meta.description)
    : trimMetaDescription(
        "JET School-da uşaqlar üçün keçirilən IT və proqramlaşdırma dərslərindən görüntülər"
      );

  const openGraph: Metadata["openGraph"] = {
    title,
    description,
    url: buildHreflangUrl(baseUrl, locale, "gallery"),
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
        az: buildHreflangUrl(baseUrl, "az", "gallery"),
        ru: buildHreflangUrl(baseUrl, "ru", "gallery"),
        "x-default": baseUrl,
      },
    },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
  };
}
const EMPTY_GALLERY: GalleryResponse = {
  items: [],
  meta: { total: 0, page: 1, limit: 10 },
};

/**
 * Native `fetch` + Next.js ISR + React `cache()` — axios əvəzinə istifadə etməklə
 * Next cache sistemində həm request-daxili, həm də server-səviyyəli ISR cache-dən
 * yararlanırıq.
 */
const fetchGalleryImages = cache(async (): Promise<GalleryResponse> => {
  try {
    const response = await fetch(
      `${PUBLIC_API_BASE}/gallery?limit=100&sortBy=order&order=desc`,
      { next: { revalidate: 120 } },
    );
    if (!response.ok) return EMPTY_GALLERY;
    return (await response.json()) ?? EMPTY_GALLERY;
  } catch (error) {
    console.error("Failed to fetch gallery images:", error);
    return EMPTY_GALLERY;
  }
});

export default async function GalleryPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale as "az" | "ru";
  const [initialGallery, faqItems, t] = await Promise.all([
    fetchGalleryImages(),
    getFaqByPage("gallery"),
    getTranslations({ locale, namespace: "Metadata" }),
  ]);
  if (!initialGallery.items?.length) {
    notFound();
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az";
  const base = `${baseUrl}/${locale}`;
  const galleryUrl = `${base}/gallery`;
  const pageTitle = t("galleryPageTitle") || "Qalereya";
  const pageDescription =
    "JET School-da uşaqlar üçün keçirilən IT və proqramlaşdırma dərslərindən görüntülər";
  const homeLabel = locale === "az" ? "Ana Səhifə" : "Главная";
  const galleryLabel = locale === "az" ? "Qalereya" : "Галерея";
  const schemaGraph = buildCollectionPageGraph({
    name: pageTitle,
    description: pageDescription,
    url: galleryUrl,
    locale,
    baseUrl,
    breadcrumbItems: [
      { name: homeLabel, url: base },
      { name: galleryLabel, url: galleryUrl },
    ],
  });

  return (
    <div>
      <JsonLd data={schemaGraph} />
      <GalleryClient initialGallery={initialGallery} />
      {faqItems.length > 0 && (
        <div className="container px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-16">
          <FaqSection items={faqItems} locale={locale} />
        </div>
      )}
    </div>
  );
}
