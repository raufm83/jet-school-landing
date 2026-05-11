import { PostType } from "@/types/enums";
import { Link } from "@/i18n/routing";
import { MdEvent, MdFeed, MdOutlineFeed, MdPercent } from "react-icons/md";

interface PostFiltersProps {
  type?: PostType;
  t: any;
}

function normalizeFilterType(
  value: PostType | string | undefined
): string | undefined {
  if (value === undefined || value === null) return undefined;
  return String(value).toUpperCase();
}

export default function PostFilters({ type, t }: PostFiltersProps) {
  const normalizedType = normalizeFilterType(type);

  const filterItems = [

    {
      href: "/news",
      label: t("allPosts"),
      icon: null,
      isActive: normalizedType === undefined,
    },
    {
      href: { pathname: "/news/category/[type]", params: { type: "news" } },
      label: t("news"),
      icon: <MdFeed className="text-lg" />,
      isActive: normalizedType === PostType.NEWS,
    },
    {
      href: "/events",
      label: t("event"),
      icon: <MdEvent className="text-lg" />,
      isActive: normalizedType === PostType.EVENT,
    },
    {
      href: "/offers",
      label: t("offers"),
      icon: <MdPercent className="text-lg" />,
      isActive: normalizedType === PostType.OFFERS,
    },
    {
      href: "/blog",
      label: t("blog"),
      icon: <MdOutlineFeed className="text-lg" />,
      isActive: normalizedType === PostType.BLOG,
    },
  ];

  return (
    <div className="w-full px-4 mb-10">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {filterItems.map((item, index) => (
            <Link
              key={index}
              href={item.href as never}
              className={`px-4 py-3 rounded-xl font-medium transition-all text-center flex items-center justify-center gap-2 ${
                item.isActive
                  ? "bg-jsyellow text-white shadow-md"
                  : "bg-jsyellow/10 text-jsblack hover:bg-jsyellow/20"
              }`}
            >
              {item.icon}
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
