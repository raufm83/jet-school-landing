import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import GlossaryPage from "@/components/views/landing/glossary/glossary-page";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { getPageMeta } from "@/utils/api/page-meta";
import { trimMetaTitle, trimMetaDescription, buildHreflangUrl } from "@/utils/seo";
import JsonLd from "@/components/seo/json-ld";
import { buildCollectionPageGraph } from "@/data/site-schema";
import { getFaqByPage } from "@/utils/api/faq";
import FaqSection from "@/components/views/landing/faq/faq-section";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const [t, glossaryT, meta] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata" }),
    getTranslations({ locale, namespace: "glossary" }),
    getPageMeta("glossary", locale),
  ]);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const canonicalUrl = buildHreflangUrl(baseUrl, locale, "glossary");

  const title = meta?.title
    ? trimMetaTitle(meta.title)
    : trimMetaTitle(t("glossaryPageTitle") || "Glossariy");
  const description = meta?.description
    ? trimMetaDescription(meta.description)
    : trimMetaDescription(glossaryT("subtitle") || "IT və proqramlaşdırma terminləri lüğəti");

  const openGraph: Metadata["openGraph"] = {
    title,
    description,
    url: buildHreflangUrl(baseUrl, locale, "glossary"),
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
        az: buildHreflangUrl(baseUrl, "az", "glossary"),
        ru: buildHreflangUrl(baseUrl, "ru", "glossary"),
        "x-default": buildHreflangUrl(baseUrl, "az", "glossary"),
      },
    },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
      },
    },
  };
}

async function getGlossaryCategories() {
  try {
    const res = await fetch(
      `${PUBLIC_API_BASE}/glossary-categories`,
      {
        next: { revalidate: 120 },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch glossary categories");
    }

    return res.json();
  } catch (error) {
    console.error("Error loading glossary categories:", error);
    return [];
  }
}

export default async function GlossaryIndexPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const cookieStore = cookies();
  const language = locale || cookieStore.get("NEXT_LOCALE")?.value || "az";

  const [categories, glossaryT, faqItems] = await Promise.all([
    getGlossaryCategories(),
    getTranslations({ locale: language, namespace: "glossary" }),
    getFaqByPage("glossary"),
  ]);

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const base = language === "az" ? baseUrl : `${baseUrl}/${language}`;
  const glossaryUrl = `${base}/glossary`;

  const pageTitle = glossaryT("title");
  const pageDescription = glossaryT("subtitle");

  const schemaGraph = buildCollectionPageGraph({
    name: pageTitle,
    description: pageDescription,
    url: glossaryUrl,
    locale: language,
    baseUrl,
    breadcrumbItems: [
      { name: language === "az" ? "Ana Səhifə" : "Главная", url: base },
      { name: pageTitle, url: glossaryUrl },
    ],
    itemList: Array.isArray(categories)
      ? categories.slice(0, 30).map((cat: { name: Record<string, string>; slug: string }) => ({
          name: cat.name?.[language] || cat.name?.az || "",
          url: `${glossaryUrl}/category/${cat.slug}`,
        }))
      : undefined,
  });

  return (
    <div>
      <JsonLd data={schemaGraph} />
      <GlossaryPage
        categories={categories}
        language={language}
        title={glossaryT("title")}
        subtitle={glossaryT("subtitle")}
        searchPlaceholder={glossaryT("searchPlaceholder")}
        allTermsText={glossaryT("allTermsText")}
        categoriesTitle={glossaryT("categoriesTitle")}
        termsText={glossaryT("termsText")}
        emptyText={glossaryT("emptyText")}
      />
      {faqItems.length > 0 && (
        <div className="container px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-16">
          <FaqSection items={faqItems} locale={language as "az" | "ru"} />
        </div>
      )}
    </div>
  );
}
