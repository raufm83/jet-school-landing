import React from "react";

interface ISectionTitle {
  title: string;
  description?: string;
  as?: "h1" | "h2";
  /** Dar sütun (FAQ və s.) — böyük mt/ölçü olmadan, tam en */
  compact?: boolean;
  /** Əvvəl ana səhifə üçün ayrıca ölçü; indi ümumi şkala ilə uyğunlaşdırılıb */
  home?: boolean;
}

/** Bütün səhifələrdə oxşar vizual ierarxiya: mobil → desktop → ultra geniş */
const titleDefault =
  "mt-8 px-2 text-2xl font-bold leading-[1.15] text-jsblack sm:mt-12 sm:px-0 sm:text-3xl md:text-[1.65rem] lg:mt-14 lg:text-[1.75rem] xl:text-4xl 2xl:text-[2.125rem] [@media(min-width:3000px)]:!text-[2.5rem]";

const titleHome =
  "mt-8 px-2 text-2xl font-bold leading-[1.15] text-jsblack sm:mt-12 sm:px-0 sm:text-[1.65rem] md:text-3xl lg:mt-14 lg:text-4xl xl:text-[2rem] [@media(min-width:3000px)]:!text-5xl";

const descDefault =
  "mt-2 max-w-prose whitespace-pre-line text-sm text-jsblack/90 sm:mt-3 sm:text-base md:text-[0.95rem] lg:text-base xl:text-lg [@media(min-width:3000px)]:!text-2xl";

const descHome =
  "mt-2 max-w-prose whitespace-pre-line text-sm text-jsblack sm:mt-3 sm:text-base lg:text-[1.05rem] xl:text-lg [@media(min-width:3000px)]:!text-3xl";

function SectionTitle({
  title,
  description,
  as: Tag = "h2",
  compact = false,
  home = false,
}: ISectionTitle) {
  if (compact) {
    return (
      <div className="mx-auto mb-4 flex w-full max-w-full flex-col items-center justify-center gap-2 text-center text-jsblack">
        <Tag className="px-1 text-xl font-bold leading-tight sm:text-2xl lg:text-[1.65rem] xl:text-3xl">
          {title}
        </Tag>
        {description && (
          <p className="mt-1 max-w-full whitespace-pre-line text-sm leading-snug text-neutral-700 sm:text-base">
            {description}
          </p>
        )}
      </div>
    );
  }

  const titleClass = home ? titleHome : titleDefault;
  const descClass = home ? descHome : descDefault;

  return (
    <div className="mx-auto mb-5 flex w-full flex-col items-center justify-center gap-3 text-center text-jsblack sm:w-11/12 md:w-10/12 lg:w-1/2 lg:gap-4 [@media(min-width:3500px)]:!gap-6">
      <Tag className={titleClass}>{title}</Tag>
      {description && <p className={descClass}>{description}</p>}
    </div>
  );
}

export default SectionTitle;
