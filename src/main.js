// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// main.js — boot entry point
// ============================================================
import { Game } from './game/game.js';

const boot = document.getElementById('boot');

function fail(err) {
  console.error(err);
  if (!boot) return;
  boot.classList.add('error');
  boot.innerHTML = `<h1>UNABLE TO START</h1>
    <p style="max-width:520px;text-align:center;line-height:2;letter-spacing:.08em">
      ${err && err.message ? String(err.message).replace(/[<>]/g, '') : 'The renderer could not be created.'}<br>
      This game needs WebGL2. Try a current version of Chrome, Edge or Firefox with hardware acceleration enabled.
    </p>`;
}

async function bootGame() {
  // no WebGL2 → explain instead of showing a black screen
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2');
  if (!gl) { fail(new Error('WebGL2 is not available in this browser.')); return; }

  const params = new URLSearchParams(location.search);
  const game = new Game({ container: document.body, lite: params.get('lite') === '1' });
  window.game = game;
  try {
    await game.init((step, pct) => {
      if (boot && boot.firstElementChild) {
        // keep the pre-bundle splash coherent with the real progress
        const p = boot.querySelector('p');
        if (p) p.textContent = String(step).toUpperCase() + ' · ' + Math.round(pct) + '%';
      }
    });
  } catch (err) {
    fail(err);
    return;
  }
  if (boot) {
    boot.style.opacity = '0';
    setTimeout(() => boot.remove(), 700);
  }
  // pointer lock needs a user gesture on some browsers
  window.addEventListener('click', () => {
    if (game.mode === 'playing' && !game.locked) game.requestLock();
  }, { once: false });
}

bootGame();
