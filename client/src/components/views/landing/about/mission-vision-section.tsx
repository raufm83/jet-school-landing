"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { BLUR_PLACEHOLDER_SVG } from "@/utils/imagePlaceholder";
import { sanitizeHeroHtml } from "@/utils/sanitizeHeroHtml";

const MISSION_WEBP = "/images/about/mission-vision.webp";
const MISSION_JPG = "/qiz1x1.jpg";

interface MissionVisionProps {
  sectionTitle: string;
  mission: {
    title: string;
    description: string;
  };
  vision: {
    title: string;
    description: string;
  };
  imageSrc?: string;
  imageAlt?: string;
}

export default function MissionVisionSection({
  sectionTitle,
  mission,
  vision,
  imageSrc,
  imageAlt = "Mission and vision",
}: MissionVisionProps) {
  const missionHtml = sanitizeHeroHtml(mission.description || "");
  const visionHtml = sanitizeHeroHtml(vision.description || "");
  const [src, setSrc] = useState(imageSrc || MISSION_WEBP);

  return (
    <section className="container grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <motion.div
        className="relative [@media(min-width:3500px)]:h-[800px] h-[400px] rounded-[32px] overflow-hidden order-2 md:order-1"
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
      >
        <Image
          src={src}
          alt={imageAlt}
          fill
          quality={70}
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER_SVG}
          className="object-cover object-top rounded-[32px]"
          sizes="(max-width: 768px) 100vw, 50vw"
          loading="lazy"
          decoding="async"
          onError={() => {
            if (imageSrc && src === imageSrc) {
              setSrc(MISSION_WEBP);
            } else if (src === MISSION_WEBP) {
              setSrc(MISSION_JPG);
            }
          }}
        />
      </motion.div>

      <motion.div
        className="flex flex-col gap-8 order-1 md:order-2"
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-4xl font-bold text-jsblack [@media(min-width:3500px)]:!text-7xl">{sectionTitle}</h2>

        <div className="flex flex-col gap-6">
          <div className="border border-jsyellow rounded-[32px] p-6 bg-[#fef7eb]">
            <h3 className="font-semibold text-xl [@media(min-width:3500px)]:!text-5xl text-jsblack mb-3">
              {mission.title}
            </h3>
            <div
              className="text-gray-600 [@media(min-width:3500px)]:!text-3xl prose max-w-none prose-p:m-0"
              dangerouslySetInnerHTML={{ __html: missionHtml }}
            />
          </div>

          <div className="border border-jsyellow rounded-[32px] p-6 bg-[#fef7eb]">
            <h3 className="font-semibold text-xl text-jsblack [@media(min-width:3500px)]:!text-5xl mb-3">
              {vision.title}
            </h3>
            <div
              className="text-gray-600 [@media(min-width:3500px)]:!text-3xl prose max-w-none prose-p:m-0"
              dangerouslySetInnerHTML={{ __html: visionHtml }}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
