import ContactFormFloat from "@/components/views/landing/single-course/contact-form-float";
import EligibilitySection from "@/components/views/landing/single-course/course-eligibility";
import CourseHero from "@/components/views/landing/single-course/course-hero";
import CoursesSlider from "@/components/views/landing/single-course/courses-slider";
import Breadcrumbs from "@/components/views/landing/bread-crumbs/bread-crumbs";
import FaqSection from "@/components/views/landing/faq/faq-section";
import { Locale } from "@/i18n/request";
import { getAllCourses, getCourseDetails } from "@/utils/api/course";
import { getFaqByPage } from "@/utils/api/faq";
import { getPageMeta } from "@/utils/api/page-meta";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import BreadcrumbContextWrapper from "@/hooks/BreadcrumbContextWrapper";
import TeamSection from "@/components/views/landing/about/team-section";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import { CONTENT_ISR_SECONDS } from "@/constants/content-isr";
import { cache } from "react";
import { trimMetaTitle, trimMetaDescription, buildCanonicalUrl, buildHreflangUrl } from "@/utils/seo";
import JsonLd from "@/components/seo/json-ld";
import { buildCoursePageGraph } from "@/data/site-schema";

interface ISingleCoursePageProps {
  params: {
    slug: string;
    locale: string;
  };
}


const getTeamMembers = cache(async () => {
  try {
    const res = await fetch(
      `${PUBLIC_API_BASE}/team/active?limit=30`,
      { next: { revalidate: CONTENT_ISR_SECONDS } },
    );
    if (!res.ok) return [];
    return (await res.json()) ?? [];
  } catch (error) {
    console.error(error);
    return [];
  }
});

export default async function SingleCoursePage({ params }: ISingleCoursePageProps) {
  try {
    const locale = params.locale as Locale;
    setRequestLocale(locale);
    const [data, t, courses, allTeachers] = await Promise.all([
      getCourseDetails(params.slug),
      getTranslations("singleCoursePage"),
      getAllCourses({}),
      getTeamMembers(),
    ]);

    if (!data) notFound();

    // FAQ page key həmişə AZ slug ilə saxlanılır, buna görə AZ slug istifadə edirik
    const faqSlug = data.slug?.az || params.slug;
    const faqItems = await getFaqByPage(`course:${faqSlug}`);

    const courseTitle = data.title[params.locale];
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
    const courseUrl = `${baseUrl}/${locale}/course/${params.slug}`;
    const descriptionText = data.description?.[locale]
      ? String(data.description[locale]).replace(/<[^>]*>/g, "").slice(0, 300)
      : undefined;

    const base = `${baseUrl}/${locale}`;
    const coursesLabel = locale === "az" ? "Kurslarımız" : "Курсы";
    const homeLabel = locale === "az" ? "Ana Səhifə" : "Главная";

    const rawTags = data.newTags?.[locale as "az" | "ru"] ?? [];
    const showEligibilityBlock = Boolean(data.eligibility && data.eligibility.length > 0);

    const schemaGraph = buildCoursePageGraph({
      name: courseTitle,
      description: descriptionText,
      url: courseUrl,
      locale,
      baseUrl,
      breadcrumbItems: [
        { name: homeLabel, url: base },
        { name: coursesLabel, url: `${base}/courses` },
        { name: courseTitle, url: courseUrl },
      ],
      educationalLevel: data.level?.[locale as "az" | "ru"],
      courseMode: "onsite",
      imageUrl: data.imageUrl ?? undefined,
      tags: rawTags.length ? rawTags : undefined,
      ageRange: data.ageRange ?? undefined,
    });

    return (
      <BreadcrumbContextWrapper title={courseTitle}>
        <JsonLd data={schemaGraph} />
        <div className="container mx-auto px-4 pt-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 3xl:px-28 4xl:px-32 [@media(min-width:2500px)]:!px-[111px] [@media(min-width:3500px)]:px-32">
          <Breadcrumbs dynamicTitle={courseTitle} />
        </div>
        <div className="container mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 3xl:px-28 4xl:px-32 my-10 md:my-16 lg:my-10 4xl:my-24 [@media(min-width:2500px)]:!px-[111px] [@media(min-width:3500px)]:px-32">

          <div className="mb-16 flex flex-col gap-12 lg:gap-16 2xl:gap-20">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8 xl:gap-10 2xl:gap-12">
              <div className="min-w-0 w-full flex-1">
                <CourseHero
                  title={data.title[locale]}
                  courseOverviewText={t("courseDescription")}
                  tags={data.newTags[locale]}
                  description={data.description[locale]}
                  params={params}
                  data={data}
                  locale={locale}
                />
              </div>
              <aside className="hidden shrink-0 lg:block lg:sticky lg:top-8 lg:self-start lg:flex-none lg:w-96 xl:w-[26rem] 2xl:w-[28rem]">
                <ContactFormFloat />
              </aside>
            </div>

            {showEligibilityBlock && (
              <EligibilitySection
                locale={locale}
                title={t("whoIsEligibleToEnroll")}
                eligibility={data.eligibility ?? []}
              />
            )}

            <TeamSection
              title={t("teachers")}
              teamMembers={allTeachers}
              isCoursePage
            />

            {faqItems.length > 0 && (
              <FaqSection items={faqItems} locale={locale} />
            )}

            <div className="lg:hidden">
              <ContactFormFloat />
            </div>
          </div>

          <CoursesSlider courses={courses} locale={locale} />
        </div>
      </BreadcrumbContextWrapper>
    );
  } catch {
    notFound();
  }
}

export async function generateMetadata({ params }: ISingleCoursePageProps): Promise<Metadata> {
  try {
    const [data, meta] = await Promise.all([
      getCourseDetails(params.slug),
      getPageMeta(`course:${params.slug}`, params.locale),
    ]);
    const locale = params.locale as Locale;

    if (!data) {
      return { title: "Not Found", description: "The requested course was not found", robots: { index: false } };
    }

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
    const azSlug = data.slug?.az || params.slug;
    const ruSlug = data.slug?.ru || params.slug;
    const canonicalUrl = buildCanonicalUrl(baseUrl, `course/${azSlug}`);

    const title = meta?.title
      ? trimMetaTitle(meta.title)
      : trimMetaTitle(data.title[locale]);
    const descriptionText = meta?.description
      ? meta.description
      : data.description[locale]
        ? data.description[locale].replace(/<[^>]*>/g, "")
        : "";
    const description = descriptionText ? trimMetaDescription(descriptionText) : undefined;

    const openGraph: Metadata["openGraph"] = {
      title,
      description: description ?? undefined,
      url: buildHreflangUrl(baseUrl, locale, `course/${locale === "az" ? azSlug : ruSlug}`),
      type: "website",
      locale: locale === "az" ? "az_AZ" : "ru_RU",
      alternateLocale: locale === "az" ? "ru_RU" : "az_AZ",
    };
    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
        languages: {
          az: buildHreflangUrl(baseUrl, "az", `course/${azSlug}`),
          ru: buildHreflangUrl(baseUrl, "ru", `course/${ruSlug}`),
          "x-default": buildHreflangUrl(baseUrl, "az", `course/${azSlug}`),
        },
      },
      openGraph,
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
      },
    };
  } catch {
    return { title: "Error", description: "Failed to load course details", robots: { index: false } };
  }
}

export const revalidate = CONTENT_ISR_SECONDS;
