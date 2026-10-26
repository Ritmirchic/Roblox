#include "gfx/renderer.h"
#include "gfx/shaders.h"
#include "platform/gl.h"
#include "core/util.h"
#include <cstring>

namespace aoh {

static const int VERTEX_STRIDE = 76;
static const int MAX_BONES = 48;
static const int MAX_BONE_ROWS = 128;

static const char* VERTEX_LAYOUT =
    "#version 330 core\n"
    "layout(location=0) in vec3 aPos;\n"
    "layout(location=1) in vec3 aNormal;\n"
    "layout(location=2) in vec4 aTangent;\n"
    "layout(location=3) in vec2 aUV;\n"
    "layout(location=4) in vec4 aColor;\n"
    "layout(location=5) in vec4 aJoints;\n"
    "layout(location=6) in vec4 aWeights;\n";

// ---------------------------------------------------------------------------
i32 Renderer::uniform(Program& p, const char* name) {
  auto it = p.uniforms.find(name);
  if (it != p.uniforms.end()) return it->second;
  i32 loc = glGetUniformLocation(p.id, name);
  p.uniforms[name] = loc;
  return loc;
}

u32 Renderer::compileProgram(const char* vert, const char* frag, const char* name) {
  u32 v = glCreateShader(GL_VERTEX_SHADER);
  glShaderSource(v, 1, &vert, nullptr);
  glCompileShader(v);
  GLint ok = 0;
  glGetShaderiv(v, GL_COMPILE_STATUS, &ok);
  if (!ok) {
    GLint len = 0;
    glGetShaderiv(v, GL_INFO_LOG_LENGTH, &len);
    std::vector<char> log(len > 0 ? len : 1);
    glGetShaderInfoLog(v, len, nullptr, log.data());
    LOGE("shader %s (vertex) failed:\n%s", name, log.data());
    glDeleteShader(v);
    return 0;
  }
  u32 f = glCreateShader(GL_FRAGMENT_SHADER);
  glShaderSource(f, 1, &frag, nullptr);
  glCompileShader(f);
  glGetShaderiv(f, GL_COMPILE_STATUS, &ok);
  if (!ok) {
    GLint len = 0;
    glGetShaderiv(f, GL_INFO_LOG_LENGTH, &len);
    std::vector<char> log(len > 0 ? len : 1);
    glGetShaderInfoLog(f, len, nullptr, log.data());
    LOGE("shader %s (fragment) failed:\n%s", name, log.data());
    glDeleteShader(f);
    glDeleteShader(v);
    return 0;
  }
  u32 p = glCreateProgram();
  glAttachShader(p, v);
  glAttachShader(p, f);
  glLinkProgram(p);
  glGetProgramiv(p, GL_LINK_STATUS, &ok);
  if (!ok) {
    GLint len = 0;
    glGetProgramiv(p, GL_INFO_LOG_LENGTH, &len);
    std::vector<char> log(len > 0 ? len : 1);
    glGetProgramInfoLog(p, len, nullptr, log.data());
    LOGE("shader %s link failed:\n%s", name, log.data());
    glDeleteProgram(p);
    p = 0;
  }
  glDeleteShader(v);
  glDeleteShader(f);
  if (p) LOGI("shader '%s' compiled (id=%u)", name, p);
  return p;
}

void Renderer::bindTexture(int unit, GpuTexture* t) {
  glActiveTexture(GL_TEXTURE0 + unit);
  if (t) glBindTexture(GL_TEXTURE_2D, t->id);
  else glBindTexture(GL_TEXTURE_2D, 0);
}

// ---------------------------------------------------------------------------
bool Renderer::init(void* nativeWindow, const RenderSettings& s) {
  settings = s;
  GLContextDesc cd;
  cd.width = s.width; cd.height = s.height; cd.vsync = s.vsync;
  if (!glInit(nativeWindow, cd)) {
    LOGE("renderer: GL init failed (%d unresolved entry points)", glLoadErrorCount());
    return false;
  }
  // HDR capability probe
  const char* ext = (const char*)glGetString(GL_EXTENSIONS);
  std::string e = ext ? ext : "";
  m_hdrSupported = e.find("GL_EXT_color_buffer_float") != std::string::npos ||
                   e.find("GL_ARB_color_buffer_float") != std::string::npos;
  if (!m_hdrSupported) LOGW("renderer: float render targets unsupported, falling back to RGBA8");

  // Programs
  std::string sceneVert = std::string(shaders::COMMON) + shaders::SCENE_VERT;
  std::string sceneFrag = std::string(shaders::COMMON) + shaders::SKY_FN + shaders::SCENE_FRAG;
  std::string skyFrag = std::string(shaders::COMMON) + shaders::SKY_FN + shaders::SKY_FRAG;
  m_scene.id     = compileProgram(sceneVert.c_str(), sceneFrag.c_str(), "scene");
  m_shadow.id    = compileProgram(shaders::SHADOW_VERT, shaders::SHADOW_FRAG, "shadow");
  m_skyProg.id       = compileProgram(shaders::SKY_VERT, skyFrag.c_str(), "sky");
  m_particle.id  = compileProgram(shaders::PARTICLE_VERT, shaders::PARTICLE_FRAG, "particle");
  m_bright.id    = compileProgram(shaders::FULLSCREEN_VERT, shaders::BRIGHT_FRAG, "bright");
  m_blur.id      = compileProgram(shaders::FULLSCREEN_VERT, shaders::BLUR_FRAG, "blur");
  m_composite.id = compileProgram(shaders::FULLSCREEN_VERT, shaders::COMPOSITE_FRAG, "composite");
  m_fxaa.id      = compileProgram(shaders::FULLSCREEN_VERT, shaders::FXAA_FRAG, "fxaa");
  m_ui.id        = compileProgram(shaders::UI_VERT, shaders::UI_FRAG, "ui");
  if (!m_scene.id || !m_shadow.id || !m_skyProg.id || !m_particle.id ||
      !m_bright.id || !m_blur.id || !m_composite.id || !m_fxaa.id || !m_ui.id) {
    LOGE("renderer: shader compilation failed");
    return false;
  }

  // Fullscreen triangle
  {
    float tri[6] = { -1, -1, 3, -1, -1, 3 };
    glGenVertexArrays(1, &m_quadVao);
    glGenBuffers(1, &m_quadVbo);
    glBindVertexArray(m_quadVao);
    glBindBuffer(GL_ARRAY_BUFFER, m_quadVbo);
    glBufferData(GL_ARRAY_BUFFER, sizeof(tri), tri, GL_STATIC_DRAW);
    glEnableVertexAttribArray(0);
    glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 0, (void*)0);
  }

  // Bone matrix texture
  m_boneTexWidth = MAX_BONES * 4;
  m_boneData.assign((size_t)m_boneTexWidth * MAX_BONE_ROWS * 4, 0.0f);
  glGenTextures(1, &m_boneTex);
  glBindTexture(GL_TEXTURE_2D, m_boneTex);
  glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA32F, m_boneTexWidth, MAX_BONE_ROWS, 0, GL_RGBA, GL_FLOAT, nullptr);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

  createTargets();
  m_cascadeCount = settings.shadows ? settings.cascadeCount : 0;
  m_initialized = true;
  LOGI("renderer: initialised (%dx%d, cascades=%d, hdr=%d)", settings.width, settings.height,
       m_cascadeCount, (int)m_hdrSupported);
  return true;
}

void Renderer::shutdown() {
  if (!m_initialized) return;
  for (int i = 0; i < 4; ++i) {
    if (m_shadowFbo[i]) glDeleteFramebuffers(1, &m_shadowFbo[i]);
    if (m_shadowTex[i]) glDeleteTextures(1, &m_shadowTex[i]);
  }
  destroyTargets();
  if (m_boneTex) glDeleteTextures(1, &m_boneTex);
  if (m_quadVbo) glDeleteBuffers(1, &m_quadVbo);
  if (m_quadVao) glDeleteVertexArrays(1, &m_quadVao);
  m_initialized = false;
}

// ---------------------------------------------------------------------------
void Renderer::createTargets() {
  int w = settings.width, h = settings.height;
  auto makeFbo = [&](FrameBuffer& fb, int fw, int fh, bool withDepth, bool hdr, bool depthTex) {
    glGenTextures(1, &fb.color);
    glBindTexture(GL_TEXTURE_2D, fb.color);
    GLint internal = hdr ? GL_RGBA16F : GL_RGBA8;
    GLenum type = hdr ? GL_HALF_FLOAT : GL_UNSIGNED_BYTE;
    glTexImage2D(GL_TEXTURE_2D, 0, internal, fw, fh, 0, GL_RGBA, type, nullptr);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glGenFramebuffers(1, &fb.fbo);
    glBindFramebuffer(GL_FRAMEBUFFER, fb.fbo);
    glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, fb.color, 0);
    if (withDepth) {
      glGenRenderbuffers(1, &fb.depth);
      glBindRenderbuffer(GL_RENDERBUFFER, fb.depth);
      glRenderbufferStorage(GL_RENDERBUFFER, GL_DEPTH_COMPONENT24, fw, fh);
      glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_RENDERBUFFER, fb.depth);
    }
    fb.w = fw; fb.h = fh; fb.hdr = hdr;
  };
  makeFbo(m_hdr, w, h, true, m_hdrSupported, false);
  for (int i = 0; i < 5; ++i) {
    int bw = std::max(1, w >> (i + 1)), bh = std::max(1, h >> (i + 1));
    makeFbo(m_bloom[i], bw, bh, false, m_hdrSupported, false);
  }
  makeFbo(m_final, w, h, false, false, false);

  // Shadow cascades
  if (settings.shadows) {
    int res = settings.shadowRes;
    for (int i = 0; i < 4; ++i) {
      if (i >= settings.cascadeCount) break;
      glGenTextures(1, &m_shadowTex[i]);
      glBindTexture(GL_TEXTURE_2D, m_shadowTex[i]);
      glTexImage2D(GL_TEXTURE_2D, 0, GL_DEPTH_COMPONENT24, res, res, 0, GL_DEPTH_COMPONENT, GL_UNSIGNED_INT, nullptr);
      glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
      glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
      glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
      glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
      glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_COMPARE_MODE, GL_NONE);
      glGenFramebuffers(1, &m_shadowFbo[i]);
      glBindFramebuffer(GL_FRAMEBUFFER, m_shadowFbo[i]);
      glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, m_shadowTex[i], 0);
      glDrawBuffers(0, nullptr);
      glBindFramebuffer(GL_FRAMEBUFFER, 0);
    }
  }
}

void Renderer::destroyTargets() {
  FrameBuffer* fbs[6] = { &m_hdr, &m_bloom[0], &m_bloom[1], &m_bloom[2], &m_bloom[3], &m_bloom[4] };
  for (FrameBuffer* fb : fbs) {
    if (fb->fbo) glDeleteFramebuffers(1, &fb->fbo);
    if (fb->color) glDeleteTextures(1, &fb->color);
    if (fb->depth) glDeleteRenderbuffers(1, &fb->depth);
    fb->fbo = fb->color = fb->depth = 0;
  }
  if (m_final.fbo) glDeleteFramebuffers(1, &m_final.fbo);
  if (m_final.color) glDeleteTextures(1, &m_final.color);
  m_final.fbo = m_final.color = 0;
}

void Renderer::resize(int w, int h) {
  if (w == settings.width && h == settings.height) return;
  settings.width = w; settings.height = h;
  destroyTargets();
  createTargets();
  glSetDrawableSize(w, h);
}

void Renderer::applySettings(const RenderSettings& s) {
  bool needResize = s.width != settings.width || s.height != settings.height;
  int oldRes = settings.shadowRes, oldCasc = settings.cascadeCount;
  settings = s;
  if (needResize) resize(s.width, s.height);
  if (s.shadowRes != oldRes) {
    for (int i = 0; i < 4; ++i) {
      if (m_shadowFbo[i]) { glDeleteFramebuffers(1, &m_shadowFbo[i]); m_shadowFbo[i] = 0; }
      if (m_shadowTex[i]) { glDeleteTextures(1, &m_shadowTex[i]); m_shadowTex[i] = 0; }
    }
    createTargets();
  }
  m_cascadeCount = settings.shadows ? settings.cascadeCount : 0;
  (void)oldCasc;
}

// ---------------------------------------------------------------------------
GpuTexture* Renderer::createTexture(const TextureData& td, const std::string& name) {
  if (td.width <= 0 || td.data.empty()) return nullptr;
  GpuTexture* t = new GpuTexture();
  t->width = td.width; t->height = td.height; t->mips = td.mips; t->format = td.format;
  t->name = name;
  glGenTextures(1, &t->id);
  glBindTexture(GL_TEXTURE_2D, t->id);
  int levels = std::max(1, td.mips);
  for (int i = 0; i < levels; ++i) {
    int w = std::max(1, td.width >> i), h = std::max(1, td.height >> i);
    GLenum fmt = (td.format == 0) ? GL_RGBA : GL_RGB;
    glTexImage2D(GL_TEXTURE_2D, i, fmt, w, h, 0, fmt, GL_UNSIGNED_BYTE, td.levelPtr(i));
  }
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, levels > 1 ? GL_LINEAR_MIPMAP_LINEAR : GL_LINEAR);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAX_LEVEL, levels - 1);
  m_textures.push_back(t);
  return t;
}

GpuTexture* Renderer::createTextureFromFile(const std::string& path) {
  bool ok = false;
  std::vector<u8> d = readFile(path, &ok);
  if (!ok) return nullptr;
  TextureData td;
  if (!deserializeTexture(d.data(), d.size(), td)) return nullptr;
  std::string name = path;
  size_t slash = name.find_last_of("/\\");
  if (slash != std::string::npos) name = name.substr(slash + 1);
  size_t dot = name.find_last_of('.');
  if (dot != std::string::npos) name = name.substr(0, dot);
  return createTexture(td, name);
}

GpuTexture* Renderer::findTexture(const std::string& name) const {
  for (auto* t : m_textures) if (t && t->name == name) return t;
  return nullptr;
}

void Renderer::destroyTexture(GpuTexture* t) {
  if (!t) return;
  if (t->id) glDeleteTextures(1, &t->id);
  delete t;
}

GpuMesh* Renderer::createMesh(const Mesh& m) {
  GpuMesh* g = new GpuMesh();
  g->vertexCount = (u32)m.verts.size();
  g->indexCount = (u32)m.idx.size();
  g->subMeshes = m.subMeshes;
  g->materials = m.materials;
  g->bounds = m.bounds;
  g->skinned = m.skinned;
  g->boneCount = (int)m.bones.size();

  std::vector<u8> vdata(m.verts.size() * VERTEX_STRIDE);
  for (size_t i = 0; i < m.verts.size(); ++i) {
    const Vertex& v = m.verts[i];
    u8* p = vdata.data() + i * VERTEX_STRIDE;
    memcpy(p + 0, &v.pos, 12);
    memcpy(p + 12, &v.nrm, 12);
    memcpy(p + 24, &v.tan, 16);
    memcpy(p + 40, &v.uv, 8);
    memcpy(p + 48, v.col, 4);
    memcpy(p + 52, v.joints, 8);
    memcpy(p + 60, v.weights, 16);
  }
  glGenVertexArrays(1, &g->vao);
  glGenBuffers(1, &g->vbo);
  glGenBuffers(1, &g->ibo);
  glBindVertexArray(g->vao);
  glBindBuffer(GL_ARRAY_BUFFER, g->vbo);
  glBufferData(GL_ARRAY_BUFFER, (GLsizeiptr)vdata.size(), vdata.data(), GL_STATIC_DRAW);
  glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, g->ibo);
  glBufferData(GL_ELEMENT_ARRAY_BUFFER, (GLsizeiptr)(m.idx.size() * 4), m.idx.data(), GL_STATIC_DRAW);
  glEnableVertexAttribArray(0); glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, VERTEX_STRIDE, (void*)0);
  glEnableVertexAttribArray(1); glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, VERTEX_STRIDE, (void*)12);
  glEnableVertexAttribArray(2); glVertexAttribPointer(2, 4, GL_FLOAT, GL_FALSE, VERTEX_STRIDE, (void*)24);
  glEnableVertexAttribArray(3); glVertexAttribPointer(3, 2, GL_FLOAT, GL_FALSE, VERTEX_STRIDE, (void*)40);
  glEnableVertexAttribArray(4); glVertexAttribPointer(4, 4, GL_UNSIGNED_BYTE, GL_TRUE, VERTEX_STRIDE, (void*)48);
  glEnableVertexAttribArray(5); glVertexAttribPointer(5, 4, GL_UNSIGNED_SHORT, GL_FALSE, VERTEX_STRIDE, (void*)52);
  glEnableVertexAttribArray(6); glVertexAttribPointer(6, 4, GL_FLOAT, GL_FALSE, VERTEX_STRIDE, (void*)60);
  glBindVertexArray(0);
  return g;
}

void Renderer::destroyMesh(GpuMesh* m) {
  if (!m) return;
  if (m->ibo) glDeleteBuffers(1, &m->ibo);
  if (m->vbo) glDeleteBuffers(1, &m->vbo);
  if (m->vao) glDeleteVertexArrays(1, &m->vao);
  delete m;
}

// ---------------------------------------------------------------------------
void Renderer::beginFrame() {
  m_draws.clear();
  m_particles.clear();
  m_uiBatches.clear();
  m_lights.clear();
  stats.drawCalls = stats.triangles = stats.shadowDrawCalls = 0;
}

void Renderer::setCamera(const Mat4& view, const Mat4& proj, const Vec3& pos) {
  m_view = view; m_proj = proj; m_cameraPos = pos;
  m_viewProj = proj * view;
  m_invViewProj = m_viewProj.inverse();
}
void Renderer::setSky(const SkyState& s) { m_sky = s; }
void Renderer::setFog(const FogState& f) { m_fog = f; }
void Renderer::clearLights() { m_lights.clear(); }
void Renderer::addLight(const LightEntry& l) { if (m_lights.size() < 16) m_lights.push_back(l); }

void Renderer::submitMesh(GpuMesh* mesh, const Mat4& model, const Material& mat, const TextureSet& tex,
                           int subMesh, bool castShadow) {
  if (!mesh) return;
  DrawItem d;
  d.mesh = mesh; d.subMesh = subMesh; d.model = model;
  d.normalMat = Mat4(model).inverse().transpose();
  d.material = mat; d.tex = tex; d.castShadow = castShadow; d.skinRow = -1;
  m_draws.push_back(d);
}

int Renderer::allocSkinRow(const std::vector<Mat4>& boneMats) {
  int row = m_boneRowCount++;
  if (row >= MAX_BONE_ROWS) return -1;
  int n = std::min((int)boneMats.size(), MAX_BONES);
  for (int b = 0; b < n; ++b) {
    for (int c = 0; c < 4; ++c) {
      size_t off = ((size_t)row * m_boneTexWidth + (size_t)b * 4 + c) * 4;
      memcpy(&m_boneData[off], &boneMats[b].m[c * 4], 16);
    }
  }
  return row;
}

void Renderer::submitSkinned(GpuMesh* mesh, const Mat4& model, const std::vector<Mat4>& boneMats,
                             const Material& mat, const TextureSet& tex, int subMesh, int skinRow) {
  if (!mesh) return;
  int row = skinRow;
  if (row < 0) {
    row = allocSkinRow(boneMats);
    if (row < 0) return;
  }
  DrawItem d;
  d.mesh = mesh; d.subMesh = subMesh; d.model = model;
  d.normalMat = Mat4(model).inverse().transpose();
  d.material = mat; d.tex = tex; d.castShadow = true; d.skinRow = row;
  m_draws.push_back(d);
}

void Renderer::submitParticles(const ParticleDraw& p) {
  if (p.offsets.empty()) return;
  ParticleBatch b; b.draw = p;
  m_particles.push_back(b);
}

void Renderer::submitUI(const std::vector<float>& verts, const std::vector<int>& indices,
                        const TextureSet& tex) {
  UiBatch b; b.verts = verts; b.idx = indices; b.tex = tex;
  m_uiBatches.push_back(b);
}

void Renderer::setExposure(float e) { m_exposure = e; }
void Renderer::setColorGrade(float sat, float contrast, const Vec3& lift, const Vec3& gamma, const Vec3& gain) {
  m_sat = sat; m_contrast = contrast; m_lift = lift; m_gamma = gamma; m_gain = gain;
}
void Renderer::setDamage(float d) { m_damage = d; }
void Renderer::setFade(float amount, const Vec3& color) { m_fade = amount; m_fadeColor = color; }
void Renderer::setVignette(float v) { m_vignette = v; }
void Renderer::setBloom(float s) { m_bloomStrength = s; }
void Renderer::setTime(float t) { m_time = t; }

// ---------------------------------------------------------------------------
// Shadow cascades
void Renderer::renderShadowPass() {
  if (m_cascadeCount <= 0 || !settings.shadows) return;
  // Build cascades from the camera frustum.
  f32 nearZ = 0.12f, farZ = 900.0f;
  f32 fovY = settings.fov * DEG;
  float aspect = (float)settings.width / (float)std::max(1, settings.height);
  float tanY = tanf(fovY * 0.5f), tanX = tanY * aspect;

  Vec3 camRight = normalize(Vec3(m_view.m[0], m_view.m[4], m_view.m[8]));
  Vec3 camUp = normalize(Vec3(m_view.m[1], m_view.m[5], m_view.m[9]));
  Vec3 camFwd = -normalize(Vec3(m_view.m[2], m_view.m[6], m_view.m[10]));

  float splitStart = 3.0f;
  float splitEnd = 320.0f;
  for (int c = 0; c < m_cascadeCount; ++c) {
    float t0 = (float)c / (float)m_cascadeCount;
    float t1 = (float)(c + 1) / (float)m_cascadeCount;
    float zn = splitStart + (splitEnd - splitStart) * powf(t0, 2.2f);
    float zf = splitStart + (splitEnd - splitStart) * powf(t1, 2.2f);
    m_cascadeSplits[c] = zf;

    // 8 frustum corners
    Vec3 corners[8];
    int i = 0;
    for (int z = 0; z < 2; ++z) {
      float zz = z == 0 ? zn : zf;
      for (int y = 0; y < 2; ++y) {
        for (int x = 0; x < 2; ++x) {
          Vec3 p = m_cameraPos + camFwd * zz +
                   camRight * ((x == 0 ? -1.0f : 1.0f) * tanX * zz) +
                   camUp * ((y == 0 ? -1.0f : 1.0f) * tanY * zz);
          corners[i++] = p;
        }
      }
    }
    // Bounding sphere of the slice -> stable light frustum
    Vec3 center(0, 0, 0);
    for (int k = 0; k < 8; ++k) center += corners[k];
    center /= 8.0f;
    float radius = 0.0f;
    for (int k = 0; k < 8; ++k) radius = std::max(radius, length(corners[k] - center));
    radius = std::ceil(radius * 16.0f) / 16.0f;

    Vec3 lightDir = normalize(m_sky.sunDir);
    Vec3 eye = center - lightDir * (radius + 120.0f);
    Mat4 lightView = Mat4::lookAt(eye, center, Vec3(0, 1, 0));
    // Snap to texel grid to reduce shimmer.
    Mat4 ortho = Mat4::ortho(-radius, radius, -radius, radius, 1.0f, 2.0f * radius + 260.0f);
    Mat4 lv = lightView;
    Mat4 snapped = ortho * lv;
    float texSize = (float)settings.shadowRes;
    for (int k = 0; k < 3; ++k) {
      float o = snapped.at(k, 3);
      snapped.at(k, 3) = std::floor(o * texSize / (2.0f * radius)) * (2.0f * radius) / texSize;
    }
    m_shadowMat[c] = snapped;

    glBindFramebuffer(GL_FRAMEBUFFER, m_shadowFbo[c]);
    glViewport(0, 0, settings.shadowRes, settings.shadowRes);
    glClear(GL_DEPTH_BUFFER_BIT);
    glEnable(GL_DEPTH_TEST);
    glDepthFunc(GL_LEQUAL);
    glDepthMask(GL_TRUE);
    glDisable(GL_BLEND);
    glEnable(GL_CULL_FACE);
    glCullFace(GL_FRONT);
    glUseProgram(m_shadow.id);
    glUniformMatrix4fv(uniform(m_shadow, "uViewProj"), 1, GL_FALSE, m_shadowMat[c].m);
    glUniform1i(uniform(m_shadow, "uSkinned"), 0);
    glUniform1i(uniform(m_shadow, "uBoneRow"), 0);
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, m_boneTex);
    glUniform1i(uniform(m_shadow, "uBoneTex"), 0);

    for (const auto& d : m_draws) {
      if (!d.castShadow) continue;
      glUniformMatrix4fv(uniform(m_shadow, "uModel"), 1, GL_FALSE, d.model.m);
      glUniform1i(uniform(m_shadow, "uSkinned"), d.skinRow >= 0 ? 1 : 0);
      glUniform1i(uniform(m_shadow, "uBoneRow"), d.skinRow >= 0 ? d.skinRow : 0);
      glBindVertexArray(d.mesh->vao);
      if (d.subMesh >= 0 && d.subMesh < (int)d.mesh->subMeshes.size()) {
        const SubMesh& sm = d.mesh->subMeshes[d.subMesh];
        glDrawElements(GL_TRIANGLES, (GLsizei)sm.indexCount, GL_UNSIGNED_INT, (void*)(size_t)(sm.firstIndex * 4));
        stats.shadowDrawCalls++;
      } else {
        glDrawElements(GL_TRIANGLES, (GLsizei)d.mesh->indexCount, GL_UNSIGNED_INT, (void*)0);
        stats.shadowDrawCalls++;
      }
    }
  }
  glCullFace(GL_BACK);
  glBindFramebuffer(GL_FRAMEBUFFER, 0);
}

// ---------------------------------------------------------------------------
void Renderer::renderScenePass() {
  glBindFramebuffer(GL_FRAMEBUFFER, m_hdr.fbo);
  glViewport(0, 0, m_hdr.w, m_hdr.h);
  glClearColor(m_sky.horizon.x, m_sky.horizon.y, m_sky.horizon.z, 1.0f);
  glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
  glEnable(GL_DEPTH_TEST);
  glDepthFunc(GL_LEQUAL);
  glDepthMask(GL_TRUE);
  glDisable(GL_BLEND);
  glEnable(GL_CULL_FACE);
  glCullFace(GL_BACK);

  Program& P = m_scene;
  glUseProgram(P.id);
  glUniformMatrix4fv(uniform(P, "uViewProj"), 1, GL_FALSE, m_viewProj.m);
  glUniform3f(uniform(P, "uCameraPos"), m_cameraPos.x, m_cameraPos.y, m_cameraPos.z);
  glUniform3f(uniform(P, "uSunDir"), m_sky.sunDir.x, m_sky.sunDir.y, m_sky.sunDir.z);
  glUniform3f(uniform(P, "uSunColor"), m_sky.sunColor.x * m_sky.sunIntensity,
              m_sky.sunColor.y * m_sky.sunIntensity, m_sky.sunColor.z * m_sky.sunIntensity);
  glUniform3f(uniform(P, "uZenithColor"), m_sky.zenith.x, m_sky.zenith.y, m_sky.zenith.z);
  glUniform3f(uniform(P, "uHorizonColor"), m_sky.horizon.x, m_sky.horizon.y, m_sky.horizon.z);
  glUniform3f(uniform(P, "uGroundColor"), m_sky.ground.x, m_sky.ground.y, m_sky.ground.z);
  glUniform1f(uniform(P, "uSkyExposure"), m_sky.skyExposure);
  glUniform3f(uniform(P, "uFogColor"), m_fog.color.x, m_fog.color.y, m_fog.color.z);
  glUniform1f(uniform(P, "uFogDensity"), m_fog.density);
  glUniform1f(uniform(P, "uFogHeight"), m_fog.height);
  glUniform1f(uniform(P, "uFogStart"), m_fog.start);
  glUniform1f(uniform(P, "uTime"), m_time);
  glUniform1f(uniform(P, "uShadowTexel"), 1.0f / (float)settings.shadowRes);
  glUniform1i(uniform(P, "uCascadeCount"), m_cascadeCount);
  glUniform1i(uniform(P, "uShadowMap"), 6);
  {
    int loc = glGetUniformLocation(P.id, "uShadowMat");
    if (loc >= 0) glUniformMatrix4fv(loc, 4, GL_FALSE, m_shadowMat[0].m);
    loc = glGetUniformLocation(P.id, "uCascadeSplits");
    if (loc >= 0) glUniform1fv(loc, 4, m_cascadeSplits);
  }
  glActiveTexture(GL_TEXTURE6);
  glBindTexture(GL_TEXTURE_2D, m_cascadeCount > 0 ? m_shadowTex[0] : 0);

  // Punctual lights
  int nl = (int)std::min<size_t>(m_lights.size(), 16);
  static float lp[16 * 4], lc[16 * 4], ld[16 * 4], le[16 * 4];
  for (int i = 0; i < nl; ++i) {
    const LightEntry& l = m_lights[i];
    lp[i * 4 + 0] = l.position.x; lp[i * 4 + 1] = l.position.y; lp[i * 4 + 2] = l.position.z;
    lp[i * 4 + 3] = l.range;
    lc[i * 4 + 0] = l.color.x * l.intensity; lc[i * 4 + 1] = l.color.y * l.intensity;
    lc[i * 4 + 2] = l.color.z * l.intensity; lc[i * 4 + 3] = l.spot ? 1.0f : 0.0f;
    ld[i * 4 + 0] = l.direction.x; ld[i * 4 + 1] = l.direction.y; ld[i * 4 + 2] = l.direction.z;
    ld[i * 4 + 3] = l.outerCone;
    le[i * 4 + 0] = l.innerCone; le[i * 4 + 1] = l.intensity; le[i * 4 + 2] = 0; le[i * 4 + 3] = 0;
  }
  glUniform1i(uniform(P, "uLightCount"), nl);
  if (nl > 0) {
    glUniform4fv(glGetUniformLocation(P.id, "uLightPosRange"), nl, lp);
    glUniform4fv(glGetUniformLocation(P.id, "uLightColorType"), nl, lc);
    glUniform4fv(glGetUniformLocation(P.id, "uLightDirCone"), nl, ld);
    glUniform4fv(glGetUniformLocation(P.id, "uLightExtra"), nl, le);
  }
  glUniform1i(uniform(P, "uBoneTex"), 7);
  glUniform1i(uniform(P, "uAlbedoTex"), 0);
  glUniform1i(uniform(P, "uNormalTex"), 1);
  glUniform1i(uniform(P, "uOrmTex"), 2);
  glActiveTexture(GL_TEXTURE7);
  glBindTexture(GL_TEXTURE_2D, m_boneTex);
  // Upload bone rows
  if (m_boneRowCount > 0) {
    glBindTexture(GL_TEXTURE_2D, m_boneTex);
    glTexSubImage2D(GL_TEXTURE_2D, 0, 0, 0, m_boneTexWidth, m_boneRowCount, GL_RGBA, GL_FLOAT,
                    m_boneData.data());
  }

  for (const auto& d : m_draws) {
    const Material& mat = d.material;
    glUniformMatrix4fv(uniform(P, "uModel"), 1, GL_FALSE, d.model.m);
    glUniformMatrix3fv(uniform(P, "uNormalMat"), 1, GL_FALSE, d.normalMat.m);
    glUniform4f(uniform(P, "uAlbedo"), mat.albedo.x, mat.albedo.y, mat.albedo.z, mat.albedo.w);
    glUniform1f(uniform(P, "uMetallic"), mat.metallic);
    glUniform1f(uniform(P, "uRoughness"), mat.roughness);
    glUniform4f(uniform(P, "uEmissive"), mat.emissive.x, mat.emissive.y, mat.emissive.z, mat.emissive.w);
    glUniform1f(uniform(P, "uNormalStrength"), mat.normalStrength);
    glUniform1i(uniform(P, "uFlags"), (int)mat.flags);
    glUniform1f(uniform(P, "uAlphaCutoff"), (mat.flags & MAT_ALPHA_TEST) ? 0.45f : 0.0f);
    glUniform1i(uniform(P, "uSkinned"), d.skinRow >= 0 ? 1 : 0);
    glUniform1i(uniform(P, "uBoneRow"), d.skinRow >= 0 ? d.skinRow : 0);

    bindTexture(0, d.tex.albedo);
    bindTexture(1, d.tex.normal);
    bindTexture(2, d.tex.orm);
    glUniform1i(uniform(P, "uHasAlbedoTex"), d.tex.albedo ? 1 : 0);
    glUniform1i(uniform(P, "uHasNormalTex"), d.tex.normal ? 1 : 0);
    glUniform1i(uniform(P, "uHasOrmTex"), d.tex.orm ? 1 : 0);

    glBindVertexArray(d.mesh->vao);
    if ((mat.flags & MAT_DOUBLE_SIDED) != 0) glDisable(GL_CULL_FACE);
    else glEnable(GL_CULL_FACE);

    if (d.subMesh >= 0 && d.subMesh < (int)d.mesh->subMeshes.size()) {
      const SubMesh& sm = d.mesh->subMeshes[d.subMesh];
      glDrawElements(GL_TRIANGLES, (GLsizei)sm.indexCount, GL_UNSIGNED_INT, (void*)(size_t)(sm.firstIndex * 4));
      stats.triangles += sm.indexCount / 3;
    } else {
      glDrawElements(GL_TRIANGLES, (GLsizei)d.mesh->indexCount, GL_UNSIGNED_INT, (void*)0);
      stats.triangles += d.mesh->indexCount / 3;
    }
    stats.drawCalls++;
  }
  glEnable(GL_CULL_FACE);
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
void Renderer::render() {
  if (!m_initialized) return;
  renderShadowPass();
  renderScenePass();
  // Sky drawn after opaque geometry with depth test at far plane
  {
    glBindFramebuffer(GL_FRAMEBUFFER, m_hdr.fbo);
    glViewport(0, 0, m_hdr.w, m_hdr.h);
    glDepthMask(GL_FALSE);
    glDisable(GL_DEPTH_TEST);
    glDisable(GL_CULL_FACE);
    glUseProgram(m_skyProg.id);
    glUniformMatrix4fv(uniform(m_skyProg, "uInvViewProj"), 1, GL_FALSE, m_invViewProj.m);
    glUniform3f(uniform(m_skyProg, "uCameraPos"), m_cameraPos.x, m_cameraPos.y, m_cameraPos.z);
    glUniform3f(uniform(m_skyProg, "uSunDir"), m_sky.sunDir.x, m_sky.sunDir.y, m_sky.sunDir.z);
    glUniform3f(uniform(m_skyProg, "uSunColor"), m_sky.sunColor.x * m_sky.sunIntensity,
                m_sky.sunColor.y * m_sky.sunIntensity, m_sky.sunColor.z * m_sky.sunIntensity);
    glUniform3f(uniform(m_skyProg, "uZenithColor"), m_sky.zenith.x, m_sky.zenith.y, m_sky.zenith.z);
    glUniform3f(uniform(m_skyProg, "uHorizonColor"), m_sky.horizon.x, m_sky.horizon.y, m_sky.horizon.z);
    glUniform3f(uniform(m_skyProg, "uGroundColor"), m_sky.ground.x, m_sky.ground.y, m_sky.ground.z);
    glUniform1f(uniform(m_skyProg, "uSkyExposure"), m_sky.skyExposure);
    glBindVertexArray(m_quadVao);
    glDrawArrays(GL_TRIANGLES, 0, 3);
    glEnable(GL_DEPTH_TEST);
    glDepthMask(GL_TRUE);
    glEnable(GL_CULL_FACE);
  }

  // Particles
  if (!m_particles.empty()) {
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    glDepthMask(GL_FALSE);
    glDisable(GL_CULL_FACE);
    glUseProgram(m_particle.id);
    glUniformMatrix4fv(uniform(m_particle, "uViewProj"), 1, GL_FALSE, m_viewProj.m);
    Vec3 right = normalize(Vec3(m_view.m[0], m_view.m[4], m_view.m[8]));
    Vec3 up = normalize(Vec3(m_view.m[1], m_view.m[5], m_view.m[9]));
    glUniform3f(uniform(m_particle, "uCamRight"), right.x, right.y, right.z);
    glUniform3f(uniform(m_particle, "uCamUp"), up.x, up.y, up.z);
    glUniform3f(uniform(m_particle, "uCameraPos"), m_cameraPos.x, m_cameraPos.y, m_cameraPos.z);
    glUniform1i(uniform(m_particle, "uTex"), 0);
    // Particle geometry: unit quad + per-instance attributes
    static const float cornerVerts[12] = { -1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1 };
    static u32 pvao = 0, pvbo = 0, pibo = 0, instVbo = 0;
    static std::vector<float> instData;
    if (!pvao) {
      glGenVertexArrays(1, &pvao);
      glGenBuffers(1, &pvbo);
      glGenBuffers(1, &pibo);
      glGenBuffers(1, &instVbo);
      glBindVertexArray(pvao);
      glBindBuffer(GL_ARRAY_BUFFER, pvbo);
      glBufferData(GL_ARRAY_BUFFER, sizeof(cornerVerts), cornerVerts, GL_STATIC_DRAW);
      glEnableVertexAttribArray(0);
      glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 0, (void*)0);
      glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, pibo);
      u16 ib[6] = { 0, 1, 2, 0, 2, 3 };
      glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(ib), ib, GL_STATIC_DRAW);
      glBindBuffer(GL_ARRAY_BUFFER, instVbo);
      glEnableVertexAttribArray(1);
      glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 40, (void*)0);
      glVertexAttribDivisor(1, 1);
      glEnableVertexAttribArray(2);
      glVertexAttribPointer(2, 4, GL_FLOAT, GL_FALSE, 40, (void*)12);
      glVertexAttribDivisor(2, 1);
      glEnableVertexAttribArray(3);
      glVertexAttribPointer(3, 3, GL_FLOAT, GL_FALSE, 40, (void*)28);
      glVertexAttribDivisor(3, 1);
    }
    for (const auto& b : m_particles) {
      size_t n = b.draw.offsets.size();
      instData.resize(n * 10);
      for (size_t i = 0; i < n; ++i) {
        float* p = &instData[i * 10];
        p[0] = b.draw.offsets[i].x; p[1] = b.draw.offsets[i].y; p[2] = b.draw.offsets[i].z;
        p[3] = b.draw.colors[i].x; p[4] = b.draw.colors[i].y; p[5] = b.draw.colors[i].z; p[6] = b.draw.colors[i].w;
        p[7] = b.draw.params[i].x; p[8] = b.draw.params[i].y; p[9] = b.draw.params[i].z;
      }
      glBindVertexArray(pvao);
      glBindBuffer(GL_ARRAY_BUFFER, instVbo);
      glBufferData(GL_ARRAY_BUFFER, (GLsizeiptr)(instData.size() * 4), instData.data(), GL_DYNAMIC_DRAW);
      bindTexture(0, b.draw.texture);
      glUniform1i(uniform(m_particle, "uHasTex"), b.draw.texture ? 1 : 0);
      glDrawElementsInstanced(GL_TRIANGLES, 6, GL_UNSIGNED_SHORT, (void*)0, (GLsizei)n);
    }
    glDepthMask(GL_TRUE);
    glEnable(GL_CULL_FACE);
    glDisable(GL_BLEND);
  }

  // UI overlay (2D)
  if (!m_uiBatches.empty()) {
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    glDisable(GL_DEPTH_TEST);
    glDepthMask(GL_FALSE);
    glDisable(GL_CULL_FACE);
    glUseProgram(m_ui.id);
    Mat4 ortho = Mat4::ortho(0, (float)settings.width, (float)settings.height, 0, -1, 1);
    glUniformMatrix4fv(uniform(m_ui, "uProj"), 1, GL_FALSE, ortho.m);
    static u32 uvao = 0, uvbo = 0, uibo = 0;
    if (!uvao) {
      glGenVertexArrays(1, &uvao);
      glGenBuffers(1, &uvbo);
      glGenBuffers(1, &uibo);
      glBindVertexArray(uvao);
      glEnableVertexAttribArray(0);
      glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 28, (void*)0);
      glEnableVertexAttribArray(1);
      glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 28, (void*)8);
      glEnableVertexAttribArray(2);
      glVertexAttribPointer(2, 4, GL_UNSIGNED_BYTE, GL_TRUE, 28, (void*)16);
    }
    for (const auto& b : m_uiBatches) {
      glBindVertexArray(uvao);
      glBindBuffer(GL_ARRAY_BUFFER, uvbo);
      glBufferData(GL_ARRAY_BUFFER, (GLsizeiptr)(b.verts.size() * 4), b.verts.data(), GL_DYNAMIC_DRAW);
      glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, uibo);
      glBufferData(GL_ELEMENT_ARRAY_BUFFER, (GLsizeiptr)(b.idx.size() * 4), b.idx.data(), GL_DYNAMIC_DRAW);
      bindTexture(0, b.tex.albedo);
      glUniform1i(uniform(m_ui, "uTex"), 0);
      glUniform1i(uniform(m_ui, "uHasTex"), b.tex.albedo ? 1 : 0);
      glDrawElements(GL_TRIANGLES, (GLsizei)b.idx.size(), GL_UNSIGNED_INT, (void*)0);
    }
    glEnable(GL_DEPTH_TEST);
    glDepthMask(GL_TRUE);
    glEnable(GL_CULL_FACE);
    glDisable(GL_BLEND);
  }

  renderPost();
  glSwapBuffers();
}

// ---------------------------------------------------------------------------
void Renderer::renderPost() {
  glDisable(GL_DEPTH_TEST);
  glDisable(GL_CULL_FACE);
  glDisable(GL_BLEND);
  glBindVertexArray(m_quadVao);

  // Bright pass
  if (settings.bloom && m_bloomStrength > 0.001f) {
    glBindFramebuffer(GL_FRAMEBUFFER, m_bloom[0].fbo);
    glViewport(0, 0, m_bloom[0].w, m_bloom[0].h);
    glUseProgram(m_bright.id);
    glUniform1i(uniform(m_bright, "uTex"), 0);
    glUniform1f(uniform(m_bright, "uThreshold"), 1.05f);
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, m_hdr.color);
    glDrawArrays(GL_TRIANGLES, 0, 3);

    for (int i = 0; i < 5; ++i) {
      if (m_bloom[i].w <= 1) continue;
      // horizontal blur into tmp (reuse bloom[i+1] as temp when possible)
      FrameBuffer& tmp = m_bloom[(i + 1) % 5];
      if (i + 1 < 5 && tmp.w > 1) {
        glBindFramebuffer(GL_FRAMEBUFFER, tmp.fbo);
        glViewport(0, 0, tmp.w, tmp.h);
        glUseProgram(m_blur.id);
        glUniform1i(uniform(m_blur, "uTex"), 0);
        glUniform2f(uniform(m_blur, "uDir"), 1.0f / (float)m_bloom[i].w, 0.0f);
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, m_bloom[i].color);
        glDrawArrays(GL_TRIANGLES, 0, 3);

        glBindFramebuffer(GL_FRAMEBUFFER, m_bloom[i].fbo);
        glViewport(0, 0, m_bloom[i].w, m_bloom[i].h);
        glUniform1i(uniform(m_blur, "uTex"), 0);
        glUniform2f(uniform(m_blur, "uDir"), 0.0f, 1.0f / (float)m_bloom[i].h);
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, tmp.color);
        glDrawArrays(GL_TRIANGLES, 0, 3);
      }
      // downsample
      if (i + 1 < 5 && m_bloom[i + 1].w > 1) {
        glBindFramebuffer(GL_FRAMEBUFFER, m_bloom[i + 1].fbo);
        glViewport(0, 0, m_bloom[i + 1].w, m_bloom[i + 1].h);
        glUseProgram(m_bright.id);
        glUniform1i(uniform(m_bright, "uTex"), 0);
        glUniform1f(uniform(m_bright, "uThreshold"), 0.0f);
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, m_bloom[i].color);
        glDrawArrays(GL_TRIANGLES, 0, 3);
      }
    }
  }

  // Composite to final buffer
  glBindFramebuffer(GL_FRAMEBUFFER, m_final.fbo);
  glViewport(0, 0, m_final.w, m_final.h);
  glUseProgram(m_composite.id);
  glUniform1i(uniform(m_composite, "uScene"), 0);
  glUniform1i(uniform(m_composite, "uBloom"), 1);
  glUniform1f(uniform(m_composite, "uExposure"), m_exposure);
  glUniform1f(uniform(m_composite, "uBloomStrength"), settings.bloom ? m_bloomStrength : 0.0f);
  glUniform1f(uniform(m_composite, "uVignette"), m_vignette);
  glUniform1f(uniform(m_composite, "uGrain"), settings.grain ? 0.035f : 0.0f);
  glUniform1f(uniform(m_composite, "uTime"), m_time);
  glUniform1f(uniform(m_composite, "uSaturation"), m_sat);
  glUniform1f(uniform(m_composite, "uContrast"), m_contrast);
  glUniform3f(uniform(m_composite, "uLift"), m_lift.x, m_lift.y, m_lift.z);
  glUniform3f(uniform(m_composite, "uGamma"), m_gamma.x, m_gamma.y, m_gamma.z);
  glUniform3f(uniform(m_composite, "uGain"), m_gain.x, m_gain.y, m_gain.z);
  glUniform1f(uniform(m_composite, "uDamage"), m_damage);
  glUniform1f(uniform(m_composite, "uHeartbeat"), sinf(m_time * 4.0f));
  glUniform1f(uniform(m_composite, "uFadeAmount"), m_fade);
  glUniform3f(uniform(m_composite, "uFadeColor"), m_fadeColor.x, m_fadeColor.y, m_fadeColor.z);
  glActiveTexture(GL_TEXTURE0);
  glBindTexture(GL_TEXTURE_2D, m_hdr.color);
  glActiveTexture(GL_TEXTURE1);
  glBindTexture(GL_TEXTURE_2D, m_bloom[0].color);
  glDrawArrays(GL_TRIANGLES, 0, 3);

  // FXAA
  if (settings.fxaa) {
    glBindFramebuffer(GL_FRAMEBUFFER, 0);
    glViewport(0, 0, settings.width, settings.height);
    glUseProgram(m_fxaa.id);
    glUniform1i(uniform(m_fxaa, "uTex"), 0);
    glUniform2f(uniform(m_fxaa, "uTexel"), 1.0f / (float)settings.width, 1.0f / (float)settings.height);
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, m_final.color);
    glDrawArrays(GL_TRIANGLES, 0, 3);
  } else {
    glBindFramebuffer(GL_FRAMEBUFFER, 0);
    glViewport(0, 0, settings.width, settings.height);
    glUseProgram(m_bright.id);
    glUniform1i(uniform(m_bright, "uTex"), 0);
    glUniform1f(uniform(m_bright, "uThreshold"), 0.0f);
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, m_final.color);
    glDrawArrays(GL_TRIANGLES, 0, 3);
  }
}

} // namespace aoh
