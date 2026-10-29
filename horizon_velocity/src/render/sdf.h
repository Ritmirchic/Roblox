// HORIZON VELOCITY - signed distance field primitives
#pragma once
#include "core/math.h"

namespace hv {
namespace sdf {

inline float sphere(const Vec3& p, const Vec3& c, float r) { return (p - c).length() - r; }

inline float ellipsoid(const Vec3& p, const Vec3& c, const Vec3& r) {
    Vec3 q = (p - c) / r;
    float k0 = q.length();
    if (k0 < 1e-5f) return -std::min(r.x, std::min(r.y, r.z));
    Vec3 q2 = q / r;
    float k1 = q2.length();
    return k0 * (k0 - 1.0f) / std::max(1e-6f, k1);
}

inline float box(const Vec3& p, const Vec3& c, const Vec3& h) {
    Vec3 q = vabs(p - c) - h;
    return vmax(q, Vec3(0,0,0)).length() + std::min(std::max(q.x, std::max(q.y, q.z)), 0.0f);
}

inline float roundBox(const Vec3& p, const Vec3& c, const Vec3& h, float r) {
    Vec3 q = vabs(p - c) - (h - Vec3(r, r, r));
    return vmax(q, Vec3(0,0,0)).length() + std::min(std::max(q.x, std::max(q.y, q.z)), 0.0f) - r;
}

inline float capsule(const Vec3& p, const Vec3& a, const Vec3& b, float r) {
    Vec3 pa = p - a, ba = b - a;
    float h = saturate(pa.dot(ba) / std::max(1e-6f, ba.dot(ba)));
    return (pa - ba * h).length() - r;
}

// infinite cylinder along Y
inline float cylinderY(const Vec3& p, const Vec3& c, float r) {
    Vec2 d(p.x - c.x, p.z - c.z);
    return d.length() - r;
}
// finite cylinder along Y
inline float cylinderY(const Vec3& p, const Vec3& c, float r, float halfH) {
    Vec2 d(std::fabs(p.x - c.x), std::fabs(p.z - c.z));
    float dr = d.length() - r;
    float dy = std::fabs(p.y - c.y) - halfH;
    return std::min(std::max(dr, dy), 0.0f) + Vec2(std::max(dr, 0.0f), std::max(dy, 0.0f)).length();
}
// finite cylinder along X (used for wheel arches)
inline float cylinderX(const Vec3& p, const Vec3& c, float r, float halfH) {
    float dzy = Vec2(p.z - c.z, p.y - c.y).length() - r;
    float dx = std::fabs(p.x - c.x) - halfH;
    return std::min(std::max(dzy, dx), 0.0f) + Vec2(std::max(dzy, 0.0f), std::max(dx, 0.0f)).length();
}
inline float cylinderZ(const Vec3& p, const Vec3& c, float r, float halfH) {
    float dxy = Vec2(p.x - c.x, p.y - c.y).length() - r;
    float dz = std::fabs(p.z - c.z) - halfH;
    return std::min(std::max(dxy, dz), 0.0f) + Vec2(std::max(dxy, 0.0f), std::max(dz, 0.0f)).length();
}

inline float torusX(const Vec3& p, const Vec3& c, float R, float r) {
    float a = Vec2(p.y - c.y, p.z - c.z).length() - R;
    float b = p.x - c.x;
    return Vec2(a, b).length() - r;
}

inline float planeY(const Vec3& p, float y) { return p.y - y; }
inline float planeX(const Vec3& p, float x) { return p.x - x; }

// smooth minimum / maximum
inline float smin(float a, float b, float k) {
    if (k <= 1e-6f) return std::min(a, b);
    float h = saturate(0.5f + 0.5f * (b - a) / k);
    return lerpf(b, a, h) - k * h * (1.0f - h);
}
inline float smax(float a, float b, float k) {
    return -smin(-a, -b, k);
}
inline float subtract(float a, float b) { return std::max(a, -b); }
inline float intersect(float a, float b) { return std::max(a, b); }
inline float onion(float d, float thickness) { return std::fabs(d) - thickness; }

// 2D helpers
inline float roundRect2(Vec2 p, Vec2 c, Vec2 h, float r) {
    Vec2 q(std::fabs(p.x - c.x) - h.x + r, std::fabs(p.y - c.y) - h.y + r);
    return Vec2(std::max(q.x, 0.0f), std::max(q.y, 0.0f)).length() + std::min(std::max(q.x, q.y), 0.0f) - r;
}
inline float segmentDist2(Vec2 p, Vec2 a, Vec2 b) {
    Vec2 pa = p - a, ba = b - a;
    float h = saturate(pa.dot(ba) / std::max(1e-6f, ba.dot(ba)));
    return (pa - ba * h).length();
}

} // namespace sdf
} // namespace hv
