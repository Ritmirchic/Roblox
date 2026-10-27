/**
 * Post processing: HDR render target, bloom, ACES tonemap output pass and a
 * final grade pass (vignette, film grain, colour grade, chromatic fringe).
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVignette: { value: 0.42 },
    uGrain: { value: 0.055 },
    uSaturation: { value: 0.92 },
    uContrast: { value: 1.06 },
    uLift: { value: new THREE.Vector3(0.012, 0.014, 0.02) },
    uFade: { value: 0 },
    uDamage: { value: 0 },
    uRad: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uAberration: { value: 0.0012 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float uTime, uVignette, uGrain, uSaturation, uContrast, uFade, uDamage, uRad, uAberration;
    uniform vec3 uLift;
    uniform vec2 uResolution;

    float rand(vec2 co) { return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453); }

    void main() {
      vec2 uv = vUv;
      vec2 centered = uv - 0.5;
      float r2 = dot(centered, centered);

      // chromatic aberration grows toward the edges
      float ab = uAberration * (0.25 + r2 * 2.4);
      vec3 col;
      col.r = texture2D(tDiffuse, uv + centered * ab).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - centered * ab).b;

      // colour grade
      col = (col - 0.5) * uContrast + 0.5;
      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(luma), col, uSaturation);
      col += uLift;

      // radiation storm sickly tint
      col = mix(col, vec3(luma * 0.85, luma * 1.12, luma * 0.62), uRad * 0.55);

      // vignette
      float vig = smoothstep(0.92, 0.25, r2 * (1.0 + uVignette * 1.6));
      col *= mix(1.0, vig, uVignette);

      // damage flash: red edge pulse
      if (uDamage > 0.001) {
        float edge = smoothstep(0.15, 0.75, r2 * 2.2);
        col = mix(col, vec3(0.45, 0.02, 0.02), edge * uDamage * 0.85);
      }

      // film grain
      float g = rand(uv * uResolution + vec2(uTime * 37.13, uTime * 21.71));
      col += (g - 0.5) * uGrain;

      // fade to black (scene transitions / death)
      col = mix(col, vec3(0.0), uFade);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export class PostFX {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.enabled = true;
    this.quality = 'high';

    const size = new THREE.Vector2();
    renderer.getSize(size);
    const dpr = Math.min(renderer.getPixelRatio(), 1.5);
    const target = new THREE.WebGLRenderTarget(size.x * dpr, size.y * dpr, {
      type: THREE.HalfFloatType,
      samples: 4,
      colorSpace: THREE.LinearSRGBColorSpace,
    });
    this.composer = new EffectComposer(renderer, target);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(size.x, size.y);
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.28, 0.75, 0.92);
    this.composer.addPass(this.bloom);

    this.output = new OutputPass();
    this.composer.addPass(this.output);

    this.grade = new ShaderPass(GradeShader);
    this.grade.renderToScreen = true;
    this.composer.addPass(this.grade);
    this.grade.uniforms.uResolution.value.set(size.x, size.y);
    this.elapsed = 0;
    this.damage = 0;
    this.fade = 0;
    this.rad = 0;
  }

  setSize(w, h) {
    this.composer.setSize(w, h);
    this.bloom.setSize(w, h);
    this.grade.uniforms.uResolution.value.set(w, h);
  }

  setQuality(q) {
    this.quality = q;
    const s = { low: [0.18, 0.4], medium: [0.24, 0.6], high: [0.3, 0.8], ultra: [0.36, 0.9] }[q] || [0.3, 0.8];
    this.bloom.strength = s[0];
    this.bloom.radius = s[1];
    this.grade.uniforms.uGrain.value = q === 'low' ? 0.03 : 0.055;
  }

  update(dt) {
    this.elapsed += dt;
    this.grade.uniforms.uTime.value = this.elapsed;
    this.damage = Math.max(0, this.damage - dt * 1.6);
    this.grade.uniforms.uDamage.value = this.damage;
    this.grade.uniforms.uFade.value = this.fade;
    this.grade.uniforms.uRad.value = this.rad;
  }

  render(dt) {
    this.update(dt);
    this.composer.render(dt);
  }
}
