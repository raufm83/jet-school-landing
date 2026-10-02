"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaArrowUp, FaWhatsapp } from "react-icons/fa";

function ScrollItems() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    const updateScrollState = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress =
        scrollHeight > 0 ? Math.min(scrollTop / scrollHeight, 1) : 0;

      setProgress(nextProgress);
      setVisible(nextProgress > 0.1);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateScrollState);
      }
    };

    updateScrollState();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div
      className="fixed flex gap-3 bottom-6 right-6 z-50 transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
    >
      <Link
        href={`https://wa.me/+994709836699?text=${encodeURIComponent(
          "Salam, uşaqlar üçün olan kurslar haqqında məlumat əldə etmək istəyirəm!"
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp ilə əlaqə saxla"
        title="WhatsApp ilə əlaqə saxla"
        className="flex items-center justify-center h-14 w-14 lg:h-16 lg:w-16 rounded-full bg-[#25D366] hover:bg-[#20b858] shadow-lg transition-all"
      >
        <span className="sr-only">WhatsApp ilə əlaqə saxla</span>
        <FaWhatsapp className="h-8 w-8 lg:h-9 lg:w-9 text-white" aria-hidden="true" />
      </Link>

      <div className="relative">
        <svg
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 w-[62px] h-[62px] lg:w-[70px] lg:h-[70px]"
          viewBox="0 0 70 70"
        >
          <circle
            cx="35"
            cy="35"
            r="33"
            stroke="#FFE38B"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <circle
            cx="35"
            cy="35"
            r="33"
            stroke="#121212"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            style={{ opacity: 0.4 }}
            strokeDasharray={`${Math.max(progress, 0.0001)} 1`}
            pathLength={1}
          />
        </svg>

        <button
          onClick={scrollToTop}
          aria-label="Səhifənin əvvəlinə qayıt"
          title="Səhifənin əvvəlinə qayıt"
          className="flex items-center relative z-40 justify-center h-14 w-14 lg:h-16 lg:w-16 rounded-full bg-[#FFC726] hover:bg-[#FFD147] shadow-lg transition-all"
        >
          <span className="sr-only">Səhifənin əvvəlinə qayıt</span>
          <FaArrowUp className="h-6 w-6 lg:h-7 lg:w-7 text-black" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default ScrollItems;
