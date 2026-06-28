import PostFilters from "@/components/views/landing/post/filters";
import BlogSearch from "@/components/views/landing/post/blog-search";
import BlogCategoryFilters from "@/components/views/landing/post/blog-category-filters";
import PostGrid from "@/components/views/landing/post/grid";
import { getBlogCategories } from "@/utils/api/blog-category";
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

function isLikelyMongoObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value.trim());
}

export const dynamic = "force-dynamic";

interface BlogPageProps {
  params: {
    locale: string;
  };
  searchParams: {
    page?: string;
    limit?: string;
    type?: PostType;
    category?: string;
    q?: string;
  };
}

export async function generateMetadata({
  params,
  searchParams,
}: BlogPageProps): Promise<Metadata> {
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "blogPage" });

  const meta = await getPageMeta("blog", locale);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const pageParam = searchParams.page;
  const categoryParam = searchParams.category?.trim() ?? "";

  const query = new URLSearchParams();
  if (pageParam && pageParam !== "1") query.set("page", pageParam);
  if (categoryParam && isLikelyMongoObjectId(categoryParam)) {
    query.set("category", categoryParam);
  }
  const qs = query.toString();
  const canonicalUrl = qs
    ? `${buildHreflangUrl(baseUrl, locale, "blog")}?${qs}`
    : buildHreflangUrl(baseUrl, locale, "blog");

  const isIndexable =
    (!pageParam || pageParam === "1") && !(searchParams.q?.trim());

  const title = meta?.title
    ? trimMetaTitle(meta.title)
    : trimMetaTitle(t("metaTitle") || "Bloq");
  const description = meta?.description
    ? trimMetaDescription(meta.description)
    : trimMetaDescription(
        t("metaDescription") || "JET School-un ən son bloq məqalələrini kəşf edin"
      );

  const openGraph: Metadata["openGraph"] = {
    title,
    description,
    url: buildHreflangUrl(baseUrl, locale, "blog"),
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
        az: qs ? `${buildHreflangUrl(baseUrl, "az", "blog")}?${qs}` : buildHreflangUrl(baseUrl, "az", "blog"),
        ru: qs ? `${buildHreflangUrl(baseUrl, "ru", "blog")}?${qs}` : buildHreflangUrl(baseUrl, "ru", "blog"),
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
      index: isIndexable,
      follow: true,
      googleBot: {
        index: isIndexable,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
  };
}

export default async function BlogPage({
  searchParams,
  params,
}: BlogPageProps) {
  const locale = params.locale as Locale;
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 12;
  const type = PostType.BLOG;
  const categoryRaw = searchParams.category?.trim() ?? "";
  const searchQuery = searchParams.q?.trim() ?? "";
  const blogCategoryFilter = isLikelyMongoObjectId(categoryRaw)
    ? categoryRaw
    : undefined;

  const [postsData, t, faqItems, blogCategories] = await Promise.all([
    getAllPosts({
      page,
      limit,
      postType: type,
      search: searchQuery || undefined,
      blogCategoryId: blogCategoryFilter,
    }),
    getTranslations({ locale, namespace: "blogPage" }),
    getFaqByPage("blog"),
    getBlogCategories(),
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
  const blogUrl = `${base}/blog`;
  const pageTitle = t("pageTitle");
  
  const pageDescription = t("pageDescription");
  const homeLabel = locale === "az" ? "Ana Səhifə" : "Главная";
  const blogLabel = locale === "az" ? "Bloq" : "Блог";
  const itemList = (posts ?? []).slice(0, 12).map((p) => ({
    name: p.title[locale],
    url: `${base}/blog/${p.slug?.[locale] ?? p.slug?.az ?? p.slug?.ru ?? ""}`,
  }));
  const schemaGraph = buildCollectionPageGraph({
    name: pageTitle,
    description: pageDescription,
    url: blogUrl,
    locale,
    baseUrl,
    breadcrumbItems: [
      { name: homeLabel, url: base },
      { name: blogLabel, url: blogUrl },
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

      <BlogSearch
        placeholderText={t("searchPlaceholder")}
        initialQuery={searchQuery}
      />

      <BlogCategoryFilters
        categories={blogCategories}
        locale={locale}
        title={t("categoriesTitle")}
        allLabel={t("allPosts")}
        activeCategoryId={blogCategoryFilter}
      />

      <PostGrid
        posts={posts}
        locale={locale}
        t={t}
        meta={transformedMeta}
        type={type}
        emptyStateTitle={
          searchQuery
            ? t("noSearchResults")
            : blogCategoryFilter
              ? t("noPostsInCategory")
              : undefined
        }
      />

      {faqItems.length > 0 && (
        <FaqSection items={faqItems} locale={locale} />
      )}
    </div>
  );
}
