"use client";

import { cn } from "@/utils/cn";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import { useLocale } from "next-intl";
import {
  pathnameWithoutLeadingLocale,
  interpolatePathnameDynamicSegments,
  fetchCourseSlugsFromApi,
} from "@/utils/intl/language-switch-target";
import { Link, usePathname } from "@/i18n/routing";
import {
  useParams,
  usePathname as useNextPathname,
  useSearchParams,
} from "next/navigation";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { HiChevronDown } from "react-icons/hi2";
import Image from "next/image";

const locales = ["az", "ru"] as const;

type VacancySlugPair = { az: string; ru: string };

function LanguageSwitcherInner({ className }: { className?: string }) {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const intlPath = usePathname();
  const nextFullPath = useNextPathname() ?? "/";
  const params = useParams();
  const searchParams = useSearchParams();
  const rootRef = useRef<HTMLDivElement>(null);

  const pathStr = String(intlPath);
  let normalizedPathInternal =
    pathStr.includes("[") && pathStr.includes("]")
      ? interpolatePathnameDynamicSegments(
          pathStr,
          params as Readonly<
            Record<string, string | string[] | undefined>
          >,
        )
      : pathStr;
  if (
    normalizedPathInternal.includes("[") ||
    normalizedPathInternal.includes("]")
  ) {
    normalizedPathInternal = pathnameWithoutLeadingLocale(nextFullPath);
  }

  const slugParam = typeof params.slug === "string" ? params.slug : undefined;

  const isVacancyDetail =
    Boolean(slugParam) &&
    (pathStr === "/vacancies/[slug]" ||
      /^\/vacancies\/[^/]+\/?$/.test(normalizedPathInternal));

  const isCourseDetail =
    Boolean(slugParam) &&
    (pathStr === "/course/[slug]" ||
      /^\/course\/[^/]+\/?$/.test(normalizedPathInternal));

  const [vacancySlugs, setVacancySlugs] = useState<VacancySlugPair | null>(
    null
  );
  const [vacancyFetchDone, setVacancyFetchDone] = useState(false);

  const [courseSlugs, setCourseSlugs] = useState<
    Partial<Record<"az" | "ru", string>> | null
  >(null);
  const [courseFetchDone, setCourseFetchDone] = useState(false);

  const qs = searchParams.toString();

  let pathnameBase = normalizedPathInternal.startsWith("/")
    ? normalizedPathInternal
    : `/${normalizedPathInternal}`;
  if (!pathnameBase || pathnameBase === "") pathnameBase = "/";

  const defaultHref = (qs ? `${pathnameBase}?${qs}` : pathnameBase) as never;

  useEffect(() => {
    if (!isVacancyDetail || !slugParam) {
      setVacancySlugs(null);
      setVacancyFetchDone(false);
      return;
    }
    let cancelled = false;
    setVacancyFetchDone(false);
    setVacancySlugs(null);
    (async () => {
      try {
        const res = await fetch(
          `${PUBLIC_API_BASE}/vacancies/by-slug/${encodeURIComponent(slugParam)}`,
          { headers: { Accept: "application/json" }, cache: "no-store" }
        );
        if (!res.ok || cancelled) return;
        const data: unknown = await res.json();
        const o = data as { slug?: { az?: unknown; ru?: unknown } };
        const az =
          typeof o?.slug?.az === "string" ? o.slug.az.trim() : "";
        const ru =
          typeof o?.slug?.ru === "string" ? o.slug.ru.trim() : "";
        if (az && ru && !cancelled) setVacancySlugs({ az, ru });
      } catch {
        /* slug qalıb köhnə davranış */
      } finally {
        if (!cancelled) setVacancyFetchDone(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isVacancyDetail, slugParam]);

  useEffect(() => {
    if (!isCourseDetail || !slugParam) {
      setCourseSlugs(null);
      setCourseFetchDone(false);
      return;
    }
    let cancelled = false;
    setCourseFetchDone(false);
    setCourseSlugs(null);
    (async () => {
      try {
        const slugs = await fetchCourseSlugsFromApi(slugParam);
        if (!cancelled && slugs) setCourseSlugs(slugs);
      } catch {
        /* real URL əsasında keçid saxlanılır */
      } finally {
        if (!cancelled) setCourseFetchDone(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isCourseDetail, slugParam]);

  function hrefForTargetLocale(code: (typeof locales)[number]): never {
    if (vacancySlugs) {
      const slug = code === "az" ? vacancySlugs.az : vacancySlugs.ru;
      const base = {
        pathname: "/vacancies/[slug]" as const,
        params: { slug },
      };
      if (!qs) return base as never;
      return {
        ...base,
        query: Object.fromEntries(searchParams.entries()),
      } as never;
    }

    if (courseSlugs) {
      const slug =
        (code === "az" ? courseSlugs.az : courseSlugs.ru) ??
        slugParam ??
        "";
      const base = {
        pathname: "/course/[slug]" as const,
        params: { slug },
      };
      if (!qs) return base as never;
      return {
        ...base,
        query: Object.fromEntries(searchParams.entries()),
      } as never;
    }

    return defaultHref;
  }

  const linkPending =
    (isVacancyDetail && !vacancyFetchDone) ||
    (isCourseDetail && !courseFetchDone);

  useEffect(() => {
    function handlePointerDown(event: Event) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  return (
    <div ref={rootRef} className={cn("relative z-[1001]", className)}>
      <button
        type="button"
        aria-label={`Dil seçin: ${locale.toUpperCase()}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((o) => !o);
          }
          if (e.key === "Escape") setIsOpen(false);
        }}
        className={cn(
          "border relative flex bg-white [@media(min-width:3500px)]:!text-2xl justify-between gap-2 text-sm h-11 transition-all cursor-pointer font-semibold text-jsblack items-center border-gray-300 px-4 py-2 rounded-[30px] w-full min-w-[100px]",
          !isOpen ? "hover:bg-jsblack/10" : "bg-jsblack/10"
        )}
      >
        {locale === "az" ? (
          <Image
            src="/flags/az.png"
            alt=""
            width={25}
            height={30}
            quality={75}
            loading="eager"
            decoding="async"
            className="[@media(min-width:3500px)]:!w-[40px]"
          />
        ) : (
          <Image
            src="/flags/rus.png"
            alt=""
            width={25}
            height={30}
            quality={75}
            loading="eager"
            decoding="async"
            className="[@media(min-width:3500px)]:!w-[40px]"
          />
        )}
        <span>{locale.toUpperCase()}</span>
        <HiChevronDown className={cn("shrink-0 transition-transform", isOpen && "rotate-180")} />
      </button>

      <div
        role="listbox"
        aria-hidden={!isOpen}
        className={cn(
          "absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[1002] flex max-h-[min(60vh,280px)] flex-col overflow-auto rounded-[16px] border border-gray-300 bg-white shadow-lg transition-[opacity,transform] duration-150",
          isOpen
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none invisible scale-95 opacity-0"
        )}
      >
        {locales.map((code) =>
          code === locale ? (
            <div
              key={code}
              role="option"
              aria-selected
              className="flex cursor-default items-center justify-center gap-3 bg-jsblack/5 py-2 text-center opacity-70"
            >
              {code === "az" ? (
                <Image
                  src="/flags/az.png"
                  alt=""
                  width={30}
                  height={30}
                  quality={80}
                  className="[@media(min-width:3500px)]:!w-[40px]"
                />
              ) : (
                <Image
                  src="/flags/rus.png"
                  alt=""
                  width={25}
                  height={30}
                  quality={80}
                  className="[@media(min-width:3500px)]:!w-[40px]"
                />
              )}
              {code.toUpperCase()}
            </div>
          ) : linkPending ? (
            <div
              key={code}
              role="option"
              aria-selected={false}
              aria-disabled
              className="flex cursor-wait items-center justify-center gap-3 py-2 text-center opacity-40"
            >
              {code === "az" ? (
                <Image
                  src="/flags/az.png"
                  alt=""
                  width={30}
                  height={30}
                  quality={80}
                  className="[@media(min-width:3500px)]:!w-[40px]"
                />
              ) : (
                <Image
                  src="/flags/rus.png"
                  alt=""
                  width={25}
                  height={30}
                  quality={80}
                  className="[@media(min-width:3500px)]:!w-[40px]"
                />
              )}
              {code.toUpperCase()}
            </div>
          ) : (
            <Link
              key={code}
              href={hrefForTargetLocale(code)}
              locale={code}
              prefetch={false}
              scroll={false}
              role="option"
              aria-selected={false}
              className="flex cursor-pointer items-center justify-center gap-3 py-2 text-center transition-colors hover:bg-jsblack/10"
              onClick={() => setIsOpen(false)}
            >
              {code === "az" ? (
                <Image
                  src="/flags/az.png"
                  alt=""
                  width={30}
                  height={30}
                  quality={80}
                  className="[@media(min-width:3500px)]:!w-[40px]"
                />
              ) : (
                <Image
                  src="/flags/rus.png"
                  alt=""
                  width={25}
                  height={30}
                  quality={80}
                  className="[@media(min-width:3500px)]:!w-[40px]"
                />
              )}
              {code.toUpperCase()}
            </Link>
          )
        )}
      </div>
    </div>
  );
}

export default function LanguageSwitcher({
  className,
}: {
  className?: string;
}) {
  return (
    <Suspense
      fallback={
        <div
          className={cn(
            "h-11 min-w-[100px] rounded-[30px] border border-gray-300 bg-white",
            className
          )}
          aria-hidden
        />
      }
    >
      <LanguageSwitcherInner className={className} />
    </Suspense>
  );
}
