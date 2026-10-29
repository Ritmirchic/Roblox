#include "render/mesh.h"
#include <cstring>

namespace hv {

// ---------------------------------------------------------------- Mesh
void Mesh::recomputeBounds() {
    bounds = AABB();
    for (auto& v : verts) bounds.add(v.p);
}

void Mesh::finish(bool smooth) {
    if (smooth) {
        // weld by quantised position, area-weighted face normals
        struct Key { int32_t x, y, z; bool operator==(const Key& o) const { return x==o.x&&y==o.y&&z==o.z; } };
        struct KeyHash { size_t operator()(const Key& k) const {
            return (size_t)(hashU32((uint32_t)k.x * 73856093u ^ (uint32_t)k.y * 19349663u ^ (uint32_t)k.z * 83492791u)); } };
        std::unordered_map<Key, Vec3, KeyHash> acc;
        std::vector<Key> keys(verts.size());
        for (size_t i = 0; i < verts.size(); i++) {
            Key k{ (int32_t)(verts[i].p.x * 2000.0f), (int32_t)(verts[i].p.y * 2000.0f), (int32_t)(verts[i].p.z * 2000.0f) };
            keys[i] = k;
            acc[k] = Vec3(0, 0, 0);
        }
        for (size_t t = 0; t + 2 < idx.size(); t += 3) {
            const Vec3& a = verts[idx[t]].p; const Vec3& b = verts[idx[t+1]].p; const Vec3& c = verts[idx[t+2]].p;
            Vec3 n = (b - a).cross(c - a);
            acc[keys[idx[t]]] += n; acc[keys[idx[t+1]]] += n; acc[keys[idx[t+2]]] += n;
        }
        for (size_t i = 0; i < verts.size(); i++) verts[i].n = acc[keys[i]].normalized();
    }
    recomputeBounds();
    if (subs.empty() && !idx.empty()) subs.push_back({0, (uint32_t)idx.size(), 0});
}

void Mesh::transform(const Mat4& m) {
    for (auto& v : verts) {
        v.p = m.transformPoint(v.p);
        v.n = m.transformDir(v.n).normalized();
    }
    recomputeBounds();
}

void Mesh::append(const Mesh& other, const Mat4& m, int matOverride) {
    uint32_t base = (uint32_t)verts.size();
    Mat4 nrm = m;
    for (auto& v : other.verts) {
        Vertex nv = v;
        nv.p = m.transformPoint(v.p);
        nv.n = m.transformDir(v.n).normalized();
        verts.push_back(nv);
    }
    for (auto& s : other.subs) {
        SubMesh ns;
        ns.start = base + s.start;
        ns.count = s.count;
        ns.material = matOverride >= 0 ? matOverride : s.material;
        subs.push_back(ns);
    }
    for (auto i : other.idx) idx.push_back(base + i);
    recomputeBounds();
}

// ---------------------------------------------------------------- MeshBuilder
void MeshBuilder::begin() {
    mesh.clear();
    subStart = 0;
    subMat = -1;
    started = false;
}

void MeshBuilder::finishSub() {
    if (mesh.idx.size() > subStart) {
        SubMesh s; s.start = subStart; s.count = (uint32_t)(mesh.idx.size() - subStart); s.material = subMat;
        mesh.subs.push_back(s);
    }
    subStart = (uint32_t)mesh.idx.size();
    subMat = -1;
}

uint32_t MeshBuilder::vert(const Vec3& p, const Vec3& n, const Vec2& uv) {
    return vert(p, n, uv, tint);
}

uint32_t MeshBuilder::vert(const Vec3& p, const Vec3& n, const Vec2& uv, const Vec4& col) {
    mesh.verts.emplace_back(p, n, uv, col);
    return (uint32_t)mesh.verts.size() - 1;
}

void MeshBuilder::tri(uint32_t a, uint32_t b, uint32_t c) {
    if (subMat != currentMaterial) { finishSub(); subMat = currentMaterial; }
    mesh.idx.push_back(a); mesh.idx.push_back(b); mesh.idx.push_back(c);
}

void MeshBuilder::tri(const Vec3& a, const Vec3& b, const Vec3& c, const Vec3& n) {
    Vec3 fn = (b - a).cross(c - a).normalized();
    if (fn.dot(n) < 0) { uint32_t i0 = vert(a,n,{0,0}), i1 = vert(c,n,{1,0}), i2 = vert(b,n,{0,1}); tri(i0,i1,i2); }
    else { uint32_t i0 = vert(a,n,{0,0}), i1 = vert(b,n,{1,0}), i2 = vert(c,n,{0,1}); tri(i0,i1,i2); }
}

void MeshBuilder::quad(uint32_t a, uint32_t b, uint32_t c, uint32_t d) {
    tri(a, b, c); tri(a, c, d);
}

void MeshBuilder::quad(const Vec3& a, const Vec3& b, const Vec3& c, const Vec3& d, const Vec3& n) {
    uint32_t i0 = vert(a,n,{0,0}), i1 = vert(b,n,{1,0}), i2 = vert(c,n,{1,1}), i3 = vert(d,n,{0,1});
    // choose winding so the face normal matches n
    Vec3 fn = (b - a).cross(c - a).normalized();
    if (fn.dot(n) < 0) { quad(i0, i3, i2, i1); } else { quad(i0, i1, i2, i3); }
}

void MeshBuilder::quadUV(const Vec3& a, const Vec3& b, const Vec3& c, const Vec3& d, const Vec3& n,
                         const Vec2& ua, const Vec2& ub, const Vec2& uc, const Vec2& ud) {
    uint32_t i0 = vert(a,n,ua), i1 = vert(b,n,ub), i2 = vert(c,n,uc), i3 = vert(d,n,ud);
    Vec3 fn = (b - a).cross(c - a).normalized();
    if (fn.dot(n) < 0) { quad(i0, i3, i2, i1); } else { quad(i0, i1, i2, i3); }
}

void MeshBuilder::build(bool smoothNormals) {
    finishSub();
    mesh.finish(smoothNormals);
}

void MeshBuilder::boxMinMax(const Vec3& lo, const Vec3& hi, float uvScale) {
    Vec3 c = (lo + hi) * 0.5f, s = (hi - lo) * 0.5f;
    Vec3 p[8] = {
        {lo.x, lo.y, lo.z}, {hi.x, lo.y, lo.z}, {hi.x, lo.y, hi.z}, {lo.x, lo.y, hi.z},
        {lo.x, hi.y, lo.z}, {hi.x, hi.y, lo.z}, {hi.x, hi.y, hi.z}, {lo.x, hi.y, hi.z}
    };
    (void)c;
    float su = uvScale;
    // +Y top
    uint32_t a,b,c2,d;
    a = vert(p[4], {0,1,0}, {0,0}); b = vert(p[5], {0,1,0}, {s.x*2*su,0});
    c2 = vert(p[6], {0,1,0}, {s.x*2*su, s.z*2*su}); d = vert(p[7], {0,1,0}, {0,s.z*2*su});
    quad(a,b,c2,d);
    // -Y bottom
    a = vert(p[0], {0,-1,0}, {0,0}); b = vert(p[3], {0,-1,0}, {s.x*2*su,0});
    c2 = vert(p[2], {0,-1,0}, {s.x*2*su, s.z*2*su}); d = vert(p[1], {0,-1,0}, {0,s.z*2*su});
    quad(a,b,c2,d);
    // +Z
    a = vert(p[3], {0,0,1}, {0,0}); b = vert(p[2], {0,0,1}, {s.x*2*su,0});
    c2 = vert(p[6], {0,0,1}, {s.x*2*su, s.y*2*su}); d = vert(p[7], {0,0,1}, {0,s.y*2*su});
    quad(a,b,c2,d);
    // -Z
    a = vert(p[1], {0,0,-1}, {0,0}); b = vert(p[0], {0,0,-1}, {s.x*2*su,0});
    c2 = vert(p[4], {0,0,-1}, {s.x*2*su, s.y*2*su}); d = vert(p[5], {0,0,-1}, {0,s.y*2*su});
    quad(a,b,c2,d);
    // +X
    a = vert(p[2], {1,0,0}, {0,0}); b = vert(p[1], {1,0,0}, {s.z*2*su,0});
    c2 = vert(p[5], {1,0,0}, {s.z*2*su, s.y*2*su}); d = vert(p[6], {1,0,0}, {0,s.y*2*su});
    quad(a,b,c2,d);
    // -X
    a = vert(p[0], {-1,0,0}, {0,0}); b = vert(p[3], {-1,0,0}, {s.z*2*su,0});
    c2 = vert(p[7], {-1,0,0}, {s.z*2*su, s.y*2*su}); d = vert(p[4], {-1,0,0}, {0,s.y*2*su});
    quad(a,b,c2,d);
}

void MeshBuilder::box(const Vec3& center, const Vec3& size, float uvScale, bool bottom) {
    Vec3 h = size * 0.5f;
    Vec3 lo = center - h, hi = center + h;
    Vec3 p[8] = {
        {lo.x, lo.y, lo.z}, {hi.x, lo.y, lo.z}, {hi.x, lo.y, hi.z}, {lo.x, lo.y, hi.z},
        {lo.x, hi.y, lo.z}, {hi.x, hi.y, lo.z}, {hi.x, hi.y, hi.z}, {lo.x, hi.y, hi.z}
    };
    float w = size.x, hh = size.y, dd = size.z;
    uint32_t a,b,c,d;
    a = vert(p[4], {0,1,0}, {0,0}); b = vert(p[5], {0,1,0}, {w*uvScale,0});
    c = vert(p[6], {0,1,0}, {w*uvScale, dd*uvScale}); d = vert(p[7], {0,1,0}, {0,dd*uvScale});
    quad(a,b,c,d);
    if (bottom) {
        a = vert(p[0], {0,-1,0}, {0,0}); b = vert(p[3], {0,-1,0}, {w*uvScale,0});
        c = vert(p[2], {0,-1,0}, {w*uvScale, dd*uvScale}); d = vert(p[1], {0,-1,0}, {0,dd*uvScale});
        quad(a,b,c,d);
    }
    a = vert(p[3], {0,0,1}, {0,0}); b = vert(p[2], {0,0,1}, {w*uvScale,0});
    c = vert(p[6], {0,0,1}, {w*uvScale, hh*uvScale}); d = vert(p[7], {0,0,1}, {0,hh*uvScale});
    quad(a,b,c,d);
    a = vert(p[1], {0,0,-1}, {0,0}); b = vert(p[0], {0,0,-1}, {w*uvScale,0});
    c = vert(p[4], {0,0,-1}, {w*uvScale, hh*uvScale}); d = vert(p[5], {0,0,-1}, {0,hh*uvScale});
    quad(a,b,c,d);
    a = vert(p[2], {1,0,0}, {0,0}); b = vert(p[1], {1,0,0}, {dd*uvScale,0});
    c = vert(p[5], {1,0,0}, {dd*uvScale, hh*uvScale}); d = vert(p[6], {1,0,0}, {0,hh*uvScale});
    quad(a,b,c,d);
    a = vert(p[0], {-1,0,0}, {0,0}); b = vert(p[3], {-1,0,0}, {dd*uvScale,0});
    c = vert(p[7], {-1,0,0}, {dd*uvScale, hh*uvScale}); d = vert(p[4], {-1,0,0}, {0,hh*uvScale});
    quad(a,b,c,d);
}

void MeshBuilder::boxRot(const Vec3& center, const Vec3& size, const Mat4& rot, float uvScale) {
    Vec3 h = size * 0.5f;
    Vec3 base[8] = {
        {-h.x,-h.y,-h.z},{h.x,-h.y,-h.z},{h.x,-h.y,h.z},{-h.x,-h.y,h.z},
        {-h.x,h.y,-h.z},{h.x,h.y,-h.z},{h.x,h.y,h.z},{-h.x,h.y,h.z}
    };
    Vec3 p[8];
    for (int i = 0; i < 8; i++) p[i] = center + rot.transformDir(base[i]);
    Vec3 nx = rot.transformDir({1,0,0}), ny = rot.transformDir({0,1,0}), nz = rot.transformDir({0,0,1});
    float w = size.x, hh = size.y, dd = size.z;
    uint32_t a,b,c,d;
    a = vert(p[4], ny, {0,0}); b = vert(p[5], ny, {w*uvScale,0});
    c = vert(p[6], ny, {w*uvScale, dd*uvScale}); d = vert(p[7], ny, {0,dd*uvScale}); quad(a,b,c,d);
    a = vert(p[0], -ny, {0,0}); b = vert(p[3], -ny, {w*uvScale,0});
    c = vert(p[2], -ny, {w*uvScale, dd*uvScale}); d = vert(p[1], -ny, {0,dd*uvScale}); quad(a,b,c,d);
    a = vert(p[3], nz, {0,0}); b = vert(p[2], nz, {w*uvScale,0});
    c = vert(p[6], nz, {w*uvScale, hh*uvScale}); d = vert(p[7], nz, {0,hh*uvScale}); quad(a,b,c,d);
    a = vert(p[1], -nz, {0,0}); b = vert(p[0], -nz, {w*uvScale,0});
    c = vert(p[4], -nz, {w*uvScale, hh*uvScale}); d = vert(p[5], -nz, {0,hh*uvScale}); quad(a,b,c,d);
    a = vert(p[2], nx, {0,0}); b = vert(p[1], nx, {dd*uvScale,0});
    c = vert(p[5], nx, {dd*uvScale, hh*uvScale}); d = vert(p[6], nx, {0,hh*uvScale}); quad(a,b,c,d);
    a = vert(p[0], -nx, {0,0}); b = vert(p[3], -nx, {dd*uvScale,0});
    c = vert(p[7], -nx, {dd*uvScale, hh*uvScale}); d = vert(p[4], -nx, {0,hh*uvScale}); quad(a,b,c,d);
}

void MeshBuilder::cylinder(const Vec3& a, const Vec3& b, float radius, int seg, bool caps) {
    Vec3 axis = b - a;
    float len = axis.length();
    if (len < 1e-6f) return;
    Vec3 dir = axis / len;
    Vec3 up = std::fabs(dir.y) > 0.9f ? Vec3(1,0,0) : Vec3(0,1,0);
    Vec3 u = dir.cross(up).normalized();
    Vec3 v = dir.cross(u).normalized();
    std::vector<uint32_t> ringA(seg+1), ringB(seg+1);
    for (int i = 0; i <= seg; i++) {
        float ang = TAU * (float)i / (float)seg;
        Vec3 n = u * std::cos(ang) + v * std::sin(ang);
        float uvt = (float)i / (float)seg * TAU * radius;
        ringA[i] = vert(a + n * radius, n, {uvt, 0});
        ringB[i] = vert(b + n * radius, n, {uvt, len});
    }
    for (int i = 0; i < seg; i++) quad(ringA[i], ringA[i+1], ringB[i+1], ringB[i]);
    if (caps) {
        uint32_t ca = vert(a, -dir, {0,0}), cb = vert(b, dir, {0,0});
        for (int i = 0; i < seg; i++) {
            Vec3 n = u * std::cos(TAU*(float)i/(float)seg) + v * std::sin(TAU*(float)i/(float)seg);
            uint32_t i0 = vert(a + n * radius, -dir, {n.x, n.z});
            Vec3 n2 = u * std::cos(TAU*(float)(i+1)/(float)seg) + v * std::sin(TAU*(float)(i+1)/(float)seg);
            uint32_t i1 = vert(a + n2 * radius, -dir, {n2.x, n2.z});
            tri(ca, i0, i1);
            uint32_t j0 = vert(b + n * radius, dir, {n.x, n.z});
            uint32_t j1 = vert(b + n2 * radius, dir, {n2.x, n2.z});
            tri(cb, j1, j0);
        }
    }
}

void MeshBuilder::cone(const Vec3& base, const Vec3& tip, float radius, int seg) {
    Vec3 dir = (tip - base).normalized();
    Vec3 up = std::fabs(dir.y) > 0.9f ? Vec3(1,0,0) : Vec3(0,1,0);
    Vec3 u = dir.cross(up).normalized(), v = dir.cross(u).normalized();
    uint32_t apex = vert(tip, dir, {0,0});
    float len = (tip - base).length();
    for (int i = 0; i < seg; i++) {
        float a0 = TAU * i / seg, a1 = TAU * (i+1) / seg;
        Vec3 n0 = u * std::cos(a0) + v * std::sin(a0);
        Vec3 n1 = u * std::cos(a1) + v * std::sin(a1);
        Vec3 side = ((n0 + n1) * 0.5f + dir * (radius / std::max(0.05f, len))).normalized();
        uint32_t p0 = vert(base + n0 * radius, side, {0,0});
        uint32_t p1 = vert(base + n1 * radius, side, {1,0});
        tri(p0, p1, apex);
        // base cap
        uint32_t bc = vert(base, -dir, {0,0});
        uint32_t b0 = vert(base + n0 * radius, -dir, {n0.x,n0.z});
        uint32_t b1 = vert(base + n1 * radius, -dir, {n1.x,n1.z});
        tri(bc, b1, b0);
    }
}

void MeshBuilder::sphere(const Vec3& c, float r, int segU, int segV) {
    ellipsoid(c, {r, r, r}, segU, segV);
}

void MeshBuilder::ellipsoid(const Vec3& c, const Vec3& rad, int segU, int segV) {
    for (int j = 0; j <= segV; j++) {
        float v = (float)j / segV, phi = PI * v;
        for (int i = 0; i <= segU; i++) {
            float u = (float)i / segU, theta = TAU * u;
            Vec3 n(std::sin(phi) * std::cos(theta), std::cos(phi), std::sin(phi) * std::sin(theta));
            Vec3 p = c + n * rad;
            Vec3 nn = Vec3(n.x / std::max(1e-4f, rad.x), n.y / std::max(1e-4f, rad.y), n.z / std::max(1e-4f, rad.z)).normalized();
            if (j == 0 || j == segV) nn = n;
            vert(p, nn, {u * 2.0f, v});
        }
    }
    for (int j = 0; j < segV; j++) {
        for (int i = 0; i < segU; i++) {
            uint32_t a = j * (segU + 1) + i, b = a + 1, c2 = a + segU + 1, d = c2 + 1;
            if (j != 0) tri(a, c2, b);
            if (j != segV - 1) tri(b, c2, d);
        }
    }
}

void MeshBuilder::torus(const Vec3& c, const Vec3& axisIn, float R, float r, int segU, int segV) {
    Vec3 axis = axisIn.normalized();
    Vec3 u = (std::fabs(axis.y) > 0.9f ? Vec3(1,0,0) : Vec3(0,1,0)).cross(axis).normalized();
    Vec3 v = axis.cross(u);
    uint32_t base = (uint32_t)mesh.verts.size();
    for (int i = 0; i <= segU; i++) {
        float a = TAU * i / segU;
        Vec3 dir = u * std::cos(a) + v * std::sin(a);
        Vec3 center = c + dir * R;
        for (int j = 0; j <= segV; j++) {
            float b = TAU * j / segV;
            Vec3 n = dir * std::cos(b) + axis * std::sin(b);
            vert(center + n * r, n, {(float)i / segU * 4.0f, (float)j / segV});
        }
    }
    for (int i = 0; i < segU; i++) {
        for (int j = 0; j < segV; j++) {
            uint32_t a = base + i * (segV + 1) + j, b = a + segV + 1, c2 = b + 1, d = a + 1;
            quad(a, b, c2, d);
        }
    }
}

void MeshBuilder::lathe(const std::vector<Vec2>& profile, int seg, const Mat4& xform, bool capBottom, bool capTop) {
    // profile: x = radius, y = height (revolved about local Y)
    uint32_t base = (uint32_t)mesh.verts.size();
    int n = (int)profile.size();
    for (int i = 0; i <= seg; i++) {
        float a = TAU * (float)i / (float)seg;
        Vec3 dir(std::cos(a), 0, std::sin(a));
        for (int j = 0; j < n; j++) {
            Vec3 local(dir.x * profile[j].x, profile[j].y, dir.z * profile[j].x);
            // normal from profile tangent
            int ja = std::max(0, j - 1), jb = std::min(n - 1, j + 1);
            Vec2 tang = profile[jb] - profile[ja];
            Vec2 nrm(tang.y, -tang.x);
            Vec3 ln(nrm.x * dir.x, nrm.y, nrm.x * dir.z);
            if (ln.lengthSq() < 1e-8f) ln = dir;
            Vec3 wp = xform.transformPoint(local);
            Vec3 wn = xform.transformDir(ln).normalized();
            vert(wp, wn, {(float)i / seg * 2.0f, (float)j / (float)std::max(1, n - 1)});
        }
    }
    for (int i = 0; i < seg; i++) {
        for (int j = 0; j < n - 1; j++) {
            uint32_t a = base + i * n + j, b = a + n, c2 = b + 1, d = a + 1;
            quad(a, b, c2, d);
        }
    }
    if (capBottom && profile[0].x > 1e-4f) {
        Vec3 cc = xform.transformPoint({0, profile[0].y, 0});
        Vec3 nn = xform.transformDir({0,-1,0}).normalized();
        for (int i = 0; i < seg; i++) {
            float a0 = TAU * i / seg, a1 = TAU * (i+1) / seg;
            Vec3 p0 = xform.transformPoint({std::cos(a0) * profile[0].x, profile[0].y, std::sin(a0) * profile[0].x});
            Vec3 p1 = xform.transformPoint({std::cos(a1) * profile[0].x, profile[0].y, std::sin(a1) * profile[0].x});
            uint32_t i0 = vert(p0, nn, {0,0}), i1 = vert(p1, nn, {1,0}), ic = vert(cc, nn, {0.5f,0.5f});
            tri(ic, i0, i1);
        }
    }
    if (capTop && profile[n-1].x > 1e-4f) {
        Vec3 cc = xform.transformPoint({0, profile[n-1].y, 0});
        Vec3 nn = xform.transformDir({0,1,0}).normalized();
        for (int i = 0; i < seg; i++) {
            float a0 = TAU * i / seg, a1 = TAU * (i+1) / seg;
            Vec3 p0 = xform.transformPoint({std::cos(a0) * profile[n-1].x, profile[n-1].y, std::sin(a0) * profile[n-1].x});
            Vec3 p1 = xform.transformPoint({std::cos(a1) * profile[n-1].x, profile[n-1].y, std::sin(a1) * profile[n-1].x});
            uint32_t i0 = vert(p0, nn, {0,0}), i1 = vert(p1, nn, {1,0}), ic = vert(cc, nn, {0.5f,0.5f});
            tri(ic, i1, i0);
        }
    }
}

void MeshBuilder::strip(const std::vector<Vec3>& a, const std::vector<Vec3>& b, bool closed, bool flip) {
    size_t n = std::min(a.size(), b.size());
    if (n < 2) return;
    for (size_t i = 0; i + 1 < n; i++) {
        Vec3 nrm = (a[i+1] - a[i]).cross(b[i] - a[i]).normalized();
        if (flip) nrm = -nrm;
        uint32_t i0 = vert(a[i], nrm, {(float)i * 0.1f, 0});
        uint32_t i1 = vert(a[i+1], nrm, {(float)(i+1) * 0.1f, 0});
        uint32_t i2 = vert(b[i+1], nrm, {(float)(i+1) * 0.1f, 1});
        uint32_t i3 = vert(b[i], nrm, {(float)i * 0.1f, 1});
        quad(i0, i1, i2, i3);
    }
    if (closed) {
        Vec3 nrm = (a[0] - a[n-1]).cross(b[n-1] - a[n-1]).normalized();
        if (flip) nrm = -nrm;
        uint32_t i0 = vert(a[n-1], nrm, {(float)(n-1) * 0.1f, 0});
        uint32_t i1 = vert(a[0], nrm, {0, 0});
        uint32_t i2 = vert(b[0], nrm, {0, 1});
        uint32_t i3 = vert(b[n-1], nrm, {(float)(n-1) * 0.1f, 1});
        quad(i0, i1, i2, i3);
    }
}

void MeshBuilder::disc(const Vec3& c, const Vec3& n, float r, int seg) {
    uint32_t ic = vert(c, n, {0.5f, 0.5f});
    uint32_t base = (uint32_t)mesh.verts.size();
    Vec3 up = std::fabs(n.y) > 0.9f ? Vec3(1,0,0) : Vec3(0,1,0);
    Vec3 u = n.cross(up).normalized(), v = n.cross(u);
    for (int i = 0; i < seg; i++) {
        float a = TAU * i / seg;
        Vec3 p = c + (u * std::cos(a) + v * std::sin(a)) * r;
        vert(p, n, {0.5f + std::cos(a) * 0.5f, 0.5f + std::sin(a) * 0.5f});
    }
    for (int i = 0; i < seg; i++) tri(ic, base + i, base + (i+1) % seg);
}

void MeshBuilder::ring(const Vec3& c, const Vec3& n, float r0, float r1, int seg) {
    Vec3 up = std::fabs(n.y) > 0.9f ? Vec3(1,0,0) : Vec3(0,1,0);
    Vec3 u = n.cross(up).normalized(), v = n.cross(u);
    for (int i = 0; i < seg; i++) {
        float a0 = TAU * i / seg, a1 = TAU * (i+1) / seg;
        Vec3 d0 = u * std::cos(a0) + v * std::sin(a0);
        Vec3 d1 = u * std::cos(a1) + v * std::sin(a1);
        uint32_t p0 = vert(c + d0 * r0, n, {0,0}), p1 = vert(c + d1 * r0, n, {1,0});
        uint32_t p2 = vert(c + d1 * r1, n, {1,1}), p3 = vert(c + d0 * r1, n, {0,1});
        quad(p0, p1, p2, p3);
    }
}

void MeshBuilder::quadStrip(const std::vector<Vec3>& pts, const Vec3& n) {
    for (size_t i = 0; i + 1 < pts.size(); i++) {
        uint32_t i0 = vert(pts[i], n, {(float)i, 0});
        uint32_t i1 = vert(pts[i+1], n, {(float)i + 1, 0});
        uint32_t i2 = vert(pts[i+1] + Vec3(0,0.001f,0), n, {(float)i + 1, 1});
        uint32_t i3 = vert(pts[i] + Vec3(0,0.001f,0), n, {(float)i, 1});
        quad(i0, i1, i2, i3);
    }
}

void MeshBuilder::addMesh(const Mesh& m, const Mat4& xform, int matOverride) {
    uint32_t vbase = (uint32_t)mesh.verts.size();
    for (auto& v : m.verts) {
        Vertex nv = v;
        nv.p = xform.transformPoint(v.p);
        nv.n = xform.transformDir(v.n).normalized();
        mesh.verts.push_back(nv);
    }
    for (auto& s : m.subs) {
        int mat = matOverride >= 0 ? matOverride : s.material;
        if (subMat != mat) { finishSub(); subMat = mat; }
        for (uint32_t k = 0; k < s.count; k++) mesh.idx.push_back(vbase + m.idx[s.start + k]);
    }
    if (m.subs.empty()) {
        if (subMat != currentMaterial) { finishSub(); subMat = currentMaterial; }
        for (auto i : m.idx) mesh.idx.push_back(vbase + i);
    }
}

void MeshBuilder::roundedBox(const Vec3& center, const Vec3& size, float radius, int seg, float uvScale) {
    Vec3 h = size * 0.5f;
    Vec3 inner(std::max(0.0f, h.x - radius), std::max(0.0f, h.y - radius), std::max(0.0f, h.z - radius));
    int segU = seg * 2, segV = seg;
    uint32_t base = (uint32_t)mesh.verts.size();
    for (int j = 0; j <= segV; j++) {
        float v = (float)j / segV, phi = PI * v;
        for (int i = 0; i <= segU; i++) {
            float u = (float)i / segU, theta = TAU * u;
            Vec3 n(std::sin(phi) * std::cos(theta), std::cos(phi), std::sin(phi) * std::sin(theta));
            Vec3 p = center + vmin(vmax(n * 1000.0f, -inner), inner) + n * radius;
            Vec3 np = p - center;
            Vec3 nn = Vec3(0,0,0);
            // analytic-ish normal: direction from nearest inner-box point
            Vec3 ip = vmin(vmax(np, -inner), inner);
            nn = (np - ip);
            if (nn.lengthSq() < 1e-8f) nn = n;
            nn = nn.normalized();
            vert(p, nn, {u * (size.x + size.z) * uvScale * 0.5f, v * size.y * uvScale});
        }
    }
    for (int j = 0; j < segV; j++)
        for (int i = 0; i < segU; i++) {
            uint32_t a = base + j * (segU + 1) + i, b = a + 1, c2 = a + segU + 1, d = c2 + 1;
            if (j != 0) tri(a, c2, b);
            if (j != segV - 1) tri(b, c2, d);
        }
}

} // namespace hv
