#!/usr/bin/env node
/** Generates the application icon (multi-resolution .ico + PNG) from procedural art. */
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = resolve(process.argv[2] ?? join(root, 'build'));
mkdirSync(outDir, { recursive: true });

function drawIcon(size) {
  const c = createCanvas(size, size);
  const ctx = c.getContext('2d');
  const s = size / 256;
  ctx.clearRect(0, 0, size, size);

  // Rounded badge.
  const r = 52 * s;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, '#132a63');
  bg.addColorStop(0.55, '#0a1230');
  bg.addColorStop(1, '#05070f');
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.save();
  ctx.clip();

  // Nebula wash + stars.
  const neb = ctx.createRadialGradient(size * 0.3, size * 0.25, 0, size * 0.3, size * 0.25, size * 0.8);
  neb.addColorStop(0, 'rgba(123,97,255,0.55)');
  neb.addColorStop(1, 'rgba(123,97,255,0)');
  ctx.fillStyle = neb;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < Math.max(14, size / 6); i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.7})`;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, Math.max(0.6, Math.random() * 2.2 * s), 0, Math.PI * 2);
    ctx.fill();
  }

  // Asteroid.
  ctx.save();
  ctx.translate(size * 0.64, size * 0.66);
  ctx.beginPath();
  const pts = 11;
  for (let i = 0; i < pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const rr = size * (0.2 + 0.045 * Math.sin(i * 2.7));
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr * 0.92;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  const rock = ctx.createLinearGradient(-size * 0.2, -size * 0.2, size * 0.2, size * 0.2);
  rock.addColorStop(0, '#8e9bb4');
  rock.addColorStop(1, '#3b4457');
  ctx.fillStyle = rock;
  ctx.fill();
  ctx.strokeStyle = 'rgba(10,14,24,0.9)';
  ctx.lineWidth = 3 * s;
  ctx.stroke();
  // Ore vein.
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 5 * s;
  ctx.beginPath();
  ctx.moveTo(-size * 0.1, size * 0.05);
  ctx.lineTo(-size * 0.01, -size * 0.04);
  ctx.lineTo(size * 0.09, size * 0.02);
  ctx.stroke();
  ctx.restore();

  // Mining beam from upper-left ship wedge.
  const beam = ctx.createLinearGradient(size * 0.2, size * 0.26, size * 0.6, size * 0.6);
  beam.addColorStop(0, 'rgba(255,255,255,1)');
  beam.addColorStop(0.35, 'rgba(255,214,102,0.95)');
  beam.addColorStop(1, 'rgba(255,106,58,0.35)');
  ctx.save();
  ctx.shadowColor = 'rgba(255,170,60,0.9)';
  ctx.shadowBlur = 18 * s;
  ctx.strokeStyle = beam;
  ctx.lineWidth = 11 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(size * 0.26, size * 0.3);
  ctx.lineTo(size * 0.6, size * 0.6);
  ctx.stroke();
  ctx.restore();

  // Ship wedge.
  ctx.beginPath();
  ctx.moveTo(size * 0.1, size * 0.4);
  ctx.lineTo(size * 0.34, size * 0.17);
  ctx.lineTo(size * 0.44, size * 0.3);
  ctx.lineTo(size * 0.2, size * 0.5);
  ctx.closePath();
  const hull = ctx.createLinearGradient(size * 0.1, size * 0.2, size * 0.44, size * 0.5);
  hull.addColorStop(0, '#dbe6ff');
  hull.addColorStop(1, '#5a6a8c');
  ctx.fillStyle = hull;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,229,255,0.9)';
  ctx.lineWidth = 3 * s;
  ctx.stroke();
  // Cockpit dot.
  ctx.fillStyle = '#00e5ff';
  ctx.beginPath();
  ctx.arc(size * 0.3, size * 0.28, 7 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  // Outer ring.
  ctx.strokeStyle = 'rgba(0,229,255,0.85)';
  ctx.lineWidth = 6 * s;
  ctx.beginPath();
  ctx.moveTo(r, 3 * s);
  ctx.lineTo(size - r, 3 * s);
  ctx.quadraticCurveTo(size - 3 * s, 3 * s, size - 3 * s, r);
  ctx.lineTo(size - 3 * s, size - r);
  ctx.quadraticCurveTo(size - 3 * s, size - 3 * s, size - r, size - 3 * s);
  ctx.lineTo(r, size - 3 * s);
  ctx.quadraticCurveTo(3 * s, size - 3 * s, 3 * s, size - r);
  ctx.lineTo(3 * s, r);
  ctx.quadraticCurveTo(3 * s, 3 * s, r, 3 * s);
  ctx.closePath();
  ctx.stroke();
  return c;
}

const sizes = [16, 24, 32, 48, 64, 128, 256];
const pngs = sizes.map((size) => ({ size, buf: drawIcon(size).toBuffer('image/png') }));

// Assemble an .ico container with PNG-compressed entries (Vista+).
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngs.length, 4);
const entries = [];
let offset = 6 + pngs.length * 16;
for (const { size, buf } of pngs) {
  const e = Buffer.alloc(16);
  e.writeUInt8(size >= 256 ? 0 : size, 0);
  e.writeUInt8(size >= 256 ? 0 : size, 1);
  e.writeUInt8(0, 2);
  e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(buf.length, 8);
  e.writeUInt32LE(offset, 12);
  entries.push(e);
  offset += buf.length;
}
const ico = Buffer.concat([header, ...entries, ...pngs.map((p) => p.buf)]);
writeFileSync(join(outDir, 'spaceminer.ico'), ico);
writeFileSync(join(outDir, 'icon-256.png'), pngs[pngs.length - 1].buf);
console.log(`icon written: ${join(outDir, 'spaceminer.ico')} (${ico.length} bytes, ${sizes.length} sizes)`);
