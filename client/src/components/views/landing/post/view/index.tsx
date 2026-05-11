import PostHero from "@/components/views/landing/post/hero";
import RelatedPosts from "@/components/views/landing/post/related";
import PostAuthorCard from "@/components/views/landing/post/author-card";
import { Locale } from "@/i18n/request";
import { PostType } from "@/types/enums";
import { formatDate, formatDateTime } from "@/utils/formatters/formatDate";
import { getPostImageUrl } from "@/utils/helpers/post";
import ContactFormForBlog from "@/components/views/landing/contact-us/contact-form-for-blog";
import BreadcrumbContextWrapper from "@/hooks/BreadcrumbContextWrapper";
import Breadcrumbs from "@/components/views/landing/bread-crumbs/bread-crumbs";
import { Post } from "@/types/post";

interface SinglePostViewProps {
  post: Post;
  locale: Locale;
  t: any;
  /** Server-fetched related posts for "Digər bloqlar" / related slider */
  relatedPosts?: Post[];
}

export default function SinglePostView({ post, locale, t, relatedPosts: initialRelatedPosts }: SinglePostViewProps) {
  const formattedDate = formatDateTime(post.createdAt);
  const isEvent = post.postType === PostType.EVENT;

  const getPostTypeName = (type: PostType) => {
    switch (type) {
      case PostType.BLOG:
        return "blog";
      case PostType.NEWS:
        return "news";
      case PostType.EVENT:
        return "event";
      case PostType.OFFERS:
        return "offers";
      default:
        return type;
    }
  };

  const pageTitle = post.title?.[locale] ?? "";

  return (
    <BreadcrumbContextWrapper title={pageTitle} postType={post.postType}>
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pt-4">
        <Breadcrumbs />
      </div>
      <main className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="flex flex-col lg:flex-row gap-8 py-20">
            <div className="w-full flex flex-col gap-8 lg:w-2/3">
              <PostHero
                locale={locale}
                title={pageTitle}
                type={t(`postType.${getPostTypeName(post.postType).toLowerCase()}`)}
                date={formattedDate}
                eventDate={
                  post.postType === PostType.OFFERS && post.offerEndDate
                    ? formatDate(post.offerEndDate) || undefined
                    : isEvent && post.eventDate
                    ? formatDateTime(post.eventDate) || undefined
                    : undefined
                }
                content={String(post.content?.[locale] ?? "")}
                tags={Array.isArray(post.tags) ? post.tags : (post.tags?.[locale] ?? [])}
                imageUrl={getPostImageUrl(post.imageUrl, locale)}
                dateText={t("dateLabel")}
                eventDateText={t("eventDateLabel")}
                timeText={t("timeLabel")}
                tagsText={t("tagsLabel")}
              />
              {post.postType === PostType.BLOG &&
                post.author?.role === "AUTHOR" && (
                  <PostAuthorCard author={post.author} authorLabel={t("authorLabel")} locale={locale} />
                )}
              <section className="mt-8" aria-label={post.postType === PostType.BLOG ? t("relatedBlogs") : t("relatedPosts")}>
                <RelatedPosts
                  title={post.postType === PostType.BLOG ? t("relatedBlogs") : t("relatedPosts")}
                  locale={locale}
                  currentPostId={post.id}
                  postType={post.postType}
                  tags={Array.isArray(post.tags) ? post.tags : (post.tags?.[locale] ?? [])}
                  initialRelatedPosts={initialRelatedPosts}
                />
              </section>
            </div>
            <div className="w-full lg:w-1/3 lg:sticky lg:top-7 h-fit">
              <ContactFormForBlog />
            </div>
          </div>
        </div>
      </main>
    </BreadcrumbContextWrapper>
  );
}
