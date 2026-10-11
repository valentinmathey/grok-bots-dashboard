import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const BG = "#0d1117";

function icoFromPngs(images) {
  const count = images.length;
  let offset = 6 + 16 * count;
  const header = Buffer.alloc(offset);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  const chunks = [header];
  images.forEach((image, index) => {
    const entry = 6 + index * 16;
    header[entry] = image.size >= 256 ? 0 : image.size;
    header[entry + 1] = image.size >= 256 ? 0 : image.size;
    header[entry + 2] = 0;
    header[entry + 3] = 0;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(image.buffer.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    chunks.push(image.buffer);
    offset += image.buffer.length;
  });
  return Buffer.concat(chunks);
}

async function raster(svgPath, size, { flatten = true } = {}) {
  const svg = await readFile(svgPath);
  let pipeline = sharp(svg, { density: 384 }).resize(size, size, {
    fit: "fill",
  });
  if (flatten) pipeline = pipeline.flatten({ background: BG });
  return pipeline.ensureAlpha().png({ compressionLevel: 9 }).toBuffer();
}

async function writePng(file, buffer) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buffer);
}

const master = path.join(root, "public/icon.svg");
const maskable = path.join(root, "public/icon-maskable.svg");
const faviconSvg = path.join(root, "public/icon-favicon.svg");

await copyFile(master, path.join(root, "app/icon.svg"));

const icon32 = await raster(faviconSvg, 32);
const icon16 = await raster(faviconSvg, 16);
const icon48 = await raster(faviconSvg, 48);
await writePng(path.join(root, "public/favicon.png"), icon32);
await writePng(path.join(root, "app/icon.png"), icon32);
await writePng(path.join(root, "public/icons/icon-192.png"), await raster(master, 192));
await writePng(path.join(root, "public/icons/icon-512.png"), await raster(master, 512));
await writePng(path.join(root, "public/icons/icon-192-maskable.png"), await raster(maskable, 192));
await writePng(path.join(root, "public/icons/icon-512-maskable.png"), await raster(maskable, 512));
await writePng(path.join(root, "public/icons/apple-touch-icon.png"), await raster(master, 180));
await writePng(path.join(root, "app/apple-icon.png"), await raster(master, 180));

const ico = icoFromPngs([
  { size: 16, buffer: icon16 },
  { size: 32, buffer: icon32 },
  { size: 48, buffer: icon48 },
]);
await writeFile(path.join(root, "app/favicon.ico"), ico);
await writeFile(path.join(root, "public/favicon.ico"), ico);

console.log("icons written");
