"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { BLUR_PLACEHOLDER_SVG } from "@/utils/imagePlaceholder";
import { sanitizeHeroHtml } from "@/utils/sanitizeHeroHtml";

/** `npm run optimize:images` (prebuild) — `rasim.png` → bu WebP */
const INTRO_WEBP = "/images/about/intro.webp";
const INTRO_PNG = "/rasim.png";

interface IntroSectionProps {
  bodyHtml: string;
  imageAlt?: string;
  imageSrc?: string;
}

export default function IntroSection({
  bodyHtml,
  imageAlt = "About JET School",
  imageSrc,
}: IntroSectionProps) {
  const [src, setSrc] = useState(imageSrc || INTRO_WEBP);
  const html = sanitizeHeroHtml(bodyHtml || "");

  return (
    <section className="container grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <motion.div
        className="flex flex-col gap-8"
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
      >
        <div
          className="w-full prose prose-lg max-w-none prose-headings:text-4xl prose-headings:font-bold prose-headings:text-jsblack prose-p:text-gray-600 prose-p:text-xl [@media(min-width:2500px)]:prose-headings:!text-4xl [@media(min-width:2500px)]:prose-p:!text-2xl [@media(min-width:3500px)]:prose-headings:!text-6xl [@media(min-width:3500px)]:prose-p:!text-4xl"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </motion.div>
      <motion.div
        className="relative [@media(min-width:3500px)]:h-[800px] h-[400px] rounded-[32px] overflow-hidden"
        initial={{ opacity: 0, x: 50 }}
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
            if (src === INTRO_WEBP) {
              setSrc(INTRO_PNG);
            }
          }}
        />
      </motion.div>
    </section>
  );
}
