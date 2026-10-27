/**
 * Combat: firearm handling, ballistics, melee, weapon durability, hit detection
 * with per-limb damage, tracers, muzzle effects and view-model animation.
 */
import * as THREE from 'three';
import { WEAPONS, weaponStatWithAttachments, ATTACHMENTS, AMMO } from '../world/weapons.js';
import { itemDef, AMMO_ITEM_FOR } from '../data/items.js';
import { clamp, clamp01, damp, lerp, makeRng } from '../engine/util.js';
import { buildWeaponModel } from '../world/weapons.js';

const _origin = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _hit = new THREE.Vector3();

export class Combat {
  constructor(game) {
    this.game = game;
    this.cooldown = 0;
    this.reloading = false;
    this.reloadTimer = 0;
    this.reloadDuration = 0;
    this.zoom = 0;
    this.spreadBloom = 0;
    this.swapTimer = 0;
    this.meleeCooldown = 0;
    this.weaponSlot = 'primary';
    this.currentItemUid = null;
    this.currentWeaponId = 'fists';
    this.currentStats = { ...WEAPONS.fists };
    this.shotsFired = 0;
    this.hits = 0;
    this.kills = 0;
    this.headshots = 0;
    this.jamChance = 0;
    this.triggerHeld = false;
    this.burstCount = 0;
    this.viewModel = null;
    this.viewModelGroup = new THREE.Group();
    this.viewModelGroup.name = 'viewmodel';
    this.lastNoiseTime = 0;
    this.adsSpeed = 1;

    game.camera.add(this.viewModelGroup);
    game.camera.position.set(0, 2, 4);
    game.scene.add(game.camera);

    // crosshair state
    this.crosshairSpread = 0;
    this.crosshairHot = false;
    this.heavyCooldown = 0;
    this.grenades = [];
    this.fireFields = [];
    this._hotTimer = 0;

    // fists as fallback weapon
    this.fistsStats = { ...WEAPONS.fists };

    this._buildViewModel();
    this.equipBestWeapon('primary', true);
    this.equipBestWeapon('secondary', true);
    this.equipBestWeapon('melee', true);
  }

  get inv() {
    return this.game.inventory;
  }

  get player() {
    return this.game.player;
  }

  _buildViewModel() {
    this.viewRoot = new THREE.Group();
    this.viewModelGroup.add(this.viewRoot);
    // simple arms in the view model
    const sleeve = new THREE.MeshStandardMaterial({ color: 0x2e3335, roughness: 0.9 });
    const glove = new THREE.MeshStandardMaterial({ color: 0x1c1b19, roughness: 0.7 });
    const armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.28, 2, 6), sleeve);
    armR.rotation.set(-1.2, 0.2, -0.25);
    armR.position.set(0.16, -0.24, -0.38);
    const handR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.06), glove);
    handR.position.set(0.07, -0.1, -0.52);
    const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.24, 2, 6), sleeve);
    armL.rotation.set(-1.15, -0.15, 0.3);
    armL.position.set(-0.14, -0.26, -0.42);
    this.arms = new THREE.Group();
    this.arms.add(armR, armL, handR);
    this.viewRoot.add(this.arms);
    this.arms.visible = false;
    this.weaponModelFirst = null;
    this.swayPos = new THREE.Vector3();
    this.swayRot = new THREE.Vector2();
  }

  /** Equips a weapon item (uid) or the best of a slot. */
  equipWeapon(uid, slotHint = null) {
    const item = this.inv.get(uid);
    if (!item) return false;
    const def = itemDef(item.id);
    if (def.type !== 'weapon') return false;
    const w = WEAPONS[def.weapon];
    if (!w) return false;
    if (slotHint && this.weaponSlot !== slotHint) this.weaponSlot = slotHint;
    const changed = this.currentItemUid !== uid;
    this.currentItemUid = uid;
    this.currentWeaponId = def.weapon;
    this.currentStats = weaponStatWithAttachments(def.weapon, item.attachments || []);
    if (item.magazine === null || item.magazine === undefined) {
      if (!w.melee) {
        const ammoType = w.ammo;
        const cap = this.currentStats.magSize || w.mag;
        const available = this.inv.countAmmo(ammoType);
        const load = Math.min(cap, available);
        item.magazine = 0;
        if (load > 0) {
          this.inv.consumeAmmo(ammoType, load);
          item.magazine = load;
        }
      } else item.magazine = 0;
    }
    if (item.dur === null || item.dur === undefined) item.dur = this.currentStats.durability || 100;
    this.reloading = false;
    this.swapTimer = changed ? 0.32 : 0;
    this._buildWeaponMeshes();
    this.game.hud?.setWeapon(this.currentStats, item);
    if (changed) this.game.audio?.play('click', this.player.eyePosition);
    return true;
  }

  equipBestWeapon(slot, silent = false) {
    const candidates = this.inv.allWeapons().filter((w) => w.slot === slot);
    if (!candidates.length) return false;
    const priorities = { primary: ['assaultRifle', 'rifle', 'shotgun', 'smg', 'crossbow'], secondary: ['revolver', 'pistol'], melee: ['sledge', 'axe', 'machete', 'wrench', 'knife'] };
    const want = priorities[slot] || [];
    candidates.sort((a, b) => {
      const ia = want.indexOf(a.def.weapon);
      const ib = want.indexOf(b.def.weapon);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    this.weaponSlot = slot;
    this.equipWeapon(candidates[0].it.uid);
    if (!silent) this.game.hud?.notifySlot(slot);
    return true;
  }

  cycleWeapon(slot) {
    const candidates = this.inv.allWeapons()
      .filter((w) => w.slot === slot)
      .map((w) => w.it);
    if (!candidates.length) return;
    if (candidates.length === 1) {
      this.equipWeapon(candidates[0].uid, slot);
      return;
    }
    const idx = candidates.findIndex((c) => c.uid === this.currentItemUid);
    const next = candidates[(idx + 1) % candidates.length];
    this.equipWeapon(next.uid, slot);
  }

  _buildWeaponMeshes() {
    // remove old
    if (this.weaponModelFirst) {
      this.viewRoot.remove(this.weaponModelFirst);
      this.disposeModel(this.weaponModelFirst);
      this.weaponModelFirst = null;
    }
    if (this.weaponModelThird) {
      this.player.model.handR.remove(this.weaponModelThird);
      this.disposeModel(this.weaponModelThird);
      this.weaponModelThird = null;
    }
    const w = WEAPONS[this.currentWeaponId];
    if (!w || w.melee) {
      this.arms.visible = true;
      if (this.currentWeaponId !== 'fists') {
        const model = buildWeaponModel(this.currentWeaponId);
        this.weaponModelThird = model;
        model.scale.setScalar(0.9);
        this.player.model.attachWeapon(model, { x: 0, y: -0.04, z: -0.04 }, { x: Math.PI / 2, y: 0, z: 0.3 });
      }
      return;
    }
    this.arms.visible = true;
    const model = buildWeaponModel(this.currentWeaponId);
    model.position.set(0.12, -0.16, -0.42);
    model.rotation.set(0.02, 0, 0);
    model.scale.setScalar(1);
    this.viewRoot.add(model);
    this.weaponModelFirst = model;
    // third person model
    const model3 = buildWeaponModel(this.currentWeaponId);
    this.weaponModelThird = model3;
    this.player.model.attachWeapon(model3, { x: 0, y: -0.05, z: -0.1 }, { x: Math.PI / 2, y: 0, z: 0 });
    // flashlight attachment
    this.hasLightAttachment = (this.inv.get(this.currentItemUid)?.attachments || []).some((a) => (a.id || a) === 'flashlight');
    this._syncAttachments();
    this.game.hud?.setWeapon(this.currentStats, this.inv.get(this.currentItemUid));
  }

  _syncAttachments() {
    const item = this.inv.get(this.currentItemUid);
    if (!item) return;
    const atts = (item.attachments || []).map((a) => a.id || a);
    if (this.weaponModelFirst) {
      const sight = this.weaponModelFirst.userData.sight;
      if (sight) {
        sight.clear?.();
      }
    }
  }

  disposeModel(obj) {
    obj.traverse((o) => {
      if (o.isMesh) {
        o.geometry?.dispose?.();
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
        else o.material?.dispose?.();
      }
    });
  }

  get currentItem() {
    return this.inv.get(this.currentItemUid);
  }

  get magAmmo() {
    return this.currentItem?.magazine || 0;
  }

  get currentAdsFov() {
    const base = this.currentStats.adsFov || 55;
    const zoom = (this.currentItem?.attachments || []).some((a) => (a.id || a) === 'scope4x');
    return zoom ? base * 0.72 : base;
  }

  /** Right mouse: heavy melee strike with the current blade, or a rifle butt bash. */
  altFire() {
    const s = this.currentStats;
    const p = this.player;
    if (this.heavyCooldown > 0 || this.cooldown > 0 || this.reloading) return false;
    if (s.melee) {
      if (p.stamina < 18) {
        this.game.hud?.notify('Not enough stamina for a heavy swing.', 'warn');
        return false;
      }
      p.addStamina(-18);
      this.heavyCooldown = Math.max(0.65, s.rate * 1.5);
      this.cooldown = 0.18;
      this.meleeAttack(1.7);
      this.game.audio?.play('meleeHeavy', p.position);
      return true;
    }
    // butt-stroke: short, noisy, but it creates space
    if (p.stamina < 10) return false;
    p.addStamina(-10);
    this.heavyCooldown = 0.9;
    this.cooldown = 0.45;
    p.model.setState('melee');
    p.model.stateTime = 0;
    setTimeout(() => p.model.setState('idle'), 420);
    const origin = p.eyePosition.clone();
    const flat = p.flatForward.clone();
    setTimeout(() => {
      for (const e of this.game.enemies.enemies) {
        if (!e.alive) continue;
        const dx = e.position.x - origin.x;
        const dz = e.position.z - origin.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 2.4) continue;
        if ((dx * flat.x + dz * flat.z) / (dist || 1) < 0.5) continue;
        this.applyDamageToEnemy(e, 14, new THREE.Vector3(e.position.x, e.position.y + 1.1, e.position.z), flat, 'torso');
        e.staggerTime = Math.max(e.staggerTime || 0, 0.5);
        this.game.audio?.play('meleeHit', e.position);
        break;
      }
    }, 160);
    this.game.audio?.play('meleeSwing', p.position);
    return true;
  }

  /** Crosshair turns hot when a living mutant is under the muzzle. */
  updateCrosshair(dt) {
    this._hotTimer -= dt;
    if (this._hotTimer > 0) return;
    this._hotTimer = 0.1;
    const origin = this.player.eyePosition;
    const dir = this.player.forward;
    let hot = false;
    for (const e of this.game.enemies.enemies) {
      if (!e.alive || e.dead) continue;
      const h = e.hitSphere?.(origin, dir, 70);
      if (h) { hot = true; break; }
    }
    this.crosshairHot = hot;
  }

  /** Throw a frag grenade or a molotov. The projectile is simulated, not faked. */
  throwGrenade(id) {
    const def = itemDef(id);
    if (!def || !def.grenade) return false;
    const p = this.player;
    const kind = def.grenade;
    const pos = p.eyePosition.clone().addScaledVector(p.forward, 0.45);
    const geo = new THREE.SphereGeometry(0.12, 8, 6);
    const mat = new THREE.MeshStandardMaterial({
      color: kind === 'fire' ? 0x8a5a24 : 0x4a5a42,
      roughness: 0.75,
      emissive: kind === 'fire' ? 0x3a1a08 : 0x000000,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    this.game.scene.add(mesh);
    const vel = p.forward.clone().multiplyScalar(kind === 'fire' ? 11 : 13);
    vel.y += 2.8;
    this.grenades.push({ id, kind, mesh, vel, fuse: kind === 'fire' ? 1.5 : 1.7, age: 0 });
    this.game.audio?.play('throw', pos);
    p.model.setState('throw');
    p.model.stateTime = 0;
    setTimeout(() => p.model.setState('idle'), 400);
    this.game.notify?.(kind === 'fire' ? 'Molotov away.' : 'Frag out.', 'info', 'EQUIPMENT');
    const noise = this.game.enemies?.onNoise?.bind(this.game.enemies);
    noise?.(pos, 8);
    return true;
  }

  updateGrenades(dt) {
    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i];
      g.age += dt;
      g.fuse -= dt;
      g.vel.y -= 19 * dt;
      const step = g.vel.clone().multiplyScalar(dt);
      const next = g.mesh.position.clone().add(step);
      // world collision: terrain height + interior floors
      const ground = Math.max(
        this.game.world?.groundY(next.x, next.z) ?? 0,
        this.game.collision?.floorAt(next.x, next.y + 0.15, next.z, 0.1, 0.3, 1.0) ?? -999,
      );
      if (next.y <= ground && g.vel.y < 0) {
        next.y = ground + 0.12;
        g.vel.y = -g.vel.y * 0.32;
        g.vel.x *= 0.7;
        g.vel.z *= 0.7;
        if (Math.abs(g.vel.y) < 0.8) g.vel.y = 0;
        this.game.audio?.play('impactConcrete', next);
      }
      g.mesh.position.copy(next);
      if (g.fuse <= 0) {
        this.detonateGrenade(g);
        this.grenades.splice(i, 1);
      }
    }
    this.updateFireFields(dt);
  }

  detonateGrenade(g) {
    const pos = g.mesh.position.clone();
    this.game.scene.remove(g.mesh);
    g.mesh.geometry.dispose();
    g.mesh.material.dispose();
    const fire = g.kind === 'fire';
    const radius = fire ? 4.6 : 7.2;
    const power = fire ? 46 : 140;
    this.game.fx.explosion(pos, fire ? 0.8 : 1.25);
    this.game.audio?.play(fire ? 'fireBurst' : 'explosion', pos);
    this.game.enemies?.onNoise?.(pos, fire ? 20 : 55);
    const p = this.player;
    for (const e of this.game.enemies.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.position.x - pos.x, e.position.z - pos.z);
      if (d > radius) continue;
      const falloff = 1 - d / radius;
      const dir = new THREE.Vector3(e.position.x - pos.x, 0.3, e.position.z - pos.z).normalize();
      this.applyDamageToEnemy(e, power * falloff, new THREE.Vector3(e.position.x, e.position.y + 1.0, e.position.z), dir, 'torso');
      if (!fire) e.staggerTime = Math.max(e.staggerTime || 0, falloff * 0.9);
    }
    const pd = Math.hypot(p.position.x - pos.x, p.position.y + 1 - pos.y, p.position.z - pos.z);
    if (pd < radius) {
      const armor = this.game.inventory?.totalArmor?.() || 0;
      p.hit((fire ? 22 : 85) * (1 - pd / radius) * (1 - armor * 0.6), 'torso');
      p.shake(1);
    }
    if (fire) {
      this.fireFields.push({ x: pos.x, y: pos.y, z: pos.z, life: 7, radius: 3.6, tick: 0 });
    } else {
      this.game.world?.addScorch?.(pos);
    }
  }

  updateFireFields(dt) {
    for (let i = this.fireFields.length - 1; i >= 0; i--) {
      const f = this.fireFields[i];
      f.life -= dt;
      f.tick -= dt;
      if (f.tick <= 0) {
        f.tick = 0.22;
        const point = new THREE.Vector3(f.x + (Math.random() - 0.5) * f.radius * 1.2, f.y + 0.25, f.z + (Math.random() - 0.5) * f.radius * 1.2);
        this.game.fx.groups?.fire?.spawn({
          x: point.x, y: point.y, z: point.z,
          vx: (Math.random() - 0.5) * 0.8, vy: 0.9 + Math.random(),
          vz: (Math.random() - 0.5) * 0.8, life: 0.5, size: 0.4, color: 0xff8a30,
        });
        this.game.audio?.play('fireLoop', point);
      }
      for (const e of this.game.enemies.enemies) {
        if (!e.alive) continue;
        if (Math.hypot(e.position.x - f.x, e.position.z - f.z) > f.radius) continue;
        this.applyDamageToEnemy(e, 11 * dt, e.position.clone(), new THREE.Vector3(0, 1, 0), 'torso');
      }
      const p = this.player;
      if (Math.hypot(p.position.x - f.x, p.position.z - f.z) < f.radius * 0.8 && p.position.y - f.y < 2) {
        const armor = this.game.inventory?.totalArmor?.() || 0;
        p.hit(7 * dt * (1 - armor * 0.5), 'torso');
      }
      if (f.life <= 0) this.fireFields.splice(i, 1);
    }
  }

  /** Install an attachment item onto the equipped (or given) weapon. */
  installAttachment(attachUid, weaponUid = null) {
    const attItem = this.inv.get(attachUid);
    const attDef = attItem && itemDef(attItem.id);
    if (!attDef?.attachment) return { ok: false, reason: 'That is not an attachment.' };
    const target = weaponUid ? this.inv.get(weaponUid) : this.currentItem;
    if (!target) return { ok: false, reason: 'Equip a weapon first.' };
    const targetDef = itemDef(target.id);
    if (targetDef?.type !== 'weapon') return { ok: false, reason: 'Attachments fit weapons only.' };
    const w = WEAPONS[targetDef.weapon];
    if (!w || w.melee) return { ok: false, reason: 'That weapon has no rails.' };
    const meta = ATTACHMENTS[attDef.attachment];
    if (!meta) return { ok: false, reason: 'Unknown attachment.' };
    target.attachments = (target.attachments || []).filter((a) => (ATTACHMENTS[a.id || a]?.slot) !== meta.slot);
    target.attachments.push(attDef.attachment);
    this.inv.remove(attachUid, 1);
    if (this.currentItemUid === target.uid) {
      this.currentStats = weaponStatWithAttachments(targetDef.weapon, target.attachments);
      this.game.hud?.setWeapon(this.currentStats, target);
    }
    this.game.audio?.play('equip');
    return { ok: true, name: meta.name };
  }

  /** Bring a damaged weapon back up to full condition with a repair kit. */
  repairCurrentWeapon() {
    const item = this.currentItem;
    if (!item) return { ok: false, reason: 'Nothing equipped.' };
    const max = this.currentStats?.durability || 100;
    if (item.dur === null || item.dur === undefined) item.dur = max;
    if (item.dur >= max) return { ok: false, reason: 'Already in good condition.' };
    item.dur = max;
    this.game.audio?.play('repair');
    return { ok: true, condition: max };
  }

  canFire() {
    const s = this.currentStats;
    if (this.reloading || this.swapTimer > 0) return false;
    if (this.cooldown > 0) return false;
    if (s.melee) return this.meleeCooldown <= 0;
    if (!this.game.input.locked || this.game.ui?.blocking) return false;
    return true;
  }

  tryFire(input) {
    const s = this.currentStats;
    if (!this.canFire()) return;
    if (s.melee) {
      this.meleeAttack();
      return;
    }
    const item = this.currentItem;
    if (!item) return;
    if ((item.magazine || 0) <= 0) {
      this.game.audio?.play('dryFire', this.player.eyePosition);
      this.cooldown = 0.28;
      if (!this.reloading) this.startReload();
      return;
    }
    // jamming at low durability
    const dur = item.dur ?? s.durability;
    if (dur !== null && dur !== undefined && dur < s.durability * 0.25 && Math.random() < 0.04) {
      this.game.audio?.play('click', this.player.eyePosition);
      this.game.hud?.notify('WEAPON JAMMED - press R', 'warn');
      this.cooldown = 0.6;
      this.jamChance = 1;
      return;
    }
    this.fireShot();
  }

  fireShot() {
    const s = this.currentStats;
    const p = this.player;
    const item = this.currentItem;
    this.shotsFired++;
    item.magazine -= 1;
    this.cooldown = s.rate;
    this.spreadBloom = Math.min(1, this.spreadBloom + (s.auto ? 0.08 : 0.16));
    p.camRecoil = Math.min(1.4, p.camRecoil + (s.recoil || 0.8) * 0.5);
    p.addRecoil((s.recoil || 0.8) * 0.014 * (this.game.input.mouseDown(2) ? 0.6 : 1), (Math.random() - 0.5) * 0.008);
    p.shake(0.12 + (s.recoil || 0.8) * 0.08);
    p.model.triggerRecoil(1);
    this.game.audio?.play('gunshot', p.eyePosition, { caliber: s.ammo });
    const noise = s.noise * (1 + ((item.attachments || []).some((a) => (a.id || a) === 'suppressor') ? -0.6 : 0));
    this.game.ai?.onNoise(p.eyePosition, noise);
    this.game.hud?.crosshairKick();

    // muzzle position
    const muzzle = new THREE.Vector3();
    let muzzleRot = new THREE.Quaternion();
    if (p.viewMode === 'first' && this.weaponModelFirst) {
      this.weaponModelFirst.userData.muzzle.getWorldPosition(muzzle);
      this.weaponModelFirst.userData.muzzle.getWorldQuaternion(muzzleRot);
    } else if (this.weaponModelThird) {
      this.weaponModelThird.userData.muzzle.getWorldPosition(muzzle);
      this.weaponModelThird.userData.muzzle.getWorldQuaternion(muzzleRot);
    } else {
      muzzle.copy(p.eyePosition);
    }
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(muzzleRot);
    if (p.viewMode !== 'first' || !this.weaponModelFirst) fwd.copy(p.forward);
    this.game.fx.muzzleFlash(muzzle, fwd);

    const pellets = s.pellets || 1;
    const spreadBase = s.spread * (1 + this.spreadBloom * (s.auto ? 1.3 : 0.5)) * (this.game.input.mouseDown(2) ? 0.55 : 1) * (p.crouching ? 0.8 : 1);
    let anyHit = null;
    for (let i = 0; i < pellets; i++) {
      const dir = p.forward.clone();
      const right = p.flatRight;
      const up = new THREE.Vector3().crossVectors(right, dir).normalize();
      const r1 = (Math.random() - 0.5) * 2 * spreadBase;
      const r2 = (Math.random() - 0.5) * 2 * spreadBase;
      dir.addScaledVector(right, r1).addScaledVector(up, r2).normalize();
      const hit = this.castShot(p.eyePosition.clone(), dir, s.range);
      if (hit) {
        anyHit = anyHit || hit;
        if (hit.enemy) {
          this.hits++;
          const dmg = s.damage * falloffFactor(s, hit.distance) * (hit.part === 'head' ? s.headMult : 1);
          this.applyDamageToEnemy(hit.enemy, dmg, hit.point, dir, hit.part);
          this.game.fx.impact(hit.point, hit.normal, 'flesh', 1);
          this.game.audio?.play('impactFlesh', hit.point);
        } else {
          const surf = this.game.world?.surfaceAt(hit.point) || 'concrete';
          this.game.fx.impact(hit.point, hit.normal, surf, 1);
          this.game.audio?.play(`impact${surf === 'metal' ? 'Metal' : surf === 'wood' ? 'Wood' : surf === 'dirt' || surf === 'grass' ? 'Dirt' : 'Concrete'}`, hit.point);
        }
      }
      // tracer only for rifle-class and never for shotgun pellets (visual noise)
      if (pellets === 1 && s.range > 60) this.game.fx.tracer(muzzle, hit ? hit.point : muzzle.clone().addScaledVector(dir, s.range * 0.6), 0xffd9a0);
    }
    // durability
    if (item.dur !== null && item.dur !== undefined) {
      item.dur = Math.max(0, item.dur - (s.melee ? 4 : 1));
      if (item.dur === 0 && this.currentWeaponId !== 'fists') {
        this.game.hud?.notify('WEAPON BROKEN', 'danger');
      }
    }
    this.game.hud?.setWeapon(this.currentStats, item);
  }

  applyDamageToEnemy(enemy, dmg, point, dir, part) {
    if (!enemy || enemy.dead) return;
    if (part === 'head') this.headshots++;
    /* the enemy controller owns damage application */ 
    enemy.takeDamage?.(dmg, { point, dir, part, source: 'player' });
    if (enemy.dead) {
      this.kills++;
      this.game.onKill?.(enemy);
    }
  }

  castShot(origin, dir, range) {
    // enemy hit test first
    let best = null;
    let bestDist = range;
    const enemies = this.game.enemies.enemies;
    for (const e of enemies) {
      if (!e.alive || e.dead) continue;
      const h = e.hitSphere(origin, dir, bestDist);
      if (h && h.distance < bestDist) {
        best = { enemy: e, point: h.point, distance: h.distance, part: h.part, normal: dir.clone().negate() };
        bestDist = h.distance;
      }
    }
    // static geometry
    const worldHit = this.game.collision.raycast(origin, dir, bestDist, { step: 0.28 });
    if (worldHit < bestDist) {
      const point = origin.clone().addScaledVector(dir, worldHit);
      const normal = this.getNormalAt(point, dir);
      return { enemy: null, point, distance: worldHit, normal };
    }
    if (best) {
      best.normal = dir.clone().negate();
      return best;
    }
    return null;
  }

  getNormalAt(point, dir) {
    // sample into the surface to find the dominant axis
    const eps = 0.08;
    const back = point.clone().addScaledVector(dir, -eps);
    const n = new THREE.Vector3();
    const p = point;
    // test for a floor/ceiling
    const floor = this.game.collision.floorAt(p.x, p.y + 0.05, p.z, 0.05, 0.2, 1.2);
    if (Math.abs(back.y - floor) < 0.3) n.set(0, 1, 0);
    else {
      const terrN = this.game.collision.terrain?.normalAt(p.x, p.z) || new THREE.Vector3(0, 1, 0);
      if (p.y <= (this.game.collision.terrain?.heightAt(p.x, p.z) ?? -999) + 0.3) n.copy(terrN);
      else n.copy(dir).negate();
    }
    return n;
  }

  meleeAttack(multiplier = 1) {
    const s = this.currentStats;
    const p = this.player;
    this.meleeCooldown = s.rate;
    p.model.setState('melee');
    p.model.stateTime = 0;
    this.game.audio?.play('meleeSwing', p.position);
    setTimeout(() => p.model.setState('idle'), 620);
    // delayed hit at the middle of the swing
    setTimeout(() => {
      const origin = p.eyePosition;
      const flat = p.flatForward;
      let hitSomething = false;
      for (const e of this.game.enemies.enemies) {
        if (!e.alive) continue;
        const to = new THREE.Vector3(e.position.x - origin.x, 0, e.position.z - origin.z);
        const dist = to.length();
        if (dist > s.range + 0.6) continue;
        const ang = to.normalize().dot(flat);
        if (ang < 0.55) continue;
        if (Math.abs(e.position.y - p.position.y) > 2.2) continue;
        if (!this.game.collision.visible(origin, new THREE.Vector3(e.position.x, e.position.y + 1.1, e.position.z), { step: 0.4 })) continue;
        let dmg = s.damage * multiplier;
        // backstab bonus
        const enemyFacing = e.facing || 0;
        const playerAngle = Math.atan2(-(p.position.x - e.position.x), -(p.position.z - e.position.z));
        const behind = Math.cos(enemyFacing - playerAngle) > 0.55;
        if (behind && s.critBack) dmg *= s.critBack;
        this.applyDamageToEnemy(e, dmg, new THREE.Vector3(e.position.x, e.position.y + 1.1, e.position.z), flat, 'torso');
        this.game.fx.bloodSpray(new THREE.Vector3(e.position.x, e.position.y + 1.1, e.position.z), flat, 1.1);
        this.game.audio?.play('meleeHit', p.position);
        hitSomething = true;
        break;
      }
      if (!hitSomething) {
        // hit environment?
        const origin2 = p.eyePosition;
        const h = this.game.collision.raycast(origin2, flat, s.range, { step: 0.15 });
        if (h < s.range) {
          const pt = origin2.clone().addScaledVector(flat, h);
          this.game.fx.impact(pt, flat.clone().negate(), this.game.world?.surfaceAt(pt) || 'concrete', 1);
          this.game.audio?.play('meleeHit', pt);
          p.shake(0.2);
        }
      }
      this.game.ai?.onNoise(p.eyePosition, s.noise * 2);
    }, 210);
    const item = this.currentItem;
    if (item && item.dur !== null && item.dur !== undefined) {
      item.dur = Math.max(0, item.dur - 3);
      this.game.hud?.setWeapon(s, item);
    }
  }

  startReload() {
    const s = this.currentStats;
    if (s.melee || this.reloading) return;
    const item = this.currentItem;
    if (!item) return;
    const cap = s.magSize || s.mag;
    if ((item.magazine || 0) >= cap) return;
    if (this.inv.countAmmo(s.ammo) <= 0) {
      this.game.hud?.notify('NO AMMUNITION', 'warn');
      return;
    }
    this.reloading = true;
    this.reloadDuration = s.reload;
    this.reloadTimer = 0;
    this.player.model.setState('reload');
    this.game.audio?.play('reloadIn', this.player.eyePosition);
  }

  updateReload(dt) {
    if (!this.reloading) return;
    this.reloadTimer += dt;
    if (this.reloadTimer >= this.reloadDuration) {
      const s = this.currentStats;
      const item = this.currentItem;
      const cap = s.magSize || s.mag;
      const need = cap - (item.magazine || 0);
      const available = this.inv.countAmmo(s.ammo);
      const load = Math.min(need, available);
      if (load > 0) {
        if (this.inv.consumeAmmo(s.ammo, load)) item.magazine = (item.magazine || 0) + load;
      }
      this.reloading = false;
      this.player.model.setState('idle');
      this.game.audio?.play('reloadOut', this.player.eyePosition);
      this.game.hud?.setWeapon(s, item);
    }
  }

  update(dt, input) {
    const p = this.player;
    const blocked = this.game.ui?.blocking;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.meleeCooldown = Math.max(0, this.meleeCooldown - dt);
    this.heavyCooldown = Math.max(0, this.heavyCooldown - dt);
    this.updateGrenades(dt);
    this.updateCrosshair(dt);
    this.swapTimer = Math.max(0, this.swapTimer - dt);
    this.spreadBloom = Math.max(0, this.spreadBloom - dt * (this.currentStats.auto ? 0.9 : 1.6));
    this.updateReload(dt);
    if (!p.isDead && !blocked) {
      // weapon slots
      if (input.justPressed('Digit1')) this.equipBestWeapon('primary');
      if (input.justPressed('Digit2')) this.equipBestWeapon('secondary');
      if (input.justPressed('Digit3')) this.equipBestWeapon('melee');
      if (input.justPressed('Digit4')) this.equipBestWeapon('primary'); // quick swap cycles
      if (input.wheel !== 0) {
        const order = ['primary', 'secondary', 'melee'];
        const idx = order.indexOf(this.weaponSlot);
        this.equipBestWeapon(order[(idx + (input.wheel > 0 ? 1 : -1) + 3) % 3]);
      }
      if (input.justPressed('KeyR')) this.startReload();
      // ADS
      const wantsAds = input.mouseDown(2) && !this.currentStats.melee && !this.reloading;
      const wasAds = p.aiming;
      p.aiming = wantsAds;
      if (p.aiming && !wasAds) this.game.audio?.play('click', p.eyePosition);
      // fire
      const s = this.currentStats;
      if (s.melee) {
        if (input.mouseJustPressed(0) || (input.mouseDown(0) && this.meleeCooldown <= 0)) this.tryFire(input);
      } else if (s.auto) {
        if (input.mouseDown(0)) this.tryFire(input);
      } else if (input.mouseJustPressed(0)) {
        this.tryFire(input);
      }
      // view model visibility
      const showFirst = p.viewMode === 'first' && !s.melee;
      this.arms.visible = p.viewMode === 'first' && (s.melee || !this.weaponModelFirst);
      if (this.weaponModelFirst) this.weaponModelFirst.visible = showFirst;
    }
    // view model sway/bob
    this._updateViewModel(dt, input);
    // crosshair
    const spread = (this.currentStats.spread || 0.01) * (1 + this.spreadBloom) * 260 + (p.actualSpeed > 1 ? 7 : 0);
    this.crosshairSpread = damp(this.crosshairSpread, Math.max(6, spread), 10, dt);
  }

  _updateViewModel(dt, input) {
    const p = this.player;
    if (!this.weaponModelFirst) return;
    const model = this.weaponModelFirst;
    const ads = p.aimBlend;
    const targetX = lerp(0.14, 0.0, ads);
    const targetY = lerp(-0.16, -0.105, ads);
    const targetZ = lerp(-0.42, -0.3, ads);
    model.position.x = damp(model.position.x, targetX, 14, dt);
    model.position.y = damp(model.position.y, targetY, 14, dt);
    model.position.z = damp(model.position.z, targetZ, 14, dt);
    // sway from look
    const sway = input.locked ? input.lookDelta() : { x: 0, y: 0 };
    this.swayPos.x = damp(this.swayPos.x, clamp(-sway.x * 1.2, -0.04, 0.04), 9, dt);
    this.swayPos.y = damp(this.swayPos.y, clamp(sway.y * 1.2, -0.04, 0.04), 9, dt);
    const bob = p.viewMode === 'first' ? Math.sin(p.bobTime * 2) * 0.006 * clamp01(p.actualSpeed / 4) : 0;
    model.position.x += this.swayPos.x;
    model.position.y += this.swayPos.y + bob;
    model.rotation.z = damp(model.rotation.z, this.swayPos.x * 1.8 + (ads ? 0 : 0.02), 10, dt);
    model.rotation.x = damp(model.rotation.x, clamp(this.swayPos.y * 1.6, -0.1, 0.1) + p.camRecoil * 0.03, 10, dt);
    // reload animation
    if (this.reloading) {
      const t = clamp01(this.reloadTimer / this.reloadDuration);
      model.rotation.z = lerp(model.rotation.z, -0.55 * Math.sin(t * Math.PI), 0.3);
      model.position.y -= Math.sin(t * Math.PI) * 0.1;
    }
    this.arms.position.copy(model.position);
    this.arms.rotation.copy(model.rotation);
    this.arms.visible = p.viewMode === 'first' && this.currentStats.melee;
  }

  serialize() {
    return { weaponSlot: this.weaponSlot, currentItemUid: this.currentItemUid, shotsFired: this.shotsFired, hits: this.hits, kills: this.kills, headshots: this.headshots };
  }

  deserialize(d) {
    if (!d) return;
    this.shotsFired = d.shotsFired || 0;
    this.hits = d.hits || 0;
    this.kills = d.kills || 0;
    this.headshots = d.headshots || 0;
    if (d.weaponSlot) this.equipBestWeapon(d.weaponSlot, true);
  }
}

function falloffFactor(s, dist) {
  if (!s.falloff) return 1;
  const [start, end, minMult] = s.falloff;
  if (dist <= start) return 1;
  if (dist >= end) return minMult;
  const t = (dist - start) / (end - start);
  return lerp(1, minMult, t);
}
