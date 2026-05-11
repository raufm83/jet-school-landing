import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/"],
      disallow: [
        "/dashboard",
        "/az/glossary/terms?letter=",
        "/ru/glossary/terms?letter=",
        "/az/glossary/terms/?letter=",
        "/ru/glossary/terms/?letter=",
      ],
    },
    sitemap: "https://jetschool.az/sitemap.xml",
  };
}

