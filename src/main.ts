/**
 * SPACE MINER: BUILD & CONQUER - application entry point.
 * Boots the renderer, loads the save, builds the hangar and wires every UI panel,
 * the expedition flow and the autosave / achievement loops together.
 */
import './styles.css';
import * as THREE from 'three';
import { Engine } from './core/engine.ts';
import { Input } from './core/input.ts';
import { audio } from './core/audio.ts';
import { GameState } from './sim/gamestate.ts';
import { HangarScene } from './scenes/hangar.ts';
import { SpaceScene, type ExpeditionSummary } from './scenes/space.ts';
import { Shell, type PanelId } from './ui/shell.ts';
import { HUDOverlay } from './ui/hud.ts';
import { el, fmt } from './ui/dom.ts';
import type { UIContext } from './ui/context.ts';
import { buildHangarPanel } from './ui/panels/hangar.ts';
import { buildBuilderPanel } from './ui/panels/builder.ts';
import { buildShopPanel } from './ui/panels/shop.ts';
import { buildCrewPanel } from './ui/panels/crew.ts';
import { buildPacksPanel } from './ui/panels/packs.ts';
import { buildAchievementsPanel } from './ui/panels/achievements.ts';
import { buildUpgradesPanel } from './ui/panels/upgrades.ts';
import { buildSectorsPanel } from './ui/panels/sectors.ts';
import { buildStatsPanel, buildSettingsPanel } from './ui/panels/misc.ts';
import { RESOURCES, type SectorDef } from './data/sectors.ts';
import { FIFTH_SLOT_DROP_CHANCE, rollFifthSlot } from './sim/upgrades.ts';
import { CREW_CARDS } from './data/crew.ts';

const app = document.getElementById('app')!;

// ---------------------------------------------------------------- boot screen
function showLoadingScreen(): { setProgress: (p: number, label: string) => void; done: () => void } {
  const bar = el('i', { style: { width: '0%' } });
  const label = el('div', { class: 'mini', style: { marginTop: '10px', letterSpacing: '0.14em' } }, ['INITIALISING']);
  const screen = el('div', {
    style: {
      position: 'absolute', inset: '0', zIndex: '999', display: 'grid', placeItems: 'center',
      background: 'radial-gradient(900px 600px at 50% 35%, #122050, #02040f 70%)',
    },
  }, [
    el('div', { style: { textAlign: 'center', width: 'min(520px, 86vw)' } }, [
      el('div', {
        style: {
          fontFamily: 'Orbitron', fontWeight: '900', fontSize: '28px', letterSpacing: '0.14em',
          textShadow: '0 0 24px rgba(0,229,255,0.7)',
        },
      }, ['SPACE MINER']),
      el('div', {
        style: { fontFamily: 'Orbitron', fontSize: '13px', letterSpacing: '0.42em', color: '#7b61ff', marginTop: '6px' },
      }, ['BUILD & CONQUER']),
      el('div', { class: 'progress', style: { marginTop: '26px', height: '8px' } }, [bar]),
      label,
    ]),
  ]);
  app.appendChild(screen);
  return {
    setProgress: (p: number, text: string) => {
      bar.style.width = `${Math.round(p * 100)}%`;
      label.textContent = text;
    },
    done: () => {
      screen.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 520, easing: 'ease-out' }).onfinish = () => screen.remove();
    },
  };
}

const loading = showLoadingScreen();

async function frame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function boot(): Promise<void> {
  loading.setProgress(0.08, 'LOADING SAVE DATA');
  await frame();
  const state = GameState.load();

  loading.setProgress(0.2, 'STARTING RENDERER');
  await frame();
  const engine = new Engine(app, state.settings.quality);
  const input = new Input(engine.canvas);

  loading.setProgress(0.34, 'FORGING HANGAR GEOMETRY');
  await frame();
  const hangar = new HangarScene(state, input, engine.canvas, state.settings.quality);
  engine.setScene(hangar.scene, hangar.camera);

  loading.setProgress(0.62, 'SYNTHESISING TEXTURES');
  await frame();

  loading.setProgress(0.78, 'BUILDING INTERFACE');
  await frame();
  const shell = new Shell(app, state);

  let activePanel: HTMLElement | null = null;
  let space: SpaceScene | null = null;
  let hud: HUDOverlay | null = null;

  const save = () => {
    state.save();
  };
  const notify = (msg: string, kind: 'info' | 'error' | 'success' = 'info') => shell.toast(msg, kind);
  const refresh = () => shell.refreshCurrencies();

  const ctx: UIContext = {
    state, shell, hangar, save, refresh, notify,
    launch: (sector) => launchExpedition(sector),
  };

  hangar.onNotify = notify;
  hangar.onStationClick = (id) => {
    const map: Record<string, PanelId> = {
      builder: 'builder', shop: 'shop', crew: 'crew', packs: 'packs',
      upgrades: 'upgrades', missions: 'achievements', launch: 'sectors',
    };
    shell.navigate(map[id] ?? 'hangar');
  };

  const PANEL_BUILDERS: Record<PanelId, () => HTMLElement> = {
    hangar: () => buildHangarPanel(ctx),
    builder: () => buildBuilderPanel(ctx),
    shop: () => buildShopPanel(ctx),
    crew: () => buildCrewPanel(ctx),
    packs: () => buildPacksPanel(ctx),
    achievements: () => buildAchievementsPanel(ctx),
    upgrades: () => buildUpgradesPanel(ctx),
    sectors: () => buildSectorsPanel(ctx),
    stats: () => buildStatsPanel(ctx),
    settings: () => buildSettingsPanel(ctx),
  };

  shell.onNavigate = (id) => {
    if (space) return; // panels are disabled during an expedition
    if (activePanel && (activePanel as any).dispose) (activePanel as any).dispose();
    const transparent = id === 'hangar' || id === 'builder';
    shell.setPanelTransparent(transparent);
    if (id !== 'builder') hangar.setMode('view');
    const panel = PANEL_BUILDERS[id]();
    activePanel = panel;
    shell.setPanel(panel);
    refresh();
  };

  // ------------------------------------------------------------ expeditions
  function launchExpedition(sector: SectorDef): void {
    if (space) return;
    shell.layer.style.display = 'none';
    hangar.playLaunchSequence(() => {
      space = new SpaceScene(state, input, sector, state.settings.quality);
      space.onNotify = notify;
      space.start();
      engine.setScene(space.scene, space.camera);
      hud = new HUDOverlay(state, () => endExpedition(false));
      app.appendChild(hud.root);
      // Keep the toast stack visible above the HUD.
      hud.root.appendChild(shell.toastStack);
      notify(`Arrived in ${sector.name}. Right mouse to mine, left mouse to fire.`, 'success');
    });
  }

  function endExpedition(failed: boolean): void {
    if (!space) return;
    const summary = space.complete(failed);
    applySummary(summary);
    space.dispose();
    space = null;
    hud?.root.remove();
    hud = null;
    shell.layer.appendChild(shell.toastStack);
    shell.layer.style.display = '';
    engine.setScene(hangar.scene, hangar.camera);
    hangar.rebuildShip();
    shell.navigate('hangar');
    showSummaryModal(summary);
  }

  function applySummary(summary: ExpeditionSummary): void {
    state.addCredits(summary.credits);
    for (const [id, qty] of Object.entries(summary.ore)) {
      state.ore[id] = (state.ore[id] ?? 0) + qty;
    }
    state.stats.expeditions += 1;
    state.stats.asteroidsMined += summary.asteroidsMined;
    state.stats.enemiesKilled += summary.enemiesKilled;
    state.stats.oreCollected += summary.oreUnits;
    state.stats.distance += summary.distance;
    state.stats.rareFinds += summary.rareFinds;
    state.stats.damageDealt += summary.damageDealt;
    state.stats.deepestSector = Math.max(state.stats.deepestSector, summary.sector.index);

    state.trackStat('expeditions', 1);
    state.trackStat('asteroidsMined', summary.asteroidsMined);
    state.trackStat('enemiesKilled', summary.enemiesKilled);
    state.trackStat('oreCollected', summary.oreUnits);
    state.trackStat('chunksCollected', summary.chunks);
    state.trackStat('distance', summary.distance);
    state.trackStat('damageDealt', summary.damageDealt);
    state.trackStat('rareFinds', summary.rareFinds);
    state.trackStat('shieldAbsorbed', summary.shieldAbsorbed);

    // Rare fifth active-upgrade slot: exactly one roll per completed expedition.
    if (!summary.failed && rollFifthSlot(state.fifthSlotUnlocked, Math.random())) {
      state.fifthSlotUnlocked = true;
      summary.fifthSlotUnlocked = true;
      notify('RARE REWARD: fifth active upgrade slot unlocked!', 'success');
      audio.achievement();
    }
    save();
    refresh();
  }

  function showSummaryModal(summary: ExpeditionSummary): void {
    const oreRows = Object.entries(summary.ore).map(([id, qty]) =>
      el('div', { style: { display: 'flex', justifyContent: 'space-between' } }, [
        el('span', { class: 'mini', style: { color: `#${RESOURCES[id].color.toString(16).padStart(6, '0')}` } }, [RESOURCES[id].name]),
        el('b', { class: 'mini' }, [`${fmt(qty)} · ${fmt(qty * RESOURCES[id].value)} CR`]),
      ]));
    const content = el('div', { class: 'modal', style: { width: 'min(620px,94vw)', padding: '20px' } }, [
      el('h2', {
        style: { fontFamily: 'Orbitron', fontSize: '16px', letterSpacing: '0.1em', marginBottom: '4px', color: summary.failed ? '#ff6b8a' : '#00ff9d' },
      }, [summary.failed ? 'EMERGENCY EXTRACTION' : 'EXPEDITION COMPLETE']),
      el('div', { class: 'mini', style: { marginBottom: '14px' } }, [
        `${summary.sector.name} · ${Math.round(summary.duration)}s in the field`,
      ]),
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '10px', marginBottom: '14px' } }, [
        el('div', { class: 'kpiCard' }, [el('div', { class: 'mini' }, ['CREDITS EARNED']), el('b', {}, [fmt(summary.credits)])]),
        el('div', { class: 'kpiCard' }, [el('div', { class: 'mini' }, ['ORE DELIVERED']), el('b', {}, [fmt(summary.oreUnits)])]),
        el('div', { class: 'kpiCard' }, [el('div', { class: 'mini' }, ['ASTEROIDS MINED']), el('b', {}, [fmt(summary.asteroidsMined)])]),
        el('div', { class: 'kpiCard' }, [el('div', { class: 'mini' }, ['HOSTILES DESTROYED']), el('b', {}, [fmt(summary.enemiesKilled)])]),
        el('div', { class: 'kpiCard' }, [el('div', { class: 'mini' }, ['RARE FINDS']), el('b', {}, [fmt(summary.rareFinds)])]),
        el('div', { class: 'kpiCard' }, [el('div', { class: 'mini' }, ['DISTANCE']), el('b', {}, [fmt(summary.distance)])]),
      ]),
      oreRows.length ? el('div', { class: 'kpiCard', style: { marginBottom: '14px' } }, [
        el('div', { class: 'mini', style: { marginBottom: '6px' } }, ['CARGO DELIVERED TO SILO']),
        ...oreRows,
      ]) : null,
      summary.fifthSlotUnlocked ? el('div', {
        class: 'kpiCard',
        style: { marginBottom: '14px', borderColor: 'rgba(255,183,0,0.6)', background: 'rgba(255,183,0,0.1)' },
      }, [
        el('b', { style: { color: '#ffb700' } }, ['RARE CARD REWARD']),
        el('div', { class: 'mini' }, [`Fifth active upgrade slot unlocked (${(FIFTH_SLOT_DROP_CHANCE * 100).toFixed(0)}% chance).`]),
      ]) : null,
      el('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '10px' } }, [
        el('button', { class: 'btn ghost', onclick: () => { close(); shell.navigate('shop'); } }, ['SPEND CREDITS']),
        el('button', { class: 'btn', onclick: () => close() }, ['CONTINUE']),
      ]),
    ]);
    const close = shell.modal(content);
  }

  // ------------------------------------------------------------- frame loop
  let lastAutoSave = performance.now();
  let lastAchievementSync = 0;
  engine.onFrame((dt) => {
    if (space) {
      space.update(dt);
      hud?.update(space.hud);
      if (input.down('Escape')) endExpedition(false);
      // Feed live expedition counters into the achievement engine every second.
      lastAchievementSync += dt;
      if (lastAchievementSync > 1) {
        lastAchievementSync = 0;
        state.achievements.refresh(Date.now(), state.tier);
      }
    } else {
      hangar.update(dt);
    }
    input.endFrame();
    state.stats.playTimeMs += dt * 1000;
    if (performance.now() - lastAutoSave > 20000) {
      lastAutoSave = performance.now();
      save();
    }
  });

  // Live expedition stat tracking (minute achievements need sub-second feedback).
  let trackedAsteroids = 0;
  let trackedKills = 0;
  let trackedChunks = 0;
  let trackedDistance = 0;
  setInterval(() => {
    if (!space) return;
    const h = space.hud;
    if (h.asteroidsMined > trackedAsteroids) {
      state.trackStat('asteroidsMined', h.asteroidsMined - trackedAsteroids);
      trackedAsteroids = h.asteroidsMined;
    }
    if (h.enemiesKilled > trackedKills) {
      state.trackStat('enemiesKilled', h.enemiesKilled - trackedKills);
      trackedKills = h.enemiesKilled;
    }
    const chunkTotal = Object.values(h.ore).reduce((a, b) => a + b, 0);
    if (chunkTotal > trackedChunks) {
      state.trackStat('oreCollected', chunkTotal - trackedChunks);
      state.trackStat('chunksCollected', 1);
      trackedChunks = chunkTotal;
    }
    const dist = Math.round(h.elapsed * h.speed * 0.1);
    if (dist > trackedDistance) {
      state.trackStat('distance', dist - trackedDistance);
      trackedDistance = dist;
    }
  }, 500);

  // Reset per-expedition counters when a new run starts.
  const originalLaunch = ctx.launch;
  ctx.launch = (sector: SectorDef) => {
    trackedAsteroids = 0; trackedKills = 0; trackedChunks = 0; trackedDistance = 0;
    originalLaunch(sector);
  };

  // Achievement rotation notifications.
  state.achievements.onRotate = (period) => {
    if (period === 'minute') return;
    notify(`${period.toUpperCase()} objectives refreshed.`, 'info');
  };
  state.achievements.refresh(Date.now(), state.tier);
  state.achievements.setStat('cardsOwned', state.crew.size);
  state.achievements.setStat('cellsPurchased', state.ship.purchasedCount);

  // Audio must start from a user gesture.
  const startAudio = () => {
    audio.init();
    audio.setVolumes(state.settings.musicVolume, state.settings.sfxVolume);
    window.removeEventListener('pointerdown', startAudio);
    window.removeEventListener('keydown', startAudio);
  };
  window.addEventListener('pointerdown', startAudio);
  window.addEventListener('keydown', startAudio);

  window.addEventListener('beforeunload', () => save());

  loading.setProgress(1, 'READY');
  await frame();
  engine.start();
  shell.navigate('hangar');
  loading.done();

  if (state.loadWarning) notify(state.loadWarning, 'error');
  if (state.crew.size === 0) {
    // Welcome gift so the collection is never empty on a fresh campaign.
    const starter = CREW_CARDS.find((c) => c.id === 'c_driller');
    if (starter) {
      state.grantCard(starter.id);
      notify(`Welcome aboard: ${starter.name} joined your roster.`, 'success');
      save();
    }
  }

  // Expose a tiny debug surface used by the automated smoke tests.
  (window as any).SPACE_MINER = {
    state,
    engine,
    hangar,
    get space() { return space; },
    endExpedition: () => endExpedition(false),
    version: '1.0.0',
    three: THREE.REVISION,
  };
}

boot().catch((err) => {
  console.error(err);
  app.appendChild(el('div', {
    style: {
      position: 'absolute', inset: '0', display: 'grid', placeItems: 'center', padding: '24px',
      background: '#05070f', color: '#ff6b8a', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center',
    },
  }, [`Startup failure: ${String(err)}`]));
});
