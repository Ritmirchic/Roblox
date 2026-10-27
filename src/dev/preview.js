// Temporary visual test harness: terrain + sample architecture.
import * as THREE from 'three';
import { TextureLib } from '../engine/textures.js';
import { CollisionWorld } from '../engine/collision.js';
import { Terrain } from '../world/terrain.js';
import { SkySystem } from '../engine/sky.js';
import { PostFX } from '../engine/postfx.js';
import { MeshBuilder, roomShell, flatRoof, wallWithOpening } from '../engine/geom.js';

const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.08, 1200);
const textures = new TextureLib(renderer, { size: 512 });
const collision = new CollisionWorld();
const terrain = new Terrain();

terrain.addRoad([[-1400, -1400], [-900, -1100], [-500, -700], [-100, -400], [400, -300], [900, -250]], 8);
terrain.addRoad([[-900, -1100], [-600, -1350]], 6);
terrain.prepare();
collision.terrain = terrain;

const builder = new MeshBuilder(textures, collision, { seed: 12 });

// a couple of buildings with real interiors
const px = -820;
const pz = -1000;
const py = terrain.heightAt(px, pz);
terrain.addPad(px, pz, 26, 20, py);
const groundY = py;
// floor + walls
builder.box(px, groundY - 0.15, pz, 14, 0.3, 10, 'concreteFloor', { tex: 3, collideTag: 'floor' });
roomShell(builder, { x: px, z: pz, w: 14, d: 10, y0: groundY, h: 3.2, mat: 'brick', doors: [{ side: 'south', x: px + 2, w: 1.6, h: 2.3 }], tex: 2 });
flatRoof(builder, { x: px, z: pz, w: 14, d: 10, y: groundY + 3.2, mat: 'concrete' });
// interior partition
wallWithOpening(builder, { x0: px - 7, x1: px + 0.5, z: pz + 1.5, y0: groundY, y1: groundY + 3.2, mat: 'plaster', open: { x: px - 3, w: 1.1, y0: groundY, y1: groundY + 2.1 } });
// second house
const px2 = -780;
const pz2 = -960;
const py2 = terrain.heightAt(px2, pz2);
builder.box(px2, py2 - 0.15, pz2, 12, 0.3, 9, 'concreteFloor', { tex: 3 });
roomShell(builder, { x: px2, z: pz2, w: 12, d: 9, y0: py2, h: 3.0, mat: 'plaster', doors: [{ side: 'north', x: px2, w: 1.5 }], tex: 2 });
flatRoof(builder, { x: px2, z: pz2, w: 12, d: 9, y: py2 + 3.0 });
// props
for (let i = 0; i < 16; i++) {
  const x = px + (Math.random() - 0.5) * 60;
  const z = pz + (Math.random() - 0.5) * 60;
  const y = terrain.heightAt(x, z);
  if (i % 4 === 0) builder.blob(x, y + 0.15, z, 0.6, 0.4, 0.7, 'rock', { detail: 1, rand: 0.5, seed: i });
  else builder.box(x, y + 0.4, z, 0.5, 0.8, 0.5, 'rust', { tex: 1 });
}
// a wrecked car
const cx = -800;
const cz = -940;
const cy = terrain.heightAt(cx, cz);
builder.box(cx, cy + 0.55, cz, 1.8, 0.65, 4.2, 'metalPlate', { tex: 1.2, rotY: 0.4 });
builder.box(cx, cy + 1.1, cz + 0.2, 1.6, 0.55, 2.0, 'rust', { tex: 1.2, rotY: 0.4 });

const built = builder.build();

const sky = new SkySystem(scene, renderer);
sky.timeOfDay = 16.4;
renderer.toneMappingExposure = 1.25;
const postfx = new PostFX(renderer, scene, camera);

scene.add(terrain.build(textures));
scene.add(built.group);

// test lights
const lamp = new THREE.PointLight(0xffb060, 30, 18, 2);
lamp.position.set(px, groundY + 2.6, pz);
scene.add(lamp);

const target = new THREE.Vector3(px + 12, groundY + 1.6, pz + 22);
camera.position.set(target.x + 28, target.y + 8, target.z + 14);
camera.lookAt(px, groundY + 1.6, pz);

let t = 0;
function frame() {
  t += 1 / 60;
  sky.update(1 / 60, camera, camera.position);
  postfx.render(1 / 60);
  requestAnimationFrame(frame);
}
frame();

window.__gameReady = true;
window.__shotList = () => ['a'];
window.__prepareShot = (name) => {
  const shots = {
    a: { pos: [px + 26, groundY + 7, pz + 18], look: [px, groundY + 1.5, pz] },
    b: { pos: [px + 10, groundY + 1.7, pz + 12], look: [px - 2, groundY + 1.6, pz] },
    c: { pos: [px - 40, groundY + 16, pz + 40], look: [px, groundY + 2, pz] },
  };
  const s = shots[name];
  if (s) {
    camera.position.set(...s.pos);
    camera.lookAt(...s.look);
    renderer.render(scene, camera);
  }
};
window.__perf = () => ({ objects: scene.children.length, drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles });
