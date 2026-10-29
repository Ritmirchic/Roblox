// world.cpp - voxel storage, greedy chunk meshing, lighting bake, raycasting
#include "frac.h"
#include <thread>
#include <atomic>
#include <chrono>

#define LCELL 5   // voxels per light volume cell (1.0 m)

int g_collapseEvents = 0;

// ------------------------------------------------------------------ alloc
void World::allocate(int sx, int sy, int sz) {
    free();
    dims[0] = sx; dims[1] = sy; dims[2] = sz;
    size_t total = size_t(sx) * sy * sz;
    vox = (uint8_t*)calloc(total, 1);
    flags = (uint8_t*)calloc(total, 1);
    sunmap = (float*)calloc(size_t(sx) * sz, sizeof(float));
    skyvis = (bool*)calloc(size_t(sx) * sz, sizeof(bool));
    ldim[0] = (sx + LCELL - 1) / LCELL;
    ldim[1] = (sy + LCELL - 1) / LCELL;
    ldim[2] = (sz + LCELL - 1) / LCELL;
    light = (float*)calloc(size_t(ldim[0]) * ldim[1] * ldim[2] * 4, sizeof(float));
    int cx = (sx + CH - 1) / CH, cy = (sy + CH - 1) / CH, cz = (sz + CH - 1) / CH;
    chunks.assign(size_t(cx) * cy * cz, nullptr);
}

void World::free() {
    for (Chunk* c : chunks)
        if (c) delete c;
    chunks.clear();
    ::free(vox); vox = nullptr;
    ::free(flags); flags = nullptr;
    ::free(light); light = nullptr;
    ::free(sunmap); sunmap = nullptr;
    ::free(skyvis); skyvis = nullptr;
    dims[0] = dims[1] = dims[2] = 0;
}

static inline int chunkCount(int d) { return (d + CH - 1) / CH; }

Chunk* World::chunkAt(int cx, int cy, int cz) {
    int nx = chunkCount(dims[0]), ny = chunkCount(dims[1]), nz = chunkCount(dims[2]);
    if (cx < 0 || cy < 0 || cz < 0 || cx >= nx || cy >= ny || cz >= nz) return nullptr;
    size_t i = (size_t(cz) * ny + cy) * nx + cx;
    return chunks[i];
}

Chunk* World::getChunk(int x, int y, int z) {
    return chunkAt(x >> 4, y >> 4, z >> 4);
}

static Chunk* ensureChunk(World& w, int cx, int cy, int cz) {
    int nx = chunkCount(w.dims[0]), ny = chunkCount(w.dims[1]), nz = chunkCount(w.dims[2]);
    if (cx < 0 || cy < 0 || cz < 0 || cx >= nx || cy >= ny || cz >= nz) return nullptr;
    size_t i = (size_t(cz) * ny + cy) * nx + cx;
    if (!w.chunks[i]) {
        Chunk* c = new Chunk();
        memset(c->v, 0, CHV);
        c->cx = cx; c->cy = cy; c->cz = cz;
        c->mesh.built = false;
        w.chunks[i] = c;
    }
    return w.chunks[i];
}

void World::markDirtyAround(int x, int y, int z, int r) {
    int cx = x >> 4, cy = y >> 4, cz = z >> 4;
    for (int dz = -1; dz <= 1; dz++)
        for (int dy = -1; dy <= 1; dy++)
            for (int dx = -1; dx <= 1; dx++) {
                Chunk* c = chunkAt(cx + dx, cy + dy, cz + dz);
                if (c) c->mesh.dirty = true;
            }
}

void World::setRaw(int x, int y, int z, uint8_t m) {
    if (!inside(x, y, z)) return;
    vox[idx(x, y, z)] = m;
}

void World::set(int x, int y, int z, uint8_t m, bool structuralEdit) {
    if (!inside(x, y, z)) return;
    size_t i = idx(x, y, z);
    uint8_t old = vox[i];
    if (old == m) return;
    vox[i] = m;
    Chunk* c = ensureChunk(*this, x >> 4, y >> 4, z >> 4);
    if (c) {
        c->modified = true;
        c->mesh.dirty = true;
        c->v[((z & 15) * CH + (y & 15)) * CH + (x & 15)] = m;
    }
    markDirtyAround(x, y, z, 1);
    if (m != MAT_AIR) {
        // update heightmap
        int col = z * dims[0] + x;
        if (wp(x, 0, z).y + y * VOXSZ > sunmap[col]) sunmap[col] = y * VOXSZ + VOXSZ;
    } else {
        // heightmap may need lowering - recompute lazily by scanning down
        int col = z * dims[0] + x;
        int yy = clampi(int(sunmap[col] / VOXSZ) - 1, 0, dims[1] - 1);
        while (yy > 0 && vox[idx(x, yy, z)] == MAT_AIR) yy--;
        sunmap[col] = (vox[idx(x, yy, z)] != MAT_AIR) ? yy * VOXSZ + VOXSZ : 0;
    }
}

float World::topSolidY(int x, int z) const {
    if (x < 0 || z < 0 || x >= dims[0] || z >= dims[2]) return 0;
    return sunmap[z * dims[0] + x];
}

void World::computeSunMap() {
    for (int z = 0; z < dims[2]; z++)
        for (int x = 0; x < dims[0]; x++) {
            int top = 0;
            for (int y = dims[1] - 1; y >= 0; y--)
                if (vox[idx(x, y, z)] != MAT_AIR) { top = y + 1; break; }
            sunmap[z * dims[0] + x] = top * VOXSZ;
        }
}

// ------------------------------------------------------------------ light
void World::bakeLight() {
    size_t n = size_t(ldim[0]) * ldim[1] * ldim[2];
    memset(light, 0, n * 4 * sizeof(float));
    // seed: cells open to the sky
    std::vector<int> queue;
    queue.reserve(n / 4);
    for (int cz = 0; cz < ldim[2]; cz++)
        for (int cy = 0; cy < ldim[1]; cy++)
            for (int cx = 0; cx < ldim[0]; cx++) {
                int vx = cx * LCELL + LCELL / 2, vy = cy * LCELL + LCELL / 2,
                    vz = cz * LCELL + LCELL / 2;
                if (vx >= dims[0] || vy >= dims[1] || vz >= dims[2]) continue;
                int i = (cz * ldim[1] + cy) * ldim[0] + cx;
                bool solid = vox[idx(vx, vy, vz)] != MAT_AIR;
                if (solid) continue;
                float top = sunmap[vz * dims[0] + vx] / VOXSZ;
                if (top <= float(vy) + 1.0f) {
                    light[i * 4 + 3] = 1.0f;
                    queue.push_back(i);
                }
            }
    // BFS propagate
    int head = 0;
    const float decay = 0.885f;
    while (head < int(queue.size())) {
        int i = queue[head++];
        float s = light[i * 4 + 3];
        if (s < 0.06f) continue;
        int cx = i % ldim[0];
        int cy = (i / ldim[0]) % ldim[1];
        int cz = i / (ldim[0] * ldim[1]);
        static const int DX[6] = {1, -1, 0, 0, 0, 0}, DY[6] = {0, 0, 1, -1, 0, 0},
                         DZ[6] = {0, 0, 0, 0, 1, -1};
        for (int k = 0; k < 6; k++) {
            int nx = cx + DX[k], ny = cy + DY[k], nz = cz + DZ[k];
            if (nx < 0 || ny < 0 || nz < 0 || nx >= ldim[0] || ny >= ldim[1] || nz >= ldim[2])
                continue;
            int vx = nx * LCELL + LCELL / 2, vy = ny * LCELL + LCELL / 2, vz = nz * LCELL + LCELL / 2;
            if (vx >= dims[0] || vy >= dims[1] || vz >= dims[2]) continue;
            uint8_t m = vox[idx(vx, vy, vz)];
            if (m != MAT_AIR && !kMats[m].trans) continue;
            int j = (nz * ldim[1] + ny) * ldim[0] + nx;
            float ns = s * decay;
            if (ns > light[j * 4 + 3] + 0.01f) {
                light[j * 4 + 3] = ns;
                if (ns > 0.06f) queue.push_back(j);
            }
        }
    }
}

Vec3 World::lightAt(const Vec3& p) const {
    if (!light) return Vec3(0.5f, 0.5f, 0.55f);
    float fx = p.x / (LCELL * VOXSZ), fy = p.y / (LCELL * VOXSZ), fz = p.z / (LCELL * VOXSZ);
    fx = clampf(fx, 0, ldim[0] - 1.001f);
    fy = clampf(fy, 0, ldim[1] - 1.001f);
    fz = clampf(fz, 0, ldim[2] - 1.001f);
    int x0 = int(fx), y0 = int(fy), z0 = int(fz);
    float tx = fx - x0, ty = fy - y0, tz = fz - z0;
    int x1 = std::min(x0 + 1, ldim[0] - 1), y1 = std::min(y0 + 1, ldim[1] - 1),
        z1 = std::min(z0 + 1, ldim[2] - 1);
    float acc[4] = {0, 0, 0, 0};
    for (int k = 0; k < 8; k++) {
        int cx = (k & 1) ? x1 : x0, cy = (k & 2) ? y1 : y0, cz = (k & 4) ? z1 : z0;
        float wgt = ((k & 1) ? tx : 1 - tx) * ((k & 2) ? ty : 1 - ty) * ((k & 4) ? tz : 1 - tz);
        const float* L = &light[((cz * ldim[1] + cy) * ldim[0] + cx) * 4];
        acc[0] += L[0] * wgt; acc[1] += L[1] * wgt; acc[2] += L[2] * wgt; acc[3] += L[3] * wgt;
    }
    return Vec3(acc[0], acc[1], acc[2]) + Vec3(acc[3] * 0.35f);
}

// ------------------------------------------------------------------ meshing
struct FaceDir {
    int axis, sign;
    int n[3];
};

static const FaceDir kDirs[6] = {
    {0, 1, {1, 0, 0}}, {0, -1, {-1, 0, 0}}, {1, 1, {0, 1, 0}},
    {1, -1, {0, -1, 0}}, {2, 1, {0, 0, 1}}, {2, -1, {0, 0, -1}}};

static inline bool isOpaque(World& w, int x, int y, int z) {
    uint8_t m = w.get(x, y, z);
    return m != MAT_AIR && !kMats[m].trans;
}

// AO for a face vertex given the two tangent directions and corner offsets
static float cornerAO(World& w, int x, int y, int z, const int n[3], int d1[3], int d2[3],
                      int s1, int s2) {
    auto solidAt = [&](int a, int b, int c) {
        return isOpaque(w, x + a, y + b, z + c) ? 1 : 0;
    };
    int side1 = solidAt(n[0] + d1[0] * s1, n[1] + d1[1] * s1, n[2] + d1[2] * s1);
    int side2 = solidAt(n[0] + d2[0] * s2, n[1] + d2[1] * s2, n[2] + d2[2] * s2);
    int corner = solidAt(n[0] + d1[0] * s1 + d2[0] * s2, n[1] + d1[1] * s1 + d2[1] * s2,
                         n[2] + d1[2] * s1 + d2[2] * s2);
    if (side1 && side2) return 0.35f;
    return 1.0f - 0.22f * float(side1 + side2 + corner);
}


// Sun visibility for a surface point: march the height field towards the sun.
// Cheap (one height-map lookup per step) and gives real directional shadows that
// follow buildings, trees and cranes instead of the old "what is directly above me" test.
static inline float sunMarchVis(const World& w, const Vec3& p) {
    extern Renderer g_renderer;
    if (!g_renderer.set.shadows) return 1.0f;
    const int* dims = w.dims;
    const float* sunmap = w.sunmap;
    Vec3 d = g_renderer.sunDir;
    if (d.y <= 0.05f) d = normalize(Vec3(-0.45f, 0.32f, 0.83f));   // default daylight sun
    float t = 0.32f;
    float len = 1.0f / d.y;         // metres of travel per metre of height
    float maxY = float(dims[1]) * VOXSZ;
    for (int i = 0; i < 26; i++) {
        Vec3 q = p + d * t;
        if (q.y > maxY) break;
        int x = clampi(int(q.x / VOXSZ), 0, dims[0] - 1);
        int z = clampi(int(q.z / VOXSZ), 0, dims[2] - 1);
        float top = sunmap[z * dims[0] + x];
        if (q.y < top - 0.06f) {
            // penumbra: fade out with distance so far shadows stay soft
            float soft = clampf(1.0f - (t * 0.05f), 0.0f, 1.0f);
            return 1.0f - soft;
        }
        t *= 1.28f;
        if (t > 70.0f) break;
    }
    (void)len;
    return 1.0f;
}

void World::buildChunkMesh(Chunk* c) {
    c->mesh.verts.clear();
    c->mesh.idx.clear();
    c->mesh.batches.clear();
    c->tmesh.verts.clear();
    c->tmesh.idx.clear();
    c->tmesh.batches.clear();
    c->mesh.bb = AABB(Vec3(1e9f, 1e9f, 1e9f), Vec3(-1e9f, -1e9f, -1e9f));
    int bx = c->cx * CH, by = c->cy * CH, bz = c->cz * CH;
    bool any = false;
    for (int i = 0; i < CHV; i++)
        if (c->v[i]) { any = true; break; }
    if (!any) {
        c->mesh.built = true;
        c->mesh.dirty = false;
        return;
    }
    ChunkMesh* tm = &c->mesh;

    for (int d = 0; d < 6; d++) {
        const FaceDir& fd = kDirs[d];
        int axis = fd.axis;
        int uAxis = (axis + 1) % 3, vAxis = (axis + 2) % 3;
        uint8_t mask[CH * CH];   // per-call: buildChunkMesh runs on worker threads
        for (int k = 0; k < CH; k++) {
            memset(mask, 0, sizeof(mask));
            // build mask of faces on this slice
            bool hasAny = false;
            for (int vv = 0; vv < CH; vv++)
                for (int uu = 0; uu < CH; uu++) {
                    int p[3];
                    p[axis] = k;
                    p[uAxis] = uu;
                    p[vAxis] = vv;
                    int wx = bx + p[0], wy = by + p[1], wz = bz + p[2];
                    uint8_t m = c->v[(p[2] * CH + p[1]) * CH + p[0]];
                    if (!m) continue;
                    if (wx >= dims[0] || wy >= dims[1] || wz >= dims[2]) continue;
                    if (wx < 0 || wy < 0 || wz < 0) continue;
                    int nx = wx + fd.n[0], ny = wy + fd.n[1], nz = wz + fd.n[2];
                    uint8_t nm = get(nx, ny, nz);
                    bool vis;
                    if (kMats[m].trans)
                        vis = (nm != m) && (nm == MAT_AIR || !kMats[nm].trans);
                    else
                        vis = (nm == MAT_AIR) || kMats[nm].trans;
                    if (!vis) continue;
                    mask[vv * CH + uu] = m;
                    hasAny = true;
                }
            if (!hasAny) continue;
            // greedy merge
            for (int vv = 0; vv < CH; vv++) {
                for (int uu = 0; uu < CH;) {
                    uint8_t m = mask[vv * CH + uu];
                    if (!m) { uu++; continue; }
                    const int kMaxMerge = 8;   // ~1.6 m: keeps baked lighting responsive
                    int w = 1;
                    while (uu + w < CH && w < kMaxMerge && mask[vv * CH + uu + w] == m) w++;
                    int h = 1;
                    bool grow = true;
                    while (grow && vv + h < CH && h < kMaxMerge) {
                        for (int i = 0; i < w; i++)
                            if (mask[(vv + h) * CH + uu + i] != m) { grow = false; break; }
                        if (grow) h++;
                    }
                    for (int j = 0; j < h; j++)
                        for (int i = 0; i < w; i++) mask[(vv + j) * CH + uu + i] = 0;
                    // emit quad
                    int p[3] = {0, 0, 0};
                    p[axis] = k + (fd.sign > 0 ? 1 : 0);
                    int o[3] = {0, 0, 0};
                    o[uAxis] = uu;
                    o[vAxis] = vv;
                    float base[3] = {(bx + p[0] + o[0]) * VOXSZ, (by + p[1] + o[1]) * VOXSZ,
                                     (bz + p[2] + o[2]) * VOXSZ};
                    Vec3 du(0, 0, 0), dv(0, 0, 0);
                    du[uAxis] = w * VOXSZ;
                    dv[vAxis] = h * VOXSZ;
                    Vec3 p0(base[0], base[1], base[2]);
                    Vec3 p1 = p0 + du;
                    Vec3 p2 = p0 + du + dv;
                    Vec3 p3 = p0 + dv;
                    if (fd.sign < 0) std::swap(p1, p3);
                    // choose target mesh (transparent vs opaque)
                    tm = kMats[m].trans ? &c->tmesh : &c->mesh;
                    if (tm->batches.empty() || tm->batches.back().mat != m) {
                        ChunkMesh::Batch b;
                        b.mat = m;
                        b.first = int(tm->idx.size());
                        b.count = 0;
                        tm->batches.push_back(b);
                    }
                    // per-vertex lighting data
                    int vx = bx + p[0], vy = by + p[1], vz = bz + p[2];
                    int dv1[3] = {0, 0, 0}, dv2[3] = {0, 0, 0};
                    dv1[uAxis] = 1;
                    dv2[vAxis] = 1;
                    struct { int s1, s2; Vec3 p; } vts[4];
                    vts[0] = {fd.sign > 0 ? -1 : 1, fd.sign > 0 ? -1 : 1, p0};
                    vts[1] = {fd.sign > 0 ? 1 : -1, fd.sign > 0 ? -1 : 1, p1};
                    vts[2] = {fd.sign > 0 ? 1 : -1, fd.sign > 0 ? 1 : -1, p2};
                    vts[3] = {fd.sign > 0 ? -1 : 1, fd.sign > 0 ? 1 : -1, p3};
                    uint32_t vstart = uint32_t(tm->verts.size());
                    for (int vi = 0; vi < 4; vi++) {
                        RVert rv;
                        rv.x = vts[vi].p.x;
                        rv.y = vts[vi].p.y;
                        rv.z = vts[vi].p.z;
                        rv.nx = int8_t(fd.n[0]);
                        rv.ny = int8_t(fd.n[1]);
                        rv.nz = int8_t(fd.n[2]);
                        rv.mat = int8_t(m);
                        // world-aligned UVs in metres
                        if (axis == 0) { rv.u = rv.z; rv.v = rv.y; }
                        else if (axis == 1) { rv.u = rv.x; rv.v = rv.z; }
                        else { rv.u = rv.x; rv.v = rv.y; }
                        rv.ao = cornerAO(*this, vx, vy, vz, fd.n, dv1, dv2, vts[vi].s1,
                                         vts[vi].s2);
                        // sun visibility: march the height field towards the sun
                        Vec3 sv(rv.x + float(fd.n[0]) * 0.04f, rv.y + float(fd.n[1]) * 0.04f,
                                rv.z + float(fd.n[2]) * 0.04f);
                        rv.sun = sunMarchVis(*this, sv);
                        tm->verts.push_back(rv);
                    }
                    tm->idx.push_back(vstart + 0);
                    tm->idx.push_back(vstart + 1);
                    tm->idx.push_back(vstart + 2);
                    tm->idx.push_back(vstart + 0);
                    tm->idx.push_back(vstart + 2);
                    tm->idx.push_back(vstart + 3);
                    tm->batches.back().count += 6;
                    AABB& bb = tm->bb;
                    bb.grow(p0); bb.grow(p1); bb.grow(p2); bb.grow(p3);
                    c->mesh.bb.grow(p0); c->mesh.bb.grow(p1);
                    c->mesh.bb.grow(p2); c->mesh.bb.grow(p3);
                    uu += w;
                }
            }
        }
    }
    // fix batch counts that may have been mis-assigned when switching meshes
    for (ChunkMesh* mm : {&c->mesh, &c->tmesh}) {
        for (size_t i = 0; i < mm->batches.size(); i++) {
            if (i + 1 < mm->batches.size())
                mm->batches[i].count = mm->batches[i + 1].first - mm->batches[i].first;
            else
                mm->batches[i].count = int(mm->idx.size()) - mm->batches[i].first;
        }
        // drop empty
        std::vector<ChunkMesh::Batch> keep;
        for (auto& b : mm->batches)
            if (b.count > 0) keep.push_back(b);
        mm->batches.swap(keep);
    }
    c->mesh.built = true;
    c->mesh.dirty = false;
}

void World::rebuildAll() {
    std::vector<Chunk*> list;
    for (Chunk* c : chunks)
        if (c) list.push_back(c);
    int hw = std::thread::hardware_concurrency();
    int nt = clampi(hw > 1 ? hw : 1, 1, 8);
    std::atomic<int> next(0);
    auto worker = [&]() {
        while (true) {
            int i = next.fetch_add(1);
            if (i >= int(list.size())) break;
            buildChunkMesh(list[i]);
        }
    };
    std::vector<std::thread> th;
    for (int i = 0; i < nt; i++) th.emplace_back(worker);
    for (auto& t : th) t.join();
}

void World::buildDirty(int budgetMs) {
    auto t0 = std::chrono::high_resolution_clock::now();
    std::vector<Chunk*> dirty;
    for (Chunk* c : chunks)
        if (c && c->mesh.dirty) dirty.push_back(c);
    if (dirty.empty()) return;
    // sort by distance to camera (closest first)
    extern Vec3 g_camPosForBuild;
    std::sort(dirty.begin(), dirty.end(), [](Chunk* a, Chunk* b) {
        Vec3 pa(a->cx * CH * VOXSZ, a->cy * CH * VOXSZ, a->cz * CH * VOXSZ);
        Vec3 pb(b->cx * CH * VOXSZ, b->cy * CH * VOXSZ, b->cz * CH * VOXSZ);
        return length(pa - g_camPosForBuild) < length(pb - g_camPosForBuild);
    });
    int done = 0;
    for (Chunk* c : dirty) {
        buildChunkMesh(c);
        done++;
        auto t1 = std::chrono::high_resolution_clock::now();
        if (std::chrono::duration_cast<std::chrono::microseconds>(t1 - t0).count() >
            budgetMs * 1000)
            break;
    }
    (void)done;
}
Vec3 g_camPosForBuild(0, 0, 0);

// ------------------------------------------------------------------ raycast
RayHit World::raycast(const Vec3& o, const Vec3& dir, float maxDist, bool hitTransparent) const {
    RayHit h;
    Vec3 so = Vec3(o.x / VOXSZ, o.y / VOXSZ, o.z / VOXSZ);
    Vec3 sd = normalize(dir);
    int x = int(floorf(so.x)), y = int(floorf(so.y)), z = int(floorf(so.z));
    int stepX = sd.x > 0 ? 1 : -1, stepY = sd.y > 0 ? 1 : -1, stepZ = sd.z > 0 ? 1 : -1;
    float tDeltaX = fabsf(1.0f / (sd.x == 0 ? 1e-9f : sd.x));
    float tDeltaY = fabsf(1.0f / (sd.y == 0 ? 1e-9f : sd.y));
    float tDeltaZ = fabsf(1.0f / (sd.z == 0 ? 1e-9f : sd.z));
    float tMaxX = ((sd.x > 0 ? (x + 1 - so.x) : (so.x - x)) * tDeltaX);
    float tMaxY = ((sd.y > 0 ? (y + 1 - so.y) : (so.y - y)) * tDeltaY);
    float tMaxZ = ((sd.z > 0 ? (z + 1 - so.z) : (so.z - z)) * tDeltaZ);
    float t = 0;
    int lastAxis = -1;
    float maxVox = maxDist / VOXSZ;
    for (int iter = 0; iter < 4096; iter++) {
        if (inside(x, y, z)) {
            uint8_t m = vox[idx(x, y, z)];
            if (m != MAT_AIR && (hitTransparent || !kMats[m].trans)) {
                h.hit = true;
                h.t = t * VOXSZ;
                h.voxel = Vec3i(x, y, z);
                h.mat = m;
                h.point = so * VOXSZ + sd * h.t;
                h.nrm = Vec3(0, 0, 0);
                if (lastAxis == 0) h.nrm.x = float(-stepX);
                else if (lastAxis == 1) h.nrm.y = float(-stepY);
                else if (lastAxis == 2) h.nrm.z = float(-stepZ);
                else h.nrm = -sd;
                return h;
            }
        }
        if (tMaxX < tMaxY && tMaxX < tMaxZ) {
            x += stepX; t = tMaxX; tMaxX += tDeltaX; lastAxis = 0;
        } else if (tMaxY < tMaxZ) {
            y += stepY; t = tMaxY; tMaxY += tDeltaY; lastAxis = 1;
        } else {
            z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; lastAxis = 2;
        }
        if (t > maxVox) break;
    }
    return h;
}

// ------------------------------------------------------------------ carving
bool World::carveSphere(const Vec3& center, float r, int maxStrength, int& removed,
                        int* matHist) {
    removed = 0;
    float rv = r / VOXSZ;
    int cx = int(floorf(center.x / VOXSZ)), cy = int(floorf(center.y / VOXSZ)),
        cz = int(floorf(center.z / VOXSZ));
    int ir = int(ceilf(rv)) + 1;
    bool any = false;
    bool needLightUpdate = false;
    for (int z = cz - ir; z <= cz + ir; z++)
        for (int y = cy - ir; y <= cy + ir; y++)
            for (int x = cx - ir; x <= cx + ir; x++) {
                if (!inside(x, y, z)) continue;
                float dx = (x + 0.5f) * VOXSZ - center.x;
                float dy = (y + 0.5f) * VOXSZ - center.y;
                float dz = (z + 0.5f) * VOXSZ - center.z;
                float d = sqrtf(dx * dx + dy * dy + dz * dz);
                if (d > r) continue;
                size_t i = idx(x, y, z);
                uint8_t m = vox[i];
                if (m == MAT_AIR) continue;
                if (flags[i] & VF_INDESTRUCTIBLE) continue;
                float falloff = 1.0f - d / fmaxf(0.01f, r);
                float strength = maxStrength * (0.35f + 0.65f * falloff);
                if (strength < kMats[m].strength) continue;
                set(x, y, z, MAT_AIR);
                any = true;
                removed++;
                if (matHist) matHist[m]++;
                if (kMats[m].trans || m == MAT_GLASS) needLightUpdate = true;
            }
    if (any) {
        for (int dz = -ir - 16; dz <= ir + 16; dz += 16) {
            // mark light cells dirty by re-baking locally (cheap approach: full rebake is
            // expensive; we instead invalidate a region marker)
            (void)dz;
        }
    }
    (void)needLightUpdate;
    return any;
}

bool World::carveBox(const Vec3& mn, const Vec3& mx, int maxStrength, int& removed) {
    removed = 0;
    int x0 = int(floorf(mn.x / VOXSZ)), y0 = int(floorf(mn.y / VOXSZ)),
        z0 = int(floorf(mn.z / VOXSZ));
    int x1 = int(ceilf(mx.x / VOXSZ)), y1 = int(ceilf(mx.y / VOXSZ)), z1 = int(ceilf(mx.z / VOXSZ));
    for (int z = z0; z <= z1; z++)
        for (int y = y0; y <= y1; y++)
            for (int x = x0; x <= x1; x++) {
                if (!inside(x, y, z)) continue;
                size_t i = idx(x, y, z);
                uint8_t m = vox[i];
                if (m == MAT_AIR) continue;
                if (flags[i] & VF_INDESTRUCTIBLE) continue;
                if (maxStrength < kMats[m].strength) continue;
                set(x, y, z, MAT_AIR);
                removed++;
            }
    return removed > 0;
}

void World::clearEdits() {
    rebuildAll();
}

// bulk fill straight into the flat array (map construction only)
void World::fillFast(int x0, int y0, int z0, int x1, int y1, int z1, uint8_t m) {
    x0 = clampi(x0, 0, dims[0] - 1); x1 = clampi(x1, 0, dims[0] - 1);
    y0 = clampi(y0, 0, dims[1] - 1); y1 = clampi(y1, 0, dims[1] - 1);
    z0 = clampi(z0, 0, dims[2] - 1); z1 = clampi(z1, 0, dims[2] - 1);
    if (x0 > x1) std::swap(x0, x1);
    if (y0 > y1) std::swap(y0, y1);
    if (z0 > z1) std::swap(z0, z1);
    for (int z = z0; z <= z1; z++)
        for (int y = y0; y <= y1; y++) {
            uint8_t* row = vox + size_t(z * dims[1] + y) * dims[0];
            for (int x = x0; x <= x1; x++) row[x] = m;
        }
}

void World::syncChunks() {
    int nx = chunkCount(dims[0]), ny = chunkCount(dims[1]), nz = chunkCount(dims[2]);
    for (int cz = 0; cz < nz; cz++)
        for (int cy = 0; cy < ny; cy++)
            for (int cx = 0; cx < nx; cx++) {
                size_t ci = (size_t(cz) * ny + cy) * nx + cx;
                bool any = false;
                int bx = cx * CH, by = cy * CH, bz = cz * CH;
                // quick scan for non-empty
                for (int z = 0; z < CH && !any; z++)
                    for (int y = 0; y < CH && !any; y++) {
                        int wz = bz + z, wy = by + y;
                        if (wz >= dims[2] || wy >= dims[1]) break;
                        uint8_t* row = vox + size_t(wz * dims[1] + wy) * dims[0];
                        for (int x = 0; x < CH; x++) {
                            int wx = bx + x;
                            if (wx >= dims[0]) break;
                            if (row[wx]) { any = true; break; }
                        }
                    }
                if (!any) continue;
                Chunk* c = ensureChunk(*this, cx, cy, cz);
                if (!c) continue;
                for (int z = 0; z < CH; z++)
                    for (int y = 0; y < CH; y++) {
                        int wz = bz + z, wy = by + y;
                        if (wz >= dims[2] || wy >= dims[1]) continue;
                        uint8_t* row = vox + size_t(wz * dims[1] + wy) * dims[0];
                        for (int x = 0; x < CH; x++) {
                            int wx = bx + x;
                            if (wx >= dims[0]) continue;
                            c->v[(z * CH + y) * CH + x] = row[wx];
                        }
                    }
                c->mesh.dirty = true;
            }
}

// ------------------------------------------------------------------ shape batch
void ShapeBatch::quad(const Vec3& a_, const Vec3& b_, const Vec3& c_, const Vec3& d_,
                      const Vec3& n, uint8_t material, float u, float v2, float u2,
                      float v3) {
    // guarantee winding: (b-a) x (c-a) must point along n
    Vec3 a = a_, b = b_, c = c_, d = d_;
    if (dot(cross(b - a, c - a), n) < 0) {
        std::swap(b, d);
        std::swap(u2, u);
        std::swap(v2, v3);
    }
    uint32_t base = uint32_t(v.size());
    RVert rv;
    rv.nx = int8_t(n.x);
    rv.ny = int8_t(n.y);
    rv.nz = int8_t(n.z);
    rv.mat = int8_t(material);
    rv.ao = 1;
    rv.sun = 1;
    Vec3 pts[4] = {a, b, c, d};
    float us[4] = {u, u2, u2, u};
    float vs[4] = {v2, v2, v3, v3};
    for (int i = 0; i < 4; i++) {
        rv.x = pts[i].x; rv.y = pts[i].y; rv.z = pts[i].z;
        rv.u = us[i]; rv.v = vs[i];
        v.push_back(rv);
    }
    uint32_t idx[6] = {base, base + 1, base + 2, base, base + 2, base + 3};
    for (int i = 0; i < 6; i++) this->i.push_back(idx[i]);
}

void ShapeBatch::box(const Vec3& c, const Vec3& half, const Basis& b, uint8_t material, float ao) {
    Vec3 px = b.x * half.x, py = b.y * half.y, pz = b.z * half.z;
    Vec3 v[8];
    int k = 0;
    for (int i = 0; i < 2; i++)
        for (int j = 0; j < 2; j++)
            for (int l = 0; l < 2; l++)
                v[k++] = c + px * (i ? 1.f : -1.f) + py * (j ? 1.f : -1.f) + pz * (l ? 1.f : -1.f);
    float s = 1.0f / fmaxf(0.02f, (half.x + half.y + half.z) / 3.0f);
    // -x face
    quad(v[0], v[1], v[3], v[2], -b.x, material, 0, 0, (half.y * 2) * s, (half.z * 2) * s);
    quad(v[4], v[6], v[7], v[5], b.x, material, 0, 0, (half.y * 2) * s, (half.z * 2) * s);
    quad(v[0], v[4], v[5], v[1], -b.z, material, 0, 0, (half.x * 2) * s, (half.y * 2) * s);
    quad(v[2], v[3], v[7], v[6], b.z, material, 0, 0, (half.x * 2) * s, (half.y * 2) * s);
    quad(v[0], v[2], v[6], v[4], -b.y, material, 0, 0, (half.x * 2) * s, (half.z * 2) * s);
    quad(v[1], v[5], v[7], v[3], b.y, material, 0, 0, (half.x * 2) * s, (half.z * 2) * s);
    for (size_t idx = 0; idx < this->v.size(); idx++) this->v[idx].ao = ao;
}
