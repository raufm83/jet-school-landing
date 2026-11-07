"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ContentProtection() {
  const pathname = usePathname();

  useEffect(() => {
    const isDashboard = pathname?.startsWith("/dashboard");
    if (isDashboard) return;

    /** Yazı sahələrində (axtarış, forma) kopyala/yapışdır və sağ klik işləsin */
    const isEditable = (target: EventTarget | null) =>
      target instanceof Element &&
      !!target.closest(
        'input, textarea, select, [contenteditable=""], [contenteditable="true"]'
      );

    const handleContextMenu = (e: MouseEvent) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F12") e.preventDefault();
      if (
        e.ctrlKey &&
        (e.shiftKey || e.key === "u") &&
        ["J", "C", "u"].includes(e.key)
      ) {
        e.preventDefault();
      }
      if (e.ctrlKey && e.key === "s") e.preventDefault();
    };

    const handleClipboard = (e: ClipboardEvent) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", handleClipboard);
    document.addEventListener("cut", handleClipboard);
    document.addEventListener("paste", handleClipboard);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", handleClipboard);
      document.removeEventListener("cut", handleClipboard);
      document.removeEventListener("paste", handleClipboard);
    };
  }, [pathname]);

  return null;
}
