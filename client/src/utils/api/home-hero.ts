import { PUBLIC_API_BASE } from "@/constants/public-api-base";

export type HomeHeroI18nField = { az: string; ru: string };

export interface HomeHeroApiRecord {
  id: string;
  bodyHtml: HomeHeroI18nField | null;
  imageUrl: string;
  imageAlt?: HomeHeroI18nField | null;
  createdAt: string;
  updatedAt: string;
}

export async function getHomeHero(): Promise<HomeHeroApiRecord | null> {
  const url = `${PUBLIC_API_BASE}/home-hero`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || text.trim() === "" || text.trim() === "null") return null;
    const data = JSON.parse(text) as unknown;
    if (data == null || typeof data !== "object" || !("id" in (data as object))) {
      return null;
    }
    return data as HomeHeroApiRecord;
  } catch {
    return null;
  }
}
