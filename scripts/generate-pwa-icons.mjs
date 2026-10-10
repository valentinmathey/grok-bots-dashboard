import { deflateSync } from "node:zlib";
import { createWriteStream } from "node:fs";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const ACCENT = [15, 118, 110, 255];
const INK = [255, 255, 255, 255];

function crc32(buf) {
  let crc = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j += 1) {
      const bit = crc & 1;
      crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4);
  data.copy(out, 8);
  const crc = crc32(out.subarray(4, 8 + data.length));
  out.writeUInt32BE(crc, 8 + data.length);
  return out;
}

function encodePng(width, height, pixel) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = pixel(x, y);
      const i = row + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const parts = [
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ];
  return Buffer.concat(parts);
}

function inRoundRect(x, y, size, inset, radius) {
  const left = inset;
  const top = inset;
  const right = size - inset - 1;
  const bottom = size - inset - 1;
  if (x < left || x > right || y < top || y > bottom) return false;
  const lx = x - left;
  const ly = y - top;
  const rx = right - x;
  const ry = bottom - y;
  if (lx >= radius && rx >= radius) return true;
  if (ly >= radius && ry >= radius) return true;
  const cx = lx < radius ? radius : rx < radius ? radius : 0;
  const cy = ly < radius ? radius : ry < radius ? radius : 0;
  const dx = (lx < radius ? radius - lx : rx < radius ? radius - rx : 0) - 0.5;
  const dy = (ly < radius ? radius - ly : ry < radius ? radius - ry : 0) - 0.5;
  return dx * dx + dy * dy <= (radius + 0.2) * (radius + 0.2) || cx === 0 || cy === 0;
}

function inLetterG(nx, ny) {
  const stroke = 0.13;
  const left = 0.28;
  const right = 0.72;
  const top = 0.24;
  const bottom = 0.76;
  const midY = 0.52;
  const barLeft = 0.46;
  if (nx < left || nx > right || ny < top || ny > bottom) return false;
  const onTop = ny <= top + stroke;
  const onBottom = ny >= bottom - stroke;
  const onLeft = nx <= left + stroke;
  const onRight = nx >= right - stroke && ny >= midY - stroke * 0.4;
  const onBar = ny >= midY - stroke * 0.45 && ny <= midY + stroke * 0.45 && nx >= barLeft;
  return onTop || onBottom || onLeft || onRight || onBar;
}

function makeIcon(size, { maskable = false } = {}) {
  const inset = maskable ? Math.round(size * 0.12) : Math.round(size * 0.08);
  const radius = Math.round(size * (maskable ? 0.28 : 0.22));
  return encodePng(size, size, (x, y) => {
    const nx = (x + 0.5) / size;
    const ny = (y + 0.5) / size;
    if (maskable) {
      if (inLetterG(nx, ny)) return INK;
      return ACCENT;
    }
    if (inLetterG(nx, ny) && inRoundRect(x, y, size, inset, radius)) return INK;
    if (inRoundRect(x, y, size, inset, radius)) return ACCENT;
    return [0, 0, 0, 0];
  });
}

const files = {
  "public/icons/icon-192.png": makeIcon(192),
  "public/icons/icon-512.png": makeIcon(512),
  "public/icons/icon-512-maskable.png": makeIcon(512, { maskable: true }),
  "public/icons/apple-touch-icon.png": makeIcon(180),
  "public/favicon.png": makeIcon(48),
};

for (const [path, buf] of Object.entries(files)) {
  mkdirSync(dirname(join(process.cwd(), path)), { recursive: true });
  const stream = createWriteStream(path);
  stream.end(buf);
  console.log(path, buf.length);
}
