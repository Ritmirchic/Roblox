/**
 * Procedural humanoid rig with code-driven animation.
 * Used by the player, friendly survivors and humanoid mutants. Every joint is a
 * THREE.Group, so the same rig can be re-skinned with different proportions and
 * palettes for each creature.
 */
import * as THREE from 'three';
import { clamp, clamp01, damp, lerp, smoothstep, TAU } from '../engine/util.js';

function mat(color, { rough = 0.85, metal = 0.0, emissive = 0x000000 } = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, emissive });
}

export const PALETTES = {
  player: { skin: 0xb08a6e, shirt: 0x30383b, pants: 0x32302c, boots: 0x1d1c1a, gear: 0x4a4a3e, hair: 0x2a211b },
  survivor: { skin: 0xa87f60, shirt: 0x4a4d3c, pants: 0x3a3630, boots: 0x241f1a, gear: 0x5a5344, hair: 0x3a2a1e },
  hollow: { skin: 0x8c8579, shirt: 0x3b3a35, pants: 0x2e2c28, boots: 0x1a1917, gear: 0x2a2a26, hair: 0x201d1a },
  pale: { skin: 0xc9c4b8, shirt: 0x2a2a2e, pants: 0x22222a, boots: 0x151518, gear: 0x33333a, hair: 0xd8d5cc },
  soldier: { skin: 0xa07a5c, shirt: 0x3f4a32, pants: 0x38412c, boots: 0x1c1e18, gear: 0x2f3626, hair: 0x2a231c },
};

export class Humanoid {
  constructor({ palette = PALETTES.player, scale = 1, build = 1, headless = false, detail = 1 } = {}) {
    this.palette = palette;
    this.scale = scale;
    this.build = build;
    this.detail = detail;
    this.root = new THREE.Group();
    this.root.name = 'humanoid';
    this.bones = {};
    this.parts = [];
    this.time = 0;
    this.speed = 0;
    this.state = 'idle';
    this.stateTime = 0;
    this.aimBlend = 0;
    this.crouchBlend = 0;
    this.recoil = 0;
    this.flinch = 0;
    this.breath = Math.random() * 10;
    this.headLook = { x: 0, y: 0 };
    this._build(headless);
    this.root.scale.setScalar(scale);
  }

  _mesh(geo, material, parent, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    this.parts.push(m);
    return m;
  }

  _joint(name, parent, x, y, z) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.name = name;
    parent.add(g);
    this.bones[name] = g;
    g.userData.rest = { x, y, z };
    return g;
  }

  _build(headless) {
    const p = this.palette;
    const det = this.detail;
    const matSkin = mat(p.skin, { rough: 0.72 });
    const matShirt = mat(p.shirt, { rough: 0.92 });
    const matPants = mat(p.pants, { rough: 0.95 });
    const matBoots = mat(p.boots, { rough: 0.65 });
    const matGear = mat(p.gear, { rough: 0.8, metal: 0.15 });
    const matHair = mat(p.hair, { rough: 0.95 });
    this.materials = { matSkin, matShirt, matPants, matBoots, matGear, matHair };

    const bw = this.build;
    // --- root/hips
    const hips = this._joint('hips', this.root, 0, 0.94, 0);
    this._mesh(new THREE.CapsuleGeometry(0.14 * bw, 0.1, 3, det > 0 ? 8 : 6), matPants, hips, 0, 0.02, 0);

    const spine = this._joint('spine', hips, 0, 0.1, 0);
    const chest = this._joint('chest', spine, 0, 0.18, 0);
    this._mesh(new THREE.CapsuleGeometry(0.155 * bw, 0.2, 4, det > 0 ? 10 : 6), matShirt, chest, 0, 0.04, 0);
    // vest / webbing
    this._mesh(new THREE.BoxGeometry(0.32 * bw, 0.3, 0.24), matGear, chest, 0, 0.05, 0.005);
    this._mesh(new THREE.BoxGeometry(0.1, 0.12, 0.09), matGear, chest, -0.12 * bw, -0.06, 0.13);
    this._mesh(new THREE.BoxGeometry(0.1, 0.12, 0.09), matGear, chest, 0.12 * bw, -0.06, 0.13);

    const neck = this._joint('neck', chest, 0, 0.24, 0);
    this._mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.08, 6), matSkin, neck, 0, 0.02, 0);
    const head = this._joint('head', neck, 0, 0.07, 0);
    if (!headless) {
      this._mesh(new THREE.SphereGeometry(0.105, det > 0 ? 14 : 8, det > 0 ? 12 : 6), matSkin, head, 0, 0.09, 0.005);
      this._mesh(new THREE.SphereGeometry(0.108, det > 0 ? 12 : 8, det > 0 ? 8 : 6, 0, TAU, 0, 1.3), matHair, head, 0, 0.11, -0.005);
      // jaw
      this._mesh(new THREE.BoxGeometry(0.11, 0.06, 0.08), matSkin, head, 0, 0.03, 0.04);
      // eyes (dark sockets - the mutants lack visible eyes)
      const eyeMat = mat(0x0a0a0a, { rough: 0.35 });
      this._mesh(new THREE.SphereGeometry(0.018, 6, 6), eyeMat, head, -0.038, 0.1, 0.093);
      this._mesh(new THREE.SphereGeometry(0.018, 6, 6), eyeMat, head, 0.038, 0.1, 0.093);
      // flashlight clipped to shoulder
      this._mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.11, 8), matGear, chest, 0.16 * bw, 0.1, 0.08).rotation.z = Math.PI / 2;
    }

    // --- arms
    for (const side of [-1, 1]) {
      const s = side < 0 ? 'L' : 'R';
      const sh = this._joint(`shoulder${s}`, chest, side * 0.19 * bw, 0.17, 0);
      this._mesh(new THREE.SphereGeometry(0.062, 8, 6), matShirt, sh, 0, 0, 0);
      const up = this._joint(`upperArm${s}`, sh, 0, -0.02, 0);
      this._mesh(new THREE.CapsuleGeometry(0.048, 0.2, 2, 7), matShirt, up, 0, -0.13, 0);
      const fore = this._joint(`forearm${s}`, up, 0, -0.28, 0);
      this._mesh(new THREE.CapsuleGeometry(0.042, 0.18, 2, 7), matSkin, fore, 0, -0.11, 0);
      // glove
      this._mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.07, 7), matBoots, fore, 0, -0.2, 0);
      const hand = this._joint(`hand${s}`, fore, 0, -0.26, 0);
      this._mesh(new THREE.BoxGeometry(0.075, 0.09, 0.05), matSkin, hand, 0, -0.03, 0);
    }

    // --- legs
    for (const side of [-1, 1]) {
      const s = side < 0 ? 'L' : 'R';
      const th = this._joint(`thigh${s}`, hips, side * 0.1 * bw, -0.05, 0);
      this._mesh(new THREE.CapsuleGeometry(0.072, 0.3, 2, 8), matPants, th, 0, -0.2, 0);
      const shin = this._joint(`shin${s}`, th, 0, -0.43, 0);
      this._mesh(new THREE.CapsuleGeometry(0.06, 0.29, 2, 8), matPants, shin, 0, -0.18, 0);
      this._mesh(new THREE.CylinderGeometry(0.062, 0.055, 0.2, 7), matBoots, shin, 0, -0.3, 0.0);
      const foot = this._joint(`foot${s}`, shin, 0, -0.4, 0);
      this._mesh(new THREE.BoxGeometry(0.1, 0.07, 0.24), matBoots, foot, 0, -0.035, 0.05);
    }

    // backpack (player/survivor only)
    if (p.gear && this.detail > 0) {
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.36, 0.16), mat(p.gear, { rough: 0.95 }));
      bag.position.set(0, 0.08, -0.19);
      bag.castShadow = true;
      chest.add(bag);
      this.parts.push(bag);
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 8), mat(0x4a4234));
      roll.position.set(0, 0.26, -0.2);
      roll.rotation.z = Math.PI / 2;
      chest.add(roll);
      this.parts.push(roll);
    }

    this.handR = this.bones.handR;
    this.handL = this.bones.handL;
    this.chest = chest;
    this.head = head;
    this.hips = hips;
    this.spine = spine;
  }

  /** Attach a weapon mesh to the right hand. */
  attachWeapon(obj, offset = { x: 0, y: -0.03, z: -0.02 }, rot = { x: 0, y: 0, z: 0 }) {
    if (this.weaponObj) this.handR.remove(this.weaponObj);
    this.weaponObj = obj;
    obj.position.set(offset.x, offset.y, offset.z);
    obj.rotation.set(rot.x, rot.y, rot.z);
    this.handR.add(obj);
  }

  attachToBone(name, obj, pos, rot) {
    const b = this.bones[name];
    obj.position.set(pos.x, pos.y, pos.z);
    obj.rotation.set(rot?.x || 0, rot?.y || 0, rot?.z || 0);
    b.add(obj);
    return obj;
  }

  setState(state) {
    if (this.state !== state) {
      this.state = state;
      this.stateTime = 0;
    }
  }

  triggerRecoil(amount = 1) {
    this.recoil = Math.min(1.4, this.recoil + amount);
  }

  triggerFlinch(amount = 1) {
    this.flinch = Math.min(1.5, this.flinch + amount);
  }

  /**
   * @param {object} opts speed (m/s), aim (0..1), crouch (0..1), look {x,y}
   */
  update(dt, opts = {}) {
    this.time += dt;
    this.stateTime += dt;
    const t = this.time;
    const speed = opts.speed ?? 0;
    const aim = (this.aimBlend = damp(this.aimBlend, opts.aim ?? 0, 12, dt));
    const crouch = (this.crouchBlend = damp(this.crouchBlend, opts.crouch ?? 0, 10, dt));
    this.recoil = Math.max(0, this.recoil - dt * 6);
    this.flinch = Math.max(0, this.flinch - dt * 3.2);
    const s = clamp01(speed / 4.2);
    const b = this.bones;
    const walkPhase = t * (4.6 + s * 6.2);
    const swing = Math.sin(walkPhase) * (0.16 + s * 0.62);
    const swing2 = Math.cos(walkPhase);

    // root/hips vertical bob + breathing
    const bob = Math.abs(Math.sin(walkPhase)) * (0.012 + s * 0.045);
    const breathe = Math.sin(t * 1.5 + this.breath) * 0.008;
    const crouchDrop = crouch * 0.34;
    b.hips.position.y = 0.94 - crouchDrop + bob + breathe - (this.state === 'dead' ? 0 : 0);
    b.hips.position.x = Math.sin(walkPhase) * 0.008 * s;
    b.hips.rotation.z = -Math.sin(walkPhase) * 0.045 * s;
    b.hips.rotation.y = Math.sin(walkPhase) * 0.06 * s;

    // torso lean with speed, twist when aiming
    const lean = s * 0.16 + crouch * 0.16;
    b.spine.rotation.x = lerp(b.spine.rotation.x, lean * 0.5, 1 - Math.exp(-10 * dt));
    b.chest.rotation.x = lerp(b.chest.rotation.x, lean * 0.5 - this.flinch * 0.35, 1 - Math.exp(-12 * dt));
    b.chest.rotation.y = lerp(b.chest.rotation.y, aim * 0.22 + Math.sin(walkPhase) * -0.07 * s, 1 - Math.exp(-9 * dt));
    b.chest.rotation.z = lerp(b.chest.rotation.z, Math.sin(walkPhase * 2) * 0.02 * s, 1 - Math.exp(-8 * dt));
    b.spine.rotation.y = -aim * 0.12;

    // head: counter-rotate body twist, track aim
    const lookX = opts.look?.x || 0;
    const lookY = opts.look?.y || 0;
    b.neck.rotation.x = lerp(b.neck.rotation.x, -lean * 0.6 + lookY * 0.4, 1 - Math.exp(-8 * dt));
    b.head.rotation.y = lerp(b.head.rotation.y, -0.1 * aim + lookX * 0.6 + Math.sin(t * 0.7) * 0.04, 1 - Math.exp(-6 * dt));
    b.head.rotation.x = lerp(b.head.rotation.x, lookY * 0.3 + Math.sin(t * 0.9) * 0.02, 1 - Math.exp(-6 * dt));

    // legs
    const legAmp = (0.45 + s * 0.55) * (1 - crouch * 0.35);
    const stride = Math.sin(walkPhase) * s;
    b.thighL.rotation.x = lerp(b.thighL.rotation.x, stride * legAmp + crouch * 0.55, 1 - Math.exp(-14 * dt));
    b.thighR.rotation.x = lerp(b.thighR.rotation.x, -stride * legAmp + crouch * 0.55, 1 - Math.exp(-14 * dt));
    b.thighL.rotation.z = 0.03;
    b.thighR.rotation.z = -0.03;
    b.shinL.rotation.x = lerp(b.shinL.rotation.x, -Math.max(0, Math.sin(walkPhase + 1.1)) * (0.5 + s * 0.8) - crouch * 0.9, 1 - Math.exp(-14 * dt));
    b.shinR.rotation.x = lerp(b.shinR.rotation.x, -Math.max(0, Math.sin(walkPhase + 1.1 + Math.PI)) * (0.5 + s * 0.8) - crouch * 0.9, 1 - Math.exp(-14 * dt));
    b.footL.rotation.x = lerp(b.footL.rotation.x, -b.shinL.rotation.x * 0.35 + crouch * 0.25, 1 - Math.exp(-12 * dt));
    b.footR.rotation.x = lerp(b.footR.rotation.x, -b.shinR.rotation.x * 0.35 + crouch * 0.25, 1 - Math.exp(-12 * dt));

    // arms: aim pose overrides
    const aimArm = aim;
    const swingArm = Math.sin(walkPhase + Math.PI) * (0.2 + s * 0.5);
    const idleSway = Math.sin(t * 1.1 + 0.5) * 0.04;
    // right arm (weapon hand)
    const rX = lerp(swingArm - 0.05 + idleSway, -1.42, aimArm);
    const rZ = lerp(0.18, -0.05, aimArm);
    b.upperArmR.rotation.x = lerp(b.upperArmR.rotation.x, rX + this.recoil * 0.28, 1 - Math.exp(-16 * dt));
    b.upperArmR.rotation.z = lerp(b.upperArmR.rotation.z, rZ, 1 - Math.exp(-12 * dt));
    b.upperArmR.rotation.y = lerp(b.upperArmR.rotation.y, lerp(-0.1, 0.18, aimArm), 1 - Math.exp(-12 * dt));
    b.forearmR.rotation.x = lerp(b.forearmR.rotation.x, lerp(-0.35, -0.18, aimArm), 1 - Math.exp(-12 * dt));
    b.forearmR.rotation.z = lerp(b.forearmR.rotation.z, lerp(0, 0.1, aimArm), 1 - Math.exp(-12 * dt));
    b.handR.rotation.x = lerp(b.handR.rotation.x, lerp(0, 0.05, aimArm), 1 - Math.exp(-10 * dt));
    // left arm supports the weapon when aiming
    const lX = lerp(-swingArm - 0.05 - idleSway, -1.32, aimArm);
    b.upperArmL.rotation.x = lerp(b.upperArmL.rotation.x, lX, 1 - Math.exp(-16 * dt));
    b.upperArmL.rotation.z = lerp(b.upperArmL.rotation.z, lerp(-0.18, 0.42, aimArm), 1 - Math.exp(-12 * dt));
    b.upperArmL.rotation.y = lerp(b.upperArmL.rotation.y, lerp(0.1, -0.34, aimArm), 1 - Math.exp(-12 * dt));
    b.forearmL.rotation.x = lerp(b.forearmL.rotation.x, lerp(-0.35, -1.0, aimArm), 1 - Math.exp(-12 * dt));
    b.forearmL.rotation.z = lerp(b.forearmL.rotation.z, lerp(0, -0.35, aimArm), 1 - Math.exp(-12 * dt));

    // state-specific overrides
    if (this.state === 'reload') {
      const rt = clamp01(this.stateTime / 1.7);
      b.upperArmL.rotation.x = lerp(b.upperArmL.rotation.x, -0.7 - Math.sin(rt * Math.PI) * 0.6, 0.5);
      b.forearmL.rotation.x = lerp(b.forearmL.rotation.x, -1.3, 0.5);
      b.forearmR.rotation.x = lerp(b.forearmR.rotation.x, -0.5 + Math.sin(rt * Math.PI * 2) * 0.2, 0.4);
    } else if (this.state === 'melee') {
      const mt = clamp01(this.stateTime / 0.62);
      const swingCurve = Math.sin(mt * Math.PI);
      b.upperArmR.rotation.x = lerp(b.upperArmR.rotation.x, -2.1 + swingCurve * 2.6, 0.72);
      b.upperArmR.rotation.z = lerp(b.upperArmR.rotation.z, 0.75 - swingCurve * 1.1, 0.72);
      b.forearmR.rotation.x = lerp(b.forearmR.rotation.x, -0.6 - swingCurve * 0.5, 0.6);
      b.chest.rotation.y = lerp(b.chest.rotation.y, 0.55 - swingCurve * 1.1, 0.55);
    } else if (this.state === 'heal') {
      const ht = clamp01(this.stateTime / 2.0);
      b.upperArmL.rotation.x = lerp(b.upperArmL.rotation.x, -1.9 + Math.sin(ht * Math.PI) * 0.5, 0.5);
      b.forearmL.rotation.x = lerp(b.forearmL.rotation.x, -1.5, 0.5);
    } else if (this.state === 'interact') {
      b.upperArmR.rotation.x = lerp(b.upperArmR.rotation.x, -1.1, 0.4);
      b.forearmR.rotation.x = lerp(b.forearmR.rotation.x, -0.8, 0.4);
    } else if (this.state === 'dead') {
      const dt2 = clamp01(this.stateTime / 0.8);
      const ease = 1 - Math.pow(1 - dt2, 3);
      b.hips.position.y = lerp(0.94, 0.22, ease);
      b.hips.rotation.x = lerp(0, -1.45, ease);
      b.thighL.rotation.x = lerp(b.thighL.rotation.x, -0.6, ease);
      b.thighR.rotation.x = lerp(b.thighR.rotation.x, -0.35, ease);
      b.shinL.rotation.x = lerp(b.shinL.rotation.x, -0.9, ease);
      b.shinR.rotation.x = lerp(b.shinR.rotation.x, -0.5, ease);
      b.upperArmL.rotation.x = lerp(b.upperArmL.rotation.x, 0.6, ease);
      b.upperArmR.rotation.x = lerp(b.upperArmR.rotation.x, -0.4, ease);
      b.head.rotation.x = lerp(b.head.rotation.x, 0.4, ease);
    } else if (this.state === 'attack') {
      // creature lunge/telegraph handled by subclasses through attackPhase
      const at = clamp01(this.stateTime / (opts.attackDur || 0.8));
      const lunge = Math.sin(at * Math.PI);
      b.upperArmR.rotation.x = lerp(b.upperArmR.rotation.x, -2.4 + lunge * 1.2, 0.6);
      b.upperArmL.rotation.x = lerp(b.upperArmL.rotation.x, -2.4 + lunge * 1.2, 0.6);
      b.chest.rotation.x = lerp(b.chest.rotation.x, 0.1 - lunge * 0.5, 0.5);
    }

    // flinch reaction
    if (this.flinch > 0.01) {
      b.chest.rotation.x -= this.flinch * 0.25;
      b.head.rotation.x -= this.flinch * 0.2;
      b.hips.position.y -= this.flinch * 0.03;
    }
  }

  setVisible(v) {
    this.root.visible = v;
  }

  dispose() {
    for (const m of this.parts) {
      m.geometry?.dispose?.();
      if (m.material && m.material.__shared !== true) m.material.dispose?.();
    }
    for (const m of Object.values(this.materials)) m.dispose?.();
  }
}

/** Simple quad-legged / blob creature rig used by non-humanoid mutants. */
export class Quadruped {
  constructor({ palette, scale = 1, legs = 4, bodyLen = 1.2, bodyH = 0.5 } = {}) {
    this.palette = palette;
    this.root = new THREE.Group();
    this.bones = {};
    this.parts = [];
    this.time = Math.random() * 10;
    this.state = 'idle';
    this.stateTime = 0;
    this.recoil = 0;
    this.flinch = 0;
    this.legCount = legs;
    this._build(scale, bodyLen, bodyH);
  }

  _build(scale, bodyLen, bodyH) {
    const skin = new THREE.MeshStandardMaterial({ color: 0x5f4a3c, roughness: 0.72 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2c2620, roughness: 0.9 });
    const bone = new THREE.MeshStandardMaterial({ color: 0xbdb3a0, roughness: 0.6 });
    this.mats = { skin, dark, bone };
    const body = new THREE.Group();
    body.position.y = bodyH;
    this.root.add(body);
    this.bones.body = body;
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, bodyLen * 0.5, 4, 10), skin);
    torso.rotation.z = Math.PI / 2;
    torso.castShadow = true;
    torso.receiveShadow = true;
    body.add(torso);
    this.parts.push(torso);
    // ribs / spine spikes
    for (let i = 0; i < 5; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 5), bone);
      spike.position.set(-bodyLen * 0.24 + i * bodyLen * 0.12, 0.24, 0);
      spike.rotation.x = -0.35;
      spike.castShadow = true;
      body.add(spike);
      this.parts.push(spike);
    }
    const neck = new THREE.Group();
    neck.position.set(bodyLen * 0.42, 0.08, 0);
    body.add(neck);
    this.bones.neck = neck;
    const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.24, 3, 8), skin);
    head.rotation.z = Math.PI / 2;
    head.position.x = 0.18;
    head.castShadow = true;
    neck.add(head);
    this.parts.push(head);
    const jaw = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.2, 6), dark);
    jaw.rotation.z = -Math.PI / 2;
    jaw.position.set(0.34, -0.03, 0);
    neck.add(jaw);
    this.parts.push(jaw);
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: 0x220000, roughness: 0.2 }));
      eye.position.set(0.24, 0.06, side * 0.08);
      neck.add(eye);
      this.parts.push(eye);
    }
    // legs
    const pairs = [
      { x: bodyLen * 0.3, y: -0.16, z: 0.22 },
      { x: -bodyLen * 0.3, y: -0.16, z: 0.22 },
    ];
    let idx = 0;
    for (const pr of pairs) {
      for (const side of [-1, 1]) {
        const hip = new THREE.Group();
        hip.position.set(pr.x, pr.y, side * pr.z);
        body.add(hip);
        this.bones[`leg${idx}`] = hip;
        const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.28, 2, 6), dark);
        upper.position.y = -0.16;
        upper.castShadow = true;
        hip.add(upper);
        this.parts.push(upper);
        const knee = new THREE.Group();
        knee.position.y = -0.34;
        hip.add(knee);
        this.bones[`knee${idx}`] = knee;
        const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.3, 2, 6), dark);
        lower.position.y = -0.17;
        lower.castShadow = true;
        knee.add(lower);
        this.parts.push(lower);
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 5), bone);
        claw.rotation.x = Math.PI;
        claw.position.y = -0.36;
        knee.add(claw);
        this.parts.push(claw);
        idx++;
      }
    }
    const tail = new THREE.Group();
    tail.position.set(-bodyLen * 0.44, 0.1, 0);
    body.add(tail);
    this.bones.tail = tail;
    const tailMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.6, 2, 6), skin);
    tailMesh.rotation.z = Math.PI / 2;
    tailMesh.position.x = -0.34;
    tail.add(tailMesh);
    this.parts.push(tailMesh);
    this.root.scale.setScalar(scale);
  }

  setState(s) {
    if (this.state !== s) {
      this.state = s;
      this.stateTime = 0;
    }
  }

  triggerRecoil(a = 1) {
    this.recoil = Math.min(1.5, this.recoil + a);
  }

  triggerFlinch(a = 1) {
    this.flinch = Math.min(1.5, this.flinch + a);
  }

  update(dt, opts = {}) {
    this.time += dt;
    this.stateTime += dt;
    const t = this.time;
    const speed = opts.speed ?? 0;
    const s = clamp01(speed / 6);
    const phase = t * (5 + s * 8);
    this.recoil = Math.max(0, this.recoil - dt * 5);
    this.flinch = Math.max(0, this.flinch - dt * 3);
    const b = this.bones;
    b.body.position.y = 0.5 + Math.sin(phase) * 0.02 + Math.abs(Math.sin(phase)) * 0.03 * s;
    b.body.rotation.z = Math.sin(phase) * 0.03 * s + (opts.aim ? 0 : 0);
    b.body.rotation.x = Math.sin(phase * 2) * 0.02 * s - this.recoil * 0.2;
    for (let i = 0; i < this.legCount; i++) {
      const leg = b[`leg${i}`];
      const knee = b[`knee${i}`];
      const off = i % 2 === 0 ? 0 : Math.PI;
      const sw = Math.sin(phase + off);
      leg.rotation.z = sw * (0.35 + s * 0.55);
      knee.rotation.z = -Math.max(0, Math.sin(phase + off + 1.2)) * (0.3 + s * 0.6);
    }
    b.neck.rotation.y = Math.sin(t * 0.8) * 0.15;
    b.neck.rotation.z = -0.05 + Math.sin(t * 0.6) * 0.04 - this.flinch * 0.4;
    b.tail.rotation.y = Math.sin(t * 2.2) * 0.35 + Math.sin(phase) * 0.2;
    if (this.state === 'attack') {
      const at = clamp01(this.stateTime / 0.7);
      b.body.position.y += Math.sin(at * Math.PI) * 0.18;
      b.neck.rotation.z = -0.05 - Math.sin(at * Math.PI) * 0.5;
    }
    if (this.state === 'dead') {
      const e = clamp01(this.stateTime / 0.9);
      const k = 1 - Math.pow(1 - e, 3);
      b.body.position.y = lerp(0.5, 0.16, k);
      b.body.rotation.x = lerp(0, 0.35, k);
      b.neck.rotation.z = lerp(-0.05, 0.6, k);
    }
  }

  setVisible(v) {
    this.root.visible = v;
  }
}
