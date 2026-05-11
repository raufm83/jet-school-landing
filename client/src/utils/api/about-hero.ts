import { PUBLIC_API_BASE } from "@/constants/public-api-base";

export type AboutHeroI18nField = { az: string; ru: string };
export type AboutHeroI18nPartialField = { az?: string; ru?: string };

export interface AboutMissionVisionRecord {
  sectionTitle?: AboutHeroI18nPartialField;
  missionTitle?: AboutHeroI18nPartialField;
  missionDescription?: AboutHeroI18nPartialField;
  visionTitle?: AboutHeroI18nPartialField;
  visionDescription?: AboutHeroI18nPartialField;
  imageUrl?: string;
  imageAlt?: AboutHeroI18nPartialField;
}

export interface AboutHeroApiRecord {
  id: string;
  bodyHtml: AboutHeroI18nField | null;
  imageUrl: string;
  imageAlt?: AboutHeroI18nField | null;
  missionVision?: AboutMissionVisionRecord | null;
  createdAt: string;
  updatedAt: string;
}

export async function getAboutHero(): Promise<AboutHeroApiRecord | null> {
  const url = `${PUBLIC_API_BASE}/about-hero`;
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
    return data as AboutHeroApiRecord;
  } catch {
    return null;
  }
}
