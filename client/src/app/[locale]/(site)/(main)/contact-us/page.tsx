import ContactHero from "@/components/views/landing/contact-us/contact-hero";
import ContactSection from "@/components/views/landing/contact-us/contact-section";
import JsonLd from "@/components/seo/json-ld";
import { buildContactPageGraph, SITE_SCHEMA } from "@/data/site-schema";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPageMeta } from "@/utils/api/page-meta";
import { trimMetaTitle, trimMetaDescription, buildHreflangUrl } from "@/utils/seo";
import { getContact } from "@/utils/api/contact";
import { getFaqByPage } from "@/utils/api/faq";
import FaqSection from "@/components/views/landing/faq/faq-section";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const [t, contactT, meta] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata" }),
    getTranslations({ locale, namespace: "contact" }),
    getPageMeta("contact-us", locale),
  ]);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const canonicalUrl = buildHreflangUrl(baseUrl, locale, "contact-us");

  const metaTitle = meta?.title ? trimMetaTitle(meta.title) : "";
  const title = metaTitle || trimMetaTitle(t("contactPageTitle") || "Əlaqə Məlumatları");

  const metaDescription = meta?.description ? trimMetaDescription(meta.description) : "";
  const description =
    metaDescription ||
    trimMetaDescription(
      contactT("hero.description") ||
        "Suallarınız və ya təklifləriniz varsa, bizimlə əlaqə saxlamaqdan çəkinməyin."
    );

  const openGraph: Metadata["openGraph"] = {
    title,
    description,
    url: buildHreflangUrl(baseUrl, locale, "contact-us"),
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
        az: buildHreflangUrl(baseUrl, "az", "contact-us"),
        ru: buildHreflangUrl(baseUrl, "ru", "contact-us"),
        "x-default": buildHreflangUrl(baseUrl, "az", "contact-us"),
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
      },
    },
  };
}

export default async function ContactPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const base = `${baseUrl}/${locale}`;
  const contactUrl = `${base}/contact-us`;
  const homeLabel = locale === "az" ? "Ana Səhifə" : "Главная";
  const contactLabel = locale === "az" ? "Əlaqə" : "Контакты";

  const [t, contactT, contactData, faqItems] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata" }),
    getTranslations({ locale, namespace: "contact" }),
    getContact(),
    getFaqByPage("contact"),
  ]);

  const pageTitle = t("contactPageTitle") || "Əlaqə Məlumatları";
  const pageDescription =
    contactT("hero.description") ||
    "Suallarınız və ya təklifləriniz varsa, bizimlə əlaqə saxlamaqdan çəkinməyin.";

  const lang = locale === "az" ? "az" : "ru";
  const streetAddress = SITE_SCHEMA.schemaAddress[lang];

  const schemaGraph = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "url": contactUrl,
    "name": pageTitle,
    "description": pageDescription || "JET School ilə əlaqə saxlayın. Ünvan: Olimpiya küçəsi 6A, Bakı. Sınaq dərsinə qeydiyyat üçün zəng edin.",
    "about": {
      "@id": `${baseUrl}/#organization`
    },
    "mainEntity": {
      "@type": "EducationalOrganization",
      "@id": `${baseUrl}/#organization`,
      "name": "JET School",
      "url": baseUrl,
      "email": contactData.email?.trim() || "info@jetschool.az",
      "telephone": contactData.phone?.trim() || "+994709836699",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": streetAddress || "Olimpiya küçəsi 6A",
        "addressLocality": "Bakı",
        "addressCountry": "AZ"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "40.398557774992405",
        "longitude": "49.85549367964268"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": contactData.phone?.trim() || "+994709836699",
        "contactType": "customer service",
        "areaServed": "AZ",
        "availableLanguage": ["az", "ru"]
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "09:30",
        "closes": "21:30"
      }
    }
  };

  return (
    <main className="flex flex-col gap-12 pt-10 md:gap-12 md:pt-10">
      <JsonLd data={schemaGraph} />
      <ContactHero />
      <ContactSection initialData={contactData} />

      {faqItems.length > 0 && (
        <div className="container px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-16">
          <FaqSection items={faqItems} locale={locale as "az" | "ru"} />
        </div>
      )}
    </main>
  );
}
