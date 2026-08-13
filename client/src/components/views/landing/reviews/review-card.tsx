"use client";

import { useProjectModal } from "@/hooks/useProjectModal";
import { BLUR_PLACEHOLDER_SVG } from "@/utils/imagePlaceholder";
import { useLocale } from "next-intl";
import Image from "next/image";
import { MdPlayCircle, MdStar } from "react-icons/md";

interface ReviewCardProps {
  loadEager?: boolean;
  imageUrl: string | null;
  link: string | null;
  title: {
    az: string;
    ru: string;
  };
  description: {
    az: string;
    ru: string;
  };
  course: {
    id: string;
    title: { az: string; ru: string };
  } | null;
}

export default function ReviewCard({
  loadEager = false,
  imageUrl,
  link,
  title,
  description,
}: ReviewCardProps) {
  const { toggle } = useProjectModal();
  const handleClick = () => {
    if (link) toggle(link);
  };
  const locale = useLocale();
  const videoId = link?.match(/(?:v=|\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
  const thumbUrl =
    imageUrl ||
    (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : "");

  if (!thumbUrl || !link) return null;

  const starsLabel = locale === "ru" ? "Пять звёзд" : "5 ulduz";

  return (
    <div className="w-full flex flex-col gap-2">
      <div
        className="group relative h-[280px] sm:h-[300px] w-full cursor-pointer overflow-hidden rounded-3xl"
        onClick={handleClick}
      >
        <div className="relative h-full w-full transition-transform duration-300 md:group-hover:scale-105">
          <Image
            src={thumbUrl}
            alt={locale === "az" ? title.az : title.ru}
            fill
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER_SVG}
            className="rounded-3xl object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 32vw"
            quality={60}
            priority={loadEager}
            loading={loadEager ? undefined : "lazy"}
            decoding="async"
          />
        </div>
        {(locale === "az" ? title.az : title.ru) && (
          <div className="absolute right-2 top-2 z-[1] rounded-full bg-jsyellow/50 px-3 py-1 text-sm font-medium text-white">
            {locale === "az" ? title.az : title.ru}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black/50 p-4 transition-all duration-300 md:group-hover:scale-110 md:group-hover:bg-jsyellow/90">
            <MdPlayCircle className="h-8 w-8 text-white" />
          </div>
        </div>

        <div
          className="absolute inset-x-0 bottom-0 flex h-[30%] flex-col justify-center bg-gradient-to-t from-black/85 to-black/55 px-6 backdrop-blur-[2px] transition-all duration-300 delay-[50ms] md:translate-y-full md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          <p
            className="mb-2 line-clamp-1 text-lg font-semibold text-white transition-all duration-300 delay-100 md:translate-y-5 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
          >
            {locale === "az" ? title.az : title.ru}
          </p>
          <p
            className="line-clamp-2 text-sm text-gray-200 transition-all duration-300 delay-150 md:translate-y-5 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
          >
            {locale === "az" ? description.az : description.ru}
          </p>
        </div>
        <div
          className="absolute left-3 top-3 z-[1] flex items-center gap-0.5"
          role="img"
          aria-label={starsLabel}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <MdStar
              key={i}
              className="size-4 shrink-0 text-jsyellow"
              aria-hidden
            />
          ))}
        </div>
      </div>
    </div>
  );
}
