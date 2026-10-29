// HORIZON VELOCITY - static geometry: terrain chunks, roads, props, draw pass.
#include "world/world.h"
#include "render/gfx.h"
#include "render/materials.h"
#include "render/mesh.h"
#include <algorithm>
#include <cmath>
#include <cstdio>
#include <map>

namespace hv {

static int matForTerrain(const World& w, float h, Region r) {
    if (h > 270.0f) return matNamed("terrain_snow");
    if (h < 0.8f) return matNamed("terrain_sand");
    switch (r) {
        case Region::RedstoneDesert: return matNamed(h < 4.0f ? "terrain_sand" : "terrain_dirt");
        case Region::AzureCoast: return matNamed(h < 3.4f ? "terrain_sand" : "terrain_grass");
        case Region::SilverMountains: return matNamed(h > 110.0f ? "terrain_rock" : "terrain_grass");
        case Region::AuroraCity: return matNamed("terrain_concrete");
        case Region::GoldenFarmland: return matNamed("terrain_farm");
        case Region::GreenvaleForest: return matNamed("terrain_forest");
        case Region::MotorsportPark: return matNamed("terrain_grass");
        default: return matNamed("terrain_grass");
    }
}

// ---------------------------------------------------------------------------
// Prop meshes (shared, drawn with per-instance transforms)
// ---------------------------------------------------------------------------
static Mesh makePine(int variant) {
    MeshBuilder mb;
    mb.begin();
    mb.setMaterial(matNamed("tree_bark"));
    float th = variant ? 2.6f : 1.9f;
    mb.cylinder(Vec3(0, 0, 0), Vec3(0, th, 0), variant ? 0.16f : 0.12f, 6, false);
    mb.setMaterial(matNamed(variant == 2 ? "leaf_autumn" : "leaf"));
    float base = th * 0.55f;
    for (int i = 0; i < 3; i++) {
        float y0 = base + i * 1.5f;
        float rad = 1.45f - i * 0.36f;
        mb.cylinder(Vec3(0, y0, 0), Vec3(0, y0 + 2.1f, 0), rad, 7, false);
    }
    mb.build(false);
    return mb.mesh;
}

static Mesh makeBroadleaf(int variant) {
    MeshBuilder mb;
    mb.begin();
    mb.setMaterial(matNamed("tree_bark"));
    mb.cylinder(Vec3(0, 0, 0), Vec3(0, 2.2f, 0), 0.18f, 6, false);
    mb.setMaterial(matNamed(variant == 2 ? "leaf_autumn" : "leaf"));
    std::vector<Vec2> prof;
    for (int i = 0; i <= 6; i++) {
        float t = (float)i / 6.0f;
        prof.push_back(Vec2(std::sin(t * PI) * 1.95f, t * 3.1f));
    }
    mb.lathe(prof, 9, Mat4::translation(Vec3(0, 2.2f, 0)), true, false);
    mb.build(false);
    return mb.mesh;
}

static Mesh makePalm() {
    MeshBuilder mb;
    mb.begin();
    mb.setMaterial(matNamed("tree_bark"));
    Vec3 c(0, 0, 0);
    for (int i = 0; i < 5; i++) {
        Vec3 n = Vec3(0.16f * (i % 2 ? 1.0f : -1.0f), 1.1f, 0.10f);
        mb.cylinder(c, c + n, 0.16f - i * 0.016f, 5, false);
        c = c + n;
    }
    mb.setMaterial(matNamed("leaf_palm"));
    for (int i = 0; i < 7; i++) {
        float a = TAU * (float)i / 7.0f;
        Vec3 tip = c + Vec3(std::cos(a) * 2.1f, -0.55f, std::sin(a) * 2.1f);
        mb.cylinder(c, tip, 0.22f, 4, false);
    }
    mb.build(false);
    return mb.mesh;
}

static Mesh makeRock() {
    MeshBuilder mb;
    mb.begin();
    mb.setMaterial(matNamed("terrain_rock"));
    Rng r(77);
    for (int i = 0; i < 3; i++) {
        Vec3 p(r.range(-0.9f, 0.9f), r.range(-0.1f, 0.5f), r.range(-0.9f, 0.9f));
        mb.boxRot(p, Vec3(r.range(0.8f, 1.8f), r.range(0.6f, 1.6f), r.range(0.8f, 1.8f)),
                  Mat4::rotationY(r.range(0, TAU)), 1.0f);
    }
    mb.build(false);
    return mb.mesh;
}

static Mesh makeBuilding(int variant) {
    MeshBuilder mb;
    mb.begin();
    Rng r(1000 + variant * 17);
    float hgt = r.range(9.0f, 46.0f);
    float wdt = r.range(12.0f, 26.0f);
    float dpt = r.range(12.0f, 26.0f);
    int wallMat = variant % 3 == 0 ? matNamed("building_white")
                 : variant % 3 == 1 ? matNamed("concrete_wall") : matNamed("building_brick");
    mb.setMaterial(wallMat);
    mb.box(Vec3(0, hgt * 0.5f, 0), Vec3(wdt, hgt, dpt), 1.0f);
    // glazing bands
    mb.setMaterial(matNamed("building_glass"));
    int floors = std::max(1, (int)(hgt / 4.2f));
    for (int i = 1; i < floors; i++) {
        float y = i * 4.2f;
        if (y > hgt - 1.2f) break;
        mb.box(Vec3(wdt * 0.5f + 0.02f, y, 0), Vec3(0.08f, 1.7f, dpt * 0.90f), 1.0f);
        mb.box(Vec3(-wdt * 0.5f - 0.02f, y, 0), Vec3(0.08f, 1.7f, dpt * 0.90f), 1.0f);
        mb.box(Vec3(0, y, dpt * 0.5f + 0.02f), Vec3(wdt * 0.90f, 1.7f, 0.08f), 1.0f);
        mb.box(Vec3(0, y, -dpt * 0.5f - 0.02f), Vec3(wdt * 0.90f, 1.7f, 0.08f), 1.0f);
    }
    mb.setMaterial(matNamed("concrete_wall"));
    mb.box(Vec3(0, hgt + 0.25f, 0), Vec3(wdt * 1.04f, 0.5f, dpt * 1.04f), 1.0f);
    if (variant % 4 == 0) {
        mb.setMaterial(matNamed("metal_pole"));
        mb.cylinder(Vec3(0, hgt + 0.5f, 0), Vec3(0, hgt + 5.5f, 0), 0.12f, 6, false);
    }
    mb.build(false);
    return mb.mesh;
}

static Mesh makeLamp() {
    MeshBuilder mb;
    mb.begin();
    mb.setMaterial(matNamed("metal_pole"));
    mb.cylinder(Vec3(0, 0, 0), Vec3(0, 7.2f, 0), 0.10f, 6, false);
    mb.cylinder(Vec3(0, 7.2f, 0), Vec3(1.1f, 7.4f, 0), 0.07f, 5, false);
    mb.setMaterial(matNamed("lamp_glow"));
    mb.box(Vec3(1.35f, 7.3f, 0), Vec3(0.68f, 0.18f, 0.40f), 1.0f);
    mb.build(false);
    return mb.mesh;
}

static Mesh makeSign() {
    MeshBuilder mb;
    mb.begin();
    mb.setMaterial(matNamed("metal_pole"));
    mb.cylinder(Vec3(0, 0, 0), Vec3(0, 3.0f, 0), 0.07f, 5, false);
    mb.setMaterial(matNamed("sign_green"));
    mb.box(Vec3(0, 3.5f, 0), Vec3(3.0f, 1.1f, 0.10f), 1.0f);
    mb.build(false);
    return mb.mesh;
}

static Mesh makeBarrier() {
    MeshBuilder mb;
    mb.begin();
    mb.setMaterial(matNamed("barrier"));
    mb.box(Vec3(0, 0.62f, 0), Vec3(4.0f, 0.32f, 0.10f), 1.0f);
    mb.box(Vec3(0, 0.38f, 0), Vec3(4.0f, 0.24f, 0.08f), 1.0f);
    mb.setMaterial(matNamed("metal_pole"));
    mb.box(Vec3(-1.9f, 0.4f, 0), Vec3(0.12f, 0.8f, 0.12f), 1.0f);
    mb.box(Vec3(1.9f, 0.4f, 0), Vec3(0.12f, 0.8f, 0.12f), 1.0f);
    mb.build(false);
    return mb.mesh;
}

static Mesh makeGrandstand() {
    MeshBuilder mb;
    mb.begin();
    mb.setMaterial(matNamed("concrete_wall"));
    for (int i = 0; i < 7; i++)
        mb.box(Vec3(0, 0.6f + i * 0.75f, -i * 1.1f), Vec3(36.0f, 0.72f, 1.4f), 1.0f);
    mb.setMaterial(matNamed("metal_pole"));
    for (int i = -3; i <= 3; i++) {
        mb.cylinder(Vec3(i * 5.6f, 0, -8.4f), Vec3(i * 5.6f, 9.0f, -8.4f), 0.13f, 5, false);
        mb.cylinder(Vec3(i * 5.6f, 9.0f, -8.4f), Vec3(i * 5.6f, 9.2f, -1.0f), 0.10f, 5, false);
    }
    mb.setMaterial(matNamed("festival_pink"));
    mb.box(Vec3(0, 9.2f, -8.4f), Vec3(38.0f, 0.56f, 1.0f), 1.0f);
    mb.build(false);
    return mb.mesh;
}

static Mesh makeStageBig() {
    MeshBuilder mb;
    mb.begin();
    mb.setMaterial(matNamed("stage_black"));
    mb.box(Vec3(0, 1.0f, 0), Vec3(22.0f, 2.0f, 14.0f), 1.0f);
    mb.box(Vec3(0, 6.0f, -6.0f), Vec3(25.0f, 10.0f, 0.8f), 1.0f);
    mb.box(Vec3(-12.0f, 6.5f, -2.0f), Vec3(0.8f, 13.0f, 8.0f), 1.0f);
    mb.box(Vec3(12.0f, 6.5f, -2.0f), Vec3(0.8f, 13.0f, 8.0f), 1.0f);
    mb.setMaterial(matNamed("festival_pink"));
    mb.box(Vec3(0, 11.2f, -6.0f), Vec3(25.2f, 0.6f, 1.2f), 1.0f);
    mb.setMaterial(matNamed("festival_cyan"));
    mb.box(Vec3(-12.0f, 13.1f, -2.0f), Vec3(1.0f, 0.6f, 8.2f), 1.0f);
    mb.box(Vec3(12.0f, 13.1f, -2.0f), Vec3(1.0f, 0.6f, 8.2f), 1.0f);
    mb.setMaterial(matNamed("building_glass"));
    mb.box(Vec3(0, 6.2f, -5.4f), Vec3(17.0f, 5.2f, 0.4f), 1.0f);
    mb.build(false);
    return mb.mesh;
}

static Mesh makeCone() {
    MeshBuilder mb;
    mb.begin();
    mb.setMaterial(matNamed("kerb_red"));
    mb.cylinder(Vec3(0, 0, 0), Vec3(0, 0.68f, 0), 0.22f, 6, true);
    mb.setMaterial(matNamed("kerb_white"));
    mb.cylinder(Vec3(0, 0.40f, 0), Vec3(0, 0.52f, 0), 0.17f, 6, false);
    mb.build(false);
    return mb.mesh;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
void buildProps(World& w, const Noise& n) {
    Rng rng(w.seed ^ 0x9E3779B9u);
    w.props.clear();
    w.props.reserve(9000);
    const float half = World::SIZE * 0.5f;

    // trees / rocks from the vegetation density field
    for (int iz = 2; iz < World::GRID - 2; iz += 1) {
        for (int ix = 2; ix < World::GRID - 2; ix += 1) {
            size_t i = (size_t)iz * World::GRID + ix;
            float dens = w.vegDensity[i] / 255.0f;
            if (dens < 0.08f) continue;
            if (w.roadMask[i] > 20) continue;
            float h = w.height[i];
            if (h < 1.2f) continue;
            // one candidate per cell, jittered
            float jx = rng.range(-0.45f, 0.45f) * w.cell;
            float jz = rng.range(-0.45f, 0.45f) * w.cell;
            float x = -half + ix * w.cell + jx;
            float z = -half + iz * w.cell + jz;
            (void)n;
            if (!rng.chance(dens * 0.55f)) continue;
            Prop p;
            p.pos = Vec3(x, h, z);
            p.yaw = rng.range(0, TAU);
            p.scale = rng.range(0.75f, 1.35f);
            Region reg = (Region)w.regionMask[i];
            float r = rng.nextFloat();
            if (reg == Region::GreenvaleForest || reg == Region::SilverMountains) {
                p.type = (uint8_t)(r < 0.62f ? PropTree : (r < 0.86f ? PropRock : PropTree));
                p.variant = (uint8_t)(r < 0.62f ? 0 : (r < 0.86f ? 1 : 1));
                if (p.type == PropRock) p.scale *= 0.9f;
            } else if (reg == Region::AzureCoast && h < 8.0f && r < 0.5f) {
                p.type = (uint8_t)PropPalm;
                p.scale = rng.range(0.85f, 1.2f);
            } else if (dens > 0.25f) {
                p.type = (uint8_t)PropTree;
                p.variant = (uint8_t)(rng.chance(0.35f) ? 2 : 1);
            } else {
                continue;
            }
            w.props.push_back(p);
        }
    }

    // ---- city blocks: buildings along the grid, keeping the streets clear
    Vec3 cc = regionCenter(Region::AuroraCity);
    for (int ix = -640; ix <= 640; ix += 55) {
        for (int iz = -640; iz <= 640; iz += 55) {
            float x = cc.x + (float)ix, z = cc.z + (float)iz;
            float d = std::sqrt(x * x + z * z);
            if (d > 820.0f) continue;
            // keep the street grid clear
            // keep a 16 m setback from any street centre line
            if (std::fabs(std::fmod(std::fabs(x), 190.0f)) < 26.0f) continue;
            if (std::fabs(std::fmod(std::fabs(z), 190.0f)) < 26.0f) continue;
            if (!rng.chance(0.80f)) continue;
            Prop p;
            p.pos = Vec3(x, w.heightAt(x, z), z);
            p.yaw = 0.0f;
            p.type = (uint8_t)PropBuilding;
            p.variant = (uint8_t)rng.rangeInt(0, 12);
            p.scale = rng.range(0.85f, 1.25f);
            w.props.push_back(p);
            w.stats.buildingCount++;
        }
    }

    // ---- street lamps along the highways and in the city
    for (const Road& r : w.roads) {
        if (!r.highway && r.halfWidth < 4.5f) continue;
        float spacing = r.highway ? 46.0f : 34.0f;
        float acc = 0.0f;
        int side = 1;
        for (size_t i = 1; i < r.pts.size(); i++) {
            Vec3 a = r.pts[i - 1], b = r.pts[i];
            float seg = Vec3(b.x - a.x, 0, b.z - a.z).length();
            acc += seg;
            if (acc < spacing) continue;
            acc = 0.0f;
            Vec3 dir = Vec3(b.x - a.x, 0, b.z - a.z).normalized();
            Vec3 sideV(-dir.z, 0, dir.x);
            Vec3 pos = b + sideV * (r.halfWidth + 1.4f) * (float)side;
            side = -side;
            pos.y = w.heightAt(pos.x, pos.z);
            if (pos.y < 1.0f) continue;
            Prop p;
            p.pos = pos;
            p.yaw = std::atan2(-sideV.z, -sideV.x) + (side > 0 ? 0.0f : PI);
            p.type = (uint8_t)PropLamp;
            w.props.push_back(p);
        }
    }

    // ---- guardrails on the fast roads
    for (const Road& r : w.roads) {
        if (!r.highway && r.speedLimit < 100.0f) continue;
        float acc = 0.0f;
        for (size_t i = 1; i < r.pts.size(); i++) {
            Vec3 a = r.pts[i - 1], b = r.pts[i];
            float seg = Vec3(b.x - a.x, 0, b.z - a.z).length();
            acc += seg;
            if (acc < 4.0f) continue;
            acc = 0.0f;
            Vec3 dir = Vec3(b.x - a.x, 0, b.z - a.z).normalized();
            Vec3 sideV(-dir.z, 0, dir.x);
            for (int s = -1; s <= 1; s += 2) {
                Vec3 pos = b + sideV * (r.halfWidth + 1.1f) * (float)s;
                pos.y = w.heightAt(pos.x, pos.z);
                if (pos.y < 1.0f) continue;
                Prop p;
                p.pos = pos;
                p.yaw = std::atan2(dir.z, dir.x);
                if (s < 0) p.yaw += PI;
                p.type = (uint8_t)PropBarrier;
                w.props.push_back(p);
            }
        }
    }

    // ---- circuit furniture
    for (const Road& r : w.roads) {
        if (r.name.find("Circuit") == std::string::npos) continue;
        for (int k = 0; k < 3; k++) {
            int idx = (int)r.pts.size() * (k + 1) / 4;
            idx = std::min(idx, (int)r.pts.size() - 1);
            Vec3 p = r.pts[idx];
            Vec3 dir = (r.pts[std::min(idx + 2, (int)r.pts.size() - 1)] - p).normalized();
            Vec3 sideV(-dir.z, 0, dir.x);
            Prop st;
            st.pos = p + sideV * 22.0f;
            st.pos.y = w.heightAt(st.pos.x, st.pos.z);
            st.yaw = std::atan2(dir.z, dir.x) + PI * 0.5f;
            st.type = (uint8_t)PropGrandstand;
            w.props.push_back(st);
        }
    }

    // ---- festival grounds: main stage, tents, container village
    Vec3 fg = regionCenter(Region::FestivalGrounds);
    {
        Prop st;
        st.pos = Vec3(fg.x, w.heightAt(fg.x, fg.z), fg.z - 40.0f);
        st.yaw = 0.0f;
        st.type = (uint8_t)PropStage;
        w.props.push_back(st);
        for (int i = 0; i < 26; i++) {
            float a = rng.range(0, TAU);
            float rr = rng.range(55.0f, 150.0f);
            float x = fg.x + std::cos(a) * rr, z = fg.z + std::sin(a) * rr;
            if (w.isRoad(Vec3(x, 0, z), 2.0f)) continue;
            Prop p;
            p.pos = Vec3(x, w.heightAt(x, z), z);
            p.yaw = rng.range(0, TAU);
            p.type = (uint8_t)(rng.chance(0.5f) ? PropContainer : PropLamp);
            w.props.push_back(p);
        }
    }
    (void)half;
    for (const Prop& p : w.props) if (p.type == PropTree) w.stats.treeCount++;
}

// ---------------------------------------------------------------------------
// Meshes
// ---------------------------------------------------------------------------
struct World::Impl {
    static constexpr int LODS = 3;
    Mesh terrain[(int)World::CHUNKS * (int)World::CHUNKS][3];
    Mesh water;
    Mesh roads;
    Mesh propMesh[PropCount];
    Mesh treeVariants[3];
    Mesh buildingVariants[12];
    // spatial buckets for props (500 m cells)
    static constexpr float BUCKET = 500.0f;
    static constexpr int BN = (int)(World::SIZE / BUCKET);
    std::vector<uint32_t> buckets[BN * BN];
    float buildMs = 0;
};

World::~World() { delete impl; }

static inline float chunkSpan() { return World::SIZE / (float)World::CHUNKS; }

void buildTerrainMesh(World& w) {
    if (!w.impl) w.impl = new World::Impl();
    const int G = World::GRID;
    const int C = World::CHUNKS;
    const int cellsPerChunk = (G - 1) / C;      // 48
    for (int cz = 0; cz < C; cz++) {
        for (int cx = 0; cx < C; cx++) {
            for (int lod = 0; lod < 3; lod++) {
                int stride = 1 << lod;          // 1, 2, 4
                MeshBuilder mb;
                mb.begin();
                int x0 = cx * cellsPerChunk, z0 = cz * cellsPerChunk;
                for (int j = 0; j < cellsPerChunk; j += stride) {
                    for (int i = 0; i < cellsPerChunk; i += stride) {
                        int gx = x0 + i, gz = z0 + j;
                        if (gx + stride >= G || gz + stride >= G) continue;
                        float wx0 = -World::SIZE * 0.5f + gx * w.cell;
                        float wz0 = -World::SIZE * 0.5f + gz * w.cell;
                        float wx1 = wx0 + stride * w.cell;
                        float wz1 = wz0 + stride * w.cell;
                        float h00 = w.height[(size_t)gz * G + gx];
                        float h10 = w.height[(size_t)gz * G + gx + stride];
                        float h01 = w.height[(size_t)(gz + stride) * G + gx];
                        float h11 = w.height[(size_t)(gz + stride) * G + gx + stride];
                        size_t ci = (size_t)(gz + stride / 2) * G + gx + stride / 2;
                        Region reg = (Region)w.regionMask[ci];
                        float havg = (h00 + h10 + h01 + h11) * 0.25f;
                        mb.setMaterial(matForTerrain(w, havg, reg));
                        float var = w.vegDensity[ci] / 255.0f;
                        Vec4 c1(var, havg * 0.002f, 0, 1), c2(var, 0, 0, 1);
                        // two triangles, slightly inset to avoid cracks at LOD seams
                        uint32_t a = mb.vert(Vec3(wx0, h00, wz0), Vec3(0, 1, 0), Vec2(wx0 * 0.06f, wz0 * 0.06f), c1);
                        uint32_t b = mb.vert(Vec3(wx1, h10, wz0), Vec3(0, 1, 0), Vec2(wx1 * 0.06f, wz0 * 0.06f), c2);
                        uint32_t c = mb.vert(Vec3(wx1, h11, wz1), Vec3(0, 1, 0), Vec2(wx1 * 0.06f, wz1 * 0.06f), c1);
                        uint32_t d = mb.vert(Vec3(wx0, h01, wz1), Vec3(0, 1, 0), Vec2(wx0 * 0.06f, wz1 * 0.06f), c2);
                        mb.quad(a, b, c, d);
                    }
                }
                mb.build(false);
                w.impl->terrain[cz * C + cx][lod] = mb.mesh;
            }
        }
    }
}

void buildRoadMeshes(World& w) {
    MeshBuilder mb;
    mb.begin();
    for (const Road& r : w.roads) {
        int mat = matNamed(r.surface == Surface::Concrete ? "road_concrete"
                       : r.surface == Surface::Dirt ? "road_dirt"
                       : r.surface == Surface::Gravel ? "road_gravel" : "road_asphalt");
        mb.setMaterial(mat);
        float v = 0.0f;
        for (size_t i = 1; i < r.pts.size(); i++) {
            Vec3 a = r.pts[i - 1], b = r.pts[i];
            Vec3 dir = Vec3(b.x - a.x, 0, b.z - a.z);
            float seg = dir.length();
            if (seg < 1e-4f) continue;
            dir = dir * (1.0f / seg);
            Vec3 sideV(-dir.z, 0, dir.x);
            float hw = r.halfWidth;
            Vec3 a0 = a - sideV * hw, a1 = a + sideV * hw;
            Vec3 b0 = b - sideV * hw, b1 = b + sideV * hw;
            a0.y = a.y; a1.y = a.y; b0.y = b.y; b1.y = b.y;
            float v0 = v * 0.125f, v1 = (v + seg) * 0.125f;
            uint32_t ia = mb.vert(a0, Vec3(0, 1, 0), Vec2(0, v0));
            uint32_t ib = mb.vert(a1, Vec3(0, 1, 0), Vec2(1, v0));
            uint32_t ic = mb.vert(b1, Vec3(0, 1, 0), Vec2(1, v1));
            uint32_t id = mb.vert(b0, Vec3(0, 1, 0), Vec2(0, v1));
            mb.quad(ia, id, ic, ib);   // winding matches the terrain convention
            v += seg;
        }
    }
    mb.build(false);
    w.impl->roads = mb.mesh;

    // sea plane: a coarse disc that follows the camera is built per frame, but a
    // static 6 km plane is fine for the depth-tested pass
    MeshBuilder wb;
    wb.begin();
    wb.setMaterial(matNamed("water"));
    float S = World::SIZE;
    wb.quad(wb.vert(Vec3(-S, 0, -S), Vec3(0, 1, 0), Vec2(0, 0)),
            wb.vert(Vec3(-S, 0, S), Vec3(0, 1, 0), Vec2(0, 1)),
            wb.vert(Vec3(S, 0, S), Vec3(0, 1, 0), Vec2(1, 1)),
            wb.vert(Vec3(S, 0, -S), Vec3(0, 1, 0), Vec2(1, 0)));
    wb.build(false);
    w.impl->water = wb.mesh;
}

void World::buildStaticMeshes() {
    if (!impl) impl = new Impl();
    buildTerrainMesh(*this);
    buildRoadMeshes(*this);
    // prop meshes
    impl->treeVariants[0] = makePine(0);
    impl->treeVariants[1] = makeBroadleaf(1);
    impl->treeVariants[2] = makeBroadleaf(2);
    impl->propMesh[PropTree] = impl->treeVariants[0];
    impl->propMesh[PropPalm] = makePalm();
    impl->propMesh[PropRock] = makeRock();
    for (int i = 0; i < 12; i++) impl->buildingVariants[i] = makeBuilding(i);
    impl->propMesh[PropBuilding] = impl->buildingVariants[0];
    impl->propMesh[PropLamp] = makeLamp();
    impl->propMesh[PropSign] = makeSign();
    impl->propMesh[PropBarrier] = makeBarrier();
    impl->propMesh[PropGrandstand] = makeGrandstand();
    impl->propMesh[PropStage] = makeStageBig();
    impl->propMesh[PropContainer] = makeBuilding(4);
    impl->propMesh[PropKerbBlock] = makeRock();
    impl->propMesh[PropCone] = makeCone();
    // variant meshes for buildings/trees live in one table keyed by variant
    // buckets
    const int BN = Impl::BN;
    for (int i = 0; i < BN * BN; i++) impl->buckets[i].clear();
    for (size_t i = 0; i < props.size(); i++) {
        int bx = (int)clampf((props[i].pos.x + SIZE * 0.5f) / Impl::BUCKET, 0.0f, (float)BN - 1);
        int bz = (int)clampf((props[i].pos.z + SIZE * 0.5f) / Impl::BUCKET, 0.0f, (float)BN - 1);
        impl->buckets[bz * BN + bx].push_back((uint16_t)i);
    }
}

void World::draw(Renderer& r, const Camera& cam, float viewDistance, DrawStats* drawStats) const {
    if (!impl) return;
    Vec3 fwd = cam.forward();
    int chunksDrawn = 0;
    const float chunk = chunkSpan();
    // ---- terrain: pick LOD per chunk, cull by distance and a generous frustum
    for (int cz = 0; cz < CHUNKS; cz++) {
        for (int cx = 0; cx < CHUNKS; cx++) {
            float x0 = -SIZE * 0.5f + cx * chunk, z0 = -SIZE * 0.5f + cz * chunk;
            Vec3 c(x0 + chunk * 0.5f, 0, z0 + chunk * 0.5f);
            float d = distance(Vec3(cam.pos.x, 0, cam.pos.z), Vec3(c.x, 0, c.z));
            if (d > viewDistance + chunk) continue;
            Vec3 toC = (c - cam.pos);
            if (d > chunk * 1.2f) {
                float f = toC.dot(fwd);
                if (f < -chunk * 0.35f) continue;
                if (f < d * 0.30f) continue;   // outside a ~72 degree half-angle
            }
            int lod = d < 380.0f ? 0 : (d < 900.0f ? 1 : 2);
            const Mesh& m = impl->terrain[cz * CHUNKS + cx][lod];
            if (m.idx.empty()) continue;
            r.mesh(m, Mat4::identity(), -1);
            chunksDrawn++;
        }
    }
    // ---- roads (single merged mesh; the network is ~2% of the terrain budget)
    if (!impl->roads.idx.empty()) r.mesh(impl->roads, Mat4::identity(), -1);
    // ---- sea: only when the camera is actually on the coast, otherwise the
    // 6 km plane shows through every gap in the distance culling
    if (!impl->water.idx.empty() && cam.pos.x < -700.0f) r.mesh(impl->water, Mat4::identity(), -1);
    if (drawStats) {
        drawStats->roadTris = (int)impl->roads.triCount();
        drawStats->waterTris = (int)impl->water.triCount();
        drawStats->terrainChunks = chunksDrawn;
    }
    // ---- props from the spatial buckets around the camera
    const int BN = Impl::BN;
    int cbx = (int)clampf((cam.pos.x + SIZE * 0.5f) / Impl::BUCKET, 0.0f, (float)BN - 1);
    int cbz = (int)clampf((cam.pos.z + SIZE * 0.5f) / Impl::BUCKET, 0.0f, (float)BN - 1);
    const float propDist = std::min(viewDistance * 0.55f, 420.0f);
    int submitted = 0;
    for (int dz = -1; dz <= 1; dz++) {
        for (int dx = -1; dx <= 1; dx++) {
            int bx = cbx + dx, bz = cbz + dz;
            if (bx < 0 || bz < 0 || bx >= BN || bz >= BN) continue;
            for (uint32_t pi : impl->buckets[bz * BN + bx]) {
                const Prop& p = props[pi];
                Vec3 d = p.pos - cam.pos;
                d.y *= 0.55f;                      // props are tall; use a squashed test
                float dist = d.length();
                if (dist > propDist * (p.type == PropBuilding ? 1.6f : 1.0f)) continue;
                if (dist > 40.0f && d.dot(fwd) < dist * 0.18f) continue;
                const Mesh* mesh = nullptr;
                if (p.type == PropBuilding) mesh = &impl->buildingVariants[p.variant % 12];
                else if (p.type == PropTree && p.variant < 3) mesh = &impl->treeVariants[p.variant];
                else if (p.type < PropCount) mesh = &impl->propMesh[p.type];
                if (!mesh || mesh->idx.empty()) continue;
                Mat4 scale = Mat4::identity();
                scale.m[0] = scale.m[5] = scale.m[10] = p.scale;
                Mat4 xf = Mat4::translation(p.pos) * Mat4::rotationY(p.yaw) * scale;
                r.mesh(*mesh, xf, -1);
                submitted++;
            }
        }
    }
}

} // namespace hv
