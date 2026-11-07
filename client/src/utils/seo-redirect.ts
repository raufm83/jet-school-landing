/* eslint-disable @typescript-eslint/no-explicit-any */
import { PUBLIC_API_BASE } from "../constants/public-api-base";

/**
 * Çoxdilli detal URL-ləri üçün server tərəfli yönləndirmə (middleware-dən çağırılır):
 *  1) /ru/{bölmə}/{az-slug} → /ru/{bölmə}/{ru-slug} (və tərsinə), bir addımda, 301.
 *  2) Həmin dildə versiya yoxdursa → digər dilin düzgün URL-inə 301.
 * API cavab verməsə və ya slug tapılmasa heç nə dəyişmir (səhifə öz qaydası ilə açılır).
 */

type Loc = "az" | "ru";

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const at = (obj: any, l: Loc): string => str(obj?.[l]);

interface Section {
  prefix: string;
  endpoint: (slug: string) => string;
  hasLocale: (data: any, l: Loc) => boolean;
  re: RegExp;
}

function makeSection(
  prefix: string,
  endpoint: (slug: string) => string,
  hasLocale: (data: any, l: Loc) => boolean
): Section {
  return {
    prefix,
    endpoint,
    hasLocale,
    re: new RegExp(`^/(az|ru)/${prefix}/([^/]+)/?$`),
  };
}

const hasFullPost = (d: any, l: Loc) =>
  !!(at(d?.slug, l) && at(d?.title, l) && at(d?.content, l));
const hasPostTitle = (d: any, l: Loc) => !!(at(d?.slug, l) && at(d?.title, l));

const SECTIONS: Section[] = [
  makeSection("blog", (s) => `/posts/slug/${s}`, hasFullPost),
  makeSection("news", (s) => `/posts/slug/${s}`, hasFullPost),
  makeSection("events", (s) => `/posts/slug/${s}`, hasPostTitle),
  makeSection("offers", (s) => `/posts/slug/${s}`, hasPostTitle),
  makeSection("course", (s) => `/courses/slug/${s}`, hasPostTitle),
  makeSection("vacancies", (s) => `/vacancies/by-slug/${s}`, (d, l) => !!at(d?.slug, l)),
  makeSection(
    "glossary/term",
    (s) => `/glossary/slug/${s}`,
    (d, l) => !!(at(d?.slug, l) && at(d?.term, l) && at(d?.definition, l))
  ),
  makeSection(
    "glossary/category",
    (s) => `/glossary-categories/slug/${s}`,
    (d, l) => !!(at(d?.slug, l) && at(d?.name, l))
  ),
];

interface Info {
  slug: Record<Loc, string>;
  has: Record<Loc, boolean>;
}

const cache = new Map<string, { exp: number; info: Info | null }>();
const HIT_TTL = 5 * 60 * 1000;
const MISS_TTL = 60 * 1000;
const MAX_ENTRIES = 2000;

async function lookup(sec: Section, slug: string): Promise<Info | null> {
  const key = `${sec.prefix}:${slug}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.exp > now) return hit.info;

  let info: Info | null = null;
  let cacheable = true;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2500);
  try {
    const res = await fetch(
      `${PUBLIC_API_BASE}${sec.endpoint(encodeURIComponent(slug))}`,
      { headers: { Accept: "application/json" }, cache: "no-store", signal: ctrl.signal }
    );
    if (res.ok) {
      const data = await res.json();
      info = {
        slug: { az: at(data?.slug, "az"), ru: at(data?.slug, "ru") },
        has: { az: sec.hasLocale(data, "az"), ru: sec.hasLocale(data, "ru") },
      };
    } else if (res.status !== 404) {
      cacheable = false;
    }
  } catch {
    cacheable = false;
  } finally {
    clearTimeout(timer);
  }

  if (cacheable) {
    if (cache.size >= MAX_ENTRIES) cache.clear();
    cache.set(key, { exp: now + (info ? HIT_TTL : MISS_TTL), info });
  }
  return info;
}

/** Yönləndirmə lazımdırsa yeni yol (relative), yoxdursa null */
export async function resolveSeoRedirect(
  pathname: string,
  search = ""
): Promise<string | null> {
  for (const sec of SECTIONS) {
    const m = sec.re.exec(pathname);
    if (!m) continue;

    const locale = m[1] as Loc;
    let slug = "";
    try {
      slug = decodeURIComponent(m[2]);
    } catch {
      return null;
    }
    if (!slug || slug === "undefined") return null;

    const info = await lookup(sec, slug);
    if (!info) return null;

    const other: Loc = locale === "az" ? "ru" : "az";
    const target: Loc | null = info.has[locale] ? locale : info.has[other] ? other : null;
    if (!target) return null;

    const targetSlug = info.slug[target];
    if (target === locale && targetSlug === slug) return null;
    return `/${target}/${sec.prefix}/${encodeURIComponent(targetSlug)}${search}`;
  }
  return null;
}
