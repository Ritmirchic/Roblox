/**
 * Sector map: unlock and launch into the five space regions.
 */
import { el, clear, fmt } from '../dom.ts';
import { SECTORS, RESOURCES } from '../../data/sectors.ts';
import { audio } from '../../core/audio.ts';
import type { UIContext } from '../context.ts';

function sectorPreview(index: number, colors: [number, number]): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 480; canvas.height = 220;
  const ctx = canvas.getContext('2d')!;
  const [a, b] = colors;
  const toCss = (hex: number, alpha = 1) => `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${alpha})`;
  const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  g.addColorStop(0, toCss(b, 0.95));
  g.addColorStop(1, '#03060f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 5; i++) {
    const cx = (i * 97 + index * 53) % canvas.width;
    const cy = (i * 61 + index * 37) % canvas.height;
    const r = 40 + ((i * 29 + index * 11) % 90);
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    rg.addColorStop(0, toCss(a, 0.4));
    rg.addColorStop(1, toCss(a, 0));
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  for (let i = 0; i < 220; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.8})`;
    ctx.beginPath();
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Asteroid silhouettes.
  for (let i = 0; i < 6; i++) {
    const cx = Math.random() * canvas.width, cy = Math.random() * canvas.height, r = 10 + Math.random() * 28;
    ctx.fillStyle = 'rgba(4,7,16,0.85)';
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const ang = (k / 10) * Math.PI * 2;
      const rr = r * (0.75 + Math.random() * 0.4);
      const x = cx + Math.cos(ang) * rr, y = cy + Math.sin(ang) * rr;
      k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = toCss(a, 0.5);
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  canvas.style.width = '100%';
  canvas.style.borderRadius = '12px';
  canvas.style.display = 'block';
  return canvas;
}

export function buildSectorsPanel(ctx: UIContext): HTMLElement {
  const { state } = ctx;
  const grid = el('div', { class: 'shopGrid' });

  const render = () => {
    clear(grid);
    for (const sector of SECTORS) {
      const unlocked = state.unlockedSectors.has(sector.id);
      const affordable = state.credits >= sector.unlockCost;
      const resources = Object.entries(sector.resourceTable)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([id, weight]) => `${RESOURCES[id].name} ${Math.round(weight)}%`);
      grid.appendChild(el('div', {
        class: 'kpiCard',
        style: { display: 'flex', flexDirection: 'column', gap: '10px', opacity: unlocked ? '1' : '0.86' },
      }, [
        sectorPreview(sector.index, sector.nebula),
        el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
          el('b', { style: { fontFamily: 'Orbitron', fontSize: '13px' } }, [sector.name]),
          el('span', { class: 'badge' }, [`DANGER ${sector.danger}/5`]),
        ]),
        el('div', { class: 'mini' }, [sector.description]),
        el('div', { class: 'mini' }, [`Resources: ${resources.join(' · ')}`]),
        el('div', { class: 'mini' }, [`Hazard: ${sector.hazard.toUpperCase()} · Reward x${sector.rewardMultiplier}`]),
        el('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', marginTop: 'auto' } }, [
          unlocked
            ? el('b', { style: { color: '#00ff9d', fontFamily: 'JetBrains Mono' } }, ['UNLOCKED'])
            : el('b', { style: { color: affordable ? '#ffb700' : '#ff6b8a', fontFamily: 'JetBrains Mono' } }, [`${fmt(sector.unlockCost)} CR`]),
          el('button', {
            class: 'btn', style: { marginLeft: 'auto' },
            onclick: () => {
              if (!unlocked) {
                if (!state.unlockSector(sector.id)) {
                  audio.error();
                  ctx.notify('Not enough credits to chart this sector.', 'error');
                  return;
                }
                audio.purchase();
                ctx.notify(`${sector.name} charted and unlocked.`, 'success');
                ctx.save(); ctx.refresh(); render();
                return;
              }
              const design = state.ship;
              const stats = design.stats();
              if (stats.thrust <= 0) {
                audio.error();
                ctx.notify('Install at least one engine before launching.', 'error');
                return;
              }
              if (stats.miningDps <= 0 && stats.weaponDps <= 0) {
                ctx.notify('Warning: no mining laser or weapon installed.', 'error');
              }
              ctx.launch(sector);
            },
          }, [unlocked ? 'LAUNCH' : 'UNLOCK']),
        ]),
      ]));
    }
  };

  render();
  return el('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } }, [
    el('div', { class: 'panelHead' }, [
      el('h2', {}, ['SECTOR MAP']),
      el('span', { class: 'mini' }, ['Deeper sectors pay more but field heavier opposition.']),
    ]),
    grid,
  ]);
}
