import type { Vacancy } from "@/types/vacancy";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";

function normalizeVacancyList(data: unknown): Vacancy[] {
  if (Array.isArray(data)) return data as Vacancy[];
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { items?: unknown }).items)
  ) {
    return (data as { items: Vacancy[] }).items;
  }
  return [];
}

export async function getVacanciesPublic(): Promise<Vacancy[]> {
  try {
    const res = await fetch(`${PUBLIC_API_BASE}/vacancies`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    return normalizeVacancyList(data);
  } catch {
    return [];
  }
}

export async function getVacancyBySlugPublic(
  slug: string
): Promise<Vacancy | null> {
  try {
    const res = await fetch(`${PUBLIC_API_BASE}/vacancies/by-slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 120 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
