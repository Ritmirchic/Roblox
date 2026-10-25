/**
 * Expedition HUD: status bars, radar, target readout, live objectives and cargo manifest.
 */
import { el, clear, fmt } from './dom.ts';
import type { ExpeditionHUD } from '../scenes/space.ts';
import { RESOURCES } from '../data/sectors.ts';
import type { GameState } from '../sim/gamestate.ts';

export class HUDOverlay {
  root: HTMLElement;
  private bars: Record<string, { fill: HTMLElement; label: HTMLElement }> = {};
  private radar: HTMLCanvasElement;
  private targetBox: HTMLElement;
  private warnBox: HTMLElement;
  private oreBox: HTMLElement;
  private statBox: HTMLElement;
  private objectivesBox: HTMLElement;
  private state: GameState;

  constructor(state: GameState, onReturn: () => void) {
    this.state = state;
    const bar = (id: string, label: string, color: string) => {
      const fill = el('i', { style: { width: '0%', background: color } });
      const value = el('span', { class: 'mini', style: { fontFamily: 'JetBrains Mono' } }, ['0']);
      this.bars[id] = { fill, label: value };
      return el('div', { style: { marginBottom: '8px' } }, [
        el('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '3px' } }, [
          el('span', { class: 'mini' }, [label]), value,
        ]),
        el('div', { class: 'progress' }, [fill]),
      ]);
    };

    this.radar = document.createElement('canvas');
    this.radar.width = 220;
    this.radar.height = 220;
    Object.assign(this.radar.style, { width: '170px', height: '170px', display: 'block' } as CSSStyleDeclaration);

    this.targetBox = el('div', { class: 'hudCard', style: { minWidth: '240px' } });
    this.warnBox = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' } });
    this.oreBox = el('div', { class: 'hudCard', style: { minWidth: '200px' } });
    this.statBox = el('div', { class: 'hudCard', style: { minWidth: '180px' } });
    this.objectivesBox = el('div', {
      class: 'hudCard',
      style: { position: 'absolute', right: '14px', top: '210px', width: '250px' },
    });

    const left = el('div', {
      class: 'spaceHud',
      style: { top: '80px', left: '16px', width: '290px' },
    }, [
      bar('hull', 'HULL INTEGRITY', 'linear-gradient(90deg,#00ff9d,#00e5ff)'),
      bar('shield', 'SHIELDS', 'linear-gradient(90deg,#49b6ff,#7b61ff)'),
      bar('energy', 'ENERGY', 'linear-gradient(90deg,#ffd166,#ff8a3c)'),
      bar('cargo', 'CARGO HOLD', 'linear-gradient(90deg,#b6ff6e,#00ff9d)'),
      this.targetBox,
    ]);

    const right = el('div', {
      style: { position: 'absolute', right: '14px', top: '80px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' },
    }, [
      el('div', { class: 'hudCard', style: { padding: '8px' } }, [this.radar]),
      this.statBox,
      this.oreBox,
    ]);

    const bottom = el('div', {
      style: { position: 'absolute', left: '50%', bottom: '16px', transform: 'translateX(-50%)', display: 'flex', gap: '12px', alignItems: 'center' },
    }, [
      el('div', { class: 'hudCard', style: { display: 'flex', gap: '14px', alignItems: 'center' } }, [
        el('span', { class: 'mini' }, ['W/S thrust · A/D strafe · Space/C lift · Q/E roll · X brake · Shift boost']),
        el('span', { class: 'mini', style: { color: '#00e5ff' } }, ['LMB weapons · RMB mining laser']),
      ]),
      el('button', { class: 'btn gold', onclick: onReturn }, ['RETURN TO HANGAR']),
    ]);

    const warnWrap = el('div', {
      style: { position: 'absolute', left: '50%', top: '96px', transform: 'translateX(-50%)' },
    }, [this.warnBox]);

    this.root = el('div', { class: 'ui-layer' }, [
      left, right, bottom, warnWrap, this.objectivesBox,
      el('div', { class: 'crosshair' }),
    ]);
  }

  update(hud: ExpeditionHUD): void {
    const setBar = (id: string, value: number, max: number, text?: string) => {
      const b = this.bars[id];
      if (!b) return;
      const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
      b.fill.style.width = `${pct * 100}%`;
      b.label.textContent = text ?? `${fmt(value)} / ${fmt(max)}`;
    };
    setBar('hull', hud.hull, hud.maxHull);
    setBar('shield', hud.shield, hud.maxShield, hud.maxShield > 0 ? undefined : 'NO SHIELD GENERATOR');
    setBar('energy', hud.energy, hud.maxEnergy);
    setBar('cargo', hud.cargo, hud.cargoCap);

    clear(this.targetBox);
    if (hud.targetName) {
      this.targetBox.append(
        el('div', { class: 'mini' }, ['TARGET']),
        el('b', { style: { fontSize: '12px' } }, [hud.targetName]),
        el('div', { class: 'progress', style: { marginTop: '6px' } }, [
          el('i', { style: { width: `${Math.max(0, Math.min(100, (hud.targetHealth / Math.max(1, hud.targetMaxHealth)) * 100))}%`, background: 'linear-gradient(90deg,#ff3b6b,#ffb700)' } }),
        ]),
      );
    } else {
      this.targetBox.append(el('div', { class: 'mini' }, ['NO TARGET LOCKED']));
    }

    clear(this.statBox);
    this.statBox.append(
      el('div', { class: 'mini' }, [hud.sector]),
      el('div', { style: { display: 'flex', justifyContent: 'space-between' } }, [
        el('span', { class: 'mini' }, ['SPEED']), el('b', { class: 'mini' }, [`${fmt(hud.speed)} m/s`]),
      ]),
      el('div', { style: { display: 'flex', justifyContent: 'space-between' } }, [
        el('span', { class: 'mini' }, ['MINED']), el('b', { class: 'mini' }, [fmt(hud.asteroidsMined)]),
      ]),
      el('div', { style: { display: 'flex', justifyContent: 'space-between' } }, [
        el('span', { class: 'mini' }, ['KILLS']), el('b', { class: 'mini' }, [fmt(hud.enemiesKilled)]),
      ]),
      el('div', { style: { display: 'flex', justifyContent: 'space-between' } }, [
        el('span', { class: 'mini' }, ['BOUNTY']), el('b', { class: 'mini', style: { color: '#ffb700' } }, [`${fmt(hud.credits)} CR`]),
      ]),
    );

    clear(this.oreBox);
    const ore = Object.entries(hud.ore).filter(([, q]) => q > 0);
    this.oreBox.append(el('div', { class: 'mini' }, ['CARGO MANIFEST']));
    if (!ore.length) this.oreBox.append(el('div', { class: 'mini', style: { opacity: '0.6' } }, ['Empty']));
    for (const [id, qty] of ore) {
      this.oreBox.append(el('div', { style: { display: 'flex', justifyContent: 'space-between' } }, [
        el('span', { class: 'mini', style: { color: `#${RESOURCES[id].color.toString(16).padStart(6, '0')}` } }, [RESOURCES[id].name]),
        el('b', { class: 'mini' }, [fmt(qty)]),
      ]));
    }

    clear(this.warnBox);
    for (const w of hud.warnings) {
      this.warnBox.append(el('div', {
        style: {
          padding: '6px 14px', borderRadius: '999px', background: 'rgba(255,59,107,0.16)',
          border: '1px solid rgba(255,59,107,0.5)', fontFamily: 'Orbitron', fontSize: '10px', letterSpacing: '0.14em',
          animation: 'none',
        },
      }, [w]));
    }

    // Live minute objectives so the player can see progress during flight.
    clear(this.objectivesBox);
    const active = this.state.achievements.active.filter((a) => a.period === 'minute').slice(0, 5);
    this.objectivesBox.append(el('div', { class: 'mini' }, ['MINUTE OBJECTIVES']));
    for (const a of active) {
      const progress = this.state.achievements.state.progress[a.key] ?? 0;
      this.objectivesBox.append(el('div', { style: { marginTop: '6px' } }, [
        el('div', { style: { display: 'flex', justifyContent: 'space-between' } }, [
          el('span', { class: 'mini' }, [a.name]),
          el('span', { class: 'mini', style: { color: progress >= a.target ? '#00ff9d' : '#8aa' } }, [`${fmt(Math.min(progress, a.target))}/${fmt(a.target)}`]),
        ]),
        el('div', { class: 'progress' }, [el('i', { style: { width: `${Math.min(100, (progress / a.target) * 100)}%` } })]),
      ]));
    }

    this.drawRadar(hud);
  }

  private drawRadar(hud: ExpeditionHUD): void {
    const ctx = this.radar.getContext('2d')!;
    const w = this.radar.width, h = this.radar.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(2,8,20,0.85)';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,229,255,0.35)';
    ctx.lineWidth = 1.5;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, ((w / 2 - 4) * i) / 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(w / 2, 4); ctx.lineTo(w / 2, h - 4);
    ctx.moveTo(4, h / 2); ctx.lineTo(w - 4, h / 2);
    ctx.stroke();

    for (const b of hud.radarBlips) {
      const x = w / 2 + b.x * (w / 2 - 8);
      const y = h / 2 - b.y * (h / 2 - 8);
      ctx.fillStyle = b.type === 'enemy' ? '#ff3b6b' : b.type === 'chunk' ? '#b6ff6e' : 'rgba(180,200,230,0.75)';
      ctx.beginPath();
      ctx.arc(x, y, b.type === 'enemy' ? 4 : 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Player marker.
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2 - 7);
    ctx.lineTo(w / 2 + 5, h / 2 + 6);
    ctx.lineTo(w / 2 - 5, h / 2 + 6);
    ctx.closePath();
    ctx.fill();
  }
}
