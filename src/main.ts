import './style.css';
import { App } from './app/app';

const canvas = document.getElementById('game') as HTMLCanvasElement | null;

const showBootError = (message: string): void => {
  const boot = document.getElementById('boot');
  if (!boot) return;
  boot.classList.remove('boot-out');
  const inner = boot.querySelector('.boot-inner');
  if (inner) {
    const p = document.createElement('p');
    p.className = 'boot-error';
    p.textContent = message;
    inner.appendChild(p);
  }
};

try {
  if (!canvas) throw new Error('The game canvas is missing from the page.');
  const app = new App(canvas);
  (window as unknown as { wickAndWane?: App }).wickAndWane = app;
  app.start();
} catch (error) {
  console.error(error);
  showBootError(
    `The lantern could not be lit: ${error instanceof Error ? error.message : String(error)}. ` +
      'Try a modern browser (Chrome, Edge, Firefox or Safari) with JavaScript enabled.',
  );
}
