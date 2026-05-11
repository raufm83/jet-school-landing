import SectionTitle from "@/components/shared/section-title";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import Button from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { isDisplayablePublicReview } from "@/utils/displayable-review";
import { MdArrowRightAlt } from "react-icons/md";
import ReviewCard from "@/components/views/landing/reviews/review-card";

const PREVIEW_COUNT = 3;

interface ReviewItem {
  id: string;
  imageUrl: string | null;
  link: string | null;
  title?: { az?: string; ru?: string } | null;
  description?: { az?: string; ru?: string } | null;
  course: { id: string; title: { az: string; ru: string } } | null;
}

const fetchReviews = async () => {
  try {
    const res = await fetch(
      `${PUBLIC_API_BASE}/student-reviews?sortBy=order&order=desc`,
      { next: { revalidate: 120 } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return null;
  }
};

export default async function Reviews() {
  const t = await getTranslations("reviews");
  const data = await fetchReviews();
  const filtered: ReviewItem[] = (data?.items ?? []).filter(
    (r: ReviewItem) => isDisplayablePublicReview(r)
  );
  if (!filtered.length) return null;

  const previewItems = filtered.slice(0, PREVIEW_COUNT);

  return (
    <div
      id="reviews"
      className="
        container mx-auto
        my-20 4xl:my-24
        p-0
        flex flex-col
        gap-8 4xl:gap-12
      "
    >
      <SectionTitle home title={t("homeSectionTitle")} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 4xl:gap-10">
        {previewItems.map((review, index) => (
          <ReviewCard
            key={review.id}
            loadEager={index === 0}
            imageUrl={review.imageUrl}
            link={review.link}
            title={(review.title ?? { az: "", ru: "" }) as { az: string; ru: string }}
            description={(review.description ?? { az: "", ru: "" }) as { az: string; ru: string }}
            course={review.course}
          />
        ))}
      </div>

      <Link href="/reviews">
        <Button
          iconPosition="right"
          className="items-center mx-auto py-3 4xl:py-4 px-6 4xl:px-8"
          icon={<MdArrowRightAlt size={24} />}
          text={t("seeAll")}
        />
      </Link>
    </div>
  );
}
