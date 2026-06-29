import IntroSection from "@/components/views/landing/about/intro-section";
import MissionVisionSection from "@/components/views/landing/about/mission-vision-section";
import StatsSection from "@/components/views/landing/about/stats-section";
import TeamSection from "@/components/views/landing/about/team-section";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPageMeta } from "@/utils/api/page-meta";
import { trimMetaTitle, trimMetaDescription, buildHreflangUrl } from "@/utils/seo";
import JsonLd from "@/components/seo/json-ld";
import { buildAboutPageGraph, SITE_SCHEMA } from "@/data/site-schema";
import { getFaqByPage } from "@/utils/api/faq";
import FaqSection from "@/components/views/landing/faq/faq-section";
import { getAboutHero } from "@/utils/api/about-hero";
import { defaultAboutIntroHtml } from "@/utils/about-intro-default-html";
import { buildImageUrl } from "@/utils/imageUrl";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const [t, aboutT, meta] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata" }),
    getTranslations({ locale, namespace: "aboutPage" }),
    getPageMeta("about-us", locale),
  ]);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const canonicalUrl = buildHreflangUrl(baseUrl, locale, "about-us");

  const title = meta?.title
    ? trimMetaTitle(meta.title)
    : trimMetaTitle(t("aboutPageTitle") || "Haqqımızda");
  const description = meta?.description
    ? trimMetaDescription(meta.description)
    : trimMetaDescription(
        aboutT("introduction.description1") ||
          "JET School olaraq, biz 2021-ci ildən etibarən uşaqlar və yeniyetmələr üçün texnologiya dünyasını əyləncəli və öyrədici hala gətirməyi qarşımıza məqsəd qoymuşuq."
      );

  const openGraph: Metadata["openGraph"] = {
    title,
    description,
    url: buildHreflangUrl(baseUrl, locale, "about-us"),
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
        az: buildHreflangUrl(baseUrl, "az", "about-us"),
        ru: buildHreflangUrl(baseUrl, "ru", "about-us"),
        "x-default": buildHreflangUrl(baseUrl, "az", "about-us"),
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
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
      },
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  const locale = params.locale;
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const base = `${baseUrl}/${locale}`;
  const aboutUrl = `${base}/about-us`;
  const homeLabel = locale === "az" ? "Ana Səhifə" : "Главная";
  const aboutLabel = locale === "az" ? "Haqqımızda" : "О нас";

  const [t, meta, faqItems, aboutHero] = await Promise.all([
    getTranslations({ locale: params.locale, namespace: "aboutPage" }),
    getPageMeta("about-us", locale),
    getFaqByPage("about"),
    getAboutHero(),
  ]);

  const localeKey = locale === "ru" ? "ru" : "az";
  const introHtml =
    aboutHero?.bodyHtml?.[localeKey]?.trim() || defaultAboutIntroHtml(localeKey);
  const introImageAlt =
    aboutHero?.imageAlt?.[localeKey] ||
    (localeKey === "az" ? "JET School haqqimizda" : "JET School o nas");
  const introImageSrc = aboutHero?.imageUrl
    ? buildImageUrl(aboutHero.imageUrl)
    : "/images/about/intro.webp";
  const missionImageSrc = aboutHero?.missionVision?.imageUrl
    ? buildImageUrl(aboutHero.missionVision.imageUrl)
    : undefined;
  const missionImageAlt =
    aboutHero?.missionVision?.imageAlt?.[localeKey] ||
    (localeKey === "az" ? "Missiya ve vizyon" : "Missiya i videnie");

  const missionSectionTitle =
    aboutHero?.missionVision?.sectionTitle?.[localeKey] || t("mission.sectionTitle");
  const missionTitle =
    aboutHero?.missionVision?.missionTitle?.[localeKey] || t("mission.title");
  const missionDescription =
    aboutHero?.missionVision?.missionDescription?.[localeKey] || t("mission.description");
  const visionTitle =
    aboutHero?.missionVision?.visionTitle?.[localeKey] || t("vision.title");
  const visionDescription =
    aboutHero?.missionVision?.visionDescription?.[localeKey] || t("vision.description");

  const pageTitle = meta?.title ? trimMetaTitle(meta.title) : (locale === "az" ? "Haqqımızda" : "О нас");
  const pageDescription = meta?.description ? trimMetaDescription(meta.description) : t("introduction.description1") ?? undefined;

  const schemaGraph = buildAboutPageGraph({
    name: pageTitle,
    description: pageDescription ?? null,
    url: aboutUrl,
    locale,
    baseUrl,
    breadcrumbItems: [
      { name: homeLabel, url: base },
      { name: aboutLabel, url: aboutUrl },
    ],
    primaryImageUrl: SITE_SCHEMA.image,
  });

  return (
    <div
      className="
      container flex flex-col p-0 gap-16 4xl:gap-24 py-16 4xl:py-28
      "
    >
      <JsonLd data={schemaGraph} />
      <IntroSection
        bodyHtml={introHtml}
        imageAlt={introImageAlt}
        imageSrc={introImageSrc}
      />

      <MissionVisionSection
        sectionTitle={missionSectionTitle}
        mission={{
          title: missionTitle,
          description: missionDescription,
        }}
        vision={{
          title: visionTitle,
          description: visionDescription,
        }}
        imageSrc={missionImageSrc}
        imageAlt={missionImageAlt}
      />

      <StatsSection
        stats={{
          graduatesLabel: t("stats.graduatesLabel"),
          groupsLabel: t("stats.groupsLabel"),
          studentsLabel: t("stats.studentsLabel"),
          teachingArea:t("stats.teachingArea")
        }}
      />
      <TeamSection />

      {faqItems.length > 0 && (
        <FaqSection items={faqItems} locale={locale as "az" | "ru"} />
      )}
    </div>
  );
}
