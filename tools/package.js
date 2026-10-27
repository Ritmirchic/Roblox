#!/usr/bin/env node
// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// tools/package.js — builds the downloadable release archives.
//
//   node tools/package.js
//
// Produces, inside release/:
//   ASHES_OF_HUMANITY_WINDOWS.zip  the playable single-file game + launcher
//   ASHES_OF_HUMANITY_SOURCE.zip   the complete engine/story source tree
//   SHA256SUMS.txt                 checksums for both archives
//
// Requires the `zip` command (present on Linux/macOS and on Git Bash for
// Windows). Run `node tools/build.js` first: the archives copy dist/ as-is.
// ============================================================
import { execFileSync } from 'node:child_process';
import { cp, mkdir, rm, readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (...p) => path.join(root, 'release', ...p);
const stage = path.join(root, 'build', 'tmp', 'package');

const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;

const sha256 = async (file) => createHash('sha256').update(await readFile(file)).digest('hex');
const sizeOf = async (file) => (await stat(file)).size;

function zip(from, archive) {
  execFileSync('zip', ['-r', '-9', '-q', archive, '.'], { cwd: from });
}

await rm(stage, { recursive: true, force: true });
await mkdir(rel(), { recursive: true });

// ---------------------------------------------------------------- playable
const win = path.join(stage, 'windows', 'ASHES_OF_HUMANITY');
for (const dir of ['', 'screenshots']) await mkdir(path.join(win, dir), { recursive: true });

try {
  await stat(path.join(root, 'dist', 'ashes_of_humanity.html'));
} catch {
  throw new Error('dist/ashes_of_humanity.html is missing — run "node tools/build.js" first');
}

await cp(path.join(root, 'dist', 'ashes_of_humanity.html'), path.join(win, 'Ashes of Humanity.html'));
await cp(rel('PLAY.bat'), path.join(win, 'PLAY.bat'));
await cp(rel('README.txt'), path.join(win, 'README.txt'));
await cp(path.join(root, 'LICENSE.txt'), path.join(win, 'LICENSE.txt'));
const shots = (await import('node:fs')).readdirSync(rel('screenshots')).filter((f) => f.endsWith('.png')).sort();
for (const f of shots) await cp(rel('screenshots', f), path.join(win, 'screenshots', f));

// ---------------------------------------------------------------- source
const src = path.join(stage, 'source', 'ASHES_OF_HUMANITY_SOURCE');
await mkdir(src, { recursive: true });
for (const f of ['index.html', 'package.json', 'package-lock.json', 'README.md', 'LICENSE.txt', '.gitignore']) {
  await cp(path.join(root, f), path.join(src, f));
}
for (const dir of ['src', 'tools', 'dist']) {
  await cp(path.join(root, dir), path.join(src, dir), { recursive: true });
}

// ---------------------------------------------------------------- archives
const winZip = rel('ASHES_OF_HUMANITY_WINDOWS.zip');
const srcZip = rel('ASHES_OF_HUMANITY_SOURCE.zip');
await rm(winZip, { force: true });
await rm(srcZip, { force: true });
zip(path.dirname(win), winZip);
zip(path.dirname(src), srcZip);

const lines = [];
for (const file of [winZip, srcZip]) {
  const hash = await sha256(file);
  const size = await sizeOf(file);
  lines.push(`${hash}  ${path.basename(file)}`);
  console.log(`${path.basename(file).padEnd(34)} ${(size / 1048576).toFixed(2)} MB  ${hash.slice(0, 16)}…`);
}
await writeFile(rel('SHA256SUMS.txt'), lines.join('\n') + '\n');
console.log(`\nSHA256SUMS.txt written — version ${version}, ${shots.length} screenshots`);
await rm(stage, { recursive: true, force: true });
