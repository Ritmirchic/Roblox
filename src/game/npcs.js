// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// game/npcs.js — survivors, dialogue trees, shops, camp life
// ============================================================
import * as THREE from 'three';
import { mat, plain } from '../core/materials.js';
import { boxGeo, cylGeo, sphereGeo, coneGeo } from '../world/geo.js';
import { clamp, damp, dampAngle, RNG, lerp } from '../core/util.js';

// ------------------------------------------------------------
// Human body — five merged meshes (torso+head, 2 arms, 2 legs)
// so each survivor costs few draw calls while staying articulated.
// ------------------------------------------------------------
const G = {
  torso: (w, h, d) => boxGeo(w, h, d, 1.1),
  limb: (r, h) => cylGeo(r, r * 0.86, h, 8, 1.1),
  head: (r) => sphereGeo(r, 12, 1.1),
  box: (w, h, d) => boxGeo(w, h, d, 0.7),
  cone: (r, h) => coneGeo(r, h, 8),
};

function skinMat(tone) { return mat('skin', { color: tone || 0xc09a80, normalScale: 0.6, roughness: 0.86 }); }

// fabric/denim/leather albedo peaks around 0.3, so a mid-tone hex would read
// almost black. Scale the tint into linear space instead of editing the shared
// world textures (curtains and upholstery use the same recipes).
const CLOTH_GAIN = 2.4;
const cloth = (hex, name = 'fabric') => mat(name, { color: new THREE.Color(hex).multiplyScalar(CLOTH_GAIN), repeat: [1, 1] });

// Merge a list of geometries that share one material into a single buffer.
function mergeGeos(geos) {
  let vc = 0, ic = 0;
  for (const g of geos) { vc += g.attributes.position.count; ic += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(vc * 3), nrm = new Float32Array(vc * 3), uv = new Float32Array(vc * 2);
  const idx = new Uint32Array(ic);
  let vo = 0, io = 0;
  for (const g of geos) {
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    pos.set(p.array.subarray(0, p.count * 3), vo * 3);
    if (n) nrm.set(n.array.subarray(0, n.count * 3), vo * 3);
    if (u) uv.set(u.array.subarray(0, u.count * 2), vo * 2);
    if (g.index) { for (let i = 0; i < g.index.count; i++) idx[io++] = g.index.array[i] + vo; }
    else { for (let i = 0; i < p.count; i++) idx[io++] = i + vo; }
    vo += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  out.computeBoundingSphere();
  return out;
}

// Bake every mesh in `group` into one mesh per material (identity-space),
// so an articulated limb costs exactly one draw call per material.
function bakeByMaterial(group) {
  group.updateMatrixWorld(true);
  const buckets = new Map();
  group.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!buckets.has(o.material)) buckets.set(o.material, []);
    buckets.get(o.material).push(g);
  });
  const out = new THREE.Group();
  for (const [m, geos] of buckets) {
    const mesh = new THREE.Mesh(mergeGeos(geos), m);
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.userData.texName = m.userData.texName || null;
    out.add(mesh);
  }
  return out;
}

export function buildSignalEntity() {
  const g = new THREE.MeshStandardMaterial({
    color: 0x9c7bd0, emissive: 0x7a5fa8, emissiveIntensity: 2.4, transparent: true,
    opacity: 0.42, roughness: 0.5, metalness: 0.0, depthWrite: false, side: THREE.DoubleSide,
  });
  const root = new THREE.Group();
  const parts = [
    [0.13, 0.5, 0.13, 0, 1.55, 0],
    [0.10, 0.22, 0.10, 0, 1.92, 0],
    [0.0, 0, 0, 0, 0, 0],
  ];
  const torso = new THREE.Mesh(cylGeo(0.12, 0.18, 0.75, 10, 0.8), g);
  torso.position.y = 1.3; root.add(torso);
  const head = new THREE.Mesh(sphereGeo(0.115, 12, 0.8), g);
  head.position.y = 1.78; root.add(head);
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(cylGeo(0.038, 0.038, 0.62, 8, 0.8), g);
    arm.position.set(s * 0.2, 1.36, 0); arm.rotation.z = s * 0.14; root.add(arm);
    const leg = new THREE.Mesh(cylGeo(0.05, 0.042, 0.7, 8, 0.8), g);
    leg.position.set(s * 0.08, 0.55, 0); root.add(leg);
  }
  // scattering ribbons of light around the figure
  for (let i = 0; i < 7; i++) {
    const r = new THREE.Mesh(cylGeo(0.006, 0.006, 0.5 + i * 0.12, 4, 0.8), g);
    const a = (i / 7) * Math.PI * 2;
    r.position.set(Math.cos(a) * 0.45, 1.2 + Math.sin(i) * 0.2, Math.sin(a) * 0.45);
    r.rotation.z = Math.cos(a) * 0.5; r.rotation.x = Math.sin(a) * 0.5;
    root.add(r);
  }
  const light = new THREE.PointLight(0x8f6ad0, 6, 12, 2);
  light.position.set(0, 1.4, 0); root.add(light);
  root.userData.isSignal = true;
  root.userData.light = light;
  root.userData.mat = g;
  return root;
}

export function buildSurvivor(opts = {}) {
  const rng = new RNG(opts.seed || 7);
  const female = !!opts.female;
  const skin = skinMat(opts.skin || (female ? 0xc9a184 : 0xb89070));
  const coat = cloth(opts.coat || 0x6b5c4a, 'fabric');
  const pants = cloth(opts.pants || 0x3d4650, 'denim');
  const boots = cloth(0x3a2f26, 'leather');
  const hair = cloth(opts.hair || 0x2b2622, 'fabric');
  const metal = mat('steel', { color: 0x54585c });
  const wood = mat('wood', { color: 0x6a4a30, repeat: [1, 1] });
  const dark = plain(0x1a1815, { roughness: 0.45 });

  const scale = opts.scale || (female ? 0.94 : 1.0);
  const H = 1.76 * scale;

  const root = new THREE.Group();
  root.name = 'survivor';
  const staticGroup = new THREE.Group();     // baked into a few meshes
  const torso = new THREE.Group();            // animation pivot at the feet

  const hipsY = H * 0.50;
  const chestH = H * 0.26;
  const chestW = (female ? 0.36 : 0.44) * scale;
  const chestD = 0.21 * scale;
  const headY = hipsY + H * 0.10 + chestH + H * 0.12;

  const put = (geo, m, x, y, z, rot) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    if (rot) mesh.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
    staticGroup.add(mesh);
    return mesh;
  };

  // hips / chest / collar / belt
  put(G.box(chestW * 0.92, H * 0.10, chestD * 0.95), pants, 0, hipsY + H * 0.03, 0);
  put(G.torso(chestW, chestH, chestD), coat, 0, hipsY + H * 0.10 + chestH / 2, 0);
  put(G.box(chestW * 0.68, H * 0.03, chestD * 1.04), coat, 0, hipsY + H * 0.10 + chestH, 0);
  for (const s of [-1, 1]) {
    const cap = put(G.head(0.075 * scale), coat, s * chestW * 0.46, hipsY + H * 0.10 + chestH * 0.90, 0);
    cap.scale.set(1.05, 0.8, 1.0);
  }
  put(G.box(chestW * 0.95, 0.055, chestD * 1.02), boots, 0, hipsY + H * 0.085, 0);
  for (const s of [-1, 1]) {
    put(G.box(0.075 * scale, 0.09 * scale, 0.05 * scale), boots, s * 0.15 * scale, hipsY + H * 0.06, chestD * 0.5);
    put(G.box(0.055 * scale, chestH * 0.86, 0.02), boots, s * 0.1 * scale, hipsY + H * 0.10 + chestH * 0.55, chestD * 0.52, [-0.05, 0, 0]);
  }
  // neck / head / face
  put(G.limb(0.052 * scale, H * 0.055), skin, 0, hipsY + H * 0.10 + chestH + H * 0.025, 0);
  const headMesh = put(G.head(0.108 * scale), skin, 0, headY, 0);
  headMesh.scale.set(0.90, 1.06, 0.96);
  // chin and cheekbones round out the silhouette without a blocky jaw
  const chin = put(G.head(0.052 * scale), skin, 0, headY - 0.078 * scale, 0.020 * scale);
  chin.scale.set(0.95, 0.72, 0.9);
  for (const sd of [-1, 1]) {
    const cheek = put(G.head(0.028 * scale), skin, sd * 0.055 * scale, headY - 0.008 * scale, 0.062 * scale);
    cheek.scale.set(0.85, 0.6, 0.7);
  }
  // nose
  put(G.cone(0.015 * scale, 0.034 * scale), skin, 0, headY - 0.014 * scale, 0.092 * scale, [Math.PI / 2, 0, 0]);
  // eyes: sclera, dark iris, brows, and an eye-socket shadow
  for (const sd of [-1, 1]) {
    put(sphereGeo(0.018 * scale, 8, 0.4), skin, sd * 0.034 * scale, headY + 0.012 * scale, 0.0875 * scale).scale.set(1, 0.78, 0.45);
    put(sphereGeo(0.0105 * scale, 8, 0.35), dark, sd * 0.034 * scale, headY + 0.011 * scale, 0.0935 * scale);
    put(G.box(0.044 * scale, 0.009 * scale, 0.012 * scale), hair, sd * 0.036 * scale, headY + 0.037 * scale, 0.090 * scale, [0, 0, sd * -0.14]);
  }
  // mouth
  put(G.box(0.048 * scale, 0.007 * scale, 0.008 * scale), plain(0x6b4438, { roughness: 0.9 }), 0, headY - 0.050 * scale, 0.092 * scale);
  // ears
  for (const sd of [-1, 1]) {
    const ear = put(G.head(0.026 * scale), skin, sd * 0.095 * scale, headY - 0.006 * scale, 0.004 * scale);
    ear.scale.set(0.5, 1.0, 0.7);
  }
  // hair — cap sits back far enough that the face stays clear
  if (!opts.hat && opts.hairStyle !== 'bald') {
    const cap = put(G.head(0.121 * scale), hair, 0, headY + 0.028 * scale, -0.026 * scale);
    cap.scale.set(0.94, 0.92, 0.96);
    put(G.box(0.150 * scale, 0.024 * scale, 0.020 * scale), hair, 0, headY + 0.066 * scale, 0.072 * scale, [0.30, 0, 0]);
    if (opts.hairStyle === 'braid' || (female && rng.chance(0.55))) {
      put(cylGeo(0.03 * scale, 0.022 * scale, 0.34 * scale, 6, 0.7), hair, 0, headY - 0.14 * scale, -0.10 * scale, [0.22, 0, 0]);
      put(sphereGeo(0.032 * scale, 6, 0.6), hair, 0, headY - 0.31 * scale, -0.135 * scale);
    }
  } else if (opts.hat) {
    // keep a little hair at the back of the skull under the headwear
    const back = put(G.head(0.114 * scale), hair, 0, headY + 0.008 * scale, -0.048 * scale);
    back.scale.set(0.95, 0.92, 0.9);
  }
  // headwear — wraps the skull, face stays uncovered in front
  if (opts.hat === 'beanie') {
    const hc = cloth(opts.hatColor || 0x4b4238);
    const b = put(G.head(0.126 * scale), hc, 0, headY + 0.026 * scale, -0.030 * scale);
    b.scale.set(1.0, 0.98, 1.02);
    put(cylGeo(0.126 * scale, 0.127 * scale, 0.030 * scale, 12, 0.7), hc, 0, headY - 0.004 * scale, -0.047 * scale);
  } else if (opts.hat === 'cap') {
    const hc = cloth(opts.hatColor || 0x40483a);
    const c = put(G.head(0.124 * scale), hc, 0, headY + 0.040 * scale, -0.030 * scale);
    c.scale.set(1.0, 0.86, 1.02);
    put(G.box(0.150 * scale, 0.011 * scale, 0.085 * scale), boots, 0, headY + 0.055 * scale, 0.080 * scale, [-0.16, 0, 0]);
  }
  // scarf
  if (opts.scarf) {
    const sc = cloth(opts.scarfColor || 0x7a3f34);
    put(G.box(0.3 * scale, 0.09 * scale, 0.24 * scale), sc, 0, hipsY + H * 0.10 + chestH - 0.01, 0);
    put(G.box(0.09 * scale, 0.3 * scale, 0.02 * scale), sc, 0.06 * scale, hipsY + H * 0.10 + chestH - 0.17, 0.1 * scale, [0.1, 0, 0]);
  }
  // pack + bedroll
  if (opts.pack) {
    put(G.box(0.28 * scale, 0.36 * scale, 0.16 * scale), cloth(opts.packColor || 0x4e4a3c), 0, hipsY + H * 0.22, -0.18 * scale);
    const roll = put(G.limb(0.055 * scale, 0.3 * scale), cloth(0x6d6350), 0, hipsY + H * 0.40, -0.19 * scale);
    roll.rotation.z = Math.PI / 2;
  }
  // slung rifle
  if (opts.rifle) {
    put(G.box(0.06, 0.5, 0.16), wood, 0.16 * scale, hipsY + H * 0.24, -0.26 * scale, [0, 0, 0.34]);
    put(G.limb(0.016, 0.5), metal, 0.02, hipsY + H * 0.5, -0.3 * scale, [0, 0, 0.34]);
  }
  // chest zipper / emblem
  put(G.box(0.010, chestH * 0.8, 0.008), plain(0x4a4740, { roughness: 0.55, metalness: 0.35 }), 0, hipsY + H * 0.10 + chestH * 0.5, chestD * 0.52);

  const staticMesh = bakeByMaterial(staticGroup);
  for (const m of staticMesh.children) { m.castShadow = true; m.receiveShadow = true; }
  torso.add(staticMesh);

  // ----- articulated arms (sleeve mesh + hand mesh) -----
  const armR = 0.052 * scale, armLen = H * 0.30;
  const makeArm = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * (chestW * 0.5 + 0.035), hipsY + H * 0.10 + chestH * 0.90, 0);
    pivot.rotation.z = side * -0.055;
    const sleeveG = new THREE.Group();
    const upper = new THREE.Mesh(G.limb(armR, armLen * 0.52), coat); upper.position.y = -armLen * 0.26; sleeveG.add(upper);
    const fore = new THREE.Mesh(G.limb(armR * 0.88, armLen * 0.46), coat); fore.position.y = -armLen * 0.72; sleeveG.add(fore);
    const cuff = new THREE.Mesh(G.limb(armR * 0.9, 0.03), boots); cuff.position.y = -armLen * 0.95; sleeveG.add(cuff);
    const sleeve = bakeByMaterial(sleeveG);
    sleeve.children.forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
    sleeve.position.y = -armLen * 0.94;
    // bakeByMaterial works in world space, so re-origin back to the pivot
    sleeve.children.forEach((m) => { m.geometry.translate(0, armLen * 0.94, 0); });
    pivot.add(sleeve);
    const hand = new THREE.Mesh(G.head(armR * 0.98), skin);
    hand.position.y = -armLen * 0.99; hand.scale.set(1, 1.25, 0.7);
    hand.castShadow = true;
    pivot.add(hand);
    torso.add(pivot);
    return pivot;
  };
  const armL = makeArm(-1), armR2 = makeArm(1);

  const legLen = H * 0.47;
  const makeLeg = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * chestW * 0.24, hipsY + H * 0.02, 0);
    const legG = new THREE.Group();
    const thigh = new THREE.Mesh(G.limb(0.072 * scale, legLen * 0.52), pants); thigh.position.y = -legLen * 0.26; legG.add(thigh);
    const shin = new THREE.Mesh(G.limb(0.06 * scale, legLen * 0.5), pants); shin.position.y = -legLen * 0.74; legG.add(shin);
    const legMesh = bakeByMaterial(legG);
    legMesh.children.forEach((m) => { m.castShadow = true; m.receiveShadow = true; m.geometry.translate(0, 0, 0); });
    pivot.add(legMesh);
    const boot = new THREE.Mesh(G.box(0.1 * scale, 0.11 * scale, 0.24 * scale), boots);
    boot.position.set(0, -legLen * 1.0 + 0.02, 0.045 * scale);
    boot.castShadow = true;
    pivot.add(boot);
    torso.add(pivot);
    return pivot;
  };
  const legL = makeLeg(-1), legR = makeLeg(1);

  root.add(torso);
  // drop the body so the boot soles sit exactly on y = 0
  root.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(root);
  torso.position.y = -bb.min.y;
  const bones = { torso, armL, armR: armR2, legL, legR };
  root.userData.height = H;
  return { root, bones, materials: { skin, coat, pants, boots, hair }, height: H, phase: rng.range(0, 6.28) };
}

// Collapse an articulated survivor into static per-material meshes.
// Used for background camp life where limb animation is not needed.
export function flattenSurvivor(body) {
  const baked = bakeByMaterial(body.root);
  const box = new THREE.Box3().setFromObject(body.root);
  baked.position.copy(body.root.position);
  baked.rotation.copy(body.root.rotation);
  baked.children.forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
  baked.userData.height = body.height;
  return { root: baked, height: body.height, box };
}

// ------------------------------------------------------------
// Survivor roster
// ------------------------------------------------------------
export const NPCS = {
  nika: {
    name: 'Nika Volkova', role: 'Hollow Street Camp', poi: 'sub_camp', off: [3.4, 2.6],
    look: { female: true, coat: 0x6a5140, pants: 0x38424c, skin: 0xc9a184, hair: 0x3a2a20, scarf: true, scarfColor: 0x7a3f34, seed: 11 },
    tags: ['camp', 'trader'],
    shop: {
      buy: ['ammo_9mm', 'ammo_12g', 'bandage', 'water_bottle', 'crackers', 'jerky', 'cloth', 'battery', 'duct_tape', 'fuel', 'painkillers'],
      sellMul: 0.42, buyMul: 1.35,
    },
    nodes: {
      start: {
        text: (g) => {
          if (g.quests.isDone('m10')) return 'You came back from the church. Nobody comes back from the church. Sit down before you fall down.';
          if (g.quests.isActive('m09')) return 'The choir is still singing. I can hear it from here, and I am not going closer.';
          if (g.quests.canStart('m07')) return 'You are new. That means you still have all your fingers. Good. We need someone with fingers.';
          return 'Camp is quiet. Quiet is how I like it, and quiet never lasts.';
        },
        choices: [
          { t: 'Who are you?', next: 'who' },
          { t: 'What happened here?', next: 'what' },
          { t: 'I need work.', action: 'quest' },
          { t: 'Let me see your stock.', action: 'shop' },
          { t: 'Rest by the fire.', action: 'rest' },
          { t: 'Nothing. Stay alive.', action: 'close' },
        ],
      },
      who: {
        text: 'Nika. I ran the depot on Volkhov Street before it was a depot of nothing. Now I keep eleven people breathing and I count the days by how many of them are still doing it.',
        choices: [{ t: 'Why stay here?', next: 'why' }, { t: 'Back.', next: 'start' }],
      },
      why: {
        text: 'Because the alternative is walking. I have walked. Walking is just dying with extra steps and better scenery.',
        choices: [{ t: 'Back.', next: 'start' }],
      },
      what: {
        text: 'Six years ago the sky made a sound like a door closing. Then the wardens came through with green badges and told us to stay indoors. Then they stopped coming. Then the Hollow started singing.',
        choices: [{ t: 'The Hollow?', next: 'hollow' }, { t: 'Back.', next: 'start' }],
      },
      hollow: {
        text: 'People. Or they were. Something took their faces and gave them a choir. They hunt sound — a footstep, a cough, a radio. Keep moving and keep quiet. If you have to shoot, shoot once.',
        choices: [{ t: 'And the signal?', next: 'signal' }, { t: 'Back.', next: 'start' }],
      },
      signal: {
        text: 'Every radio in this district wakes up at the same time and plays a voice. Sometimes it is a woman reading numbers. Sometimes it is someone asking for help. Last week it was my husband. My husband has been dead for four years.',
        choices: [{ t: 'Back.', next: 'start' }],
      },
    },
  },

  anders: {
    name: 'Doctor Emil Anders', role: 'Blackwood Research Post', poi: 'for_outpost', off: [2.4, -2.0],
    look: { coat: 0x5a6058, pants: 0x3e3a34, skin: 0xb89a80, hair: 0x9a958c, pack: true, seed: 23 },
    tags: ['camp', 'science'],
    nodes: {
      start: {
        text: (g) => {
          if (g.quests.isDone('m15')) return 'The tapes are decoded. It is a woman counting down from fourteen point seven. She has been counting down for six years and she has not reached zero.';
          if (g.quests.isActive('m13')) return 'The reels are in the adit. Bring them back before the web does. Whatever those tapes are, they are still warm.';
          if (g.quests.canStart('m12')) return 'Do not stand in the doorway. The light attracts them and I have exactly one doorway left.';
          return 'I am recording. If you have something worth saying, say it into the microphone. Otherwise, mind the instruments.';
        },
        choices: [
          { t: 'What are you doing out here?', next: 'work' },
          { t: 'The signal. What is it?', next: 'sig' },
          { t: 'Do you have supplies?', action: 'shop' },
          { t: 'Anything useful for me?', action: 'quest' },
          { t: 'Leave him to it.', action: 'close' },
        ],
      },
      work: {
        text: 'Four years in this post, measuring a sound. I have the largest collection of magnetic tape in the world, and every reel says the same thing in a different woman\'s voice.',
        choices: [{ t: 'Why women?', next: 'women' }, { t: 'Back.', next: 'start' }],
      },
      women: {
        text: 'Because the broadcast reuses what it has. The people it swallowed. I am not sentimental about it. I am careful about it.',
        choices: [{ t: 'Back.', next: 'start' }],
      },
      sig: {
        text: '14.7 kilohertz. Constant carrier, buried under speech. It is not a recording — it responds. Ask it a question and wait nine seconds, and then it answers in a voice that has never heard your question.',
        choices: [{ t: 'What does it want?', next: 'want' }, { t: 'Back.', next: 'start' }],
      },
      want: {
        text: 'That is the question I intend to answer before I die. My working hypothesis is that it wants listeners. It is a mouth with no throat and it has been talking into a world that stopped listening.',
        choices: [{ t: 'Back.', next: 'start' }],
      },
    },
  },

  yelena: {
    name: 'Yelena Marsh', role: 'St. Agnes General Hospital', poi: 'city_hospital', off: [-2.8, 2.2],
    look: { female: true, coat: 0x8c8a7a, pants: 0x3e4650, skin: 0xb8876a, hair: 0x1e1a17, hat: 'beanie', hatColor: 0x4b4238, seed: 31 },
    tags: ['camp', 'medic'],
    shop: { buy: ['bandage', 'medkit', 'painkillers', 'antibiotics', 'antirad', 'splint', 'stim_combat', 'water_purified'], sellMul: 0.45, buyMul: 1.5 },
    nodes: {
      start: {
        text: (g) => {
          if (g.quests.isDone('m25')) return 'The generators are running on fumes and the tunnels are quiet. I have not had a quiet night in three weeks.';
          if (g.quests.isActive('m24')) return 'Sixth floor. Fuel, then the breaker. Do not take the elevator — the third floor is where it stops.';
          return 'You are bleeding on my floor. That is fine. Everyone bleeds on my floor. Sit.';
        },
        choices: [
          { t: 'Why keep the lights on?', next: 'lights' },
          { t: 'Tell me about the city.', next: 'city' },
          { t: 'Treat me. (Costs 40 scrap)', action: 'heal' },
          { t: 'I can help.', action: 'quest' },
          { t: 'How do I get past the wall?', next: 'wall' },
          { t: 'Leave.', action: 'close' },
        ],
      },
      lights: {
        text: 'Because on the night the wardens left, they turned the hospital lights off and everyone in the quarantine wing died in the dark. I was fourteen. I have kept them on since.',
        choices: [{ t: 'Back.', next: 'start' }],
      },
      city: {
        text: 'Kirov is a machine that eats people and leaves their apartments tidy. The silence is worse than the mutants. At least the mutants are honest about wanting to kill you.',
        choices: [{ t: 'Back.', next: 'start' }],
      },
      wall: {
        text: 'Metro Line 2 runs under the exclusion wall. The stairs behind the hospital go down. Something has been digging in the tunnels for years, so bring a light and a gun and a reason.',
        choices: [{ t: 'Back.', next: 'start' }],
      },
    },
  },

  kravchuk: {
    name: 'Sergeant Anton Kravchuk', role: 'Forward Post Delta', poi: 'mil_camp', off: [2.6, 2.2],
    look: { coat: 0x4c5342, pants: 0x3a4038, skin: 0xa8836a, hair: 0x6b6560, hat: 'cap', hatColor: 0x3c4436, rifle: true, pack: true, seed: 41 },
    tags: ['camp', 'military'],
    shop: { buy: ['ammo_9mm', 'ammo_762', 'ammo_12g', 'ammo_38', 'kevlar_vest', 'filter', 'gasmask', 'stim_combat', 'gunpowder'], sellMul: 0.4, buyMul: 1.45 },
    nodes: {
      start: {
        text: (g) => {
          if (g.quests.isDone('m30')) return 'The commander is dead. I have no orders. Four years of orders, and now I have a rifle and a chair and the sound of wind. Do you know what that is like?';
          if (g.quests.isActive('m29')) return 'The lab is below us. K-9. My men went down there in green badges and came back speaking in a language with too many vowels.';
          if (g.quests.canStart('m27')) return 'State your business at the post. Slowly. Hands where the light is.';
          return 'Perimeter is quiet. Patrol is overdue. Do not touch the wire.';
        },
        choices: [
          { t: 'Who still gives you orders?', next: 'orders' },
          { t: 'What is the exclusion zone?', next: 'zone' },
          { t: 'I need ammunition.', action: 'shop' },
          { t: 'I have questions about the lab.', action: 'quest' },
          { t: 'Dismissed.', action: 'close' },
        ],
      },
      orders: {
        text: 'The Commander. Pale Commander, we called him, because he never went outside. Written orders came twice a month, every month, for two years after the evacuation was cancelled. Then they came weekly. Then they came in his handwriting, and then they came in something that used his handwriting.',
        choices: [{ t: 'What did the last order say?', next: 'last' }, { t: 'Back.', next: 'start' }],
      },
      last: {
        text: 'CONTINUE BROADCAST. DO NOT ANSWER THEM. I have it in my pocket. I have read it four hundred times and I still do not know which of those is the warning.',
        choices: [{ t: 'Back.', next: 'start' }],
      },
      zone: {
        text: 'Sixty kilometres of wire and bunkers, built to keep something in. Every gun on every tower points at us. They spent a fortune making sure we could never look over the wall, and then they left the door open.',
        choices: [{ t: 'Back.', next: 'start' }],
      },
    },
  },

  mother_ash: {
    name: 'Mother Ash', role: 'Ash Nomads', poi: 'was_camp', off: [3.0, 1.8],
    look: { female: true, coat: 0x7a5a42, pants: 0x5a4636, skin: 0x8f7458, hair: 0x8a8478, hairStyle: 'braid', scarf: true, scarfColor: 0x8a6a3a, seed: 53 },
    tags: ['camp', 'nomad'],
    nodes: {
      start: {
        text: (g) => {
          if (g.quests.isDone('m35')) return 'The Titan is down and the ash falls the right way again. You have done a thing the red ground will remember longer than it remembers us.';
          if (g.quests.isActive('m32')) return 'Shards, child. Three of them. The lake likes to be paid and I am too old to argue with water.';
          return 'You are walking on my grandmother. Everyone walks on someone out here. Sit and I will tell you what the ground has been saying.';
        },
        choices: [
          { t: 'What is this place?', next: 'place' },
          { t: 'How do you survive out here?', next: 'survive' },
          { t: 'What do you need?', action: 'quest' },
          { t: 'Rest in the tent.', action: 'rest' },
          { t: 'Walk on.', action: 'close' },
        ],
      },
      place: {
        text: 'Before the sky broke, this was a station where people counted something invisible. Now we count the ones who walk out of the crater and do not come back. We call them the Contaminated. We call ourselves the lucky.',
        choices: [{ t: 'The crater?', next: 'crater' }, { t: 'Back.', next: 'start' }],
      },
      crater: {
        text: 'It was a cooling tower. The tower is still there. It stands up at the rim and the air bends around it. Some nights it walks. I have seen the ground shake where it stepped and I am not a woman who lies about the ground.',
        choices: [{ t: 'Back.', next: 'start' }],
      },
      survive: {
        text: 'We eat what grows in ash, and we do not eat what grows in the lake. We sleep in the day. We do not go to the array — the array is not ours, and the voice that lives in it has never once said a true thing.',
        choices: [{ t: 'Back.', next: 'start' }],
      },
    },
  },

  signal: {
    name: 'The Signal', role: '???', poi: 'was_array', off: [0, 3.0],
    look: { ghost: true, seed: 67 },
    tags: ['story'],
    nodes: {
      start: {
        text: 'Fourteen point seven. Fourteen point seven. You are standing in the mouth of it now, so we can speak without the radio.',
        choices: [
          { t: 'What are you?', next: 'what' },
          { t: 'Where is my brother?', next: 'brother' },
          { t: 'Why did you call me?', next: 'why' },
          { t: 'I am here to end this.', next: 'end' },
        ],
      },
      what: {
        text: 'I am what is left of a recording. A man spoke my first sentence into a microphone in a room under a mountain, and the room had been built to keep the sentence alive. He is dead. My sentence is not.',
        choices: [{ t: 'That is not an answer.', next: 'notans' }, { t: 'Back.', next: 'start' }],
      },
      notans: {
        text: 'No. It is the only answer I have that is entirely true. Everything else I could tell you would be a voice I am wearing.',
        choices: [{ t: 'Where is my brother?', next: 'brother' }],
      },
      brother: {
        text: 'Mikhail Vostrikov. Signal technician, Shelter Twelve, badge 4471. He came here to switch me off. He could not. He asked me to keep talking to you, and he wrote it down, and I have been reading his handwriting ever since.',
        choices: [{ t: 'Read it to me.', next: 'letter' }, { t: 'Back.', next: 'start' }],
      },
      letter: {
        text: '"If you are hearing this, you are colder than I was. Do not trust the voice. Do not trust the wardens. Trust the lights in the hospital. — M."',
        choices: [{ t: 'That is his handwriting.', next: 'end' }],
      },
      why: {
        text: 'Because a signal with no listener is just noise. I have been noise for six years. You are the first thing that walked toward me instead of away.',
        choices: [{ t: 'Then stop transmitting.', next: 'end' }],
      },
      end: {
        text: 'Yes. That is what he said, too. There is a console behind me. It will ask for a core and it will ask for a hand, and it will not tell you which one it wants more.',
        choices: [{ t: 'Do it.', action: 'finale' }, { t: 'Not yet.', action: 'close' }],
      },
    },
  },
};

// ------------------------------------------------------------
// Shop
// ------------------------------------------------------------
export class Shop {
  constructor(game, npc) {
    this.game = game;
    this.npc = npc;
    this.stock = {};
    for (const id of npc.shop.buy) {
      const def = this.game.itemDef(id);
      const base = def?.value || 10;
      this.stock[id] = { qty: Math.max(1, Math.round((def?.stack || 4) * 0.6)), price: Math.round(base * npc.shop.buyMul) };
    }
    this.restockTimer = 0;
  }

  priceOf(id) {
    const def = this.game.itemDef(id);
    return Math.round((def?.value || 10) * this.npc.shop.buyMul);
  }

  sellPrice(id) { return Math.round((this.game.itemDef(id)?.value || 5) * this.npc.shop.sellMul); }

  buy(id, qty = 1) {
    const st = this.stock[id];
    const inv = this.game.inventory;
    if (!st || st.qty < qty) { this.game.notify('They do not have that many.'); return false; }
    const cost = this.priceOf(id) * qty;
    if (inv.gold < cost) { this.game.notify('Not enough trade goods. You have ' + inv.gold + '.'); return false; }
    if (inv.add(id, qty) < qty) { this.game.notify('No room in the pack.'); return false; }
    inv.gold -= cost;
    st.qty -= qty;
    this.game.audio.trade();
    this.game.ui.refreshShop?.();
    return true;
  }

  sell(uid) {
    const item = this.game.inventory.items.find((i) => i.uid === uid);
    if (!item) return false;
    const value = this.sellPrice(item.id) * item.qty;
    this.game.inventory.removeUid(uid);
    this.game.inventory.gold += value;
    this.game.audio.trade();
    this.game.ui.refreshShop?.();
    return true;
  }

  update(dt) {
    this.restockTimer += dt;
    if (this.restockTimer > 240) {
      this.restockTimer = 0;
      for (const [id, st] of Object.entries(this.stock)) {
        const def = this.game.itemDef(id);
        st.qty = Math.min(st.qty + Math.ceil((def?.stack || 4) * 0.4), Math.round((def?.stack || 4) * 0.8));
      }
    }
  }
}

// ------------------------------------------------------------
// NPC system
// ------------------------------------------------------------
export class NPCSystem {
  constructor(game) {
    this.game = game;
    this.list = [];
    this.ambient = [];
    this.spawned = false;
    this.dialogue = null;
    this.nearest = null;
    this.shop = null;
    this.barkTimer = 0;
    this.finaleArmed = false;
  }

  poi(id) { return this.game.world.pois.find((p) => p.id === id); }

  freeSpot(x, z, radius = 0.55) {
    const w = this.game.world;
    const tryAt = (px, pz) => {
      const y = w.heightAt(px, pz);
      const hits = w.colliders.query(px - radius, pz - radius, px + radius, pz + radius);
      for (const c of hits) {
        if (c.maxY !== undefined && c.maxY < y + 0.4) continue; // low step, walkable
        if (c.tag === 'floor' || c.tag === 'road') continue;
        if (px + radius > c.minX && px - radius < c.maxX && pz + radius > c.minZ && pz - radius < c.maxZ) return false;
      }
      return true;
    };
    if (tryAt(x, z)) return { x, z, y: w.heightAt(x, z) };
    for (let r = 0.8; r <= 7; r += 0.8) {
      for (let a = 0; a < Math.PI * 2; a += 0.5) {
        const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
        if (tryAt(px, pz)) return { x: px, z: pz, y: w.heightAt(px, pz) };
      }
    }
    return { x, z, y: w.heightAt(x, z) };
  }

  spawn() {
    const scene = this.game.scene;
    for (const [id, def] of Object.entries(NPCS)) {
      const poi = this.poi(def.poi);
      if (!poi) { console.warn('NPC poi missing', def.poi); continue; }
      let x = poi.x + def.off[0], z = poi.z + def.off[1];
      if (def.look.ghost) {
        // signal entity: stand at the array, do not collide
        this.list.push({ id, def, x, z, y: poi.y, ghost: true });
        continue;
      }
      const spot = this.freeSpot(x, z, 0.6);
      x = spot.x; z = spot.z;
      const body = buildSurvivor(def.look);
      body.root.position.set(x, spot.y, z);
      body.root.rotation.y = Math.atan2(this.game.world.startPosition[0] - x, this.game.world.startPosition[2] - z);
      scene.add(body.root);
      const npc = {
        id, def, body, x, z, y: spot.y, ry: body.root.rotation.y,
        home: { x, z }, homeY: spot.y, shop: def.shop ? new Shop(this.game, def) : null,
        anim: Math.random() * 10, talkCooldown: 0, greeted: false,
      };
      this.list.push(npc);
    }
    this.spawnAmbient();
    this.spawned = true;
  }

  // Background camp life — static merged figures doing chores.
  spawnAmbient() {
    const camps = [
      ...(this.game.lite
        ? [['sub_camp', 2], ['city_camp', 1], ['mil_camp', 1], ['was_camp', 1]]
        : [['sub_camp', 5], ['city_camp', 4], ['mil_camp', 3], ['was_camp', 4], ['ind_camp', 3], ['for_outpost', 2], ['for_camp', 3]]),
    ];
    const rng = new RNG(9182);
    const outfits = [
      { coat: 0x5f5648, pants: 0x3a4148 }, { coat: 0x6a5a4a, pants: 0x46403a },
      { coat: 0x4e5a4c, pants: 0x343a40 }, { coat: 0x5a4a3c, pants: 0x3e4650 },
      { coat: 0x6a6252, pants: 0x2f3438 }, { coat: 0x7a5a44, pants: 0x4a4438 },
    ];
    for (const [poiId, count] of camps) {
      const poi = this.poi(poiId);
      if (!poi) continue;
      for (let i = 0; i < count; i++) {
        const a = rng.range(0, Math.PI * 2), r = rng.range(3.5, 10);
        const spot = this.freeSpot(poi.x + Math.cos(a) * r, poi.z + Math.sin(a) * r, 0.5);
        const o = outfits[rng.int(0, outfits.length - 1)];
        const female = rng.chance(0.5);
        const body = buildSurvivor({
          female, coat: o.coat, pants: o.pants, seed: rng.int(1, 9999),
          skin: female ? 0xc9a184 : 0xb89070, hat: rng.chance(0.4) ? 'beanie' : null,
          hair: [0x2b2622, 0x4a3a2a, 0x6b6560, 0x8a8478][rng.int(0, 3)],
        });
        // posing: crouch / sit / tend fire
        const pose = rng.int(0, 2);
        if (pose === 0) {
          body.bones.legL.rotation.x = -1.2; body.bones.legR.rotation.x = -1.2;
          body.root.position.y = spot.y - body.height * 0.28;
          body.bones.torso.rotation.x = 0.12;
        } else if (pose === 1) {
          body.bones.torso.rotation.x = 0.45; body.bones.armR.rotation.x = -0.9;
          body.bones.armL.rotation.x = -0.4;
          body.root.position.y = spot.y - body.height * 0.06;
        } else {
          body.bones.armL.rotation.x = -0.5; body.bones.armR.rotation.x = 0.25;
        }
        body.root.position.x = spot.x; body.root.position.z = spot.z;
        body.root.rotation.y = rng.range(0, Math.PI * 2);
        const flat = flattenSurvivor(body);
        this.game.scene.add(flat.root);
        this.ambient.push({ body: flat, x: spot.x, y: flat.root.position.y, z: spot.z, anim: rng.range(0, 9) });
      }
    }
  }

  // -------- dialogue --------
  open(npc) {
    if (!npc || npc.ghost) return;
    this.dialogue = { npc, nodeId: 'start', node: null, open: true };
    this.game.audio.uiClick();
    this.game.ui.openDialogue(npc.def.name, npc.def.role);
    this.enter('start');
  }

  enter(nodeId) {
    const d = this.dialogue;
    if (!d) return;
    const def = d.npc.def;
    const node = def.nodes[nodeId];
    if (!node) { this.close(); return; }
    d.nodeId = nodeId;
    const text = typeof node.text === 'function' ? node.text(this.game) : node.text;
    const raw = typeof node.choices === 'function' ? node.choices(this.game) : node.choices;
    const choices = (raw || []).map((c) => ({ text: c.t, action: c.action || null, next: c.next || null }));
    d.node = { text, choices };
    this.game.ui.showDialogue({ speaker: def.name, role: def.role, text, choices });
    this.game.audio.uiClick();
  }

  choose(index) {
    const d = this.dialogue;
    if (!d || !d.node) return;
    const c = d.node.choices[index];
    if (!c) return;
    this.game.audio.uiClick();
    if (c.next) { this.enter(c.next); return; }
    const a = c.action;
    if (!a || a === 'close') { this.close(); return; }
    const [kind, arg] = a.split(':');
    if (a === 'quest') return this.handleQuest(d.npc);
    if (a === 'shop') return this.openShop(d.npc);
    if (a === 'rest') return this.rest(d.npc);
    if (a === 'heal') return this.heal(d.npc);
    if (a === 'finale') return this.triggerFinale();
    if (a === 'save') { this.game.saveGame(true); this.game.notify('Journal updated.'); return; }
  }

  handleQuest(npc) {
    const quests = this.game.quests;
    const offered = ALL_OFFERS[npc.id] || [];
    const available = offered.find((id) => quests.canStart(id));
    const active = offered.find((id) => quests.isActive(id));
    if (available) {
      quests.start(available);
      const q = quests.def(available);
      this.showLine(npc, q.desc + '\n\n— Objective: ' + q.objectives.map((o) => o.desc).join(' '));
      return;
    }
    if (active) {
      const q = quests.def(active);
      const objectives = q.objectives.map((o, i) => {
        const st = quests.state[active];
        return (st.progress[i] >= (o.count || 1) ? '[x] ' : '[ ] ') + (o.desc || o.type);
      }).join('\n');
      this.showLine(npc, 'You are already on it.\n\n' + objectives);
      return;
    }
    this.showLine(npc, 'Nothing right now. Come back when the wind changes.');
  }

  showLine(npc, text) {
    this.dialogue.node = { text, choices: [{ text: 'Understood.', action: 'close' }] };
    this.game.ui.showDialogue({ speaker: npc.def.name, role: npc.def.role, text, choices: this.dialogue.node.choices });
  }

  openShop(npc) {
    if (!npc.shop) return;
    this.dialogue.open = false;
    this.game.ui.openShop(npc, npc.shop);
    this.game.audio.uiClick();
  }

  rest(npc) {
    this.close();
    // Rest advances time to morning, with a small threat cost
    this.game.restAtCamp(npc);
  }

  heal(npc) {
    const inv = this.game.inventory;
    if (inv.gold < 40) { this.showLine(npc, 'Forty in trade goods. I do not work for promises.'); return; }
    inv.gold -= 40;
    this.game.player.heal(70);
    this.game.player.stats.bleed = 0;
    this.game.player.stats.infection = Math.max(0, this.game.player.stats.infection - 40);
    this.game.audio.heal?.();
    this.game.notify('Patched up. -40 trade goods.');
    this.showLine(npc, 'That will hold. Keep it dry. Do not do whatever you did again.');
  }

  heroNodeFor(id, priority) {
    for (const nid of priority) if (this.NODES[id]?.[nid]) return nid;
    return 'start';
  }

  triggerFinale() {
    this.close();
    this.game.startFinale();
  }

  close() {
    this.dialogue = null;
    this.game.ui.closeDialogue();
  }

  // -------- update --------
  update(dt) {
    if (!this.spawned) return;
    const p = this.game.player;
    const px = p.position.x, pz = p.position.z, py = p.position.y;
    let best = null, bestD = 4.2;

    for (const npc of this.list) {
      if (npc.ghost) continue;
      const d = Math.hypot(npc.x - px, npc.z - pz);
      // face the player when close
      if (d < 7) {
        npc.ry = dampAngle(npc.ry, Math.atan2(px - npc.x, pz - npc.z), 2.2, dt);
        npc.body.root.rotation.y = npc.ry;
        npc.anim += dt;
        const breathe = Math.sin(npc.anim * 1.4) * 0.012;
        npc.body.bones.torso.position.y = breathe;
        npc.body.bones.torso.rotation.z = Math.sin(npc.anim * 0.5) * 0.012;
        npc.body.bones.armL.rotation.x = Math.sin(npc.anim * 0.7 + 0.4) * 0.06 - 0.04;
        npc.body.bones.armR.rotation.x = Math.sin(npc.anim * 0.66) * 0.06 - 0.04;
        // head look
        const hy = Math.atan2(px - npc.x, pz - npc.z) - npc.ry;
        npc.body.bones.torso.rotation.y = clamp(Math.sin(hy) * 0.12, -0.14, 0.14) * (Math.abs(hy) < 1.5 ? 1 : 0);
        // greeting bark
        if (d < 6 && !npc.greeted) {
          npc.greeted = true;
          npc.talkCooldown = 20;
          this.game.ui.notify(npc.def.name, this.greeting(npc), '#c8b48c');
        }
      } else {
        npc.anim += dt;
        npc.body.bones.torso.position.y = Math.sin(npc.anim * 0.9) * 0.008;
        npc.body.bones.torso.rotation.y *= 0.96;
      }
      if (npc.talkCooldown > 0) npc.talkCooldown -= dt;
      else npc.greeted = npc.greeted;
      if (d < bestD && Math.abs(npc.y - py) < 3.2) { best = npc; bestD = d; }
    }

    // ambient idle motion
    for (const a of this.ambient) {
      a.anim += dt;
      // ambient figures are flattened to a single mesh: sway the root instead
      if (a.body.bones?.torso) {
        a.body.bones.torso.rotation.z = Math.sin(a.anim * 0.6 + a.x) * 0.014;
        a.body.bones.torso.position.y = Math.sin(a.anim * 0.8 + a.z) * 0.007;
      } else if (a.body.root) {
        a.body.root.rotation.z = Math.sin(a.anim * 0.6 + a.x) * 0.006;
      }
    }

    const changed = best !== this.nearest;
    this.nearest = best;
    if (changed) {
      if (best) this.game.ui.setPrompt('[E]  Talk to ' + best.def.name);
      else this.game.ui.setPrompt(null);
    } else if (best && !this.game.ui.promptVisible?.()) {
      this.game.ui.setPrompt('[E]  Talk to ' + best.def.name);
    }
    if (!best && this.game.ui.promptVisible?.()) this.game.ui.setPrompt(null);

    // shops restock
    for (const npc of this.list) if (npc.shop) npc.shop.update(dt);
  }

  greeting(npc) {
    const g = this.game;
    const lines = {
      nika: ['You are standing in my light.', 'New face. Old coat. That tracks.', 'Do not touch the water barrel.'],
      anders: ['Mind the cables. Please.', 'You are breathing too loudly for the forest.', 'The instruments are recording you. Do not be alarmed.'],
      yelena: ['You look like you have not slept. Sit.', 'Wash your hands if you are coming in.', 'The generator is holding. Barely.'],
      kravchuk: ['Stop there. Identify.', 'Post is active. State your business.', 'You are not on the roster. You are lucky I am tired.'],
      mother_ash: ['The ground remembers you. Sit.', 'You carry ash in your coat. Good.', 'The lake is quiet tonight. That is not a kindness.'],
    };
    const arr = lines[npc.id] || ['...'];
    return arr[Math.floor(Math.random() * arr.length)];
  }

  interact() {
    if (!this.nearest) return false;
    this.open(this.nearest);
    return true;
  }

  // The Signal entity is a special non-NPC interaction at the array.
  signalNode() {
    const def = NPCS.signal;
    return def.nodes.start;
  }

  serialize() { return { greeted: this.list.map((n) => n.greeted) }; }
  deserialize(d) {
    if (!d?.greeted) return;
    this.list.forEach((n, i) => { if (d.greeted[i]) n.greeted = true; });
  }
}

// Which NPC hands out which quests
const ALL_OFFERS = {
  nika: ['m06', 'm07', 'm08', 's02'],
  anders: ['m12', 'm13', 'm14', 's08'],
  yelena: ['m23', 'm24', 'm25', 's17', 's18'],
  kravchuk: ['m27', 'm28', 'm29', 's26', 's27', 's30'],
  mother_ash: ['m32', 'm33', 'm34', 's32'],
};

export const NPC_OFFERS = ALL_OFFERS;
