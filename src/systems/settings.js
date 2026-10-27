/**
 * Settings: quality presets, audio mix, controls, persistence in localStorage.
 */
export const QUALITY_PRESETS = {
  low: { renderScale: 0.7, shadows: false, bloom: false, filmGrain: false, shadowMap: 1024, drawDistance: 480, pixelRatioCap: 1 },
  medium: { renderScale: 0.9, shadows: true, bloom: true, filmGrain: true, shadowMap: 2048, drawDistance: 800, pixelRatioCap: 1.25 },
  high: { renderScale: 1.0, shadows: true, bloom: true, filmGrain: true, shadowMap: 2048, drawDistance: 1400, pixelRatioCap: 1.5 },
};

const DEFAULTS = {
  quality: 'high',
  renderScale: 1.0,
  shadows: true,
  bloom: true,
  filmGrain: true,
  fov: 75,
  master: 0.85,
  sfx: 0.9,
  music: 0.45,
  ambient: 0.6,
  difficulty: 'stalker',
  sensitivity: 1.0,
  invertY: false,
  crosshairScale: 1.0,
  subtitles: true,
  language: 'en',
};

export class Settings {
  constructor(game) {
    this.game = game;
    Object.assign(this, DEFAULTS);
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem('aoh_settings');
      if (raw) Object.assign(this, JSON.parse(raw));
    } catch (e) { /* private mode */ }
  }

  save() {
    try {
      localStorage.setItem('aoh_settings', JSON.stringify(this.snapshot()));
    } catch (e) { /* ignore */ }
  }

  snapshot() {
    const out = {};
    for (const k of Object.keys(DEFAULTS)) out[k] = this[k];
    return out;
  }

  setQuality(name) {
    const preset = QUALITY_PRESETS[name] || QUALITY_PRESETS.high;
    this.quality = name;
    this.renderScale = preset.renderScale;
    this.shadows = preset.shadows;
    this.bloom = preset.bloom;
    this.filmGrain = preset.filmGrain;
    this.apply();
    this.save();
  }

  /** Push current values into the live renderer/audio/camera. */
  apply() {
    const g = this.game;
    if (!g.renderer) return;
    const preset = QUALITY_PRESETS[this.quality] || QUALITY_PRESETS.high;
    g.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, preset.pixelRatioCap) * this.renderScale);
    g.renderer.shadowMap.enabled = this.shadows;
    if (g.camera) {
      g.camera.fov = this.fov;
      g.camera.far = preset.drawDistance;
      g.camera.updateProjectionMatrix();
    }
    if (g.sky?.sun) {
      if (this.shadows) {
        g.sky.sun.shadow.mapSize.set(preset.shadowMap, preset.shadowMap);
        g.sky.sun.shadow.map?.dispose();
        g.sky.sun.shadow.map = null;
      }
    }
    if (g.postfx) {
      if (g.postfx.bloom) g.postfx.bloom.enabled = this.bloom;
      g.postfx.grade.uniforms.uGrain.value = this.filmGrain ? 0.05 : 0;
      g.postfx.grade.uniforms.uVignette.value = this.filmGrain ? 0.42 : 0.2;
      g.postfx.setQuality?.(this.quality);
    }
    if (g.audio) g.audio.setVolumes({ master: this.master, sfx: this.sfx, music: this.music, ambient: this.ambient });
    if (g.input) {
      g.input.sensitivity = this.sensitivity;
      g.input.invertY = this.invertY;
    }
    if (g.hud) g.hud.elCross.style.transform = `translate(-50%,-50%) scale(${this.crosshairScale})`;
    g.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.save();
  }
}
