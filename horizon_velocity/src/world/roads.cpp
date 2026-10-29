// HORIZON VELOCITY - road network: spline sampling, terrain carving, meshing.
#include "world/world.h"
#include "render/materials.h"
#include "render/mesh.h"
#include <algorithm>
#include <cmath>

namespace hv {

// ---------------------------------------------------------------------------
// Catmull-Rom through the control points, resampled to a fixed arc-length step.
// ---------------------------------------------------------------------------
static std::vector<Vec3> sampleSpline(const std::vector<Vec2>& ctrl, bool closed, float spacing) {
    std::vector<Vec3> out;
    int n = (int)ctrl.size();
    if (n < 2) return out;
    auto P = [&](int i) -> Vec2 {
        if (closed) return ctrl[((i % n) + n) % n];
        return ctrl[std::max(0, std::min(n - 1, i))];
    };
    int segs = closed ? n : n - 1;
    for (int s = 0; s < segs; s++) {
        Vec2 p0 = P(s - 1), p1 = P(s), p2 = P(s + 1), p3 = P(s + 2);
        float len = (p2 - p1).length();
        int steps = std::max(2, (int)std::ceil(len / spacing));
        for (int i = 0; i < steps; i++) {
            float t = (float)i / (float)steps;
            float t2 = t * t, t3 = t2 * t;
            Vec2 p = 0.5f * ((2.0f * p1) + (p2 - p0) * t +
                             ((2.0f * p0) - (5.0f * p1) + (4.0f * p2) - p3) * t2 +
                             ((3.0f * p1) - p0 - (3.0f * p2) + p3) * t3);
            out.push_back(Vec3(p.x, 0.0f, p.y));
        }
    }
    if (!closed) out.push_back(Vec3(ctrl[n - 1].x, 0.0f, ctrl[n - 1].y));
    else {
        // close the loop by re-appending the first sample
        out.push_back(out.front());
    }
    return out;
}

// ---------------------------------------------------------------------------
// Road network of Aurora Coast
// ---------------------------------------------------------------------------
static void addRoad(World& w, const char* name, std::vector<Vec2> ctrl, float halfWidth,
                    Surface surf, bool closed, bool highway, float speedLimit) {
    Road r;
    r.name = name;
    r.halfWidth = halfWidth;
    r.surface = surf;
    r.racing = closed && !highway;
    r.highway = highway;
    r.speedLimit = speedLimit;
    r.pts = sampleSpline(ctrl, closed, 5.0f);
    if (r.pts.size() < 4) return;
    w.roads.push_back(std::move(r));
}

void buildRoadNetwork(World& w, const Noise& n) {
    (void)n;
    // ---- the coastal ring: the backbone of the map
    addRoad(w, "Aurora Coastal Highway", {
        {-1520, 980}, {-1300, 300}, {-1180, -420}, {-820, -980}, {-260, -1220},
        {380, -1140}, {900, -820}, {1210, -320}, {1300, 460}, {960, 1080},
        {260, 1420}, {-520, 1360}, {-1120, 1240}
    }, 6.5f, Surface::Asphalt, true, true, 130.0f);

    // ---- mountain pass climbing into the Silver Mountains
    addRoad(w, "Silver Pass", {
        {380, -1140}, {520, -1520}, {780, -1820}, {1080, -1980}, {1360, -1760},
        {1420, -1280}, {1240, -640}
    }, 5.0f, Surface::Asphalt, false, false, 80.0f);

    // ---- desert loop east of the city
    addRoad(w, "Redstone Run", {
        {1210, -320}, {1700, 60}, {2200, 210}, {2540, 650}, {2300, 1150},
        {1700, 1240}, {1300, 460}
    }, 5.5f, Surface::Asphalt, true, false, 120.0f);

    // ---- farm roads to the south
    addRoad(w, "Golden Farm Loop", {
        {-520, 1360}, {-700, 1720}, {-450, 2100}, {100, 2400}, {620, 2200},
        {520, 1720}, {260, 1420}
    }, 4.2f, Surface::Asphalt, true, false, 80.0f);
    addRoad(w, "Mill Road", {
        {-450, 2100}, {-900, 2050}, {-1250, 1800}, {-1120, 1240}
    }, 3.6f, Surface::Dirt, false, false, 60.0f);

    // ---- Aurora City grid
    for (int i = -3; i <= 3; i++) {
        float off = i * 190.0f;
        char buf[64];
        std::snprintf(buf, sizeof buf, "Aurora %d%s Street", std::abs(i) * 2 + 1,
                      i < 0 ? " West" : (i > 0 ? " East" : " Central"));
        addRoad(w, buf, {{off, -700}, {off, -350}, {off, 0}, {off, 350}, {off, 700}},
                4.0f, Surface::Concrete, false, false, 50.0f);
        std::snprintf(buf, sizeof buf, "Aurora %d%s Avenue", std::abs(i) * 2 + 1,
                      i < 0 ? " South" : (i > 0 ? " North" : " Central"));
        addRoad(w, buf, {{-700, off}, {-350, off}, {0, off}, {350, off}, {700, off}},
                4.0f, Surface::Concrete, false, false, 50.0f);
    }

    // ---- Grand Motorsport Park circuit
    {
        std::vector<Vec2> circle;
        const int k = 12;
        for (int i = 0; i < k; i++) {
            float a = TAU * (float)i / (float)k;
            float rx = 240.0f + std::cos(a * 3.0f) * 34.0f;
            float rz = 190.0f + std::sin(a * 2.0f) * 26.0f;
            circle.push_back(Vec2(1500.0f + std::cos(a) * rx, -620.0f + std::sin(a) * rz));
        }
        addRoad(w, "Grand Motorsport Park Circuit", circle, 6.0f, Surface::Asphalt, true, false, 200.0f);
        // pit lane / link road back to the highway
        addRoad(w, "Paddock Link", {{1500, -300}, {1420, -180}, {1240, -640}}, 4.5f,
                Surface::Asphalt, false, false, 60.0f);
    }

    // ---- Velocity Festival Grounds access
    addRoad(w, "Festival Boulevard", {{-1180, -420}, {-1000, 60}, {-780, 430}, {-560, 620}},
            5.0f, Surface::Asphalt, false, false, 70.0f);
    addRoad(w, "Festival Loop", {{-900, 330}, {-780, 250}, {-660, 330}, {-700, 470}, {-840, 520}},
            4.0f, Surface::Asphalt, true, false, 50.0f);

    // ---- dirt trails in the forest and desert
    addRoad(w, "Greenvale Trail", {
        {900, 820}, {1050, 980}, {1180, 1200}, {1320, 1380}, {1120, 1560}, {880, 1420}
    }, 3.2f, Surface::Dirt, false, false, 60.0f);
    addRoad(w, "Redstone Wash", {
        {1900, 700}, {2050, 950}, {1980, 1250}, {2140, 1500}, {2400, 1400}
    }, 3.4f, Surface::Dirt, false, false, 60.0f);
}

// ---------------------------------------------------------------------------
// Terrain carving: flatten the height field into the road corridor and record
// per-cell surface + a reference to the exact road sample.
// ---------------------------------------------------------------------------
void carveRoads(World& w) {
    const int G = World::GRID;
    w.roadRefId.assign((size_t)G * G, 0);
    w.roadRefSample.assign((size_t)G * G, -1);
    std::vector<float> weight((size_t)G * G, 0.0f);
    std::vector<float> target((size_t)G * G, 0.0f);

    // 1. road centre-line heights follow the terrain, smoothed and slope-limited
    for (Road& r : w.roads) {
        int n = (int)r.pts.size();
        for (int i = 0; i < n; i++) r.pts[i].y = w.heightAt(r.pts[i].x, r.pts[i].z);
        for (int pass = 0; pass < 3; pass++) {
            std::vector<float> tmp(n);
            for (int i = 0; i < n; i++) {
                float sum = 0.0f;
                int cnt = 0;
                for (int k = -3; k <= 3; k++) {
                    int j = std::max(0, std::min(n - 1, i + k));
                    sum += r.pts[j].y;
                    cnt++;
                }
                tmp[i] = sum / (float)cnt;
            }
            for (int i = 0; i < n; i++) r.pts[i].y = tmp[i];
        }
        // limit the gradient to ~12% so roads do not launch cars
        for (int i = 1; i < n; i++) {
            float ds = Vec3(r.pts[i].x - r.pts[i - 1].x, 0, r.pts[i].z - r.pts[i - 1].z).length();
            float maxDy = std::max(0.6f, ds * 0.12f);
            float dy = r.pts[i].y - r.pts[i - 1].y;
            if (dy > maxDy) r.pts[i].y = r.pts[i - 1].y + maxDy;
            if (dy < -maxDy) r.pts[i].y = r.pts[i - 1].y - maxDy;
        }
        // lift the whole road slightly so it never sinks under the terrain
        for (int i = 0; i < n; i++) r.pts[i].y += 0.10f;
        w.stats.roadSamples += n;
        for (int i = 1; i < n; i++)
            w.stats.roadLengthKm += Vec3(r.pts[i].x - r.pts[i - 1].x, 0, r.pts[i].z - r.pts[i - 1].z).length() * 0.001f;
    }

    // 2. stamp the corridor into the height grid
    for (size_t ri = 0; ri < w.roads.size(); ri++) {
        const Road& r = w.roads[ri];
        float outer = r.halfWidth + 6.0f;
        for (size_t si = 0; si < r.pts.size(); si++) {
            const Vec3& p = r.pts[si];
            int x0 = (int)std::floor((p.x - outer + World::SIZE * 0.5f) / w.cell);
            int x1 = (int)std::ceil((p.x + outer + World::SIZE * 0.5f) / w.cell);
            int z0 = (int)std::floor((p.z - outer + World::SIZE * 0.5f) / w.cell);
            int z1 = (int)std::ceil((p.z + outer + World::SIZE * 0.5f) / w.cell);
            x0 = std::max(0, x0); z0 = std::max(0, z0);
            x1 = std::min(G - 1, x1); z1 = std::min(G - 1, z1);
            for (int iz = z0; iz <= z1; iz++) {
                float cz = -World::SIZE * 0.5f + iz * w.cell;
                for (int ix = x0; ix <= x1; ix++) {
                    float cx = -World::SIZE * 0.5f + ix * w.cell;
                    float d = std::sqrt(sqr(cx - p.x) + sqr(cz - p.z));
                    if (d > outer) continue;
                    float wt = 1.0f - smoothstepf(r.halfWidth - 0.5f, outer, d);
                    size_t i = (size_t)iz * G + ix;
                    if (wt > weight[i]) {
                        weight[i] = wt;
                        target[i] = p.y;
                        w.roadRefId[i] = (uint8_t)(ri + 1);
                        w.roadRefSample[i] = (int32_t)si;
                    }
                    if (d < r.halfWidth + 1.0f) {
                        w.roadMask[i] = 255;
                        w.surfMask[i] = (uint8_t)r.surface;
                    } else if (d < r.halfWidth + 4.0f) {
                        w.roadMask[i] = std::max<uint8_t>(w.roadMask[i], 120);
                        w.surfMask[i] = (uint8_t)Surface::Gravel;
                    }
                }
            }
        }
    }

    // 3. blend the terrain towards the road
    for (size_t i = 0; i < (size_t)G * G; i++) {
        if (weight[i] <= 0.0f) continue;
        float wt = std::min(1.0f, weight[i] * 1.15f);
        w.height[i] = lerpf(w.height[i], target[i], wt);
    }
}

bool World::roadSurfaceAt(float x, float z, float& outY) const {
    int ix = (int)((x + SIZE * 0.5f) / cell);
    int iz = (int)((z + SIZE * 0.5f) / cell);
    if (ix < 0 || iz < 0 || ix >= GRID || iz >= GRID) return false;
    size_t i = (size_t)iz * GRID + ix;
    uint8_t rid = roadRefId.empty() ? 0 : roadRefId[i];
    if (!rid || roadMask[i] < 96) return false;
    const Road& r = roads[rid - 1];
    int si = roadRefSample[i];
    if (si < 0 || si >= (int)r.pts.size()) return false;
    // project onto the two adjacent segments and interpolate the exact height
    float best = 1e18f, y = r.pts[si].y;
    for (int k = -1; k <= 0; k++) {
        int a = si + k, b = a + 1;
        if (a < 0 || b >= (int)r.pts.size()) continue;
        Vec3 pa = r.pts[a], pb = r.pts[b];
        float dx = pb.x - pa.x, dz = pb.z - pa.z;
        float len2 = dx * dx + dz * dz;
        if (len2 < 1e-6f) continue;
        float t = clampf(((x - pa.x) * dx + (z - pa.z) * dz) / len2, 0.0f, 1.0f);
        float px = pa.x + dx * t, pz = pa.z + dz * t;
        float d2 = sqr(x - px) + sqr(z - pz);
        if (d2 < best) {
            best = d2;
            y = lerpf(pa.y, pb.y, t);
        }
    }
    outY = y;
    return true;
}

} // namespace hv
