"use client";

import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

interface Props {
  open: boolean;
  index: number;
  slides: { src: string; alt: string }[];
  onClose: () => void;
}

export default function GalleryLightbox({ open, index, slides, onClose }: Props) {
  return (
    <Lightbox
      open={open}
      plugins={[Thumbnails]}
      index={index}
      close={onClose}
      slides={slides}
    />
  );
}
