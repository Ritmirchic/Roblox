/**
 * Procedural vector icon set. Everything is generated as inline SVG so the
 * build ships without image assets and stays crisp at any resolution.
 * No emoji, no external fonts.
 */

const wrap = (inner, { size = 24, stroke = '#cfd6d3', fill = 'none', sw = 1.4 } = {}) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

const SHAPES = {
  // --- weapons -----------------------------------------------------------
  pistol: `<path d="M2.5 8.5h13l2.4 2.2v2.1h-5.6l-1.2 3.1H8.6l1-3.1H5.2L4 15.9H2v-4.2z"/><path d="M4.6 12.9l-.9 3h2.1"/><path d="M14.6 8.7v4"/>`,
  smg: `<path d="M3 9h12l3 1.8v2.2H9.2l-1.4 4H5.4l.6-4H3z"/><path d="M9 9V6.7h4.6V9"/><path d="M13.4 13v2.4"/>`,
  rifle: `<path d="M1.6 10.4h15.2l3.4 1.4v1.9h-6.7l-1.7 3.4h-2.5l.8-3.4H6.6L5 17.3H2.4l1-3.7H1.6z"/><path d="M10.4 8.3h6.8"/><circle cx="17.4" cy="9.4" r="1.4"/>`,
  shotgun: `<path d="M1.8 10.8h14.4l4.6.7v1.7l-5.4.5H8.2l-1.6 3.5H4.1l.7-3.5H1.8z"/><path d="M9.2 12.2h4.6"/>`,
  crossbow: `<path d="M3 12h18"/><path d="M8.4 6.4C6.2 8 5 9.8 4.6 12c.4 2.2 1.6 4 3.8 5.6"/><path d="M9 10.6l2.4 1.4-2.4 1.4z"/>`,
  knife: `<path d="M4 18.6l3.2-.7 10-10.2 1.9-3.9-3.8 1.7-10.2 10z"/><path d="M6.6 16.4l1.4 1.4"/>`,
  axe: `<path d="M11 6.6l9.6 12.2"/><path d="M6.4 3.2c3.4-.5 6.2.7 8.3 3.3-1.5 2-3.6 3-6.2 3.1-1.4-1.4-2.1-3.6-2.1-6.4z"/>`,
  wrench: `<path d="M14 4.3a5 5 0 00-1.6 8.3L4 21l2 2 8.4-8.4a5 5 0 006.3-6.4l-3 3-2.6-2.6z"/>`,
  bullet: `<path d="M9.4 2.4h5.2l.7 4.2v11.4H8.7V6.6z"/><path d="M8.7 18h6.6v3.6H8.7z"/>`,
  shell: `<path d="M9 3h6v8.4l-1.2 9.6h-3.6L9 11.4z"/><path d="M9 8.4h6"/>`,
  bolt: `<path d="M4.6 19.4l13-13.6"/><path d="M15.2 3.4l5 5-4.2 1.4-2.2-2.2z"/>`,
  // --- consumables -------------------------------------------------------
  can: `<path d="M7 5.2h10v13.6H7z"/><path d="M7 8.2h10"/><path d="M7 16h10"/><path d="M9.2 5.2V3.4h5.6v1.8"/>`,
  bottle: `<path d="M10 2.6h4v3.2l1.6 2.4v12.2H8.4V8.2L10 5.8z"/><path d="M8.4 12.4h7.2"/>`,
  pill: `<path d="M8.6 4.6a4.4 4.4 0 016.2 0l4.6 4.6a4.4 4.4 0 01-6.2 6.2L8.6 10.8a4.4 4.4 0 010-6.2z"/><path d="M7.2 10.4l6.2 6.2"/>`,
  bandage: `<rect x="3.2" y="9" width="17.6" height="6" rx="3"/><path d="M9.4 12h5.2M12 9.4v5.2"/>`,
  bag: `<path d="M5 8h14l-1.4 12H6.4z"/><path d="M9 8V6.2a3 3 0 016 0V8"/>`,
  // --- gear --------------------------------------------------------------
  gear: `<circle cx="12" cy="12" r="3.4"/><path d="M12 2.4v3M12 18.6v3M2.4 12h3M18.6 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"/>`,
  circuit: `<rect x="4" y="4" width="16" height="16" rx="1.4"/><path d="M8 8h3v3H8zM13 8h3M13 11h3v3h-3zM8 14h3v3H8zM11 15.5h2"/>`,
  battery: `<rect x="3.4" y="7.4" width="14.2" height="9.2" rx="1.2"/><path d="M17.6 10.4h3v3.2h-3"/><path d="M6.6 12h3.4M8.3 10.3v3.4M12.6 12h3"/>`,
  mask: `<path d="M4 8.4c3-1.4 5.6-2.1 8-2.1s5 .7 8 2.1v4.2c0 3.3-3.6 6-8 6s-8-2.7-8-6z"/><circle cx="8.8" cy="11.6" r="1.7"/><circle cx="15.2" cy="11.6" r="1.7"/><path d="M9.6 16.2c1.6.7 3.2.7 4.8 0"/>`,
  keepsake: `<path d="M6 3.6h9l3.4 3.4v13.4H6z"/><path d="M9.4 3.6v3.2h5.2V3.6"/><path d="M9 12h6M9 15.4h6"/>`,
  grenade: `<path d="M9.4 7.2h5.2l1.4 3.2v9.4H8v-9.4z"/><path d="M10.4 4.6h3.2v2.6h-3.2z"/><path d="M13.6 4.6l3.4-1.6"/>`,
  scope: `<circle cx="12" cy="12" r="6.4"/><path d="M12 2.6v3.4M12 18v3.4M2.6 12h3.4M18 12h3.4"/><path d="M9.4 12h5.2M12 9.4v5.2"/>`,
  key: `<circle cx="8" cy="8" r="4.2"/><path d="M11 11l8.4 8.4"/><path d="M16.2 16.2l2-2 1.8 1.8"/>`,
  paper: `<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4.4h4"/><path d="M8.6 12h6.8M8.6 15.4h6.8"/>`,
  fuel: `<path d="M6 3.4h8v17.2H6z"/><path d="M8.4 6.4h3.2v4H8.4z"/><path d="M14 8l4 3.4v6.6a2 2 0 01-4 0"/>`,
  cloth: `<path d="M4 6.4l4-2.4 8 1.6 4 3-3 4.2 1 7.4-6.6 1.4L6 19l.8-6.2z"/>`,
  scrap: `<path d="M3.4 14.4l5-8.8 5.4 2.2 6.8 1.2-2 8.4-7.4 3z"/><path d="M8.4 5.6l2.3 5.6 9 3"/>`,
  // --- ui glyphs ---------------------------------------------------------
  heart: `<path d="M12 20.4S3.6 15.2 3.6 9.4A4.8 4.8 0 0112 6.4a4.8 4.8 0 018.4 3c0 5.8-8.4 11-8.4 11z"/>`,
  drop: `<path d="M12 2.8S5.2 10 5.2 14.4A6.8 6.8 0 0012 21.2a6.8 6.8 0 006.8-6.8C18.8 10 12 2.8 12 2.8z"/>`,
  food: `<path d="M7 2.6v8.2M9.6 2.6v8.2M7 8h2.6M8.3 10.8v10.6"/><path d="M15.4 2.8c2 0 3 2 3 5.2s-1.4 4.2-2.4 4.4v8.4"/>`,
  boltEnergy: `<path d="M13.4 2.4L5 13.6h5.4l-1.2 8 8.6-11.6h-5.4z"/>`,
  radiation: `<circle cx="12" cy="12" r="2.2"/><path d="M12 2.6a9.4 9.4 0 018.1 4.7l-5 3A3.6 3.6 0 0012 8.4z"/><path d="M3.9 7.3A9.4 9.4 0 0112 2.6v5.8a3.6 3.6 0 00-3.1 1.9z"/><path d="M20.1 7.3a9.4 9.4 0 01-1.9 12.9l-3.4-4.6a3.6 3.6 0 001.2-4.8z"/><path d="M3.9 7.3l5 3a3.6 3.6 0 00-.8 2.1 3.6 3.6 0 00.8 2.2L5.4 20a9.4 9.4 0 01-1.5-12.7z"/>`,
  biohazard: `<circle cx="12" cy="12.4" r="2.6"/><path d="M12 9.8V6.2a4 4 0 014-4M10 13.8l-3 2.4a4 4 0 000 4.6M14 13.8l3 2.4a4 4 0 010 4.6"/><circle cx="12" cy="4.2" r="1.4"/><circle cx="6.4" cy="19.2" r="1.4"/><circle cx="17.6" cy="19.2" r="1.4"/>`,
  wound: `<path d="M4 12h5l2-5 2 10 2-5h5"/>`,
  cold: `<path d="M12 2.6v18.8M4 7.4l16 9.2M20 7.4L4 16.6"/><path d="M9.4 4.6L12 7l2.6-2.4M9.4 19.4L12 17l2.6 2.4"/>`,
  infection: `<circle cx="12" cy="12" r="8.6"/><circle cx="9" cy="10" r="1.4"/><circle cx="15" cy="10.4" r="1.2"/><circle cx="12" cy="15.4" r="1.6"/><path d="M4 4l3 3M20 4l-3 3M4 20l3-3M20 20l-3-3"/>`,
  compass: `<circle cx="12" cy="12" r="9"/><path d="M15.4 8.6l-2.2 5.4-5.4 2.2 2.2-5.4z"/>`,
  clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5.4l3.4 2"/>`,
  map: `<path d="M3 6.4l6-2.6 6 2.6 6-2.6v14l-6 2.6-6-2.6-6 2.6z"/><path d="M9 3.8v14M15 6.4v14"/>`,
  quest: `<path d="M6 3.6h12v17.2H6z"/><path d="M9 8.4h6M9 12h6M9 15.6h3.4"/>`,
  skill: `<path d="M12 3.2l2.8 5.6 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2-4.5-4.4 6.2-.9z"/>`,
  craft: `<path d="M4 20l6-6"/><path d="M14.6 3.4a4.6 4.6 0 00-1.4 7.6l-1.8 1.8 3.8 3.8 1.8-1.8a4.6 4.6 0 007.6-1.4l-3.2-2.4-2.6-2.6z"/>`,
  build: `<path d="M3.4 20.6V9.2L12 3.4l8.6 5.8v11.4z"/><path d="M9.2 20.6v-6.4h5.6v6.4"/>`,
  settings: `<circle cx="12" cy="12" r="3.2"/><path d="M12 2.6v2.8M12 18.6v2.8M2.6 12h2.8M18.6 12h2.8M5.4 5.4l2 2M16.6 16.6l2 2M18.6 5.4l-2 2M7.4 16.6l-2 2"/>`,
  ammo: `<path d="M6 8h12v11.4H6z"/><path d="M8.4 8V4.6h7.2V8"/><path d="M8.4 12.6h7.2"/>`,
  armor: `<path d="M12 2.8l8 3v6.4c0 4.8-3.4 8.4-8 9.6-4.6-1.2-8-4.8-8-9.6V5.8z"/>`,
  skull: `<path d="M12 2.8c4.4 0 7.6 3 7.6 7.2 0 2.5-1 4.2-2.6 5.4v3.4H7v-3.4C5.4 14.2 4.4 12.5 4.4 10c0-4.2 3.2-7.2 7.6-7.2z"/><circle cx="9.2" cy="10.2" r="1.5"/><circle cx="14.8" cy="10.2" r="1.5"/><path d="M10.6 16.4h2.8v2.4h-2.8z"/>`,
  camp: `<path d="M12 4.4L2.8 20h18.4z"/><path d="M12 4.4V20M9 20l3-6 3 6"/>`,
  shelter: `<path d="M3.4 11L12 3.6 20.6 11"/><path d="M5.8 11v9.4h12.4V11"/><path d="M10 20.4v-5.2h4v5.2"/>`,
  ruins: `<path d="M3 20.6V9.4h4V4.6h5v6.2h4v-3h5v12.8z"/><path d="M8 13.4h2M14 13.4h2"/>`,
  tree: `<path d="M12 2.6l5 7.6h-3.2l4 6h-4.4l3 4.4H7.6l3-4.4H6.2l4-6H7z"/><path d="M12 20.6v1.6"/>`,
  factory: `<path d="M2.8 20.6V10l5 3V10l5 3V4.6h3v9.4l5-3v9.6z"/><path d="M6.6 20.6v-3h2v3M12 20.6v-3h2v3"/>`,
  city: `<path d="M2.6 20.6V8.4h5.2v12.2M7.8 20.6V4.6h6.4v16M14.2 20.6V10h6.2v10.6"/><path d="M10 8h2M10 11.6h2M10 15.2h2"/>`,
  wasteland: `<path d="M2.6 18.4h18.8"/><path d="M5 18.4c1.2-3.6 3-5.4 7-5.4s5.8 1.8 7 5.4"/><path d="M12 6.2v4.2M9.4 3.2l2.6 3 2.6-3"/>`,
  tower: `<path d="M6.4 20.6l2-16.2h7.2l2 16.2z"/><path d="M9 9h6M8.2 14.6h7.6M11 4.4V1.8h2v2.6"/>`,
  monster: `<path d="M4.4 10.4a7.6 7.6 0 0115.2 0v5.2L17 13v7.6h-3v-4h-4v4H7V13l-2.6 2.6z"/><circle cx="9.2" cy="10" r="1.3"/><circle cx="14.8" cy="10" r="1.3"/>`,
  boss: `<path d="M12 2.6l8.4 4v6.6c0 4.8-3.6 8.4-8.4 8.6-4.8-.2-8.4-3.8-8.4-8.6V6.6z"/><path d="M12 7.4l1.8 3.4 3.6.6-2.6 2.6.6 3.6-3.4-1.8-3.4 1.8.6-3.6-2.6-2.6 3.6-.6z"/>`,
  play: `<path d="M7 4l12 8-12 8z"/>`,
  save: `<path d="M4 4h12.6L20 7.4V20H4z"/><path d="M7.4 4v5.2h8V4"/><path d="M7.4 20v-6.4h9.2V20"/>`,
  close: `<path d="M5.4 5.4l13.2 13.2M18.6 5.4L5.4 18.6"/>`,
  chevron: `<path d="M9 5.4L15.6 12 9 18.6"/>`,
  plus: `<path d="M12 5v14M5 12h14"/>`,
  check: `<path d="M4.6 12.6l5 5L19.4 6.6"/>`,
  lock: `<rect x="4.6" y="10.4" width="14.8" height="10.2" rx="1.6"/><path d="M8.2 10.4V7.6a3.8 3.8 0 017.6 0v2.8"/>`,
  flame: `<path d="M12 2.6c3.4 4 5.6 6.4 5.6 9.6a5.6 5.6 0 01-11.2 0c0-1.8.8-3.4 2-4.8.4 1.4 1.2 2.2 2.2 2.4-.4-2.6 0-4.8 1.4-7.2z"/>`,
  water: `<path d="M2.6 13.4c2.4-2 4.4-2 6.2 0s4 2 6.2 0 4.2-2 6.4 0"/><path d="M2.6 17.8c2.4-2 4.4-2 6.2 0s4 2 6.2 0 4.2-2 6.4 0"/>`,
  temp: `<path d="M10.4 13.6V4.8a1.6 1.6 0 013.2 0v8.8a4 4 0 11-3.2 0z"/><path d="M12 9.4v7"/>`,
  xp: `<path d="M4 20l8-16 8 16z"/><path d="M8 14h8"/>`,
  sound: `<path d="M4 9.4h3.6L13 5v14l-5.4-4.4H4z"/><path d="M16.4 8.6a5 5 0 010 6.8M19 6a8.6 8.6 0 010 12"/>`,
  bagGrid: `<rect x="3.4" y="3.4" width="7" height="7" rx="1"/><rect x="13.6" y="3.4" width="7" height="7" rx="1"/><rect x="3.4" y="13.6" width="7" height="7" rx="1"/><rect x="13.6" y="13.6" width="7" height="7" rx="1"/>`,
  radio: `<rect x="3" y="8.6" width="18" height="11.4" rx="1.6"/><path d="M8.4 8.6V5.2l6.6-2"/><circle cx="8.6" cy="14.4" r="2.2"/><path d="M14 12.4h4.4M14 15.4h4.4M14 18.4h2.6"/>`,
};

/** Item icon (`icon: {shape, color}` in the item database). */
export function itemIcon(icon = {}, size = 40) {
  const shape = SHAPES[icon.shape] ? icon.shape : 'scrap';
  const color = icon.color || '#b9b9ae';
  return wrap(SHAPES[shape], { size, stroke: color, sw: 1.35 });
}

export function uiIcon(name, size = 20, color = 'currentColor') {
  return wrap(SHAPES[name] || SHAPES.gear, { size, stroke: color, sw: 1.5 });
}

export const ICON_NAMES = Object.keys(SHAPES);
