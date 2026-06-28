import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import React from "react";
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { trimMetaTitle, trimMetaDescription, buildHreflangUrl } from "@/utils/seo";
import { SITE_SCHEMA } from "@/data/site-schema";
import HtmlLangSync from "@/components/shared/html-lang-sync";

const ContactModal = dynamic(() => import("@/components/shared/contact-modal"), { ssr: false });
const ProjectModal = dynamic(() => import("@/components/shared/project-modal"), { ssr: false });

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Metadata" });

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://jetschool.az").replace(/\/+$/, "");
  const canonicalUrl = buildHreflangUrl(baseUrl, locale);

  const title = trimMetaTitle(t("title"));
  const description = trimMetaDescription(t("description"));
  const ogTitle = trimMetaTitle(t("ogTitle"));
  const ogDescription = trimMetaDescription(t("ogDescription"));

  return {
    metadataBase: new URL(baseUrl),
    
    title: {
      default: title,
      template: "%s",
    },
    description,
    keywords: t("keywords"),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        az: buildHreflangUrl(baseUrl, "az"),
        ru: buildHreflangUrl(baseUrl, "ru"),
        "x-default": baseUrl,
      },
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonicalUrl,
      siteName: "JET School",
      images: [
        {
          url: SITE_SCHEMA.ogImagePath,
          width: 1200,
          height: 630,
          alt: t("ogImageAlt"),
        },
      ],
      locale: locale === "az" ? "az_AZ" : locale === "ru" ? "ru_RU" : "en_US",
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: [
        { url: SITE_SCHEMA.faviconUrl },
        { url: SITE_SCHEMA.iconUrl, sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: SITE_SCHEMA.iconUrl, sizes: "180x180", type: "image/png" }],
    },
    authors: [{ name: "JET School" }],
    category: "education",
  };
}

export default async function WebsiteLayout({
  params: { locale },
  children,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <HtmlLangSync />
      <ContactModal />
      <ProjectModal />
      {children}
    </NextIntlClientProvider>
  );
}
