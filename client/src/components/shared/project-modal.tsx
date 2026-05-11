"use client";
import { useProjectModal } from "@/hooks/useProjectModal";
import React from "react";
import { MdClose } from "react-icons/md";
import Button from "../ui/button";

export default function ProjectModal() {
  const { isOpen, toggle, link } = useProjectModal();

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    const videoId = url.match(/(?:\/|v=)([a-zA-Z0-9_-]{11})(?:\?|&|$)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex min-h-[100dvh] min-h-[100svh] items-center justify-center bg-jsblack/40 p-3 sm:p-4">
      <div className="my-auto flex max-h-[min(92vh,900px)] w-full max-w-[800px] flex-col gap-2 overflow-y-auto rounded-2xl bg-white p-4 shadow-xl md:gap-4 md:p-5">
        <div className="flex items-center justify-end">
          <Button
            variant="primary"
            className="px-3 md:px-3"
            icon={<MdClose className="text-base md:text-xl" />}
            onClick={() => toggle()}
          />
        </div>

        {link && (
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={getEmbedUrl(link)}
              title="Video"
              loading="lazy"
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>
    </div>
  );
}
