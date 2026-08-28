import ContactFormFloat from "@/components/views/landing/single-course/contact-form-float";
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
import { permanentRedirect } from "next/navigation";
import BreadcrumbContextWrapper from "@/hooks/BreadcrumbContextWrapper";
import TeamSection from "@/components/views/landing/about/team-section";
import CourseProjects from "@/components/views/landing/single-course/course-projects";
import CourseReviews from "@/components/views/landing/single-course/course-reviews";
import { isDisplayablePublicReview } from "@/utils/displayable-review";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import { StudentReview } from "@/types/student-reviews";
import { Project } from "@/types/student-projects";
import { CONTENT_ISR_SECONDS } from "@/constants/content-isr";
import { trimMetaTitle, trimMetaDescription, buildHreflangUrl } from "@/utils/seo";
import JsonLd from "@/components/seo/json-ld";
import { buildCoursePageGraph } from "@/data/site-schema";
import { cache } from "react";

const cachedGetCourseDetails = cache((slug: string) => getCourseDetails(slug));

const fetchProjects = cache(async () => {
  try {
    const response = await fetch(
      `${PUBLIC_API_BASE}/student-projects?limit=10&sortBy=order&order=desc`,
      { next: { revalidate: 120 } },
    );
    if (!response.ok) return { items: [] };
    return (await response.json()) ?? { items: [] };
  } catch {
    return { items: [] };
  }
});

const fetchReviews = cache(async () => {
  try {
    const response = await fetch(
      `${PUBLIC_API_BASE}/student-reviews?limit=20&sortBy=order&order=desc`,
      { next: { revalidate: 120 } },
    );
    if (!response.ok) return { items: [] };
    return (await response.json()) ?? { items: [] };
  } catch {
    return { items: [] };
  }
});

interface ISingleCoursePageProps {
  params: {
    slug: string;
    locale: string;
  };
}

export default async function SingleCoursePage({ params }: ISingleCoursePageProps) {
  try {
    const locale = params.locale as Locale;
    setRequestLocale(locale);
    const [data, t, courses, projectsData, reviewsData] = await Promise.all([
      cachedGetCourseDetails(params.slug),
      getTranslations("singleCoursePage"),
      getAllCourses({}),
      fetchProjects(),
      fetchReviews(),
    ]);

    const projects: Project[] = projectsData?.items ?? [];
    const reviews: StudentReview[] = (reviewsData?.items ?? []).filter((r: StudentReview) =>
      isDisplayablePublicReview(r)
    );

    if (!data) permanentRedirect(`/${locale}/courses`);

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

          <div className="mb-16 flex flex-col lg:flex-row gap-12 lg:gap-8 xl:gap-12 relative items-start">
            <div className="flex-1 min-w-0 flex flex-col gap-12 lg:gap-16 2xl:gap-20">
              {/* 1. Kurs Haqqında (Course Hero) */}
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8 xl:gap-10 2xl:gap-12">
                <div className="min-w-0 w-full flex-1">
                  <CourseHero
                    title={data.title[locale]}
                    tags={data.newTags[locale]}
                    description={data.description[locale]}
                    params={params}
                    data={data}
                    locale={locale}
                  />
                </div>
              </div>

              {/* Who can join (Optional, kept below Hero if exists) */}
              {/* showEligibilityBlock && (
                <EligibilitySection
                  locale={locale}
                  title={t("whoIsEligibleToEnroll")}
                  eligibility={data.eligibility ?? []}
                />
              ) */}

              {/* 2. Kursun Modulları (Removed as it's already in CourseHero) */}

              {/* 3. Təlimçi */}
              <TeamSection
                title={t("teachers")}
                teamMembers={data.teachers ?? []}
                isCoursePage
              />

              {/* 4. Layihələr */}
              {projects.length > 0 && (
                <CourseProjects projects={projects} locale={locale} />
              )}

              {/* 5. Valideyn rəyləri */}
              {reviews.length > 0 && (
                <CourseReviews reviews={reviews} locale={locale} />
              )}

              {/* 6. FAQ */}
              {faqItems.length > 0 && (
                <FaqSection items={faqItems} locale={locale} />
              )}
            </div>

            {/* 7. Qeydiyyat formu (Desktop) */}
            <div className="hidden lg:block w-[350px] xl:w-[400px] shrink-0">
              <ContactFormFloat />
            </div>
          </div>

          <CoursesSlider courses={courses} locale={locale} />
        </div>
      </BreadcrumbContextWrapper>
    );
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    permanentRedirect(`/${params.locale}/courses`);
  }
}

export async function generateMetadata({ params }: ISingleCoursePageProps): Promise<Metadata> {
  try {
    const [data, meta] = await Promise.all([
      cachedGetCourseDetails(params.slug),
      getPageMeta(`course:${params.slug}`, params.locale),
    ]);
    const locale = params.locale as Locale;

    if (!data) {
      return { title: "Not Found", description: "The requested course was not found", robots: { index: false } };
    }

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
    const canonicalUrl = buildHreflangUrl(baseUrl, locale, `course/${params.slug}`);

    const title = data.metaTitle?.[locale]
      ? trimMetaTitle(data.metaTitle[locale])
      : meta?.title
        ? trimMetaTitle(meta.title)
        : trimMetaTitle(data.title[locale]);

    const descriptionText = data.metaDescription?.[locale]
      ? data.metaDescription[locale]
      : meta?.description
        ? meta.description
        : data.description[locale]
          ? data.description[locale].replace(/<[^>]*>/g, "")
          : "";
    const description = descriptionText ? trimMetaDescription(descriptionText) : undefined;
    const keywords = data.metaKeywords?.[locale] || undefined;

    const openGraph: Metadata["openGraph"] = {
      title,
      description: description ?? undefined,
      url: canonicalUrl,
      type: "website",
      locale: locale === "az" ? "az_AZ" : "ru_RU",
      alternateLocale: locale === "az" ? "ru_RU" : "az_AZ",
    };
    return {
      title,
      description,
      keywords,
      alternates: {
        canonical: canonicalUrl,
        languages: {
          az: buildHreflangUrl(baseUrl, "az", `course/${params.slug}`),
          ru: buildHreflangUrl(baseUrl, "ru", `course/${params.slug}`),
          "x-default": buildHreflangUrl(baseUrl, "az", `course/${params.slug}`),
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
