import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import { CONTENT_ISR_SECONDS } from "@/constants/content-isr";

export interface PageMetaResponse {
  id: string;
  pageKey: string;
  locale: string;
  title: string;
  description: string | null;
  keywords?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getPageMeta(
  pageKey: string,
  locale: string
): Promise<PageMetaResponse | null> {
  const url = `${PUBLIC_API_BASE}/page-meta?pageKey=${encodeURIComponent(pageKey)}&locale=${encodeURIComponent(locale)}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      // ISR: eyni səhifələrdə `revalidate` ilə uyğunlaşdırılmış keş → daha aşağı TTFB
      next: { revalidate: CONTENT_ISR_SECONDS },
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text?.trim()) return null;
    const data = JSON.parse(text) as unknown;
    if (!data || typeof data !== "object" || !("id" in data)) return null;
    const obj = data as Record<string, unknown>;
    return {
      id: String(obj.id),
      pageKey: String(obj.pageKey ?? ""),
      locale: String(obj.locale ?? ""),
      title: String(obj.title ?? ""),
      description: obj.description != null ? String(obj.description) : null,
      keywords: obj.keywords != null ? String(obj.keywords) : null,
      createdAt: obj.createdAt != null ? String(obj.createdAt) : "",
      updatedAt: obj.updatedAt != null ? String(obj.updatedAt) : "",
    };
  } catch {
    return null;
  }
}
