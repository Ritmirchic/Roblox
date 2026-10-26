#!/usr/bin/env node
// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// tools/build.js — bundles the game with esbuild
//   node tools/build.js            production bundle + single-file build
//   node tools/build.js --dev      unminified bundle with sourcemap
// ============================================================
import { build, context } from 'esbuild';
import { mkdir, readFile, writeFile, copyFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dev = process.argv.includes('--dev');
const watch = process.argv.includes('--watch');

const outdir = path.join(root, 'dist');
await mkdir(outdir, { recursive: true });

const options = {
  entryPoints: [path.join(root, 'src/main.js')],
  bundle: true,
  format: 'esm',
  target: ['es2020'],
  outfile: path.join(outdir, 'game.js'),
  minify: !dev,
  sourcemap: dev ? 'inline' : false,
  legalComments: 'none',
  logLevel: 'info',
  loader: { '.glsl': 'text', '.wgsl': 'text' },
  define: { 'process.env.NODE_ENV': dev ? '"development"' : '"production"' },
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log('watching src/ …');
} else {
  const t0 = Date.now();
  await build(options);
  const ms = Date.now() - t0;

  // game page next to the bundle
  const html = await readFile(path.join(root, 'index.html'), 'utf8');
  const local = html.replace('./dist/game.js', './game.js');
  await writeFile(path.join(outdir, 'index.html'), local);

  // single self-contained file for sharing / offline play
  const js = await readFile(path.join(outdir, 'game.js'), 'utf8');
  // NB: use a replacer function. A replacement string would expand `$&`, `$'`
  // and friends that appear inside minified JS and silently corrupt the bundle.
  const single = local.replace('<script type="module" src="./game.js"></script>',
    () => `<script type="module">\n${js}\n</script>`);
  await writeFile(path.join(outdir, 'ashes_of_humanity.html'), single);

  const bundle = await stat(path.join(outdir, 'game.js'));
  const singleStat = await stat(path.join(outdir, 'ashes_of_humanity.html'));
  console.log(`\nbuilt in ${ms} ms`);
  console.log(`  dist/game.js                 ${(bundle.size / 1024).toFixed(0)} KB`);
  console.log(`  dist/index.html              ${(local.length / 1024).toFixed(0)} KB`);
  console.log(`  dist/ashes_of_humanity.html  ${(singleStat.size / 1024).toFixed(0)} KB  (single file)`);
}
