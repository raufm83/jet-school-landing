import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import GlossaryAlphabetNav from "@/components/views/landing/glossary/glossary-alphabet-nav";
import GlossaryPagination from "@/components/views/landing/glossary/glossary-pagination";
import GlossaryTermList from "@/components/views/landing/glossary/glossary-term-list";
import JsonLd from "@/components/seo/json-ld";
import { buildCollectionPageGraph } from "@/data/site-schema";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { getPageMeta } from "@/utils/api/page-meta";
import { trimMetaTitle, trimMetaDescription, buildHreflangUrl } from "@/utils/seo";
import { normalizeGlossaryLetterParam } from "@/utils/glossary-letter";

/** Middleware ilə eyni: URL-də `letter` sorğu açarı varsa indekslənməsin */
function hasLetterSearchParam(searchParams: { letter?: string }): boolean {
  return searchParams.letter !== undefined;
}

export async function generateMetadata({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { letter?: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const glossaryT = await getTranslations({
    locale,
    namespace: "glossary.terms",
  });

  const meta = await getPageMeta("glossary/terms", locale);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(
    /\/+$/,
    ""
  );

  const hasLetterFilter = hasLetterSearchParam(searchParams);
  const letterDisplay =
    normalizeGlossaryLetterParam(
      typeof searchParams.letter === "string" ? searchParams.letter : undefined
    ) ?? null;

  const termsIndexCanonical = buildHreflangUrl(baseUrl, locale, "glossary/terms");

  const canonicalUrl = hasLetterFilter
    ? termsIndexCanonical
    : (letterDisplay != null
        ? `${termsIndexCanonical}?letter=${encodeURIComponent(letterDisplay)}`
        : termsIndexCanonical);

  const pageTitle =
    letterDisplay != null
      ? t("glossaryTermsLetterPageTitle", { letter: letterDisplay }) ||
        `"${letterDisplay}" ilə başlayan terminlər`
      : t("glossaryTermsPageTitle") || "Bütün Terminlər";

  const title = meta?.title
    ? trimMetaTitle(meta.title)
    : trimMetaTitle(pageTitle);
  const description = meta?.description
    ? trimMetaDescription(meta.description)
    : trimMetaDescription(
        glossaryT("description") || "JET School glossariy lüğətində bütün IT terminləri"
      );

  const openGraph: Metadata["openGraph"] = {
    title,
    description,
    url: buildHreflangUrl(baseUrl, locale, "glossary/terms"),
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
        az: buildHreflangUrl(baseUrl, "az", "glossary/terms"),
        ru: buildHreflangUrl(baseUrl, "ru", "glossary/terms"),
        "x-default": buildHreflangUrl(baseUrl, "az", "glossary/terms"),
      },
    },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: hasLetterFilter
      ? {
          index: false,
          follow: true,
          googleBot: { index: false, follow: true },
        }
      : {
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

interface SearchParams {
  letter?: string;
  page?: string;
}

async function getGlossaryTerms(letter?: string, page = 1, limit = 24) {
  try {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    if (letter) {
      params.append("letter", letter);
    }

    const res = await fetch(
      `${PUBLIC_API_BASE}/glossary?${params.toString()}`,
      {
        next: { revalidate: 120 },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch glossary terms");
    }

    return res.json();
  } catch (error) {
    console.error("Error loading glossary terms:", error);
    return { items: [], meta: { total: 0, page: 1, limit, totalPages: 0 } };
  }
}

export default async function GlossaryTermsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: SearchParams;
}) {
  const cookieStore = cookies();
  const language = locale || cookieStore.get("NEXT_LOCALE")?.value || "az";

  const letter = normalizeGlossaryLetterParam(searchParams.letter);
  const page = parseInt(searchParams.page || "1", 10);
  const suppressIndexedExtras = hasLetterSearchParam(searchParams);

  const { items: terms, meta } = await getGlossaryTerms(letter, page, 24);
  
  const glossaryT = await getTranslations({
    locale: language,
    namespace: "glossary.terms",
  });
  const paginationT = await getTranslations({
    locale: language,
    namespace: "glossary.pagination",
  });

  const title = letter
    ? `"${letter}" ilə başlayan terminlər`
    : glossaryT("title");

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(
    /\/+$/,
    ""
  );
  const base = language === "az" ? baseUrl : `${baseUrl}/${language}`;
  const letterQs = letter ? `?letter=${encodeURIComponent(letter)}` : "";
  const termsUrl =
    language === "az"
      ? `${baseUrl}/glossary/terms/${letterQs}`
      : `${baseUrl}/${language}/glossary/terms/${letterQs}`;
  const homeLabel = language === "az" ? "Ana Səhifə" : "Главная";
  const glossaryLabel = language === "az" ? "Texnoloji Lüğət" : "Технологический Глоссарий";
  const termsLabel = language === "az" ? "Terminlər" : "Термины";

  const schemaGraph = buildCollectionPageGraph({
    name: title,
    description: glossaryT("description") || "JET School glossariy lüğətində bütün IT terminləri",
    url: termsUrl,
    locale: language,
    baseUrl,
    breadcrumbItems: [
      { name: homeLabel, url: base },
      { name: glossaryLabel, url: `${base}/glossary` },
      { name: termsLabel, url: termsUrl },
    ],
    itemList: terms.map((term: { slug?: string | { az?: string; ru?: string }; term?: { az?: string; ru?: string } }) => {
      const slug =
        typeof term.slug === "string"
          ? term.slug
          : term.slug?.[language as "az" | "ru"] ?? term.slug?.az ?? "";
      const name = term.term?.[language as "az" | "ru"] ?? term.term?.az ?? "";
      return { name, url: `${base}/glossary/term/${slug}` };
    }),
  });

  return (
    <div className="container mx-auto px-4 py-12">
      {!suppressIndexedExtras ? <JsonLd data={schemaGraph} /> : null}
      <GlossaryAlphabetNav language={language} allText={glossaryT("allText")} />

      <GlossaryTermList
        terms={terms}
        title={title}
        categoryText={glossaryT("categoryText")}
        language={language}
        emptyText={glossaryT("emptyText")}
      />

      {meta.totalPages > 1 && (
        <GlossaryPagination
          currentPage={page}
          totalPages={meta.totalPages}
          previousText={paginationT("previous")}
          nextText={paginationT("next")}
        />
      )}
    </div>
  );
}
