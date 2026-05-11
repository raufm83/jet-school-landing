"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useMemo } from "react";
import { buildBreadcrumbListSchema, SITE_SCHEMA } from "@/data/site-schema";
import { useBreadcrumbStore } from "@/stores/useBreadcrumbStore";
import { useSchemaStore } from "@/stores/useSchemaStore";

const SEGMENT_LABELS: Record<string, Record<string, string>> = {
  az: {
    courses: "Kurslarımız",
    course: "Kurs",
    "about-us": "Haqqımızda",
    "contact-us": "Əlaqə",
    gallery: "Qalereya",
    glossary: "Texnoloji Lüğət",
    terms: "Terminlər",
    blog: "Bloq",
    news: "Xəbərlər",
    events: "Tədbirlər",
    offers: "Kampaniyalar",
    projects: "Layihələr",
    reviews: "Rəylər",
    category: "Kateqoriya",
    term: "Termin",
    vacancies: "Vakansiyalar",
  },
  ru: {
    courses: "Курсы",
    course: "Курс",
    "about-us": "О нас",
    "contact-us": "Контакты",
    gallery: "Галерея",
    glossary: "Технологический Глоссарий",
    terms: "Термины",
    blog: "Блог",
    news: "Новости",
    events: "События",
    offers: "Предложения",
    projects: "Проекты",
    reviews: "Отзывы",
    category: "Категория",
    term: "Термин",
    vacancies: "Вакансии",
  },
};

function getSegmentLabel(segment: string, locale: string): string {
  const key = segment.toLowerCase();
  const t = SEGMENT_LABELS[locale as "az" | "ru"] || SEGMENT_LABELS.az;
  if (t[key]) return t[key];
  return decodeURIComponent(segment).replace(/-/g, " ");
}

export default function SchemaBreadcrumbs() {
  const pathname = usePathname();
  const locale = useLocale();
  const storeTitle = useBreadcrumbStore((s) => s.title);
  const setBreadcrumbNode = useSchemaStore((s) => s.setBreadcrumbNode);

  const schema = useMemo(() => {
    const baseUrl = `${SITE_SCHEMA.baseUrl}/${locale}`;
    const path = pathname?.replace(new RegExp(`^/${locale}`), "") || "/";
    const segments = path.split("/").filter(Boolean);
    // These pages render their own schemas — no standalone breadcrumb needed
    if (segments[0] === "courses" && segments.length === 1) return null;
    if (segments[0] === "course" && segments.length === 2) return null;
    if (segments[0] === "glossary" && segments.length === 2 && segments[1] === "terms") return null;
    if (segments[0] === "glossary" && segments[1] === "term" && segments.length === 3) return null;
    if (segments[0] === "contact-us" && segments.length === 1) return null;
    if (segments[0] === "blog" && (segments.length === 1 || segments.length === 2)) return null;
    if (segments[0] === "news" && (segments.length === 1 || segments.length === 2 || (segments[1] === "category" && segments.length === 3))) return null;
    if (segments[0] === "offers" && (segments.length === 1 || segments.length === 2)) return null;
    if (segments[0] === "events" && (segments.length === 1 || segments.length === 2)) return null;
    if (segments[0] === "about-us" && segments.length === 1) return null;
    if (segments[0] === "gallery" && segments.length === 1) return null;
    if (segments[0] === "projects" && segments.length === 1) return null;
    if (
      (segments[0] === "reviews" ||
        segments[0] === "reyler" ||
        segments[0] === "otzyvy") &&
      segments.length === 1
    )
      return null;
    if (segments[0] === "vacancies" && (segments.length === 1 || segments.length === 2))
      return null;
    if (segments[0] === "glossary") return null;
    if (segments.length === 0) return null;

    const items: { name: string; url: string }[] = [
      { name: locale === "az" ? "Ana Səhifə" : "Главная", url: baseUrl },
    ];
    let acc = baseUrl;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg === "course" && i === 0) {
        acc = `${baseUrl}/courses`;
        items.push({ name: getSegmentLabel("courses", locale), url: acc });
      } else if (i === 1 && segments[0] === "course") {
        acc = `${baseUrl}/course/${seg}`;
        items.push({ name: getSegmentLabel(seg, locale), url: acc });
      } else {
        acc += `/${seg}`;
        items.push({ name: getSegmentLabel(seg, locale), url: acc });
      }
    }
    if (storeTitle && items.length >= 3) {
      items[items.length - 1]!.name = storeTitle;
    }
    return buildBreadcrumbListSchema(baseUrl, locale, items);
  }, [pathname, locale, storeTitle]);

  useEffect(() => {
    if (schema) {
      // Strip @context so GlobalSchemaRenderer merges cleanly into @graph
      const rest = Object.fromEntries(
        Object.entries(schema as Record<string, unknown>).filter(([k]) => k !== "@context")
      );
      setBreadcrumbNode(rest as Record<string, unknown>);
    } else {
      setBreadcrumbNode(null);
    }
  }, [schema, setBreadcrumbNode]);

  return null; // GlobalSchemaRenderer renders everything
}
