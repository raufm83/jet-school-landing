import { NextResponse } from "next/server";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import { getAllPosts } from "@/utils/api/post";
import { Locale } from "@/i18n/request";
import { getReviewsPathSegment } from "@/i18n/routing";
import { getAllCourses } from "@/utils/api/course";
import { PostType } from "@/types/enums";
import { ensureTrailingSlash } from "@/utils/seo";

interface GlossaryCategory {
  id: string;
  name: { az: string; ru: string };
  slug: { az: string; ru: string };
  createdAt: string;
  updatedAt: string;
}
interface GlossaryTerm {
  id: string;
  term: { az: string; ru: string };
  slug: { az: string; ru: string };
  categoryId: string;
  published: boolean;
  category: { name: { az: string; ru: string } };
}


export const dynamic = "force-dynamic";

async function getGlossaryCategories(): Promise<GlossaryCategory[]> {
  try {
    const response = await fetch(
      `${PUBLIC_API_BASE}/glossary-categories?limit=10000`,
      { headers: { accept: "*/*" }, cache: "no-store" } // <-- no-store
    );
    if (!response.ok) throw new Error(`Failed: ${response.status}`);
    const data = await response.json();
    return data.items || [];
  } catch (e) {
    console.error("Error fetching glossary categories:", e);
    return [];
  }
}

async function getGlossaryTerms(): Promise<GlossaryTerm[]> {
  try {
    const response = await fetch(
      `${PUBLIC_API_BASE}/glossary/brief?limit=10000`,
      { headers: { accept: "*/*" }, cache: "no-store" } // <-- no-store
    );
    if (!response.ok) throw new Error(`Failed: ${response.status}`);
    const data = await response.json();
    return data.items || [];
  } catch (e) {
    console.error("Error fetching glossary terms:", e);
    return [];
  }
}

interface VacancySitemapRow {
  slug?: { az?: unknown; ru?: unknown };
  createdAt?: string;
  updatedAt?: string;
}

async function getVacanciesForSitemap(): Promise<VacancySitemapRow[]> {
  try {
    const response = await fetch(`${PUBLIC_API_BASE}/vacancies`, {
      headers: { accept: "*/*" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Failed: ${response.status}`);
    const data: unknown = await response.json();
    if (Array.isArray(data)) return data as VacancySitemapRow[];
    if (
      data &&
      typeof data === "object" &&
      Array.isArray((data as { items?: unknown }).items)
    ) {
      return (data as { items: VacancySitemapRow[] }).items;
    }
    return [];
  } catch (e) {
    console.error("Error fetching vacancies for sitemap:", e);
    return [];
  }
}

function vacancySlugForLocale(v: VacancySitemapRow, lang: Locale): string | null {
  const raw = v.slug?.[lang];
  const s = typeof raw === "string" ? raw.trim() : "";
  return s || null;
}

export async function GET() {
  const languages = ["az", "ru"] as const;
  const baseUrl = "https://jetschool.az";

  const staticRoutes = [
    "/",
    "/about-us",
    "/projects",
    "/gallery",
    "/contact-us",
    "/courses",
    "/news",
    "/blog",
    "/events",
    "/offers",
    "/reviews",
    "/glossary",
    "/glossary/terms",
    "/vacancies",
  ];

  const nowISO = new Date().toISOString();

  const staticSitemapEntries = staticRoutes.flatMap((route) =>
    languages.map((lang) => ({
      url: `${baseUrl}/${lang}${
        route === "/"
          ? ""
          : route === "/reviews"
            ? `/${getReviewsPathSegment(lang)}`
            : route
      }`,
      lastModified: nowISO,
      changeFrequency:
        route === "/news" || route === "/blog" || route === "/glossary"
          ? "daily"
          : route === "/projects" || route === "/gallery"
            ? "weekly"
            : "monthly",
      priority:
        route === "/"
          ? 1
          : route === "/about-us"
            ? 0.8
            : route === "/contact-us"
              ? 0.7
              : route === "/news" || route === "/blog" || route === "/glossary"
                ? 0.9
                : 0.5,
    }))
  );

  const postSitemapEntries: any[] = [];
  const blogSitemapEntries: any[] = [];
  const eventSitemapEntries: any[] = [];
  const offerSitemapEntries: any[] = [];
  const courseSitemapEntries: any[] = [];
  const glossaryCategorySitemapEntries: any[] = [];
  const glossaryTermSitemapEntries: any[] = [];
  const vacancySitemapEntries: any[] = [];

  try {
    const [
      newsResult,
      blogsResult,
      eventsResult,
      offersResult,
      coursesResult,
      glossaryCategories,
      glossaryTerms,
      vacanciesList,
    ] = await Promise.all([
      getAllPosts({ page: 1, limit: 10000, postType: PostType.NEWS }).catch(() => ({ items: [] })),
      getAllPosts({ page: 1, limit: 10000, postType: PostType.BLOG }).catch(() => ({ items: [] })),
      getAllPosts({ page: 1, limit: 10000, postType: PostType.EVENT }).catch(() => ({ items: [] })),
      getAllPosts({ page: 1, limit: 10000, postType: PostType.OFFERS }).catch(() => ({ items: [] })),
      getAllCourses({ page: 1, limit: 10000 }).catch(() => ({ items: [] })),
      getGlossaryCategories(),
      getGlossaryTerms(),
      getVacanciesForSitemap(),
    ]);

    for (const lang of languages) {
      for (const post of newsResult.items || []) {
        if (post.slug?.[lang as Locale]) {
          postSitemapEntries.push({
            url: `${baseUrl}/${lang}/news/${encodeURIComponent(post.slug[lang as Locale])}`,
            lastModified: new Date(post.updatedAt ?? post.createdAt ?? Date.now()).toISOString(),
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }

      for (const blog of blogsResult.items || []) {
        if (blog.slug?.[lang as Locale]) {
          blogSitemapEntries.push({
            url: `${baseUrl}/${lang}/blog/${encodeURIComponent(blog.slug[lang as Locale])}`,
            lastModified: new Date(blog.updatedAt ?? blog.createdAt ?? Date.now()).toISOString(),
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }

      for (const event of eventsResult.items || []) {
        if (event.slug?.[lang as Locale]) {
          eventSitemapEntries.push({
            url: `${baseUrl}/${lang}/events/${encodeURIComponent(event.slug[lang as Locale])}`,
            lastModified: new Date(event.updatedAt ?? event.createdAt ?? Date.now()).toISOString(),
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }

      for (const offer of offersResult.items || []) {
        if (offer.slug?.[lang as Locale]) {
          offerSitemapEntries.push({
            url: `${baseUrl}/${lang}/offers/${encodeURIComponent(offer.slug[lang as Locale])}`,
            lastModified: new Date(offer.updatedAt ?? offer.createdAt ?? Date.now()).toISOString(),
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }

      for (const course of (coursesResult.items || [])) {
        if (course.slug?.[lang as Locale]) {
          courseSitemapEntries.push({
            url: `${baseUrl}/${lang}/course/${encodeURIComponent(course.slug[lang as Locale])}`,
            lastModified: new Date(course.updatedAt ?? course.createdAt ?? Date.now()).toISOString(),
            changeFrequency: "weekly",
            priority: 0.8,
          });
        }
      }

      for (const category of glossaryCategories) {
        if (category.slug?.[lang as Locale]) {
          glossaryCategorySitemapEntries.push({
            url: `${baseUrl}/${lang}/glossary/category/${encodeURIComponent(category.slug[lang as Locale])}`,
            lastModified: new Date(category.updatedAt ?? category.createdAt ?? Date.now()).toISOString(),
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }

      for (const term of glossaryTerms) {
        if (term.published && term.slug?.[lang as Locale]) {
          glossaryTermSitemapEntries.push({
            url: `${baseUrl}/${lang}/glossary/term/${encodeURIComponent(term.slug[lang as Locale])}`,
            lastModified: nowISO,
            changeFrequency: "monthly",
            priority: 0.6,
          });
        }
      }

      const vacanciesSafe = Array.isArray(vacanciesList) ? vacanciesList : [];
      for (const v of vacanciesSafe) {
        const slug = vacancySlugForLocale(v, lang as Locale);
        if (!slug) continue;
        vacancySitemapEntries.push({
          url: ensureTrailingSlash(
            `${baseUrl}/${lang}/vacancies/${encodeURIComponent(slug)}`
          ),
          lastModified: new Date(
            v.updatedAt ?? v.createdAt ?? Date.now()
          ).toISOString(),
          changeFrequency: "weekly",
          priority: 0.65,
        });
      }
    }
  } catch (error) {
    console.error("Error fetching content for sitemap:", error);
  }

  const allEntries = [
    ...staticSitemapEntries,
    ...postSitemapEntries,
    ...blogSitemapEntries,
    ...eventSitemapEntries,
    ...offerSitemapEntries,
    ...courseSitemapEntries,
    ...glossaryCategorySitemapEntries,
    ...glossaryTermSitemapEntries,
    ...vacancySitemapEntries,
  ];

  const xmlSitemap = generateSitemapXml(allEntries);

  return new NextResponse(xmlSitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

function generateSitemapXml(entries: any[]) {
  const xmlItems = entries
    .map((entry) => {
      return `
  <url>
    <loc>${escapeXml(ensureTrailingSlash(entry.url))}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${xmlItems}
</urlset>`;
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

