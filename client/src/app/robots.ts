import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/"],
      disallow: [
        "/dashboard",
        "/az/registration",
        "/ru/registration",
        "/*tag=*//*",
      ],
    },
    sitemap: "https://jetschool.az/sitemap.xml",
  };
}

