"use client";

// src/components/logo.tsx
import Image from "next/image";
import React, { useState } from "react";

interface LogoProps {
  className?: string;
}

/**
 * JET School loqosu: `prebuild` zamanı PNG → WebP (`/logos/JET_School_Yellowww.webp`).
 * WebP yoxdursa köhnə PNG-ə düşür.
 */
export default function Logo({ className = "" }: LogoProps) {
  const [src, setSrc] = useState("/logos/JET_School_Yellowww.webp");

  return (
    <div
      className={`relative z-[52] flex items-center h-8 sm:h-9 md:h-10 lg:h-11 xl:h-12 2xl:h-14 4xl:h-16 ${className}`}
    >
      <Image
        alt="Logo of Jet School"
        title="Logo of Jet School"
        src={src}
        width={1024}
        height={246}
        priority
        fetchPriority="high"
        sizes="(max-width: 768px) 140px, (max-width: 1279px) 180px, (max-width: 1535px) 200px, (max-width: 2559px) 240px, 288px"
        className="h-full w-auto object-contain"
        quality={82}
        onError={() => {
          if (src.endsWith(".webp")) {
            setSrc("/logos/JET_School_Yellowww.png");
          }
        }}
      />
    </div>
  );
}
