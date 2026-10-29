// HORIZON VELOCITY - core math
#pragma once
#include <cmath>
#include <cstdint>
#include <algorithm>

namespace hv {

constexpr float PI = 3.14159265358979f;
constexpr float TAU = 6.28318530717958f;
constexpr float DEG = PI / 180.0f;
constexpr float RAD = 180.0f / PI;

inline float clampf(float v, float a, float b) { return v < a ? a : (v > b ? b : v); }
inline float saturate(float v) { return clampf(v, 0.0f, 1.0f); }
inline float lerpf(float a, float b, float t) { return a + (b - a) * t; }
inline float signf(float v) { return v < 0.0f ? -1.0f : 1.0f; }
inline float sqr(float v) { return v * v; }
inline float smoothstepf(float e0, float e1, float x) {
    float t = clampf((x - e0) / (e1 - e0 + 1e-9f), 0.0f, 1.0f);
    return t * t * (3.0f - 2.0f * t);
}
inline float moveTowards(float cur, float target, float maxDelta) {
    if (std::fabs(target - cur) <= maxDelta) return target;
    return cur + signf(target - cur) * maxDelta;
}
// frame-rate independent exponential smoothing
inline float damp(float cur, float target, float rate, float dt) {
    return lerpf(cur, target, 1.0f - std::exp(-rate * dt));
}

struct Vec2 {
    float x = 0, y = 0;
    Vec2() {}
    Vec2(float x_, float y_) : x(x_), y(y_) {}
    Vec2 operator+(const Vec2& o) const { return {x + o.x, y + o.y}; }
    Vec2 operator-(const Vec2& o) const { return {x - o.x, y - o.y}; }
    Vec2 operator*(float s) const { return {x * s, y * s}; }
    Vec2 operator/(float s) const { return {x / s, y / s}; }
    Vec2& operator+=(const Vec2& o) { x += o.x; y += o.y; return *this; }
    Vec2& operator-=(const Vec2& o) { x -= o.x; y -= o.y; return *this; }
    Vec2& operator*=(float s) { x *= s; y *= s; return *this; }
    float length() const { return std::sqrt(x * x + y * y); }
    float dot(const Vec2& o) const { return x * o.x + y * o.y; }
};
inline Vec2 operator*(float s, const Vec2& v) { return {v.x * s, v.y * s}; }

struct Vec3 {
    float x = 0, y = 0, z = 0;
    Vec3() {}
    Vec3(float v) : x(v), y(v), z(v) {}
    Vec3(float x_, float y_, float z_) : x(x_), y(y_), z(z_) {}
    Vec3 operator+(const Vec3& o) const { return {x + o.x, y + o.y, z + o.z}; }
    Vec3 operator-(const Vec3& o) const { return {x - o.x, y - o.y, z - o.z}; }
    Vec3 operator-() const { return {-x, -y, -z}; }
    Vec3 operator*(float s) const { return {x * s, y * s, z * s}; }
    Vec3 operator*(const Vec3& o) const { return {x * o.x, y * o.y, z * o.z}; }
    Vec3 operator/(float s) const { float i = 1.0f / s; return {x * i, y * i, z * i}; }
    Vec3 operator/(const Vec3& o) const { return {x / o.x, y / o.y, z / o.z}; }
    Vec3& operator+=(const Vec3& o) { x += o.x; y += o.y; z += o.z; return *this; }
    Vec3& operator-=(const Vec3& o) { x -= o.x; y -= o.y; z -= o.z; return *this; }
    Vec3& operator*=(float s) { x *= s; y *= s; z *= s; return *this; }
    float dot(const Vec3& o) const { return x * o.x + y * o.y + z * o.z; }
    Vec3 cross(const Vec3& o) const {
        return {y * o.z - z * o.y, z * o.x - x * o.z, x * o.y - y * o.x};
    }
    float length() const { return std::sqrt(x * x + y * y + z * z); }
    float lengthSq() const { return x * x + y * y + z * z; }
    Vec3 normalized() const { float l = length(); return l > 1e-8f ? *this / l : Vec3(0, 0, 0); }
    float& operator[](int i) { return (&x)[i]; }
    const float& operator[](int i) const { return (&x)[i]; }
};
inline Vec3 operator*(float s, const Vec3& v) { return v * s; }
inline float distance(const Vec3& a, const Vec3& b) { return (a - b).length(); }
inline Vec3 vmin(const Vec3& a, const Vec3& b) { return {std::min(a.x,b.x),std::min(a.y,b.y),std::min(a.z,b.z)}; }
inline Vec3 vmax(const Vec3& a, const Vec3& b) { return {std::max(a.x,b.x),std::max(a.y,b.y),std::max(a.z,b.z)}; }
inline Vec3 vlerp(const Vec3& a, const Vec3& b, float t) { return a + (b - a) * t; }
inline Vec3 vabs(const Vec3& a) { return {std::fabs(a.x), std::fabs(a.y), std::fabs(a.z)}; }
inline Vec3 reflectVec(const Vec3& d, const Vec3& n) { return d - n * (2.0f * d.dot(n)); }
inline Vec3 rotateAround(const Vec3& v, const Vec3& axis, float angle) {
    float c = std::cos(angle), s = std::sin(angle);
    return v * c + axis.cross(v) * s + axis * (axis.dot(v) * (1 - c));
}

struct Vec4 {
    float x = 0, y = 0, z = 0, w = 0;
    Vec4() {}
    Vec4(float x_, float y_, float z_, float w_) : x(x_), y(y_), z(z_), w(w_) {}
    Vec4(const Vec3& v, float w_) : x(v.x), y(v.y), z(v.z), w(w_) {}
    Vec3 xyz() const { return {x, y, z}; }
    Vec4 operator+(const Vec4& o) const { return {x + o.x, y + o.y, z + o.z, w + o.w}; }
    Vec4 operator*(float s) const { return {x * s, y * s, z * s, w * s}; }
};

// Column-major 4x4 matrix (m[col*4+row]), compatible with OpenGL layout.
struct Mat4 {
    float m[16];
    Mat4() { for (int i = 0; i < 16; i++) m[i] = (i % 5 == 0) ? 1.0f : 0.0f; }
    static Mat4 identity() { return Mat4(); }
    static Mat4 zero() { Mat4 r; for (int i = 0; i < 16; i++) r.m[i] = 0; return r; }
    float& at(int row, int col) { return m[col * 4 + row]; }
    float at(int row, int col) const { return m[col * 4 + row]; }

    Mat4 operator*(const Mat4& o) const {
        Mat4 r = zero();
        for (int c = 0; c < 4; c++){
            for (int rw = 0; rw < 4; rw++) {
                float s = 0;
                for (int k = 0; k < 4; k++) s += at(rw, k) * o.at(k, c);
                r.at(rw, c) = s;
            }
        }
        return r;
    }
    Vec4 operator*(const Vec4& v) const {
        return {at(0,0)*v.x + at(0,1)*v.y + at(0,2)*v.z + at(0,3)*v.w,
                at(1,0)*v.x + at(1,1)*v.y + at(1,2)*v.z + at(1,3)*v.w,
                at(2,0)*v.x + at(2,1)*v.y + at(2,2)*v.z + at(2,3)*v.w,
                at(3,0)*v.x + at(3,1)*v.y + at(3,2)*v.z + at(3,3)*v.w};
    }
    Vec3 transformPoint(const Vec3& p) const {
        Vec4 r = (*this) * Vec4(p, 1.0f);
        return {r.x, r.y, r.z};
    }
    Vec3 transformDir(const Vec3& d) const {
        return {at(0,0)*d.x + at(0,1)*d.y + at(0,2)*d.z,
                at(1,0)*d.x + at(1,1)*d.y + at(1,2)*d.z,
                at(2,0)*d.x + at(2,1)*d.y + at(2,2)*d.z};
    }
    static Mat4 translation(const Vec3& t) {
        Mat4 r; r.at(0,3) = t.x; r.at(1,3) = t.y; r.at(2,3) = t.z; return r;
    }
    static Mat4 scale(const Vec3& s) {
        Mat4 r; r.at(0,0) = s.x; r.at(1,1) = s.y; r.at(2,2) = s.z; return r;
    }
    static Mat4 scale(float s) { return scale(Vec3(s, s, s)); }
    static Mat4 rotationX(float a) {
        Mat4 r; float c = std::cos(a), s = std::sin(a);
        r.at(1,1) = c; r.at(1,2) = -s; r.at(2,1) = s; r.at(2,2) = c; return r;
    }
    static Mat4 rotationY(float a) {
        Mat4 r; float c = std::cos(a), s = std::sin(a);
        r.at(0,0) = c; r.at(0,2) = s; r.at(2,0) = -s; r.at(2,2) = c; return r;
    }
    static Mat4 rotationZ(float a) {
        Mat4 r; float c = std::cos(a), s = std::sin(a);
        r.at(0,0) = c; r.at(0,1) = -s; r.at(1,0) = s; r.at(1,1) = c; return r;
    }
    // yaw around Y, pitch around X, roll around Z  (applied roll->pitch->yaw)
    static Mat4 euler(float pitch, float yaw, float roll) {
        return rotationY(yaw) * rotationX(pitch) * rotationZ(roll);
    }
    static Mat4 axisAngle(const Vec3& axisIn, float angle) {
        Vec3 axis = axisIn.normalized();
        float c = std::cos(angle), s = std::sin(angle), t = 1 - c;
        float x = axis.x, y = axis.y, z = axis.z;
        Mat4 r;
        r.at(0,0) = t*x*x + c;   r.at(0,1) = t*x*y - s*z; r.at(0,2) = t*x*z + s*y;
        r.at(1,0) = t*x*y + s*z; r.at(1,1) = t*y*y + c;   r.at(1,2) = t*y*z - s*x;
        r.at(2,0) = t*x*z - s*y; r.at(2,1) = t*y*z + s*x; r.at(2,2) = t*z*z + c;
        return r;
    }
    Mat4 transposed() const {
        Mat4 r;
        for (int i = 0; i < 4; i++) for (int j = 0; j < 4; j++) r.at(i, j) = at(j, i);
        return r;
    }
    static Mat4 perspective(float fovY, float aspect, float zn, float zf) {
        float f = 1.0f / std::tan(fovY * 0.5f);
        Mat4 r = zero();
        r.at(0,0) = f / aspect;
        r.at(1,1) = f;
        r.at(2,2) = (zf + zn) / (zn - zf);
        r.at(2,3) = (2.0f * zf * zn) / (zn - zf);
        r.at(3,2) = -1.0f;
        return r;
    }
    static Mat4 ortho(float l, float r_, float b, float t, float zn, float zf) {
        Mat4 r = zero();
        r.at(0,0) = 2.0f / (r_ - l);
        r.at(1,1) = 2.0f / (t - b);
        r.at(2,2) = -2.0f / (zf - zn);
        r.at(0,3) = -(r_ + l) / (r_ - l);
        r.at(1,3) = -(t + b) / (t - b);
        r.at(2,3) = -(zf + zn) / (zf - zn);
        r.at(3,3) = 1.0f;
        return r;
    }
    static Mat4 lookAt(const Vec3& eye, const Vec3& center, const Vec3& up) {
        Vec3 f = (center - eye).normalized();
        Vec3 s = f.cross(up).normalized();
        Vec3 u = s.cross(f);
        Mat4 r;
        r.at(0,0) = s.x; r.at(0,1) = s.y; r.at(0,2) = s.z; r.at(0,3) = -s.dot(eye);
        r.at(1,0) = u.x; r.at(1,1) = u.y; r.at(1,2) = u.z; r.at(1,3) = -u.dot(eye);
        r.at(2,0) = -f.x; r.at(2,1) = -f.y; r.at(2,2) = -f.z; r.at(2,3) = f.dot(eye);
        return r;
    }
    bool invert(Mat4& out) const;
};

struct AABB {
    Vec3 lo{1e30f, 1e30f, 1e30f}, hi{-1e30f, -1e30f, -1e30f};
    void add(const Vec3& p) { lo = vmin(lo, p); hi = vmax(hi, p); }
    void add(const AABB& b) { lo = vmin(lo, b.lo); hi = vmax(hi, b.hi); }
    bool valid() const { return lo.x <= hi.x; }
    Vec3 center() const { return (lo + hi) * 0.5f; }
    Vec3 extent() const { return hi - lo; }
    float radius() const { return valid() ? (hi - lo).length() * 0.5f : 0.0f; }
    bool overlaps(const AABB& o) const {
        return lo.x <= o.hi.x && hi.x >= o.lo.x && lo.y <= o.hi.y && hi.y >= o.lo.y &&
               lo.z <= o.hi.z && hi.z >= o.lo.z;
    }
    bool contains(const Vec3& p) const {
        return p.x >= lo.x && p.x <= hi.x && p.y >= lo.y && p.y <= hi.y && p.z >= lo.z && p.z <= hi.z;
    }
};

// ---- colour helpers ----
struct Color {
    float r = 1, g = 1, b = 1, a = 1;
    Color() {}
    Color(float r_, float g_, float b_, float a_ = 1.0f) : r(r_), g(g_), b(b_), a(a_) {}
    Vec3 rgb() const { return {r, g, b}; }
    static Color fromHex(uint32_t hex, float a = 1.0f) {
        return Color(((hex >> 16) & 0xFF) / 255.0f, ((hex >> 8) & 0xFF) / 255.0f, (hex & 0xFF) / 255.0f, a);
    }
};
inline Color lerpColor(const Color& a, const Color& b, float t) {
    return Color(lerpf(a.r,b.r,t), lerpf(a.g,b.g,t), lerpf(a.b,b.b,t), lerpf(a.a,b.a,t));
}

// Ray/plane/sphere intersection helpers
inline bool raySphere(const Vec3& ro, const Vec3& rd, const Vec3& c, float r, float& t) {
    Vec3 oc = ro - c;
    float b = oc.dot(rd);
    float cc = oc.dot(oc) - r * r;
    float disc = b * b - cc;
    if (disc < 0) return false;
    float sd = std::sqrt(disc);
    float t0 = -b - sd;
    t = t0 >= 0 ? t0 : (-b + sd);
    return t >= 0;
}

} // namespace hv
