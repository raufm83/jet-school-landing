"use client";

import { Locale } from "@/i18n/request";
import { Link } from "@/i18n/routing";
import { Course, CourseResponse } from "@/types/course";
import { BLUR_PLACEHOLDER_YELLOW } from "@/utils/imagePlaceholder";
import { buildImageUrl } from "@/utils/imageUrl";
import Image from "next/image";

interface ICoursesSlider {
  courses: CourseResponse;
  locale?: Locale;
}

const CourseListingClient = ({ courses, locale = "az" }: ICoursesSlider) => {

  const displayCourses = courses.items;
  if (!displayCourses) return null;

  const normalizedLocale = locale.slice(0, 2) as "az" | "ru";

  return (
    <div className="w-full">
      <style jsx>{`
        @keyframes scroll-tags {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .scrolling-tags {
          animation: scroll-tags 15s linear infinite;
          will-change: transform;
        }
        .scrolling-tags:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="relative">
        <div
          className="
            grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
            gap-4 sm:gap-5 md:gap-6 xl:gap-7 4xl:gap-8
            py-2 sm:py-4 lg:py-6 4xl:py-8
          "
        >
            {displayCourses.map((course: Course, index: number) => {
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
                <Link
                  key={course.id}
                  href={{
                    pathname: "/course/[slug]",
                    params: { slug: course.slug[normalizedLocale] },
                  }}
                  className="
                    relative z-20 flex flex-col
                    w-full border-2 
                    rounded-2xl sm:rounded-3xl lg:rounded-[32px] overflow-hidden
                    p-4 sm:p-5 lg:p-6
                    min-h-[200px] sm:min-h-[280px] lg:min-h-[320px]
                    justify-between
                    transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:z-[50]
                    group
                  "
                  style={{
                    backgroundColor: cardStyle.backgroundColor,
                    borderColor: cardStyle.borderColor,
                    color: cardStyle.color,
                  }}
                >
                  <div
                    className="absolute z-0 -top-8 -right-8 w-20 h-20 sm:-top-10 sm:-right-10 sm:w-24 sm:h-24 lg:-top-12 lg:-right-12 lg:w-32 lg:h-32 rounded-full opacity-60"
                    style={{ backgroundColor: course.borderColor || "#F59E0B" }}
                  />

                  <div className="relative z-10 flex flex-col gap-2 sm:gap-3 pb-2 sm:pb-4 min-w-0">
                    <div>
                      <h2
                        className="text-base sm:text-lg lg:text-xl font-bold leading-tight mb-0.5 sm:mb-1 text-jsblack"
                      >
                        {course.title[normalizedLocale]}
                      </h2>
                      <p
                        className="text-sm sm:text-sm lg:text-base line-clamp-2 font-light leading-snug"
                        style={{ color: course.textColor || "#1F2937" }}
                      >
                        {shortDesc}
                      </p>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2 mt-2 sm:mt-3">
                      {course.ageRange && (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-black">
                            <svg
                              className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white"
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
                          <span className="text-xs sm:text-sm lg:text-sm text-black">
                            <span className="font-bold">{normalizedLocale === "az" ? "Yaş:" : "Возраст:"}</span>{" "}
                            {course.ageRange}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-black">
                          <svg
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white"
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
                        <span className="text-xs sm:text-sm lg:text-sm text-black">
                          <span className="font-bold">{normalizedLocale === "az"
                            ? "Səviyyə:"
                            : "Уровень:"}</span>{" "}
                          {course.level[normalizedLocale]}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-black">
                          <svg
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white"
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
                        <span className="text-xs sm:text-sm lg:text-sm text-black">
                          <span className="font-bold">{normalizedLocale === "az"
                            ? "Müddət:"
                            : "Длительность:"}</span>{" "}
                          {course.duration}{" "}
                          {normalizedLocale === "az" ? "ay" : "месяцев"}
                        </span>
                      </div>
                    </div>

                    {/* ------- KAYAN TAGLAR (Marquee) ------- */}
                    {tags.length > 0 && (
                      <div className="mt-2 sm:mt-3 relative -mx-4 px-4 sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6 overflow-hidden">
                        <div className="scrolling-tags flex gap-1.5 sm:gap-2 w-max">
                          {tags.map((tag, i) => (
                            <span
                              key={i}
                              className="
                                text-xs sm:text-sm bg-white
                                px-2 py-1 sm:px-3 sm:py-1.5 rounded-full
                                shadow-sm font-medium
                                whitespace-nowrap flex-shrink-0
                              "
                              style={{
                                color: course.textColor || "#1F2937",
                                backgroundColor: "rgba(255, 255, 255, 0.9)",
                              }}
                            >
                              {tag}
                            </span>
                          ))}

                          {/* duplicasyon - kesintisiz akış için */}
                          {tags.map((tag, i) => (
                            <span
                              key={`dup-${i}`}
                              className="
                                text-xs sm:text-sm bg-white
                                px-2 py-1 sm:px-3 sm:py-1.5 rounded-full
                                shadow-sm font-medium
                                whitespace-nowrap flex-shrink-0
                              "
                              style={{
                                color: course.textColor || "#1F2937",
                                backgroundColor: "rgba(255, 255, 255, 0.9)",
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* ------- /KAYAN TAGLAR ------- */}
                  </div>

                  <div className="absolute bottom-0 right-0 z-[60]">
                    <div className="relative w-[100px] h-[100px] sm:w-[140px] sm:h-[140px] lg:w-[180px] lg:h-[180px]">
                      <Image
                        src={buildImageUrl(course.imageUrl)}
                        alt={course.title[normalizedLocale]}
                        fill
                        className="object-contain transition-transform duration-300 group-hover:scale-110"
                        sizes="(max-width: 640px) 100px, (max-width: 1024px) 140px, 180px"
                        quality={64}
                        placeholder="blur"
                        blurDataURL={BLUR_PLACEHOLDER_YELLOW}
                        priority={index === 0}
                        loading={index === 0 ? undefined : "lazy"}
                        decoding="async"
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
      </div>
    </div>
  );
};

export default CourseListingClient;
