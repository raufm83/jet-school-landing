import PostFilters from "@/components/views/landing/post/filters";
import PostGrid from "@/components/views/landing/post/grid";
import OffersEmptyState from "@/components/views/landing/post/offers-empty-state";
import JsonLd from "@/components/seo/json-ld";
import Breadcrumbs from "@/components/views/landing/bread-crumbs/bread-crumbs";
import { buildCollectionPageGraph } from "@/data/site-schema";
import { Locale } from "@/i18n/request";
import { PostType } from "@/types/enums";
import { getAllPosts } from "@/utils/api/post";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPageMeta } from "@/utils/api/page-meta";
import { trimMetaTitle, trimMetaDescription, buildCanonicalUrl, buildHreflangUrl } from "@/utils/seo";
import { getFaqByPage } from "@/utils/api/faq";
import FaqSection from "@/components/views/landing/faq/faq-section";

interface OffersPageProps {
  params: {
    locale: string;
  };
  searchParams: {
    page?: string;
    limit?: string;
  };
}

export async function generateMetadata({
  params,
}: OffersPageProps): Promise<Metadata> {
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "postsPage" });

  const meta = await getPageMeta("offers", locale);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const canonicalUrl = buildCanonicalUrl(baseUrl, "offers");

  const title = meta?.title
    ? trimMetaTitle(meta.title)
    : trimMetaTitle(t("offers") || "Kampaniyalar");
  const description = meta?.description
    ? trimMetaDescription(meta.description)
    : trimMetaDescription(
        t("offersSubtitle") ||
          "Xüsusi təkliflər və endirim kampaniyaları ilə tanış olun"
      );

  const openGraph: Metadata["openGraph"] = {
    title,
    description,
    url: buildHreflangUrl(baseUrl, locale, "offers"),
    type: "website",
    locale: locale === "az" ? "az_AZ" : "ru_RU",
  };
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        az: buildHreflangUrl(baseUrl, "az", "offers"),
        ru: buildHreflangUrl(baseUrl, "ru", "offers"),
        "x-default": baseUrl,
      },
    },
    openGraph,
  };
}

export default async function OffersPage({
  params,
  searchParams,
}: OffersPageProps) {
  const locale = params.locale as Locale;
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 12;
  const type = PostType.OFFERS;

  const [postsData, t, faqItems] = await Promise.all([
    getAllPosts({
      page,
      limit,
      postType: type,
      includeBlogs: false,
    }),
    getTranslations({ locale, namespace: "postsPage" }),
    getFaqByPage("offers"),
  ]);

  const { items: posts, meta } = postsData;

  const transformedMeta = {
    page: meta.page,
    limit: meta.limit,
    totalItems: meta.total,
    totalPages: meta.totalPages,
  };

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const base = `${baseUrl}/${locale}`;
  const offersUrl = `${base}/offers`;
  const pageTitle = t("offers") || "Kampaniyalar";
  const pageDescription = t("offersSubtitle");
  const homeLabel = locale === "az" ? "Ana Səhifə" : "Главная";
  const offersLabel = locale === "az" ? "Kampaniyalar" : "Предложения";
  const itemList = (posts ?? []).slice(0, 12).map((p) => ({
    name: p.title[locale],
    url: `${base}/offers/${p.slug?.[locale] ?? p.slug?.az ?? p.slug?.ru ?? ""}`,
  }));
  const schemaGraph = buildCollectionPageGraph({
    name: pageTitle,
    description: pageDescription,
    url: offersUrl,
    locale,
    baseUrl,
    breadcrumbItems: [
      { name: homeLabel, url: base },
      { name: offersLabel, url: offersUrl },
    ],
    itemList,
  });

  return (
    <div className="container py-20">
      <JsonLd data={schemaGraph} />
      <Breadcrumbs />
      <div className="mb-8 sm:mb-10 text-center">
        <h1 className="mb-3 font-bold text-jsblack text-2xl sm:text-3xl md:text-4xl">
          {pageTitle}
        </h1>
        <p className="mx-auto max-w-2xl text-pretty text-sm leading-snug text-jsblack/70 sm:text-base">
          {t("offersSubtitle")}
        </p>
      </div>

      <PostFilters type={type} t={t} />

      {posts?.length ? (
        <PostGrid
          posts={posts}
          locale={locale}
          t={t}
          meta={transformedMeta}
          type={type}
        />
      ) : (
        <OffersEmptyState
          title={t("offersEmptyTitle")}
        />
      )}

      {faqItems.length > 0 && (
        <FaqSection items={faqItems} locale={locale} />
      )}
    </div>
  );
}
