import SectionTitle from "@/components/shared/section-title";
import { CONTENT_ISR_SECONDS } from "@/constants/content-isr";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import { Locale } from "@/i18n/request";
import { Course, CourseResponse } from "@/types/course";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { BLUR_PLACEHOLDER_YELLOW } from "@/utils/imagePlaceholder";
import { buildImageUrl } from "@/utils/imageUrl";

const getCourses = async (locale: string): Promise<CourseResponse | null> => {
  try {
    const res = await fetch(
      `${PUBLIC_API_BASE}/courses?lang=${locale}`,
      {
        next: {
          revalidate: CONTENT_ISR_SECONDS,
        },
      }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export default async function CoursesSlider() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("courseInfo");
  const courses = await getCourses(locale);

  const displayCourses = courses?.items;
  if (!displayCourses?.length) return null;

  const normalizedLocale = locale.slice(0, 2) as "az" | "ru";

  return (
    <div className="container mx-auto my-10 sm:my-14 lg:my-16 p-0">
      <SectionTitle home title={t("title")} description={t("description")} />
      <div
        className="
          grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
          gap-4 sm:gap-5 md:gap-6 lg:gap-6 xl:gap-7
          py-3 sm:py-4 lg:py-6
        "
      >
        {displayCourses.map((course: Course, index: number) => {
          const tags = course.newTags?.[normalizedLocale] ?? course.tag ?? [];
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
              className="relative z-20 flex flex-col w-full border-2 rounded-2xl sm:rounded-3xl lg:rounded-[32px] overflow-hidden p-4 sm:p-5 lg:p-5 xl:p-6 min-h-[200px] sm:min-h-[260px] md:min-h-[280px] lg:min-h-[300px] justify-between transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:z-[50] group"
              style={{
                backgroundColor: cardStyle.backgroundColor,
                borderColor: cardStyle.borderColor,
                color: cardStyle.color,
              }}
            >
              <div
                className="absolute z-0 -top-8 sm:-top-9 lg:-top-10 -right-8 sm:-right-9 lg:-right-10 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full opacity-60"
                style={{ backgroundColor: course.borderColor || "#F59E0B" }}
              />

              <div className="relative z-10 flex flex-col gap-2 sm:gap-3 pb-3 sm:pb-4 min-w-0">
                <div>
                  <h2 className="text-base sm:text-lg lg:text-xl font-bold leading-tight mb-1 sm:mb-2 text-black">
                    {course.title[normalizedLocale]}
                  </h2>
                  <p
                    className="text-sm font-normal lg:text-base leading-relaxed line-clamp-2"
                    style={{ color: course.textColor || "#1F2937" }}
                  >
                    {shortDesc}
                  </p>
                </div>

                <div className="space-y-1 sm:space-y-1.5 mt-2 sm:mt-3">
                  {course.ageRange && (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 bg-black">
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-xs sm:text-sm text-black">
                        {normalizedLocale === "az" ? "Yaş:" : "Возраст:"} {course.ageRange}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 bg-black">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm text-black">
                      {normalizedLocale === "az" ? "Səviyyə:" : "Уровень:"} {course.level[normalizedLocale]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 bg-black">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm text-black">
                      {normalizedLocale === "az" ? "Müddət:" : "Длительность:"} {course.duration} {normalizedLocale === "az" ? "ay" : "месяцев"}
                    </span>
                  </div>
                </div>

                {tags.length > 0 && (
                  <div className="mt-3 sm:mt-4 relative -mx-4 sm:-mx-5 lg:-mx-6 px-4 sm:px-5 lg:px-6 overflow-hidden">
                    <div className="scrolling-tags flex gap-1.5 sm:gap-2 w-max">
                      {[...tags, ...tags].map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm font-medium whitespace-nowrap flex-shrink-0"
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
              </div>

              <div className="absolute bottom-0 right-0 z-[60]">
                <div className="relative w-[100px] h-[100px] sm:w-[140px] sm:h-[140px] lg:w-[160px] lg:h-[160px]">
                  <Image
                    src={buildImageUrl(course.imageUrl)}
                    alt={course.title[normalizedLocale]}
                    fill
                    className="object-contain transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 640px) 120px, (max-width: 1024px) 140px, 160px"
                    quality={62}
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
  );
}
