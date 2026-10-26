#pragma once
#include "core/math.h"
#include "gfx/gfx_types.h"
#include "assets/assets.h"
#include <memory>
#include <string>
#include <vector>

namespace aoh {

struct GpuTexture {
  u32 id = 0;
  int width = 0, height = 0, mips = 0;
  int format = 0;
  std::string name;
};

struct GpuMesh {
  u32 vao = 0, vbo = 0, ibo = 0;
  u32 vertexCount = 0, indexCount = 0;
  std::vector<SubMesh> subMeshes;
  std::vector<Material> materials;
  AABB bounds;
  bool skinned = false;
  int boneCount = 0;
};

// Per-instance textures resolved by the game layer.
struct TextureSet {
  GpuTexture* albedo = nullptr;
  GpuTexture* normal = nullptr;
  GpuTexture* orm = nullptr;
  GpuTexture* emissive = nullptr;
};

struct RenderSettings {
  int  width = 1280;
  int  height = 720;
  int  quality = 2;          // 0 low, 1 medium, 2 high, 3 ultra
  int  shadowRes = 2048;
  int  cascadeCount = 3;
  bool bloom = true;
  bool fxaa = true;
  bool shadows = true;
  bool volumetric = true;
  bool grain = true;
  bool vsync = true;
  float fov = 75.0f;
  int  maxPixelRatio = 1;
};

struct RendererStats {
  int drawCalls = 0;
  int triangles = 0;
  int shadowDrawCalls = 0;
};

struct SkyState {
  Vec3 sunDir = Vec3(0.3f, 0.6f, 0.4f);
  Vec3 sunColor = Vec3(1.0f, 0.95f, 0.85f);
  Vec3 zenith = Vec3(0.16f, 0.26f, 0.42f);
  Vec3 horizon = Vec3(0.42f, 0.46f, 0.50f);
  Vec3 ground = Vec3(0.07f, 0.07f, 0.08f);
  float skyExposure = 1.0f;
  float sunIntensity = 3.0f;
};

struct FogState {
  Vec3  color = Vec3(0.45f, 0.48f, 0.52f);
  float density = 0.010f;
  float height = 2.0f;
  float start = 12.0f;
};

struct LightEntry {
  Vec3 position;
  Vec3 direction = Vec3(0, -1, 0);
  Vec3 color = Vec3(1, 1, 1);
  float intensity = 1.0f;
  float range = 12.0f;
  bool  spot = false;
  float innerCone = 0.85f;   // cos
  float outerCone = 0.55f;   // cos
};

struct ParticleDraw {
  GpuTexture* texture = nullptr;
  std::vector<Vec3> offsets;
  std::vector<Vec4> colors;
  std::vector<Vec3> params;   // size, rotation, softness
};

class Renderer {
public:
  bool init(void* nativeWindow, const RenderSettings& settings);
  void shutdown();
  void resize(int w, int h);
  void applySettings(const RenderSettings& s);

  GpuTexture* createTexture(const TextureData& td, const std::string& name);
  GpuTexture* createTextureFromFile(const std::string& path);
  GpuTexture* findTexture(const std::string& name) const;
  void destroyTexture(GpuTexture* t);

  GpuMesh* createMesh(const Mesh& m);
  void destroyMesh(GpuMesh* m);

  // ---- frame ----
  void beginFrame();
  void setCamera(const Mat4& view, const Mat4& proj, const Vec3& pos);
  void setSky(const SkyState& s);
  void setFog(const FogState& f);
  void clearLights();
  void addLight(const LightEntry& l);

  // ---- submission ----
  void submitMesh(GpuMesh* mesh, const Mat4& model, const Material& mat, const TextureSet& tex,
                  int subMesh = -1, bool castShadow = true);
  void submitSkinned(GpuMesh* mesh, const Mat4& model, const std::vector<Mat4>& boneMats,
                     const Material& mat, const TextureSet& tex, int subMesh = -1,
                     int skinRow = -1);
  // Uploads a bone palette and returns the texture row it was written to.
  int  allocSkinRow(const std::vector<Mat4>& boneMats);
  void resetSkinRows() { m_boneRowCount = 0; }
  void submitParticles(const ParticleDraw& p);
  void submitUI(const std::vector<float>& verts, const std::vector<int>& indices,
                const TextureSet& tex);

  void render();
  void renderUIOverlay();

  // ---- post / look ----
  void setExposure(float e);
  void setColorGrade(float sat, float contrast, const Vec3& lift, const Vec3& gamma, const Vec3& gain);
  void setDamage(float d);
  void setFade(float amount, const Vec3& color);
  void setVignette(float v);
  void setBloom(float strength);
  void setTime(float t);

  RendererStats stats;
  RenderSettings settings;

private:
  struct Program { u32 id = 0; std::unordered_map<std::string, i32> uniforms; };
  struct FrameBuffer { u32 fbo = 0, color = 0, depth = 0; int w = 0, h = 0; bool hdr = false; };

  u32 compileProgram(const char* vert, const char* frag, const char* name);
  void bindTexture(int unit, GpuTexture* t);
  i32 uniform(Program& p, const char* name);

  void createTargets();
  void destroyTargets();
  void renderShadowPass();
  void renderScenePass();
  void renderPost();

  struct DrawItem {
    GpuMesh* mesh;
    int subMesh;
    Mat4 model;
    Mat4 normalMat;
    Material material;
    TextureSet tex;
    bool castShadow;
    int skinRow;               // -1 static, else bone matrix row
  };
  struct ParticleBatch { ParticleDraw draw; };
  struct UiBatch { std::vector<float> verts; std::vector<int> idx; TextureSet tex; };

  std::vector<DrawItem> m_draws;
  std::vector<ParticleBatch> m_particles;
  std::vector<UiBatch> m_uiBatches;
  std::vector<LightEntry> m_lights;
  std::vector<GpuTexture*> m_textures;

  Program m_scene, m_shadow, m_skyProg, m_particle, m_bright, m_blur, m_composite, m_fxaa, m_ui;
  FrameBuffer m_hdr, m_bloom[5], m_final;
  u32 m_shadowFbo[4] = {0, 0, 0, 0};
  u32 m_shadowTex[4] = {0, 0, 0, 0};
  Mat4 m_shadowMat[4];
  float m_cascadeSplits[4] = {0, 0, 0, 0};
  int m_cascadeCount = 0;

  u32 m_quadVao = 0, m_quadVbo = 0;
  u32 m_boneTex = 0;
  int m_boneTexWidth = 0;
  std::vector<float> m_boneData;
  int m_boneRowCount = 0;

  Mat4 m_view, m_proj, m_viewProj, m_invViewProj;
  Vec3 m_cameraPos;
  SkyState m_sky;
  FogState m_fog;
  f32 m_time = 0.0f;
  f32 m_exposure = 1.0f;
  f32 m_bloomStrength = 0.55f;
  f32 m_vignette = 0.35f;
  f32 m_damage = 0.0f;
  f32 m_fade = 0.0f;
  Vec3 m_fadeColor = Vec3(0, 0, 0);
  f32 m_sat = 1.0f, m_contrast = 1.0f;
  Vec3 m_lift = Vec3(0, 0, 0), m_gamma = Vec3(1, 1, 1), m_gain = Vec3(1, 1, 1);
  bool m_hdrSupported = true;
  bool m_initialized = false;
};

} // namespace aoh
