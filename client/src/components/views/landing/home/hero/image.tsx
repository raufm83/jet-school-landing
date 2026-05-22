import Image from "next/image";
import { BLUR_PLACEHOLDER_YELLOW } from "@/utils/imagePlaceholder";

export type HeroImageProps = {
  src: string;
  alt: string;
};

export default function HeroImage({ src, alt }: HeroImageProps) {

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute -top-6 -right-6 w-40 h-40 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(252,174,30,0.25) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-4 -left-8 w-36 h-36 opacity-35"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(251,146,60,0.2) 0%, transparent 70%)",
          }}
        />
      </div>

      <div
        className="
          w-[280px] h-[280px]
          sm:w-[300px] sm:h-[300px]
          md:w-[320px] md:h-[320px]
          lg:max-w-[360px] lg:max-h-[360px] lg:w-[360px] lg:h-[360px]
          xl:max-w-[400px] xl:max-h-[400px] xl:w-[400px] xl:h-[400px]
          2xl:max-w-[440px] 2xl:max-h-[440px] 2xl:w-[440px] 2xl:h-[440px]
          [@media(min-width:3500px)]:!max-w-[600px] [@media(min-width:3500px)]:!max-h-[600px] [@media(min-width:3500px)]:!w-[600px] [@media(min-width:3500px)]:!h-[600px]
          relative
          select-none
          shrink-0
          group
          transition-all duration-500 ease-out
          hover:scale-[1.03]
          hover:rotate-1
        "
      >
        <div
          className="
          absolute inset-0
          bg-gradient-to-br from-jsyellow/40 via-jsyellow/70 to-jsyellow/90
          shadow-2xl shadow-jsyellow/25
          rounded-[40%_15%_50%_45%]
          group-hover:rounded-[45%_20%_55%_40%]
          transition-all duration-700 ease-out
          group-hover:shadow-3xl group-hover:shadow-jsyellow/35
          before:absolute before:inset-0
          before:bg-gradient-to-tl before:from-orange-300/20 before:to-transparent
          before:rounded-[40%_15%_50%_45%]
          group-hover:before:rounded-[45%_20%_55%_40%]
          before:transition-all before:duration-700
        "
        />

        <div className="relative w-full h-full overflow-hidden rounded-[40%_15%_50%_45%] group-hover:rounded-[45%_20%_55%_40%] transition-all duration-700 bg-jsyellow">
          <Image
            src={src}
            alt={alt}
            fill
            priority
            quality={82}
            fetchPriority="high"
            decoding="async"
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER_YELLOW}
            className="
              object-cover object-center
              transition-transform duration-500 ease-out
              group-hover:scale-110
            "
            sizes="(max-width: 640px) 280px, (max-width: 768px) 300px, (max-width: 1024px) 320px, (max-width: 1280px) 360px, (max-width: 1536px) 400px, (max-width: 2560px) 440px, 600px"
          />

          <div
            className="
            absolute inset-0
            bg-gradient-to-t from-jsyellow/10 via-transparent to-transparent
            opacity-0 group-hover:opacity-100
            transition-opacity duration-300
          "
          />
        </div>

        <div
          className="absolute -top-4 -right-4 w-16 h-16 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(252,174,30,0.35) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-5 -left-4 w-14 h-14 opacity-45"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(251,146,60,0.3) 0%, transparent 70%)",
          }}
        />
      </div>
    </div>
  );
}
