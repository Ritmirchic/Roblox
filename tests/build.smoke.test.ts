/**
 * Boots the real production bundle (docs/assets/*.js) inside jsdom with a
 * software canvas, then drives a few frames. This is the closest thing to a
 * browser smoke test we can run headlessly: if the shipped build throws on
 * startup, this fails.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { createCanvas } from '@napi-rs/canvas';

const DOCS = 'docs';
const assetsDir = join(DOCS, 'assets');
const hasBuild = existsSync(assetsDir);

const bundlePath = (): string => {
  const files = readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
  if (files.length === 0) throw new Error('no js asset in docs/assets');
  return join(assetsDir, files[0] as string);
};

describe.skipIf(!hasBuild)('production build', () => {
  it('ships an index.html that points at the built assets with the repo base path', () => {
    const html = readFileSync(join(DOCS, 'index.html'), 'utf8');
    expect(html).toContain('/Roblox/assets/');
    expect(html).not.toContain('/src/main.ts');
    expect(html).toContain('<canvas id="game"');
    expect(html).toContain('Wick');
    // No external font/CDN dependency: everything is local.
    expect(html).not.toMatch(/https?:\/\/(fonts|cdn|unpkg|jsdelivr)/);
  });

  it('boots the bundle, removes the boot overlay and renders frames', async () => {
    const dom = new JSDOM(
      `<!doctype html><html><body>
         <canvas id="game" width="1600" height="900"></canvas>
         <div id="boot"><div class="boot-inner"><h1>W</h1></div></div>
       </body></html>`,
      { pretendToBeVisual: true, url: 'https://ritmirchic.github.io/Roblox/' },
    );
    const { window } = dom;

    // jsdom has no canvas backend: hand it a real software 2D context.
    const contexts = new WeakMap<object, unknown>();
    const surfaces = new WeakMap<object, ReturnType<typeof createCanvas>>();
    // The software canvas only accepts its own surfaces, so unwrap DOM canvases.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unwrap = (value: unknown): any =>
      value && typeof value === 'object' && surfaces.has(value) ? surfaces.get(value) : value;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.HTMLCanvasElement.prototype as any).getContext = function getContext(this: HTMLCanvasElement) {
      let ctx = contexts.get(this);
      if (!ctx) {
        const surface = createCanvas(this.width || 300, this.height || 150);
        const raw = surface.getContext('2d') as unknown as {
          drawImage: (...args: unknown[]) => void;
          createPattern: (...args: unknown[]) => unknown;
        };
        raw.drawImage = ((orig) =>
          function patched(image: unknown, ...rest: unknown[]) {
            return orig.call(raw, unwrap(image), ...rest);
          })(raw.drawImage.bind(raw) as (...args: unknown[]) => void);
        raw.createPattern = ((orig) =>
          function patched(image: unknown, ...rest: unknown[]) {
            return orig.call(raw, unwrap(image), ...rest);
          })(raw.createPattern.bind(raw) as (...args: unknown[]) => unknown);
        surfaces.set(this, surface as unknown as ReturnType<typeof createCanvas>);
        ctx = raw;
        contexts.set(this, ctx);
        // Keep the DOM element's size in sync when the game sets width/height.
        Object.defineProperty(this, 'width', {
          get: () => surface.width,
          set: (v: number) => {
            surface.width = v;
          },
        });
        Object.defineProperty(this, 'height', {
          get: () => surface.height,
          set: (v: number) => {
            surface.height = v;
          },
        });
      }
      return ctx;
    };

    const frames: FrameRequestCallback[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length as unknown as void;
    };

    const g = globalThis as unknown as Record<string, unknown>;
    const restore: Record<string, unknown> = {
      window: g.window,
      document: g.document,
      localStorage: g.localStorage,
      requestAnimationFrame: g.requestAnimationFrame,
      performance: g.performance,
      HTMLElement: g.HTMLElement,
      HTMLCanvasElement: g.HTMLCanvasElement,
      Image: g.Image,
      MutationObserver: g.MutationObserver,
      Node: g.Node,
    };
    g.window = window;
    g.document = window.document;
    g.localStorage = window.localStorage;
    g.requestAnimationFrame = (window as unknown as { requestAnimationFrame: unknown }).requestAnimationFrame;
    g.HTMLElement = window.HTMLElement;
    g.HTMLCanvasElement = window.HTMLCanvasElement;
    g.Image = window.Image;
    g.MutationObserver = window.MutationObserver;
    g.Node = window.Node;

    const errors: unknown[] = [];
    const onError = (e: ErrorEvent): void => {
      errors.push(e.error ?? e.message);
    };
    window.addEventListener('error', onError as EventListener);

    const source = readFileSync(bundlePath(), 'utf8');
    // The bundle is an ES module with no imports; evaluating it as a data: URL
    // keeps module semantics without touching the filesystem again.
    const url = `data:text/javascript;base64,${Buffer.from(source, 'utf8').toString('base64')}`;
    await import(url);
    window.removeEventListener('error', onError as EventListener);

    expect(errors, 'startup errors').toEqual([]);

    // Boot overlay is dismissed.
    await new Promise((r) => setTimeout(r, 500));
    const boot = window.document.getElementById('boot');
    expect(boot === null || boot.classList.contains('boot-out')).toBe(true);

    // Drive 30 frames through requestAnimationFrame.
    let t = performance.now();
    for (let i = 0; i < 30; i++) {
      const cb = frames.shift();
      if (!cb) break;
      t += 16.7;
      cb(t);
    }
    expect(frames.length, 'animation loop keeps scheduling').toBeGreaterThan(0);

    const app = (window as unknown as { wickAndWane?: { screen: string; save: { version: number } } }).wickAndWane;
    expect(app, 'app exposed for debugging').toBeDefined();
    expect(app!.screen).toBe('menu');
    expect(app!.save.version).toBe(1);

    // Only now hand the globals back to the other test files.
    for (const [key, value] of Object.entries(restore)) g[key] = value;
    window.close();
  }, 20000);
});
