"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import JsonLd from "./json-ld";
import { buildWebPageSchema, SITE_SCHEMA } from "@/data/site-schema";
import { useBreadcrumbStore } from "@/stores/useBreadcrumbStore";
import { getPageMeta } from "@/utils/api/page-meta";

/** Bütün səhifələr üçün avtomatik pageKey – heç bir səhifə boş qalmaz. */
function pathToPageKey(path: string): string {
  const segment = path.replace(/^\//, "").split("/").filter(Boolean);
  if (segment.length === 0) return "home";
  if (segment[0] === "course" && segment.length >= 2) return `course:${segment[1]}`;
  if (segment[0] === "blog" && segment.length >= 2) return `blog:${segment[1]}`;
  if (segment[0] === "news" && segment.length >= 2) return `news:${segment[1]}`;
  if (segment[0] === "events" && segment.length >= 2) return `events:${segment[1]}`;
  if (segment[0] === "offers" && segment.length >= 2) return `offers:${segment[1]}`;
  if (segment[0] === "glossary" && segment[1] === "terms") return "glossary/terms";
  if (segment[0] === "glossary" && segment[1] === "category") return "glossary";
  if (segment[0] === "glossary" && segment[1] === "term" && segment.length >= 3)
    return `glossary/term:${segment[2]}`;
  if (segment[0] === "glossary") return "glossary";
  if (segment[0] === "news" && segment[1] === "category") return "news";
  if (segment[0] === "reyler" || segment[0] === "otzyvy") return "reviews";
  const known = [
    "courses",
    "about-us",
    "contact-us",
    "gallery",
    "projects",
    "reviews",
    "blog",
    "news",
    "events",
    "offers",
    "glossary",
  ];
  if (segment[0] && known.includes(segment[0])) return segment[0];
  return segment[0] || "page";
}

const PAGE_KEY_LABELS: Record<string, Record<string, string>> = {
  az: {
    home: SITE_SCHEMA.name,
    courses: "Kurslarımız",
    course: "Kurs",
    "about-us": "Haqqımızda",
    "contact-us": "Əlaqə",
    gallery: "Qalereya",
    glossary: "Texnoloji Lüğət",
    "glossary/terms": "Terminlər",
    projects: "Layihələr",
    reviews: "Rəylər",
    blog: "Bloq",
    news: "Xəbərlər",
    events: "Tədbirlər",
    offers: "Kampaniyalar",
  },
  ru: {
    home: SITE_SCHEMA.name,
    courses: "Курсы",
    course: "Курс",
    "about-us": "О нас",
    "contact-us": "Контакты",
    gallery: "Галерея",
    glossary: "Технологический Глоссарий",
    "glossary/terms": "Термины",
    projects: "Проекты",
    reviews: "Отзывы",
    blog: "Блог",
    news: "Новости",
    events: "События",
    offers: "Предложения",
  },
};

function getPageNameFallback(pageKey: string, locale: string): string {
  const labels = PAGE_KEY_LABELS[locale as "az" | "ru"] || PAGE_KEY_LABELS.az;
  if (pageKey === "home" || pageKey === "page") return SITE_SCHEMA.name;
  if (labels[pageKey]) return labels[pageKey];
  return pageKey;
}

interface SchemaWebPageProps {
  locale: string;
}

export default function SchemaWebPage({ locale }: SchemaWebPageProps) {
  const pathname = usePathname();
  const storeTitle = useBreadcrumbStore((s) => s.title);
  const [metaTitle, setMetaTitle] = useState<string | null>(null);

  const pageKey = useMemo(() => {
    const path = pathname?.replace(new RegExp(`^/(az|ru)`), "") || "";
    return pathToPageKey(path || "/");
  }, [pathname]);

  const pageUrl = useMemo(() => {
    const base = `${SITE_SCHEMA.baseUrl}${locale === "az" ? "" : `/${locale}`}`;
    const path = pathname?.replace(new RegExp(`^/(az|ru)`), "") || "/";
    return path ? `${base}${path.startsWith("/") ? path : `/${path}`}` : base;
  }, [pathname, locale]);

  useEffect(() => {
    let cancelled = false;
    getPageMeta(pageKey, locale).then((meta) => {
      if (!cancelled && meta?.title) setMetaTitle(meta.title);
    });
    return () => {
      cancelled = true;
    };
  }, [pageKey, locale]);

  const schema = useMemo(() => {
    const name =
      storeTitle || metaTitle || getPageNameFallback(pageKey, locale);
    const url = typeof pageUrl === "string" && pageUrl ? pageUrl : SITE_SCHEMA.baseUrl;
    return buildWebPageSchema({
      name,
      description: null,
      url,
      locale,
      baseUrl: SITE_SCHEMA.baseUrl,
    });
  }, [pageKey, pageUrl, locale, storeTitle, metaTitle]);

  return <JsonLd data={schema} />;
}
