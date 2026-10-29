// HORIZON VELOCITY - renderer interface (software and GPU backends share this)
#pragma once
#include "core/math.h"
#include "render/mesh.h"
#include <vector>
#include <string>
#include <memory>

namespace hv {

struct Texture {
    int w = 0, h = 0;
    std::vector<uint32_t> px;          // RGBA8 (little endian 0xAABBGGRR)
    std::vector<std::vector<uint32_t>> mips;
    bool wrap = true;
    std::string name;
    void buildMips();
    uint32_t sample(float u, float v, float lodBias = 0.0f) const;
    Vec4 sampleVec(float u, float v, float lodBias = 0.0f) const;
};

struct AssetLib {
    std::vector<Texture> textures;
    std::vector<Material> materials;
    std::vector<Mesh> meshes;
    int addTexture(Texture t);
    int addMaterial(const Material& m);
    int findMaterial(const std::string& name) const;
    int tex(const std::string& name) const;
};

AssetLib& assets();

struct Environment {
    Vec3 sunDir{-0.4f, 0.55f, 0.35f};   // direction TOWARDS the sun
    Vec3 sunColor{1.0f, 0.95f, 0.88f};
    float sunIntensity = 3.2f;
    Vec3 ambientSky{0.34f, 0.45f, 0.62f};
    Vec3 ambientGround{0.16f, 0.14f, 0.12f};
    Vec3 skyZenith{0.20f, 0.38f, 0.72f};
    Vec3 skyHorizon{0.62f, 0.72f, 0.85f};
    Vec3 fogColor{0.66f, 0.72f, 0.80f};
    float fogDensity = 0.00055f;
    float fogHeight = 120.0f;
    float exposure = 1.0f;
    float saturation = 1.0f;
    float contrast = 1.0f;
    float vignette = 0.25f;
    float bloom = 0.35f;
    float nightFactor = 0.0f;      // 0 day .. 1 night (drives lights)
    float wetness = 0.0f;          // 0 dry .. 1 soaked
    float rainStrength = 0.0f;
    float snowStrength = 0.0f;
    float cloudCover = 0.35f;
    float windStrength = 0.4f;
    Vec3 windDir{1.0f, 0.0f, 0.2f};
    float timeOfDay = 10.5f;       // hours
};

struct Camera {
    Vec3 pos{0, 3, -8};
    Vec3 target{0, 0, 0};
    Vec3 up{0, 1, 0};
    float fovY = 60.0f * DEG;
    float nearZ = 0.12f;
    float farZ = 4000.0f;
    float aspect = 16.0f / 9.0f;
    float roll = 0.0f;
    Mat4 view() const;
    Mat4 proj() const;
    Vec3 forward() const { return (target - pos).normalized(); }
};

struct QualitySettings {
    float renderScale = 1.0f;
    bool shadows = true;
    bool bloom = true;
    bool reflections = true;
    bool volumetricFog = true;
    int shadowRes = 1024;
    float viewDistance = 1400.0f;
    int msaaSamples = 1;   // 1 = off
    bool motionBlur = false;
    bool depthOfField = false;
};

class Renderer {
public:
    virtual ~Renderer() {}
    virtual bool init(int w, int h, bool vsync) = 0;
    virtual void shutdown() = 0;
    virtual void resize(int w, int h) = 0;
    virtual void setQuality(const QualitySettings& q) = 0;
    virtual void setEnvironment(const Environment& e) = 0;
    virtual const Environment& env() const = 0;
    virtual void beginFrame(const Camera& cam) = 0;
    // 3D submission
    virtual void mesh(const Mesh& m, const Mat4& xf, int matOverride = -1, const Vec4& tint = Vec4(1,1,1,1)) = 0;
    virtual void sprite(const Vec3& pos, const Vec2& size, int texture, const Vec4& color,
                        float rotation = 0.0f, bool additive = false) = 0;
    virtual void line3D(const Vec3& a, const Vec3& b, const Vec4& color) = 0;
    virtual void endFrame() = 0;
    // 2D overlay (UI)
    virtual void begin2D() = 0;
    virtual void rect(float x, float y, float w, float h, const Vec4& color) = 0;
    virtual void rectGrad(float x, float y, float w, float h, const Vec4& top, const Vec4& bottom) = 0;
    virtual void image(float x, float y, float w, float h, int texture, const Vec4& color,
                       const Vec2& uv0 = Vec2(0,0), const Vec2& uv1 = Vec2(1,1), float rotation = 0.0f) = 0;
    virtual void end2D() = 0;
    virtual const uint8_t* framebuffer() const = 0;  // RGBA8
    virtual int width() const = 0;
    virtual int height() const = 0;
    virtual int drawCalls() const = 0;
    virtual int triangles() const = 0;
    virtual const char* backendName() const = 0;
};

// Software rasterizer: fully CPU, no GPU requirement. Used as the verification
// path in this repository and as a compatibility fallback in the shipped build.
std::unique_ptr<Renderer> createSoftwareRenderer();

struct GpuContext; // platform-provided GL context (see gfx_gl.cpp)
std::unique_ptr<Renderer> createGLRenderer(void* windowHandle, int w, int h);

// utility: write an RGBA8 buffer to a PPM/PNG file (PNG via a tiny encoder)
bool writePNG32(const std::string& path, const uint8_t* rgba, int w, int h);
bool writePPM(const std::string& path, const uint8_t* rgb, int w, int h);

} // namespace hv
