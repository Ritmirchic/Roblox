/**
 * Renderer bootstrap and frame loop.
 * Single WebGL context shared by every scene; scenes register update callbacks.
 */
import * as THREE from 'three';

export interface QualityPreset {
  shadows: boolean;
  shadowMap: number;
  pixelRatio: number;
  particles: 'low' | 'medium' | 'high';
}

export const QUALITY: Record<'low' | 'medium' | 'high', QualityPreset> = {
  low:    { shadows: false, shadowMap: 512,  pixelRatio: 1,    particles: 'low' },
  medium: { shadows: true,  shadowMap: 1024, pixelRatio: 1.25, particles: 'medium' },
  high:   { shadows: true,  shadowMap: 2048, pixelRatio: 1.75, particles: 'high' },
};

export class Engine {
  renderer: THREE.WebGLRenderer;
  canvas: HTMLCanvasElement;
  clock = new THREE.Clock();
  private callbacks: ((dt: number, elapsed: number) => void)[] = [];
  private running = false;
  activeScene: THREE.Scene | null = null;
  activeCamera: THREE.Camera | null = null;
  quality: 'low' | 'medium' | 'high' = 'high';
  /** Smoothed frames per second for the debug/perf readout. */
  fps = 60;

  constructor(container: HTMLElement, quality: 'low' | 'medium' | 'high' = 'high') {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'gameCanvas';
    container.appendChild(this.canvas);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: quality !== 'low',
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.setQuality(quality);
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  setQuality(q: 'low' | 'medium' | 'high'): void {
    this.quality = q;
    const preset = QUALITY[q];
    this.renderer.shadowMap.enabled = preset.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, preset.pixelRatio));
    this.resize();
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    const cam = this.activeCamera as THREE.PerspectiveCamera | null;
    if (cam && cam.isPerspectiveCamera) {
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
  }

  onFrame(cb: (dt: number, elapsed: number) => void): () => void {
    this.callbacks.push(cb);
    return () => {
      const i = this.callbacks.indexOf(cb);
      if (i >= 0) this.callbacks.splice(i, 1);
    };
  }

  setScene(scene: THREE.Scene, camera: THREE.Camera): void {
    this.activeScene = scene;
    this.activeCamera = camera;
    this.resize();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, this.clock.getDelta());
      const elapsed = this.clock.elapsedTime;
      this.fps = this.fps * 0.93 + (1 / Math.max(dt, 0.0001)) * 0.07;
      for (const cb of this.callbacks) cb(dt, elapsed);
      if (this.activeScene && this.activeCamera) {
        this.renderer.render(this.activeScene, this.activeCamera);
      }
    };
    requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
  }
}
