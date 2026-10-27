/**
 * Sky dome, sun/moon, stars, cloud layer and atmospheric fog.
 * All shader driven; the time of day drives colour, intensity and fog density.
 */
import * as THREE from 'three';
import { clamp01, lerp, smoothstep } from './util.js';

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_Position.z = gl_Position.w; // far plane
}
`;

const SKY_FRAG = /* glsl */ `
precision highp float;
varying vec3 vDir;
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uGround;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform float uStars;
uniform float uTime;
uniform float uCloudCover;
uniform vec3 uCloudColor;
uniform float uFogDensity;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                 mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                 mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main() {
  vec3 d = normalize(vDir);
  float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = mix(uHorizon, uZenith, pow(clamp(d.y, 0.0, 1.0), 0.55));
  if (d.y < 0.0) col = mix(uHorizon, uGround, clamp(-d.y * 3.0, 0.0, 1.0));

  // sun disc + glow
  float sd = max(dot(d, normalize(uSunDir)), 0.0);
  col += uSunColor * pow(sd, 900.0) * 8.0 * uSunIntensity;
  col += uSunColor * pow(sd, 12.0) * 0.42 * uSunIntensity;
  col += uSunColor * pow(sd, 3.0) * 0.12 * uSunIntensity;

  // stars
  if (uStars > 0.01) {
    vec3 sp = d * 420.0;
    float s = hash(floor(sp));
    float twinkle = 0.65 + 0.35 * sin(uTime * 2.0 + s * 90.0);
    float star = smoothstep(0.9975, 0.9995, s) * twinkle;
    col += vec3(0.85, 0.9, 1.0) * star * uStars * smoothstep(0.02, 0.35, d.y) * 3.0;
  }

  // cloud deck
  if (d.y > 0.02) {
    vec3 cp = d / max(d.y, 0.05) * 0.55 + vec3(uTime * 0.004, 0.0, uTime * 0.0025);
    float c = fbm(cp * 1.6);
    float cover = smoothstep(1.0 - uCloudCover - 0.05, 1.0 - uCloudCover + 0.32, c);
    float shade = smoothstep(0.25, 0.85, fbm(cp * 3.1 + 5.0));
    vec3 cloudCol = mix(uCloudColor * 0.55, uCloudColor * 1.25, shade);
    cloudCol += uSunColor * pow(sd, 6.0) * 0.45 * uSunIntensity;
    col = mix(col, cloudCol, cover * smoothstep(0.02, 0.2, d.y) * 0.92);
  }

  // fog haze near horizon
  float horizonHaze = pow(1.0 - clamp(abs(d.y) * 3.2, 0.0, 1.0), 2.5);
  col = mix(col, uHorizon, horizonHaze * clamp(uFogDensity * 3.0, 0.0, 1.0) * 0.35);

  gl_FragColor = vec4(col, 1.0);
}
`;

export class SkySystem {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.uniforms = {
      uZenith: { value: new THREE.Color(0x2c4a6e) },
      uHorizon: { value: new THREE.Color(0x9aa7ad) },
      uGround: { value: new THREE.Color(0x3b3a33) },
      uSunDir: { value: new THREE.Vector3(0.3, 0.8, 0.2).normalize() },
      uSunColor: { value: new THREE.Color(0xffd9a8) },
      uSunIntensity: { value: 1.0 },
      uStars: { value: 0.0 },
      uTime: { value: 0 },
      uCloudCover: { value: 0.45 },
      uCloudColor: { value: new THREE.Color(0xbfc4c9) },
      uFogDensity: { value: 0.5 },
    };
    const geo = new THREE.SphereGeometry(1, 32, 20);
    const mat = new THREE.ShaderMaterial({
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      uniforms: this.uniforms,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      fog: false,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.scale.setScalar(1);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1000;
    scene.add(this.mesh);

    this.fog = new THREE.FogExp2(0x9aa7ad, 0.0045);
    scene.fog = this.fog;

    this.sun = new THREE.DirectionalLight(0xffe0bc, 2.4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 260;
    this.sun.shadow.camera.left = -60;
    this.sun.shadow.camera.right = 60;
    this.sun.shadow.camera.top = 60;
    this.sun.shadow.camera.bottom = -60;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.035;
    scene.add(this.sun);
    scene.add(this.sun.target);

    this.ambient = new THREE.HemisphereLight(0x8ea4bd, 0x3a352b, 0.55);
    scene.add(this.ambient);

    this.moon = new THREE.DirectionalLight(0x8fa8d6, 0.06);
    scene.add(this.moon);
    scene.add(this.moon.target);

    this.timeOfDay = 9.4; // hours
    this.weather = { rain: 0, fog: 0.16, cloud: 0.4, wind: 0.2, storm: 0, radStorm: 0 };
  }

  /** Interpolate a set of keyframed colours for the current hour. */
  _gradient(hour) {
    const keys = [
      { t: 0.0, zen: 0x0a1020, hor: 0x1a2334, sun: 0x4a5d85, sunI: 0.05, amb: 0.62, ambSky: 0x4a5c80 },
      { t: 4.6, zen: 0x0d1526, hor: 0x2a2f3d, sun: 0x6d7896, sunI: 0.08, amb: 0.58, ambSky: 0x4d5e80 },
      { t: 5.6, zen: 0x2b4566, hor: 0xb07a5a, sun: 0xffa064, sunI: 0.55, amb: 0.24, ambSky: 0x6e7f96 },
      { t: 6.8, zen: 0x517599, hor: 0xd0a077, sun: 0xffc48f, sunI: 1.5, amb: 0.42, ambSky: 0x9aa9b5 },
      { t: 9.0, zen: 0x5b83ad, hor: 0xb9c2c4, sun: 0xfff0d8, sunI: 2.5, amb: 0.55, ambSky: 0xa8bcd0 },
      { t: 12.5, zen: 0x4f7fb5, hor: 0xc3cdce, sun: 0xfff6e6, sunI: 2.9, amb: 0.6, ambSky: 0xb2c6d8 },
      { t: 16.0, zen: 0x587fa8, hor: 0xc7bfae, sun: 0xffe1b0, sunI: 2.3, amb: 0.5, ambSky: 0xa6b6c4 },
      { t: 18.2, zen: 0x3d5a7c, hor: 0xd38b5c, sun: 0xff9b52, sunI: 1.25, amb: 0.32, ambSky: 0x8a94a2 },
      { t: 19.6, zen: 0x1d2c46, hor: 0x7a5a52, sun: 0xc06a44, sunI: 0.35, amb: 0.16, ambSky: 0x4a5670 },
      { t: 21.0, zen: 0x0a101d, hor: 0x1e2534, sun: 0x4a5d85, sunI: 0.06, amb: 0.6, ambSky: 0x485a7c },
      { t: 24.0, zen: 0x0a1020, hor: 0x1a2334, sun: 0x4a5d85, sunI: 0.05, amb: 0.62, ambSky: 0x4a5c80 },
    ];
    let a = keys[0];
    let b = keys[keys.length - 1];
    for (let i = 0; i < keys.length - 1; i++) {
      if (hour >= keys[i].t && hour <= keys[i + 1].t) {
        a = keys[i];
        b = keys[i + 1];
        break;
      }
    }
    const t = clamp01((hour - a.t) / Math.max(0.0001, b.t - a.t));
    const ca = new THREE.Color(a.zen);
    const cb = new THREE.Color(b.zen);
    const ha = new THREE.Color(a.hor);
    const hb = new THREE.Color(b.hor);
    const sa = new THREE.Color(a.sun);
    const sb = new THREE.Color(b.sun);
    const aa = new THREE.Color(a.ambSky);
    const ab = new THREE.Color(b.ambSky);
    return {
      zenith: ca.lerp(cb, t).clone(),
      horizon: ha.lerp(hb, t).clone(),
      sun: sa.lerp(sb, t).clone(),
      sunI: lerp(a.sunI, b.sunI, t),
      amb: lerp(a.amb, b.amb, t),
      ambSky: aa.lerp(ab, t).clone(),
    };
  }

  update(dt, camera, playerPos, opts = {}) {
    this.indoorBlend = THREE.MathUtils.lerp(this.indoorBlend ?? 0, opts.indoor ? 1 : 0, Math.min(1, dt * 3.5));
    this.timeOfDay = (this.timeOfDay + dt / 60) % 24; // 1 real min = 1 game hour
    const hour = this.timeOfDay;
    const g = this._gradient(hour);

    // sun angle: rises at 5.6, sets at 19.6
    const dayT = (hour - 5.6) / 14.0;
    const sunAngle = dayT * Math.PI;
    const sunDir = new THREE.Vector3(Math.cos(sunAngle) * 0.75, Math.sin(sunAngle), 0.35).normalize();
    const nightDir = new THREE.Vector3(-sunDir.x, -sunDir.y, -sunDir.z);

    const isNight = hour < 5.4 || hour > 20.0;
    const sunStrength = isNight ? 0 : smoothstep(0.0, 0.14, Math.sin(sunAngle));

    const w = this.weather;
    const cloudCover = clamp01(w.cloud + w.storm * 0.45);
    const fogDensity = 0.0007 + w.fog * 0.0052 + w.storm * 0.006;

    // dim and desaturate under clouds
    const skyDim = 1 - cloudCover * 0.42;
    this.uniforms.uZenith.value.copy(g.zenith).multiplyScalar(skyDim);
    this.uniforms.uHorizon.value.copy(g.horizon).multiplyScalar(lerp(1, 0.82, cloudCover));
    if (w.radStorm > 0.01) {
      const rs = w.radStorm;
      this.uniforms.uHorizon.value.lerp(new THREE.Color(0x6a7a3a), rs * 0.7);
      this.uniforms.uZenith.value.lerp(new THREE.Color(0x3c4a22), rs * 0.55);
      this.uniforms.uCloudColor.value.setHex(0x7d8a55);
    } else {
      this.uniforms.uCloudColor.value.setHex(0xbfc4c9).multiplyScalar(lerp(0.35, 1.0, sunStrength) + 0.15);
    }
    this.uniforms.uSunDir.value.copy(isNight ? nightDir : sunDir);
    this.uniforms.uSunColor.value.copy(g.sun);
    this.uniforms.uSunIntensity.value = isNight ? 0.18 : sunStrength * (1 - cloudCover * 0.55) * 1.4 + 0.15;
    this.uniforms.uStars.value = isNight ? smoothstep(0.55, 1.0, 1 - sunStrength) : 0;
    this.uniforms.uTime.value += dt;
    this.uniforms.uCloudCover.value = cloudCover;
    this.uniforms.uFogDensity.value = fogDensity * 100;

    // fog colour: horizon tint, lifted at night
    const fogCol = g.horizon.clone().lerp(new THREE.Color(0x0a0c12), isNight ? 0.72 : 0.05);
    if (w.radStorm > 0.01) fogCol.lerp(new THREE.Color(0x5a6a34), w.radStorm * 0.6);
    this.fog.color.copy(fogCol);
    this.fog.density = fogDensity * (1 + w.rain * 0.55);

    // directional light follows the camera for tight shadow maps
    const sunPos = new THREE.Vector3().copy(playerPos || camera.position).add(sunDir.clone().multiplyScalar(120));
    this.sun.position.copy(sunPos);
    this.sun.target.position.copy(playerPos || camera.position);
    this.sun.color.copy(g.sun);
    this.sun.intensity = isNight ? 0.02 : sunStrength * (1 - cloudCover * 0.6) * 2.6;
    this.sun.castShadow = !isNight && cloudCover < 0.85;

    this.ambient.color.copy(g.ambSky);
    this.ambient.groundColor.setHex(isNight ? 0x0b0d12 : 0x33302a);
    this.ambient.intensity = g.amb * (1 - cloudCover * 0.2) * (isNight ? 1.15 : 1.25) + w.radStorm * 0.05;
    // interiors get a soft fill so rooms stay readable instead of pitch black
    this.ambient.intensity *= 1 + (this.indoorBlend ?? 0) * 1.9;
    this.ambient.color.lerp(new THREE.Color(0xffe4c4), (this.indoorBlend ?? 0) * 0.65);

    this.moon.position.copy(playerPos || camera.position).add(nightDir.clone().multiplyScalar(80));
    this.moon.target.position.copy(playerPos || camera.position);
    this.moon.intensity = isNight ? 3.1 * (1 - cloudCover * 0.45) : 0;

    // sky mesh follows camera
    this.mesh.position.copy(camera.position);
    this.mesh.scale.setScalar(900);

    this.scene.background = null;
    this.renderer.setClearColor(0x000000, 1);
  }

  get daylight() {
    const h = this.timeOfDay;
    return smoothstep(5.2, 7.0, h) * (1 - smoothstep(18.8, 20.4, h));
  }

  get isNight() {
    return this.daylight < 0.15;
  }

  get hour() {
    return this.timeOfDay;
  }
}
