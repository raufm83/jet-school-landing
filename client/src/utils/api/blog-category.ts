import type { BlogCategory } from "@/types/blog-category";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import { CONTENT_ISR_SECONDS } from "@/constants/content-isr";

const REVALIDATE = CONTENT_ISR_SECONDS;

async function fetchServer<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${PUBLIC_API_BASE}${path}`, {
      next: { revalidate: REVALIDATE },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getPublicBlogCategories(limit = 200): Promise<BlogCategory[]> {
  const cap = Math.min(Math.max(limit, 1), 500);
  const fallback = { items: [] as BlogCategory[] };
  const data = await fetchServer<{ items?: BlogCategory[] }>(
    `/blog-categories?limit=${cap}`,
    fallback,
  );
  return Array.isArray(data?.items) ? data.items : [];
}
