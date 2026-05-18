import { Link } from "@/i18n/routing";
import { cn } from "@/utils/cn";
import type { BlogCategory } from "@/types/blog-category";

interface BlogCategoryChipsProps {
  locale: "az" | "ru";
  categories: BlogCategory[];
  selectedCategoryId?: string | null;
  sectionTitle: string;
  allLabel: string;
}

function categoryLabel(cat: BlogCategory, locale: "az" | "ru"): string {
  const n = cat.name;
  if (!n) return "";
  const primary = locale === "ru" ? n.ru?.trim() : n.az?.trim();
  const fallback = locale === "ru" ? n.az?.trim() : n.ru?.trim();
  return primary || fallback || "";
}

export default function BlogCategoryChips({
  locale,
  categories,
  selectedCategoryId,
  sectionTitle,
  allLabel,
}: BlogCategoryChipsProps) {
  if (!categories.length) return null;

  const normalizedSelected = selectedCategoryId?.trim() || null;

  return (
    <div className="mb-10 w-full px-4">
      <p className="mb-3 text-center text-sm font-semibold tracking-wide text-jsblack/75">
        {sectionTitle}
      </p>
      <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2">
        <Link
          href="/blog"
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-all",
            !normalizedSelected
              ? "bg-jsyellow text-white shadow-sm"
              : "bg-jsyellow/10 text-jsblack hover:bg-jsyellow/20",
          )}
        >
          {allLabel}
        </Link>
        {categories.map((cat) => {
          const label = categoryLabel(cat, locale);
          if (!label) return null;
          const active = normalizedSelected === cat.id;
          return (
            <Link
              key={cat.id}
              href={{
                pathname: "/blog",
                query: { category: cat.id },
              }}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-jsyellow text-white shadow-sm"
                  : "bg-jsyellow/10 text-jsblack hover:bg-jsyellow/20",
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
