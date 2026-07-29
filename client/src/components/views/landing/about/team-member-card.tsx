"use client";

import { CourseTeacherAsMember, TeamMember } from "@/types/team";
import { buildImageUrl } from "@/utils/imageUrl";
import { cn } from "@/utils/cn";
import Image from "next/image";
import { memo } from "react";
import { BLUR_PLACEHOLDER_SVG } from "@/utils/imagePlaceholder";
import type { Locale } from "@/i18n/request";

const TeamMemberCard = memo(
  ({
    member,
    locale,
    noHover = false,
    isCoursePage = false,
    loadEager = false,
  }: {
    member: CourseTeacherAsMember | TeamMember;
    locale: Locale;
    noHover?: boolean;
    isCoursePage?: boolean;
    loadEager?: boolean;
  }) => {
    const lang: "az" | "ru" = locale === "ru" ? "ru" : "az";
    const imageUrl =
      "teacher" in member ? member.teacher.imageUrl : member.imageUrl;
    const bio = "teacher" in member ? member.teacher.bio : member.bio;
    const fullNameObj =
      "teacher" in member ? member.teacher.fullName : member.fullName;
    const fullName =
      typeof fullNameObj === "string"
        ? fullNameObj
        : fullNameObj[lang] || fullNameObj.az;

    const description =
      "teacher" in member
        ? member.courseTeacher?.description?.[lang] ||
          member.courseTeacher?.description?.az ||
          bio?.[lang] ||
          bio?.az ||
          ""
        : bio?.[lang] || bio?.az || "";

    return (
      <div
        className={cn(
          "w-full max-w-[260px] cursor-pointer rounded-2xl border border-jsyellow/50 bg-[#fef9e7] p-3 shadow-sm transition-all duration-300 sm:max-w-[280px] sm:rounded-3xl sm:p-4 md:max-w-none",
          "[@media(min-width:2500px)]:h-full",
          noHover
            ? ""
            : "hover:scale-[1.02] hover:border-jsyellow hover:shadow-md hover:shadow-jsyellow/15"
        )}
      >
        <div className="mb-2.5 aspect-square max-h-[160px] w-full max-w-[160px] overflow-hidden rounded-2xl shadow-sm mx-auto sm:mb-3 sm:max-h-[180px] sm:max-w-[180px] sm:rounded-3xl md:max-h-[200px] md:max-w-[200px] md:rounded-[28px]">
          <Image
            width={320}
            height={320}
            src={buildImageUrl(imageUrl)}
            alt={`Team member ${fullName}`}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
            priority={loadEager}
            loading={loadEager ? undefined : "lazy"}
            decoding="async"
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER_SVG}
            quality={68}
            sizes="(max-width: 480px) 45vw, (max-width: 768px) 30vw, (max-width: 1280px) 22vw, 200px"
            onError={(e) => {
              e.currentTarget.style.opacity = "0";
            }}
          />
        </div>
        <div className="text-center text-sm font-semibold leading-snug text-jsblack sm:text-base">
          {fullName}
        </div>
        <p className="mt-1.5 line-clamp-3 min-h-0 text-center text-xs leading-snug text-neutral-600 sm:mt-2 sm:line-clamp-2 sm:text-[13px]">
          {description}
        </p>

        {isCoursePage && "position" in member && member.position && (
          <p className="mt-1.5 text-center text-xs font-medium text-jsyellow">
            {member.position}
          </p>
        )}
      </div>
    );
  }
);

TeamMemberCard.displayName = "TeamMemberCard";

export default TeamMemberCard;
