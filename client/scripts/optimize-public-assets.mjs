/**
 * Mövcud böyük PNG/JPG faylları WebP-ə çevirib ağır disklə yükü azaldır.
 * `sharp` artıq package.json dependencies-də var.
 * İstinad: client/public/ altında mənbə fayllar build zamanı yoxdursa, xəbərdarlıq verilir, build davam edir.
 */
import fs from "node:fs";
import pathMod from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = pathMod.dirname(fileURLToPath(import.meta.url));
const publicDir = pathMod.join(__dirname, "..", "public");

async function toWebp({
  from,
  to,
  maxWidth = 1200,
  quality = 78,
}) {
  const inPath = pathMod.join(publicDir, from);
  if (!fs.existsSync(inPath)) {
    console.warn(
      `[optimize-public-assets] Mənbə yoxdu, keçirik: ${from}`,
    );
    return false;
  }
  const outPath = pathMod.join(publicDir, to);
  const outDir = pathMod.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const meta = await sharp(inPath).metadata();
  const width = meta.width
    ? Math.min(meta.width, maxWidth)
    : maxWidth;
  await sharp(inPath)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toFile(outPath);
  const st = fs.statSync(inPath);
  const dt = fs.statSync(outPath);
  console.log(
    `[optimize-public-assets] ${from} → ${to}  (${(st.size / 1024).toFixed(0)} kB → ${(dt.size / 1024).toFixed(0)} kB)`,
  );
  return true;
}

async function main() {
  // Haqqımızda: intro / missiya şəkilləri
  await toWebp({
    from: "rasim.png",
    to: "images/about/intro.webp",
    maxWidth: 1000,
    quality: 80,
  });
  await toWebp({
    from: "qiz1x1.jpg",
    to: "images/about/mission-vision.webp",
    maxWidth: 1000,
    quality: 80,
  });
  // Header loqosu
  await toWebp({
    from: "logos/JET_School_Yellowww.png",
    to: "logos/JET_School_Yellowww.webp",
    maxWidth: 800,
    quality: 86,
  });
}

main().catch((e) => {
  console.error("[optimize-public-assets]", e);
  process.exit(1);
});
