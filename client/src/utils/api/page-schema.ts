import { PUBLIC_API_BASE } from "@/constants/public-api-base";

export interface PageSchemaResponse {
  id: string;
  pageKey: string;
  locale: string;
  schemaJson: object | object[];
  createdAt: string;
  updatedAt: string;
}

export async function getPageSchema(
  pageKey: string,
  locale: string
): Promise<PageSchemaResponse | null> {
  try {
    const res = await fetch(
      `${PUBLIC_API_BASE}/page-schema?pageKey=${encodeURIComponent(pageKey)}&locale=${encodeURIComponent(locale)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.id ? data : null;
  } catch {
    return null;
  }
}
