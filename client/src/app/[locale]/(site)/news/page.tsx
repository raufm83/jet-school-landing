import PostFilters from "@/components/views/landing/post/filters";
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
import { trimMetaTitle, trimMetaDescription, buildHreflangUrl } from "@/utils/seo";
import { getFaqByPage } from "@/utils/api/faq";
import FaqSection from "@/components/views/landing/faq/faq-section";

interface PostsPageProps {
  params: {
    locale: string;
  };
  searchParams: {
    page?: string;
    limit?: string;
    type?: string | string[];
  };
}

function resolveListingPostType(raw: unknown): PostType | undefined {
  if (raw == null) return undefined;
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== "string" || !v) return undefined;
  const cleaned = v.trim().replace(/\/+$/, "");
  if (!cleaned) return undefined;
  const u = cleaned.toUpperCase();
  return (Object.values(PostType) as string[]).includes(u)
    ? (u as PostType)
    : undefined;
}

const PAGE_META_KEY_BY_TYPE: Record<PostType, string> = {
  [PostType.BLOG]: "blog",
  [PostType.NEWS]: "news",
  [PostType.EVENT]: "events",
  [PostType.OFFERS]: "offers",
};

export async function generateMetadata({
  params,
  searchParams,
}: PostsPageProps): Promise<Metadata> {
  const locale = params.locale;
  const type = resolveListingPostType(searchParams.type);
  const t = await getTranslations({ locale, namespace: "postsPage" });

  const pageKey = type ? PAGE_META_KEY_BY_TYPE[type] : "news";
  const meta = await getPageMeta(pageKey, locale);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const canonicalUrl = type
    ? `${buildHreflangUrl(baseUrl, locale, "news")}?type=${type}`
    : buildHreflangUrl(baseUrl, locale, "news");

  const defaultTitle =
    !type
      ? t("metaTitle")
      : type === PostType.BLOG
        ? t("blogMetaTitle") || "Bloq Məqalələri"
        : type === PostType.NEWS
          ? t("newsMetaTitle") || "Xəbərlər"
          : type === PostType.EVENT
            ? t("eventMetaTitle") || "Tədbirlər"
            : t("offersMetaTitle") || "Kampaniyalar";
  const defaultDescription =
    !type
      ? t("metaDescription")
      : type === PostType.BLOG
        ? t("blogMetaDescription") || "Ən son bloq məqalələrimizi və fikirlərimizi oxuyun"
        : type === PostType.NEWS
          ? t("newsMetaDescription") || "JET School-un ən son xəbərləri ilə tanış olun"
          : type === PostType.EVENT
            ? t("eventMetaDescription") || "JET School-da keçirilən və gələcək tədbirləri kəşf edin"
            : t("offersMetaDescription") || "JET School kampaniyaları və xüsusi təkliflər";

  /** Ümumi /news və ?type=NEWS eyni CMS açarını ("news") işlədir — yalnız xəbər filtrində tərcümə başlığını istifadə et. */
  const useNewsFilterMeta = type === PostType.NEWS;

  const title = useNewsFilterMeta
    ? trimMetaTitle(defaultTitle ?? "Xəbərlər")
    : meta?.title
      ? trimMetaTitle(meta.title)
      : trimMetaTitle(defaultTitle ?? "Bloq");
  const description = useNewsFilterMeta
    ? trimMetaDescription(
        defaultDescription ??
          "JET School-un ən son xəbərləri ilə tanış olun"
      )
    : meta?.description
      ? trimMetaDescription(meta.description)
      : trimMetaDescription(
          defaultDescription ??
            "JET School-un ən son məqalələrini, xəbərlərini və tədbirlərini kəşf edin"
        );

  const openGraph: Metadata["openGraph"] = {
    title,
    description,
    url: buildHreflangUrl(baseUrl, locale, "news"),
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
        az: type ? `${buildHreflangUrl(baseUrl, "az", "news")}?type=${type}` : buildHreflangUrl(baseUrl, "az", "news"),
        ru: type ? `${buildHreflangUrl(baseUrl, "ru", "news")}?type=${type}` : buildHreflangUrl(baseUrl, "ru", "news"),
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
export default async function AllPostsPage({
  params,
  searchParams,
}: PostsPageProps) {
  const locale = params.locale as Locale;
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 12;
  const type = resolveListingPostType(searchParams.type);

  const [postsData, t, faqItems] = await Promise.all([
    getAllPosts({
      page,
      limit,
      postType: type,
      includeBlogs: false,
    }),
    getTranslations({ locale, namespace: "postsPage" }),
    getFaqByPage("news"),
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
  const basePath = locale === "az" ? "/news" : `/${locale}/news`;
  const queryParam = type ? `?type=${type}` : "";
  const newsUrl = `${baseUrl}${basePath}${queryParam}`;

  let pageTitle = t("pageTitle");
  if (type) {
    switch (type) {
      case PostType.BLOG:
        pageTitle = t("blogMetaTitle") || "Bloq Məqalələri";
        break;
      case PostType.NEWS:
        pageTitle = t("newsMetaTitle") || "Xəbərlər";
        break;
      case PostType.EVENT:
        pageTitle = t("eventMetaTitle") || "Tədbirlər";
        break;
      default:
        break;
    }
  }
  const pageDescription = t("pageDescription");
  const homeLabel = locale === "az" ? "Ana Səhifə" : "Главная";
  const newsLabel = pageTitle;
  const itemList = (posts ?? []).slice(0, 12).map((p) => ({
    name: p.title[locale],
    url: `${base}/news/${p.slug?.[locale] ?? p.slug?.az ?? p.slug?.ru ?? ""}`,
  }));
  const schemaGraph = buildCollectionPageGraph({
    name: pageTitle,
    description: pageDescription,
    url: newsUrl,
    locale,
    baseUrl,
    breadcrumbItems: [
      { name: homeLabel, url: base },
      { name: newsLabel, url: newsUrl },
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

      {/* Post Type Filter */}
      <PostFilters type={type} t={t} />

      {/* Posts Grid */}
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
