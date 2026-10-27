// Temporary visual QA harness for the generated world (no gameplay systems).
import * as THREE from 'three';
import { TextureLib } from '../engine/textures.js';
import { CollisionWorld } from '../engine/collision.js';
import { SkySystem } from '../engine/sky.js';
import { PostFX } from '../engine/postfx.js';
import { World } from '../world/world.js';

const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.08, 1500);
const textures = new TextureLib(renderer, { size: 512 });
const collision = new CollisionWorld();

const game = {
  scene, renderer, camera, textures, collision,
  player: { position: new THREE.Vector3() },
  rng: Math.random,
  radioPlaylist: [],
  hud: { notify() {}, questToast() {}, showBoss() {}, hideBoss() {}, flashDamage() {}, regionCard() {}, addXp() {} },
  audio: { play() {}, footstep() {}, setListener() {} },
  fx: { groups: { dust: { spawn() {} }, smoke: { spawn() {} }, fire: { spawn() {} } } },
};
const sky = new SkySystem(scene, renderer);
sky.timeOfDay = 9.5;
sky.weather = { ...sky.weather, fog: 0.2, cloud: 0.45, storm: 0 };
game.sky = sky;
const postfx = new PostFX(renderer, scene, camera);
game.postfx = postfx;

const world = new World(game);
game.world = world;
world.generate();

window.__world = world;
window.__stats = world.generationStats;
window.__setCam = (px, py, pz, tx, ty, tz) => {
  camera.position.set(px, py, pz);
  camera.lookAt(tx, ty, tz);
  camera.updateMatrixWorld();
};
window.__time = (h) => { sky.timeOfDay = h; };
renderer.info.autoReset = false;
window.__frame = () => {
  renderer.info.reset();
  sky.update(1 / 60, camera, camera.position);
  if (window.__debug.noPost) renderer.render(scene, camera);
  else postfx.render(1 / 60);
  return {
    calls: renderer.info.render.calls,
    tris: renderer.info.render.triangles,
    geoms: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
  };
};
window.__debug = {
  noPost: false,
  plainTerrain(on) {
    const t = scene.getObjectByName('terrain');
    if (on) t.material = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.9 });
    else t.material = world.terrain.material;
  },
  lights() {
    const out = [];
    scene.traverse((o) => {
      if (o.isLight) out.push({ type: o.type, intensity: o.intensity, color: o.color.getHexString(), pos: o.position.toArray().map((v) => +v.toFixed(1)) });
    });
    return out;
  },
  shadow(on) { renderer.shadowMap.enabled = on; scene.traverse((o) => { if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) m.needsUpdate = true; } }); },
  terrainNormal(scale) { const t = scene.getObjectByName('terrain'); t.material.normalScale.set(scale, scale); t.material.needsUpdate = true; },
  pixel(x, y) {
    const gl = renderer.getContext();
    const buf = new Uint8Array(4);
    gl.readPixels(x, gl.drawingBufferHeight - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    return [...buf];
  },
};
window.__mapcam = (size = 900, y = 400) => {
  const cam = new THREE.OrthographicCamera(-size, size, size, -size, 0.5, 2000);
  cam.position.set(0, y, 0.001);
  cam.lookAt(0, 0, 0);
  cam.updateMatrixWorld();
  scene.fog = null;
  sky.timeOfDay = 12;
  sky.update(1 / 60, cam, new THREE.Vector3(0, 0, 0));
  scene.fog = null;
  renderer.render(scene, cam);
  return 'ok';
};
window.__ready = true;
console.log('WORLDVIEW_READY ' + JSON.stringify(world.generationStats));
