"use client";
import { ReactNode, useEffect } from "react";
import { useBreadcrumbStore } from "@/stores/useBreadcrumbStore";
import { PostType } from "@/types/enums";

export default function BreadcrumbContextWrapper({
  title,
  postType,
  children,
}: {
  title?: string;
  postType?: PostType;
  children: ReactNode;
}) {
  const setTitle = useBreadcrumbStore((s) => s.setTitle);
  const setPostType = useBreadcrumbStore((s) => s.setPostType);
  useEffect(() => {
    setTitle(title ?? null);
    setPostType(postType ?? null);
    return () => {
      setTitle(null);
      setPostType(null);
    };
  }, [title, postType, setTitle, setPostType]);
  return <>{children}</>;
}
