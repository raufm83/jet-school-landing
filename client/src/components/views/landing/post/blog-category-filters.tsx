import { Link } from "@/i18n/routing";
import { Locale } from "@/i18n/request";
import { BlogCategory } from "@/types/blog-category";

interface BlogCategoryFiltersProps {
  categories: BlogCategory[];
  locale: Locale;
  title: string;
  allLabel: string;
  activeCategoryId?: string;
}

export default function BlogCategoryFilters({
  categories,
  locale,
  title,
  allLabel,
  activeCategoryId,
}: BlogCategoryFiltersProps) {
  if (categories.length === 0) return null;

  return (
    <div className="mb-10 w-full px-4">
      <p className="mb-3 text-center text-xl font-semibold tracking-wide text-jsblack sm:text-2xl">
        {title}
      </p>
      <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2">
        <Link
          href="/blog"
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
            !activeCategoryId
              ? "bg-jsyellow text-white shadow-sm"
              : "bg-jsyellow/10 text-jsblack hover:bg-jsyellow/20"
          }`}
        >
          {allLabel}
        </Link>
        {categories.map((category) => {
          const isActive = activeCategoryId === category.id;
          const label =
            category.name[locale as keyof typeof category.name] ||
            category.name.az;

          return (
            <Link
              key={category.id}
              href={{
                pathname: "/blog",
                query: { category: category.id },
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "bg-jsyellow text-white shadow-sm"
                  : "bg-jsyellow/10 text-jsblack hover:bg-jsyellow/20"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
