"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useSchemaStore } from "@/stores/useSchemaStore";

/**
 * GlobalSchemaRenderer — bütün global schema node-larını (Org + WebSite + BreadcrumbList)
 * store-dan oxuyub tək bir "@graph" <script> kimi render edir.
 *
 * Blog/News/Events/Offers/Course single pages öz @graph-larını ayrıca render edir.
 * Həmin səhifələrdə bu komponent özünü söndürür ki, validator tək @graph görsün.
 */

/** Öz tam @graph-ına sahib olan page yolu prefikslərinin siyahısı */
const SELF_SCHEMA_SEGMENTS = [
  "course",
  "courses",
  "blog",
  "news",
  "events",
  "offers",
  "glossary",
  "about-us",
  "contact-us",
  "gallery",
  "projects",
  "reviews",
  "reyler",
  "otzyvy",
];

export default function GlobalSchemaRenderer() {
  const pathname = usePathname();
  const locale = useLocale();
  const orgNode = useSchemaStore((s) => s.orgNode);
  const websiteNode = useSchemaStore((s) => s.websiteNode);
  const breadcrumbNode = useSchemaStore((s) => s.breadcrumbNode);

  // Öz sxeması olan səhifələrdə render etmə
  const isSelfSchema = useMemo(() => {
    const path = pathname?.replace(new RegExp(`^/${locale}`), "") || "/";
    const segments = path.split("/").filter(Boolean);
    if (segments.length === 0) return true; // home page — öz @graph var
    return SELF_SCHEMA_SEGMENTS.includes(segments[0]!);
  }, [pathname, locale]);

  const graph = useMemo(() => {
    const nodes: Record<string, unknown>[] = [];
    if (orgNode) nodes.push(orgNode);
    if (websiteNode) nodes.push(websiteNode);
    if (breadcrumbNode) {
      // Strip @context cleanly without unused variable
      const rest = Object.fromEntries(
        Object.entries(breadcrumbNode as Record<string, unknown>).filter(([k]) => k !== "@context")
      );
      nodes.push(rest);
    }
    return nodes;
  }, [orgNode, websiteNode, breadcrumbNode]);

  if (isSelfSchema) return null;
  if (graph.length === 0) return null;

  const output = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  const str = JSON.stringify(output).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: str }}
    />
  );
}

