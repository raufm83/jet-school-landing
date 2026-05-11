"use client";
import { useState, useRef, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { cn } from "@/utils/cn";

interface INavLink {
  title: string;
  href: string;
  items?: INavLink[];
  noHover?: boolean;
  isActive?: boolean;
  className?: string;
  handleClick?: () => void;
}

export default function NavLink({
  title,
  href,
  className,
  items,
  isActive,
  handleClick,
  noHover = false,
}: INavLink) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!items || items.length === 0) {
    const isOffersLink = href === "/offers" || href === "/news/category/offers" || href === "/reviews";
    return (
      <Link
        href={href as never}
        className={cn(
          "transition-all duration-300 relative group hover:text-jsyellow",
          isActive ? "text-jsyellow" : "text-jsblack",
          isOffersLink && "text-red-600 !font-bold hover:text-red-700",
          className
        )}
        onClick={handleClick}
        style={isOffersLink ? { color: "#ff0000", fontWeight: 700 } : undefined}
      >
        {title}
        {!noHover && (
          <span className="absolute left-0 right-0 -bottom-1 h-[1px] bg-jsyellow transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
        )}
      </Link>
    );
  }

  return (
    <div className="relative z-20 shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1 transition-all duration-300 hover:text-jsyellow focus:outline-none",
          className
        )}
      >
        {title}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`ml-1 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      
      <div
        aria-hidden={!isOpen}
        className={cn(
          /* Desktop: overflow-visible ki Faydalı menyusunun sonuncu (Vakansiyalar) kəsilməsin */
          "max-lg:overflow-hidden lg:overflow-visible transition-all duration-200",
          /* Mobil: bağlı olanda DOM axınında yer tutmur */
          isOpen ? "max-lg:block max-lg:opacity-100" : "max-lg:hidden",
          /* Desktop: top-full + z-50 ki menyu kəsilməsin və qonşu linklərin altında qalmasın */
          "lg:absolute lg:left-0 lg:top-full lg:z-50 lg:mt-1.5 lg:block lg:w-56 lg:rounded-md lg:bg-white lg:shadow-lg",
          isOpen
            ? "lg:pointer-events-auto lg:translate-y-0 lg:opacity-100"
            : "lg:pointer-events-none lg:-translate-y-2 lg:opacity-0"
        )}
      >
        <div className="py-0.5 max-lg:mt-0.5 max-lg:mb-0 lg:max-h-[min(70vh,20rem)] lg:overflow-y-auto lg:border lg:border-gray-100 rounded-md">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href as never}
              className={cn(
                "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-jsyellow transition-colors",
                item.className
              )}
              onClick={() => {
                setIsOpen(false);
                if (handleClick) handleClick();
                if (item.handleClick) item.handleClick();
              }}
            >
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
