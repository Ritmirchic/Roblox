// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// ui/icons.js — procedural vector icon set (no external assets)
// ============================================================

export const CAT_COLOR = {
  weapon: '#c9a05a', ammo: '#c2a06a', food: '#b07a4a', water: '#7aa6be',
  medicine: '#a3b784', materials: '#9c9a88', electronics: '#6fa392',
  quest: '#b08fc0', armor: '#93977f', equipment: '#a78f63',
};

export function catColor(def) {
  if (!def) return '#9c9a88';
  return CAT_COLOR[def.cat] || CAT_COLOR[def.type] || '#9c9a88';
}

const W = (body) => `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

const WEAPON_SHAPES = {
  knife: '<path d="M14 34 L30 10 L34 12 L20 36 Z"/><path d="M14 34 L10 40 L16 38 Z"/><path d="M17 31 L21 33"/>',
  pipe: '<path d="M12 38 L34 10"/><path d="M10 34 L16 40 L20 36 L14 30 Z"/><path d="M31 7 L39 15"/>',
  axe: '<path d="M20 40 L28 8"/><path d="M27 9 C36 8 41 14 40 20 C35 22 29 20 26 15 Z"/><path d="M17 37 L23 41"/>',
  machete: '<path d="M13 39 C22 30 32 20 40 8 C41 18 36 30 24 38 Z"/><path d="M12 38 L9 42"/><path d="M16 34 L20 38"/>',
  pistol: '<path d="M9 17 H34 V23 H19 L16 31 H11 Z"/><path d="M34 19 H39 V22 H34"/><path d="M9 17 V23"/><path d="M11 31 L14 37 H18 L16 31"/>',
  revolver: '<path d="M8 18 H33 V23 H22 L19 30 H12 Z"/><circle cx="24" cy="26" r="4"/><path d="M33 19 H40"/><path d="M12 30 L14 36 L18 36"/>',
  shotgun: '<path d="M4 22 H30 V26 H4 Z"/><path d="M30 21 L41 19 V25 L30 26"/><path d="M4 26 L11 33 H16 L14 26"/><path d="M17 26 L16 31"/>',
  rifle: '<path d="M3 23 H30 V26 H3 Z"/><path d="M30 22 L44 21 V25 L30 26"/><path d="M13 26 L11 32 H16 L18 26"/><path d="M20 19 H26 V22 H20"/><path d="M8 26 L6 30"/>',
  smg: '<path d="M8 19 H30 V24 H20 L18 30 H12 Z"/><path d="M12 24 L11 32 H15 L16 24"/><path d="M30 20 H36 V23 H30"/><path d="M22 24 V29"/>',
  bow: '<path d="M16 8 C30 16 30 32 16 40"/><path d="M16 8 L16 40"/><path d="M16 24 H40"/><path d="M36 21 L41 24 L36 27"/>',
};

const SHAPES = {
  ammo: '<rect x="12" y="16" width="7" height="20" rx="1"/><rect x="21" y="12" width="7" height="24" rx="1"/><rect x="30" y="16" width="7" height="20" rx="1"/><path d="M15.5 16 V12 M24.5 12 V8 M33.5 16 V12"/>',
  food: '<rect x="13" y="14" width="22" height="24" rx="2"/><path d="M13 20 H35 M13 32 H35"/><circle cx="24" cy="26" r="3"/>',
  water: '<path d="M19 8 H29 V15 L33 21 V38 A2 2 0 0 1 31 40 H17 A2 2 0 0 1 15 38 V21 L19 15 Z"/><path d="M15 27 H33"/><path d="M21 33 H27"/>',
  medicine: '<rect x="11" y="14" width="26" height="24" rx="3"/><path d="M24 19 V33 M17 26 H31"/>',
  materials: '<path d="M10 30 L24 12 L38 30 Z"/><path d="M16 30 L24 20 L32 30"/><path d="M8 36 H40"/>',
  electronics: '<rect x="13" y="13" width="22" height="22" rx="2"/><rect x="20" y="20" width="8" height="8"/><path d="M18 13 V8 M24 13 V8 M30 13 V8 M18 35 V40 M24 35 V40 M30 35 V40 M13 18 H8 M13 24 H8 M13 30 H8 M35 18 H40 M35 24 H40 M35 30 H40"/>',
  quest: '<path d="M12 12 H30 L36 18 V36 H12 Z"/><path d="M30 12 V18 H36"/><path d="M18 22 H30 M18 27 H28"/>',
  armor: '<path d="M16 10 L24 13 L32 10 L38 14 V22 C38 32 32 37 24 40 C16 37 10 32 10 22 V14 Z"/><path d="M24 14 V38"/>',
  equipment: '<path d="M14 18 H34 L32 40 H16 Z"/><path d="M14 18 C14 12 19 8 24 8 C29 8 34 12 34 18"/><path d="M20 24 H28"/>',
  default: '<rect x="12" y="12" width="24" height="24" rx="2"/><path d="M12 20 H36 M20 12 V36"/>',
};

export function itemIcon(id, def, opts = {}) {
  const size = opts.size || 34;
  let body = null;
  if (def && def.type && WEAPON_SHAPES[def.type]) body = WEAPON_SHAPES[def.type];
  else if (id && WEAPON_SHAPES[id]) body = WEAPON_SHAPES[id];
  if (!body && def) {
    if (def.cat === 'weapon' || def.type) {
      // fall back on the display class of the weapon id
      if (/shotgun/.test(id)) body = WEAPON_SHAPES.shotgun;
      else if (/rifle|ak/.test(id)) body = WEAPON_SHAPES.rifle;
      else if (/pistol|revolver/.test(id)) body = WEAPON_SHAPES.pistol;
      else if (/knife|axe|machete|pipe/.test(id)) body = WEAPON_SHAPES.knife;
    }
    if (!body) {
      const cat = def.cat || 'materials';
      if (cat === 'weapon') body = WEAPON_SHAPES.rifle;
      else if (/^ammo_/.test(id)) body = SHAPES.ammo;
      else body = SHAPES[cat] || SHAPES.default;
    }
  }
  if (!body) body = SHAPES.default;
  const color = opts.color || catColor(def);
  return `<span class="icon" style="width:${size}px;height:${size}px;color:${color}">${W(body)}</span>`;
}

// ---------------------------------------------------------------- status glyphs
const S = (body) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const STATUS_ICON = {
  health: S('<path d="M3 12 H7 L9 8 L12 16 L15 10 L17 12 H21"/>'),
  stamina: S('<path d="M13 3 L6 13 H11 L10 21 L18 10 H12 Z"/>'),
  hunger: S('<path d="M7 3 V11 M5 3 V8 M9 3 V8 M7 11 V21"/><path d="M16 3 C19 5 19 10 16 12 V21"/>'),
  thirst: S('<path d="M12 3 C12 3 6 10 6 14 A6 6 0 0 0 18 14 C18 10 12 3 12 3 Z"/>'),
  radiation: S('<circle cx="12" cy="12" r="2"/><path d="M12 10 C10 5 12 3 12 3 C13 5 13 7 12 10"/><path d="M14 13 C19 13 21 11 21 11 C19 12 17 14 14 13"/><path d="M10 13 C5 13 3 15 3 15 C5 14 7 12 10 13"/>'),
  infection: S('<circle cx="12" cy="12" r="7"/><circle cx="9" cy="10" r="1"/><circle cx="14" cy="9" r="1"/><circle cx="15" cy="14" r="1"/><circle cx="10" cy="15" r="1"/>'),
  temp: S('<path d="M10 4 A2 2 0 0 1 14 4 V14 A3.5 3.5 0 1 1 10 14 Z"/><path d="M12 8 V16"/>'),
  fatigue: S('<path d="M20 14 A8 8 0 1 1 10 4 A6 6 0 0 0 20 14 Z"/>'),
  stress: S('<path d="M3 12 H6 L8 7 L11 17 L14 5 L17 15 L19 12 H21"/>'),
  weight: S('<path d="M12 6 A2 2 0 1 0 12 10 A2 2 0 0 0 12 6"/><path d="M5 7 H9 M15 7 H19"/><path d="M6 7 L9 20 H15 L18 7"/>'),
  bleed: S('<path d="M12 3 C12 3 5 11 5 15 A7 7 0 0 0 19 15 C19 11 12 3 12 3 Z"/><path d="M9 15 H15"/>'),
};

export function statusIcon(name, size = 13) {
  return `<span class="st-ic" style="width:${size}px;height:${size}px">${STATUS_ICON[name] || STATUS_ICON.health}</span>`;
}

// ---------------------------------------------------------------- body map
// Front-facing figure used by the medical screen and the HUD damage readout.
export const BODY_PARTS = [
  { id: 'head', label: 'Head', x: 31, y: 6, w: 14, h: 18 },
  { id: 'torso', label: 'Torso', x: 27, y: 25, w: 22, h: 38 },
  { id: 'armL', label: 'Left Arm', x: 13, y: 26, w: 12, h: 40 },
  { id: 'armR', label: 'Right Arm', x: 51, y: 26, w: 12, h: 40 },
  { id: 'legL', label: 'Left Leg', x: 27, y: 63, w: 10, h: 58 },
  { id: 'legR', label: 'Right Leg', x: 39, y: 63, w: 10, h: 58 },
];

export function bodySvg(partClass = () => '') {
  const parts = BODY_PARTS.map((p) => {
    const head = p.id === 'head';
    const shape = head
      ? `<ellipse cx="${p.x + p.w / 2}" cy="${p.y + p.h / 2}" rx="${p.w / 2}" ry="${p.h / 2}"/>`
      : `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${p.id === 'torso' ? 5 : 4}"/>`;
    return `<g class="bp ${partClass(p.id)}" data-part="${p.id}">${shape}</g>`;
  }).join('');
  return `<svg viewBox="0 0 76 124" class="body-map">${parts}</svg>`;
}

// ---------------------------------------------------------------- misc glyphs
export const GLYPH = {
  arrowL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 5 L8 12 L15 19"/></svg>',
  arrowR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5 L16 12 L9 19"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6 L18 18 M18 6 L6 18"/></svg>',
  rotate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 12 A8 8 0 1 1 14 4"/><path d="M14 4 L10 1 M14 4 L10 7"/></svg>',
  sort: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7 H20 M6 12 H18 M9 17 H15"/></svg>',
  drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 4 V16 M7 11 L12 17 L17 11"/><path d="M4 20 H20"/></svg>',
  use: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12 H16 M12 7 L17 12 L12 17"/><path d="M19 4 V20"/></svg>',
  equip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 V15 M7 8 L12 3 L17 8"/><path d="M5 17 V20 H19 V17"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21 C12 21 19 14 19 9 A7 7 0 0 0 5 9 C5 14 12 21 12 21 Z"/><circle cx="12" cy="9" r="2.4"/></svg>',
  skull: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 11 A7 7 0 0 1 19 11 V15 L16 17 V20 H8 V17 L5 15 Z"/><circle cx="9.5" cy="11" r="1.4"/><circle cx="14.5" cy="11" r="1.4"/><path d="M10 17 V20 M14 17 V20"/></svg>',
  quest: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 8 V12 L15 14"/></svg>',
};

export function diamond(color = '#c9963f') {
  return `<svg viewBox="0 0 12 12" width="10" height="10"><path d="M6 0 L12 6 L6 12 L0 6 Z" fill="${color}"/></svg>`;
}
