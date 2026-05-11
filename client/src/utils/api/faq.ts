import { FaqItem } from "@/types/faq";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";

export async function getFaqByPage(pageKey: string): Promise<FaqItem[]> {
  try {
    const res = await fetch(
      `${PUBLIC_API_BASE}/faq-public?pageKey=${encodeURIComponent(pageKey)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
