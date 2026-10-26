// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// core/materials.js — three.js material factory on top of the
// procedural texture synthesiser.
// ============================================================
import * as THREE from 'three';
import { getTextureSet, MATERIAL_RECIPES } from './textures.js';

const texCache = new Map();
const matCache = new Map();

// One GPU texture per (name, size) — cloned only to carry repeat settings.
function baseTextures(name, size) {
  const key = name + ':' + size;
  if (texCache.has(key)) return texCache.get(key);
  const set = getTextureSet(name, size);
  const mk = (data, srgbFlag) => {
    const t = new THREE.DataTexture(data, set.width, set.height, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.colorSpace = srgbFlag ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  };
  const rec = {
    set,
    map: mk(set.albedo, true),
    normalMap: mk(set.normal, false),
    ormMap: mk(set.orm, false),
    emissiveMap: set.emissive ? mk(set.emissive, true) : null,
  };
  texCache.set(key, rec);
  return rec;
}

/**
 * Get a cached MeshStandardMaterial for a procedural material.
 * opts: { color, repeat:[u,v], roughness, metalness, emissive, emissiveIntensity,
 *         transparent, opacity, side, alphaTest, polygonOffset, normalScale, depthWrite }
 */
export function mat(name, opts = {}) {
  const recipe = MATERIAL_RECIPES[name];
  if (!recipe) throw new Error('Unknown material ' + name);
  const size = opts.size || recipe.size;
  const key = JSON.stringify([name, size, opts.color ?? null, opts.repeat ?? null, opts.roughness ?? null,
    opts.metalness ?? null, opts.emissive ?? null, opts.emissiveIntensity ?? null, opts.transparent ?? null,
    opts.opacity ?? null, opts.side ?? null, opts.alphaTest ?? null, opts.depthWrite ?? null, opts.unlit ?? null,
    opts.normalScale ?? null, opts.polygonOffset ?? null]);
  if (matCache.has(key)) return matCache.get(key);

  const rec = baseTextures(name, size);
  const repeat = opts.repeat || [1, 1];
  const map = rec.map.clone(); map.repeat.set(repeat[0], repeat[1]); map.needsUpdate = true;
  const normalMap = rec.normalMap.clone(); normalMap.repeat.set(repeat[0], repeat[1]); normalMap.needsUpdate = true;
  const ormMap = rec.ormMap.clone(); ormMap.repeat.set(repeat[0], repeat[1]); ormMap.needsUpdate = true;

  const m = new THREE.MeshStandardMaterial({
    map,
    normalMap,
    roughnessMap: ormMap,
    metalnessMap: ormMap,
    aoMap: ormMap,
    aoMapIntensity: 1.0,
    color: opts.color !== undefined ? new THREE.Color(opts.color) : 0xffffff,
    roughness: opts.roughness !== undefined ? opts.roughness : 1.0,
    metalness: opts.metalness !== undefined ? opts.metalness : 1.0,
    normalScale: new THREE.Vector2(opts.normalScale ?? 1, opts.normalScale ?? 1),
    transparent: !!opts.transparent,
    opacity: opts.opacity !== undefined ? opts.opacity : 1,
    side: opts.side !== undefined ? opts.side : THREE.FrontSide,
    alphaTest: opts.alphaTest || 0,
    depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
    polygonOffset: !!opts.polygonOffset,
    polygonOffsetFactor: opts.polygonOffset ? -1 : 0,
    polygonOffsetUnits: opts.polygonOffset ? -1 : 0,
  });
  if (rec.emissiveMap) {
    const em = rec.emissiveMap.clone(); em.repeat.set(repeat[0], repeat[1]); em.needsUpdate = true;
    m.emissiveMap = em;
    m.emissive = new THREE.Color(opts.emissive ?? 0xffffff);
    m.emissiveIntensity = opts.emissiveIntensity ?? 1;
  } else if (opts.emissive) {
    m.emissive = new THREE.Color(opts.emissive);
    m.emissiveIntensity = opts.emissiveIntensity ?? 1;
  }
  m.userData.texName = name;
  m.userData.repeat = repeat;
  m.userData.unlit = !!opts.unlit;
  m.userData.noShadow = !!opts.noShadow;
  if (opts.unlit) {
    m.emissive = new THREE.Color(0xffffff);
    m.emissiveMap = map;
    m.emissiveIntensity = 1;
    m.color = new THREE.Color(0x000000);
    m.roughness = 1; m.metalness = 0;
  }
  matCache.set(key, m);
  return m;
}

// Simple solid-colour material (rarer — used for glass, wires, markers).
export function plain(color, opts = {}) {
  const key = 'plain:' + color + JSON.stringify(opts);
  if (matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({
    color, roughness: opts.roughness ?? 0.85, metalness: opts.metalness ?? 0.0,
    transparent: !!opts.transparent, opacity: opts.opacity ?? 1,
    emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 1,
    side: opts.side ?? THREE.FrontSide, depthWrite: opts.depthWrite ?? true,
    alphaTest: opts.alphaTest ?? 0,
  });
  m.userData.texName = opts.texName || null;
  m.userData.noShadow = !!opts.noShadow;
  m.userData.unlit = !!opts.unlit;
  matCache.set(key, m);
  return m;
}

// Common shared materials --------------------------------------------------
export const M = {
  get concrete() { return mat('concrete', { color: 0xffffff, repeat: [1, 1], normalScale: 1.2 }); },
  get concreteWet() { return mat('concrete', { color: 0xdcdcda, roughness: 0.62, normalScale: 1.2 }); },
  get floor() { return mat('concrete_floor', { color: 0xf2f0ec }); },
  get brick() { return mat('brick', { color: 0xffffff }); },
  get brickGrey() { return mat('brick_grey', { color: 0xf4f2ee }); },
  get asphalt() { return mat('asphalt', { color: 0xffffff }); },
  get dirt() { return mat('dirt', { color: 0xffffff }); },
  get grass() { return mat('grass', { color: 0xffffff }); },
  get gravel() { return mat('gravel', { color: 0xffffff }); },
  get rust() { return mat('rust', { color: 0xffffff }); },
  get steel() { return mat('steel', { color: 0xffffff }); },
  get metalPaint() { return mat('metal_paint', { color: 0xf0f2ee }); },
  get wood() { return mat('wood', { color: 0xffffff }); },
  get woodWeathered() { return mat('wood_weathered', { color: 0xffffff }); },
  get tiles() { return mat('tiles', { color: 0xffffff }); },
  get panel() { return mat('panel', { color: 0xffffff }); },
  get fabric() { return mat('fabric', { color: 0xffffff }); },
  get skin() { return mat('skin', { color: 0xffffff, normalScale: 0.7 }); },
  get denim() { return mat('denim', { color: 0xffffff }); },
  get leather() { return mat('leather', { color: 0xffffff }); },
  get sand() { return mat('sand', { color: 0xffffff }); },
  get rock() { return mat('rock', { color: 0xffffff }); },
  get bark() { return mat('bark', { color: 0xffffff }); },
  get leaves() { return mat('leaves', { color: 0x8f9a6e, side: THREE.DoubleSide, alphaTest: 0.45, normalScale: 0.5, noShadow: true }); },
  get hazard() { return mat('hazard', { color: 0xffffff }); },
  get flesh() { return mat('flesh', { color: 0xffffff }); },
  get armor() { return mat('armor', { color: 0xffffff }); },
  get nest() { return mat('nest', { color: 0xffffff }); },
  get corrugated() { return mat('corrugated', { color: 0xffffff }); },
  get paper() { return mat('paper', { color: 0xffffff }); },
  get grassCard() { return mat('grasscard', { color: 0xffffff, side: THREE.DoubleSide, alphaTest: 0.42, normalScale: 0.4, noShadow: true, roughness: 0.95 }); },
  get water() { return mat('water', { color: 0xffffff }); },
  get glass() { return plain(0x8fa4a8, { roughness: 0.06, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false }); },
  get darkGlass() { return plain(0x2a3234, { roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.7 }); },
};

export function clearMaterialCache() {
  matCache.clear(); texCache.clear();
}
