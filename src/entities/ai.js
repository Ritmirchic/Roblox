/**
 * Enemy AI: perception (sight + hearing), patrol/investigate/chase/attack states,
 * pack behaviour, bosses with phases and special attacks, and projectiles.
 */
import * as THREE from 'three';
import { MUTANTS, BOSSES, buildCreatureRig, intersectSpheres } from './mutants.js';
import { clamp, clamp01, damp, dampAngle, lerp, makeRng, TAU, angleDelta } from '../engine/util.js';
import { itemDef } from '../data/items.js';

const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();

export class Enemy {
  constructor(manager, defId, position, { boss = null, level = 1, homeRadius = 26, pack = null, spawnPoint = null } = {}) {
    this.manager = manager;
    this.game = manager.game;
    this.isBoss = !!boss;
    this.enemyDef = boss || MUTANTS[defId];
    this.id = this.enemyDef.id;
    this.name = this.enemyDef.name;
    this.mutantId = boss ? boss.mutant : defId;
    this.level = level;
    this.alive = true;
    this.dead = false;
    this.spawnPoint = position.clone();
    this.position = position.clone();
    this.velocity = new THREE.Vector3();
    this.facing = Math.random() * TAU;
    this.homeRadius = homeRadius;
    this.packId = pack;
    this.state = 'idle';
    this.stateTime = 0;
    this.time = Math.random() * 10;
    this.target = null;
    this.lastKnown = null;
    this.alertTimer = 0;
    this.attackCooldown = 0.4;
    this.windup = 0;
    this.attacking = false;
    this.staggerTime = 0;
    this.stunTime = 0;
    this.patrolTarget = null;
    this.patrolTimer = 0;
    this.breathTimer = Math.random() * 3;
    this.radius = 0.42 * (this.enemyDef.scale || 1);
    this.height = 1.75 * (this.enemyDef.scale || 1);
    this.baseHealth = this.enemyDef.health * (1 + (level - 1) * 0.12);
    this.health = this.baseHealth;
    this.maxHealth = this.baseHealth;
    this.speed = this.enemyDef.speed;
    this.chaseSpeed = this.enemyDef.chaseSpeed;
    this.damageResolved = false;
    this.phase = 1;
    this.specialTimer = 3 + Math.random() * 3;
    this.detectMeter = 0;
    this.lostTimer = 0;
    this.aggro = false;
    this.searchPoint = null;
    this.deathTimer = 0;
    this.radiationAura = this.enemyDef.radiation || 0;
    this.passive = !!this.enemyDef.passive;
    this.spawnedAt = performance.now();
    this.dismanaged = false;
    this.burrowed = false;
    this.burrowTimer = 0;
    this.disguised = !!this.enemyDef.mimic;
    this.disguiseBroken = false;
    this.bossDef = boss;
    this.rewardGranted = false;

    // build visuals
    const { rig, spheres, eye } = buildCreatureRig(this.mutantId || 'brute', { boss, scale: this.enemyDef.scale });
    this.rig = rig;
    this.spheres = spheres;
    this.eye = eye;
    this.model = rig;
    this.modelRoot = rig.root;
    this.modelRoot.position.copy(position);
    this.game.scene.add(this.modelRoot);
    if (this.disguised) {
      // mimic looks like a collapsed survivor until it moves
      this.modelRoot.rotation.z = 1.35;
      this.modelRoot.position.y -= 0.55;
    }
    this.collision = this.game.collision;
    this.game.collision.addDynamicSphere(this);
    // boss health bar registration
    if (this.isBoss) {
      this.game.hud?.showBoss(this);
    }
    if (this.enemyDef.sound) {
      const dist = this.position.distanceTo(this.game.player.position);
      if (dist < 40) this.game.audio?.play(this.enemyDef.sound, this.position);
    }
  }

  get hitHeight() {
    return this.height;
  }

  canSeePoint(point, { maxDist = this.enemyDef.sight, fov = this.enemyDef.fov } = {}) {
    const eyeY = this.position.y + this.height * 0.82;
    const from = _v.set(this.position.x, eyeY, this.position.z);
    const to = _v2.copy(point).setY(eyeY * 0.85 + point.y * 0.15);
    const dx = point.x - this.position.x;
    const dz = point.z - this.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist > maxDist) return false;
    const ang = Math.atan2(-dx, -dz);
    const facing = this.facing;
    if (Math.abs(angleDelta(facing, ang)) > fov * 0.5 && dist > 3.5) return false;
    if (!this.collision.visible(from.clone(), to.clone(), { step: 0.6 })) return false;
    return true;
  }

  hearNoise(pos, radius) {
    if (this.dead) return;
    const d = Math.hypot(pos.x - this.position.x, pos.z - this.position.z);
    if (d > radius) return;
    if (this.disguised) {
      this.lastKnown = pos.clone();
      return;
    }
    if (!this.aggro) {
      this.lastKnown = pos.clone();
      this.state = 'investigate';
      this.stateTime = 0;
      this.alertTimer = 6;
    } else {
      this.lastKnown = pos.clone();
    }
  }

  alert(pos) {
    if (this.dead) return;
    this.aggro = true;
    this.lastKnown = pos.clone();
    if (this.state !== 'attack' && this.state !== 'charge') {
      this.state = 'chase';
      this.stateTime = 0;
    }
  }

  hitSphere(origin, dir, maxDist) {
    if (!this.alive || this.burrowed) return null;
    const res = intersectSpheres(origin, dir, this.spheres, this.position, maxDist);
    if (!res) return null;
    // torso-only if headless? no; also require the ray to not be blocked by static geo (handled by caller ordering)
    return res;
  }

  takeDamage(amount, { point = null, dir = null, part = 'torso', source = null } = {}) {
    if (this.dead) return;
    let dmg = amount;
    if (this.enemyDef.armor) dmg *= 1 - this.enemyDef.armor;
    if (part === 'head') dmg *= 1.15;
    this.health -= dmg;
    this.staggerTime = Math.min(0.7, (this.enemyDef.stagger || 0.4) * clamp01(dmg / 40));
    this.rig.triggerFlinch?.(clamp01(dmg / 40));
    this.rig.triggerRecoil?.(0.5);
    this.game.audio?.play('impactFlesh', point || this.position);
    this.aggro = true;
    this.state = 'chase';
    this.stateTime = 0;
    this.lastKnown = this.game.player.position.clone();
    if (this.disguised) this.breakDisguise();
    if (this.packId !== null) this.manager.alertPack(this.packId, this.game.player.position);
    if (this.health <= 0) this.die(dir);
  }

  die(dir = null) {
    if (this.dead) return;
    this.dead = true;
    this.alive = false;
    this.state = 'dead';
    this.stateTime = 0;
    this.collision.removeDynamicSphere(this);
    this.rig.setState?.('dead');
    this.game.audio?.play('mutantDeath', this.position);
    const facingDir = dir ? Math.atan2(dir.x, dir.z) : this.facing;
    // drop loot after a short delay
    setTimeout(() => {
      if (!this.game) return;
      this.game.loot?.dropFromEnemy(this);
      this.game.progression?.awardXp(this.enemyDef.xp || 20, this.name);
    }, 400);
    if (this.isBoss) {
      this.game.onBossDefeated?.(this.bossDef?.id || this.mutantId);
      this.game.hud?.hideBoss();
    }
    this.game.quests?.onKill?.(this.mutantId, this.name);
  }

  breakDisguise() {
    if (!this.disguised) return;
    this.disguised = false;
    this.disguiseBroken = true;
    this.modelRoot.rotation.z = 0;
    this.modelRoot.position.y = this.collision.groundHeight(this.position.x, this.position.z);
    this.rig.root.rotation.z = 0;
    this.game.audio?.play('growl', this.position);
  }

  update(dt) {
    if (this.dead) {
      this.deathTimer += dt;
      this.rig.update(dt, { speed: 0 });
      this.modelRoot.position.copy(this.position);
      if (this.deathTimer > 24 && !this.isBoss) this.cleanup();
      return;
    }
    this.time += dt;
    this.stateTime += dt;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.alertTimer = Math.max(0, this.alertTimer - dt);
    this.staggerTime = Math.max(0, this.staggerTime - dt);
    this.specialTimer = Math.max(0, this.specialTimer - dt);

    const player = this.game.player;
    const distToPlayer = Math.hypot(player.position.x - this.position.x, player.position.z - this.position.z);

    // --- perception
    if (player.isDead) this.aggro = false;
    // bosses sense the player at close range regardless of facing
    if (this.isBoss && distToPlayer < 28 && !player.isDead) {
      if (!this.aggro) {
        this.aggro = true;
        this.lastKnown = player.position.clone();
        if (this.state === 'idle' || this.state === 'patrol') this.setState('chase');
        this.game.audio?.play(this.enemyDef.sound || 'bossRoar', this.position);
      }
    }
    if (!this.disguised) {
      const canSee = !player.isDead && this.canSeePoint(player.eyePosition);
      if (canSee) {
        this.detectMeter = Math.min(1, this.detectMeter + dt * (this.aggro ? 4 : 1.4));
        if (this.detectMeter >= 1 && !this.aggro) {
          this.aggro = true;
          this.lastKnown = player.position.clone();
          this.state = 'chase';
          this.stateTime = 0;
          this.game.audio?.play(this.enemyDef.sound || 'growl', this.position);
          this.manager.onSpotted(this);
        }
        if (this.aggro) this.lastKnown = player.position.clone();
      } else {
        this.detectMeter = Math.max(0, this.detectMeter - dt * 0.5);
      }
    }

    // passive watcher: drains sanity, keeps distance
    if (this.passive) {
      if (this.canSeePoint(player.eyePosition, { maxDist: 45 })) {
        this.game.survival?.addStress(this.enemyDef.sanityDrain * dt);
        this.facing = dampAngle(this.facing, Math.atan2(-(player.position.x - this.position.x), -(player.position.z - this.position.z)), 1.5, dt);
        if (distToPlayer < 18) {
          this.state = 'flee';
        } else this.state = 'watch';
      } else if (this.state !== 'watch') this.state = 'idle';
      this.updateFacingAndAnim(dt, 0);
      this.syncModel();
      return;
    }

    // --- state machine
    switch (this.state) {
      case 'idle':
      case 'patrol':
        this.updatePatrol(dt);
        break;
      case 'investigate':
        this.updateInvestigate(dt);
        break;
      case 'chase':
        this.updateChase(dt, distToPlayer);
        break;
      case 'attack':
        this.updateAttack(dt, distToPlayer);
        break;
      case 'flee':
        this.updateFlee(dt, distToPlayer);
        break;
      case 'stagger':
        if (this.stateTime > 0.45) this.setState('chase');
        break;
      case 'charge':
        this.updateCharge(dt);
        break;
      case 'special':
        this.updateSpecial(dt);
        break;
      default:
        this.updatePatrol(dt);
    }

    // burrower underground
    if (this.enemyDef.burrow) {
      if (this.burrowed) {
        this.burrowTimer -= dt;
        // dust trail
        if (Math.random() < dt * 12) this.game.fx.groups.dust.spawn({ x: this.position.x, y: this.position.y + 0.2, z: this.position.z, life: 0.7, size: 0.5, color: 0x7a6a56 });
        if (this.burrowTimer <= 0) this.emerge();
      } else if (this.aggro && distToPlayer > 8 && this.state === 'chase' && Math.random() < dt * 0.12) {
        this.burrow();
      }
    }

    // radiation aura
    if (this.radiationAura > 0 && distToPlayer < 7) {
      this.game.survival?.addRadiation(this.radiationAura * dt);
    }

    // amble sounds
    this.breathTimer -= dt;
    if (this.breathTimer <= 0) {
      this.breathTimer = 5 + Math.random() * 8;
      if (distToPlayer < 35) this.game.audio?.play(this.enemyDef.sound || 'growl', this.position);
    }

    this.updateFacingAndAnim(dt, this.currentSpeed || 0);
    this.syncModel();
    // idle aggro groups sharing targets
    if (this.aggro && this.packId !== null && Math.random() < dt * 0.5) this.manager.alertPack(this.packId, this.lastKnown || player.position, this);
  }

  setState(s) {
    if (this.state === s) return;
    this.state = s;
    this.stateTime = 0;
    if (s === 'chase') this.detectMeter = 1;
  }

  updatePatrol(dt) {
    this.currentSpeed = 0;
    this.patrolTimer -= dt;
    if (this.patrolTimer <= 0) {
      this.patrolTimer = 5 + Math.random() * 6;
      const a = Math.random() * TAU;
      const r = Math.random() * this.homeRadius;
      const x = this.spawnPoint.x + Math.cos(a) * r;
      const z = this.spawnPoint.z + Math.sin(a) * r;
      if (this.collision.isFree(x, this.collision.groundHeight(x, z) + 0.4, z, this.radius, this.height)) {
        this.patrolTarget = new THREE.Vector3(x, 0, z);
      }
    }
    if (this.patrolTarget) {
      const d = Math.hypot(this.patrolTarget.x - this.position.x, this.patrolTarget.z - this.position.z);
      if (d < 1.4) {
        this.patrolTarget = null;
        this.state = 'idle';
        return;
      }
      this.moveTowards(this.patrolTarget, this.speed * 0.75, dt);
      this.currentSpeed = this.speed * 0.75;
      this.facing = dampAngle(this.facing, this.moveHeading, 4, dt);
    }
  }

  updateInvestigate(dt) {
    if (!this.lastKnown) {
      this.setState('idle');
      return;
    }
    const d = Math.hypot(this.lastKnown.x - this.position.x, this.lastKnown.z - this.position.z);
    if (d < 2.5) {
      // look around
      this.facing += dt * 0.8;
      this.currentSpeed = 0;
      if (this.stateTime > 3) {
        this.lastKnown = null;
        this.setState('idle');
      }
      return;
    }
    this.moveTowards(this.lastKnown, this.speed, dt);
    this.currentSpeed = this.speed;
    this.facing = dampAngle(this.facing, this.moveHeading, 5, dt);
    if (this.stateTime > 16) this.setState('idle');
  }

  updateChase(dt, dist) {
    const player = this.game.player;
    if (player.isDead) {
      this.setState('idle');
      return;
    }
    // smart enemies keep distance from groups / retreat at low health
    if (this.enemyDef.stealth && this.health < this.maxHealth * 0.35 && Math.random() < 0.3) {
      this.setState('flee');
      return;
    }
    // boss special attacks
    if (this.isBoss && this.specialTimer <= 0 && dist < 22) {
      this.trySpecial();
      return;
    }
    if (this.enemyDef.screams && dist < 18 && dist > 6 && Math.random() < dt * 0.5) {
      this.scream();
      return;
    }
    const target = this.lastKnown || player.position;
    if (dist <= (this.enemyDef.attackRange || 2) * 0.85) {
      this.setState('attack');
      this.attacking = false;
      this.windup = 0;
      return;
    }
    this.moveTowards(target, this.chaseSpeed, dt, true);
    this.currentSpeed = this.chaseSpeed;
    this.facing = dampAngle(this.facing, this.moveHeading, 8, dt);
    // burrower emerges under player
    if (this.enemyDef.burrow && !this.burrowed && dist > 6 && dist < 22 && Math.random() < dt * 0.2) this.burrow();
  }

  updateAttack(dt, dist) {
    const def = this.enemyDef;
    this.currentSpeed = 0;
    const player = this.game.player;
    this.facing = dampAngle(this.facing, Math.atan2(-(player.position.x - this.position.x), -(player.position.z - this.position.z)), 8, dt);
    if (!this.attacking) {
      this.attacking = true;
      this.windup = 0;
      this.damageResolved = false;
      this.rig.setState?.('attack');
      this.game.audio?.play(this.id === 'brute' ? 'growl' : 'meleeSwing', this.position);
    }
    this.windup += dt;
    const telegraph = def.heavy ? 0.85 : 0.42;
    if (!this.damageResolved && this.windup >= telegraph) {
      this.damageResolved = true;
      if (dist <= (def.attackRange || 2) + 0.6) {
        player.hit(def.damage, Math.random() < 0.2 ? 'arm' : 'torso', this);
        this.game.fx.bloodSpray(player.eyePosition, this.facingVector(), 0.5);
        this.game.audio?.play('meleeHit', player.position);
        if (this.isBoss) this.game.hud?.flashDamage();
      }
    }
    const total = telegraph + (def.heavy ? 0.9 : 0.5);
    if (this.windup >= total) {
      this.attacking = false;
      this.attackCooldown = def.attackCooldown;
      if (dist > (def.attackRange || 2) * 2.2) this.setState('chase');
      else this.setState('chase');
    }
    if (this.health < this.maxHealth * 0.2 && !this.isBoss && Math.random() < dt * 0.5) this.setState('flee');
  }

  updateFlee(dt, dist) {
    const player = this.game.player;
    const away = new THREE.Vector3(this.position.x - player.position.x, 0, this.position.z - player.position.z).normalize();
    const target = new THREE.Vector3(this.position.x + away.x * 12, 0, this.position.z + away.z * 12);
    this.moveTowards(target, this.chaseSpeed * 0.95, dt);
    this.currentSpeed = this.chaseSpeed * 0.95;
    this.facing = dampAngle(this.facing, this.moveHeading, 6, dt);
    if (this.stateTime > 6 || dist > 40) this.setState('idle');
  }

  scream() {
    this.setState('special');
    this.specialType = 'scream';
    this.specialTime = 1.4;
    this.rig.setState?.('attack');
    this.game.audio?.play('scream', this.position);
    this.game.fx.groups.dust.spawn({ x: this.position.x, y: this.position.y + 1.5, z: this.position.z, life: 1.5, size: 1.2, color: 0x9a8b74 });
    setTimeout(() => {
      if (!this.dead) this.manager.alertRadius(this.position, 45);
    }, 300);
  }

  trySpecial() {
    const b = this.bossDef;
    const options = [];
    const player = this.game.player;
    const dist = Math.hypot(player.position.x - this.position.x, player.position.z - this.position.z);
    if (b.id === 'hollowKing') {
      options.push('shockwave', 'summon');
      if (this.phase >= 2) options.push('shockwave');
    } else if (b.id === 'ironAbomination') {
      options.push('slam', 'charge');
      if (this.phase >= 2) options.push('volley');
    } else if (b.id === 'forestMatriarch') {
      options.push('leap', 'summon');
    } else if (b.id === 'contaminatedTitan') {
      options.push('acid', 'slam');
      if (this.phase >= 2) options.push('radburst');
    } else if (b.id === 'paleCommander') {
      options.push('blink', 'volley');
    } else if (b.id === 'lastSignal') {
      options.push('pulse', 'summon');
      if (this.phase >= 2) options.push('lightning');
    }
    const pick = options[Math.floor(Math.random() * options.length)];
    this.specialType = pick;
    this.specialTime = 0;
    this.specialDuration = 1.6;
    this.setState('special');
    this.specialTimer = 5.5 + Math.random() * 3;
    this.game.audio?.play('bossRoar', this.position);
    this.game.hud?.notify(`${this.name}: ${pick.toUpperCase()}`, 'boss');
  }

  updateSpecial(dt) {
    const player = this.game.player;
    this.specialTime += dt;
    const perp = this.bossDef ? (this.bossDef.scale || 1.4) : 1;
    const dist = Math.hypot(player.position.x - this.position.x, player.position.z - this.position.z);
    this.currentSpeed = 0;
    switch (this.specialType) {
      case 'shockwave': {
        if (this.specialTime > 0.9 && !this.specialResolved) {
          this.specialResolved = true;
          this.game.fx.explosion(new THREE.Vector3(this.position.x, this.position.y + 0.3, this.position.z), 1.4);
          this.game.audio?.play('explosion', this.position);
          if (dist < 12) player.hit(30 * perp, 'leg', this);
          player.shake(1.2);
          this.game.ai?.alertRadius(this.position, 30);
        }
        break;
      }
      case 'summon': {
        if (this.specialTime > 0.7 && !this.specialResolved) {
          this.specialResolved = true;
          const minions = this.bossDef.id === 'lastSignal' ? 3 : 2;
          for (let i = 0; i < minions; i++) {
            const a = Math.random() * TAU;
            const r = 4 + Math.random() * 5;
            const x = this.position.x + Math.cos(a) * r;
            const z = this.position.z + Math.sin(a) * r;
            const mid = this.bossDef.id === 'forestMatriarch' ? 'crawler' : this.bossDef.id === 'lastSignal' ? 'contaminated' : 'hollow';
            this.manager.spawn(mid, x, z, { level: this.level, pack: 'summon' + this.id });
          }
          this.game.fx.groups.dust.spawn({ x: this.position.x, y: this.position.y + 1, z: this.position.z, life: 2, size: 2.2, color: 0x6a5a48 });
        }
        break;
      }
      case 'slam':
      case 'radburst': {
        if (this.specialTime > 1.0 && !this.specialResolved) {
          this.specialResolved = true;
          this.game.fx.explosion(new THREE.Vector3(this.position.x, this.position.y, this.position.z), 2.0);
          this.game.audio?.play('explosion', this.position);
          if (dist < 14) {
            player.hit(40 * perp, 'torso', this);
            if (this.specialType === 'radburst') this.game.survival?.addRadiation(22);
          }
          player.shake(1.5);
        }
        break;
      }
      case 'acid':
      case 'volley':
      case 'pulse':
      case 'lightning': {
        if (this.specialTime > 0.6 && !this.specialResolved) {
          this.specialResolved = true;
          const count = this.specialType === 'volley' ? 4 : this.specialType === 'pulse' ? 3 : 2;
          for (let i = 0; i < count; i++) {
            const spread = (i - (count - 1) / 2) * 0.09;
            const dir = new THREE.Vector3(player.position.x - this.position.x, player.position.y + 1 - (this.position.y + 1.4), player.position.z - this.position.z).normalize();
            dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), spread);
            this.manager.spawnProjectile({
              pos: new THREE.Vector3(this.position.x, this.position.y + this.height * 0.8, this.position.z),
              dir,
              speed: this.specialType === 'volley' ? 26 : 18,
              damage: (this.specialType === 'acid' ? 16 : 22) * perp,
              life: 4,
              color: this.specialType === 'acid' ? 0x8ad050 : this.specialType === 'pulse' ? 0x60c0ff : 0xff8040,
              kind: this.specialType,
              owner: this,
            });
          }
          this.game.audio?.play('gunshot', this.position, { caliber: 'rifle' });
        }
        break;
      }
      case 'charge': {
        if (this.specialTime < 1.1) {
          this.moveTowards(player.position, this.chaseSpeed * 2.4, dt);
          this.currentSpeed = this.chaseSpeed * 2.4;
          if (dist < 3.4 && !this.specialResolved) {
            this.specialResolved = true;
            player.hit(46 * perp, 'torso', this);
            player.shake(1.6);
            this.game.ai?.alertRadius(this.position, 25);
          }
        }
        break;
      }
      case 'leap': {
        if (this.specialTime > 0.5 && !this.specialResolved) {
          this.specialResolved = true;
          const land = player.position.clone();
          this.position.x = land.x + (Math.random() - 0.5) * 2;
          this.position.z = land.z + (Math.random() - 0.5) * 2;
          this.game.fx.groups.dust.spawn({ x: this.position.x, y: this.position.y + 0.4, z: this.position.z, life: 1.4, size: 1.6, color: 0x7a6a56 });
          if (dist < 5) player.hit(38 * perp, 'torso', this);
          player.shake(1.2);
        }
        break;
      }
      case 'blink': {
        if (this.specialTime > 0.4 && !this.specialResolved) {
          this.specialResolved = true;
          const behind = new THREE.Vector3(player.position.x, 0, player.position.z).addScaledVector(player.flatForward, -2.4);
          const y = this.collision.groundHeight(behind.x, behind.z);
          if (this.collision.isFree(behind.x, y + 0.4, behind.z, this.radius, this.height)) {
            this.position.set(behind.x, y, behind.z);
            this.game.fx.groups.smoke.spawn({ x: behind.x, y: y + 1, z: behind.z, life: 0.8, size: 1.4, color: 0x2a2a30 });
            this.game.audio?.play('scream', this.position);
          }
        }
        break;
      }
      default:
        break;
    }
    if (this.specialTime >= this.specialDuration) {
      this.specialResolved = false;
      this.setState('chase');
    }
  }

  updateCharge(dt) {
    this.updateSpecial(dt);
  }

  updateFacingAndAnim(dt, speed) {
    const moving = speed > 0.1;
    this.rig.update?.(dt, { speed: moving ? speed : 0, aim: this.aggro ? 0.35 : 0, look: { x: 0, y: 0 } });
    const targetY = this.collision.groundHeight(this.position.x, this.position.z);
    // step onto low ledges
    const floor = this.collision.floorAt(this.position.x, this.position.y, this.position.z, this.radius, 0.6, 0.6);
    this.position.y = damp(this.position.y, Math.max(targetY, floor), 14, dt);
    this.modelRoot.position.copy(this.position);
    this.modelRoot.rotation.y = this.facing + Math.PI;
    // watcher eye pulse
    if (this.eye) {
      this.eye.material.emissiveIntensity = 1.6 + Math.sin(this.time * 3) * 0.6;
    }
    if (this.burrowed) this.modelRoot.visible = false;
    else this.modelRoot.visible = true;
    if (this.disguised) {
      this.modelRoot.position.y = this.position.y - 0.55;
      this.modelRoot.rotation.z = 1.35;
    }
  }

  syncModel() {
    this.modelRoot.position.copy(this.position);
  }

  moveTowards(target, speed, dt, chase = false) {
    const dx = target.x - this.position.x;
    const dz = target.z - this.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.001) return;
    let nx = dx / dist;
    let nz = dz / dist;
    this.moveHeading = Math.atan2(-nx, -nz);
    // avoidance: probe ahead
    const probe = 1.1 + this.radius;
    const px = this.position.x + nx * probe;
    const pz = this.position.z + nz * probe;
    const chestY = this.position.y + this.height * 0.5;
    if (!this.collision.isFree(px, this.position.y + 0.35, pz, this.radius * 0.9, this.height * 0.9)) {
      const left = new THREE.Vector3(-nz, 0, nx);
      const right = new THREE.Vector3(nz, 0, -nx);
      const tryDir = (v) => this.collision.isFree(this.position.x + v.x * probe, this.position.y + 0.35, this.position.z + v.z * probe, this.radius * 0.9, this.height * 0.9);
      const lOk = tryDir(left);
      const rOk = tryDir(right);
      if (lOk && !rOk) {
        nx = left.x;
        nz = left.z;
      } else if (rOk && !lOk) {
        nx = right.x;
        nz = right.z;
      } else if (lOk && rOk) {
        nx += left.x * 0.8;
        nz += left.z * 0.8;
        const l = Math.hypot(nx, nz) || 1;
        nx /= l;
        nz /= l;
      } else {
        // try stepping up ledges
        if (this.collision.isFree(px, this.position.y + 0.9, pz, this.radius * 0.9, this.height * 0.9)) {
          this.position.y += 0.5;
        }
      }
    }
    this.position.x += nx * speed * dt;
    this.position.z += nz * speed * dt;
    this.collision.resolveHorizontal(this.position, this.radius, this.height, 0);
    // unstick from spawn
    if (this.state === 'chase' && dist > 1 && Math.hypot(this.position.x - this.spawnPoint.x, this.position.z - this.spawnPoint.z) > 160) {
      this.position.x = this.spawnPoint.x;
      this.position.z = this.spawnPoint.z;
    }
  }

  facingVector() {
    return new THREE.Vector3(-Math.sin(this.facing), 0, -Math.cos(this.facing));
  }

  burrow() {
    if (this.burrowed) return;
    this.burrowed = true;
    this.burrowTimer = 2.2 + Math.random() * 1.6;
    this.modelRoot.visible = false;
    this.game.fx.groups.dust.spawn({ x: this.position.x, y: this.position.y + 0.3, z: this.position.z, life: 1.2, size: 1.6, color: 0x7a6a56 });
    this.game.audio?.play('waterSplash', this.position);
    // move toward the player underground
    const p = this.game.player.position;
    this.position.x = lerp(this.position.x, p.x, 0.5);
    this.position.z = lerp(this.position.z, p.z, 0.5);
  }

  emerge() {
    this.burrowed = false;
    this.modelRoot.visible = true;
    this.game.fx.groups.dust.spawn({ x: this.position.x, y: this.position.y + 0.4, z: this.position.z, life: 1.4, size: 2.0, color: 0x7a6a56 });
    this.game.audio?.play('crawlerScreech', this.position);
    const player = this.game.player;
    const d = Math.hypot(player.position.x - this.position.x, player.position.z - this.position.z);
    if (d < 4.5) player.hit(this.enemyDef.damage * 0.7, 'leg', this);
    this.setState('chase');
  }

  cleanup() {
    if (this.dismanaged) return;
    this.dismanaged = true;
    this.game.scene.remove(this.modelRoot);
    this.manager.remove(this);
  }

  serialize() {
    return { id: this.id, x: this.position.x, y: this.position.y, z: this.position.z, hp: this.health, dead: this.dead, level: this.level };
  }
}

export class EnemyManager {
  constructor(game) {
    this.game = game;
    this.enemies = [];
    this.packs = new Map();
    this.projectiles = [];
    this.spawnTimer = 0;
    this.maxActive = 26;
    this.projectileGeo = new THREE.SphereGeometry(0.12, 8, 6);
    this.projectilePool = [];
    this.packCounter = 0;
    this.lastSpawnPoint = null;
    this.spawnRules = [];
    this.bosses = new Map();
    this.deadCount = 0;
  }

  get activeCount() {
    return this.enemies.filter((e) => e.alive).length;
  }

  newPackId() {
    return `pack${this.packCounter++}`;
  }

  spawn(defId, x, z, opts = {}) {
    if (this.activeCount > 110) return null;
    const terrain = this.game.collision.terrain;
    let y = terrain ? terrain.heightAt(x, z) : 0;
    // ensure spawn is not inside geometry
    if (!this.game.collision.isFree(x, y + 0.5, z, 0.5, 1.6)) {
      for (let i = 0; i < 8; i++) {
        const a = Math.random() * TAU;
        const r = 1.5 + i;
        const nx = x + Math.cos(a) * r;
        const nz = z + Math.sin(a) * r;
        const ny = terrain ? terrain.heightAt(nx, nz) : 0;
        if (this.game.collision.isFree(nx, ny + 0.5, nz, 0.5, 1.6)) {
          x = nx;
          z = nz;
          y = ny;
          break;
        }
      }
    }
    const def = MUTANTS[defId];
    if (!def) return null;
    const pos = new THREE.Vector3(x, y, z);
    const pack = opts.pack ?? (def.pack > 0 ? this.newPackId() : null);
    const enemy = new Enemy(this, defId, pos, { ...opts, pack });
    this.enemies.push(enemy);
    if (!this.packs.has(pack) && pack) this.packs.set(pack, []);
    if (pack) this.packs.get(pack).push(enemy);
    return enemy;
  }

  spawnBoss(bossId, level = 1, at = null) {
    const def = BOSSES[bossId];
    if (!def) return null;
    const [x, z] = at ? [at.x, at.z] : def.arena;
    const terrain = this.game.collision.terrain;
    const y = terrain ? terrain.heightAt(x, z) : 0;
    const boss = new Enemy(this, def.mutant || 'hollow', new THREE.Vector3(x, y, z), { boss: def, level, homeRadius: 30 });
    this.enemies.push(boss);
    this.bosses.set(bossId, boss);
    this.game.hud?.showBoss(boss);
    this.game.audio?.play('bossRoar', boss.position);
    return boss;
  }

  remove(enemy) {
    const i = this.enemies.indexOf(enemy);
    if (i >= 0) this.enemies.splice(i, 1);
    if (enemy.packId) {
      const arr = this.packs.get(enemy.packId);
      if (arr) {
        const j = arr.indexOf(enemy);
        if (j >= 0) arr.splice(j, 1);
      }
    }
  }

  clear() {
    for (const e of [...this.enemies]) {
      this.game.scene.remove(e.modelRoot);
      this.game.collision.removeDynamicSphere(e);
    }
    this.enemies.length = 0;
    this.packs.clear();
    for (const p of this.projectiles) this.game.scene.remove(p.mesh);
    this.projectiles.length = 0;
  }

  alertPack(packId, pos, exclude = null) {
    const arr = this.packs.get(packId);
    if (!arr) return;
    for (const e of arr) {
      if (e === exclude || e.dead) continue;
      if (e.position.distanceTo(pos) < 60) e.alert(pos);
    }
  }

  alertRadius(pos, radius) {
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (e.position.distanceTo(pos) < radius) e.alert(pos);
    }
  }

  onNoise(pos, radius) {
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.position.x - pos.x, e.position.z - pos.z);
      if (d < radius) e.hearNoise(pos, radius);
    }
  }

  onSpotted(enemy) {
    // nearby mutants share the sighting
    this.alertRadius(enemy.position, 18);
  }

  spawnProjectile({ pos, dir, speed, damage, life = 3, color = 0xff8040, kind = 'bolt', owner = null }) {
    let mesh = this.projectilePool.pop();
    if (!mesh) {
      mesh = new THREE.Mesh(this.projectileGeo, new THREE.MeshBasicMaterial({ color }));
      mesh.scale.setScalar(1.4);
    }
    mesh.material.color.setHex(color);
    mesh.position.copy(pos);
    mesh.visible = true;
    this.game.scene.add(mesh);
    this.projectiles.push({ mesh, dir: dir.clone(), speed, damage, life, kind, owner, start: pos.clone() });
  }

  update(dt) {
    const player = this.game.player;
    for (const e of [...this.enemies]) {
      const dist = e.position.distanceTo(player.position);
      if (e.dead && (dist > 110 || e.deathTimer > 20)) { e.cleanup?.(); this.remove(e); continue; }
      // render budget: distant mutants are hidden until the player is close
      if (e.modelRoot) e.modelRoot.visible = dist < 135 || e.isBoss;
      // cull far enemies (keep bosses)
      if (!e.isBoss && dist > 170 && e.state !== 'chase') {
        if (e.position.distanceTo(e.spawnPoint) < 4 && Math.random() < dt * 0.5) {
          this.game.scene.remove(e.modelRoot);
          this.game.collision.removeDynamicSphere(e);
          this.remove(e);
          continue;
        }
      }
      // only run full AI near the player
      if (dist < 110 || e.isBoss) e.update(dt);
      else e.updateFacingAndAnim(dt, 0);
    }
    // projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      const step = p.speed * dt;
      const hitStatic = this.game.collision.raycast(p.mesh.position, p.dir, step + 0.2, { step: 0.15 });
      if (hitStatic < step + 0.2) {
        this.game.fx.impact(p.mesh.position, p.dir.clone().negate(), 'concrete', 1);
        this.removeProjectile(i);
        continue;
      }
      p.mesh.position.addScaledVector(p.dir, step);
      if (p.mesh.position.distanceTo(player.eyePosition) < 0.85 && !player.isDead) {
        player.hit(p.damage, 'torso', p.owner);
        this.game.fx.impact(player.eyePosition, p.dir.clone().negate(), 'flesh', 1);
        this.removeProjectile(i);
        continue;
      }
      if (p.life <= 0) this.removeProjectile(i);
    }
  }

  removeProjectile(i) {
    const p = this.projectiles[i];
    this.game.scene.remove(p.mesh);
    this.projectilePool.push(p.mesh);
    this.projectiles.splice(i, 1);
  }

  countAliveNear(pos, radius) {
    let n = 0;
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (e.position.distanceTo(pos) < radius) n++;
    }
    return n;
  }

  serialize() {
    return { enemies: this.enemies.filter((e) => e.isBoss || !e.dead).map((e) => e.serialize()) };
  }
}
