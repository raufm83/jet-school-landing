import { Role } from "@/types/enums";
import { Session } from "next-auth";
import {
  MdBook,
  MdHome,
  MdOutlineMessage,
  MdPeople,
  MdPeopleAlt,
  MdPerson,
  MdSettings,
  MdPhoto,
  MdVideoChat,
  MdShield,
  MdViewModule,
  MdPostAdd,
  MdLightbulbOutline,
  MdSearch,
  MdHelpOutline,
  MdWork,
  MdCategory,
  MdInfo,
} from "react-icons/md";

export interface MenuItem {
  name: string;
  icon: JSX.Element;
  path: string;
}

function getPrimarySidebarItem(role: Role | undefined): MenuItem {
  switch (role) {
    case Role.ADMIN:
    case Role.STAFF:
    case Role.CRMOPERATOR:
      return {
        name: "Sorğular",
        icon: <MdOutlineMessage size={24} />,
        path: "/dashboard/requests",
      };
    case Role.AUTHOR:
      return {
        name: "Bloq",
        icon: <MdPostAdd size={24} />,
        path: "/dashboard/posts",
      };
    case Role.CONTENTMANAGER:
      return {
        name: "Tələbə Layihələri",
        icon: <MdBook size={24} />,
        path: "/dashboard/student-projects",
      };
    case Role.HRMANAGER:
      return {
        name: "Vakansiyalar",
        icon: <MdWork size={24} />,
        path: "/dashboard/vacancies",
      };
    default:
      return {
        name: "Profil",
        icon: <MdPerson size={24} />,
        path: "/dashboard/profile",
      };
  }
}

export function getMenuItems(session: Session | null): MenuItem[] {
  const role = session?.user?.role as Role | undefined;
  const baseMenuItemsStart: MenuItem[] = [
    getPrimarySidebarItem(role),
    {
      name: "Haqqımızda giriş hissəsi",
      icon: <MdInfo size={24} />,
      path: "/dashboard/about-hero",
    },
  ];

  const settingsItem: MenuItem = {
    name: "Parametrlər",
    icon: <MdSettings size={24} />,
    path: "/dashboard/settings",
  };

  const staffMenuItems: MenuItem[] = [
    {
      name: "Tələbə Layihələri",
      icon: <MdBook size={24} />,
      path: "/dashboard/student-projects",
    },
    {
      name: "Rəylər",
      icon: <MdOutlineMessage size={24} />,
      path: "/dashboard/student-reviews",
    },
    {
      name: "Ana səhifə Hero",
      icon: <MdHome size={24} />,
      path: "/dashboard/home-hero",
    },
    {
      name: "Haqqımızda giriş hissəsi",
      icon: <MdInfo size={24} />,
      path: "/dashboard/about-hero",
    },
    // exams
    {
      name: "İmtahanlar",
      icon: <MdBook size={24} />,
      path: "/dashboard/exams",
    },
  ];

  const adminMenuItems: MenuItem[] = [
    {
      name: "İstifadəçilər",
      icon: <MdPeople size={24} />,
      path: "/dashboard/users",
    },
    {
      name: "Komanda",
      icon: <MdPeopleAlt size={24} />,
      path: "/dashboard/team",
    },
    {
      name: "Əlaqə məlumatları",
      icon: <MdOutlineMessage size={24} />,
      path: "/dashboard/contact-info",
    },
    {
      name: "Ana səhifə Hero",
      icon: <MdHome size={24} />,
      path: "/dashboard/home-hero",
    },
    {
      name: "Haqqımızda giriş hissəsi",
      icon: <MdInfo size={24} />,
      path: "/dashboard/about-hero",
    },
    {
      name: "Tələbə Layihələri",
      icon: <MdBook size={24} />,
      path: "/dashboard/student-projects",
    },
    {
      name: "Rəylər",
      icon: <MdOutlineMessage size={24} />,
      path: "/dashboard/student-reviews",
    },
    {
      name: "Kurslar",
      icon: <MdVideoChat size={24} />,
      path: "/dashboard/courses",
    },
    {
      name: "Postlar",
      icon: <MdPostAdd size={24} />,
      path: "/dashboard/posts",
    },
    {
      name: "Bloq kateqoriyaları",
      icon: <MdCategory size={24} />,
      path: "/dashboard/blog-categories",
    },
    {
      name: "Tələblər",
      icon: <MdShield size={24} />,
      path: "/dashboard/eligibilities",
    },
    {
      name: "Modullar",
      icon: <MdViewModule size={24} />,
      path: "/dashboard/modules",
    },
    {
      name: "Qalereya",
      icon: <MdPhoto size={24} />,
      path: "/dashboard/gallery",
    },
    {
      name: "İmtahanlar",
      icon: <MdBook size={24} />,
      path: "/dashboard/exams",
    },
    {
      name: "Lügət",
      icon: <MdLightbulbOutline size={24} />,
      path: "/dashboard/glossary",
    },
    {
      name: "SEO (Səhifə meta)",
      icon: <MdSearch size={24} />,
      path: "/dashboard/seo",
    },
    {
      name: "FAQ",
      icon: <MdHelpOutline size={24} />,
      path: "/dashboard/faq",
    },
    {
      name: "Vakansiyalar",
      icon: <MdWork size={24} />,
      path: "/dashboard/vacancies",
    },
  ];

  const authorMenuItems: MenuItem[] = [
    {
      name: "Bloq",
      icon: <MdPostAdd size={24} />,
      path: "/dashboard/posts",
    },
    {
      name: "Lügət",
      icon: <MdLightbulbOutline size={24} />,
      path: "/dashboard/glossary",
    },
  ];

  const CRMOperatorMenuItems: MenuItem[] = [
    {
      name: "İmtahanlar",
      icon: <MdBook size={24} />,
      path: "/dashboard/exams",
    },
  ];

  const hrManagerMenuItems: MenuItem[] = [
    {
      name: "Vakansiyalar",
      icon: <MdWork size={24} />,
      path: "/dashboard/vacancies",
    },
  ];

  const contentManagerMenuItems: MenuItem[] = [
    {
      name:"Kurslar",
      icon: <MdVideoChat size={24} />,
      path: "/dashboard/courses",
    },

    {
      name: "Tələbə Layihələri",
      icon: <MdBook size={24} />,
      path: "/dashboard/student-projects",
    },
    {
      name: "Rəylər",
      icon: <MdOutlineMessage size={24} />,
      path: "/dashboard/student-reviews",
    },
    {
      name:"Xəbərlər",
      icon: <MdPostAdd size={24} />,
      path: "/dashboard/posts",
    },
    {
      name: "Bloq kateqoriyaları",
      icon: <MdCategory size={24} />,
      path: "/dashboard/blog-categories",
    },
    {
      name: "Qalereya",
      icon: <MdPhoto size={24} />,
      path: "/dashboard/gallery",
    },
    {
      name:"Müəllimlər",
      icon: <MdPeople size={24} />,
      path: "/dashboard/team",
    },
    {
      name: "Ana səhifə Hero",
      icon: <MdHome size={24} />,
      path: "/dashboard/home-hero",
    },
    {
      name: "Haqqımızda giriş hissəsi",
      icon: <MdInfo size={24} />,
      path: "/dashboard/about-hero",
    },
    {
      name: "Lügət",
      icon: <MdLightbulbOutline size={24} />,
      path: "/dashboard/glossary",
    },
    {
      name: "SEO (Səhifə meta)",
      icon: <MdSearch size={24} />,
      path: "/dashboard/seo",
    },
    {
      name: "FAQ",
      icon: <MdHelpOutline size={24} />,
      path: "/dashboard/faq",
    },
    {
      name: "Vakansiyalar",
      icon: <MdWork size={24} />,
      path: "/dashboard/vacancies",
    },
  ];

  const allItems = [
    ...baseMenuItemsStart,
    ...(session?.user?.role === Role.ADMIN ? adminMenuItems : []),
    ...(session?.user?.role === Role.AUTHOR ? authorMenuItems : []),
    ...(session?.user?.role === Role.CRMOPERATOR ? CRMOperatorMenuItems : []),
    ...(session?.user?.role === Role.HRMANAGER ? hrManagerMenuItems : []),
    ...(session?.user?.role === Role.CONTENTMANAGER
      ? contentManagerMenuItems
      : []),
    ...(session?.user?.role === Role.STAFF ? staffMenuItems : []),
    settingsItem,
  ];

  // Eyni path bir neçə rol blokunda təkrarlandıqda sidebar-da dublikat göstərməsin.
  const seen = new Set<string>();
  return allItems.filter((item) => {
    if (seen.has(item.path)) return false;
    seen.add(item.path);
    return true;
  });
}
