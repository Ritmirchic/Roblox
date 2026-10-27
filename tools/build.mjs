/** Bundles the game into release/web (production) or returns a dev bundle in memory. */
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';

export const ROOT = process.cwd();

export async function bundle({ minify = true, outfile = null, sourcemap = false, entry = 'src/main.js' } = {}) {
  const opts = {
    entryPoints: [path.join(ROOT, entry)],
    bundle: true,
    format: 'iife',
    target: ['chrome110'],
    minify,
    sourcemap,
    write: false,
    legalComments: 'none',
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': minify ? '"production"' : '"development"' },

  };
  const result = await esbuild.build(opts);
  const code = result.outputFiles[0].contents;
  if (outfile) {
    fs.mkdirSync(path.dirname(outfile), { recursive: true });
    fs.writeFileSync(outfile, code);
  }
  const warnings = result.warnings?.map((w) => w.text) || [];
  return { code, warnings };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const outDir = path.join(ROOT, 'release/web');
  fs.mkdirSync(outDir, { recursive: true });
  const { code, warnings } = await bundle({ minify: true, outfile: path.join(outDir, 'game.js') });
  fs.writeFileSync(path.join(outDir, 'index.html'), productionHtml());
  fs.copyFileSync(path.join(ROOT, 'web/styles.css'), path.join(outDir, 'styles.css'));
  if (fs.existsSync(path.join(ROOT, 'assets'))) {
    fs.cpSync(path.join(ROOT, 'assets'), path.join(outDir, 'assets'), { recursive: true });
  }
  console.log(`bundled ${(code.length / 1024).toFixed(1)} kB -> release/web/game.js`);
  if (warnings.length) console.log(warnings.join('\n'));
}

function productionHtml() {
  const html = fs.readFileSync(path.join(ROOT, 'web/index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'web/styles.css'), 'utf8');
  return html
    .replace('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n</style>`)
    .replace('<script src="game.js" defer></script>', '<script src="game.js" defer></script>');
}
