// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// game/weapons.js — weapon models, viewmodel, hitscan combat
// ============================================================
import * as THREE from 'three';
import { WEAPONS, AMMO, ATTACHMENTS, ITEMS } from './data.js';
import { mat, plain, M } from '../core/materials.js';
import { boxGeo, cylGeo, sphereGeo } from '../world/geo.js';
import { clamp, damp, lerp, RNG, angleDelta } from '../core/util.js';

const GUN_MAT = () => mat('metal_paint', { color: 0x50565a });
const GUN_MAT2 = () => mat('steel', { color: 0x9aa0a4 });
const WOOD = () => mat('wood', { color: 0xb09070 });
const DARK = () => plain(0x22262a, { roughness: 0.7, metalness: 0.4 });
const POLY = () => plain(0x3a3f42, { roughness: 0.9 });

function part(group, geo, material, x, y, z, rot) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  if (rot) m.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
  m.castShadow = true;
  group.add(m);
  return m;
}

// All models point down -Z (forward), origin at grip
export function buildWeaponModel(id) {
  const g = new THREE.Group();
  const W = WEAPONS[id];
  if (!W) return g;
  const gm = GUN_MAT(), gm2 = GUN_MAT2(), wd = WOOD(), dk = DARK(), poly = POLY();
  switch (id) {
    case 'pistol':
      part(g, boxGeo(0.045, 0.05, 0.2), gm2, 0, 0.06, -0.06);
      part(g, boxGeo(0.04, 0.11, 0.055), dk, 0, 0.0, 0.01, [0.18, 0, 0]);
      part(g, cylGeo(0.012, 0.012, 0.07, 6), dk, 0, 0.062, -0.14);
      part(g, boxGeo(0.03, 0.022, 0.06), gm, 0, 0.088, -0.1);
      part(g, boxGeo(0.008, 0.012, 0.012), gm2, 0, 0.078, -0.155);
      break;
    case 'revolver':
      part(g, boxGeo(0.042, 0.055, 0.15), gm2, 0, 0.065, -0.05);
      part(g, cylGeo(0.032, 0.032, 0.055, 8), gm, 0, 0.062, -0.02, [0, 0, Math.PI / 2]);
      part(g, boxGeo(0.036, 0.12, 0.05), wd, 0, -0.005, 0.02, [0.22, 0, 0]);
      part(g, cylGeo(0.009, 0.009, 0.14, 6), dk, 0, 0.065, -0.16);
      part(g, boxGeo(0.01, 0.02, 0.02), gm, 0, 0.098, -0.09);
      break;
    case 'shotgun':
      part(g, boxGeo(0.05, 0.06, 0.5), gm2, 0, 0.06, -0.2);
      part(g, cylGeo(0.022, 0.022, 0.46, 8), dk, 0, 0.062, -0.42);
      part(g, cylGeo(0.022, 0.022, 0.46, 8), dk, 0, 0.035, -0.42);
      part(g, boxGeo(0.05, 0.05, 0.16), wd, 0, 0.035, -0.2);
      part(g, boxGeo(0.045, 0.1, 0.06), wd, 0, 0.02, 0.06, [0.3, 0, 0]);
      part(g, boxGeo(0.05, 0.09, 0.2), wd, 0, 0.03, 0.16);
      break;
    case 'pump_shotgun':
      part(g, boxGeo(0.05, 0.07, 0.44), gm, 0, 0.06, -0.18);
      part(g, cylGeo(0.021, 0.021, 0.5, 8), dk, 0, 0.068, -0.44);
      part(g, cylGeo(0.025, 0.025, 0.16, 8), wd, 0, 0.04, -0.3);
      part(g, boxGeo(0.045, 0.1, 0.055), dk, 0, 0.0, 0.03, [0.22, 0, 0]);
      part(g, boxGeo(0.05, 0.085, 0.22), dk, 0, 0.045, 0.16);
      part(g, boxGeo(0.02, 0.03, 0.05), gm2, 0, 0.1, -0.05);
      break;
    case 'assault_rifle':
      part(g, boxGeo(0.05, 0.07, 0.36), gm, 0, 0.06, -0.1);
      part(g, boxGeo(0.055, 0.06, 0.22), WOOD(), 0, 0.05, -0.32);
      part(g, cylGeo(0.014, 0.014, 0.24, 8), dk, 0, 0.065, -0.5);
      // curved mag
      part(g, boxGeo(0.035, 0.16, 0.06), dk, 0, -0.04, -0.05, [0.35, 0, 0]);
      part(g, boxGeo(0.04, 0.1, 0.05), dk, 0, 0.005, 0.06, [0.25, 0, 0]);
      part(g, boxGeo(0.05, 0.08, 0.24), WOOD(), 0, 0.045, 0.2);
      part(g, boxGeo(0.016, 0.03, 0.06), gm2, 0, 0.1, -0.16);
      part(g, boxGeo(0.01, 0.05, 0.01), gm2, 0, 0.11, -0.02);
      break;
    case 'hunting_rifle':
      part(g, boxGeo(0.04, 0.05, 0.34), gm, 0, 0.06, -0.1);
      part(g, cylGeo(0.011, 0.011, 0.6, 8), dk, 0, 0.062, -0.5);
      part(g, boxGeo(0.045, 0.09, 0.28), wd, 0, 0.03, 0.2);
      part(g, boxGeo(0.04, 0.1, 0.05), dk, 0, -0.005, 0.03, [0.24, 0, 0]);
      part(g, boxGeo(0.035, 0.09, 0.16), wd, 0, 0.03, -0.27);
      // scope
      part(g, cylGeo(0.022, 0.022, 0.18, 10), dk, 0, 0.105, -0.1, [Math.PI / 2, 0, 0]);
      part(g, boxGeo(0.016, 0.05, 0.02), gm2, 0, 0.08, -0.06);
      break;
    case 'smg':
      part(g, boxGeo(0.045, 0.06, 0.26), gm, 0, 0.06, -0.06);
      part(g, cylGeo(0.013, 0.013, 0.16, 8), dk, 0, 0.062, -0.25);
      part(g, boxGeo(0.03, 0.13, 0.045), dk, 0, -0.03, -0.04, [0.2, 0, 0]);
      part(g, boxGeo(0.035, 0.07, 0.04), dk, 0, 0.0, 0.05, [0.3, 0, 0]);
      part(g, boxGeo(0.012, 0.02, 0.09), gm2, 0, 0.04, 0.14);
      part(g, boxGeo(0.01, 0.06, 0.01), gm2, 0, 0.035, 0.05);
      break;
    case 'crossbow':
      part(g, boxGeo(0.045, 0.05, 0.34), poly, 0, 0.06, -0.06);
      part(g, boxGeo(0.5, 0.02, 0.03), dk, 0, 0.075, -0.2, [0, 0, 0]);
      part(g, boxGeo(0.03, 0.06, 0.2), poly, 0, 0.0, 0.06, [0.2, 0, 0]);
      part(g, cylGeo(0.006, 0.006, 0.4, 5), gm2, 0, 0.09, -0.22, [Math.PI / 2, 0, 0]);
      part(g, boxGeo(0.05, 0.03, 0.06), gm2, 0, 0.1, -0.05);
      break;
    case 'improvised_shotgun':
      part(g, cylGeo(0.026, 0.026, 0.42, 8), M.rust, 0, 0.06, -0.16);
      part(g, boxGeo(0.04, 0.1, 0.05), WOOD(), 0, 0.0, 0.02, [0.25, 0, 0]);
      part(g, boxGeo(0.05, 0.05, 0.1), M.rust, 0, 0.03, 0.08);
      part(g, boxGeo(0.06, 0.012, 0.06), M.steel, 0, 0.09, -0.06);
      break;
    case 'knife':
      part(g, boxGeo(0.012, 0.03, 0.18), gm2, 0, 0.02, -0.1);
      part(g, boxGeo(0.016, 0.04, 0.09), dk, 0, 0.015, 0.03);
      part(g, boxGeo(0.03, 0.012, 0.012), gm, 0, 0.015, -0.02);
      break;
    case 'fireaxe':
      part(g, cylGeo(0.016, 0.018, 0.6, 6), WOOD(), 0, 0.06, -0.1, [Math.PI / 2, 0, 0]);
      part(g, boxGeo(0.02, 0.12, 0.1), plain(0x8b3a2f, { roughness: 0.7, metalness: 0.5 }), 0, 0.06, -0.34);
      part(g, boxGeo(0.008, 0.09, 0.03), gm2, 0.045, 0.06, -0.34);
      break;
    case 'machete':
      part(g, boxGeo(0.014, 0.075, 0.34), M.steel, 0, 0.04, -0.17, [0, 0, 0]);
      part(g, boxGeo(0.02, 0.045, 0.1), dk, 0, 0.02, 0.03);
      break;
    case 'pipe':
      part(g, cylGeo(0.018, 0.018, 0.65, 6), M.rust, 0, 0.05, -0.12, [Math.PI / 2, 0, 0]);
      part(g, boxGeo(0.03, 0.032, 0.09), dk, 0, 0.04, 0.16);
      part(g, cylGeo(0.026, 0.026, 0.03, 6), M.rust, 0, 0.05, -0.42, [Math.PI / 2, 0, 0]);
      break;
    default:
      part(g, boxGeo(0.05, 0.06, 0.3), gm, 0, 0.06, -0.15);
  }
  // attachments
  if (W.attachments && W.attachments.includes('scope_small')) {
    part(g, cylGeo(0.014, 0.014, 0.09, 8), dk, 0, 0.105, -0.12, [Math.PI / 2, 0, 0]);
  }
  g.userData.weaponId = id;
  return g;
}

// ------------------------------------------------------------
export class WeaponSystem {
  constructor(game) {
    this.game = game;
    this.current = null;
    this.viewModel = new THREE.Group();
    this.viewModel.name = 'viewmodel';
    game.camera.add(this.viewModel);
    this.rig = new THREE.Group();
    this.viewModel.add(this.rig);
    this.state = {
      mag: 0, reserve: 0, durability: 1, reloading: false, reloadT: 0,
      fireT: 0, spread: 0, recoil: 0, aimBlend: 0, swayX: 0, swayY: 0, bobT: 0,
      meleeT: 0, switching: 0, lastShot: -10, burst: 0, jammed: false,
    };
    this.muzzle = new THREE.Object3D();
    this.muzzle.position.set(0, 0.06, -0.45);
    this.rig.add(this.muzzle);
    this.flashLight = new THREE.PointLight(0xffc070, 0, 12, 2);
    this.flashLight.position.copy(this.muzzle.position);
    this.rig.add(this.flashLight);
    this.flashTimer = 0;
    this.attachmentMap = {};
    this.weaponDurabilities = {};
    this.rng = new RNG(555);
    this.hideTimer = 0;
  }

  setWeapon(id, opts = {}) {
    const def = WEAPONS[id];
    if (!def) return false;
    this.rig.clear();
    const model = buildWeaponModel(id);
    this.rig.add(model);
    this.model = model;
    this.current = id;
    this.def = def;
    this.state.mag = opts.mag ?? Math.min(def.mag || 1, this.game.inventory.countAmmo(def.reserveType));
    if (def.type !== 'melee' && def.type !== 'bow') {
      const maxMag = def.mag || 8;
      this.state.mag = Math.min(opts.mag ?? maxMag, maxMag);
    } else if (def.type === 'bow') {
      this.state.mag = this.game.inventory.countAmmo(def.reserveType) > 0 ? 1 : 0;
    }
    this.state.reserve = this.game.inventory.countAmmo(def.reserveType);
    this.state.durability = this.weaponDurabilities[id] ?? 1;
    this.state.reloading = false;
    this.state.fireT = 0;
    this.state.recoil = 0;
    this.state.spread = 0;
    this.state.jammed = false;
    this.type = def.type;
    this.isMelee = def.type === 'melee';
    this.attachments = this.game.inventory.attachments[id] || {};
    this.viewModel.visible = this.game.cameraMode === 1 || this.game.player.aiming || true;
    return true;
  }

  get ammoText() {
    if (!this.def) return '';
    if (this.isMelee) return '—';
    if (this.def.type === 'bow') return `${this.state.mag ? 1 : 0} / ${this.game.inventory.countAmmo(this.def.reserveType)}`;
    return `${this.state.mag} / ${this.state.reserve}`;
  }
  get ammoFrac() {
    if (!this.def || this.isMelee) return 0;
    return clamp(this.state.mag / (this.def.mag || 1), 0, 1);
  }

  reload() {
    if (!this.def || this.isMelee || this.state.reloading) return;
    const reserve = this.game.inventory.countAmmo(this.def.reserveType);
    const magSize = this.def.mag || 1;
    if (reserve <= 0 || this.state.mag >= magSize) { this.game.audio.dryFire(); return; }
    this.state.reloading = true;
    this.state.reloadT = 0;
    this.state.reloadDur = this.def.reload * (1 + (this.attachments.receiver ? -0.05 : 0)) * (this.game.player.skills.reload ? 1 + this.game.player.skills.reload : 1);
    this.game.audio.reload(0);
  }

  finishReload() {
    const needed = (this.def.mag || 1) - this.state.mag;
    const have = this.game.inventory.countAmmo(this.def.reserveType);
    const take = Math.min(needed, have);
    if (take > 0) {
      this.game.inventory.removeAmmo(this.def.reserveType, take);
      this.state.mag += take;
      this.state.reserve = this.game.inventory.countAmmo(this.def.reserveType);
      this.game.audio.reload(1);
      this.game.audio.shellDrop();
    }
    this.state.reloading = false;
    this.game.ui.updateWeapon();
  }

  // returns true if a shot happened
  fire(aimDir, aimPoint) {
    const p = this.game.player;
    if (!this.def || this.state.fireT > 0 || this.state.reloading) return false;
    if (this.isMelee) return this.meleeAttack();
    if (this.state.jammed) { this.game.audio.dryFire(); this.state.jammed = false; this.game.notify('Weapon jammed — cleared'); return false; }
    if (this.state.mag <= 0) {
      this.game.audio.dryFire();
      if (this.game.inventory.countAmmo(this.def.reserveType) > 0) this.reload();
      else this.game.notify('Out of ammunition');
      return false;
    }
    if (this.state.durability <= 0) { this.game.notify('Weapon broken — needs repair'); return false; }

    const W = this.def;
    this.state.mag--;
    this.state.fireT = 1 / ((W.rate || 1) * (this.attachments.receiver ? 1.12 : 1) * (this.game.player.skills.rate || 1));
    this.state.lastShot = this.game.time;
    // durability
    this.state.durability = Math.max(0, this.state.durability - (W.type === 'bow' ? 0.0015 : 0.0042));
    this.weaponDurabilities[this.current] = this.state.durability;
    if (this.state.durability < 0.35 && this.rng.chance(0.02)) {
      this.state.jammed = true;
      this.game.notify('The weapon jams.');
    }

    // recoil & spread
    const recoilMul = (1 + (this.game.player.skills.recoil || 0)) * (this.attachments.suppressor ? 0.65 : 1);
    const recoilAmt = (W.recoil || 1) * 0.011 * recoilMul;
    const skillAcc = 1 + (this.game.player.skills.accuracy || 0);
    let spreadDeg = (W.spread || 1) * (this.game.player.aiming ? 0.35 : 1) * (1 - (this.attachments.scope_small ? 0.25 : 0)) *
      (1 - (this.attachments.scope_medium ? 0.45 : 0)) * (1 + this.state.spread) / skillAcc;
    if (this.game.player.moving) spreadDeg *= 1.5;
    if (this.game.player.crouching) spreadDeg *= 0.75;
    if (this.game.player.sprinting) spreadDeg *= 2.4;
    this.state.spread = Math.min(1.4, this.state.spread + 0.22);
    this.game.player.pitch += recoilAmt * (0.7 + this.rng.next() * 0.6);
    this.game.player.yaw += (this.rng.next() - 0.5) * recoilAmt * 0.6;
    this.state.recoil = Math.min(1.2, this.state.recoil + 0.55);
    p.addShake(clamp((W.recoil || 1) * 0.055, 0.02, 0.35));

    // audio
    const suppressed = !!this.attachments.suppressor || !!W.silent;
    const atype = W.type === 'pistol' ? 'pistol' : W.type === 'shotgun' ? 'shotgun' : W.type === 'rifle' ? 'rifle' : W.type === 'smg' ? 'smg' : 'bow';
    this.game.audio.gunshot(atype, p.eyePos, suppressed);
    this.game.alertEnemiesToNoise(p.pos.x, p.pos.z, suppressed ? 0.35 : 1.0, 55);

    // projectile / hitscan
    const originWorld = new THREE.Vector3();
    this.muzzle.getWorldPosition(originWorld);
    const muzzleDir = aimDir.clone();
    const pellets = W.pellets || 1;
    const dmg = (W.dmg || 10) * (this.attachments.suppressor ? 0.9 : 1) * (this.game.player.damageMul || 1);
    for (let i = 0; i < pellets; i++) {
      const spreadRad = (spreadDeg * Math.PI / 180) * (i === 0 && pellets === 1 ? 1 : 1);
      const dir = muzzleDir.clone();
      dir.x += (this.rng.next() - 0.5) * 2 * spreadRad;
      dir.y += (this.rng.next() - 0.5) * 2 * spreadRad;
      dir.z += (this.rng.next() - 0.5) * 2 * spreadRad;
      dir.normalize();
      this.game.combat.hitscan(originWorld, dir, dmg, {
        weapon: this.current, penetration: W.type === 'rifle' ? 0.35 : 0.1, range: W.range || 100,
        silent: !!W.silent, crit: (W.crit || 0.06) + (this.game.player.skills.critDmg || 0),
      });
    }
    // vfx
    this.game.vfx.muzzleFlash(originWorld, muzzleDir);
    this.flashLight.intensity = 8;
    this.flashTimer = 0.05;
    this.game.ui.updateWeapon();
    // auto-reload when empty
    if (this.state.mag === 0 && this.game.inventory.countAmmo(this.def.reserveType) > 0 && !W.auto) {
      setTimeout(() => { if (!this.state.reloading && this.state.mag === 0) this.reload(); }, 300);
    }
    return true;
  }

  meleeAttack() {
    const p = this.game.player;
    const W = this.def;
    if (p.stamina < (W.stam || 5) * 0.5) { this.game.notify('Too exhausted to swing'); return false; }
    p.stamina -= (W.stam || 5) * (1 + (this.game.player.skills.meleeDmg ? -0.1 : 0));
    this.state.fireT = 1 / (W.rate || 1);
    this.state.meleeT = 0.36;
    this.game.audio.swing();
    const dmg = (W.dmg || 20) * (this.game.player.skills.meleeDmg ? 1 + this.game.player.skills.meleeDmg : 1) * (this.game.player.damageMul || 1);
    this.game.combat.meleeSwing(dmg, W.range || 2, W.crit || 0.1);
    this.state.durability = Math.max(0, this.state.durability - 0.002);
    this.weaponDurabilities[this.current] = this.state.durability;
    this.game.ui.updateWeapon();
    return true;
  }

  update(dt, keys, mouse) {
    if (!this.def) return;
    const p = this.game.player;
    this.state.fireT = Math.max(0, this.state.fireT - dt);
    this.state.spread = Math.max(0, this.state.spread - dt * 1.6);
    this.state.recoil = Math.max(0, this.state.recoil - dt * 3.2);
    this.state.meleeT = Math.max(0, this.state.meleeT - dt);
    this.state.aimBlend = damp(this.state.aimBlend, p.aiming ? 1 : 0, 12, dt);

    if (this.state.reloading) {
      this.state.reloadT += dt;
      if (this.state.reloadT >= this.state.reloadDur) this.finishReload();
    }

    // firing
    const wantFire = this.isMelee ? (mouse.left && this.state.fireT <= 0) : (this.def.auto ? mouse.left : mouse.leftPressed);
    if (wantFire && !this.game.ui.isBlockingInput()) {
      const eye = p.eyePos;
      const dir = p.forward.clone();
      // aim assist: raycast from camera to find target point
      const target = eye.clone().addScaledVector(dir, 120);
      const world = this.game.world;
      const hit = world.colliders.raycast(eye.x, eye.y, eye.z, dir.x, dir.y, dir.z, 120);
      if (hit) target.copy(hit.point);
      const enemyHit = this.game.combat.aimRaycast(eye, dir, hit ? hit.dist : 120);
      if (enemyHit) target.copy(enemyHit.point);
      this.fire(dir, target);
    }
    if (keys.KeyR && !this.game.ui.isBlockingInput()) this.reload();

    // ---- viewmodel animation ----
    const rig = this.rig;
    const speed = Math.hypot(p.vel.x, p.vel.z);
    this.state.bobT += dt * (p.sprinting ? 12 : 8) * clamp(speed / 4, 0, 1.2);
    const bobX = Math.sin(this.state.bobT) * 0.012 * clamp(speed / 4, 0, 1);
    const bobY = Math.abs(Math.cos(this.state.bobT)) * 0.01 * clamp(speed / 4, 0, 1);
    const swayTargetX = -mouse.dx * 0.0007;
    const swayTargetY = -mouse.dy * 0.0007;
    this.state.swayX = damp(this.state.swayX, swayTargetX, 8, dt);
    this.state.swayY = damp(this.state.swayY, swayTargetY, 8, dt);
    const aim = this.state.aimBlend;
    const basePos = this.game.cameraMode === 1
      ? new THREE.Vector3(0.18 - aim * 0.18, -0.18 + aim * 0.03, -0.34 + aim * 0.16)
      : new THREE.Vector3(0.26 - aim * 0.16, -0.24 + aim * 0.04, -0.42 + aim * 0.12);
    const pos = basePos.clone();
    pos.x += bobX + this.state.swayX;
    pos.y += bobY + this.state.swayY + this.state.recoil * 0.03;
    pos.z += this.state.recoil * 0.05;
    if (this.state.reloading) {
      const t = this.state.reloadT / this.state.reloadDur;
      pos.y -= Math.sin(t * Math.PI) * 0.18;
      pos.z += Math.sin(t * Math.PI) * 0.06;
    }
    if (this.state.switching > 0) {
      pos.y -= this.state.switching * 0.5;
      this.state.switching = Math.max(0, this.state.switching - dt * 4);
    }
    if (this.state.meleeT > 0) {
      const t = 1 - this.state.meleeT / 0.36;
      pos.x -= Math.sin(t * Math.PI) * 0.22;
      pos.z -= Math.sin(t * Math.PI) * 0.3;
    }
    rig.position.lerp(pos, 1 - Math.exp(-dt * 22));
    rig.rotation.set(
      -this.state.recoil * 0.14 + this.state.swayY * 2.2,
      this.state.swayX * 2.4 + (this.state.meleeT > 0 ? -Math.sin((1 - this.state.meleeT / 0.36) * Math.PI) * 0.8 : 0),
      -this.state.swayX * 1.2 + (this.state.meleeT > 0 ? Math.sin((1 - this.state.meleeT / 0.36) * Math.PI) * 0.5 : 0),
    );
    // hide viewmodel when the camera pulls in close (avoid clipping)
    const hide = p.cameraMode !== 1 && !p.aiming && this.game.camera.position.distanceTo(p.eyePos) < 1.2;
    this.viewModel.visible = !hide;
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      this.flashLight.intensity = Math.max(0, this.flashTimer / 0.05) * 8;
    } else this.flashLight.intensity = 0;
    // flashlight attachment
    if (this.attachments.flashlight && this.game.flashlight) {
      this.game.flashlight.visible = true;
    }
    this.rig.userData.aimBlend = aim;
  }

  get weaponName() { return this.def ? this.def.name : 'Unarmed'; }
}
