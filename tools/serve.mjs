/** Dev/preview server: serves the game shell and an on-demand esbuild bundle. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { bundle, ROOT } from './build.mjs';

const PORT = Number(process.env.PORT || 8080);
const HOST = '0.0.0.0';
const cache = new Map();
const testCache = new Map();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

function newestMtime(dir) {
  let newest = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) newest = Math.max(newest, newestMtime(p));
    else newest = Math.max(newest, fs.statSync(p).mtimeMs);
  }
  return newest;
}

async function getBundle(entry = 'src/main.js') {
  const stamp = newestMtime(path.join(ROOT, 'src'));
  const hit = cache.get(entry);
  if (!hit || stamp > hit.stamp) {
    const t0 = Date.now();
    const res = await bundle({ minify: false, entry });
    cache.set(entry, { code: res.code, stamp });
    console.log(`[build] ${entry} ${(res.code.length / 1024).toFixed(0)} kB in ${Date.now() - t0} ms`);
  }
  return cache.get(entry).code;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const p = decodeURIComponent(url.pathname);
    if (p === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, mode: 'dev' }));
      return;
    }
    if (p === '/test.js') {
      const entry = String(url.searchParams.get('entry') || 'src/dev/worldtest.js').replace(/^\.?\//, '');
      const { bundle: bundleTest } = await import('./build.mjs');
      const out = await bundleTest({ minify: false, entry, sourcemap: false });
      res.writeHead(200, { 'Content-Type': MIME['.js'], 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
      res.end(out.code);
      return;
    }
    if (p === '/game.js') {
      const code = await getBundle();
      res.writeHead(200, {
        'Content-Type': MIME['.js'],
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(code);
      return;
    }
    let file;
    if (p === '/' || p === '/index.html') file = path.join(ROOT, 'web/index.html');
    else if (p === '/test.html') file = path.join(ROOT, 'web/test.html');
    else if (p === '/styles.css') file = path.join(ROOT, 'web/styles.css');
    else file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    });
    fs.createReadStream(file).pipe(res);
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end(String(err));
  }
});

server.listen(PORT, HOST, () => console.log(`ASHES OF HUMANITY dev server on http://${HOST}:${PORT}`));
