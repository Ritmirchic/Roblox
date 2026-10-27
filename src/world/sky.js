// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// world/sky.js — sky dome, sun, stars, clouds, weather, day/night
// ============================================================
import * as THREE from 'three';
import { RNG, clamp, lerp, smoothstep, saturate } from '../core/util.js';

const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_Position.z = gl_Position.w; // push to far plane
}`;

const SKY_FRAG = /* glsl */`
precision highp float;
varying vec3 vDir;
uniform vec3 topColor;
uniform vec3 horizonColor;
uniform vec3 groundColor;
uniform vec3 sunDir;
uniform vec3 sunColor;
uniform float sunSize;
uniform float haze;
uniform float time;
uniform float cloudCover;
uniform float starAmount;
uniform vec3 cloudColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col;
  if (h > 0.0) {
    float k = pow(smoothstep(0.0, 0.62, h), 0.72);
    col = mix(horizonColor, topColor, k);
  } else {
    col = mix(horizonColor * 0.86, groundColor, smoothstep(0.0, -0.28, h));
  }
  // sun disc + glow
  float sd = max(dot(d, sunDir), 0.0);
  col += sunColor * pow(sd, 9000.0) * 9.0;
  col += sunColor * pow(sd, 40.0) * 0.20 * (1.0 - haze);
  col += sunColor * pow(sd, 3.0) * 0.06;
  // horizon haze band: dusty, slightly darker than the sky itself so the far
  // hills do not sit on a white sheet
  float band = exp(-abs(h) * 16.0) * haze;
  vec3 dust = horizonColor * vec3(0.86, 0.80, 0.72);
  col = mix(col, dust, band * 0.62);
  // clouds
  if (h > -0.02) {
    vec2 cp = d.xz / max(h + 0.14, 0.08) * 0.55 + vec2(time * 0.0035, time * 0.0022);
    float c = fbm(cp * 1.3);
    c = smoothstep(0.48 - cloudCover * 0.34, 0.78, c);
    float fade = smoothstep(-0.02, 0.22, h);
    col = mix(col, cloudColor, c * fade * 0.82);
  }
  // stars
  if (starAmount > 0.001 && h > 0.02) {
    vec2 sp = floor(d.xz / max(h, 0.05) * 140.0);
    float s = hash(sp);
    if (s > 0.9965) {
      float tw = 0.65 + 0.35 * sin(time * 2.0 + s * 90.0);
      col += vec3(0.85, 0.9, 1.0) * starAmount * tw * smoothstep(0.02, 0.3, h);
    }
  }
  gl_FragColor = vec4(col, 1.0);
}`;

const WEATHER = {
  clear: { name: 'Clear', fog: 0.0026, cloud: 0.28, rain: 0, wind: 0.15, wet: 0, haze: 0.35, light: 1.0 },
  overcast: { name: 'Overcast', fog: 0.0038, cloud: 0.72, rain: 0, wind: 0.35, wet: 0.15, haze: 0.6, light: 0.72 },
  rain_light: { name: 'Light Rain', fog: 0.0042, cloud: 0.8, rain: 0.35, wind: 0.45, wet: 0.6, haze: 0.7, light: 0.6 },
  rain_heavy: { name: 'Heavy Rain', fog: 0.0062, cloud: 0.94, rain: 0.9, wind: 0.8, wet: 1.0, haze: 0.85, light: 0.45 },
  storm: { name: 'Thunderstorm', fog: 0.0075, cloud: 1.0, rain: 1.0, wind: 1.0, wet: 1.0, haze: 0.9, light: 0.32 },
  fog: { name: 'Dense Fog', fog: 0.014, cloud: 0.65, rain: 0.1, wind: 0.1, wet: 0.7, haze: 1.0, light: 0.55 },
  radstorm: { name: 'Radiation Storm', fog: 0.011, cloud: 0.9, rain: 0.25, wind: 1.0, wet: 0.3, haze: 1.0, light: 0.4 },
};

export class Sky {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.time = 0;
    this.dayTime = 0.34; // 0..1 ; 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
    this.dayLength = 60 * 24; // 24 real minutes per in-game day
    this.uniforms = {
      topColor: { value: new THREE.Color(0x4a6a8e) },
      horizonColor: { value: new THREE.Color(0xb8bcbc) },
      groundColor: { value: new THREE.Color(0x2a2620) },
      sunDir: { value: new THREE.Vector3(0.4, 0.8, 0.3) },
      sunColor: { value: new THREE.Color(0xfff0d8) },
      sunSize: { value: 1.0 },
      haze: { value: 0.4 },
      time: { value: 0 },
      cloudCover: { value: 0.3 },
      starAmount: { value: 0 },
      cloudColor: { value: new THREE.Color(0x8a9096) },
    };
    const geo = new THREE.SphereGeometry(1600, 32, 20);
    const mat = new THREE.ShaderMaterial({
      vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
      uniforms: this.uniforms, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    });
    this.dome = new THREE.Mesh(geo, mat);
    this.dome.frustumCulled = false;
    this.dome.renderOrder = -1000;
    scene.add(this.dome);
    this.buildFarTerrain();

    this.sunDir = new THREE.Vector3(0.4, 0.8, 0.3);
    this.weather = 'overcast';
    this.weatherTarget = 'overcast';
    this.weatherBlend = { fog: WEATHER.overcast.fog, cloud: 0.72, rain: 0, wind: 0.35, wet: 0.15, haze: 0.6, light: 0.72 };
    this.lightning = 0;
    this.lightningTimer = 20;
    this.rain = this.buildRain();
    this.starsVisible = 0;
  }

  // Distant mountain ridges so the world edge reads as a horizon, not a void
  buildFarTerrain() {
    // Two hazy ridges. They are pure silhouettes: lighting them would read as
    // a painted backdrop, so the colour is driven by the horizon palette and
    // the fog is disabled (real fog at 900 m saturates to pure white).
    for (let ring = 0; ring < 2; ring++) {
      const radius = 760 + ring * 260;
      const segs = 192;
      const positions = [];
      const indices = [];
      const heightAt = (a, r) => {
        // smooth multi-octave ridge, no per-vertex sawtooth
        const o1 = Math.sin(a * 2.1 + r * 1.7) * 0.5 + 0.5;
        const o2 = Math.sin(a * 5.3 + r * 4.1 + 1.3) * 0.5 + 0.5;
        const o3 = Math.sin(a * 11.7 + r * 9.7 + 2.6) * 0.5 + 0.5;
        const base = ring === 0 ? 46 : 74;
        const amp = ring === 0 ? 52 : 96;
        return base + (o1 * 0.58 + o2 * 0.29 + o3 * 0.13) * amp;
      };
      const colors = [];
      const hMax = (ring === 0 ? 46 : 74) + (ring === 0 ? 52 : 96);
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        const h = heightAt(a, ring);
        const x = Math.cos(a) * radius, z = Math.sin(a) * radius;
        const x2 = Math.cos(a) * (radius + 60), z2 = Math.sin(a) * (radius + 60);
        positions.push(x, -40, z, x2, h, z2);
        // vertical gradient: haze pools at the foot of the ridge, the crest is
        // the darkest part of the silhouette
        const crest = Math.min(1, Math.max(0, h / hMax));
        const foot = 0.98, top = 0.30 + crest * 0.5;
        colors.push(foot, foot, foot, top, top, top);
      }
      for (let i = 0; i < segs; i++) {
        const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
        indices.push(a, c, b, b, c, d);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      g.setIndex(indices);
      const m = new THREE.MeshBasicMaterial({
        color: ring === 0 ? 0x2c3438 : 0x3a434a,
        vertexColors: true,
        fog: false, side: THREE.DoubleSide, depthWrite: true,
      });
      const mesh = new THREE.Mesh(g, m);
      mesh.frustumCulled = false;
      mesh.renderOrder = -900;
      this.scene.add(mesh);
      this.farRidges = this.farRidges || [];
      this.farRidges.push(mesh);
    }
  }

  buildRain() {
    // Streaks, not dots: a point sprite at this scale reads as snowfall (or
    // stars at night). Each drop is a short two-vertex segment.
    const count = 3200;
    const pos = new Float32Array(count * 6);
    const vel = new Float32Array(count);
    const lens = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 60;
      const y = Math.random() * 26;
      const z = (Math.random() - 0.5) * 60;
      vel[i] = 22 + Math.random() * 14;
      const len = 0.32 + Math.random() * 0.34;
      lens[i] = len;
      pos[i * 6] = x; pos[i * 6 + 1] = y; pos[i * 6 + 2] = z;
      pos[i * 6 + 3] = x + 0.06; pos[i * 6 + 4] = y + len; pos[i * 6 + 5] = z + 0.05;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0x9fb4c2, transparent: true, opacity: 0.0, depthWrite: false, fog: false,
    });
    const rain = new THREE.LineSegments(geo, mat);
    rain.frustumCulled = false;
    rain.userData.vel = vel;
    rain.userData.len = lens;
    this.scene.add(rain);
    return rain;
  }

  setWeather(name, instant = false) {
    if (!WEATHER[name]) return;
    this.weather = name;
    this.weatherTarget = name;
    if (instant) {
      const w = WEATHER[name];
      Object.assign(this.weatherBlend, w);
      this.weatherBlend.fog = w.fog; this.weatherBlend.cloud = w.cloud;
      this.weatherBlend.rain = w.rain; this.weatherBlend.wind = w.wind;
      this.weatherBlend.wet = w.wet; this.weatherBlend.haze = w.haze; this.weatherBlend.light = w.light;
    }
  }

  get isNight() { return this.dayTime < 0.24 || this.dayTime > 0.78; }
  get hour() { return this.dayTime * 24; }

  update(dt, camera, sunLight, hemiLight, sceneRef, playerPos) {
    this.time += dt;
    this.dayTime = (this.dayTime + dt / this.dayLength) % 1;
    // weather easing
    const w = WEATHER[this.weatherTarget];
    const k = 1 - Math.exp(-dt * 0.12);
    this.weatherBlend.fog += (w.fog - this.weatherBlend.fog) * k;
    this.weatherBlend.cloud += (w.cloud - this.weatherBlend.cloud) * k;
    this.weatherBlend.rain += (w.rain - this.weatherBlend.rain) * k;
    this.weatherBlend.wind += (w.wind - this.weatherBlend.wind) * k;
    this.weatherBlend.wet += (w.wet - this.weatherBlend.wet) * k;
    this.weatherBlend.haze += (w.haze - this.weatherBlend.haze) * k;
    this.weatherBlend.light += (w.light - this.weatherBlend.light) * k;

    // sun position: elevation over the day
    const ang = (this.dayTime - 0.25) * Math.PI * 2;
    const elev = Math.sin(ang);
    const azim = Math.cos(ang);
    this.sunDir.set(azim * 0.82, elev, 0.42 + azim * 0.25).normalize();
    const dayAmt = saturate(elev * 1.8 + 0.22);
    const twilight = saturate(1 - Math.abs(elev) * 5.5);
    this.dayAmt = dayAmt;

    // palette
    const nightTop = new THREE.Color(0x080d18);
    const nightHorizon = new THREE.Color(0x161c26);
    const dayTop = new THREE.Color(0x40628c);
    const dayHorizon = new THREE.Color(0xa8b2b8);
    const duskTop = new THREE.Color(0x2a3350);
    const duskHorizon = new THREE.Color(0xc07a52);
    const top = nightTop.clone().lerp(dayTop, dayAmt);
    const hor = nightHorizon.clone().lerp(dayHorizon, dayAmt);
    if (twilight > 0.02) {
      top.lerp(duskTop, twilight * 0.55);
      hor.lerp(duskHorizon, twilight * 0.75);
    }
    // weather desaturation
    const wx = this.weatherBlend;
    hor.lerp(new THREE.Color(0x8c9298), wx.cloud * 0.5 * dayAmt);
    top.lerp(new THREE.Color(0x4c545c), wx.cloud * 0.42 * dayAmt);
    this.uniforms.topColor.value.copy(top);
    this.uniforms.horizonColor.value.copy(hor);
    this.uniforms.groundColor.value.copy(hor).multiplyScalar(0.28);
    this.uniforms.sunDir.value.copy(this.sunDir);
    this.uniforms.sunColor.value.setRGB(1.0, 0.94, 0.84).lerp(new THREE.Color(0xff8a40), twilight * 0.8);
    this.uniforms.haze.value = wx.haze;
    this.uniforms.time.value = this.time;
    this.uniforms.cloudCover.value = wx.cloud;
    this.uniforms.cloudColor.value.copy(hor).multiplyScalar(0.86).lerp(new THREE.Color(0x1b2028), 1 - dayAmt);
    this.starsVisible = saturate(1 - dayAmt * 2.2) * (1 - wx.cloud * 0.8);
    this.uniforms.starAmount.value = this.starsVisible;

    // fog + light. The fog colour is deliberately a little darker and dirtier
    // than the horizon: matching it exactly made the fogged edge of the map read
    // as a bright white band under the sky.
    if (sceneRef) {
      if (!sceneRef.fog) sceneRef.fog = new THREE.FogExp2(0x8c9298, 0.004);
      sceneRef.fog.color.copy(hor).multiplyScalar(0.62 + 0.10 * dayAmt).lerp(new THREE.Color(0x4a4a44), 0.18);
      sceneRef.fog.density = wx.fog * 1.15;
    }
    if (sunLight) {
      sunLight.position.copy(playerPos).addScaledVector(this.sunDir, 120);
      sunLight.target.position.copy(playerPos);
      sunLight.target.updateMatrixWorld();
      sunLight.color.setRGB(1.0, 0.95, 0.88).lerp(new THREE.Color(0xff9050), twilight * 0.9);
      sunLight.intensity = (0.55 + dayAmt * 3.0) * wx.light;
      sunLight.castShadow = true;
    }
    if (hemiLight) {
      // at night mix hard toward moonlit blue: the raw night sky colour is so
      // dark that ambient light alone left the ground black
      hemiLight.color.copy(top).lerp(new THREE.Color(0x93a8c8), 0.22 + (1 - dayAmt) * 0.45);
      hemiLight.groundColor.setRGB(0.14, 0.12, 0.1).multiplyScalar(0.6 + dayAmt);
      // night has no sun: without a floor here the ground goes pitch black and
      // the player cannot see a metre ahead.
      hemiLight.intensity = 0.60 + dayAmt * 0.85 + wx.light * 0.2;
    }
    // dome follows camera
    if (camera) this.dome.position.copy(camera.position);
    if (this.farRidges) this.farRidges.forEach((m, i) => {
      // aerial perspective: blend the ridge toward the horizon rather than
      // letting exponential fog clip it to white
      // the far ring is hazier (closer to the horizon colour) than the near one
      const near = i === 0;
      const c = hor.clone().multiplyScalar(near ? 0.30 : 0.42);
      c.lerp(new THREE.Color(0x0b1016), 0.18 + (1 - dayAmt) * 0.55);
      const dust = new THREE.Color(0x2a2620);
      c.lerp(dust, (1 - dayAmt) * 0.25 + wx.wet * 0.1);
      c.lerp(hor, wx.cloud * 0.10 * dayAmt);
      m.material.color.copy(c);
    });

    // rain
    if (this.rain) {
      const mat = this.rain.material;
      mat.opacity = wx.rain * 0.55;
      this.rain.visible = wx.rain > 0.02;
      if (this.rain.visible && playerPos) {
        const pos = this.rain.geometry.attributes.position;
        const vel = this.rain.userData.vel;
        const n = vel.length;
        const lens = this.rain.userData.len;
        const windX = this.sunDir.x * wx.wind * 6;
        const windZ = this.sunDir.z * wx.wind * 2;
        for (let i = 0; i < n; i++) {
          const b = i * 6;
          let y = pos.getY(b);
          let x = pos.getX(b);
          let z = pos.getZ(b);
          y -= vel[i] * dt; x += windX * dt; z += windZ * dt;
          if (y < -2) { y = 24 + Math.random() * 6; x = (Math.random() - 0.5) * 60; z = (Math.random() - 0.5) * 60; }
          const len = lens[i];
          pos.setXYZ(b, x, y, z);
          pos.setXYZ(b + 1, x + 0.06, y + len, z + 0.05);
        }
        pos.needsUpdate = true;
        this.rain.position.set(playerPos.x, playerPos.y, playerPos.z);
      }
    }
    // lightning
    if (this.weatherTarget === 'storm' || this.weatherTarget === 'radstorm') {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightning = 1;
        this.lightningTimer = 6 + Math.random() * 14;
      }
    }
    if (this.lightning > 0) {
      this.lightning = Math.max(0, this.lightning - dt * 4.2);
      const f = this.lightning > 0.55 ? (Math.random() > 0.4 ? 1 : 0.3) : this.lightning * 1.4;
      this.uniforms.topColor.value.addScalar(f * 0.5);
      this.uniforms.horizonColor.value.addScalar(f * 0.6);
      if (hemiLight) hemiLight.intensity += f * 2.2;
      if (sunLight) sunLight.intensity += f * 1.6;
    }
    return { dayAmt, twilight };
  }

  get fogDensity() { return this.weatherBlend.fog; }
  get wetness() { return this.weatherBlend.wet; }
  get wind() { return this.weatherBlend.wind; }
  get rainAmount() { return this.weatherBlend.rain; }
  get weatherName() { return WEATHER[this.weatherTarget].name; }
}

export { WEATHER };
