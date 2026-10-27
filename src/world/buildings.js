/**
 * Architecture generators. Every building is a spatial layout with real rooms,
 * doors, windows, stairs, furniture, lighting and loot containers.
 */
import * as THREE from 'three';
import { roomShell, wallWithOpening, wallWithOpeningZ, flatRoof, stairs, railing, catwalk, gableRoof } from '../engine/geom.js';
import * as P from './props.js';
import { makeRng } from '../engine/util.js';

const rng = makeRng(31337);

const WALL = {
  brick: { mat: 'brick', tex: 2.4 },
  plaster: { mat: 'plaster', tex: 2.4 },
  concrete: { mat: 'concrete', tex: 3 },
  lab: { mat: 'labTile', tex: 2.4 },
  metal: { mat: 'metalPlate', tex: 2 },
  military: { mat: 'militaryMetal', tex: 2 },
};

function light(ctx, x, y, z, color = 0xffc070, intensity = 14, distance = 14) {
  ctx.addLight(x, y, z, color, intensity, distance);
}

function doorway(ctx, b, { x, z, rot = 0, w = 1.6, h = 2.25, kind = 'wood', open = true, y = null }) {
  const gy = y ?? ctx.groundY(x, z);
  ctx.addDoor({
    x, y: gy, z, rot, w, h,
    kind,
    open,
    locked: false,
  });
  // frame trim
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  b.box(x - s * (w / 2 + 0.09), gy + h / 2, z + c * (w / 2 + 0.09), 0.12, h + 0.1, 0.22, 'wood', { tex: 0.6, rotY: rot, collide: false, tint: [0.6, 0.55, 0.48] });
  b.box(x + s * (w / 2 + 0.09), gy + h / 2, z - c * (w / 2 + 0.09), 0.12, h + 0.1, 0.22, 'wood', { tex: 0.6, rotY: rot, collide: false, tint: [0.6, 0.55, 0.48] });
  b.box(x, gy + h + 0.05, z, w + 0.3, 0.12, 0.24, 'wood', { tex: 0.6, rotY: rot, collide: false, tint: [0.6, 0.55, 0.48] });
}

function windowFrame(ctx, b, { x, z, side, w = 1.2, h = 1.2, y, wallMat = 'plaster' }) {
  const axis = side === 'north' || side === 'south' ? 'x' : 'z';
  const rot = axis === 'x' ? 0 : Math.PI / 2;
  b.box(x, y + h / 2, z, axis === 'x' ? w + 0.2 : 0.14, h + 0.2, axis === 'x' ? 0.14 : w + 0.2, 'wood', { tex: 0.7, collide: false, tint: [0.55, 0.5, 0.42] });
  // glass pane
  b.box(x, y + h / 2, z, axis === 'x' ? w : 0.04, h, axis === 'x' ? 0.04 : w, 'metalPlate', { tex: 0.8, collide: false, tint: [0.16, 0.2, 0.22] });
}

function ceilingLamp(ctx, b, x, y, z, { on = false, color = 0xffd0a0, intensity = 12 } = {}) {
  b.box(x, y - 0.08, z, 0.5, 0.08, 0.22, 'metalPlate', { tex: 0.4, collide: false, tint: [0.35, 0.36, 0.34] });
  if (on) light(ctx, x, y - 0.35, z, color, intensity, 13);
}

function loot(ctx, profile, x, y, z, type = 'crate', rot = 0) {
  ctx.addLoot({ profile, x, y, z, type, rot });
}

function navigate(ctx, x, z, w, d, y) {
  ctx.addPad(x, z, w, d, y);
}

/** Two-storey family house with garage, kitchen, living room, bedrooms, basement. */
export function house(ctx, x, z, rot = 0, opts = {}) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  const w = opts.w ?? 12;
  const d = opts.d ?? 9;
  const floors = opts.floors ?? 2;
  const mat = opts.mat ?? 'brick';
  const style = WALL[mat];
  const base = gy + 0.15;
  const floorH = 3.0;
  navigate(ctx, x, z, w + 6, d + 6, gy);
  ctx.occupy(x, z, w + 4, d + 4);

  // foundation + floors
  b.box(x, gy, z, w + 0.6, 0.5, d + 0.6, 'concrete', { tex: 3, collideTag: 'floor' });
  b.box(x, base + 0.05, z, w, 0.12, d, 'woodFloor', { tex: 3, collideTag: 'floor' });
  // basement (below the ground floor)
  const basementY = gy - 2.9;
  b.box(x, basementY - 0.1, z, w - 2, 0.2, d - 2, 'concreteFloor', { tex: 3, collideTag: 'floor' });
  b.box(x, basementY + 2.95, z, w - 1.8, 0.25, d - 1.8, 'concrete', { tex: 2.6, collideTag: 'ceiling' });
  roomShell(b, { x, z, w: w - 2, d: d - 2, y0: basementY, h: 2.9, mat: 'concrete', thickness: 0.3, tex: 2.4, doors: [{ side: 'east', x: z + d / 2 - 3, w: 1.2, y0: basementY, y1: basementY + 2.1 }] });
  b.box(x - w / 4, basementY + 1.45, z, 0.2, 2.9, d - 2, 'concrete', { tex: 2, collideTag: 'wall' });
  P.shelf(b, x - w / 4 - 2, z + 1, basementY, 0);
  P.cabinet(b, x - w / 4 - 2.5, z - 2, basementY);
  loot(ctx, 'garage', x - w / 4 - 2, basementY, z - 3, 'shelf');
  loot(ctx, 'house', x - w / 4 + 1.2, basementY, z + 2, 'crate');
  light(ctx, x, basementY + 2.5, z, 0x9fb0c0, 6, 9);
  // stairwell down to the basement
  stairs(b, { x: x + w / 2 - 3.4, z: z - 1.2, y0: base, dir: 'e', width: 1.3, steps: 8, rise: 0.36, run: 0.3, mat: 'concrete' });
  b.box(x + w / 2 - 3.4, base + 1, z - 1.2, 1.4, 0.15, 2.2, 'concrete', { tex: 1.5, collideTag: 'floor' });

  const wallMat = style.mat;
  for (let f = 0; f < floors; f++) {
    const fy = base + f * floorH;
    const isTop = f === floors - 1;
    if (f > 0) b.box(x, fy - 0.06, z, w, 0.14, d, 'woodFloor', { tex: 3, collideTag: 'floor' });
    // exterior walls with front door on ground floor
    const doors = [];
    if (f === 0) doors.push({ side: 'south', x: x + 2.2, w: 1.5, y0: fy, y1: fy + 2.3 });
    doors.push({ side: 'north', x: x - 2.2, w: 1.4, y0: fy, y1: fy + 2.25 });
    roomShell(b, { x, z, w, d, y0: fy, h: floorH, mat: wallMat, thickness: 0.26, doors, tex: style.tex });
    // windows (visual frames + sills)
    windowFrame(ctx, b, { x: x + 3.2, z: z + d / 2, side: 'south', y: fy + 1.0 });
    windowFrame(ctx, b, { x: x + 4.6, z: z + d / 2, side: 'south', y: fy + 1.0 });
    windowFrame(ctx, b, { x: x - 3.2, z: z - d / 2, side: 'north', y: fy + 1.0 });
    windowFrame(ctx, b, { x: x - w / 2, z: z + 1.5, side: 'west', y: fy + 1.0 });
    windowFrame(ctx, b, { x: x + w / 2, z: z - 1.5, side: 'east', y: fy + 1.0 });
    // interior partition along z
    wallWithOpening(b, { x0: x - w / 2 + 0.2, x1: x + 1.2, z: z - 0.5, y0: fy, y1: fy + floorH, mat: 'plaster', open: { x: x - 2.4, w: 1.1, y0: fy, y1: fy + 2.15 } });
    // side partition
    wallWithOpeningZ(b, { z0: z - d / 2 + 0.2, z1: z + d / 2 - 0.2, x: x + 1.2, y0: fy, y1: fy + floorH, mat: 'plaster', open: { z: z + 1.8, w: 1.0, y0: fy, y1: fy + 2.1 } });
    if (f === 0) {
      // ground floor furniture: living room (left), kitchen (right)
      P.sofa(b, x - 3.6, z + 2.9, fy, Math.PI);
      P.table(b, x - 3.8, z + 1.3, fy);
      P.chair(b, x - 4.8, z + 1.0, fy, Math.PI / 2);
      P.chair(b, x - 2.8, z + 1.0, fy, -Math.PI / 2);
      P.tvStand(b, x - 3.6, z + 3.9, fy, 0);
      P.cabinet(b, x - 5.0, z + 3.8, fy, Math.PI);
      P.fridge(b, x + 4.2, z - 2.8, fy, 0);
      P.stove(b, x + 4.9, z - 2.8, fy, 0);
      P.sinkCounter(b, x + 3.4, z - 2.8, fy, 0, 1.4);
      P.table(b, x + 3.8, z + 0.6, fy, 0, 1.4, 0.8);
      P.chair(b, x + 2.9, z + 0.6, fy, Math.PI / 2);
      P.cabinet(b, x + 5.0, z + 2.2, fy, -Math.PI / 2);
      loot(ctx, 'kitchen', x + 4.2, fy, z - 2.4, 'cabinet');
      loot(ctx, 'kitchen', x + 3.0, fy, z - 2.6, 'cupboard');
      loot(ctx, 'house', x - 3.6, fy, z + 4.0, 'drawer');
      light(ctx, x - 3.5, fy + 2.6, z + 0.5, 0xffc080, 10, 10);
      // hallway lamp
      ceilingLamp(ctx, b, x, fy + 2.85, z + 2.2, { on: true, intensity: 8 });
      doorway(ctx, b, { x: x + 2.2, z: z + d / 2 - 0.13, rot: 0, kind: 'wood', open: false });
    } else {
      // upper floor: two bedrooms + bathroom
      P.bed(b, x - 3.4, z + 2.2, fy, 0);
      P.bed(b, x - 3.4, z - 2.2, fy, Math.PI);
      P.cabinet(b, x - 5.2, z, fy, Math.PI / 2);
      P.bed(b, x + 3.4, z + 2.4, fy, Math.PI);
      P.toilet(b, x + 4.4, z - 2.4, fy, Math.PI);
      P.sinkCounter(b, x + 3.2, z - 3.6, fy, 0, 1.0);
      P.shelf(b, x + 5.2, z - 1.0, fy, -Math.PI / 2, 1.2, 1.6);
      loot(ctx, 'house', x - 5.0, fy, z - 0.2, 'wardrobe');
      loot(ctx, 'hospital', x + 4.4, fy, z - 2.6, 'cabinet');
      loot(ctx, 'house', x - 3.4, fy, z + 0.6, 'crate');
      light(ctx, x + 3.4, fy + 2.5, z, 0xffd0a0, 7, 9);
      ceilingLamp(ctx, b, x - 2.0, fy + 2.85, z, { on: true, intensity: 9 });
      if (!isTop) {
        // stair to next floor: opening in the ceiling
        b.box(x + w / 2 - 3.0, fy + floorH - 0.06, z - 0.5, 2.6, 0.1, 2.4, 'metalPlate', { tex: 1, collideTag: 'floor' });
        stairs(b, { x: x + w / 2 - 4.4, z: z - 0.5, y0: fy, dir: 'e', width: 1.2, steps: 9, rise: 0.33, run: 0.3, mat: 'wood' });
      }
    }
  }
  // roof
  flatRoof(b, { x, z, w: w + 0.4, d: d + 0.4, y: base + floors * floorH, mat: 'roof', thickness: 0.3 });
  // chimney
  b.box(x - w / 3, base + floors * floorH + 1.1, z - d / 4, 0.8, 2.4, 0.8, 'brick', { tex: 1.2 });
  // garage lean-to
  if (opts.garage !== false) {
    const gx = x - w / 2 - 3.2;
    const gz = z + 1.0;
    b.box(gx, base + 0.05, gz, 6.0, 0.1, 5.4, 'concreteFloor', { tex: 2.5, collideTag: 'floor' });
    roomShell(b, { x: gx, z: gz, w: 6, d: 5.4, y0: base, h: 2.8, mat: 'wood', thickness: 0.2, doors: [{ side: 'east', x: gz - 1.6, w: 2.6, y0: base, y1: base + 2.4 }] });
    b.box(gx, base + 2.9, gz, 6.2, 0.15, 5.6, 'roof', { tex: 2 });
    P.workbench(b, gx + 1.2, gz - 1.9, base, 0);
    P.shelf(b, gx - 2.4, gz - 1.9, base, 0, 1.4, 1.8);
    P.barrel(b, gx + 2.2, gz + 2.0, base);
    P.barrel(b, gx + 1.4, gz + 2.2, base, 0, [0.5, 0.55, 0.4]);
    loot(ctx, 'garage', gx + 1.2, base, gz - 2.2, 'toolbox');
    loot(ctx, 'toolShed', gx - 2.4, base, gz - 2.2, 'cabinet');
    light(ctx, gx, base + 2.4, gz, 0xffb070, 7, 9);
  }
  // yard clutter
  P.rubble(b, x + 8, z - 6, gy, 2.4, 8);
  P.jerseyBarrier(b, x + 3, z + d / 2 + 4, gy, 0.3);
  if (rng() < 0.5) P.carWreck(b, x - 9, z + 8, gy, rng() * 3);
  ctx.addSpawnPoint = ctx.addSpawnPoint || (() => {});
  ctx.markLocation({ type: 'house', x, z, y: gy, name: opts.name || 'Abandoned House' });
}

/** Multi-storey apartment block with stairwell, lobby and flats. */
export function apartment(ctx, x, z, { floors = 5, w = 20, d = 13, rot = 0, name = 'Apartment Block' } = {}) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  const base = gy + 0.2;
  const fh = 3.1;
  navigate(ctx, x, z, w + 8, d + 8, gy);
  ctx.occupy(x, z, w + 5, d + 5);
  b.box(x, gy, z, w + 0.8, 0.5, d + 0.8, 'concrete', { tex: 4, collideTag: 'floor' });
  // stair core in the middle
  const coreW = 4.4;
  for (let f = 0; f < floors; f++) {
    const fy = base + f * fh;
    if (f > 0) b.box(x, fy - 0.08, z, w, 0.16, d, 'concreteFloor', { tex: 4, collideTag: 'floor' });
    // floor slabs for corridor
    roomShell(b, { x, z, w, d, y0: fy, h: fh, mat: f % 2 ? 'plaster' : 'concrete', thickness: 0.3, tex: 2.8, doors: f === 0 ? [{ side: 'south', x: x, w: 2.2, y0: fy, y1: fy + 2.4 }] : [] });
    // core walls
    b.box(x - coreW / 2, fy + fh / 2, z, 0.24, fh, coreW, 'concrete', { tex: 2, collideTag: 'wall' });
    b.box(x + coreW / 2, fy + fh / 2, z, 0.24, fh, coreW, 'concrete', { tex: 2, collideTag: 'wall' });
    b.box(x, fy + fh / 2, z - coreW / 2, coreW, fh, 0.24, 'concrete', { tex: 2, collideTag: 'wall' });
    b.box(x, fy + fh / 2, z + coreW / 2, coreW * 0.62, fh, 0.24, 'concrete', { tex: 2, collideTag: 'wall' });
    // stairs going up
    if (f < floors - 1) {
      stairs(b, { x: x - 1.8, z: z + 1.4, y0: fy, dir: 'n', width: 1.5, steps: 9, rise: fh / 9, run: 0.3, mat: 'concrete' });
      b.box(x - 1.8, fy + fh * 0.5, z - 0.2, 1.6, 0.3, 0.3, 'concrete', { tex: 1, collide: false });
    }
    // corridor partition: flats on both ends, corridor through centre
    wallWithOpeningZ(b, { z0: z - d / 2 + 0.3, z1: z + d / 2 - 0.3, x: x - coreW / 2 - 3.4, y0: fy, y1: fy + fh, mat: 'plaster', open: { z: z, w: 1.2, y0: fy, y1: fy + 2.2 } });
    wallWithOpeningZ(b, { z0: z - d / 2 + 0.3, z1: z + d / 2 - 0.3, x: x + coreW / 2 + 3.0, y0: fy, y1: fy + fh, mat: 'plaster', open: { z: z, w: 1.2, y0: fy, y1: fy + 2.2 } });
    // flat interiors (west and east ends)
    const wx = x - w / 2 + 3.6;
    const ex = x + w / 2 - 3.6;
    P.bed(b, wx - 1.0, z - d / 2 + 2.4, fy, 0);
    P.table(b, wx + 1.0, z - d / 2 + 4.0, fy);
    P.chair(b, wx + 1.0, z - d / 2 + 3.1, fy, 0);
    P.sofa(b, wx + 0.4, z + d / 2 - 2.6, fy, 0, 1.8);
    P.kitchen?.(b, wx, z + d / 2 - 4.5, fy, 0);
    P.sinkCounter(b, wx + 2.6, z + d / 2 - 4.8, fy, 0, 1.4);
    P.fridge(b, wx + 4.2, z + d / 2 - 4.6, fy, 0);
    P.bed(b, ex + 1.0, z + d / 2 - 2.6, fy, Math.PI);
    P.table(b, ex - 1.0, z - d / 2 + 3.4, fy);
    P.chair(b, ex - 1.0, z - d / 2 + 2.5, fy, Math.PI);
    P.cabinet(b, ex - 3.4, z, fy, Math.PI / 2);
    P.toilet(b, ex + 3.6, z - 2.2, fy, -Math.PI / 2);
    loot(ctx, 'house', wx + 1.0, fy, z - d / 2 + 4.4, 'drawer');
    loot(ctx, 'kitchen', wx + 4.2, fy, z + d / 2 - 4.2, 'cabinet');
    loot(ctx, 'house', ex - 3.4, fy, z, 'wardrobe');
    loot(ctx, 'hospital', ex + 3.6, fy, z - 2.4, 'cabinet');
    if (f % 2 === 0) {
      light(ctx, x, fy + 2.7, z - 2, 0xffc890, 6, 8);
      light(ctx, wx, fy + 2.6, z, 0xffc890, 5, 7);
      light(ctx, ex, fy + 2.6, z, 0xffc890, 5, 7);
    }
    // balcony
    if (f > 0 && f % 2 === 1) {
      b.box(x + w / 2 + 0.8, fy - 0.1, z + 2.0, 2.0, 0.16, 4.0, 'concrete', { tex: 1.6, collideTag: 'floor' });
      railing(b, { x0: x + w / 2 + 1.7, z0: z - 0.1, x1: x + w / 2 + 1.7, z1: z + 4.0, y: fy, height: 1.05, mat: 'metalPlate' });
      b.box(x + w / 2 + 0.2, fy + 1.1, z + 2.0, 0.1, 2.2, 4.0, 'plaster', { tex: 2, collide: false });
    }
  }
  flatRoof(b, { x, z, w: w + 0.5, d: d + 0.5, y: base + floors * fh, mat: 'roof' });
  // roof access hut + antenna
  b.box(x - w / 4, base + floors * fh + 1.2, z, 3.0, 2.4, 2.6, 'concrete', { tex: 2, collideTag: 'wall' });
  P.antennaMast(b, x + w / 3, z + 2, base + floors * fh + 0.3, 6);
  // entrance awning + stairs
  b.box(x, base - 0.1, z + d / 2 + 1.4, 5.0, 0.2, 2.8, 'concrete', { tex: 2, collideTag: 'floor' });
  for (let i = 0; i < 3; i++) b.box(x, gy + 0.5 + i * 0.16, z + d / 2 + 2.6 - i * 0.4, 5.0, 0.16, 0.4, 'concrete', { tex: 1.5, collideTag: 'floor' });
  doorway(ctx, b, { x, z: z + d / 2 + 0.05, kind: 'metal', open: true });
  // lobby lighting
  light(ctx, x, base + 2.6, z + 2, 0xffc890, 12, 12);
  P.rubble(b, x + w / 2 + 5, z + d / 2 + 4, gy, 3.5, 12);
  P.carWreck(b, x - w / 2 - 6, z + d / 2 + 5, gy, rng() * 3);
  ctx.markLocation({ type: 'apartment', x, z, y: gy, name });
}

/** Supermarket with aisles, stockroom and checkout. */
export function supermarket(ctx, x, z, { w = 30, d = 20, name = 'Supermarket' } = {}) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  const base = gy + 0.15;
  navigate(ctx, x, z, w + 8, d + 8, gy);
  ctx.occupy(x, z, w + 6, d + 6);
  b.box(x, gy, z, w + 0.6, 0.4, d + 0.6, 'concrete', { tex: 4, collideTag: 'floor' });
  b.box(x, base, z, w, 0.08, d, 'tile', { tex: 4, collideTag: 'floor' });
  roomShell(b, { x, z, w, d, y0: base, h: 4.6, mat: 'concrete', thickness: 0.35, tex: 3, doors: [{ side: 'south', x: x - 4, w: 2.6, y0: base, y1: base + 2.6 }, { side: 'south', x: x + 4, w: 2.6, y0: base, y1: base + 2.6 }] });
  // aisles of shelves
  for (let i = 0; i < 4; i++) {
    const sz = z - 6 + i * 3.4;
    for (let j = 0; j < 5; j++) {
      const sx = x - 9 + j * 4.4;
      P.shelf(b, sx, sz, base, 0, 3.2, 1.8, 0.8);
      if (rng() < 0.45) loot(ctx, 'supermarket', sx, base, sz + 0.9, 'shelf');
    }
  }
  // checkout counters
  for (let i = 0; i < 3; i++) {
    P.table(b, x + 9, z + 6 - i * 4, base, Math.PI / 2, 3.0, 1.0);
    b.box(x + 10.6, base + 1.25, z + 6 - i * 4, 0.4, 0.5, 0.4, 'metalPlate', { tex: 0.5, collide: false, tint: [0.4, 0.42, 0.4] });
    loot(ctx, 'supermarket', x + 9, base, z + 6 - i * 4, 'drawer');
  }
  // freezers along the back
  for (let i = 0; i < 4; i++) {
    b.box(x - 10 + i * 6.5, base + 1.0, z - d / 2 + 1.6, 4.0, 2.0, 1.4, 'metalPlate', { tex: 1.4, tint: [0.6, 0.65, 0.62] });
    b.box(x - 10 + i * 6.5, base + 1.4, z - d / 2 + 2.35, 3.6, 1.2, 0.06, 'metalPlate', { tex: 0.8, collide: false, tint: [0.15, 0.2, 0.22] });
    if (i % 2 === 0) loot(ctx, 'kitchen', x - 10 + i * 6.5, base, z - d / 2 + 1.6, 'freezer');
  }
  // stockroom
  b.box(x, base + 2.3, z - d / 2 + 0.2, w, 4.6, 0.3, 'concrete', { tex: 3, collide: false });
  P.crate(b, x - 12, z - d / 2 + 3, base, 0.3, 1.1);
  P.crate(b, x - 10.5, z - d / 2 + 3.2, base, 0.6);
  loot(ctx, 'warehouse', x - 12, base, z - d / 2 + 3, 'crate');
  loot(ctx, 'supermarket', x - 10.5, base, z - d / 2 + 3.2, 'crate');
  // lights (most dead, a few emergency)
  for (let i = 0; i < 4; i++) ceilingLamp(ctx, b, x - 9 + i * 6, base + 4.5, z - 3, { on: i === 0 || i === 3, color: 0xffd8a0, intensity: 16 });
  light(ctx, x + 12, base + 3.2, z + d / 2 - 2, 0xffb060, 14, 12);
  // signage
  const signTex = ctx.textures.signTexture('SUPPLY', { bg: '#26302a', fg: '#cfd8c8', accent: '#a5432c' });
  const geo = new THREE.PlaneGeometry(6, 2);
  const m = new THREE.Matrix4().makeTranslation(x, base + 3.4, z + d / 2 + 0.25);
  b.raw(geo, m, signTex);
  P.carWreck(b, x - w / 2 + 3, z + d / 2 + 6, gy, 0.6);
  P.carWreck(b, x + w / 2 - 4, z + d / 2 + 6, gy, 2.2);
  ctx.markLocation({ type: 'supermarket', x, z, y: gy, name });
}

/** Hospital: reception, wards, operating theatre, storage, morgue. */
export function hospital(ctx, x, z, { name = 'St. Anselm Hospital' } = {}) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  const base = gy + 0.15;
  const w = 44;
  const d = 26;
  const fh = 3.4;
  const floors = 3;
  navigate(ctx, x, z, w + 10, d + 10, gy);
  ctx.occupy(x, z, w + 6, d + 6);
  b.box(x, gy, z, w + 0.8, 0.5, d + 0.8, 'concrete', { tex: 5, collideTag: 'floor' });
  for (let f = 0; f < floors; f++) {
    const fy = base + f * fh;
    if (f > 0) b.box(x, fy - 0.1, z, w, 0.2, d, 'labTile', { tex: 4, collideTag: 'floor' });
    else b.box(x, fy, z, w, 0.1, d, 'labTile', { tex: 4, collideTag: 'floor' });
    roomShell(b, { x, z, w, d, y0: fy, h: fh, mat: 'labTile', thickness: 0.3, tex: 2.6, doors: f === 0 ? [{ side: 'south', x, w: 3.0, y0: fy, y1: fy + 2.5 }] : [] });
    // central corridor
    for (const zz of [z - 3.0, z + 3.0]) {
      b.box(x, fy + fh / 2, zz, w - 4, fh, 0.25, 'plaster', { tex: 2.4, collideTag: 'wall' });
    }
    // corridor openings
    for (let r = -2; r <= 2; r++) {
      const px = x + r * 8;
      // side rooms: north and south
      b.box(px - 3.6, fy + fh / 2, z, 0.22, fh, 6.0, 'plaster', { tex: 2, collideTag: 'wall' });
    }
    // rooms
    for (let r = -2; r <= 2; r++) {
      const px = x + r * 8;
      // ward beds north side
      P.bed(b, px - 2.4, z - 8.5, fy, 0, 'labTile');
      P.bed(b, px + 1.4, z - 8.5, fy, 0, 'labTile');
      if (r % 2 === 0) loot(ctx, 'hospital', px, fy, z - 10.5, 'cabinet');
      // south rooms: treatment / storage
      P.shelf(b, px - 2.4, z + 8.0, fy, 0, 1.8, 1.9, 0.5);
      P.table(b, px + 1.6, z + 8.6, fy, 0, 1.6, 0.8);
      if (r % 2 === 1) loot(ctx, 'hospital', px - 2.4, fy, z + 8.0, 'shelf');
      if (r === 0) loot(ctx, 'lab', px + 1.6, fy, z + 8.6, 'cabinet');
    }
    // operating theatre on the top floor
    if (f === floors - 1) {
      b.box(x + 12, fy + 0.5, z + 6, 6, 1.0, 4, 'labTile', { tex: 2, collideTag: 'table' });
      b.box(x + 12, fy + 1.1, z + 6, 5.4, 0.2, 3.4, 'metalPlate', { tex: 1.2, collide: false, tint: [0.7, 0.75, 0.75] });
      light(ctx, x + 12, fy + 3.0, z + 6, 0xdfe8f0, 16, 12);
      loot(ctx, 'lab', x + 14.5, fy, z + 7.5, 'tray');
    }
    // stairwell core at the west end
    b.box(x - w / 2 + 2.6, fy + fh / 2, z, 0.25, fh, 7.2, 'concrete', { tex: 2, collideTag: 'wall' });
    if (f < floors - 1) stairs(b, { x: x - w / 2 + 2.6, z: z + 2.2, y0: fy, dir: 'n', width: 1.8, steps: 10, rise: fh / 10, run: 0.32, mat: 'labTile' });
    if (f === 1) {
      b.box(x - w / 2 + 2.6, fy + fh - 0.1, z - 2.4, 2.4, 0.12, 2.0, 'concrete', { tex: 1, collide: false });
    }
    // lights
    for (let i = 0; i < 4; i++) {
      ceilingLamp(ctx, b, x - 12 + i * 8, fy + fh - 0.2, z, { on: i % 2 === 0 && f === 0, color: 0xd8e8f0, intensity: 12 });
    }
  }
  flatRoof(b, { x, z, w: w + 0.6, d: d + 0.6, y: base + floors * fh, mat: 'roof' });
  // helipad marking on roof
  const yard = ctx.textures.signTexture('H', { bg: '#3a3a36', fg: '#c8c8c0', accent: '#3a3a36' });
  const hp = new THREE.PlaneGeometry(6, 6);
  b.raw(hp, new THREE.Matrix4().makeTranslation(x + 10, base + floors * fh + 0.35, z).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2)), yard, { axis: 'none' });
  // entrance canopy
  b.box(x, base + 2.8, z + d / 2 + 2.2, 12, 0.25, 4.4, 'concrete', { tex: 2, collide: false });
  for (const dx of [-5, 5]) b.box(x + dx, base + 1.4, z + d / 2 + 4.2, 0.3, 2.8, 0.3, 'concrete', { tex: 1 });
  doorway(ctx, b, { x, z: z + d / 2 + 0.05, w: 3.0, h: 2.5, kind: 'glass', open: true });
  // ambulance
  b.box(x + 8, gy + 1.0, z + d / 2 + 9, 2.3, 1.7, 5.2, 'metalPlate', { tex: 1.6, rotY: 0.4, tint: [0.82, 0.82, 0.78] });
  P.carWreck(b, x - 14, z + d / 2 + 8, gy, 0.9);
  P.rubble(b, x + 16, z + d / 2 + 12, gy, 4, 14);
  ctx.markLocation({ type: 'hospital', x, z, y: gy, name });
}

/** Police station with cells, evidence room and armoury. */
export function policeStation(ctx, x, z, { name = 'Precinct 41' } = {}) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  const base = gy + 0.15;
  const w = 26;
  const d = 16;
  const fh = 3.3;
  navigate(ctx, x, z, w + 8, d + 8, gy);
  ctx.occupy(x, z, w + 5, d + 5);
  b.box(x, gy, z, w + 0.6, 0.5, d + 0.6, 'concrete', { tex: 4, collideTag: 'floor' });
  b.box(x, base, z, w, 0.08, d, 'concreteFloor', { tex: 4, collideTag: 'floor' });
  roomShell(b, { x, z, w, d, y0: base, h: fh, mat: 'concrete', thickness: 0.3, tex: 3, doors: [{ side: 'south', x: x - 3, w: 2.2, y0: base, y1: base + 2.4 }] });
  // front desk
  P.table(b, x - 3, z + 4.5, base, 0, 4.0, 1.0);
  b.box(x - 3, base + 1.2, z + 4.0, 4.0, 1.0, 0.2, 'concrete', { tex: 1.2, collide: false });
  // office cubicles
  for (let i = 0; i < 3; i++) {
    P.desk(b, x + 4 + i * 4, z + 4.5, base, Math.PI);
    P.chair(b, x + 4 + i * 4, z + 3.5, base, 0);
    loot(ctx, 'police', x + 4 + i * 4, base, z + 4.8, 'drawer');
  }
  // evidence lockup
  b.box(x - w / 2 + 4, base + fh / 2, z - 2, 0.3, fh, 8, 'concrete', { tex: 2, collideTag: 'wall' });
  b.box(x - w / 2 + 4, base + fh / 2, z - 6, 6, fh, 0.3, 'concrete', { tex: 2, collideTag: 'wall' });
  P.shelf(b, x - w / 2 + 2, z - 4, base, Math.PI / 2);
  loot(ctx, 'police', x - w / 2 + 2, base, z - 4, 'shelf');
  loot(ctx, 'safe', x - w / 2 + 5, base, z - 6.8, 'safe');
  // holding cells
  for (let i = 0; i < 3; i++) {
    b.box(x + 6 + i * 3.2, base + fh / 2, z - 6, 2.8, fh, 0.2, 'metalPlate', { tex: 1.4, tint: [0.4, 0.42, 0.4] });
    b.box(x + 6 + i * 3.2, base + fh / 2, z - 7.6, 0.15, fh, 3.2, 'metalPlate', { tex: 1.2, tint: [0.4, 0.42, 0.4] });
    P.bed(b, x + 6 + i * 3.2, z - 6.8, base, 0, 'metalPlate');
  }
  // armoury door + crates
  b.box(x + w / 2 - 2, base + fh / 2, z - 4.5, 0.3, fh, 6, 'concrete', { tex: 2, collideTag: 'wall' });
  doorway(ctx, b, { x: x + w / 2 - 2, z: z - 2.2, rot: Math.PI / 2, kind: 'metal', open: false });
  P.ammoBox(b, x + w / 2 - 4, z - 5.5, base, 0.4);
  loot(ctx, 'military', x + w / 2 - 4, base, z - 5.5, 'ammo');
  loot(ctx, 'police', x + w / 2 - 4.5, base, z - 7, 'locker');
  // lights
  light(ctx, x - 3, base + 2.8, z + 3, 0xffc890, 12, 12);
  light(ctx, x + 8, base + 2.8, z - 4, 0xbfd0e0, 8, 10);
  // exterior: barrier + cruiser
  P.jerseyBarrier(b, x, z + d / 2 + 5, gy, 0);
  b.box(x + 6, gy + 0.7, z + d / 2 + 7, 2.0, 0.9, 4.6, 'metalPlate', { tex: 1.4, rotY: 1.4, tint: [0.25, 0.28, 0.3] });
  b.box(x + 6, gy + 1.4, z + d / 2 + 7, 1.7, 0.5, 2.0, 'metalPlate', { tex: 1.2, rotY: 1.4, tint: [0.2, 0.22, 0.24] });
  P.watchtower(b, x - w / 2 - 6, z + d / 2 + 3, gy);
  ctx.markLocation({ type: 'police', x, z, y: gy, name });
}

/** Industrial warehouse: open floor, mezzanine, pallets, machinery. */
export function warehouse(ctx, x, z, { w = 36, d = 24, name = 'Warehouse 7' } = {}) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  const base = gy + 0.1;
  navigate(ctx, x, z, w + 10, d + 10, gy);
  ctx.occupy(x, z, w + 6, d + 6);
  b.box(x, gy, z, w + 0.6, 0.4, d + 0.6, 'concrete', { tex: 5, collideTag: 'floor' });
  b.box(x, base, z, w, 0.06, d, 'concreteFloor', { tex: 5, collideTag: 'floor' });
  roomShell(b, { x, z, w, d, y0: base, h: 9, mat: 'metal', thickness: 0.4, tex: 3, doors: [{ side: 'south', x: x - 8, w: 6.0, y0: base, y1: base + 5.0 }, { side: 'east', x: z + 4, w: 2.2, y0: base, y1: base + 2.4 }] });
  // roof trusses
  for (let i = 0; i < 6; i++) {
    const tx = x - w / 2 + 3 + i * (w / 6);
    b.box(tx, base + 8.6, z, 0.25, 0.25, d, 'metalPlate', { tex: 2, tint: [0.4, 0.42, 0.4], collide: false });
    for (let k = -2; k <= 2; k++) b.box(tx, base + 8.2, z + k * (d / 5), 0.16, 0.9, 0.16, 'metalPlate', { tex: 0.6, collide: false });
  }
  b.box(x, base + 9.1, z, w, 0.2, d, 'metalPlate', { tex: 4, tint: [0.3, 0.32, 0.3], collide: false });
  // pallet racks
  for (let i = 0; i < 4; i++) {
    const rx = x - 12 + i * 7;
    for (const dz of [-6, 6]) {
      P.shelf(b, rx, z + dz, base, 0, 1.0, 4.5, 1.2);
      P.crate(b, rx, z + dz + 2.0, base, rng() * 0.5, 1.0);
      P.crate(b, rx, z + dz + 2.0, base + 1.0, rng() * 0.5, 0.8);
      if (rng() < 0.6) loot(ctx, 'warehouse', rx, base, z + dz + 2.0, 'crate');
      if (rng() < 0.3) loot(ctx, 'factory', rx, base, z + dz, 'shelf');
    }
  }
  // mezzanine office
  b.box(x + w / 2 - 6, base + 3.0, z - 2, 10, 0.2, 8, 'metalPlate', { tex: 2.5, collideTag: 'floor', tint: [0.4, 0.42, 0.4] });
  railing(b, { x0: x + w / 2 - 11, z0: z - 6, x1: x + w / 2 - 11, z1: z + 2, y: base + 3.1, mat: 'metalPlate' });
  railing(b, { x0: x + w / 2 - 11, z0: z + 2, x1: x + w / 2 - 1, z1: z + 2, y: base + 3.1, mat: 'metalPlate' });
  stairs(b, { x: x + w / 2 - 12, z: z + 3, y0: base, dir: 'e', width: 1.4, steps: 12, rise: 0.25, run: 0.28, mat: 'metalPlate' });
  P.desk(b, x + w / 2 - 4, z - 4, base + 3.1, 0);
  loot(ctx, 'police', x + w / 2 - 4, base + 3.1, z - 4, 'drawer');
  P.machinery(b, x - w / 2 + 5, z - 2, base, 0.4, 1.2);
  P.conveyor(b, x - 6, z + 8, base, Math.PI / 2, 12);
  // lights
  for (let i = 0; i < 3; i++) light(ctx, x - 10 + i * 10, base + 7.5, z, 0xffd8a8, 18, 20);
  light(ctx, x + w / 2 - 5, base + 5.5, z - 2, 0xbfe0d0, 8, 10);
  P.truckWreck(b, x + 10, z + d / 2 + 9, gy, 0.2);
  P.barrel(b, x - w / 2 + 4, z + d / 2 - 6, base);
  P.barrel(b, x - w / 2 + 4.8, z + d / 2 - 5.2, base);
  ctx.markLocation({ type: 'warehouse', x, z, y: gy, name });
}

/** Factory production hall with machines, catwalks and hazards. */
export function factoryHall(ctx, x, z, { w = 40, d = 26, name = 'Foundry Hall' } = {}) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  const base = gy + 0.1;
  navigate(ctx, x, z, w + 10, d + 10, gy);
  ctx.occupy(x, z, w + 6, d + 6);
  b.box(x, gy, z, w + 0.8, 0.5, d + 0.8, 'concrete', { tex: 6, collideTag: 'floor' });
  b.box(x, base, z, w, 0.06, d, 'concreteFloor', { tex: 6, collideTag: 'floor' });
  roomShell(b, { x, z, w, d, y0: base, h: 12, mat: 'concrete', thickness: 0.45, tex: 3, doors: [{ side: 'west', x: z, w: 5.0, y0: base, y1: base + 4.2 }] });
  // machinery row
  for (let i = 0; i < 5; i++) {
    P.machinery(b, x - 14 + i * 7, z - 5, base, rng() * 0.4, 1.2);
    if (i % 2 === 0) loot(ctx, 'factory', x - 14 + i * 7, base, z - 5, 'crate');
  }
  P.conveyor(b, x - 14, z + 2, base, 0, 28);
  // catwalk across the hall
  catwalk(b, { x0: x - w / 2 + 2, z0: z + 6, x1: x + w / 2 - 2, z1: z + 6, y: base + 5.2, width: 1.6 });
  stairs(b, { x: x - w / 2 + 3, z: z + 9, y0: base, dir: 's', width: 1.4, steps: 12, rise: 0.24, run: 0.3, mat: 'metalPlate' });
  // pipes and valves
  P.pipeRun(b, x - w / 2 + 1, z - d / 2 + 2, base, 0, w - 2, 0.22, 7.5);
  P.valveStation(b, x + 12, z + 9, base);
  P.tank(b, x - w / 2 - 8, z - 10, gy, 2.4, 5);
  // hazard markings
  const hz = ctx.textures.signTexture('CAUTION', { bg: '#2a2a26', fg: '#d8c060', accent: '#8a3a20' });
  b.raw(new THREE.PlaneGeometry(3, 1.5), new THREE.Matrix4().makeTranslation(x, base + 2.4, z + d / 2 - 0.3), hz);
  for (let i = 0; i < 3; i++) light(ctx, x - 12 + i * 12, base + 10, z, 0xffc070, 16, 22);
  P.rubble(b, x + 10, z + 5, base, 3, 12);
  ctx.markLocation({ type: 'factory', x, z, y: gy, name });
}

/** Military bunker with two underground levels reached from a surface blockhouse. */
export function bunker(ctx, x, z, { name = 'Bunker K-9' } = {}) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  // blockhouse
  const base = gy + 0.2;
  navigate(ctx, x, z, 30, 30, gy);
  ctx.occupy(x, z, 24, 24);
  b.box(x, gy, z, 14, 0.6, 12, 'concrete', { tex: 4, collideTag: 'floor' });
  roomShell(b, { x, z, w: 14, d: 12, y0: base, h: 3.6, mat: 'military', thickness: 0.5, tex: 3, doors: [{ side: 'south', x: x, w: 2.4, y0: base, y1: base + 2.6 }] });
  flatRoof(b, { x, z, w: 14, d: 12, y: base + 3.6, mat: 'concrete' });
  // guard room
  P.desk(b, x - 4, z - 3, base, 0);
  P.locker(b, x + 5, z - 4, base, -Math.PI / 2);
  loot(ctx, 'military', x + 5, base, z - 4, 'locker');
  loot(ctx, 'military', x - 4, base, z - 3, 'drawer');
  light(ctx, x, base + 3.0, z, 0xc0d0d8, 10, 12);
  // stair shaft down
  const y1 = gy - 3.6;
  const y2 = gy - 7.2;
  doorway(ctx, b, { x: x + 3.5, z: z - 0.1, rot: Math.PI / 2, kind: 'metal', open: true });
  stairs(b, { x: x + 3.5, z: z + 2.2, y0: base, dir: 'n', width: 2.0, steps: 16, rise: 0.3, run: 0.32, mat: 'militaryMetal' });
  // level 1: control room, armory, barracks, generator
  b.box(x + 3.5, y1 - 0.2, z - 2.5, 8, 0.3, 12, 'concreteFloor', { tex: 3, collideTag: 'floor' });
  roomShell(b, { x: x + 3.5, z: z - 2.5, w: 8, d: 12, y0: y1, h: 3.0, mat: 'military', thickness: 0.3, tex: 2.4, doors: [{ side: 'north', x: x + 3.5, w: 1.4, y0: y1, y1: y1 + 2.2 }] });
  b.box(x + 3.5, y1 + 3.15, z - 2.5, 8.4, 0.3, 12.4, 'concrete', { tex: 3, collideTag: 'ceiling' });
  P.serverRack(b, x + 4.5, z - 6.5, y1, 0);
  P.desk(b, x + 4.5, z - 4.0, y1, 0);
  loot(ctx, 'lab', x + 4.5, z - 4.0, y1, 'drawer');
  P.generator(b, x + 2.0, z - 1.0, y1);
  P.locker(b, x + 6.0, z - 0.5, y1, Math.PI);
  loot(ctx, 'military', x + 6.0, z - 0.5, y1, 'locker');
  P.bed(b, x + 4.0, z + 1.2, y1, 0);
  light(ctx, x + 3.5, y1 + 2.6, z - 4, 0xa8d0c0, 9, 11);
  // level 2: laboratory
  stairs(b, { x: x - 1.0, z: z - 6.0, y0: y1, dir: 'e', width: 1.6, steps: 12, rise: 0.3, run: 0.3, mat: 'militaryMetal' });
  b.box(x - 4, y2 - 0.2, z - 6, 14, 0.3, 10, 'labTile', { tex: 3, collideTag: 'floor' });
  roomShell(b, { x: x - 4, z: z - 6, w: 14, d: 10, y0: y2, h: 3.0, mat: 'labTile', thickness: 0.3, tex: 2.4, doors: [{ side: 'west', x: z - 6, w: 1.4, y0: y2, y1: y2 + 2.2 }] });
  b.box(x - 4, y2 + 3.15, z - 6, 14.4, 0.3, 10.4, 'labTile', { tex: 3, collideTag: 'ceiling' });
  P.table(b, x - 6, z - 8, y2, 0, 2.4, 1.0);
  P.shelf(b, x - 9, z - 6, y2, Math.PI / 2, 2.0, 2.0, 0.5);
  loot(ctx, 'lab', x - 9, z - 6, y2, 'shelf');
  loot(ctx, 'lab', x - 6, z - 8, y2, 'lab');
  loot(ctx, 'safe', x - 1, z - 9.5, y2, 'safe');
  P.serverRack(b, x + 1.5, z - 6, y2, 0);
  light(ctx, x - 4, y2 + 2.6, z - 6, 0x9fd8c0, 12, 12);
  light(ctx, x - 8, y2 + 2.6, z - 8, 0x9fd8c0, 8, 9);
  // exterior: fence, watchtower, sandbags
  for (let i = 0; i < 6; i++) P.chainlink(b, x - 20 + i * 8, z + 14, gy, 0, 8, 2.6);
  P.sandbags(b, x - 8, z + 13, gy, 0, 3.0, 1.0);
  P.watchtower(b, x + 13, z + 12, gy);
  P.antennaMast(b, x + 10, z - 8, gy, 10);
  ctx.markLocation({ type: 'bunker', x, z, y: gy, name });
}

/** Forest research outpost: huts, lab container, antenna. */
export function researchOutpost(ctx, x, z, { name = 'Outpost Blackwood' } = {}) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  navigate(ctx, x, z, 28, 24, gy);
  ctx.occupy(x, z, 24, 20);
  // main container lab
  b.box(x, gy + 0.15, z, 13, 0.3, 7, 'concrete', { tex: 3, collideTag: 'floor' });
  roomShell(b, { x, z, w: 13, d: 7, y0: gy + 0.3, h: 3.0, mat: 'labTile', thickness: 0.2, tex: 2.2, doors: [{ side: 'south', x: x - 3, w: 1.4, y0: gy + 0.3, y1: gy + 2.6 }] });
  b.box(x, gy + 3.4, z, 13.4, 0.2, 7.4, 'metalPlate', { tex: 2, tint: [0.5, 0.52, 0.48] });
  P.table(b, x + 2, z - 1.5, gy + 0.3, 0, 2.0, 1.0);
  P.serverRack(b, x - 5, z - 2.0, gy + 0.3, 0);
  P.shelf(b, x - 2, z - 2.8, gy + 0.3, 0, 1.6, 1.9, 0.5);
  loot(ctx, 'lab', x - 2, z - 2.8, gy + 0.3, 'shelf');
  loot(ctx, 'lab', x + 2, z - 1.5, gy + 0.3, 'lab');
  light(ctx, x, gy + 2.8, z, 0x9fd8d0, 9, 10);
  // huts
  for (let i = 0; i < 2; i++) {
    const hx = x - 9 + i * 18;
    const hz = z + 7;
    P.tent(b, hx, hz, gy, rng() * 2);
    P.campfire(b, hx + 2.5, hz + 1, gy, { lit: i === 0 });
    loot(ctx, 'cave', hx, gy, hz, 'crate');
  }
  P.antennaMast(b, x + 8, z - 3, gy, 13);
  P.satelliteDish(b, x + 5, z + 4, gy, 0.6);
  P.rubble(b, x - 6, z + 5, gy, 2, 8);
  ctx.markLocation({ type: 'outpost', x, z, y: gy, name });
}

/** Collapsed cabin for the forest. */
export function cabin(ctx, x, z, { name = 'Forester Cabin' } = {}) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  const base = gy + 0.1;
  navigate(ctx, x, z, 14, 12, gy);
  ctx.occupy(x, z, 10, 9);
  b.box(x, gy, z, 8.6, 0.3, 6.6, 'concrete', { tex: 2, collideTag: 'floor' });
  b.box(x, base, z, 8, 0.08, 6, 'woodFloor', { tex: 2, collideTag: 'floor' });
  roomShell(b, { x, z, w: 8, d: 6, y0: base, h: 2.7, mat: 'wood', thickness: 0.22, tex: 1.6, doors: [{ side: 'south', x: x + 1.5, w: 1.1, y0: base, y1: base + 2.1 }] });
  gableRoof(b, { x, z, w: 8, d: 6, y: base + 2.7, rise: 1.6, mat: 'roof' });
  P.bed(b, x - 2, z + 1.2, base, 0);
  P.table(b, x + 2, z + 1.8, base, 0, 1.2, 0.7);
  P.chair(b, x + 2, z + 0.8, base, 0);
  P.stove(b, x - 3, z - 1.7, base, 0);
  P.cabinet(b, x + 3.2, z - 1.5, base, -Math.PI / 2);
  loot(ctx, 'house', x + 3.2, z - 1.5, base, 'cabinet');
  loot(ctx, 'toolShed', x - 3, z - 1.7, base, 'drawer');
  P.logPile(b, x + 4.5, z + 3.5, gy);
  P.campfire(b, x + 3.0, z + 5.0, gy, { lit: true });
  light(ctx, x - 1, base + 2.4, z, 0xffb070, 7, 9);
  ctx.markLocation({ type: 'cabin', x, z, y: gy, name });
}

/** Underground subway station with platforms and tunnels. */
export function subwayStation(ctx, x, z, { name = 'Line 4 - Komsomolskaya' } = {}) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  const base = gy + 0.1;
  const y = gy - 8;
  navigate(ctx, x, z, 40, 40, gy);
  ctx.occupy(x, z, 40, 34);
  // surface entrance
  b.box(x + 12, gy + 0.15, z + 12, 8, 0.3, 8, 'concrete', { tex: 3, collideTag: 'floor' });
  roomShell(b, { x: x + 12, z: z + 12, w: 8, d: 8, y0: gy + 0.3, h: 3.4, mat: 'concrete', thickness: 0.3, tex: 2.4, doors: [{ side: 'south', x: x + 12, w: 2.4, y0: gy + 0.3, y1: gy + 2.6 }] });
  flatRoof(b, { x: x + 12, z: z + 12, w: 8, d: 8, y: gy + 3.7 });
  const signTex = ctx.textures.signTexture('METRO', { bg: '#1e2a34', fg: '#cfe0e8', accent: '#a03030' });
  b.raw(new THREE.PlaneGeometry(3, 1.5), new THREE.Matrix4().makeTranslation(x + 12, gy + 3.0, z + 16.2), signTex);
  // long stairwell down (enclosed)
  stairs(b, { x: x + 12, z: z + 4.0, y0: gy + 0.3, dir: 'n', width: 2.6, steps: 28, rise: 0.3, run: 0.33, mat: 'concrete' });
  b.box(x + 10.5, gy - 3.5, z - 3, 0.3, 8, 14, 'concrete', { tex: 3, collideTag: 'wall' });
  b.box(x + 13.5, gy - 3.5, z - 3, 0.3, 8, 14, 'concrete', { tex: 3, collideTag: 'wall' });
  b.box(x + 12, gy + 0.25, z - 3, 3.4, 0.3, 14, 'concrete', { tex: 3, collideTag: 'ceiling' });
  light(ctx, x + 12, gy - 2.0, z + 1, 0xd0c090, 6, 8);
  // platform hall
  b.box(x, y - 0.15, z - 4, 42, 0.3, 22, 'tile', { tex: 5, collideTag: 'floor' });
  roomShell(b, { x, z: z - 4, w: 42, d: 22, y0: y, h: 5.0, mat: 'tile', thickness: 0.4, tex: 3, doors: [{ side: 'south', x, w: 2.6, y0: y, y1: y + 2.5 }] });
  b.box(x, y + 5.15, z - 4, 42.8, 0.4, 22.8, 'concrete', { tex: 5, collideTag: 'ceiling' });
  // platform edge and tracks
  b.box(x, y + 0.3, z - 4, 42, 0.65, 1.6, 'concrete', { tex: 2, collideTag: 'step' });
  b.box(x, y - 0.2, z - 8, 42, 0.15, 5.0, 'gravel', { tex: 3, collideTag: 'floor' });
  for (const dz of [-6.2, -9.8]) {
    b.box(x, y + 0.05, z - 4 + dz, 42, 0.12, 0.16, 'metalPlate', { tex: 1, tint: [0.5, 0.5, 0.48], collide: false });
  }
  // columns
  for (let i = 0; i < 9; i++) {
    b.cylinder(x - 18 + i * 4.6, y + 2.5, z + 3.2, 0.35, 0.4, 5.0, 'tile', { seg: 10, tex: 1.4 });
  }
  // benches and kiosk
  for (let i = 0; i < 5; i++) {
    b.box(x - 14 + i * 7, y + 0.45, z + 1.4, 2.2, 0.1, 0.6, 'wood', { tex: 1, tint: [0.5, 0.45, 0.4] });
    b.box(x - 14 + i * 7, y + 0.2, z + 1.4, 2.2, 0.4, 0.5, 'metalPlate', { tex: 0.8 });
  }
  P.shelf(b, x + 16, z + 3.0, y, Math.PI / 2, 2.0, 1.8, 0.6);
  loot(ctx, 'locker', x + 16, z + 3.0, y, 'kiosk');
  loot(ctx, 'cave', x - 16, z + 1.6, y, 'bench');
  // rubble and dead train
  b.box(x - 6, y + 1.6, z - 8, 2.6, 2.8, 14, 'militaryMetal', { tex: 2, tint: [0.35, 0.4, 0.38], rotY: 0.05 });
  for (let i = 0; i < 6; i++) light(ctx, x - 18 + i * 7, y + 4.4, z, 0xdfd0a0, i % 3 === 0 ? 9 : 0.1, 12);
  P.rubble(b, x + 8, z + 6, y, 3, 12);
  ctx.markLocation({ type: 'subway', x, z, y: gy, name });
}

/** Underground lab beneath the military zone. */
export function labComplex(ctx, x, z, { name = 'Facility SUBSTRATE' } = {}) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  const y = gy - 7.0;
  navigate(ctx, x, z, 40, 40, gy);
  ctx.occupy(x, z, 36, 30);
  // surface elevator housing
  b.box(x, gy + 0.2, z + 10, 10, 0.4, 8, 'concrete', { tex: 3, collideTag: 'floor' });
  roomShell(b, { x, z: z + 10, w: 10, d: 8, y0: gy + 0.4, h: 3.6, mat: 'military', thickness: 0.35, tex: 2.6, doors: [{ side: 'south', x, w: 2.2, y0: gy + 0.4, y1: gy + 2.8 }] });
  flatRoof(b, { x, z: z + 10, w: 10, d: 8, y: gy + 4.0 });
  // stairs down inside
  stairs(b, { x, z: z + 6.0, y0: gy + 0.4, dir: 'n', width: 2.0, steps: 24, rise: 0.31, run: 0.32, mat: 'militaryMetal' });
  b.box(x - 1.6, gy - 3.0, z + 1.5, 0.3, 8, 12, 'militaryMetal', { tex: 3, collideTag: 'wall' });
  b.box(x + 1.6, gy - 3.0, z + 1.5, 0.3, 8, 12, 'militaryMetal', { tex: 3, collideTag: 'wall' });
  // main hall
  b.box(x, y - 0.2, z - 6, 34, 0.4, 24, 'labTile', { tex: 5, collideTag: 'floor' });
  roomShell(b, { x, z: z - 6, w: 34, d: 24, y0: y, h: 4.6, mat: 'labTile', thickness: 0.4, tex: 3, doors: [{ side: 'south', x, w: 2.6, y0: y, y1: y + 2.6 }] });
  b.box(x, y + 4.75, z - 6, 34.8, 0.4, 24.8, 'concrete', { tex: 4, collideTag: 'ceiling' });
  // specimen tanks
  for (let i = 0; i < 5; i++) {
    b.cylinder(x - 12 + i * 6, y + 1.4, z - 15, 0.9, 0.9, 2.8, 'labTile', { seg: 12, tex: 1.6, tint: [0.55, 0.7, 0.62] });
    b.cylinder(x - 12 + i * 6, y + 1.4, z - 15, 0.82, 0.82, 2.7, 'radiation', { seg: 12, tex: 1.2, collide: false, tint: [0.5, 0.9, 0.4] });
    light(ctx, x - 12 + i * 6, y + 2.6, z - 15, 0x7ad050, 4, 6);
  }
  // labs and offices
  for (let i = 0; i < 3; i++) {
    P.table(b, x - 10 + i * 10, z - 4, y, 0, 2.4, 1.0);
    P.serverRack(b, x - 12 + i * 10, z - 8, y, 0);
    loot(ctx, 'lab', x - 10 + i * 10, z - 4, y, 'lab');
    loot(ctx, 'lab', x - 12 + i * 10, z - 8, y, 'cabinet');
  }
  // containment room
  b.box(x + 12, y + 2.3, z - 10, 0.4, 4.6, 12, 'militaryMetal', { tex: 3, collideTag: 'wall' });
  doorway(ctx, b, { x: x + 12, z: z - 4.2, rot: Math.PI / 2, kind: 'metal', open: false, y });
  loot(ctx, 'safe', x + 15, y, z - 14, 'safe');
  loot(ctx, 'lab', x + 15, y, z - 12, 'lab');
  for (let i = 0; i < 4; i++) light(ctx, x - 12 + i * 8, y + 4.2, z - 6, 0xa8d8d0, i === 2 ? 10 : 3, 12);
  ctx.markLocation({ type: 'lab', x, z, y: gy, name });
}

/** Small shop / gas station. */
export function shop(ctx, x, z, { name = 'Corner Store', w = 9, d = 7 } = {}) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  const base = gy + 0.1;
  navigate(ctx, x, z, w + 6, d + 6, gy);
  ctx.occupy(x, z, w + 4, d + 4);
  b.box(x, gy, z, w + 0.4, 0.3, d + 0.4, 'concrete', { tex: 2, collideTag: 'floor' });
  b.box(x, base, z, w, 0.08, d, 'tile', { tex: 2, collideTag: 'floor' });
  roomShell(b, { x, z, w, d, y0: base, h: 3.2, mat: 'brick', thickness: 0.25, tex: 2, doors: [{ side: 'south', x: x - 2, w: 1.8, y0: base, y1: base + 2.3 }] });
  flatRoof(b, { x, z, w, d, y: base + 3.2, mat: 'roof' });
  for (let i = 0; i < 2; i++) P.shelf(b, x - 2 + i * 3, z - 1.5, base, 0, 1.6, 1.8, 0.5);
  loot(ctx, 'supermarket', x - 2, z - 1.5, base, 'shelf');
  loot(ctx, 'kitchen', x + 1, z - 1.5, base, 'shelf');
  P.table(b, x + 2.5, z + 2.0, base, Math.PI / 2, 2.0, 0.8);
  light(ctx, x, base + 2.8, z, 0xffd0a0, 8, 9);
  P.carWreck(b, x - 6, z + 5, gy, 0.8);
  ctx.markLocation({ type: 'shop', x, z, y: gy, name });
}

/** Military checkpoint: barriers, sandbags, guard post. */
export function checkpoint(ctx, x, z, rot = 0) {
  const b = ctx.builder;
  const gy = ctx.groundY(x, z);
  const base = gy + 0.1;
  ctx.occupy(x, z, 18, 12);
  b.box(x, gy, z, 14, 0.25, 8, 'concrete', { tex: 3, collideTag: 'floor' });
  roomShell(b, { x, z, w: 6, d: 5, y0: base, h: 2.8, mat: 'military', thickness: 0.2, tex: 1.8, doors: [{ side: 'west', x: z, w: 1.2, y0: base, y1: base + 2.2 }] });
  flatRoof(b, { x, z, w: 6, d: 5, y: base + 2.8, mat: 'militaryMetal' });
  P.sandbags(b, x, z + 5.5, gy, 0, 6, 1.1);
  P.sandbags(b, x + 7, z, gy, Math.PI / 2, 4, 0.8);
  P.jerseyBarrier(b, x - 6, z + 2, gy, 0.2);
  P.jerseyBarrier(b, x - 8.5, z + 2, gy, -0.1);
  P.ammoBox(b, x + 1, z + 4.0, gy, 0.3);
  loot(ctx, 'military', x + 1, z + 4.0, gy, 'ammo');
  loot(ctx, 'military', x - 1.5, z - 1.0, base, 'locker');
  P.watchtower(b, x - 9, z - 6, gy);
  P.antennaMast(b, x + 9, z - 5, gy, 7);
  light(ctx, x, base + 2.4, z, 0xc0d8b0, 7, 10);
  ctx.markLocation({ type: 'checkpoint', x, z, y: gy, name: 'Checkpoint' });
}
