import { Locale } from "@/i18n/request";
import { Post } from "@/types/post";
import { formatDate, formatTime } from "@/utils/formatters/formatDate";
import { getTextContent, getPostImageUrl, resolvePostSlugForLocale } from "@/utils/helpers/post";
import { buildImageUrl } from "@/utils/imageUrl";
import { BLUR_PLACEHOLDER_SVG } from "@/utils/imagePlaceholder";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { MdCalendarToday, MdAccessTime } from "react-icons/md";

interface PostCardProps {
  post: Post;
  locale: Locale;
  t: any;
  /** Yalnız `index === 0` üçün: priority + lazy yox, qalan sətir üçün lazy */
  loadEager?: boolean;
}

export default function PostCard({ post, locale, t, loadEager = false }: PostCardProps) {
  const rawDate =
    post.postType === "OFFERS"
      ? post.offerEndDate || post.createdAt
      : post.eventDate || post.createdAt;
  const datePart = formatDate(rawDate);
  const timePart =
    post.postType === "OFFERS" ? null : formatTime(rawDate);
  const title = post.title[locale];
  const slug = resolvePostSlugForLocale(post, locale) ?? post.id;

  const displayTags = Array.isArray(post.tags) ? post.tags : (post.tags?.[locale] ?? []);

  const content = getTextContent(post.content, locale);
  const contentPreview =
    content.substring(0, 150) + (content.length > 150 ? "..." : "");

  // URL-i bir dəfə hesabla — şərt yoxlaması üçün də, src üçün də eyni dəyər
  const rawImageUrl = getPostImageUrl(post.imageUrl, locale);
  const imageSrc = rawImageUrl ? buildImageUrl(rawImageUrl) : null;

  const postPathname =
    post.postType === "BLOG"
      ? "/blog/[slug]"
      : post.postType === "OFFERS"
        ? "/offers/[slug]"
        : post.postType === "EVENT"
          ? "/events/[slug]"
          : "/news/[slug]";

  return (
    <Link
      href={{ pathname: postPathname, params: { slug } }}
      className="bg-[#fef7eb] border border-jsyellow rounded-3xl overflow-hidden 
        flex flex-col h-full transition-all duration-300  
        hover:shadow-lg hover:shadow-[rgba(252,174,30,0.15)]"
    >
  {imageSrc && (
    <div
      className="
        w-full relative overflow-hidden bg-jsyellow/15
        aspect-[4/3] sm:aspect-[3/2] md:aspect-[16/9]
        [@media(min-width:3500px)]:aspect-[21/9]
      "
    >
      <Image
        src={imageSrc}
        alt={post.imageAlt?.[locale] || (typeof title === "string" ? title : "Post image")}
        fill
        priority={loadEager}
        loading={loadEager ? undefined : "lazy"}
        decoding="async"
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER_SVG}
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
        quality={64}
        className="object-cover object-center transition-transform duration-500 hover:scale-105"
      />
    </div>
  )}

  <div className="p-6 flex flex-col flex-grow">
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
      {post.postType === "OFFERS" && (
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide [@media(min-width:3500px)]:!text-base">
          {t("expiryDateLabel")}
        </span>
      )}
      {post.postType === "EVENT" && (
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide [@media(min-width:3500px)]:!text-base">
          {t("eventDateLabel")}
        </span>
      )}
      <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 [@media(min-width:3500px)]:!text-xl">
        <MdCalendarToday className="shrink-0 text-jsyellow size-4 [@media(min-width:3500px)]:size-5" aria-hidden />
        {datePart}
      </span>
      {timePart != null && (
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 [@media(min-width:3500px)]:!text-xl">
          <MdAccessTime className="shrink-0 text-jsyellow size-4 [@media(min-width:3500px)]:size-5" aria-hidden />
          {timePart}
        </span>
      )}
    </div>

    <h2 className="text-xl font-bold mb-3 [@media(min-width:3500px)]:!text-4xl line-clamp-2">
      {typeof title === "string" ? title : title?.["title[az]"] || ""}
    </h2>

    <p className="text-gray-600 [@media(min-width:3500px)]:!text-2xl mb-4 line-clamp-3 flex-grow">
      {contentPreview}
    </p>

    <div className="mt-auto flex items-center justify-between">
      <span className="text-black [@media(min-width:3500px)]:!text-2xl font-medium hover:underline">
        {t("readMore")} →
      </span>

      {displayTags.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-end">
          {displayTags.slice(0, 1).map((tag, index) => (
            <span
              key={index}
              className="bg-jsyellow/10 text-jsblack px-2 py-1 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {displayTags.length > 2 && (
            <span className="bg-jsyellow/10 text-jsblack px-2 py-1 text-xs rounded-full">
              +{displayTags.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
      </div>
    </Link>
  );
}
