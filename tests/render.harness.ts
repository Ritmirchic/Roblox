/** Headless canvas harness: renders the real UI to PNGs using @napi-rs/canvas. */
import { createCanvas, type Canvas } from '@napi-rs/canvas';

export interface FakeCanvas extends Canvas {
  style: Record<string, string>;
  addEventListener: (...args: unknown[]) => void;
  getBoundingClientRect: () => { left: number; top: number; width: number; height: number };
}

export interface Harness {
  canvas: FakeCanvas;
  app: unknown;
  png(): Buffer;
}

const noop = (): void => undefined;

export const installFakeDom = (): void => {
  const g = globalThis as unknown as Record<string, unknown>;
  const canvas = createCanvas(1600, 900) as unknown as FakeCanvas;
  canvas.style = {};
  canvas.addEventListener = noop;
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1600, height: 900 });
  (canvas as unknown as { setPointerCapture?: () => void }).setPointerCapture = noop;
  (canvas as unknown as { releasePointerCapture?: () => void }).releasePointerCapture = noop;

  const documentStub = {
    createElement: (tag: string) => {
      if (tag === 'canvas') return createCanvas(300, 150);
      return { style: {}, appendChild: noop, classList: { add: noop, remove: noop }, querySelector: () => null };
    },
    getElementById: () => null,
    addEventListener: noop,
    hidden: false,
  };
  g.document = documentStub;
  g.window = {
    addEventListener: noop,
    innerWidth: 1600,
    innerHeight: 900,
    devicePixelRatio: 1,
    setTimeout,
    clearInterval,
    setInterval,
    AudioContext: undefined,
  };
  const store = new Map<string, string>();
  g.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
  g.requestAnimationFrame = noop;
};

export const bootHarness = async (): Promise<Harness> => {
  installFakeDom();
  const mod = await import('../src/app/app');
  const canvas = createCanvas(1600, 900) as unknown as FakeCanvas;
  canvas.style = {};
  canvas.addEventListener = noop;
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1600, height: 900 });
  (canvas as unknown as { setPointerCapture?: () => void }).setPointerCapture = noop;
  (canvas as unknown as { releasePointerCapture?: () => void }).releasePointerCapture = noop;
  const app = new mod.App(canvas as unknown as HTMLCanvasElement);
  return {
    canvas,
    app,
    png: () => canvas.toBuffer('image/png'),
  };
};

export const frame = (harness: Harness, dt = 1 / 60): void => {
  const app = harness.app as {
    ui: { beginFrame: (dt: number) => void; drawTooltips: (ctx: unknown) => void; endFrame: () => void };
    render: (dt: number) => void;
    time: number;
  };
  app.ui.beginFrame(dt);
  app.render(dt);
  app.ui.drawTooltips(harness.canvas.getContext('2d'));
  app.ui.endFrame();
  app.time += dt;
};

export const click = (harness: Harness, x: number, y: number): void => {
  const app = harness.app as {
    ui: {
      onPointerMove: (x: number, y: number) => void;
      onPointerDown: (x: number, y: number) => void;
      onPointerUp: (x: number, y: number) => void;
    };
  };
  app.ui.onPointerMove(x, y);
  app.ui.onPointerDown(x, y);
  app.ui.onPointerUp(x, y);
};

export const move = (harness: Harness, x: number, y: number): void => {
  const app = harness.app as { ui: { onPointerMove: (x: number, y: number) => void } };
  app.ui.onPointerMove(x, y);
};
