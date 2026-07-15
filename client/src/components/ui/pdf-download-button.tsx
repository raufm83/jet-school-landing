"use client"
import { useRef, useState } from "react";
import { FaFilePdf } from "react-icons/fa";

const CONTENT_WIDTH_PX = 800;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PDF_MARGIN_MM = 15;
const CONTENT_PADDING_PX = 40;
const SITE_LINK = "www.jetschool.az";
/** html2canvas: böyük scale + PNG = çox MB; PDF-də kifayət qədər itkisiz JPEG */
const PDF_CANVAS_SCALE_CAP = 1.75;
const JPEG_QUALITY = 0.82;
const WATERMARK_MAX_WIDTH_PX = 480;
const WATERMARK_CANDIDATES = [
  "/logos/JET_School_Yellowww.webp",
  "/logos/JET_School_Yellowww.png",
  "/background.png",
];

const PAGE_HEIGHT_PX = Math.floor((A4_HEIGHT_MM * CONTENT_WIDTH_PX) / A4_WIDTH_MM);

interface PdfDownloadButtonProps {
  title: string;
  description: string;
  buttonText?: string;
  loadingText?: string;
  fileName?: string;
  /** Admin paneldən (/contact) — PDF alt sol küncdə göstərilir */
  contactPhone?: string;
}

export default function PdfDownloadButton({
  title,
  description,
  buttonText = "Download in PDF",
  loadingText = "Loading...",
  fileName,
  contactPhone = "",
}: PdfDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const finalFileName = fileName || title.replace(/\s+/g, "-");
  const phoneTrim = typeof contactPhone === "string" ? contactPhone.trim() : "";

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  /** Böyük PNG/loqo yaddaşda və PDF-də faylı şişirir — su nişanı üçün kiçildilmiş raster */
  function downscaleImageToCanvas(
    img: HTMLImageElement,
    maxWidth: number
  ): HTMLCanvasElement {
    const iw = img.naturalWidth || img.width || maxWidth;
    const ih = img.naturalHeight || img.height || 1;
    const ratio = iw ? ih / iw : 1;
    const w = iw > maxWidth ? maxWidth : iw;
    const h = Math.max(1, Math.round(w * ratio));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const cx = c.getContext("2d");
    if (cx) {
      cx.imageSmoothingEnabled = true;
      cx.imageSmoothingQuality = "medium";
      cx.drawImage(img, 0, 0, w, h);
    }
    return c;
  }

  const handleDownload = async () => {
    setIsGenerating(true);
    const modifiedElements: { el: HTMLElement; originalMargin: string }[] = [];

    try {
      const jsPDF = (await import("jspdf")).default;
      const html2canvas = (await import("html2canvas")).default;
      
      // Wait for React to render the hidden print div
      await new Promise((resolve) => setTimeout(resolve, 100));

      const element = printRef.current;
      if (!element) return;

      const contentDiv = element.querySelector(".pdf-render-content");
      if (contentDiv) {
        const containerRect = element.getBoundingClientRect();
        const blocks = Array.from(contentDiv.children) as HTMLElement[];
        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i];
          const rect = block.getBoundingClientRect();
          const relTop = rect.top - containerRect.top;
          const relBottom = rect.bottom - containerRect.top;
          const startPage = Math.floor(relTop / PAGE_HEIGHT_PX);
          const endPage = Math.floor((relBottom - 1) / PAGE_HEIGHT_PX);
          if (startPage < endPage) {
            let pushTarget: HTMLElement = block;
            let pushIndex = i;
            while (pushIndex > 0) {
              const prev = blocks[pushIndex - 1];
              const prevTop = prev.getBoundingClientRect().top - containerRect.top;
              if (Math.floor(prevTop / PAGE_HEIGHT_PX) !== startPage) break;
              if (/^H[1-6]$/.test(prev.tagName)) {
                pushTarget = prev;
                pushIndex--;
              } else break;
            }
            const nextPageTop = (startPage + 1) * PAGE_HEIGHT_PX;
            const targetTop = pushTarget.getBoundingClientRect().top - containerRect.top;
            const pushDown = nextPageTop - targetTop + 20;
            if (!modifiedElements.some((e) => e.el === pushTarget)) {
              modifiedElements.push({
                el: pushTarget,
                originalMargin: pushTarget.style.marginTop,
              });
            }
            pushTarget.style.marginTop = `${pushDown}px`;
          }
        }

        const footer = element.querySelector(".pdf-render-footer") as HTMLElement | null;
        if (footer) {
          const rect = footer.getBoundingClientRect();
          const relTop = rect.top - containerRect.top;
          const relBottom = rect.bottom - containerRect.top;
          const startPage = Math.floor(relTop / PAGE_HEIGHT_PX);
          const endPage = Math.floor((relBottom - 1) / PAGE_HEIGHT_PX);
          if (startPage < endPage) {
            const nextPageTop = (startPage + 1) * PAGE_HEIGHT_PX;
            const pushDown = nextPageTop - relTop + 20;
            modifiedElements.push({
              el: footer,
              originalMargin: footer.style.marginTop,
            });
            footer.style.marginTop = `${pushDown}px`;
          }
        }
      }

      const scale = Math.min(
        PDF_CANVAS_SCALE_CAP,
        Math.max(1, window.devicePixelRatio || 1)
      );
      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      });

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const contentWidthMm = pdfWidth - 2 * PDF_MARGIN_MM;
      const pageHeightPx = Math.floor((A4_HEIGHT_MM * imgWidth) / A4_WIDTH_MM);

      let watermarkSource: HTMLCanvasElement | HTMLImageElement | null = null;
      for (const src of WATERMARK_CANDIDATES) {
        try {
          const wm = await loadImage(src);
          watermarkSource = downscaleImageToCanvas(wm, WATERMARK_MAX_WIDTH_PX);
          break;
        } catch {
          // next candidate
        }
      }

      for (let y = 0, pageIndex = 0; y < imgHeight; y += pageHeightPx, pageIndex++) {
        const contentH = Math.min(pageHeightPx, imgHeight - y);

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = imgWidth;
        pageCanvas.height = pageHeightPx;
        const ctx = pageCanvas.getContext("2d");
        if (!ctx) continue;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, imgWidth, pageHeightPx);
        ctx.drawImage(canvas, 0, y, imgWidth, contentH, 0, 0, imgWidth, contentH);

        if (watermarkSource) {
          ctx.save();
          ctx.globalAlpha = 0.08;
          const sw = watermarkSource.width;
          const sh = watermarkSource.height;
          const w = Math.min(imgWidth * 0.55, sw);
          const aspect = sw ? sh / sw : 1;
          const wmY = contentH / 2 - (w * aspect) / 2;
          ctx.drawImage(watermarkSource, (imgWidth - w) / 2, wmY, w, w * aspect);
          ctx.restore();
        }

        const pageData = pageCanvas.toDataURL("image/jpeg", JPEG_QUALITY);
        if (pageIndex > 0) pdf.addPage();
        const sliceHeightMm = (pageHeightPx * contentWidthMm) / imgWidth;
        pdf.addImage(
          pageData,
          "JPEG",
          PDF_MARGIN_MM,
          PDF_MARGIN_MM,
          contentWidthMm,
          sliceHeightMm
        );
      }

      pdf.save(`${finalFileName}.pdf`);
    } catch (error) {
      console.error("Error creating PDF:", error);
    } finally {
      modifiedElements.forEach(({ el, originalMargin }) => {
        el.style.marginTop = originalMargin;
      });
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className="bg-[#F40F02] hover:bg-[#D00D02] disabled:bg-gray-400 text-white flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 w-fit"
      >
        <FaFilePdf className="w-5 h-5" />
        <span className="font-medium">{isGenerating ? loadingText : buttonText}</span>
      </button>

      {isGenerating && (
        <div style={{ position: "absolute", left: "-9999px", top: 0, width: CONTENT_WIDTH_PX }}>
          <div
            ref={printRef}
            style={{
              width: `${CONTENT_WIDTH_PX}px`,
              padding: `${CONTENT_PADDING_PX}px`,
              boxSizing: "border-box",
              background: "white",
              color: "#1a202c",
              fontFamily: "inherit",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "15px",
                marginBottom: "30px",
                position: "relative",
                zIndex: 2,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="JET School"
                src="/logos/JET_School_Yellowww.webp"
                width={200}
                height={48}
                style={{
                  width: "140px",
                  height: "auto",
                  maxHeight: "44px",
                  objectFit: "contain",
                  display: "block",
                }}
                onError={(e) => {
                  const t = e.currentTarget;
                  if (t.src.endsWith(".webp")) {
                    t.src = "/logos/JET_School_Yellowww.png";
                  }
                }}
              />
              <span
                style={{
                  fontFamily: "inherit",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#64748b",
                }}
              >
                {SITE_LINK}
              </span>
            </div>

            <div style={{ position: "relative", zIndex: 1 }}>
              <h1
                style={{
                  fontSize: "38px",
                  fontWeight: "800",
                  marginBottom: "25px",
                  color: "#0f172a",
                  lineHeight: "1.2",
                }}
              >
                {title}
              </h1>

              <div
                className="pdf-render-content"
                style={{
                  fontSize: "17px",
                  lineHeight: "1.8",
                  color: "#334155",
                  textAlign: "justify",
                }}
                dangerouslySetInnerHTML={{ __html: description }}
              />

              <div
                className="pdf-render-footer"
                style={{
                  borderTop: "1px solid #e2e8f0",
                  marginTop: "28px",
                  paddingTop: "14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "24px",
                  color: "#64748b",
                  fontFamily: "inherit",
                  fontSize: "15px",
                  fontWeight: 500,
                  pageBreakInside: "avoid",
                }}
              >
                <span>{phoneTrim}</span>
                <span>{SITE_LINK}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .pdf-render-content h1,
        .pdf-render-content h2,
        .pdf-render-content h3,
        .pdf-render-content h4,
        .pdf-render-content h5,
        .pdf-render-content h6 {
          page-break-after: avoid;
          page-break-inside: avoid;
        }
        .pdf-render-content h2 {
          font-size: 26px !important;
          font-weight: 700 !important;
          margin-top: 30px !important;
          margin-bottom: 15px !important;
          color: #1e293b !important;
          display: block !important;
        }
        .pdf-render-content p {
          margin-bottom: 20px !important;
          display: block !important;
          page-break-inside: avoid;
        }
        .pdf-render-content p:last-child {
          margin-bottom: 0 !important;
        }
        .pdf-render-content strong {
          font-weight: 700 !important;
          color: #000 !important;
        }
      `}</style>
    </>
  );
}