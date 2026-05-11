"use client";
import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { HiOutlinePhone } from "react-icons/hi2";
import { HiMenuAlt3, HiX } from "react-icons/hi";

import Logo from "./logo";
import NavLink from "./nav-link";
import Button from "@/components/ui/button";
import LanguageSwitcher from "@/components/shared/language-switcher";
import { useContactModal } from "@/hooks/useContactModal";
import { getNavLinks } from "@/data/navlinks";
import { usePathname } from "@/i18n/routing";

export default function Header({
  hiddenRoutes = [],
}: {
  hiddenRoutes?: string[];
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toggle } = useContactModal();
  const t = useTranslations("navbar");
  const navLinks = getNavLinks(t, hiddenRoutes);
  const path = usePathname();

  useEffect(() => {
    document.body.style.overflowY = isMenuOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflowY = "auto";
    };
  }, [isMenuOpen]);

  return (
    <header
      className="
        transition-all relative z-[999]
        pt-6 sm:pt-8 md:pt-10 lg:pt-12 xl:pt-14 2xl:pt-16 4xl:pt-20
        duration-300 flex justify-center w-full
      "
    >
      <nav
        className="
          container w-full min-w-0
          flex items-center justify-between
          px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16
          2xl:px-10 3xl:px-24 4xl:px-32
        "
      >
        <Link href="/" className="relative z-50 p-0 flex items-center flex-shrink-0">
          <Logo />
        </Link>

        {/* Desktop nav — xl+ tam sığır; lg–xl hamburger (düymə itməsin) */}
        <div className="hidden xl:flex min-w-0 flex-1 items-center justify-end gap-5 min-[1400px]:gap-6 2xl:gap-8 4xl:gap-12">
          <menu className="flex min-w-0 flex-nowrap items-center gap-4 min-[1380px]:gap-5 min-[1480px]:gap-6 2xl:gap-8 overflow-visible whitespace-nowrap">
            {navLinks.map((link) => (
              <NavLink
                key={link.title}
                isActive={path === link.href}
                {...link}
                handleClick={() => setIsMenuOpen(false)}
                className="
                  py-1 md:py-2 whitespace-nowrap
                  text-[0.9375rem] leading-snug min-[1480px]:text-base 2xl:text-base
                  [@media(min-width:2500px)]:!text-2xl
                "
              />
            ))}
          </menu>

          <div className="flex flex-shrink-0 items-center gap-2 min-[1320px]:gap-3 2xl:gap-3">
            <LanguageSwitcher />
            <Button
              onClick={() => {
                setIsMenuOpen(false);
                toggle();
              }}
              icon={<HiOutlinePhone size={20} />}
              className="
                font-medium text-[0.9375rem] min-[1480px]:text-base 2xl:text-base
                [@media(min-width:2500px)]:!text-2xl
                h-9 min-[1480px]:h-10 2xl:h-12 px-3 min-[1480px]:px-4 2xl:px-6
                bg-jsyellow text-white hover:bg-[#00A300]
                hover:!text-white whitespace-nowrap
              "
              text={t("contactus")}
            />
          </div>
        </div>

        {/* Mobil / planşet menyusu (xl-dək) */}
        <div className="flex items-center gap-2 xl:hidden relative z-50">
          <LanguageSwitcher />
          <button
            onClick={() => setIsMenuOpen((o) => !o)}
            className="p-2 md:p-3 text-jsblack hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Menyunu aç/bağla"
            aria-expanded={isMenuOpen}
            aria-haspopup="dialog"
          >
            
            {isMenuOpen ? <HiX size={24} /> : <HiMenuAlt3 size={24} />}
          </button>
        </div>

        {/* Mobile menu — yalnız açıq olduqda DOM-da olur (accessibility + performance) */}
        {isMenuOpen && (
          <>
            <div
              aria-hidden="true"
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Naviqasiya menyusu"
              className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-6 sm:pt-4"
            >
              <div className="bg-white rounded-2xl shadow-lg w-full max-w-md max-h-[min(88vh,640px)] flex flex-col overflow-hidden relative">
                <div className="flex justify-end items-center p-3 border-b border-gray-200 flex-shrink-0">
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="Menyunu bağla"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <HiX size={24} />
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-2 flex flex-col gap-2 md:gap-1.5">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.title}
                      {...link}
                      handleClick={() => setIsMenuOpen(false)}
                      className="text-base md:text-lg py-2 md:py-1.5 border-b border-gray-100 cursor-pointer whitespace-nowrap"
                    />
                  ))}
                </div>

                <div className="px-3 pt-2 pb-3 border-t border-gray-100 flex-shrink-0 bg-white">
                  <Button
                    onClick={() => {
                      setIsMenuOpen(false);
                      toggle();
                    }}
                    icon={<HiOutlinePhone size={22} />}
                    className="font-medium w-full text-base md:text-lg h-12 bg-jsyellow text-white hover:!text-white hover:bg-[#00A300]"
                    text={t("contactus")}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </nav>
    </header>
  );
}
