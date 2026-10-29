// render.cpp - software rasterizer: chunked world rendering, sky, particles,
// post processing (bloom/tonemap), and immediate mode UI.
#include "frac.h"
#include "textures.h"
#include <thread>
#include <atomic>
#include <vector>

Renderer g_renderer;

int g_rasterHeight = 720;
// tonemap lookup table: linear light 0..LUT_MAX -> 8-bit sRGB after ACES + exposure
static const int LUT_N = 2048;
static const float LUT_MAX = 4.0f;
static const float LUT_SCALE = float(LUT_N - 1) / LUT_MAX;
bool g_noFog = false;   // viewmodel: keep the held tool out of atmospheric fog
static Vec3 s_fogCol(0.7f, 0.75f, 0.8f);
uint8_t* g_dbgMatBuf = nullptr;

// ------------------------------------------------------------------ assets
static std::vector<uint32_t> g_texAtlas;   // 42 * TS*TS, 0xAARRGGBB
static int g_TS = 0;
static std::vector<uint32_t> g_skyPix;
static int g_skyW = 0, g_skyH = 0;
static std::vector<uint32_t> g_sprPix;
static int g_sprW = 0, g_sprH = 0;
static std::vector<uint32_t> g_fontPix, g_fontBigPix;
static int g_fontW = 0, g_fontH = 0, g_fontBW = 0, g_fontBH = 0;
bool g_assetsLoaded = false;

static int hexv(char c) {
    if (c >= '0' && c <= '9') return c - '0';
    if (c >= 'a' && c <= 'f') return c - 'a' + 10;
    if (c >= 'A' && c <= 'F') return c - 'A' + 10;
    return 0;
}
static uint32_t rd32(const uint8_t* p) {
    return uint32_t(p[0]) | (uint32_t(p[1]) << 8) | (uint32_t(p[2]) << 16) | (uint32_t(p[3]) << 24);
}

void loadAssetBlob() {
    if (g_assetsLoaded) return;
    g_assetsLoaded = true;
    std::vector<uint8_t> bin(g_assetBlobSize);
    const char* h = g_assetBlobHex;
    for (int i = 0; i < g_assetBlobSize; i++)
        bin[i] = uint8_t(hexv(h[i * 2]) * 16 + hexv(h[i * 2 + 1]));
    const uint8_t* p = bin.data();
    int ntex = int(rd32(p + 8));
    g_TS = int(rd32(p + 12));
    p += 16;
    g_texAtlas.resize(size_t(ntex) * g_TS * g_TS);
    for (int i = 0; i < ntex * g_TS * g_TS; i++) {
        g_texAtlas[i] = 0xFF000000u | (uint32_t(p[0]) << 16) | (uint32_t(p[1]) << 8) | p[2];
        p += 3;
    }
    g_skyW = int(rd32(p)); g_skyH = int(rd32(p + 4)); p += 8;
    g_skyPix.resize(size_t(g_skyW) * g_skyH);
    for (int i = 0; i < g_skyW * g_skyH; i++) {
        g_skyPix[i] = 0xFF000000u | (uint32_t(p[0]) << 16) | (uint32_t(p[1]) << 8) | p[2];
        p += 3;
    }
    struct { std::vector<uint32_t>* dst; int* w; int* h; } imgs[3] = {
        {&g_sprPix, &g_sprW, &g_sprH}, {&g_fontPix, &g_fontW, &g_fontH},
        {&g_fontBigPix, &g_fontBW, &g_fontBH}};
    for (int k = 0; k < 3; k++) {
        int w = int(rd32(p)), hh = int(rd32(p + 4));
        p += 8;
        *imgs[k].w = w;
        *imgs[k].h = hh;
        imgs[k].dst->resize(size_t(w) * hh);
        for (int i = 0; i < w * hh; i++) {
            (*imgs[k].dst)[i] = (uint32_t(p[3]) << 24) | (uint32_t(p[0]) << 16) |
                                (uint32_t(p[1]) << 8) | p[2];
            p += 4;
        }
    }
}

void Tex::buildMips() {
    nMip = 1;
    mipW[0] = w;
    mipH[0] = h;
    mip[0].resize(size_t(w) * h * 4);
    for (int i = 0; i < w * h; i++) {
        uint32_t c = px[i];
        mip[0][i * 4 + 0] = uint8_t(c & 255);
        mip[0][i * 4 + 1] = uint8_t((c >> 8) & 255);
        mip[0][i * 4 + 2] = uint8_t((c >> 16) & 255);
        mip[0][i * 4 + 3] = uint8_t((c >> 24) & 255);
    }
    int cw = w, chh = h;
    while (nMip < 6 && cw > 2 && chh > 2) {
        int nw = cw / 2, nh = chh / 2;
        std::vector<uint8_t> lm(size_t(nw) * nh * 4);
        const std::vector<uint8_t>& sm = mip[nMip - 1];
        for (int y = 0; y < nh; y++)
            for (int x = 0; x < nw; x++)
                for (int c = 0; c < 4; c++) {
                    int a = sm[((y * 2) * cw + x * 2) * 4 + c];
                    int b = sm[((y * 2) * cw + x * 2 + 1) * 4 + c];
                    int cc = sm[((y * 2 + 1) * cw + x * 2) * 4 + c];
                    int d = sm[((y * 2 + 1) * cw + x * 2 + 1) * 4 + c];
                    lm[(y * nw + x) * 4 + c] = uint8_t((a + b + cc + d) >> 2);
                }
        mipW[nMip] = nw;
        mipH[nMip] = nh;
        mip[nMip] = std::move(lm);
        cw = nw;
        chh = nh;
        nMip++;
    }
}

// ------------------------------------------------------------------ init
void Renderer::init(int w, int h) {
    loadAssetBlob();
    width = w;
    height = h;
    set.width = w;
    set.height = h;
    rt.w = w;
    rt.h = h;
    rt.color.assign(size_t(w) * h * 3, 0.0f);
    rt.depth.assign(size_t(w) * h, 0.0f);
    rt.ldr.assign(size_t(w) * h * 4, 0);

    tiles.resize(NTEX);
    for (int i = 0; i < NTEX; i++) {
        tiles[i].w = g_TS;
        tiles[i].h = g_TS;
        tiles[i].px.assign(g_texAtlas.begin() + size_t(i) * g_TS * g_TS,
                           g_texAtlas.begin() + size_t(i + 1) * g_TS * g_TS);
        tiles[i].buildMips();
    }
    sky.w = g_skyW; sky.h = g_skyH;
    sky.px = g_skyPix;
    sky.buildMips();
    sprites.w = g_sprW; sprites.h = g_sprH;
    sprites.px = g_sprPix;
    sprites.buildMips();
    font.w = g_fontW; font.h = g_fontH;
    font.px = g_fontPix;
    font.buildMips();
    uiWhite.w = 1; uiWhite.h = 1;
    uiWhite.px = {0xFFFFFFFFu};
    uiWhite.buildMips();
}

// ------------------------------------------------------------------ helpers
static inline float toSRGB(float v) {
    v = saturate(v);
    return powf(v, 1.0f / 2.2f);
}
static inline float aces(float x) {
    // Narkowicz ACES approximation
    const float a = 2.51f, b = 0.03f, c = 2.43f, d = 0.59f, e = 0.14f;
    return saturate((x * (a * x + b)) / (x * (c * x + d) + e));
}

struct XVert {
    float sx, sy;
    float invw;
    float u, v;
    float lr, lg, lb;
    float fog;
    float cx, cy, cz, cw;   // clip space (for near-plane clipping)
};
struct CVert {
    Vec4 p;
    float u, v;
    float lr, lg, lb;
};

struct FrameCtx {
    RenderTarget* rt;
    XVert* scratch = nullptr;
    int scratchCap = 0;
    uint8_t* ldr;
    const Tex* curTex;
    int curMat = 0;
    float fogR, fogG, fogB;
    float depthEps;
};

// draw one triangle (already projected) with depth test into band
static inline void rasterTri(FrameCtx& fc, const XVert& a, const XVert& b, const XVert& c,
                             int y0, int y1, int W) {
    float area = (b.sx - a.sx) * (c.sy - a.sy) - (c.sx - a.sx) * (b.sy - a.sy);
    if (fabsf(area) < 1e-7f) return;
    // front faces (CCW in world / normal outward) map to negative area because the
    // screen y axis points down.
    static int noCull = getenv("FRAC_NOCULL") ? 1 : 0;
    if (area > 0 && !noCull) return;
    if (noCull && area != 0) { if (area > 0) area = -area; }
    float invArea = 1.0f / area;
    int minx = int(fmaxf(0.0f, fminf(a.sx, fminf(b.sx, c.sx))));
    int maxx = int(fminf(float(W - 1), fmaxf(a.sx, fmaxf(b.sx, c.sx))));
    int miny = int(fmaxf(float(y0), fminf(a.sy, fminf(b.sy, c.sy))));
    int maxy = int(fminf(float(y1 - 1), fmaxf(a.sy, fmaxf(b.sy, c.sy))));
    if (minx > maxx || miny > maxy) return;

    // edge functions
    float ax = a.sx, ay = a.sy, bx = b.sx, by = b.sy, cx = c.sx, cy = c.sy;
    float e0dx = by - ay, e0dy = ax - bx;   // edge a->b
    float e1dx = cy - by, e1dy = bx - cx;   // edge b->c
    float e2dx = ay - cy, e2dy = cx - ax;   // edge c->a
    float w0row = (bx - ax) * (miny + 0.5f - ay) - (by - ay) * (minx + 0.5f - ax);
    // use standard barycentric via edge functions with negative sign convention
    float w0_base = ((cx - bx) * (miny + 0.5f - by) - (cy - by) * (minx + 0.5f - bx));
    float w1_base = ((ax - cx) * (miny + 0.5f - cy) - (ay - cy) * (minx + 0.5f - cx));
    float w2_base = ((bx - ax) * (miny + 0.5f - ay) - (by - ay) * (minx + 0.5f - ax));
    (void)w0row; (void)e0dx; (void)e0dy; (void)e1dx; (void)e1dy; (void)e2dx; (void)e2dy;

    float dw0dx = -(cy - by), dw0dy = (cx - bx);
    float dw1dx = -(ay - cy), dw1dy = (ax - cx);
    float dw2dx = -(by - ay), dw2dy = (bx - ax);

    const Tex* t = fc.curTex;
    const int tw = t ? t->w : 1;
    const int nMip = t ? t->nMip : 1;
    // analytic screen-space UV gradients for per-pixel mip selection
    float a_u = a.u * a.invw, b_u = b.u * b.invw, c_u = c.u * c.invw;
    float a_v = a.v * a.invw, b_v = b.v * b.invw, c_v = c.v * c.invw;
    float dUdx = invArea * (dw0dx * a_u + dw1dx * b_u + dw2dx * c_u);
    float dWdx = invArea * (dw0dx * a.invw + dw1dx * b.invw + dw2dx * c.invw);
    float dUdy = invArea * (dw0dy * a_u + dw1dy * b_u + dw2dy * c_u);
    float dWdy = invArea * (dw0dy * a.invw + dw1dy * b.invw + dw2dy * c.invw);
    float dVdx = invArea * (dw0dx * a_v + dw1dx * b_v + dw2dx * c_v);
    float dVdy = invArea * (dw0dy * a_v + dw1dy * b_v + dw2dy * c_v);
    // LOD is chosen once per triangle from its screen-space UV gradient; the per-pixel
    // step only nudges it by one level when the local gradient is much larger. This keeps
    // the aliasing control of per-pixel LOD at a fraction of the cost.
    float triG = (fmaxf(fabsf(dUdx) + fabsf(dVdx), fabsf(dUdy) + fabsf(dVdy))) * float(tw);
    int lodTri = 0;
    if (triG > 1.0f) {
        int32_t tb = (int32_t)*(uint32_t*)&triG;
        lodTri = clampi(((tb >> 23) & 0xFF) - 127, 0, nMip - 1);
    }
    int curLod = -1;
    const uint8_t* mp = nullptr;
    int mw = 1, mh = 1;

    float* depth = fc.rt->depth.data();
    float* col = fc.rt->color.data();
    float invAreaN = 1.0f / (w0_base == w0_base ? 1.0f : 1.0f);
    (void)invAreaN;

    for (int y = miny; y <= maxy; y++) {
        float fy = y + 0.5f;
        float w0 = ((cx - bx) * (fy - by) - (cy - by) * (minx + 0.5f - bx));
        float w1 = ((ax - cx) * (fy - cy) - (ay - cy) * (minx + 0.5f - cx));
        float w2 = ((bx - ax) * (fy - ay) - (by - ay) * (minx + 0.5f - ax));
        int rowOff = y * W;
        for (int x = minx; x <= maxx; x++) {
            float b0 = w0 * invArea, b1 = w1 * invArea, b2 = w2 * invArea;
            if (b0 >= 0 && b1 >= 0 && b2 >= 0) {
                float invw = b0 * a.invw + b1 * b.invw + b2 * c.invw;
                int di = rowOff + x;
                if (invw > depth[di] + 1e-9f) {
                    float rw = 1.0f / invw;
                    float u = (b0 * a_u + b1 * b_u + b2 * c_u) * rw;
                    float v = (b0 * a_v + b1 * b_v + b2 * c_v) * rw;
                    // per-pixel LOD: start from the triangle's level, bump one step for
                    // pixels whose local gradient is much steeper
                    int lod = lodTri;
                    if (lodTri + 1 < nMip) {
                        float gx0 = (dUdx - u * dWdx) * rw, gx1 = (dVdx - v * dWdx) * rw;
                        float gy0 = (dUdy - u * dWdy) * rw, gy1 = (dVdy - v * dWdy) * rw;
                        float g = (fmaxf(fabsf(gx0) + fabsf(gx1), fabsf(gy0) + fabsf(gy1))) *
                                  float(tw);
                        int32_t bits = (int32_t)*(uint32_t*)&g;
                        int pl = ((bits >> 23) & 0xFF) - 127;
                        if (pl > lodTri + 1) lod = lodTri + 1;
                        else if (pl > lodTri) lod = lodTri + 1;
                    }
                    if (lod != curLod) {
                        curLod = lod;
                        mp = t->mip[lod].data();
                        mw = t->mipW[lod];
                        mh = t->mipH[lod];
                    }
                    float fu = u * mw - 0.5f, fv = v * mh - 0.5f;
                    int ix = int(floorf(fu)), iy = int(floorf(fv));
                    float tx = fu - ix, ty = fv - iy;
                    int ix0 = ((ix % mw) + mw) % mw, ix1 = (ix0 + 1) % mw;
                    int iy0 = ((iy % mh) + mh) % mh, iy1 = (iy0 + 1) % mh;
                    const uint8_t* p00 = mp + (iy0 * mw + ix0) * 4;
                    const uint8_t* p10 = mp + (iy0 * mw + ix1) * 4;
                    const uint8_t* p01 = mp + (iy1 * mw + ix0) * 4;
                    const uint8_t* p11 = mp + (iy1 * mw + ix1) * 4;
                    float r0 = p00[0] + (p10[0] - p00[0]) * tx, r1 = p01[0] + (p11[0] - p01[0]) * tx;
                    float g0 = p00[1] + (p10[1] - p00[1]) * tx, g1 = p01[1] + (p11[1] - p01[1]) * tx;
                    float b0c = p00[2] + (p10[2] - p00[2]) * tx, b1c = p01[2] + (p11[2] - p01[2]) * tx;
                    float ar = (r0 + (r1 - r0) * ty) * (1.0f / 255.0f);
                    float ag = (g0 + (g1 - g0) * ty) * (1.0f / 255.0f);
                    float ab = (b0c + (b1c - b0c) * ty) * (1.0f / 255.0f);
                    float lr = (b0 * a.lr * a.invw + b1 * b.lr * b.invw + b2 * c.lr * c.invw) * rw;
                    float lg = (b0 * a.lg * a.invw + b1 * b.lg * b.invw + b2 * c.lg * c.invw) * rw;
                    float lb = (b0 * a.lb * a.invw + b1 * b.lb * b.invw + b2 * c.lb * c.invw) * rw;
                    float fg = (b0 * a.fog * a.invw + b1 * b.fog * b.invw + b2 * c.fog * c.invw) * rw;
                    float outR = ar * lr, outG = ag * lg, outB = ab * lb;
                    if (fg > 0.001f) {
                        outR += (fc.fogR - outR) * fg;
                        outG += (fc.fogG - outG) * fg;
                        outB += (fc.fogB - outB) * fg;
                    }
                    depth[di] = invw;
                    if (g_dbgMatBuf) g_dbgMatBuf[di] = uint8_t(fc.curMat);
                    float* cp = col + di * 3;
                    cp[0] = outR;
                    cp[1] = outG;
                    cp[2] = outB;
                }
            }
            w0 += dw0dx; w1 += dw1dx; w2 += dw2dx;
        }
    }
}

// Clip a triangle against the near plane (w > eps) and rasterise the result.
static const float NEAR_W = 0.035f;
static inline void emitTriangle(FrameCtx& fc, XVert a, XVert b, XVert c, int y0, int y1,
                                int W) {
    static int oldCull = getenv("FRAC_OLDCULL") ? 1 : 0;
    if (oldCull && (a.cw <= NEAR_W || b.cw <= NEAR_W || c.cw <= NEAR_W)) return;
    bool ina = a.cw > NEAR_W, inb = b.cw > NEAR_W, inc = c.cw > NEAR_W;
    XVert poly[4];
    int n = 0;
    auto lerpV = [](const XVert& p, const XVert& q, float t) {
        XVert r;
        r.cx = p.cx + (q.cx - p.cx) * t;
        r.cy = p.cy + (q.cy - p.cy) * t;
        r.cz = p.cz + (q.cz - p.cz) * t;
        r.cw = p.cw + (q.cw - p.cw) * t;
        r.u = p.u + (q.u - p.u) * t;
        r.v = p.v + (q.v - p.v) * t;
        r.lr = p.lr + (q.lr - p.lr) * t;
        r.lg = p.lg + (q.lg - p.lg) * t;
        r.lb = p.lb + (q.lb - p.lb) * t;
        r.fog = p.fog + (q.fog - p.fog) * t;
        r.sx = r.sy = 0;
        r.invw = 0;
        return r;
    };
    if (ina && inb && inc) {
        poly[n++] = a;
        poly[n++] = b;
        poly[n++] = c;
    } else if (!ina && !inb && !inc) {
        return;
    } else {
        XVert tri[3] = {a, b, c};
        bool in[3] = {ina, inb, inc};
        for (int i = 0; i < 3; i++) {
            int j = (i + 1) % 3;
            if (in[i]) poly[n++] = tri[i];
            if (in[i] != in[j]) {
                float t = (NEAR_W - tri[i].cw) / (tri[j].cw - tri[i].cw);
                poly[n++] = lerpV(tri[i], tri[j], t);
            }
        }
    }
    for (int k = 0; k < n; k++) {
        if (poly[k].cw <= 1e-6f) return;
        float iw = 1.0f / poly[k].cw;
        poly[k].invw = iw;
        poly[k].sx = (poly[k].cx * iw * 0.5f + 0.5f) * float(W);
        poly[k].sy = (0.5f - poly[k].cy * iw * 0.5f) * float(g_rasterHeight);
    }
    for (int k = 1; k + 1 < n; k++) rasterTri(fc, poly[0], poly[k], poly[k + 1], y0, y1, W);
}

// ------------------------------------------------------------------ frame
void Renderer::begin() {
    // dynamic resolution
    int w = int(set.width * set.renderScale / 100.0f);
    int h = int(set.height * set.renderScale / 100.0f);
    w = (w + 1) & ~1;
    h = (h + 1) & ~1;
    if (w != width || h != height) {
        width = w; height = h;
        rt.w = w; rt.h = h;
        rt.color.assign(size_t(w) * h * 3, 0.0f);
        rt.depth.assign(size_t(w) * h, 0.0f);
        rt.ldr.assign(size_t(set.width) * set.height * 4, 0);
    }
    std::fill(rt.depth.begin(), rt.depth.end(), 0.0f);
    {
        // horizon tone fallback for pixels the sky dome cannot cover
        float r = s_fogCol.x * 0.95f, g = s_fogCol.y * 0.95f, b = s_fogCol.z;
        if (getenv("FRAC_HOLE")) { r = 1.0f; g = 0.0f; b = 1.0f; }
        float* c = rt.color.data();
        int n = rt.w * rt.h;
        for (int i = 0; i < n; i++) {
            c[i * 3 + 0] = r;
            c[i * 3 + 1] = g;
            c[i * 3 + 2] = b;
        }
    }
    float aspect = float(width) / float(height);
    view = Mat4::lookAt(camPos, camDir, Vec3(0, 1, 0));
    proj = Mat4::perspective(set.fov * DEG, aspect, 0.045f, 900.0f);
    viewproj = Mat4::mul(proj, view);
    camRight = normalize(cross(camDir, Vec3(0, 1, 0)));
    g_rasterHeight = height;
    s_fogCol = fogColor;
    camUp = cross(camRight, camDir);
    spriteList.clear();
    lights.clear();
    statsTris = statsVerts = statsChunks = 0;
}

void Renderer::drawSky() {
    // skybox: inverted sphere-ish grid of quads, drawn without depth test.
    // The sky is a smooth gradient + soft clouds, so it is rasterised into a quarter
    // resolution scratch buffer and bilinearly upsampled: visually identical, ~16x cheaper
    // than evaluating the barycentric path for every full-res pixel.
    const int SKY_DIV = 4;
    int sw = (width + SKY_DIV - 1) / SKY_DIV, sh = (height + SKY_DIV - 1) / SKY_DIV;
    static std::vector<float> skyBuf;
    if (int(skyBuf.size()) < sw * sh * 3) skyBuf.assign(size_t(sw) * sh * 3, 0.0f);
    const int seg = 40, rings = 20;
    const float R = 800.0f;
    const float invDiv = 1.0f / float(SKY_DIV);
    FrameCtx fc;
    fc.rt = &rt;
    FrameCtx* fcp = &fc;
    // build a temporary vertex grid, project and rasterize untextured-with-sky-texture triangles
    struct SV { Vec3 dir; };
    static std::vector<XVert> grid;
    grid.assign(size_t(seg + 1) * (rings + 1), XVert{});
    for (int j = 0; j <= rings; j++) {
        float elev = (-0.5f + float(j) / rings) * PI;  // -90..+90
        float ce = cosf(elev), se = sinf(elev);
        // equirect v: 0 at top
        float vv = (1.0f - (elev / PI + 0.5f));
        for (int i = 0; i <= seg; i++) {
            float az = float(i) / seg * 2 * PI;
            Vec3 d(ce * sinf(az), se, ce * cosf(az));
            Vec4 cp = viewproj * Vec4(d * R, 1.0f);
            XVert& xv = grid[size_t(j) * (seg + 1) + i];
            if (cp.w <= 0.02f) {
                // behind the camera: keep the vertex but pull it to the screen edge so the
                // triangle still covers its part of the sky
                xv.invw = 0.02f;
                xv.sx = (cp.x >= 0 ? 1.0f : -1.0f) * sw * 4.0f;
                xv.sy = (cp.y >= 0 ? 1.0f : -1.0f) * sh * 4.0f;
            } else {
                float invw = 1.0f / cp.w;
                xv.sx = (cp.x * invw * 0.5f + 0.5f) * float(sw);
                xv.sy = (0.5f - cp.y * invw * 0.5f) * float(sh);
                xv.invw = invw;
            }
            xv.u = float(i) / seg;
            xv.v = vv;
            xv.lr = xv.lg = xv.lb = 1.0f;
            xv.fog = 0;
        }
    }
    fc.curTex = &sky;
    fc.fogR = fc.fogG = fc.fogB = 0;
    fc.ldr = rt.ldr.data();
    std::vector<uint32_t> ldrCopy;   // unused
    (void)ldrCopy;
    fc.depthEps = 0;
    // draw directly ignoring depth
    const Tex* t = &sky;
    const uint8_t* mp = t->mip[0].data();
    int mw = t->mipW[0], mh = t->mipH[0];
    float* col = skyBuf.data();
    for (int j = 0; j < rings; j++) {
        for (int i = 0; i < seg; i++) {
            XVert a = grid[size_t(j) * (seg + 1) + i];
            XVert b = grid[size_t(j) * (seg + 1) + i + 1];
            XVert c = grid[size_t(j + 1) * (seg + 1) + i + 1];
            XVert d = grid[size_t(j + 1) * (seg + 1) + i];
            XVert quad[4] = {a, b, c, d};
            XVert* tri[2][3] = {{&quad[0], &quad[1], &quad[2]}, {&quad[0], &quad[2], &quad[3]}};
            for (int k = 0; k < 2; k++) {
                XVert& A = *tri[k][0];
                XVert& B = *tri[k][1];
                XVert& C = *tri[k][2];
                if (A.invw <= 0 || B.invw <= 0 || C.invw <= 0) continue;
                float area = (B.sx - A.sx) * (C.sy - A.sy) - (C.sx - A.sx) * (B.sy - A.sy);
                if (fabsf(area) < 1e-6f) continue;
                float invArea = 1.0f / area;
                int minx = clampi(int(fminf(A.sx, fminf(B.sx, C.sx))), 0, sw - 1);
                int maxx = clampi(int(fmaxf(A.sx, fmaxf(B.sx, C.sx))), 0, sw - 1);
                int miny = clampi(int(fminf(A.sy, fminf(B.sy, C.sy))), 0, sh - 1);
                int maxy = clampi(int(fmaxf(A.sy, fmaxf(B.sy, C.sy))), 0, sh - 1);
                for (int y = miny; y <= maxy; y++) {
                    float fy = y + 0.5f;
                    for (int x = minx; x <= maxx; x++) {
                        float fx = x + 0.5f;
                        float w0 = ((C.sx - B.sx) * (fy - B.sy) - (C.sy - B.sy) * (fx - B.sx));
                        float w1 = ((A.sx - C.sx) * (fy - C.sy) - (A.sy - C.sy) * (fx - C.sx));
                        float w2 = ((B.sx - A.sx) * (fy - A.sy) - (B.sy - A.sy) * (fx - A.sx));
                        float sum = w0 + w1 + w2;
                        if (fabsf(sum) < 1e-6f) continue;
                        bool in = (sum > 0) ? (w0 >= 0 && w1 >= 0 && w2 >= 0)
                                            : (w0 <= 0 && w1 <= 0 && w2 <= 0);
                        if (!in) continue;
                        float iA = 1.0f / sum;
                        float b0 = w0 * iA, b1 = w1 * iA, b2 = w2 * iA;
                        float iw = b0 * A.invw + b1 * B.invw + b2 * C.invw;
                        float rw = 1.0f / iw;
                        float uu = (b0 * A.u * A.invw + b1 * B.u * B.invw + b2 * C.u * C.invw) * rw;
                        float vv = (b0 * A.v * A.invw + b1 * B.v * B.invw + b2 * C.v * C.invw) * rw;
                        int ix = clampi(int(uu * mw), 0, mw - 1);
                        int iy = clampi(int(vv * mh), 0, mh - 1);
                        const uint8_t* sp = mp + (iy * mw + ix) * 4;
                        float* cp = col + (y * sw + x) * 3;
                        cp[0] = sp[0] * (1.0f / 255.0f);
                        cp[1] = sp[1] * (1.0f / 255.0f);
                        cp[2] = sp[2] * (1.0f / 255.0f);
                    }
                }
            }
        }
    }
    (void)fcp;
    // bilinear upsample of the quarter-res sky into the full-res HDR buffer
    float* dst = rt.color.data();
    for (int y = 0; y < height; y++) {
        float fy = (y + 0.5f) * invDiv - 0.5f;
        int y0 = clampi(int(floorf(fy)), 0, sh - 1);
        int y1 = std::min(y0 + 1, sh - 1);
        float ty = saturate(fy - floorf(fy));
        const float* r0 = &skyBuf[size_t(y0) * sw * 3];
        const float* r1 = &skyBuf[size_t(y1) * sw * 3];
        float* out = dst + size_t(y) * width * 3;
        for (int x = 0; x < width; x++) {
            float fx = (x + 0.5f) * invDiv - 0.5f;
            int x0 = clampi(int(floorf(fx)), 0, sw - 1);
            int x1 = std::min(x0 + 1, sw - 1);
            float tx = saturate(fx - floorf(fx));
            const float* p00 = &r0[x0 * 3];
            const float* p10 = &r0[x1 * 3];
            const float* p01 = &r1[x0 * 3];
            const float* p11 = &r1[x1 * 3];
            for (int c = 0; c < 3; c++) {
                float a = p00[c] + (p10[c] - p00[c]) * tx;
                float b = p01[c] + (p11[c] - p01[c]) * tx;
                out[x * 3 + c] = a + (b - a) * ty;
            }
        }
    }
}

// frustum planes from viewproj
static void extractPlanes(const Mat4& m, Vec4 planes[6]) {
    for (int i = 0; i < 3; i++) {
        int row = i;
        planes[i * 2 + 0] = Vec4(m.m[0 * 4 + 3] + m.m[0 * 4 + row], m.m[1 * 4 + 3] + m.m[1 * 4 + row],
                                 m.m[2 * 4 + 3] + m.m[2 * 4 + row], m.m[3 * 4 + 3] + m.m[3 * 4 + row]);
        planes[i * 2 + 1] = Vec4(m.m[0 * 4 + 3] - m.m[0 * 4 + row], m.m[1 * 4 + 3] - m.m[1 * 4 + row],
                                 m.m[2 * 4 + 3] - m.m[2 * 4 + row], m.m[3 * 4 + 3] - m.m[3 * 4 + row]);
    }
}
static bool aabbVisible(const Vec4 planes[6], const Vec3& mn, const Vec3& mx) {
    for (int i = 0; i < 6; i++) {
        const Vec4& p = planes[i];
        Vec3 pos(p.x > 0 ? mx.x : mn.x, p.y > 0 ? mx.y : mn.y, p.z > 0 ? mx.z : mn.z);
        if (p.x * pos.x + p.y * pos.y + p.z * pos.z + p.w < 0) return false;
    }
    return true;
}

void Renderer::addLight(const Vec3& p, const Vec3& c, float radius, float intensity) {
    if (int(lights.size()) > 24) return;
    DynLight l;
    l.pos = p;
    l.color = c;
    l.radius = radius;
    l.intensity = intensity;
    lights.push_back(l);
}

// transform chunk vertices into scratch with lighting
struct ChunkDraw {
    const ChunkMesh* mesh;
    XVert* xv;
    int nv;
};

static inline void lightVertexEx(const Renderer& R, const Vec3& wp, const Vec3& n, float ao,
                                float sunV, const Vec3& viewPos, float& lr, float& lg,
                                float& lb) {
    float sunDot = fmaxf(0.0f, dot(n, R.sunDir));
    float skyUp = 0.5f + 0.5f * n.y;
    const float EXPOS = 0.62f;
    // baked light volume gives interior/bounce illumination (1 = open sky, 0 = sealed box)
    static int dbgAmb = getenv("FRAC_NOAMB") ? 0 : 1;
    float amb = 0.0f;
    if (dbgAmb && g_game.world.light) {
        float open = g_game.world.lightAt(wp).y * 0.9f;   // sky light channel * 0.9 factor
        amb = clampf(open * 1.55f + 0.12f, 0.12f, 1.0f);
    } else {
        amb = 1.0f;
    }
    Vec3 lc = R.sunColor * (sunDot * sunV) + R.skyColor * (skyUp * 0.6f * ao * amb) +
              R.groundColor * (0.5f - 0.5f * n.y) * 0.28f * ao;
    // hemispheric bounce so ceilings and undersides never read as pure black
    lc += Vec3(0.16f, 0.16f, 0.17f) * amb * ao;
    lc = lc * EXPOS;
    for (size_t i = 0; i < R.lights.size(); i++) {
        const DynLight& L = R.lights[i];
        Vec3 d = L.pos - wp;
        float dist2 = dot(d, d);
        if (dist2 > L.radius * L.radius) continue;
        float dist = sqrtf(dist2);
        float att = 1.0f - dist / L.radius;
        att *= att;
        float ndl = fmaxf(0.0f, dot(n, d / fmaxf(0.001f, dist)));
        lc += L.color * (att * L.intensity * (0.35f + 0.65f * ndl));
    }
    Vec3 V = normalize(viewPos - wp);
    Vec3 H = normalize(R.sunDir + V);
    float spec = powf(fmaxf(0.0f, dot(n, H)), 40.0f) * sunV * 0.5f;
    lc += R.sunColor * spec;
    lr = lc.x;
    lg = lc.y;
    lb = lc.z;
}

static inline void lightVertex(const Renderer& R, const RVert& v, const Vec3& viewPos,
                               float& lr, float& lg, float& lb) {
    lightVertexEx(R, Vec3(v.x, v.y, v.z), Vec3(float(v.nx), float(v.ny), float(v.nz)), v.ao,
                  v.sun, viewPos, lr, lg, lb);
}

// approximate sun visibility for dynamic geometry using the world height map
static inline float dynSunVis(const Vec3& p) {
    World& w = g_game.world;
    if (!w.sunmap) return 1.0f;
    int x = clampi(int(p.x / VOXSZ), 0, w.dims[0] - 1);
    int z = clampi(int(p.z / VOXSZ), 0, w.dims[2] - 1);
    float top = w.sunmap[z * w.dims[0] + x];
    return clampf(1.0f - (top - p.y) / 0.55f, 0.0f, 1.0f);
}

void Renderer::drawWorld(World& w) {
    Vec4 planes[6];
    extractPlanes(viewproj, planes);
    std::vector<const ChunkMesh*> visible;
    visible.reserve(2048);
    float maxDist = float(set.viewDist);
    Vec3 camFlat(camPos.x, 0, camPos.z);
    for (Chunk* c : w.chunks) {
        if (!c) continue;
        if (!c->mesh.built || c->mesh.verts.empty()) continue;
        const AABB& bb = c->mesh.bb;
        Vec3 center((bb.mn.x + bb.mx.x) * 0.5f, (bb.mn.y + bb.mx.y) * 0.5f,
                    (bb.mn.z + bb.mx.z) * 0.5f);
        float d = length(Vec3(center.x - camPos.x, center.y - camPos.y, center.z - camPos.z));
        if (d > maxDist + 12.0f) continue;
        if (!aabbVisible(planes, bb.mn, bb.mx)) continue;
        visible.push_back(&c->mesh);
        if (!c->tmesh.verts.empty()) visible.push_back(&c->tmesh);
    }
    // sort front-to-back: with a z-buffer this lets occluded pixels skip texture fetch and
    // shading entirely, which is the single biggest win in a dense voxel city
    std::sort(visible.begin(), visible.end(), [&](const ChunkMesh* a, const ChunkMesh* b) {
        Vec3 ca((a->bb.mn.x + a->bb.mx.x) * 0.5f, (a->bb.mn.y + a->bb.mx.y) * 0.5f,
                (a->bb.mn.z + a->bb.mx.z) * 0.5f);
        Vec3 cb((b->bb.mn.x + b->bb.mx.x) * 0.5f, (b->bb.mn.y + b->bb.mx.y) * 0.5f,
                (b->bb.mn.z + b->bb.mx.z) * 0.5f);
        return length(ca - camPos) < length(cb - camPos);
    });
    statsChunks = int(visible.size());
    if (getenv("FRAC_DEBUGCULL")) {
        int total = 0, built = 0, distOk = 0, vis = 0;
        for (Chunk* c : w.chunks) {
            if (!c) continue;
            total++;
            if (!c->mesh.built || c->mesh.verts.empty()) continue;
            built++;
            const AABB& bb = c->mesh.bb;
            Vec3 center((bb.mn.x + bb.mx.x) * 0.5f, (bb.mn.y + bb.mx.y) * 0.5f,
                        (bb.mn.z + bb.mx.z) * 0.5f);
            float d = length(center - camPos);
            if (d > float(set.viewDist) + 12.0f) continue;
            distOk++;
            if (aabbVisible(planes, bb.mn, bb.mx)) vis++;
        }
        logf("[cull] total=%d built=%d distOk=%d visible=%d cam=%.1f,%.1f,%.1f dir=%.2f,%.2f,%.2f",
             total, built, distOk, vis, camPos.x, camPos.y, camPos.z, camDir.x, camDir.y,
             camDir.z);
        for (int i = 0; i < 6; i++)
            logf("   plane %d: %.3f %.3f %.3f %.3f", i, planes[i].x, planes[i].y, planes[i].z,
                 planes[i].w);
        int shown = 0;
        for (Chunk* c : w.chunks) {
            if (!c || c->mesh.verts.empty()) continue;
            logf("   chunk %d,%d,%d bb (%.1f %.1f %.1f)-(%.1f %.1f %.1f) nv=%d", c->cx, c->cy,
                 c->cz, c->mesh.bb.mn.x, c->mesh.bb.mn.y, c->mesh.bb.mn.z, c->mesh.bb.mx.x,
                 c->mesh.bb.mx.y, c->mesh.bb.mx.z, int(c->mesh.verts.size()));
            if (++shown > 2) break;
        }
    }

    // count vertices
    int totalV = 0, totalI = 0;
    for (auto* m : visible) {
        totalV += int(m->verts.size());
        totalI += int(m->idx.size());
    }
    std::vector<XVert> xbuf(totalV);
    struct Range { int vstart, vcount, istart, icount; uint8_t mat; const ChunkMesh* mesh; };
    std::vector<Range> ranges;
    ranges.reserve(visible.size() * 3);
    int vo = 0;
    for (auto* m : visible) {
        int io = 0;   // index offset inside THIS mesh
        int vstart = vo;
        for (size_t i = 0; i < m->verts.size(); i++, vo++) {
            const RVert& v = m->verts[i];
            XVert& xv = xbuf[vo];
            Vec4 cp = viewproj * Vec4(v.x, v.y, v.z, 1.0f);
            xv.cx = cp.x; xv.cy = cp.y; xv.cz = cp.z; xv.cw = cp.w;
            xv.sx = xv.sy = -1e6f;
            xv.invw = 0;
            float texScale = fmaxf(0.5f, kMats[v.mat].texScale);
            xv.u = v.u / texScale;
            xv.v = v.v / texScale;
            Vec3 wp(v.x, v.y, v.z);
            float dist = length(wp - camPos);
            float f = dist * fogDensity * 0.55f;
            float hf = expf(-fmaxf(0.0f, wp.y - 8.0f) * 0.012f);   // thinner fog at altitude
            xv.fog = saturate(1.0f - expf(-f * f)) * hf;
            lightVertex(*this, v, camPos, xv.lr, xv.lg, xv.lb);
        }
        for (size_t b = 0; b < m->batches.size(); b++) {
            Range r;
            r.vstart = vstart;
            r.vcount = int(m->verts.size());
            r.istart = io;
            r.icount = m->batches[b].count;
            r.mat = m->batches[b].mat;
            r.mesh = m;
            io += r.icount;
            ranges.push_back(r);
        }
    }
    statsVerts = totalV;
    statsTris = totalI / 3;

    FrameCtx fc;
    fc.rt = &rt;
    fc.ldr = rt.ldr.data();
    fc.fogR = s_fogCol.x;
    fc.fogG = s_fogCol.y;
    fc.fogB = s_fogCol.z;
    fc.depthEps = 0;
    fc.scratch = xbuf.data();

    // multithreaded banded rasterization: each band renders all ranges clipped to its rows
    int hw = std::thread::hardware_concurrency();
    int bands = clampi(hw > 1 ? hw : 1, 1, 8);
    if (bands > height / 16) bands = std::max(1, height / 16);
    auto renderBand = [&](int b) {
        int y0 = b * height / bands;
        int y1 = (b + 1) * height / bands;
        FrameCtx lfc = fc;
        for (size_t i = 0; i < ranges.size(); i++) {
            const Range& r = ranges[i];
            lfc.curTex = &tiles[kMats[r.mat].texid % NTEX];
            lfc.curMat = r.mat;
            const uint32_t* idx = r.mesh->idx.data() + r.istart;
            for (int t = 0; t < r.icount; t += 3) {
                XVert& A = xbuf[r.vstart + idx[t]];
                XVert& B = xbuf[r.vstart + idx[t + 1]];
                XVert& C = xbuf[r.vstart + idx[t + 2]];
                if (A.cw <= NEAR_W && B.cw <= NEAR_W && C.cw <= NEAR_W) continue;
                emitTriangle(lfc, A, B, C, y0, y1, width);
            }
        }
    };
    if (bands <= 1) {
        renderBand(0);
    } else {
        std::vector<std::thread> th;
        for (int b = 0; b < bands; b++) th.emplace_back(renderBand, b);
        for (auto& t : th) t.join();
    }
}

// ------------------------------------------------------------------ sprites
void Renderer::flushSprites() {
    if (spriteList.empty()) return;
    // painter's sort, far to near
    std::sort(spriteList.begin(), spriteList.end(), [](const Sprite& a, const Sprite& b) {
        return length(a.pos) > length(b.pos);
    });
    float* col = rt.color.data();
    float* depth = rt.depth.data();
    const int aw = g_sprW / 4, ah = g_sprH / 4;
    const uint8_t* atlas = sprites.mip[0].data();
    int aw4 = g_sprW;
    for (const Sprite& s : spriteList) {
        Vec4 cp = viewproj * Vec4(s.pos, 1.0f);
        if (cp.w <= 0.05f) continue;
        float invw = 1.0f / cp.w;
        float sx = (cp.x * invw * 0.5f + 0.5f) * width;
        float sy = (0.5f - cp.y * invw * 0.5f) * height;
        float sizePx = s.size * invw * height * 0.9f;
        if (sizePx < 0.7f) continue;
        if (sizePx > 4000) sizePx = 4000;
        int x0 = int(sx - sizePx), x1 = int(sx + sizePx);
        int y0 = int(sy - sizePx), y1 = int(sy + sizePx);
        if (x1 < 0 || y1 < 0 || x0 >= width || y0 >= height) continue;
        x0 = clampi(x0, 0, width - 1); x1 = clampi(x1, 0, width - 1);
        y0 = clampi(y0, 0, height - 1); y1 = clampi(y1, 0, height - 1);
        int cell = s.tex & 15;
        int cx0 = (cell % 4) * aw, cy0 = (cell / 4) * ah;
        float r = ((s.color >> 16) & 255) / 255.0f;
        float g = ((s.color >> 8) & 255) / 255.0f;
        float b = (s.color & 255) / 255.0f;
        float alphaScale = s.alpha;
        bool add = s.additive != 0;
        float invSize = 1.0f / fmaxf(1.0f, sizePx);
        for (int y = y0; y <= y1; y++) {
            float vv = (y - sy) * invSize * 0.5f + 0.5f;
            for (int x = x0; x <= x1; x++) {
                float uu = (x - sx) * invSize * 0.5f + 0.5f;
                int tx = cx0 + int(uu * aw), ty = cy0 + int(vv * ah);
                tx = clampi(tx, cx0, cx0 + aw - 1);
                ty = clampi(ty, cy0, cy0 + ah - 1);
                const uint8_t* p = atlas + (ty * aw4 + tx) * 4;
                float a = p[3] * (1.0f / 255.0f) * alphaScale;
                if (a < 0.004f) continue;
                int di = y * width + x;
                if (invw < depth[di] - 1e-7f) continue;
                float* c = col + di * 3;
                float pr = p[0] * (1.0f / 255.0f) * r;
                float pg = p[1] * (1.0f / 255.0f) * g;
                float pb = p[2] * (1.0f / 255.0f) * b;
                if (add) {
                    c[0] += pr * a;
                    c[1] += pg * a;
                    c[2] += pb * a;
                } else {
                    c[0] = c[0] * (1 - a) + pr * a;
                    c[1] = c[1] * (1 - a) + pg * a;
                    c[2] = c[2] * (1 - a) + pb * a;
                }
            }
        }
    }
    spriteList.clear();
}

// ------------------------------------------------------------------ post
static float* s_bloomA = nullptr;
static float* s_bloomB = nullptr;
static int s_bw = 0, s_bh = 0;

void Renderer::finish() {
    auto tStart = std::chrono::high_resolution_clock::now();
    int W = width, H = height;
    // bloom
    if (set.bloom) {
        int bw = W / 4, bh = H / 4;
        if (bw != s_bw || bh != s_bh) {
            s_bw = bw; s_bh = bh;
            free(s_bloomA);
            free(s_bloomB);
            s_bloomA = (float*)malloc(size_t(bw) * bh * 3 * sizeof(float));
            s_bloomB = (float*)malloc(size_t(bw) * bh * 3 * sizeof(float));
        }
        if (s_bloomA) {
            for (int y = 0; y < bh; y++)
                for (int x = 0; x < bw; x++) {
                    float ar = 0, ag = 0, ab = 0;
                    for (int dy = 0; dy < 4; dy++)
                        for (int dx = 0; dx < 4; dx++) {
                            int px = clampi(x * 4 + dx, 0, W - 1);
                            int py = clampi(y * 4 + dy, 0, H - 1);
                            const float* c = &rt.color[(py * W + px) * 3];
                            float lum = c[0] * 0.3f + c[1] * 0.55f + c[2] * 0.15f;
                            float k = fmaxf(0.0f, lum - 1.0f) / fmaxf(1.0f, lum);
                            ar += c[0] * k; ag += c[1] * k; ab += c[2] * k;
                        }
                    float* o = &s_bloomA[(y * bw + x) * 3];
                    o[0] = ar * 0.0625f; o[1] = ag * 0.0625f; o[2] = ab * 0.0625f;
                }
            // two blur passes
            for (int pass = 0; pass < 2; pass++) {
                for (int y = 0; y < bh; y++)
                    for (int x = 0; x < bw; x++) {
                        float ar = 0, ag = 0, ab = 0, wsum = 0;
                        for (int d = -3; d <= 3; d++) {
                            int px = clampi(x + d, 0, bw - 1);
                            float wgt = 1.0f / (1.0f + fabsf(float(d)));
                            const float* c = &s_bloomA[(y * bw + px) * 3];
                            ar += c[0] * wgt; ag += c[1] * wgt; ab += c[2] * wgt;
                            wsum += wgt;
                        }
                        float* o = &s_bloomB[(y * bw + x) * 3];
                        o[0] = ar / wsum; o[1] = ag / wsum; o[2] = ab / wsum;
                    }
                for (int y = 0; y < bh; y++)
                    for (int x = 0; x < bw; x++) {
                        float ar = 0, ag = 0, ab = 0, wsum = 0;
                        for (int d = -3; d <= 3; d++) {
                            int py = clampi(y + d, 0, bh - 1);
                            float wgt = 1.0f / (1.0f + fabsf(float(d)));
                            const float* c = &s_bloomB[(py * bw + x) * 3];
                            ar += c[0] * wgt; ag += c[1] * wgt; ab += c[2] * wgt;
                            wsum += wgt;
                        }
                        float* o = &s_bloomA[(y * bw + x) * 3];
                        o[0] = ar / wsum; o[1] = ag / wsum; o[2] = ab / wsum;
                    }
            }
        }
    }
    // tonemap + upscale to output.
    // ACES + sRGB used to be evaluated per channel per pixel (2.7M powf at 720p); a shared
    // 1-D lookup table removes that cost and the pass is split across worker threads.
    int OW = set.width, OH = set.height;
    if (OW != rt.w || OH != rt.h) rt.ldr.assign(size_t(OW) * OH * 4, 0);
    float invW = float(W) / OW, invH = float(H) / OH;
    float vign = 0.32f;
    static uint8_t lut[LUT_N];
    static float lutExposure = -1.0f;
    static int lutBloom = -1;
    if (lutExposure != exposure || lutBloom != set.bloom) {
        lutExposure = exposure;
        lutBloom = set.bloom;
        for (int i = 0; i < LUT_N; i++) {
            float v = (float(i) / float(LUT_N - 1)) * LUT_MAX;
            float t = aces(v);
            lut[i] = uint8_t(saturate(toSRGB(t)) * 255.0f + 0.5f);
        }
    }
    auto toneRow = [&](int y) {
        int sy = clampi(int(y * invH), 0, H - 1);
        float dy = (y / float(OH) - 0.5f) * 2.0f;
        float vigY = vign * dy * dy * 0.6f;
        for (int x = 0; x < OW; x++) {
            int sx = clampi(int(x * invW), 0, W - 1);
            const float* c = &rt.color[(sy * W + sx) * 3];
            float r = c[0] * exposure, g = c[1] * exposure, b = c[2] * exposure;
            if (set.bloom && s_bloomA) {
                int bx = clampi(sx / 4, 0, s_bw - 1);
                int by = clampi(sy / 4, 0, s_bh - 1);
                const float* bl = &s_bloomA[(by * s_bw + bx) * 3];
                r += bl[0] * 0.55f; g += bl[1] * 0.55f; b += bl[2] * 0.55f;
            }
            float dx = (x / float(OW) - 0.5f) * 2.0f;
            float vig = 1.0f - vign * dx * dx * 0.6f - vigY;
            if (vig < 0.0f) vig = 0.0f;
            r *= vig; g *= vig; b *= vig;
            uint8_t* p = &rt.ldr[(y * OW + x) * 4];
            p[0] = lut[clampi(int(r * LUT_SCALE), 0, LUT_N - 1)];
            p[1] = lut[clampi(int(g * LUT_SCALE), 0, LUT_N - 1)];
            p[2] = lut[clampi(int(b * LUT_SCALE), 0, LUT_N - 1)];
            p[3] = 255;
        }
    };
    {
        int bands = clampi(int(std::thread::hardware_concurrency()), 1, 8);
        if (bands > OH / 32 && OH >= 32) bands = std::max(1, OH / 32);
        if (bands <= 1) {
            for (int y = 0; y < OH; y++) toneRow(y);
        } else {
            std::vector<std::thread> th;
            for (int b = 0; b < bands; b++) {
                int y0 = b * OH / bands, y1 = (b + 1) * OH / bands;
                th.emplace_back([&, y0, y1]() {
                    for (int y = y0; y < y1; y++) toneRow(y);
                });
            }
            for (auto& t : th) t.join();
        }
    }
    if (getenv("FRAC_PROF")) {
        auto tEnd = std::chrono::high_resolution_clock::now();
        logf("[prof] finish %.1fms  tris=%d verts=%d chunks=%d",
             std::chrono::duration<double, std::milli>(tEnd - tStart).count(), statsTris,
             statsVerts, statsChunks);
    }
}

uint32_t* Renderer::framebuffer() { return (uint32_t*)rt.ldr.data(); }

// ------------------------------------------------------------------- UI 2D
static inline void blendPix(uint8_t* p, uint32_t col, float a) {
    if (a <= 0.002f) return;
    float r = ((col >> 16) & 255) * a, g = ((col >> 8) & 255) * a, b = (col & 255) * a;
    p[0] = uint8_t(p[0] * (1 - a) + r + 0.5f);
    p[1] = uint8_t(p[1] * (1 - a) + g + 0.5f);
    p[2] = uint8_t(p[2] * (1 - a) + b + 0.5f);
}

void Renderer::uiRect(float x, float y, float w, float h, uint32_t col) {
    int OW = set.width, OH = set.height;
    float a = ((col >> 24) & 255) / 255.0f;
    int x0 = int(x), y0 = int(y), x1 = int(x + w), y1 = int(y + h);
    x0 = clampi(x0, 0, OW); x1 = clampi(x1, 0, OW);
    y0 = clampi(y0, 0, OH); y1 = clampi(y1, 0, OH);
    for (int yy = y0; yy < y1; yy++)
        for (int xx = x0; xx < x1; xx++)
            blendPix(&rt.ldr[(yy * OW + xx) * 4], col, a);
}
void Renderer::uiRectGrad(float x, float y, float w, float h, uint32_t c0, uint32_t c1) {
    int OW = set.width, OH = set.height;
    float a0 = ((c0 >> 24) & 255) / 255.0f, a1 = ((c1 >> 24) & 255) / 255.0f;
    int x0 = clampi(int(x), 0, OW), x1 = clampi(int(x + w), 0, OW);
    int y0 = clampi(int(y), 0, OH), y1 = clampi(int(y + h), 0, OH);
    for (int yy = y0; yy < y1; yy++) {
        float t = (yy - y) / fmaxf(1.0f, h);
        uint32_t col = packColor(lerpf(((c0 >> 16) & 255) / 255.0f, ((c1 >> 16) & 255) / 255.0f, t),
                                 lerpf(((c0 >> 8) & 255) / 255.0f, ((c1 >> 8) & 255) / 255.0f, t),
                                 lerpf((c0 & 255) / 255.0f, (c1 & 255) / 255.0f, t),
                                 lerpf(a0, a1, t));
        float a = ((col >> 24) & 255) / 255.0f;
        for (int xx = x0; xx < x1; xx++)
            blendPix(&rt.ldr[(yy * OW + xx) * 4], col, a);
    }
}
void Renderer::uiImage(float x, float y, float w, float h, const Tex& t, uint32_t tint) {
    int OW = set.width, OH = set.height;
    if (t.w <= 0) return;
    float ta = ((tint >> 24) & 255) / 255.0f;
    int x0 = clampi(int(x), 0, OW), x1 = clampi(int(x + w), 0, OW);
    int y0 = clampi(int(y), 0, OH), y1 = clampi(int(y + h), 0, OH);
    for (int yy = y0; yy < y1; yy++) {
        float v = (yy - y) / fmaxf(1.0f, h);
        int ty = clampi(int(v * t.h), 0, t.h - 1);
        for (int xx = x0; xx < x1; xx++) {
            float u = (xx - x) / fmaxf(1.0f, w);
            int tx = clampi(int(u * t.w), 0, t.w - 1);
            uint32_t c = t.px[ty * t.w + tx];
            float a = ((c >> 24) & 255) / 255.0f * ta;
            float r = ((c >> 16) & 255) * (((tint >> 16) & 255) / 255.0f);
            float g = ((c >> 8) & 255) * (((tint >> 8) & 255) / 255.0f);
            float b = (c & 255) * ((tint & 255) / 255.0f);
            uint8_t* p = &rt.ldr[(yy * OW + xx) * 4];
            p[0] = uint8_t(p[0] * (1 - a) + r * a);
            p[1] = uint8_t(p[1] * (1 - a) + g * a);
            p[2] = uint8_t(p[2] * (1 - a) + b * a);
        }
    }
}
void Renderer::uiLine(float x0, float y0, float x1, float y1, uint32_t col, float thick) {
    float dx = x1 - x0, dy = y1 - y0;
    int steps = int(fmaxf(fabsf(dx), fabsf(dy)));
    if (steps <= 0) steps = 1;
    for (int i = 0; i <= steps; i++) {
        float t = float(i) / steps;
        uiRect(x0 + dx * t - thick * 0.5f, y0 + dy * t - thick * 0.5f, thick, thick, col);
    }
}

// glyph drawing: monospace atlas 16 cols x 6 rows
static void drawGlyphs(Renderer& R, float x, float y, const char* s, uint32_t col, float scale,
                       const std::vector<uint32_t>& pix, int aw, int ah, int cellW, int cellH) {
    int OW = R.set.width, OH = R.set.height;
    float a0 = ((col >> 24) & 255) / 255.0f;
    float cr = ((col >> 16) & 255) / 255.0f;
    float cg = ((col >> 8) & 255) / 255.0f;
    float cb = (col & 255) / 255.0f;
    float px = x;
    for (const char* p = s; *p; p++) {
        unsigned char ch = (unsigned char)*p;
        if (ch < 32) { px += 6 * scale; continue; }
        int gi = ch - 32;
        int cx = (gi % 16) * cellW, cy = (gi / 16) * cellH;
        int gw = int(cellW * scale), gh = int(cellH * scale);
        for (int gy = 0; gy < gh; gy++) {
            int sy = cy + int(gy / scale);
            if (sy >= ah) continue;
            int oy = int(y) + gy;
            if (oy < 0 || oy >= OH) continue;
            for (int gx = 0; gx < gw; gx++) {
                int sx = cx + int(gx / scale);
                if (sx >= aw) continue;
                int ox = int(px) + gx;
                if (ox < 0 || ox >= OW) continue;
                uint32_t c = pix[sy * aw + sx];
                float a = ((c >> 24) & 255) / 255.0f * a0;
                if (a < 0.01f) continue;
                blendPix(&R.rt.ldr[(oy * OW + ox) * 4], packColor(cr, cg, cb), a);
            }
        }
        px += cellW * scale * 0.62f;
    }
}

void Renderer::uiText(float x, float y, const char* s, uint32_t col, float scale) {
    drawGlyphs(*this, x, y, s, col, scale, g_fontPix, g_fontW, g_fontH, 13, 26);
}
void Renderer::uiTextShadow(float x, float y, const char* s, uint32_t col, float scale) {
    drawGlyphs(*this, x + 1.5f, y + 1.5f, s, 0x90000000, scale, g_fontPix, g_fontW, g_fontH, 13, 26);
    drawGlyphs(*this, x, y, s, col, scale, g_fontPix, g_fontW, g_fontH, 13, 26);
}
float Renderer::uiTextWidth(const char* s, float scale) {
    return strlen(s) * 13 * 0.62f * scale;
}
void Renderer::uiBigText(float x, float y, const char* s, uint32_t col, float scale) {
    drawGlyphs(*this, x, y, s, col, scale, g_fontBigPix, g_fontBW, g_fontBH, 24, 44);
}
float Renderer::uiBigTextWidth(const char* s, float scale) {
    return strlen(s) * 24 * 0.62f * scale;
}

void Renderer::drawCrosshair(int style, float spread) {
    int OW = set.width, OH = set.height;
    float cx = OW * 0.5f, cy = OH * 0.5f;
    uint32_t c = 0xE0FFFFFF;
    float gap = 4.0f + spread * 26.0f;
    if (style == 0) {
        uiRect(cx - 1, cy - gap - 7, 2, 7, c);
        uiRect(cx - 1, cy + gap, 2, 7, c);
        uiRect(cx - gap - 7, cy - 1, 7, 2, c);
        uiRect(cx + gap, cy - 1, 7, 2, c);
        uiRect(cx - 1, cy - 1, 2, 2, 0x60FFFFFF);
    } else if (style == 1) {
        // dot crosshair
        uiRect(cx - 1.5f, cy - 1.5f, 3, 3, c);
        uiRect(cx - 6, cy - 0.5f, 3, 1, 0x90FFFFFF);
        uiRect(cx + 3, cy - 0.5f, 3, 1, 0x90FFFFFF);
    }
}

// ------------------------------------------------------- dynamic mesh drawing
namespace {
struct DynRange { int first, count; uint8_t mat; };
}

static void rasterizeDynamic(Renderer& R, std::vector<XVert>& xb,
                             const std::vector<DynRange>& ranges,
                             const std::vector<uint32_t>& idx) {
    FrameCtx fc;
    fc.rt = &R.rt;
    fc.ldr = R.rt.ldr.data();
    fc.fogR = s_fogCol.x; fc.fogG = s_fogCol.y; fc.fogB = s_fogCol.z;
    fc.depthEps = 0;
    fc.scratch = xb.data();
    int hw = std::thread::hardware_concurrency();
    int bands = clampi(hw > 1 ? hw : 1, 1, 8);
    if (bands > R.height / 16) bands = std::max(1, R.height / 16);
    auto renderBand = [&](int b) {
        int y0 = b * R.height / bands, y1 = (b + 1) * R.height / bands;
        FrameCtx lfc = fc;
        for (const DynRange& r : ranges) {
            lfc.curTex = &R.tiles[kMats[r.mat].texid % NTEX];
            for (int t = r.first; t < r.first + r.count; t += 3) {
                const XVert& A = xb[idx[t]];
                const XVert& B = xb[idx[t + 1]];
                const XVert& C = xb[idx[t + 2]];
                if (A.cw <= NEAR_W && B.cw <= NEAR_W && C.cw <= NEAR_W) continue;
                emitTriangle(lfc, A, B, C, y0, y1, R.width);
            }
        }
    };
    if (bands <= 1) renderBand(0);
    else {
        std::vector<std::thread> th;
        for (int b = 0; b < bands; b++) th.emplace_back(renderBand, b);
        for (auto& t : th) t.join();
    }
}

void Renderer::drawShape(const ShapeBatch& sb, float depthBias) {
    if (sb.v.empty()) return;
    (void)depthBias;
    std::vector<XVert> xb(sb.v.size());
    for (size_t i = 0; i < sb.v.size(); i++) {
        const RVert& v = sb.v[i];
        XVert& xv = xb[i];
        Vec4 cp = viewproj * Vec4(v.x, v.y, v.z, 1.0f);
        // clip-space w must be stored: emitTriangle uses it for near-plane clipping
        xv.cx = cp.x; xv.cy = cp.y; xv.cz = cp.z; xv.cw = cp.w;
        xv.sx = xv.sy = -1e6f;
        xv.invw = 0;
        float texScale = fmaxf(0.5f, kMats[(uint8_t)v.mat].texScale);
        xv.u = v.u / texScale;
        xv.v = v.v / texScale;
        Vec3 wp(v.x, v.y, v.z);
        float dist = length(wp - camPos);
        float f = dist * fogDensity;
        xv.fog = g_noFog ? 0.0f : saturate(1.0f - expf(-f * f * 1.6f));
        lightVertexEx(*this, wp, Vec3(float(v.nx), float(v.ny), float(v.nz)), v.ao > 0 ? v.ao : 1.0f,
                      dynSunVis(wp), camPos, xv.lr, xv.lg, xv.lb);
    }
    // build material ranges (consecutive runs)
    std::vector<DynRange> ranges;
    uint8_t cur = 255;
    for (size_t i = 0; i < sb.i.size(); i += 3) {
        uint8_t m = uint8_t(sb.v[sb.i[i]].mat);
        if (m != cur) {
            DynRange r;
            r.first = int(i);
            r.count = 0;
            r.mat = m;
            ranges.push_back(r);
            cur = m;
        }
        ranges.back().count += 3;
    }
    rasterizeDynamic(*this, xb, ranges, sb.i);
}

void Renderer::drawLocalMesh(const std::vector<RVert>& v, const std::vector<uint32_t>& idx,
                             const std::vector<ChunkMesh::Batch>& batches, const Vec3& pos,
                             const Basis& rot) {
    if (v.empty()) return;
    std::vector<XVert> xb(v.size());
    for (size_t i = 0; i < v.size(); i++) {
        const RVert& rv = v[i];
        Vec3 wp = rot.mul(Vec3(rv.x, rv.y, rv.z)) + pos;
        Vec3 n = rot.mul(Vec3(float(rv.nx), float(rv.ny), float(rv.nz)));
        XVert& xv = xb[i];
        Vec4 cp = viewproj * Vec4(wp, 1.0f);
        xv.invw = cp.w > 0.0001f ? 1.0f / cp.w : -1.0f;
        if (xv.invw > 0) {
            xv.sx = (cp.x * xv.invw * 0.5f + 0.5f) * width;
            xv.sy = (0.5f - cp.y * xv.invw * 0.5f) * height;
        } else {
            xv.sx = xv.sy = -1e6f;
        }
        float texScale = fmaxf(0.5f, kMats[(uint8_t)rv.mat].texScale);
        xv.u = rv.u / texScale;
        xv.v = rv.v / texScale;
        float dist = length(wp - camPos);
        float f = dist * fogDensity;
        xv.fog = saturate(1.0f - expf(-f * f * 1.6f));
        lightVertexEx(*this, wp, n, rv.ao, dynSunVis(wp) * 0.85f, camPos, xv.lr, xv.lg, xv.lb);
    }
    std::vector<DynRange> ranges;
    for (const auto& b : batches) {
        DynRange r;
        r.first = b.first;
        r.count = b.count;
        r.mat = b.mat;
        ranges.push_back(r);
    }
    rasterizeDynamic(*this, xb, ranges, idx);
}
