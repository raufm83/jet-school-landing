import ContactHero from "@/components/views/landing/contact-us/contact-hero";
import ContactSection from "@/components/views/landing/contact-us/contact-section";
import JsonLd from "@/components/seo/json-ld";
import { buildContactPageGraph, SITE_SCHEMA } from "@/data/site-schema";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPageMeta } from "@/utils/api/page-meta";
import { trimMetaTitle, trimMetaDescription, ensureTrailingSlash } from "@/utils/seo";
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az";

  const canonicalUrl = ensureTrailingSlash(`${baseUrl}/${locale}/contact-us`);

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
    url: canonicalUrl,
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
        az: ensureTrailingSlash(`${baseUrl}/az/contact-us`),
        ru: ensureTrailingSlash(`${baseUrl}/ru/contact-us`),
        "x-default": ensureTrailingSlash(`${baseUrl}/az/contact-us`),
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

  const schemaGraph = buildContactPageGraph({
    name: pageTitle,
    description: pageDescription,
    url: contactUrl,
    locale,
    baseUrl,
    breadcrumbItems: [
      { name: homeLabel, url: base },
      { name: contactLabel, url: contactUrl },
    ],
    streetAddress,
    email: contactData.email?.trim(),
    telephone: contactData.phone?.trim(),
    primaryImageUrl: SITE_SCHEMA.image,
  });

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
