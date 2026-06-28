import SectionTitle from "@/components/shared/section-title";
import ReviewCard from "@/components/views/landing/reviews/review-card";
import { StudentReview } from "@/types/student-reviews";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import { cache } from "react";
import { isDisplayablePublicReview } from "@/utils/displayable-review";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/json-ld";
import { buildCollectionPageGraph } from "@/data/site-schema";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPageMeta } from "@/utils/api/page-meta";
import { trimMetaTitle, trimMetaDescription, buildHreflangUrl } from "@/utils/seo";
import { getFaqByPage } from "@/utils/api/faq";
import FaqSection from "@/components/views/landing/faq/faq-section";
import { getReviewsPathSegment } from "@/i18n/routing";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const tMeta = await getTranslations({ locale, namespace: "Metadata" });
  const meta = await getPageMeta("reviews", locale);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const canonicalUrl = buildHreflangUrl(baseUrl, locale, getReviewsPathSegment(locale));
  const title = meta?.title
    ? trimMetaTitle(meta.title)
    : trimMetaTitle(tMeta("reviewsPageTitle") || "Rəylər");
  const description = meta?.description
    ? trimMetaDescription(meta.description)
    : trimMetaDescription(
        tMeta("reviewsPageDescription") || "JET School tələbələrinin rəyləri"
      );
  const openGraph: Metadata["openGraph"] = {
    title,
    description,
    type: "website",
    url: buildHreflangUrl(baseUrl, locale, getReviewsPathSegment(locale)),
  };
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        az: buildHreflangUrl(baseUrl, "az", "reyler"),
        ru: buildHreflangUrl(baseUrl, "ru", "otzyvy"),
        "x-default": baseUrl,
      },
    },
    openGraph,
  };
}

/**
 * Axios əvəzinə native `fetch` — Next.js ISR cache-i tətbiq olunur, eyni zamanda
 * React `cache()` eyni request daxilində təkrar çağırılmanın qarşısını alır.
 * Bu kombinasiya səhifə TTFB-ni azaldır və backend-ə yükü düşürür.
 */
const fetchReviews = cache(async () => {
  try {
    const response = await fetch(
      `${PUBLIC_API_BASE}/student-reviews?limit=100&sortBy=order&order=desc`,
      { next: { revalidate: 120 } },
    );
    if (!response.ok) return { items: [] };
    return (await response.json()) ?? { items: [] };
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return { items: [] };
  }
});

export default async function ReviewsPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale as "az" | "ru";
  const [t, data, faqItems] = await Promise.all([
    getTranslations({ locale: params.locale, namespace: "reviews" }),
    fetchReviews(),
    getFaqByPage("reviews"),
  ]);
  const items: StudentReview[] = (data?.items ?? []).filter((r: StudentReview) =>
    isDisplayablePublicReview(r)
  );
  if (items.length === 0) {
    notFound();
  }
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const base = `${baseUrl}/${locale}`;
  const reviewsUrl = `${base}/${getReviewsPathSegment(locale)}`;
  const pageTitle = t("homeSectionTitle");
  const pageDescription = t("description") || "";
  const homeLabel = locale === "az" ? "Ana Səhifə" : "Главная";
  const reviewsLabel = locale === "az" ? "Rəylər" : "Отзывы";
  const schemaGraph = buildCollectionPageGraph({
    name: pageTitle,
    description: pageDescription,
    url: reviewsUrl,
    locale,
    baseUrl,
    breadcrumbItems: [
      { name: homeLabel, url: base },
      { name: reviewsLabel, url: reviewsUrl },
    ],
    itemList: items.slice(0, 50).map((r) => ({
      name: (r.title as { az?: string; ru?: string })?.[locale] || "Rəy",
      url: r.link || reviewsUrl,
    })),
  });

  return (
    <div id="reviews" className="container my-20 flex flex-col gap-8">
      <JsonLd data={schemaGraph} />
      <SectionTitle as="h1" title={t("homeSectionTitle")} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 [@media(min-width:2500px)]:grid-cols-4">
        {items.map((review, index) => (
          <ReviewCard
            key={review.id}
            loadEager={index === 0}
            imageUrl={review.imageUrl}
            link={review.link}
            title={(review.title ?? { az: "", ru: "" }) as { az: string; ru: string }}
            description={(review.description ?? { az: "", ru: "" }) as { az: string; ru: string }}
            course={review.course}
          />
        ))}
      </div>

      {faqItems.length > 0 && (
        <FaqSection items={faqItems} locale={locale} />
      )}
    </div>
  );
}

/** ISR: rəylər siyahısı üçün API təzyiqini azaldır */
export const revalidate = 120;
