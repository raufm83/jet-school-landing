"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ScrollItems = dynamic(() => import("@/components/shared/scroll-items"), {
  ssr: false,
});

/**
 * WhatsApp / scroll-to-top yüklənməsini LCP-dən sonra saxlayır — mobil TBT və şəbəkə yarışını azaldır.
 */
export default function DeferredScrollItems() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const reveal = () => {
      if (!cancelled) setShow(true);
    };

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(reveal, { timeout: 2200 });
      return () => {
        cancelled = true;
        cancelIdleCallback(id);
      };
    }

    const t = window.setTimeout(reveal, 1600);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  return show ? <ScrollItems /> : null;
}
