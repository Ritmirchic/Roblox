#!/usr/bin/env node
/**
 * Headless art validation / preview renderer.
 *
 * Runs the game's own procedural art pipeline outside the browser:
 *  - polyfills `document.createElement('canvas')` with @napi-rs/canvas
 *  - renders crew card faces, PBR texture sheets and achievement art to PNG
 *  - software-rasterises the real THREE.js ship, asteroid and enemy geometry so the
 *    3D models can be inspected without a GPU.
 *
 * Usage: node --experimental-strip-types scripts/render-preview.mjs [outDir]
 */
import { createCanvas } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = resolve(process.argv[2] ?? join(root, 'preview'));
mkdirSync(outDir, { recursive: true });

// --------------------------------------------------------------- DOM polyfill
const documentStub = {
  createElement(tag) {
    if (tag !== 'canvas') throw new Error(`Unsupported element: ${tag}`);
    const canvas = createCanvas(1, 1);
    canvas.style = {};
    return canvas;
  },
  createElementNS(_ns, tag) { return documentStub.createElement(tag); },
};
globalThis.document = documentStub;
globalThis.window = globalThis.window ?? { devicePixelRatio: 1, innerWidth: 1600, innerHeight: 900, addEventListener() {} };
globalThis.self = globalThis;
globalThis.performance = globalThis.performance ?? { now: () => Date.now() };

const imp = (rel) => import(pathToFileURL(join(root, rel)).href);

const { CREW_CARDS } = await imp('src/data/crew.ts');
const { renderCardFace, paintAchievementArt } = await imp('src/render/cardart.ts');
const { hullPlating, rockSurface, hangarFloor, spaceBackground } = await imp('src/render/textures.ts');
const THREE = await import('three');
const { buildModuleMesh, placeModuleObject, CELL_SIZE } = await imp('src/render/modules3d.ts');
const { buildAsteroid } = await imp('src/render/asteroids.ts');
const { buildEnemy } = await imp('src/render/enemies.ts');
const { ENEMIES } = await imp('src/data/sectors.ts');
const { ShipDesign } = await imp('src/sim/shipgrid.ts');

const save = (name, canvas) => {
  const file = join(outDir, name);
  writeFileSync(file, canvas.toBuffer('image/png'));
  console.log(`  wrote ${name} (${canvas.width}x${canvas.height})`);
};

// ---------------------------------------------------------------- card sheet
console.log('[1/5] rendering crew card faces');
{
  const cols = 6;
  const cardW = 300;
  const cardH = Math.round(cardW * 1.4);
  const picks = [0, 10, 19, 27, 34, 39, 42, 43, 3, 15, 22, 30];
  const rows = Math.ceil(picks.length / cols);
  const sheet = createCanvas(cols * cardW + (cols + 1) * 14, rows * cardH + (rows + 1) * 14);
  const sctx = sheet.getContext('2d');
  sctx.fillStyle = '#05070f';
  sctx.fillRect(0, 0, sheet.width, sheet.height);
  picks.forEach((index, i) => {
    const card = CREW_CARDS[index];
    const c = createCanvas(cardW, cardH);
    renderCardFace(c, card, cardW, cardH);
    const x = 14 + (i % cols) * (cardW + 14);
    const y = 14 + Math.floor(i / cols) * (cardH + 14);
    sctx.drawImage(c, x, y);
  });
  save('cards.png', sheet);

  const single = createCanvas(420, 588);
  renderCardFace(single, CREW_CARDS[43], 420, 588);
  save('card-secret.png', single);
  const legend = createCanvas(420, 588);
  renderCardFace(legend, CREW_CARDS[34], 420, 588);
  save('card-legendary.png', legend);
}

// ------------------------------------------------------------- texture sheet
console.log('[2/5] rendering procedural PBR textures');
{
  const tiles = [];
  const hull = hullPlating(0x5a6276, 0x8fe8ff, 7701, 256);
  tiles.push(['hull albedo', hull.map.image], ['hull normal', hull.normalMap.image], ['hull roughness', hull.roughnessMap.image]);
  for (const style of ['basalt', 'crystal', 'metal', 'volcanic', 'void']) {
    tiles.push([`rock ${style}`, rockSurface(style, 11, 256).map.image]);
  }
  tiles.push(['hangar deck', hangarFloor(4242, 256).map.image]);
  const size = 256;
  const cols = 3;
  const rows = Math.ceil(tiles.length / cols);
  const sheet = createCanvas(cols * (size + 12) + 12, rows * (size + 36) + 12);
  const ctx = sheet.getContext('2d');
  ctx.fillStyle = '#05070f';
  ctx.fillRect(0, 0, sheet.width, sheet.height);
  ctx.font = 'bold 15px sans-serif';
  tiles.forEach(([label, image], i) => {
    const x = 12 + (i % cols) * (size + 12);
    const y = 12 + Math.floor(i / cols) * (size + 36);
    ctx.drawImage(image, x, y, size, size);
    ctx.fillStyle = '#9fd8ff';
    ctx.fillText(label, x + 4, y + size + 20);
  });
  save('textures.png', sheet);

  const bg = spaceBackground(0x8b3bd8, 0x2b1060, 77, 1024);
  save('nebula.png', bg.image);
}

// --------------------------------------------------------- achievement cards
console.log('[3/5] rendering achievement art');
{
  const motifs = ['mining', 'combat', 'economy', 'exploration', 'engineering', 'collection'];
  const rarities = ['common', 'rare', 'epic', 'legendary', 'mythic', 'secret'];
  const size = 180;
  const sheet = createCanvas(motifs.length * (size + 10) + 10, size + 20);
  const ctx = sheet.getContext('2d');
  ctx.fillStyle = '#05070f';
  ctx.fillRect(0, 0, sheet.width, sheet.height);
  motifs.forEach((motif, i) => {
    const c = createCanvas(size, size);
    paintAchievementArt(c.getContext('2d'), motif, rarities[i], 8100 + i * 37, size, size);
    ctx.drawImage(c, 10 + i * (size + 10), 10);
  });
  save('achievements.png', sheet);
}

// ------------------------------------------------- software 3D rasteriser
/** Minimal z-buffered triangle rasteriser so meshes can be inspected without a GPU. */
function renderScene(objects, { width = 900, height = 600, camPos, lookAt, fov = 42, bg = '#05070f', light = [0.45, 0.8, 0.4] }) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  const img = ctx.getImageData(0, 0, width, height);
  const depth = new Float32Array(width * height).fill(Infinity);

  const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 5000);
  camera.position.set(...camPos);
  camera.lookAt(new THREE.Vector3(...lookAt));
  camera.updateMatrixWorld(true);
  const viewProj = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);

  const lightDir = new THREE.Vector3(...light).normalize();
  const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const p = [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()];
  const normal = new THREE.Vector3();
  const edge1 = new THREE.Vector3();
  const edge2 = new THREE.Vector3();

  for (const root of objects) {
    root.updateMatrixWorld(true);
    root.traverse((obj) => {
      const mesh = obj;
      if (!mesh.isMesh || !mesh.geometry?.attributes?.position) return;
      const geo = mesh.geometry;
      const pos = geo.attributes.position;
      const index = geo.index;
      const count = index ? index.count : pos.count;
      const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      const baseColor = new THREE.Color(mat?.color?.getHex?.() ?? 0x8899aa);
      const emissive = mat?.emissive ? new THREE.Color(mat.emissive.getHex()) : new THREE.Color(0, 0, 0);
      const emissiveStrength = Math.min(1, (mat?.emissiveIntensity ?? 1) * 0.35);

      for (let i = 0; i < count; i += 3) {
        for (let k = 0; k < 3; k++) {
          const vi = index ? index.getX(i + k) : i + k;
          v[k].fromBufferAttribute(pos, vi).applyMatrix4(mesh.matrixWorld);
          p[k].set(v[k].x, v[k].y, v[k].z, 1).applyMatrix4(viewProj);
        }
        if (p[0].w <= 0 || p[1].w <= 0 || p[2].w <= 0) continue;
        const sx = [], sy = [], sz = [];
        for (let k = 0; k < 3; k++) {
          sx[k] = ((p[k].x / p[k].w) * 0.5 + 0.5) * width;
          sy[k] = (1 - ((p[k].y / p[k].w) * 0.5 + 0.5)) * height;
          sz[k] = p[k].z / p[k].w;
        }
        edge1.subVectors(v[1], v[0]);
        edge2.subVectors(v[2], v[0]);
        normal.crossVectors(edge1, edge2).normalize();
        const lambert = Math.max(0.12, Math.abs(normal.dot(lightDir)));
        const rim = Math.pow(1 - Math.abs(normal.z), 2) * 0.18;
        const r = Math.min(255, (baseColor.r * lambert + emissive.r * emissiveStrength + rim) * 255);
        const g = Math.min(255, (baseColor.g * lambert + emissive.g * emissiveStrength + rim) * 255);
        const b = Math.min(255, (baseColor.b * lambert + emissive.b * emissiveStrength + rim) * 255);

        const minX = Math.max(0, Math.floor(Math.min(sx[0], sx[1], sx[2])));
        const maxX = Math.min(width - 1, Math.ceil(Math.max(sx[0], sx[1], sx[2])));
        const minY = Math.max(0, Math.floor(Math.min(sy[0], sy[1], sy[2])));
        const maxY = Math.min(height - 1, Math.ceil(Math.max(sy[0], sy[1], sy[2])));
        if (maxX < minX || maxY < minY) continue;
        const area = (sx[1] - sx[0]) * (sy[2] - sy[0]) - (sx[2] - sx[0]) * (sy[1] - sy[0]);
        if (Math.abs(area) < 1e-9) continue;

        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            const px = x + 0.5, py = y + 0.5;
            const w0 = ((sx[1] - px) * (sy[2] - py) - (sx[2] - px) * (sy[1] - py)) / area;
            const w1 = ((sx[2] - px) * (sy[0] - py) - (sx[0] - px) * (sy[2] - py)) / area;
            const w2 = 1 - w0 - w1;
            if (w0 < 0 || w1 < 0 || w2 < 0) continue;
            const z = w0 * sz[0] + w1 * sz[1] + w2 * sz[2];
            const di = y * width + x;
            if (z >= depth[di]) continue;
            depth[di] = z;
            const o = di * 4;
            img.data[o] = r;
            img.data[o + 1] = g;
            img.data[o + 2] = b;
            img.data[o + 3] = 255;
          }
        }
      }
    });
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

console.log('[4/5] rasterising ship modules and the assembled starter ship');
{
  const design = ShipDesign.starterShip();
  // Expand the design so the preview shows a meaningful build.
  design.buyCell([2, 0, 0]);
  design.buyCell([-2, 0, 0]);
  design.buyCell([0, 1, 0]);
  design.place('gun_laser', [2, 0, 0], 1);
  design.place('magnet_advanced', [-2, 0, 0], 3);
  design.place('shield_gen', [0, 1, 0], 4);

  const shipGroup = new THREE.Group();
  for (const mod of design.modules) {
    const built = buildModuleMesh(mod.defId);
    placeModuleObject(built.group, mod.defId, mod.pos, mod.orientation);
    shipGroup.add(built.group);
  }
  const canvas = renderScene([shipGroup], {
    width: 1000, height: 620, camPos: [26, 16, 30], lookAt: [0, 0, 1], fov: 38,
  });
  save('ship.png', canvas);

  // Individual hardware beauty shots.
  const ids = ['cockpit_basic', 'engine_fusion', 'railgun', 'drill_plasma', 'magnet_advanced', 'radar'];
  const tileW = 320, tileH = 240;
  const sheet = createCanvas(3 * tileW, 2 * tileH + 40);
  const sctx = sheet.getContext('2d');
  sctx.fillStyle = '#05070f';
  sctx.fillRect(0, 0, sheet.width, sheet.height);
  sctx.font = 'bold 14px sans-serif';
  ids.forEach((id, i) => {
    const built = buildModuleMesh(id);
    const tile = renderScene([built.group], {
      width: tileW, height: tileH, camPos: [7, 5, 9], lookAt: [0, 0, 0], fov: 40,
    });
    const x = (i % 3) * tileW;
    const y = Math.floor(i / 3) * tileH;
    sctx.drawImage(tile, x, y);
    sctx.fillStyle = '#9fd8ff';
    sctx.fillText(id, x + 8, y + tileH - 8);
  });
  save('modules.png', sheet);
  void CELL_SIZE;
}

console.log('[5/5] rasterising asteroids and enemy craft');
{
  const styles = ['basalt', 'crystal', 'metal', 'volcanic', 'void'];
  const tileW = 300, tileH = 240;
  const sheet = createCanvas(styles.length * tileW, tileH);
  const sctx = sheet.getContext('2d');
  styles.forEach((style, i) => {
    const { mesh } = buildAsteroid(style, 1000 + i * 37, 10, 3, i === 4 ? 0.6 : 0);
    const tile = renderScene([mesh], { width: tileW, height: tileH, camPos: [16, 11, 20], lookAt: [0, 0, 0], fov: 42 });
    sctx.drawImage(tile, i * tileW, 0);
  });
  save('asteroids.png', sheet);

  const types = ['scout', 'raider', 'heavy', 'plasma', 'sentinel'];
  const esheet = createCanvas(types.length * tileW, tileH);
  const ectx = esheet.getContext('2d');
  types.forEach((type, i) => {
    const built = buildEnemy(ENEMIES[type]);
    const scale = ENEMIES[type].scale;
    const tile = renderScene([built.group], {
      width: tileW, height: tileH,
      camPos: [10 * scale, 6 * scale, 13 * scale], lookAt: [0, 0, 0], fov: 42,
    });
    ectx.drawImage(tile, i * tileW, 0);
  });
  save('enemies.png', esheet);
}

console.log(`\nPreview images written to ${outDir}`);
