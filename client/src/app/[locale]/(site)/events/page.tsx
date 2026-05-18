import PostFilters from "@/components/views/landing/post/filters";
import EventFilters from "@/components/views/landing/post/filters/EventFilters";
import PostGrid from "@/components/views/landing/post/grid";
import JsonLd from "@/components/seo/json-ld";
import Breadcrumbs from "@/components/views/landing/bread-crumbs/bread-crumbs";
import { buildCollectionPageGraph } from "@/data/site-schema";
import { Locale } from "@/i18n/request";
import { PostType } from "@/types/enums";
import { getAllPosts } from "@/utils/api/post";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPageMeta } from "@/utils/api/page-meta";
import { trimMetaTitle, trimMetaDescription, ensureTrailingSlash } from "@/utils/seo";
import { getFaqByPage } from "@/utils/api/faq";
import FaqSection from "@/components/views/landing/faq/faq-section";

interface PostsPageProps {
  params: {
    locale: string;
  };
  searchParams: {
    page?: string;
    limit?: string;
    eventStatus?: string;
  };
}

export async function generateMetadata({
  params,
  searchParams,
}: PostsPageProps): Promise<Metadata> {
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "postsPage" });

  const meta = await getPageMeta("events", locale);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const basePath = `/${locale}/events`;
  const canonicalUrl = ensureTrailingSlash(`${baseUrl}${basePath}`);

  const title = meta?.title
    ? trimMetaTitle(meta.title)
    : trimMetaTitle(t("eventMetaTitle") || "Tədbirlər | JET School");
  const description = meta?.description
    ? trimMetaDescription(meta.description)
    : trimMetaDescription(
        t("eventMetaDescription") ||
          "JET School-da keçirilən və gələcək tədbirləri kəşf edin"
      );

  const truncatedTitle = title;
  const truncatedDesc = description;

  const queryParam = "";
  const azPath = `/az/events${queryParam}`;
  const ruPath = `/ru/events${queryParam}`;

  return {
    title: truncatedTitle,
    description: truncatedDesc,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        az: ensureTrailingSlash(`${baseUrl}${azPath}`),
        ru: ensureTrailingSlash(`${baseUrl}${ruPath}`),
        "x-default": ensureTrailingSlash(`${baseUrl}/az/events`),
      },
    },
    openGraph: {
      title: truncatedTitle,
      description: truncatedDesc,
      url: canonicalUrl,
      type: "website",
      locale: locale === "az" ? "az_AZ" : "ru_RU",
      alternateLocale: locale === "az" ? "ru_RU" : "az_AZ",
    },
    twitter: {
      card: "summary_large_image",
      title: truncatedTitle,
      description: truncatedDesc,
    },
    robots: {
      index: !searchParams.page && !searchParams.limit,
      follow: true,
      googleBot: {
        index: !searchParams.page && !searchParams.limit,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
  };
}

export default async function EventsPage({
  params,
  searchParams,
}: PostsPageProps) {
  const locale = params.locale as Locale;
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 12;
  const eventStatus = searchParams.eventStatus;
  const type = PostType.EVENT;

  const [postsData, t, faqItems] = await Promise.all([
    getAllPosts({
      page,
      limit,
      postType: type,
      includeBlogs: true,
      eventStatus:
        eventStatus && eventStatus !== "ALL" ? eventStatus : undefined,
    }),
    getTranslations({ locale, namespace: "postsPage" }),
    getFaqByPage("events"),
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
  const eventsUrl = `${base}/events`;
  const pageTitle = t("event") || "Tədbirlər";
  const pageDescription = t("eventDescription");
  const homeLabel = locale === "az" ? "Ana Səhifə" : "Главная";
  const eventsLabel = locale === "az" ? "Tədbirlər" : "События";
  const itemList = (posts ?? []).slice(0, 12).map((p) => ({
    name: p.title[locale],
    url: `${base}/events/${p.slug?.[locale] ?? p.slug?.az ?? p.slug?.ru ?? ""}`,
  }));
  const schemaGraph = buildCollectionPageGraph({
    name: pageTitle,
    description: pageDescription,
    url: eventsUrl,
    locale,
    baseUrl,
    breadcrumbItems: [
      { name: homeLabel, url: base },
      { name: eventsLabel, url: eventsUrl },
    ],
    itemList,
  });

  return (
    <div className="container py-20">
      <JsonLd data={schemaGraph} />
      <Breadcrumbs />
      <div className="mb-8 text-center sm:mb-10">
        <h1 className="mb-3 font-bold text-jsblack text-2xl sm:text-3xl md:text-4xl">
          {pageTitle}
        </h1>
        <p className="mx-auto max-w-2xl text-pretty text-sm leading-snug text-jsblack/70 sm:text-base">
          {pageDescription}
        </p>
      </div>

      <PostFilters type={type} t={t} />
      <EventFilters />

      <PostGrid
        posts={posts}
        locale={locale}
        t={t}
        meta={transformedMeta}
        type={type}
      />

      {faqItems.length > 0 && (
        <FaqSection items={faqItems} locale={locale} />
      )}
    </div>
  );
}
