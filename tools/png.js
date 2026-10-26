// PNG encoder (Node) — used for offline QA captures and generated art.
import zlib from 'node:zlib';
import fs from 'node:fs';

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/**
 * Encode raw pixels to PNG.
 * @param {Uint8Array|Uint8ClampedArray} pixels RGBA or RGB data
 * @param {number} w width
 * @param {number} h height
 * @param {object} [opts] { channels: 4 }
 */
export function encodePNG(pixels, w, h, opts = {}) {
  const channels = opts.channels || 4;
  const stride = w * channels;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    const src = y * stride;
    for (let x = 0; x < stride; x++) raw[y * (stride + 1) + 1 + x] = pixels[src + x];
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = channels === 4 ? 6 : channels === 3 ? 2 : 0;
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

export function writePNG(file, pixels, w, h, opts = {}) {
  fs.mkdirSync(file.split('/').slice(0, -1).join('/') || '.', { recursive: true });
  fs.writeFileSync(file, encodePNG(pixels, w, h, opts));
}

/** Simple RGBA canvas with drawing helpers for generated art / debug overlays. */
export class Canvas {
  constructor(w, h, fill = [0, 0, 0, 255]) {
    this.w = w; this.h = h;
    this.data = new Uint8Array(w * h * 4);
    if (fill) this.clear(fill);
  }
  clear([r, g, b, a = 255]) {
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = r; this.data[i + 1] = g; this.data[i + 2] = b; this.data[i + 3] = a;
    }
  }
  set(x, y, [r, g, b, a = 255]) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    if (a >= 255) { this.data[i] = r; this.data[i + 1] = g; this.data[i + 2] = b; this.data[i + 3] = 255; return; }
    const t = a / 255, u = 1 - t;
    this.data[i] = this.data[i] * u + r * t;
    this.data[i + 1] = this.data[i + 1] * u + g * t;
    this.data[i + 2] = this.data[i + 2] * u + b * t;
    this.data[i + 3] = Math.max(this.data[i + 3], a);
  }
  blend(x, y, [r, g, b], alpha) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.data[i] = this.data[i] * (1 - alpha) + r * alpha;
    this.data[i + 1] = this.data[i + 1] * (1 - alpha) + g * alpha;
    this.data[i + 2] = this.data[i + 2] * (1 - alpha) + b * alpha;
    this.data[i + 3] = 255;
  }
  rect(x, y, w, h, color, alpha = 1) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.blend(x + i, y + j, color, alpha);
  }
  line(x0, y0, x1, y1, color, alpha = 1, width = 1) {
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy, x = x0, y = y0;
    let guard = 0;
    while (guard++ < 100000) {
      for (let ox = 0; ox < width; ox++) for (let oy = 0; oy < width; oy++) this.blend(x + ox, y + oy, color, alpha);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }
  toPNG() { return encodePNG(this.data, this.w, this.h); }
  write(file) { writePNG(file, this.data, this.w, this.h); }
}
