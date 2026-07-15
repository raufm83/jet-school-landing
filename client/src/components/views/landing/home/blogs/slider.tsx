"use client";

import { Locale } from "@/i18n/request";
import { Post, PostsResponse } from "@/types/post";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import "swiper/css";
import { Swiper, SwiperSlide } from "swiper/react";
import PostCard from "../../post/card";

interface SliderProps {
  data: PostsResponse;
}

export default function PostsSlider({ data }: SliderProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("postsPage");

  /** Bütün postları ən yenidən ən köhnəyə sırala */
  const items = useMemo(
    () =>
      [...data.items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [data.items]
  );

  return (
    <div className="py-4 4xl:py-6 ">
      <Swiper
        speed={650}
        spaceBetween={24}
        breakpoints={{
          0: { slidesPerView: 1 },
          640: { slidesPerView: 2 },
          992: { slidesPerView: 4 },
          2560: { slidesPerView: 4 },
          3540: { slidesPerView: 4 },
        }}
        className="!py-4 px-2 4xl:!py-6"
      >
        {items.map((post: Post, idx: number) => (
          <SwiperSlide key={post.id} className="!h-auto flex items-stretch">
            <div className="flex h-full w-full">
              <PostCard t={t} locale={locale} post={post} loadEager={idx === 0} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

