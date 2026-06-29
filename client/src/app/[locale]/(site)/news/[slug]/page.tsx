import { Locale } from "@/i18n/request";
import { PostType } from "@/types/enums";
import { getAllPosts, getPostDetails } from "@/utils/api/post";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { trimMetaTitle, trimMetaDescription, buildHreflangUrl } from "@/utils/seo";
import { getPostImageUrl } from "@/utils/helpers/post";
import SinglePostView from "@/components/views/landing/post/view";
import JsonLd from "@/components/seo/json-ld";
import { buildNewsSinglePageGraph } from "@/data/site-schema";

interface ISinglePostPageProps {
  params: {
    slug: string;
    locale: string;
  };
}

export async function generateStaticParams() {
  try {
    const { items } = await getAllPosts({ page: 1, limit: 1000, postType: PostType.NEWS });
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

export default async function SinglePostPage({ params }: ISinglePostPageProps) {
  const locale = params.locale as Locale;
  setRequestLocale(locale);

  try {
    const [data, t] = await Promise.all([
      getPostDetails(params.slug),
      getTranslations("singlePostPage"),
    ]);

    if (
      !data ||
      !data.title[locale] ||
      !data.content[locale] ||
      data.postType !== PostType.NEWS
    ) {
      notFound();
    }

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
    const cdn = process.env.NEXT_PUBLIC_CDN_URL || "";
    const canonicalUrl = `${baseUrl}/${locale}/news/${params.slug}`;
    const contentText = data.content[locale].replace(/<[^>]*>/g, "");
    const imageUrlRaw = getPostImageUrl(data.imageUrl, locale as Locale);
    const imageUrlFull = imageUrlRaw ? (cdn ? `${cdn.replace(/\/+$/, "")}/${imageUrlRaw.replace(/^\/+/, "")}` : imageUrlRaw) : undefined;

    const wordCount = contentText.trim().split(/\s+/).filter(Boolean).length;
    const localeBase = `${baseUrl}/${locale}`;
    const homeLabel = locale === "az" ? "Ana Səhifə" : "Главная";
    const newsLabel = locale === "az" ? "Xəbərlər" : "Новости";

    const schemaGraph = buildNewsSinglePageGraph({
      headline: data.title[locale],
      description: contentText.slice(0, 300),
      url: canonicalUrl,
      imageUrl: imageUrlFull ?? undefined,
      datePublished: (data as { createdAt?: string })?.createdAt,
      dateModified: (data as { updatedAt?: string })?.updatedAt,
      locale,
      baseUrl,
      author: data.author ? { name: data.author.name } : undefined,
      wordCount,
      keywords: Array.isArray((data as { tags?: unknown }).tags) ? (data as { tags: string[] }).tags : ((data as { tags?: { az?: string[]; ru?: string[] } }).tags?.[locale] ?? []),
      breadcrumbItems: [
        { name: homeLabel, url: localeBase },
        { name: newsLabel, url: `${localeBase}/news` },
        { name: data.title[locale], url: canonicalUrl },
      ],
    });

    return (
      <>
        <JsonLd data={schemaGraph} />
        <SinglePostView post={data} locale={locale} t={t} />
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
      data.postType !== PostType.NEWS
    ) {
      return {
        title: "Not Found",
        description: "The requested news was not found",
        robots: { index: false },
      };
    }

    const contentText = data.content[locale].replace(/<[^>]*>/g, "");

    const azSlug = data.slug?.az || params.slug;
    const ruSlug = data.slug?.ru || params.slug;
    const canonicalUrl = buildHreflangUrl(baseUrl, locale, `news/${locale === "az" ? azSlug : ruSlug}`);

    const title = trimMetaTitle(data.title[locale]);
    const description = trimMetaDescription(contentText);

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
        languages: {
          az: buildHreflangUrl(baseUrl, "az", `news/${azSlug}`),
          ru: buildHreflangUrl(baseUrl, "ru", `news/${ruSlug}`),
          "x-default": buildHreflangUrl(baseUrl, "az", `news/${azSlug}`),
        },
      },
      openGraph: {
        title,
        description,
        url: buildHreflangUrl(baseUrl, locale, `news/${locale === "az" ? azSlug : ruSlug}`),
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

