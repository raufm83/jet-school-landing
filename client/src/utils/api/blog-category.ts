import { cache } from "react";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import { CONTENT_ISR_SECONDS } from "@/constants/content-isr";
import {
  BlogCategoriesResponse,
  BlogCategory,
} from "@/types/blog-category";

const REVALIDATE = CONTENT_ISR_SECONDS;

export const getBlogCategories = cache(
  async function getBlogCategories(): Promise<BlogCategory[]> {
    try {
      const res = await fetch(`${PUBLIC_API_BASE}/blog-categories`, {
        next: { revalidate: REVALIDATE },
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return [];
      const data = (await res.json()) as BlogCategoriesResponse;
      return Array.isArray(data?.items) ? data.items : [];
    } catch (error) {
      console.error("Failed to fetch blog categories:", error);
      return [];
    }
  }
);
