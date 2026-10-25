/**
 * Package the production build (docs/) as the release asset
 * GAME_NAME_WEB.zip -> Wick_and_Wane_WEB.zip
 * Everything is read from docs/, so the zip always matches what Pages serves.
 */
import { existsSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { deflateRawSync } from 'node:zlib';

// The downloadable build uses relative asset paths so it also runs from a
// plain folder (file:// or any static host), not only under the Pages subpath.
const SRC = 'artifacts/portable';
const OUT_DIR = 'artifacts';
const OUT = join(OUT_DIR, 'Wick_and_Wane_WEB.zip');

if (!existsSync(SRC)) {
  console.error(`${SRC}/ is missing — run \`npm run build:portable\` first.`);
  process.exit(1);
}

const walk = (dir) => {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out.sort();
};

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

const crc32 = (buf) => {
  let crc = 0xffffffff;
  for (const byte of buf) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

const deflateRaw = (buf) => deflateRawSync(buf, { level: 9 });

const files = walk(SRC);
const localParts = [];
const central = [];
let offset = 0;

for (const file of files) {
  const data = readFileSync(file);
  const name = relative(SRC, file).split('\\').join('/');
  const nameBuf = Buffer.from(name, 'utf8');
  const crc = crc32(data);
  const compressed = deflateRaw(data);
  const useDeflate = compressed.length < data.length;
  const body = useDeflate ? compressed : data;
  const method = useDeflate ? 8 : 0;

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6); // utf-8 names
  local.writeUInt16LE(method, 8);
  local.writeUInt16LE(0, 10);
  local.writeUInt16LE(0, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(body.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  local.writeUInt16LE(0, 28);
  localParts.push(local, nameBuf, body);

  const dirEntry = Buffer.alloc(46);
  dirEntry.writeUInt32LE(0x02014b50, 0);
  dirEntry.writeUInt16LE(20, 4);
  dirEntry.writeUInt16LE(20, 6);
  dirEntry.writeUInt16LE(0x0800, 8);
  dirEntry.writeUInt16LE(method, 10);
  dirEntry.writeUInt16LE(0, 12);
  dirEntry.writeUInt16LE(0, 14);
  dirEntry.writeUInt32LE(crc, 16);
  dirEntry.writeUInt32LE(body.length, 20);
  dirEntry.writeUInt32LE(data.length, 24);
  dirEntry.writeUInt16LE(nameBuf.length, 28);
  dirEntry.writeUInt16LE(0, 30);
  dirEntry.writeUInt16LE(0, 32);
  dirEntry.writeUInt16LE(0, 34);
  dirEntry.writeUInt16LE(0, 36);
  dirEntry.writeUInt32LE(0, 38);
  dirEntry.writeUInt32LE(offset, 42);
  central.push(dirEntry, nameBuf);

  offset += local.length + nameBuf.length + body.length;
}

const centralBuf = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(0, 4);
end.writeUInt16LE(0, 6);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(centralBuf.length, 12);
end.writeUInt32LE(offset, 16);
end.writeUInt16LE(0, 20);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, Buffer.concat([...localParts, centralBuf, end]));
console.log(`wrote ${OUT} (${files.length} files, ${(statSync(OUT).size / 1024).toFixed(1)} KiB)`);
