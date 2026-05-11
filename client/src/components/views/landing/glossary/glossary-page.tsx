import Link from "next/link";
import GlossaryCategoryList from "./glossary-category-list";

interface GlossaryPageProps {
  categories: any[];
  language: string;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  allTermsText: string;
  categoriesTitle: string;
  termsText: string;
  emptyText: string;
}

export default function GlossaryPage({
  categories,
  language,
  title,
  subtitle,
  allTermsText,
  categoriesTitle,
  termsText,
  emptyText,
}: GlossaryPageProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-3 font-bold text-jsblack text-2xl sm:text-3xl md:text-4xl">
          {title}
        </h1>
        <p className="mx-auto max-w-3xl text-pretty text-sm leading-snug text-jsblack/70 sm:text-base">
          {subtitle}
        </p>
      </div>



      <div className="flex justify-center mb-12">
        <Link href="/glossary/terms">
          <span className="bg-jsyellow text-jsblack px-6 py-3 rounded-full text-base font-medium hover:bg-jsyellow/90 transition-colors duration-300">
            {allTermsText}
          </span>
        </Link>
      </div>

      <GlossaryCategoryList
        categories={categories}
        title={categoriesTitle}
        termsText={termsText}
        language={language}
        emptyText={emptyText}
      />
    </div>
  );
}
