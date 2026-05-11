import { cache } from "react";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import { hasDisplayablePublicReview } from "@/utils/displayable-review";
import Header from "./index";

/**
 * Navbarda görünməməli olan marşrutlar.
 *
 * User tələbi: "Əgər hər hansı bölmədə dinamik məlumat 1 dənədən azdırsa ...
 * Navbarda və Səhifələrdə bu blok görsənməsin". Yəni section-da 0 item olarsa
 * həm navbar, həm də homepage-də bu bloku gizlədirik (istisna: `/offers`
 * — Kampaniyalar linki navbar-da həmişə qalır, boş səhifə öz empty-state ilə).
 * Homepage komponentləri
 * özləri də `items.length === 0` → `return null` edir, burada isə navbar üçün
 * eyni qaydanı tətbiq edirik.
 */
const DYNAMIC_ROUTES: { route: string; endpoint: string }[] = [
  /** Bir səhifəlik rəy kifayət deyil — filtrə düşən ən azı bir ictimai rəy olmalıdır */
  { route: "/reviews", endpoint: "/student-reviews?limit=80&sortBy=order&order=desc" },
  { route: "/projects", endpoint: "/student-projects?limit=1&sortBy=order&order=desc" },
  { route: "/gallery", endpoint: "/gallery?limit=1&sortBy=order&order=desc" },
  { route: "/blog", endpoint: "/posts/type/BLOG?page=1&limit=1" },
  { route: "/news/category/news", endpoint: "/posts/type/NEWS?page=1&limit=1" },
  { route: "/events", endpoint: "/posts/type/EVENT?page=1&limit=1" },
  { route: "/vacancies", endpoint: "/vacancies?limit=1" },
  { route: "/glossary/terms", endpoint: "/glossary?limit=1" },
];

function normalizeRoute(route: string) {
  if (route === "/") return route;
  return route.replace(/\/+$/, "");
}

const fetchSectionCounts = cache(async function fetchSectionCounts(): Promise<string[]> {
  const results = await Promise.all(
    DYNAMIC_ROUTES.map(async ({ route, endpoint }) => {
      try {
        const res = await fetch(`${PUBLIC_API_BASE}${endpoint}`, {
          next: { revalidate: 120 },
        });
        if (!res.ok) return route;
        const data = await res.json();
        const items = data?.items ?? (Array.isArray(data) ? data : []);

        if (route === "/reviews") {
          return hasDisplayablePublicReview(items) ? null : route;
        }

        return items.length === 0 ? route : null;
      } catch {
        return route;
      }
    })
  );
  return (results.filter(Boolean) as string[]).map(normalizeRoute);
});

export default async function HeaderWrapper() {
  const hiddenRoutes = await fetchSectionCounts();
  return <Header hiddenRoutes={hiddenRoutes} />;
}
