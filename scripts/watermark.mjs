import sharp from "sharp";
import { readFileSync, renameSync } from "fs";
import path from "path";

const TEXT = "avtoqoida.uz";
const FONT_RATIO = 0.045;   // shrift balandligi = rasm enining 4.5%
const OPACITY = 0.6;        // matn shaffofligi (0..1)
const MARGIN_RATIO = 0.03;  // burchakdan chekinish

// "avtoqoida.uz" matnini rasmga (pastki-o'ng burchak) qo'yadi
export async function watermark(inputPath, outputPath) {
  const meta = await sharp(inputPath).metadata();
  const W = meta.width, H = meta.height;

  const fontSize = Math.max(12, Math.round(W * FONT_RATIO));
  const margin = Math.round(W * MARGIN_RATIO);
  const x = W - margin;
  const y = H - margin;

  // Har xil fonda ko'rinishi uchun: oq matn + qora kontur (stroke)
  const svg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <text x="${x}" y="${y}" text-anchor="end"
        font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}"
        font-weight="700" fill="#ffffff" fill-opacity="${OPACITY}"
        stroke="#000000" stroke-opacity="${OPACITY * 0.6}" stroke-width="${Math.max(1, fontSize * 0.04)}"
        paint-order="stroke">${TEXT}</text>
    </svg>`
  );

  let pipeline = sharp(inputPath).composite([{ input: svg, top: 0, left: 0 }]);
  const ext = path.extname(inputPath).toLowerCase();
  if (ext === ".webp") pipeline = pipeline.webp({ quality: 90 });
  else if (ext === ".jpg" || ext === ".jpeg") pipeline = pipeline.jpeg({ quality: 90 });
  else pipeline = pipeline.png();

  await pipeline.toFile(outputPath);
}

// CLI: node scripts/watermark.mjs <list-file> [--outdir DIR]
if (import.meta.url === `file://${process.argv[1]}`) {
  const listFile = process.argv[2];
  const outIdx = process.argv.indexOf("--outdir");
  const outDir = outIdx > -1 ? process.argv[outIdx + 1] : null;

  const files = readFileSync(listFile, "utf8").split("\n").map(s => s.trim()).filter(Boolean);
  let done = 0, failed = 0;
  for (const f of files) {
    try {
      const out = outDir ? path.join(outDir, path.basename(f)) : f + ".tmp";
      await watermark(f, out);
      if (!outDir) renameSync(out, f);
      done++;
      if (done % 50 === 0) console.log(`  ${done}/${files.length}...`);
    } catch (e) {
      failed++;
      console.error("XATO:", f, e.message);
    }
  }
  console.log(`Tayyor: ${done} ta, xato: ${failed} ta`);
}
