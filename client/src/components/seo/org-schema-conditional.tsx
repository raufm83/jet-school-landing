"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

/**
 * Bütün schema-sı olan landing/content page-lərindən
 * OrgSchemaLoader + GlobalSchemaRenderer çıxışını bloklayır.
 *
 * Əsas prinsipi: hər page-in öz complete @graph-ı var (Org+WebSite daxil).
 * OrgSchemaLoader → GlobalSchemaRenderer yalnız heç bir xüsusi schema olmayan
 * edge case page-lərdə (məs: /registration) render etməlidir.
 *
 * Bloklanır: bütün landing page-lər (home, about, contact, courses, gallery,
 * projects, reviews, blog, news, events, offers, glossary, course/single,
 * blog/single, news/single, events/single, offers/single, glossary/term).
 */
export default function OrgSchemaConditional({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const locale = useLocale();

  const path = pathname?.replace(new RegExp(`^/${locale}`), "") || "/";
  const segments = path.split("/").filter(Boolean);

  // Schemas that render their own complete @graph — block OrgSchemaLoader for these
  const landingSegments = [
    "courses",
    "about-us",
    "contact-us",
    "gallery",
    "projects",
    "reviews",
    "reyler",
    "otzyvy",
    "blog",
    "news",
    "events",
    "offers",
    "glossary",
    "course",
  ];

  // Home page (/)
  if (segments.length === 0) return null;

  // Any landing/content page
  if (segments.length >= 1 && landingSegments.includes(segments[0]!)) return null;

  // Allow for pages without their own schema (e.g. /registration)
  return <>{children}</>;
}
