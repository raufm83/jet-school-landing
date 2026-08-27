"use client";

import React, { useState } from "react";
import { FaChevronDown } from "react-icons/fa6";
import { CourseModule } from "@/types/course";
import { useTranslations } from "next-intl";

interface CourseModulesProps {
  modules: CourseModule[];
  locale: string;
}

export default function CourseModules({ modules, locale }: CourseModulesProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const t = useTranslations("singleCoursePage");

  if (!modules || modules.length === 0) return null;

  const toggleAccordion = (index: number) => {
    if (openIndex === index) {
      setOpenIndex(null);
    } else {
      setOpenIndex(index);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-[clamp(28px,3vw,46px)] [@media(min-width:3500px)]:!text-6xl font-bold text-jsblack mb-6 md:mb-8">
        {t("courseModules") || "Kursun modulları"}
      </h2>
      <div className="flex flex-col gap-4">
        {modules
          .sort((a, b) => a.order - b.order)
          .map((courseMod, index) => {
            const mod = courseMod.module;
            if (!mod) return null;
            const isOpen = openIndex === index;
            const title = (mod.title as any)?.[locale];
            const description = (mod.description as any)?.[locale];
            const contents = mod.content?.sort((a, b) => a.order - b.order) || [];

            return (
              <div
                key={courseMod.id || index}
                className="border border-[#E5E5E5] rounded-xl overflow-hidden bg-white"
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full flex items-center justify-between p-5 md:p-6 text-left transition-colors hover:bg-gray-50"
                >
                  <span className="font-bold text-lg md:text-xl text-jsblack">
                    {index + 1}. {title}
                  </span>
                  <div
                    className={`shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : "rotate-0"
                    }`}
                  >
                    <FaChevronDown className="text-gray-500 w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="p-5 md:p-6 pt-0 border-t border-[#E5E5E5] mt-1">
                    {description && (
                      <p className="text-[#5c5c5c] font-medium mb-4 whitespace-pre-wrap">
                        {description}
                      </p>
                    )}
                    
                    {contents.length > 0 && (
                      <ul className="flex flex-col gap-3">
                        {contents.map((contentItem, cIndex) => (
                          <li
                            key={cIndex}
                            className="flex items-start gap-3 text-jsblack font-medium"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-jsyellow shrink-0 mt-2"></span>
                            <span>{(contentItem as any)?.[locale]}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
