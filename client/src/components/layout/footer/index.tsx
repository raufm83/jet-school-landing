import { cache } from "react";

import { getContact } from "@/utils/api/contact";
import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import { CONTENT_ISR_LONG_SECONDS } from "@/constants/content-isr";
import {
  FaClock,
  FaEnvelope,
  FaFacebook,
  FaInstagram,
  FaMapMarkerAlt,
  FaPhone,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import { FaTiktok } from "react-icons/fa6";

interface Course {
  id: string;
  title: { az: string; ru: string };
  slug: { az: string; ru: string };
  createdAt?: string;
  order?: number;
}
interface CoursesResponse {
  items?: Course[];
}

/** Bütün dərc olunmuş kurslar — API `order` desc, `createdAt` desc ilə qaytarır */
const fetchCourses = cache(async function fetchCourses(): Promise<
  CoursesResponse | Course[] | null
> {
  try {
    const params = new URLSearchParams({
      limit: "500",
      page: "1",
    });
    const res = await fetch(`${PUBLIC_API_BASE}/courses/brief?${params}`, {
      next: { revalidate: CONTENT_ISR_LONG_SECONDS },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    console.error("Failed to fetch courses");
    return null;
  }
});

function sortCoursesByOrder(a: Course, b: Course): number {
  const oa = typeof a.order === "number" && Number.isFinite(a.order) ? a.order : 0;
  const ob = typeof b.order === "number" && Number.isFinite(b.order) ? b.order : 0;
  if (ob !== oa) return ob - oa;
  const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return tb - ta;
}

function socialUrl(url: string): string {
  return url.startsWith("http") ? url : `https://${url}`;
}

export default async function Footer() {
  try {
    const [t, localeRaw, contact, coursesData] = await Promise.all([
      getTranslations("footer"),
      getLocale(),
      getContact(),
      fetchCourses(),
    ]);
    const lang = (localeRaw === "ru" ? "ru" : "az") as "az" | "ru";
    const currentYear = new Date().getFullYear();

    const sortedCourses: Course[] = Array.isArray(coursesData)
      ? coursesData.slice().sort(sortCoursesByOrder)
      : coursesData?.items
      ? coursesData.items.slice().sort(sortCoursesByOrder)
      : [];
    const footerLinkClass =
      "text-sm sm:text-base [@media(min-width:2500px)]:!text-xl [@media(min-width:3500px)]:!text-3xl hover:underline transition-all duration-200 hover:text-white/90 leading-relaxed [@media(min-width:3500px)]:leading-relaxed";
    const exploreLinks = [
      { href: "/", label: t("home") },
      { href: "/about-us", label: t("about") },
      { href: "/reviews", label: t("reviews") },
      { href: "/projects", label: t("projects") },
      { href: "/about-us#mezunlar", label: t("graduates") },
      { href: "/offers", label: t("offers") },
      { href: "/vacancies", label: t("vacancies") },
      { href: "/gallery", label: t("lessonViews") },
    ];
    const resourceLinks = [
      { href: "/blog", label: t("blog") },
      { href: "/news/category/news", label: t("news") },
      { href: "/events", label: t("events") },
      { href: "/glossary/terms", label: t("glossary") },
    ];

    return (
      <footer
        id="contacts"
        className="relative w-full min-w-0 max-w-full shrink-0 self-stretch overflow-hidden bg-jsyellow text-white mt-12 sm:mt-16 md:mt-20"
      >
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden mix-blend-soft-light opacity-30 sm:opacity-40 lg:opacity-50 blur-[1px] sm:blur-[2px]"
          aria-hidden
        >
          <div className="absolute top-[5%] sm:top-[10%] left-2 sm:left-4 md:left-[3%]">
            <Image
              src="/hero/rocket.png"
              alt=""
              width={300}
              height={300}
              sizes="(max-width: 640px) 120px, (max-width: 768px) 150px, (max-width: 1024px) 200px, 300px"
              decoding="async"
              className="w-[120px] sm:w-[150px] md:w-[200px] lg:w-[300px] [@media(min-width:3500px)]:!w-[400px]"
              loading="lazy"
            />
          </div>
          <div className="absolute top-1/2 right-2 sm:right-4 md:right-[3%]">
            <Image
              src="/hero/book.png"
              alt=""
              width={300}
              height={300}
              sizes="(max-width: 640px) 120px, (max-width: 768px) 150px, (max-width: 1024px) 200px, 300px"
              decoding="async"
              className="w-[120px] sm:w-[150px] md:w-[200px] lg:w-[300px] [@media(min-width:3500px)]:!w-[400px]"
              loading="lazy"
            />
          </div>
          <div className="hidden md:block absolute bottom-4 left-[15%] lg:left-[20%] opacity-50 sm:opacity-70 blur-[1px] sm:blur-[2px]">
            <Image
              src="/hero/laptop.png"
              alt=""
              width={300}
              height={300}
              sizes="(max-width: 768px) 150px, (max-width: 1024px) 200px, 300px"
              decoding="async"
              className="w-[150px] md:w-[200px] lg:w-[300px] [@media(min-width:3500px)]:!w-[400px]"
              loading="lazy"
            />
          </div>
        </div>

        <div className="container mx-auto w-full min-w-0 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 [@media(min-width:3000px)]:px-24 [@media(min-width:3500px)]:px-32 relative z-10 box-border py-6 sm:py-8 md:py-12 lg:py-16">
          
          <div className="flex w-full min-w-0 flex-col lg:flex-row lg:items-start justify-between gap-8 md:gap-8 lg:gap-12 [@media(min-width:2500px)]:gap-16 [@media(min-width:3500px)]:gap-24">
            {/* Left Section - Company Info */}
            <div className="flex min-w-0 flex-1 flex-col gap-4 sm:gap-5 lg:gap-6 [@media(min-width:2500px)]:gap-8 [@media(min-width:3500px)]:gap-10 lg:min-w-[260px] max-w-[500px] [@media(min-width:2500px)]:max-w-[600px] [@media(min-width:3500px)]:max-w-[800px]">
              <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl [@media(min-width:2500px)]:!text-5xl [@media(min-width:3500px)]:!text-6xl font-bold">
                JET School
              </div>
              <p className="max-w-xs sm:max-w-sm lg:max-w-md [@media(min-width:2500px)]:max-w-lg [@media(min-width:3500px)]:max-w-xl text-white/80 text-sm sm:text-base [@media(min-width:2500px)]:!text-xl [@media(min-width:3500px)]:!text-3xl leading-relaxed [@media(min-width:3500px)]:leading-relaxed">
                {t("tagline")}
              </p>

              <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5 [@media(min-width:2500px)]:gap-6 [@media(min-width:3500px)]:gap-8">
                <a
                  href={`https://maps.google.com?q=${encodeURIComponent(contact.address[lang])}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 sm:gap-3 [@media(min-width:2500px)]:gap-4 [@media(min-width:3500px)]:gap-6 text-sm sm:text-base [@media(min-width:2500px)]:!text-xl [@media(min-width:3500px)]:!text-3xl hover:underline transition-all duration-200"
                >
                  <FaMapMarkerAlt className="w-4 h-4 sm:w-5 sm:h-5 [@media(min-width:2500px)]:!w-6 [@media(min-width:2500px)]:!h-6 [@media(min-width:3500px)]:!w-8 [@media(min-width:3500px)]:!h-8 mt-1 flex-shrink-0" />
                  <span className="min-w-0 break-words leading-relaxed [@media(min-width:3500px)]:leading-relaxed">{contact.address[lang]}</span>
                </a>
                
                

                <div className="flex flex-col gap-2 sm:gap-3 [@media(min-width:2500px)]:gap-4 [@media(min-width:3500px)]:gap-6">
                  <a
                    href={`tel:${contact.phone.replace(/\D/g, "")}`}
                    className="flex items-center gap-2 sm:gap-3 [@media(min-width:2500px)]:gap-4 [@media(min-width:3500px)]:gap-6 text-sm sm:text-base [@media(min-width:2500px)]:!text-xl [@media(min-width:3500px)]:!text-3xl hover:underline transition-all duration-200"
                  >
                    <FaPhone className="w-4 h-4 sm:w-5 sm:h-5 [@media(min-width:2500px)]:!w-6 [@media(min-width:2500px)]:!h-6 [@media(min-width:3500px)]:!w-8 [@media(min-width:3500px)]:!h-8 flex-shrink-0" />
                    <span className="min-w-0 break-words">{contact.phone}</span>
                  </a>
                  
                  <a
                    href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 sm:gap-3 [@media(min-width:2500px)]:gap-4 [@media(min-width:3500px)]:gap-6 text-sm sm:text-base [@media(min-width:2500px)]:!text-xl [@media(min-width:3500px)]:!text-3xl hover:underline transition-all duration-200"
                  >
                    <FaWhatsapp className="w-4 h-4 sm:w-5 sm:h-5 [@media(min-width:2500px)]:!w-6 [@media(min-width:2500px)]:!h-6 [@media(min-width:3500px)]:!w-8 [@media(min-width:3500px)]:!h-8 flex-shrink-0" />
                    <span className="min-w-0 break-words">{contact.whatsapp}</span>
                  </a>
                  
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 sm:gap-3 [@media(min-width:2500px)]:gap-4 [@media(min-width:3500px)]:gap-6 text-sm sm:text-base [@media(min-width:2500px)]:!text-xl [@media(min-width:3500px)]:!text-3xl hover:underline transition-all duration-200"
                  >
                    <FaEnvelope className="w-4 h-4 sm:w-5 sm:h-5 [@media(min-width:2500px)]:!w-6 [@media(min-width:2500px)]:!h-6 [@media(min-width:3500px)]:!w-8 [@media(min-width:3500px)]:!h-8 flex-shrink-0" />
                    <span className="min-w-0 break-all sm:break-words">{contact.email}</span>
                  </a>
                </div>

                <div className="flex items-start gap-2 sm:gap-3 [@media(min-width:2500px)]:gap-4 [@media(min-width:3500px)]:gap-6 text-sm sm:text-base">
                  <FaClock className="w-4 h-4 sm:w-5 sm:h-5 [@media(min-width:2500px)]:!w-6 [@media(min-width:2500px)]:!h-6 [@media(min-width:3500px)]:!w-8 [@media(min-width:3500px)]:!h-8 mt-1 flex-shrink-0" />
                  <div className="flex flex-col gap-1 [@media(min-width:2500px)]:gap-2">
                    <span className="[@media(min-width:2500px)]:!text-xl [@media(min-width:3500px)]:!text-3xl leading-relaxed [@media(min-width:3500px)]:leading-relaxed">
                      {contact.workingHours[lang].weekdays}
                    </span>
                    <span className="[@media(min-width:2500px)]:!text-xl [@media(min-width:3500px)]:!text-3xl leading-relaxed [@media(min-width:3500px)]:leading-relaxed">
                      {contact.workingHours[lang].sunday}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4 [@media(min-width:2500px)]:gap-6 [@media(min-width:3500px)]:gap-8 pt-2 sm:pt-4 [@media(min-width:2500px)]:pt-6">
                  {contact.socialLinks?.facebook?.trim() && (
                    <a
                      href={socialUrl(contact.socialLinks.facebook.trim())}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      className="w-8 h-8 sm:w-10 sm:h-10 [@media(min-width:2500px)]:!w-14 [@media(min-width:2500px)]:!h-14 [@media(min-width:3500px)]:!w-16 [@media(min-width:3500px)]:!h-16 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110"
                    >
                      <FaFacebook className="w-4 h-4 sm:w-5 sm:h-5 [@media(min-width:2500px)]:!w-7 [@media(min-width:2500px)]:!h-7 [@media(min-width:3500px)]:!w-8 [@media(min-width:3500px)]:!h-8" />
                    </a>
                  )}
                  {contact.socialLinks?.instagram?.trim() && (
                    <a
                      href={socialUrl(contact.socialLinks.instagram.trim())}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="w-8 h-8 sm:w-10 sm:h-10 [@media(min-width:2500px)]:!w-14 [@media(min-width:2500px)]:!h-14 [@media(min-width:3500px)]:!w-16 [@media(min-width:3500px)]:!h-16 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110"
                    >
                      <FaInstagram className="w-4 h-4 sm:w-5 sm:h-5 [@media(min-width:2500px)]:!w-7 [@media(min-width:2500px)]:!h-7 [@media(min-width:3500px)]:!w-8 [@media(min-width:3500px)]:!h-8" />
                    </a>
                  )}
                  {contact.socialLinks?.youtube?.trim() && (
                    <a
                      href={socialUrl(contact.socialLinks.youtube.trim())}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="YouTube"
                      className="w-8 h-8 sm:w-10 sm:h-10 [@media(min-width:2500px)]:!w-14 [@media(min-width:2500px)]:!h-14 [@media(min-width:3500px)]:!w-16 [@media(min-width:3500px)]:!h-16 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110"
                    >
                      <FaYoutube className="w-4 h-4 sm:w-5 sm:h-5 [@media(min-width:2500px)]:!w-7 [@media(min-width:2500px)]:!h-7 [@media(min-width:3500px)]:!w-8 [@media(min-width:3500px)]:!h-8" />
                    </a>
                  )}
                  {contact.socialLinks?.tiktok?.trim() && (
                    <a
                      href={socialUrl(contact.socialLinks.tiktok.trim())}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="TikTok"
                      className="w-8 h-8 sm:w-10 sm:h-10 [@media(min-width:2500px)]:!w-14 [@media(min-width:2500px)]:!h-14 [@media(min-width:3500px)]:!w-16 [@media(min-width:3500px)]:!h-16 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110"
                    >
                      <FaTiktok className="w-4 h-4 sm:w-5 sm:h-5 [@media(min-width:2500px)]:!w-7 [@media(min-width:2500px)]:!h-7 [@media(min-width:3500px)]:!w-8 [@media(min-width:3500px)]:!h-8" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div
              className="
                flex w-full min-w-0 flex-1 flex-col
                gap-y-12 md:flex-row md:flex-wrap md:items-start md:justify-between md:gap-y-10
                md:gap-x-6 lg:flex-nowrap lg:justify-between
                lg:gap-x-10 xl:gap-x-14 2xl:gap-x-20
                [@media(min-width:2500px)]:gap-x-24 [@media(min-width:3500px)]:gap-x-28
              "
            >
              <div className="w-full min-w-0 md:flex-1 md:basis-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl [@media(min-width:2500px)]:!text-3xl [@media(min-width:3500px)]:!text-5xl font-bold mb-5 sm:mb-6 [@media(min-width:2500px)]:mb-7 [@media(min-width:3500px)]:mb-9">
                  {t("explore")}
                </h2>
                <ul className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:gap-[1.125rem] [@media(min-width:2500px)]:gap-6 [@media(min-width:3500px)]:gap-8">
                  {exploreLinks.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href as never} className={footerLinkClass}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Courses Section */}
              <div className="w-full min-w-0 md:flex-1 md:basis-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl [@media(min-width:2500px)]:!text-3xl [@media(min-width:3500px)]:!text-5xl font-bold mb-5 sm:mb-6 [@media(min-width:2500px)]:mb-7 [@media(min-width:3500px)]:mb-9">
                  {t("teachingAreas")}
                </h2>
                <ul className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:gap-[1.125rem] [@media(min-width:2500px)]:gap-6 [@media(min-width:3500px)]:gap-8">
                  {sortedCourses.length > 0 ? (
                    sortedCourses.map((c) => (
                      <li key={c.id}>
                        <Link 
                          href={{
                            pathname: "/course/[slug]",
                            params: { slug: c.slug[lang] },
                          }} 
                          className="max-w-full text-sm sm:text-base [@media(min-width:2500px)]:!text-xl [@media(min-width:3500px)]:!text-3xl hover:underline transition-all duration-200 hover:text-white/90 leading-relaxed [@media(min-width:3500px)]:leading-relaxed block break-words"
                        >
                          {c.title[lang]}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm sm:text-base [@media(min-width:2500px)]:!text-xl [@media(min-width:3500px)]:!text-3xl text-white/70">
                      {t("noCourses")}
                    </li>
                  )}
                </ul>
              </div>

              {/* Resources Section */}
              <div className="w-full min-w-0 md:flex-1 md:basis-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl [@media(min-width:2500px)]:!text-3xl [@media(min-width:3500px)]:!text-5xl font-bold mb-5 sm:mb-6 [@media(min-width:2500px)]:mb-7 [@media(min-width:3500px)]:mb-9">
                  {t("resources")}
                </h2>
                <ul className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:gap-[1.125rem] [@media(min-width:2500px)]:gap-6 [@media(min-width:3500px)]:gap-8">
                  {resourceLinks.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href as never} className={footerLinkClass}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Copyright Section */}
          <div className="mt-8 sm:mt-10 lg:mt-12 [@media(min-width:2500px)]:mt-16 [@media(min-width:3500px)]:mt-20 pt-6 sm:pt-8 [@media(min-width:2500px)]:pt-10 [@media(min-width:3500px)]:pt-12 border-t border-white/20 text-center lg:text-left">
            <p className="text-sm sm:text-base [@media(min-width:2500px)]:!text-xl [@media(min-width:3500px)]:!text-3xl text-white/90 leading-relaxed [@media(min-width:3500px)]:leading-relaxed">
              © 2021 – {currentYear} JET School. {t("copyright")}
            </p>
          </div>
        </div>
      </footer>
    );
  } catch (err) {
    console.error("Footer error:", err);
    return (
      <footer className="w-full min-w-0 max-w-full shrink-0 overflow-hidden bg-jsyellow px-4 py-6 text-center text-white sm:px-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6">
          <p className="text-sm sm:text-base [@media(min-width:3500px)]:!text-2xl">
            © 2021 – {new Date().getFullYear()} JET School
          </p>
        </div>
      </footer>
    );
  }
}
