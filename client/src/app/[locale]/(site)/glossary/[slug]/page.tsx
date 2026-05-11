import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import GlossaryTermDetail from "@/components/views/landing/glossary/glossary-term-detail";
import GlossaryBreadcrumbSetter from "@/components/views/landing/glossary/glossary-breadcrumb-setter";
import JsonLd from "@/components/seo/json-ld";
import { buildGlossaryTermPageGraph } from "@/data/site-schema";

interface PageProps {
  params: {
    locale: string;
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const language = params.locale || "az";
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");

  try {
    const term = await getGlossaryTerm(params.slug);
    const canonical = `${baseUrl}/${language}/glossary/${params.slug}/`;

    return {
      title: `${term.term[language]}`,
      description: term.definition[language]?.substring(0, 160) || "",
      alternates: {
        canonical,
        languages: {
          az: `${baseUrl}/az/glossary/${params.slug}/`,
          ru: `${baseUrl}/ru/glossary/${params.slug}/`,
          "x-default": `${baseUrl}/az/glossary/${params.slug}/`,
        },
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Glossary Term",
      description: "IT terminology glossary",
      robots: { index: false },
    };
  }
}

async function getGlossaryTerm(slug: string) {
  try {
    const res = await fetch(
      `${PUBLIC_API_BASE}/glossary/slug/${slug}`,
      {
        cache: "no-store",
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
  const language = params.locale || "az";

  let term;
  try {
    term = await getGlossaryTerm(params.slug);
  } catch (error) {
    console.error("Error fetching glossary term:", error);
    notFound();
  }

  const termContent = term.term[language];
  const definitionContent = term.definition[language];

  const categoryName = term.category?.name[language];
  const categorySlug = term.category?.slug[language];

  const translations = {
    az: {
      categoryText: "Kateqoriya",
      relatedTermsText: "Əlaqəli terminlər",
    },
    ru: {
      categoryText: "Категория",
      relatedTermsText: "Связанные термины",
    },
  };

  const t = translations[language as keyof typeof translations];

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const base = language === "az" ? baseUrl : `${baseUrl}/${language}`;
  const glossaryUrl = `${base}/glossary`;
  const termUrl = `${glossaryUrl}/${params.slug}`;
  const homeLabel = language === "az" ? "Ana Səhifə" : "Главная";
  const glossaryLabel = language === "az" ? "Glossariy" : "Глоссарий";

  const breadcrumbItems: { name: string; url: string }[] = [
    { name: homeLabel, url: base },
    { name: glossaryLabel, url: glossaryUrl },
  ];
  if (categoryName && categorySlug) {
    breadcrumbItems.push({ name: categoryName, url: `${glossaryUrl}/category/${categorySlug}` });
  }
  breadcrumbItems.push({ name: termContent, url: termUrl });

  const schemaGraph = buildGlossaryTermPageGraph({
    name: termContent,
    description: definitionContent?.substring(0, 300),
    url: termUrl,
    locale: language,
    baseUrl,
    breadcrumbItems,
  });

  return (
    <div className="container mx-auto px-4 py-12">
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
        categoryText={t.categoryText}
        relatedTermsText={t.relatedTermsText}
        language={language}
      />
    </div>
  );
}
