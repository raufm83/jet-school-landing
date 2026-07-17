"use client";

import { Course } from "@/types/course";
import { BLUR_PLACEHOLDER_YELLOW } from "@/utils/imagePlaceholder";
import Image from "next/image";
import Link from "next/link";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

interface SwiperCoursesProps {
  courses: Course[];
  normalizedLocale: "az" | "ru";
  getImageUrl: (imageUrl?: string) => string;
}

export default function SwiperCourses({
  courses,
  normalizedLocale,
  getImageUrl,
}: SwiperCoursesProps) {
  return (
    <div className="relative w-full overflow-hidden">
      <Swiper
        modules={[Autoplay]}
        spaceBetween={24}
        breakpoints={{
          0: { slidesPerView: 1, centeredSlides: false, spaceBetween: 14 },
          480: { slidesPerView: 1, centeredSlides: false, spaceBetween: 16 },
          640: { slidesPerView: 2, centeredSlides: false, spaceBetween: 20 },
          1200: { slidesPerView: 3, centeredSlides: false, spaceBetween: 24 },
          1400: { slidesPerView: 4, centeredSlides: false, spaceBetween: 24 },
        }}
        autoplay={{
          delay: 2000,
          disableOnInteraction: false,
        }}
        className="swiper-courses max-w-full !overflow-hidden py-6"
      >
        {courses.map((course: Course, slideIndex: number) => {
          const tags =
            course.newTags?.[normalizedLocale] ?? course.tag ?? [];

          const cardStyle = {
            backgroundColor: course.backgroundColor || "#FEF3C7",
            borderColor: course.borderColor || "#F59E0B",
            color: course.textColor || "#1F2937",
          };

          const shortDesc =
            course.shortDescription?.[normalizedLocale] ||
            (normalizedLocale === "az"
              ? "Texnologiya dünyasına ilk addımını at!"
              : "Сделай первый шаг в мир технологий!");

          return (
            <SwiperSlide
              key={course.id}
              className="!h-auto box-border py-4"
            >
              <Link
                href={`/${normalizedLocale}/course/${course.slug[normalizedLocale]}`}
                className="
                  group
                  relative
                  flex
                  h-full
                  w-full
                  flex-col
                  overflow-hidden
                  rounded-[28px]
                  border-2
                  p-4
                  sm:rounded-[32px]
                  sm:p-6
                  min-h-[220px]
                  sm:min-h-[380px]
                  lg:min-h-[460px]
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:shadow-md
                  hover:shadow-black/20
                "
                style={{
                  backgroundColor: cardStyle.backgroundColor,
                  borderColor: cardStyle.borderColor,
                  color: cardStyle.color,
                }}
              >
                {/* Decorative Circle */}
                <div
                  className="absolute -top-12 -right-12 z-0 h-32 w-32 rounded-full opacity-60"
                  style={{
                    backgroundColor:
                      course.borderColor || "#F59E0B",
                  }}
                />

                {/* Content */}
                <div className="relative z-10 flex min-w-0 flex-1 flex-col pb-4">
                  <div>
                    <h3 className="mb-1 text-2xl font-bold leading-tight text-jsblack">
                      {course.title[normalizedLocale]}
                    </h3>

                    <p
                      className="text-base font-normal"
                      style={{
                        color:
                          course.textColor || "#1F2937",
                      }}
                    >
                      {shortDesc}
                    </p>
                  </div>

                  <div className="mt-3 space-y-2">
                    {course.ageRange && (
                      <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-black">
                          <svg
                            className="h-3 w-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>

                        <span className="text-base text-black">
                          <span className="font-bold">{normalizedLocale === "az"
                            ? "Yaş:"
                            : "Возраст:"}</span>{" "}
                          {course.ageRange}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-black">
                        <svg
                          className="h-3 w-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>

                      <span className="text-base text-black">
                        <span className="font-bold">{normalizedLocale === "az"
                          ? "Səviyyə:"
                          : "Уровень:"}</span>{" "}
                        {course.level[normalizedLocale]}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-black">
                        <svg
                          className="h-3 w-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>

                      <span className="text-base text-black">
                        <span className="font-bold">{normalizedLocale === "az"
                          ? "Müddət:"
                          : "Длительность:"}</span>{" "}
                        {course.duration}{" "}
                        {normalizedLocale === "az"
                          ? "ay"
                          : "месяцев"}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="relative z-0 mt-auto pt-6 -mx-4 overflow-hidden px-4 sm:-mx-6 sm:px-6">
                      <div className="scrolling-tags flex w-max gap-2" style={{ animationDuration: `${tags.length * 2}s` }}>
                        {[...tags, ...tags].map((tag, index) => (
                          <span
                            key={index}
                            className="inline-block rounded-full bg-white/90 px-3.5 py-1.5 text-sm font-normal shadow-sm whitespace-nowrap"
                            style={{
                              color: course.textColor || "#1F2937",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Image */}
                <div className="absolute bottom-3 right-3 z-10 pointer-events-none drop-shadow-lg">
                  <div className="relative h-[120px] w-[120px] sm:h-[160px] sm:w-[160px]">
                    <Image
                      src={getImageUrl(course.imageUrl)}
                      alt={course.title[normalizedLocale]}
                      fill
                      className="
                        object-contain object-right-bottom
                        transition-transform
                        duration-300
                        group-hover:scale-105
                      "
                      sizes="(max-width: 639px) 120px, 160px"
                      quality={64}
                      placeholder="blur"
                      blurDataURL={BLUR_PLACEHOLDER_YELLOW}
                      priority={slideIndex === 0}
                    />
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
