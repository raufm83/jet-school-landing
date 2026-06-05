import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import GlossaryTermDetail from "@/components/views/landing/glossary/glossary-term-detail";
import GlossaryBreadcrumbSetter from "@/components/views/landing/glossary/glossary-breadcrumb-setter";
import CoursesSlider from "@/components/views/landing/single-course/courses-slider";
import JsonLd from "@/components/seo/json-ld";
import { buildGlossaryTermPageGraph } from "@/data/site-schema";
import { getAllCourses } from "@/utils/api/course";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { trimMetaTitle, trimMetaDescription, buildCanonicalUrl, buildHreflangUrl } from "@/utils/seo";

interface PageProps {
  params: {
    locale: string;
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");

  let termName = "";
  let termDefinition = "";
  try {
    const res = await fetch(
      `${PUBLIC_API_BASE}/glossary/slug/${slug}`
    );
    if (res.ok) {
      const term = await res.json();
      termName = term.term[locale] || "";
      termDefinition = term.definition[locale]
        ? term.definition[locale].replace(/<[^>]*>/g, "")
        : "";
    }
  } catch (error) {
    console.error("Error fetching term:", error);
  }

  const pageTitle = termName ? `${termName}` : "Glossariy Termini";
  const defaultDescription = t("glossaryTermDefaultDescription") || "IT və proqramlaşdırma termini haqqında məlumat";

  const canonicalUrl = buildCanonicalUrl(baseUrl, `glossary/term/${slug}`);

  const title = trimMetaTitle(pageTitle);
  const description = trimMetaDescription(termDefinition || defaultDescription);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        az: buildHreflangUrl(baseUrl, "az", `glossary/term/${slug}`),
        ru: buildHreflangUrl(baseUrl, "ru", `glossary/term/${slug}`),
        "x-default": baseUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: buildHreflangUrl(baseUrl, locale, `glossary/term/${slug}`),
      type: "article",
      locale: locale === "az" ? "az_AZ" : "ru_RU",
      alternateLocale: locale === "az" ? "ru_RU" : "az_AZ",
    },
    twitter: {
      card: "summary",
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

async function getGlossaryTerm(slug: string) {
  try {
    const res = await fetch(
      `${PUBLIC_API_BASE}/glossary/slug/${slug}`,
      {
        next: { revalidate: 120 },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch glossary term");
    }

    return res.json();
  } catch (error) {
    console.error("Error loading glossary term:", error);
    throw error;
  }
}

export default async function GlossaryTermPage({ params }: PageProps) {
  const { locale, slug } = params;
  const cookieStore = cookies();
  const language = locale || cookieStore.get("NEXT_LOCALE")?.value || "az";

  let term;
  try {
    term = await getGlossaryTerm(slug);
  } catch (error) {
    console.error("Error fetching term:", error);
    notFound();
  }

  const termContent = term.term[language];
  const definitionContent = term.definition[language];

  const categoryName = term.category?.name[language];
  const categorySlug = term.category?.slug[language];

  const glossaryT = await getTranslations({
    locale: language,
    namespace: "glossary.term",
  });

  const courses = await getAllCourses({});

  const courseTitle = language === "az" ? "IT Sahəsini öyrənməyə başla" : "Начни изучать IT уже сегодня";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az";
  const base = language === "az" ? baseUrl : `${baseUrl}/${language}`;
  const termUrl = `${base}/glossary/term/${slug}`;
  const homeLabel = language === "az" ? "Ana Səhifə" : "Главная";
  const glossaryLabel = language === "az" ? "Texnoloji Lüğət" : "Технологический Глоссарий";
  const termsLabel = language === "az" ? "Terminlər" : "Термины";

  const schemaGraph = buildGlossaryTermPageGraph({
    name: termContent,
    description: definitionContent ? definitionContent.replace(/<[^>]*>/g, "").slice(0, 500) : undefined,
    url: termUrl,
    locale: language,
    baseUrl,
    breadcrumbItems: [
      { name: homeLabel, url: base },
      { name: glossaryLabel, url: `${base}/glossary` },
      { name: termsLabel, url: `${base}/glossary/terms` },
      { name: termContent, url: termUrl },
    ],
  });

  return (
    <div className="container flex flex-col gap-8 lg:gap-4 mx-auto px-4 py-12">
      <JsonLd data={schemaGraph} />
      <GlossaryBreadcrumbSetter
        categoryName={categoryName || null}
        categorySlug={categorySlug || null}
        termTitle={termContent}
      />
      <GlossaryTermDetail
        term={termContent}
        definition={definitionContent}
        categoryName={categoryName}
        categorySlug={categorySlug}
        relatedTerms={term.relatedTermsData || []}
        categoryText={glossaryT("categoryText")}
        relatedTermsText={glossaryT("relatedTermsText")}
        language={language}
      />
      <CoursesSlider courses={courses} locale={language as "az" | "ru"} title={courseTitle} />
    </div>
  );
}
