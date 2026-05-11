"use client";
import { useEffect } from "react";
import { useBreadcrumbStore } from "@/stores/useBreadcrumbStore";

interface GlossaryBreadcrumbSetterProps {
  categoryName: string | null;
  categorySlug: string | null;
  termTitle: string;
}

export default function GlossaryBreadcrumbSetter({
  categoryName,
  categorySlug,
  termTitle,
}: GlossaryBreadcrumbSetterProps) {
  const setTitle = useBreadcrumbStore((s) => s.setTitle);
  const setCategoryName = useBreadcrumbStore((s) => s.setCategoryName);
  const setCategorySlug = useBreadcrumbStore((s) => s.setCategorySlug);
  const clear = useBreadcrumbStore((s) => s.clear);

  useEffect(() => {
    if (termTitle) {
      setTitle(termTitle);
    }
    if (categoryName) {
      setCategoryName(categoryName);
    }
    if (categorySlug) {
      setCategorySlug(categorySlug);
    }
    return () => {
      clear();
    };
  }, [termTitle, categoryName, categorySlug, setTitle, setCategoryName, setCategorySlug, clear]);

  return null;
}
