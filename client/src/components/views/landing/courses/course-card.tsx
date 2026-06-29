"use client";

import { Link } from "@/i18n/routing";
import { FaClock, FaGraduationCap } from "react-icons/fa";
import { getIcon } from "@/utils/icon";
import { Course } from "@/types/course";
import { Locale } from "@/i18n/request";

interface CourseCardProps {
  course: Course;
  locale: Locale;
}

export default function CourseCard({ course, locale }: CourseCardProps) {
  const IconComponent = getIcon(course.icon);

  const formatDuration = (duration: number, locale: Locale) => {
    if (locale === "az") {
      return `${duration} ay`;
    } else {
      return `${duration} ${duration === 1 ? "месяц" : "месяцев"}`;
    }
  };

  const getLevelLabel = () => {
    return (
      <div className="inline-flex items-center gap-2 bg-white border border-jsyellow/20 px-4 py-2 rounded-full">
        <FaGraduationCap className="h-7 w-7 shrink-0 text-jsyellow sm:h-6 sm:w-6 md:h-4 md:w-4 [@media(min-width:3500px)]:h-[30px] [@media(min-width:3500px)]:w-[30px]" />
        <span className="text-sm font-medium text-jsblack [@media(min-width:3500px)]:text-xl">
          {course.level[locale]}
        </span>
      </div>
    );
  };

  // newTags için güvenli erişim
  const tags = course.newTags?.[locale] || [];

  return (
    <Link
      href={{
      pathname: "/course/[slug]",
      params: { slug: course.slug[locale] },
    }}
      className="relative flex flex-col h-full w-full md:w-full [@media(min-width:1440px)]:!w-[49%] [@media(min-width:2500px)]:!w-[24%] bg-[#fef9e7] border border-jsyellow/50 rounded-[32px] overflow-hidden 
        transition-all duration-300 ease-out hover:border-jsyellow hover:shadow-md hover:-translate-y-1"
    >
      <div className="absolute inset-x-0 top-0 z-0 h-24 bg-gradient-to-b from-jsyellow/10 to-transparent pointer-events-none" />

      <div className="relative z-[1] p-6 flex flex-col h-full min-w-0">
        <div className="relative z-10 flex justify-end">
          <div className="flex justify-end mb-4 border border-black rounded-3xl ">{getLevelLabel()} </div>
        </div>
        
        <div className="relative z-[50] flex items-start gap-3 sm:gap-4 mb-4">
          <div className="relative z-[100] isolate flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-black bg-jsyellow text-white shadow-lg shadow-jsyellow/20 sm:h-[4.5rem] sm:w-[4.5rem] md:h-12 md:w-12 [&>svg]:h-10 [&>svg]:w-10 sm:[&>svg]:h-9 sm:[&>svg]:w-9 md:[&>svg]:h-6 md:[&>svg]:w-6">
            <IconComponent className="relative z-[101]" aria-hidden />
          </div>
          <h2 className="relative z-0 min-w-0 flex-1 text-2xl font-bold [@media(min-width:3500px)]:text-3xl text-jsblack leading-tight">
            {course.title[locale]}
          </h2>
        </div>

        {tags.length > 0 && (
          <div className="relative z-0 mt-auto mb-6 -mx-6 overflow-hidden px-6">
            <div className="scrolling-tags flex w-max gap-2">
              {[...tags, ...tags].map((tag, index) => (
                <span
                  key={index}
                  className="inline-block px-3 py-1.5 [@media(min-width:3500px)]:text-xl bg-jsyellow/10 text-black border-black border text-xs font-medium 
                    rounded-full border-jsyellow/20 backdrop-blur-sm whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-jsyellow/20 mt-auto">
          <div className="flex items-center gap-3 text-gray-700">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-jsyellow/10 sm:h-11 sm:w-11 md:h-8 md:w-8 [@media(min-width:3500px)]:h-16 [@media(min-width:3500px)]:w-16">
              <FaClock className="h-7 w-7 text-jsyellow sm:h-6 sm:w-6 md:h-4 md:w-4 [@media(min-width:3500px)]:h-[30px] [@media(min-width:3500px)]:w-[30px]" />
            </div>
            <div>
              <span className="text-sm [@media(min-width:3500px)]:text-xl text-gray-500">
                {locale === "az" ? "Müddət" : "Длительность"}
              </span>
              <p className="font-normal [@media(min-width:3500px)]:text-xl">
                {formatDuration(course.duration, locale)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}