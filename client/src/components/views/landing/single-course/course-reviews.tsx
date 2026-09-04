"use client";

import React from "react";
import Link from "next/link";
import { StudentReview } from "@/types/student-reviews";
import ReviewCard from "@/components/views/landing/reviews/review-card";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { useTranslations } from "next-intl";

interface CourseReviewsProps {
  reviews: StudentReview[];
  locale: string;
}

export default function CourseReviews({ reviews, locale }: CourseReviewsProps) {
  const t = useTranslations("singleCoursePage");
  
  if (!reviews || reviews.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-6 md:gap-8">
      <h2 className="text-3xl md:text-4xl font-bold text-jsblack">
        {t("reviews") || "Valideyn rəyləri"}
      </h2>

      <div className="w-full overflow-hidden">
        <Swiper
          modules={[Autoplay, Navigation]}
          spaceBetween={16}
          navigation={true}
          style={{ "--swiper-navigation-color": "#ffb800", "--swiper-navigation-size": "24px" } as React.CSSProperties}
          breakpoints={{
            320: { slidesPerView: 1 },
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 4 },
          }}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          className="!overflow-hidden py-4"
        >
          {reviews.map((review, index) => (
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

      <div className="mt-6 flex justify-center w-full">
        <Link
          href={`/${locale}/${locale === "ru" ? "otzyvy" : "reyler"}`}
          target="_blank"
          className="inline-flex items-center justify-center bg-jsyellow text-white px-8 py-3 rounded-full font-bold hover:bg-jsblack transition-all text-lg shadow-md hover:shadow-lg"
        >
          {t("seeAllReviews") || "Bütün rəylərə bax"}
        </Link>
      </div>
    </div>
  );
}
