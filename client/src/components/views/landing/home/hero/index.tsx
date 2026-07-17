// src/components/views/landing/home/hero.tsx
import { getTranslations } from "next-intl/server";
import { buildImageUrl } from "@/utils/imageUrl";
import { getHomeHero } from "@/utils/api/home-hero";
import { defaultHeroBodyHtml } from "@/utils/hero-default-html";
import { sanitizeHeroHtml } from "@/utils/sanitizeHeroHtml";
import HeroConsultDeferred from "./hero-consult-deferred";
import HeroImage from "./image";
import { Locale } from "@/i18n/request";

type HeroProps = {
  locale: Locale;
};

export default async function Hero({ locale }: HeroProps) {
  const [t, tContact, remote] = await Promise.all([
    getTranslations({ locale, namespace: "hero" }),
    getTranslations({ locale, namespace: "contact" }),
    getHomeHero()
  ]);

  const rawHtml =
    remote?.bodyHtml?.[locale]?.trim() ?? defaultHeroBodyHtml(locale);
  const html = sanitizeHeroHtml(rawHtml);

  const imgSrc = remote?.imageUrl ? buildImageUrl(remote.imageUrl) : "/boy.webp";
  const imgAlt = remote?.imageAlt?.[locale] ?? t("imageAlt");

  return (
    <div
      id="hero"
      className="
        container mx-auto p-0
        flex flex-col lg:flex-row
        items-center justify-center lg:justify-between
        gap-6 lg:gap-8 xl:gap-10 2xl:gap-12
        mt-10
      "
    >
      <div className="order-1 lg:order-2 w-full lg:w-auto lg:flex-shrink-0 flex justify-center">
        <HeroImage src={imgSrc} alt={imgAlt} />
      </div>

      <div
        id="left"
        className="
          order-2 lg:order-1
          w-full max-w-full lg:max-w-[50%] xl:max-w-[52%]
          flex flex-col gap-5 md:gap-6 lg:gap-8
          text-center lg:text-left
          items-center lg:items-start
        "
      >
        <div
          className="
            w-full mx-auto lg:mx-0 lg:max-w-none
            prose prose-lg lg:prose-xl max-w-none text-center lg:text-left
            prose-headings:font-bold prose-headings:text-jsblack
            prose-p:text-[#6B6B6B] prose-p:font-medium
            prose-p:leading-7 md:prose-p:leading-relaxed
            prose-a:text-jsyellow prose-strong:text-jsblack
            [&_span[style*='color']]:!text-[#D97706]
            [@media(min-width:3000px)]:prose-headings:!text-[4.5rem]
            [@media(min-width:3000px)]:prose-p:!text-[35px] [@media(min-width:3000px)]:prose-p:!leading-10
          "
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <h2 className="sr-only">{tContact("form.title")}</h2>

        <HeroConsultDeferred />
      </div>
    </div>
  );
}
