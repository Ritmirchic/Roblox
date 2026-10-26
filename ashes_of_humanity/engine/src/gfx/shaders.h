#pragma once

namespace aoh { namespace shaders {

// ===========================================================================
// Shared GLSL snippets
// ===========================================================================
static const char* COMMON = R"(#version 330 core
const float PI = 3.14159265359;

vec3 F_Schlick(vec3 f0, float u) { return f0 + (1.0 - f0) * pow(clamp(1.0 - u, 0.0, 1.0), 5.0); }
float D_GGX(float NoH, float a) {
  float a2 = a * a;
  float d = (NoH * a2 - NoH) * NoH + 1.0;
  return a2 / max(PI * d * d, 1e-7);
}
float V_SmithGGXCorrelated(float NoV, float NoL, float a) {
  float a2 = a * a;
  float gv = NoL * sqrt(NoV * NoV * (1.0 - a2) + a2);
  float gl = NoV * sqrt(NoL * NoL * (1.0 - a2) + a2);
  return 0.5 / max(gv + gl, 1e-5);
}
float D_Charlie(float NoH, float rough) {
  float invAlpha = 1.0 / max(rough * rough, 1e-4);
  float cos2 = NoH * NoH;
  float sin2 = max(1.0 - cos2, 0.0078125);
  return (2.0 + invAlpha) * pow(sin2, invAlpha * 0.5) / (2.0 * PI);
}
float V_Kelemen(float LoH) { return 0.25 / max(LoH * LoH, 1e-5); }
)";

// ===========================================================================
// Atmospheric sky model - shared by the sky pass and the ambient term
// ===========================================================================
static const char* SKY_FN = R"(
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uZenithColor;
uniform vec3 uHorizonColor;
uniform vec3 uGroundColor;
uniform float uSkyExposure;

vec3 skyRadiance(vec3 dir) {
  float h = clamp(dir.y, -1.0, 1.0);
  float t = clamp(h * 0.5 + 0.5, 0.0, 1.0);
  float grad = pow(smoothstep(0.0, 1.0, t), 0.55);
  vec3 col = mix(uHorizonColor, uZenithColor, grad);
  // below horizon fades to ground bounce
  col = mix(col, uGroundColor, smoothstep(0.0, -0.25, h));
  // sun disc + halo
  float sd = max(dot(dir, uSunDir), 0.0);
  col += uSunColor * (pow(sd, 900.0) * 14.0 + pow(sd, 12.0) * 0.35);
  return col * uSkyExposure;
}

// Cheap analytic ambient: sky above, bounce below.
vec3 ambientIBL(vec3 n, float ao) {
  float up = n.y * 0.5 + 0.5;
  vec3 sky = mix(uHorizonColor, uZenithColor, up);
  vec3 gnd = uGroundColor;
  vec3 irr = mix(gnd, sky, smoothstep(0.0, 1.0, up));
  return irr * ao;
}
)";

// ===========================================================================
// Main scene pass
// ===========================================================================
static const char* SCENE_VERT = R"(#version 330 core
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec4 aTangent;
layout(location = 3) in vec2 aUV;
layout(location = 4) in vec4 aColor;
layout(location = 5) in vec4 aJoints;
layout(location = 6) in vec4 aWeights;

uniform mat4 uModel;
uniform mat4 uViewProj;
uniform mat3 uNormalMat;
uniform int  uSkinned;
uniform sampler2D uBoneTex;
uniform int  uBoneRow;

out vec3 vWorld;
out vec3 vNormal;
out vec4 vTangent;
out vec2 vUV;
out vec4 vColor;
out vec4 vLightPos;

vec4 boneTexel(int b, int row) { return texelFetch(uBoneTex, ivec2(b * 4 + row, uBoneRow), 0); }

void main() {
  vec3 pos = aPos;
  vec3 nrm = aNormal;
  vec4 tan = aTangent;
  if (uSkinned == 1) {
    mat4 skin = mat4(0.0);
    float wsum = aWeights.x + aWeights.y + aWeights.z + aWeights.w;
    if (wsum > 0.0001) {
      skin  = boneTexel(int(aJoints.x), 0) * aWeights.x;
      skin += boneTexel(int(aJoints.y), 0) * aWeights.y;
      skin += boneTexel(int(aJoints.z), 0) * aWeights.z;
      skin += boneTexel(int(aJoints.w), 0) * aWeights.w;
      mat4 b0 = mat4(0.0); b0[0] = boneTexel(int(aJoints.x),0); b0[1] = boneTexel(int(aJoints.x),1);
      b0[2] = boneTexel(int(aJoints.x),2); b0[3] = boneTexel(int(aJoints.x),3);
      mat4 b1 = mat4(0.0); b1[0] = boneTexel(int(aJoints.y),0); b1[1] = boneTexel(int(aJoints.y),1);
      b1[2] = boneTexel(int(aJoints.y),2); b1[3] = boneTexel(int(aJoints.y),3);
      mat4 b2 = mat4(0.0); b2[0] = boneTexel(int(aJoints.z),0); b2[1] = boneTexel(int(aJoints.z),1);
      b2[2] = boneTexel(int(aJoints.z),2); b2[3] = boneTexel(int(aJoints.z),3);
      mat4 b3 = mat4(0.0); b3[0] = boneTexel(int(aJoints.w),0); b3[1] = boneTexel(int(aJoints.w),1);
      b3[2] = boneTexel(int(aJoints.w),2); b3[3] = boneTexel(int(aJoints.w),3);
      mat4 sk = b0 * aWeights.x + b1 * aWeights.y + b2 * aWeights.z + b3 * aWeights.w;
      pos = (sk * vec4(pos, 1.0)).xyz;
      mat3 nm = mat3(sk);
      nrm = normalize(nm * nrm);
      tan = vec4(normalize(nm * tan.xyz), tan.w);
    }
  }
  vec4 wp = uModel * vec4(pos, 1.0);
  vWorld = wp.xyz;
  vNormal = normalize(uNormalMat * nrm);
  vTangent = vec4(normalize(uNormalMat * tan.xyz), tan.w);
  vUV = aUV;
  vColor = aColor;
  vLightPos = vec4(0.0);
  gl_Position = uViewProj * wp;
}
)";

static const char* SCENE_FRAG = R"(#version 330 core
in vec3 vWorld;
in vec3 vNormal;
in vec4 vTangent;
in vec2 vUV;
in vec4 vColor;
in vec4 vLightPos;

out vec4 FragColor;

uniform vec3  uCameraPos;
uniform float uTime;

uniform vec4  uAlbedo;
uniform float uMetallic;
uniform float uRoughness;
uniform vec4  uEmissive;
uniform float uNormalStrength;
uniform int   uFlags;

uniform sampler2D uAlbedoTex;
uniform sampler2D uNormalTex;
uniform sampler2D uOrmTex;
uniform int   uHasAlbedoTex;
uniform int   uHasNormalTex;
uniform int   uHasOrmTex;

uniform mat4  uShadowMat[4];
uniform float uCascadeSplits[4];
uniform sampler2D uShadowMap;
uniform int   uCascadeCount;
uniform float uShadowTexel;

uniform int   uLightCount;
uniform vec4  uLightPosRange[16];   // xyz pos, w range
uniform vec4  uLightColorType[16];  // rgb color, a type (0 point, 1 spot)
uniform vec4  uLightDirCone[16];    // xyz dir, w cos(outer)
uniform vec4  uLightExtra[16];      // x cos(inner), y intensity, z unused, w unused

uniform vec3  uFogColor;
uniform float uFogDensity;
uniform float uFogHeight;
uniform float uFogStart;

uniform float uAlphaCutoff;
uniform float uTimeOfDay;

vec3 perturbNormal(vec3 N, vec3 V, vec2 uv, float strength) {
  if (uHasNormalTex == 0) return N;
  vec3 map = texture(uNormalTex, uv).xyz * 2.0 - 1.0;
  map.xy *= strength;
  vec3 q1 = dFdx(V);
  vec3 q2 = dFdy(V);
  vec2 st1 = dFdx(uv);
  vec2 st2 = dFdy(uv);
  vec3 T = normalize(q1 * st2.t - q2 * st1.t);
  vec3 B = -normalize(cross(N, T));
  mat3 tsn = mat3(T, B, N);
  return normalize(tsn * map);
}

float sampleShadow(vec3 worldPos, vec3 N, float NoL) {
  if (uCascadeCount == 0) return 1.0;
  float d = distance(uCameraPos, worldPos);
  int c = 0;
  if (d > uCascadeSplits[0]) c = 1;
  if (d > uCascadeSplits[1]) c = 2;
  if (d > uCascadeSplits[2]) c = 3;
  if (c >= uCascadeCount) c = uCascadeCount - 1;
  vec4 sc = uShadowMat[c] * vec4(worldPos, 1.0);
  vec3 p = sc.xyz / sc.w;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0 || p.z > 1.0) return 1.0;
  float bias = max(0.0016 * (1.0 - NoL), 0.00035);
  float sum = 0.0;
  for (int y = -1; y <= 1; ++y) {
    for (int x = -1; x <= 1; ++x) {
      vec2 off = vec2(float(x), float(y)) * uShadowTexel;
      float s = texture(uShadowMap, p.xy + off).r;
      sum += (p.z - bias > s) ? 0.0 : 1.0;
    }
  }
  return sum / 9.0;
}

void main() {
  vec4 base = uAlbedo * vColor;
  if (uHasAlbedoTex == 1) base *= texture(uAlbedoTex, vUV);
  if (uAlphaCutoff > 0.0 && base.a < uAlphaCutoff) discard;

  float ao = 1.0, rough = uRoughness, metal = uMetallic;
  if (uHasOrmTex == 1) {
    vec3 orm = texture(uOrmTex, vUV).rgb;
    ao *= orm.r;
    rough *= clamp(orm.g, 0.04, 1.0);
    metal *= orm.b;
  }
  rough = clamp(rough, 0.045, 1.0);

  vec3 V = normalize(uCameraPos - vWorld);
  vec3 N = normalize(vNormal);
  if ((uFlags & 2) != 0) {           // double sided
    if (dot(N, V) < 0.0) N = -N;
  }
  vec3 Np = perturbNormal(N, V, vUV, uNormalStrength);
  vec3 albedo = base.rgb;
  vec3 f0 = mix(vec3(0.04), albedo, metal);
  vec3 diffuseColor = albedo * (1.0 - metal);

  // ---- sun ----
  vec3 L = normalize(uSunDir);
  float NoL = max(dot(Np, L), 0.0);
  float shadow = sampleShadow(vWorld, Np, NoL);
  vec3 sunRadiance = uSunColor;
  vec3 Lo = vec3(0.0);
  if (NoL > 0.0) {
    vec3 H = normalize(V + L);
    float NoH = max(dot(Np, H), 0.0);
    float NoV = max(dot(Np, V), 1e-4);
    float VoH = max(dot(V, H), 0.0);
    float a = rough * rough;
    vec3 F = F_Schlick(f0, VoH);
    float D = D_GGX(NoH, a);
    float Vs = V_SmithGGXCorrelated(NoV, NoL, a);
    vec3 spec = F * (D * Vs);
    vec3 kd = (vec3(1.0) - F);
    Lo += (kd * diffuseColor / PI + spec) * sunRadiance * NoL * shadow;
  }

  // ---- punctual lights ----
  for (int i = 0; i < uLightCount; ++i) {
    vec3 lp = uLightPosRange[i].xyz;
    float range = uLightPosRange[i].w;
    vec3 d = lp - vWorld;
    float dist = length(d);
    if (dist > range) continue;
    vec3 Ld = d / max(dist, 1e-4);
    float att = clamp(1.0 - dist / range, 0.0, 1.0);
    att = att * att;
    float spotK = 1.0;
    float type = uLightColorType[i].a;
    if (type > 0.5) {
      float cd = dot(-Ld, normalize(uLightDirCone[i].xyz));
      float co = uLightDirCone[i].w;
      float ci = uLightExtra[i].x;
      spotK = clamp((cd - co) / max(ci - co, 1e-4), 0.0, 1.0);
      spotK *= spotK;
      if (spotK <= 0.0) continue;
    }
    float nl = max(dot(Np, Ld), 0.0);
    if (nl <= 0.0) continue;
    vec3 H = normalize(V + Ld);
    float NoH = max(dot(Np, H), 0.0);
    float NoV = max(dot(Np, V), 1e-4);
    float VoH = max(dot(V, H), 0.0);
    float a = rough * rough;
    vec3 F = F_Schlick(f0, VoH);
    float D = D_GGX(NoH, a);
    float Vs = V_SmithGGXCorrelated(NoV, nl, a);
    vec3 spec = F * (D * Vs);
    vec3 kd = (vec3(1.0) - F);
    float intensity = uLightExtra[i].y;
    Lo += (kd * diffuseColor / PI + spec) * uLightColorType[i].rgb * intensity * nl * att * spotK;
  }

  // ---- ambient / IBL ----
  vec3 amb = ambientIBL(Np, ao);
  vec3 Fr = F_Schlick(f0, max(dot(Np, V), 0.0));
  float specOcc = clamp(pow(ao, 1.5), 0.0, 1.0);
  vec3 ambSpec = mix(uHorizonColor, uZenithColor, Np.y * 0.5 + 0.5) * (1.0 - rough * 0.85) * specOcc;
  Lo += diffuseColor * amb + ambSpec * Fr * 1.2;

  // ---- emissive ----
  vec3 emis = uEmissive.rgb;
  if (uEmissive.a > 0.0) {
    // animated screens / warning lights
    float pulse = 0.75 + 0.25 * sin(uTime * 3.0 + vWorld.y * 0.5);
    emis *= pulse;
  }
  Lo += emis;

  // ---- fog ----
  float dist = distance(uCameraPos, vWorld);
  float heightF = exp(-max(vWorld.y - uFogHeight, 0.0) * 0.06);
  float fogAmt = 1.0 - exp(-max(dist - uFogStart, 0.0) * uFogDensity * heightF);
  float sunAmount = pow(max(dot(-V, normalize(uSunDir)), 0.0), 6.0);
  vec3 fogCol = mix(uFogColor, uSunColor * 0.9, sunAmount * 0.55);
  Lo = mix(Lo, fogCol, clamp(fogAmt, 0.0, 1.0));

  FragColor = vec4(Lo, base.a);
}
)";

// ===========================================================================
// Depth-only shadow pass
// ===========================================================================
static const char* SHADOW_VERT = R"(#version 330 core
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec4 aTangent;
layout(location = 3) in vec2 aUV;
layout(location = 4) in vec4 aColor;
layout(location = 5) in vec4 aJoints;
layout(location = 6) in vec4 aWeights;

uniform mat4 uModel;
uniform mat4 uViewProj;
uniform int  uSkinned;
uniform sampler2D uBoneTex;
uniform int  uBoneRow;

vec4 boneTexel(int b, int row) { return texelFetch(uBoneTex, ivec2(b * 4 + row, uBoneRow), 0); }

void main() {
  vec3 pos = aPos;
  if (uSkinned == 1) {
    mat4 b0 = mat4(0.0); b0[0]=boneTexel(int(aJoints.x),0); b0[1]=boneTexel(int(aJoints.x),1);
    b0[2]=boneTexel(int(aJoints.x),2); b0[3]=boneTexel(int(aJoints.x),3);
    mat4 b1 = mat4(0.0); b1[0]=boneTexel(int(aJoints.y),0); b1[1]=boneTexel(int(aJoints.y),1);
    b1[2]=boneTexel(int(aJoints.y),2); b1[3]=boneTexel(int(aJoints.y),3);
    mat4 b2 = mat4(0.0); b2[0]=boneTexel(int(aJoints.z),0); b2[1]=boneTexel(int(aJoints.z),1);
    b2[2]=boneTexel(int(aJoints.z),2); b2[3]=boneTexel(int(aJoints.z),3);
    mat4 b3 = mat4(0.0); b3[0]=boneTexel(int(aJoints.w),0); b3[1]=boneTexel(int(aJoints.w),1);
    b3[2]=boneTexel(int(aJoints.w),2); b3[3]=boneTexel(int(aJoints.w),3);
    mat4 sk = b0*aWeights.x + b1*aWeights.y + b2*aWeights.z + b3*aWeights.w;
    pos = (sk * vec4(pos,1.0)).xyz;
  }
  gl_Position = uViewProj * uModel * vec4(pos, 1.0);
}
)";

static const char* SHADOW_FRAG = R"(#version 330 core
void main() {}
)";

// ===========================================================================
// Sky (fullscreen)
// ===========================================================================
static const char* SKY_VERT = R"(#version 330 core
layout(location = 0) in vec3 aPos;
out vec3 vDir;
uniform mat4 uInvViewProj;
uniform vec3 uCameraPos;
void main() {
  vec4 p = uInvViewProj * vec4(aPos.xy, 1.0, 1.0);
  vDir = p.xyz / p.w - uCameraPos;
  gl_Position = vec4(aPos.xy, 1.0, 1.0);
}
)";

static const char* SKY_FRAG = R"(#version 330 core
in vec3 vDir;
out vec4 FragColor;
)";

// ===========================================================================
// Particle billboards (instanced, soft depth fade)
// ===========================================================================
static const char* PARTICLE_VERT = R"(#version 330 core
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec3 aOffset;
layout(location = 2) in vec4 aColor;
layout(location = 3) in vec3 aParams;   // size, rotation, softness

uniform mat4 uViewProj;
uniform vec3 uCamRight;
uniform vec3 uCamUp;
uniform vec3 uCameraPos;

out vec2 vUV;
out vec4 vColor;
out vec3 vWorld;

void main() {
  float s = aParams.x;
  float rot = aParams.y;
  vec2 c = vec2(cos(rot), sin(rot));
  vec2 q = vec2(aCorner.x * c.x - aCorner.y * c.y, aCorner.x * c.y + aCorner.y * c.x);
  vec3 world = aOffset + uCamRight * (q.x * s) + uCamUp * (q.y * s);
  vWorld = world;
  vUV = aCorner * 0.5 + 0.5;
  vColor = aColor;
  gl_Position = uViewProj * vec4(world, 1.0);
}
)";

static const char* PARTICLE_FRAG = R"(#version 330 core
in vec2 vUV;
in vec4 vColor;
in vec3 vWorld;
out vec4 FragColor;
uniform sampler2D uTex;
uniform int uHasTex;
void main() {
  vec4 c = vColor;
  if (uHasTex == 1) c *= texture(uTex, vUV);
  else {
    vec2 d = vUV * 2.0 - 1.0;
    float r = dot(d, d);
    if (r > 1.0) discard;
    c.a *= pow(1.0 - r, 1.4);
  }
  if (c.a < 0.004) discard;
  FragColor = c;
}
)";

// ===========================================================================
// Post processing
// ===========================================================================
static const char* FULLSCREEN_VERT = R"(#version 330 core
layout(location = 0) in vec3 aPos;
out vec2 vUV;
void main() {
  vUV = aPos.xy * 0.5 + 0.5;
  gl_Position = vec4(aPos.xy, 0.0, 1.0);
}
)";

static const char* BRIGHT_FRAG = R"(#version 330 core
in vec2 vUV;
out vec4 FragColor;
uniform sampler2D uTex;
uniform float uThreshold;
void main() {
  vec3 c = texture(uTex, vUV).rgb;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float k = max(l - uThreshold, 0.0) / max(l, 1e-4);
  FragColor = vec4(c * k, 1.0);
}
)";

static const char* BLUR_FRAG = R"(#version 330 core
in vec2 vUV;
out vec4 FragColor;
uniform sampler2D uTex;
uniform vec2 uDir;      // texel-sized direction
void main() {
  vec3 c = texture(uTex, vUV).rgb * 0.227027;
  c += (texture(uTex, vUV + uDir * 1.3846).rgb + texture(uTex, vUV - uDir * 1.3846).rgb) * 0.316216;
  c += (texture(uTex, vUV + uDir * 3.2308).rgb + texture(uTex, vUV - uDir * 3.2308).rgb) * 0.070270;
  FragColor = vec4(c, 1.0);
}
)";

static const char* COMPOSITE_FRAG = R"(#version 330 core
in vec2 vUV;
out vec4 FragColor;

uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uExposure;
uniform float uBloomStrength;
uniform float uVignette;
uniform float uGrain;
uniform float uTime;
uniform float uSaturation;
uniform float uContrast;
uniform vec3  uLift;
uniform vec3  uGamma;
uniform vec3  uGain;
uniform float uFlashlightBoost;
uniform float uDamage;
uniform float uHeartbeat;
uniform float uFadeAmount;
uniform vec3  uFadeColor;

// ACES filmic approximation (Narkowicz)
vec3 aces(vec3 x) {
  const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec3 c = texture(uScene, vUV).rgb;
  vec3 b = texture(uBloom, vUV).rgb;
  c += b * uBloomStrength;

  c *= uExposure;

  // damage / heartbeat red pulse
  if (uDamage > 0.0) {
    float pulse = 1.0 + uHeartbeat * 0.35;
    c = mix(c, vec3(c.r * 1.35, c.g * 0.55, c.b * 0.5) * pulse, uDamage);
  }

  c = aces(c);

  // grade: lift / gamma / gain
  c = c * uGain + uLift;
  c = pow(max(c, vec3(0.0)), 1.0 / max(uGamma, vec3(0.01)));
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, uSaturation);
  c = (c - 0.5) * uContrast + 0.5;

  // vignette
  vec2 q = vUV - 0.5;
  float vig = 1.0 - dot(q, q) * uVignette;
  c *= clamp(vig, 0.0, 1.0);

  // film grain
  float g = hash12(vUV * 1024.0 + uTime * 60.0) - 0.5;
  c += g * uGrain;

  c = mix(c, uFadeColor, uFadeAmount);
  FragColor = vec4(max(c, vec3(0.0)), 1.0);
}
)";

static const char* FXAA_FRAG = R"(#version 330 core
in vec2 vUV;
out vec4 FragColor;
uniform sampler2D uTex;
uniform vec2 uTexel;
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
void main() {
  vec3 rgbM = texture(uTex, vUV).rgb;
  float lM = luma(rgbM);
  float lNW = luma(texture(uTex, vUV + vec2(-1.0, -1.0) * uTexel).rgb);
  float lNE = luma(texture(uTex, vUV + vec2( 1.0, -1.0) * uTexel).rgb);
  float lSW = luma(texture(uTex, vUV + vec2(-1.0,  1.0) * uTexel).rgb);
  float lSE = luma(texture(uTex, vUV + vec2( 1.0,  1.0) * uTexel).rgb);
  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
  float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
  vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), ((lNW + lSW) - (lNE + lSE)));
  float reduce = max((lNW + lNE + lSW + lSE) * 0.03125, 0.0078125);
  float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + reduce);
  dir = clamp(dir * rcp, vec2(-8.0), vec2(8.0)) * uTexel;
  vec3 rgbA = 0.5 * (texture(uTex, vUV + dir * (1.0 / 3.0 - 0.5)).rgb +
                     texture(uTex, vUV + dir * (2.0 / 3.0 - 0.5)).rgb);
  vec3 rgbB = rgbA * 0.5 + 0.25 * (texture(uTex, vUV - dir * 0.5).rgb +
                                   texture(uTex, vUV + dir * 0.5).rgb);
  float lB = luma(rgbB);
  FragColor = vec4((lB < lMin || lB > lMax) ? rgbA : rgbB, 1.0);
}
)";

// ===========================================================================
// UI / 2D textured quads (also used for world-space billboards and decals)
// ===========================================================================
static const char* UI_VERT = R"(#version 330 core
layout(location = 0) in vec2 aPos;
layout(location = 1) in vec2 aUV;
layout(location = 2) in vec4 aColor;
uniform mat4 uProj;
out vec2 vUV;
out vec4 vColor;
void main() {
  vUV = aUV;
  vColor = aColor;
  gl_Position = uProj * vec4(aPos, 0.0, 1.0);
}
)";

static const char* UI_FRAG = R"(#version 330 core
in vec2 vUV;
in vec4 vColor;
out vec4 FragColor;
uniform sampler2D uTex;
uniform int uHasTex;
void main() {
  vec4 c = vColor;
  if (uHasTex == 1) c *= texture(uTex, vUV);
  if (c.a < 0.002) discard;
  FragColor = c;
}
)";

}}
