import { setRequestLocale } from "next-intl/server";
import dynamic from "next/dynamic";
import React from "react";

const Breadcrumbs = dynamic(
  () => import("@/components/views/landing/bread-crumbs/bread-crumbs"),
  {
    ssr: false,
    // Reserves space so content below doesn't shift when breadcrumbs render
    loading: () => <div aria-hidden="true" className="h-6" />,
  }
);

export default async function MainLayout({
  params: { locale },
  children,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(locale);

  return (
    <>
      <div className="container pt-4">
        <Breadcrumbs />
      </div>

      {children}
    </>
  );
}
