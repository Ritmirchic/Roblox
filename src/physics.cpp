// physics.cpp - debris, structural collapse, rigid structure bodies, vehicles
#include "frac.h"
#include <chrono>

Physics g_phys;
static const float GRAV = 9.81f;

// ------------------------------------------------------------------ helpers
static inline bool voxSolid(World& w, const Vec3& p) {
    int x = int(floorf(p.x / VOXSZ)), y = int(floorf(p.y / VOXSZ)), z = int(floorf(p.z / VOXSZ));
    if (!w.inside(x, y, z)) return false;
    uint8_t m = w.get(x, y, z);
    return m != MAT_AIR && !kMats[m].trans;
}

// ------------------------------------------------------------------ init
void Physics::init() {
    debris.assign(maxDebris, Debris{});
    for (auto& d : debris) d.active = false;
    bodies.clear();
    collapseQueue.clear();
}

void Physics::clearAll() {
    for (auto& d : debris) d.active = false;
    for (auto* b : bodies) delete b;
    bodies.clear();
    collapseQueue.clear();
    activeDebris = 0;
}

Debris* Physics::spawnDebris(const Vec3& pos, const Vec3& vel, const Vec3& half, uint8_t m,
                             const Vec3& angVel) {
    // find a free slot
    for (int i = 0; i < int(debris.size()); i++) {
        if (!debris[i].active) {
            Debris& d = debris[i];
            d.pos = pos;
            d.vel = vel;
            d.half = half;
            d.mat = m;
            d.active = true;
            d.rot = Basis::rotAxis(g_rng.dir(), g_rng.range(0, 6.28f));
            d.angVel = angVel;
            d.life = 0;
            d.maxLife = g_rng.range(9.0f, 16.0f);
            d.resting = 0;
            d.scale = 1.0f;
            activeDebris++;
            return &d;
        }
    }
    // recycle the oldest (smallest life ratio) if over budget
    int best = -1;
    float bestLife = -1;
    for (int i = 0; i < int(debris.size()); i++) {
        float t = debris[i].life / fmaxf(0.1f, debris[i].maxLife);
        if (t > bestLife) { bestLife = t; best = i; }
    }
    if (best >= 0 && maxDebris > 0) {
        Debris& d = debris[best];
        d.pos = pos;
        d.vel = vel;
        d.half = half;
        d.mat = m;
        d.rot = Basis::rotAxis(g_rng.dir(), g_rng.range(0, 6.28f));
        d.angVel = angVel;
        d.life = 0;
        d.resting = 0;
        return &d;
    }
    return nullptr;
}

// ------------------------------------------------------------------ structure body
static void buildBodyMesh(StructBody* b) {
    b->meshVerts.clear();
    b->meshIdx.clear();
    b->meshBatches.clear();
    int w = b->dim.x, h = b->dim.y, d = b->dim.z;
    auto at = [&](int x, int y, int z) -> uint8_t {
        if (x < 0 || y < 0 || z < 0 || x >= w || y >= h || z >= d) return MAT_AIR;
        return b->vox[(z * h + y) * w + x];
    };
    static const int DX[6] = {1, -1, 0, 0, 0, 0};
    static const int DY[6] = {0, 0, 1, -1, 0, 0};
    static const int DZ[6] = {0, 0, 0, 0, 1, -1};
    float halfX = w * VOXSZ * 0.5f, halfY = h * VOXSZ * 0.5f, halfZ = d * VOXSZ * 0.5f;
    for (int z = 0; z < d; z++)
        for (int y = 0; y < h; y++)
            for (int x = 0; x < w; x++) {
                uint8_t m = at(x, y, z);
                if (!m) continue;
                for (int f = 0; f < 6; f++) {
                    uint8_t nm = at(x + DX[f], y + DY[f], z + DZ[f]);
                    bool vis = kMats[m].trans ? (nm != m && (nm == MAT_AIR || !kMats[nm].trans))
                                              : (nm == MAT_AIR || kMats[nm].trans);
                    if (!vis) continue;
                    // local coords centred on body centre
                    float x0 = x * VOXSZ - halfX, y0 = y * VOXSZ - halfY, z0 = z * VOXSZ - halfZ;
                    float x1 = x0 + VOXSZ, y1 = y0 + VOXSZ, z1 = z0 + VOXSZ;
                    Vec3 p[4];
                    Vec3 n = Vec3(float(DX[f]), float(DY[f]), float(DZ[f]));
                    if (f == 0) { p[0] = Vec3(x1, y0, z1); p[1] = Vec3(x1, y0, z0);
                                  p[2] = Vec3(x1, y1, z0); p[3] = Vec3(x1, y1, z1); }
                    else if (f == 1) { p[0] = Vec3(x0, y0, z0); p[1] = Vec3(x0, y0, z1);
                                       p[2] = Vec3(x0, y1, z1); p[3] = Vec3(x0, y1, z0); }
                    else if (f == 2) { p[0] = Vec3(x0, y1, z1); p[1] = Vec3(x1, y1, z1);
                                       p[2] = Vec3(x1, y1, z0); p[3] = Vec3(x0, y1, z0); }
                    else if (f == 3) { p[0] = Vec3(x0, y0, z0); p[1] = Vec3(x1, y0, z0);
                                       p[2] = Vec3(x1, y0, z1); p[3] = Vec3(x0, y0, z1); }
                    else if (f == 4) { p[0] = Vec3(x0, y0, z1); p[1] = Vec3(x1, y0, z1);
                                       p[2] = Vec3(x1, y1, z1); p[3] = Vec3(x0, y1, z1); }
                    else { p[0] = Vec3(x1, y0, z0); p[1] = Vec3(x0, y0, z0);
                           p[2] = Vec3(x0, y1, z0); p[3] = Vec3(x1, y1, z0); }
                    if (dot(cross(p[1] - p[0], p[2] - p[0]), n) < 0) {
                        std::swap(p[1], p[3]);
                    }
                    if (b->meshBatches.empty() || b->meshBatches.back().mat != m) {
                        ChunkMesh::Batch bb;
                        bb.mat = m;
                        bb.first = int(b->meshIdx.size());
                        bb.count = 0;
                        b->meshBatches.push_back(bb);
                    }
                    uint32_t base = uint32_t(b->meshVerts.size());
                    for (int i = 0; i < 4; i++) {
                        RVert rv;
                        rv.x = p[i].x; rv.y = p[i].y; rv.z = p[i].z;
                        rv.nx = int8_t(n.x); rv.ny = int8_t(n.y); rv.nz = int8_t(n.z);
                        rv.mat = int8_t(m);
                        rv.sun = 1;
                        rv.ao = 0.92f;
                        if (f == 0 || f == 1) { rv.u = p[i].z; rv.v = p[i].y; }
                        else if (f == 2 || f == 3) { rv.u = p[i].x; rv.v = p[i].z; }
                        else { rv.u = p[i].x; rv.v = p[i].y; }
                        b->meshVerts.push_back(rv);
                    }
                    b->meshIdx.push_back(base);
                    b->meshIdx.push_back(base + 1);
                    b->meshIdx.push_back(base + 2);
                    b->meshIdx.push_back(base);
                    b->meshIdx.push_back(base + 2);
                    b->meshIdx.push_back(base + 3);
                    b->meshBatches.back().count += 6;
                }
            }
    for (size_t i = 0; i < b->meshBatches.size(); i++) {
        if (i + 1 < b->meshBatches.size())
            b->meshBatches[i].count = b->meshBatches[i + 1].first - b->meshBatches[i].first;
        else
            b->meshBatches[i].count = int(b->meshIdx.size()) - b->meshBatches[i].first;
    }
}

StructBody* Physics::spawnStructure(const Vec3& center, const Vec3i& dim,
                                    std::vector<uint8_t>& voxels, Basis rot, uint8_t dominant) {
    if (int(bodies.size()) >= maxBodies) {
        // force-settle the oldest small body
        StructBody* oldest = nullptr;
        for (auto* b : bodies)
            if (!oldest || b->age > oldest->age) oldest = b;
        if (oldest) {
            for (auto* d : bodies)
                if (d == oldest) { delete oldest; bodies.erase(std::find(bodies.begin(), bodies.end(), d)); break; }
        }
        if (int(bodies.size()) >= maxBodies) return nullptr;
    }
    StructBody* b = new StructBody();
    b->pos = center;
    b->dim = dim;
    b->vox = voxels;
    b->rot = rot;
    b->dominant = dominant;
    b->alive = true;
    b->age = 0;
    b->vel = Vec3(0, 0, 0);
    b->angVel = Vec3(g_rng.range(-0.25f, 0.25f), g_rng.range(-0.15f, 0.15f),
                     g_rng.range(-0.25f, 0.25f));
    b->half = Vec3(dim.x * VOXSZ * 0.5f, dim.y * VOXSZ * 0.5f, dim.z * VOXSZ * 0.5f);
    int count = 0;
    float volPer = VOXSZ * VOXSZ * VOXSZ;
    float totalMass = 0;
    for (int i = 0; i < int(voxels.size()); i++)
        if (voxels[i]) {
            count++;
            totalMass += kMats[voxels[i]].density * volPer;
        }
    b->voxCount = count;
    b->mass = fmaxf(60.0f, totalMass);
    b->damageAccum = 0;
    b->settled = false;
    buildBodyMesh(b);
    bodies.push_back(b);
    g_collapseEvents++;
    return b;
}

// ------------------------------------------------------------------ update
void Physics::update(float dt, World& w) {
    dt = fminf(dt, 1.0f / 30.0f);
    float grav = GRAV * (g_game.sandboxOpts.gravityScale);
    // ---- debris
    int budget = maxDebris;
    for (int i = 0; i < int(debris.size()) && i < budget; i++) {
        Debris& d = debris[i];
        if (!d.active) continue;
        d.life += dt;
        if (d.life > d.maxLife) {
            // fade-out: settle into nothing (kept simple - rubble remains as voxels)
            d.active = false;
            activeDebris--;
            continue;
        }
        if (d.resting > 2.0f) continue;   // sleeping
        d.vel.y -= grav * dt;
        Vec3 next = d.pos + d.vel * dt;
        float rad = fmaxf(d.half.x, fmaxf(d.half.y, d.half.z));
        // ground / world collision using centre sampling
        bool blocked = false;
        if (voxSolid(w, next)) {
            // try moving back along each axis
            Vec3 tryX(next.x, d.pos.y, d.pos.z), tryZ(d.pos.x, d.pos.y, next.z);
            if (!voxSolid(w, tryX)) {
                d.pos.x = next.x;
                d.vel.x *= 0.1f;
                d.vel.y *= 0.9f;
                d.vel.z *= 0.6f;
            } else if (!voxSolid(w, tryZ)) {
                d.pos.z = next.z;
                d.vel.z *= 0.1f;
                d.vel.y *= 0.9f;
                d.vel.x *= 0.6f;
            } else {
                d.vel.y = -d.vel.y * 0.24f;
                d.vel.x *= 0.6f;
                d.vel.z *= 0.6f;
                d.angVel = d.angVel * 0.5f;
                if (fabsf(d.vel.y) < 1.2f) {
                    d.resting += dt * 3.0f;
                    d.vel.y = 0;
                }
            }
            blocked = true;
        } else {
            d.pos = next;
        }
        // ground plane at 0
        if (d.pos.y - rad < 0) {
            d.pos.y = rad;
            if (d.vel.y < 0) d.vel.y *= -0.25f;
            d.vel.x *= 0.82f;
            d.vel.z *= 0.82f;
            d.angVel = d.angVel * 0.7f;
            d.resting += dt * 2.5f;
        }
        if (!blocked && d.vel.y > -0.2f && fabsf(d.vel.x) < 0.35f && fabsf(d.vel.z) < 0.35f)
            d.resting += dt * 1.6f;
        else
            d.resting = fmaxf(0.0f, d.resting - dt * 0.5f);
        if (d.resting > 0.9f) {
            d.vel = Vec3(0, 0, 0);
            d.angVel = Vec3(0, 0, 0);
        }
        if (length(d.angVel) > 0.001f)
            d.rot = Basis::rotAxis(normalize(d.angVel), length(d.angVel) * dt) * d.rot;
        if (d.pos.y < -20) d.active = false;
    }

    // ---- falling structures
    for (int bi = int(bodies.size()) - 1; bi >= 0; bi--) {
        StructBody* b = bodies[bi];
        b->age += dt;
        if (!b->settled) {
            b->vel.y -= grav * dt;
            Vec3 next = b->pos + b->vel * dt;
            // sample voxel points for collisions
            int step = b->voxCount > 2200 ? 3 : (b->voxCount > 700 ? 2 : 1);
            float deepest = 0;
            Vec3 contactNormal(0, 1, 0);
            Vec3 contactSum(0, 0, 0);
            int contacts = 0;
            int dimX = b->dim.x, dimY = b->dim.y, dimZ = b->dim.z;
            for (int z = 0; z < dimZ; z += step)
                for (int y = 0; y < dimY; y += step)
                    for (int x = 0; x < dimX; x += step) {
                        if (!b->vox[(z * dimY + y) * dimX + x]) continue;
                        Vec3 local((x + 0.5f) * VOXSZ - b->half.x, (y + 0.5f) * VOXSZ - b->half.y,
                                   (z + 0.5f) * VOXSZ - b->half.z);
                        Vec3 wp = b->rot.mul(local) + next;
                        if (wp.y < 0) {
                            float pen = -wp.y;
                            if (pen > deepest) { deepest = pen; contactNormal = Vec3(0, 1, 0); }
                            contactSum += wp;
                            contacts++;
                            continue;
                        }
                        int vx = int(floorf(wp.x / VOXSZ)), vy = int(floorf(wp.y / VOXSZ)),
                            vz = int(floorf(wp.z / VOXSZ));
                        if (vx < 0 || vy < 0 || vz < 0 || vx >= w.dims[0] || vy >= w.dims[1] ||
                            vz >= w.dims[2])
                            continue;
                        uint8_t m = w.get(vx, vy, vz);
                        if (m == MAT_AIR || kMats[m].trans) continue;
                        // penetration depth towards the nearest free face
                        float fx = wp.x - vx * VOXSZ, fy = wp.y - vy * VOXSZ,
                              fz = wp.z - vz * VOXSZ;
                        float pen = fminf(fminf(fx, VOXSZ - fx), fminf(fminf(fy, VOXSZ - fy),
                                                                      fminf(fz, VOXSZ - fz)));
                        Vec3 n(0, 1, 0);
                        float mind = fminf(fminf(fx, VOXSZ - fx),
                                           fminf(fminf(fy, VOXSZ - fy), fminf(fz, VOXSZ - fz)));
                        if (mind == fy) n = Vec3(0, 1, 0);
                        else if (mind == VOXSZ - fy) n = Vec3(0, -1, 0);
                        else if (mind == fx) n = Vec3(1, 0, 0);
                        else if (mind == VOXSZ - fx) n = Vec3(-1, 0, 0);
                        else if (mind == fz) n = Vec3(0, 0, 1);
                        else n = Vec3(0, 0, -1);
                        if (pen > deepest) { deepest = pen; contactNormal = n; }
                        contactSum += wp;
                        contacts++;
                    }
            bool grounded = contacts > 0;
            if (grounded && deepest > 0) {
                b->pos.y += deepest;
                Vec3 vn = contactNormal * dot(b->vel, contactNormal);
                float impactSpeed = fabsf(dot(b->vel, contactNormal));
                b->vel = b->vel - vn * 1.25f;   // restitution 0.25
                // friction
                b->vel.x *= 0.86f;
                b->vel.z *= 0.86f;
                b->angVel = b->angVel * 0.75f;
                if (impactSpeed > 5.0f) {
                    // crushing damage: destroy voxels underneath, kick up dust
                    Vec3 cp = contactSum / float(fmaxf(1, contacts));
                    float power = impactSpeed * sqrtf(b->mass) * 0.06f;
                    int removed = 0;
                    w.carveSphere(cp + Vec3(0, -0.1f, 0),
                                  clampf(0.5f + impactSpeed * 0.09f, 0.5f, 3.2f),
                                  int(6 + power), removed);
                    g_fx.dustCloud(cp, 1.6f + impactSpeed * 0.1f, 14, b->dominant);
                    g_audio.play(SND_RUBBLE, cp, saturate(impactSpeed / 12.0f));
                    g_fx.addShake(saturate(impactSpeed / 25.0f) * 0.6f, 0.4f);
                    // body loses voxels on heavy impact
                    b->damageAccum += impactSpeed * 0.5f;
                }
            } else {
                b->pos = next;
            }
            if (grounded) {
                b->sleepTimer += dt;
                if (b->sleepTimer > 0.85f) {
                    // settle: stamp voxels back into the world as rubble
                    b->settled = true;
                    int stamped = 0;
                    for (int z = 0; z < dimZ; z++)
                        for (int y = 0; y < dimY; y++)
                            for (int x = 0; x < dimX; x++) {
                                uint8_t m = b->vox[(z * dimY + y) * dimX + x];
                                if (!m) continue;
                                Vec3 local((x + 0.5f) * VOXSZ - b->half.x,
                                           (y + 0.5f) * VOXSZ - b->half.y,
                                           (z + 0.5f) * VOXSZ - b->half.z);
                                Vec3 wp = b->rot.mul(local) + b->pos;
                                int vx = int(floorf(wp.x / VOXSZ)), vy = int(floorf(wp.y / VOXSZ)),
                                    vz = int(floorf(wp.z / VOXSZ));
                                if (vx < 1 || vy < 1 || vz < 1 || vx >= w.dims[0] - 1 ||
                                    vy >= w.dims[1] - 1 || vz >= w.dims[2] - 1)
                                    continue;
                                if (w.get(vx, vy, vz) == MAT_AIR) {
                                    w.set(vx, vy, vz, m);
                                    stamped++;
                                }
                            }
                    g_audio.play(SND_RUBBLE, b->pos, 0.6f);
                }
            } else {
                b->sleepTimer = 0;
            }
            if (length(b->angVel) > 0.001f)
                b->rot = Basis::rotAxis(normalize(b->angVel), length(b->angVel) * dt) * b->rot;
            b->rot.orthonormalize();
        }
        if (b->age > 26.0f) b->settled = true;
        if (b->settled && b->age > 3.0f) {
            if (b->age > 3.05f || b->voxCount == 0) {
                delete b;
                bodies.erase(bodies.begin() + bi);
            }
        }
        if (b->pos.y < -40) {
            delete b;
            bodies.erase(bodies.begin() + bi);
        }
    }
}

void Physics::cullDebris() {}

// ------------------------------------------------------------------ drawing
void Physics::draw() {
    // debris: shared shape batch of boxes
    static ShapeBatch sb;
    bool any = false;
    sb.reset();
    for (auto& d : debris) {
        if (!d.active) continue;
        uint8_t m = d.mat;
        float fade = 1.0f;
        float t = d.life / fmaxf(0.1f, d.maxLife);
        if (t > 0.8f) fade = 1.0f - (t - 0.8f) / 0.2f;
        if (fade <= 0.02f) continue;
        size_t before = sb.v.size();
        Vec3 p = d.pos;
        if (d.resting > 2.0f) p.y = d.pos.y;   // sleeping, keep position
        sb.box(p, d.half, d.rot, m, fade);
        any = true;
        (void)before;
    }
    if (any) g_renderer.drawShape(sb, /*depthBias*/ 0.0f);
    // structures
    for (auto* b : bodies) {
        if (b->meshVerts.empty()) continue;
        g_renderer.drawLocalMesh(b->meshVerts, b->meshIdx, b->meshBatches, b->pos, b->rot);
    }
}

// ------------------------------------------------------------------ collapse
struct RegionFill {
    World* w;
    int x0, y0, z0, x1, y1, z1;
    std::vector<uint8_t> inRegion;   // 1 if solid structural voxel
    std::vector<uint8_t> visited;
    inline int li(int x, int y, int z) const {
        return ((z - z0) * (y1 - y0) + (y - y0)) * (x1 - x0) + (x - x0);
    }
};

void structuralCheck(World& w, const Vec3& center, float radius) {
    int cx = int(center.x / VOXSZ), cy = int(center.y / VOXSZ), cz = int(center.z / VOXSZ);
    int r = clampi(int(radius / VOXSZ), 8, 40);
    int x0 = clampi(cx - r, 0, w.dims[0] - 1), x1 = clampi(cx + r, 1, w.dims[0]);
    int y0 = clampi(cy - r, 0, w.dims[1] - 1), y1 = clampi(cy + r, 1, w.dims[1]);
    int z0 = clampi(cz - r, 0, w.dims[2] - 1), z1 = clampi(cz + r, 1, w.dims[2]);
    int sx = x1 - x0, sy = y1 - y0, sz = z1 - z0;
    if (sx <= 0 || sy <= 0 || sz <= 0) return;
    size_t n = size_t(sx) * sy * sz;
    if (n > 900000) return;
    std::vector<uint8_t> solid(n, 0), visited(n, 0);
    for (int z = z0; z < z1; z++)
        for (int y = y0; y < y1; y++)
            for (int x = x0; x < x1; x++) {
                uint8_t m = w.get(x, y, z);
                if (m && kMats[m].structural && !kMats[m].trans)
                    solid[((z - z0) * sy + (y - y0)) * sx + (x - x0)] = 1;
            }
    std::vector<int> stack;
    std::vector<int> comp;
    std::vector<int> removals;
    for (int z = 0; z < sz; z++)
        for (int y = 0; y < sy; y++)
            for (int x = 0; x < sx; x++) {
                int i = (z * sy + y) * sx + x;
                if (!solid[i] || visited[i]) continue;
                stack.clear();
                comp.clear();
                stack.push_back(i);
                visited[i] = 1;
                bool anchored = false;
                int minY = 1 << 30;
                while (!stack.empty()) {
                    int c = stack.back();
                    stack.pop_back();
                    comp.push_back(c);
                    int lx = c % sx, ly = (c / sx) % sy, lz = c / (sx * sy);
                    int wx = x0 + lx, wy = y0 + ly, wz = z0 + lz;
                    if (wy <= 1) anchored = true;
                    // touching region border => assume still attached to the rest of world
                    if (lx == 0 || ly == 0 || lz == 0 || lx == sx - 1 || ly == sy - 1 || lz == sz - 1)
                        anchored = true;
                    if (wy < minY) minY = wy;
                    static const int DX[6] = {1, -1, 0, 0, 0, 0};
                    static const int DY[6] = {0, 0, 1, -1, 0, 0};
                    static const int DZ[6] = {0, 0, 0, 0, 1, -1};
                    for (int k = 0; k < 6; k++) {
                        int nx2 = lx + DX[k], ny2 = ly + DY[k], nz2 = lz + DZ[k];
                        if (nx2 < 0 || ny2 < 0 || nz2 < 0 || nx2 >= sx || ny2 >= sy || nz2 >= sz)
                            continue;
                        int ni = (nz2 * sy + ny2) * sx + nx2;
                        if (solid[ni] && !visited[ni]) {
                            visited[ni] = 1;
                            stack.push_back(ni);
                        }
                    }
                }
                if (anchored) continue;
                if (int(comp.size()) < 6) continue;
                // build structure body from component
                int bx0 = 1 << 30, by0 = 1 << 30, bz0 = 1 << 30, bx1 = -1, by1 = -1, bz1 = -1;
                for (int c : comp) {
                    int lx = c % sx, ly = (c / sx) % sy, lz = c / (sx * sy);
                    bx0 = std::min(bx0, lx); by0 = std::min(by0, ly); bz0 = std::min(bz0, lz);
                    bx1 = std::max(bx1, lx); by1 = std::max(by1, ly); bz1 = std::max(bz1, lz);
                }
                Vec3i dim(bx1 - bx0 + 1, by1 - by0 + 1, bz1 - bz0 + 1);
                if (dim.x * dim.y * dim.z > 30000) continue;
                std::vector<uint8_t> vox(size_t(dim.x) * dim.y * dim.z, 0);
                int hist[MAT_COUNT] = {0};
                for (int c : comp) {
                    int lx = c % sx, ly = (c / sx) % sy, lz = c / (sx * sy);
                    int wx = x0 + lx, wy = y0 + ly, wz = z0 + lz;
                    uint8_t m = w.get(wx, wy, wz);
                    if (!m) continue;
                    hist[m]++;
                    vox[size_t((lz - bz0) * dim.y + (ly - by0)) * dim.x + (lx - bx0)] = m;
                    w.setRaw(wx, wy, wz, MAT_AIR);
                }
                // mark chunks dirty
                for (int lz = bz0; lz <= bz1; lz++)
                    for (int ly = by0; ly <= by1; ly++)
                        for (int lx = bx0; lx <= bx1; lx++) {
                            int i2 = (lz * sy + ly) * sx + lx;
                            if (!solid[i2]) continue;
                            solid[i2] = 0;
                        }
                w.markDirtyAround(x0 + (bx0 + bx1) / 2, y0 + (by0 + by1) / 2, z0 + (bz0 + bz1) / 2, 8);
                int bestMat = MAT_CONCRETE;
                int bestCount = 0;
                for (int i = 0; i < MAT_COUNT; i++)
                    if (hist[i] > bestCount) { bestCount = hist[i]; bestMat = i; }
                Vec3 cpos((x0 + (bx0 + bx1) * 0.5f + 0.5f) * VOXSZ,
                          (y0 + (by0 + by1) * 0.5f + 0.5f) * VOXSZ,
                          (z0 + (bz0 + bz1) * 0.5f + 0.5f) * VOXSZ);
                if (int(comp.size()) < 45) {
                    // small chunk: convert to debris
                    int nd = clampi(int(comp.size()) / 6, 2, 14);
                    for (int k = 0; k < nd; k++) {
                        Vec3 p = cpos + Vec3(g_rng.range(-dim.x, dim.x) * VOXSZ * 0.5f,
                                             g_rng.range(-dim.y, dim.y) * VOXSZ * 0.5f,
                                             g_rng.range(-dim.z, dim.z) * VOXSZ * 0.5f);
                        float s = VOXSZ * g_rng.range(0.9f, 2.2f);
                        g_phys.spawnDebris(p, Vec3(g_rng.range(-1, 1), g_rng.range(0, 2),
                                                   g_rng.range(-1, 1)),
                                           Vec3(s, s * 0.7f, s), bestMat,
                                           g_rng.dir() * 3.0f);
                    }
                    g_audio.play(SND_RUBBLE, cpos, 0.35f);
                } else {
                    g_phys.spawnStructure(cpos, dim, vox, Basis(), uint8_t(bestMat));
                    g_audio.play(SND_COLLAPSE, cpos, saturate(comp.size() / 900.0f) * 1.2f);
                    g_fx.dustCloud(cpos, clampf(sqrtf(float(comp.size())) * 0.06f, 1.5f, 6.0f),
                                   20, uint8_t(bestMat));
                    g_fx.addShake(clampf(comp.size() / 2500.0f, 0.1f, 1.0f), 0.9f);
                }
                removals.push_back(int(comp.size()));
            }
}

void structuralTick(World& w, float dt) {
    (void)dt;
    static float timer = 0;
    timer += dt;
    if (timer < 0.25f) return;
    timer = 0;
    // process queued checks
    for (auto& q : g_phys.collapseQueue) structuralCheck(w, q, 7.0f);
    g_phys.collapseQueue.clear();
}

// ------------------------------------------------------------------ vehicles
void updateVehicles(float dt) {
    World& w = g_game.world;
    for (int i = 0; i < MAX_VEHICLES; i++) {
        Vehicle& v = g_game.vehicles[i];
        if (!v.active) continue;
        bool driven = v.occupied;
        float throttle = 0, steerIn = 0;
        if (driven) {
            if (g_input.keys['W']) throttle += 1.0f;
            if (g_input.keys['S']) throttle -= 1.0f;
            if (g_input.keys['A']) steerIn += 1.0f;
            if (g_input.keys['D']) steerIn -= 1.0f;
            v.brake = g_input.keys[' '] != 0;
        } else {
            throttle = 0;
            steerIn = 0;
            v.brake = true;
        }
        float maxSpeed = v.isBoat ? 14.0f : 22.0f;
        float accel = v.isBoat ? 8.0f : (v.mass > 5000 ? 5.0f : 12.0f);
        Vec3 fwd = v.rot.z;
        Vec3 right = v.rot.x;
        float fwdSpeed = dot(v.vel, fwd);
        float speed2d = length(Vec3(v.vel.x, 0, v.vel.z));
        // engine
        if (throttle > 0) fwdSpeed += accel * throttle * dt;
        else if (throttle < 0) fwdSpeed += accel * 0.75f * throttle * dt;
        fwdSpeed *= (1.0f - (v.brake ? 3.0f : 0.55f) * dt);
        // steering
        float steerRate = 1.6f * clampf(speed2d / 6.0f, 0.05f, 1.0f) * signf(fwdSpeed);
        v.yaw += steerIn * steerRate * dt;
        v.steer = lerpf(v.steer, steerIn, dt * 8.0f);
        v.rot = Basis::rotAxis(Vec3(0, 1, 0), v.yaw);
        fwd = v.rot.z;
        right = v.rot.x;
        // lateral friction
        Vec3 latVel = right * dot(v.vel, right);
        v.vel -= latVel * fminf(1.0f, dt * (v.brake ? 9.0f : 4.0f));
        v.vel = fwd * fwdSpeed + Vec3(0, v.vel.y, 0) +
                right * dot(v.vel, right) * 0.0f;
        v.speed = length(v.vel);
        // gravity
        v.vel.y -= 9.81f * dt;
        Vec3 next = v.pos + v.vel * dt;

        // ground contact: 4 wheel probes
        float wheelX = v.half.x * 0.82f, wheelZ = v.half.z * 0.75f;
        float bestGround = -1e9f;
        int hits = 0;
        float heights[4];
        Vec3 probes[4] = {Vec3(-wheelX, 0, wheelZ), Vec3(wheelX, 0, wheelZ),
                          Vec3(-wheelX, 0, -wheelZ), Vec3(wheelX, 0, -wheelZ)};
        for (int k = 0; k < 4; k++) {
            Vec3 wp = v.pos + v.rot.mul(probes[k]);
            RayHit h = w.raycast(Vec3(wp.x, wp.y + 0.5f, wp.z), Vec3(0, -1, 0), 4.0f, true);
            if (h.hit) {
                float gy = h.point.y;
                heights[k] = gy;
                if (gy > bestGround) bestGround = gy;
                hits++;
            } else {
                heights[k] = -1e9f;
            }
        }
        bool grounded = hits > 0 && (v.pos.y - bestGround) < 1.6f;
        if (grounded) {
            float targetY = bestGround + 0.02f;
            if (next.y < targetY) {
                next.y = targetY;
                if (v.vel.y < 0) {
                    float impact = -v.vel.y;
                    v.vel.y = 0;
                    if (impact > 6.0f) g_fx.dustCloud(next, 1.2f, 8, MAT_GRAVEL);
                }
            }
            // pitch/roll from wheel heights
            float frontAvg = -1e9f, backAvg = -1e9f;
            float leftAvg = -1e9f, rightAvg = -1e9f;
            if (heights[0] > -1e8f && heights[1] > -1e8f) frontAvg = (heights[0] + heights[1]) * 0.5f;
            if (heights[2] > -1e8f && heights[3] > -1e8f) backAvg = (heights[2] + heights[3]) * 0.5f;
            if (heights[0] > -1e8f && heights[2] > -1e8f) leftAvg = (heights[0] + heights[2]) * 0.5f;
            if (heights[1] > -1e8f && heights[3] > -1e8f) rightAvg = (heights[1] + heights[3]) * 0.5f;
            float pitch = 0, roll = 0;
            if (frontAvg > -1e8f && backAvg > -1e8f)
                pitch = atan2f(frontAvg - backAvg, wheelZ * 2.0f) * 0.8f;
            if (leftAvg > -1e8f && rightAvg > -1e8f)
                roll = atan2f(rightAvg - leftAvg, wheelX * 2.0f) * 0.8f;
            Basis br = Basis::rotAxis(Vec3(0, 1, 0), v.yaw);
            Basis bp = Basis::rotAxis(Vec3(1, 0, 0), -pitch);
            Basis brot = Basis::rotAxis(Vec3(0, 0, 1), roll);
            v.rot = brot * bp * br;
        }

        // horizontal collision vs voxels: probe the body's footprint
        bool collided = false;
        Vec3 push(0, 0, 0);
        for (int k = 0; k < 12; k++) {
            Vec3 local;
            if (k < 4) local = Vec3((k & 1 ? 1 : -1) * v.half.x, -v.half.y * 0.3f,
                                    (k & 2 ? 1 : -1) * v.half.z);
            else if (k < 8) local = Vec3((k & 1 ? 1 : -1) * v.half.x, v.half.y * 0.6f,
                                         (k & 2 ? 1 : -1) * v.half.z * 0.5f);
            else local = Vec3((k & 1 ? 1 : -1) * v.half.x, 0,
                              (k & 2 ? 1 : -1) * v.half.z * 0.9f);
            Vec3 wp = next + v.rot.mul(local);
            if (voxSolid(w, wp)) {
                collided = true;
                // push away from voxel centre
                int vx = int(wp.x / VOXSZ), vy = int(wp.y / VOXSZ), vz = int(wp.z / VOXSZ);
                Vec3 vc((vx + 0.5f) * VOXSZ, (vy + 0.5f) * VOXSZ, (vz + 0.5f) * VOXSZ);
                Vec3 dir = Vec3(next.x - vc.x, 0, next.z - vc.z);
                if (length(dir) < 0.01f) dir = -fwd;
                push += normalize(dir);
            }
        }
        if (collided) {
            push = normalize(push);
            float impact = fabsf(dot(v.vel, push));
            next = next + push * 0.35f;
            v.vel = v.vel - push * dot(v.vel, push) * 1.4f;
            if (impact > 2.0f) {
                if (v.mass > 1200 || impact > 5.0f) {
                    int removed = 0;
                    float power = 2.0f + impact * v.mass / 900.0f;
                    Vec3 cp = next + push * 0.9f;
                    w.carveSphere(cp, clampf(0.45f + impact * 0.14f, 0.45f, 2.6f), int(power),
                                  removed);
                    if (removed > 0) {
                        g_fx.dustCloud(cp, 1.4f, 10, MAT_CONCRETE);
                        g_fx.addShake(clampf(impact / 30.0f, 0.05f, 0.8f), 0.35f);
                        g_audio.play(SND_CRASH_SOFT, cp, saturate(impact / 16.0f));
                        g_phys.collapseQueue.push_back(cp);
                        g_game.totalDestroyed += removed;
                    }
                }
                v.vel *= 0.55f;
                v.health -= impact * 1.2f;
                g_fx.addShake(clampf(impact / 40.0f, 0.02f, 0.5f), 0.3f);
            }
        }
        v.pos = next;
        // water buoyancy
        float waterY = 0;
        (void)waterY;
        v.wheelSpin += v.speed * dt * 2.0f;
        if (v.pos.y < -30) v.active = false;
    }
}
