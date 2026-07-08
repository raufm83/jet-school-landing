import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["az", "ru"],

  defaultLocale: "az",
  localePrefix: "always",

  pathnames: {
    "/": "/",
    "/about-us": "/about-us",
    "/contact-us": "/contact-us",
    "/courses": "/courses",
    "/projects": "/projects",
    "/gallery": "/gallery",
    "/reviews": {
      az: "/reyler",
      ru: "/otzyvy",
    },
    "/blog": "/blog",
    "/news": "/news",
    "/events": "/events",
    "/offers": "/offers",
    "/glossary": "/glossary",
    "/glossary/terms": "/glossary/terms",
    "/vacancies": "/vacancies",
    "/registration": "/registration",
    "/course/[slug]": "/course/[slug]",
    "/vacancies/[slug]": "/vacancies/[slug]",
    "/blog/[slug]": "/blog/[slug]",
    "/news/[slug]": "/news/[slug]",
    "/events/[slug]": "/events/[slug]",
    "/offers/[slug]": "/offers/[slug]",
    "/news/category/[type]": "/news/category/[type]",
    "/search/tag/[tag]": "/search/tag/[tag]",
    "/glossary/[slug]": "/glossary/[slug]",
    "/glossary/category/[slug]": "/glossary/category/[slug]",
    "/glossary/term/[slug]": "/glossary/term/[slug]",
  },
});

/** Kənar URL (canonical, sitemap, JSON-LD) üçün dilə görə seqment */
export function getReviewsPathSegment(locale: string): string {
  return locale === "ru" ? "otzyvy" : "reyler";
}

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
