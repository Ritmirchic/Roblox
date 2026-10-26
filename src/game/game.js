// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// game/game.js — orchestration: world, systems, loop, saves
// ============================================================
import * as THREE from 'three';
import { World } from '../world/world.js';
import { Sky, WEATHER } from '../world/sky.js';
import { Player } from './player.js';
import { Enemy, Boss } from './enemies.js';
import { VFX } from './vfx.js';
import { Audio } from './audio.js';
import { WeaponSystem } from './weapons.js';
import { Combat } from './combat.js';
import { Inventory } from './inventory.js';
import { QuestLog, ALL_QUESTS } from './quests.js';
import { NPCSystem, NPCS, buildSignalEntity } from './npcs.js';
import { Body } from './body.js';
import { LootSystem } from './loot.js';
import { WorldEvents } from './events.js';
import { Doors } from './doors.js';
import { UI } from '../ui/ui.js';
import { ITEMS, WEAPONS, SKILLS, RECIPES, BUILDABLES, BOSSES, MUTANTS, REGIONS, CFG } from './data.js';
import { makeLootMesh } from '../world/props.js';
import { boxGeo, cylGeo } from '../world/geo.js';
import { M, plain, mat } from '../core/materials.js';
import { RNG, clamp, damp, dampAngle, lerp, dist2 } from '../core/util.js';
import { writeSave, readSave, hasSave, clearSaves } from './save.js';

const INTERACTABLES = [
  { id: 'shelter_locker', label: 'Search the locker', x: -352.1, z: 154.2, dy: 0.9, kind: 'locker' },
  { id: 'shelter_console', label: 'Read the radio console', x: -353.4, z: 146.8, dy: 1.1, kind: 'console' },
  { id: 'shelter_note', label: "Read Mikhail's note", x: -366.6, z: 146.6, dy: 1.0, kind: 'note' },
  { id: 'school_valve', label: 'Turn the water valve', poi: 'sub_school', dx: 6.5, dz: 4.0, dy: 0.9, kind: 'valve' },
  { id: 'projector', label: 'Stop the projector', poi: 'sub_school', dx: -5.0, dz: -2.0, dy: 1.0, kind: 'projector' },
  { id: 'crane_panel', label: 'Start the rail crane', poi: 'ind_depot', dx: 3.0, dz: 2.0, dy: 1.0, kind: 'console' },
  { id: 'warehouse_breaker', label: 'Throw the breaker', poi: 'ind_warehouse', dx: -4.0, dz: 3.0, dy: 1.2, kind: 'breaker' },
  { id: 'hospital_barricade', label: 'Bar the doors', poi: 'city_hospital', dx: 2.5, dz: 3.0, dy: 1.0, kind: 'barricade' },
  { id: 'delta_lamp', label: 'Light the perimeter lamp', poi: 'mil_camp', dx: -3.0, dz: 2.0, dy: 1.1, kind: 'lamp' },
  { id: 'perimeter_cut', label: 'Cut the perimeter wire', poi: 'mil_camp', dx: 7.0, dz: -4.0, dy: 1.0, kind: 'wire' },
  { id: 'array_console', label: 'Access the array console', poi: 'was_array', dx: 2.0, dz: -3.0, dy: 1.1, kind: 'array' },
];

const DEFAULT_SETTINGS = {
  master: 0.8, music: 0.55, sfx: 0.9,
  fov: 72, renderScale: 1, brightness: 1, viewDistance: 1,
  shadows: true, quality: 'high', motionBlur: false,
  sensitivity: 1, gamepadSens: 1, invertY: false,
  difficulty: 'survivor', cameraMode: 0, autoPickup: true, showDamage: true,
};

export class Game {
  constructor(opts = {}) {
    this.opts = opts;
    this.headless = !!opts.headless;
    this.lite = !!opts.lite;   // low-end / QA profile: fewer actors, no shadow pass
    this.container = opts.container || document.body;
    this.seed = opts.seed || 20261026;
    this.time = 0;
    this.day = 1;
    this.difficulty = 1;
    this.locked = false;
    this.cameraMode = 0;
    this.act = 1;
    this.hitStop = 0;
    this.stats = { kills: 0, headshots: 0, damageDealt: 0, damageTaken: 0, deaths: 0, distance: 0 };
    this.codex = { mutants: {}, kills: {}, bosses: {}, bossSeen: {}, regions: {} };
    this.skillRanks = {};     // purchased ranks per node
    this.skills = {};         // aggregated skill effects (player.skills points here)
    this.level = 1;
    this.xp = 0;
    this.skillPoints = 0;
    this.buildCount = 0;
    this.buildings = [];
    this.objectives = [];
    this.eventState = {};
    this.settings = { ...DEFAULT_SETTINGS };
    this.mode = 'loading';
    this.waypoint = null;
    this.selectedQuick = 0;
    this.paused = false;
    this.dayTimer = 0;
    this.autosaveTimer = 0;
    this.finaleStarted = false;
    this.bossBars = new Map();
    this._tmpV = new THREE.Vector3();
    this._interactCooldown = 0;
    this._poiSeen = {};
  }

  // ------------------------------------------------------------ setup
  async init(onProgress) {
    const p = typeof onProgress === 'function' ? onProgress : () => {};
    this.loadSettings();
    if (this.lite) {
      this.settings.shadows = false;
      this.settings.viewDistance = 0.45;
      this.settings.renderScale = Math.min(this.settings.renderScale, 0.5);
      this.settings.quality = 'low';
    }
    this.ui = new UI(this);
    this.ui.showLoading();
    this.ui.setLoading(2, 'building renderer');

    if (!this.headless) {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2) * this.settings.renderScale);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.shadowMap.enabled = this.settings.shadows;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.12 * this.settings.brightness;
      this.container.appendChild(this.renderer.domElement);
    } else {
      this.renderer = null;
    }

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.settings.fov, 16 / 9, 0.08, 1600);
    this.camera.position.set(-360, 4, 150);

    this.sky = new Sky(this.scene, this.renderer);
    this.sky.setWeather('overcast', true);

    this.sun = new THREE.DirectionalLight(0xfff2e0, 2.0);
    this.sun.position.set(60, 90, 40);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 260;
    const sc = this.sun.shadow.camera;
    sc.left = -70; sc.right = 70; sc.top = 70; sc.bottom = -70;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.035;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
    this.hemi = new THREE.HemisphereLight(0x8fa0b0, 0x2a241c, 0.75);
    this.scene.add(this.hemi);

    this.world = new World(this.scene, { seed: this.seed });
    await this.world.generate((step, pct) => {
      this.ui.setLoading(4 + pct * 0.7, step);
      p(step, pct);
    });

    this.ui.setLoading(78, 'waking the survivor');
    this.player = new Player(this.world);
    this.player.pos.copy(this.world.startPosition);
    this.player.yaw = Math.PI;           // facing the stairwell
    this.player.cameraMode = this.settings.cameraMode;
    this.cameraMode = this.player.cameraMode;
    this.player.fov = this.settings.fov;
    this.player.sens = this.settings.sensitivity;
    this.player.skills = this.skills;
    this.body = new Body(this);

    this.inventory = new Inventory(this);
    this.quests = new QuestLog(this);
    this.vfx = new VFX(this.scene);
    this.audio = new Audio(this.camera);
    this.doors = new Doors(this);
    this.loot = new LootSystem(this);
    this.npcs = new NPCSystem(this);
    this.npcs.spawn();
    this.weapons = new WeaponSystem(this);
    this.combat = new Combat(this);
    this.events = new WorldEvents(this);
    this.spawnSignalEntity();
    this.spawnInteractables();
    this.spawnEnemiesInitial();
    this.applySkills();
    this.setupDamageRouting();
    this.setupInput();
    this.bindUI();

    this.ui.setLoading(94, 'finalising');
    this.ui.hideLoading();
    this.ui.setBuildTag(`THREE.JS r169 / WEBGL2<br>WORLD SEED ${this.seed}<br>${this.world.pois.length} SITES · ${this.world.lootSpots.length} CACHES`);
    this.ui.showMainMenu(hasSave());
    this.mode = 'menu';

    if (!this.headless) this.startLoop();
    p('ready', 100);
    return this;
  }

  // ------------------------------------------------------------ input
  setupInput() {
    this.input = {
      keys: {}, mouse: { dx: 0, dy: 0, left: false, right: false, leftPressed: false, rightPressed: false, wheel: 0 },
      pressed: {},
    };
    if (this.headless) return;
    const k = this.input.keys;
    window.addEventListener('keydown', (e) => {
      if (e.repeat) { this.input.pressed[e.code] = false; return; }
      if (this.ui && this.ui.handleKey(e)) { e.preventDefault(); return; }
      k[e.code] = true;
      this.input.pressed[e.code] = true;
      if (['Tab', 'Space', 'KeyE', 'KeyF', 'KeyR', 'KeyV', 'KeyH', 'KeyQ'].includes(e.code)) e.preventDefault();
      this.onKeyDown(e.code);
    });
    window.addEventListener('keyup', (e) => { k[e.code] = false; });
    window.addEventListener('blur', () => { for (const key of Object.keys(k)) k[key] = false; });
    window.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      const s = this.settings.invertY ? -1 : 1;
      this.input.mouse.dx += e.movementX || 0;
      this.input.mouse.dy += (e.movementY || 0) * s;
    });
    window.addEventListener('mousedown', (e) => {
      if (!this.locked) { this.requestLock(); return; }
      if (e.button === 0) { this.input.mouse.left = true; this.input.mouse.leftPressed = true; }
      if (e.button === 2) { this.input.mouse.right = true; this.input.mouse.rightPressed = true; }
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.input.mouse.left = false;
      if (e.button === 2) this.input.mouse.right = false;
    });
    window.addEventListener('wheel', (e) => { this.input.mouse.wheel += Math.sign(e.deltaY); }, { passive: true });
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', () => this.onResize());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.renderer?.domElement;
      if (!this.locked && this.mode === 'playing' && !this.ui.panels.visible() && this.ui.mode !== 'dialogue' && this.ui.mode !== 'shop') this.ui.openPause();
    });
    const canvas = this.renderer?.domElement;
    if (canvas) canvas.addEventListener('click', () => { if (this.mode === 'playing' && !this.locked) this.requestLock(); });
  }

  bindUI() {
    // the "New Game" button needs the initial state applied after the menu
    this.ui.hud.setVisible(false);
  }

  requestLock() {
    if (this.headless) return;
    if (this.mode !== 'playing') return;
    const c = this.renderer?.domElement;
    if (c && c.requestPointerLock) c.requestPointerLock();
  }

  onResize() {
    if (!this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2) * this.settings.renderScale);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onKeyDown(code) {
    if (this.mode !== 'playing') return;
    if (code === 'KeyF') {
      this.player.flashlightOn = !this.player.flashlightOn;
      if (this.flashlight) this.flashlight.visible = this.player.flashlightOn;
      this.audio.uiClick();
    }
    if (code === 'KeyV') {
      this.player.cameraMode = this.player.cameraMode === 1 ? 0 : 1;
      this.cameraMode = this.player.cameraMode;
      this.audio.uiClick();
    }
    if (code === 'KeyE') this.tryInteract();
    if (code === 'KeyQ') this.toggleAimWeapon();
    if (code === 'KeyG') this.quickHeal();
    if (/^Digit[1-4]$/.test(code)) {
      const i = +code.slice(5) - 1;
      this.selectQuickSlot(i);
    }
    if (code === 'F5') { this.saveGame(true); }
    if (code === 'F9') { this.loadGame(); }
  }

  // ------------------------------------------------------------ game start
  startNewGame() {
    clearSaves();
    this.resetProgression();
    this.player.pos.copy(this.world.startPosition);
    this.player.yaw = Math.PI;
    this.player.pitch = 0;
    this.player.stats.health = this.player.stats.healthMax;
    this.player.stamina = this.player.staminaMax;
    this.body.reset();
    this.inventory = new Inventory(this);
    this.quests = new QuestLog(this);
    this.weapons = new WeaponSystem(this);
    this.combat = new Combat(this);
    this.combat.game = this;
    this.loot = new LootSystem(this);
    this.doors.deserialize(this.doors.doors.map((d) => (d.spec.startOpen || 0)));
    this.enemiesKilled = new Set();
    this.clearEnemies();
    this.spawnEnemiesInitial();
    this.codex = { mutants: {}, kills: {}, bosses: {}, bossSeen: {}, regions: {} };
    this.stats = { kills: 0, headshots: 0, damageDealt: 0, damageTaken: 0, deaths: 0, distance: 0 };
    this.time = 0; this.day = 1;
    this.sky.dayTime = 0.30;
    this.sky.setWeather('overcast', true);
    this.act = 1;
    this.finaleStarted = false;
    this.waypoint = null;
    this.buildings.forEach((b) => this.scene.remove(b.mesh));
    this.buildings = [];
    this.buildCount = 0;

    // starting kit: a dying flashlight and one bandage
    this.inventory.add('flashlight', 1);
    this.inventory.add('bandage', 1);
    this.inventory.add('water_bottle', 1);
    const fl = this.inventory.items.find((i) => i.id === 'flashlight');
    if (fl) { this.inventory.equip(fl.uid); }
    this.player.flashlightOn = true;

    this.setupFlashlight();
    this.quests.start('m01');
    this.act = 1;
    this.ui.hideMainMenu();
    this.ui.setVisible(true);
    this.ui.hud.setVisible(true);
    this.ui.hud.setCrosshair(true);
    this.ui.closePause?.();
    this.mode = 'playing';
    this.locked = false;
    this.ui.notify('SHELTER 12', 'Seven metres under the Dead Suburbs. The air tastes like battery acid.', '#c9963f', 'quest');
    this.quests.start('m01');
    this.updateObjectives();
    if (!this.headless) this.requestLock();
    this.audio.init();
    this.audio.startMusic();
    this.saveGame(false);
  }

  continueGame() {
    const data = readSave(false) || readSave(true);
    if (!data) { this.startNewGame(); return; }
    this.ui.hideMainMenu();
    this.ui.setVisible(true);
    this.ui.hud.setVisible(true);
    this.mode = 'playing';
    this.audio.init();
    this.loadData(data);
    this.updateObjectives();
    if (!this.headless) this.requestLock();
  }

  toMainMenu() {
    this.mode = 'menu';
    this.locked = false;
    if (document.exitPointerLock) document.exitPointerLock();
    this.ui.closePause();
    this.pauseEl?.classList.remove('open');
    this.ui.showMainMenu(hasSave());
    this.ui.hud.setVisible(false);
    this.audio.stopMusic?.();
  }

  setupFlashlight() {
    if (this.headless) return;
    if (this.flashlight) { this.scene.remove(this.flashlight); this.flashlight = null; }
    const light = new THREE.SpotLight(0xfff0cf, 7.5, 34, 0.62, 0.72, 1.25);
    light.castShadow = false;
    this.scene.add(light);
    this.scene.add(light.target);
    this.flashlight = light;
    // a weak handheld lantern so unlit interiors never go fully black
    if (this.lantern) { this.scene.remove(this.lantern); this.lantern = null; }
    const lantern = new THREE.PointLight(0xffc98a, 0.9, 9, 2);
    lantern.castShadow = false;
    this.scene.add(lantern);
    this.lantern = lantern;
  }

  spawnSignalEntity() {
    const poi = this.world.pois.find((p) => p.id === 'was_array');
    if (!poi) return;
    this.signalEntity = buildSignalEntity();
    this.signalEntity.position.set(poi.x, poi.y + 0.05, poi.z);
    this.scene.add(this.signalEntity);
    this.signalLight = this.signalEntity.userData.light;
  }

  // ------------------------------------------------------------ enemies
  spawnEnemy(type, x, z, opts = {}) {
    if (!MUTANTS[type]) return null;
    const e = new Enemy(this, type, x, z, opts);
    this.enemies.push(e);
    this.codex.mutants[type] = true;
    return e;
  }

  spawnEnemyNear(type, minD = 30, maxD = 50) {
    const p = this.player.pos;
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = minD + Math.random() * (maxD - minD);
      const x = clamp(p.x + Math.cos(a) * r, -680, 680);
      const z = clamp(p.z + Math.sin(a) * r, -480, 480);
      const y = this.world.heightAt(x, z);
      if (!isFinite(y)) continue;
      if (this.world.isIndoor(x, y + 1, z)) continue;
      return this.spawnEnemy(type, x, z);
    }
    return null;
  }

  spawnEnemiesInitial() {
    this.enemies = [];
    this.bosses = [];
    this.enemiesKilled = new Set();
    const rng = new RNG(this.seed + 9001);
    const regionPools = {
      suburbs: ['hollow', 'hollow', 'crawler', 'mimic'],
      forest: ['crawler', 'stalker', 'burrower', 'hollow'],
      industrial: ['hollow', 'brute', 'screamer', 'crawler'],
      city: ['hollow', 'stalker', 'crawler', 'screamer', 'mimic'],
      military: ['hollow', 'watcher', 'brute', 'stalker'],
      wasteland: ['contaminated', 'pale', 'burrower', 'watcher'],
    };
    const start = this.world.startPosition;
    for (const poi of this.world.pois) {
      if (poi.type === 'boss' || poi.id.startsWith('was_array')) continue;
      if (this.lite && Math.hypot(poi.x - start.x, poi.z - start.z) > 160) continue;
      const region = this.world.regionAt(poi.x, poi.z).id;
      const pool = regionPools[region] || regionPools.suburbs;
      const count = poi.type === 'camp' || poi.type === 'shelter' ? 0 : rng.int(1, 3);
      for (let i = 0; i < count; i++) {
        const a = rng.range(0, Math.PI * 2), r = rng.range(9, 26);
        const x = clamp(poi.x + Math.cos(a) * r, -680, 680);
        const z = clamp(poi.z + Math.sin(a) * r, -480, 480);
        if (this.world.isIndoor(x, this.world.heightAt(x, z) + 1, z)) continue;
        this.spawnEnemy(rng.pick(pool), x, z);
      }
    }
    // wilderness drifters
    for (let i = 0; i < (this.lite ? 0 : 46); i++) {
      const x = rng.range(-660, 660), z = rng.range(-460, 470);
      const region = this.world.regionAt(x, z).id;
      const pool = regionPools[region] || regionPools.suburbs;
      this.spawnEnemy(rng.pick(pool), x, z);
    }
  }

  clearEnemies() {
    for (const e of this.enemies) e.dispose();
    this.enemies = [];
    this.bosses = [];
  }

  removeEnemy(enemy) {
    const i = this.enemies.indexOf(enemy);
    if (i >= 0) this.enemies.splice(i, 1);
    enemy.dispose();
    const bi = this.bosses.indexOf(enemy);
    if (bi >= 0) {
      this.bosses.splice(bi, 1);
      this.bossBars.delete(enemy);
      if (this.bossBars.size === 0) this.ui.hud.hideBoss();
    }
  }

  alertEnemiesToNoise(x, z, amount = 1, radius = 40) {
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (Math.hypot(e.pos.x - x, e.pos.z - z) < radius) e.hear(amount, x, z);
    }
  }

  keepInArena(boss) {
    if (!boss.arena) return;
    const a = boss.arena;
    const d = Math.hypot(boss.pos.x - a.x, boss.pos.z - a.z);
    const limit = (a.radius || 18) * 1.15;
    if (d > limit) {
      const k = limit / d;
      boss.pos.x = a.x + (boss.pos.x - a.x) * k;
      boss.pos.z = a.z + (boss.pos.z - a.z) * k;
    }
  }

  updateArenas(dt) {
    const p = this.player.pos;
    for (const [id, arena] of Object.entries(this.world.arenas)) {
      const d = Math.hypot(p.x - arena.x, p.z - arena.z);
      const bossId = arena.boss;
      if (!bossId || !BOSSES[bossId]) continue;
      if (this.codex.bosses[bossId]) continue;
      if (d < 28 && !arena._spawned) {
        arena._spawned = true;
        const boss = new Boss(this, bossId);
        boss.arena = arena;
        this.enemies.push(boss);
        this.bosses.push(boss);
        this.codex.bossSeen[bossId] = true;
        this.bossBars.set(boss, true);
        this.audio.bossRoar(boss.pos);
        this.ui.hud.showBoss(boss.name, boss.phase, boss.maxPhases, `WARDEN ASSET · ${(REGIONS.find((r) => r.id === arena.region)?.name || '').toUpperCase()}`);
        this.ui.notify(boss.name, boss.bossDef.desc, '#c05038', 'danger');
        this.act = Math.max(this.act, this.questForBoss(bossId));
      }
    }
    // boss bar
    if (this.bossBars.size) {
      for (const boss of [...this.bossBars.keys()]) {
        if (boss.dead) { this.bossBars.delete(boss); continue; }
        const dist = Math.hypot(p.x - boss.pos.x, p.z - boss.pos.z);
        if (dist > 70) { this.bossBars.delete(boss); }
        this.ui.hud.setBossHP(boss.hp / boss.hpMax);
        this.ui.hud.showBoss(boss.name, boss.phase, boss.maxPhases, boss.enraged ? 'ENRAGED' : '');
      }
      if (!this.bossBars.size) this.ui.hud.hideBoss();
    }
  }

  questForBoss(bossId) {
    const q = ALL_QUESTS.find((x) => x.objectives.some((o) => o.type === 'boss' && o.boss === bossId));
    return q?.act || 1;
  }

  // ------------------------------------------------------------ boss specials
  bossSweep(boss, radius) {
    const p = this.player;
    const d = Math.hypot(p.pos.x - boss.pos.x, p.pos.z - boss.pos.z);
    this.vfx.meleeArc(boss.pos, boss.yaw, radius, 0xff5030);
    this.audio.bossSwing(boss.pos);
    if (d < radius) {
      p.applyDamage(boss.def.dmg * 1.4, { body: 'torso', bleed: 10, fracture: Math.random() < 0.2 });
      this.ui.flashDamage(1);
    }
    this.spawnShockwave(boss.pos, radius * 0.6, 0xc05038);
  }

  bossSummon(boss, type = null, count = null) {
    const types = type ? [type] : (MUTANTS[boss.def.mutant] ? [boss.def.mutant] : ['hollow']);
    const n = count ?? 3;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 4 + Math.random() * 6;
      const x = boss.pos.x + Math.cos(a) * r, z = boss.pos.z + Math.sin(a) * r;
      const e = this.spawnEnemy(types[0], x, z, { speedMul: 1.05 });
      if (e) e.setState?.('chase');
      this.spawnShockwave(new THREE.Vector3(x, boss.pos.y, z), 1.6, 0x88ff88);
    }
    this.ui.notify('The arena answers', 'Something crawled out of the ground.', null, 'danger');
  }

  bossProjectileFan(boss, count, color = 0xff6020, opts = {}) {
    const p = this.player;
    const from = boss.center.clone();
    for (let i = 0; i < count; i++) {
      const spread = (opts.spread ?? 0.16) * (i - (count - 1) / 2);
      const target = p.pos.clone().add(new THREE.Vector3(0, 1.1, 0));
      const dir = target.sub(from).normalize();
      const ang = Math.atan2(dir.x, dir.z) + spread;
      const point = from.clone().add(new THREE.Vector3(Math.sin(ang) * 30, 0, Math.cos(ang) * 30));
      this.combat.spawnProjectile(from, point, {
        speed: opts.speed || 22, damage: opts.damage || 26, owner: 'enemy', color,
        radius: 0.28, onHit: () => { this.audio.impactHard(boss.pos); this.vfx.impact(p.pos, new THREE.Vector3(0, 1, 0), 'metal'); },
      });
    }
    this.audio.bossSwing(boss.pos);
  }

  bossScreamShock(boss) {
    const p = this.player;
    const d = Math.hypot(p.pos.x - boss.pos.x, p.pos.z - boss.pos.z);
    this.audio.scream(boss.pos);
    if (d < 18) {
      p.applyDamage(18, { bleed: 6, body: 'head' });
      p.addShake(0.8);
      p.stats.stress = clamp(p.stats.stress + 18, 0, 100);
      this.ui.flashDamage(1);
    }
    for (const e of this.enemies) {
      if (e !== boss && !e.dead && Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z) < 40) {
        e.lastKnown.copy(p.pos);
        e.setState?.('chase');
      }
    }
  }

  bossWebBind(boss) {
    const p = this.player;
    p.applyDamage(8, { body: 'legs' });
    p.slowT = 3.0;
    p.stamina = Math.max(0, p.stamina - 25);
    this.ui.notify('Webbed', 'Your legs are bound. Break free by moving.', null, 'danger');
    this.vfx.gasCloud(p.pos, 2.0, 3.0, 0xd8d8c0);
  }

  bossSlashCombo(boss) {
    const p = this.player;
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (boss.dead || p.dead) return;
        const d = Math.hypot(p.pos.x - boss.pos.x, p.pos.z - boss.pos.z);
        this.vfx.meleeArc(boss.pos, boss.yaw, 5.5, 0xff3030);
        this.audio.bossSwing(boss.pos);
        if (d < 5.5) { p.applyDamage(boss.def.dmg * 0.85, { body: 'torso', bleed: 8 }); this.ui.flashDamage(0.8); }
      }, 260 * i + 120);
    }
  }

  bossPhaseShift(boss) {
    boss.pos.x += (Math.random() - 0.5) * 6;
    boss.pos.z += (Math.random() - 0.5) * 6;
    this.spawnShockwave(boss.pos, 8, 0xa070ff);
    this.vfx.gasCloud(boss.pos, 4.5, 4, 0x7050a0);
  }

  bossCollapse(boss) {
    this.spawnShockwave(boss.pos, 14, 0xffffff);
    this.vfx.dustBurst(boss.pos, 60, 2.2);
    const p = this.player;
    if (Math.hypot(p.pos.x - boss.pos.x, p.pos.z - boss.pos.z) < 14) {
      p.applyDamage(24, { body: 'legs', fracture: true });
      p.addShake(1);
    }
    this.audio.impactHard(boss.pos);
  }

  // ------------------------------------------------------------ effects
  spawnShockwave(pos, radius, color = 0xffffff) {
    this.vfx.spawnShockwave(pos, radius, color);
  }

  spawnProjectile(from, to, opts = {}) {
    return this.combat.spawnProjectile(from, to, opts);
  }

  spawnGasCloud(pos, radius, life, color) {
    this.vfx.gasCloud(pos, radius, life, color);
    this.hazardClouds = this.hazardClouds || [];
    this.hazardClouds.push({ x: pos.x, z: pos.z, r: radius, life, t: 0, damage: 4 });
  }

  spawnSupplyCrate(x, z, table = 'military') {
    const y = this.world.heightAt(x, z);
    if (!isFinite(y)) return null;
    const mesh = makeLootMesh('crate', new RNG(Math.floor(x * 13 + z * 7)));
    mesh.position.set(x, y, z);
    mesh.rotation.y = Math.random() * Math.PI;
    // signal beacon so it can be found
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 14, 8, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffb060, transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.set(x, y + 7, z);
    this.scene.add(mesh); this.scene.add(beam);
    setTimeout(() => this.scene.remove(beam), 90000);
    const spot = { id: this.loot.spots.length, x, y, z, table, kind: 'crate', looted: false, mesh, supply: true };
    this.loot.spots.push(spot);
    const key = Math.floor(x / 8) + ',' + Math.floor(z / 8);
    if (!this.loot.index.has(key)) this.loot.index.set(key, []);
    this.loot.index.get(key).push(spot);
    return spot;
  }

  dropLootBag(id, qty, x, y, z) {
    const mesh = makeLootMesh('bag', new RNG(Math.floor(x * 31 + z * 17)));
    mesh.position.set(x, y + 0.05, z);
    this.scene.add(mesh);
    const spot = { id: this.loot.spots.length, x, y, z, table: 'tool', kind: 'bag', looted: false, mesh, forced: { id, qty } };
    this.loot.spots.push(spot);
    const key = Math.floor(x / 8) + ',' + Math.floor(z / 8);
    if (!this.loot.index.has(key)) this.loot.index.set(key, []);
    this.loot.index.get(key).push(spot);
    return spot;
  }

  // ------------------------------------------------------------ damage routing
  setupDamageRouting() {
    const player = this.player;
    const base = player.applyDamage.bind(player);
    player.applyDamage = (amount, opts = {}) => {
      if (player.dead) return 0;
      const pre = this.body.incoming(amount, opts.body);
      const dealt = base(pre.amount, opts);
      this.body.hit(pre.part, dealt, opts);
      this.stats.damageTaken += dealt;
      this.ui.flashDamage(clamp(dealt / 30, 0.25, 1));
      this.lastDamagePart = pre.part;
      if (player.dead) this.onPlayerDeath();
      return dealt;
    };
  }

  onPlayerDeath() {
    if (this.mode === 'dead') return;
    this.stats.deaths++;
    this.audio.stopMusic?.();
    this.audio.enemyDeath?.('hollow', this.player.pos);
    this.mode = 'dead';
    this.locked = false;
    this.ui.showDeath(this.deathCause || 'BLOOD LOSS');
    if (document.exitPointerLock) document.exitPointerLock();
  }

  respawnPlayer() {
    this.player.dead = false;
    this.player.pos.copy(this.world.startPosition);
    this.player.vel.set(0, 0, 0);
    this.player.stats.health = this.player.stats.healthMax * 0.7;
    this.player.stamina = this.player.staminaMax;
    this.body.reset();
    this.player.stats.hunger = Math.max(40, this.player.stats.hunger);
    this.player.stats.thirst = Math.max(40, this.player.stats.thirst);
    this.player.stats.bleed = 0;
    this.player.stats.radiation = Math.max(0, this.player.stats.radiation - 20);
    // drop half of what was carried
    const inv = this.inventory;
    const half = inv.items.slice(0, Math.floor(inv.items.length / 2));
    for (const it of half) {
      const at = this.player.pos;
      this.dropLootBag(it.id, it.qty, at.x + (Math.random() - 0.5) * 2, at.y, at.z + (Math.random() - 0.5) * 2);
      inv.removeUid(it.uid, 999);
    }
    this.mode = 'playing';
    this.ui.hideDeath();
    this.ui.hud.setCrosshair(true);
    this.ui.notify('SHELTER 12', 'You wake up on the floor. Something took your pack while you were gone.', '#c9963f');
    this.saveGame(false);
    if (!this.headless) this.requestLock();
  }

  // ------------------------------------------------------------ progression
  resetProgression() {
    this.level = 1; this.xp = 0; this.skillPoints = 0;
    this.skillRanks = {};
    this.skills = {};
    this.player.skills = this.skills;
    this.levelUps = 0;
    this.applySkills(true);
  }

  xpToNext(level = this.level) {
    return Math.round(CFG.xp.base * Math.pow(CFG.xp.factor, level - 1));
  }

  giveXP(amount, source = '') {
    if (amount <= 0) return;
    this.xp += amount;
    let leveled = 0;
    while (this.level < 50 && this.xp >= this.xpToNext()) {
      this.xp -= this.xpToNext();
      this.level++;
      leveled++;
      this.skillPoints += 1;
    }
    if (leveled) {
      this.applySkills();
      this.player.stats.health = this.player.stats.healthMax;
      this.player.stamina = this.player.staminaMax;
      this.audio.levelUp?.();
      this.ui.notify('LEVEL ' + this.level, `You survived long enough to learn something. +${leveled} skill point${leveled > 1 ? 's' : ''}.`, '#e0b463', 'good');
      this.ui.hud.notifyQuest('LEVEL UP', 'Open the skill screen (K) to spend your points.');
    }
    this.updateObjectives();
  }

  applySkills(reset = false) {
    const p = this.player;
    const agg = {};
    for (const [treeId, tree] of Object.entries(SKILLS)) {
      for (const node of tree.nodes) {
        const rank = this.skillRanks[node.id] || 0;
        if (!rank) continue;
        agg[node.effect] = (agg[node.effect] || 0) + node.per * rank;
      }
    }
    p.skills = agg;
    this.skills = agg;   // aggregated effects; skillRanks holds the purchases
    const baseHp = 100 + (this.level - 1) * 2;
    const baseSt = 100 + (this.level - 1) * 1;
    p.stats.healthMax = Math.round(baseHp + (agg.healthMax || 0));
    p.stats.staminaMax = Math.round(baseSt + (agg.staminaMax || 0));
    p.staminaMax = p.stats.staminaMax;
    p.damageMul = 1 + (agg.damage || 0) + (p.stats.health < p.stats.healthMax * 0.3 ? (agg.adrenaline ? 0.1 : 0) : 0);
    if (reset) { p.stats.health = p.stats.healthMax; p.stats.stamina = p.stats.staminaMax; }
    p.stats.health = Math.min(p.stats.health, p.stats.healthMax);
    p.stats.stamina = Math.min(p.stats.stamina, p.stats.staminaMax);
    this.inventory?.recalcEquipment?.();
  }

  spendSkillPoint(nodeId) {
    let node = null, treeId = null;
    for (const [tid, t] of Object.entries(SKILLS)) {
      const n = t.nodes.find((x) => x.id === nodeId);
      if (n) { node = n; treeId = tid; break; }
    }
    if (!node) return false;
    if (!this.skillPoints) { this.notify('No skill points', 'Gain a level first.'); return false; }
    const rank = this.skillRanks[node.id] || 0;
    if (rank >= node.max) return false;
    for (const req of node.req) if (!(this.skillRanks[req] > 0)) { this.notify('Locked', 'Requires the previous skill in this tree.'); return false; }
    this.skillRanks[node.id] = rank + 1;
    this.skillPoints--;
    this.applySkills();
    this.audio.uiClick();
    this.ui.notify(node.name, `Rank ${rank + 1} / ${node.max} — ${node.desc}`, '#c9963f', 'good');
    return true;
  }

  applyConsumable(def) {
    const p = this.player;
    const st = p.stats;
    if (!def?.use) return false;
    const healing = 1 + (p.skills?.healing || 0);
    const u = def.use;
    if (u.hunger) st.hunger = clamp(st.hunger + u.hunger, 0, 100);
    if (u.thirst) st.thirst = clamp(st.thirst + u.thirst, 0, 100);
    if (u.health) p.heal(u.health * healing);
    if (u.stamina) p.stamina = clamp(p.stamina + u.stamina, 0, p.staminaMax);
    if (u.stress) st.stress = clamp(st.stress + u.stress, 0, 100);
    if (u.radiation) st.radiation = clamp(st.radiation + u.radiation, 0, 100);
    if (u.infection) {
      st.infection = clamp(st.infection + u.infection, 0, 100);
      if (u.infection < 0) for (const id of Object.keys(this.body.wounds)) this.body.wounds[id].infection = Math.max(0, this.body.wounds[id].infection + u.infection);
    }
    if (u.bleed) {
      st.bleed = clamp(st.bleed + u.bleed, 0, 100);
      for (const id of Object.keys(this.body.wounds)) this.body.wounds[id].bleed = clamp(this.body.wounds[id].bleed + u.bleed / 3, 0, 100);
    }
    if (u.fracture) {
      st.fractures.legs = false; st.fractures.arms = false;
      for (const id of Object.keys(this.body.wounds)) this.body.wounds[id].fracture = false;
    }
    this.audio.pickup?.();
    this.updateObjectives();
    return true;
  }

  // ------------------------------------------------------------ items / crafting
  itemDef(id) { return ITEMS[id] || WEAPONS[id] || null; }

  craft(recipeId) {
    const r = RECIPES.find((x) => x.id === recipeId);
    if (!r) return false;
    const bench = this.nearBenchLevel || 0;
    if (bench < r.bench) { this.notify('Bench required', 'You need a workbench for that.'); return false; }
    const cheap = (this.skills.craftCheap || 0) > 0 && (r.cat === 'Weapons' || r.cat === 'Ammunition') ? 1 : 0;
    const inv = this.inventory;
    for (const [id, qty] of Object.entries(r.in)) {
      const req = Math.max(1, qty - cheap);
      if (inv.count(id) < req) { this.notify('Missing materials', 'You do not have enough ' + (this.itemDef(id)?.name || id) + '.'); return false; }
    }
    for (const [id, qty] of Object.entries(r.in)) {
      const req = Math.max(1, qty - cheap);
      let need = req;
      while (need > 0) {
        const it = inv.items.find((i) => i.id === id);
        if (!it) break;
        const take = Math.min(need, it.qty);
        inv.removeUid(it.uid, take);
        need -= take;
      }
    }
    const [outId, outQty] = r.out;
    const added = inv.add(outId, outQty);
    if (added < outQty) this.dropLootBag(outId, outQty - added, this.player.pos.x, this.player.pos.y, this.player.pos.z);
    this.audio.craft?.();
    this.ui.notify('Crafted', `${this.itemDef(outId)?.name || outId} ×${outQty}`, null, 'good');
    this.quests.onCraft(1);
    this.ui.panels.refreshAll();
    return true;
  }

  nearBench() {
    const p = this.player.pos;
    for (const b of this.buildings) {
      if (b.def.bench && Math.hypot(b.x - p.x, b.z - p.z) < 4.5) return 1;
    }
    for (const poi of this.world.pois) {
      if (poi.type === 'camp' && Math.hypot(poi.x - p.x, poi.z - p.z) < 34) return 1;
    }
    for (const poi of this.world.pois) {
      if ((poi.id === 'ind_foundry' || poi.id === 'ind_power' || poi.id === 'mil_lab') && Math.hypot(poi.x - p.x, poi.z - p.z) < 40) return 2;
    }
    return 0;
  }

  startBuilding(id) {
    const def = BUILDABLES.find((b) => b.id === id);
    if (!def) return;
    for (const [matId, qty] of Object.entries(def.cost)) {
      if (this.inventory.count(matId) < qty) { this.notify('Missing materials', this.itemDef(matId)?.name || matId); return; }
    }
    this.buildMode = { def, ghost: null };
    this.mode = 'building';
    this.locked = false;
    this.buildGhost();
    this.ui.notify('Placement', 'Left click to place, right click or Escape to cancel.', null, 'quest');
    this.ui.hud.setVisible(true);
  }

  buildGhost() {
    if (!this.buildMode || this.headless) return;
    const def = this.buildMode.def;
    this.cancelGhost();
    const geo = boxGeo(def.size[0], def.size[1], def.size[2], 2);
    const m = new THREE.Mesh(geo, plain(0x7fae72, { transparent: true, opacity: 0.38, depthWrite: false }));
    m.position.y = def.size[1] / 2;
    this.scene.add(m);
    this.buildMode.ghost = m;
  }

  cancelGhost() {
    if (this.buildMode?.ghost) this.scene.remove(this.buildMode.ghost);
    if (this.buildMode) this.buildMode.ghost = null;
  }

  updateBuilding(dt) {
    if (!this.buildMode || !this.buildMode.ghost) return;
    const p = this.player;
    const dir = p.flatForward;
    const x = p.pos.x + dir.x * 3.2, z = p.pos.z + dir.z * 3.2;
    const y = this.world.heightAt(x, z);
    const g = this.buildMode.ghost;
    g.position.set(x, y, z);
    g.rotation.y = p.yaw;
    const def = this.buildMode.def;
    const ok = !this.world.colliders.query(x - def.size[0] / 2, z - def.size[2] / 2, x + def.size[0] / 2, z + def.size[2] / 2)
      .some((c) => c.tag !== 'road' && c.tag !== 'floor');
    g.material.color.setHex(ok ? 0x8fbf72 : 0xc05a4a);
    this.buildValid = ok;
    this.buildPos = { x, y, z };
    if (!this.headless && this.input.mouse) {
      if (this.input.mouse.leftPressed) { this.placeBuilding(); }
      if (this.input.mouse.rightPressed || this.input.pressed?.Escape) { this.cancelBuilding(); }
    }
  }

  placeBuilding() {
    if (!this.buildMode || !this.buildValid) { this.notify('Cannot build there'); return; }
    const def = this.buildMode.def;
    const inv = this.inventory;
    if (!Object.entries(def.cost).every(([id, qty]) => inv.count(id) >= qty)) { this.cancelBuilding(); return; }
    for (const [id, qty] of Object.entries(def.cost)) {
      let need = qty;
      while (need > 0) {
        const it = inv.items.find((i) => i.id === id);
        if (!it) break;
        const take = Math.min(need, it.qty);
        inv.removeUid(it.uid, take);
        need -= take;
      }
    }
    const { x, y, z } = this.buildPos;
    const mesh = new THREE.Mesh(boxGeo(def.size[0], def.size[1], def.size[2], 2),
      def.cat === 'Defense' ? M.woodWeathered : def.cat === 'Utility' ? M.metalPaint : M.wood);
    mesh.position.set(x, y + def.size[1] / 2, z);
    mesh.rotation.y = this.player.yaw;
    mesh.castShadow = true; mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.world.colliders.addBox(
      x - def.size[0] / 2, y, z - def.size[2] / 2,
      x + def.size[0] / 2, y + def.size[1], z + def.size[2] / 2,
      def.cat === 'Structure' ? 'wall' : 'prop');
    if (def.light) {
      const l = new THREE.PointLight(0xffb060, 3.2, 9, 2);
      l.position.set(x, y + def.size[1] + 0.3, z);
      this.scene.add(l);
    }
    const hp = Math.round(def.hp * (1 + (this.skills.buildHp || 0)));
    this.buildings.push({ def, x, y, z, mesh, hp, ry: this.player.yaw });
    this.buildCount++;
    this.quests.onBuild(1);
    this.audio.craft?.();
    this.ui.notify('Built', def.name, null, 'good');
    this.cancelBuilding();
    this.saveGame(false);
  }

  cancelBuilding() {
    this.cancelGhost();
    this.buildMode = null;
    this.mode = 'playing';
    if (!this.headless) this.requestLock();
  }

  // ------------------------------------------------------------ interactions
  spawnInteractables() {
    this.interactables = [];
    for (const spec of INTERACTABLES) {
      let x, z, y;
      if (spec.poi) {
        const poi = this.world.pois.find((p) => p.id === spec.poi);
        if (!poi) continue;
        x = poi.x + (spec.dx || 0); z = poi.z + (spec.dz || 0);
      } else { x = spec.x; z = spec.z; }
      y = this.world.heightAt(x, z);
      const mesh = this.buildInteractableMesh(spec.kind);
      mesh.position.set(x, y, z);
      mesh.rotation.y = Math.random() * Math.PI;
      this.scene.add(mesh);
      this.interactables.push({ ...spec, x, y, z, mesh, used: false });
    }
  }

  buildInteractableMesh(kind) {
    const g = new THREE.Group();
    const add = (geo, m, x, y, z, ry = 0) => {
      const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); mesh.rotation.y = ry;
      mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh); return mesh;
    };
    if (kind === 'locker') {
      add(boxGeo(0.9, 1.9, 0.5), M.metalPaint, 0, 0.95, 0);
      add(boxGeo(0.04, 1.7, 0.02), M.rust, 0, 0.95, 0.26);
    } else if (kind === 'console' || kind === 'array') {
      add(boxGeo(1.6, 1.1, 0.7), M.metalPaint, 0, 0.55, 0);
      add(boxGeo(1.2, 0.55, 0.05), mat('screen', { emissive: kind === 'array' ? 0x9a5ad0 : 0x55ff9a, emissiveIntensity: 2.4 }), 0, 1.0, 0.36);
      add(boxGeo(0.5, 0.1, 0.4), M.steel, 0.3, 1.32, 0.1);
    } else if (kind === 'note') {
      add(boxGeo(0.03, 0.32, 0.24), mat('paper', { color: 0xd8d0b8 }), 0, 1.3, 0);
    } else if (kind === 'valve') {
      add(cylGeo(0.09, 0.09, 1.1, 8), M.rust, 0, 0.55, 0);
      const wheel = add(cylGeo(0.42, 0.42, 0.08, 12), M.rust, 0, 1.12, 0);
      wheel.rotation.x = Math.PI / 2;
      for (let i = 0; i < 3; i++) {
        const sp = add(boxGeo(0.76, 0.05, 0.06), M.rust, 0, 1.12, 0);
        sp.rotation.z = (i / 3) * Math.PI;
      }
    } else if (kind === 'projector') {
      add(boxGeo(0.5, 0.34, 0.6), M.metalPaint, 0, 1.3, 0);
      add(cylGeo(0.1, 0.12, 0.22, 8), M.steel, 0, 1.3, 0.35).rotation.x = Math.PI / 2;
      const beam = add(cylGeo(0.16, 0.9, 4.2, 10, 2, true),
        new THREE.MeshBasicMaterial({ color: 0xdfe8d0, transparent: true, opacity: 0.055, depthWrite: false, side: THREE.DoubleSide }), 0, 1.3, 2.4);
      beam.rotation.x = Math.PI / 2;
    } else if (kind === 'breaker') {
      add(boxGeo(0.9, 1.2, 0.35), M.metalPaint, 0, 0.7, 0);
      add(boxGeo(0.7, 0.9, 0.06), mat('hazard', { color: 0xe0c060 }), 0, 0.72, 0.2);
    } else if (kind === 'barricade') {
      for (let i = 0; i < 3; i++) {
        const b = add(boxGeo(2.4, 0.28, 0.2), M.woodWeathered, 0, 1.15 + i * 0.34, 0);
        b.rotation.z = 0.12 * (i % 2 ? 1 : -1);
      }
    } else if (kind === 'lamp') {
      add(cylGeo(0.07, 0.09, 3.2, 8), M.rust, 0, 1.6, 0);
      add(boxGeo(0.42, 0.24, 0.42), M.metalPaint, 0, 3.1, 0);
      const l = new THREE.PointLight(0xffc070, 0, 12, 2);
      l.position.set(0, 3.05, 0);
      g.add(l);
      g.userData.lamp = l;
    } else if (kind === 'wire') {
      for (let i = 0; i < 5; i++) {
        const post = add(cylGeo(0.05, 0.05, 1.5, 6), M.steel, -2.4 + i * 1.2, 0.75, 0);
      }
      add(boxGeo(5.0, 0.02, 0.02), M.steel, 0, 1.35, 0);
    }
    return g;
  }

  tryInteract() {
    if (this.mode !== 'playing') return;
    const p = this.player;
    // NPCs first
    if (this.npcs.nearest) { this.npcs.open(this.npcs.nearest); return; }
    // interactables
    let best = null, bestD = 3.0;
    for (const it of this.interactables) {
      const d = Math.hypot(it.x - p.pos.x, it.z - p.pos.z);
      if (d < bestD && Math.abs(it.y - p.pos.y) < 3.0) { best = it; bestD = d; }
    }
    if (best) { this.useInteractable(best); return; }
    // doors
    const door = this.doors.nearest(p.pos, 2.6);
    if (door) { this.doors.toggle(door); return; }
    // loot
    if (this.loot.interact()) return;
  }

  useInteractable(node) {
    const q = this.quests;
    const p = this.player;
    this.audio.uiClick();
    // every interactable reports to the quest log first; the specific
    // handlers below only add flavour / side effects.
    q.onInteract(node.id);
    if (node.id === 'shelter_note') {
      this.ui.notify('MIKHAIL\'S NOTE', '"The array is still transmitting. If you are reading this, I did not come back. Take the stairs, take the rifle if it is still there. Do not answer the radio. — M."', '#c8b48c', 'quest');
    } else if (node.id === 'shelter_console') {
      this.ui.notify('RADIO CONSOLE', 'A voice in your brother\'s cadence counts down from fourteen point seven. It repeats. It has been repeating for six years.', '#c9963f', 'quest');
      this.audio.radioStatic?.();
    } else if (node.id === 'shelter_locker') {
      const near = this.loot.nearby(new THREE.Vector3(node.x, node.y, node.z), 3.2);
      if (near.length) this.loot.open(near[0].spot);
      else this.ui.notify('Locker', 'Empty. Somebody cleared it before the lights went out.');
    } else if (node.id === 'school_valve') {
      this.ui.notify('WATER VALVE', 'The pipe shudders. Somewhere under the school, water starts moving again.', null, 'good');
    } else if (node.id === 'projector') {
      this.ui.notify('PROJECTOR', 'The reel ends. A family on a beach, waving at a camera. Then white.', '#c8b48c', 'quest');
    } else if (node.id === 'crane_panel') {
      this.ui.notify('RAIL CRANE', 'The crane wakes up and screams along its rail. The scrappers will hear that.', null, 'good');
    } else if (node.id === 'warehouse_breaker') {
      this.ui.notify('BREAKER', 'Lights stutter on across Warehouse 12. Something in the rafters does not like it.', null, 'good');
      this.spawnEnemyNear('screamer', 8, 14);
    } else if (node.id === 'hospital_barricade') {
      this.ui.notify('BARRICADE', 'You wedge the doors shut. The corridor outside goes quiet in a way that is worse than noise.', null, 'good');
    } else if (node.id === 'delta_lamp') {
      if (this.inventory.count('battery') <= 0) { this.ui.notify('Lamp', 'It needs two battery cells.'); return; }
      this.inventory.removeUid(this.inventory.items.find((i) => i.id === 'battery').uid, 1);
      const l = node.mesh.userData.lamp;
      if (l) l.intensity = 9;
      this.ui.notify('PERIMETER LAMP', 'The lamp comes on. The dark moves back four metres.', null, 'good');
    } else if (node.id === 'perimeter_cut') {
      this.ui.notify('PERIMETER WIRE', 'You cut the wire. A gap opens in the exclusion wall.', null, 'good');
      this.alertEnemiesToNoise(node.x, node.z, 0.7, 30);
    } else if (node.id === 'array_console') {
      this.ui.notify('ARRAY CONSOLE', 'Eight pylons. One core socket. It is warm, and it is humming your name.', '#c9963f', 'quest');
      this.startFinale();
    }
    if (node.id !== 'shelter_locker') node.used = true;
  }

  // ------------------------------------------------------------ POIs / quests
  updatePOIs(dt) {
    const p = this.player.pos;
    // you cannot "discover" the surface while sealed in the shelter
    const surface = this.world.heightAt(p.x, p.z);
    if (p.y < surface - 2.5) return;
    for (const poi of this.world.pois) {
      const d = Math.hypot(p.x - poi.x, p.z - poi.z);
      if (d < 34 && !poi.discovered) {
        poi.discovered = true;
        this.codex.regions[this.world.regionAt(poi.x, poi.z).id] = true;
        this.quests.onReach(poi.id);
        // the hatch and the shelter share a name; do not announce twice
        if (poi.type !== 'shelter' || poi.id === 'shelter12') {
          this.ui.notify('Location discovered', poi.name, '#c9963f', 'quest');
        }
        this.audio.discovery?.();
      } else if (d < 22) {
        this.quests.onReach(poi.id);
      }
    }
    if (this.waypoint) {
      const d = Math.hypot(p.x - this.waypoint.x, p.z - this.waypoint.z);
      if (d < 6) {
        this.ui.notify('Waypoint reached', '', null, 'good');
        this.waypoint = null;
      }
    }
  }

  setWaypoint(x, z) {
    this.waypoint = { x, z };
    this.audio.uiClick();
  }

  updateObjectives() {
    const list = this.quests.trackedObjectives ? this.quests.trackedObjectives() : [];
    this.objectives = list.map((o) => ({ text: o.text, done: o.done, cur: o.cur, max: o.max }));
    if (!this.objectives.length && this.quests) {
      const next = this.quests.nextAvailableMain();
      if (next && !this.quests.isActive(next.id)) {
        this.objectives = [{ text: next.name + ' — speak to ' + (next.giver || 'the camp'), done: false, cur: 0, max: 1 }];
      }
    }
  }

  // ------------------------------------------------------------ combat callbacks
  onHitEnemy(enemy, damage, head) {
    this.stats.damageDealt += damage;
    if (head) this.stats.headshots++;
    if (this.settings.showDamage) this.ui.hud.toast('', '');
    this.ui.hud.hitMarker(head);
    if (enemy.dead) return;
    if (head && Math.random() < 0.35) enemy.setState?.('stagger');
  }

  onEnemyAggro(enemy) {
    if (this.codex.mutants[enemy.type] !== 'seen') this.codex.mutants[enemy.type] = true;
  }

  onEnemyKilled(enemy, opts = {}) {
    this.stats.kills++;
    this.codex.kills[enemy.type] = (this.codex.kills[enemy.type] || 0) + 1;
    this.quests.onKill(enemy.type);
    this.giveXP((MUTANTS[enemy.type]?.xp || 40) * (enemy.isBoss ? 4 : 1), 'kill');
    this.loot.enemyDrop(enemy);
    if (enemy.isBoss) {
      this.codex.bosses[enemy.bossId] = true;
      this.quests.onBoss(enemy.bossId);
      this.bossBars.delete(enemy);
      this.ui.hud.hideBoss();
      this.vfx.spawnShockwave(enemy.pos, 18, 0xffffff);
      this.audio.bossDeath?.();
      this.ui.notify('ASSET TERMINATED', enemy.name, '#e0b463', 'good');
      this.act = Math.min(8, Math.max(this.act, this.questForBoss(enemy.bossId) + 1));
      this.saveGame(false);
    }
    this.updateObjectives();
  }

  onBossPhase(boss) {
    this.ui.hud.showBoss(boss.name, boss.phase, boss.maxPhases, boss.phaseText ? (boss.phaseText[boss.phase - 1] || '') : '');
    this.ui.notify(boss.name, boss.phaseText ? boss.phaseText[boss.phase - 1] : 'It changes.', '#c05038', 'danger');
    this.player.addShake(0.7);
  }

  onPlayerHurt(dealt) {
    if (dealt > 0) this.ui.flashDamage(clamp(dealt / 28, 0.2, 1));
  }

  // ------------------------------------------------------------ rest / finale
  restAtCamp(npc) {
    const sky = this.sky;
    sky.dayTime = 0.27;
    this.day++;
    this.player.stats.fatigue = Math.max(0, this.player.stats.fatigue - 55);
    this.player.stats.stress = Math.max(0, this.player.stats.stress - 25);
    this.player.heal(45);
    this.player.stamina = this.player.staminaMax;
    for (const id of Object.keys(this.body.wounds)) {
      this.body.wounds[id].bleed = Math.max(0, this.body.wounds[id].bleed - 30);
      this.body.condition[id] = clamp(this.body.condition[id] + 18, 0, 100);
    }
    this.body.syncPlayerBleed();
    this.ui.notify('RESTED', `You sleep until dawn at ${npc.def.name}'s camp. Day ${this.day}.`, '#c9963f', 'good');
    this.saveGame(false);
  }

  startFinale() {
    if (this.finaleStarted) return;
    this.finaleStarted = true;
    this.act = 8;
    this.sky.setWeather('radstorm', false);
    this.audio.bossRoar(this.player.pos);
    this.ui.notify('THE ARRAY WAKES', 'Every pylon turns inward. The signal is not a recording. It is listening.', '#c05038', 'danger');
    this.spawnEnemyNear('watcher', 25, 40);
    this.spawnEnemyNear('watcher', 25, 40);
    this.spawnEnemyNear('pale', 30, 45);
    this.arenaBossSpawn('last_signal');
  }

  arenaBossSpawn(bossId) {
    const def = BOSSES[bossId];
    if (!def || this.codex.bosses[bossId]) return;
    const arena = this.world.arenas[def.arena];
    if (!arena) return;
    if (arena._spawned) return;
    arena._spawned = true;
    const boss = new Boss(this, bossId);
    this.enemies.push(boss);
    this.bosses.push(boss);
    this.codex.bossSeen[bossId] = true;
    this.bossBars.set(boss, true);
    this.ui.hud.showBoss(boss.name, boss.phase, boss.maxPhases, 'THE LAST SIGNAL');
  }

  onFinale() {
    this.mode = 'ended';
    this.ui.hud.hideBoss();
    this.audio.stopMusic?.();
    this.audio.startMusic?.('ending');
    this.ui.notify('LAST SIGNAL', 'The silence afterwards is the loudest thing you have ever heard. Then, quietly, the radio clicks on again.', '#e0b463', 'quest');
    this.saveGame(false);
  }

  // ------------------------------------------------------------ quick actions
  selectQuickSlot(i) {
    const slots = this.inventory.quickSlots;
    const id = slots?.[i];
    this.selectedQuick = i;
    if (!id) return;
    const def = this.itemDef(id);
    if (def && (def.use || def.cat === 'food' || def.cat === 'water' || def.cat === 'medicine')) {
      const it = this.inventory.items.find((x) => x.id === id);
      if (it) this.inventory.useItem(it.uid);
    } else if (WEAPONS[id]) {
      this.weapons.setWeapon(id);
      this.ui.updateWeapon();
    }
  }

  toggleAimWeapon() {
    // quick-swap between primary and melee
    const eq = this.inventory.equipment;
    const next = this.weapons.isMelee ? (eq.weapon1?.id || eq.weapon2?.id) : (eq.melee?.id || eq.weapon2?.id);
    if (next) { this.weapons.setWeapon(next); this.ui.updateWeapon(); this.audio.uiClick(); }
  }

  quickHeal() {
    const order = ['medkit', 'bandage', 'painkillers', 'stim_combat'];
    for (const id of order) {
      const it = this.inventory.items.find((x) => x.id === id);
      if (!it) continue;
      if (id === 'bandage') {
        // treat the worst bleeding limb
        let worst = 'torso', wb = 0;
        for (const [pid, w] of Object.entries(this.body.wounds)) if (w.bleed > wb) { wb = w.bleed; worst = pid; }
        this.body.treat(worst, 'bandage');
      } else this.inventory.useItem(it.uid);
      return;
    }
    this.notify('No medical supplies', 'Search another building.');
  }

  notify(title, text = '', color = null, kind = '') {
    if (this.ui) this.ui.notify(title, text, color, kind);
  }

  // QA helper: what is actually under a screen pixel? (ndc in -1..1)
  debugPick(nx, ny) {
    const rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(nx, ny), this.camera);
    const hits = rc.intersectObjects(this.scene.children, true);
    return hits.slice(0, 6).map((h) => ({
      d: +h.distance.toFixed(1),
      name: h.object.name || '',
      type: h.object.type,
      geo: h.object.geometry?.type || '',
      mat: h.object.material?.type || '',
      color: h.object.material?.color ? h.object.material.color.getHexString() : '',
      parent: h.object.parent?.name || '',
      tris: h.object.geometry?.index ? h.object.geometry.index.count / 3 : (h.object.geometry?.attributes?.position?.count || 0) / 3,
    }));
  }

  // ------------------------------------------------------------ update loop
  startLoop() {
    let last = performance.now();
    let acc = 0;
    const frame = (now) => {
      this._raf = requestAnimationFrame(frame);
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.1) dt = 0.1;
      if (dt <= 0) return;
      acc += dt;
      // fixed-ish stepping keeps physics stable at any refresh rate
      let guard = 0;
      while (acc > 1 / 120 && guard++ < 6) {
        this.step(1 / 120);
        acc -= 1 / 120;
      }
      if (this.renderer && !this.freezeRender) this.renderer.render(this.scene, this.camera);
    };
    this._raf = requestAnimationFrame(frame);
  }

  step(dt) {
    const g = this;
    if (g.mode === 'loading') return;
    if (g.hitStop > 0) { g.hitStop -= dt; dt *= 0.15; }

    // menus pause the simulation but keep the world breathing
    if (g.mode === 'paused' || g.mode === 'menu' || g.mode === 'dead' || g.mode === 'loading') {
      if (g.sky && g.player) {
        g.sky.update(dt * 0.25, g.camera, g.sun, g.hemi, g.scene, g.player.pos);
        if (g.mode === 'menu') {
          // slow orbit of the shelter for the title screen
          const t = performance.now() * 0.00006;
          g.camera.position.set(g.player.pos.x + Math.cos(t) * 22, g.player.pos.y + 9, g.player.pos.z + Math.sin(t) * 22);
          g.camera.lookAt(g.player.pos.x, g.player.pos.y + 1.5, g.player.pos.z);
        }
      }
      if (g.mode === 'dead') { g.ui.update(dt); }
      if (g.audio) g.audio.update(dt);
      return;
    }

    if (g.mode === 'playing' || g.mode === 'dialogue' || g.mode === 'shop' || g.mode === 'panel') {
      g.time += dt;
      const keys = g.input.keys;
      const mouse = g.input.mouse;
      const paused = g.ui.isBlockingInput();
      g.updateGamepad(dt);

      if (g.mode === 'playing' && !paused) {
        g.player.input(keys, mouse, g);
        g.player.update(dt, keys, g);
        g.player.updateSurvival(dt, g.envInfo());
        g.body.update(dt);
        g.weapons.update(dt, keys, mouse);
        g.combat.update(dt);
        if (g.player.slowT > 0) {
          g.player.slowT -= dt;
          g.player.vel.x *= 0.55; g.player.vel.z *= 0.55;
        }
      } else if (g.mode === 'playing') {
        // cursor unlocked but no screen: keep gravity + survival ticking
        g.player.updateSurvival(dt, g.envInfo());
        g.body.update(dt);
        g.combat.update(dt);
      }

      // enemies only simulate near the player
      const p = g.player.pos;
      for (const e of g.enemies) {
        const d2 = (e.pos.x - p.x) ** 2 + (e.pos.z - p.z) ** 2;
        if (d2 > 190 * 190) continue;
        if (d2 > 90 * 90 && !e.isBoss && e.state === 'idle') {
          if (Math.random() < 0.02) e.update(dt);
          continue;
        }
        e.update(dt);
      }
      // sleeping enemies out of range still get culled
      for (let i = g.enemies.length - 1; i >= 0; i--) {
        const e = g.enemies[i];
        if (e.dead && e.deadTime > 30) g.removeEnemy(e);
      }

      g.doors.update(dt);
      g.npcs.update(dt);
      g.loot.update(dt);
      g.events.update(dt);
      g.quests.update(dt);
      g.updateArenas(dt);
      g.updatePOIs(dt);
      g.updateBuilding(dt);
      g.updateHazardClouds(dt);
      if (g.mode === 'playing') g.checkInteractPrompt();
      g.nearBenchLevel = g.nearBench();
      g.sky.update(dt, g.camera, g.sun, g.hemi, g.scene, p);
      g.applyIndoorLight();
      g.world.update(dt, p);
      g.vfx.update(dt);
      g.updateFlashlight();
      g.updateSignal(dt);
      g.ui.update(dt);
      g.audio.setListener?.(g.camera);
      g.audio.update(dt);
      g.updateObjectives();

      g.autosaveTimer += dt;
      if (g.autosaveTimer > 240) { g.autosaveTimer = 0; g.saveGame(true); }

      if (g.player.dead && g.mode !== 'dead') g.onPlayerDeath();
    }

    if (g.mode === 'building') {
      g.player.update(dt, g.input.keys, g);
      g.updateBuilding(dt);
      g.sky.update(dt, g.camera, g.sun, g.hemi, g.scene, g.player.pos);
      g.ui.update(dt);
      if (g.input.pressed?.Escape) g.cancelBuilding();
    }

    // clear per-frame edges
    g.input.mouse.dx = 0; g.input.mouse.dy = 0;
    g.input.mouse.leftPressed = false; g.input.mouse.rightPressed = false;
    g.input.pressed = {};
  }

  updateGamepad(dt) {
    if (this.headless || typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    const pad = pads && [...pads].find((p) => p && p.connected);
    if (!pad) return;
    const s = this.settings.gamepadSens;
    const dz = (v) => (Math.abs(v) < 0.16 ? 0 : v);
    this.input.keys.KeyW = dz(pad.axes[1]) < -0.2;
    this.input.keys.KeyS = dz(pad.axes[1]) > 0.2;
    this.input.keys.KeyA = dz(pad.axes[0]) < -0.2;
    this.input.keys.KeyD = dz(pad.axes[0]) > 0.2;
    this.input.keys.ShiftLeft = !!pad.buttons[10]?.pressed || !!pad.buttons[4]?.pressed;
    this.input.keys.Space = !!pad.buttons[0]?.pressed;
    this.input.mouse.dx += dz(pad.axes[2]) * 14 * s;
    this.input.mouse.dy += dz(pad.axes[3]) * 14 * s;
    this.input.mouse.left = !!pad.buttons[7]?.pressed;
    this.input.mouse.right = !!pad.buttons[6]?.pressed;
    if (pad.buttons[2]?.pressed && !this._padX) { this.input.pressed.KeyE = true; this.onKeyDown('KeyE'); this._padX = true; }
    if (!pad.buttons[2]?.pressed) this._padX = false;
    if (pad.buttons[1]?.pressed && !this._padC) { this.input.keys.KeyC = true; this._padC = true; }
    if (!pad.buttons[1]?.pressed) { this.input.keys.KeyC = false; this._padC = false; }
    if (pad.buttons[3]?.pressed && !this._padR) { this.weapons.reload(); this._padR = true; }
    if (!pad.buttons[3]?.pressed) this._padR = false;
  }

  envInfo() {
    const sky = this.sky;
    const region = this.world.regionAt(this.player.pos.x, this.player.pos.z);
    let nearby = 0;
    for (const e of this.enemies) {
      if (!e.dead && Math.hypot(e.pos.x - this.player.pos.x, e.pos.z - this.player.pos.z) < 20) nearby++;
    }
    const hour = sky.hour;
    const temp = region.id === 'wasteland' ? 26 : region.id === 'forest' ? 8
      : region.id === 'military' ? 10 : region.id === 'city' ? 12 : 14;
    const dayTemp = temp + Math.sin((hour - 8) / 24 * Math.PI * 2) * 7;
    return {
      temperature: dayTemp + (sky.weatherBlend.rain * -5),
      night: sky.isNight,
      nearbyEnemies: nearby,
      indoor: this.world.isIndoor(this.player.pos.x, this.player.pos.y + 1, this.player.pos.z),
      region,
    };
  }

  updateHazardClouds(dt) {
    if (!this.hazardClouds) return;
    for (let i = this.hazardClouds.length - 1; i >= 0; i--) {
      const c = this.hazardClouds[i];
      c.t += dt;
      if (c.t > c.life) { this.hazardClouds.splice(i, 1); continue; }
      const p = this.player;
      if (!p.dead && Math.hypot(p.pos.x - c.x, p.pos.z - c.z) < c.r) {
        p.stats.radiation = clamp(p.stats.radiation + dt * 3.4, 0, 100);
        if (p.stats.health > 1) p.stats.health -= dt * 0.6;
      }
    }
  }

  // Interiors lose the sun (no baked light probes): dim direct light and lift
  // the ambient so a dark basement is readable instead of pitch black.
  applyIndoorLight() {
    const p = this.player.pos;
    const indoor = this.world.isIndoor(p.x, p.y + 1.2, p.z);
    this.indoor = indoor;
    if (!indoor) return;
    if (this.sun) this.sun.intensity *= 0.34;
    this.hemi.intensity = Math.max(this.hemi.intensity, 0.55);
    this.hemi.color.setHex(0x77828f);
    this.hemi.groundColor.setHex(0x30281e);
  }

  updateFlashlight() {
    if (!this.flashlight) return;
    const f = this.player;
    const eye = f.eyePos;
    const dir = f.forward;
    this.flashlight.position.copy(eye);
    this.flashlight.target.position.copy(eye).addScaledVector(dir, 18);
    if (this.lantern) this.lantern.position.copy(eye).addScaledVector(f.flatForward, 0.6).add(new THREE.Vector3(0, -0.35, 0));
    const on = f.flashlightOn && f.flashlightBattery > 0 && !f.dead;
    const flicker = f.flashlightBattery < 18 ? (0.6 + Math.random() * 0.4) : 1;
    this.flashlight.intensity = on ? 7.5 * flicker : 0;
    if (f.flashlightOn && f.flashlightBattery <= 0) {
      this.notify('Flashlight dead', 'You need a battery cell.');
      f.flashlightOn = false;
      if (this.inventory.count('battery') > 0) {
        const it = this.inventory.items.find((i) => i.id === 'battery');
        this.inventory.removeUid(it.uid, 1);
        f.flashlightBattery = 100;
        f.flashlightOn = true;
        this.notify('Battery replaced', '', null, 'good');
      }
    }
  }

  updateSignal(dt) {
    if (!this.signalEntity) return;
    const t = performance.now() * 0.001;
    this.signalEntity.rotation.y = t * 0.1;
    const mat = this.signalEntity.userData.mat;
    if (mat) mat.opacity = 0.30 + Math.sin(t * 1.6) * 0.09;
    if (this.signalLight) this.signalLight.intensity = 4 + Math.sin(t * 2.1) * 1.6;
    const p = this.player.pos;
    const poi = this.world.pois.find((x) => x.id === 'was_array');
    if (poi && !this.quests.flags.signalSpoke) {
      if (Math.hypot(p.x - poi.x, p.z - poi.z) < 7) {
        this.quests.flags.signalSpoke = true;
        this.quests.onTalk('signal');
        const def = NPCS.signal;
        this.ui.openDialogue(def.name, def.role);
        this.npcs.dialogue = { npc: { def, ghost: true }, nodeId: 'start', node: null, open: true };
        this.npcs.enter('start');
      }
    }
  }

  checkInteractPrompt() {
    if (this._interactCooldown > 0) { this._interactCooldown -= 0.016; }
    const p = this.player.pos;
    if (this.npcs.nearest) return; // NPC prompt is managed by NPCSystem
    let label = null;
    for (const it of this.interactables) {
      if (it.used) continue;
      if (Math.hypot(it.x - p.x, it.z - p.z) < 2.8 && Math.abs(it.y - p.y) < 2.6) { label = it.label; break; }
    }
    if (!label) {
      const door = this.doors.nearest(p, 2.4);
      if (door) label = door.angle > 0.5 ? 'Close the door' : 'Open the door';
    }
    if (!label) {
      const near = this.loot.nearby(p, 2.2);
      if (near.length) label = 'Search the ' + (near[0].spot.kind === 'locker' ? 'locker' : near[0].spot.kind === 'bag' ? 'bag' : near[0].spot.kind === 'corpse' ? 'body' : 'container');
    }
    if (label) this.ui.setPrompt(`[E]  ${label}`);
    else if (this.ui.promptVisible()) this.ui.setPrompt(null);
  }

  // ------------------------------------------------------------ settings
  loadSettings() {
    try {
      const raw = typeof localStorage !== 'undefined' && localStorage.getItem('aohl_settings');
      if (raw) Object.assign(this.settings, JSON.parse(raw));
    } catch (e) { /* ignore */ }
    this.difficulty = this.settings.difficulty === 'story' ? 0.7 : this.settings.difficulty === 'ashes' ? 1.35 : 1;
  }

  saveSettings() {
    try { localStorage.setItem('aohl_settings', JSON.stringify(this.settings)); } catch (e) {}
  }

  applySettings() {
    const s = this.settings;
    this.difficulty = s.difficulty === 'story' ? 0.7 : s.difficulty === 'ashes' ? 1.35 : 1;
    if (this.renderer) {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2) * s.renderScale);
      this.renderer.shadowMap.enabled = s.shadows;
      this.renderer.toneMappingExposure = 1.12 * s.brightness;
      this.scene.fog = this.scene.fog || null;
      this.sun.castShadow = s.shadows;
    }
    if (this.camera) { this.camera.far = 900 + s.viewDistance * 700; this.camera.updateProjectionMatrix(); }
    if (this.player) { this.player.fov = s.fov; this.player.sens = s.sensitivity; }
    if (this.audio) { this.audio.setVolume?.(s.master); this.audio.setMusicVolume?.(s.music); }
    this.ui.applySettings();
    this.saveSettings();
  }

  // ------------------------------------------------------------ save / load
  serialize() {
    const p = this.player;
    return {
      version: 2, savedAt: Date.now(), seed: this.seed,
      player: {
        pos: [p.pos.x, p.pos.y, p.pos.z], yaw: p.yaw, pitch: p.pitch,
        stats: p.stats, stamina: p.stamina, flashlightOn: p.flashlightOn, battery: p.flashlightBattery,
      },
      progression: { level: this.level, xp: this.xp, points: this.skillPoints, skills: this.skillRanks },
      body: this.body.serialize(),
      inventory: this.inventory.serialize(),
      quests: this.quests.serialize(),
      codex: this.codex,
      stats: this.stats,
      time: this.time, day: this.day, act: this.act,
      sky: { dayTime: this.sky.dayTime, weather: this.sky.weatherTarget },
      settings: this.settings,
      loot: this.loot.serialize(),
      doors: this.doors.serialize(),
      events: this.events.serialize(),
      pois: this.world.pois.map((x) => [x.id, !!x.discovered]),
      buildings: this.buildings.map((b) => ({ id: b.def.id, x: b.x, y: b.y, z: b.z, ry: b.ry })),
      enemies: this.enemies.filter((e) => !e.isBoss).map((e) => [e.type, e.pos.x, e.pos.z]),
      bosses: this.codex.bosses,
      waypoint: this.waypoint,
      finaleStarted: this.finaleStarted,
    };
  }

  saveGame(manual = false) {
    const ok = writeSave(this.serialize(), !manual);
    if (manual && ok) this.ui.notify('Progress saved', 'The shelter terminal has a copy of your journal.', null, 'good');
    else if (manual && !this._saveWarned) {
      this._saveWarned = true;
      this.ui.notify('Saves unavailable', 'This browser blocks local storage for files opened from disk. Serve the folder over HTTP for persistent saves.', null, 'danger');
    }
    return ok;
  }

  loadData(data) {
    if (!data) return false;
    const p = this.player;
    p.pos.set(data.player.pos[0], data.player.pos[1], data.player.pos[2]);
    p.vel.set(0, 0, 0);
    p.yaw = data.player.yaw; p.pitch = data.player.pitch || 0;
    Object.assign(p.stats, data.player.stats || {});
    p.stamina = data.player.stamina ?? p.staminaMax;
    p.flashlightOn = data.player.flashlightOn ?? true;
    p.flashlightBattery = data.player.battery ?? 100;
    const prog = data.progression || {};
    this.level = prog.level || 1;
    this.xp = prog.xp || 0;
    this.skillPoints = prog.points || 0;
    this.skillRanks = prog.skills || {};
    this.skills = {};
    this.applySkills();
    this.body.deserialize(data.body);
    this.inventory.deserialize(data.inventory);
    this.quests.deserialize(data.quests);
    this.codex = data.codex || this.codex;
    this.stats = data.stats || this.stats;
    this.time = data.time || 0;
    this.day = data.day || 1;
    this.act = data.act || 1;
    if (data.sky) { this.sky.dayTime = data.sky.dayTime; this.sky.setWeather(data.sky.weather || 'overcast', true); }
    Object.assign(this.settings, data.settings || {});
    this.loot.deserialize(data.loot);
    this.doors.deserialize(data.doors);
    this.events.deserialize(data.events);
    if (data.pois) for (const [id, disc] of data.pois) { const poi = this.world.pois.find((x) => x.id === id); if (poi) poi.discovered = disc; }
    for (const b of data.buildings || []) this.restoreBuilding(b);
    this.waypoint = data.waypoint || null;
    this.finaleStarted = !!data.finaleStarted;
    // clear and respawn regular enemies
    this.clearEnemies();
    for (const [type, x, z] of data.enemies || []) this.spawnEnemy(type, x, z);
    this.codex.bosses = this.codex.bosses || {};
    this.ui.updateWeapon();
    this.ui.notify('Loaded', `Day ${this.day} — level ${this.level}.`, null, 'good');
    return true;
  }

  restoreBuilding(b) {
    const def = BUILDABLES.find((x) => x.id === b.id);
    if (!def) return;
    const mesh = new THREE.Mesh(boxGeo(def.size[0], def.size[1], def.size[2], 2), M.wood);
    mesh.position.set(b.x, b.y + def.size[1] / 2, b.z);
    mesh.rotation.y = b.ry;
    this.scene.add(mesh);
    this.buildings.push({ def, x: b.x, y: b.y, z: b.z, mesh, hp: def.hp, ry: b.ry });
    this.buildCount++;
  }

  loadGame() {
    const data = readSave(false) || readSave(true);
    if (!data) { this.notify('No save found'); return false; }
    this.loadData(data);
    this.mode = 'playing';
    this.locked = false;
    if (!this.headless) this.requestLock();
    return true;
  }

  hasSave() { return hasSave(); }

  dispose() {
    if (this._raf) cancelAnimationFrame(this._raf);
  }
}
