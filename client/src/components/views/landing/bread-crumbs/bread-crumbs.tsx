"use client";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useMemo, useEffect, useState } from "react";
import { useBreadcrumbStore } from "@/stores/useBreadcrumbStore";
import { PostType } from "@/types/enums";

interface BreadcrumbsProps {
  dynamicTitle?: string;
}

export default function Breadcrumbs({ dynamicTitle }: BreadcrumbsProps) {
  const storeTitle = useBreadcrumbStore((s) => s.title);
  const categoryName = useBreadcrumbStore((s) => s.categoryName);
  const categorySlug = useBreadcrumbStore((s) => s.categorySlug);
  const postType = useBreadcrumbStore((s) => s.postType);
  const fullPathname = usePathname();
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pathname = useMemo(() => {
    if (!fullPathname) return "/";
    const strip = fullPathname.startsWith(`/${locale}`) ? fullPathname.slice(locale.length + 1) : fullPathname;
    return strip.startsWith("/") ? strip : `/${strip}`;
  }, [fullPathname, locale]);

  const segments = useMemo(() => {
    const vacancySlug = pathname.match(/^\/vacancies\/([^/]+)\/?$/)?.[1];
    if (vacancySlug) {
      return [vacancySlug];
    }
    const filtered = pathname.split("/").filter(Boolean).filter(segment => segment !== "category" && segment !== "course" && segment !== "term");
    // Remove base segments when on single post pages to allow showing the post title as the only segment
    const baseSections = ["news", "blog", "events", "offers"];
    for (const section of baseSections) {
      if (fullPathname.includes(`/${section}/`) && 
          !fullPathname.includes(`/${section}/category/`) && 
          filtered.includes(section) && 
          filtered.length === 2) {
        return filtered.filter(segment => segment !== section);
      }
    }

    return filtered;
  }, [pathname, fullPathname]);
  
  // Check if we're on a /news/category/* page and need to show category name
  const isNewsCategoryPage = fullPathname.includes("/news/category/");
  // Son seqment: news, blog, offers, event(s) — URL formatını normalize et
  let categoryType: string | null = null;
  if (isNewsCategoryPage) {
    const pathSegments = pathname.split("/").filter(Boolean);
    const categoryIndex = pathSegments.indexOf("category");
    if (categoryIndex !== -1 && categoryIndex + 1 < pathSegments.length) {
      const raw = pathSegments[categoryIndex + 1];
      const slug = decodeURIComponent(raw)
        .trim()
        .toLowerCase()
        .replace(/\/+$/, "");
      if (slug === "news") categoryType = "news";
      else if (slug === "blog") categoryType = "blog";
      else if (slug === "event" || slug === "events") categoryType = "event";
      else if (slug === "offers") categoryType = "offers";
    }
  }

  if (segments.length === 0 && !categoryType) return null;

  const lastIndex = segments.length - 1;
  const isSingle = segments.length === 2;
  // Glossary term sayfası için kontrol: /glossary/[slug] veya /glossary/term/[slug] pattern'leri
  const isGlossaryTerm = segments[0] === "glossary" && (segments.length === 2 || (segments.length === 1 && fullPathname.includes("/glossary/term/")));
  // Course single sayfası için kontrol: /course/[slug] pattern'i
  const isCourseSingle = fullPathname.includes("/course/") && segments.length === 1;
  const isVacancySingle = /^\/vacancies\/[^/]+\/?$/.test(pathname);
  // single sayfası için kontrol: /news/[slug], /blog/[slug], /events/[slug], /offers/[slug] pattern'leri
  const isPostSingle = (
    fullPathname.includes("/news/") || 
    fullPathname.includes("/blog/") || 
    fullPathname.includes("/events/") || 
    fullPathname.includes("/offers/")
  ) && 
  !fullPathname.includes("/news/category/") && 
  !fullPathname.includes("/blog/category/") && 
  segments.length === 1;

  const isTagSearchPage =
    segments[0] === "search" && segments[1] === "tag" && segments.length === 3;

  const translations: Record<string, Record<string, string>> = {
    az: {
      home: "Ana Səhifə",
      courses: "Kurslarımız",
      course: "Kurs",
      "about-us": "Haqqımızda",
      contact: "Əlaqə",
      gallery: "Qalereya",
      glossary: "Texnoloji Lüğət",
      term: "Termin",
      category: "Kateqoriya",
      search: "Axtarış",
      tag: "Mövzu",
      blog: "Bloq",
      news: "Xəbərlər",
      event: "Tədbirlər",
      events: "Tədbirlər",
      offers: "Kampaniyalar",
      terms: "Terminlər",
      projects: "Layihələr",
      reviews: "Rəylər",
      vacancies: "Vakansiyalar",
      "contact-us": "Bizimlə əlaqə",
    },
    ru: {
      home: "Главная",
      courses: "Курсы",
      course: "Курс",
      "about-us": "О нас",
      contact: "Контакты",
      gallery: "Галерея",
      glossary: "Технологический Глоссарий",
      term: "Термин",
      category: "Категория",
      search: "Поиск",
      tag: "Тема",
      blog: "Блог",
      news: "Новости",
      event: "События",
      events: "События",
      terms: "Термины",
      offers: "Предложения",
      projects: "Проекты",
      reviews: "Отзывы родителей и учеников",
      vacancies: "Вакансии",
      "contact-us": "Связаться с нами",
    },
  };

  // Post type translations (plural forms)
  const postTypeTranslations: Record<string, Record<PostType, string>> = {
    az: {
      [PostType.BLOG]: "Bloqlar",
      [PostType.NEWS]: "Xəbərlər",
      [PostType.EVENT]: "Tədbirlər",
      [PostType.OFFERS]: "Kampaniyalar",
    },
    ru: {
      [PostType.BLOG]: "Блоги",
      [PostType.NEWS]: "Новости",
      [PostType.EVENT]: "События",
      [PostType.OFFERS]: "Акции",
    },
  };

  // Get post type URL
  const getPostTypeUrl = (type: PostType): string => {
    switch (type) {
      case PostType.BLOG: return "/blog";
      case PostType.EVENT: return "/events";
      case PostType.OFFERS: return "/offers";
      case PostType.NEWS: return "/news";
      default: return "/news";
    }
  };

  const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);
  const t = translations[locale as "az" | "ru"] || translations.az;

  const getLabel = (segment: string, index: number) => {
    // Use storeTitle for single pages (news/blog/course) when available
    if (index === lastIndex && (dynamicTitle || storeTitle)) {
      if (isPostSingle || isCourseSingle || isSingle || isTagSearchPage || isVacancySingle) {
        return dynamicTitle || storeTitle || "";
      }
    }
    const keyRaw = segment.toLowerCase();
    const key =
      keyRaw === "reyler" || keyRaw === "otzyvy" ? "reviews" : keyRaw;
    if (t[key]) return t[key];
    return cap(decodeURIComponent(segment).replace(/-/g, " "));
  };

  const hrefForSegmentsPrefix = (upToIndex: number) => {
    const slice = segments.slice(0, upToIndex + 1);
    const first = slice[0]?.toLowerCase();
    if (slice.length === 1 && (first === "reyler" || first === "otzyvy")) {
      return "/reviews";
    }
    return `/${slice.join("/")}`;
  };

  const postTypeLabel = postType ? postTypeTranslations[locale]?.[postType] : null;
  const postTypeUrl = postType ? getPostTypeUrl(postType) : null;

  return (
    <nav className="p-2 text-sm text-gray-700 flex gap-1 items-center flex-wrap">
      <Link href="/" className="hover:text-jsyellow transition-colors [@media(min-width:3500px)]:text-2xl">
        {t.home}
      </Link>
      {/* Course single sayfası için "Kurslar" segment'ini ekle */}
      {mounted && isCourseSingle && (
        <>
          <span className="text-gray-400 [@media(min-width:3500px)]:text-2xl">›</span>
          <Link href="/courses" className="hover:text-jsyellow transition-colors [@media(min-width:3500px)]:text-2xl">
            {locale === "az" ? "Kurslar" : "Курсы"}
          </Link>
        </>
      )}
      {mounted && isVacancySingle && (
        <>
          <span className="text-gray-400 [@media(min-width:3500px)]:text-2xl">›</span>
          <Link href="/vacancies" className="hover:text-jsyellow transition-colors [@media(min-width:3500px)]:text-2xl">
            {t.vacancies}
          </Link>
        </>
      )}
      {/* Post type link for single pages */}
      {mounted && isPostSingle && postType && postTypeLabel && postTypeUrl && (
        <>
          <span className="text-gray-400 [@media(min-width:3500px)]:text-2xl">›</span>
          <Link href={postTypeUrl as never} className="hover:text-jsyellow transition-colors [@media(min-width:3500px)]:text-2xl">
            {postTypeLabel}
          </Link>
        </>
      )}
      {/* /news/category/* — birbaşa kateqoriya adı (SSR-də də görünsün; mounted gözləməsin) */}
      {isNewsCategoryPage && categoryType && (
        <>
          <span className="text-gray-400 [@media(min-width:3500px)]:text-2xl">›</span>
          <span className="font-semibold text-jsblack [@media(min-width:3500px)]:text-2xl">
            {categoryType === "news"
              ? postTypeTranslations[locale]?.[PostType.NEWS] || t.news
              : categoryType === "blog"
                ? postTypeTranslations[locale]?.[PostType.BLOG] || t.blog
                : categoryType === "event"
                  ? postTypeTranslations[locale]?.[PostType.EVENT] || t.event
                  : categoryType === "offers"
                    ? postTypeTranslations[locale]?.[PostType.OFFERS] || t.offers
                    : categoryType}
          </span>
        </>
      )}
      {/* Kateqoriya səhifəsində seqment map təkrar etməsin */}
      {!(isNewsCategoryPage && categoryType) && segments.map((segment, index) => {
        if (!segment) return null;
        const href = hrefForSegmentsPrefix(index);
        const label = getLabel(segment, index);
        
        return (
          <span key={`${href}-${index}`} className="flex items-center gap-1">
            <span className="text-gray-400 [@media(min-width:3500px)]:text-2xl">›</span>
            {index === lastIndex ? (
              <span className="font-semibold text-jsblack [@media(min-width:3500px)]:text-2xl">{label}</span>
            ) : (
              <>
                <Link href={href as never} className="hover:text-jsyellow transition-colors [@media(min-width:3500px)]:text-2xl">
                  {label}
                </Link>
                {/* Glossary term sayfası için category bilgisini glossary segment'inden hemen sonra ekle */}
                {mounted && isGlossaryTerm && index === 0 && categoryName && (
                  <>
                    <span className="text-gray-400 [@media(min-width:3500px)]:text-2xl">›</span>
                    <Link 
                      href={{
                        pathname: "/glossary/category/[slug]",
                        params: {
                          slug: categorySlug || categoryName.toLowerCase().replace(/\s+/g, "-"),
                        },
                      }}
                      className="hover:text-jsyellow transition-colors [@media(min-width:3500px)]:text-2xl"
                    >
                      {categoryName}
                    </Link>
                  </>
                )}
              </>
            )}
          </span>
        );
      })}
    </nav>
  );
}
