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
      autoplay={{ delay: 2000, disableOnInteraction: false }}
      className="swiper-courses !overflow-visible max-w-full py-8 px-2"
      style={{ overflow: "visible", paddingLeft: "8px", paddingRight: "8px" }}
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
          <SwiperSlide key={course.id} className="!h-auto box-border !overflow-visible">
            <Link
              href={`/${normalizedLocale}/course/${course.slug[normalizedLocale]}`}
              className="relative z-10 flex h-full w-full flex-col border-2 rounded-[28px] sm:rounded-[32px] overflow-hidden p-4 min-h-[220px] sm:p-6 sm:min-h-[380px] lg:min-h-[460px] transition-all duration-300 hover:shadow-lg hover:shadow-black/20 group transform hover:scale-[1.02] hover:z-[60]"
              style={{
                backgroundColor: cardStyle.backgroundColor,
                borderColor: cardStyle.borderColor,
                color: cardStyle.color,
              }}
            >
              <div
                className="absolute z-0 -top-12 -right-12 w-32 h-32 rounded-full opacity-60"
                style={{ backgroundColor: course.borderColor || "#F59E0B" }}
              />

              <div className="relative z-10 flex flex-col gap-3 pb-4 min-w-0">
                <div>
                  <h2 className="text-2xl font-bold leading-tight mb-1 text-jsblack">
                    {course.title[normalizedLocale]}
                  </h2>
                  <p
                    className="text-base font-normal"
                    style={{ color: course.textColor || "#1F2937" }}
                  >
                    {shortDesc}
                  </p>
                </div>

                <div className="space-y-2 mt-3">
                  {course.ageRange && (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-black">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-base text-black">
                        {normalizedLocale === "az" ? "Yaş:" : "Возраст:"}{" "}
                        {course.ageRange}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-black">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-base text-black">
                      {normalizedLocale === "az" ? "Səviyyə:" : "Уровень:"}{" "}
                      {course.level[normalizedLocale]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-black">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-base text-black">
                      {normalizedLocale === "az" ? "Müddət:" : "Длительность:"}{" "}
                      {course.duration} {normalizedLocale === "az" ? "ay" : "месяцев"}
                    </span>
                  </div>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.slice(0, 4).map((tag, i) => (
                      <span
                        key={i}
                        className="text-sm px-3 py-1.5 rounded-full shadow-sm font-medium"
                        style={{
                          color: course.textColor || "#1F2937",
                          backgroundColor: "rgba(255, 255, 255, 0.9)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {tags.length > 4 && (
                      <span
                        className="text-sm px-3 py-1.5 bg-white/90 rounded-full"
                        style={{ color: course.textColor || "#1F2937" }}
                      >
                        +{tags.length - 4} {normalizedLocale === "az" ? "daha" : "еще"}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="absolute bottom-0 right-0 z-[60]">
                <div className="relative h-[120px] w-[120px] sm:h-[180px] sm:w-[180px]">
                  <Image
                    src={getImageUrl(course.imageUrl)}
                    alt={course.title[normalizedLocale]}
                    fill
                    className="object-contain transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 639px) 120px, 180px"
                    quality={64}
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER_YELLOW}
                    priority={slideIndex === 0}
                    loading={slideIndex === 0 ? undefined : "lazy"}
                    decoding="async"
                  />
                </div>
              </div>
            </Link>
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
}
