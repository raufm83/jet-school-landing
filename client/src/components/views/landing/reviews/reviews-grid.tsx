"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import ReviewCard from "@/components/views/landing/reviews/review-card";
import { StudentReview } from "@/types/student-reviews";

type Locale = "az" | "ru";
type Main = "PARENT" | "STUDENT";

const LABELS = {
  az: { PARENT: "Valideynlər", STUDENT: "Tələbələr", all: "Hamısı" },
  ru: { PARENT: "Родители", STUDENT: "Студенты", all: "Все" },
};

export default function ReviewsGrid({ items }: { items: StudentReview[] }) {
  const locale = ((useLocale() as Locale) === "ru" ? "ru" : "az") as Locale;
  const L = LABELS[locale];

  const hasParent = items.some((r) => r.category === "PARENT");
  const [main, setMain] = useState<Main>(hasParent ? "PARENT" : "STUDENT");
  const [sub, setSub] = useState<string>("all");

  const mainItems = useMemo(
    () => items.filter((r) => (r.category === "PARENT" ? "PARENT" : "STUDENT") === main),
    [items, main]
  );

  const courses = useMemo(() => {
    const map = new Map<string, { id: string; label: string; count: number }>();
    for (const r of mainItems) {
      const id = r.course?.id;
      if (!id) continue;
      const label = r.course?.title?.[locale] || r.course?.title?.az || "—";
      const ex = map.get(id);
      if (ex) ex.count += 1;
      else map.set(id, { id, label, count: 1 });
    }
    return Array.from(map.values());
  }, [mainItems, locale]);

  const filtered = sub === "all" ? mainItems : mainItems.filter((r) => r.course?.id === sub);
  const countOf = (m: Main) =>
    items.filter((r) => (r.category === "PARENT" ? "PARENT" : "STUDENT") === m).length;

  const mainBtn = (active: boolean) =>
    `rounded-full px-6 py-2.5 text-base font-semibold transition-colors ${
      active ? "bg-jsyellow text-white" : "bg-neutral-100 text-jsblack hover:bg-neutral-200"
    }`;
  const subBtn = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-medium transition-colors sm:text-base ${
      active
        ? "border-jsyellow bg-jsyellow text-white"
        : "border-neutral-300 bg-white text-jsblack hover:border-jsyellow hover:text-jsyellow"
    }`;

  const chooseMain = (m: Main) => {
    setMain(m);
    setSub("all");
  };

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {(["PARENT", "STUDENT"] as Main[]).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={main === m}
              className={mainBtn(main === m)}
              onClick={() => chooseMain(m)}
            >
              {L[m]} ({countOf(m)})
            </button>
          ))}
        </div>

        {courses.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button type="button" aria-pressed={sub === "all"} className={subBtn(sub === "all")} onClick={() => setSub("all")}>
              {L.all} ({mainItems.length})
            </button>
            {courses.map((c) => (
              <button key={c.id} type="button" aria-pressed={sub === c.id} className={subBtn(sub === c.id)} onClick={() => setSub(c.id)}>
                {c.label} ({c.count})
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 [@media(min-width:2500px)]:grid-cols-4">
        {filtered.map((review, index) => (
          <ReviewCard
            key={review.id}
            loadEager={index === 0}
            imageUrl={review.imageUrl}
            link={review.link}
            title={(review.title ?? { az: "", ru: "" }) as { az: string; ru: string }}
            description={(review.description ?? { az: "", ru: "" }) as { az: string; ru: string }}
            course={review.course}
          />
        ))}
      </div>
    </>
  );
}
