/* eslint-disable @typescript-eslint/no-explicit-any */

interface NavItem {
  title: string;
  href: string;
  items?: NavItem[];
  noHover?: boolean;
  className?: string;
  handleClick?: () => void;
}

export const getNavLinks = (t: any, hiddenRoutes: string[] = []): NavItem[] => {
  const normalizeRoute = (route: string) =>
    route === "/" ? route : route.replace(/\/+$/, "");
  const hidden = new Set(hiddenRoutes.map(normalizeRoute));

  const all: NavItem[] = [
    {
      title: t("home"),
      href: "/",
    },
    {
      title: t("reviews"),
      href: "/reviews",
    },
    {
      title: t("courses"),
      href: "/courses",
    },
    {
      title: t("offers"),
      href: "/offers",
    },
    {
      title: t("media"),
      href: "/projects",
    },
    {
      title: t("useful"),
      href: "#",
      items: [
        {
          title: t("about"),
          href: "/about-us",
        },
        {
          title: t("blog"),
          href: "/blog",
        },
        {
          title: t("news"),
          href: "/news/category/news",
        },
        {
          title: t("event"),
          href: "/events",
        },
        {
          title: t("gallery"),
          href: "/gallery",
        },
        {
          title: t("glossary"),
          href: "/glossary/terms",
        },
        {
          title: t("vacancies"),
          href: "/vacancies/",
        },
      ],
    },
    {
      title: t("contact"),
      href: "/contact-us",
    },
  ];

  if (hidden.size === 0) return all;

  return all
    .filter((link) => !hidden.has(normalizeRoute(link.href)))
    .map((link) => {
      if (!link.items) return link;
      const filtered = link.items.filter((sub) => !hidden.has(normalizeRoute(sub.href)));
      if (filtered.length === 0) return null;
      return { ...link, items: filtered };
    })
    .filter(Boolean) as NavItem[];
};
