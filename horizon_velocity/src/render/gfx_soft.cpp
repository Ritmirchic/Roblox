// HORIZON VELOCITY - multithreaded software rasterizer
// A complete CPU renderer: perspective-correct rasterisation, shadow mapping,
// PBR-lite shading, procedural sky, water, height fog, bloom and tonemapping.
// No GPU required. Used for automated visual verification and as a fallback.
#include "render/gfx.h"
#include "core/noise.h"
#include <thread>
#include <atomic>
#include <cstring>
#include <cstdio>

namespace hv {

// ---------------------------------------------------------------- textures
void Texture::buildMips() {
    mips.clear();
    if (px.empty()) return;
    mips.push_back(px);
    int cw = w, ch = h;
    while (cw > 1 && ch > 1) {
        int nw = cw / 2, nh = ch / 2;
        std::vector<uint32_t> dst((size_t)nw * nh);
        const std::vector<uint32_t>& src = mips.back();
        for (int y = 0; y < nh; y++) {
            for (int x = 0; x < nw; x++) {
                uint32_t a = src[(size_t)(y*2) * cw + x*2];
                uint32_t b = src[(size_t)(y*2) * cw + x*2 + 1];
                uint32_t c = src[(size_t)(y*2+1) * cw + x*2];
                uint32_t d = src[(size_t)(y*2+1) * cw + x*2 + 1];
                uint32_t out = 0;
                for (int s = 0; s < 32; s += 8) {
                    out |= ((((a >> s) & 0xFF) + ((b >> s) & 0xFF) + ((c >> s) & 0xFF) + ((d >> s) & 0xFF)) / 4) << s;
                }
                dst[(size_t)y * nw + x] = out;
            }
        }
        mips.push_back(std::move(dst));
        cw = nw; ch = nh;
    }
}

uint32_t Texture::sample(float u, float v, float lodBias) const {
    if (mips.empty()) return 0xFFFFFFFFu;
    int lod = (int)std::floor(lodBias + 0.5f);
    if (lod < 0) lod = 0;
    if (lod >= (int)mips.size()) lod = (int)mips.size() - 1;
    int mw = std::max(1, w >> lod), mh = std::max(1, h >> lod);
    const std::vector<uint32_t>& src = mips[lod];
    u *= mw; v *= mh;
    int x0 = (int)std::floor(u - 0.5f), y0 = (int)std::floor(v - 0.5f);
    float fx = u - 0.5f - x0, fy = v - 0.5f - y0;
    auto fetch = [&](int x, int y) -> uint32_t {
        if (wrap) { x &= (mw - 1); y &= (mh - 1); }
        else { x = std::min(std::max(x, 0), mw - 1); y = std::min(std::max(y, 0), mh - 1); }
        return src[(size_t)y * mw + x];
    };
    uint32_t c00 = fetch(x0, y0), c10 = fetch(x0+1, y0), c01 = fetch(x0, y0+1), c11 = fetch(x0+1, y0+1);
    uint32_t out = 0;
    for (int s = 0; s < 32; s += 8) {
        float a = (float)((c00 >> s) & 0xFF), b = (float)((c10 >> s) & 0xFF);
        float c = (float)((c01 >> s) & 0xFF), d = (float)((c11 >> s) & 0xFF);
        float top = lerpf(a, b, fx), bot = lerpf(c, d, fx);
        out |= (uint32_t)clampf(lerpf(top, bot, fy), 0.0f, 255.0f) << s;
    }
    return out;
}

Vec4 Texture::sampleVec(float u, float v, float lodBias) const {
    uint32_t c = sample(u, v, lodBias);
    return Vec4((c & 0xFF) / 255.0f, ((c >> 8) & 0xFF) / 255.0f, ((c >> 16) & 0xFF) / 255.0f, ((c >> 24) & 0xFF) / 255.0f);
}

// ---------------------------------------------------------------- asset lib
AssetLib& assets() {
    static AssetLib lib;
    return lib;
}
int AssetLib::addTexture(Texture t) {
    t.buildMips();
    textures.push_back(std::move(t));
    return (int)textures.size() - 1;
}
int AssetLib::addMaterial(const Material& m) {
    materials.push_back(m);
    return (int)materials.size() - 1;
}
int AssetLib::findMaterial(const std::string& name) const {
    for (size_t i = 0; i < materials.size(); i++) if (materials[i].name == name) return (int)i;
    return -1;
}
int AssetLib::tex(const std::string& name) const {
    for (size_t i = 0; i < textures.size(); i++) if (textures[i].name == name) return (int)i;
    return -1;
}

Mat4 Camera::view() const {
    Mat4 v = Mat4::lookAt(pos, target, up);
    if (std::fabs(roll) > 1e-5f) v = Mat4::rotationZ(roll) * v;
    return v;
}
Mat4 Camera::proj() const {
    return Mat4::perspective(fovY, aspect, nearZ, farZ);
}

// ---------------------------------------------------------------- helpers
static inline Vec3 toLinear(Vec3 c) {
    return {std::pow(std::max(0.0f, c.x), 2.2f), std::pow(std::max(0.0f, c.y), 2.2f), std::pow(std::max(0.0f, c.z), 2.2f)};
}
static inline float acesCurve(float x) {
    // Narkowicz ACES fit
    return clampf((x * (2.51f * x + 0.03f)) / (x * (2.43f * x + 0.59f) + 0.14f), 0.0f, 1.0f);
}

struct RasterVert {
    Vec3 wp;
    Vec3 n;
    Vec2 uv;
    Vec4 col;
    float sx = 0, sy = 0, sz = 0, iw = 0;
    bool valid = false;
};

class SoftwareRenderer : public Renderer {
public:
    int w_ = 0, h_ = 0, rw_ = 0, rh_ = 0;
    QualitySettings q_;
    Environment env_;
    Camera cam_;
    Mat4 viewProj_, invViewProj_;
    std::vector<Vec3> hdr_;
    std::vector<float> depth_;
    std::vector<Vec3> bloomA_, bloomB_;
    std::vector<uint8_t> out_;
    // shadow map (sun, orthographic)
    int sw_ = 0, sh_ = 0;
    std::vector<float> shadow_;
    Mat4 lightVP_;
    Vec3 lightCenter_;
    float lightExtent_ = 90.0f;
    int draws_ = 0, tris_ = 0;
    struct Item { const Mesh* mesh; Mat4 xf; int matOverride; Vec4 tint; bool isMesh; Vec3 sp; Vec2 ss; int stex; Vec4 scol; float srot; bool sadd; };
    std::vector<Item> queue_;
    std::vector<std::thread> pool_;
    std::atomic<int> tileCounter_{0};
    int tilesX_ = 0, tilesY_ = 0;
    static constexpr int TILE = 32;

    bool init(int w, int h, bool) override {
        w_ = w; h_ = h;
        resize(w, h);
        return true;
    }
    void shutdown() override {}
    void resize(int w, int h) override {
        w_ = w; h_ = h;
        rw_ = std::max(64, (int)(w * clampf(q_.renderScale, 0.25f, 2.0f)));
        rh_ = std::max(36, (int)(h * clampf(q_.renderScale, 0.25f, 2.0f)));
        hdr_.assign((size_t)rw_ * rh_, Vec3(0,0,0));
        depth_.assign((size_t)rw_ * rh_, 1e30f);
        bloomA_.assign((size_t)(rw_/4) * (rh_/4), Vec3(0,0,0));
        bloomB_.assign((size_t)(rw_/4) * (rh_/4), Vec3(0,0,0));
        out_.assign((size_t)w * h * 4, 0);
        sw_ = std::max(256, q_.shadowRes);
        sh_ = sw_;
        shadow_.assign((size_t)sw_ * sh_, 1e30f);
        tilesX_ = (rw_ + TILE - 1) / TILE;
        tilesY_ = (rh_ + TILE - 1) / TILE;
    }
    void setQuality(const QualitySettings& q) override {
        int ow = w_, oh = h_;
        q_ = q;
        resize(ow, oh);
    }
    void setEnvironment(const Environment& e) override { env_ = e; }
    const Environment& env() const override { return env_; }
    const uint8_t* framebuffer() const override { return out_.data(); }
    int width() const override { return w_; }
    int height() const override { return h_; }
    int drawCalls() const override { return draws_; }
    int triangles() const override { return tris_; }
    const char* backendName() const override { return "Software (CPU)"; }

    // ------------------------------------------------------------ frame
    void beginFrame(const Camera& c) override {
        cam_ = c;
        cam_.aspect = (float)rw_ / (float)rh_;
        viewProj_ = cam_.proj() * cam_.view();
        draws_ = 0; tris_ = 0;
        queue_.clear();
        std::fill(depth_.begin(), depth_.end(), 1e30f);
        drawSky();
    }

    void endFrame() override {
        // shadow pass first, then the visible pass
        if (q_.shadows) {
            buildShadowMap();
            shadowPass_ = true;
            for (auto& it : queue_) if (it.isMesh) submitMesh(it.mesh, it.xf, it.matOverride, it.tint);
            shadowPass_ = false;
        }
        for (auto& it : queue_) {
            if (it.isMesh) submitMesh(it.mesh, it.xf, it.matOverride, it.tint);
            else spriteImpl(it.sp, it.ss, it.stex, it.scol, it.srot, it.sadd);
        }
        postProcess();
    }

    // ------------------------------------------------------------ sky
    void drawSky() {
        Mat4 invVP;
        if (!viewProj_.invert(invVP)) invVP = Mat4::identity();
        Vec3 sunC = toLinear(env_.sunColor) * env_.sunIntensity;
        Vec3 zenith = toLinear(env_.skyZenith);
        Vec3 horizon = toLinear(env_.skyHorizon);
        float night = env_.nightFactor;
        Noise n; n.init(9137);
        for (int y = 0; y < rh_; y++) {
            for (int x = 0; x < rw_; x++) {
                float ndcx = (x + 0.5f) / rw_ * 2.0f - 1.0f;
                float ndcy = 1.0f - (y + 0.5f) / rh_ * 2.0f;
                Vec4 p = invVP * Vec4(ndcx, ndcy, 1.0f, 1.0f);
                Vec3 dir = Vec3(p.x, p.y, p.z) / p.w;
                dir = dir.normalized();
                float t = clampf(dir.y * 1.35f + 0.06f, 0.0f, 1.0f);
                Vec3 sky = vlerp(horizon, zenith, std::pow(t, 0.62f));
                // sun disc + glow
                float sd = std::max(0.0f, dir.dot(env_.sunDir));
                sky += sunC * (std::pow(sd, 900.0f) * 26.0f + std::pow(sd, 22.0f) * 0.35f + std::pow(sd, 5.0f) * 0.10f);
                // clouds (cheap 2D fbm on the dome)
                if (dir.y > 0.015f) {
                    float inv = 1.0f / (dir.y + 0.28f);
                    float cu = dir.x * inv * 1.6f + env_.timeOfDay * 0.004f;
                    float cv = dir.z * inv * 1.6f;
                    float cover = env_.cloudCover;
                    float f = n.fbm2(cu * 1.4f, cv * 1.4f, 4) * 0.5f + 0.5f;
                    float mask = smoothstepf(1.0f - cover, 1.0f - cover + 0.32f, f) * smoothstepf(0.0f, 0.18f, dir.y);
                    Vec3 cloudCol = vlerp(Vec3(0.62f,0.66f,0.74f), Vec3(1.02f,1.0f,0.98f), clampf(f, 0.0f, 1.0f)) *
                                    (0.45f + 0.75f * clampf(sd, 0.0f, 1.0f)) * (1.0f - night * 0.72f);
                    sky = vlerp(sky, cloudCol, mask * 0.92f);
                }
                // stars at night
                if (night > 0.25f && dir.y > 0.05f) {
                    float s = hashFloat((int)(dir.x * 900), (int)(dir.z * 900), (int)(dir.y * 900), 7u);
                    if (s > 0.9975f) sky += Vec3(0.8f, 0.85f, 1.0f) * (night * 1.6f);
                }
                // ground haze below horizon
                if (dir.y < 0.0f) {
                    sky = vlerp(toLinear(env_.fogColor), toLinear(env_.fogColor) * 0.55f, clampf(-dir.y * 2.2f, 0.0f, 1.0f));
                }
                hdr_[(size_t)y * rw_ + x] = sky;
            }
        }
    }

    // ------------------------------------------------------------ shadow map
    void buildShadowMap() {
        std::fill(shadow_.begin(), shadow_.end(), 1e30f);
        // centre the light frustum a little ahead of the camera
        Vec3 fwd = cam_.forward();
        lightCenter_ = cam_.pos + Vec3(fwd.x, 0, fwd.z).normalized() * 55.0f;
        Mat4 lview = Mat4::lookAt(lightCenter_ + env_.sunDir * 160.0f, lightCenter_, Vec3(0, 1, 0));
        Mat4 lproj = Mat4::ortho(-lightExtent_, lightExtent_, -lightExtent_, lightExtent_, 1.0f, 400.0f);
        lightVP_ = lproj * lview;
        shadowPass_ = true;
        // the shadow pass re-uses the mesh() submission path
    }
    bool shadowPass_ = false;

    float shadowLookup(const Vec3& p, float ndl) const {
        Vec4 lp = lightVP_ * Vec4(p, 1.0f);
        if (std::fabs(lp.w) < 1e-6f) return 1.0f;
        Vec3 ndc(lp.x / lp.w, lp.y / lp.w, lp.z / lp.w);
        float u = (ndc.x * 0.5f + 0.5f) * sw_;
        float v = (1.0f - (ndc.y * 0.5f + 0.5f)) * sh_;
        if (u < 1 || v < 1 || u >= sw_ - 1 || v >= sh_ - 1) return 1.0f;
        float bias = 0.0016f + 0.004f * (1.0f - ndl);
        int iu = (int)u, iv = (int)v;
        float sum = 0.0f;
        for (int dy = -1; dy <= 1; dy++) {
            for (int dx = -1; dx <= 1; dx++) {
                float d = shadow_[(size_t)(iv + dy) * sw_ + (iu + dx)];
                sum += (ndc.z - bias > d) ? 0.0f : 1.0f;
            }
        }
        return sum / 9.0f;
    }

    // ------------------------------------------------------------ mesh submission
    void mesh(const Mesh& m, const Mat4& xf, int matOverride, const Vec4& tint) override {
        if (m.idx.empty()) return;
        Item it{};
        it.isMesh = true;
        it.mesh = &m;
        it.xf = xf;
        it.matOverride = matOverride;
        it.tint = tint;
        queue_.push_back(it);
    }

    void submitMesh(const Mesh* mp, const Mat4& xf, int matOverride, const Vec4& tint) {
        const Mesh& m = *mp;
        if (m.idx.empty()) return;
        draws_++;
        // bounds cull (sphere)
        Vec3 bc = xf.transformPoint(m.bounds.center());
        float br = m.bounds.radius() * 1.6f;
        if (shadowPass_) {
            Vec3 lc = (lightVP_ * Vec4(bc, 1.0f)).xyz();
            Vec4 lp = lightVP_ * Vec4(bc, 1.0f);
            float ext = lightExtent_ * 1.15f;
            if (std::fabs(lp.x) - br > ext * std::fabs(lp.w) || std::fabs(lp.y) - br > ext * std::fabs(lp.w)) { (void)lc; if (std::fabs(lp.x) > ext + br * 2 || std::fabs(lp.y) > ext + br * 2) return; }
        } else {
            Vec3 toC = bc - cam_.pos;
            if (toC.length() - br > q_.viewDistance) return;
        }
        Mat4 mvp = shadowPass_ ? (lightVP_ * xf) : (viewProj_ * xf);
        // transform vertices
        std::vector<RasterVert> tv(m.verts.size());
        for (size_t i = 0; i < m.verts.size(); i++) {
            const Vertex& v = m.verts[i];
            Vec3 wp = xf.transformPoint(v.p);
            Vec4 cp = mvp * Vec4(v.p, 1.0f);
            RasterVert rv;
            rv.wp = wp;
            rv.n = xf.transformDir(v.n).normalized();
            rv.uv = v.uv;
            rv.col = Vec4(v.col.x * tint.x, v.col.y * tint.y, v.col.z * tint.z, v.col.w * tint.w);
            float w = cp.w;
            rv.valid = w > 1e-4f;
            if (rv.valid) {
                rv.sx = (cp.x / w * 0.5f + 0.5f) * rw_;
                rv.sy = (1.0f - (cp.y / w * 0.5f + 0.5f)) * rh_;
                rv.sz = cp.z / w;
                rv.iw = 1.0f / w;
            }
            tv[i] = rv;
        }
        int matIdx = matOverride >= 0 ? matOverride : 0;
        for (const SubMesh& sub : m.subs) {
            int mi = matOverride >= 0 ? matOverride : sub.material;
            const Material* mat = (mi >= 0 && mi < (int)assets().materials.size()) ? &assets().materials[mi] : nullptr;
            if (!mat) continue;
            if (shadowPass_) {
                if (mat->shade == Shade::Unlit || mat->shade == Shade::Glass || mat->opacity < 0.9f) continue;
            }
            matIdx = mi;
            for (uint32_t k = 0; k + 2 < sub.count; k += 3) {
                const RasterVert& a = tv[m.idx[sub.start + k]];
                const RasterVert& b = tv[m.idx[sub.start + k + 1]];
                const RasterVert& c = tv[m.idx[sub.start + k + 2]];
                if (!a.valid || !b.valid || !c.valid) continue;
                drawTriangle(a, b, c, *mat, mi);
            }
        }
        (void)matIdx;
    }

    // ------------------------------------------------------------ raster
    void drawTriangle(const RasterVert& a, const RasterVert& b, const RasterVert& c, const Material& mat, int matIdx) {
        float area = (b.sx - a.sx) * (c.sy - a.sy) - (b.sy - a.sy) * (c.sx - a.sx);
        if (shadowPass_) {
            if (std::fabs(area) < 1e-6f) return;
            rasterizeShadow(a, b, c);
            return;
        }
        if (!mat.doubleSided && area <= 1e-4f) return;  // backface cull (screen-space winding)
        if (std::fabs(area) < 1e-6f) return;
        float invArea = 1.0f / area;
        int minX = (int)std::floor(std::min(a.sx, std::min(b.sx, c.sx)));
        int maxX = (int)std::ceil(std::max(a.sx, std::max(b.sx, c.sx)));
        int minY = (int)std::floor(std::min(a.sy, std::min(b.sy, c.sy)));
        int maxY = (int)std::ceil(std::max(a.sy, std::max(b.sy, c.sy)));
        minX = std::max(0, minX); minY = std::max(0, minY);
        maxX = std::min(rw_ - 1, maxX); maxY = std::min(rh_ - 1, maxY);
        if (minX > maxX || minY > maxY) return;
        tris_++;
        // uv gradient estimate for texture LOD
        float du1 = b.uv.x - a.uv.x, dv1 = b.uv.y - a.uv.y;
        float dx1 = b.sx - a.sx, dy1 = b.sy - a.sy;
        float det = dx1 * (c.sy - a.sy) - (c.sx - a.sx) * dy1;
        float dudx = 0, dvdx = 0;
        if (std::fabs(det) > 1e-6f) {
            float du2 = c.uv.x - a.uv.x, dv2 = c.uv.y - a.uv.y;
            float dx2 = c.sx - a.sx, dy2 = c.sy - a.sy;
            dudx = (du1 * dy2 - du2 * dy1) / det;
            dvdx = (dv1 * dy2 - dv2 * dy1) / det;
        }
        float lod = std::log2(std::max(1e-6f, std::sqrt(dudx * dudx + dvdx * dvdx) * 1.0f)) + 0.0f;
        if (lod < 0) lod = 0;
        const Texture* tex = (mat.texture >= 0 && mat.texture < (int)assets().textures.size()) ? &assets().textures[mat.texture] : nullptr;
        const Texture* tex2 = (mat.texture2 >= 0 && mat.texture2 < (int)assets().textures.size()) ? &assets().textures[mat.texture2] : nullptr;
        const Texture* tex3 = (mat.texture3 >= 0 && mat.texture3 < (int)assets().textures.size()) ? &assets().textures[mat.texture3] : nullptr;
        bool blend = mat.shade == Shade::Glass || mat.opacity < 0.999f ||
                     (tex && tex->name == "foliage") || mat.shade == Shade::Foliage;
        float zA = a.iw, zB = b.iw, zC = c.iw;
        for (int y = minY; y <= maxY; y++) {
            float py = y + 0.5f;
            for (int x = minX; x <= maxX; x++) {
                float px = x + 0.5f;
                float w0 = ((b.sx - px) * (c.sy - py) - (b.sy - py) * (c.sx - px)) * invArea;
                float w1 = ((c.sx - px) * (a.sy - py) - (c.sy - py) * (a.sx - px)) * invArea;
                float w2 = 1.0f - w0 - w1;
                if (w0 < -0.001f || w1 < -0.001f || w2 < -0.001f) continue;
                float iw = w0 * zA + w1 * zB + w2 * zC;
                if (iw <= 0.0f) continue;
                float z = w0 * a.sz + w1 * b.sz + w2 * c.sz;
                size_t oi = (size_t)y * rw_ + x;
                if (z > 1.0f || z < -1.0f) continue;
                if (z >= depth_[oi]) continue;
                // perspective-correct attributes
                float invw = 1.0f / iw;
                Vec3 wp = (a.wp * (w0 * zA) + b.wp * (w1 * zB) + c.wp * (w2 * zC)) * invw;
                Vec3 nrm = (a.n * (w0 * zA) + b.n * (w1 * zB) + c.n * (w2 * zC)) * invw;
                Vec2 uv = (a.uv * (w0 * zA) + b.uv * (w1 * zB) + c.uv * (w2 * zC)) * invw;
                Vec4 vc = (a.col * (w0 * zA) + b.col * (w1 * zB) + c.col * (w2 * zC)) * invw;
                if (nrm.lengthSq() < 1e-9f) continue;
                Vec3 N = nrm.normalized();
                Vec3 col = shadePixel(mat, tex, tex2, tex3, wp, N, uv, vc, lod);
                float alpha = vc.w * mat.opacity;
                if (tex && (mat.shade == Shade::Foliage || tex->name == "foliage")) {
                    Vec4 tc = tex->sampleVec(uv.x * mat.uvScale.x, uv.y * mat.uvScale.y, lod);
                    if (tc.w < 0.4f) continue;
                    alpha = mat.opacity;
                }
                if (blend) {
                    alpha = clampf(alpha, 0.0f, 1.0f);
                    if (alpha <= 0.004f) continue;
                    hdr_[oi] = vlerp(hdr_[oi], col, alpha);
                    if (alpha > 0.85f) depth_[oi] = z;
                } else {
                    hdr_[oi] = col;
                    depth_[oi] = z;
                }
            }
        }
    }

    void rasterizeShadow(const RasterVert& a, const RasterVert& b, const RasterVert& c) {
        float area = (b.sx - a.sx) * (c.sy - a.sy) - (b.sy - a.sy) * (c.sx - a.sx);
        if (std::fabs(area) < 1e-6f) return;
        float invArea = 1.0f / area;
        int minX = std::max(0, (int)std::floor(std::min(a.sx, std::min(b.sx, c.sx))));
        int maxX = std::min(sw_ - 1, (int)std::ceil(std::max(a.sx, std::max(b.sx, c.sx))));
        int minY = std::max(0, (int)std::floor(std::min(a.sy, std::min(b.sy, c.sy))));
        int maxY = std::min(sh_ - 1, (int)std::ceil(std::max(a.sy, std::max(b.sy, c.sy))));
        for (int y = minY; y <= maxY; y++) {
            float py = y + 0.5f;
            for (int x = minX; x <= maxX; x++) {
                float px = x + 0.5f;
                float w0 = ((b.sx - px) * (c.sy - py) - (b.sy - py) * (c.sx - px)) * invArea;
                float w1 = ((c.sx - px) * (a.sy - py) - (c.sy - py) * (a.sx - px)) * invArea;
                float w2 = 1.0f - w0 - w1;
                if (w0 < -0.001f || w1 < -0.001f || w2 < -0.001f) continue;
                float z = w0 * a.sz + w1 * b.sz + w2 * c.sz;
                size_t oi = (size_t)y * sw_ + x;
                if (z < shadow_[oi]) shadow_[oi] = z;
            }
        }
    }

    // ------------------------------------------------------------ shading
    Vec3 shadePixel(const Material& mat, const Texture* tex, const Texture* tex2, const Texture* tex3,
                    const Vec3& P, const Vec3& N, const Vec2& uv, const Vec4& vcol, float lod) {
        if (mat.shade == Shade::Unlit) {
            Vec3 c = toLinear(mat.albedo.rgb());
            if (tex) { Vec4 t = tex->sampleVec(uv.x, uv.y, lod); c = c * toLinear(Vec3(t.x, t.y, t.z)); }
            return c * vcol.x;
        }
        Vec3 albedo;
        float rough = mat.roughness;
        float metal = mat.metallic;
        float ao = 1.0f;
        if (mat.shade == Shade::Terrain) {
            // Base colour comes from the material (one material per biome), detail
            // from a tiled grain texture, macro variation from the vertex colour.
            float slope = 1.0f - clampf(N.y, 0.0f, 1.0f);
            Vec3 base = toLinear(mat.albedo.rgb());
            float grain = 1.0f;
            if (tex) {
                Vec4 t = tex->sampleVec(uv.x * mat.uvScale.x, uv.y * mat.uvScale.y, lod);
                grain = 0.74f + t.x * 0.52f;
            }
            float variation = 0.90f + vcol.x * 0.20f;
            albedo = base * (grain * variation);
            float rockMask = smoothstepf(0.30f, 0.62f, slope);
            Vec3 rock(0.31f, 0.30f, 0.28f);
            albedo = vlerp(albedo, rock * (0.70f + grain * 0.45f), rockMask * 0.88f);
            rough = lerpf(mat.roughness, 0.90f, rockMask);
            metal = 0.0f;
            ao = 0.86f + 0.14f * clampf(N.y, 0.0f, 1.0f);
        } else if (mat.shade == Shade::Asphalt) {
            Vec3 base(0.16f, 0.162f, 0.168f);
            float grain = 1.0f, wet = env_.wetness;
            if (tex) {
                Vec4 t = tex->sampleVec(uv.x * mat.uvScale.x, uv.y * mat.uvScale.y, lod);
                grain = t.x;
                base = Vec3(base.x * (0.72f + grain * 0.62f), base.y * (0.72f + grain * 0.62f), base.z * (0.72f + grain * 0.62f));
                // additive aggregate sparkle
                base += Vec3(0.05f, 0.05f, 0.055f) * std::max(0.0f, grain - 0.62f) * 2.2f;
            }
            // carriageway markings come from the mask texture's red channel
            if (tex2) {
                Vec4 mk = tex2->sampleVec(uv.x, uv.y, lod);
                float m = smoothstepf(0.35f, 0.65f, mk.x);
                if (m > 0.0f) {
                    Vec3 paint(0.72f, 0.72f, 0.70f);
                    base = vlerp(base, paint, m * 0.92f);
                }
            }
            // wet surfaces darken and become glossy
            base = base * lerpf(1.0f, 0.55f, wet);
            albedo = base;
            rough = lerpf(0.82f - grain * 0.12f, 0.14f, wet * 0.85f);
            if (tex2) {
                Vec4 mk = tex2->sampleVec(uv.x, uv.y, lod);
                rough = lerpf(rough, 0.52f, smoothstepf(0.35f, 0.65f, mk.x));
            }
            metal = 0.0f;
        } else {
            albedo = toLinear(mat.albedo.rgb());
            if (tex) {
                Vec4 t = tex->sampleVec(uv.x * mat.uvScale.x, uv.y * mat.uvScale.y, lod);
                albedo = albedo * toLinear(Vec3(t.x, t.y, t.z));
            }
            albedo = albedo * Vec3(vcol.x, vcol.y, vcol.z);
            ao = vcol.x > 0.0f ? vcol.x * 0.5f + 0.5f : 1.0f;
        }
        if (mat.shade == Shade::Foliage) ao = 0.8f;

        Vec3 V = (cam_.pos - P).normalized();
        Vec3 L = env_.sunDir.normalized();
        float ndl = std::max(0.0f, N.dot(L));
        float shadow = 1.0f;
        if (q_.shadows && !shadowPass_) shadow = shadowLookup(P, ndl);
        Vec3 sunC = toLinear(env_.sunColor) * env_.sunIntensity;
        Vec3 diff = albedo * (1.0f - metal) * (ndl * shadow) * sunC;
        // hemisphere ambient
        float upness = clampf(N.y * 0.5f + 0.5f, 0.0f, 1.0f);
        Vec3 amb = vlerp(toLinear(env_.ambientGround), toLinear(env_.ambientSky), upness) * ao;
        Vec3 color = diff + albedo * amb;
        // classic specular (GGX-lite)
        if (mat.shade != Shade::Foliage) {
            Vec3 H = (L + V).normalized();
            float ndh = std::max(0.0f, N.dot(H));
            float alpha = std::max(0.002f, rough * rough);
            float a2 = alpha * alpha;
            float dd = ndh * ndh * (a2 - 1.0f) + 1.0f;
            float D = a2 / (PI * dd * dd);
            float ndv = std::max(0.001f, N.dot(V));
            float k = alpha * 0.5f;
            float G = (ndl / (ndl * (1 - k) + k)) * (ndv / (ndv * (1 - k) + k));
            Vec3 F0 = vlerp(Vec3(0.04f, 0.04f, 0.04f), albedo, metal);
            Vec3 F = F0 + (Vec3(1,1,1) - F0) * std::pow(1.0f - std::max(0.0f, H.dot(V)), 5.0f);
            float specScale = q_.reflections ? 1.0f : 0.35f;
            color += F * (D * G * 0.25f / std::max(0.001f, ndv)) * sunC * (ndl * shadow) * specScale;
            // environment reflection approximation (no probe capture in this renderer)
            if (q_.reflections) {
                Vec3 R = reflectVec(-V, N);
                float up = clampf(R.y * 0.5f + 0.5f, 0.0f, 1.0f);
                Vec3 skyRef = vlerp(toLinear(env_.fogColor), toLinear(env_.skyZenith), up);
                skyRef += sunC * std::pow(std::max(0.0f, R.dot(L)), 90.0f) * 0.7f;
                // metals tint their reflections with the base colour
                skyRef = skyRef * vlerp(Vec3(1,1,1), albedo * 0.95f + Vec3(0.04f), metal);
                // Schlick Fresnel: painted surfaces only mirror the sky at grazing angles,
                // otherwise the whole car turns into a chrome ball.
                float ndv0 = std::max(0.0f, N.dot(V));
                float fres = 0.04f + 0.96f * std::pow(1.0f - ndv0, 5.0f);
                float reflAmount = clampf(metal * 0.30f + mat.clearcoat * fres * 1.15f, 0.0f, 1.0f);
                reflAmount *= (1.0f - clampf(rough * 1.10f, 0.0f, 0.90f));
                color = vlerp(color, skyRef, reflAmount);
            }
        }
        // car paint flake / clearcoat sheen
        if (mat.shade == Shade::CarPaint) {
            Vec3 R = reflectVec(-V, N);
            float rim = std::pow(1.0f - std::max(0.0f, std::abs(N.dot(V))), 3.0f);
            color += toLinear(env_.skyHorizon) * rim * 0.10f;
        }
        // water
        if (mat.shade == Shade::Water) {
            float t = env_.timeOfDay * 3600.0f;
            Vec3 wp = P;
            float w1 = std::sin(wp.x * 0.42f + t * 0.5f) * 0.5f + std::sin(wp.z * 0.31f - t * 0.36f) * 0.5f;
            float w2 = std::sin((wp.x + wp.z) * 0.9f + t * 0.8f) * 0.5f;
            Vec3 nW = Vec3(w1 * 0.06f, 1.0f, w2 * 0.06f).normalized();
            Vec3 R = reflectVec(-V, nW);
            float up = clampf(R.y * 0.5f + 0.5f, 0.0f, 1.0f);
            Vec3 skyRef = vlerp(toLinear(env_.skyHorizon), toLinear(env_.skyZenith), up);
            float fres = std::pow(1.0f - std::max(0.0f, nW.dot(V)), 3.0f);
            Vec3 deep = Vec3(0.02f, 0.10f, 0.16f);
            color = vlerp(deep, skyRef, clampf(0.28f + fres * 0.85f, 0.0f, 1.0f));
            color += sunC * std::pow(std::max(0.0f, R.dot(L)), 220.0f) * 3.0f;
        }
        // emissive
        color += toLinear(mat.emissive.rgb()) * mat.emissive.a;
        // glass
        if (mat.shade == Shade::Glass) {
            Vec3 R = reflectVec(-V, N);
            float up = clampf(R.y * 0.5f + 0.5f, 0.0f, 1.0f);
            Vec3 skyRef = vlerp(toLinear(env_.skyHorizon), toLinear(env_.skyZenith), up);
            color = vlerp(color, skyRef, 0.42f);
        }
        // atmospheric fog
        float dist = (P - cam_.pos).length();
        float heightFade = std::exp(-std::max(0.0f, P.y) / std::max(1.0f, env_.fogHeight));
        float fogAmt = 1.0f - std::exp(-dist * env_.fogDensity * lerpf(1.0f, 0.25f, 1.0f - heightFade));
        fogAmt = clampf(fogAmt, 0.0f, 1.0f);
        Vec3 fogCol = toLinear(env_.fogColor);
        color = vlerp(color, fogCol, fogAmt);
        return color;
    }
    static Vec3 alembicMix(const Vec3& a, const Vec3& b, float t) { return vlerp(a, b, clampf(t, 0.0f, 1.0f)); }

    // ------------------------------------------------------------ sprites / particles
    void sprite(const Vec3& pos, const Vec2& size, int texture, const Vec4& color, float rotation, bool additive) override {
        Item it{};
        it.isMesh = false;
        it.mesh = nullptr;
        it.sp = pos; it.ss = size; it.stex = texture; it.scol = color; it.srot = rotation; it.sadd = additive;
        queue_.push_back(it);
    }
    void spriteImpl(const Vec3& pos, const Vec2& size, int texture, const Vec4& color, float rotation, bool additive) {
        Vec3 fwd = cam_.forward();
        Vec3 rightV = fwd.cross(Vec3(0, 1, 0)).normalized();
        Vec3 upV = rightV.cross(fwd).normalized();
        if (rotation != 0.0f) {
            Vec3 r2 = rightV * std::cos(rotation) + upV * std::sin(rotation);
            Vec3 u2 = upV * std::cos(rotation) - rightV * std::sin(rotation);
            rightV = r2; upV = u2;
        }
        Vec3 c0 = pos - rightV * size.x * 0.5f - upV * size.y * 0.5f;
        Vec3 c1 = pos + rightV * size.x * 0.5f - upV * size.y * 0.5f;
        Vec3 c2 = pos + rightV * size.x * 0.5f + upV * size.y * 0.5f;
        Vec3 c3 = pos - rightV * size.x * 0.5f + upV * size.y * 0.5f;
        RasterVert vs[4];
        Vec3 pts[4] = {c0, c1, c2, c3};
        Vec2 uvs[4] = {{0,1},{1,1},{1,0},{0,0}};
        Mat4 vp = viewProj_;
        for (int i = 0; i < 4; i++) {
            Vec4 cp = vp * Vec4(pts[i], 1.0f);
            vs[i].wp = pts[i];
            vs[i].n = -fwd;
            vs[i].uv = uvs[i];
            vs[i].col = color;
            vs[i].valid = cp.w > 1e-4f;
            if (vs[i].valid) {
                vs[i].sx = (cp.x / cp.w * 0.5f + 0.5f) * rw_;
                vs[i].sy = (1.0f - (cp.y / cp.w * 0.5f + 0.5f)) * rh_;
                vs[i].sz = cp.z / cp.w;
                vs[i].iw = 1.0f / cp.w;
            }
        }
        if (!vs[0].valid || !vs[1].valid || !vs[2].valid || !vs[3].valid) return;
        Material m;
        m.shade = Shade::Unlit;
        m.texture = texture;
        m.opacity = 1.0f;
        m.doubleSided = true;
        m.albedo = Color(1,1,1,1);
        // rasterise as two triangles, additive blend
        rasterizeSpriteTri(vs[0], vs[1], vs[2], m, additive);
        rasterizeSpriteTri(vs[0], vs[2], vs[3], m, additive);
    }

    void rasterizeSpriteTri(const RasterVert& a, const RasterVert& b, const RasterVert& c, const Material& mat, bool additive) {
        float area = (b.sx - a.sx) * (c.sy - a.sy) - (b.sy - a.sy) * (c.sx - a.sx);
        if (std::fabs(area) < 1e-6f) return;
        float invArea = 1.0f / area;
        int minX = std::max(0, (int)std::floor(std::min(a.sx, std::min(b.sx, c.sx))));
        int maxX = std::min(rw_ - 1, (int)std::ceil(std::max(a.sx, std::max(b.sx, c.sx))));
        int minY = std::max(0, (int)std::floor(std::min(a.sy, std::min(b.sy, c.sy))));
        int maxY = std::min(rh_ - 1, (int)std::ceil(std::max(a.sy, std::max(b.sy, c.sy))));
        const Texture* tex = (mat.texture >= 0 && mat.texture < (int)assets().textures.size()) ? &assets().textures[mat.texture] : nullptr;
        for (int y = minY; y <= maxY; y++) {
            for (int x = minX; x <= maxX; x++) {
                float px = x + 0.5f, py = y + 0.5f;
                float w0 = ((b.sx - px) * (c.sy - py) - (b.sy - py) * (c.sx - px)) * invArea;
                float w1 = ((c.sx - px) * (a.sy - py) - (c.sy - py) * (a.sx - px)) * invArea;
                float w2 = 1.0f - w0 - w1;
                if (w0 < -0.002f || w1 < -0.002f || w2 < -0.002f) continue;
                float z = w0 * a.sz + w1 * b.sz + w2 * c.sz;
                size_t oi = (size_t)y * rw_ + x;
                if (z >= depth_[oi] || z > 1.0f) continue;
                float iw = 1.0f / (w0 * a.iw + w1 * b.iw + w2 * c.iw);
                Vec2 uv = (a.uv * (w0 * a.iw) + b.uv * (w1 * b.iw) + c.uv * (w2 * c.iw)) * iw;
                Vec4 col = (a.col * (w0 * a.iw) + b.col * (w1 * b.iw) + c.col * (w2 * c.iw)) * iw;
                Vec3 src = toLinear(Vec3(col.x, col.y, col.z)) * col.w;
                if (tex) {
                    Vec4 t = tex->sampleVec(uv.x, uv.y, 0);
                    src = src * toLinear(Vec3(t.x, t.y, t.z));
                    src = src * t.w;
                }
                if (additive) hdr_[oi] = hdr_[oi] + src;
                else hdr_[oi] = vlerp(hdr_[oi], src, col.w);
            }
        }
    }

    void line3D(const Vec3& a, const Vec3& b, const Vec4& color) override {
        // simple screen-space line
        Vec4 ca = viewProj_ * Vec4(a, 1.0f), cb = viewProj_ * Vec4(b, 1.0f);
        if (ca.w <= 0 || cb.w <= 0) return;
        float ax = (ca.x / ca.w * 0.5f + 0.5f) * rw_, ay = (1.0f - (ca.y / ca.w * 0.5f + 0.5f)) * rh_;
        float bx = (cb.x / cb.w * 0.5f + 0.5f) * rw_, by = (1.0f - (cb.y / cb.w * 0.5f + 0.5f)) * rh_;
        int steps = (int)std::max(std::fabs(bx - ax), std::fabs(by - ay)) + 1;
        for (int i = 0; i <= steps; i++) {
            float t = (float)i / steps;
            int x = (int)lerpf(ax, bx, t), y = (int)lerpf(ay, by, t);
            if (x < 0 || y < 0 || x >= rw_ || y >= rh_) continue;
            hdr_[(size_t)y * rw_ + x] = vlerp(hdr_[(size_t)y * rw_ + x], color.xyz(), color.w);
        }
    }

    // ------------------------------------------------------------ post
    void postProcess() {
        // bloom: downsample bright pixels, blur, add back
        int bw = rw_ / 4, bh = rh_ / 4;
        if (q_.bloom && bw > 2 && bh > 2) {
            std::fill(bloomA_.begin(), bloomA_.end(), Vec3(0,0,0));
            for (int y = 0; y < bh; y++) {
                for (int x = 0; x < bw; x++) {
                    Vec3 s(0,0,0);
                    for (int dy = 0; dy < 4; dy++)
                        for (int dx = 0; dx < 4; dx++) {
                            int sx = std::min(rw_-1, x*4+dx), sy = std::min(rh_-1, y*4+dy);
                            Vec3 c = hdr_[(size_t)sy * rw_ + sx];
                            float lum = c.x * 0.2126f + c.y * 0.7152f + c.z * 0.0722f;
                            s += c * clampf(lum - 0.85f, 0.0f, 4.0f) * 0.25f;
                        }
                    bloomA_[(size_t)y * bw + x] = s;
                }
            }
            // separable blur
            for (int pass = 0; pass < 2; pass++) {
                for (int y = 0; y < bh; y++) for (int x = 0; x < bw; x++) {
                    Vec3 s(0,0,0);
                    for (int k = -2; k <= 2; k++) {
                        int xx = std::min(bw-1, std::max(0, x + k));
                        s += bloomA_[(size_t)y * bw + xx];
                    }
                    bloomB_[(size_t)y * bw + x] = s / 5.0f;
                }
                for (int y = 0; y < bh; y++) for (int x = 0; x < bw; x++) {
                    Vec3 s(0,0,0);
                    for (int k = -2; k <= 2; k++) {
                        int yy = std::min(bh-1, std::max(0, y + k));
                        s += bloomB_[(size_t)yy * bw + x];
                    }
                    bloomA_[(size_t)y * bw + x] = s / 5.0f;
                }
            }
        }
        float exposure = env_.exposure;
        for (int y = 0; y < h_; y++) {
            for (int x = 0; x < w_; x++) {
                int sx = (int)((float)x / w_ * rw_);
                int sy = (int)((float)y / h_ * rh_);
                sx = std::min(rw_ - 1, sx); sy = std::min(rh_ - 1, sy);
                Vec3 c = hdr_[(size_t)sy * rw_ + sx];
                if (q_.bloom && !bloomA_.empty()) {
                    int bx = std::min(bw - 1, sx / 4), by = std::min(bh - 1, sy / 4);
                    c += bloomA_[(size_t)by * bw + bx] * env_.bloom * 0.75f;
                }
                // exposure + tonemap
                c = c * exposure;
                c = Vec3(acesCurve(c.x), acesCurve(c.y), acesCurve(c.z));
                // grade
                float lum = c.x * 0.2126f + c.y * 0.7152f + c.z * 0.0722f;
                c = vlerp(Vec3(lum, lum, lum), c, env_.saturation);
                c = Vec3(saturate((c.x - 0.5f) * env_.contrast + 0.5f),
                         saturate((c.y - 0.5f) * env_.contrast + 0.5f),
                         saturate((c.z - 0.5f) * env_.contrast + 0.5f));
                // vignette
                float vx = (x / (float)w_ - 0.5f) * 2.0f, vy = (y / (float)h_ - 0.5f) * 2.0f;
                float vig = 1.0f - env_.vignette * clampf((vx*vx + vy*vy) * 0.55f, 0.0f, 1.0f);
                c = c * vig;
                // gamma
                Vec3 s(std::pow(saturate(c.x), 1/2.2f), std::pow(saturate(c.y), 1/2.2f), std::pow(saturate(c.z), 1/2.2f));
                size_t o = ((size_t)y * w_ + x) * 4;
                out_[o+0] = (uint8_t)(saturate(s.x) * 255.0f);
                out_[o+1] = (uint8_t)(saturate(s.y) * 255.0f);
                out_[o+2] = (uint8_t)(saturate(s.z) * 255.0f);
                out_[o+3] = 255;
            }
        }
    }

    // ------------------------------------------------------------ 2D
    void begin2D() override { in2D_ = true; }
    void end2D() override { in2D_ = false; }

    void rect(float x, float y, float w, float h, const Vec4& color) override {
        rectGrad(x, y, w, h, color, color);
    }
    void rectGrad(float x, float y, float w, float h, const Vec4& top, const Vec4& bottom) override {
        // UI coordinates: (0,0) top-left, pixels
        int x0 = std::max(0, (int)x), y0 = std::max(0, (int)y);
        int x1 = std::min(w_, (int)(x + w)), y1 = std::min(h_, (int)(y + h));
        for (int py = y0; py < y1; py++) {
            float t = (py - y) / std::max(1.0f, h);
            Vec4 c = vlerp4(top, bottom, clampf(t, 0.0f, 1.0f));
            for (int px = x0; px < x1; px++) blend2D(px, py, c.x, c.y, c.z, c.w);
        }
    }
    void image(float x, float y, float w, float h, int texture, const Vec4& color,
               const Vec2& uv0, const Vec2& uv1, float rotation) override {
        if (texture < 0 || texture >= (int)assets().textures.size()) return;
        const Texture& tex = assets().textures[texture];
        int x0 = std::max(0, (int)std::floor(x)), y0 = std::max(0, (int)std::floor(y));
        int x1 = std::min(w_, (int)std::ceil(x + w)), y1 = std::min(h_, (int)std::ceil(y + h));
        float cx = x + w * 0.5f, cy = y + h * 0.5f;
        for (int py = y0; py < y1; py++) {
            for (int px = x0; px < x1; px++) {
                float u = (px + 0.5f - x) / w, v = (py + 0.5f - y) / h;
                if (rotation != 0.0f) {
                    float dx = px + 0.5f - cx, dy = py + 0.5f - cy;
                    float c = std::cos(-rotation), s = std::sin(-rotation);
                    float rx = dx * c - dy * s + cx, ry = dx * s + dy * c + cy;
                    u = (rx - x) / w; v = (ry - y) / h;
                    if (u < 0 || u > 1 || v < 0 || v > 1) continue;
                }
                Vec4 t = tex.sampleVec(uv0.x + (uv1.x - uv0.x) * u, uv0.y + (uv1.y - uv0.y) * v, 0.0f);
                float a = t.w * color.w;
                if (a <= 0.003f) continue;
                blend2D(px, py, t.x * color.x, t.y * color.y, t.z * color.z, a);
            }
        }
    }
    static Vec4 vlerp4(const Vec4& a, const Vec4& b, float t) {
        return Vec4(lerpf(a.x,b.x,t), lerpf(a.y,b.y,t), lerpf(a.z,b.z,t), lerpf(a.w,b.w,t));
    }
    void blend2D(int x, int y, float r, float g, float b, float a) {
        if (x < 0 || y < 0 || x >= w_ || y >= h_) return;
        size_t o = ((size_t)y * w_ + x) * 4;
        float dr = std::pow(saturate(r), 2.2f), dg = std::pow(saturate(g), 2.2f), db = std::pow(saturate(b), 2.2f);
        float ir = std::pow(out_[o+0] / 255.0f, 2.2f), ig = std::pow(out_[o+1] / 255.0f, 2.2f), ib = std::pow(out_[o+2] / 255.0f, 2.2f);
        float rr = lerpf(ir, dr, a), rg = lerpf(ig, dg, a), rb = lerpf(ib, db, a);
        out_[o+0] = (uint8_t)(std::pow(clampf(rr,0,1), 1/2.2f) * 255);
        out_[o+1] = (uint8_t)(std::pow(clampf(rg,0,1), 1/2.2f) * 255);
        out_[o+2] = (uint8_t)(std::pow(clampf(rb,0,1), 1/2.2f) * 255);
        out_[o+3] = 255;
    }
    bool in2D_ = false;
};

std::unique_ptr<Renderer> createSoftwareRenderer() {
    return std::unique_ptr<Renderer>(new SoftwareRenderer());
}

// ---------------------------------------------------------------- PNG writer
static uint32_t crcTable[256];
static void initCrc() {
    static bool done = false;
    if (done) return;
    done = true;
    for (uint32_t n = 0; n < 256; n++) {
        uint32_t c = n;
        for (int k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320u ^ (c >> 1) : c >> 1;
        crcTable[n] = c;
    }
}
static uint32_t crc32buf(const uint8_t* buf, size_t len) {
    initCrc();
    uint32_t c = 0xFFFFFFFFu;
    for (size_t i = 0; i < len; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >> 8);
    return c ^ 0xFFFFFFFFu;
}
static void putU32(std::vector<uint8_t>& v, uint32_t x) {
    v.push_back((uint8_t)(x >> 24)); v.push_back((uint8_t)(x >> 16));
    v.push_back((uint8_t)(x >> 8)); v.push_back((uint8_t)x);
}
static void writeChunk(std::vector<uint8_t>& out, const char* type, const std::vector<uint8_t>& data) {
    putU32(out, (uint32_t)data.size());
    std::vector<uint8_t> td;
    td.insert(td.end(), type, type + 4);
    td.insert(td.end(), data.begin(), data.end());
    out.insert(out.end(), td.begin(), td.end());
    putU32(out, crc32buf(td.data(), td.size()));
}
// minimal deflate using stored blocks (no compression) - valid PNG for any decoder
bool writePNG32(const std::string& path, const uint8_t* rgba, int w, int h) {
    std::vector<uint8_t> raw;
    raw.reserve((size_t)h * (w * 4 + 1));
    for (int y = 0; y < h; y++) {
        raw.push_back(0);
        const uint8_t* row = rgba + (size_t)y * w * 4;
        for (int x = 0; x < w; x++) {
            raw.push_back(row[x*4+0]); raw.push_back(row[x*4+1]);
            raw.push_back(row[x*4+2]); raw.push_back(row[x*4+3]);
        }
    }
    // zlib wrapper with stored deflate blocks
    std::vector<uint8_t> z;
    z.push_back(0x78); z.push_back(0x01);
    size_t pos = 0;
    while (pos < raw.size()) {
        size_t chunk = std::min<size_t>(65535, raw.size() - pos);
        z.push_back(pos + chunk >= raw.size() ? 1 : 0);
        z.push_back((uint8_t)(chunk & 0xFF)); z.push_back((uint8_t)(chunk >> 8));
        z.push_back((uint8_t)(~chunk & 0xFF)); z.push_back((uint8_t)((~chunk >> 8) & 0xFF));
        z.insert(z.end(), raw.begin() + pos, raw.begin() + pos + chunk);
        pos += chunk;
    }
    uint32_t s1 = 1, s2 = 0;
    for (size_t i = 0; i < raw.size(); i++) { s1 = (s1 + raw[i]) % 65521; s2 = (s2 + s1) % 65521; }
    putU32(z, (s2 << 16) | s1);
    std::vector<uint8_t> out;
    const uint8_t sig[8] = {137, 80, 78, 71, 13, 10, 26, 10};
    out.insert(out.end(), sig, sig + 8);
    std::vector<uint8_t> ihdr;
    putU32(ihdr, w); putU32(ihdr, h);
    ihdr.push_back(8); ihdr.push_back(6); ihdr.push_back(0); ihdr.push_back(0); ihdr.push_back(0);
    writeChunk(out, "IHDR", ihdr);
    writeChunk(out, "IDAT", z);
    writeChunk(out, "IEND", {});
    FILE* f = fopen(path.c_str(), "wb");
    if (!f) return false;
    fwrite(out.data(), 1, out.size(), f);
    fclose(f);
    return true;
}

bool writePPM(const std::string& path, const uint8_t* rgb, int w, int h) {
    FILE* f = fopen(path.c_str(), "wb");
    if (!f) return false;
    fprintf(f, "P6\n%d %d\n255\n", w, h);
    fwrite(rgb, 1, (size_t)w * h * 3, f);
    fclose(f);
    return true;
}

} // namespace hv
