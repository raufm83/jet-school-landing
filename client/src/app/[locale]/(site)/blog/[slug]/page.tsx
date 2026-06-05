import { Locale } from "@/i18n/request";
import { PostType } from "@/types/enums";
import { Post } from "@/types/post";
import { getAllPosts, getPostDetails, getPostsByType } from "@/utils/api/post";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { trimMetaTitle, trimMetaDescription, buildCanonicalUrl, buildHreflangUrl } from "@/utils/seo";
import { getPostImageUrl } from "@/utils/helpers/post";
import SinglePostView from "@/components/views/landing/post/view";
import JsonLd from "@/components/seo/json-ld";
import { buildBlogSinglePageGraph } from "@/data/site-schema";

interface ISinglePostPageProps {
  params: {
    slug: string;
    locale: string;
  };
  searchParams?: {
    page?: string;
    q?: string;
  };
}

export async function generateStaticParams() {
  try {
    const { items } = await getAllPosts({ page: 1, limit: 1000, postType: PostType.BLOG });
    const locales: Locale[] = ["az", "ru"];
    return locales.flatMap((locale) =>
      items
        .filter((item) => item.slug && item.slug[locale])
        .map((item) => ({
          locale,
          slug: item.slug[locale]!,
        }))
    );
  } catch {
    return [];
  }
}

export default async function SinglePostPage({
  params,
  searchParams = {},
}: ISinglePostPageProps) {
  const locale = params.locale as Locale;
  setRequestLocale(locale);

  if (params.slug === "undefined") {
    const qs = new URLSearchParams();
    if (searchParams.page) qs.set("page", searchParams.page);
    if (searchParams.q) qs.set("q", searchParams.q);
    const tail = qs.toString();
    redirect(
      tail ? `/${locale}/blog/?${tail}` : `/${locale}/blog/`
    );
  }

  try {
    const [data, t] = await Promise.all([
      getPostDetails(params.slug),
      getTranslations("singlePostPage"),
    ]);

    if (
      !data ||
      !data.title[locale] ||
      !data.content[locale] ||
      data.postType !== PostType.BLOG
    ) {
      notFound();
    }

    let relatedPosts: Post[] = [];
    try {
      const { items } = await getPostsByType(PostType.BLOG, 1, 20);
      const currentId = data.id;
      relatedPosts = (items ?? [])
        .filter((p) => p.id !== currentId)
        .slice(0, 6);
    } catch {
      relatedPosts = [];
    }

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
    const cdn = process.env.NEXT_PUBLIC_CDN_URL || "";
    const canonicalUrl = `${baseUrl}/${locale}/blog/${params.slug}`;
    const contentText = data.content[locale].replace(/<[^>]*>/g, "");
    const imageUrlRaw = getPostImageUrl(data.imageUrl, locale as Locale);
    const imageUrlFull = imageUrlRaw
      ? cdn
        ? `${cdn.replace(/\/+$/, "")}/${imageUrlRaw.replace(/^\/+/, "")}`
        : imageUrlRaw
      : undefined;

    const wordCount = contentText.trim().split(/\s+/).filter(Boolean).length;
    const articleSection = locale === "az" ? "Bloq" : "Блог";
    const localeBase = `${baseUrl}/${locale}`;
    const homeLabel = locale === "az" ? "Ana Səhifə" : "Главная";
    const blogLabel = locale === "az" ? "Bloq" : "Блог";

    const schemaGraph = buildBlogSinglePageGraph({
      headline: data.title[locale],
      description: contentText.slice(0, 300),
      url: canonicalUrl,
      imageUrl: imageUrlFull ?? undefined,
      datePublished: data.createdAt,
      dateModified: data.updatedAt,
      locale,
      baseUrl,
      author: data.author ? { name: data.author.name } : undefined,
      wordCount,
      keywords: Array.isArray(data.tags) ? data.tags : (data.tags?.[locale] ?? []),
      articleSection,
      breadcrumbItems: [
        { name: homeLabel, url: localeBase },
        { name: blogLabel, url: `${localeBase}/blog` },
        { name: data.title[locale], url: canonicalUrl },
      ],
    });

    return (
      <>
        <JsonLd data={schemaGraph} />
        <SinglePostView post={data} locale={locale} t={t} relatedPosts={relatedPosts} />
      </>
    );
  } catch {
    notFound();
  }
}

export async function generateMetadata({ params }: ISinglePostPageProps): Promise<Metadata> {
  try {
    const data = await getPostDetails(params.slug);
    const locale = params.locale as Locale;
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");

    if (
      !data || 
      !data.title[locale] || 
      !data.content[locale] || 
      data.postType !== PostType.BLOG
    ) {
      return {
        title: "Not Found",
        description: "The requested blog post was not found",
        robots: { index: false },
      };
    }

    const contentText = data.content[locale].replace(/<[^>]*>/g, "");

    const azSlug = data.slug?.az || params.slug;
    const ruSlug = data.slug?.ru || params.slug;
    const canonicalUrl = buildCanonicalUrl(baseUrl, `blog/${azSlug}`);

    const title = trimMetaTitle(data.title[locale]);
    const description = trimMetaDescription(contentText);

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
        languages: {
          az: data.slug.az ? buildHreflangUrl(baseUrl, "az", `blog/${azSlug}`) : undefined,
          ru: data.slug.ru ? buildHreflangUrl(baseUrl, "ru", `blog/${ruSlug}`) : undefined,
          "x-default": baseUrl,
        },
      },
      openGraph: {
        title,
        description,
        url: buildHreflangUrl(baseUrl, locale, `blog/${locale === "az" ? azSlug : ruSlug}`),
        images: (() => {
          const url = getPostImageUrl(data.imageUrl, locale);
          const cdn = process.env.NEXT_PUBLIC_CDN_URL || "";
          return url ? [{ url: `${cdn}/${url}` }] : [];
        })(),
        type: "article",
        locale: locale === "az" ? "az_AZ" : "ru_RU",
        alternateLocale: locale === "az" ? "ru_RU" : "az_AZ",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: (() => {
          const url = getPostImageUrl(data.imageUrl, locale);
          const cdn = process.env.NEXT_PUBLIC_CDN_URL || "";
          return url ? [`${cdn}/${url}`] : [];
        })(),
      },
    };
  } catch {
    return {
      title: "Error",
      description: "Failed to load post details",
      robots: { index: false },
    };
  }
}

export const revalidate = 60;
