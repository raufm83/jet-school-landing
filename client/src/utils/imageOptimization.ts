export interface OptimizeImageOptions {
  /** Max uzun tərəf (px) – default 1024 */
  maxDimension?: number;
  /** Başlanğıc keyfiyyət (0–1) – default 0.8 */
  quality?: number;
  /** Maksimum fayl ölçüsü (bayt) – default 2MB */
  maxSizeBytes?: number;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas blob yaradılmadı"));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

function changeExtension(name: string, newExt: string): string {
  const withoutQuery = name.split("?")[0].split("#")[0];
  const lastDot = withoutQuery.lastIndexOf(".");
  const base = lastDot === -1 ? withoutQuery : withoutQuery.slice(0, lastDot);
  return `${base}.${newExt}`;
}

/**
 * Browser-də client-side şəkil optimizasiyası:
 * - Uzun tərəf maksimum `maxDimension` (default 1024)
 * - WebP formatı
 * - Keyfiyyət ~80% (zərurət olarsa avtomatik aşağı salınır)
 * - Maksimum fayl ölçüsü `maxSizeBytes` (default 2MB)
 */
/** Bir dəfə WebP dəstəyini yoxlayır; dəstəklənirsə "image/webp", yoxsa "image/jpeg" qaytarır */
async function detectOutputFormat(): Promise<"image/webp" | "image/jpeg"> {
  return new Promise((resolve) => {
    const probe = document.createElement("canvas");
    probe.width = 1;
    probe.height = 1;
    probe.toBlob(
      (blob) => resolve(blob?.type === "image/webp" ? "image/webp" : "image/jpeg"),
      "image/webp"
    );
  });
}

export async function optimizeImageFile(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<File> {
  const {
    maxDimension = 1024,
    quality = 0.8,
    maxSizeBytes = 2 * 1024 * 1024,
  } = options;

  if (typeof window === "undefined") {
    return file;
  }

  if (!file.type.startsWith("image/")) {
    return file;
  }

  try {
    // Brauzerin dəstəklədiyini formatı tap (Safari <17 WebP encode etmir)
    const mimeType = await detectOutputFormat();
    const ext = mimeType === "image/jpeg" ? "jpg" : "webp";

    const dataUrl = await readFileAsDataURL(file);
    const img = await loadImage(dataUrl);

    const { width, height } = img;
    let targetWidth = width;
    let targetHeight = height;

    if (width > height && width > maxDimension) {
      const ratio = maxDimension / width;
      targetWidth = maxDimension;
      targetHeight = Math.round(height * ratio);
    } else if (height >= width && height > maxDimension) {
      const ratio = maxDimension / height;
      targetHeight = maxDimension;
      targetWidth = Math.round(width * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    let currentQuality = quality;
    let blob = await canvasToBlob(canvas, mimeType, currentQuality);

    // Keyfiyyəti tədricən 0.1-ə qədər azaldırıq
    while (blob.size > maxSizeBytes && currentQuality > 0.1) {
      currentQuality = Math.max(0.1, currentQuality - 0.1);
      blob = await canvasToBlob(canvas, mimeType, currentQuality);
    }

    // Hələ də böyükdürsə: ölçünü azaldıb yenidən cəhd edirik
    if (blob.size > maxSizeBytes) {
      const scaleFactor = Math.sqrt(maxSizeBytes / blob.size);
      const reducedW = Math.max(1, Math.round(targetWidth * scaleFactor));
      const reducedH = Math.max(1, Math.round(targetHeight * scaleFactor));
      const canvas2 = document.createElement("canvas");
      canvas2.width = reducedW;
      canvas2.height = reducedH;
      const ctx2 = canvas2.getContext("2d");
      if (ctx2) {
        ctx2.drawImage(img, 0, 0, reducedW, reducedH);
        blob = await canvasToBlob(canvas2, mimeType, 0.8);
      }
    }

    return new File([blob], changeExtension(file.name, ext), { type: mimeType });
  } catch {
    return file;
  }
}

