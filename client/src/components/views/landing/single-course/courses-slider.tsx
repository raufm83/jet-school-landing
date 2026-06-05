"use client";

import SectionTitle from "@/components/shared/section-title";
import { Locale } from "@/i18n/request";
import { Course, CourseResponse } from "@/types/course";
import { buildImageUrl } from "@/utils/imageUrl";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

interface SwiperCoursesProps {
  courses: Course[];
  normalizedLocale: "az" | "ru";
  getImageUrl: (imageUrl?: string) => string;
}

const SwiperCourses = dynamic<SwiperCoursesProps>(() => import("./courses-swiper"), {
  ssr: false,
  loading: () => null,
});

interface ICoursesSlider {
  courses: CourseResponse;
  locale?: Locale;
  title?: string;
}


const CoursesSlider = ({ courses, locale = "az", title }: ICoursesSlider) => {
  const t = useTranslations("courseInfoCP");

  const displayCourses = courses.items;
  if (!displayCourses) return null;

  const normalizedLocale = locale.slice(0, 2) as "az" | "ru";

  return (
    <div className="flex flex-col gap-8">
      <SectionTitle title={title || t("title")} />
      <div className="relative w-full min-w-0 max-w-full ">
        <SwiperCourses
          courses={displayCourses}
          normalizedLocale={normalizedLocale}
          getImageUrl={buildImageUrl}
        />
      </div>
    </div>
  );
};

export default CoursesSlider;
