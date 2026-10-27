/**
 * Headless Chromium harness used for automated rendering tests and screenshots.
 * The sandbox has no GPU; we run Chromium's bundled SwiftShader (software WebGL2).
 * The binary is decompressed from the @sparticuz/chromium npm package into /tmp.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';

const LIBDIR = '/tmp/chlibs';
const BIN = '/tmp/chromium-ahs';

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

export function prepareChromium() {
  const pkg = path.join(process.cwd(), 'node_modules/@sparticuz/chromium/bin');
  if (!fs.existsSync(BIN)) {
    const data = zlib.brotliDecompressSync(fs.readFileSync(path.join(pkg, 'chromium.br')));
    fs.writeFileSync(BIN, data);
    fs.chmodSync(BIN, 0o755);
  }
  ensureDir(LIBDIR);
  const mark = path.join(LIBDIR, '.ready');
  if (!fs.existsSync(mark)) {
    for (const [src, dst] of [['al2023.tar.br', LIBDIR], ['swiftshader.tar.br', '/tmp']]) {
      const tar = zlib.brotliDecompressSync(fs.readFileSync(path.join(pkg, src)));
      const tmpTar = path.join('/tmp', src.replace('.br', ''));
      fs.writeFileSync(tmpTar, tar);
      execFileSync('tar', ['xf', tmpTar, '-C', dst]);
    }
    fs.writeFileSync(mark, 'ok');
  }
  // The swiftshader libs are extracted into /tmp root; make sure 8.3 names exist.
  process.env.LD_LIBRARY_PATH = `${LIBDIR}/lib:/tmp:${process.env.LD_LIBRARY_PATH || ''}`;
  return BIN;
}

export async function launchBrowser({ width = 1280, height = 720, timeout = 180000 } = {}) {
  const executablePath = prepareChromium();
  const { default: puppeteer } = await import('puppeteer-core');
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    protocolTimeout: timeout,
    defaultViewport: { width, height },
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu-sandbox',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--disable-features=Vulkan',
      '--mute-audio',
      '--js-flags=--max-old-space-size=1536',
      `--window-size=${width},${height}`,
    ],
  });
  return browser;
}

export async function openGame(browser, url, { logs = true } = {}) {
  const page = await browser.newPage();
  const messages = [];
  page.on('console', (m) => {
    const t = `[${m.type()}] ${m.text()}`;
    messages.push(t);
    if (logs) console.log(t);
  });
  page.on('pageerror', (e) => {
    const t = `[pageerror] ${e.message}`;
    messages.push(t);
    if (logs) console.log(t);
  });
  page.on('requestfailed', (r) => {
    const t = `[requestfailed] ${r.url()} ${r.failure()?.errorText}`;
    messages.push(t);
    if (logs) console.log(t);
  });
  page.messages = messages;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  return page;
}

export async function waitFor(page, fn, { timeout = 120000, interval = 250 } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      if (await page.evaluate(fn)) return true;
    } catch (e) {
      /* page might be mid-navigation */
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error('waitFor timed out');
}
