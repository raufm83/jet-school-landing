"use client";

import React from "react";
import Link from "next/link";
import { StudentReview } from "@/types/student-reviews";
import ReviewCard from "@/components/views/landing/reviews/review-card";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { useTranslations } from "next-intl";

interface CourseReviewsProps {
  reviews: StudentReview[];
  locale: string;
}

export default function CourseReviews({ reviews, locale }: CourseReviewsProps) {
  const t = useTranslations("singleCoursePage");
  
  if (!reviews || reviews.length === 0) return null;

  const displayReviews = reviews.slice(0, 4);

  return (
    <div className="w-full flex flex-col gap-6 md:gap-8">
      <h2 className="text-[clamp(28px,3vw,46px)] [@media(min-width:3500px)]:!text-6xl font-bold text-jsblack">
        {t("reviews") || "Valideyn rəyləri"}
      </h2>

      {/* Desktop Grid (Hidden on Mobile) */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-6">
        {displayReviews.map((review, index) => (
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

      {/* Mobile Carousel (Hidden on Desktop) */}
      <div className="block lg:hidden w-full overflow-hidden">
        <Swiper
          modules={[Autoplay]}
          spaceBetween={16}
          slidesPerView={1}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          className="!overflow-hidden py-4"
        >
          {displayReviews.map((review, index) => (
            <SwiperSlide key={review.id}>
              <ReviewCard
                loadEager={index === 0}
                imageUrl={review.imageUrl}
                link={review.link}
                title={(review.title ?? { az: "", ru: "" }) as { az: string; ru: string }}
                description={(review.description ?? { az: "", ru: "" }) as { az: string; ru: string }}
                course={review.course}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="mt-4">
        <Link
          href={`/${locale}/${locale === "ru" ? "otzyvy" : "reyler"}`}
          target="_blank"
          className="inline-block text-jsyellow font-semibold border-b-[2px] border-jsyellow hover:text-jsblack hover:border-jsblack transition-colors text-lg pb-1"
        >
          {t("seeAllReviews") || "Bütün rəylərə bax"}
        </Link>
      </div>
    </div>
  );
}
