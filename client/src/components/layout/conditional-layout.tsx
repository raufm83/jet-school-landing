"use client";

import { usePathname } from "next/navigation";
import React from "react";

interface ConditionalLayoutProps {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  modals: React.ReactNode;
  scrollItems: React.ReactNode;
  topCircle: React.ReactNode;
}

export default function ConditionalLayout({
  children,
  header,
  footer,
  modals,
  scrollItems,
  topCircle,
}: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Robust check for /registration page, handling locales and trailing slashes
  const isRegistrationPage = pathname?.match(/\/registration\/?$/);

  if (isRegistrationPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {scrollItems}
      {header}
      {modals}
      {topCircle}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      {footer}
    </div>
  );
}
