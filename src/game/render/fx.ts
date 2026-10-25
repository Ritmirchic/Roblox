/** Pooled particles, floating numbers and screen shake. */
import { TAU, clamp01 } from '../../core/math';
import { COLORS, FONT_BODY, FONT_MONO, rgba } from '../../core/palette';
import { drawGlow, type Ctx2D } from './art';

export type ParticleKind = 'ember' | 'spark' | 'smoke' | 'shard' | 'leaf' | 'wax' | 'coin' | 'mote' | 'star' | 'rune';

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  kind: ParticleKind;
  spin: number;
  gravity: number;
  drag: number;
}

interface Floater {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
  size: number;
  crit: boolean;
}

const MAX_PARTICLES = 700;
const MAX_FLOATERS = 120;

export class FxSystem {
  private particles: Particle[] = [];
  private floaters: Floater[] = [];
  shake = 0;
  shakeTime = 0;
  reducedMotion = false;

  constructor() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 2,
        color: '#fff',
        kind: 'mote',
        spin: 0,
        gravity: 0,
        drag: 0.98,
      });
    }
    for (let i = 0; i < MAX_FLOATERS; i++) {
      this.floaters.push({
        active: false,
        x: 0,
        y: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        text: '',
        color: '#fff',
        size: 14,
        crit: false,
      });
    }
  }

  private takeParticle(): Particle | null {
    for (const p of this.particles) if (!p.active) return p;
    return null;
  }

  private takeFloater(): Floater | null {
    for (const f of this.floaters) if (!f.active) return f;
    return null;
  }

  burst(
    x: number,
    y: number,
    color: string,
    count: number,
    opts: {
      kind?: ParticleKind;
      speed?: number;
      size?: number;
      life?: number;
      gravity?: number;
      spread?: number;
      angle?: number;
    } = {},
  ): void {
    const {
      kind = 'spark',
      speed = 90,
      size = 2.4,
      life = 0.55,
      gravity = 0,
      spread = TAU,
      angle = 0,
    } = opts;
    const realCount = this.reducedMotion ? Math.ceil(count * 0.5) : count;
    for (let i = 0; i < realCount; i++) {
      const p = this.takeParticle();
      if (!p) break;
      const a = angle + (Math.random() - 0.5) * spread;
      const v = speed * (0.35 + Math.random() * 0.9);
      p.active = true;
      p.x = x + (Math.random() - 0.5) * 6;
      p.y = y + (Math.random() - 0.5) * 6;
      p.vx = Math.cos(a) * v;
      p.vy = Math.sin(a) * v;
      p.life = life * (0.6 + Math.random() * 0.7);
      p.maxLife = p.life;
      p.size = size * (0.6 + Math.random() * 0.9);
      p.color = color;
      p.kind = kind;
      p.spin = Math.random() * TAU;
      p.gravity = gravity;
      p.drag = 0.94;
    }
  }

  wisps(x: number, y: number, color: string, count = 3): void {
    this.burst(x, y, color, count, { kind: 'ember', speed: 34, size: 2.2, life: 1.1, gravity: -26, spread: TAU });
  }

  gold(x: number, y: number, amount: number): void {
    this.text(x, y - 10, `+${amount}`, COLORS.gold, 13);
    this.burst(x, y, COLORS.gold, 4, { kind: 'coin', speed: 60, size: 2.2, life: 0.6 });
  }

  text(x: number, y: number, text: string, color: string = COLORS.parchment, size = 14, crit = false): void {
    const f = this.takeFloater();
    if (!f) return;
    f.active = true;
    f.x = x + (Math.random() - 0.5) * 12;
    f.y = y;
    f.vy = -34 - Math.random() * 16;
    f.life = 0.85;
    f.maxLife = 0.85;
    f.text = text;
    f.color = color;
    f.size = size;
    f.crit = crit;
  }

  ring(x: number, y: number, color: string, radius: number): void {
    this.burst(x, y, color, 14, {
      kind: 'shard',
      speed: radius * 2.4,
      size: 2.6,
      life: 0.4,
      spread: TAU,
    });
  }

  addShake(amount: number): void {
    if (this.reducedMotion) return;
    this.shake = Math.min(20, Math.max(this.shake, amount));
    this.shakeTime = Math.max(this.shakeTime, 0.35);
  }

  update(dt: number): void {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy = p.vy * Math.pow(p.drag, dt * 60) + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.spin += dt * 2;
    }
    for (const f of this.floaters) {
      if (!f.active) continue;
      f.life -= dt;
      if (f.life <= 0) {
        f.active = false;
        continue;
      }
      f.y += f.vy * dt;
      f.vy += 16 * dt;
    }
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      this.shake *= Math.pow(0.02, dt);
      if (this.shakeTime <= 0) this.shake = 0;
    }
  }

  clear(): void {
    for (const p of this.particles) p.active = false;
    for (const f of this.floaters) f.active = false;
    this.shake = 0;
    this.shakeTime = 0;
  }

  render(ctx: Ctx2D): void {
    ctx.save();
    // additive-ish particles
    for (const p of this.particles) {
      if (!p.active) continue;
      const t = clamp01(p.life / p.maxLife);
      switch (p.kind) {
        case 'ember':
        case 'mote':
        case 'star': {
          drawGlow(ctx, p.x, p.y, p.size * 4.5, p.color, t * 0.6);
          ctx.globalAlpha = t;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.7, 0, TAU);
          ctx.fill();
          ctx.globalAlpha = 1;
          break;
        }
        case 'spark': {
          ctx.strokeStyle = rgba(p.color, t);
          ctx.lineWidth = Math.max(1, p.size * 0.6);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
          ctx.stroke();
          break;
        }
        case 'smoke': {
          ctx.globalAlpha = t * 0.18;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (2.4 - t * 1.2), 0, TAU);
          ctx.fill();
          ctx.globalAlpha = 1;
          break;
        }
        case 'shard': {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.spin);
          ctx.strokeStyle = rgba(p.color, t);
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-p.size, 0);
          ctx.lineTo(p.size, 0);
          ctx.stroke();
          ctx.restore();
          break;
        }
        case 'leaf': {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.spin);
          ctx.globalAlpha = t;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, TAU);
          ctx.fill();
          ctx.restore();
          break;
        }
        case 'wax': {
          ctx.globalAlpha = t * 0.9;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, TAU);
          ctx.fill();
          ctx.globalAlpha = 1;
          break;
        }
        case 'coin': {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.scale(Math.max(0.2, Math.abs(Math.cos(p.spin))), 1);
          ctx.globalAlpha = t;
          ctx.fillStyle = COLORS.gold;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, TAU);
          ctx.fill();
          ctx.restore();
          break;
        }
        case 'rune': {
          ctx.globalAlpha = t;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, TAU);
          ctx.stroke();
          ctx.globalAlpha = 1;
          break;
        }
      }
    }

    for (const f of this.floaters) {
      if (!f.active) continue;
      const t = clamp01(f.life / f.maxLife);
      const scale = f.crit ? 1.18 : 1;
      ctx.save();
      ctx.globalAlpha = Math.min(1, t * 1.6);
      ctx.font = `bold ${f.size * scale}px ${FONT_MONO}`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.65)';
      ctx.lineWidth = 3;
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
    ctx.restore();
  }

  /** Small text helper for the HUD layer. */
  renderLabelsOnly(ctx: Ctx2D): void {
    void ctx;
  }
}

export const floaterFont = FONT_BODY;
