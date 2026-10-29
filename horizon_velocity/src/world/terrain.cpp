// HORIZON VELOCITY - terrain generation and surface queries.
#include "world/world.h"
#include <algorithm>
#include <cmath>
#include <cstring>

namespace hv {

const char* regionName(Region r) {
    switch (r) {
        case Region::AuroraCity: return "Aurora City";
        case Region::AzureCoast: return "Azure Coast";
        case Region::SilverMountains: return "Silver Mountains";
        case Region::GreenvaleForest: return "Greenvale Forest";
        case Region::RedstoneDesert: return "Redstone Desert";
        case Region::GoldenFarmland: return "Golden Farmlands";
        case Region::FestivalGrounds: return "Velocity Festival Grounds";
        case Region::MotorsportPark: return "Grand Motorsport Park";
        default: return "Aurora Coast";
    }
}

Vec3 regionCenter(Region r) {
    switch (r) {
        case Region::AuroraCity: return Vec3(0, 0, 0);
        case Region::AzureCoast: return Vec3(-1200, 0, 900);
        case Region::SilverMountains: return Vec3(200, 0, -2100);
        case Region::GreenvaleForest: return Vec3(1200, 0, 1350);
        case Region::RedstoneDesert: return Vec3(2200, 0, 200);
        case Region::GoldenFarmland: return Vec3(-400, 0, 2100);
        case Region::FestivalGrounds: return Vec3(-780, 0, 430);
        case Region::MotorsportPark: return Vec3(1500, 0, -620);
        default: return Vec3(0, 0, 0);
    }
}

const char* surfaceName(Surface s) {
    switch (s) {
        case Surface::Asphalt: return "Asphalt";
        case Surface::AsphaltWet: return "Wet Asphalt";
        case Surface::Concrete: return "Concrete";
        case Surface::Gravel: return "Gravel";
        case Surface::Dirt: return "Dirt";
        case Surface::Sand: return "Sand";
        case Surface::Grass: return "Grass";
        case Surface::Snow: return "Snow";
        case Surface::Rock: return "Rock";
        default: return "?";
    }
}

bool WorldQueryImpl::collideSphere(const Vec3& c, float radius, Vec3& n, float& pen) const {
    float h = w->heightAt(c.x, c.z);
    if (c.y - radius < h) {
        n = w->normalAt(c.x, c.z);
        pen = h - (c.y - radius);
        return true;
    }
    return false;
}

// ---------------------------------------------------------------------------
// Terrain shape
// ---------------------------------------------------------------------------
static float regionNoise(const Noise& n, float x, float z) {
    return n.fbm2(x, z, 4, 2.03f, 0.5f);
}

// Smooth, deterministic height field for the whole island.
static float baseHeight(const Noise& n, float x, float z) {
    float h = 7.0f + regionNoise(n, x * 0.0016f, z * 0.0016f) * 26.0f
                   + n.fbm2(x * 0.0060f, z * 0.0060f, 3) * 5.5f;

    // Silver Mountains to the north: ridged noise lifted onto a plateau.
    float m = smoothstepf(-1150.0f, -2250.0f, z);
    if (m > 0.0f) {
        float r = n.ridged2(x * 0.00085f, z * 0.00085f, 5);
        h += m * (120.0f + r * 250.0f + n.fbm2(x * 0.004f, z * 0.004f, 3) * 18.0f);
        // snow line handled by the shader/tint, not the height
    }
    // Redstone Desert to the east: dunes, much flatter.
    float d = smoothstepf(1750.0f, 2450.0f, x) * (1.0f - m);
    if (d > 0.0f) {
        float dune = 26.0f + std::sin(x * 0.010f + z * 0.004f) * 4.5f
                   + n.fbm2(x * 0.0022f, z * 0.0022f, 3) * 9.0f;
        h = lerpf(h, dune, d * 0.85f);
    }
    // Golden Farmlands to the south: gentle terraces.
    float f = smoothstepf(1550.0f, 2250.0f, z);
    if (f > 0.0f) {
        float farm = 11.0f + n.fbm2(x * 0.0030f, z * 0.0030f, 3) * 4.0f;
        h = lerpf(h, farm, f * 0.80f);
    }
    // Azure Coast: the sea floor drops away to the west.
    float sea = smoothstepf(-1420.0f, -1780.0f, x);
    if (sea > 0.0f) h = lerpf(h, -22.0f, sea);
    // Aurora City sits on a levelled plain.
    float cd = std::sqrt(x * x + z * z * 1.25f);
    float c = 1.0f - smoothstepf(520.0f, 790.0f, cd);
    if (c > 0.0f) h = lerpf(h, 13.0f, c);
    // Velocity Festival Grounds: a level pad on the coast road.
    Vec3 fg = regionCenter(Region::FestivalGrounds);
    float fgd = std::sqrt(sqr(x - fg.x) + sqr(z - fg.z));
    float fp = 1.0f - smoothstepf(90.0f, 190.0f, fgd);
    if (fp > 0.0f) h = lerpf(h, 11.0f, fp);
    // Grand Motorsport Park: the circuit infield is levelled.
    Vec3 mp = regionCenter(Region::MotorsportPark);
    float mpd = std::sqrt(sqr(x - mp.x) + sqr(z - mp.z));
    float mpad = 1.0f - smoothstepf(150.0f, 300.0f, mpd);
    if (mpad > 0.0f) h = lerpf(h, 22.0f, mpad);
    return h;
}

float World::heightAt(float x, float z) const {
    float roadY = 0.0f;
    if (roadSurfaceAt(x, z, roadY)) return roadY;
    float fx = (x + SIZE * 0.5f) / cell;
    float fz = (z + SIZE * 0.5f) / cell;
    if (fx < 0 || fz < 0 || fx >= GRID - 1 || fz >= GRID - 1) return -30.0f;
    int ix = (int)fx, iz = (int)fz;
    float tx = fx - ix, tz = fz - iz;
    const float* r0 = &height[(size_t)iz * GRID + ix];
    const float* r1 = r0 + GRID;
    float a = lerpf(r0[0], r0[1], tx);
    float b = lerpf(r1[0], r1[1], tx);
    return lerpf(a, b, tz);
}

Vec3 World::normalAt(float x, float z) const {
    float e = cell;
    float hl = heightAt(x - e, z), hr = heightAt(x + e, z);
    float hd = heightAt(x, z - e), hu = heightAt(x, z + e);
    Vec3 n(hl - hr, 2.0f * e, hd - hu);
    return n.normalized();
}

Surface World::surfaceAt(float x, float z) const {
    int ix = (int)((x + SIZE * 0.5f) / cell);
    int iz = (int)((z + SIZE * 0.5f) / cell);
    if (ix < 0 || iz < 0 || ix >= GRID || iz >= GRID) return Surface::Sand;
    size_t i = (size_t)iz * GRID + ix;
    if (roadMask[i] > 96) return (Surface)surfMask[i];
    float h = height[i];
    if (h < 0.6f) return Surface::Sand;
    Region r = (Region)regionMask[i];
    if (h > 260.0f) return Surface::Snow;
    switch (r) {
        case Region::RedstoneDesert: return h < 4.0f ? Surface::Sand : Surface::Dirt;
        case Region::AzureCoast: return h < 3.2f ? Surface::Sand : Surface::Grass;
        case Region::SilverMountains: return h > 120.0f ? Surface::Gravel : Surface::Grass;
        case Region::AuroraCity: return Surface::Concrete;
        case Region::MotorsportPark: return Surface::Gravel;
        default: return Surface::Grass;
    }
}

Region World::regionAt(float x, float z) const {
    int ix = (int)((x + SIZE * 0.5f) / cell);
    int iz = (int)((z + SIZE * 0.5f) / cell);
    if (ix < 0 || iz < 0 || ix >= GRID || iz >= GRID) return Region::AzureCoast;
    return (Region)regionMask[(size_t)iz * GRID + ix];
}

bool World::isRoad(const Vec3& p, float margin) const {
    int ix = (int)((p.x + SIZE * 0.5f) / cell);
    int iz = (int)((p.z + SIZE * 0.5f) / cell);
    if (ix < 1 || iz < 1 || ix >= GRID - 1 || iz >= GRID - 1) return false;
    float m = margin > 0.0f ? 40.0f : 96.0f;
    return roadMask[(size_t)iz * GRID + ix] > m;
}

bool World::nearestRoad(const Vec3& p, Vec3& outPoint, Vec3& outDir, float maxDist) const {
    float best = maxDist * maxDist;
    bool found = false;
    for (const Road& r : roads) {
        if (r.pts.size() < 2) continue;
        for (size_t i = 0; i < r.pts.size(); i += 4) {
            const Vec3& a = r.pts[i];
            float d2 = sqr(a.x - p.x) + sqr(a.z - p.z);
            if (d2 < best) {
                best = d2;
                outPoint = a;
                const Vec3& b = r.pts[std::min(i + 4, r.pts.size() - 1)];
                outDir = Vec3(b.x - a.x, 0, b.z - a.z).normalized();
                found = true;
            }
        }
    }
    return found;
}

int Road::nearest(const Vec3& p, float& outT) const {
    int best = -1;
    float bd = 1e18f;
    for (size_t i = 0; i < pts.size(); i++) {
        float d = sqr(pts[i].x - p.x) + sqr(pts[i].z - p.z);
        if (d < bd) { bd = d; best = (int)i; }
    }
    outT = (float)best / std::max(1.0f, (float)pts.size() - 1.0f);
    return best;
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------
void World::generate(uint64_t s) {
    seed = s;
    Noise n;
    n.init((uint32_t)(s * 2654435761u));
    cell = SIZE / (GRID - 1);

    height.assign((size_t)GRID * GRID, 0.0f);
    roadMask.assign((size_t)GRID * GRID, 0);
    surfMask.assign((size_t)GRID * GRID, (uint8_t)Surface::Grass);
    regionMask.assign((size_t)GRID * GRID, (uint8_t)Region::AuroraCity);
    vegDensity.assign((size_t)GRID * GRID, 0);

    stats = Stats();
    // ---- heights + regions
    for (int iz = 0; iz < GRID; iz++) {
        float z = -SIZE * 0.5f + iz * cell;
        for (int ix = 0; ix < GRID; ix++) {
            float x = -SIZE * 0.5f + ix * cell;
            float h = baseHeight(n, x, z);
            size_t i = (size_t)iz * GRID + ix;
            height[i] = h;
            // region assignment, nearest-centre with shape overrides
            Region r = Region::AuroraCity;
            float cd = std::sqrt(x * x + z * z * 1.25f);
            if (cd < 820.0f) r = Region::AuroraCity;
            else if (x < -1380.0f) r = Region::AzureCoast;
            else if (z < -1250.0f) r = Region::SilverMountains;
            else if (x > 1750.0f) r = Region::RedstoneDesert;
            else if (z > 1500.0f) r = Region::GoldenFarmland;
            else if (x > 250.0f && z > 620.0f) r = Region::GreenvaleForest;
            else r = Region::GreenvaleForest;
            Vec3 fg = regionCenter(Region::FestivalGrounds);
            if (std::sqrt(sqr(x - fg.x) + sqr(z - fg.z)) < 210.0f) r = Region::FestivalGrounds;
            Vec3 mp = regionCenter(Region::MotorsportPark);
            if (std::sqrt(sqr(x - mp.x) + sqr(z - mp.z)) < 330.0f) r = Region::MotorsportPark;
            regionMask[i] = (uint8_t)r;
            // vegetation density: forest dense, desert empty, farmland sparse
            float v = 0.0f;
            switch (r) {
                case Region::GreenvaleForest: v = 0.85f; break;
                case Region::SilverMountains: v = h > 200.0f ? 0.05f : 0.55f; break;
                case Region::GoldenFarmland: v = 0.16f; break;
                case Region::RedstoneDesert: v = 0.05f; break;
                case Region::AzureCoast: v = 0.30f; break;
                case Region::AuroraCity: v = 0.06f; break;
                case Region::MotorsportPark: v = 0.10f; break;
                default: v = 0.4f; break;
            }
            if (h < 1.5f) v *= 0.15f;
            v *= 0.55f + 0.45f * n.fbm2(x * 0.004f, z * 0.004f, 2);
            vegDensity[i] = (uint8_t)(clampf(v, 0.0f, 1.0f) * 255.0f);
            stats.minH = std::min(stats.minH, h);
            stats.maxH = std::max(stats.maxH, h);
        }
    }

    buildRoadNetwork(*this, n);
    carveRoads(*this);
    buildProps(*this, n);

    // final surface pass
    for (int iz = 0; iz < GRID; iz++)
        for (int ix = 0; ix < GRID; ix++) {
            size_t i = (size_t)iz * GRID + ix;
            if (roadMask[i] > 96) continue;
            float h = height[i];
            Region r = (Region)regionMask[i];
            Surface sf = Surface::Grass;
            if (h < 0.6f) sf = Surface::Sand;
            else if (h > 260.0f) sf = Surface::Snow;
            else if (r == Region::RedstoneDesert) sf = h < 4.0f ? Surface::Sand : Surface::Dirt;
            else if (r == Region::AzureCoast) sf = h < 3.2f ? Surface::Sand : Surface::Grass;
            else if (r == Region::SilverMountains) sf = h > 120.0f ? Surface::Gravel : Surface::Grass;
            else if (r == Region::AuroraCity) sf = Surface::Concrete;
            surfMask[i] = (uint8_t)sf;
        }
    stats.propCount = (int)props.size();
}

} // namespace hv
