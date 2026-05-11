"use client";

import React, { useState } from "react";
import { cn } from "@/utils/cn";

interface CircleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export default function CircleSwitch({
  checked,
  onChange,
  className,
}: CircleSwitchProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Particle effektlərini aç/bağla"
      onClick={() => onChange(!checked)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative w-14 h-7 rounded-full flex items-center cursor-pointer transition-all duration-200",
        checked ? "bg-jsblack/10" : "hover:bg-jsblack/10 bg-white",
        "border border-gray-300",
        className
      )}
    >
      {isHovered && (
        <div className="absolute text-xs bg-black text-white px-2 py-1 rounded-md -bottom-10 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap">
          Particles
        </div>
      )}

      <div
        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-orange-500 transition-all duration-200"
        style={{ left: checked ? 28 : 5 }}
      />
    </button>
  );
}
