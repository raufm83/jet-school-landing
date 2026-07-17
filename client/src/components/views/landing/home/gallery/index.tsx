// src/components/views/landing/home/gallery.tsx
import { CONTENT_ISR_LONG_SECONDS } from "@/constants/content-isr";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import Button from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { MdArrowRightAlt } from "react-icons/md";
import dynamic from "next/dynamic";

const HomeGalleryPreview = dynamic(() => import("./preview-grid"));

const PREVIEW_COUNT = 3;

const fetchGalleryPreview = async () => {
  try {
    const res = await fetch(
      `${PUBLIC_API_BASE}/gallery?limit=${PREVIEW_COUNT}&sortBy=order&order=desc`,
      { next: { revalidate: CONTENT_ISR_LONG_SECONDS } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch gallery:", error);
    return null;
  }
};

export default async function Gallery() {
  try {
    const t = await getTranslations("gallery");
    const gallery = await fetchGalleryPreview();
    if (!gallery) return null;
    const count = gallery.items?.length ?? (Array.isArray(gallery) ? gallery.length : 0);
    if (count === 0) return null;

    return (
      <div
        id="gallery"
        className="
          container mx-auto
          px-4 sm:px-6 md:px-4 lg:px-12 xl:px-16
          2xl:px-0 3xl:px-24 4xl:px-32
          my-20 4xl:my-24
          flex flex-col
          gap-8 4xl:gap-12
        "
      >
        <HomeGalleryPreview
          initialGallery={gallery}
          previewCount={PREVIEW_COUNT}
        />

        <Link href="/gallery" aria-label={`${t("seeAll")} - Qalereya`}>
          <Button
            iconPosition="right"
            className="items-center mx-auto py-3 px-6 4xl:py-4 4xl:px-8 [@media(min-width:3500px)]:!text-2xl"
            icon={<MdArrowRightAlt size={24} className="[@media(min-width:3500px)]:!w-12 [@media(min-width:3500px)]:!h-12" />}
            text={t("seeAll")}
            ariaLabel={`${t("seeAll")} - Qalereya`}
          />
        </Link>
      </div>
    );
  } catch (error) {
    console.error("Gallery component error:", error);
    return null;
  }
}
