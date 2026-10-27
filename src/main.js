// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// main.js — boot entry point, diagnostics and startup watchdog
//
// The world is generated on the main thread (roughly 15-40 s on a
// laptop), so this file owns the whole "is it alive?" experience:
//   * real step / percentage / elapsed-time feedback
//   * automatic low-end profile on software renderers
//   * a readable failure panel instead of an endless splash
// ============================================================
import { Game } from './game/game.js';

const params = new URLSearchParams(location.search);
const boot = document.getElementById('boot');
const stepEl = () => document.getElementById('boot-step');
const pctEl = () => document.getElementById('boot-pct');
const hintEl = () => document.getElementById('boot-hint');

const state = {
  started: performance.now(),
  lastStep: 'starting',
  lastPct: 0,
  lastChange: performance.now(),
  ready: false,
  lite: params.get('lite') === '1' || params.get('safe') === '1',
  gpu: '',
  errors: [],
};

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function setStep(step, pct) {
  state.lastStep = step || state.lastStep;
  if (typeof pct === 'number' && isFinite(pct)) state.lastPct = Math.max(state.lastPct, pct);
  state.lastChange = performance.now();
  const s = stepEl();
  if (s) s.textContent = String(state.lastStep).toUpperCase();
  const p = pctEl();
  if (p) p.textContent = Math.round(state.lastPct) + '%';
  const bar = document.getElementById('boot-fill');
  if (bar) bar.style.width = Math.max(2, Math.min(100, state.lastPct)) + '%';
}

function diagnostics() {
  const gl = window.__aohGL;
  const lines = [
    'ASHES OF HUMANITY boot report',
    'when: ' + new Date().toISOString(),
    'url: ' + location.href,
    'protocol: ' + location.protocol,
    'user agent: ' + navigator.userAgent,
    'hardware concurrency: ' + (navigator.hardwareConcurrency || '?'),
    'device memory: ' + (navigator.deviceMemory || '?'),
    'webgl2: ' + (gl ? 'yes' : 'no'),
    'gpu: ' + (state.gpu || 'unknown'),
    'lite profile: ' + state.lite,
    'last step: ' + state.lastStep + ' (' + Math.round(state.lastPct) + '%)',
    'elapsed: ' + ((performance.now() - state.started) / 1000).toFixed(1) + ' s',
    'errors: ' + (state.errors.length ? state.errors.join(' | ') : 'none'),
  ];
  return lines.join('\n');
}

function panel(title, body, actions = []) {
  if (!boot) return;
  boot.className = 'error';
  boot.style.opacity = '1';
  const buttons = actions.map((a, i) => `<button id="boot-act-${i}">${esc(a.label)}</button>`).join('');
  boot.innerHTML = `
    <h1>${esc(title)}</h1>
    <div class="panel-body">${body}</div>
    <div class="panel-actions">${buttons}<button id="boot-copy">COPY REPORT</button></div>
    <pre id="boot-report">${esc(diagnostics())}</pre>`;
  actions.forEach((a, i) => {
    const b = document.getElementById('boot-act-' + i);
    if (b) b.onclick = a.run;
  });
  const c = document.getElementById('boot-copy');
  if (c) c.onclick = () => {
    const text = diagnostics();
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(() => {});
    const pre = document.getElementById('boot-report');
    if (pre) pre.textContent = text + '\n\n(report copied to the clipboard if the browser allowed it)';
  };
}

function fail(err, extra) {
  const msg = (err && (err.message || err)) || 'unknown error';
  state.errors.push(String(msg).slice(0, 300));
  console.error('[AOH]', err);
  panel('UNABLE TO START',
    `<p>${esc(String(msg).slice(0, 400))}</p>
     <p class="muted">${extra || ''}</p>
     <p class="muted">PLAYING FROM DISK? Open <b>Ashes of Humanity.html</b> (the single-file build) or run
       <code>npm run serve</code> and open <code>http://localhost:8080</code>.
       Browsers block ES modules loaded straight from a folder.</p>`,
    [
      { label: 'RELOAD IN LOW-END MODE', run: () => { location.search = '?lite=1'; } },
      { label: 'RELOAD', run: () => location.reload() },
    ]);
}

// ---------------------------------------------------------------- watchdog
// A splash that never changes is indistinguishable from a crash, so surface
// elapsed time, and after a while offer a way out instead of waiting forever.
setInterval(() => {
  if (state.ready) return;
  const now = performance.now();
  const elapsed = (now - state.started) / 1000;
  const stalled = (now - state.lastChange) / 1000;
  const hint = hintEl();
  if (!hint) return;
  if (elapsed > 45) {
    hint.innerHTML = `Still generating the world — ${elapsed.toFixed(0)} s. A slow CPU can take a few minutes. ` +
      `<a href="?lite=1">Low-end mode</a>`;
  } else if (elapsed > 8) {
    hint.textContent = `Building the world — ${elapsed.toFixed(0)} s`;
  }
  if (stalled > 150) {
    panel('THE WORLD IS NOT BUILDING',
      `<p>The generator has not reported progress for ${stalled.toFixed(0)} seconds.</p>
       <p class="muted">This usually means the browser ran out of memory or blocked WebGL.
       Try the low-end profile, close other tabs, or switch on hardware acceleration.</p>`,
      [
        { label: 'RETRY LOW-END MODE', run: () => { location.search = '?lite=1'; } },
        { label: 'RELOAD', run: () => location.reload() },
      ]);
  }
}, 1000);

window.addEventListener('error', (e) => {
  if (state.ready) return;
  fail(e.error || e.message || 'script error');
});
window.addEventListener('unhandledrejection', (e) => {
  if (state.ready) return;
  fail(e.reason || 'promise rejection');
});

// ---------------------------------------------------------------- boot
async function bootGame() {
  setStep('checking the renderer', 1);

  // WebGL2 probe with a real reason instead of a silent black screen
  const probe = document.createElement('canvas');
  let gl = null;
  try {
    gl = probe.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
  } catch (e) { gl = null; }
  window.__aohGL = gl;
  if (!gl) {
    const secure = location.protocol === 'file:' || location.protocol === 'https:' || location.hostname === 'localhost';
    panel('WEBGL2 IS NOT AVAILABLE',
      `<p>This game needs WebGL2. The browser reported no WebGL2 context${secure ? '' : ' (the page is not in a secure context)'}.</p>
       <ul class="muted">
         <li>Enable hardware acceleration: Settings → System → “Use hardware acceleration when available”, then restart the browser.</li>
         <li>Update the graphics driver, or try Chrome / Edge / Firefox (latest).</li>
         <li>In Firefox check <code>about:support</code> → WebGL and <code>webgl.force-enabled</code> in <code>about:config</code>.</li>
         <li>Remote desktops and virtual machines often report no GPU at all.</li>
       </ul>`,
      [{ label: 'RELOAD', run: () => location.reload() }]);
    return;
  }
  try {
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    state.gpu = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
  } catch (e) { state.gpu = 'unknown'; }
  // software rasterisers (SwiftShader / llvmpipe / Basic Render Driver) cannot
  // carry the full profile at playable speed: switch it on for the player
  if (!state.lite && /swiftshader|llvmpipe|software|basic render|microsoft basic/i.test(state.gpu)) {
    state.lite = true;
    setStep('software renderer detected — low-end profile', 2);
  }

  setStep('starting the engine', 3);
  const make = (lite) => {
    const game = new Game({ container: document.body, lite });
    window.game = game;
    state.game = game;
    return game;
  };
  const run = (game) => game.init((step, pct) => {
    // world generation reports a 0..1 fraction, the final steps report 0..100
    const pct100 = pct <= 1 ? pct * 100 : pct;
    setStep(step, Math.max(3, Math.min(99, pct100)));
  });

  let game = make(state.lite);
  try {
    await run(game);
  } catch (err) {
    // a GPU that reports WebGL2 but cannot carry the full profile (common on
    // old integrated chips and VM drivers) gets one automatic cheap retry
    if (state.lite) throw err;
    console.warn('[AOH] full profile failed, retrying in low-end mode', err);
    state.lite = true;
    state.lastPct = 3;
    setStep('retrying in low-end mode', 3);
    try { game.dispose?.(); } catch (e) { /* best effort */ }
    document.querySelectorAll('#ui > *').forEach((n) => n.remove());
    document.querySelectorAll('canvas').forEach((n) => n.remove());
    game = make(true);
    await run(game);
  }

  state.ready = true;
  setStep('ready', 100);
  if (boot) {
    boot.style.opacity = '0';
    setTimeout(() => boot.remove(), 700);
  }
  // pointer lock needs a user gesture on some browsers
  window.addEventListener('click', () => {
    if (game.mode === 'playing' && !game.locked) game.requestLock();
  });
}

bootGame().catch((e) => fail(e));
