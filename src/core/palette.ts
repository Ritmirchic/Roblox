/** Shared colour language: candlelit gold, chimney ink, five sigil hues. */

export const COLORS = {
  ink: '#0b0d13',
  inkDeep: '#070810',
  inkSoft: '#141826',
  slate: '#1d2333',
  slateLight: '#2a3245',
  stone: '#3b4358',
  stoneLight: '#59627a',
  parchment: '#efe3c8',
  parchmentDim: '#cdbfa2',
  gold: '#f3c76b',
  goldBright: '#ffe6a6',
  goldDeep: '#b98536',
  ember: '#ff7a3d',
  frost: '#6fd6ff',
  verdant: '#7be08a',
  volt: '#ffd94a',
  umbral: '#b184ff',
  danger: '#ff5560',
  heal: '#7ff0b0',
  white: '#fdf8ee',
} as const;

export const FAMILY_COLORS = {
  ember: { base: '#ff7a3d', bright: '#ffd0a3', deep: '#8c2f14' },
  frost: { base: '#6fd6ff', bright: '#d3f4ff', deep: '#1d5b78' },
  verdant: { base: '#7be08a', bright: '#dcffd9', deep: '#256b39' },
  volt: { base: '#ffd94a', bright: '#fff3bd', deep: '#8a6a10' },
  umbral: { base: '#b184ff', bright: '#ecdcff', deep: '#43256f' },
} as const;

export type FamilyId = keyof typeof FAMILY_COLORS;

export const RARITY_COLORS: Record<string, { base: string; glow: string }> = {
  common: { base: '#a9b4c9', glow: 'rgba(169,180,201,0.35)' },
  uncommon: { base: '#7be08a', glow: 'rgba(123,224,138,0.35)' },
  rare: { base: '#6fd6ff', glow: 'rgba(111,214,255,0.4)' },
  mythic: { base: '#f3c76b', glow: 'rgba(243,199,107,0.5)' },
};

/** Parse #rrggbb into [r,g,b]. */
export const hexToRgb = (hex: string): [number, number, number] => {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const rgba = (hex: string, alpha: number): string => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
};

export const mixHex = (a: string, b: string, t: number): string => {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1)}`;
};

/** Shift a hex colour's lightness by `amount` (-1..1). */
export const shade = (hex: string, amount: number): string =>
  amount >= 0 ? mixHex(hex, '#ffffff', amount) : mixHex(hex, '#000000', -amount);

export const FONT_DISPLAY = '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif';
export const FONT_BODY = '"Trebuchet MS", "Segoe UI", system-ui, -apple-system, sans-serif';
export const FONT_MONO = '"Consolas", "SF Mono", ui-monospace, monospace';
