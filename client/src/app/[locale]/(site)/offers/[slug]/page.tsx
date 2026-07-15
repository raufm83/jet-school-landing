import { Locale } from "@/i18n/request";
import { PostType } from "@/types/enums";
import { getAllPosts, getPostDetails } from "@/utils/api/post";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound, permanentRedirect } from "next/navigation";
import { trimMetaTitle, trimMetaDescription, buildHreflangUrl } from "@/utils/seo";
import { getPostImageUrl } from "@/utils/helpers/post";
import { buildImageUrl } from "@/utils/imageUrl";
import SinglePostView from "@/components/views/landing/post/view";
import JsonLd from "@/components/seo/json-ld";
import { buildOfferSinglePageGraph } from "@/data/site-schema";

interface ISinglePostPageProps {
  params: {
    slug: string;
    locale: string;
  };
}

export async function generateStaticParams() {
  try {
    const { items } = await getAllPosts({ page: 1, limit: 1000, postType: PostType.OFFERS });
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

function asLocale(l: string): Locale {
  return l === "ru" ? "ru" : "az";
}

function safeHtmlFragment(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

export default async function SinglePostPage({ params }: ISinglePostPageProps) {
  try {
    const locale = asLocale(params.locale);
    const [data, t] = await Promise.all([
      getPostDetails(params.slug),
      getTranslations("singlePostPage"),
    ]);

    const titleText = data?.title?.[locale];
    const contentRaw = data?.content?.[locale];
    const contentHtml = safeHtmlFragment(contentRaw);

    if (
      !data ||
      !titleText ||
      !contentHtml.trim() ||
      data.postType !== PostType.OFFERS
    ) {
      permanentRedirect(`/${locale}/offers`);
    }

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
    const canonicalUrl = `${baseUrl}/${locale}/offers/${params.slug}`;
    const contentText = contentHtml.replace(/<[^>]*>/g, "");
    const imageUrlRaw = getPostImageUrl(data.imageUrl, locale as Locale);
    const imageUrlFull = imageUrlRaw ? buildImageUrl(imageUrlRaw) : undefined;

    const localeBase = `${baseUrl}/${locale}`;
    const homeLabel = locale === "az" ? "Ana Səhifə" : "Главная";
    const offersLabel = locale === "az" ? "Kampaniyalar" : "Предложения";

    const schemaGraph = buildOfferSinglePageGraph({
      name: titleText,
      description: contentText.slice(0, 300),
      url: canonicalUrl,
      imageUrl: imageUrlFull ?? undefined,
      locale,
      baseUrl,
      breadcrumbItems: [
        { name: homeLabel, url: localeBase },
        { name: offersLabel, url: `${localeBase}/offers` },
        { name: titleText, url: canonicalUrl },
      ],
    });

    return (
      <>
        <JsonLd data={schemaGraph} />
        <SinglePostView post={data} locale={locale} t={t} />
      </>
    );
  } catch {
    permanentRedirect(`/${params.locale}/offers`);
  }
}

export async function generateMetadata({ params }: ISinglePostPageProps): Promise<Metadata> {
  try {
    const data = await getPostDetails(params.slug);
    const locale = asLocale(params.locale);
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");

    const metaTitle = data?.title?.[locale];
    const metaContent = safeHtmlFragment(data?.content?.[locale]);

    if (
      !data ||
      !metaTitle ||
      !metaContent.trim() ||
      data.postType !== PostType.OFFERS
    ) {
      permanentRedirect(`/${params.locale}/offers`);
    }

    const contentText = metaContent.replace(/<[^>]*>/g, "");

    const azSlug = data.slug?.az || params.slug;
    const ruSlug = data.slug?.ru || params.slug;
    const canonicalUrl = buildHreflangUrl(baseUrl, locale, `offers/${locale === "az" ? azSlug : ruSlug}`);

    const title = trimMetaTitle(metaTitle);
    const description = trimMetaDescription(contentText);

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
        languages: {
          az: data.slug?.az ? buildHreflangUrl(baseUrl, "az", `offers/${azSlug}`) : undefined,
          ru: data.slug?.ru ? buildHreflangUrl(baseUrl, "ru", `offers/${ruSlug}`) : undefined,
          "x-default": data.slug?.az ? buildHreflangUrl(baseUrl, "az", `offers/${azSlug}`) : undefined,
        },
      },
      openGraph: {
        title,
        description,
        url: buildHreflangUrl(baseUrl, locale, `offers/${locale === "az" ? azSlug : ruSlug}`),
        images: (() => {
          const url = getPostImageUrl(data.imageUrl, locale);
          return url ? [{ url: buildImageUrl(url) }] : [];
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
          return url ? [buildImageUrl(url)] : [];
        })(),
      },
    };
  } catch {
    permanentRedirect(`/${params.locale}/offers`);
  }
}

export const revalidate = 60;
