import PostFilters from "@/components/views/landing/post/filters";
import PostGrid from "@/components/views/landing/post/grid";
import EventFilters from "@/components/views/landing/events/event-filters";
import { Locale } from "@/i18n/request";
import { PostType } from "@/types/enums";
import { getAllPosts } from "@/utils/api/post";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { trimMetaTitle, trimMetaDescription, buildHreflangUrl } from "@/utils/seo";
import JsonLd from "@/components/seo/json-ld";
import { buildCollectionPageGraph } from "@/data/site-schema";
import Breadcrumbs from "@/components/views/landing/bread-crumbs/bread-crumbs";

// Next.js'e bu sayfanın her istekte dinamik olarak render edilmesini söyle
export const dynamic = 'force-dynamic';

interface PostsPageProps {
  searchParams: {
    page?: string;
    limit?: string;
    eventStatus?: string;
  };
  params: {
    locale: string;
    type?: string;
  };
}

export async function generateMetadata({
  params,
  searchParams,
}: PostsPageProps): Promise<Metadata> {
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "postsPage" });
  const type = params.type?.toUpperCase() as PostType | undefined;

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const typePath = `news/category/${params.type || "news"}`;
  const canonicalUrl = buildHreflangUrl(baseUrl, locale, typePath);

  let title = t("metaTitle") || "Bloq";
  let description =
    t("metaDescription") ||
    "JET School-un ən son məqalələrini, xəbərlərini və tədbirlərini kəşf edin";

  if (type) {
    switch (type) {
      case PostType.BLOG:
        title = t("blogMetaTitle") || "Bloq Məqalələri";
        description =
          t("blogMetaDescription") ||
          "Ən son bloq məqalələrimizi və fikirlərimizi oxuyun";
        break;
      case PostType.NEWS:
        title = t("newsMetaTitle") || "Xəbərlər";
        description =
          t("newsMetaDescription") ||
          "JET School-un ən son xəbərləri ilə tanış olun";
        break;
      case PostType.EVENT:
        const eventStatus = searchParams.eventStatus;
        const statusText =
          eventStatus === "PAST"
            ? t("past")
            : eventStatus === "UPCOMING"
              ? t("upcoming")
              : t("all");
        title = `${t("eventMetaTitle") || "Tədbirlər"} - ${statusText}`;
        description =
          t("eventMetaDescription") ||
          "JET School-da keçirilən və gələcək tədbirləri kəşf edin";
        break;
    }
  }

  const trimmedTitle = trimMetaTitle(title);
  const trimmedDescription = trimMetaDescription(description);

  return {
    title: trimmedTitle,
    description: trimmedDescription,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        az: buildHreflangUrl(baseUrl, "az", typePath),
        ru: buildHreflangUrl(baseUrl, "ru", typePath),
        "x-default": buildHreflangUrl(baseUrl, "az", typePath),
      },
    },
    openGraph: {
      title: trimmedTitle,
      description: trimmedDescription,
      url: buildHreflangUrl(baseUrl, locale, typePath),
      type: "website",
      locale: locale === "az" ? "az_AZ" : "ru_RU",
      alternateLocale: locale === "az" ? "ru_RU" : "az_AZ",
    },
    twitter: {
      card: "summary_large_image",
      title: trimmedTitle,
      description: trimmedDescription,
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
  searchParams,
  params,
}: PostsPageProps) {
  const locale = params.locale as Locale;
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 12;
  const type = params.type?.toUpperCase() as PostType | undefined;
  const eventStatus = searchParams.eventStatus;

  const [postsData, t] = await Promise.all([
    getAllPosts({
      page,
      limit,
      postType: type,
      eventStatus:
        type === PostType.EVENT
          ? eventStatus && eventStatus !== "ALL"
            ? eventStatus
            : undefined
          : undefined,
    }),
    getTranslations({ locale, namespace: "postsPage" }),
  ]);

  const { items: posts, meta } = postsData;

  const transformedMeta = {
    page: meta.page,
    limit: meta.limit,
    totalItems: meta.total,
    totalPages: meta.totalPages,
  };

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const base = locale === "az" ? baseUrl : `${baseUrl}/${locale}`;
  const typePath = params.type || "news";
  const pageUrl = `${base}/${typePath}`;
  const homeLabel = locale === "az" ? "Ana Səhifə" : "Главная";

  let pageLabel: string;
  switch (type) {
    case PostType.BLOG:
      pageLabel = t("blogMetaTitle") || (locale === "az" ? "Bloq" : "Блог");
      break;
    case PostType.NEWS:
      pageLabel = t("newsMetaTitle") || (locale === "az" ? "Xəbərlər" : "Новости");
      break;
    case PostType.EVENT:
      pageLabel = t("eventMetaTitle") || (locale === "az" ? "Tədbirlər" : "Мероприятия");
      break;
    default:
      pageLabel = t("pageTitle") || (locale === "az" ? "Məqalələr" : "Публикации");
  }

  const normalizedLocale = locale === "az" ? "az" : "ru";

  const schemaGraph = buildCollectionPageGraph({
    name: pageLabel,
    url: pageUrl,
    locale,
    baseUrl,
    breadcrumbItems: [
      { name: homeLabel, url: base },
      { name: pageLabel, url: pageUrl },
    ],
    itemList: posts.slice(0, 20).map((p) => ({
      name: p.title?.[normalizedLocale] || p.title?.az || "",
      url: `${pageUrl}/${p.slug?.[normalizedLocale] || p.slug?.az || ""}`,
    })),
  });

  return (
    <div className="container py-20">
      <JsonLd data={schemaGraph} />
      <Breadcrumbs />

      <div className="mb-8 text-center sm:mb-10">
        <h1 className="mb-3 font-bold text-jsblack text-2xl sm:text-3xl md:text-4xl">
          {type === PostType.EVENT
            ? t("event")
            : type === PostType.BLOG
            ? t("blog")
            : type === PostType.NEWS
            ? t("news")
            : t("pageTitle")}
        </h1>
        <p className="mx-auto max-w-2xl text-pretty text-sm leading-snug text-jsblack/70 sm:text-base">
          {t("pageDescription")}
        </p>
      </div>

      <PostFilters type={type} t={t} />

      {type === PostType.EVENT && <EventFilters />}

      <PostGrid
        posts={posts}
        locale={locale}
        t={t}
        meta={transformedMeta}
        type={type}
      />
    </div>
  );
}
