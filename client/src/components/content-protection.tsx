"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ContentProtection() {
  const pathname = usePathname();

  useEffect(() => {
    const isDashboard = pathname?.startsWith("/dashboard");
    if (isDashboard) return;

    const handleContextMenu = (e: MouseEvent) => {
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
