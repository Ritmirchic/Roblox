// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// world/props.js — furniture, vehicles, vegetation, debris
// ============================================================
import * as THREE from 'three';
import { boxGeo, cylGeo, sphereGeo, planeGeo } from './geo.js';
import { M, mat, plain } from '../core/materials.js';
import { RNG, clamp, lerp, smoothstep } from '../core/util.js';

// Every prop function draws into a Builder at (x,y,z) with rotation ry.
// They return an optional metadata object (interaction anchor etc.)

const rr = (a, b) => Math.random() * (b - a) + a;

// ---------------- FURNITURE ----------------
export const Furniture = {
  bed(B, x, y, z, ry = 0, rng) {
    const w = 0.95, l = 1.95;
    const rot = [0, ry, 0];
    B.add(boxGeo(w, 0.28, l), M.wood, x, y + 0.34, z, rot);
    B.add(boxGeo(w - 0.08, 0.16, l - 0.1), M.fabric, x, y + 0.55, z, rot);
    B.add(boxGeo(w, 0.09, l * 0.8), M.fabric, x, y + 0.63, z, rot);
    // headboard
    B.add(boxGeo(w, 0.85, 0.08), M.wood, x, y + 0.62, z - l / 2 * Math.cos(ry), rot);
    // legs
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      B.add(boxGeo(0.07, 0.2, 0.07), M.wood,
        x + sx * (w / 2 - 0.08) * Math.cos(ry) - sz * (l / 2 - 0.1) * Math.sin(ry), y + 0.1,
        z - sx * (w / 2 - 0.08) * Math.sin(ry) - sz * (l / 2 - 0.1) * Math.cos(ry));
    }
    B.collideBox(x - w / 2 - 0.05, y, z - l / 2 - 0.05, x + w / 2 + 0.05, y + 0.6, z + l / 2 + 0.05, 'furniture');
  },
  bunkBed(B, x, y, z, ry = 0, rng) {
    const w = 0.95, l = 2.0;
    for (let i = 0; i < 2; i++) {
      B.add(boxGeo(w, 0.1, l), M.steel, x, y + 0.42 + i * 1.1, z, [0, ry, 0]);
      B.add(boxGeo(w - 0.06, 0.12, l - 0.15), M.fabric, x, y + 0.51 + i * 1.1, z, [0, ry, 0]);
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      B.add(boxGeo(0.06, 2.1, 0.06), M.steel,
        x + sx * (w / 2 - 0.03), y + 1.05, z + sz * (l / 2 - 0.03));
    }
    B.collideBox(x - w / 2, y, z - l / 2, x + w / 2, y + 1.9, z + l / 2, 'furniture');
  },
  table(B, x, y, z, ry = 0, rng, w = 1.3, d = 0.8) {
    B.add(boxGeo(w, 0.06, d), M.wood, x, y + 0.74, z, [0, ry, 0]);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      B.add(boxGeo(0.06, 0.73, 0.06), M.wood,
        x + sx * (w / 2 - 0.08) * Math.cos(ry) - sz * (d / 2 - 0.08) * Math.sin(ry), y + 0.365,
        z - sx * (w / 2 - 0.08) * Math.sin(ry) - sz * (d / 2 - 0.08) * Math.cos(ry));
    }
    B.collideBox(x - w / 2, y, z - d / 2, x + w / 2, y + 0.78, z + d / 2, 'furniture');
  },
  chair(B, x, y, z, ry = 0) {
    B.add(boxGeo(0.42, 0.05, 0.42), M.wood, x, y + 0.44, z, [0, ry, 0]);
    B.add(boxGeo(0.42, 0.5, 0.05), M.wood, x, y + 0.72, z - 0.2 * Math.cos(ry), [0, ry, 0]);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      B.add(boxGeo(0.04, 0.44, 0.04), M.wood, x + sx * 0.17, y + 0.22, z + sz * 0.17);
    }
  },
  sofa(B, x, y, z, ry = 0) {
    B.add(boxGeo(1.9, 0.4, 0.85), M.fabric, x, y + 0.24, z, [0, ry, 0]);
    B.add(boxGeo(1.9, 0.55, 0.2), M.fabric, x, y + 0.62, z - 0.32 * Math.cos(ry), [0, ry, 0]);
    B.add(boxGeo(0.2, 0.5, 0.85), M.fabric, x - 0.86 * Math.cos(ry), y + 0.55, z + 0.86 * Math.sin(ry), [0, ry, 0]);
    B.add(boxGeo(0.2, 0.5, 0.85), M.fabric, x + 0.86 * Math.cos(ry), y + 0.55, z - 0.86 * Math.sin(ry), [0, ry, 0]);
    B.collideBox(x - 1, y, z - 0.45, x + 1, y + 0.85, z + 0.45, 'furniture');
  },
  cabinet(B, x, y, z, ry = 0, h = 1.8, w = 0.9) {
    B.add(boxGeo(w, h, 0.45), M.woodWeathered, x, y + h / 2, z, [0, ry, 0]);
    for (let i = 0; i < Math.floor(h / 0.45); i++) {
      B.add(boxGeo(w - 0.06, 0.02, 0.02), M.steel, x, y + 0.4 + i * 0.45, z + 0.23, [0, ry, 0]);
    }
    B.collideBox(x - w / 2, y, z - 0.25, x + w / 2, y + h, z + 0.25, 'furniture');
  },
  locker(B, x, y, z, ry = 0) {
    B.box(x, y + 0.95, z, 0.45, 1.9, 0.5, M.metalPaint, { collide: false, rot: [0, ry, 0] });
    B.add(boxGeo(0.04, 0.02, 0.02), M.steel, x + 0.16, y + 1.0, z + 0.26, [0, ry, 0]);
    B.collideBox(x - 0.25, y, z - 0.25, x + 0.25, y + 1.9, z + 0.25, 'furniture');
  },
  shelf(B, x, y, z, ry = 0, h = 1.9, w = 1.4, d = 0.4) {
    B.add(boxGeo(0.05, h, d), M.steel, x - w / 2, y + h / 2, z, [0, ry, 0]);
    B.add(boxGeo(0.05, h, d), M.steel, x + w / 2, y + h / 2, z, [0, ry, 0]);
    const n = Math.floor(h / 0.45);
    for (let i = 0; i <= n; i++) B.add(boxGeo(w, 0.04, d), M.steel, x, y + 0.1 + i * 0.45, z, [0, ry, 0]);
    B.collideBox(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2, 'furniture');
  },
  desk(B, x, y, z, ry = 0) {
    B.add(boxGeo(1.5, 0.06, 0.75), M.wood, x, y + 0.75, z, [0, ry, 0]);
    B.add(boxGeo(0.5, 0.65, 0.7), M.wood, x - 0.45 * Math.cos(ry), y + 0.4, z + 0.45 * Math.sin(ry), [0, ry, 0]);
    B.collideBox(x - 0.75, y, z - 0.4, x + 0.75, y + 0.85, z + 0.4, 'furniture');
  },
  counter(B, x, y, z, ry = 0, len = 3) {
    B.add(boxGeo(len, 0.95, 0.7), M.woodWeathered, x, y + 0.48, z, [0, ry, 0]);
    B.add(boxGeo(len + 0.1, 0.06, 0.82), M.tiles, x, y + 0.98, z, [0, ry, 0]);
    B.collideBox(x - len / 2, y, z - 0.42, x + len / 2, y + 1.0, z + 0.42, 'furniture');
  },
  hospitalBed(B, x, y, z, ry = 0) {
    B.add(boxGeo(0.95, 0.14, 2.0), M.steel, x, y + 0.62, z, [0, ry, 0]);
    B.add(boxGeo(0.85, 0.1, 1.9), M.fabric, x, y + 0.74, z, [0, ry, 0]);
    B.add(boxGeo(0.95, 0.5, 0.06), M.steel, x, y + 0.9, z - 0.95 * Math.cos(ry), [0, ry, 0]);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      B.add(boxGeo(0.05, 0.55, 0.05), M.steel, x + sx * 0.42, y + 0.28, z + sz * 0.92);
    }
    B.collideBox(x - 0.5, y, z - 1.02, x + 0.5, y + 0.8, z + 1.02, 'furniture');
  },
  gurney(B, x, y, z, ry = 0) {
    B.add(boxGeo(0.7, 0.08, 1.9), M.steel, x, y + 0.75, z, [0, ry, 0]);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      B.add(boxGeo(0.04, 0.7, 0.04), M.steel, x + sx * 0.3, y + 0.4, z + sz * 0.85);
      B.add(cylGeo(0.07, 0.07, 0.05, 6), M.woodWeathered, x + sx * 0.3, y + 0.05, z + sz * 0.85, [0, 0, Math.PI / 2]);
    }
  },
  toilet(B, x, y, z, ry = 0) {
    B.add(boxGeo(0.42, 0.4, 0.55), M.tiles, x, y + 0.2, z, [0, ry, 0]);
    B.add(boxGeo(0.42, 0.12, 0.5), M.tiles, x, y + 0.46, z, [0, ry, 0]);
    B.add(boxGeo(0.4, 0.5, 0.18), M.tiles, x, y + 0.5, z - 0.28 * Math.cos(ry), [0, ry, 0]);
  },
  sink(B, x, y, z, ry = 0) {
    B.add(boxGeo(0.55, 0.18, 0.42), M.tiles, x, y + 0.82, z, [0, ry, 0]);
    B.add(boxGeo(0.1, 0.8, 0.1), M.steel, x, y + 0.4, z, [0, ry, 0]);
    B.add(cylGeo(0.02, 0.02, 0.22, 6), M.steel, x, y + 0.95, z + 0.12);
  },
  machine(B, x, y, z, ry = 0, w = 1.6, h = 1.3, d = 0.8) {
    B.add(boxGeo(w, h, d), M.metalPaint, x, y + h / 2, z, [0, ry, 0]);
    B.add(boxGeo(w * 0.5, 0.25, 0.05), M.hazard, x, y + h * 0.7, z + d / 2 + 0.01, [0, ry, 0]);
    B.add(cylGeo(0.12, 0.12, 0.4, 8), M.steel, x + w * 0.3, y + h + 0.2, z, [0, ry, 0]);
    B.collideBox(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2, 'furniture');
  },
  crate(B, x, y, z, ry = 0, s = 1) {
    B.add(boxGeo(0.9 * s, 0.7 * s, 0.9 * s), M.wood, x, y + 0.35 * s, z, [0, ry, 0]);
    B.add(boxGeo(0.94 * s, 0.06 * s, 0.94 * s), M.woodWeathered, x, y + 0.7 * s, z, [0, ry, 0]);
    B.collideBox(x - 0.45 * s, y, z - 0.45 * s, x + 0.45 * s, y + 0.72 * s, z + 0.45 * s, 'prop');
  },
  barrel(B, x, y, z, rng) {
    const rusted = rng ? rng.chance(0.5) : true;
    B.add(cylGeo(0.29, 0.29, 0.88, 14), rusted ? M.rust : M.hazard, x, y + 0.44, z);
    B.add(cylGeo(0.3, 0.3, 0.04, 14), M.steel, x, y + 0.88, z);
    B.add(cylGeo(0.3, 0.3, 0.04, 14), M.steel, x, y + 0.02, z);
    B.collideBox(x - 0.3, y, z - 0.3, x + 0.3, y + 0.9, z + 0.3, 'prop');
  },
  sandbagWall(B, x, y, z, ry = 0, len = 3) {
    const n = Math.round(len / 0.5);
    for (let layer = 0; layer < 3; layer++) {
      for (let i = 0; i < n; i++) {
        const off = (layer % 2) * 0.25;
        B.add(sphereGeo(0.26, 6), M.fabric,
          x - len / 2 + 0.25 + i * 0.5 + off, y + 0.14 + layer * 0.26, z,
          [0, 0, 0], { x: 1.15, y: 0.55, z: 0.72 });
      }
    }
    B.collideBox(x - len / 2, y, z - 0.25, x + len / 2, y + 0.78, z + 0.25, 'cover');
  },
  fireplace(B, x, y, z) {
    B.add(boxGeo(1.4, 0.9, 0.5), M.brick, x, y + 0.45, z);
    B.add(boxGeo(1.0, 0.55, 0.1), M.brick, x, y + 0.62, z + 0.22);
    B.add(boxGeo(1.5, 0.12, 0.6), M.concrete, x, y + 0.95, z);
    B.collideBox(x - 0.7, y, z - 0.25, x + 0.7, y + 1.0, z + 0.25, 'furniture');
  },
  clock(B, x, y, z, ry = 0) {
    B.add(cylGeo(0.22, 0.22, 0.06, 16), M.wood, x, y + 2.3, z, [Math.PI / 2, 0, ry]);
    B.add(cylGeo(0.19, 0.19, 0.02, 16), M.paper, x, y + 2.3, z + 0.03, [Math.PI / 2, 0, ry]);
  },
};

// ---------------- VEHICLES ----------------
const VEHICLE_TYPES = {
  sedan: { l: 4.4, w: 1.8, h: 0.62, cabin: 1.3, color: [0x6d5f52, 0x4a5560, 0x6a6a5e, 0x7d4a3a] },
  van: { l: 5.0, w: 2.0, h: 0.85, cabin: 2.6, color: [0x8a8578, 0x5a6258] },
  pickup: { l: 5.2, w: 1.95, h: 0.75, cabin: 1.6, color: [0x7a6a4a, 0x54604f] },
  bus: { l: 10.5, w: 2.5, h: 1.5, cabin: 8.5, color: [0x8a7a3a, 0x6a7a7a] },
  truck: { l: 7.0, w: 2.3, h: 1.1, cabin: 2.2, color: [0x4f5a44, 0x5a5040] },
  military: { l: 6.6, w: 2.3, h: 1.0, cabin: 2.4, color: [0x4a5440, 0x565e46] },
};

export function vehicle(B, x, y, z, ry, rng, type = null, opts = {}) {
  const keys = Object.keys(VEHICLE_TYPES);
  const t = type || rng.pick(keys.slice(0, opts.allTypes ? keys.length : 3));
  const V = VEHICLE_TYPES[t];
  const c = new THREE.Color(rng.pick(V.color));
  const bodyMat = mat('metal_paint', { color: c.getHex() });
  const burned = opts.burned ?? rng.chance(0.25);
  const bm = burned ? mat('rust', { color: 0x6a6a68 }) : bodyMat;
  const rot = [0, ry, 0];
  const cos = Math.cos(ry), sin = Math.sin(ry);
  const L = V.l, W = V.w, H = V.h;
  const lift = opts.wrecked ? -0.12 : 0;
  // chassis
  B.add(boxGeo(W, H, L), bm, x, y + 0.5 + lift, z, rot);
  // cabin
  B.add(boxGeo(W - 0.12, H * 0.95, V.cabin), bm, x - sin * 0.2, y + 0.5 + H * 0.9 + lift, z - cos * 0.2, rot);
  // windows
  const win = plain(0x243033, { roughness: 0.3, metalness: 0.4, transparent: true, opacity: burned ? 0.5 : 0.75 });
  if (!burned) {
    B.add(boxGeo(W - 0.2, H * 0.55, 0.04), win, x - sin * 0.2 + sin * (V.cabin / 2), y + 0.5 + H * 1.05 + lift, z - cos * 0.2 + cos * (V.cabin / 2));
    B.add(boxGeo(W - 0.2, H * 0.55, 0.04), win, x - sin * 0.2 - sin * (V.cabin / 2), y + 0.5 + H * 1.05 + lift, z - cos * 0.2 - cos * (V.cabin / 2));
    B.add(boxGeo(0.04, H * 0.5, V.cabin * 0.8), win, x + cos * (W / 2 - 0.1), y + 0.5 + H * 1.05 + lift, z - sin * (W / 2 - 0.1), rot);
    B.add(boxGeo(0.04, H * 0.5, V.cabin * 0.8), win, x - cos * (W / 2 - 0.1), y + 0.5 + H * 1.05 + lift, z + sin * (W / 2 - 0.1), rot);
  }
  // wheels
  const wheelMat = plain(0x1a1a18, { roughness: 0.95 });
  const wb = L * 0.32;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const wx = x + cos * sx * (W / 2 - 0.05) + sin * sz * wb;
    const wz = z - sin * sx * (W / 2 - 0.05) + cos * sz * wb;
    const missing = rng.chance(burned ? 0.4 : 0.12);
    if (missing) continue;
    B.add(cylGeo(0.34, 0.34, 0.24, 12), wheelMat, wx, y + 0.34, wz, [0, ry, Math.PI / 2]);
    B.add(cylGeo(0.18, 0.18, 0.26, 8), M.steel, wx, y + 0.34, wz, [0, ry, Math.PI / 2]);
  }
  // bumper + lights
  B.add(boxGeo(W + 0.06, 0.16, 0.14), M.steel, x + sin * (L / 2), y + 0.42 + lift, z + cos * (L / 2), rot);
  if (!burned) {
    B.add(boxGeo(0.3, 0.14, 0.06), plain(0xb0a890, { roughness: 0.4 }), x + cos * (W / 2 - 0.4) + sin * (L / 2), y + 0.72 + lift, z - sin * (W / 2 - 0.4) + cos * (L / 2), rot);
    B.add(boxGeo(0.3, 0.14, 0.06), plain(0xb0a890, { roughness: 0.4 }), x - cos * (W / 2 - 0.4) + sin * (L / 2), y + 0.72 + lift, z + sin * (W / 2 - 0.4) + cos * (L / 2), rot);
  }
  // roof rack / debris
  if (rng.chance(0.4)) {
    B.add(boxGeo(W * 0.8, 0.08, V.cabin * 0.7), M.rust, x - sin * 0.2, y + 0.5 + H * 1.9 + lift, z - cos * 0.2, rot);
  }
  B.collideBox(x - Math.abs(cos) * W / 2 - Math.abs(sin) * L / 2, y, z - Math.abs(sin) * W / 2 - Math.abs(cos) * L / 2,
    x + Math.abs(cos) * W / 2 + Math.abs(sin) * L / 2, y + 1.6, z + Math.abs(sin) * W / 2 + Math.abs(cos) * L / 2, 'vehicle');
  return { type: t, pos: [x, y, z] };
}

// ---------------- VEGETATION ----------------
export function buildTreeGeometries() {
  // 3 pine variants, 2 birch, 2 dead — merged trunk + foliage cards
  const out = [];
  const R = new RNG(4242);
  for (let v = 0; v < 3; v++) {
    const trunkParts = [];
    const h = 9 + v * 2.2;
    const trunk = new THREE.CylinderGeometry(0.16 + v * 0.03, 0.34 + v * 0.05, h * 0.62, 8, 3);
    // bend trunk slightly
    const pos = trunk.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const yy = pos.getY(i) + h * 0.31;
      pos.setX(i, pos.getX(i) + Math.sin(yy * 0.6 + v) * 0.14 * (yy / h));
    }
    trunk.translate(0, h * 0.31, 0);
    trunk.deleteAttribute('uv');
    trunk.setAttribute('uv', new THREE.CylinderGeometry(0.16, 0.34, h * 0.62, 8, 3).attributes.uv);
    trunkParts.push(trunk);
    // branches
    for (let b = 0; b < 4; b++) {
      const br = new THREE.CylinderGeometry(0.04, 0.09, 1.6, 5);
      const ang = (b / 4) * Math.PI * 2 + v;
      br.rotateZ(Math.PI / 3.2);
      br.rotateY(ang);
      br.translate(Math.cos(ang) * 0.7, h * 0.55 + b * 0.35, Math.sin(ang) * 0.7);
      trunkParts.push(br);
    }
    const trunkGeo = mergeAll(trunkParts);
    // foliage cards
    const foliage = [];
    const tiers = 4 + v;
    for (let t = 0; t < tiers; t++) {
      const yy = h * 0.42 + (t / tiers) * h * 0.55;
      const rad = (1.0 - t / tiers) * 2.1 + 0.5;
      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2 + t * 1.7;
        const p = new THREE.PlaneGeometry(rad * 2.1, rad * 1.5);
        p.rotateY(ang);
        p.translate(0, yy, 0);
        foliage.push(p);
      }
      // horizontal skirt
      const sk = new THREE.PlaneGeometry(rad * 2.4, rad * 2.4);
      sk.rotateX(-Math.PI / 2);
      sk.translate(0, yy - 0.3, 0);
      foliage.push(sk);
    }
    out.push({ kind: 'pine', trunk: trunkGeo, foliage: mergeAll(foliage), height: h, radius: 0.4 });
  }
  for (let v = 0; v < 2; v++) {
    const h = 11 + v * 3;
    const trunkParts = [];
    const trunk = new THREE.CylinderGeometry(0.13, 0.22, h * 0.8, 8, 3);
    const pos = trunk.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const yy = pos.getY(i) + h * 0.4;
      pos.setX(i, pos.getX(i) + Math.sin(yy * 0.4 + v * 3) * 0.3 * (yy / h));
    }
    trunk.translate(0, h * 0.4, 0);
    trunkParts.push(trunk);
    const foliage = [];
    for (let i = 0; i < 7; i++) {
      const ang = R.range(0, Math.PI * 2);
      const rad = R.range(1.2, 2.6);
      const p = new THREE.PlaneGeometry(R.range(2.4, 4.0), R.range(2.0, 3.2));
      p.rotateY(ang); p.rotateX(R.range(-0.3, 0.3));
      p.translate(Math.cos(ang) * rad * 0.5, h * 0.7 + R.range(-1.2, 2.2), Math.sin(ang) * rad * 0.5);
      foliage.push(p);
    }
    out.push({ kind: 'birch', trunk: mergeAll(trunkParts), foliage: mergeAll(foliage), height: h, radius: 0.25 });
  }
  for (let v = 0; v < 2; v++) {
    const h = 7 + v * 3;
    const parts = [];
    const trunk = new THREE.CylinderGeometry(0.1, 0.3, h, 7, 4);
    const pos = trunk.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const yy = pos.getY(i) + h / 2;
      pos.setX(i, pos.getX(i) + Math.sin(yy * 0.5 + v) * 0.4 * (yy / h));
    }
    trunk.translate(0, h / 2, 0);
    parts.push(trunk);
    for (let b = 0; b < 6; b++) {
      const br = new THREE.CylinderGeometry(0.03, 0.09, R.range(1.2, 2.4), 4);
      br.rotateZ(R.range(0.7, 1.3));
      br.rotateY(R.range(0, Math.PI * 2));
      br.translate(0, R.range(h * 0.4, h * 0.85), 0);
      parts.push(br);
    }
    out.push({ kind: 'dead', trunk: mergeAll(parts), foliage: null, height: h, radius: 0.3 });
  }
  // fix UVs: cylinders have uvs by default; planes too. Good.
  for (const t of out) {
    if (t.trunk) t.trunk.computeVertexNormals();
    if (t.foliage) t.foliage.computeVertexNormals();
  }
  return out;
}

function mergeAll(geos) {
  const { mergeGeometries } = requireMerge();
  const gs = geos.map((g) => {
    const ng = g.index ? g.toNonIndexed() : g;
    for (const n of Object.keys(ng.attributes)) if (!['position', 'normal', 'uv'].includes(n)) ng.deleteAttribute(n);
    if (!ng.attributes.uv) {
      const cnt = ng.attributes.position.count;
      ng.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(cnt * 2), 2));
    }
    return ng;
  });
  return mergeGeometries(gs, false);
}

// lazy import helper (ESM top-level import is fine, but keeps the file tidy)
let _merge = null;
function requireMerge() {
  if (!_merge) _merge = { mergeGeometries: mergeGeometriesImport };
  return _merge;
}
import { mergeGeometries as mergeGeometriesImport } from 'three/addons/utils/BufferGeometryUtils.js';

export function rockGeo(seed = 1, detail = 1) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const N = new (class { })();
  const pos = g.attributes.position;
  const R = new RNG(seed);
  const seedA = R.range(0, 100), seedB = R.range(0, 100);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n = Math.sin(x * 3.1 + seedA) * Math.cos(y * 2.7 + seedB) * Math.sin(z * 3.4 + seedA * 0.5);
    const k = 0.72 + n * 0.28;
    pos.setXYZ(i, x * k, y * k * 0.75, z * k);
  }
  g.computeVertexNormals();
  // cylindrical UVs
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2, uv.getY(i) * 2);
  return g;
}

// ---------------- STREET / INDUSTRIAL DRESSING ----------------
export const Street = {
  lampPost(B, x, y, z, broken = false) {
    B.add(cylGeo(0.08, 0.12, 6.2, 8), M.steel, x, y + 3.1, z);
    B.add(boxGeo(1.4, 0.1, 0.1), M.steel, x + Math.cos(0) * 0.7, y + 6.1, z);
    if (!broken) {
      B.add(boxGeo(0.5, 0.18, 0.3), M.metalPaint, x + 1.2, y + 6.0, z);
    }
    B.collideBox(x - 0.15, y, z - 0.15, x + 0.15, y + 6.2, z + 0.15, 'pole');
  },
  powerPole(B, x, y, z, ry = 0) {
    B.add(cylGeo(0.13, 0.18, 8.5, 7), M.woodWeathered, x, y + 4.25, z, [0, ry, 0]);
    B.add(boxGeo(2.2, 0.12, 0.12), M.woodWeathered, x, y + 7.6, z, [0, ry, 0]);
    for (const s of [-1, 1]) B.add(boxGeo(0.1, 0.22, 0.1), M.tiles, x + s * 0.9 * Math.cos(ry), y + 7.78, z - s * 0.9 * Math.sin(ry));
    B.collideBox(x - 0.2, y, z - 0.2, x + 0.2, y + 8.5, z + 0.2, 'pole');
  },
  fence(B, x0, z0, x1, z1, y, h = 2.0, kind = 'chain') {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(2, Math.round(len / 2.4));
    const ry = Math.atan2(x1 - x0, z1 - z0);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const px = lerp(x0, x1, t), pz = lerp(z0, z1, t);
      const py = y + 0;
      if (kind === 'chain') {
        B.add(cylGeo(0.045, 0.05, h, 5), M.steel, px, py + h / 2, pz);
      } else {
        B.add(boxGeo(0.1, h, 0.1), M.woodWeathered, px, py + h / 2, pz);
      }
    }
    if (kind === 'chain') {
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n;
        const mx = lerp(x0, x1, (t0 + t1) / 2), mz = lerp(z0, z1, (t0 + t1) / 2);
        const seg = len / n;
        B.add(boxGeo(0.02, h - 0.2, seg), plain(0x6a6a66, { transparent: true, opacity: 0.45, roughness: 0.6, metalness: 0.5, side: THREE.DoubleSide, depthWrite: false }),
          mx, y + h / 2, mz, [0, ry, 0]);
      }
    } else {
      for (let i = 1; i < 4; i++) {
        B.add(boxGeo(0.05, 0.1, len), M.woodWeathered, lerp(x0, x1, 0.5), y + (h / 3.4) * i, lerp(z0, z1, 0.5), [0, ry, 0]);
      }
    }
    B.collideBox(Math.min(x0, x1) - 0.1, y, Math.min(z0, z1) - 0.1, Math.max(x0, x1) + 0.1, y + h, Math.max(z0, z1) + 0.1, 'fence');
  },
  rubblePile(B, x, y, z, rng, radius = 1.8) {
    const n = Math.round(radius * 7);
    for (let i = 0; i < n; i++) {
      const a = rng.range(0, Math.PI * 2), r = rng.range(0, radius);
      const s = rng.range(0.15, 0.7);
      B.add(boxGeo(s, s * rng.range(0.4, 1), s * rng.range(0.6, 1.4)),
        rng.chance(0.6) ? M.concrete : M.brick,
        x + Math.cos(a) * r, y + s * 0.3, z + Math.sin(a) * r,
        [rng.range(0, 0.5), rng.range(0, 6.28), rng.range(0, 0.5)]);
    }
  },
  trafficCone(B, x, y, z) {
    B.add(boxGeo(0.36, 0.04, 0.36), M.hazard, x, y + 0.02, z);
    B.add(cylGeo(0.02, 0.15, 0.6, 8), plain(0xc4642e, { roughness: 0.85 }), x, y + 0.32, z);
  },
  jersey(B, x, y, z, ry = 0, len = 3) {
    B.add(boxGeo(len, 0.3, 0.5), M.concrete, x, y + 0.15, z, [0, ry, 0]);
    B.add(boxGeo(len - 0.2, 0.5, 0.32), M.concrete, x, y + 0.55, z, [0, ry, 0]);
    B.collideBox(x - len / 2, y, z - 0.3, x + len / 2, y + 0.85, z + 0.3, 'cover');
  },
  generator(B, x, y, z, ry = 0) {
    B.add(boxGeo(1.7, 1.0, 0.9), M.metalPaint, x, y + 0.5, z, [0, ry, 0]);
    B.add(cylGeo(0.08, 0.08, 0.9, 6), M.rust, x + 0.6, y + 1.2, z);
    B.add(boxGeo(0.5, 0.35, 0.05), M.hazard, x - 0.3, y + 0.6, z + 0.47, [0, ry, 0]);
    B.collideBox(x - 0.9, y, z - 0.5, x + 0.9, y + 1.1, z + 0.5, 'prop');
  },
  radioTower(B, x, y, z, h = 14, rng) {
    const segs = 5;
    for (let i = 0; i < segs; i++) {
      const y0 = y + (h / segs) * i, y1 = y + (h / segs) * (i + 1);
      const r0 = lerp(0.9, 0.2, i / segs), r1 = lerp(0.9, 0.2, (i + 1) / segs);
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2;
        const bx = x + Math.cos(a) * r0, bz = z + Math.sin(a) * r0;
        const tx = x + Math.cos(a) * r1, tz = z + Math.sin(a) * r1;
        const mx = (bx + tx) / 2, mz = (bz + tz) / 2;
        const len = Math.hypot(tx - bx, tz - bz, y1 - y0);
        const gy = Math.atan2(tz - bz, tx - bx);
        B.add(boxGeo(0.08, len, 0.08), M.steel, mx, (y0 + y1) / 2, mz, [0, 0, 0]);
        // cross braces
        B.add(boxGeo(0.05, len * 0.98, 0.05), M.steel, (mx + x) / 2, (y0 + y1) / 2, (mz + z) / 2);
      }
      B.add(boxGeo(r0 * 2, 0.08, r0 * 2), M.steel, x, y1, z);
    }
    B.add(cylGeo(0.05, 0.05, 2.4, 5), M.steel, x, y + h + 1.2, z);
    B.collideBox(x - 1, y, z - 1, x + 1, y + h, z + 1, 'pole');
  },
  watchtower(B, x, y, z, h = 6) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      B.add(boxGeo(0.16, h, 0.16), M.woodWeathered, x + sx * 1.4, y + h / 2, z + sz * 1.4);
    }
    B.add(boxGeo(3.2, 0.2, 3.2), M.wood, x, y + h, z);
    // cabin
    B.add(boxGeo(3.0, 0.9, 3.0), M.woodWeathered, x, y + h + 0.45, z);
    B.add(boxGeo(3.2, 0.15, 3.2), M.corrugated, x, y + h + 2.1, z);
    B.add(boxGeo(3.0, 0.35, 0.1), M.wood, x, y + h + 1.5, z + 1.5);
    for (const sx of [-1, 1]) B.add(boxGeo(0.1, 0.35, 3.0), M.wood, x + sx * 1.5, y + h + 1.5, z);
    B.collideBox(x - 1.6, y, z - 1.6, x + 1.6, y + h + 2.2, z + 1.6, 'tower');
  },
  barbedWire(B, x0, z0, x1, z1, y) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const ry = Math.atan2(x1 - x0, z1 - z0);
    for (let i = 0; i < 3; i++) {
      B.add(boxGeo(0.03, 0.03, len), M.rust, (x0 + x1) / 2, y + 0.8 + i * 0.35, (z0 + z1) / 2, [0, ry, 0]);
    }
  },
  pipes(B, x, y, z, ry = 0, len = 6) {
    for (let i = 0; i < 3; i++) {
      B.add(cylGeo(0.18, 0.18, len, 8), M.rust, x, y + 0.6 + i * 0.45, z, [0, ry, Math.PI / 2]);
    }
    for (let i = 0; i < 2; i++) B.add(boxGeo(0.15, 1.6, 0.15), M.steel, x + (len / 2 - 0.6) * (i ? 1 : -1) * Math.cos(ry), y + 0.8, z - (len / 2 - 0.6) * (i ? 1 : -1) * Math.sin(ry));
    B.collideBox(x - len / 2, y, z - 0.5, x + len / 2, y + 1.2, z + 0.5, 'prop');
  },
  pipesVertical(B, x, y, z, h = 8) {
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      B.add(cylGeo(0.16, 0.16, h, 8), M.rust, x + i * 0.42, y + h / 2, z + j * 0.42);
    }
    for (let k = 1; k < 4; k++) B.add(boxGeo(0.5, 0.12, 0.12), M.steel, x + 0.21, y + k * 2.0, z + 0.21, [Math.PI / 2, 0, 0]);
    B.collideBox(x - 0.2, y, z - 0.2, x + 0.7, y + h, z + 0.7, 'pipe');
  },
};

// ---------------- INTERACTIVE PROPS (dynamic objects) ----------------
export function makeLootMesh(kind, rng) {
  const g = new THREE.Group();
  const add = (geo, m, x, y, z, ry = 0) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z); mesh.rotation.y = ry;
    mesh.castShadow = true; mesh.receiveShadow = true;
    g.add(mesh); return mesh;
  };
  if (kind === 'crate') {
    add(boxGeo(0.8, 0.62, 0.8), M.wood, 0, 0.31, 0);
    add(boxGeo(0.84, 0.05, 0.84), M.woodWeathered, 0, 0.63, 0);
  } else if (kind === 'cabinet') {
    add(boxGeo(0.7, 1.6, 0.4), M.metalPaint, 0, 0.8, 0);
    add(boxGeo(0.06, 0.02, 0.02), M.steel, 0.22, 0.9, 0.21);
  } else if (kind === 'drawer') {
    add(boxGeo(0.9, 0.5, 0.6), M.woodWeathered, 0, 0.25, 0);
    add(boxGeo(0.85, 0.06, 0.55), M.steel, 0, 0.42, 0);
  } else if (kind === 'toolbox') {
    add(boxGeo(0.6, 0.3, 0.35), M.rust, 0, 0.15, 0);
    add(boxGeo(0.5, 0.05, 0.05), M.steel, 0, 0.34, 0);
  } else if (kind === 'body') {
    // dead body — environmental storytelling + loot
    const torso = add(boxGeo(0.42, 0.28, 0.85), M.fabric, 0, 0.14, 0, rng.range(0, 6.28));
    add(sphereGeo(0.14, 8), M.flesh, 0.1, 0.16, -0.5);
    for (const s of [-1, 1]) add(boxGeo(0.13, 0.13, 0.55), M.fabric, s * 0.25, 0.1, 0.1, rng.range(-0.4, 0.4));
  } else if (kind === 'medbox') {
    add(boxGeo(0.5, 0.2, 0.35), M.paper, 0, 0.1, 0);
    add(boxGeo(0.14, 0.03, 0.03), plain(0xa33a2a), 0, 0.22, 0);
  } else if (kind === 'cash') {
    add(boxGeo(0.5, 0.45, 0.5), M.steel, 0, 0.22, 0);
    add(boxGeo(0.46, 0.02, 0.46), M.panel, 0, 0.46, 0);
  } else if (kind === 'stash') {
    add(boxGeo(1.0, 0.7, 0.7), M.woodWeathered, 0, 0.35, 0);
    add(boxGeo(1.02, 0.08, 0.72), M.rust, 0, 0.72, 0);
    add(boxGeo(0.1, 0.25, 0.05), M.steel, 0.4, 0.55, 0.36);
  } else {
    add(boxGeo(0.5, 0.4, 0.5), M.wood, 0, 0.2, 0);
  }
  g.userData.kind = kind;
  return g;
}

export function makeDoorMesh(w = 1.05, h = 2.1, kind = 'wood') {
  const g = new THREE.Group();
  const m = kind === 'metal' ? M.metalPaint : M.wood;
  const slab = new THREE.Mesh(boxGeo(w, h, 0.07), m);
  slab.position.set(w / 2, h / 2, 0);
  slab.castShadow = true; slab.receiveShadow = true;
  g.add(slab);
  const handle = new THREE.Mesh(cylGeo(0.02, 0.02, 0.12, 6), M.steel);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(w - 0.12, h * 0.48, 0.09);
  g.add(handle);
  if (kind === 'wood') {
    for (let i = 0; i < 2; i++) {
      const p = new THREE.Mesh(boxGeo(w * 0.9, 0.06, 0.02), M.steel);
      p.position.set(w / 2, h * 0.3 + i * h * 0.4, 0.05);
      g.add(p);
    }
  }
  g.userData.door = { w, h, open: 0, target: 0 };
  return g;
}

export { VEHICLE_TYPES, mergeAll };
