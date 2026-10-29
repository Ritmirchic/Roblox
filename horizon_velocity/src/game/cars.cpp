// HORIZON VELOCITY - procedural vehicle modelling
// Cars are built from a signed-distance-field hull (lofted station slabs,
// wheel-arch booleans, hollow cabin with real window apertures) polygonised by
// surface nets, plus hand-authored mechanical/aero/lighting/interior details.
#include "game/cars.h"
#include "render/sdf.h"
#include <cstring>
#include <map>

namespace hv {

const char* carClassName(CarClass c) {
    static const char* names[] = {"Hot Hatch", "Sports Sedan", "Muscle", "Classic", "Sports Coupe",
                                  "European GT", "Supercar", "Hypercar", "Rally", "SUV",
                                  "Pickup", "Track Car", "Electric", "Vintage Racer"};
    int i = (int)c;
    return (i >= 0 && i < (int)CarClass::Count) ? names[i] : "Car";
}
std::string carClassLabel(CarClass c) { return carClassName(c); }

// ---------------------------------------------------------------- materials
static std::map<std::string, int> g_matCache;

int matNamed(const char* name) {
    auto it = g_matCache.find(name);
    if (it != g_matCache.end()) return it->second;
    Material m;
    m.name = name;
    std::string n(name);
    if (n == "glass") { m.shade = Shade::Glass; m.albedo = Color(0.55f, 0.60f, 0.62f); m.opacity = 0.30f; m.roughness = 0.06f; m.metallic = 0.0f; m.doubleSided = false; }
    else if (n == "glass_tint") { m.shade = Shade::Glass; m.albedo = Color(0.16f, 0.17f, 0.19f); m.opacity = 0.55f; m.roughness = 0.05f; }
    else if (n == "chrome") { m.metallic = 1.0f; m.roughness = 0.07f; m.albedo = Color(0.86f, 0.87f, 0.89f); }
    else if (n == "brushed") { m.metallic = 1.0f; m.roughness = 0.30f; m.albedo = Color(0.72f, 0.73f, 0.75f); }
    else if (n == "blackplastic") { m.metallic = 0.0f; m.roughness = 0.62f; m.albedo = Color(0.035f, 0.035f, 0.038f); }
    else if (n == "rubber") { m.metallic = 0.0f; m.roughness = 0.92f; m.albedo = Color(0.022f, 0.022f, 0.024f); }
    else if (n == "rim") { m.metallic = 1.0f; m.roughness = 0.22f; m.albedo = Color(0.62f, 0.63f, 0.66f); }
    else if (n == "rimdark") { m.metallic = 0.9f; m.roughness = 0.35f; m.albedo = Color(0.14f, 0.145f, 0.16f); }
    else if (n == "caliper") { m.metallic = 0.25f; m.roughness = 0.32f; m.albedo = Color(0.62f, 0.06f, 0.06f); }
    else if (n == "disc") { m.metallic = 1.0f; m.roughness = 0.42f; m.albedo = Color(0.34f, 0.34f, 0.36f); }
    else if (n == "leather") { m.metallic = 0.0f; m.roughness = 0.68f; m.albedo = Color(0.055f, 0.05f, 0.048f); }
    else if (n == "leather_tan") { m.metallic = 0.0f; m.roughness = 0.62f; m.albedo = Color(0.31f, 0.22f, 0.13f); }
    else if (n == "interior") { m.metallic = 0.0f; m.roughness = 0.55f; m.albedo = Color(0.028f, 0.028f, 0.031f); }
    else if (n == "softtouch") { m.metallic = 0.0f; m.roughness = 0.45f; m.albedo = Color(0.06f, 0.062f, 0.068f); }
    else if (n == "screen") { m.shade = Shade::Emissive; m.albedo = Color(0.1f,0.3f,0.4f); m.emissive = Color(0.25f, 0.85f, 1.0f, 1.6f); m.roughness = 0.15f; }
    else if (n == "headlight") { m.shade = Shade::Emissive; m.albedo = Color(0.9f,0.92f,1.0f); m.emissive = Color(1.0f, 0.97f, 0.90f, 2.4f); m.roughness = 0.12f; m.metallic = 0.2f; }
    else  if (n == "headlight_off") { m.shade = Shade::Emissive; m.albedo = Color(0.75f,0.78f,0.82f); m.emissive = Color(0.10f, 0.11f, 0.13f, 1.0f); m.roughness = 0.10f; m.metallic = 0.3f; }
    else if (n == "drl") { m.shade = Shade::Emissive; m.albedo = Color(1,1,1); m.emissive = Color(1.0f, 0.98f, 0.94f, 3.2f); }
    else if (n == "taillight") { m.shade = Shade::Emissive; m.albedo = Color(0.6f,0.05f,0.05f); m.emissive = Color(1.0f, 0.08f, 0.06f, 2.0f); m.roughness = 0.15f; }
    else if (n == "brakelight") { m.shade = Shade::Emissive; m.albedo = Color(0.7f,0.06f,0.06f); m.emissive = Color(1.0f, 0.10f, 0.08f, 3.6f); }
    else if (n == "reverse_light") { m.shade = Shade::Emissive; m.albedo = Color(1,1,1); m.emissive = Color(1.0f, 1.0f, 1.0f, 1.6f); }
    else if (n == "carbon") { m.metallic = 0.45f; m.roughness = 0.28f; m.albedo = Color(0.028f, 0.028f, 0.031f); }
    else if (n == "grille") { m.metallic = 0.55f; m.roughness = 0.45f; m.albedo = Color(0.03f, 0.03f, 0.034f); }
    else if (n == "plate") { m.metallic = 0.0f; m.roughness = 0.55f; m.albedo = Color(0.86f, 0.86f, 0.82f); }
    else if (n == "gold") { m.metallic = 1.0f; m.roughness = 0.22f; m.albedo = Color(0.85f, 0.66f, 0.30f); }
    else if (n == "copper") { m.metallic = 1.0f; m.roughness = 0.30f; m.albedo = Color(0.72f, 0.42f, 0.26f); }
    else if (n == "white") { m.metallic = 0.0f; m.roughness = 0.45f; m.albedo = Color(0.85f,0.85f,0.86f); }
    else { m.metallic = 0.1f; m.roughness = 0.5f; m.albedo = Color(0.5f,0.5f,0.5f); }
    int idx = assets().addMaterial(m);
    g_matCache[name] = idx;
    return idx;
}

int matPaint(const PaintColor& c, const char* name) {
    Material m;
    m.name = name;
    m.shade = Shade::CarPaint;
    m.albedo = Color::fromHex(c.hex);
    m.metallic = c.metallic;
    m.roughness = 0.16f + (1.0f - c.clearcoat) * 0.4f;
    m.clearcoat = c.clearcoat;
    return assets().addMaterial(m);
}

int texNamed(const char* name) {
    int t = assets().tex(name);
    return t;
}

void initVehicleMaterials() {
    // pre-create the shared materials so indices are stable
    const char* names[] = {"glass", "glass_tint", "chrome", "brushed", "blackplastic", "rubber", "rim",
                           "rimdark", "caliper", "disc", "leather", "leather_tan", "interior", "softtouch",
                           "screen", "headlight", "headlight_off", "drl", "taillight", "brakelight",
                           "reverse_light", "carbon", "grille", "plate", "gold", "copper", "white"};
    for (auto n : names) matNamed(n);
}

// ---------------------------------------------------------------- SDF helpers
namespace {

struct RotBox { Vec3 c; Vec3 h; Mat4 rot; float round; };

inline float sdRotBox(const Vec3& p, const RotBox& b) {
    Vec3 lp = b.rot.transposed().transformDir(p - b.c);
    return sdf::roundBox(lp, Vec3(0,0,0), b.h, b.round);
}

// ---- geometry description shared by hull, greenhouse, details and interior ----
struct CarGeom {
    const BodyStyle* st = nullptr;
    float L = 4.5f, halfL = 2.25f, W = 1.85f, H = 1.3f;
    float beltY = 0.9f, roofY = 1.3f;
    float cabinRearX = 0.0f, cabinFrontX = 0.0f;
    float cabinHalfW = 0.78f, roofHalfW = 0.68f;
    float frontAxleX = 1.3f, rearAxleX = -1.3f;
    float trackHalf = 0.8f, wheelR = 0.34f, tireW = 0.24f;
    float frontOverhang = 0.9f, rearOverhang = 0.95f;
    float flare = 0.06f, floorY = 0.11f;

    struct Sec {
        float x = 0, hw = 0.9f, topY = 1.0f, botY = 0.15f;
        float cab = 0.0f;      // 0 = open top surface, 1 = greenhouse
        float roofHW = 0.62f;
        float arch = 0.0f;     // arch opening height (0 = no arch at this station)
    };
    std::vector<Sec> secs;

    float cabinBlend(float x) const {
        float rise = std::max(0.05f, roofY - beltY);
        float fRun = std::max(0.08f, rise * (st ? st->windshieldRake : 1.0f));
        float rRun = std::max(0.08f, rise * (st ? st->rearGlassRake : 1.0f));
        float f = smoothstepf(cabinFrontX - fRun, cabinFrontX - fRun * 0.30f, x) *
                  (1.0f - smoothstepf(cabinRearX + rRun * 0.30f, cabinRearX + rRun, x));
        // only sections that actually reach roof height get a greenhouse shape
        return clampf(f, 0.0f, 1.0f);
    }

    void setup(const BodyStyle& s) {
        st = &s;
        L = s.length; halfL = L * 0.5f;
        W = 0.0f; H = 0.0f;
        for (auto& stn : s.stations) { W = std::max(W, stn.halfWidth * 2.0f); H = std::max(H, stn.topY); }
        beltY = s.beltlineY; roofY = H;
        cabinRearX = lerpf(-halfL, halfL, s.cabinRearT);
        cabinFrontX = lerpf(-halfL, halfL, s.cabinFrontT);
        frontAxleX = s.wheelbase * 0.5f;
        rearAxleX = -s.wheelbase * 0.5f;
        trackHalf = s.trackWidth * 0.5f;
        wheelR = s.wheelRadius; tireW = s.tireWidth;
        frontOverhang = halfL - frontAxleX;
        rearOverhang = halfL + rearAxleX;
        flare = s.fenderFlare;
        floorY = s.rideHeight + 0.03f;
        float wsum = 0; int n = 0;
        for (auto& stn : s.stations) {
            float x = lerpf(-halfL, halfL, stn.t);
            if (x > cabinRearX - 0.25f && x < cabinFrontX + 0.25f) { wsum += stn.halfWidth; n++; }
        }
        float cabinBase = n ? wsum / n : W * 0.45f;
        cabinHalfW = cabinBase * 0.94f;
        roofHalfW = std::min(cabinHalfW * s.roofHalfWidthFactor, cabinHalfW - 0.10f);
        // wheels dictate how wide the arches must be: the tyre must sit under the lip
        float archW = trackHalf + tireW * 0.5f + 0.015f + flare * 0.35f;
        float archR = wheelR + 0.065f;
        const int N = 76;
        secs.clear(); secs.reserve(N);
        int ns = (int)s.stations.size();
        for (int i = 0; i < N; i++) {
            float t = (float)i / (N - 1);
            float x = lerpf(-halfL, halfL, t);
            int k = 0;
            while (k < ns - 2 && t > s.stations[k + 1].t) k++;
            float tt = clampf((t - s.stations[k].t) / std::max(1e-4f, s.stations[k + 1].t - s.stations[k].t), 0.0f, 1.0f);
            const BodyStation& a = s.stations[k];
            const BodyStation& b = s.stations[k + 1];
            Sec sc;
            sc.x = x;
            sc.hw = lerpf(a.halfWidth, b.halfWidth, tt);
            sc.topY = lerpf(a.topY, b.topY, tt);
            sc.botY = lerpf(a.bottomY, b.bottomY, tt);
            sc.cab = cabinBlend(x);
            sc.roofHW = lerpf(sc.hw * 0.92f, roofHalfW, sc.cab);
            // fender flare and the arch opening around each axle
            float axles[2] = {frontAxleX, rearAxleX};
            for (int w = 0; w < 2; w++) {
                float dx = std::fabs(x - axles[w]);
                if (dx < archR + 0.16f) {
                    float infl = 1.0f - smoothstepf(archR - 0.02f, archR + 0.16f, dx);
                    // the arch lip must sit just proud of the tyre, not swallow it
                    float lipW = std::max(archW, std::min(sc.hw, archW + 0.012f));
                    sc.hw = lerpf(sc.hw, lipW, infl);
                    float hy = wheelR + std::sqrt(std::max(0.0f, archR * archR - std::min(dx, archR) * std::min(dx, archR)));
                    sc.arch = std::max(sc.arch, lerpf(sc.botY, hy, infl));
                }
            }
            sc.topY = std::max(sc.topY, sc.botY + 0.10f);
            secs.push_back(sc);
        }
    }

    const Sec& secAt(float x) const {
        float t = clampf((x + halfL) / std::max(0.01f, L), 0.0f, 1.0f);
        int i = (int)(t * (secs.size() - 1) + 0.5f);
        i = std::max(0, std::min((int)secs.size() - 1, i));
        return secs[i];
    }
    float hwAt(float x) const { return secAt(x).hw; }
    float topAt(float x) const { return secAt(x).topY; }
    float botAt(float x) const { return secAt(x).botY; }

    // ---- cross-section profile -------------------------------------------------
    // Eight key points per half (flat floor, sill, widest point, shoulder, roof
    // edge, crown), Chaikin-smoothed and resampled by arc length so every ring has
    // the same vertex count and the loft stays a clean quad grid.
    void halfProfile(const Sec& sc, Vec2 out[8]) const {
        float h = std::max(0.05f, sc.topY - sc.botY);
        float belt = clampf(beltY, sc.botY + 0.30f * h, sc.topY - 0.05f * h);
        float w = sc.hw;
        const Vec2 open[8] = {
            Vec2(0.0f,          sc.botY),
            Vec2(w * 0.60f,     sc.botY),
            Vec2(w * 0.93f,     sc.botY + 0.16f * h),
            Vec2(w,             belt - 0.045f * h),
            Vec2(w * 0.965f,    belt + 0.030f * h),
            Vec2(w * 0.84f,     sc.topY - 0.020f * h),
            Vec2(w * 0.44f,     sc.topY),
            Vec2(0.0f,          sc.topY + 0.004f),
        };
        const Vec2 cab[8] = {
            Vec2(0.0f,          sc.botY),
            Vec2(w * 0.62f,     sc.botY),
            Vec2(w * 0.94f,     sc.botY + 0.16f * h),
            Vec2(w,             belt - 0.040f * h),
            Vec2(w * 0.985f,    belt + 0.012f * h),
            Vec2(sc.roofHW * 1.01f, sc.topY - 0.135f * h),
            Vec2(sc.roofHW * 0.62f, sc.topY - 0.008f * h),
            Vec2(0.0f,          sc.topY),
        };
        for (int i = 0; i < 8; i++) out[i] = open[i] + (cab[i] - open[i]) * sc.cab;
    }

    void ringPts(const Sec& sc, int M, std::vector<Vec2>& out) const {
        Vec2 hp[8];
        halfProfile(sc, hp);
        // closed loop: right side bottom->top, left side top->bottom
        std::vector<Vec2> loop;
        loop.reserve(14);
        for (int i = 0; i < 7; i++) loop.push_back(hp[i]);
        for (int i = 7; i >= 1; i--) loop.push_back(Vec2(-hp[i].x, hp[i].y));
        // Chaikin corner cutting (closed), two passes
        for (int pass = 0; pass < 2; pass++) {
            std::vector<Vec2> nxt;
            int n = (int)loop.size();
            nxt.reserve(n * 2);
            for (int i = 0; i < n; i++) {
                const Vec2& a = loop[i];
                const Vec2& b = loop[(i + 1) % n];
                nxt.push_back(a * 0.75f + b * 0.25f);
                nxt.push_back(a * 0.25f + b * 0.75f);
            }
            loop.swap(nxt);
        }
        // resample by arc length
        int n = (int)loop.size();
        std::vector<float> acc(n + 1);
        acc[0] = 0.0f;
        for (int i = 0; i < n; i++) acc[i + 1] = acc[i] + (loop[(i + 1) % n] - loop[i]).length();
        float total = acc[n];
        out.resize(M);
        int seg = 0;
        for (int j = 0; j < M; j++) {
            float target = total * (float)j / (float)M;
            while (seg < n - 1 && acc[seg + 1] < target) seg++;
            float span = std::max(1e-6f, acc[seg + 1] - acc[seg]);
            float f = clampf((target - acc[seg]) / span, 0.0f, 1.0f);
            Vec2 a = loop[seg], b = loop[(seg + 1) % n];
            out[j] = a + (b - a) * f;
        }
        // wheel arch: lift the lower outboard skin over each opening
        if (sc.arch > 0.0f) {
            float archMinZ = trackHalf - tireW * 0.60f;
            for (auto& p : out) {
                float az = std::fabs(p.x);
                if (p.y >= sc.arch) continue;
                float blend = smoothstepf(archMinZ - 0.02f, archMinZ + 0.10f, az);
                if (blend <= 0.0f) continue;
                p.y = lerpf(p.y, sc.arch, blend);
            }
        }
    }
};

// Lofted body shell: closed tube of superelliptic sections, wheel arches baked
// into the section profile (no boolean cutting, so the topology stays clean).
void buildLoftBody(MeshBuilder& mb, const CarGeom& g, const BodyStyle& st, int paintMat, int glassMat, int M = 44) {
    float rise = std::max(0.05f, g.roofY - g.beltY);
    float bPillarX = lerpf(g.cabinRearX, g.cabinFrontX, 0.54f);
    auto classify = [&](const Vec3& c) -> int {
        if (c.y < g.beltY + 0.030f) return paintMat;
        if (c.y > g.roofY - 0.050f) return paintMat;                  // roof skin
        if (c.x < g.cabinRearX - 0.02f || c.x > g.cabinFrontX + 0.02f) return paintMat;
        if (std::fabs(c.x - g.cabinRearX) < 0.075f) return paintMat;   // C pillar
        if (std::fabs(c.x - g.cabinFrontX) < 0.075f) return paintMat;  // A pillar
        if (std::fabs(c.x - bPillarX) < 0.032f && std::fabs(c.z) > g.roofHalfW * 0.62f) return paintMat;
        (void)rise;
        return glassMat;
    };
    const int N = (int)g.secs.size();
    std::vector<std::vector<Vec3>> pos(N, std::vector<Vec3>(M));
    std::vector<Vec3> center(N);
    std::vector<Vec2> tmp;
    for (int i = 0; i < N; i++) {
        const CarGeom::Sec& sc = g.secs[i];
        g.ringPts(sc, M, tmp);
        float zc = 0.0f, yc = 0.0f;
        for (auto& p : tmp) { zc += p.x; yc += p.y; }
        center[i] = Vec3(sc.x, yc / (float)M, zc / (float)M);
        for (int j = 0; j < M; j++) pos[i][j] = Vec3(sc.x, tmp[j].y, tmp[j].x);
    }
    std::vector<std::vector<uint32_t>> ring(N, std::vector<uint32_t>(M));
    for (int i = 0; i < N; i++) {
        for (int j = 0; j < M; j++) {
            int i0 = std::max(0, i - 1), i1 = std::min(N - 1, i + 1);
            int j0 = (j - 1 + M) % M, j1 = (j + 1) % M;
            Vec3 n = (pos[i][j1] - pos[i][j0]).cross(pos[i1][j] - pos[i0][j]).normalized();
            if (n.dot(pos[i][j] - center[i]) < 0.0f) n = -n;
            if (n.lengthSq() < 1e-6f) n = Vec3(0, 1, 0);
            Vec2 uv(g.secs[i].x * 0.42f, (float)j / (float)M * 2.4f);
            ring[i][j] = mb.vert(pos[i][j], n, uv);
        }
    }
    for (int pass = 0; pass < 2; pass++) {
        mb.setMaterial(pass == 0 ? paintMat : glassMat);
        for (int i = 0; i + 1 < N; i++) {
            for (int j = 0; j < M; j++) {
                int j2 = (j + 1) % M;
                Vec3 c = (pos[i][j] + pos[i][j2] + pos[i + 1][j2] + pos[i + 1][j]) * 0.25f;
                int want = classify(c);
                if ((pass == 0) != (want == paintMat)) continue;
                mb.quad(ring[i][j], ring[i][j2], ring[i + 1][j2], ring[i + 1][j]);
            }
        }
    }
    mb.setMaterial(paintMat);
    for (int side = 0; side < 2; side++) {
        int i = side == 0 ? 0 : N - 1;
        uint32_t cc = mb.vert(center[i], Vec3(side == 0 ? -1.0f : 1.0f, 0, 0), Vec2(0.5f, 0.5f));
        for (int j = 0; j < M; j++) {
            int j2 = (j + 1) % M;
            if (side == 0) mb.tri(cc, ring[i][j], ring[i][j2]);
            else mb.tri(cc, ring[i][j2], ring[i][j]);
        }
    }
}

// Greenhouse: roof panel + raked windscreen/rear screen + side glass + pillars.
struct GreenhouseInfo {
    float frontTopX, rearTopX, topZ;
};
GreenhouseInfo buildGreenhouse(MeshBuilder& mb, const CarGeom& g, const BodyStyle& st,
                               int paintMat, int glassMat, int trimMat) {
    GreenhouseInfo gi{};
    float rise = g.roofY - g.beltY;
    float frontRun = rise * st.windshieldRake;
    float rearRun = rise * st.rearGlassRake;
    gi.frontTopX = g.cabinFrontX - frontRun;
    gi.rearTopX = g.cabinRearX + rearRun;
    gi.topZ = g.roofHalfW;
    if (gi.frontTopX < gi.rearTopX + 0.15f) {
        // keep the roof long enough on very raked designs
        float mid = (gi.frontTopX + gi.rearTopX) * 0.5f;
        gi.frontTopX = mid + 0.10f;
        gi.rearTopX = mid - 0.10f;
    }
    // The roof, screens and pillars are part of the lofted shell (material
    // classified), so here we only add the trim that reads as separate parts.
    for (int side = -1; side <= 1; side += 2) {
        // roof rail trim running along the top edge of the side glass
        mb.setMaterial(trimMat);
        mb.boxRot(Vec3((gi.frontTopX + gi.rearTopX) * 0.5f, g.roofY - 0.045f, side * (g.roofHalfW - 0.004f)),
                  Vec3((gi.frontTopX - gi.rearTopX) * 0.5f, 0.014f, 0.016f), Mat4::identity(), 1.0f);
        // beltline chrome strip
        mb.setMaterial(matNamed("chrome"));
        mb.box(Vec3((g.cabinRearX + g.cabinFrontX) * 0.5f, g.beltY + 0.012f, side * (g.cabinHalfW - 0.004f)),
               Vec3((g.cabinFrontX - g.cabinRearX) * 0.5f, 0.010f, 0.007f), 1.0f);
        // window surround (black) framing the glass
        mb.setMaterial(matNamed("blackplastic"));
        mb.box(Vec3((g.cabinRearX + g.cabinFrontX) * 0.5f, g.beltY + 0.028f, side * (g.cabinHalfW - 0.002f)),
               Vec3((g.cabinFrontX - g.cabinRearX) * 0.5f, 0.012f, 0.006f), 1.0f);
    }
    // ---- interior headliner so the cabin reads as enclosed from outside
    mb.setMaterial(trimMat);
    mb.box(Vec3((gi.frontTopX + gi.rearTopX) * 0.5f, g.roofY - 0.05f, 0),
           Vec3((gi.frontTopX - gi.rearTopX) * 0.5f - 0.02f, 0.02f, g.roofHalfW * 0.94f), 1.0f);
    return gi;
}

// Wheel arch liners (dark, gives the arches depth and hides the wheel gap).
void buildArchLiners(MeshBuilder& mb, const CarGeom& g, int mat) {
    mb.setMaterial(mat);
    float axles[2] = {g.frontAxleX, g.rearAxleX};
    float archR = g.wheelR + 0.05f;
    for (int w = 0; w < 2; w++) {
        for (int side = -1; side <= 1; side += 2) {
            float zOut = side * (g.trackHalf - g.tireW * 0.55f);
            float zIn = side * (g.trackHalf - g.tireW * 1.15f);
            const int SEG = 12;
            for (int i = 0; i < SEG; i++) {
                float a0 = lerpf(-1.55f, 1.55f, (float)i / SEG);
                float a1 = lerpf(-1.55f, 1.55f, (float)(i + 1) / SEG);
                Vec3 p0(axles[w] + std::sin(a0) * archR, g.wheelR + std::cos(a0) * archR, zOut);
                Vec3 p1(axles[w] + std::sin(a1) * archR, g.wheelR + std::cos(a1) * archR, zOut);
                Vec3 p2(p1.x, p1.y, zIn);
                Vec3 p3(p0.x, p0.y, zIn);
                Vec3 nrm = ((p1 - p0).cross(p3 - p0)).normalized();
                if (nrm.dot(Vec3(0, -1, 0)) < 0.0f) nrm = -nrm;
                mb.quad(p0, p1, p2, p3, nrm);
            }
            // liner back wall
            Vec3 a(axles[w] - archR * 0.98f, g.wheelR, zIn);
            Vec3 b(axles[w] + archR * 0.98f, g.wheelR, zIn);
            Vec3 c(axles[w] + archR * 0.98f, g.wheelR + archR, zIn);
            Vec3 d(axles[w] - archR * 0.98f, g.wheelR + archR, zIn);
            mb.quad(a, b, c, d, Vec3(0, 0, -side));
        }
    }
}


// ---------------------------------------------------------------- interior
void addInterior(MeshBuilder& mb, const CarGeom& cs, const BodyStyle& st, CarVisual& out) {
    int leather = matNamed("leather");
    int trim = matNamed("interior");
    int soft = matNamed("softtouch");
    int screenM = matNamed("screen");
    int chrome = matNamed("chrome");
    float beltY = cs.beltY;
    float floorY = beltY - 0.29f;
    float cabinTop = cs.roofY;
    float cockpitFront = cs.cabinFrontX;
    float cockpitRear = cs.cabinRearX;
    float halfIn = cs.cabinHalfW - 0.10f;
    bool race = st.interiorStyle == 1;
    // floor pan
    mb.setMaterial(trim);
    mb.box(Vec3((cockpitFront + cockpitRear) * 0.5f, floorY, 0),
           Vec3(cockpitFront - cockpitRear - 0.05f, 0.035f, halfIn * 2.0f), 1.0f);
    // dashboard
    float dashX = cockpitFront - 0.30f;
    mb.setMaterial(soft);
    mb.box(Vec3(dashX, beltY - 0.10f, 0), Vec3(0.30f, 0.30f, halfIn * 1.00f), 1.0f);
    // dash top pad, angled
    mb.setMaterial(trim);
    mb.box(Vec3(dashX + 0.02f, beltY + 0.045f, 0), Vec3(0.32f, 0.040f, halfIn * 0.98f), 1.0f);
    // instrument binnacle
    mb.setMaterial(trim);
    mb.box(Vec3(dashX - 0.12f, beltY - 0.015f, -halfIn * 0.55f), Vec3(0.16f, 0.10f, 0.30f), 1.0f);
    // centre touchscreen
    mb.setMaterial(screenM);
    mb.box(Vec3(dashX - 0.16f, beltY - 0.055f, 0.02f), Vec3(0.012f, 0.085f, 0.19f), 1.0f);
    // centre console
    mb.setMaterial(trim);
    mb.box(Vec3(cockpitFront - 0.62f, floorY + 0.16f, 0.02f), Vec3(0.55f, 0.17f, 0.17f), 1.0f);
    // gear selector
    mb.setMaterial(chrome);
    mb.box(Vec3(cockpitFront - 0.52f, floorY + 0.36f, 0.02f), Vec3(0.035f, 0.11f, 0.035f), 1.0f);
    // seats
    for (int side = -1; side <= 1; side += 2) {
        float z = side * halfIn * 0.52f;
        mb.setMaterial(leather);
        // base
        mb.box(Vec3(cockpitFront - 0.95f, floorY + 0.16f, z), Vec3(0.24f, 0.075f, 0.24f), 1.0f);
        // side bolsters
        mb.box(Vec3(cockpitFront - 0.95f, floorY + 0.22f, z - 0.21f), Vec3(0.22f, 0.09f, 0.05f), 1.0f);
        mb.box(Vec3(cockpitFront - 0.95f, floorY + 0.22f, z + 0.21f), Vec3(0.22f, 0.09f, 0.05f), 1.0f);
        // backrest (angled)
        Mat4 rot = Mat4::rotationZ(-0.22f);
        mb.setMaterial(leather);
        {
            float backBot = floorY + 0.16f;
            float backTop = cabinTop - 0.27f;
            float halfH = std::max(0.12f, (backTop - backBot) * 0.5f);
            Vec3 c(cockpitFront - 1.20f, (backBot + backTop) * 0.5f, z);
            mb.boxRot(c, Vec3(0.10f, halfH, 0.24f), rot, 1.0f);
            mb.boxRot(c + Vec3(0.055f, 0.0f, 0.0f), Vec3(0.075f, halfH * 0.55f, 0.22f), rot, 1.0f);
            // headrest
            mb.boxRot(Vec3(cockpitFront - 1.36f, cabinTop - 0.19f, z), Vec3(0.05f, 0.065f, 0.14f), rot, 1.0f);
        }
        if (race) {
            // bucket seat wings + harness cut-outs
            mb.setMaterial(trim);
            float wingH = std::max(0.12f, (cabinTop - 0.32f - floorY) * 0.30f);
            mb.boxRot(Vec3(cockpitFront - 1.22f, floorY + 0.30f, z - 0.24f), Vec3(0.085f, wingH, 0.032f), rot, 1.0f);
            mb.boxRot(Vec3(cockpitFront - 1.22f, floorY + 0.30f, z + 0.24f), Vec3(0.085f, wingH, 0.032f), rot, 1.0f);
        }
        // door card
        mb.setMaterial(soft);
        mb.box(Vec3(cockpitFront - 0.85f, beltY - 0.20f, side * (halfIn + 0.02f)), Vec3(0.62f, 0.28f, 0.02f), 1.0f);
        // door handle
        mb.setMaterial(chrome);
        mb.box(Vec3(cockpitFront - 0.75f, beltY - 0.10f, side * (halfIn + 0.005f)), Vec3(0.07f, 0.02f, 0.015f), 1.0f);
        // pedals
        if (side < 0) {
            mb.setMaterial(chrome);
            mb.box(Vec3(dashX - 0.30f, floorY + 0.08f, -0.16f), Vec3(0.03f, 0.09f, 0.055f), 1.0f);
            mb.box(Vec3(dashX - 0.34f, floorY + 0.08f, 0.02f), Vec3(0.03f, 0.055f, 0.045f), 1.0f);
        }
    }
    // steering column + wheel (the wheel itself is a separate animated mesh)
    mb.setMaterial(trim);
    Vec3 swPos(cockpitFront - 0.60f, beltY - 0.16f, -halfIn * 0.52f);
    out.steeringWheelPos = swPos;
    mb.setMaterial(trim);
    mb.boxRot(swPos + Vec3(0.19f, 0.02f, 0), Vec3(0.02f, 0.02f, 0.02f), Mat4::rotationZ(0.35f), 1.0f);
    // instrument cluster face and needles mounts
    out.needlePos = Vec3(dashX - 0.105f, beltY - 0.02f, -halfIn * 0.55f);
    // rear view mirror
    mb.setMaterial(trim);
    mb.box(Vec3(cockpitFront - 0.30f, beltY + 0.26f, 0), Vec3(0.03f, 0.045f, 0.11f), 1.0f);
    // headliner
    mb.setMaterial(trim);
    mb.box(Vec3((cockpitFront + cockpitRear) * 0.5f, cs.roofY - 0.055f, 0), Vec3((cockpitFront - cockpitRear) * 0.42f, 0.02f, halfIn * 0.95f), 1.0f);
    if (race) {
        // roll cage
        mb.setMaterial(matNamed("brushed"));
        for (int side = -1; side <= 1; side += 2) {
            Vec3 a(cockpitFront - 0.35f, floorY + 0.02f, side * halfIn * 0.9f);
            Vec3 b(cockpitRear + 0.20f, cs.roofY - 0.08f, side * halfIn * 0.9f);
            mb.cylinder(a, b, 0.022f, 8, false);
        }
        mb.cylinder(Vec3(cockpitFront - 0.35f, cs.roofY - 0.10f, -halfIn * 0.9f),
                    Vec3(cockpitFront - 0.35f, cs.roofY - 0.10f, halfIn * 0.9f), 0.022f, 8, false);
    }
}

// ---------------------------------------------------------------- exterior details
void addExteriorDetails(MeshBuilder& mb, const CarGeom& cs, const BodyStyle& st, const CarDef& def, int paintMat) {
    float halfL = cs.halfL;
    float beltY = cs.beltY;
    int black = matNamed("blackplastic");
    int chrm = matNamed("chrome");
    int grille = matNamed("grille");
    int head = matNamed("headlight");
    int headOff = matNamed("headlight_off");
    int drl = matNamed("drl");
    int tail = matNamed("taillight");
    int reverseL = matNamed("reverse_light");
    int plateM = matNamed("plate");
    int carbon = matNamed("carbon");

    // Surface-aware placement: every part is anchored to the section it sits on,
    // so nothing floats outside the bodywork on any of the sixteen silhouettes.
    float noseX = halfL - 0.03f, tailX = -halfL + 0.03f;
    float noseHW = cs.hwAt(noseX), tailHW = cs.hwAt(tailX);
    float noseTop = cs.topAt(noseX), tailTop = cs.topAt(tailX);

    // ---- front grille / intakes
    {
        float gy = std::min(st.headlightY - 0.22f, noseTop * 0.45f);
        mb.setMaterial(grille);
        mb.box(Vec3(noseX - 0.01f, gy, 0), Vec3(0.035f, 0.085f, noseHW * 0.70f), 1.0f);
        mb.setMaterial(black);
        for (int i = -1; i <= 1; i++)
            mb.box(Vec3(noseX + 0.012f, gy + i * 0.040f, 0), Vec3(0.012f, 0.007f, noseHW * 0.66f), 1.0f);
        for (int side = -1; side <= 1; side += 2)
            mb.box(Vec3(noseX - 0.02f, gy - 0.05f, side * noseHW * 0.80f),
                   Vec3(0.035f, 0.055f, noseHW * 0.13f), 1.0f);
    }
    // ---- headlights, tucked into the top shoulder of the nose
    for (int side = -1; side <= 1; side += 2) {
        float hx = halfL - 0.085f;
        float z = side * cs.hwAt(hx) * 0.58f;
        float y = std::min(st.headlightY, cs.topAt(hx) - 0.045f);
        mb.setMaterial(head);
        mb.boxRot(Vec3(hx, y, z), Vec3(0.055f, 0.040f, cs.hwAt(hx) * 0.26f), Mat4::rotationZ(-0.10f), 1.0f);
        mb.setMaterial(drl);
        mb.box(Vec3(hx + 0.035f, y - 0.032f, z), Vec3(0.012f, 0.008f, cs.hwAt(hx) * 0.23f), 1.0f);
    }
    // ---- taillights
    for (int side = -1; side <= 1; side += 2) {
        float tx = -halfL + 0.07f;
        float z = side * cs.hwAt(tx) * 0.60f;
        float y = std::min(st.taillightY, cs.topAt(tx) - 0.09f);
        mb.setMaterial(tail);
        mb.box(Vec3(tx, y, z), Vec3(0.040f, 0.045f, cs.hwAt(tx) * 0.30f), 1.0f);
        mb.setMaterial(reverseL);
        mb.box(Vec3(tx - 0.018f, y - 0.062f, z), Vec3(0.018f, 0.014f, cs.hwAt(tx) * 0.14f), 1.0f);
    }
    // ---- full-width light bar
    {
        mb.setMaterial(tail);
        float ty = std::min(st.taillightY, tailTop - 0.09f);
        mb.box(Vec3(tailX + 0.04f, ty, 0), Vec3(0.022f, 0.013f, tailHW * 0.62f), 1.0f);
    }
    // ---- exhaust tips
    mb.setMaterial(chrm);
    for (int i = 0; i < 2; i++) {
        float z = (i == 0 ? -1.0f : 1.0f) * tailHW * 0.46f;
        float y = std::min(st.exhaustY + 0.02f, cs.botAt(tailX) + 0.12f);
        mb.cylinder(Vec3(tailX - 0.03f, y, z), Vec3(tailX + 0.09f, y, z), 0.045f, 12, true);
    }
    // ---- rear diffuser
    if (st.diffuserHeight > 0.001f) {
        mb.setMaterial(carbon);
        float dy = std::max(st.diffuserHeight, cs.botAt(tailX) + 0.05f);
        mb.box(Vec3(tailX + 0.11f, dy, 0), Vec3(0.11f, 0.055f, tailHW * 0.80f), 1.0f);
        for (int i = -3; i <= 3; i++)
            mb.box(Vec3(tailX + 0.10f, dy - 0.03f, i * tailHW * 0.12f), Vec3(0.09f, 0.030f, 0.010f), 1.0f);
    }
    // ---- front splitter
    if (st.splitterDepth > 0.001f) {
        mb.setMaterial(carbon);
        mb.box(Vec3(noseX - 0.02f, cs.botAt(noseX) + 0.02f, 0), Vec3(st.splitterDepth, 0.016f, noseHW * 0.92f), 1.0f);
    }
    // ---- side skirts, following the sill line between the arches
    mb.setMaterial(black);
    {
        float midX = (cs.frontAxleX + cs.rearAxleX) * 0.5f;
        float len = std::max(0.3f, (cs.frontAxleX - cs.rearAxleX) * 0.42f);
        for (int side = -1; side <= 1; side += 2)
            mb.box(Vec3(midX, cs.botAt(midX) + 0.045f, side * (cs.hwAt(midX) - 0.028f)),
                   Vec3(len, 0.042f, 0.030f), 1.0f);
    }
    // ---- mirrors on the A-pillar base
    for (int side = -1; side <= 1; side += 2) {
        float mx = cs.cabinFrontX - 0.10f;
        float mz = cs.hwAt(mx);
        mb.setMaterial(black);
        mb.cylinder(Vec3(mx, beltY + 0.02f, mz + side * 0.005f), Vec3(mx, beltY + 0.075f, mz + side * 0.055f), 0.018f, 8, true);
        mb.setMaterial(paintMat);
        mb.boxRot(Vec3(mx - 0.01f, beltY + 0.095f, mz + side * 0.092f), Vec3(0.045f, 0.036f, 0.052f),
                  Mat4::rotationY(side * 0.10f), 1.0f);
        mb.setMaterial(chrm);
        mb.box(Vec3(mx - 0.045f, beltY + 0.095f, mz + side * 0.095f), Vec3(0.004f, 0.026f, 0.044f), 1.0f);
    }
    // ---- door handles
    for (int side = -1; side <= 1; side += 2) {
        mb.setMaterial(chrm);
        float hx = lerpf(cs.cabinRearX, cs.cabinFrontX, 0.62f);
        mb.box(Vec3(hx, beltY - 0.115f, side * (cs.hwAt(hx) - 0.012f)), Vec3(0.070f, 0.018f, 0.010f), 1.0f);
    }
    // ---- wipers parked at the base of the screen
    mb.setMaterial(black);
    {
        float wx = cs.cabinFrontX - (cs.roofY - cs.beltY) * st.windshieldRake * 0.30f;
        float wy = std::max(cs.topAt(wx), beltY) + 0.012f;
        mb.boxRot(Vec3(wx, wy, -0.18f), Vec3(0.30f, 0.007f, 0.010f), Mat4::rotationY(0.22f), 1.0f);
        mb.boxRot(Vec3(wx, wy, 0.15f), Vec3(0.30f, 0.007f, 0.010f), Mat4::rotationY(-0.16f), 1.0f);
    }
    // ---- number plate
    mb.setMaterial(plateM);
    mb.box(Vec3(tailX - 0.004f, std::max(st.exhaustY + 0.10f, cs.botAt(tailX) + 0.10f), 0),
           Vec3(0.006f, 0.050f, 0.20f), 1.0f);
    // ---- spoiler / wing
    if (st.spoilerHeight > 0.001f) {
        mb.setMaterial(carbon);
        float sx = -halfL + 0.16f;
        float baseY = cs.topAt(sx);
        float sw = st.spoilerWidth > 0.001f ? st.spoilerWidth * 0.5f : tailHW * 0.92f;
        for (int side = -1; side <= 1; side += 2)
            mb.box(Vec3(sx, baseY + st.spoilerHeight * 0.5f, side * sw * 0.62f),
                   Vec3(0.075f, st.spoilerHeight * 0.5f, 0.022f), 1.0f);
        mb.boxRot(Vec3(sx - 0.02f, baseY + st.spoilerHeight, 0), Vec3(0.115f, 0.010f, sw * 0.94f),
                  Mat4::rotationZ(0.08f), 1.0f);
    }
    // ---- hood scoop / vents
    if (st.hoodScoop > 0.001f) {
        mb.setMaterial(carbon);
        float hx = lerpf(cs.cabinFrontX, halfL, 0.55f);
        float hy = cs.topAt(hx);
        mb.box(Vec3(hx, hy - 0.015f, 0), Vec3(0.20f, 0.035f, st.hoodScoop * 0.5f), 1.0f);
        mb.setMaterial(black);
        mb.box(Vec3(hx + 0.19f, hy - 0.020f, 0), Vec3(0.025f, 0.028f, st.hoodScoop * 0.42f), 1.0f);
    }
    // ---- roof rails for off-roaders
    if (st.offroad && cs.roofY > cs.beltY + 0.15f) {
        mb.setMaterial(black);
        {
            float rx0 = lerpf(cs.cabinRearX, cs.cabinFrontX, 0.22f);
            float rx1 = lerpf(cs.cabinRearX, cs.cabinFrontX, 0.78f);
            for (int side = -1; side <= 1; side += 2)
                mb.cylinder(Vec3(rx0, cs.roofY + 0.012f, side * cs.roofHalfW * 0.88f),
                            Vec3(rx1, cs.roofY + 0.012f, side * cs.roofHalfW * 0.88f), 0.016f, 8, true);
        }
    }
    (void)headOff; (void)def;
}

// ---------------------------------------------------------------- wheels
inline bool carDarkRims(CarClass c) {
    return c == CarClass::Hypercar || c == CarClass::TrackCar || c == CarClass::Rally;
}

Mesh buildWheel(float radius, float width, int spokes, bool darkRim, bool offroad) {
    MeshBuilder mb;
    mb.begin();
    int rubber = matNamed("rubber");
    int rimM = matNamed(darkRim ? "rimdark" : "rim");
    int discM = matNamed("disc");
    int calM = matNamed("caliper");
    int chrm = matNamed("chrome");
    // wheel local space: axle along +z, tyre plane in xy
    // ---- tyre (lathe profile revolved about z)
    std::vector<Vec2> profile;
    float hw = width * 0.5f;
    float r = radius;
    profile.push_back({r * 0.62f, -hw});              // inner bead
    profile.push_back({r * 0.80f, -hw * 0.98f});
    profile.push_back({r * 0.95f, -hw * 0.86f});
    profile.push_back({r * 1.00f, -hw * 0.55f});
    profile.push_back({r * 1.02f, 0.0f});             // tread crown
    profile.push_back({r * 1.00f, hw * 0.55f});
    profile.push_back({r * 0.95f, hw * 0.86f});
    profile.push_back({r * 0.80f, hw * 0.98f});
    profile.push_back({r * 0.62f, hw});
    // lathe about Y then rotate to Z
    mb.setMaterial(rubber);
    Mat4 toZ = Mat4::rotationX(PI * 0.5f);
    mb.lathe(profile, 44, toZ, false, false);
    // tread blocks
    int blocks = offroad ? 48 : 56;
    for (int i = 0; i < blocks; i++) {
        float a = TAU * i / blocks;
        Vec3 dir(std::cos(a), std::sin(a), 0);
        float tl = offroad ? r * 0.035f : r * 0.028f;
        float tw = offroad ? r * 0.030f : r * 0.022f;
        mb.boxRot(dir * (r * 0.995f), Vec3(tl, tw, width * 0.86f), Mat4::rotationZ(a), 1.0f);
        if (offroad) {
            mb.boxRot(dir * (r * 1.02f), Vec3(r * 0.024f, r * 0.02f, width * 0.9f), Mat4::rotationZ(a + 0.35f), 1.0f);
        }
    }
    // sidewall
    for (int side = -1; side <= 1; side += 2) {
        mb.setMaterial(rubber);
        mb.ring(Vec3(0, 0, side * hw * 0.90f), Vec3(0, 0, side), r * 0.62f, r * 0.86f, 40);
        mb.setMaterial(chrm);
        mb.ring(Vec3(0, 0, side * hw * 0.96f), Vec3(0, 0, side), r * 0.70f, r * 0.735f, 40);
    }
    // ---- rim barrel
    mb.setMaterial(rimM);
    for (int side = -1; side <= 1; side += 2) {
        // outer lip
        mb.ring(Vec3(0, 0, side * hw * 0.80f), Vec3(0, 0, side), r * 0.50f, r * 0.66f, 40);
    }
    {
        std::vector<Vec2> barrel;
        barrel.push_back({r * 0.50f, -hw * 0.78f});
        barrel.push_back({r * 0.56f, -hw * 0.40f});
        barrel.push_back({r * 0.56f, hw * 0.40f});
        barrel.push_back({r * 0.52f, hw * 0.78f});
        mb.setMaterial(rimM);
        mb.lathe(barrel, 36, toZ, false, false);
    }
    // ---- spokes (concave face)
    mb.setMaterial(rimM);
    for (int i = 0; i < spokes; i++) {
        float a = TAU * i / spokes;
        Vec3 dir(std::cos(a), std::sin(a), 0);
        Vec3 tang(-std::sin(a), std::cos(a), 0);
        for (int seg = 0; seg < 3; seg++) {
            float t0 = 0.14f + seg * 0.13f, t1 = t0 + 0.145f;
            Vec3 p0 = dir * (r * (0.20f + t0 * 0.95f));
            Vec3 p1 = dir * (r * (0.20f + t1 * 0.95f));
            Vec3 c = (p0 + p1) * 0.5f;
            float len = (p1 - p0).length();
            Mat4 rot = Mat4::axisAngle(Vec3(0, 0, 1), a);
            mb.boxRot(c + Vec3(0, 0, hw * 0.42f), Vec3(len * 0.62f, r * 0.055f, hw * 0.22f - seg * 0.01f), rot, 1.0f);
            (void)tang;
        }
    }
    // hub
    mb.setMaterial(rimM);
    mb.cylinder(Vec3(0, 0, hw * 0.36f), Vec3(0, 0, hw * 0.52f), r * 0.20f, 20, true);
    mb.setMaterial(chrm);
    for (int i = 0; i < 5; i++) {
        float a = TAU * i / 5.0f;
        Vec3 c(std::cos(a) * r * 0.13f, std::sin(a) * r * 0.13f, hw * 0.53f);
        mb.boxRot(c, Vec3(r * 0.022f, r * 0.022f, r * 0.012f), Mat4::identity(), 1.0f);
    }
    mb.setMaterial(chrm);
    mb.cylinder(Vec3(0, 0, hw * 0.50f), Vec3(0, 0, hw * 0.60f), r * 0.075f, 14, true);
    // ---- brake disc + caliper (on the inboard side)
    mb.setMaterial(discM);
    mb.cylinder(Vec3(0, 0, -hw * 0.30f), Vec3(0, 0, -hw * 0.14f), r * 0.52f, 34, true);
    mb.setMaterial(discM);
    mb.cylinder(Vec3(0, 0, -hw * 0.32f), Vec3(0, 0, -hw * 0.26f), r * 0.30f, 24, true);
    // ventilated ring detail
    mb.setMaterial(discM);
    mb.ring(Vec3(0, 0, -hw * 0.31f), Vec3(0, 0, -1), r * 0.30f, r * 0.50f, 34);
    // caliper
    mb.setMaterial(calM);
    {
        float a = 0.6f;
        Vec3 dir(std::cos(a), std::sin(a), 0);
        Mat4 rot = Mat4::axisAngle(Vec3(0, 0, 1), a);
        mb.boxRot(dir * (r * 0.42f) + Vec3(0, 0, -hw * 0.22f), Vec3(r * 0.20f, r * 0.13f, hw * 0.30f), rot, 1.0f);
    }
    mb.build(false);
    return mb.mesh;
}

Mesh buildSteeringWheel(float radius, bool race) {
    MeshBuilder mb;
    mb.begin();
    mb.setMaterial(matNamed("leather"));
    mb.torus(Vec3(0, 0, 0), Vec3(1, 0, 0), radius, radius * 0.115f, 28, 10);
    mb.setMaterial(matNamed("softtouch"));
    mb.cylinder(Vec3(-0.02f, 0, 0), Vec3(0.02f, 0, 0), radius * 0.30f, 18, true);
    mb.setMaterial(matNamed("brushed"));
    // spokes
    for (int i = 0; i < 3; i++) {
        float a = (i == 0) ? PI * 0.5f : (i == 1 ? -PI * 0.86f : -PI * 0.14f);
        float a2 = a + (i == 0 ? PI : 0.0f);
        (void)a2;
        Vec3 dir(std::cos(a), std::sin(a), 0);
        mb.boxRot(dir * (radius * 0.62f), Vec3(radius * 0.42f, radius * 0.075f, 0.022f),
                  Mat4::rotationZ(a), 1.0f);
    }
    if (race) {
        mb.setMaterial(matNamed("carbon"));
        mb.box(Vec3(0, -radius * 0.30f, 0.01f), Vec3(radius * 0.85f, radius * 0.12f, 0.02f), 1.0f);
        // shift LEDs
        mb.setMaterial(matNamed("drl"));
        for (int i = -3; i <= 3; i++)
            mb.box(Vec3(i * radius * 0.075f, radius * 0.60f, 0.015f), Vec3(radius * 0.028f, radius * 0.028f, 0.008f), 1.0f);
    }
    mb.build(false);
    return mb.mesh;
}

Mesh buildNeedle(float length, int material) {
    MeshBuilder mb;
    mb.begin();
    mb.setMaterial(material);
    mb.box(Vec3(length * 0.5f, 0, 0.004f), Vec3(length, 0.006f, 0.004f), 1.0f);
    mb.box(Vec3(length * 0.92f, 0, 0.006f), Vec3(length * 0.12f, 0.012f, 0.005f), 1.0f);
    mb.build(false);
    return mb.mesh;
}

} // namespace

// ---------------------------------------------------------------- public API
std::vector<WheelSpec> makeWheelSpecs(const BodyStyle& s) {
    std::vector<WheelSpec> ws(4);
    float fx = s.frontAxleT;    // fraction from rear
    // convert to local x: front/rear axle offsets from the model origin
    float wheelbase = s.wheelbase;
    float halfTrack = s.trackWidth * 0.5f;
    float mountY = s.wheelRadius + 0.10f;
    // model origin is the car centre
    float frontX = wheelbase * 0.5f;
    float rearX = -wheelbase * 0.5f;
    (void)fx;
    ws[0].pos = Vec3(frontX, mountY, -halfTrack); ws[0].front = true; ws[0].left = true;
    ws[1].pos = Vec3(frontX, mountY, halfTrack);  ws[1].front = true; ws[1].left = false;
    ws[2].pos = Vec3(rearX, mountY, -halfTrack);  ws[2].front = false; ws[2].left = true;
    ws[3].pos = Vec3(rearX, mountY, halfTrack);   ws[3].front = false; ws[3].left = false;
    for (auto& w : ws) {
        w.radius = s.wheelRadius;
        w.width = s.tireWidth;
        w.inertia = 3.0f;
    }
    return ws;
}

CarVisual buildCarVisual(const CarDef& def, float detailScale, bool withDetails) {
    CarVisual out;
    const BodyStyle& st = def.style;
    CarGeom g;
    g.setup(st);
    (void)detailScale;

    MeshBuilder mb;
    mb.begin();
    int paintMat = matPaint(def.palette.empty() ? PaintColor{"Silver", 0xC8CCD0, 0.7f, 1.0f} : def.palette[0], "paint_body");
    out.paintMaterial = paintMat;
    if (def.palette.size() > 1) out.paintMaterialAlt = matPaint(def.palette[1], "paint_alt");
    // body shell, arches, greenhouse
    buildLoftBody(mb, g, st, paintMat, matNamed("glass"), 44);
    buildArchLiners(mb, g, matNamed("blackplastic"));
    if (withDetails) {
        buildGreenhouse(mb, g, st, paintMat, matNamed("glass"), matNamed("interior"));
        addInterior(mb, g, st, out);
        addExteriorDetails(mb, g, st, def, paintMat);
    }
    mb.build(false);
    out.body = mb.mesh;

    // ---- wheels
    int spokes = def.carClass == CarClass::Hypercar ? 10 : (def.carClass == CarClass::TrackCar ? 6 : 5);
    bool dark = carDarkRims(def.carClass);
    out.wheel = buildWheel(st.wheelRadius, st.tireWidth, spokes, dark, st.offroad);
    out.wheelRadius = st.wheelRadius;

    // ---- animated interior parts
    out.steeringWheel = buildSteeringWheel(st.interiorStyle == 1 ? 0.155f : 0.175f, st.interiorStyle == 1);
    out.needleSpeed = buildNeedle(0.045f, matNamed("drl"));
    out.needleRpm = buildNeedle(0.045f, matNamed("drl"));

    // ---- wheel placements (matching the physics wheel specs)
    out.wheelPositions.clear();
    out.wheelLeft.clear();
    float halfTrack = st.trackWidth * 0.5f;
    out.wheelPositions.push_back(Vec3(st.wheelbase * 0.5f, st.wheelRadius, -halfTrack));
    out.wheelLeft.push_back(true);
    out.wheelPositions.push_back(Vec3(st.wheelbase * 0.5f, st.wheelRadius, halfTrack));
    out.wheelLeft.push_back(false);
    out.wheelPositions.push_back(Vec3(-st.wheelbase * 0.5f, st.wheelRadius, -halfTrack));
    out.wheelLeft.push_back(true);
    out.wheelPositions.push_back(Vec3(-st.wheelbase * 0.5f, st.wheelRadius, halfTrack));
    out.wheelLeft.push_back(false);
    out.bounds = out.body.bounds;
    out.bounds.add(out.wheel.bounds);
    out.triCount = (int)(out.body.triCount() + out.wheel.triCount() * 4);
    return out;
}

} // namespace hv
