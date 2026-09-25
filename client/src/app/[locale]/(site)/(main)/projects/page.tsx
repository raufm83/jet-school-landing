import SectionTitle from "@/components/shared/section-title";
import ProjectCard from "@/components/views/landing/projects/project-card";
import { Project } from "@/types/student-projects";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import { cache } from "react";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/json-ld";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPageMeta } from "@/utils/api/page-meta";
import { trimMetaTitle, trimMetaDescription, buildHreflangUrl } from "@/utils/seo";
import { getFaqByPage } from "@/utils/api/faq";
import FaqSection from "@/components/views/landing/faq/faq-section";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Metadata" });

  const meta = await getPageMeta("projects", locale);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const canonicalUrl = buildHreflangUrl(baseUrl, locale, "projects");

  const title = meta?.title
    ? trimMetaTitle(meta.title)
    : trimMetaTitle(t("projectsPageTitle") || "Layihələr");
  const description = meta?.description
    ? trimMetaDescription(meta.description)
    : trimMetaDescription(
        t("projectsPageDescription") ||
          "Jet Schoolun tələbə layihələri, tələbələrimizin innovasiya və yaradıcılığı nümayiş etdirir"
      );

  const openGraph: Metadata["openGraph"] = {
    title,
    description,
    type: "website",
    url: buildHreflangUrl(baseUrl, locale, "projects"),
    locale: locale === "az" ? "az_AZ" : "ru_RU",
    alternateLocale: locale === "az" ? "ru_RU" : "az_AZ",
  };
  return {
    title,
    description,
    keywords: ["tələbə layihələri", "jet school", "təhsil", "innovasiya"],
    alternates: {
      canonical: canonicalUrl,
      languages: {
        az: buildHreflangUrl(baseUrl, "az", "projects"),
        ru: buildHreflangUrl(baseUrl, "ru", "projects"),
        "x-default": buildHreflangUrl(baseUrl, "az", "projects"),
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
        "max-image-preview": "large",
      },
    },
  };
}

/**
 * Layihələr siyahısı — ISR + React `cache()` ilə eyni request-də deduplikasiya.
 * Axios əvəzinə native fetch istifadəsi backend-ə yükü dəfələrlə azaldır.
 */
const fetchProjects = cache(async () => {
  try {
    const response = await fetch(
      `${PUBLIC_API_BASE}/student-projects?limit=1000&sortBy=order&order=desc`,
      { next: { revalidate: 120 } },
    );
    if (!response.ok) return { items: [] };
    return (await response.json()) ?? { items: [] };
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return { items: [] };
  }
});

export default async function Projects({
  params,
}: {
  params: { locale: string };
}) {
  try {
    const locale = params.locale as "az" | "ru";
    const [t, projectsData, faqItems] = await Promise.all([
      getTranslations({ locale: params.locale, namespace: "projects" }),
      fetchProjects(),
      getFaqByPage("projects"),
    ]);
    const items = projectsData?.items ?? [];
    if (items.length === 0) {
      notFound();
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az";
    const base = `${baseUrl}/${locale}`;
    const projectsUrl = `${base}/projects`;
    const pageTitle = t("title");
    const pageDescription = t("description") || "";
    const extractYoutubeId = (url: string) => {
      if (!url) return null;
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
      return match ? match[1] : null;
    };

    const schemaGraph = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": pageTitle,
      "description": pageDescription,
      "url": projectsUrl,
      "about": {
        "@id": `${baseUrl}/#organization`
      },
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": items.length,
        "itemListElement": items.slice(0, 50).map((p: Project, index: number) => {
          const ytId = extractYoutubeId(p.link || "");
          const pTitle = (typeof p.title === "object" && p.title !== null
            ? (p.title as Record<string, string>)[locale] || Object.values(p.title as Record<string, string>)[0]
            : p.title) || "Layihə";
          const pDesc = (typeof p.description === "object" && p.description !== null
            ? (p.description as Record<string, string>)[locale] || Object.values(p.description as Record<string, string>)[0]
            : p.description) || "Tələbə layihəsi";

          if (ytId) {
            return {
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "VideoObject",
                "name": pTitle,
                "description": pDesc,
                "thumbnailUrl": `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
                "embedUrl": `https://www.youtube.com/embed/${ytId}`,
                "contentUrl": `https://www.youtube.com/watch?v=${ytId}`,
                "uploadDate": p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : undefined,
                ...(p.author ? {
                  "creator": {
                    "@type": "Person",
                    "name": p.author
                  }
                } : {})
              }
            };
          }

          return {
            "@type": "ListItem",
            "position": index + 1,
            "item": {
              "@type": "CreativeWork",
              "name": pTitle,
              "description": pDesc,
              "url": p.link || projectsUrl,
              "image": p.imageUrl ? p.imageUrl : undefined,
              "dateCreated": p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : undefined,
              ...(p.author ? {
                "creator": {
                  "@type": "Person",
                  "name": p.author
                }
              } : {})
            }
          };
        })
      }
    };

    if (!projectsData) {
      return null;
    }

    return (
      <div id="media" className="container my-20 flex flex-col gap-8">
        <JsonLd data={schemaGraph} />
        <SectionTitle as="h1" title={t("title")} description={t("description")} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 [@media(min-width:2500px)]:grid-cols-4">
          {items.map((project: Project, index: number) => (
            <ProjectCard
              key={project.id}
              loadEager={index === 0}
              imageUrl={project.imageUrl}
              link={project.link}
              title={project.title!}
              description={project.description!}
              category={project.category!}
            />
          ))}
        </div>

        {faqItems.length > 0 && (
          <FaqSection items={faqItems} locale={locale} />
        )}
      </div>
    );
  } catch (error) {
    console.error("Projects component error:", error);
    return (
      <div className="container my-20 text-center">
        <p>Ошибка при загрузке проектов. Пожалуйста, попробуйте позже.</p>
      </div>
    );
  }
}

/** ISR: layihələr siyahısı üçün API təzyiqini azaldır */
export const revalidate = 120;
