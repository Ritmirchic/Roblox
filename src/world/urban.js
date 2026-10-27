/**
 * Urban density generators: high-rise blocks, ruined shells, row houses,
 * storefronts, street furniture and infrastructure. These fill the city and
 * suburb grids so no street reads as empty, while keeping interiors real.
 */
import * as THREE from 'three';
import { roomShell, wallWithOpening, wallWithOpeningZ, flatRoof, stairs, railing, catwalk, windowedWall } from '../engine/geom.js';
import * as P from './props.js';
import { makeRng } from '../engine/util.js';

const rng = makeRng(5150);

function loot(ctx, profile, x, y, z, type = 'crate', rot = 0) {
  ctx.addLoot({ profile, x, y, z, type, rot });
}

/**
 * Repeating facade: window bays with recessed glass, sills, lintels and a
 * percentage of boarded-up or blown-out units.
 */
export function facade(b, ctx, { x, z, w, d, y0, floorH, floors, bays = 4, mat = 'concrete', style = 'office', brokenness = 0.35, seed = 1 }) {
  const r = makeRng(seed);
  const sides = [
    { axis: 'x', sign: 1, len: w, off: d / 2 },
    { axis: 'x', sign: -1, len: w, off: d / 2 },
    { axis: 'z', sign: 1, len: d, off: w / 2 },
    { axis: 'z', sign: -1, len: d, off: w / 2 },
  ];
  for (const s of sides) {
    const n = s.axis === 'x' ? Math.max(2, Math.round(bays * (s.len / Math.max(w, d)))) : Math.max(2, Math.round(bays * 0.7 * (s.len / Math.max(w, d))));
    for (let f = 0; f < floors; f++) {
      const fy = y0 + f * floorH;
      for (let i = 0; i < n; i++) {
        if (r() < 0.12) continue; // blank pier
        const t = (i + 0.5) / n;
        const along = (t - 0.5) * s.len * 0.86;
        const ww = style === 'residential' ? 1.1 : 1.7;
        const wh = style === 'residential' ? 1.15 : 1.5;
        const bay = style === 'office' ? 1.0 : 0.9;
        const pos = s.off + 0.02;
        const px = s.axis === 'x' ? x + along : x + pos;
        const pz = s.axis === 'x' ? z + s.sign * pos : z + along;
        const rotY = s.axis === 'x' ? 0 : Math.PI / 2;
        // frame
        b.box(px, fy + wh / 2 + bay, pz, s.axis === 'x' ? ww + 0.22 : 0.16, wh + 0.22, s.axis === 'x' ? 0.16 : ww + 0.22, 'wood', { tex: 0.6, rotY, collide: false, tint: [0.4, 0.37, 0.32] });
        // glass or boarded
        const broken = r() < brokenness;
        if (broken && r() < 0.5) {
          b.box(px, fy + wh / 2 + bay, pz, s.axis === 'x' ? ww : 0.06, wh, s.axis === 'x' ? 0.06 : ww, 'wood', { tex: 0.9, rotY, collide: false, tint: [0.36, 0.3, 0.22] });
        } else {
          b.box(px, fy + wh / 2 + bay, pz, s.axis === 'x' ? ww : 0.05, wh, s.axis === 'x' ? 0.05 : ww, 'glass', { tex: 1.1, rotY, collide: false, tint: broken ? [0.16, 0.2, 0.2] : [0.5, 0.6, 0.62] });
        }
        // sill + lintel
        b.box(px, fy + bay - 0.05, pz, s.axis === 'x' ? ww + 0.4 : 0.26, 0.1, s.axis === 'x' ? 0.26 : ww + 0.4, 'concrete', { tex: 0.7, rotY, collide: false, tint: [0.72, 0.7, 0.66] });
        b.box(px, fy + wh + bay + 0.06, pz, s.axis === 'x' ? ww + 0.4 : 0.24, 0.12, s.axis === 'x' ? 0.24 : ww + 0.4, 'concrete', { tex: 0.7, rotY, collide: false, tint: [0.68, 0.66, 0.62] });
        // occasional air conditioner / balcony rail
        if (r() < 0.12) {
          b.box(px, fy + bay - 0.25, pz, 0.5, 0.4, 0.34, 'metalPlate', { tex: 0.5, rotY, collide: false, tint: [0.55, 0.56, 0.54] });
        }
      }
      // floor band
      b.box(x, fy + floorH - 0.09, z, w + 0.16, 0.18, d + 0.16, 'concrete', { tex: 1.4, collide: false, tint: [0.74, 0.72, 0.68] });
    }
  }
}

/**
 * Damaged high-rise. Enterable lobby and two apartment floors, then a
 * collapsed upper section with exposed floors.
 */
export function tower(ctx, x, z, { w = 16, d = 14, floors = 8, mat = 'concrete', name = 'Office Block', style = 'office', seed = 1, rot = 0 } = {}) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  const base = gy + 0.25;
  const fh = 3.2;
  const accessible = Math.min(floors, 5);
  const r = makeRng(seed + 7);
  ctx.addPad(x, z, w + 9, d + 9, gy);
  ctx.occupy(x, z, w + 6, d + 6);
  // sidewalk apron + kerb around the footprint
  b.box(x, gy + 0.07, z, w + 8, 0.14, d + 8, 'concrete', { tex: 6, collideTag: 'floor', tint: [0.74, 0.73, 0.7] });
  b.box(x, gy + 0.16, z, w + 0.6, 0.32, d + 0.6, 'concrete', { tex: 4, collideTag: 'floor' });
  const wallStyle = { concrete: { mat: 'concrete', tex: 3.2 }, brick: { mat: 'brick', tex: 3 }, plaster: { mat: 'plaster', tex: 2.8 }, metal: { mat: 'metalPlate', tex: 2 } }[mat] || { mat: 'concrete', tex: 3 };
  const tint = r() < 0.5 ? [0.92, 0.9, 0.85] : [0.82, 0.8, 0.76];

  for (let f = 0; f < accessible; f++) {
    const fy = base + f * fh;
    if (f > 0) b.box(x, fy - 0.1, z, w, 0.2, d, 'concreteFloor', { tex: 4, collideTag: 'floor' });
    // exterior walls with real window openings
    const baysX = Math.max(3, Math.round(w / 3.6));
    const baysZ = Math.max(2, Math.round(d / 3.6));
    const doorBay = Math.floor(baysX / 2);
    windowedWall(b, { x0: x - w / 2, z0: z + d / 2, x1: x + w / 2, z1: z + d / 2, y0: fy, y1: fy + fh, mat: wallStyle.mat, tex: wallStyle.tex, bays: baysX, floors: 1, sill: 0.9, head: 2.1, tint, seed: seed + f * 13 + 1, door: f === 0 ? { bay: doorBay } : null, brokenness: 0.34 });
    windowedWall(b, { x0: x - w / 2, z0: z - d / 2, x1: x + w / 2, z1: z - d / 2, y0: fy, y1: fy + fh, mat: wallStyle.mat, tex: wallStyle.tex, bays: baysZ, floors: 1, sill: 0.9, head: 2.1, tint, seed: seed + f * 17 + 2, brokenness: 0.42 });
    windowedWall(b, { x0: x - w / 2, z0: z - d / 2, x1: x - w / 2, z1: z + d / 2, y0: fy, y1: fy + fh, mat: wallStyle.mat, tex: wallStyle.tex, bays: baysZ, floors: 1, sill: 0.9, head: 2.1, tint, seed: seed + f * 19 + 3, brokenness: 0.5 });
    windowedWall(b, { x0: x + w / 2, z0: z - d / 2, x1: x + w / 2, z1: z + d / 2, y0: fy, y1: fy + fh, mat: wallStyle.mat, tex: wallStyle.tex, bays: baysZ, floors: 1, sill: 0.9, head: 2.1, tint, seed: seed + f * 23 + 4, brokenness: 0.36 });
    if (f === 0) {
      // lobby: reception, benches, noticeboard, corpse, debris
      b.box(x - w / 4, fy + 1.05, z + d / 2 - 3.2, 3.4, 1.1, 0.9, 'wood', { tex: 1.2, tint: [0.55, 0.44, 0.34] });
      b.box(x - w / 4, fy + 1.2, z + d / 2 - 3.9, 2.2, 1.2, 0.1, 'plaster', { tex: 1.5, collide: false, tint: [0.6, 0.58, 0.5] });
      P.sofa(b, x + w / 2 - 3, z - d / 2 + 2, fy, 0, 2.0);
      P.cabinet(b, x + w / 2 - 1.2, z - d / 2 + 0.8, fy, 0);
      P.corpse(b, x - 2.0, z - 1.0, fy, 0.8);
      P.rubble(b, x + 2.4, z + d / 2 - 2.2, fy, 1.2, 5);
      loot(ctx, 'office', x - w / 4, fy, z + d / 2 - 3.4, 'desk');
      loot(ctx, 'locker', x + w / 2 - 1.2, fy, z - d / 2 + 1.2, 'cabinet');
      ctx.addLight(x, fy + 2.8, z, 0xffd0a0, 12, 14);
      b.box(x - w / 2 + 1.6, fy + 0.06, z + d / 2 - 1.2, 2.2, 0.06, 3.6, 'fabric', { tex: 1, collide: false, tint: [0.36, 0.32, 0.28] });
      // entrance canopy + steps + sign
      b.box(x + 1.5, base + 2.85, z + d / 2 + 1.0, 5.0, 0.16, 2.4, 'metalPlate', { tex: 1.4, collide: false, tint: [0.45, 0.46, 0.44] });
      b.box(x - 1.0, base + 1.4, z + d / 2 + 2.1, 0.18, 2.8, 0.18, 'metalPlate', { tex: 0.6, tint: [0.4, 0.4, 0.38] });
      b.box(x + 4.0, base + 1.4, z + d / 2 + 2.1, 0.18, 2.8, 0.18, 'metalPlate', { tex: 0.6, tint: [0.4, 0.4, 0.38] });
      if (ctx.textures?.signTexture) {
        const sign = ctx.textures.signTexture(name.toUpperCase(), { bg: '#20241f', fg: '#c8c4b4', accent: '#a8412c' });
        b.raw(new THREE.PlaneGeometry(4.4, 0.8), new THREE.Matrix4().makeTranslation(x + 1.5, base + 3.2, z + d / 2 + 2.24), sign);
      }
    } else {
      // furnished floor
      wallWithOpening(b, { x0: x - w / 2 + 0.3, x1: x + w / 2 - 0.3, z: z - d / 2 + 3.2, y0: fy, y1: fy + fh, mat: 'plaster', open: { x: x + 2.0, w: 1.3, y0: fy, y1: fy + 2.2 } });
      wallWithOpeningZ(b, { z0: z - d / 2 + 0.3, z1: z + d / 2 - 0.3, x: x + 1.0, y0: fy, y1: fy + fh, mat: 'plaster', open: { z: z + 1.0, w: 1.2, y0: fy, y1: fy + 2.2 } });
      for (let i = 0; i < 3; i++) {
        P.desk(b, x - w / 2 + 2.6 + i * 3.0, z + 0.4, fy, Math.PI / 2);
        P.chair(b, x - w / 2 + 2.6 + i * 3.0, z + 1.6, fy, Math.PI);
      }
      P.shelf(b, x + w / 2 - 1.4, z + d / 2 - 1.4, fy, Math.PI / 2);
      P.cabinet(b, x - w / 2 + 1.2, z - d / 2 + 1.2, fy, 0);
      P.corpse(b, x + 3.0, z - 2.4, fy, rng() * 6.28);
      P.rubble(b, x - 1.0, z + 2.0, fy, 1.0, 4);
      loot(ctx, 'office', x - w / 2 + 2.6, fy, z + 0.4, 'desk');
      loot(ctx, 'office', x + w / 2 - 1.4, fy, z + d / 2 - 1.4, 'shelf');
      if (f % 2 === 0) ctx.addLight(x, fy + 2.8, z - 1.0, 0xffd0a0, 10, 13);
    }
    if (f < accessible - 1) {
      stairs(b, { x: x - w / 2 + 2.6, z: z + d / 2 - 3.2, y0: fy, dir: 'w', width: 1.5, steps: 10, rise: fh / 10, run: 0.3, mat: 'concrete' });
    }
  }
  // upper section: intact facade with a collapsed corner, or a full break
  const topY = base + accessible * fh;
  const upper = floors - accessible;
  const intact = r() < 0.45;
  if (intact && upper > 0) {
    // keep building above but unlit and closed
    const upFloors = Math.min(upper, 4);
    for (let f = 0; f < upFloors; f++) {
      const fy = topY + f * fh;
      b.box(x, fy - 0.1, z, w, 0.2, d, 'concreteFloor', { tex: 4, collide: false });
      const baysX = Math.max(3, Math.round(w / 3.6));
      const baysZ = Math.max(2, Math.round(d / 3.6));
      windowedWall(b, { x0: x - w / 2, z0: z + d / 2, x1: x + w / 2, z1: z + d / 2, y0: fy, y1: fy + fh, mat: wallStyle.mat, tex: wallStyle.tex, bays: baysX, floors: 1, tint, seed: seed + 300 + f, brokenness: 0.75 });
      windowedWall(b, { x0: x - w / 2, z0: z - d / 2, x1: x + w / 2, z1: z - d / 2, y0: fy, y1: fy + fh, mat: wallStyle.mat, tex: wallStyle.tex, bays: baysZ, floors: 1, tint, seed: seed + 320 + f, brokenness: 0.85 });
      windowedWall(b, { x0: x - w / 2, z0: z - d / 2, x1: x - w / 2, z1: z + d / 2, y0: fy, y1: fy + fh, mat: wallStyle.mat, tex: wallStyle.tex, bays: baysZ, floors: 1, tint, seed: seed + 340 + f, brokenness: 0.8 });
      windowedWall(b, { x0: x + w / 2, z0: z - d / 2, x1: x + w / 2, z1: z + d / 2, y0: fy, y1: fy + fh, mat: wallStyle.mat, tex: wallStyle.tex, bays: baysZ, floors: 1, tint, seed: seed + 360 + f, brokenness: 0.7 });
    }
    flatRoof(b, { x, z, w: w + 0.4, d: d + 0.4, y: topY + upFloors * fh, mat: 'roof' });
    const roofY = topY + upFloors * fh;
    b.box(x + w / 4, roofY + 0.65, z - d / 4, 2.4, 1.3, 2.0, 'metalPlate', { tex: 1.2, tint: [0.5, 0.5, 0.48] });
    b.box(x - w / 4, roofY + 1.5, z, 0.3, 3.0, 0.3, 'rust', { tex: 0.6, collide: false });
    P.antennaMast(b, x + 2, z + 2, roofY, 9);
  } else {
    // collapsed top: exposed slab stack, snapped piers and hanging rebar
    const r2 = makeRng(seed + 99);
    const stack = 1 + Math.floor(r2() * 3);
    for (let f = 0; f < stack; f++) {
      const fy = topY + f * fh;
      const shrinkW = w * (1 - f * 0.07);
      const shrinkD = d * (1 - f * 0.05);
      if (shrinkW < 4) break;
      b.box(x + (r2() - 0.5) * 1.2, fy, z + (r2() - 0.5) * 1.2, shrinkW, 0.22, shrinkD, 'concreteFloor', { tex: 4, collide: false });
      const piers = 5;
      for (let i = 0; i < piers; i++) {
        if (r2() < 0.45) continue;
        const t = (i / (piers - 1) - 0.5) * shrinkW * 0.9;
        const hh = fh * (0.4 + r2() * 0.6);
        b.box(x + t, fy + hh / 2, z + shrinkD / 2, 0.55, hh, 0.5, wallStyle.mat, { tex: 2, collide: false, tint });
        b.box(x + t, fy + hh / 2, z - shrinkD / 2, 0.55, hh, 0.5, wallStyle.mat, { tex: 2, collide: false, tint });
      }
      for (let i = 0; i < 6; i++) {
        b.box(x + (r2() - 0.5) * shrinkW * 0.9, fy + fh * (0.1 + r2() * 0.7), z + shrinkD / 2, 0.05, 0.7 + r2(), 0.05, 'rust', { tex: 0.4, collide: false });
      }
      // rubble falling to the street
      if (f === 0) P.rubble(b, x + w * 0.4, z + d * 0.3, base, 2.2, 8);
    }
    P.rubble(b, x + w / 2 + 2.0, z + d / 2 + 2.0, gy, 3.0, 10);
    P.rock(b, x + w / 2 + 2.6, z + d / 2 + 1.4, gy + 0.2, 1.4);
  }
  ctx.markLocation({ type: 'tower', x, z, y: gy, name, icon: 'building' });
  if (rng() < 0.4) ctx.addNest?.({ x: x + w / 2 + 4, z: z - d / 2 - 4, name: 'Rooftop Nest' });
}

/** Two-storey row house with a shop front on the ground floor. */
export function rowHouse(ctx, x, z, rot = 0, { w = 7, d = 9, shop = 'General Store', seed = 1 } = {}) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const base = gy + 0.2;
  const fh = 3.0;
  ctx.occupy(x, z, w + 2, d + 2);
  b.box(x, gy, z, w + 0.5, 0.45, d + 0.5, 'concrete', { tex: 2.4, collideTag: 'floor' });
  b.box(x, base + 0.02, z, w, 0.1, d, 'tile', { tex: 2.2, collideTag: 'floor' });
  for (let f = 0; f < 2; f++) {
    const fy = base + f * fh;
    if (f === 1) b.box(x, fy - 0.06, z, w, 0.14, d, 'woodFloor', { tex: 2.2, collideTag: 'floor' });
    roomShell(b, { x, z, w, d, y0: fy, h: fh, mat: 'brick', thickness: 0.24, tex: 2.2, doors: f === 0 ? [{ side: 'south', x, w: 1.9, y0: fy, y1: fy + 2.4 }] : [] });
    if (f === 0) {
      // store front: counter, shelves, register, stockroom
      b.box(x, fy + 1.0, z + 0.6, w - 1.2, 1.0, 0.8, 'wood', { tex: 1.4, tint: [0.52, 0.42, 0.32] });
      for (let i = 0; i < 3; i++) P.shelf(b, x - w / 2 + 1.0 + i * 2.2, z - d / 2 + 0.8, fy, 0, 0.9, 1.9, 0.42);
      P.cabinet(b, x + w / 2 - 0.9, z - 1.2, fy, Math.PI / 2);
      b.box(x - w / 2 + 0.4, fy + 1.9, z + d / 2 - 0.2, 0.1, 0.7, 2.4, 'metalPlate', { tex: 0.8, collide: false, tint: [0.3, 0.3, 0.3] });
      loot(ctx, 'store', x, fy, z + 0.2, 'counter');
      loot(ctx, 'store', x + w / 2 - 1.2, fy, z - d / 2 + 1.2, 'shelf');
      ctx.addLight(x, fy + 2.7, z, 0xffcf9a, 9, 11);
      if (ctx.textures?.signTexture) {
        const sign = ctx.textures.signTexture(shop.toUpperCase(), { bg: '#2a2018', fg: '#d9c9a0', accent: '#b04a2a' });
        b.raw(new THREE.PlaneGeometry(w * 0.8, 0.8), new THREE.Matrix4().makeTranslation(x, fy + 2.62, z + d / 2 + 0.14), sign);
      }
      // awning
      b.box(x, fy + 2.35, z + d / 2 + 0.62, w * 0.86, 0.1, 1.3, 'fabric', { tex: 1.2, rotY: rot, collide: false, tint: [0.5, 0.24, 0.18] });
    } else {
      // flat above
      P.bed(b, x - w / 2 + 1.6, z - d / 2 + 2.0, fy, 0);
      P.table(b, x + 1.4, z + 1.2, fy, Math.PI / 2, 1.2, 0.7);
      P.chair(b, x + 1.4, z + 0.4, fy, Math.PI);
      P.sinkCounter(b, x + w / 2 - 1.6, z - d / 2 + 1.0, fy, Math.PI / 2, 1.4);
      P.corpse(b, x + 0.4, z - 2.4, fy, 2.1);
      loot(ctx, 'house', x + 1.4, fy, z + 1.2, 'drawer');
      loot(ctx, 'house', x - w / 2 + 1.6, fy, z - d / 2 + 1.0, 'wardrobe');
      ctx.addLight(x, fy + 2.6, z, 0xffc890, 7, 9);
      stairs(b, { x: x + w / 2 - 1.4, z: z + 2.2, y0: fy - fh, dir: 'n', width: 1.1, steps: 9, rise: fh / 9, run: 0.28, mat: 'wood' });
    }
    // window bays on the street side
    const bays = Math.max(2, Math.floor(w / 2.6));
    for (let i = 0; i < bays; i++) {
      const t = (i + 0.5) / bays;
      const lx = (t - 0.5) * w * 0.84;
      const wx = x + lx * c;
      const wz = z + d / 2 + lx * s;
      b.box(wx, fy + 1.75, wz + 0.02, 1.05, 1.15, 0.1, 'glass', { tex: 0.9, rotY: rot, collide: false, tint: [0.22, 0.26, 0.26] });
      b.box(wx, fy + 1.15, wz + 0.06, 1.25, 0.1, 0.2, 'concrete', { tex: 0.6, rotY: rot, collide: false });
    }
  }
  b.box(x, base + 2 * fh + 0.05, z, w + 0.4, 0.3, d + 0.4, 'concrete', { tex: 2.4, collideTag: 'ceiling' });
  const parapet = [[0, -d / 2], [0, d / 2], [-w / 2, 0], [w / 2, 0]];
  for (const [px, pz] of parapet) {
    const len = pz === 0 ? d : w;
    const horiz = pz === 0;
    b.box(x + px, base + 2 * fh + 0.55, z + pz, horiz ? 0.22 : len, 0.7, horiz ? len : 0.22, 'brick', { tex: 1.6, collide: false, tint: [0.6, 0.5, 0.42] });
  }
  // rooftop water tank + vents
  b.cylinder(x + 1.0 * c, base + 2 * fh + 1.4, z + 1.0 * s, 1.2, 1.2, 2.0, 'rust', { seg: 10, tex: 1.2 });
  b.box(x - 1.6, base + 2 * fh + 0.6, z - 1.2, 0.8, 0.6, 0.8, 'metalPlate', { tex: 0.8, collide: false, tint: [0.5, 0.5, 0.48] });
  ctx.markLocation({ type: 'shop', x, z, y: gy, name: shop, icon: 'shop' });
}

/** Ruined shell: walls, floors and no roof. Good for combat arenas. */
export function ruin(ctx, x, z, { w = 14, d = 12, floors = 3, seed = 1, mat = 'brick', name = 'Ruined Block' } = {}) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  const base = gy + 0.1;
  const fh = 3.0;
  const r = makeRng(seed);
  ctx.occupy(x, z, w + 3, d + 3);
  b.box(x, gy, z, w + 0.6, 0.3, d + 0.6, 'concrete', { tex: 3, collideTag: 'floor' });
  for (let f = 0; f < floors; f++) {
    const fy = base + f * fh;
    if (f > 0) b.box(x, fy - 0.08, z, w, 0.16, d, 'concreteFloor', { tex: 3.2, collideTag: 'floor' });
    // perimeter wall chunks
    const per = [
      { x0: x - w / 2, z0: z - d / 2, x1: x + w / 2, z1: z - d / 2 },
      { x0: x - w / 2, z0: z + d / 2, x1: x + w / 2, z1: z + d / 2 },
      { x0: x - w / 2, z0: z - d / 2, x1: x - w / 2, z1: z + d / 2 },
      { x0: x + w / 2, z0: z - d / 2, x1: x + w / 2, z1: z + d / 2 },
    ];
    for (const e of per) {
      const len = Math.hypot(e.x1 - e.x0, e.z1 - e.z0);
      const segs = Math.max(2, Math.round(len / 2.2));
      for (let i = 0; i < segs; i++) {
        if (r() < 0.22) continue;
        const t0 = i / segs;
        const t1 = (i + 1) / segs;
        const mx = e.x0 + (e.x1 - e.x0) * ((t0 + t1) / 2);
        const mz = e.z0 + (e.z1 - e.z0) * ((t0 + t1) / 2);
        const horiz = Math.abs(e.x1 - e.x0) > 0.1;
        const hh = fh * (0.55 + r() * 0.45);
        b.box(mx, fy + hh / 2, mz, horiz ? len / segs : 0.3, hh, horiz ? 0.3 : len / segs, mat, { tex: 2, collideTag: 'wall', tint: [0.62, 0.56, 0.48] });
      }
    }
    // fallen slab leaning inside
    if (r() < 0.4) {
      const ang = r() * 1.2 - 0.6;
      b.box(x + (r() - 0.5) * w * 0.5, fy + 0.9, z + (r() - 0.5) * d * 0.5, w * 0.4, 0.2, d * 0.3, 'concreteFloor', { tex: 2, rotZ: ang, collideTag: 'floor', tint: [0.7, 0.68, 0.64] });
    }
    P.rubble(b, x + (r() - 0.5) * w * 0.6, z + (r() - 0.5) * d * 0.6, fy, 1.6, 6);
    if (r() < 0.5) P.corpse(b, x + (r() - 0.5) * w * 0.5, z + (r() - 0.5) * d * 0.5, fy, r() * 6.28);
  }
  // exposed rebar + rubble skirt outside
  for (let i = 0; i < 10; i++) {
    const a = r() * Math.PI * 2;
    const rr = (w / 2 + 1.5) * (0.7 + r() * 0.5);
    b.box(x + Math.cos(a) * rr, gy + 0.2, z + Math.sin(a) * rr, 0.6 + r(), 0.3 + r() * 0.5, 0.6 + r(), 'concrete', { tex: 1.2, collide: false, rotY: r() * 6.28, tint: [0.62, 0.6, 0.55] });
  }
  loot(ctx, 'ruin', x + 2, base, z - 2, 'crate');
  loot(ctx, 'ruin', x - 3, base + fh, z + 1, 'locker');
  ctx.markLocation({ type: 'ruin', x, z, y: gy, name, icon: 'ruin' });
}

/** Roadside bus shelter with benches and a route map. */
export function busShelter(ctx, x, z, rot = 0) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  b.box(x, gy + 2.5, z, 3.6, 0.16, 1.8, 'metalPlate', { tex: 1.2, rotY: rot, tint: [0.36, 0.38, 0.36] });
  for (const [ox, oz] of [[-1.7, -0.8], [1.7, -0.8], [-1.7, 0.8], [1.7, 0.8]]) {
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    b.box(x + ox * c - oz * s, gy + 1.25, z + ox * s + oz * c, 0.1, 2.5, 0.1, 'metalPlate', { tex: 0.6, rotY: rot, tint: [0.4, 0.42, 0.4] });
  }
  b.box(x, gy + 1.3, z - 0.8, 3.4, 1.6, 0.06, 'glass', { tex: 1.2, rotY: rot, collide: false, tint: [0.3, 0.35, 0.35] });
  b.box(x, gy + 0.48, z + 0.35, 2.6, 0.08, 0.5, 'wood', { tex: 0.9, rotY: rot, tint: [0.5, 0.42, 0.32] });
  b.box(x, gy + 0.24, z + 0.35, 2.4, 0.4, 0.3, 'metalPlate', { tex: 0.6, rotY: rot, collide: false, tint: [0.35, 0.36, 0.34] });
  loot(ctx, 'street', x + 1.2, gy, z + 0.2, 'bench');
}

/** Kiosk: small lockable shop box. */
export function kiosk(ctx, x, z, rot = 0) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  b.box(x, gy + 0.15, z, 3.2, 0.3, 2.6, 'concrete', { tex: 1.4, rotY: rot, collideTag: 'floor' });
  roomShell(b, { x, z, w: 3.0, d: 2.4, y0: gy + 0.3, h: 2.5, mat: 'metalPlate', thickness: 0.14, tex: 1.4, doors: [{ side: 'south', x, w: 1.2, y0: gy + 0.3, y1: gy + 2.2 }] });
  flatRoof(b, { x, z, w: 3.4, d: 2.8, y: gy + 2.8, mat: 'metalPlate' });
  b.box(x, gy + 1.4, z + 1.24, 1.4, 1.0, 0.1, 'glass', { tex: 0.8, rotY: rot, collide: false, tint: [0.3, 0.35, 0.34] });
  loot(ctx, 'store', x, gy + 0.3, z, 'counter');
  ctx.addLight(x, gy + 2.3, z, 0xffcf90, 6, 8);
}

/** Utility pylon (electricity transmission tower). */
export function pylon(ctx, x, z, h = 18) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  const legs = 2.2;
  for (const [ox, oz] of [[-legs, -legs], [legs, -legs], [-legs, legs], [legs, legs]]) {
    b.pipe(x + ox, gy, z + oz, x + ox * 0.35, gy + h, z + oz * 0.35, 0.11, 'rust', { seg: 4, tex: 1 });
  }
  for (let i = 1; i < 6; i++) {
    const y = gy + (h * i) / 6;
    const s = 1 + (1 - i / 6) * 1.4;
    b.box(x, y, z, 0.1, 0.1, legs * 2 * s, 'rust', { tex: 0.5, collide: false });
    b.box(x, y, z, legs * 2 * s, 0.1, 0.1, 'rust', { tex: 0.5, collide: false });
  }
  for (let i = 0; i < 3; i++) {
    b.box(x, gy + h - 1.5 - i * 1.2, z, 5.5 - i * 0.6, 0.12, 0.12, 'rust', { tex: 0.6, collide: false });
  }
  ctx.addLight(x, gy + h, z, 0xff3020, 2, 6);
}

/** Overpass: elevated road deck on pillars, often collapsed at one end. */
export function overpass(ctx, x, z, { len = 70, h = 6.5, rot = 0, broken = true } = {}) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  b.box(x, gy + h, z, len, 0.9, 9, 'concrete', { tex: 6, rotY: rot, collideTag: 'floor' });
  b.box(x, gy + h + 0.75, z - 4.4, len, 1.0, 0.5, 'concrete', { tex: 3, rotY: rot, collideTag: 'wall' });
  b.box(x, gy + h + 0.75, z + 4.4, len, 1.0, 0.5, 'concrete', { tex: 3, rotY: rot, collideTag: 'wall' });
  for (let i = 0; i < 4; i++) {
    const t = (i / 3 - 0.5) * len * 0.8;
    const px = x + t * c;
    const pz = z + t * s;
    if (broken && i === 3) {
      // collapsed pillar
      b.box(px, gy + 1.2, pz + 1.4, 1.2, 2.4, 3.4, 'concrete', { tex: 2, rotZ: 0.4, rotY: rot, collideTag: 'wall' });
      continue;
    }
    b.cylinder(px, gy + h / 2, pz, 1.0, 1.2, h, 'concrete', { seg: 8, tex: 2.2 });
    b.box(px, gy + h - 0.6, pz, 2.6, 0.7, 2.6, 'concrete', { tex: 1.6, rotY: rot, collide: false });
  }
  // support beams under deck
  for (let i = 0; i < 5; i++) {
    b.box(x + (i - 2) * len * 0.19 * c, gy + h - 0.9, z + (i - 2) * len * 0.19 * s, 0.4, 0.5, 8.4, 'concrete', { tex: 1.2, rotY: rot, collide: false });
  }
  if (broken) {
    // rubble under the broken end
    P.rubble(b, x - len * 0.45 * c, z - len * 0.45 * s, gy, 4.5, 14);
  }
  ctx.occupy(x, z, Math.abs(len * c) + 10, Math.abs(len * s) + 10);
}

/** Collapsed multi-storey parking structure segment. */
export function streetProps(ctx, x, z, seed = 1) {
  const r = makeRng(seed);
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  const pick = r();
  if (pick < 0.22) busShelter(ctx, x, z, r() * 3.14);
  else if (pick < 0.36) kiosk(ctx, x, z, r() * 3.14);
  else if (pick < 0.5) { P.trafficLight(b, x, z, gy, r() * 3.14); P.signpost(b, x, z, gy, r() * 3.14); }
  else if (pick < 0.7) { P.streetLamp(b, x, z, gy, r() * 3.14, { on: r() < 0.15 }); }
  else if (pick < 0.84) P.jerseyBarrier(b, x, z, gy, r() * 3.14);
  else P.rubble(b, x, z, gy, 1.6 + r() * 1.6, 8);
}
