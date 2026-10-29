#include "render/sdf.h"
#include "render/mesh.h"
#include <functional>
#include <unordered_map>

namespace hv {

void sampleSDF(SdfGrid& g, const std::function<float(const Vec3&)>& f, float iso) {
    g.field.resize((size_t)g.nx * g.ny * g.nz);
    for (int k = 0; k < g.nz; k++) {
        float z = g.origin.z + g.cell.z * k;
        for (int j = 0; j < g.ny; j++) {
            float y = g.origin.y + g.cell.y * j;
            float* row = &g.field[((size_t)k * g.ny + j) * g.nx];
            for (int i = 0; i < g.nx; i++) {
                float x = g.origin.x + g.cell.x * i;
                row[i] = f(Vec3(x, y, z)) - iso;
            }
        }
    }
}

// Naive surface nets: one vertex per sign-changing cell, quads across grid edges.
Mesh polygonizeSDF(const SdfGrid& g, const std::function<float(const Vec3&)>& f, float iso) {
    (void)f; (void)iso;
    Mesh m;
    const int nx = g.nx, ny = g.ny, nz = g.nz;
    if (nx < 2 || ny < 2 || nz < 2) return m;
    std::vector<int> cellVert((size_t)(nx - 1) * (ny - 1) * (nz - 1), -1);
    auto cidx = [&](int i, int j, int k) { return (size_t)((k * (ny - 1) + j) * (nx - 1) + i); };
    auto val = [&](int i, int j, int k) -> float { return g.at(i, j, k); };

    // Pass 1: cell vertices at averaged edge crossings.
    for (int k = 0; k < nz - 1; k++) {
        for (int j = 0; j < ny - 1; j++) {
            for (int i = 0; i < nx - 1; i++) {
                int c[8] = {
                    (i)   + nx * ((j)   + ny * (k)),
                    (i+1) + nx * ((j)   + ny * (k)),
                    (i)   + nx * ((j+1) + ny * (k)),
                    (i+1) + nx * ((j+1) + ny * (k)),
                    (i)   + nx * ((j)   + ny * (k+1)),
                    (i+1) + nx * ((j)   + ny * (k+1)),
                    (i)   + nx * ((j+1) + ny * (k+1)),
                    (i+1) + nx * ((j+1) + ny * (k+1))
                };
                float v[8];
                int mask = 0;
                for (int q = 0; q < 8; q++) {
                    v[q] = g.field[c[q]];
                    if (v[q] < 0.0f) mask |= (1 << q);
                }
                if (mask == 0 || mask == 255) continue;
                static const int edges[12][2] = {
                    {0,1},{2,3},{4,5},{6,7},
                    {0,2},{1,3},{4,6},{5,7},
                    {0,4},{1,5},{2,6},{3,7}
                };
                static const int off[8][3] = {
                    {0,0,0},{1,0,0},{0,1,0},{1,1,0},{0,0,1},{1,0,1},{0,1,1},{1,1,1}
                };
                Vec3 sum(0,0,0);
                int cnt = 0;
                for (int e = 0; e < 12; e++) {
                    int a = edges[e][0], b = edges[e][1];
                    float va = v[a], vb = v[b];
                    if ((va < 0.0f) == (vb < 0.0f)) continue;
                    float t = va / (va - vb);
                    Vec3 pa(g.origin.x + g.cell.x * (i + off[a][0]),
                            g.origin.y + g.cell.y * (j + off[a][1]),
                            g.origin.z + g.cell.z * (k + off[a][2]));
                    Vec3 pb(g.origin.x + g.cell.x * (i + off[b][0]),
                            g.origin.y + g.cell.y * (j + off[b][1]),
                            g.origin.z + g.cell.z * (k + off[b][2]));
                    sum += vlerp(pa, pb, t);
                    cnt++;
                }
                if (cnt == 0) continue;
                Vec3 p = sum / (float)cnt;
                // normal from central differences of the sampled field
                auto gradient = [&](const Vec3& q) -> Vec3 {
                    float e = std::max(g.cell.x, std::max(g.cell.y, g.cell.z)) * 0.75f;
                    float dx = f(q + Vec3(e,0,0)) - f(q - Vec3(e,0,0));
                    float dy = f(q + Vec3(0,e,0)) - f(q - Vec3(0,e,0));
                    float dz = f(q + Vec3(0,0,e)) - f(q - Vec3(0,0,e));
                    return Vec3(dx, dy, dz).normalized();
                };
                Vec3 n = gradient(p);
                Vertex vv(p, n, Vec2(p.x * 0.35f + p.z * 0.35f, p.y * 0.35f), Vec4(1,1,1,1));
                m.verts.push_back(vv);
                cellVert[cidx(i, j, k)] = (int)m.verts.size() - 1;
            }
        }
    }
    if (m.verts.empty()) return m;

    // Pass 2: quads across sign-changing grid edges.
    auto quadIdx = [&](int a, int b, int c, int d) {
        if (a < 0 || b < 0 || c < 0 || d < 0) return;
        // winding chosen so that the quad normal follows the SDF gradient
        const Vec3& pa = m.verts[a].p; const Vec3& pb = m.verts[b].p;
        const Vec3& pc = m.verts[c].p;
        Vec3 nrm = (pb - pa).cross(pc - pa);
        Vec3 grad = (m.verts[a].n + m.verts[b].n + m.verts[c].n + m.verts[d].n);
        if (nrm.dot(grad) >= 0) {
            m.idx.push_back(a); m.idx.push_back(b); m.idx.push_back(c);
            m.idx.push_back(a); m.idx.push_back(c); m.idx.push_back(d);
        } else {
            m.idx.push_back(a); m.idx.push_back(c); m.idx.push_back(b);
            m.idx.push_back(a); m.idx.push_back(d); m.idx.push_back(c);
        }
    };
    for (int k = 0; k < nz; k++) {
        for (int j = 0; j < ny; j++) {
            for (int i = 0; i < nx; i++) {
                bool in0 = g.at(i, j, k) < 0.0f;
                // X edge -> 4 cells around it
                if (i < nx - 1 && j > 0 && k > 0 && j < ny - 1 && k < nz - 1) {
                    bool in1 = g.at(i + 1, j, k) < 0.0f;
                    if (in0 != in1) {
                        int c0 = cellVert[cidx(i, j - 1, k - 1)];
                        int c1 = cellVert[cidx(i, j,     k - 1)];
                        int c2 = cellVert[cidx(i, j,     k)];
                        int c3 = cellVert[cidx(i, j - 1, k)];
                        if (in0) quadIdx(c0, c1, c2, c3); else quadIdx(c3, c2, c1, c0);
                    }
                }
                // Y edge
                if (j < ny - 1 && i > 0 && k > 0 && i < nx - 1 && k < nz - 1) {
                    bool in1 = g.at(i, j + 1, k) < 0.0f;
                    if (in0 != in1) {
                        int c0 = cellVert[cidx(i - 1, j, k - 1)];
                        int c1 = cellVert[cidx(i,     j, k - 1)];
                        int c2 = cellVert[cidx(i,     j, k)];
                        int c3 = cellVert[cidx(i - 1, j, k)];
                        if (in0) quadIdx(c0, c1, c2, c3); else quadIdx(c3, c2, c1, c0);
                    }
                }
                // Z edge
                if (k < nz - 1 && i > 0 && j > 0 && i < nx - 1 && j < ny - 1) {
                    bool in1 = g.at(i, j, k + 1) < 0.0f;
                    if (in0 != in1) {
                        int c0 = cellVert[cidx(i - 1, j - 1, k)];
                        int c1 = cellVert[cidx(i,     j - 1, k)];
                        int c2 = cellVert[cidx(i,     j,     k)];
                        int c3 = cellVert[cidx(i - 1, j,     k)];
                        if (in0) quadIdx(c0, c1, c2, c3); else quadIdx(c3, c2, c1, c0);
                    }
                }
            }
        }
    }
    m.subs.push_back({0, (uint32_t)m.idx.size(), 0});
    m.finish(false);
    return m;
}

} // namespace hv
