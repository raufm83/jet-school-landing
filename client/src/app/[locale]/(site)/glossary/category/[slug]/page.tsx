import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import GlossaryTermList from "@/components/views/landing/glossary/glossary-term-list";
import { getTranslations } from "next-intl/server";
import { trimMetaTitle, trimMetaDescription, buildHreflangUrl } from "@/utils/seo";
import JsonLd from "@/components/seo/json-ld";
import { buildCollectionPageGraph } from "@/data/site-schema";

interface PageProps {
  params: {
    locale: string;
    slug: string;
  };
  searchParams: {
    page?: string;
  };
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Metadata" });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az";

  let categoryName = "";
  try {
    const res = await fetch(
      `${PUBLIC_API_BASE}/glossary-categories/slug/${slug}`
    );
    if (res.ok) {
      const category = await res.json();
      categoryName = category.name[locale] || "";
    }
  } catch (error) {
    console.error("Error fetching category:", error);
  }

  const pageTitle = categoryName
    ? `${categoryName}`
    : "Glossariy Kateqoriyası";

  const canonicalUrl = buildHreflangUrl(baseUrl, locale, `glossary/category/${slug}`);

  const defaultDescription = t("glossaryCategoryDescription", { category: categoryName }) ||
    `JET School glossariy lüğətində ${categoryName} kateqoriyasına aid terminlər`;

  const title = trimMetaTitle(pageTitle);
  const description = trimMetaDescription(defaultDescription);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        az: buildHreflangUrl(baseUrl.replace(/\/+$/, ""), "az", `glossary/category/${slug}`),
        ru: buildHreflangUrl(baseUrl.replace(/\/+$/, ""), "ru", `glossary/category/${slug}`),
        "x-default": baseUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: buildHreflangUrl(baseUrl.replace(/\/+$/, ""), locale, `glossary/category/${slug}`),
      type: "website",
      locale: locale === "az" ? "az_AZ" : "ru_RU",
      alternateLocale: locale === "az" ? "ru_RU" : "az_AZ",
    },
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

async function getGlossaryCategory(slug: string) {
  try {
    const res = await fetch(
      `${PUBLIC_API_BASE}/glossary-categories/slug/${slug}`,
      {
        next: { revalidate: 120 },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch glossary category");
    }

    return res.json();
  } catch (error) {
    console.error("Error loading glossary category:", error);
    throw error;
  }
}

async function getTermsByCategory(categoryId: string, page = 1, limit = 24) {
  try {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    const res = await fetch(
      `${PUBLIC_API_BASE}/glossary/category/${categoryId}?${params.toString()}`,
      {
        next: { revalidate: 120 },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch glossary terms");
    }

    return res.json();
  } catch (error) {
    console.error("Error loading glossary terms by category:", error);
    return { items: [], meta: { total: 0, page: 1, limit, totalPages: 0 } };
  }
}

export default async function GlossaryCategoryPage({
  params,
  searchParams,
}: PageProps) {
  const cookieStore = cookies();
  const language = params.locale || cookieStore.get("NEXT_LOCALE")?.value || "az";

  const page = parseInt(searchParams.page || "1", 10);

  let category;
  try {
    category = await getGlossaryCategory(params.slug);
  } catch (error) {
    console.error("Error fetching glossary category:", error);
    notFound();
  }

  const { items: terms, meta } = await getTermsByCategory(category.id, page);

  const translations = {
    az: {
      title: `${category.name[language]} kateqoriyası`,
      categoryText: "Kateqoriya",
      emptyText: "Bu kateqoriyada termin tapılmadı",
      searchPlaceholder: "Termin axtar...",
    },
    ru: {
      title: `Категория ${category.name[language]}`,
      categoryText: "Категория",
      emptyText: "В этой категории терминов не найдено",
      searchPlaceholder: "Поиск термина...",
    },
  };

  const t = translations[language as keyof typeof translations];

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const base = language === "az" ? baseUrl : `${baseUrl}/${language}`;
  const glossaryUrl = `${base}/glossary`;
  const categoryUrl = `${glossaryUrl}/category/${params.slug}`;
  const categoryName = category.name[language] || "";
  const glossaryLabel = language === "az" ? "Glossariy" : "Глоссарий";
  const homeLabel = language === "az" ? "Ana Səhifə" : "Главная";

  const schemaGraph = buildCollectionPageGraph({
    name: t.title,
    url: categoryUrl,
    locale: language,
    baseUrl,
    breadcrumbItems: [
      { name: homeLabel, url: base },
      { name: glossaryLabel, url: glossaryUrl },
      { name: categoryName, url: categoryUrl },
    ],
    itemList: Array.isArray(terms)
      ? terms.slice(0, 30).map((term: { term: Record<string, string>; slug: string | Record<string, string> }) => ({
          name: term.term?.[language] || term.term?.az || "",
          url: `${glossaryUrl}/term/${typeof term.slug === "string" ? term.slug : term.slug?.[language] || term.slug?.az || ""}`,
        }))
      : undefined,
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <JsonLd data={schemaGraph} />

      <GlossaryTermList
        terms={terms}
        categoryName={category.name[language]}
        title={t.title}
        categoryText={t.categoryText}
        language={language}
        emptyText={t.emptyText}
      />

      {meta.totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          {/* Your pagination component */}
        </div>
      )}
    </div>
  );
}
