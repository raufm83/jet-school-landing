"use client";

import { useState } from "react";
import { FaqItem } from "@/types/faq";
import { motion, AnimatePresence } from "framer-motion";
import { MdAdd, MdRemove } from "react-icons/md";
import { useTranslations } from "next-intl";

interface FaqSectionProps {
  items: FaqItem[];
  locale: "az" | "ru";
  /** Opsional: hər səhifənin öz başlığı olmasa section default tərcümələri istifadə edir */
  title?: string;
  subtitle?: string;
}

export default function FaqSection({ items, locale, title, subtitle }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const t = useTranslations("faqSection");

  if (!items || items.length === 0) return null;

  const resolvedTitle = title ?? t("title");
  const resolvedSubtitle = subtitle ?? t("subtitle");

  return (
    <div className="mt-6 pt-2 sm:mt-8 sm:pt-3 lg:mt-10 lg:pt-5">
      <div className="mx-auto w-full max-w-[43rem] px-4 sm:max-w-[48rem] sm:px-6 lg:max-w-[51rem]">
        <header className="mb-6 text-center sm:mb-8">
          <h2 className="font-bold text-jsblack text-2xl sm:text-3xl md:text-[2rem] leading-tight tracking-tight">
            {resolvedTitle}
          </h2>
          {resolvedSubtitle && (
            <p className="mx-auto mt-3 max-w-[40rem] text-pretty text-sm leading-relaxed text-jsblack/70 sm:text-base">
              {resolvedSubtitle}
            </p>
          )}
        </header>

        <div className="flex flex-col gap-2 sm:gap-3">
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-[18px] border border-jsyellow/35 bg-white transition-shadow duration-300 hover:border-jsyellow/50 hover:shadow-sm hover:shadow-jsyellow/10 sm:rounded-[20px]"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:gap-4 sm:px-5 sm:py-3.5"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span className="min-w-0 flex-1 pr-2 text-base font-semibold leading-snug text-jsblack sm:text-[17px] md:text-lg">
                    {item.question[locale]}
                  </span>
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-jsyellow/30 bg-jsyellow/10 text-jsblack transition-colors duration-200 sm:size-10"
                    aria-hidden
                  >
                    {isOpen ? (
                      <MdRemove className="size-[17px] sm:size-[18px]" />
                    ) : (
                      <MdAdd className="size-[17px] sm:size-[18px]" />
                    )}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="border-t border-jsyellow/15 px-4 pb-3 pt-2 text-sm leading-relaxed text-neutral-600 sm:px-5 sm:pb-4 sm:text-base">
                        {item.answer[locale]}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
