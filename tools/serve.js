#!/usr/bin/env node
// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// tools/serve.js — static dev server (no dependencies)
//   node tools/serve.js [port]
// ============================================================
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2] || process.env.PORT || 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.zip': 'application/zip',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let file = decodeURIComponent(url.pathname);
    if (file === '/' || file === '') file = '/index.html';
    if (file.endsWith('/')) file += 'index.html';
    file = path.normalize(file).replace(/^(\.\.[/\\])+/, '');
    // the built game lives in dist/; fall back to the repo root for qa/ assets
    let abs = '';
    for (const base of [path.join(root, 'dist'), root]) {
      const candidate = path.join(base, file);
      if (!candidate.startsWith(base)) continue;
      const st = await stat(candidate).catch(() => null);
      if (st && st.isFile()) { abs = candidate; break; }
    }
    if (!abs) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
      return;
    }
    const body = await readFile(abs);
    res.writeHead(200, {
      'content-type': TYPES[path.extname(abs).toLowerCase()] || 'application/octet-stream',
      'content-length': body.length,
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    });
    res.end(body);
  } catch (e) {
    res.writeHead(500).end('server error');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`ASHES OF HUMANITY dev server → http://localhost:${port}/`);
  console.log(`serving ${root}`);
});
