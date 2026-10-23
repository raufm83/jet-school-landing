"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import ProjectCard from "@/components/views/landing/projects/project-card";
import { Project } from "@/types/student-projects";

type Locale = "az" | "ru";

const ALL_LABEL: Record<Locale, string> = { az: "Hamısı", ru: "Все" };

function getCategoryLabel(category: Project["category"] | undefined, locale: Locale) {
  return category?.title?.[locale] || category?.title?.az || category?.name || "—";
}

export default function ProjectsGrid({ items }: { items: Project[] }) {
  const locale = (useLocale() as Locale) || "az";
  const [active, setActive] = useState<string>("all");

  const categories = useMemo(() => {
    const map = new Map<string, { id: string; label: string; count: number }>();
    for (const p of items) {
      const id = p.category?.id;
      if (!id) continue;
      const existing = map.get(id);
      if (existing) existing.count += 1;
      else map.set(id, { id, label: getCategoryLabel(p.category, locale), count: 1 });
    }
    return Array.from(map.values());
  }, [items, locale]);

  const filtered = active === "all" ? items : items.filter((p) => p.category?.id === active);

  const btn = (isActive: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-medium transition-colors sm:text-base ${
      isActive
        ? "border-jsyellow bg-jsyellow text-white"
        : "border-neutral-300 bg-white text-jsblack hover:border-jsyellow hover:text-jsyellow"
    }`;

  return (
    <>
      {categories.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <button type="button" aria-pressed={active === "all"} className={btn(active === "all")} onClick={() => setActive("all")}>
            {ALL_LABEL[locale] ?? ALL_LABEL.az} ({items.length})
          </button>
          {categories.map((c) => (
            <button key={c.id} type="button" aria-pressed={active === c.id} className={btn(active === c.id)} onClick={() => setActive(c.id)}>
              {c.label} ({c.count})
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 [@media(min-width:2500px)]:grid-cols-4">
        {filtered.map((project, index) => (
          <ProjectCard
            key={project.id}
            loadEager={index === 0}
            imageUrl={project.imageUrl}
            link={project.link}
            title={project.title!}
            description={project.description!}
            category={project.category!}
          />
        ))}
      </div>
    </>
  );
}
