import { PostType } from "@/types/enums";

export type PostListingPaginationTarget = {
  pathname: "/blog" | "/news" | "/events" | "/offers" | "/search/tag/[tag]";
  params?: { tag: string };
};

/** PostGrid / Pagination üçün next-intl pathname (dinamik `[slug]` yox) */
export function getPostListingPaginationTarget(
  type?: PostType,
  paginationBasePath?: string
): PostListingPaginationTarget {
  if (paginationBasePath) {
    const tagMatch = paginationBasePath.match(/^\/search\/tag\/(.+)$/);
    if (tagMatch) {
      let tag = tagMatch[1];
      try {
        tag = decodeURIComponent(tag);
      } catch {
        /* olduğu kimi */
      }
      return {
        pathname: "/search/tag/[tag]",
        params: { tag },
      };
    }
  }

  switch (type) {
    case PostType.BLOG:
      return { pathname: "/blog" };
    case PostType.OFFERS:
      return { pathname: "/offers" };
    case PostType.EVENT:
      return { pathname: "/events" };
    default:
      return { pathname: "/news" };
  }
}

/**
 * Siyahı pagination üçün tam URL (`trailingSlash: true` ilə uyğun).
 * next-intl `Link` `/blog` + `query` bəzən `/blog/undefined/` yaradır — ona görə string URL.
 */
export function buildPostListingPageUrl(
  locale: string,
  target: PostListingPaginationTarget,
  page: number,
  searchParams?: URLSearchParams | null
): string {
  let path: string;
  if (target.pathname === "/search/tag/[tag]" && target.params?.tag) {
    path = `/${locale}/search/tag/${encodeURIComponent(target.params.tag)}/`;
  } else {
    const segment = target.pathname.replace(/^\//, "");
    path = `/${locale}/${segment}/`;
  }

  const params = new URLSearchParams();
  if (searchParams) {
    searchParams.forEach((value, key) => {
      if (key !== "page") params.set(key, value);
    });
  }
  if (page > 1) params.set("page", String(page));

  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
