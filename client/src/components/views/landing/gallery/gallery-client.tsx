// src/components/views/landing/home/gallery-client.tsx
"use client";

import SectionTitle from "@/components/shared/section-title";
import GalleryCard from "@/components/views/landing/gallery/gallery-card";
import { useLocale, useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { buildImageUrl } from "@/utils/imageUrl";
import type { GalleryImage, GalleryResponse } from "@/types/gallery";

const LazyLightbox = dynamic(() => import("./gallery-lightbox"), {
  ssr: false,
  loading: () => null,
});

interface GalleryClientProps {
  initialGallery: GalleryResponse;
  /** Ana səhifə blokunda SectionTitle ölçüsü */
  home?: boolean;
}

export default function GalleryClient({
  initialGallery,
  home = false,
}: GalleryClientProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(-1);
  const [lightboxMounted, setLightboxMounted] = useState(false);
  const locale = useLocale();
  const t = useTranslations("gallery");

  const sortedItems = [...initialGallery.items].sort(
    (a, b) => (b.order ?? 0) - (a.order ?? 0)
  );

  const slides = sortedItems.map((image) => {
    const alt =
      locale === "ru"
        ? image.imageAlt?.ru || image.title?.ru || image.title?.az || "Gallery image"
        : image.imageAlt?.az || image.title?.az || image.title?.ru || "Gallery image";
    return {
      src: buildImageUrl(image.imageUrl),
      alt,
    };
  });

  const handleItemClick = useCallback((index: number) => {
    setLightboxMounted(true);
    setCurrentImageIndex(index);
  }, []);

  const getLocalizedTitle = (image: GalleryImage) =>
    locale === "ru" ? image.title?.ru ?? "" : image.title?.az ?? "";

  const getLocalizedAlt = (image: GalleryImage) =>
    locale === "ru"
      ? image.imageAlt?.ru || image.title?.ru || image.title?.az || "Gallery image"
      : image.imageAlt?.az || image.title?.az || image.title?.ru || "Gallery image";

  return (
    <div
      id="gallery"
      className="flex flex-col gap-8 4xl:gap-12 container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 3xl:px-24 4xl:px-32 my-20 4xl:my-24"
    >
      <SectionTitle home={home} as="h1" title={t("title")} description={t("description")} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 4xl:gap-8">
        {sortedItems.map((image, index) => (
          <div key={image.id} onClick={() => handleItemClick(index)}>
            <GalleryCard
              imageUrl={image.imageUrl}
              title={getLocalizedTitle(image)}
              alt={getLocalizedAlt(image)}
              loadEager={index === 0}
            />
          </div>
        ))}
      </div>

      {lightboxMounted && (
        <LazyLightbox
          open={currentImageIndex >= 0}
          index={currentImageIndex}
          slides={slides}
          onClose={() => setCurrentImageIndex(-1)}
        />
      )}
    </div>
  );
}
