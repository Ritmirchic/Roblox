#!/usr/bin/env node
/**
 * Assembles the Windows release artifacts.
 *
 *   SPACE_MINER_WINDOWS.zip  - portable build (SpaceMiner.exe + game runtime)
 *   SPACE_MINER_SETUP.exe    - installer stub with the SMPACK payload appended
 *   SPACE_MINER_SOURCE.zip   - complete engine project source
 *
 * Run after `npm run build` and the native compile step (see scripts/build-release.sh).
 */
import { createHash } from 'node:crypto';
import {
  cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, appendFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const build = join(root, 'build');
const stage = join(build, 'stage');
const releaseDir = join(root, 'release');
const VERSION = '1.0.0';

const log = (msg) => console.log(`  ${msg}`);

function walk(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else out.push({ abs: full, rel: relative(base, full).split('\\').join('/') });
  }
  return out;
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function humanSize(bytes) {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// ------------------------------------------------------------------- staging
console.log('\n[1/6] staging the portable Windows build');
rmSync(stage, { recursive: true, force: true });
const appDir = join(stage, 'SpaceMiner');
mkdirSync(join(appDir, 'game'), { recursive: true });
cpSync(join(root, 'dist'), join(appDir, 'game'), { recursive: true });
cpSync(join(build, 'SpaceMiner.exe'), join(appDir, 'SpaceMiner.exe'));
cpSync(join(build, 'spaceminer.ico'), join(appDir, 'game', 'spaceminer.ico'));

const readme = `SPACE MINER: BUILD & CONQUER
Version ${VERSION} - Windows 64-bit

HOW TO PLAY
-----------
1. Keep every file in this folder together (SpaceMiner.exe needs the "game" folder).
2. Double-click SpaceMiner.exe.
3. The game opens in its own window. Close the window to quit.

The launcher starts a private runtime on 127.0.0.1 (your machine only) and renders the
game with hardware-accelerated WebGL through the Chromium engine already installed with
Windows (Microsoft Edge). If no Chromium-family browser is found, your default browser
is used instead.

CONTROLS
--------
HANGAR        Drag to orbit the camera, mouse wheel to zoom, click a station terminal.
SHIP BUILDER  Pick a module from the inventory, R rotates it, click a cell to place it.
              Click an installed module to remove it. Buy expansion cells to grow the grid.
EXPEDITION    W / S            thrust forward and reverse
              A / D            strafe
              Space / C        rise and descend
              Q / E            roll
              X                brake (inertial dampeners)
              Shift            boost
              Mouse            steer
              Left mouse       fire weapons
              Right mouse      fire mining lasers
              Esc              return to the hangar

PROGRESSION
-----------
- Every 10 purchased ship expansion cells unlock exactly 1 crew slot.
- Crystals come from achievements; spend them on crew card packs (3 cards per pack).
- Active upgrades: 3 slots by default, a 4th can be purchased, a 5th drops at 1 percent
  per completed expedition (maximum 5).
- Progress saves automatically and can be exported/reset from the Settings panel.

REQUIREMENTS
------------
Windows 10 or 11 (64-bit), a GPU with WebGL 2 support, 400 MB free disk space.

LICENSE
-------
MIT. See LICENSE.txt. Third-party notice: three.js (MIT), (c) 2010-2024 three.js authors.
`;
writeFileSync(join(appDir, 'README.txt'), readme.replace(/\n/g, '\r\n'));
cpSync(join(root, 'LICENSE'), join(appDir, 'LICENSE.txt'));
log(`staged ${walk(appDir).length} files`);

// ----------------------------------------------------------------- zip helper
function makeZip(sourceDir, outFile, contents) {
  rmSync(outFile, { force: true });
  execFileSync('zip', ['-r', '-q', '-9', outFile, ...contents], { cwd: sourceDir });
}

mkdirSync(releaseDir, { recursive: true });

console.log('[2/6] building SPACE_MINER_WINDOWS.zip');
const windowsZip = join(releaseDir, 'SPACE_MINER_WINDOWS.zip');
makeZip(stage, windowsZip, ['SpaceMiner']);
log(`${humanSize(statSync(windowsZip).size)}`);

// ------------------------------------------------------------ installer pack
console.log('[3/6] packing SPACE_MINER_SETUP.exe');
const payloadRoot = join(build, 'payload');
rmSync(payloadRoot, { recursive: true, force: true });
mkdirSync(payloadRoot, { recursive: true });
cpSync(appDir, payloadRoot, { recursive: true });
cpSync(join(build, 'uninstall.exe'), join(payloadRoot, 'uninstall.exe'));

const entries = walk(payloadRoot).sort((a, b) => a.rel.localeCompare(b.rel));
const setupExe = join(releaseDir, 'SPACE_MINER_SETUP.exe');
rmSync(setupExe, { force: true });
writeFileSync(setupExe, readFileSync(join(build, 'setup_stub.exe')));
const archiveOffset = statSync(setupExe).size;

for (const entry of entries) {
  const data = readFileSync(entry.abs);
  const pathBuf = Buffer.from(entry.rel, 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32LE(pathBuf.length, 0);
  const sizeBuf = Buffer.alloc(8);
  sizeBuf.writeBigUInt64LE(BigInt(data.length), 0);
  appendFileSync(setupExe, Buffer.concat([header, pathBuf, sizeBuf, data]));
}
const footer = Buffer.alloc(24);
footer.write('SMPACK01', 0, 'ascii');
footer.writeBigUInt64LE(BigInt(archiveOffset), 8);
footer.writeBigUInt64LE(BigInt(entries.length), 16);
appendFileSync(setupExe, footer);
log(`${entries.length} payload entries, ${humanSize(statSync(setupExe).size)}`);

// --------------------------------------------------- verify the archive logic
console.log('[4/6] verifying the installer payload with the native extractor');
const packTest = join(build, 'tmp', 'pack_test');
if (existsSync(packTest)) {
  const verifyDir = join(build, 'verify');
  rmSync(verifyDir, { recursive: true, force: true });
  mkdirSync(verifyDir, { recursive: true });
  const output = execFileSync(packTest, [setupExe, verifyDir], { encoding: 'utf8' });
  const extracted = walk(verifyDir);
  let mismatches = 0;
  for (const entry of entries) {
    const target = join(verifyDir, entry.rel);
    if (!existsSync(target)) { console.error(`  MISSING ${entry.rel}`); mismatches++; continue; }
    if (sha256(target) !== sha256(entry.abs)) { console.error(`  CORRUPT ${entry.rel}`); mismatches++; }
  }
  if (mismatches > 0) {
    console.error(output);
    throw new Error(`installer payload verification failed (${mismatches} problems)`);
  }
  log(`extracted and byte-compared ${extracted.length} files - all match`);
} else {
  log('native extractor unavailable - skipped (build-release.sh builds it)');
}

// ------------------------------------------------------------- source archive
console.log('[5/6] building SPACE_MINER_SOURCE.zip');
const sourceZip = join(releaseDir, 'SPACE_MINER_SOURCE.zip');
const sourceItems = [
  'src', 'native', 'scripts', 'tests', 'docs', 'index.html', 'package.json',
  'package-lock.json', 'tsconfig.json', 'vite.config.ts', 'README.md', 'LICENSE', '.gitignore',
].filter((item) => existsSync(join(root, item)));
makeZip(root, sourceZip, sourceItems);
log(`${humanSize(statSync(sourceZip).size)}`);

// -------------------------------------------------------------------- hashes
console.log('[6/6] checksums');
const artifacts = [windowsZip, setupExe, sourceZip];
const lines = [];
for (const file of artifacts) {
  const hash = sha256(file);
  const name = file.split('/').pop();
  lines.push(`${hash}  ${name}`);
  log(`${name.padEnd(26)} ${humanSize(statSync(file).size).padStart(10)}  sha256 ${hash}`);
}
writeFileSync(join(releaseDir, 'SHA256SUMS.txt'), `${lines.join('\n')}\n`);
console.log(`\nRelease artifacts ready in ${releaseDir}\n`);
