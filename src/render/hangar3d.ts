/**
 * The 3D hangar environment.
 *
 * A working industrial bay: ribbed walls, ceiling trusses with spotlights, gantry cranes,
 * animated robotic service arms, holographic station pylons, maintenance rigs, crates,
 * fuel drums, pipes and the hazard-striped launch platform at the centre.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { hangarFloor, screenTexture } from './textures.ts';
import { emissiveMaterial, hullMaterial } from './modules3d.ts';
import { RNG } from '../core/rng.ts';

export interface HangarStation {
  id: 'shop' | 'crew' | 'packs' | 'upgrades' | 'missions' | 'launch' | 'builder';
  label: string;
  position: THREE.Vector3;
  object: THREE.Object3D;
  color: number;
}

export interface HangarBuild {
  group: THREE.Group;
  stations: HangarStation[];
  update: (t: number, dt: number) => void;
}

const HANGAR_RADIUS = 110;

export function buildHangar(quality: 'low' | 'medium' | 'high' = 'high'): HangarBuild {
  const group = new THREE.Group();
  const rng = new RNG(20260315);
  const stations: HangarStation[] = [];
  const animated: ((t: number, dt: number) => void)[] = [];

  const steel = hullMaterial(0x5a6276, 0x8fe8ff, 7701, 0.25);
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x262b36, metalness: 0.92, roughness: 0.42 });
  const paint = new THREE.MeshStandardMaterial({ color: 0x33415c, metalness: 0.6, roughness: 0.6 });
  const warn = new THREE.MeshStandardMaterial({ color: 0xffb700, metalness: 0.4, roughness: 0.6, emissive: 0x3a2600 });

  // ----------------------------------------------------------------- floor
  const floorPbr = hangarFloor(4242, quality === 'low' ? 512 : 1024);
  floorPbr.map.repeat.set(6, 6);
  floorPbr.normalMap.repeat.set(6, 6);
  floorPbr.roughnessMap.repeat.set(6, 6);
  floorPbr.metalnessMap!.repeat.set(6, 6);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(HANGAR_RADIUS, 64),
    new THREE.MeshStandardMaterial({
      map: floorPbr.map, normalMap: floorPbr.normalMap, roughnessMap: floorPbr.roughnessMap,
      metalnessMap: floorPbr.metalnessMap, metalness: 1, roughness: 1,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Central launch platform with rotating hazard ring.
  const padGroup = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(26, 28, 1.2, 48), darkSteel);
  pad.position.y = 0.6;
  pad.receiveShadow = true;
  padGroup.add(pad);
  const padRing = new THREE.Mesh(new THREE.TorusGeometry(26.5, 0.5, 8, 64), emissiveMaterial(0x00e5ff, 2.4));
  padRing.rotation.x = Math.PI / 2;
  padRing.position.y = 1.3;
  padGroup.add(padRing);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const seg = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 2.4), i % 2 ? warn : darkSteel);
    seg.position.set(Math.cos(a) * 23, 1.25, Math.sin(a) * 23);
    seg.rotation.y = -a;
    padGroup.add(seg);
  }
  group.add(padGroup);
  animated.push((t) => { padRing.material = padRing.material; padRing.rotation.z = t * 0.2; });

  // --------------------------------------------------------------- walls
  const wallGeos: THREE.BufferGeometry[] = [];
  const segments = 28;
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = Math.cos(a) * HANGAR_RADIUS;
    const z = Math.sin(a) * HANGAR_RADIUS;
    const panel = new THREE.BoxGeometry(26, 46, 3);
    panel.rotateY(-a + Math.PI / 2);
    panel.translate(x, 23, z);
    wallGeos.push(panel);
    // Vertical rib.
    const rib = new THREE.BoxGeometry(2.4, 50, 5);
    rib.rotateY(-a + Math.PI / 2);
    rib.translate(Math.cos(a + 0.11) * (HANGAR_RADIUS - 1), 25, Math.sin(a + 0.11) * (HANGAR_RADIUS - 1));
    wallGeos.push(rib);
  }
  const walls = new THREE.Mesh(mergeGeometries(wallGeos.map((g) => g.toNonIndexed()), false)!, steel);
  walls.receiveShadow = true;
  group.add(walls);

  // Upper gantry walkway ring.
  const walkway = new THREE.Mesh(new THREE.TorusGeometry(HANGAR_RADIUS - 9, 1.1, 8, 72), darkSteel);
  walkway.rotation.x = Math.PI / 2;
  walkway.position.y = 26;
  group.add(walkway);
  const railGeos: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const post = new THREE.BoxGeometry(0.4, 4, 0.4);
    post.translate(Math.cos(a) * (HANGAR_RADIUS - 9), 28, Math.sin(a) * (HANGAR_RADIUS - 9));
    railGeos.push(post);
  }
  group.add(new THREE.Mesh(mergeGeometries(railGeos.map((g) => g.toNonIndexed()), false)!, darkSteel));

  // ------------------------------------------------------------- ceiling
  const trussGeos: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI;
    const beam = new THREE.BoxGeometry(HANGAR_RADIUS * 2 - 6, 2.2, 2.2);
    beam.rotateY(a);
    beam.translate(0, 44, 0);
    trussGeos.push(beam);
    for (let j = -6; j <= 6; j++) {
      if (j === 0) continue;
      const strut = new THREE.BoxGeometry(1, 4.5, 1);
      strut.rotateY(a);
      strut.translate(Math.cos(a) * j * 15, 41.5, Math.sin(a) * j * 15);
      trussGeos.push(strut);
    }
  }
  const trusses = new THREE.Mesh(mergeGeometries(trussGeos.map((g) => g.toNonIndexed()), false)!, darkSteel);
  group.add(trusses);

  // Ceiling spot fixtures.
  const lampCount = quality === 'low' ? 4 : 7;
  for (let i = 0; i < lampCount; i++) {
    const a = (i / lampCount) * Math.PI * 2;
    const r = 52;
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.4, 2.6, 12), darkSteel);
    housing.position.set(Math.cos(a) * r, 42, Math.sin(a) * r);
    group.add(housing);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.4, 12), emissiveMaterial(0xcfe8ff, 3.4));
    lens.position.set(Math.cos(a) * r, 40.6, Math.sin(a) * r);
    group.add(lens);
    const spot = new THREE.SpotLight(0xd8ecff, quality === 'low' ? 320 : 520, 180, Math.PI / 5.2, 0.45, 1.6);
    spot.position.set(Math.cos(a) * r, 40, Math.sin(a) * r);
    spot.target.position.set(Math.cos(a) * r * 0.25, 0, Math.sin(a) * r * 0.25);
    spot.castShadow = quality === 'high' && i < 3;
    if (spot.castShadow) {
      spot.shadow.mapSize.set(1024, 1024);
      spot.shadow.bias = -0.0015;
    }
    group.add(spot, spot.target);
  }

  // --------------------------------------------------- gantry crane (animated)
  const crane = new THREE.Group();
  const craneBeam = new THREE.Mesh(new THREE.BoxGeometry(150, 3, 5), steel);
  craneBeam.position.y = 34;
  crane.add(craneBeam);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(3.4, 34, 3.4), steel);
    leg.position.set(side * 72, 17, 0);
    crane.add(leg);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 2, 14), darkSteel);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(side * 72, 1.6, 0);
    crane.add(wheel);
  }
  const hoist = new THREE.Group();
  const hoistBody = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 7), paint);
  hoistBody.position.y = 31;
  hoist.add(hoistBody);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 16, 6), darkSteel);
  cable.position.y = 21;
  hoist.add(cable);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.35, 8, 14), darkSteel);
  hook.position.y = 13;
  hoist.add(hook);
  crane.add(hoist);
  crane.position.z = -34;
  group.add(crane);
  animated.push((t) => {
    crane.position.z = -34 + Math.sin(t * 0.14) * 22;
    hoist.position.x = Math.sin(t * 0.21) * 48;
    cable.scale.y = 1 + Math.sin(t * 0.33) * 0.25;
    hook.position.y = 13 - Math.sin(t * 0.33) * 2;
  });

  // ------------------------------------------- robotic service arms (animated)
  const armPositions: [number, number][] = [[-44, 18], [44, 18], [-44, -18], [44, -18]];
  for (const [ax, az] of armPositions) {
    const armRoot = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.2, 2.4, 14), darkSteel);
    base.position.y = 1.2;
    armRoot.add(base);
    const yaw = new THREE.Group();
    yaw.position.y = 2.4;
    const seg1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 16, 2.4), steel);
    seg1.position.y = 8;
    yaw.add(seg1);
    const elbow = new THREE.Group();
    elbow.position.y = 16;
    const seg2 = new THREE.Mesh(new THREE.BoxGeometry(2, 13, 2), steel);
    seg2.position.y = 6.5;
    elbow.add(seg2);
    const wristGroup = new THREE.Group();
    wristGroup.position.y = 13;
    const tool = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3.2, 10), emissiveMaterial(0x53ffe0, 1.8));
    tool.rotation.x = Math.PI;
    tool.position.y = 1.5;
    wristGroup.add(tool);
    const clampA = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.6, 0.8), darkSteel);
    clampA.position.set(1.1, 1.4, 0);
    const clampB = clampA.clone();
    clampB.position.x = -1.1;
    wristGroup.add(clampA, clampB);
    elbow.add(wristGroup);
    yaw.add(elbow);
    armRoot.add(yaw);
    armRoot.position.set(ax, 0, az);
    group.add(armRoot);
    const phase = rng.range(0, Math.PI * 2);
    animated.push((t) => {
      yaw.rotation.y = Math.sin(t * 0.3 + phase) * 0.9 + Math.atan2(-az, -ax);
      elbow.rotation.x = -0.6 + Math.sin(t * 0.45 + phase) * 0.45;
      wristGroup.rotation.x = Math.sin(t * 0.7 + phase) * 0.5;
      clampA.position.x = 1.1 + Math.sin(t * 1.6 + phase) * 0.35;
      clampB.position.x = -1.1 - Math.sin(t * 1.6 + phase) * 0.35;
    });
  }

  // ------------------------------------------------------- station pylons
  const stationDefs: { id: HangarStation['id']; label: string; angle: number; color: number; kind: 'telemetry' | 'blueprint' | 'market' | 'radar' }[] = [
    { id: 'builder', label: 'SHIP CONSTRUCTION', angle: Math.PI * 0.5, color: 0x00e5ff, kind: 'blueprint' },
    { id: 'shop', label: 'EQUIPMENT SHOP', angle: Math.PI * 0.9, color: 0xffb700, kind: 'market' },
    { id: 'crew', label: 'CREW TERMINAL', angle: Math.PI * 1.22, color: 0x7b61ff, kind: 'telemetry' },
    { id: 'packs', label: 'CARD PACK STATION', angle: Math.PI * 1.55, color: 0xf472b6, kind: 'telemetry' },
    { id: 'upgrades', label: 'UPGRADE TERMINAL', angle: Math.PI * 1.85, color: 0x00ff9d, kind: 'blueprint' },
    { id: 'missions', label: 'MISSION BOARD', angle: Math.PI * 0.18, color: 0x49b6ff, kind: 'radar' },
  ];

  for (const sd of stationDefs) {
    const r = 62;
    const px = Math.cos(sd.angle) * r;
    const pz = Math.sin(sd.angle) * r;
    const st = new THREE.Group();
    st.position.set(px, 0, pz);
    st.rotation.y = -sd.angle + Math.PI / 2;

    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 5.6, 2.4, 10), darkSteel);
    plinth.position.y = 1.2;
    plinth.receiveShadow = true;
    st.add(plinth);
    const column = new THREE.Mesh(new THREE.BoxGeometry(3.2, 9, 3.2), steel);
    column.position.y = 6.6;
    st.add(column);
    const consoleGeo = new THREE.BoxGeometry(11, 7, 1.2);
    const consoleMesh = new THREE.Mesh(consoleGeo, paint);
    consoleMesh.position.set(0, 12.5, 0);
    consoleMesh.rotation.x = -0.22;
    st.add(consoleMesh);

    const { texture, draw } = screenTexture(sd.kind, sd.angle * 1000, quality === 'low' ? 256 : 512);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 6.2),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.96 }),
    );
    screen.position.set(0, 12.6, 0.72);
    screen.rotation.x = -0.22;
    st.add(screen);
    animated.push((t) => draw(t));

    // Holographic label slab.
    const holo = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 3.6),
      new THREE.MeshBasicMaterial({ color: sd.color, transparent: true, opacity: 0.18, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    holo.position.set(0, 18.5, 0);
    st.add(holo);
    const holoText = makeLabelPlane(sd.label, sd.color);
    holoText.position.set(0, 18.5, 0.08);
    st.add(holoText);
    const beamCone = new THREE.Mesh(
      new THREE.ConeGeometry(5.2, 7.5, 18, 1, true),
      new THREE.MeshBasicMaterial({ color: sd.color, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    );
    beamCone.position.y = 15.5;
    st.add(beamCone);
    const pointLight = new THREE.PointLight(sd.color, 34, 46, 2);
    pointLight.position.set(0, 13, 2);
    st.add(pointLight);
    animated.push((t) => {
      holo.position.y = 18.5 + Math.sin(t * 1.2 + sd.angle) * 0.35;
      holoText.position.y = holo.position.y + 0.08;
      (holo.material as THREE.MeshBasicMaterial).opacity = 0.14 + Math.sin(t * 2 + sd.angle) * 0.05;
      pointLight.intensity = 30 + Math.sin(t * 3 + sd.angle) * 6;
    });

    group.add(st);
    stations.push({ id: sd.id, label: sd.label, position: new THREE.Vector3(px, 14, pz), object: st, color: sd.color });
  }

  // ------------------------------------------------------- props & clutter
  const crateMatA = new THREE.MeshStandardMaterial({ color: 0x3f4a5c, metalness: 0.7, roughness: 0.55 });
  const crateMatB = new THREE.MeshStandardMaterial({ color: 0x6b5330, metalness: 0.5, roughness: 0.7 });
  const crates = new THREE.Group();
  for (let i = 0; i < (quality === 'low' ? 18 : 34); i++) {
    const a = rng.range(0, Math.PI * 2);
    const r = rng.range(40, HANGAR_RADIUS - 16);
    const w = rng.range(3, 7), h = rng.range(2.4, 5.5), d = rng.range(3, 7);
    const crate = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), rng.chance(0.5) ? crateMatA : crateMatB);
    crate.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
    crate.rotation.y = rng.range(0, Math.PI);
    crate.castShadow = true;
    crate.receiveShadow = true;
    crates.add(crate);
    if (rng.chance(0.35)) {
      const stacked = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, h * 0.7, d * 0.8), crateMatA);
      stacked.position.set(crate.position.x + rng.range(-0.6, 0.6), h + (h * 0.7) / 2, crate.position.z + rng.range(-0.6, 0.6));
      stacked.rotation.y = rng.range(0, Math.PI);
      stacked.castShadow = true;
      crates.add(stacked);
    }
  }
  group.add(crates);

  // Fuel drums with emissive bands.
  for (let i = 0; i < (quality === 'low' ? 6 : 14); i++) {
    const a = rng.range(0, Math.PI * 2);
    const r = rng.range(46, HANGAR_RADIUS - 20);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 4.2, 14), crateMatB);
    drum.position.set(Math.cos(a) * r, 2.1, Math.sin(a) * r);
    drum.castShadow = true;
    group.add(drum);
    const band = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.12, 6, 16), emissiveMaterial(0xff8a3c, 1.4));
    band.rotation.x = Math.PI / 2;
    band.position.copy(drum.position).setY(3.2);
    group.add(band);
  }

  // Pipework along the wall.
  const pipeGeos: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 5; i++) {
    const radius = HANGAR_RADIUS - 6 - i * 1.6;
    const pipe = new THREE.TorusGeometry(radius, 0.45, 8, 60, Math.PI * rng.range(0.5, 1.6));
    pipe.rotateX(Math.PI / 2);
    pipe.translate(0, 8 + i * 3.4, 0);
    pipe.rotateY(rng.range(0, Math.PI * 2));
    pipeGeos.push(pipe);
  }
  group.add(new THREE.Mesh(mergeGeometries(pipeGeos.map((g) => g.toNonIndexed()), false)!, darkSteel));

  // Maintenance scaffolds beside the pad.
  for (const side of [-1, 1]) {
    const scaffold = new THREE.Group();
    const frameGeos: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 4; i++) {
      const post = new THREE.BoxGeometry(0.8, 22, 0.8);
      post.translate((i % 2 ? 4 : -4), 11, (i < 2 ? 3 : -3));
      frameGeos.push(post);
    }
    for (let lvl = 1; lvl <= 3; lvl++) {
      const deck = new THREE.BoxGeometry(9.4, 0.5, 7);
      deck.translate(0, lvl * 6.5, 0);
      frameGeos.push(deck);
    }
    scaffold.add(new THREE.Mesh(mergeGeometries(frameGeos.map((g) => g.toNonIndexed()), false)!, steel));
    scaffold.position.set(side * 38, 0, 10);
    group.add(scaffold);
  }

  // Floor guide lights toward the launch pad.
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const led = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 0.7), emissiveMaterial(0x00e5ff, 2.2));
    led.position.set(Math.cos(a) * 34, 0.1, Math.sin(a) * 34);
    led.rotation.y = -a;
    group.add(led);
  }

  // Global ambient + fill lighting.
  const hemi = new THREE.HemisphereLight(0x5f7fbf, 0x101319, 0.55);
  group.add(hemi);
  const key = new THREE.DirectionalLight(0xdbe9ff, 1.25);
  key.position.set(60, 90, 40);
  key.castShadow = quality !== 'low';
  if (key.castShadow) {
    key.shadow.mapSize.set(quality === 'high' ? 2048 : 1024, quality === 'high' ? 2048 : 1024);
    key.shadow.camera.near = 10;
    key.shadow.camera.far = 260;
    const d = 90;
    key.shadow.camera.left = -d; key.shadow.camera.right = d;
    key.shadow.camera.top = d; key.shadow.camera.bottom = -d;
    key.shadow.bias = -0.0012;
  }
  group.add(key);
  const rim = new THREE.DirectionalLight(0x7b61ff, 0.5);
  rim.position.set(-70, 40, -60);
  group.add(rim);

  const update = (t: number, dt: number) => {
    for (const fn of animated) fn(t, dt);
  };

  return { group, stations, update };
}

/** Crisp canvas text plane used for holographic station labels. */
export function makeLabelPlane(text: string, color: number, width = 13, height = 3.6): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const col = new THREE.Color(color);
  ctx.fillStyle = `rgba(${(col.r * 255) | 0},${(col.g * 255) | 0},${(col.b * 255) | 0},1)`;
  ctx.font = 'bold 92px Orbitron, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 28;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
}
