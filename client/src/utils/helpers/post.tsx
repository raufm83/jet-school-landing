import { Locale } from "@/i18n/request";
import { Post } from "@/types/post";
import { PostType } from "@/types/enums";
import { MdArticle, MdEvent, MdFeed } from "react-icons/md";

/** Slug seçimi: cari dil, sonra AZ/RU fallback (kampaniya və s. üçün çox vacib) */
export function resolvePostSlugForLocale(
  post: Pick<Post, "slug"> | { slug?: Post["slug"] },
  locale: Locale
): string | null {
  const s = post.slug;
  if (!s || typeof s !== "object") return null;
  const pick = (v: unknown) =>
    typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  return pick(s[locale]) ?? pick(s.az) ?? pick(s.ru) ?? null;
}

/** Returns hero image URL for the given locale (handles legacy string and { az?, ru? }) */
export function getPostImageUrl(
  imageUrl: string | { az?: string; ru?: string } | undefined,
  locale: Locale
): string | undefined {
  if (!imageUrl) return undefined;
  if (typeof imageUrl === "string" && imageUrl.trim() !== "") return imageUrl;
  const obj = imageUrl as { az?: string; ru?: string };
  return obj[locale]?.trim() || obj.az?.trim() || obj.ru?.trim();
}

export const getPostTypeIcon = (postType: PostType) => {
  switch (postType) {
    case PostType.BLOG:
      return <MdArticle className="w-5 h-5" />;
    case PostType.NEWS:
      return <MdFeed className="w-5 h-5" />;
    case PostType.EVENT:
      return <MdEvent className="w-5 h-5" />;
    default:
      return null;
  }
};

export const getPostTypeName = (postType: PostType, t: any) => {
  switch (postType) {
    case PostType.BLOG:
      return t("blog");
    case PostType.NEWS:
      return t("news");
    case PostType.EVENT:
      return t("event");
    default:
      return postType;
  }
};

/** Kart və önbaxış üçün: entity və (əksər halda) təqləri təmizləyib boşluqları normallaşdırır. */
export function stripHtmlEntitiesToPlain(
  raw: string,
  opts?: { stripHtmlTags?: boolean },
): string {
  if (raw == null || typeof raw !== "string") return "";
  let s =
    opts?.stripHtmlTags === false ? raw : raw.replace(/<[^>]*>/g, "");
  /* Boş/abzas placeholder-ləri (WYSIWYG-dən) */
  s = s.replace(/&(?:nbsp|nsbp);/gi, " ");
  s = s.replace(/&#0*160;|&#x0*A0;/gi, " ");
  /* Qalan nömrəli referanslar */
  s = s.replace(/&#(\d+);/g, (_, n) => {
    const c = Number.parseInt(n, 10);
    return Number.isFinite(c) ? String.fromCodePoint(c) : _;
  });
  s = s.replace(/&#x([\da-fA-F]+);/gi, (_, h) => {
    const c = Number.parseInt(h, 16);
    return Number.isFinite(c) ? String.fromCodePoint(c) : _;
  });
  s = s
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'");
  /* İkinci pass: &amp;nbsp; kimi ikiqat kodlama */
  s = s.replace(/&(?:nbsp|nsbp);/gi, " ").replace(/\u00a0/g, " ");
  return s.replace(/\s+/g, " ").trim();
}

export const getTextContent = (content: any, locale: string) => {
  let textContent = "";
  try {
    if (typeof content[locale] === "string") {
      textContent = stripHtmlEntitiesToPlain(content[locale]);
    } else if (content[locale]?.["content[az]"]) {
      const inner =
        locale === "az"
          ? content[locale]["content[az]"]
          : content[locale]["content[ru]"];
      textContent =
        typeof inner === "string" ? stripHtmlEntitiesToPlain(inner) : "";
    }
  } catch (error) {
    console.error("Error parsing content:", error);
    textContent = "";
  }

  return textContent;
};
