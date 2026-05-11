"use client";

import {
  MdOutlineArticle,
  MdOutlineCalculate,
  MdOutlineComputer,
  MdOutlineDraw,
  MdOutlineEmojiEvents,
  MdOutlineGroups,
  MdOutlineHandyman,
  MdOutlineLightbulb,
  MdOutlineMenuBook,
  MdOutlinePsychology,
  MdOutlineRocketLaunch,
  MdOutlineSchool,
  MdOutlineWork,
} from "react-icons/md";

const ICONS = [
  MdOutlineSchool,
  MdOutlineWork,
  MdOutlineLightbulb,
  MdOutlineCalculate,
  MdOutlineComputer,
  MdOutlineMenuBook,
  MdOutlineGroups,
  MdOutlineEmojiEvents,
  MdOutlineRocketLaunch,
  MdOutlinePsychology,
  MdOutlineHandyman,
  MdOutlineDraw,
  MdOutlineArticle,
];

/** Açıq isti fon + seyrək ikon — jsyellow / jsblack brend ilə */
export default function VacanciesBackgroundDecor() {
  const cells = 48;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#fffefb] via-[#fff9f2] to-[#fdf6eb]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(rgb(28 28 28 / 0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-jsyellow/[0.14] via-transparent to-jsyellow/[0.06]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,rgb(255_255_255_/_0.95),transparent_55%)]" />
      <div className="absolute inset-0 flex justify-center px-5 pt-10 sm:px-8 sm:pt-14">
        <div
          className="grid w-full max-w-[1500px] justify-items-center gap-x-16 gap-y-14 sm:gap-x-20 sm:gap-y-16"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(5.5rem, 1fr))",
          }}
        >
          {Array.from({ length: cells }).map((_, i) => {
            const Icon = ICONS[i % ICONS.length];
            const rotate = ((i * 7) % 11) - 5;
            const accent = i % 3 !== 0;
            return (
              <div
                key={i}
                className="flex h-12 w-12 items-center justify-center sm:h-14 sm:w-14"
                style={{ transform: `rotate(${rotate}deg)` }}
              >
                <Icon
                  className={
                    accent
                      ? "size-10 text-jsyellow sm:size-11"
                      : "size-9 text-jsblack sm:size-10"
                  }
                  style={{ opacity: accent ? 0.14 : 0.07 }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
