import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import LazyHtmlContent from "@/components/shared/lazy-html-content";
import { deferEmbedsInHtml } from "@/utils/deferEmbedsInHtml";
import ContactFormFloat from "../single-course/contact-form-float";
import PdfDownloadButton from "@/components/ui/pdf-download-button";
import { getContact } from "@/utils/api/contact";

interface GlossaryTermDetailProps {
  term: string;
  definition: string;
  categoryName?: string;
  categorySlug?: string;
  relatedTerms?: {
    id: string;
    term: {
      az: string;
      ru: string;
    };
    slug: {
      az: string;
      ru: string;
    };
  }[];
  categoryText: string;
  relatedTermsText: string;
  language: string; 
}

export default async function GlossaryTermDetail({
  term,
  definition,
  categoryName,
  categorySlug,
  relatedTerms,
  categoryText,
  relatedTermsText,
  language,
}: GlossaryTermDetailProps) {
  const t = await getTranslations("glossary");
  const contact = await getContact();
  const getTitleText = (locale: string) => {
    switch (locale) {
      case "az":
        return `${term} ${t("whats")}`;
      case "ru":
        return `${t("whats")} ${term}?`;
      default:
        break;
    }
  };

  const titleText = getTitleText(language) || term;

  const buttonText = language === "az" ? "PDF formatında yüklə" : "Скачать в PDF";
  const loadingText = language === "az" ? "Hazırlanır..." : "Загрузка...";

  return (
    <div className="flex flex-col gap-6 animate-fadeIn px-10">
      <div className="flex flex-wrap items-center gap-4">
        {categoryName && categorySlug && (
          <Link
            href={{
              pathname: "/glossary/category/[slug]",
              params: { slug: categorySlug },
            }}
          >
            <span className="bg-jsyellow/10 text-jsblack px-4 py-2 rounded-full cursor-pointer underline">
              {`${categoryText}: ${categoryName}`}
            </span>
          </Link>
        )}
      </div>

      <h1 className="
        text-xl font-bold leading-snug text-jsblack sm:text-2xl md:text-3xl
        [@media(min-width:2500px)]:text-4xl 
        [@media(min-width:3500px)]:text-5xl
      ">
        {titleText}
      </h1>

      <div className="mb-4">
        <PdfDownloadButton
          title={titleText}
          description={definition}
          buttonText={buttonText}
          loadingText={loadingText}
          contactPhone={contact.phone}
        />
      </div>

      <div className="
        flex flex-col lg:flex-row gap-6 lg:gap-8
        [@media(min-width:2500px)]:gap-20 
        [@media(min-width:3500px)]:gap-24
      ">
        <LazyHtmlContent
          html={deferEmbedsInHtml(definition)}
          className="
            flex-1 text-gray-600 prose max-w-none 
            prose-headings:text-jsblack prose-li:list-disc prose-li:ml-4
            [@media(min-width:2500px)]:text-2xl
            [@media(min-width:3500px)]:text-3xl
            [@media(min-width:2500px)]:leading-relaxed
            [@media(min-width:3500px)]:leading-loose
          "
        />
        <div className="
          w-full lg:w-[400px]
          [@media(min-width:2500px)]:w-[600px] 
          [@media(min-width:3500px)]:w-[700px]
          lg:flex-shrink-0
        ">
          <ContactFormFloat title="contactFormTitle" />  
        </div>
      </div>

      

      {relatedTerms && relatedTerms.length > 0 && (
        <div className="mt-6">
          <h3 className="
            font-semibold mb-2
            [@media(min-width:2500px)]:text-3xl
            [@media(min-width:3500px)]:text-4xl
          ">
            {relatedTermsText}:
          </h3>
          <div className="flex flex-wrap gap-2">
            {relatedTerms.map((relatedTerm) => (
              <Link
                key={relatedTerm.id}
                href={{
                  pathname: "/glossary/term/[slug]",
                  params: {
                    slug: relatedTerm.slug[language as keyof typeof relatedTerm.slug],
                  },
                }}
              >
                <span className="
                  bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm cursor-pointer
                  [@media(min-width:2500px)]:px-6 [@media(min-width:2500px)]:py-3 [@media(min-width:2500px)]:text-xl
                  [@media(min-width:3500px)]:px-8 [@media(min-width:3500px)]:py-4 [@media(min-width:3500px)]:text-2xl
                  hover:bg-blue-200 transition-colors
                ">
                  {relatedTerm.term[language as keyof typeof relatedTerm.term]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}