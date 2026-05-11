"use client";

import { lazy, Suspense, useEffect, useState } from "react";

const HeroConsult = lazy(() => import("./hero-consult"));

const placeholder = (
  <div
    aria-hidden
    className="mx-auto h-12 min-w-[200px] max-w-xs rounded-full bg-green-500/10 md:mx-0"
  />
);

/**
 * Konsultasiya düyməsinin chunk-ı LCP/hero şəkli ilə yarışmasın deyə idle-dan sonra yüklənir.
 */
export default function HeroConsultDeferred() {
  const [load, setLoad] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const reveal = () => {
      if (!cancelled) setLoad(true);
    };

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(reveal, { timeout: 1800 });
      return () => {
        cancelled = true;
        cancelIdleCallback(id);
      };
    }

    const t = window.setTimeout(reveal, 700);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  if (!load) return placeholder;

  return (
    <Suspense fallback={placeholder}>
      <HeroConsult />
    </Suspense>
  );
}
