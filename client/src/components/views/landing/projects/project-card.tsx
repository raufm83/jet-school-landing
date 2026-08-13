"use client";

import { useState } from "react";
import { useProjectModal } from "@/hooks/useProjectModal";
import { buildImageUrl } from "@/utils/imageUrl";
import { BLUR_PLACEHOLDER_SVG } from "@/utils/imagePlaceholder";
import { useLocale } from "next-intl";
import Image from "next/image";
import { MdPlayCircle } from "react-icons/md";

interface ProjectCardProps {
  loadEager?: boolean;
  imageUrl: string;
  link: string;
  title: {
    az: string;
    ru: string;
  };
  description: {
    az: string;
    ru: string;
  };
  category: {
    id: string;
    name: string;
  };
}

export default function ProjectCard({
  loadEager = false,
  imageUrl,
  link,
  title,
  description,
  category,
}: ProjectCardProps) {
  const [imageError, setImageError] = useState(false);
  const { toggle } = useProjectModal();
  const handleClick = () => {
    toggle(link);
  };
  const locale = useLocale();

  const imageSrc = imageUrl?.trim() ? buildImageUrl(imageUrl) : "";

  return (
    <div
      className="relative w-full h-[327px] cursor-pointer overflow-hidden rounded-3xl group"
      onClick={handleClick}
    >
      {/* Image or fallback */}
      <div className="relative w-full h-full transition-transform duration-300 md:group-hover:scale-105 bg-gradient-to-br from-jsyellow/20 to-jsyellow/5">
        {imageSrc && !imageError ? (
          <Image
            src={imageSrc}
            alt={locale === "az" ? title.az : title.ru}
            fill
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER_SVG}
            className="object-cover rounded-3xl"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 32vw"
            quality={62}
            priority={loadEager}
            loading={loadEager ? undefined : "lazy"}
            decoding="async"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-jsyellow/10">
            <div className="w-16 h-16 rounded-full bg-jsyellow/30 flex items-center justify-center">
              <MdPlayCircle className="w-10 h-10 text-jsyellow" />
            </div>
          </div>
        )}
      </div>
      <div className="absolute top-2 right-2 z-[1] bg-jsyellow/50 text-white px-3 py-1 rounded-full text-sm font-medium">
        {category.name}
      </div>
      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-black/50 p-4 rounded-full transition-all duration-300 md:group-hover:scale-110 md:group-hover:bg-jsyellow/90">
          <MdPlayCircle className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Info section */}
      <div
        className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-black/90 to-black/70 
                    flex flex-col justify-center px-6 backdrop-blur-sm
                    transition-all duration-300 delay-[50ms]
                    md:translate-y-full md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
      >
        <p
          className="text-white font-semibold text-lg mb-2 line-clamp-1
                     transition-all duration-300 delay-100
                     md:translate-y-5 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          {locale === "az" ? title.az : title.ru}
        </p>
        <p
          className="text-gray-200 text-sm line-clamp-2
                    transition-all duration-300 delay-150
                    md:translate-y-5 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          {locale === "az" ? description.az : description.ru}
        </p>
      </div>
    </div>
  );
}
