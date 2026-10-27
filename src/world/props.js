/**
 * Environmental prop library. Each function composes primitive geometry into
 * recognisable furniture, vehicles, machinery and vegetation. Props are merged
 * into the chunk batches by MeshBuilder, with separate handles for interactables.
 */
import * as THREE from 'three';
import { makeRng } from '../engine/util.js';

const R = makeRng(90210);

function tint(v = 1, warm = 0) {
  return [v * (1 + warm * 0.06), v, v * (1 - warm * 0.08)];
}

export function bed(b, x, z, y, rot = 0, mat = 'fabric') {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const at = (dx, dz) => [x + dx * c - dz * s, z + dx * s + dz * c];
  b.box(x, y + 0.32, z, 1.0, 0.18, 2.0, mat, { tex: 1, rotY: rot, tint: tint(1.15) });
  b.box(...[at(0, -0.95)[0], y + 0.42, at(0, -0.95)[1]], 0.95, 0.06, 0.34, 'fabric', { tex: 1, rotY: rot, tint: [1.3, 1.28, 1.22] });
  for (const [dx, dz] of [[-0.44, -0.9], [0.44, -0.9], [-0.44, 0.9], [0.44, 0.9]]) {
    const [px, pz] = at(dx, dz);
    b.box(px, y + 0.2, pz, 0.07, 0.42, 0.07, 'metalPlate', { tex: 0.5 });
  }
  // frame
  const [hx, hz] = at(0, -1.02);
  b.box(hx, y + 0.55, hz, 1.05, 1.1, 0.08, 'wood', { tex: 1, rotY: rot });
}

export function table(b, x, z, y, rot = 0, w = 1.6, d = 0.9) {
  b.box(x, y + 0.74, z, w, 0.07, d, 'wood', { tex: 1, rotY: rot });
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  for (const [dx, dz] of [[-w / 2 + 0.08, -d / 2 + 0.08], [w / 2 - 0.08, -d / 2 + 0.08], [-w / 2 + 0.08, d / 2 - 0.08], [w / 2 - 0.08, d / 2 - 0.08]]) {
    b.box(x + dx * c - dz * s, y + 0.36, z + dx * s + dz * c, 0.07, 0.72, 0.07, 'wood', { tex: 0.6, rotY: rot, collide: false });
  }
}

export function chair(b, x, z, y, rot = 0) {
  b.box(x, y + 0.45, z, 0.45, 0.05, 0.45, 'wood', { tex: 0.6, rotY: rot });
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  b.box(x + 0.22 * s, y + 0.75, z + 0.22 * c, 0.45, 0.6, 0.05, 'wood', { tex: 0.6, rotY: rot, collide: false });
  for (const [dx, dz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) {
    b.box(x + dx * c - dz * s, y + 0.22, z + dx * s + dz * c, 0.04, 0.44, 0.04, 'wood', { tex: 0.4, rotY: rot, collide: false });
  }
}

export function sofa(b, x, z, y, rot = 0, w = 2.2) {
  b.box(x, y + 0.42, z, w, 0.4, 0.9, 'fabric', { tex: 1.2, rotY: rot, tint: [0.85, 0.82, 0.74] });
  b.box(x, y + 0.72, z - 0.35, w, 0.55, 0.22, 'fabric', { tex: 1.2, rotY: rot, tint: [0.8, 0.78, 0.7] });
  b.box(x - w / 2 + 0.1, y + 0.6, z, 0.2, 0.4, 0.9, 'fabric', { tex: 1, rotY: rot, tint: [0.78, 0.75, 0.68] });
  b.box(x + w / 2 - 0.1, y + 0.6, z, 0.2, 0.4, 0.9, 'fabric', { tex: 1, rotY: rot, tint: [0.78, 0.75, 0.68] });
}

export function shelf(b, x, z, y, rot = 0, w = 1.8, h = 2.0, d = 0.45) {
  b.box(x, y + h / 2, z, w, h, d, 'metalPlate', { tex: 1, rotY: rot, tint: [0.7, 0.7, 0.68] });
  for (let i = 1; i < 4; i++) {
    const yy = y + (h / 4) * i;
    b.box(x, yy, z, w + 0.04, 0.03, d + 0.03, 'metalPlate', { tex: 0.6, rotY: rot, collide: false, tint: [0.8, 0.8, 0.75] });
  }
}

export function cabinet(b, x, z, y, rot = 0, h = 1.9, w = 1.1) {
  b.box(x, y + h / 2, z, w, h, 0.6, 'metalPlate', { tex: 1, rotY: rot, tint: [0.75, 0.78, 0.7] });
  // doors
  b.box(x - w / 4, y + h / 2, z + 0.32, w / 2 - 0.03, h - 0.1, 0.05, 'metalPlate', { tex: 0.8, rotY: rot, collide: false, tint: [0.8, 0.82, 0.74] });
  b.box(x + w / 4, y + h / 2, z + 0.32, w / 2 - 0.03, h - 0.1, 0.05, 'metalPlate', { tex: 0.8, rotY: rot, collide: false, tint: [0.8, 0.82, 0.74] });
  b.box(x - 0.08, y + h / 2, z + 0.36, 0.04, 0.14, 0.04, 'rust', { tex: 0.3, rotY: rot, collide: false });
  b.box(x + 0.08, y + h / 2, z + 0.36, 0.04, 0.14, 0.04, 'rust', { tex: 0.3, rotY: rot, collide: false });
}

export function locker(b, x, z, y, rot = 0) {
  cabinet(b, x, z, y, rot, 1.9, 0.55);
}

export function crate(b, x, z, y, rot = 0, size = 0.9) {
  b.box(x, y + size / 2, z, size, size, size, 'wood', { tex: 0.9, rotY: rot, tint: [0.9, 0.85, 0.78] });
  for (const off of [-size / 2 + 0.06, size / 2 - 0.06]) {
    b.box(x, y + size / 2, z + off * Math.cos(rot), size + 0.02, 0.07, 0.05, 'metalPlate', { tex: 0.4, rotY: rot, collide: false });
  }
}

export function barrel(b, x, z, y, rot = 0, color = [0.75, 0.45, 0.22]) {
  b.cylinder(x, y + 0.44, z, 0.3, 0.3, 0.88, 'rust', { seg: 12, tex: 1, tint: color });
  b.cylinder(x, y + 0.6, z, 0.315, 0.315, 0.05, 'metalPlate', { seg: 12, tex: 0.6, tint: tint(0.7), collide: false });
  b.cylinder(x, y + 0.3, z, 0.315, 0.315, 0.05, 'metalPlate', { seg: 12, tex: 0.6, tint: tint(0.7), collide: false });
}

export function sandbags(b, x, z, y, rot = 0, len = 2.4, height = 0.9) {
  const rows = Math.round(height / 0.22);
  for (let r = 0; r < rows; r++) {
    const count = Math.round(len / 0.55);
    for (let i = 0; i < count; i++) {
      const off = (i - (count - 1) / 2) * 0.5 + (r % 2) * 0.25;
      const px = x + Math.cos(rot) * off;
      const pz = z + Math.sin(rot) * off;
      b.box(px, y + 0.11 + r * 0.22, pz, 0.55, 0.2, 0.34, 'sand', { tex: 0.6, rotY: rot, tint: [0.85 + R() * 0.1, 0.8 + R() * 0.1, 0.66] });
    }
  }
}

export function fridge(b, x, z, y, rot = 0) {
  b.box(x, y + 0.9, z, 0.75, 1.8, 0.7, 'metalPlate', { tex: 1.1, rotY: rot, tint: [0.85, 0.86, 0.8] });
  b.box(x, y + 1.2, z + 0.36, 0.7, 0.55, 0.04, 'metalPlate', { tex: 0.8, rotY: rot, collide: false, tint: [0.9, 0.9, 0.85] });
  b.box(x, y + 0.55, z + 0.36, 0.7, 0.6, 0.04, 'metalPlate', { tex: 0.8, rotY: rot, collide: false, tint: [0.9, 0.9, 0.85] });
}

export function stove(b, x, z, y, rot = 0) {
  b.box(x, y + 0.45, z, 0.7, 0.9, 0.6, 'metalPlate', { tex: 0.8, rotY: rot, tint: [0.6, 0.6, 0.58] });
  for (const [dx, dz] of [[-0.18, -0.14], [0.18, -0.14], [-0.18, 0.14], [0.18, 0.14]]) {
    b.cylinder(x + dx, y + 0.91, z + dz, 0.09, 0.09, 0.02, 'rust', { seg: 8, tex: 0.3, collide: false });
  }
}

export function toilet(b, x, z, y, rot = 0) {
  b.box(x, y + 0.2, z, 0.4, 0.4, 0.55, 'labTile', { tex: 0.6, rotY: rot, tint: [1.05, 1.05, 1.02] });
  b.cylinder(x, y + 0.42, z, 0.21, 0.23, 0.06, 'labTile', { seg: 10, tex: 0.5, collide: false, tint: [1.1, 1.1, 1.05] });
  b.box(x, y + 0.65, z - 0.22, 0.42, 0.55, 0.2, 'labTile', { tex: 0.5, rotY: rot, collide: false, tint: [1.05, 1.05, 1] });
}

export function sinkCounter(b, x, z, y, rot = 0, len = 2.0) {
  b.box(x, y + 0.85, z, len, 0.1, 0.6, 'labTile', { tex: 1, rotY: rot, tint: [1, 1, 0.98] });
  b.box(x, y + 0.4, z, len - 0.1, 0.8, 0.55, 'wood', { tex: 1, rotY: rot, tint: [0.85, 0.8, 0.72] });
  b.cylinder(x, y + 0.92, z + 0.15, 0.09, 0.09, 0.02, 'metalPlate', { seg: 10, tex: 0.4, collide: false, tint: [0.9, 0.92, 0.9] });
}

export function tvStand(b, x, z, y, rot = 0) {
  b.box(x, y + 0.35, z, 1.2, 0.7, 0.45, 'wood', { tex: 1, rotY: rot });
  b.box(x, y + 0.95, z, 0.9, 0.5, 0.08, 'metalPlate', { tex: 0.8, rotY: rot, collide: false, tint: [0.2, 0.22, 0.24] });
}

export function desk(b, x, z, y, rot = 0) {
  table(b, x, z, y, rot, 1.7, 0.8);
  b.box(x + 0.6 * Math.cos(rot), y + 0.4, z + 0.6 * Math.sin(rot), 0.5, 0.7, 0.6, 'metalPlate', { tex: 0.8, rotY: rot, tint: [0.6, 0.65, 0.6] });
}

export function workbench(b, x, z, y, rot = 0) {
  b.box(x, y + 0.9, z, 2.2, 0.1, 0.9, 'wood', { tex: 1.1, rotY: rot, tint: [0.9, 0.82, 0.7] });
  for (const dx of [-0.95, 0.95]) {
    for (const dz of [-0.35, 0.35]) {
      b.box(x + dx * Math.cos(rot) - dz * Math.sin(rot), y + 0.45, z + dx * Math.sin(rot) + dz * Math.cos(rot), 0.09, 0.9, 0.09, 'wood', { tex: 0.5, rotY: rot, collide: false });
    }
  }
  // vise + tools
  b.box(x - 0.8, y + 1.02, z, 0.2, 0.16, 0.25, 'rust', { tex: 0.4, rotY: rot, collide: false });
  b.box(x + 0.5, y + 1.0, z, 0.4, 0.06, 0.18, 'metalPlate', { tex: 0.4, rotY: rot, collide: false });
}

// --- vehicles ---------------------------------------------------------------
function wheels(b, cx, cz, cy, rot, halfW, halfL, rad = 0.34) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  for (const [dx, dz] of [[-halfW, -halfL], [halfW, -halfL], [-halfW, halfL], [halfW, halfL]]) {
    const x = cx + dx * c - dz * s;
    const z = cz + dx * s + dz * c;
    b.cylinder(x, cy + rad, z, rad, rad, 0.22, 'fabric', { seg: 10, tex: 0.6, tint: [0.16, 0.16, 0.15], openEnded: false });
  }
}

export function carWreck(b, x, z, y, rot = 0, { burned = true } = {}) {
  const bodyMat = burned ? 'rust' : 'metalPlate';
  const t = burned ? [0.55, 0.42, 0.34] : tint(0.6);
  b.box(x, y + 0.72, z, 1.85, 0.55, 4.2, bodyMat, { tex: 1.2, rotY: rot, tint: t });
  b.box(x + Math.sin(rot) * 0.1, y + 1.16, z + Math.cos(rot) * 0.1, 1.6, 0.5, 2.0, bodyMat, { tex: 1.2, rotY: rot, tint: t.map((v) => v * 0.85) });
  b.box(x, y + 1.3, z - Math.cos(rot) * 0.5, 1.5, 0.08, 1.6, burned ? 'concrete' : 'metalPlate', { tex: 1, rotY: rot, collide: false, tint: [0.2, 0.22, 0.24] });
  wheels(b, x, z, y, rot, 0.85, 1.35, 0.33);
  // doors ajar
  b.box(x + Math.cos(rot) * 0.95, y + 0.62, z + Math.sin(rot) * 0.95, 0.08, 0.6, 1.0, bodyMat, { tex: 0.8, rotY: rot + 0.5, tint: t, collide: false });
}

export function truckWreck(b, x, z, y, rot = 0) {
  b.box(x, y + 1.25, z, 2.4, 1.7, 6.4, 'metalPlate', { tex: 1.6, rotY: rot, tint: [0.45, 0.46, 0.4] });
  b.box(x, y + 2.5, z, 2.3, 1.2, 2.4, 'metalPlate', { tex: 1.4, rotY: rot, tint: [0.5, 0.5, 0.44] });
  b.box(x, y + 2.6, z + Math.cos(rot) * 3.0, 2.2, 1.6, 0.2, 'rust', { tex: 1, rotY: rot, tint: [0.6, 0.4, 0.3], collide: false });
  wheels(b, x, z, y, rot, 1.05, 2.2, 0.5);
  b.box(x, y + 2.75, z - Math.cos(rot) * 1.4, 2.2, 0.1, 2.0, 'concrete', { tex: 1, rotY: rot, tint: [0.3, 0.3, 0.28], collide: false });
}

export function busWreck(b, x, z, y, rot = 0) {
  b.box(x, y + 1.6, z, 2.5, 2.6, 9.4, 'metalPlate', { tex: 2, rotY: rot, tint: [0.55, 0.58, 0.5] });
  // window strip
  b.box(x, y + 2.15, z, 2.55, 0.85, 8.6, 'metalPlate', { tex: 1, rotY: rot, tint: [0.18, 0.22, 0.24], collide: false });
  wheels(b, x, z, y, rot, 1.15, 3.2, 0.5);
  for (const side of [-1, 1]) {
    b.box(x + side * 1.28 * Math.cos(rot), y + 1.4, z + side * 1.28 * Math.sin(rot), 0.05, 1.6, 8.0, 'wood', { tex: 1.2, rotY: rot, tint: [0.6, 0.6, 0.55], collide: false });
  }
}

export function apc(b, x, z, y, rot = 0) {
  b.box(x, y + 1.1, z, 2.6, 1.4, 5.6, 'militaryMetal', { tex: 1.8, rotY: rot });
  b.box(x, y + 2.0, z, 2.0, 0.9, 2.2, 'militaryMetal', { tex: 1.4, rotY: rot });
  b.cylinder(x, y + 2.55, z, 0.08, 0.1, 1.4, 'militaryMetal', { seg: 8, tex: 0.6, collide: false }).rotation.z = Math.PI / 2;
  wheels(b, x, z, y, rot, 1.0, 2.0, 0.55);
}

// --- industrial --------------------------------------------------------------
export function pipeRun(b, x, z, y, rot = 0, len = 14, rad = 0.18, height = 2.2, mat = 'rust') {
  b.pipe(new THREE.Vector3(x, y + height, z), new THREE.Vector3(x + Math.cos(rot) * len, y + height, z + Math.sin(rot) * len), rad, mat, { seg: 8 });
  for (let i = 0; i <= len; i += 3.5) {
    const px = x + Math.cos(rot) * i;
    const pz = z + Math.sin(rot) * i;
    b.box(px, y + height / 2, pz, 0.14, height, 0.14, 'rust', { tex: 0.8, collide: false, tint: [0.6, 0.5, 0.42] });
  }
}

export function valveStation(b, x, z, y, rot = 0) {
  b.box(x, y + 0.6, z, 1.2, 1.2, 1.0, 'rust', { tex: 1.2, rotY: rot, tint: [0.7, 0.55, 0.45] });
  b.cylinder(x, y + 1.5, z, 0.12, 0.12, 1.0, 'rust', { seg: 8, tex: 0.8 });
  b.cylinder(x, y + 2.0, z, 0.42, 0.42, 0.08, 'rust', { seg: 12, tex: 0.6, collide: false });
  b.box(x, y + 1.1, z + 0.55, 0.5, 0.5, 0.1, 'metalPlate', { tex: 0.5, collide: false, tint: [0.8, 0.75, 0.6] });
}

export function tank(b, x, z, y, r = 3, h = 6, rot = 0) {
  b.cylinder(x, y + h / 2, z, r, r, h, 'rust', { seg: 16, tex: 2.5, tint: [0.62, 0.5, 0.42] });
  b.cylinder(x, y + h + 0.25, z, r * 0.96, r, 0.5, 'metalPlate', { seg: 16, tex: 1.2, collide: false, tint: [0.5, 0.5, 0.46] });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    b.box(x + Math.cos(a) * r * 0.9, y + 0.3, z + Math.sin(a) * r * 0.9, 0.25, 0.6, 0.25, 'concrete', { tex: 0.6 });
  }
  b.cylinder(x, y + 1.2, z, r + 0.06, r + 0.06, 0.1, 'rust', { seg: 16, tex: 0.8, collide: false, tint: [0.5, 0.42, 0.36] });
  b.cylinder(x, y + 4.2, z, r + 0.06, r + 0.06, 0.1, 'rust', { seg: 16, tex: 0.8, collide: false, tint: [0.5, 0.42, 0.36] });
}

export function coolingTower(b, x, z, y, r = 9, h = 26) {
  // hyperboloid approximation from stacked rings
  b.cylinder(x, y + h * 0.15, z, r * 0.82, r, h * 0.3, 'concrete', { seg: 20, tex: 4 });
  b.cylinder(x, y + h * 0.5, z, r * 0.62, r * 0.82, h * 0.4, 'concrete', { seg: 20, tex: 4 });
  b.cylinder(x, y + h * 0.8, z, r * 0.72, r * 0.62, h * 0.2, 'concrete', { seg: 20, tex: 4 });
  b.cylinder(x, y + h * 0.94, z, r * 0.78, r * 0.72, h * 0.08, 'concrete', { seg: 20, tex: 4, collide: false });
  b.cylinder(x, y + 0.2, z, r * 0.95, r * 0.95, 0.4, 'dirt', { seg: 20, tex: 3, collide: false });
}

export function machinery(b, x, z, y, rot = 0, scale = 1) {
  b.box(x, y + 0.8 * scale, z, 2.2 * scale, 1.6 * scale, 1.2 * scale, 'metalPlate', { tex: 1.6, rotY: rot, tint: [0.55, 0.58, 0.52] });
  b.box(x, y + 1.7 * scale, z, 1.2 * scale, 0.5 * scale, 0.9 * scale, 'rust', { tex: 1, rotY: rot, tint: [0.7, 0.5, 0.38] });
  b.cylinder(x - 0.7 * scale, y + 0.9 * scale, z + 0.7 * scale, 0.35 * scale, 0.35 * scale, 0.2, 'rust', { seg: 12, tex: 0.7, collide: false });
  b.box(x + 0.8 * scale, y + 1.2 * scale, z, 0.6 * scale, 0.4 * scale, 0.7 * scale, 'metalPlate', { tex: 0.7, rotY: rot, collide: false, tint: [0.4, 0.42, 0.4] });
  b.pipe(new THREE.Vector3(x, y + 2 * scale, z), new THREE.Vector3(x, y + 3.4 * scale, z), 0.12 * scale, 'rust');
}

export function conveyor(b, x, z, y, rot = 0, len = 8) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  b.box(x + (c * len) / 2, y + 0.9, z + (s * len) / 2, len, 0.12, 1.0, 'metalPlate', { tex: 1.2, rotY: rot, tint: [0.4, 0.4, 0.38] });
  for (const side of [-1, 1]) {
    b.box(x + (c * len) / 2 - s * 0.5 * side, y + 1.02, z + (s * len) / 2 + c * 0.5 * side, len, 0.1, 0.06, 'rust', { tex: 0.8, rotY: rot, collide: false });
  }
  for (let i = 0; i <= len; i += 2) {
    b.box(x + c * i, y + 0.42, z + s * i, 0.1, 0.85, 0.1, 'metalPlate', { tex: 0.5, collide: false });
    b.box(x + c * i - s * 0.45, y + 0.42, z + s * i + c * 0.45, 0.1, 0.85, 0.1, 'metalPlate', { tex: 0.5, collide: false });
    b.box(x + c * i + s * 0.45, y + 0.42, z + s * i - c * 0.45, 0.1, 0.85, 0.1, 'metalPlate', { tex: 0.5, collide: false });
  }
}

export function generator(b, x, z, y, rot = 0) {
  b.box(x, y + 0.55, z, 1.4, 1.1, 0.9, 'militaryMetal', { tex: 1, rotY: rot });
  b.cylinder(x - 0.4, y + 1.25, z, 0.16, 0.16, 0.5, 'rust', { seg: 8, tex: 0.5 });
  b.box(x + 0.3, y + 1.15, z, 0.5, 0.2, 0.5, 'metalPlate', { tex: 0.5, rotY: rot, collide: false, tint: [0.4, 0.42, 0.38] });
}

// --- forest ------------------------------------------------------------------
export function treePine(b, x, z, y, scale = 1, variant = 0) {
  const h = (9 + R() * 7) * scale;
  b.cylinder(x, y + h * 0.35, z, 0.16 * scale, 0.3 * scale, h * 0.7, 'bark', { seg: 7, tex: 2 });
  const layers = 3 + Math.floor(R() * 2);
  for (let i = 0; i < layers; i++) {
    const t = i / layers;
    const r = (2.6 - t * 1.9) * scale;
    const ly = y + h * (0.35 + t * 0.5);
    const geo = new THREE.ConeGeometry(r, h * 0.32, 7, 1);
    const m = new THREE.Matrix4().makeTranslation(x, ly, z);
    b.raw(geo, m, 'forestFoliage', { tex: 3, tint: [0.85 + R() * 0.2, 0.9 + R() * 0.15, 0.8 + R() * 0.15] });
  }
}

export function treeDead(b, x, z, y, scale = 1) {
  const h = (7 + R() * 5) * scale;
  b.cylinder(x, y + h * 0.45, z, 0.12 * scale, 0.28 * scale, h * 0.9, 'bark', { seg: 6, tex: 2 });
  const branches = 3 + Math.floor(R() * 3);
  for (let i = 0; i < branches; i++) {
    const a = R() * Math.PI * 2;
    const by = y + h * (0.45 + R() * 0.4);
    const len = (1.4 + R() * 1.8) * scale;
    const end = new THREE.Vector3(x + Math.cos(a) * len, by + len * 0.5, z + Math.sin(a) * len);
    b.pipe(new THREE.Vector3(x, by, z), end, 0.06 * scale, 'bark', { seg: 5 });
  }
}

export function bush(b, x, z, y, scale = 1, mat = 'forestFoliage') {
  b.blob(x, y + 0.5 * scale, z, 0.9 * scale, 0.7 * scale, 0.9 * scale, mat, { detail: 1, rand: 0.5, seed: Math.floor(R() * 9999), collide: false, tex: 2, tint: [0.8 + R() * 0.2, 0.9 + R() * 0.2, 0.7 + R() * 0.2] });
}

export function grassPatch(b, x, z, y, count = 8) {
  for (let i = 0; i < count; i++) {
    const px = x + (R() - 0.5) * 2.4;
    const pz = z + (R() - 0.5) * 2.4;
    const py = y + 0.12;
    const h = 0.35 + R() * 0.45;
    const geo = new THREE.ConeGeometry(0.12, h, 3);
    const m = new THREE.Matrix4().makeTranslation(px, py + h / 2, pz);
    b.raw(geo, m, 'grass', { tex: 1, tint: [0.9 + R() * 0.2, 0.95 + R() * 0.2, 0.8 + R() * 0.2] });
  }
}

export function logPile(b, x, z, y, rot = 0) {
  for (let i = 0; i < 4; i++) {
    b.cylinder(x + (R() - 0.5) * 0.4, y + 0.2 + i * 0.28, z + (R() - 0.5) * 0.2, 0.22, 0.22, 1.4, 'bark', { seg: 8, tex: 1, rotY: Math.PI / 2 + rot });
  }
}

export function rock(b, x, z, y, scale = 1) {
  b.blob(x, y + 0.4 * scale, z, 0.9 * scale, 0.7 * scale, 0.8 * scale, 'rock', { detail: 1, rand: 0.55, seed: Math.floor(R() * 9999) });
}

export function fence(b, x, z, y, rot = 0, len = 4) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  for (let i = 0; i <= len; i += 2) {
    b.box(x + c * i, y + 0.65, z + s * i, 0.09, 1.3, 0.09, 'wood', { tex: 0.5, collide: false });
  }
  for (const h of [0.5, 1.0]) {
    b.box(x + (c * len) / 2, y + h, z + (s * len) / 2, len, 0.09, 0.05, 'wood', { tex: 1, rotY: rot });
  }
}

export function jerseyBarrier(b, x, z, y, rot = 0) {
  b.box(x, y + 0.42, z, 2.0, 0.85, 0.55, 'concrete', { tex: 1.2, rotY: rot, tint: [0.9, 0.9, 0.85] });
  b.box(x, y + 0.85, z, 2.0, 0.14, 0.3, 'concrete', { tex: 1, rotY: rot, tint: [0.95, 0.95, 0.9], collide: false });
}

export function watchtower(b, x, z, y, rot = 0) {
  const h = 6.5;
  for (const [dx, dz] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) {
    b.box(x + dx, y + h / 2, z + dz, 0.2, h, 0.2, 'wood', { tex: 1, tint: [0.7, 0.65, 0.55] });
  }
  b.box(x, y + h, z, 3.6, 0.2, 3.6, 'wood', { tex: 1.5 });
  // railings
  for (const [dx, dz] of [[0, -1.75], [0, 1.75], [-1.75, 0], [1.75, 0]]) {
    b.box(x + dx, y + h + 0.55, z + dz, dx === 0 ? 3.6 : 0.08, 0.9, dz === 0 ? 3.6 : 0.08, 'wood', { tex: 0.8, collide: false });
  }
  // roof
  b.box(x, y + h + 2.5, z, 4.2, 0.15, 4.2, 'roof', { tex: 1.5, collide: false });
  for (const [dx, dz] of [[-1.7, -1.7], [1.7, -1.7], [-1.7, 1.7], [1.7, 1.7]]) {
    b.box(x + dx, y + h + 1.7, z + dz, 0.12, 1.6, 0.12, 'wood', { tex: 0.5, collide: false });
  }
  // ladder
  for (let i = 0; i < 12; i++) b.box(x, y + 0.3 + i * 0.52, z + 1.9, 0.5, 0.05, 0.05, 'metalPlate', { tex: 0.4, collide: false });
}

export function antennaMast(b, x, z, y, h = 14) {
  b.cylinder(x, y + h / 2, z, 0.07, 0.14, h, 'metalPlate', { seg: 6, tex: 1, tint: [0.6, 0.62, 0.58] });
  for (let i = 0; i < 4; i++) {
    const yy = y + h * (0.4 + i * 0.16);
    b.box(x, yy, z, 1.6 - i * 0.25, 0.05, 0.05, 'metalPlate', { tex: 0.5, collide: false });
    b.box(x, yy, z, 0.05, 0.05, 1.6 - i * 0.25, 'metalPlate', { tex: 0.5, collide: false });
  }
  b.cylinder(x, y + h + 0.3, z, 0.16, 0.16, 0.12, 'rust', { seg: 8, tex: 0.4, collide: false });
}

export function satelliteDish(b, x, z, y, rot = 0) {
  b.box(x, y + 0.6, z, 0.3, 1.2, 0.3, 'metalPlate', { tex: 0.8 });
  const dish = new THREE.SphereGeometry(1.2, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.42);
  const m = new THREE.Matrix4()
    .makeTranslation(x, y + 2.1, z)
    .multiply(new THREE.Matrix4().makeRotationX(Math.PI * 0.85))
    .multiply(new THREE.Matrix4().makeRotationY(rot));
  b.raw(dish, m, 'metalPlate', { tex: 1.4, tint: [0.8, 0.82, 0.78] });
}

export function streetLamp(b, x, z, y, rot = 0, { on = false } = {}) {
  b.cylinder(x, y + 2.6, z, 0.08, 0.12, 5.2, 'metalPlate', { seg: 8, tex: 1, tint: [0.45, 0.47, 0.44] });
  b.box(x + Math.cos(rot) * 0.9, y + 5.2, z + Math.sin(rot) * 0.9, 1.8, 0.1, 0.12, 'metalPlate', { tex: 0.8, rotY: rot, collide: false });
  b.box(x + Math.cos(rot) * 1.7, y + 5.1, z + Math.sin(rot) * 1.7, 0.5, 0.18, 0.3, 'metalPlate', { tex: 0.5, rotY: rot, collide: false, tint: [0.3, 0.3, 0.28] });
  if (on) {
    const l = new THREE.PointLight(0xffc070, 9, 16, 2);
    l.position.set(x + Math.cos(rot) * 1.7, y + 4.9, z + Math.sin(rot) * 1.7);
    b.lampLights = b.lampLights || [];
    b.lampLights.push(l);
  }
}

export function trafficLight(b, x, z, y, rot = 0) {
  b.cylinder(x, y + 2.4, z, 0.09, 0.11, 4.8, 'metalPlate', { seg: 6, tex: 0.8, tint: [0.4, 0.42, 0.4] });
  b.box(x, y + 4.4, z, 0.35, 1.0, 0.3, 'metalPlate', { tex: 0.4, rotY: rot, collide: false, tint: [0.25, 0.27, 0.25] });
}

export function signpost(b, x, z, y, rot = 0, tex = null) {
  b.cylinder(x, y + 1.2, z, 0.05, 0.06, 2.4, 'metalPlate', { seg: 6, tex: 0.5, tint: [0.55, 0.55, 0.5] });
  if (tex) {
    const geo = new THREE.PlaneGeometry(1.4, 0.7);
    const m = new THREE.Matrix4().makeTranslation(x, y + 2.0, z).multiply(new THREE.Matrix4().makeRotationY(rot));
    b.raw(geo, m, tex, { axis: 'none' });
  }
}

export function campfire(b, x, z, y, { lit = true } = {}) {
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    b.blob(x + Math.cos(a) * 0.55, y + 0.08, z + Math.sin(a) * 0.55, 0.18, 0.12, 0.16, 'rock', { detail: 0, rand: 0.4, seed: i, collide: false });
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI;
    b.pipe(new THREE.Vector3(x - Math.cos(a) * 0.45, y + 0.06, z - Math.sin(a) * 0.45), new THREE.Vector3(x + Math.cos(a) * 0.45, y + 0.16, z + Math.sin(a) * 0.45), 0.06, 'bark', { seg: 5 });
  }
  if (lit) {
    const l = new THREE.PointLight(0xff8a40, 12, 12, 2);
    l.position.set(x, y + 0.7, z);
    b.fireLights = b.fireLights || [];
    b.fireLights.push(l);
  }
}

export function tent(b, x, z, y, rot = 0) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const geo = new THREE.ConeGeometry(1.6, 1.5, 4, 1);
  const m = new THREE.Matrix4().makeTranslation(x, y + 0.75, z).multiply(new THREE.Matrix4().makeRotationY(rot + Math.PI / 4));
  b.raw(geo, m, 'fabric', { tex: 1.6, tint: [0.7, 0.72, 0.6] });
  b.box(x + c * 1.1, y + 0.5, z + s * 1.1, 0.7, 0.06, 0.9, 'fabric', { tex: 1, rotY: rot, collide: false, tint: [0.6, 0.62, 0.5] });
}

export function corpse(b, x, z, y, rot = 0) {
  b.box(x, y + 0.16, z, 0.5, 0.22, 1.6, 'fabric', { tex: 0.8, rotY: rot, tint: [0.4, 0.38, 0.34], collide: false });
  b.blob(x + Math.sin(rot) * 0.85, y + 0.16, z + Math.cos(rot) * 0.85, 0.12, 0.12, 0.12, 'fabric', { detail: 0, rand: 0.3, collide: false, tint: [0.7, 0.62, 0.52] });
}

export function rubble(b, x, z, y, radius = 2, count = 10) {
  for (let i = 0; i < count; i++) {
    const a = R() * Math.PI * 2;
    const r = R() * radius;
    const px = x + Math.cos(a) * r;
    const pz = z + Math.sin(a) * r;
    const s = 0.15 + R() * 0.45;
    b.box(px, y + s * 0.5, pz, s, s * 0.8, s * 1.2, 'concrete', { tex: 1, rotY: R() * 3.14, tint: [0.6 + R() * 0.2, 0.6 + R() * 0.2, 0.58 + R() * 0.2], collide: false });
  }
}

export function ammoBox(b, x, z, y, rot = 0) {
  b.box(x, y + 0.18, z, 0.6, 0.36, 0.35, 'militaryMetal', { tex: 0.5, rotY: rot, tint: [0.5, 0.55, 0.4] });
  b.box(x, y + 0.37, z, 0.5, 0.04, 0.25, 'militaryMetal', { tex: 0.4, rotY: rot, collide: false });
}

export function bloodPool(b, x, z, y, scale = 1) {
  b.plane(x, y + 0.012, z, 1.6 * scale, 1.2 * scale, 'dirt', { axis: 'y', tex: 0.5, tint: [0.35, 0.05, 0.05], collide: false });
}

export function pipesVertical(b, x, z, y, h = 8, count = 3) {
  for (let i = 0; i < count; i++) {
    b.cylinder(x + i * 0.35, y + h / 2, z, 0.1, 0.1, h, 'rust', { seg: 8, tex: 1.4, tint: [0.7, 0.55, 0.42] });
  }
}

export function serverRack(b, x, z, y, rot = 0) {
  b.box(x, y + 1.0, z, 0.8, 2.0, 0.9, 'metalPlate', { tex: 0.8, rotY: rot, tint: [0.3, 0.32, 0.3] });
  for (let i = 0; i < 8; i++) {
    b.box(x, y + 0.3 + i * 0.2, z + 0.46, 0.6, 0.06, 0.02, 'electronics_circuit', { tex: 0.3, rotY: rot, collide: false, tint: [0.4, 0.6, 0.4] });
  }
}

export function chainlink(b, x, z, y, rot = 0, len = 6, h = 2.4) {
  for (let i = 0; i <= len; i += 3) {
    b.cylinder(x + Math.cos(rot) * i, y + h / 2, z + Math.sin(rot) * i, 0.05, 0.05, h, 'metalPlate', { seg: 5, tex: 0.6, tint: [0.4, 0.42, 0.4] });
  }
  b.box(x + (Math.cos(rot) * len) / 2, y + h / 2, z + (Math.sin(rot) * len) / 2, len, h, 0.03, 'metalPlate', { tex: 1.2, rotY: rot, tint: [0.4, 0.42, 0.4] });
}

/** Kitchen run: cabinets, counter with a sink cutout, stove and a range hood. */
export function kitchen(b, x, z, y, rot = 0) {
  // lower cabinets along the wall
  for (let i = 0; i < 3; i++) {
    const dx = (i - 1) * 0.72;
    b.box(x + dx * Math.cos(rot), y + 0.42, z - dx * Math.sin(rot), 0.7, 0.84, 0.6, 'wood', { tex: 0.9, rotY: rot, tint: [0.78, 0.7, 0.6] });
  }
  // counter top
  b.box(x, y + 0.88, z, 2.2, 0.08, 0.64, 'labTile', { tex: 1, rotY: rot, tint: [0.92, 0.9, 0.84] });
  // upper cabinets
  for (let i = 0; i < 2; i++) {
    const dx = (i - 0.5) * 0.8;
    b.box(x + dx * Math.cos(rot), y + 1.85, z - 0.24 * Math.sin(rot) - 0.24 * Math.cos(rot), 0.74, 0.62, 0.36, 'wood', { tex: 0.9, rotY: rot, collide: false, tint: [0.72, 0.65, 0.55] });
  }
  stove(b, x + 1.0 * Math.cos(rot), z - 1.0 * Math.sin(rot), y, rot);
  // range hood
  b.box(x + 1.0 * Math.cos(rot), y + 2.05, z - 1.0 * Math.sin(rot), 0.8, 0.12, 0.5, 'metalPlate', { tex: 0.7, rotY: rot, collide: false, tint: [0.55, 0.56, 0.54] });
}

/** Generic irregular mass - rubble heaps, boulders, root balls, organic growths. */
export function blob(b, x, y, z, rx = 1.4, ry = 1.0, rz = 1.4, mat = 'rock', opts = {}) {
  b.blob(x, y, z, rx, ry, rz, mat, { detail: 1, rand: 0.3, tex: 1.4, ...opts });
}
