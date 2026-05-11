"use client";

import { useEffect, useMemo, useRef } from "react";

function activateDeferredIframe(iframe: HTMLIFrameElement) {
  const enc = iframe.getAttribute("data-deferred-src");
  if (!enc) return;
  try {
    iframe.setAttribute("src", decodeURIComponent(enc));
  } catch {
    iframe.setAttribute("src", enc);
  }
}

function cleanWysiwygHtml(raw: string): string {
  if (raw == null || typeof raw !== "string") return "";
  let s = raw;
  for (let i = 0; i < 10; i += 1) {
    const next = s
      .replace(/<p[^>]*>\s*<br\s*\/?>\s*<\/p>/gi, "")
      .replace(
        /<p[^>]*>\s*(?:&nbsp;|&#160;|\s)+<\/p>/gi,
        "",
      )
      .replace(/<p[^>]*>\s*<\/p>/gi, "");
    if (next === s) break;
    s = next;
  }
  return s
    .replace(/(<br\s*\/?>){3,}/gi, "<br><br>")
    .replace(/(<\/p>\s*){2,}/gi, "</p>")
    .replace(/<p[^>]*>\s*(<br\s*\/?>)+\s*<\/p>/gi, "");
}

export default function LazyHtmlContent({
  html,
  className,
  skipClean = false,
}: {
  html: string;
  className?: string;
  skipClean?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cleanHtml = useMemo(() => {
    const raw =
      typeof html === "string"
        ? html
        : html == null
          ? ""
          : String(html);
    return skipClean ? raw : cleanWysiwygHtml(raw);
  }, [html, skipClean]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const iframes = root.querySelectorAll<HTMLIFrameElement>(
      "iframe[data-deferred-src]",
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLIFrameElement;
          if (el.getAttribute("src") === "about:blank") {
            activateDeferredIframe(el);
          }
          observer.unobserve(el);
        });
      },
      { rootMargin: "240px 0px", threshold: 0 },
    );

    iframes.forEach((iframe) => {
      if (iframe.getAttribute("src") === "about:blank") {
        observer.observe(iframe);
      }
    });

    return () => observer.disconnect();
  }, [cleanHtml]);

  return (
    <div
      ref={ref}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
      className={className}
    />
  );
}
