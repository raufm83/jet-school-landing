"use client";

import { useLocale } from "next-intl";
import { useLayoutEffect } from "react";

/**
 * Client nav (dil dəyişəndə) ilə document.documentElement.lang sinxron qalsın —
 * root layout bir dəfə SSR ilə qurulduğu üçün.
 */
export default function HtmlLangSync() {
  const locale = useLocale();

  useLayoutEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
