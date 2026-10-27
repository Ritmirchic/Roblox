/**
 * Builds the shippable Windows package:
 *   release/windows/AshesOfHumanity.html   single self-contained file (works from file://)
 *   release/windows/index.html             same file under the name Electron loads
 *   release/windows/ASHES_OF_HUMANITY.bat  launcher (Edge/Chrome app mode)
 *   release/windows/README.txt
 *   release/ASHES_OF_HUMANITY_WINDOWS.zip
 *   release/ASHES_OF_HUMANITY_SOURCE.zip
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { bundle, ROOT } from './build.mjs';

const outDir = path.join(ROOT, 'release');
const winDir = path.join(outDir, 'windows');
fs.rmSync(winDir, { recursive: true, force: true });
fs.mkdirSync(winDir, { recursive: true });

const { code: codeBytes } = await bundle({ minify: true });
const code = Buffer.from(codeBytes).toString('utf8');
const css = fs.readFileSync(path.join(ROOT, 'web/styles.css'), 'utf8');
const shellHtml = fs.readFileSync(path.join(ROOT, 'web/index.html'), 'utf8');

const js = code.replace(/<\/script/gi, '<\\/script');
const html = shellHtml
  .replace('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n</style>`)
  .replace('<script src="game.js" defer></script>', `<script>\n${js}\n</script>`);

if (html.includes('src="game.js"') || html.includes('href="styles.css"')) {
  throw new Error('inlining failed: external references remain');
}
fs.writeFileSync(path.join(winDir, 'AshesOfHumanity.html'), html);
fs.writeFileSync(path.join(winDir, 'index.html'), html);
fs.writeFileSync(path.join(winDir, 'game.js'), code);
fs.writeFileSync(path.join(winDir, 'styles.css'), css);

const bat = `@echo off
setlocal
title ASHES OF HUMANITY: LAST SIGNAL
set "GAME=%~dp0AshesOfHumanity.html"
set "GAMEURL=file:///%GAME:\\=/%"
set "EDGE=%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"
set "CHROME=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
if exist "%EDGE%" (
  start "" "%EDGE%" --app="%GAMEURL%" --start-maximized --autoplay-policy=no-user-gesture-required --disable-features=Translate
  exit /b
)
if exist "%CHROME%" (
  start "" "%CHROME%" --app="%GAMEURL%" --start-maximized --autoplay-policy=no-user-gesture-required
  exit /b
)
echo Microsoft Edge and Google Chrome were not found. Opening with the default browser...
start "" "%GAME%"
`;
fs.writeFileSync(path.join(winDir, 'ASHES_OF_HUMANITY.bat'), bat.replace(/\r?\n/g, '\r\n'));

// hidden-console launcher: starts the .bat without a command prompt flashing on screen
const vbs = [
  "' ASHES OF HUMANITY: LAST SIGNAL - silent launcher",
  'Set sh = CreateObject("WScript.Shell")',
  'Set fso = CreateObject("Scripting.FileSystemObject")',
  'sh.CurrentDirectory = fso.GetParentFolderName(WScript.ScriptFullName)',
  'sh.Run "cmd /c """ & sh.CurrentDirectory & "\\ASHES_OF_HUMANITY.bat"""", 0, False',
].join('\r\n') + '\r\n';
fs.writeFileSync(path.join(winDir, 'ASHES_OF_HUMANITY.vbs'), vbs);

const readme = `ASHES OF HUMANITY: LAST SIGNAL
================================
Version 1.0.0 - Windows 64-bit

HOW TO RUN
1. Extract the whole folder somewhere you can write to (Documents, Desktop).
2. Double-click ASHES_OF_HUMANITY.bat
   - It launches the game in Microsoft Edge (or Chrome) app mode, full window, offline.
   - You can also double-click AshesOfHumanity.html directly.
3. For the real fullscreen experience press F11 in the browser window.

REQUIREMENTS
- Windows 10 or 11, 64-bit
- Microsoft Edge (preinstalled on Windows 10/11) or Google Chrome
- A GPU with WebGL2 support (any DirectX 11 class card), 4 GB RAM
- No internet connection required. No external assets are downloaded.

CONTROLS
WASD move          SHIFT sprint         C / CTRL crouch
MOUSE look         LMB fire             RMB aim / heavy melee
R reload           E interact           F flashlight
TAB inventory      K skills             J journal
B crafting         V base building      M map
O settings         1..4 weapon slots    Q cycle weapon
G throw grenade    Z sleep (at a bed)   ESC pause
F11 browser fullscreen

SAVES
Saves are stored locally by the browser (localStorage) for this file.
Three manual slots plus autosave. Use the SETTINGS / pause screen to save.

NOTES
- This build is a self-contained WebGL game. It does not need a server.
- If Edge shows a "this file can be dangerous" prompt, choose Keep/Open - the game
  is a single local HTML file with no network access.
- Audio starts after the first click, as required by browser autoplay policy.

ASHES OF HUMANITY: LAST SIGNAL - original content, no third-party assets.
`;
fs.writeFileSync(path.join(winDir, 'README.txt'), readme);

function zip(target, entries, cwd) {
  fs.rmSync(target, { force: true });
  execFileSync('zip', ['-r', '-9', '-q', target, ...entries], { cwd });
  const size = fs.statSync(target).size;
  console.log(`${path.basename(target)} ${(size / 1048576).toFixed(1)} MB`);
}

zip(path.join(outDir, 'ASHES_OF_HUMANITY_WINDOWS.zip'), ['windows'], outDir);

// source archive: everything needed to rebuild, without generated artifacts
const sourceList = ['src', 'web', 'tools', 'electron', 'package.json', 'package-lock.json', 'tools/README.md'];
const existing = sourceList.filter((p) => fs.existsSync(path.join(ROOT, p)));
const staging = path.join(outDir, '.source_staging', 'ASHES_OF_HUMANITY_SOURCE');
fs.rmSync(path.join(outDir, '.source_staging'), { recursive: true, force: true });
fs.mkdirSync(staging, { recursive: true });
for (const entry of existing) {
  fs.cpSync(path.join(ROOT, entry), path.join(staging, path.basename(entry)), { recursive: true });
}
for (const doc of ['README.md', 'ARCHITECTURE.md']) {
  if (fs.existsSync(path.join(ROOT, doc))) fs.copyFileSync(path.join(ROOT, doc), path.join(staging, doc));
}
zip(path.join(outDir, 'ASHES_OF_HUMANITY_SOURCE.zip'), ['ASHES_OF_HUMANITY_SOURCE'], path.join(outDir, '.source_staging'));
fs.rmSync(path.join(outDir, '.source_staging'), { recursive: true, force: true });

console.log('package complete');
