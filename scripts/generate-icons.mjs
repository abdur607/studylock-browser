import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const crc32table = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crc32table[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = crc32table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(data.length);
  const c = Buffer.allocUnsafe(4);
  c.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, c]);
}

function encodePNG(size, pixels) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.allocUnsafe(1 + size * 3);
    row[0] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixels[y * size + x];
      row[1 + x * 3] = r;
      row[2 + x * 3] = g;
      row[3 + x * 3] = b;
    }
    rows.push(row);
  }
  const compressed = deflateSync(Buffer.concat(rows));
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", compressed), chunk("IEND", Buffer.alloc(0))]);
}

const BG = [31, 111, 99];
const FG = [255, 255, 255];

function set(pixels, size, x, y, color) {
  if (x >= 0 && x < size && y >= 0 && y < size) pixels[y * size + x] = color;
}

function rect(pixels, size, x1, y1, x2, y2, color) {
  for (let y = y1; y < y2; y++) for (let x = x1; x < x2; x++) set(pixels, size, x, y, color);
}

function circle(pixels, size, cx, cy, r, color) {
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) set(pixels, size, x, y, color);
}

function makeLockIcon(size) {
  const pixels = Array.from({ length: size * size }, () => [...BG]);

  const p = (f) => Math.round(f * size);

  // Lock body
  rect(pixels, size, p(0.22), p(0.44), p(0.78), p(0.88), FG);

  // Shackle left bar
  const sl = p(0.32), sr = p(0.68), st = p(0.12), sb = p(0.52);
  const th = Math.max(1, p(0.08));
  rect(pixels, size, sl, st, sl + th, sb, FG);
  // Shackle right bar
  rect(pixels, size, sr - th, st, sr, sb, FG);
  // Shackle top bar
  rect(pixels, size, sl, st, sr, st + th, FG);

  // Keyhole circle
  circle(pixels, size, p(0.50), p(0.62), Math.max(1, p(0.09)), BG);
  // Keyhole stem
  rect(pixels, size, p(0.46), p(0.62), p(0.54), p(0.76), BG);

  return pixels;
}

mkdirSync("public/icons", { recursive: true });
for (const size of [16, 32, 48, 128]) {
  const pixels = makeLockIcon(size);
  const png = encodePNG(size, pixels);
  writeFileSync(`public/icons/icon${size}.png`, png);
  console.log(`icon${size}.png  ${png.length} bytes`);
}
