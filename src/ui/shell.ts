/**
 * UI shell: top status bar, navigation rail, panel host, toast stack and modal host.
 */
import { el, clear, fmt } from './dom.ts';
import { audio } from '../core/audio.ts';
import type { GameState } from '../sim/gamestate.ts';

export type PanelId =
  | 'hangar' | 'builder' | 'shop' | 'crew' | 'packs' | 'achievements'
  | 'upgrades' | 'sectors' | 'stats' | 'settings';

export interface NavItem {
  id: PanelId;
  label: string;
  icon: string;
}

const NAV: NavItem[] = [
  { id: 'hangar', label: 'HANGAR BAY', icon: 'H' },
  { id: 'builder', label: 'SHIP BUILDER', icon: 'B' },
  { id: 'shop', label: 'EQUIPMENT SHOP', icon: 'E' },
  { id: 'crew', label: 'CREW COLLECTION', icon: 'C' },
  { id: 'packs', label: 'CARD PACKS', icon: 'P' },
  { id: 'achievements', label: 'ACHIEVEMENTS', icon: 'A' },
  { id: 'upgrades', label: 'ACTIVE UPGRADES', icon: 'U' },
  { id: 'sectors', label: 'SECTOR MAP', icon: 'S' },
  { id: 'stats', label: 'LOGBOOK', icon: 'L' },
  { id: 'settings', label: 'SETTINGS', icon: 'O' },
];

export class Shell {
  root: HTMLElement;
  layer: HTMLElement;
  topbar: HTMLElement;
  sidebar: HTMLElement;
  panelHost: HTMLElement;
  toastStack: HTMLElement;
  modalHost: HTMLElement;
  current: PanelId = 'hangar';
  onNavigate: ((id: PanelId) => void) | null = null;

  private creditsEl: HTMLElement;
  private crystalsEl: HTMLElement;
  private crewEl: HTMLElement;
  private cargoEl: HTMLElement;
  private navButtons = new Map<PanelId, HTMLElement>();
  private state: GameState;

  constructor(root: HTMLElement, state: GameState) {
    this.root = root;
    this.state = state;
    this.layer = el('div', { class: 'ui-layer' });

    this.creditsEl = el('b', {}, ['0']);
    this.crystalsEl = el('b', {}, ['0']);
    this.crewEl = el('b', {}, ['0/0']);
    this.cargoEl = el('b', {}, ['0']);

    this.topbar = el('div', { class: 'topbar' }, [
      el('div', { class: 'brand' }, [el('span', {}, ['SPACE MINER']), ': BUILD & CONQUER']),
      el('div', { class: 'stats' }, [
        el('div', { class: 'pill gold', title: 'Credits - earned from ore and bounties' }, ['CR ', this.creditsEl]),
        el('div', { class: 'pill crystal', title: 'Crystals - earned from achievements, spent on card packs' }, ['CRYSTALS ', this.crystalsEl]),
        el('div', { class: 'pill', title: 'Equipped crew / unlocked crew slots' }, ['CREW ', this.crewEl]),
        el('div', { class: 'pill', title: 'Ore stored in the hangar silo' }, ['SILO ', this.cargoEl]),
      ]),
    ]);

    this.sidebar = el('div', { class: 'sidebar' });
    for (const item of NAV) {
      const btn = el('button', {
        class: 'navbtn',
        onclick: () => { audio.uiClick(); this.navigate(item.id); },
        onmouseenter: () => audio.uiHover(),
      }, [
        el('div', { class: 'navico' }, [item.icon]),
        el('span', {}, [item.label]),
      ]);
      this.navButtons.set(item.id, btn);
      this.sidebar.appendChild(btn);
    }
    this.sidebar.appendChild(el('div', { style: { flex: '1' } }));
    this.sidebar.appendChild(el('div', { class: 'mini', style: { padding: '8px', lineHeight: '1.6' } }, [
      'CAMERA: drag to orbit · wheel to zoom',
      el('br', {}),
      'BUILD: R rotate · click to place',
      el('br', {}),
      'FLIGHT: WASD · Space/C · Shift boost',
    ]));

    this.panelHost = el('div', { class: 'panel' });
    const layout = el('div', { class: 'layout' }, [this.sidebar, this.panelHost]);

    this.toastStack = el('div', { class: 'toastStack' });
    this.modalHost = el('div', { style: { position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: '60' } });

    this.layer.append(this.topbar, layout, this.toastStack, this.modalHost);
    root.appendChild(this.layer);
    this.refreshCurrencies();
  }

  navigate(id: PanelId): void {
    this.current = id;
    for (const [key, btn] of this.navButtons) btn.classList.toggle('active', key === id);
    this.onNavigate?.(id);
  }

  /** Hangar / builder panels let the 3D scene show through. */
  setPanelTransparent(transparent: boolean): void {
    this.panelHost.style.background = transparent ? 'transparent' : 'rgba(2,4,18,0.74)';
    this.panelHost.style.pointerEvents = transparent ? 'none' : 'auto';
    this.panelHost.style.backdropFilter = transparent ? 'none' : 'blur(10px)';
  }

  setPanel(content: HTMLElement): void {
    clear(this.panelHost);
    this.panelHost.appendChild(content);
    content.animate(
      [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: this.state.settings.reducedMotion ? 1 : 240, easing: 'cubic-bezier(.2,.8,.2,1)' },
    );
  }

  refreshCurrencies(): void {
    this.creditsEl.textContent = fmt(this.state.credits);
    this.crystalsEl.textContent = fmt(this.state.crystals);
    this.crewEl.textContent = `${this.state.equippedCrew.length}/${this.state.crewSlots}`;
    const silo = Object.values(this.state.ore).reduce((a, b) => a + b, 0);
    this.cargoEl.textContent = fmt(silo);
  }

  toast(message: string, kind: 'info' | 'error' | 'success' = 'info'): void {
    const colors = { info: 'rgba(0,229,255,0.25)', error: 'rgba(255,59,107,0.4)', success: 'rgba(0,255,157,0.35)' };
    const node = el('div', { class: 'toast', style: { borderColor: colors[kind] } }, [message]);
    this.toastStack.appendChild(node);
    node.animate(
      [{ opacity: 0, transform: 'translateX(24px)' }, { opacity: 1, transform: 'translateX(0)' }],
      { duration: this.state.settings.reducedMotion ? 1 : 200, easing: 'ease-out' },
    );
    setTimeout(() => {
      node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260 }).onfinish = () => node.remove();
    }, 3400);
    while (this.toastStack.children.length > 5) this.toastStack.firstChild?.remove();
  }

  /** Generic modal with a backdrop. Returns a close function. */
  modal(content: HTMLElement, options: { dismissable?: boolean; onClose?: () => void } = {}): () => void {
    const backdrop = el('div', { class: 'modalBackdrop', style: { pointerEvents: 'auto' } }, [content]);
    const close = () => {
      backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180 }).onfinish = () => backdrop.remove();
      options.onClose?.();
    };
    if (options.dismissable !== false) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) close();
      });
    }
    this.modalHost.appendChild(backdrop);
    backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: this.state.settings.reducedMotion ? 1 : 200 });
    return close;
  }

  confirm(title: string, body: string, confirmLabel = 'CONFIRM'): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value: boolean) => {
        if (settled) return;
        settled = true;
        close();
        resolve(value);
      };
      const content = el('div', { class: 'modal', style: { width: 'min(520px,94vw)', padding: '22px' } }, [
        el('h2', { style: { fontFamily: 'Orbitron', fontSize: '15px', letterSpacing: '0.1em', marginBottom: '12px' } }, [title]),
        el('p', { style: { opacity: '0.82', lineHeight: '1.6', marginBottom: '18px' } }, [body]),
        el('div', { style: { display: 'flex', gap: '10px', justifyContent: 'flex-end' } }, [
          el('button', { class: 'btn ghost', onclick: () => finish(false) }, ['CANCEL']),
          el('button', { class: 'btn', onclick: () => finish(true) }, [confirmLabel]),
        ]),
      ]);
      const close = this.modal(content, { onClose: () => finish(false) });
    });
  }
}
