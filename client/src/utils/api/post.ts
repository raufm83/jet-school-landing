import { cache } from "react";
import { Post, PostsResponse } from "@/types/post";
import { PostType } from "@/types/enums";
import api from "./axios";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import { CONTENT_ISR_SECONDS } from "@/constants/content-isr";

/**
 * Server-tərəfli istəklər üçün native `fetch` istifadə edirik ki, Next.js ISR
 * (`next.revalidate`) təbəqəsindən yararlana bilək. Əks halda axios bu qatı
 * bypass edir və hər request backend-ə gedir → yüksək TTFB.
 *
 * `window === undefined` yoxlamasından istifadə edirik ki, eyni funksiya həm
 * RSC/SSR-də (fetch), həm də client-də (axios, cookie/csrf ilə) çalışsın.
 */
const REVALIDATE = CONTENT_ISR_SECONDS;

/** Dinamik [slug] segmenti üçün path → API parametri normalizə (trailingSlash, encode) */
export function normalizePostSlugForApi(slug: string): string {
  let s =
    typeof slug === "string" ? slug.trim() : String(slug ?? "").trim();
  s = s.replace(/^\/+|\/+$/g, "");
  if (!s) return "";
  try {
    s = decodeURIComponent(s);
  } catch {
    /* olduğu kimi */
  }
  return encodeURIComponent(s);
}

async function fetchServer<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${PUBLIC_API_BASE}${path}`, {
      next: { revalidate: REVALIDATE },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch (error) {
    console.error(`Failed to fetch ${path}:`, error);
    return fallback;
  }
}

export const getPostDetails = cache(async function getPostDetails(
  slug: string
): Promise<Post | null> {
  try {
    const safeSlug = normalizePostSlugForApi(slug);
    if (!safeSlug) return null;
    if (typeof window === "undefined") {
      return await fetchServer<Post | null>(`/posts/slug/${safeSlug}`, null);
    }
    const { data } = await api.get(`/posts/slug/${safeSlug}`);
    return data;
  } catch (error) {
    console.error(`Error fetching post with slug ${slug}:`, error);
    return null;
  }
});

interface RelatedPostsParams {
  postId: string;
  postType: PostType;
  tags: string[];
  locale?: "az" | "ru";
  limit?: number;
}

/**
 * Fetches related posts based on post type and tags
 */
export async function getRelatedPosts({
  postId,
  postType,
  tags,
  locale = "az",
  limit = 6,
}: RelatedPostsParams): Promise<Post[]> {
  try {
    const path = `/posts/type/${postType}?page=1&limit=20`;
    let data: any;
    if (typeof window === "undefined") {
      data = await fetchServer<any>(path, { items: [] });
    } else {
      ({ data } = await api.get(path));
    }
    const items = Array.isArray(data?.items) ? data.items : [];

    const getPostTags = (p: Post): string[] =>
      Array.isArray(p.tags) ? p.tags : (p.tags?.[locale] ?? []);

    const relatedPosts = items
      .filter((post: Post) => {
        if (post.id === postId) return false;
        const postTags = getPostTags(post);
        return tags.length === 0 || postTags.some((tag: string) => tags.includes(tag));
      })
      .slice(0, limit);

    return relatedPosts;
  } catch (error) {
    console.error("Error fetching related posts:", error);
    return [];
  }
}

/**
 * Fetches posts by type
 */
export async function getPostsByType(
  type: PostType,
  page = 1,
  limit = 10
): Promise<{
  items: Post[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {
  const fallback = {
    items: [] as Post[],
    meta: { total: 0, page, limit, totalPages: 0 },
  };
  try {
    const path = `/posts/type/${type}?page=${page}&limit=${limit}`;
    if (typeof window === "undefined") {
      return await fetchServer(path, fallback);
    }
    const { data } = await api.get(path);
    return data;
  } catch (error) {
    console.error(`Error fetching posts of type ${type}:`, error);
    return fallback;
  }
}

/**
 * Fetches latest posts
 */
export async function getLatestPosts(limit = 4): Promise<Post[]> {
  try {
    const path = `/posts?limit=${limit}`;
    if (typeof window === "undefined") {
      const data = await fetchServer<any>(path, { items: [] });
      return Array.isArray(data?.items) ? data.items : [];
    }
    const { data } = await api.get(path);
    return data.items;
  } catch (error) {
    console.error("Error fetching latest posts:", error);
    return [];
  }
}

/**
 * Fetches all posts
 */
export async function getAllPosts({
  page,
  limit,
  postType,
  includeBlogs = false,
  eventStatus,
  tag,
  excludeOffers = false,
  blogCategoryId,
  search,
  blogCategoryId,
}: any): Promise<PostsResponse> {
  const fallback: PostsResponse = {
    items: [],
    meta: { total: 0, page, limit, totalPages: 0 },
  };
  try {
    let url: string;
    if (postType) {
      url = `/posts/type/${postType}?limit=${limit}&page=${page}&type=${postType ? postType?.toUpperCase() : ""
        }&includeBlogs=${includeBlogs}`;
    } else {
      url = `/posts?limit=${limit}&page=${page}&includeBlogs=${includeBlogs}`;
      if (excludeOffers) {
        url += "&excludeOffers=true";
      }
    }

    if (eventStatus) {
      url += `&eventStatus=${eventStatus}`;
    }

    if (tag && String(tag).trim()) {
      url += `&tag=${encodeURIComponent(String(tag).trim())}`;
    }

    const bc = typeof blogCategoryId === "string" ? blogCategoryId.trim() : "";
    if (bc) {
      url += `&blogCategoryId=${encodeURIComponent(bc)}`;
    }

    const sq = typeof search === "string" ? search.trim() : "";
    if (sq) {
      url += `&search=${encodeURIComponent(sq)}`;
    }

    if (blogCategoryId && String(blogCategoryId).trim()) {
      url += `&blogCategoryId=${encodeURIComponent(String(blogCategoryId).trim())}`;
    }

    if (typeof window === "undefined") {
      return await fetchServer<PostsResponse>(url, fallback);
    }
    const { data } = await api.get(url);
    return data;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return fallback;
  }
}

/**
 * Ana səhifə «Bloq və Media» slayderi: bloq + xəbər + tədbir; kampaniyalar (OFFERS) daxil deyil.
 * Backend `findAll`: `includeBlogs=true` + `excludeOffers=true` → `postType !== OFFERS` (tək sorğu, qarışıq tarix sırası).
 */
export async function getAllHomeMediaPosts(
  limit = 80
): Promise<PostsResponse> {
  return getAllPosts({
    page: 1,
    limit,
    includeBlogs: true,
    excludeOffers: true,
  });
}

/** Bütün növlər üzrə dərc olunmuş postlar arasında teqə görə (API `tag` parametri) */
export async function getPostsByTag(
  tag: string,
  page = 1,
  limit = 12
): Promise<PostsResponse> {
  return getAllPosts({
    page,
    limit,
    includeBlogs: true,
    tag,
  });
}

/**
 * Creates a new post
 */
export async function createPost(postData: any): Promise<Post> {
  try {
    const { data } = await api.post("/posts", postData);
    return data;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

/**
 * Updates an existing post
 */
export async function updatePost(id: string, postData: any): Promise<Post> {
  try {
    const { data } = await api.patch(`/posts/${id}`, postData);
    return data;
  } catch (error) {
    console.error(`Error updating post ${id}:`, error);
    throw error;
  }
}

/**
 * Deletes a post
 */
export async function deletePost(id: string): Promise<{ id: string }> {
  try {
    const { data } = await api.delete(`/posts/${id}`);
    return data;
  } catch (error) {
    console.error(`Error deleting post ${id}:`, error);
    throw error;
  }
}
