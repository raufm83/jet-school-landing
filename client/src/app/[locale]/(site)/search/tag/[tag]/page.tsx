import Breadcrumbs from "@/components/views/landing/bread-crumbs/bread-crumbs";
import PostGrid from "@/components/views/landing/post/grid";
import { Locale } from "@/i18n/request";
import { getPostsByTag } from "@/utils/api/post";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { trimMetaTitle, trimMetaDescription, ensureTrailingSlash } from "@/utils/seo";

interface PageProps {
  params: { locale: string; tag: string };
  searchParams: { page?: string };
}

const MAX_TAG_LEN = 120;

function normalizeTagParam(raw: string): string {
  try {
    const decoded = decodeURIComponent(raw);
    return decoded.trim().slice(0, MAX_TAG_LEN);
  } catch {
    return raw.trim().slice(0, MAX_TAG_LEN);
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tag = normalizeTagParam(params.tag);
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "tagSearchPage" });
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const pathSeg = encodeURIComponent(tag);
  const canonicalUrl = ensureTrailingSlash(`${baseUrl}/${locale}/search/tag/${pathSeg}`);
  const title = trimMetaTitle(t("metaTitle", { tag }));
  const description = trimMetaDescription(t("metaDescription", { tag }));
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: { title, description, url: canonicalUrl, type: "website" },
  };
}

export default async function PostsByTagPage({ params, searchParams }: PageProps) {
  const tag = normalizeTagParam(params.tag);
  if (!tag) notFound();

  const locale = params.locale as Locale;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 12;

  const [postsData, tTag, tBlog] = await Promise.all([
    getPostsByTag(tag, page, limit),
    getTranslations({ locale, namespace: "tagSearchPage" }),
    getTranslations({ locale, namespace: "blogPage" }),
  ]);

  const { items: posts, meta } = postsData;
  const transformedMeta = {
    page: meta.page,
    limit: meta.limit,
    totalItems: meta.total,
    totalPages: meta.totalPages,
  };

  const paginationBasePath = `/search/tag/${encodeURIComponent(tag)}`;

  return (
    <div className="container min-w-0 py-12 md:py-20">
      <Breadcrumbs dynamicTitle={tag} />
      <div className="mb-10 mt-6 text-center sm:mt-8">
        <h1 className="mb-3 font-bold text-jsblack text-2xl sm:text-3xl md:text-4xl">
          {tTag("pageTitle", { tag })}
        </h1>
      </div>
      <PostGrid
        posts={posts ?? []}
        locale={locale}
        t={tBlog}
        meta={transformedMeta}
        paginationBasePath={paginationBasePath}
        emptyStateTitle={tTag("noResults")}
      />
    </div>
  );
}
