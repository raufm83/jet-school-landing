"use client";

import SectionTitle from "@/components/shared/section-title";
import GalleryCard from "@/components/views/landing/gallery/gallery-card";
import type { GalleryImage, GalleryResponse } from "@/types/gallery";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

interface HomeGalleryPreviewProps {
  initialGallery: GalleryResponse;
  /** Homepage-də göstəriləcək maksimum şəkil sayı (default 3) */
  previewCount?: number;
}

/**
 * Homepage qalereya preview bloku.
 * Sadə statik grid göstərir; bütün şəkillərə baxış parent komponentdəki
 * "Hamısına bax" düyməsi ilə `/gallery` səhifəsinə yönlənir.
 */
export default function HomeGalleryPreview({
  initialGallery,
  previewCount = 3,
}: HomeGalleryPreviewProps) {
  const locale = useLocale();
  const t = useTranslations("gallery");

  const previewItems = useMemo(() => {
    return [...(initialGallery.items ?? [])]
      .sort((a, b) => (b.order ?? 0) - (a.order ?? 0))
      .slice(0, previewCount);
  }, [initialGallery.items, previewCount]);

  const getLocalizedTitle = (image: GalleryImage) =>
    locale === "ru" ? image.title?.ru ?? "" : image.title?.az ?? "";

  const getLocalizedAlt = (image: GalleryImage) =>
    locale === "ru"
      ? image.imageAlt?.ru ||
        image.title?.ru ||
        image.title?.az ||
        "Gallery image"
      : image.imageAlt?.az ||
        image.title?.az ||
        image.title?.ru ||
        "Gallery image";

  if (previewItems.length === 0) return null;

  return (
    <>
      <SectionTitle
        home
        as="h2"
        title={t("title")}
        description={t("description")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 4xl:gap-8">
        {previewItems.map((image, index) => (
          <div
            key={image.id}
            className="block w-full rounded-3xl"
          >
            <GalleryCard
              imageUrl={image.imageUrl}
              title={getLocalizedTitle(image)}
              alt={getLocalizedAlt(image)}
              loadEager={index === 0}
            />
          </div>
        ))}
      </div>
    </>
  );
}
