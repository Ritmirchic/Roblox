/**
 * ASHES OF HUMANITY: LAST SIGNAL
 * Bootstrap + game loop. Owns every subsystem, drives the frame, handles the
 * spawn director, boss encounters, interaction, death and menu flow.
 */
import * as THREE from 'three';
import { createRenderer, createCamera } from './engine/renderer.js';
import { TextureLib } from './engine/textures.js';
import { CollisionWorld } from './engine/collision.js';
import { SkySystem } from './engine/sky.js';
import { PostFX } from './engine/postfx.js';
import { Input } from './engine/input.js';
import { FX } from './engine/fx.js';
import { World } from './world/world.js';
import { Player } from './entities/player.js';
import { EnemyManager } from './entities/ai.js';
import { Combat } from './systems/combat.js';
import { Inventory } from './systems/inventory.js';
import { AudioEngine } from './systems/audio.js';
import { Survival } from './systems/survival.js';
import { Progression } from './systems/progression.js';
import { QuestSystem } from './systems/quests.js';
import { CraftingSystem } from './systems/crafting.js';
import { BaseBuilding } from './systems/basebuilding.js';
import { DialogueSystem } from './systems/dialogue.js';
import { Settings } from './systems/settings.js';
import { SaveSystem } from './systems/save.js';
import { HUD } from './ui/hud.js';
import { UIManager } from './ui/screens.js';
import { ITEMS } from './data/items.js';
import { BOSSES, MUTANTS } from './entities/mutants.js';
import { clamp, clamp01 } from './engine/util.js';

export const MUTANT_IDS = Object.keys(MUTANTS);

const SPAWN_LEVELS = {
  hollow: [1, 3],
  crawler: [1, 4],
  screamer: [2, 5],
  mimic: [2, 6],
  stalker: [4, 7],
  burrower: [4, 8],
  brute: [6, 9],
  watcher: [7, 10],
  contaminated: [8, 12],
  pale: [9, 14],
};

class Game {
  constructor() {
    this.uiRoot = document.getElementById('ui-root');
    this.canvas = document.getElementById('game-canvas');
    this.settings = new Settings(this);
    this.renderer = createRenderer(this.canvas, this.settings);
    this.camera = createCamera();
    this.scene = new THREE.Scene();
    this.scene.name = 'world';

    this.textures = new TextureLib(this.renderer, { size: 512 });
    this.collision = new CollisionWorld();
    this.input = new Input(this.canvas);
    this.audio = new AudioEngine();
    this.sky = new SkySystem(this.scene, this.renderer);
    this.postfx = new PostFX(this.renderer, this.scene, this.camera);
    this.fx = new FX(this.scene, this.textures, this.settings.quality);

    this.hud = new HUD(this, this.uiRoot);
    this.ui = new UIManager(this);

    this.playtime = 0;
    this.playtimeStart = 0;
    this.paused = false;
    this.running = false;
    this.state = 'menu';
    this.last = 0;
    this.frameTimes = [];
    this.fps = 0;
    this.worldSeed = 2024;
    this.stats = { kills: 0, deaths: 0, quests: 0, distance: 0, shots: 0, hits: 0 };
    this.respawnPoint = { x: -700, y: 8, z: -640 };
    this.radioPlaylist = [];
    this.bossesSpawned = new Set();
    this.cooldowns = { interactHint: 0, save: 0 };
    this.lootedItemQueue = [];

    this.bindEvents();
    this.settings.apply();
    this.ui.showMainMenu();
    this.loop = this.loop.bind(this);
    this.last = performance.now();
    requestAnimationFrame(this.loop);
    // expose for automated testing
    window.__game = this;
  }

  // ------------------------------------------------------------- lifecycle
  newGame() {
    this.ui.hideMainMenu();
    this.showLoading('GENERATING TERRAIN');
    this.state = 'loading';
    this.bossesSpawned.clear();
    this.stats = { kills: 0, deaths: 0, quests: 0, distance: 0, shots: 0, hits: 0 };
    this.playtime = 0;

    setTimeout(() => {
      this.loadingStage('PLACING STRUCTURES');
      // fresh subsystems
      this.collision = new CollisionWorld();
      this.camerasReset();
      this.scene.clear();
      this.scene.fog = this.sky.fog;
      this.sky = new SkySystem(this.scene, this.renderer);
      this.sky.timeOfDay = 8.4;
      this.postfx = new PostFX(this.renderer, this.scene, this.camera);
      this.fx = new FX(this.scene, this.textures, this.settings.quality);
      this.camera.add(this.viewGroup());
      this.scene.add(this.camera);
      this.inventory = new Inventory({ onChanged: () => this.onInventoryChanged() });
      this.progression = new Progression(this);
      this.survival = new Survival(this);
      this.player = new Player(this);
      this.player.setPosition(-702, 10, -646);
      this.world = new World(this);
      this.world.generate();
      this.combat = new Combat(this);
      this.enemies = new EnemyManager(this);
      // compatibility alias used by combat and the noise system
      this.ai = this.enemies;
      this.player.footstepCallback = () => this.enemies?.onNoise(this.player.position, this.player.noiseRadius || 3);
      this.quests = new QuestSystem(this, this.world);
      this.crafting = new CraftingSystem(this);
      this.baseBuilding = new BaseBuilding(this);
      this.dialogue = new DialogueSystem(this);
      this.save = new SaveSystem(this);
      this.mutantTypes = MUTANT_IDS;
      this.loadingStage('STOCKING THE SHELTER');
      this.giveStartingKit();
      this.refreshDerived();
      this.combat.equipBestWeapon?.('secondary', true);
      this.world.terrain._heightCache.clear();
      this.player.setPosition(-702, this.world.groundY(-702, -646) + 0.35, -646);
      this.respawnPoint = { x: -702, y: this.world.groundY(-702, -646) + 0.35, z: -646 };
      this.loadingStage('ARMING THE HORDE');
      this.spawnWorldPopulation();
      this.anchorOpeningQuests();
      this.quests.def('m01') && this.quests.start('m01', { silent: false });
      this.state = 'playing';
      this.hideLoading();
      this.hud.regionCard('THE LAST SHELTER', 'YOU ARE AWAKE', 'Roadside bunker, Dead Suburbs');
      this.input.requestLock();
      this.notify('Move with WASD. Press TAB for your inventory.', 'info', 'FIELD MANUAL');
      this.save.save('auto');
    }, 60);
  }

  /**
   * The first two contracts are authored relative to the starting shelter, so
   * their markers are bound to the containers that actually exist in this run.
   */
  anchorOpeningQuests() {
    const p = this.player.position;
    const dist = (l) => Math.hypot(l.x - p.x, l.z - p.z);
    const candidates = this.world.lootables.filter((l) => ['bench', 'locker', 'crate', 'table'].includes(l.type));
    candidates.sort((a, b) => dist(a) - dist(b));
    const desk = candidates[0];
    const m01 = this.quests?.def('m01');
    if (m01 && desk) {
      m01.objectives[0].x = desk.x;
      m01.objectives[0].z = desk.z;
      m01.objectives[0].r = 6;
    }
    const m02 = this.quests?.def('m02');
    if (m02) {
      const exit = m02.objectives[1];
      if (exit) {
        exit.x = p.x;
        exit.z = p.z - 12;
        exit.r = 8;
      }
    }
  }

  viewGroup() {
    const g = new THREE.Group();
    g.name = 'viewmodel';
    this.viewModelGroup = g;
    return g;
  }

  camerasReset() {
    this.camera.position.set(0, 2, 4);
    this.camera.rotation.set(0, 0, 0);
    this.camera.fov = this.settings.fov;
    this.camera.near = 0.06;
    this.camera.far = 1400;
    this.camera.updateProjectionMatrix();
  }

  giveStartingKit() {
    const inv = this.inventory;
    inv.add('knife', 1);
    inv.add('pistol', 1);
    inv.add('ammo_pistol', 32);
    inv.add('med_bandage', 3);
    inv.add('food_canned', 2);
    inv.add('water_bottle', 2);
    inv.add('tool_flashlight', 1);
    inv.add('val_currency', 45);
    inv.add('mat_cloth', 4);
    inv.add('mat_wood', 3);
    inv.add('electronics_circuit', 1);
    for (const it of inv.items) {
      if (it.id === 'knife') inv.equip(it.uid);
      if (it.id === 'pistol') inv.equip(it.uid);
    }
    this.combat.equipBestWeapon('primary', true);
    this.combat.equipBestWeapon('melee', true);
  }

  loadGame() {
    this.ui.hideMainMenu();
    this.state = 'loading';
    this.showLoading('RESTORING SESSION');
    setTimeout(() => {
      // build an empty shell first, then apply the save on top
      this.paused = true;
      this.newGame();
      // newGame is async-ish (60ms); apply after it finishes
      setTimeout(() => {
        if (this.save?.load()) {
          this.loadingStage('RESTORING SESSION');
          this.player.setPosition(this.player.position.x, this.world.groundY(this.player.position.x, this.player.position.z) + 1.1, this.player.position.z);
          this.refreshDerived();
          this.hud.notify('Session restored.', 'info', 'SYSTEM');
        }
        this.paused = false;
        this.hideLoading();
        this.input.requestLock();
      }, 900);
    }, 30);
  }

  toMainMenu() {
    this.state = 'menu';
    this.paused = false;
    if (this.player && !this.player.isDead) this.save?.save('auto');
    this.hud.hideDeath();
    this.hud.setVisible(true);
    this.ui.close();
    this.ui.closeDialogue();
    this.input.exitLock();
    this.ui.showMainMenu();
  }

  showLoading(stage) {
    if (!this.loadingEl) {
      this.loadingEl = document.createElement('div');
      this.loadingEl.className = 'loading';
      this.loadingEl.innerHTML = `
        <div class="ld-inner">
          <div class="ld-title">ASHES OF HUMANITY</div>
          <div class="ld-stage" id="ld-stage">${stage}</div>
          <div class="ld-track"><div class="ld-fill" id="ld-fill"></div></div>
          <div class="ld-hint" id="ld-hint">Several thousand years of civilisation, ending quietly in a filing cabinet.</div>
        </div>`;
      this.uiRoot.appendChild(this.loadingEl);
    }
    this.loadingEl.classList.add('show');
    this.loadingStage(stage);
  }

  loadingStage(text) {
    const s = this.loadingEl?.querySelector('#ld-stage');
    if (s) s.textContent = text;
    const f = this.loadingEl?.querySelector('#ld-fill');
    if (f) f.style.width = `${Math.min(96, (parseFloat(f.style.width) || 8) + 22)}%`;
  }

  hideLoading() {
    if (!this.loadingEl) return;
    const f = this.loadingEl.querySelector('#ld-fill');
    if (f) f.style.width = '100%';
    setTimeout(() => this.loadingEl?.classList.remove('show'), 220);
  }

  // ------------------------------------------------------------- world pop
  spawnWorldPopulation() {
    const mgr = this.enemies;
    const world = this.world;
    // ambient population around every spawn zone
    for (const z of world.spawnZones) {
      const count = Math.min(6, z.count || 3);
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * (z.radius || 60) * 0.75;
        mgr.spawn(z.mutant, z.x + Math.cos(a) * r, z.z + Math.sin(a) * r, {
          pack: z.pack ? `static_${Math.floor(z.x)}_${Math.floor(z.z)}` : null,
          homeRadius: 40,
          level: this.enemyLevel(z.mutant),
        });
      }
    }
    // scavenger wildlife near the camp for early-game combat
    const campX = -1010;
    const campZ = -900;
    for (let i = 0; i < 4; i++) {
      mgr.spawn('hollow', campX - 70 + i * 26, campZ - 60 + (i % 2) * 30, { homeRadius: 26, level: 1 });
    }
  }

  enemyLevel(mutantId) {
    const range = SPAWN_LEVELS[mutantId] || [1, 4];
    return range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
  }

  // ------------------------------------------------------------ gameplay
  refreshDerived() {
    const p = this.player;
    const prog = this.progression;
    const prevMax = p.healthMax;
    p.healthMax = prog.maxHealth;
    if (p.healthMax !== prevMax) p.health = Math.min(p.healthMax, p.health + (p.healthMax - prevMax));
    p.staminaMax = prog.maxStamina;
    this.combat.damageBonus = prog.damageBonus;
    this.combat.armorPiercing = prog.effect('armor') || 0;
    this.combat.reloadSpeed = prog.reloadSpeed;
    this.combat.recoilControl = prog.effect('recoil') || 0;
    this.combat.headshotBonus = prog.effect('headshot') || 0;
    this.survival.radiationResist = prog.radiationResist;
    this.survival.staminaRegenBonus = prog.effect('staminaRegen') || 0;
    this.inventory.capacityBonus = prog.carryCapacity - 22;
    this.hud?.updateVitals(p);
    this.hud?.setXpProgress(this.progression.xpProgress);
  }

  onInventoryChanged() {
    this.hud?.updateWeapon();
    if (this.ui?.openPane === 'inventory') this.ui.renderInventory();
  }

  notify(text, kind = 'info', title = null) {
    this.hud?.notify(text, kind, title);
  }

  interactAt() {
    const target = this.world.findInteractable(this.player);
    return target;
  }

  doInteract() {
    const t = this.interactAt();
    if (!t) return;
    if (t.kind === 'npc') {
      this.startDialogue(t.obj);
      return;
    }
    if (t.kind === 'loot') {
      const items = t.obj.search();
      if (!items.length) {
        this.notify('Already searched.', 'info', 'SEARCH');
        return;
      }
      for (const stack of items) {
        const left = this.inventory.add(stack.id, stack.qty, { durability: stack.durability, attachments: stack.attachments });
        this.quests?.onPickup(stack.id);
        if (left === 0) this.notify(`${ITEMS[stack.id]?.name || stack.id} x${stack.qty}`, 'item', 'ACQUIRED');
        else this.notify('No room - left behind.', 'danger', 'INVENTORY');
      }
      this.audio.play('loot', t.obj.position || new THREE.Vector3(t.x, t.y, t.z));
      this.progression.awardXp(12, 'looting');
      return;
    }
    if (t.kind === 'pickup') {
      const ok = t.obj.pickup();
      if (ok) {
        this.quests?.onPickup(t.obj.id);
        this.audio.play('pickup');
      }
      return;
    }
    if (t.kind === 'door') {
      t.obj.toggle();
      this.audio.play(t.obj.open ? 'doorOpen' : 'doorClose', new THREE.Vector3(t.x, t.y, t.z));
      return;
    }
    if (t.kind === 'radio') {
      this.radioInteract(t.obj);
    }
  }

  radioInteract(radio) {
    this.audio.play('radioStatic');
    this.ui.openDialogue(
      { name: 'SHELTER RADIO', role: 'BROADCAST RECEIVER', roleLabel: 'PROJECT LAST SIGNAL', icon: 'radio' },
      {
        topic: '87.6 MHZ',
        text: '"...nine minutes of carrier, then the same eleven words. Project Last Signal is active. All designated personnel report to the exclusion zone. All others remain indoors." The recording loops. It has been looping for three weeks.',
        choices: [
          { label: 'Note the broadcast bearing.', action: () => { this.quests?.onTalk('shelterRadio'); this.notify('Bearing noted: north-north-east.', 'quest', 'SIGNAL'); return false; } },
          { label: 'Turn the radio off.' },
        ],
      },
    );
  }

  startDialogue(npc) {
    this.quests?.onTalk(npc.name);
    const node = this.dialogue.tree(npc);
    this.ui.openDialogue(
      { name: npc.name, role: npc.role, roleLabel: this.dialogue.roleLabel(npc), icon: npc.role === 'trader' ? 'bagGrid' : npc.role === 'guard' ? 'rifle' : 'paper' },
      node,
    );
    this.audio.play('uiClick');
  }

  useItemMenu(action) {
    // hook used by ui.close
  }

  refreshUiBlock() {
    if (this.input) this.input.enabled = true;
  }

  sleepUntilMorning() {
    const sky = this.sky;
    if (sky.timeOfDay > 5 && sky.timeOfDay < 18) {
      this.notify('You can only sleep at night.', 'info', 'REST');
      return;
    }
    this.survival.sleep(7);
    sky.timeOfDay = 6.4;
    this.notify('You sleep until dawn. The camp is still standing.', 'info', 'REST');
    this.save?.save('auto');
  }

  onPlayerDeath(cause) {
    this.stats.deaths++;
    this.survival.stats.deaths++;
    this.audio.play('death');
    this.postfx.setFade?.(0.35);
    this.hud.showDeath([
      { label: 'TIME SURVIVED', value: fmtTime(this.playtime) },
      { label: 'MUTANTS KILLED', value: this.stats.kills },
      { label: 'CONTRACTS', value: `${this.quests.completed.size}` },
    ]);
    this.input.exitLock();
  }

  respawnPlayer() {
    const p = this.player;
    p.isDead = false;
    p.health = Math.max(35, p.healthMax * 0.5);
    p.bleeding = 0;
    p.pain = 0;
    p.radiation = Math.max(0, p.radiation - 30);
    p.infection = Math.max(0, p.infection - 20);
    p.position.set(this.respawnPoint.x, this.world.groundY(this.respawnPoint.x, this.respawnPoint.z) + 1.2, this.respawnPoint.z);
    p.velocity.set(0, 0, 0);
    this.survival.deathsSinceRest = 0;
    this.hud.hideDeath();
    this.hud.setVisible(true);
    this.postfx.setFade?.(0);
    this.enemies.clear();
    this.spawnWorldPopulation();
    // lose a little scrip as a death penalty
    const scrip = this.inventory.count('val_currency');
    if (scrip > 0) this.inventory.removeById('val_currency', Math.floor(scrip * 0.15));
    this.input.requestLock();
    this.notify('You wake in the shelter. Some of your scrip is gone.', 'danger', 'RESPAWN');
  }

  /** Called by combat when a mutant dies. Keeps the run statistics honest. */
  onKill(enemy) {
    this.stats.kills++;
    this.combat.kills = Math.max(this.combat.kills || 0, this.stats.kills);
    if (this.survival?.stats) this.survival.stats.kills = this.stats.kills;
    const id = enemy?.mutantId || enemy?.id;
    if (id) this.progression.killsByType[id] = (this.progression.killsByType[id] || 0) + 1;
  }

  onBossDefeated(bossId) {
    const def = BOSSES[bossId];
    this.quests.onBossKilled(bossId);
    this.progression.awardXp(def?.xp || 1200, def?.name || bossId);
    this.notify(`${def?.name || bossId} is dead.`, 'quest', 'APEX PREDATOR');
    this.audio.play('bossDeath');
    this.hud.hideBoss();
    this.bossesSpawned.add(bossId);
    this.save?.save('auto');
  }

  onCampaignComplete() {
    this.notify('The signal is silent. Humanity has one more night.', 'quest', 'CAMPAIGN COMPLETE');
    this.audio.play('campaignEnd');
  }

  // ------------------------------------------------------------- frame loop
  bindEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight, false);
      this.postfx.setSize(window.innerWidth, window.innerHeight);
    });
    window.addEventListener('keydown', (e) => {
      if (this.state !== 'playing') {
        this.ui.handleKey(e.code);
        return;
      }
      if (this.ui.handleKey(e.code)) return;
      switch (e.code) {
        case 'Tab':
          if (this.ui.openPane) this.ui.close();
          else this.ui.open('inventory');
          break;
        case 'KeyJ': this.ui.toggle('journal'); break;
        case 'KeyK': this.ui.toggle('skills'); break;
        case 'KeyB': this.ui.toggle('crafting'); break;
        case 'KeyV': this.ui.toggle('build'); break;
        case 'KeyM': this.ui.toggle('map'); break;
        case 'KeyO': this.ui.toggle('settings'); break;
        case 'KeyE': if (!this.ui.blocking) this.doInteract(); break;
        case 'KeyF': if (!this.ui.blocking) this.toggleFlashlight(); break;
        case 'KeyQ':
          if (this.baseBuilding.selected) this.baseBuilding.cancel();
          else this.combat.cycleWeapon();
          break;
        case 'KeyG': if (!this.ui.blocking) this.tossGrenade(); break;
        case 'KeyZ': this.baseBuilding?.sleep?.(); break;
        case 'Escape':
          if (this.ui.openPane) this.ui.close();
          else this.togglePause();
          break;
        default: break;
      }
    });
    this.canvas.addEventListener('mousedown', (e) => {
      if (this.state !== 'playing' || this.ui.blocking) return;
      if (e.button === 0) {
        if (this.baseBuilding.selected) this.baseBuilding.place();
        else this.combat.tryFire(this.input);
      }
      if (e.button === 2) this.combat.altFire?.(this.input);
    });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.input.onLockChange = (locked) => {
      if (!locked && this.state === 'playing' && !this.ui.blocking && !this.player?.isDead) this.togglePause(true);
    };
  }

  togglePause(force = null) {
    this.paused = force === null ? !this.paused : force;
    if (this.paused) {
      this.ui.open('inventory');
    } else {
      this.ui.close();
      this.input.requestLock();
    }
  }

  toggleFlashlight() {
    const p = this.player;
    if (p.flashlightBattery <= 0) {
      this.notify('Flashlight battery dead.', 'danger', 'EQUIPMENT');
      return;
    }
    p.flashlightOn = !p.flashlightOn;
    this.audio.play(p.flashlightOn ? 'lightOn' : 'lightOff');
  }

  equipSlot(slot) {
    const it = this.inventory.equippedItem(slot);
    if (it) this.combat.equipWeapon(it.uid, slot);
  }

  tossGrenade() {
    const has = this.inventory.count('grenade_frag') > 0 || this.inventory.count('grenade_molotov') > 0;
    if (!has) {
      this.notify('No explosives.', 'danger', 'EQUIPMENT');
      return;
    }
    const id = this.inventory.count('grenade_frag') > 0 ? 'grenade_frag' : 'grenade_molotov';
    this.inventory.removeById(id, 1);
    this.combat.throwGrenade?.(id);
  }

  approachBoss() {
    const p = this.player.position;
    for (const arena of this.world.bossArenas) {
      if (this.bossesSpawned.has(arena.boss)) continue;
      const d = Math.hypot(p.x - arena.x, p.z - arena.z);
      if (d < arena.radius + 12) {
        this.bossesSpawned.add(arena.boss);
        this.enemies.spawnBoss(arena.boss, this.progression.level, { x: arena.x, z: arena.z });
        this.hud.showBoss({ name: BOSSES[arena.boss]?.name || arena.boss, def: BOSSES[arena.boss] });
        this.audio.play('bossRoar');
        this.notify(`APEX PREDATOR DETECTED: ${BOSSES[arena.boss]?.name || arena.boss}`, 'danger', 'WARNING');
        break;
      }
    }
  }

  directorUpdate(dt) {
    this.directorTimer = (this.directorTimer || 0) + dt;
    if (this.directorTimer < 4) return;
    this.directorTimer = 0;
    const p = this.player.position;
    const alive = this.enemies.activeCount;
    if (alive > 24) return;
    // keep the region the player stands in populated
    const region = this.world.regionAt(p.x, p.z);
    const candidates = this.world.spawnZones.filter((z) => z.region === region);
    if (!candidates.length) return;
    const zone = candidates[Math.floor(Math.random() * candidates.length)];
    const a = Math.random() * Math.PI * 2;
    const r = 55 + Math.random() * 55;
    const x = p.x + Math.cos(a) * r;
    const z = p.z + Math.sin(a) * r;
    if (!this.world.areaFree(x, z, 2, 2)) return;
    if (Math.hypot(x - zone.x, z - zone.z) > (zone.radius || 80)) return;
    this.enemies.spawn(zone.mutant, x, z, { homeRadius: 38, level: this.enemyLevel(zone.mutant), pack: zone.pack ? `dyn_${zone.mutant}` : null });
  }

  update(dt) {
    const p = this.player;
    const settings = this.settings;
    this.playtime += dt;

    // input → look
    this.input.enabled = !this.ui.blocking;

    this.world.update(dt);
    this.survival.update(dt, { paused: this.paused, inside: this.world.surfaceAt(p.position) !== 'water' });
    p.update(dt);
    this.combat.update(dt, this.input);
    this.enemies.update(dt);
    this.baseBuilding.update(dt);
    this.crafting.update(dt);
    this.quests.update(dt);
    this.fx.update(dt);
    this.approachBoss();
    this.directorUpdate(dt);
    this.updateInteraction();
    this.updateHud(dt);
    this.updateWorldAudio(dt);

    // time of day and weather
    this.sky.update(dt, this.camera, p.position);

    // stamina/health hooks
    this.progression.update?.(dt);
    this.hud.update(dt);
    this.save?.update(dt);
    this.stats.distance = this.survival?.stats?.distance || 0;
  }

  updateInteraction() {
    if (this.ui.blocking || this.player.isDead) {
      this.hud.hideInteract();
      return;
    }
    const t = this.world.findInteractable(this.player);
    if (!t) {
      this.hud.hideInteract();
      return;
    }
    const label = t.label || (t.kind === 'loot' ? 'SEARCH' : t.kind === 'door' ? (t.obj.open ? 'CLOSE' : 'OPEN') : t.kind === 'npc' ? 'TALK' : 'TAKE');
    const sub = t.kind === 'loot' && t.obj.searched ? 'EMPTY' : t.sub || '';
    this.hud.showInteract(label, sub);
  }

  updateHud(dt) {
    const p = this.player;
    this.hud.updateVitals(p);
    this.hud.updateWeapon();
    this.hud.setClock(this.sky.timeOfDay);
    const regionName = this.world.regionName(p.position.x, p.position.z);
    const act = this.quests.currentAct;
    this.hud.setRegion(regionName, `ACT ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][Math.min(7, act)]}`, this.weatherLabel(), this.player.temperature ?? 36.6);
    // compass + minimap markers
    const markers = [];
    const obj = this.quests.getTrackedMarker();
    if (obj) {
      const bearing = ((Math.atan2(obj.x - p.position.x, -(obj.z - p.position.z)) * 180) / Math.PI + 360) % 360;
      markers.push({ bearing, x: obj.x, z: obj.z, distance: obj.distance, color: '#c9a227' });
      this.hud.setObjective('CURRENT OBJECTIVE', obj.title, `${Math.round(obj.distance)} M`);
    } else {
      this.hud.setObjective(null);
    }
    for (const loc of this.world.locations) {
      if (loc.type !== 'camp' && loc.type !== 'shelter') continue;
      const d = Math.hypot(loc.x - p.position.x, loc.z - p.position.z);
      if (d > 300) continue;
      const bearing = ((Math.atan2(loc.x - p.position.x, -(loc.z - p.position.z)) * 180) / Math.PI + 360) % 360;
      markers.push({ bearing, x: loc.x, z: loc.z, distance: d, color: '#6f8f5e' });
    }
    this.hud.updateCompass(p, markers);
    // the minimap canvas is expensive to repaint under software rasterisers
    if (!this._mmClock || this.playtime - this._mmClock > 0.15) {
      this._mmClock = this.playtime;
      this.hud.drawMinimap?.(p, this.world, markers);
    }
    this.hud.setXpProgress(this.progression.xpProgress);
    // boss bar follow
    if (this.hud.bossRef) {
      const b = this.hud.bossRef;
      if (!b.dead) this.hud.updateBossHealth(b.health / b.maxHealth, (b.def?.phases ? [0.66, 0.33] : []));
      else this.hud.hideBoss();
    }
    this.hud.elCross.classList.toggle('hit', this.combat.crosshairHot);
  }

  weatherLabel() {
    const w = this.sky.weather;
    if (w.radStorm > 0.2) return 'RADIATION STORM';
    if (w.storm > 0.5) return 'STORM';
    if (w.rain > 0.4) return 'RAIN';
    if (w.fog > 0.5) return 'HEAVY FOG';
    if (w.cloud > 0.6) return 'OVERCAST';
    if (w.cloud > 0.3) return 'SCATTERED CLOUD';
    return 'CLEAR';
  }

  updateWorldAudio(dt) {
    const p = this.player;
    const enemiesNear = this.enemies.countAliveNear(p.position, 40);
    this.audio.update(dt, {
      rain: this.sky.weather.rain,
      wind: this.sky.weather.wind,
      inside: this.world.surfaceAt(p.position) !== 'water' && p.position.y > this.world.groundY(p.position.x, p.position.z) + 3,
      health: p.health / p.healthMax,
      enemiesNear,
      state: p.isDead ? 'dead' : enemiesNear > 0 ? 'combat' : this.world.isSafeZone(p.position.x, p.position.z) ? 'safe' : 'explore',
    });
    this.audio.setListener(this.camera.position, p.yaw);
  }

  render(dt) {
    this.renderer.info.reset();
    this.postfx.render(dt);
  }

  loop(now) {
    const raw = now - this.last;
    this.last = now;
    const dt = Math.min(0.05, raw / 1000);
    this.frameTimes.push(raw);
    if (this.frameTimes.length > 60) this.frameTimes.shift();
    this.fps = 1000 / (this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length);

    if (this.state === 'playing' && this.player && !this.paused) {
      this.update(dt);
    } else if (this.state === 'playing' && this.paused) {
      // keep the world alive visually while paused
      this.sky.update(dt, this.camera, this.player.position);
      this.hud.update(dt);
    }
    if (this.state === 'playing') this.render(dt);
    else if (this.state === 'menu') this.renderMenu(dt);
    this.input.endFrame();
    requestAnimationFrame(this.loop);
  }

  renderMenu(dt) {
    // slow cinematic drift over the generated world behind the menu
    this.menuTime = (this.menuTime || 0) + dt;
    if (!this.menuBuilt) return;
    const t = this.menuTime * 0.03;
    this.camera.position.set(-1050 + Math.sin(t) * 90, this.world.groundY(-1050, -1050) + 26 + Math.sin(t * 0.7) * 6, -1050 + Math.cos(t) * 90);
    this.camera.lookAt(-900, this.world.groundY(-900, -900) + 6, -900);
    this.sky.update(dt, this.camera, this.camera.position);
    this.renderer.render(this.scene, this.camera);
  }

  buildMenuWorld() {
    // a lightweight world used as menu backdrop
    this.menuBuilt = false;
    this.collision = new CollisionWorld();
    this.player = new Player(this);
    this.player.setPosition(-1050, 10, -1050);
    this.player.model.root.visible = false;
    this.world = new World(this);
    this.world.generate();
    this.sky.timeOfDay = 17.6;
    this.sky.weather = { ...this.sky.weather, fog: 0.28, cloud: 0.55 };
    this.menuBuilt = true;
  }
}

function fmtTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}H ${String(m).padStart(2, '0')}M`;
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
const game = new Game();
// Build the menu backdrop world immediately so the first frame is not empty.
setTimeout(() => {
  try {
    game.buildMenuWorld();
  } catch (err) {
    console.error('menu world failed', err);
  }
}, 30);

window.addEventListener('error', (e) => {
  console.error('[fatal]', e.message);
});
