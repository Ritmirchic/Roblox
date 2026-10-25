import { dist } from '../../core/math';

export const VIEW = { width: 1600, height: 900 } as const;
export const TOP_BAR = 74;
export const BOARD = { ox: 64, oy: 104, cols: 9, rows: 6, cell: 120 } as const;
export const WORLD_RECT = {
  x: 0,
  y: TOP_BAR,
  w: 1180,
  h: VIEW.height - TOP_BAR,
} as const;
export const SIDEBAR = { x: 1180, y: TOP_BAR, w: 420, h: VIEW.height - TOP_BAR } as const;

export interface Cell {
  col: number;
  row: number;
}

/** The only cells the procession walks through, in order. */
export const PATH_CELLS: Cell[] = [
  { col: 0, row: 1 },
  { col: 1, row: 1 },
  { col: 2, row: 1 },
  { col: 2, row: 2 },
  { col: 2, row: 3 },
  { col: 2, row: 4 },
  { col: 3, row: 4 },
  { col: 4, row: 4 },
  { col: 5, row: 4 },
  { col: 6, row: 4 },
  { col: 6, row: 3 },
  { col: 6, row: 2 },
  { col: 6, row: 1 },
  { col: 7, row: 1 },
  { col: 8, row: 1 },
  { col: 8, row: 2 },
  { col: 8, row: 3 },
  { col: 8, row: 4 },
  { col: 8, row: 5 },
];

export const cellCenter = (col: number, row: number): { x: number; y: number } => ({
  x: BOARD.ox + col * BOARD.cell + BOARD.cell / 2,
  y: BOARD.oy + row * BOARD.cell + BOARD.cell / 2,
});

export interface Plot {
  index: number;
  col: number;
  row: number;
  x: number;
  y: number;
  neighbors: number[];
}

const PLOT_CELLS: Cell[] = [
  { col: 1, row: 0 },
  { col: 3, row: 2 },
  { col: 0, row: 2 },
  { col: 1, row: 3 },
  { col: 3, row: 3 },
  { col: 4, row: 3 },
  { col: 5, row: 3 },
  { col: 7, row: 2 },
  { col: 7, row: 3 },
  { col: 5, row: 2 },
  { col: 7, row: 4 },
  { col: 8, row: 0 },
  { col: 7, row: 5 },
  { col: 3, row: 5 },
  { col: 1, row: 2 },
  { col: 4, row: 5 },
  { col: 5, row: 5 },
];

export const PLOTS: Plot[] = PLOT_CELLS.map((cell, index) => {
  const c = cellCenter(cell.col, cell.row);
  return {
    index,
    col: cell.col,
    row: cell.row,
    x: c.x,
    y: c.y,
    neighbors: [],
  };
});

// Orthogonally adjacent plots share a resonance link (+4% damage each).
for (const a of PLOTS) {
  for (const b of PLOTS) {
    if (a === b) continue;
    const dx = Math.abs(a.col - b.col);
    const dy = Math.abs(a.row - b.row);
    if (dx + dy === 1) a.neighbors.push(b.index);
  }
}

const pathPointList: { x: number; y: number }[] = [];
{
  const first = PATH_CELLS[0] as Cell;
  const firstCenter = cellCenter(first.col, first.row);
  pathPointList.push({ x: -48, y: firstCenter.y });
  for (const cell of PATH_CELLS) pathPointList.push(cellCenter(cell.col, cell.row));
}

export const PATH_POINTS = pathPointList;
export const HEARTH = (() => {
  const last = PATH_CELLS[PATH_CELLS.length - 1] as Cell;
  const c = cellCenter(last.col, last.row);
  return { x: c.x, y: c.y };
})();

export const SPAWN = { x: -60, y: (PATH_CELLS[0] as Cell).row * BOARD.cell + BOARD.oy + BOARD.cell / 2 };

const segments = (() => {
  const out: { ax: number; ay: number; bx: number; by: number; len: number; start: number }[] = [];
  let total = 0;
  for (let i = 0; i < PATH_POINTS.length - 1; i++) {
    const a = PATH_POINTS[i] as { x: number; y: number };
    const b = PATH_POINTS[i + 1] as { x: number; y: number };
    const len = dist(a.x, a.y, b.x, b.y);
    out.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y, len, start: total });
    total += len;
  }
  return { list: out, total };
})();

export const PATH_LENGTH = segments.total;

export interface PathSample {
  x: number;
  y: number;
  angle: number;
  /** 0..1 along the road */
  progress: number;
}

/** Sample the road at a distance from the entrance. */
export const samplePath = (distance: number): PathSample => {
  const d = Math.max(0, Math.min(PATH_LENGTH, distance));
  let seg = segments.list[segments.list.length - 1] as (typeof segments.list)[number];
  for (const s of segments.list) {
    if (d <= s.start + s.len + 0.001) {
      seg = s;
      break;
    }
  }
  const t = seg.len === 0 ? 0 : Math.max(0, Math.min(1, (d - seg.start) / seg.len));
  return {
    x: seg.ax + (seg.bx - seg.ax) * t,
    y: seg.ay + (seg.by - seg.ay) * t,
    angle: Math.atan2(seg.by - seg.ay, seg.bx - seg.ax),
    progress: PATH_LENGTH === 0 ? 1 : d / PATH_LENGTH,
  };
};

/** Distance from a point to the road polyline, for placement hints. */
export const distanceToPath = (x: number, y: number): number => {
  let best = Infinity;
  for (const s of segments.list) {
    const vx = s.bx - s.ax;
    const vy = s.by - s.ay;
    const lenSq = vx * vx + vy * vy;
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((x - s.ax) * vx + (y - s.ay) * vy) / lenSq));
    const px = s.ax + vx * t;
    const py = s.ay + vy * t;
    const d = Math.hypot(x - px, y - py);
    if (d < best) best = d;
  }
  return best;
};

/** How far along the road the closest point to (x,y) sits. */
export const nearestPathDistanceAlong = (x: number, y: number): number => {
  let best = Infinity;
  let bestAlong = 0;
  for (const s of segments.list) {
    const vx = s.bx - s.ax;
    const vy = s.by - s.ay;
    const lenSq = vx * vx + vy * vy;
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((x - s.ax) * vx + (y - s.ay) * vy) / lenSq));
    const px = s.ax + vx * t;
    const py = s.ay + vy * t;
    const d = Math.hypot(x - px, y - py);
    if (d < best) {
      best = d;
      bestAlong = s.start + t * s.len;
    }
  }
  return bestAlong;
};

/** Bounds used to fit the board on the canvas. */
export const boardBounds = { x: 20, y: TOP_BAR + 6, w: 1140, h: VIEW.height - TOP_BAR - 12 };
