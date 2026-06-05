/**
 * JSON-LD schema builders (frontend only).
 * Organization → EducationalOrganization, WebSite, WebPage, BreadcrumbList, Course, Article.
 * Əlaqə məlumatı (email, telefon, ünvan) admin paneldən GET /contact ilə gəlir.
 */
import type { ContactData } from "@/types/contact";

const BASE_URL = (
  typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL
    : "https://jetschool.az"
).replace(/\/+$/, "");

export const SITE_SCHEMA = {
  name: "JET School",
  alternateNames: [
    "Uşaqlar üçün IT, Proqramlaşdırma və Kibertəhlükəsizlik kursları",
  ],
  baseUrl: BASE_URL,
  /** Logo: `optimize:images` PNG-dən WebP yaradır; schema üçün eyni ünvanın .webp variantı */
  logoUrl: `${BASE_URL}/logos/JET_School_Yellowww.webp`,
  /** Favicon: public/favicon.png — brauzer tab və metadata icons üçün (faylı eyni yerdə əvəz edin) */
  faviconUrl: "/favicon.png",
  /** Apple touch icon: public/icon.png (180x180 tövsiyə olunur) */
  iconUrl: "/icon.png",
  description:
    "JET School - Azərbaycanda uşaqlar və yeniyetmələr üçün IT kursları, proqramlaşdırma, robotexnika və texnologiya təhsili.",
  slogan: "Uşaqlar üçün IT, Proqramlaşdırma və Kibertəhlükəsizlik kursları",
  keywords: [
    "IT kursları",
    "proqramlaşdırma",
    "kibertəhlükəsizlik",
    "uşaqlar üçün kurs",
    "robotexnika",
    "JET School",
    "Azərbaycan",
  ],
  brand: { "@type": "Brand" as const, name: "JET School" },
  contact: {
    url: `${BASE_URL}/contact-us`,
  },
  areaServed: { "@type": "Country" as const, name: "Azərbaycan" },
  /** Google axtarışında və paylaşımda görünən şəkil (Open Graph). Fayl: public/og-image.jpg — 1200×630 tövsiyə olunur */
  image: `${BASE_URL}/og-image.jpg`,
  ogImagePath: "/og-image.jpg",
  schemaAddress: {
    az: "Bakı şəhəri, Olimpiya küçəsi 6A",
    ru: "г. Баку, ул. Олимпийская 6А",
  },
} as const;

function getBase(locale: string) {
  return locale === "az" ? SITE_SCHEMA.baseUrl : `${SITE_SCHEMA.baseUrl}/${locale}`;
}

/**
 * Canonical Organization @id — locale-independent.
 * Google treats entities with the same @id as the same entity across all pages.
 * Using a locale-specific base (e.g. /ru/#organization) would create two separate
 * Organization entities in Google's Knowledge Graph.
 */
const CANONICAL_ORG_ID = `${SITE_SCHEMA.baseUrl}/#organization`;

/** URL-də qoşa slashı aradan qaldırır (məs: https://example.com//ru/courses → https://example.com/ru/courses) */
function normalizeUrl(url: string): string {
  return url.replace(/([^:]\/)\/+/g, "$1");
}

/**
 * @context-siz EducationalOrganization node — @graph içinə əlavə etmək üçün.
 * Hər page-specific @graph bu node-u daxil etməlidir ki, validator yalnız 1 container görsün.
 */
export function buildOrgNode(locale: string, contact?: { email?: string; phone?: string } | null): Record<string, unknown> {
  const lang = locale === "az" ? "az" : "ru";
  const streetAddress = SITE_SCHEMA.schemaAddress[lang as "az" | "ru"];
  const node: Record<string, unknown> = {
    "@type": "EducationalOrganization",
    "@id": CANONICAL_ORG_ID,
    name: SITE_SCHEMA.name,
    url: SITE_SCHEMA.baseUrl,
    logo: SITE_SCHEMA.logoUrl,
    description: SITE_SCHEMA.description,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: SITE_SCHEMA.contact.url,
      availableLanguage: ["Azerbaijani", "Russian"],
      ...(contact?.email?.trim() && { email: contact.email.trim() }),
      ...(contact?.phone?.trim() && { telephone: contact.phone.trim() }),
    },
  };
  if (streetAddress) {
    const address = { "@type": "PostalAddress", streetAddress };
    node.address = address;
  }
  return node;
}

/**
 * @context-siz WebSite node — @graph içinə əlavə etmək üçün.
 */
export function buildWebSiteNode(locale: string): Record<string, unknown> {
  const base = getBase(locale);
  const lang = locale === "az" ? "az" : "ru";
  return {
    "@type": "WebSite",
    "@id": `${base}/#website`,
    name: SITE_SCHEMA.name,
    url: base,
    description: SITE_SCHEMA.description,
    publisher: { "@id": CANONICAL_ORG_ID },
    inLanguage: [lang],
  };
}


export function buildOrganizationSchema(locale: string, contact?: ContactData | null) {
  const lang = locale === "az" ? "az" : "ru";
  const email = contact?.email?.trim();
  const telephone = contact?.phone?.trim();
  const streetAddress = SITE_SCHEMA.schemaAddress[lang];
  const addressObj =
    streetAddress ?
      ({ "@type": "PostalAddress" as const, streetAddress })
      : undefined;

  const org: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": CANONICAL_ORG_ID,
    name: SITE_SCHEMA.name,
    alternateName: SITE_SCHEMA.alternateNames,
    url: SITE_SCHEMA.baseUrl,
    logo: SITE_SCHEMA.logoUrl,
    description: SITE_SCHEMA.description,
    slogan: SITE_SCHEMA.slogan,
    keywords: SITE_SCHEMA.keywords.join(", "),
    image: SITE_SCHEMA.image,
    brand: SITE_SCHEMA.brand,
    areaServed: SITE_SCHEMA.areaServed,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: SITE_SCHEMA.contact.url,
      availableLanguage: ["Azerbaijani", "Russian"],
      ...(email && { email }),
      ...(telephone && { telephone }),
    },
    ...(addressObj && { address: addressObj, location: { "@type": "Place" as const, address: addressObj } }),
  };
  return org;
}

export function buildWebSiteSchema(locale: string) {
  const base = getBase(locale);
  const lang = locale === "az" ? "az" : "ru";
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${base}/#website`,
    name: SITE_SCHEMA.name,
    alternateName: SITE_SCHEMA.alternateNames,
    url: base,
    description: SITE_SCHEMA.description,
    publisher: { "@id": CANONICAL_ORG_ID },
    inLanguage: [lang],
  };
}

export function buildSiteSchemaFromText(params: {
  name: string;
  description: string;
  logoUrl: string;
  locale: string;
  baseUrl: string;
}): [object, object] {
  const canonicalBase = params.baseUrl.replace(/\/+$/, "");
  const base = `${canonicalBase}${params.locale === "az" ? "" : `/${params.locale}`}`;
  const org: object = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${canonicalBase}/#organization`,
    name: params.name || undefined,
    url: canonicalBase,
    logo: params.logoUrl || undefined,
    description: params.description || undefined,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: `${canonicalBase}/contact-us`,
      availableLanguage: ["Azerbaijani", "Russian"],
    },
  };
  const web: object = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${base}/#website`,
    name: params.name || undefined,
    url: base,
    description: params.description || undefined,
    publisher: { "@id": `${canonicalBase}/#organization` },
    inLanguage: [params.locale === "az" ? "az" : "ru"],
  };
  return [org, web];
}

export function buildBreadcrumbListSchema(
  _baseUrl: string,
  _locale: string,
  items: { name: string; url: string }[],
  /** BreadcrumbList-ə özünəməxsus @id vermək üçün — WebPage.breadcrumb istinadı */
  breadcrumbId?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    ...(breadcrumbId && { "@id": normalizeUrl(breadcrumbId) }),
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: item.name,
      item: { "@type": "WebPage" as const, "@id": normalizeUrl(item.url), url: normalizeUrl(item.url), name: item.name },
    })),
  };
}

const getLang = (locale: string): "az" | "ru" => (locale === "az" ? "az" : "ru");

/** Homepage: WebPage with about → EducationalOrganization, isPartOf → WebSite */
export function buildHomePageWebPageSchema(params: {
  name: string;
  description?: string | null;
  url: string;
  locale: string;
  baseUrl: string;
}) {
  const base = normalizeUrl(`${params.baseUrl.replace(/\/+$/, "")}${params.locale === "az" ? "" : `/${params.locale}`}`);
  const url = normalizeUrl(params.url);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}/#webpage`,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: getLang(params.locale),
    isPartOf: { "@id": `${base}/#website` },
    about: { "@id": CANONICAL_ORG_ID },
  };
}

export function buildCollectionPageSchema(params: {
  name: string;
  description?: string | null;
  url: string;
  locale: string;
  baseUrl: string;
  itemList?: { name: string; url: string }[];
}) {
  const base = normalizeUrl(`${params.baseUrl.replace(/\/+$/, "")}${params.locale === "az" ? "" : `/${params.locale}`}`);
  const url = normalizeUrl(params.url);
  const page: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: getLang(params.locale),
    isPartOf: { "@id": `${base}/#website` },
  };
  if (params.itemList?.length) {
    page.mainEntity = {
      "@type": "ItemList",
      itemListElement: params.itemList.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        url: normalizeUrl(item.url),
      })),
    };
  }
  return page;
}

/** CollectionPage + BreadcrumbList vahid @graph (siyahı səhifələri üçün).
 *  3 ayrı container: BreadcrumbList, WebPage, CollectionPage */
export function buildCollectionPageGraph(params: {
  name: string;
  description?: string | null;
  url: string;
  locale: string;
  baseUrl: string;
  breadcrumbItems: { name: string; url: string }[];
  itemList?: { name: string; url: string }[];
  primaryImageUrl?: string | null;
}): Record<string, unknown> {
  const base = normalizeUrl(`${params.baseUrl.replace(/\/+$/, "")}${params.locale === "az" ? "" : `/${params.locale}`}`);
  const url = normalizeUrl(params.url);
  const breadcrumbId = `${url}#breadcrumb`;
  const webpageId = `${url}#webpage`;
  const collectionId = `${url}#collection`;

  // 1) BreadcrumbList — ayrı container
  const breadcrumbDoc: Record<string, unknown> = {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: params.breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: { "@type": "WebPage" as const, "@id": normalizeUrl(item.url), url: normalizeUrl(item.url), name: item.name },
    })),
  };

  // 2) WebPage — müstəqil container, heç bir cross-referans yoxdur
  const webPageDoc: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": webpageId,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: getLang(params.locale),
    isPartOf: { "@id": `${base}/#website` },
  };

  if (params.primaryImageUrl?.trim()) {
    webPageDoc.primaryImageOfPage = {
      "@type": "ImageObject",
      "@id": `${url}#primaryimage`,
      url: params.primaryImageUrl,
      contentUrl: params.primaryImageUrl,
    };
  }

  // 3) CollectionPage — müstəqil container, WebPage-ə heç bir istinadı yoxdur
  const collectionDoc: Record<string, unknown> = {
    "@type": "CollectionPage",
    "@id": collectionId,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: getLang(params.locale),
    isPartOf: { "@id": `${base}/#website` },
  };
  if (params.itemList?.length) {
    collectionDoc.mainEntity = {
      "@type": "ItemList",
      itemListElement: params.itemList.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        url: normalizeUrl(item.url),
      })),
    };
  }

  const orgNode = buildOrgNode(params.locale);
  const webSiteNode = buildWebSiteNode(params.locale);
  return {
    "@context": "https://schema.org",
    "@graph": [orgNode, webSiteNode, breadcrumbDoc, webPageDoc, collectionDoc],
  };
}

/** Ana səhifə: WebPage + BreadcrumbList @graph. */
export function buildHomePageGraph(params: {
  name: string;
  description?: string | null;
  url: string;
  locale: string;
  baseUrl: string;
  breadcrumbItems: { name: string; url: string }[];
  primaryImageUrl?: string | null;
}): Record<string, unknown> {
  const base = normalizeUrl(`${params.baseUrl.replace(/\/+$/, "")}${params.locale === "az" ? "" : `/${params.locale}`}`);
  const url = normalizeUrl(params.url);
  const breadcrumbId = `${url}#breadcrumb`;

  const breadcrumbDoc: Record<string, unknown> = {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: params.breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: { "@type": "WebPage" as const, "@id": normalizeUrl(item.url), url: normalizeUrl(item.url), name: item.name },
    })),
  };

  const webPageDoc: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: getLang(params.locale),
    isPartOf: { "@id": `${base}/#website` },
    about: { "@id": CANONICAL_ORG_ID },
  };

  if (params.primaryImageUrl?.trim()) {
    webPageDoc.primaryImageOfPage = {
      "@type": "ImageObject",
      "@id": `${url}#primaryimage`,
      url: params.primaryImageUrl,
      contentUrl: params.primaryImageUrl,
    };
  }

  const orgNode = buildOrgNode(params.locale);
  const webSiteNode = buildWebSiteNode(params.locale);
  return {
    "@context": "https://schema.org",
    "@graph": [orgNode, webSiteNode, breadcrumbDoc, webPageDoc],
  };
}

/** Haqqımızda: AboutPage + BreadcrumbList @graph. */
export function buildAboutPageGraph(params: {
  name: string;
  description?: string | null;
  url: string;
  locale: string;
  baseUrl: string;
  breadcrumbItems: { name: string; url: string }[];
  primaryImageUrl?: string | null;
}): Record<string, unknown> {
  const base = normalizeUrl(`${params.baseUrl.replace(/\/+$/, "")}${params.locale === "az" ? "" : `/${params.locale}`}`);
  const url = normalizeUrl(params.url);
  const breadcrumbId = `${url}#breadcrumb`;

  const breadcrumbDoc: Record<string, unknown> = {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: params.breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: { "@type": "WebPage" as const, "@id": normalizeUrl(item.url), url: normalizeUrl(item.url), name: item.name },
    })),
  };

  // WebPage — müstəqil container, heç bir cross-referans yoxdur
  const webPageDoc: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: getLang(params.locale),
    isPartOf: { "@id": `${base}/#website` },
  };

  if (params.primaryImageUrl?.trim()) {
    webPageDoc.primaryImageOfPage = {
      "@type": "ImageObject",
      "@id": `${url}#primaryimage`,
      url: params.primaryImageUrl,
      contentUrl: params.primaryImageUrl,
    };
  }

  // AboutPage — müstəqil container, WebPage-ə heç bir istinadı yoxdur
  const aboutPageDoc: Record<string, unknown> = {
    "@type": "AboutPage",
    "@id": `${url}#aboutpage`,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: getLang(params.locale),
    isPartOf: { "@id": `${base}/#website` },
    mainEntity: { "@id": CANONICAL_ORG_ID },
  };

  const orgNode = buildOrgNode(params.locale);
  const webSiteNode = buildWebSiteNode(params.locale);
  return {
    "@context": "https://schema.org",
    "@graph": [orgNode, webSiteNode, breadcrumbDoc, webPageDoc, aboutPageDoc],
  };
}

/** Əlaqə: ContactPage + BreadcrumbList @graph. */
export function buildContactPageGraph(params: {
  name: string;
  description?: string | null;
  url: string;
  locale: string;
  baseUrl: string;
  breadcrumbItems: { name: string; url: string }[];
  streetAddress: string;
  email?: string;
  telephone?: string;
  primaryImageUrl?: string | null;
}): Record<string, unknown> {
  const base = normalizeUrl(`${params.baseUrl.replace(/\/+$/, "")}${params.locale === "az" ? "" : `/${params.locale}`}`);
  const url = normalizeUrl(params.url);
  const breadcrumbId = `${url}#breadcrumb`;
  const address = params.streetAddress
    ? { "@type": "PostalAddress" as const, streetAddress: params.streetAddress }
    : undefined;

  const breadcrumbDoc: Record<string, unknown> = {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: params.breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: { "@type": "WebPage" as const, "@id": normalizeUrl(item.url), url: normalizeUrl(item.url), name: item.name },
    })),
  };

  // WebPage — müstəqil container, heç bir cross-referans yoxdur
  const webPageDoc: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: getLang(params.locale),
    isPartOf: { "@id": `${base}/#website` },
  };

  if (params.primaryImageUrl?.trim()) {
    webPageDoc.primaryImageOfPage = {
      "@type": "ImageObject",
      "@id": `${url}#primaryimage`,
      url: params.primaryImageUrl,
      contentUrl: params.primaryImageUrl,
    };
  }

  // ContactPage — müstəqil container, WebPage-ə heç bir istinadı yoxdur
  const contactPageDoc: Record<string, unknown> = {
    "@type": "ContactPage",
    "@id": `${url}#contactpage`,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: getLang(params.locale),
    isPartOf: { "@id": `${base}/#website` },
    mainEntity: {
      "@id": CANONICAL_ORG_ID,
      ...(address && { address }),
    },
  };

  // Pass email/phone to orgNode so contact info is on the EducationalOrganization node
  const orgNode = buildOrgNode(params.locale, {
    email: params.email,
    phone: params.telephone,
  });
  const webSiteNode = buildWebSiteNode(params.locale);
  return {
    "@context": "https://schema.org",
    "@graph": [orgNode, webSiteNode, breadcrumbDoc, webPageDoc, contactPageDoc],
  };
}

export function buildItemPageSchema(params: {
  name: string;
  description?: string | null;
  url: string;
  locale: string;
  baseUrl: string;
  mainEntityId: string;
}) {
  const base = normalizeUrl(`${params.baseUrl.replace(/\/+$/, "")}${params.locale === "az" ? "" : `/${params.locale}`}`);
  const url = normalizeUrl(params.url);
  return {
    "@context": "https://schema.org",
    "@type": ["WebPage", "ItemPage"],
    "@id": `${url}#itempage`,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: getLang(params.locale),
    isPartOf: { "@id": `${base}/#website` },
    mainEntity: { "@id": normalizeUrl(params.mainEntityId) },
  };
}

export function buildAboutPageSchema(params: {
  name: string;
  description?: string | null;
  url: string;
  locale: string;
  baseUrl: string;
}) {
  const base = normalizeUrl(`${params.baseUrl.replace(/\/+$/, "")}${params.locale === "az" ? "" : `/${params.locale}`}`);
  const url = normalizeUrl(params.url);
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${url}#webpage`,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: getLang(params.locale),
    isPartOf: { "@id": `${base}/#website` },
    mainEntity: { "@id": CANONICAL_ORG_ID },
  };
}

export function buildContactPageSchema(params: {
  name: string;
  description?: string | null;
  url: string;
  locale: string;
  baseUrl: string;
  streetAddress: string;
  email?: string;
  telephone?: string;
}) {
  const base = normalizeUrl(`${params.baseUrl.replace(/\/+$/, "")}${params.locale === "az" ? "" : `/${params.locale}`}`);
  const url = normalizeUrl(params.url);
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${url}#webpage`,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: getLang(params.locale),
    isPartOf: { "@id": `${base}/#website` },
    mainEntity: { "@id": CANONICAL_ORG_ID },
  };
}

/** Ümumi WebPage (glossary, gallery, bloq məqalə və s.) — mainEntityId veriləndə WebPage.mainEntity → Article */
export function buildWebPageSchema(params: {
  name: string;
  description?: string | null;
  url: string;
  locale: string;
  baseUrl: string;
  pageType?: "WebPage" | "AboutPage" | "ContactPage";
  mainEntityId?: string;
  /** BreadcrumbList schema @id-si — WebPage.breadcrumb üçün */
  breadcrumbId?: string;
  /** Əsas şəkil URL-i — primaryImageOfPage üçün */
  primaryImageUrl?: string | null;
  datePublished?: string;
  dateModified?: string;
  author?: { name: string } | null;
}) {
  const base = normalizeUrl(`${params.baseUrl.replace(/\/+$/, "")}${params.locale === "az" ? "" : `/${params.locale}`}`);
  const url = normalizeUrl(params.url);
  const type = params.pageType ?? "WebPage";
  const pageTypeArr = Array.isArray(type) ? type : type === "WebPage" ? ["WebPage"] : ["WebPage", type];
  const page: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": pageTypeArr,
    "@id": `${url}#webpage`,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: getLang(params.locale),
    isPartOf: { "@id": `${base}/#website` },
    isAccessibleForFree: true,
  };
  if (params.mainEntityId) page.mainEntity = { "@id": normalizeUrl(params.mainEntityId) };
  if (params.breadcrumbId) page.breadcrumb = { "@id": normalizeUrl(params.breadcrumbId) };
  if (params.primaryImageUrl?.trim()) {
    page.primaryImageOfPage = {
      "@type": "ImageObject",
      "@id": `${url}#primaryimage`,
      url: params.primaryImageUrl,
      contentUrl: params.primaryImageUrl,
    };
  }
  if (params.datePublished) page.datePublished = params.datePublished;
  if (params.dateModified) page.dateModified = params.dateModified;
  if (params.author?.name) {
    page.author = {
      "@type": "Person",
      name: params.author.name,
    };
  }
  return page;
}

/** Tək kurs səhifəsi üçün Course (ItemPage mainEntity) — @id verilməlidir. Provider = EducationalOrganization. */
export function buildCourseSchema(params: {
  name: string;
  description?: string;
  url: string;
  locale: string;
}) {
  const url = normalizeUrl(params.url);
  const courseId = `${url}#course`;
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": courseId,
    name: params.name,
    description: params.description,
    provider: { "@type": "EducationalOrganization", "@id": CANONICAL_ORG_ID },
    url,
    inLanguage: getLang(params.locale),
  };
}

/** Bloq məqaləsi üçün BlogPosting — WebPage ilə mainEntity / mainEntityOfPage əlaqəsi. */
export function buildArticleSchema(params: {
  headline: string;
  description?: string;
  url: string;
  imageUrl?: string | null;
  datePublished?: string;
  dateModified?: string;
  locale: string;
  author?: { name: string; url?: string } | null;
  webPageId: string;
  /** Məqalənin söz sayı */
  wordCount?: number;
  /** Bloq teqləri — keywords kimi istifadə olunur */
  keywords?: string[];
  /** Məqalə bölməsi, məs: "Blog" */
  articleSection?: string;
}) {
  const lang = getLang(params.locale);
  const url = normalizeUrl(params.url);
  const webPageId = normalizeUrl(params.webPageId);
  const articleId = `${url}#article`;

  const image =
    params.imageUrl && params.imageUrl.trim()
      ? {
          "@type": "ImageObject" as const,
          "@id": `${url}#primaryimage`,
          url: params.imageUrl,
          contentUrl: params.imageUrl,
        }
      : undefined;

  // Author: Person varsa Person, yoxdursa Organization-a fallback
  const author = params.author?.name
    ? {
        "@type": "Person" as const,
        "@id": `${SITE_SCHEMA.baseUrl}/#author-${encodeURIComponent(params.author.name)}`,
        name: params.author.name,
        ...(params.author.url && { url: params.author.url }),
      }
    : {
        "@type": "Organization" as const,
        "@id": CANONICAL_ORG_ID,
        name: SITE_SCHEMA.name,
        url: SITE_SCHEMA.baseUrl,
      };

  const publisher = {
    "@type": "Organization" as const,
    "@id": CANONICAL_ORG_ID,
    name: SITE_SCHEMA.name,
    logo: {
      "@type": "ImageObject" as const,
      url: SITE_SCHEMA.logoUrl,
    },
  };

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": articleId,
    headline: params.headline,
    name: params.headline,
    description: params.description,
    url,
    inLanguage: lang,
    isAccessibleForFree: true,
    ...(image && { image }),
    datePublished: params.datePublished,
    dateModified: params.dateModified ?? params.datePublished,
    author,
    publisher,
    mainEntityOfPage: { "@id": webPageId },
    isPartOf: { "@id": webPageId },
    ...(params.wordCount && { wordCount: params.wordCount }),
    ...(params.keywords?.length && { keywords: params.keywords.join(", ") }),
    ...(params.articleSection && { articleSection: params.articleSection }),
  };
}

/**
 * Post single səhifəsi üçün @graph — BreadcrumbList və WebPage.
 * CreativeWork (Article) node-u yoxdur — məzmun xassələri WebPage daxilində.
 */
export function buildPostSinglePageSchemas(params: {
  headline: string;
  description?: string;
  url: string;
  imageUrl?: string | null;
  datePublished?: string;
  dateModified?: string;
  locale: string;
  baseUrl: string;
  author?: { name: string; url?: string } | null;
  wordCount?: number;
  keywords?: string[];
  articleSection?: string;
  breadcrumbItems: { name: string; url: string }[];
}): Record<string, unknown> {
  const base = normalizeUrl(`${params.baseUrl.replace(/\/+$/, "")}${params.locale === "az" ? "" : `/${params.locale}`}`);
  const lang = getLang(params.locale);
  const url = normalizeUrl(params.url);

  const webpageId = `${url}#webpage`;
  const breadcrumbId = `${url}#breadcrumb`;

  const image =
    params.imageUrl?.trim()
      ? {
          "@type": "ImageObject" as const,
          "@id": `${url}#primaryimage`,
          url: params.imageUrl,
          contentUrl: params.imageUrl,
        }
      : undefined;

  const author = params.author?.name
    ? {
        "@type": "Person" as const,
        name: params.author.name,
        ...(params.author.url && { url: params.author.url }),
      }
    : {
        "@type": "Organization" as const,
        name: SITE_SCHEMA.name,
        url: SITE_SCHEMA.baseUrl,
      };

  const publisher = {
    "@type": "Organization" as const,
    name: SITE_SCHEMA.name,
    logo: { "@type": "ImageObject" as const, url: SITE_SCHEMA.logoUrl },
  };

  const keywordsArr = Array.isArray(params.keywords) ? params.keywords.filter((k) => typeof k === "string" && k.trim()) : [];
  const keywordsStr = keywordsArr.length ? keywordsArr.join(", ") : undefined;

  const breadcrumbDoc: Record<string, unknown> = {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: params.breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: { "@type": "WebPage" as const, "@id": normalizeUrl(item.url), url: normalizeUrl(item.url), name: item.name },
    })),
  };

  const webPageDoc: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": webpageId,
    name: params.headline,
    headline: params.headline,
    description: params.description,
    url,
    inLanguage: lang,
    isPartOf: { "@id": `${base}/#website` },
    isAccessibleForFree: true,
    author,
    publisher,
    ...(image && { image }),
    datePublished: params.datePublished,
    dateModified: params.dateModified ?? params.datePublished,
    ...(params.wordCount && { wordCount: params.wordCount }),
    ...(keywordsStr && { keywords: keywordsStr }),
    ...(params.articleSection && { articleSection: params.articleSection }),
    ...(image && {
      primaryImageOfPage: {
        "@type": "ImageObject",
        "@id": `${url}#primaryimage`,
        url: params.imageUrl,
        contentUrl: params.imageUrl,
      },
    }),
  };

  const orgNode = buildOrgNode(params.locale);
  const webSiteNode = buildWebSiteNode(params.locale);
  return {
    "@context": "https://schema.org",
    "@graph": [orgNode, webSiteNode, breadcrumbDoc, webPageDoc],
  };
}

/**
 * Blog single səhifə üçün tam @graph (struktur):
 *
 *   WebPage
 *    ├── BreadcrumbList
 *    └── Article
 *           ├── Person (author)
 *           ├── Organization (publisher)
 *           └── ImageObject
 *
 * Container-lar: Article, WebPage, BreadcrumbList, Person, Organization, ImageObject
 */
export function buildBlogSinglePageGraph(params: {
  headline: string;
  description?: string;
  url: string;
  imageUrl?: string | null;
  datePublished?: string;
  dateModified?: string;
  locale: string;
  baseUrl: string;
  author?: { name: string; url?: string } | null;
  wordCount?: number;
  keywords?: string[];
  articleSection?: string;
  breadcrumbItems: { name: string; url: string }[];
}): Record<string, unknown> {
  const base = normalizeUrl(`${params.baseUrl.replace(/\/+$/, "")}${params.locale === "az" ? "" : `/${params.locale}`}`);
  const lang = getLang(params.locale);
  const url = normalizeUrl(params.url);
  const orgId = CANONICAL_ORG_ID;
  const webpageId = `${url}#webpage`;
  const breadcrumbId = `${url}#breadcrumb`;
  const articleId = `${url}#article`;
  const imageId = `${url}#primaryimage`;
  const authorId = `${url}#author`;

  const hasAuthor = Boolean(params.author?.name?.trim());
  const imageObj =
    params.imageUrl?.trim()
      ? { "@type": "ImageObject" as const, "@id": imageId, url: params.imageUrl, contentUrl: params.imageUrl }
      : null;

  // 1) BreadcrumbList
  const breadcrumbDoc: Record<string, unknown> = {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: params.breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: { "@type": "WebPage" as const, "@id": normalizeUrl(item.url), url: normalizeUrl(item.url), name: item.name },
    })),
  };

  // 2) WebPage — müstəqil container, mainEntity → Article, BreadcrumbList-ə referans yoxdur
  const webPageDoc: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": webpageId,
    name: params.headline,
    description: params.description ?? undefined,
    url,
    inLanguage: lang,
    isPartOf: { "@id": `${base}/#website` },
    mainEntity: { "@id": articleId },
  };
  if (imageObj) webPageDoc.primaryImageOfPage = { "@id": imageId };

  // 3) BlogPosting — author → Person (@id), publisher → Organization (@id), image → ImageObject (@id)
  const articleDoc: Record<string, unknown> = {
    "@type": "BlogPosting",
    "@id": articleId,
    headline: params.headline,
    name: params.headline,
    description: params.description ?? undefined,
    url,
    inLanguage: lang,
    mainEntityOfPage: { "@id": webpageId },
    publisher: { "@id": orgId },
    datePublished: params.datePublished ?? undefined,
    dateModified: params.dateModified ?? params.datePublished ?? undefined,
  };
  if (hasAuthor) articleDoc.author = { "@id": authorId };
  if (imageObj) articleDoc.image = { "@id": imageId };
  if (params.wordCount != null) articleDoc.wordCount = params.wordCount;
  if (params.keywords?.length) articleDoc.keywords = params.keywords.join(", ");
  if (params.articleSection) articleDoc.articleSection = params.articleSection;

  // 4) Person (author) — varsa tam node
  const personDoc: Record<string, unknown> | null = hasAuthor
    ? {
        "@type": "Person",
        "@id": authorId,
        name: params.author!.name!.trim(),
        ...(params.author!.url && { url: params.author!.url }),
      }
    : null;

  const orgNode = buildOrgNode(params.locale);
  const webSiteNode = buildWebSiteNode(params.locale);
  const graph: Record<string, unknown>[] = [
    orgNode,
    webSiteNode,
    breadcrumbDoc,
    webPageDoc,
    articleDoc,
  ];
  if (personDoc) graph.push(personDoc);
  if (imageObj) graph.push(imageObj);

  return { "@context": "https://schema.org", "@graph": graph };
}

/**
 * Events single səhifə üçün tam @graph:
 * - Event (əsas tədbir, location→Place, organizer→Organization, offers→Offer, image→ImageObject)
 * - WebPage (mainEntity→Event, breadcrumb→BreadcrumbList, primaryImageOfPage varsa)
 * - BreadcrumbList
 * - Place (event location, address→PostalAddress)
 * - Organization (organizer)
 * - Offer (bilet/qiymət, varsa; itemOffered→Event)
 * - ImageObject (tədbir şəkli, varsa)
 */
export function buildEventSinglePageGraph(params: {
  name: string;
  description?: string;
  url: string;
  imageUrl?: string | null;
  startDate?: string;
  endDate?: string;
  locale: string;
  baseUrl: string;
  breadcrumbItems: { name: string; url: string }[];
  /** Tədbir ünvanı (boşdursa sayt ünvanı) */
  locationAddress?: string | null;
  /** Bilet qiyməti / mətn (məs: "Pulsuz" və ya "50 AZN") */
  offerPrice?: string | null;
}): Record<string, unknown> {
  const base = normalizeUrl(`${params.baseUrl.replace(/\/+$/, "")}${params.locale === "az" ? "" : `/${params.locale}`}`);
  const lang = getLang(params.locale);
  const url = normalizeUrl(params.url);
  const webpageId = `${url}#webpage`;
  const breadcrumbId = `${url}#breadcrumb`;
  const eventId = `${url}#event`;
  const placeId = `${url}#place`;
  const addressId = `${url}#address`;
  const orgId = CANONICAL_ORG_ID;
  const offerId = `${url}#offer`;
  const imageId = `${url}#primaryimage`;

  const hasImage = Boolean(params.imageUrl?.trim());
  const imageObj = hasImage
    ? {
        "@type": "ImageObject" as const,
        "@id": imageId,
        url: params.imageUrl!,
        contentUrl: params.imageUrl!,
      }
    : null;

  const streetAddress = (params.locationAddress?.trim() || SITE_SCHEMA.schemaAddress[lang]) as string;

  // 1) BreadcrumbList
  const breadcrumbDoc: Record<string, unknown> = {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: params.breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: { "@type": "WebPage" as const, "@id": normalizeUrl(item.url), url: normalizeUrl(item.url), name: item.name },
    })),
  };

  // 2) WebPage — müstəqil container, BreadcrumbList-ə referans yoxdur
  const webPageDoc: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": webpageId,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: lang,
    isPartOf: { "@id": `${base}/#website` },
    mainEntity: { "@id": eventId },
  };
  if (imageObj) webPageDoc.primaryImageOfPage = { "@id": imageId };

  // 3) Event
  const eventDoc: Record<string, unknown> = {
    "@type": "Event",
    "@id": eventId,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: lang,
    location: { "@id": placeId },
    organizer: { "@id": orgId },
  };
  if (params.startDate) eventDoc.startDate = params.startDate;
  if (params.endDate) eventDoc.endDate = params.endDate;
  if (imageObj) eventDoc.image = { "@id": imageId };
  if (params.offerPrice?.trim()) eventDoc.offers = { "@id": offerId };

  // 4) Place (event location)
  const postalAddressDoc: Record<string, unknown> = {
    "@type": "PostalAddress",
    "@id": addressId,
    streetAddress,
  };
  const placeDoc: Record<string, unknown> = {
    "@type": "Place",
    "@id": placeId,
    name: SITE_SCHEMA.name,
    address: { "@id": addressId },
  };

  // 6) Offer (bilet/qiymət) — yalnız qiymət varsa
  const offerDoc: Record<string, unknown> | null =
    params.offerPrice?.trim()
      ? {
          "@type": "Offer",
          "@id": offerId,
          url,
          itemOffered: { "@id": eventId },
          price: params.offerPrice!.trim(),
          priceCurrency: "AZN",
          availability: "https://schema.org/InStock",
        }
      : null;

  const orgNode = buildOrgNode(params.locale);
  const webSiteNode = buildWebSiteNode(params.locale);
  const graph: Record<string, unknown>[] = [
    orgNode,
    webSiteNode,
    breadcrumbDoc,
    webPageDoc,
    eventDoc,
    placeDoc,
    postalAddressDoc,
  ];
  if (offerDoc) graph.push(offerDoc);
  if (imageObj) graph.push(imageObj);

  return { "@context": "https://schema.org", "@graph": graph };
}

/**
 * Offers single səhifə üçün tam @graph (struktur):
 *
 *   WebPage
 *    ├── BreadcrumbList
 *    └── Product
 *           ├── Offer
 *           ├── Organization (seller / brand)
 *           └── ImageObject
 *
 * Container-lar: Product, Offer, WebPage, BreadcrumbList, Organization, ImageObject
 */
export function buildOfferSinglePageGraph(params: {
  name: string;
  description?: string;
  url: string;
  imageUrl?: string | null;
  locale: string;
  baseUrl: string;
  breadcrumbItems: { name: string; url: string }[];
  /** Qiymət mətn (məs: "50 AZN" və ya "Pulsuz") */
  price?: string | null;
}): Record<string, unknown> {
  const base = normalizeUrl(`${params.baseUrl.replace(/\/+$/, "")}${params.locale === "az" ? "" : `/${params.locale}`}`);
  const lang = getLang(params.locale);
  const url = normalizeUrl(params.url);
  const orgId = CANONICAL_ORG_ID;
  const webpageId = `${url}#webpage`;
  const breadcrumbId = `${url}#breadcrumb`;
  const productId = `${url}#product`;
  const offerId = `${url}#offer`;
  const imageId = `${url}#primaryimage`;

  const hasImage = Boolean(params.imageUrl?.trim());
  const imageObj = hasImage
    ? {
        "@type": "ImageObject" as const,
        "@id": imageId,
        url: params.imageUrl!,
        contentUrl: params.imageUrl!,
      }
    : null;

  // 1) BreadcrumbList
  const breadcrumbDoc: Record<string, unknown> = {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: params.breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: { "@type": "WebPage" as const, "@id": normalizeUrl(item.url), url: normalizeUrl(item.url), name: item.name },
    })),
  };

  // 2) WebPage — müstəqil container, BreadcrumbList-ə referans yoxdur
  const webPageDoc: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": webpageId,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: lang,
    isPartOf: { "@id": `${base}/#website` },
    mainEntity: { "@id": productId },
  };
  if (imageObj) webPageDoc.primaryImageOfPage = { "@id": imageId };

  // 3) Product — offers → Offer, brand → Organization, image → ImageObject
  // Note: Product does not support inLanguage or url in schema.org spec
  const productDoc: Record<string, unknown> = {
    "@type": "Product",
    "@id": productId,
    name: params.name,
    description: params.description ?? undefined,
    brand: { "@id": orgId },
    offers: { "@id": offerId },
  };
  if (imageObj) productDoc.image = { "@id": imageId };

  // 4) Offer — itemOffered → Product, seller → Organization
  const offerDoc: Record<string, unknown> = {
    "@type": "Offer",
    "@id": offerId,
    url,
    itemOffered: { "@id": productId },
    seller: { "@id": orgId },
    availability: "https://schema.org/InStock",
  };
  if (params.price?.trim()) {
    offerDoc.price = params.price.trim();
    offerDoc.priceCurrency = "AZN";
  }

  const orgNode = buildOrgNode(params.locale);
  const webSiteNode = buildWebSiteNode(params.locale);
  const graph: Record<string, unknown>[] = [
    orgNode,
    webSiteNode,
    breadcrumbDoc,
    webPageDoc,
    productDoc,
    offerDoc,
  ];
  if (imageObj) graph.push(imageObj);

  return { "@context": "https://schema.org", "@graph": graph };
}

/**
 * News single səhifə üçün tam @graph:
 * - BreadcrumbList (səhifə breadcrumb)
 * - WebPage (səhifə konteyneri, mainEntity → NewsArticle)
 * - NewsArticle (əsas məqalə, author → Person, publisher → Organization)
 * - Organization (nəşriyyatçı, həmişə tam node @id ilə)
 * - Person (müəllif, varsa tam node @id ilə)
 * - ImageObject (varsa şəkil)
 */
export function buildNewsSinglePageGraph(params: {
  headline: string;
  description?: string;
  url: string;
  imageUrl?: string | null;
  datePublished?: string;
  dateModified?: string;
  locale: string;
  baseUrl: string;
  author?: { name: string } | null;
  wordCount?: number;
  keywords?: string[];
  breadcrumbItems: { name: string; url: string }[];
}): Record<string, unknown> {
  const base = normalizeUrl(`${params.baseUrl.replace(/\/+$/, "")}${params.locale === "az" ? "" : `/${params.locale}`}`);
  const lang = getLang(params.locale);
  const url = normalizeUrl(params.url);
  const orgId = CANONICAL_ORG_ID;
  const webpageId = `${url}#webpage`;
  const breadcrumbId = `${url}#breadcrumb`;
  const newsArticleId = `${url}#newsarticle`;
  const imageId = `${url}#primaryimage`;
  const authorId = `${url}#author`;

  const hasAuthor = Boolean(params.author?.name?.trim());
  const imageObj =
    params.imageUrl?.trim()
      ? { "@type": "ImageObject" as const, "@id": imageId, url: params.imageUrl, contentUrl: params.imageUrl }
      : undefined;

  // 1) BreadcrumbList
  const breadcrumbDoc: Record<string, unknown> = {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: params.breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: { "@type": "WebPage" as const, "@id": normalizeUrl(item.url), url: normalizeUrl(item.url), name: item.name },
    })),
  };

  // 2) WebPage — müstəqil container, BreadcrumbList-ə referans yoxdur
  const webPageDoc: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": webpageId,
    name: params.headline,
    description: params.description ?? undefined,
    url,
    inLanguage: lang,
    isPartOf: { "@id": `${base}/#website` },
    mainEntity: { "@id": newsArticleId },
  };
  if (imageObj) webPageDoc.primaryImageOfPage = { "@id": imageId };

  // 3) NewsArticle — author və publisher yalnız @id ilə istinad
  const newsArticleDoc: Record<string, unknown> = {
    "@type": ["Article", "NewsArticle"],
    "@id": newsArticleId,
    headline: params.headline,
    name: params.headline,
    description: params.description ?? undefined,
    url,
    inLanguage: lang,
    mainEntityOfPage: { "@id": webpageId },
    publisher: { "@id": orgId },
    datePublished: params.datePublished ?? undefined,
    dateModified: params.dateModified ?? params.datePublished ?? undefined,
  };
  if (hasAuthor) newsArticleDoc.author = { "@id": authorId };
  if (imageObj) newsArticleDoc.image = { "@id": imageId };
  if (params.wordCount != null) newsArticleDoc.wordCount = params.wordCount;
  if (params.keywords?.length) newsArticleDoc.keywords = params.keywords.join(", ");

  // 4) Person (author) — varsa tam node
  const personDoc: Record<string, unknown> | null = hasAuthor
    ? {
        "@type": "Person",
        "@id": authorId,
        name: params.author!.name!.trim(),
      }
    : null;

  const orgNode = buildOrgNode(params.locale);
  const webSiteNode = buildWebSiteNode(params.locale);
  const graph: Record<string, unknown>[] = [
    orgNode,
    webSiteNode,
    breadcrumbDoc,
    webPageDoc,
    newsArticleDoc,
  ];
  if (personDoc) graph.push(personDoc);
  if (imageObj) graph.push(imageObj);

  return { "@context": "https://schema.org", "@graph": graph };
}

/** Glossary tək termin səhifəsi üçün DefinedTerm schema. @id verilməlidir ki, ItemPage.mainEntity istinad edə bilsin. */
export function buildDefinedTermSchema(params: {
  name: string;
  description?: string | null;
  url: string;
  locale: string;
  baseUrl?: string;
}) {
  const url = normalizeUrl(params.url);
  const base = params.baseUrl
    ? normalizeUrl(`${params.baseUrl.replace(/\/+$/, "")}${params.locale === "az" ? "" : `/${params.locale}`}`)
    : SITE_SCHEMA.baseUrl;
  const termSetUrl = `${base}/glossary/terms`;
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "@id": `${url}#term`,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: getLang(params.locale),
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: SITE_SCHEMA.name + " Texnoloji Lüğət",
      url: normalizeUrl(termSetUrl),
    },
  };
}

/**
 * Course Single səhifəsi üçün 3 tam müstəqil JSON-LD sənədi (hər biri ayrı <script> tegi).
 * - ItemPage  →  mainEntity: Course, breadcrumb: BreadcrumbList
 * - BreadcrumbList  →  tam müstəqil sənəd
 * - Course  →  hasCourseInstance ilə courseMode; image, teaches, typicalAgeRange dəstəyi
 * Qaytarır: [itemPageDoc, breadcrumbListDoc, courseDoc]
 */
const COURSE_WORKLOAD: Record<"az" | "ru", string> = {
  az: "Həftədə 3 dərs keçirilir",
  ru: "3 занятия в неделю",
};

/**
 * Course Single səhifəsi üçün 3 tam müstəqil JSON-LD sənədi (hər biri ayrı <script> tegi).
 * - ItemPage  →  mainEntity: Course
 * - BreadcrumbList  →  son item @type: Course (kursun özü)
 * - Course  →  teaches tag-lərdən dinamik, courseWorkload dilə uyğun mətn
 * Qaytarır: [itemPageDoc, breadcrumbListDoc, courseDoc]
 */
export function buildCoursePageCombinedSchema(params: {
  name: string;
  description?: string;
  url: string;
  locale: string;
  baseUrl: string;
  breadcrumbItems: { name: string; url: string }[];
  educationalLevel?: string;
  courseMode?: "onsite" | "online" | "hybrid";
  /** Kursun şəkli (tam URL) */
  imageUrl?: string;
  /** Kursun təqdim etdiyi mövzular / teqlər — avtomatik data.newTags-dan gəlir */
  tags?: string[];
  /** Yaş aralığı, məs: "7-12" */
  ageRange?: string;
}): [Record<string, unknown>, Record<string, unknown>, Record<string, unknown>] {
  const base = getBase(params.locale);
  const lang = getLang(params.locale);
  const url = normalizeUrl(params.url);
  const webpageId = `${url}#webpage`;
  const courseId = `${url}#course`;
  const breadcrumbId = `${url}#breadcrumb`;
  const ctx = "https://schema.org";

  // 1) ItemPage — mainEntity @id-siz yazılır: validator Course sənədini inline expand etmir
  const itemPageDoc: Record<string, unknown> = {
    "@context": ctx,
    "@type": "ItemPage",
    "@id": webpageId,
    url,
    name: params.name,
    description: params.description ?? undefined,
    inLanguage: lang,
    isPartOf: { "@id": `${base}/#website` },
    mainEntity: { "@type": "Course", name: params.name },
  };

  // 2) BreadcrumbList — bütün itemlər @type: WebPage (standart breadcrumb semantic)
  // Son item-i Course kimi yazmaq validator-da Course ilə merge-ə səbəb olurdu → 2 container görünürdü
  const breadcrumbListDoc: Record<string, unknown> = {
    "@context": ctx,
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: params.breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: { "@type": "WebPage" as const, "@id": normalizeUrl(item.url), url: normalizeUrl(item.url), name: item.name },
    })),
  };

  // 3) Course — offers ləğv edilib; teaches tag-lərdən dinamik; courseWorkload dilə uyğun mətn
  const courseDoc: Record<string, unknown> = {
    "@context": ctx,
    "@type": "Course",
    "@id": courseId,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: lang,
    provider: {
      "@type": "EducationalOrganization",
      name: SITE_SCHEMA.name,
      url: base,
    },
  };

  if (params.educationalLevel) courseDoc.educationalLevel = params.educationalLevel;
  if (params.ageRange) courseDoc.typicalAgeRange = params.ageRange;

  // teaches — tag-lərdən dinamik olaraq doldurulur, tək sətirdə vergüllə ayrılır
  if (params.tags?.length) courseDoc.teaches = params.tags.join(", ");

  if (params.imageUrl) {
    courseDoc.image = { "@type": "ImageObject", url: params.imageUrl };
  }

  if (params.courseMode) {
    courseDoc.hasCourseInstance = {
      "@type": "CourseInstance",
      courseMode: params.courseMode,
      courseWorkload: COURSE_WORKLOAD[lang],
    };
  }

  return [itemPageDoc, breadcrumbListDoc, courseDoc];
}

/** Tək kurs səhifəsi — BreadcrumbList + ItemPage + Course vahid @graph. */
export function buildCoursePageGraph(params: {
  name: string;
  description?: string;
  url: string;
  locale: string;
  baseUrl: string;
  breadcrumbItems: { name: string; url: string }[];
  educationalLevel?: string;
  courseMode?: "onsite" | "online" | "hybrid";
  imageUrl?: string;
  tags?: string[];
  ageRange?: string;
}): Record<string, unknown> {
  const base = getBase(params.locale);
  const lang = getLang(params.locale);
  const url = normalizeUrl(params.url);
  const webpageId = `${url}#webpage`;
  const courseId = `${url}#course`;
  const breadcrumbId = `${url}#breadcrumb`;

  const breadcrumbDoc: Record<string, unknown> = {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: params.breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: { "@type": "WebPage" as const, "@id": normalizeUrl(item.url), url: normalizeUrl(item.url), name: item.name },
    })),
  };

  // WebPage — müstəqil container, heç bir cross-referans yoxdur
  const itemPageDoc: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": webpageId,
    url,
    name: params.name,
    description: params.description ?? undefined,
    inLanguage: lang,
    isPartOf: { "@id": `${base}/#website` },
  };

  // ItemPage — müstəqil container, kursun məzmun konteyneri
  const itemPageContentDoc: Record<string, unknown> = {
    "@type": "ItemPage",
    "@id": `${url}#itempage`,
    url,
    name: params.name,
    description: params.description ?? undefined,
    inLanguage: lang,
    isPartOf: { "@id": `${base}/#website` },
    mainEntity: { "@id": courseId },
  };

  const courseDoc: Record<string, unknown> = {
    "@type": "Course",
    "@id": courseId,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: lang,
    provider: { "@type": "EducationalOrganization", "@id": CANONICAL_ORG_ID, name: SITE_SCHEMA.name, url: SITE_SCHEMA.baseUrl },
  };
  if (params.educationalLevel) courseDoc.educationalLevel = params.educationalLevel;
  if (params.ageRange) courseDoc.typicalAgeRange = params.ageRange;
  if (params.tags?.length) courseDoc.teaches = params.tags.join(", ");
  if (params.imageUrl) courseDoc.image = { "@type": "ImageObject", url: params.imageUrl };
  if (params.courseMode) {
    courseDoc.hasCourseInstance = {
      "@type": "CourseInstance",
      courseMode: params.courseMode,
      courseWorkload: COURSE_WORKLOAD[lang],
    };
  }

  const orgNode = buildOrgNode(params.locale);
  const webSiteNode = buildWebSiteNode(params.locale);
  return {
    "@context": "https://schema.org",
    "@graph": [orgNode, webSiteNode, breadcrumbDoc, itemPageDoc, itemPageContentDoc, courseDoc],
  };
}

/** Glossary tək termin — BreadcrumbList + ItemPage + DefinedTerm vahid @graph. */
export function buildGlossaryTermPageGraph(params: {
  name: string;
  description?: string | null;
  url: string;
  locale: string;
  baseUrl: string;
  breadcrumbItems: { name: string; url: string }[];
}): Record<string, unknown> {
  const base = normalizeUrl(`${params.baseUrl.replace(/\/+$/, "")}${params.locale === "az" ? "" : `/${params.locale}`}`);
  const url = normalizeUrl(params.url);
  const termId = `${url}#term`;
  const webpageId = `${url}#itempage`;
  const breadcrumbId = `${url}#breadcrumb`;
  const termSetUrl = `${base}/glossary/terms`;

  const breadcrumbDoc: Record<string, unknown> = {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: params.breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: { "@type": "WebPage" as const, "@id": normalizeUrl(item.url), url: normalizeUrl(item.url), name: item.name },
    })),
  };

  const itemPageDoc: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": webpageId,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: getLang(params.locale),
    isPartOf: { "@id": `${base}/#website` },
    mainEntity: { "@id": termId },
  };

  const itemPageContentDoc: Record<string, unknown> = {
    "@type": "ItemPage",
    "@id": `${url}#contentpage`,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: getLang(params.locale),
    isPartOf: { "@id": `${base}/#website` },
    mainEntity: { "@id": termId },
  };

  const definedTermDoc: Record<string, unknown> = {
    "@type": "DefinedTerm",
    "@id": termId,
    name: params.name,
    description: params.description ?? undefined,
    url,
    inLanguage: getLang(params.locale),
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: SITE_SCHEMA.name + " Texnoloji Lüğət",
      url: normalizeUrl(termSetUrl),
    },
  };

  const orgNode = buildOrgNode(params.locale);
  const webSiteNode = buildWebSiteNode(params.locale);
  return {
    "@context": "https://schema.org",
    "@graph": [orgNode, webSiteNode, breadcrumbDoc, itemPageDoc, itemPageContentDoc, definedTermDoc],
  };
}
