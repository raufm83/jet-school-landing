"use client";
import { CourseModule } from "@/types/course";
import { useEffect, useId, useRef, useState } from "react";

interface CourseContentProps {
  modules: CourseModule[];
  locale: "az" | "ru";
  title?: string;
  defaultOpenIndex?: number | null;
}

export default function CourseContent({
  modules = [],
  locale,
  defaultOpenIndex = 0,
}: CourseContentProps) {
  // null ilə başlayırıq: ilk render-də ref-lər hələ boşdur,
  // mount-dan sonra defaultOpenIndex tətbiq olunur — height düzgün hesablanır.
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const contentRefs = useRef<Array<HTMLDivElement | null>>([]);
  const idsRoot = useId();

  const toggle = (i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  };

  useEffect(() => {
    if (defaultOpenIndex !== null && defaultOpenIndex !== undefined) {
      setOpenIndex(defaultOpenIndex);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onResize = () => {
      setOpenIndex((prev) => prev);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="w-full mx-auto sm:py-8 md:py-6 px-0 max-w-none">
      <div className="space-y-3 sm:space-y-4 flex flex-col">
        {modules.map((module, index) => {
          const isOpen = openIndex === index;
          const panelId = `${idsRoot}-panel-${index}`;
          const buttonId = `${idsRoot}-button-${index}`;
          const contentEl = contentRefs.current[index];
          const targetHeight = isOpen && contentEl ? contentEl.scrollHeight : 0;

          return (
            <div
              key={index}
              className="border border-jsyellow rounded-[20px] md:rounded-[28px] bg-white overflow-hidden shadow-sm"
            >
              <button
                id={buttonId}
                aria-controls={panelId}
                aria-expanded={isOpen}
                onClick={() => toggle(index)}
                className="w-full flex justify-between items-center bg-[#fef7eb] text-left p-3 sm:p-4 md:p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-jsyellow/60 transition-colors"
              >
                <div className="flex items-center min-w-0">
                  <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-jsyellow text-white flex items-center justify-center mr-3 sm:mr-4 rounded-full text-[12px] sm:text-[13px] md:text-[14px] font-semibold [@media(min-width:2500px)]:w-10 [@media(min-width:2500px)]:h-10 [@media(min-width:2500px)]:text-base [@media(min-width:3500px)]:w-12 [@media(min-width:3500px)]:h-12">
                    {index + 1}
                  </div>
                  <span className="font-semibold text-[clamp(14px,1.4vw,18px)] md:text-[clamp(16px,1.2vw,20px)] [@media(min-width:2500px)]:!text-2xl [@media(min-width:3500px)]:!text-3xl truncate" title={module?.module?.title?.[locale] ?? ""}>
                    {module?.module?.title?.[locale]}
                  </span>
                </div>
                <span className={`ml-3 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-black/70 [@media(min-width:2500px)]:w-7 [@media(min-width:2500px)]:h-7 [@media(min-width:3500px)]:w-8 [@media(min-width:3500px)]:h-8">
                    <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                style={{ height: targetHeight }}
                className="transition-[height] duration-300 ease-in-out will-change-[height] overflow-hidden"
              >
                <div ref={(el) => { contentRefs.current[index] = el; }} className="bg-white">
                  <div className="pt-1 pb-4 sm:pb-5 md:pb-6 px-3 sm:px-5 md:px-6">
                    <ul className="list-disc list-inside px-4 pb-4 pt-1 space-y-2 sm:space-y-2.5 text-[clamp(13px,1.2vw,15px)] md:text-[clamp(14px,1.1vw,16px)] leading-relaxed [@media(min-width:2500px)]:!text-xl [@media(min-width:3500px)]:!text-2xl">
                      {module?.module?.content
                        ?.filter((item) => item?.isActive !== false)
                        .map((item, idx) => (
                          <li key={idx} className="marker:text-jsyellow [@media(min-width:3500px)]:!text-2xl">
                            {item?.[locale]}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
