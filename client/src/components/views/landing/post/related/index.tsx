"use client";

import { getRelatedPosts, getAllPosts } from "@/utils/api/post";
import { Post } from "@/types/post";
import { Locale } from "@/i18n/request";
import { PostType } from "@/types/enums";
import { useEffect, useRef, useState } from "react";

import { formatDateTime } from "@/utils/formatters/formatDate";
import { getPostImageUrl, resolvePostSlugForLocale } from "@/utils/helpers/post";
import { buildImageUrl } from "@/utils/imageUrl";
import { BLUR_PLACEHOLDER_SVG } from "@/utils/imagePlaceholder";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Autoplay, Navigation } from "swiper/modules";

interface RelatedPostsProps {
  title: string;
  locale: Locale;
  currentPostId: string;
  postType: PostType;
  tags: string[];
  /** Server-fetched related posts; when set, slider shows these immediately without waiting for client fetch */
  initialRelatedPosts?: Post[];
}

export default function RelatedPosts({
  title,
  locale,
  currentPostId,
  postType,
  tags,
  initialRelatedPosts,
}: RelatedPostsProps) {
  const t = useTranslations("blogPage");
  const [relatedPosts, setRelatedPosts] = useState<Post[]>(
    Array.isArray(initialRelatedPosts) && initialRelatedPosts.length > 0
      ? initialRelatedPosts
      : []
  );
  const hasInitial = Array.isArray(initialRelatedPosts) && initialRelatedPosts.length > 0;

  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (hasInitial) return;
    const fetchPosts = async () => {
      try {
        let relatedResult: Post[] = [];
        try {
          relatedResult = await getRelatedPosts({
            postId: currentPostId,
            postType,
            tags,
            locale,
            limit: 6,
          });
        } catch {
          // fallback below
        }

        let filteredResult = relatedResult.filter(
          (post) => post.postType === postType && post.id !== currentPostId
        );

        if (filteredResult.length < 3) {
          const sameTypePosts = await getAllPosts({
            page: 1,
            limit: 20,
            postType,
          });
          const items = sameTypePosts?.items ?? [];
          const moreSameTypePosts = items
            .filter(
              (post) =>
                post.id !== currentPostId &&
                !filteredResult.some((fp) => fp.id === post.id)
            )
            .slice(0, 6 - filteredResult.length);

          filteredResult = [...filteredResult, ...moreSameTypePosts];
        }

        if (filteredResult.length < 3) {
          const allPostsResult = await getAllPosts({
            page: 1,
            limit: 20,
          });
          const items = allPostsResult?.items ?? [];
          const differentTypePosts = items
            .filter(
              (post) =>
                post.id !== currentPostId &&
                !filteredResult.some((fp) => fp.id === post.id)
            )
            .slice(0, 6 - filteredResult.length);

          filteredResult = [...filteredResult, ...differentTypePosts];
        }

        setRelatedPosts(filteredResult.slice(0, 6));
      } catch {
        try {
          const fallbackResult = await getAllPosts({
            page: 1,
            limit: 6,
          });
          const items = fallbackResult?.items ?? [];
          const fallbackPosts = items.filter(
            (post) => post.id !== currentPostId
          );
          setRelatedPosts(fallbackPosts.slice(0, 3));
        } catch {
          setRelatedPosts([]);
        }
      }
    };

    fetchPosts();
  }, [currentPostId, postType, tags, locale, hasInitial]);

  const hasPosts = relatedPosts.length > 0;
  const canLoop = relatedPosts.length > 1;

  return (
    <div className="mt-12 relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {hasPosts && (
          <div className="flex gap-2">
            <button
              ref={prevRef}
              className="related-prev w-10 h-10 flex items-center justify-center bg-[#FFF7E6] rounded-full border border-jsyellow hover:bg-jsyellow hover:text-white transition"
              aria-label="Əvvəlki"
              type="button"
            >
              <svg width="24" height="24" fill="none">
                <path
                  d="M15 6l-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              ref={nextRef}
              className="related-next w-10 h-10 flex items-center justify-center bg-[#FFF7E6] rounded-full border border-jsyellow hover:bg-jsyellow hover:text-white transition"
              aria-label="Növbəti"
              type="button"
            >
              <svg width="24" height="24" fill="none">
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {!hasPosts ? (
        <p className="text-gray-500 mt-2">
          {t("noPostsFound") || "No related posts available"}
        </p>
      ) : (
        <Swiper
          loop={canLoop}
          autoplay={canLoop ? { delay: 3000, disableOnInteraction: false } : false}
          modules={[Autoplay, Navigation]}
          spaceBetween={24}
          slidesPerView={1.15}
          navigation={{
            prevEl: ".related-prev",
            nextEl: ".related-next",
          }}
          breakpoints={{
            480: { slidesPerView: 1.4, spaceBetween: 16 },
            640: { slidesPerView: 2, spaceBetween: 20 },
            768: { slidesPerView: 2, spaceBetween: 24 },
            1024: { slidesPerView: 3, spaceBetween: 24 },
          }}
        >
          {relatedPosts.map((post, index) => (
            <SwiperSlide key={post.id}>
              <div className="h-full">
                <RelatedPostCard
                  post={post}
                  locale={locale}
                  t={t}
                  loadEager={index === 0}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
}

interface RelatedPostCardProps {
  post: Post;
  locale: Locale;
  t: (key: string) => string;
  loadEager?: boolean;
}

function RelatedPostCard({ post, locale, t, loadEager = false }: RelatedPostCardProps) {
  const formattedDate = formatDateTime(post.createdAt);

  const getPostTypeLabel = (type: PostType) => {
    switch (type) {
      case PostType.BLOG:
        return t("blog");
      case PostType.NEWS:
        return t("news");
      case PostType.EVENT:
        return t("event");
      case PostType.OFFERS:
        return t("offers");
      default:
        return type;
    }
  };

  const contentPreview =
    (post.content?.[locale]?.replace(/<[^>]*>/g, "")?.slice(0, 100) ?? "") +
    "...";

  const postPathname =
    post.postType === PostType.BLOG
      ? "/blog/[slug]"
      : post.postType === PostType.OFFERS
        ? "/offers/[slug]"
        : post.postType === PostType.EVENT
          ? "/events/[slug]"
          : "/news/[slug]";

  const slug = resolvePostSlugForLocale(post, locale) ?? post.id;

  const readMoreText =
    t("readMore") || (locale === "az" ? "Daha çox oxu" : "Читать далее");

  return (
    <Link
      href={{ pathname: postPathname, params: { slug } }}
      title={post.title?.[locale] || "Post"}
      className="group relative flex flex-col h-full min-h-[450px] bg-[#fef7eb] border border-jsyellow/50 rounded-[32px] overflow-hidden transition-all duration-300 ease-out hover:border-jsyellow hover:shadow-md hover:-translate-y-1"
    >
      {getPostImageUrl(post.imageUrl, locale) && (
        <div className="w-full relative h-[200px] overflow-hidden">
          <Image
            src={buildImageUrl(getPostImageUrl(post.imageUrl, locale))}
            alt={post.title?.[locale] || "Post image"}
            title={post.title?.[locale] || undefined}
            fill
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER_SVG}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            quality={64}
            priority={loadEager}
            loading={loadEager ? undefined : "lazy"}
            decoding="async"
            className="object-cover sm:object-contain object-center"
          />
        </div>
      )}
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-medium text-gray-500">
            {formattedDate}
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              post.postType === PostType.BLOG
                ? "bg-blue-100 text-blue-800"
                : post.postType === PostType.NEWS
                ? "bg-green-100 text-green-800"
                : post.postType === PostType.EVENT
                ? "bg-purple-100 text-purple-800"
                : post.postType === PostType.OFFERS
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {getPostTypeLabel(post.postType)}
          </span>
        </div>
        <p className="font-semibold text-xl mb-3 line-clamp-2">
          {post.title?.[locale] || "Title not available"}
        </p>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
          {contentPreview}
        </p>
        <span className="text-jsyellow font-medium hover:underline">
          {readMoreText} →
        </span>
      </div>
    </Link>
  );
}
