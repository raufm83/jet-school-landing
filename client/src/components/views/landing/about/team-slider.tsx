"use client";

import { TeamMember } from "@/types/team";
import "swiper/css";
import "swiper/css/pagination";
import { Autoplay, Pagination, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import TeamMemberCard from "./team-member-card";
import type { Locale } from "@/i18n/request";

interface TeamSliderProps {
  teamMembers: TeamMember[];
  locale: Locale;
  isCoursePage?: boolean;
}

export default function TeamSlider({
  teamMembers,
  locale,
  isCoursePage = false,
}: TeamSliderProps) {
  return (
    <div className="pt-2 pb-8 4xl:py-12 w-full min-w-0 max-w-full overflow-x-clip">
      <Swiper
        modules={[Autoplay, Pagination, Keyboard]}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        keyboard={{
          enabled: true,
        }}
        loop={teamMembers.length > 5}
        grabCursor={true}
        spaceBetween={24}
        centeredSlides={false}
        centerInsufficientSlides={true}
        breakpoints={{
          0: { slidesPerView: 1, spaceBetween: 14, centeredSlides: false },
          480: { slidesPerView: 1, spaceBetween: 16, centeredSlides: false },
          640: { slidesPerView: 2, spaceBetween: 18, centeredSlides: false },
          768: { slidesPerView: 3, spaceBetween: 24, centeredSlides: true },
          1024: { slidesPerView: 4, spaceBetween: 24, centeredSlides: true },
          1280: { slidesPerView: 5, spaceBetween: 24, centeredSlides: true },
          1536: { slidesPerView: 6, spaceBetween: 30, centeredSlides: true },
          2500: { slidesPerView: 7, spaceBetween: 40, centeredSlides: true },
          3500: { slidesPerView: 9, spaceBetween: 50, centeredSlides: true },
        }}
        className="!overflow-hidden !px-0 !pb-20 !pt-2"
      >
        {teamMembers?.map((member, index) => (
          <SwiperSlide key={member.id} className="!flex !h-auto items-stretch">
            <div className="flex h-full w-full">
              <TeamMemberCard
                member={member}
                locale={locale}
                loadEager={index < 2}
                isCoursePage={isCoursePage}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx global>{`
        .swiper-pagination-bullet {
          background: #e5e7eb;
          opacity: 1;
        }
        .swiper-pagination-bullet-active {
          background: #fcae1e !important;
          width: 24px !important;
          border-radius: 99px !important;
        }
      `}</style>
    </div>
  );
}
