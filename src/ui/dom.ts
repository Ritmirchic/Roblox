/**
 * Tiny DOM helper layer - keeps the UI code declarative without pulling in a framework.
 */
export type Props = Record<string, any>;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  children: (Node | string | null | undefined)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined) continue;
    if (key === 'class') node.className = String(value);
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (key === 'html') node.innerHTML = String(value);
    else if (key in node) (node as any)[key] = value;
    else node.setAttribute(key, String(value));
  }
  for (const child of children) {
    if (child === null || child === undefined) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

export function clear(node: HTMLElement): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function fmt(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  return Math.round(n).toLocaleString('en-US');
}

export function fmtPrecise(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

/** Animated number tween on a text node. */
export function tweenNumber(node: HTMLElement, from: number, to: number, duration = 500, formatter = fmt): void {
  const start = performance.now();
  const step = () => {
    const t = Math.min(1, (performance.now() - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    node.textContent = formatter(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function progressBar(value: number, max: number, color = 'linear-gradient(90deg,#00e5ff,#7b61ff)'): HTMLElement {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return el('div', { class: 'progress' }, [
    el('i', { style: { width: `${pct * 100}%`, background: color } }),
  ]);
}
