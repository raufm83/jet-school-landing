import { Suspense } from "react";
import HeaderWrapper from "@/components/layout/header/header-wrapper";
import Footer from "@/components/layout/footer";
import TopCircle from "@/components/shared/top-circle";
import DeferredScrollItems from "@/components/shared/deferred-scroll-items";
import OrgSchemaLoader from "@/components/seo/org-schema-loader";
import OrgSchemaConditional from "@/components/seo/org-schema-conditional";
import SchemaBreadcrumbs from "@/components/seo/schema-breadcrumbs";
import GlobalSchemaRenderer from "@/components/seo/global-schema-renderer";
import { setRequestLocale } from "next-intl/server";

export default async function SiteLayout({
  params: { locale },
  children,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(locale);

  return (
    <div className="relative flex min-h-screen w-full min-w-0 max-w-full flex-col items-stretch">
      {/* TopCircle-i ayrıca clip konteynerə al — overflow-x:clip sticky-ni qırır */}
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-x-clip"
        aria-hidden="true"
      >
        <TopCircle />

      </div>
      
      <div className="relative z-10 flex min-h-0 min-w-0 w-full flex-1 flex-col">
        <DeferredScrollItems />
        <Suspense fallback={null}>
          <HeaderWrapper />
        </Suspense>
        <OrgSchemaConditional>
          <Suspense fallback={null}>
            <OrgSchemaLoader locale={locale} />
          </Suspense>
        </OrgSchemaConditional>
        <SchemaBreadcrumbs />
        <GlobalSchemaRenderer />
        <main className="flex min-h-0 min-w-0 w-full flex-1 flex-col">
          {children}
        </main>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </div>
    </div>
  );
}
