// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Core foundation: math, types, containers, utilities.
// ============================================================================
#pragma once
#include <cstdint>
#include <cstddef>
#include <cmath>
#include <cstring>
#include <string>
#include <vector>
#include <map>
#include <unordered_map>
#include <algorithm>
#include <functional>

namespace aoh {

typedef float f32;
typedef double f64;
typedef uint32_t u32;
typedef uint16_t u16;
typedef uint8_t  u8;
typedef int32_t  i32;
typedef int64_t  i64;
typedef uint64_t u64;

static const f32 PI = 3.14159265358979323846f;
static const f32 TAU = 6.28318530717958647692f;
static const f32 DEG = PI / 180.0f;
static const f32 RAD = 180.0f / PI;

inline f32 clampf(f32 v, f32 a, f32 b) { return v < a ? a : (v > b ? b : v); }
inline f32 saturate(f32 v) { return clampf(v, 0.0f, 1.0f); }
inline f32 lerpf(f32 a, f32 b, f32 t) { return a + (b - a) * t; }
inline f32 smoothstep(f32 e0, f32 e1, f32 x) { f32 t = saturate((x - e0) / (e1 - e0)); return t * t * (3.0f - 2.0f * t); }
inline i32   clampi(i32 v, i32 a, i32 b) { return v < a ? a : (v > b ? b : v); }
inline f32   deg2rad(f32 d) { return d * DEG; }
inline f32   rad2deg(f32 r) { return r * RAD; }
inline f32   signf(f32 v) { return v < 0.0f ? -1.0f : (v > 0.0f ? 1.0f : 0.0f); }
inline f32   moveTowards(f32 cur, f32 tgt, f32 maxDelta) { f32 d = tgt - cur; if (fabsf(d) <= maxDelta) return tgt; return cur + signf(d) * maxDelta; }
inline f32   wrapAngle(f32 a) { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; }

// ---------------------------------------------------------------------------
// Vector types
// ---------------------------------------------------------------------------
struct Vec2 {
  f32 x = 0, y = 0;
  Vec2() {}
  Vec2(f32 X, f32 Y) : x(X), y(Y) {}
  Vec2 operator+(const Vec2& o) const { return Vec2(x + o.x, y + o.y); }
  Vec2 operator-(const Vec2& o) const { return Vec2(x - o.x, y - o.y); }
  Vec2 operator*(f32 s) const { return Vec2(x * s, y * s); }
};
struct Vec3 {
  f32 x = 0, y = 0, z = 0;
  Vec3() {}
  Vec3(f32 X, f32 Y, f32 Z) : x(X), y(Y), z(Z) {}
  Vec3 operator+(const Vec3& o) const { return Vec3(x + o.x, y + o.y, z + o.z); }
  Vec3 operator-(const Vec3& o) const { return Vec3(x - o.x, y - o.y, z - o.z); }
  Vec3 operator*(f32 s) const { return Vec3(x * s, y * s, z * s); }
  Vec3 operator/(f32 s) const { return Vec3(x / s, y / s, z / s); }
  Vec3 operator-() const { return Vec3(-x, -y, -z); }
  Vec3& operator+=(const Vec3& o) { x += o.x; y += o.y; z += o.z; return *this; }
  Vec3& operator-=(const Vec3& o) { x -= o.x; y -= o.y; z -= o.z; return *this; }
  Vec3& operator*=(f32 s) { x *= s; y *= s; z *= s; return *this; }
  Vec3& operator/=(f32 s) { x /= s; y /= s; z /= s; return *this; }
  f32 operator[](int i) const { return (&x)[i]; }
  f32& operator[](int i) { return (&x)[i]; }
  bool operator==(const Vec3& o) const { return x == o.x && y == o.y && z == o.z; }
};
inline Vec3 operator*(f32 s, const Vec3& v) { return v * s; }
inline f32 dot(const Vec3& a, const Vec3& b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
inline Vec3 cross(const Vec3& a, const Vec3& b) { return Vec3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x); }
inline f32 lengthSq(const Vec3& v) { return dot(v, v); }
inline f32 length(const Vec3& v) { return sqrtf(dot(v, v)); }
inline Vec3 normalize(const Vec3& v) { f32 l = length(v); return l > 1e-8f ? v / l : Vec3(0, 0, 0); }
inline Vec3 vmin(const Vec3& a, const Vec3& b) { return Vec3(fminf(a.x, b.x), fminf(a.y, b.y), fminf(a.z, b.z)); }
inline Vec3 vmax(const Vec3& a, const Vec3& b) { return Vec3(fmaxf(a.x, b.x), fmaxf(a.y, b.y), fmaxf(a.z, b.z)); }
inline Vec3 lerp(const Vec3& a, const Vec3& b, f32 t) { return a + (b - a) * t; }
inline f32 dist(const Vec3& a, const Vec3& b) { return length(a - b); }
inline f32 dist2D(const Vec3& a, const Vec3& b) { f32 dx = a.x - b.x, dz = a.z - b.z; return sqrtf(dx * dx + dz * dz); }
inline f32 distSq2D(const Vec3& a, const Vec3& b) { f32 dx = a.x - b.x, dz = a.z - b.z; return dx * dx + dz * dz; }
inline Vec3 reflect(const Vec3& i, const Vec3& n) { return i - n * (2.0f * dot(i, n)); }

inline Vec2 vmin2(Vec2 a, Vec2 b) { return Vec2(fminf(a.x, b.x), fminf(a.y, b.y)); }
inline Vec2 vmax2(Vec2 a, Vec2 b) { return Vec2(fmaxf(a.x, b.x), fmaxf(a.y, b.y)); }
inline float len2(Vec2 v) { return sqrtf(v.x * v.x + v.y * v.y); }
inline float len2sq(Vec2 v) { return v.x * v.x + v.y * v.y; }
inline Vec2 norm2(Vec2 v) { float l = len2(v); return l > 1e-8f ? Vec2(v.x / l, v.y / l) : Vec2(0, 0); }
inline Vec2 lerp2(Vec2 a, Vec2 b, float t) { return Vec2(lerpf(a.x, b.x, t), lerpf(a.y, b.y, t)); }
inline Vec3 toVec3(Vec2 v, f32 y = 0) { return Vec3(v.x, y, v.y); }

// ---------------------------------------------------------------------------
// Quaternion
// ---------------------------------------------------------------------------
struct Quat {
  f32 x = 0, y = 0, z = 0, w = 1;
  Quat() {}
  Quat(f32 X, f32 Y, f32 Z, f32 W) : x(X), y(Y), z(Z), w(W) {}
  static Quat identity() { return Quat(0, 0, 0, 1); }
  static Quat fromAxisAngle(const Vec3& axis, f32 angle) {
    f32 h = angle * 0.5f, s = sinf(h);
    Vec3 a = normalize(axis);
    return Quat(a.x * s, a.y * s, a.z * s, cosf(h));
  }
  static Quat fromEuler(f32 pitch, f32 yaw, f32 roll) { // YXZ order
    f32 cy = cosf(yaw * 0.5f), sy = sinf(yaw * 0.5f);
    f32 cp = cosf(pitch * 0.5f), sp = sinf(pitch * 0.5f);
    f32 cr = cosf(roll * 0.5f), sr = sinf(roll * 0.5f);
    return Quat(sr * cp * cy - cr * sp * sy, cr * sp * cy + sr * cp * sy,
                cr * cp * sy - sr * sp * cy, cr * cp * cy + sr * sp * sy);
  }
  Quat operator*(const Quat& o) const {
    return Quat(w * o.x + x * o.w + y * o.z - z * o.y,
                w * o.y - x * o.z + y * o.w + z * o.x,
                w * o.z + x * o.y - y * o.x + z * o.w,
                w * o.w - x * o.x - y * o.y - z * o.z);
  }
  Vec3 operator*(const Vec3& v) const {
    Vec3 u(x, y, z);
    return u * (2.0f * dot(u, v)) + v * (w * w - dot(u, u)) + cross(u, v) * (2.0f * w);
  }
  Quat normalized() const {
    f32 l = sqrtf(x * x + y * y + z * z + w * w);
    if (l < 1e-8f) return identity();
    return Quat(x / l, y / l, z / l, w / l);
  }
  Quat conjugate() const { return Quat(-x, -y, -z, w); }
  f32 angle() const { return 2.0f * acosf(clampf(w, -1, 1)); }
  static Quat slerp(const Quat& a, const Quat& b, f32 t) {
    Quat q0 = a.normalized(), q1 = b.normalized();
    f32 d = q0.x * q1.x + q0.y * q1.y + q0.z * q1.z + q0.w * q1.w;
    if (d < 0) { q1 = Quat(-q1.x, -q1.y, -q1.z, -q1.w); d = -d; }
    if (d > 0.9995f) {
      Quat r(q0.x + (q1.x - q0.x) * t, q0.y + (q1.y - q0.y) * t, q0.z + (q1.z - q0.z) * t,
              q0.w + (q1.w - q0.w) * t);
      return r.normalized();
    }
    f32 th = acosf(clampf(d, -1, 1)), s = sinf(th);
    f32 w0 = sinf((1 - t) * th) / s, w1 = sinf(t * th) / s;
    return Quat(q0.x * w0 + q1.x * w1, q0.y * w0 + q1.y * w1, q0.z * w0 + q1.z * w1, q0.w * w0 + q1.w * w1).normalized();
  }
};
inline Quat quatLookRotation(const Vec3& fwd, const Vec3& up) {
  Vec3 f = normalize(fwd);
  Vec3 r = normalize(cross(up, f));
  Vec3 u = cross(f, r);
  f32 m00 = r.x, m01 = u.x, m02 = f.x;
  f32 m10 = r.y, m11 = u.y, m12 = f.y;
  f32 m20 = r.z, m21 = u.z, m22 = f.z;
  f32 tr = m00 + m11 + m22;
  Quat q;
  if (tr > 0) {
    f32 s = sqrtf(tr + 1.0f) * 2.0f;
    q.w = 0.25f * s; q.x = (m21 - m12) / s; q.y = (m02 - m20) / s; q.z = (m10 - m01) / s;
  } else if (m00 > m11 && m00 > m22) {
    f32 s = sqrtf(1.0f + m00 - m11 - m22) * 2.0f;
    q.w = (m21 - m12) / s; q.x = 0.25f * s; q.y = (m01 + m10) / s; q.z = (m02 + m20) / s;
  } else if (m11 > m22) {
    f32 s = sqrtf(1.0f + m11 - m00 - m22) * 2.0f;
    q.w = (m02 - m20) / s; q.x = (m01 + m10) / s; q.y = 0.25f * s; q.z = (m12 + m21) / s;
  } else {
    f32 s = sqrtf(1.0f + m22 - m00 - m11) * 2.0f;
    q.w = (m10 - m01) / s; q.x = (m02 + m20) / s; q.y = (m12 + m21) / s; q.z = 0.25f * s;
  }
  return q.normalized();
}

// ---------------------------------------------------------------------------
// Matrix (column-major, OpenGL layout)
// ---------------------------------------------------------------------------
struct Vec4 { f32 x=0,y=0,z=0,w=0; Vec4(){} Vec4(f32 X,f32 Y,f32 Z,f32 W):x(X),y(Y),z(Z),w(W){}
  f32 operator[](int i) const { return (&x)[i]; } f32& operator[](int i){return (&x)[i];}
  Vec4 operator+(const Vec4& o) const { return Vec4(x+o.x,y+o.y,z+o.z,w+o.w); }
  Vec4 operator-(const Vec4& o) const { return Vec4(x-o.x,y-o.y,z-o.z,w-o.w); }
  Vec4 operator*(f32 s) const { return Vec4(x*s,y*s,z*s,w*s); }
};
struct Mat4 {
  f32 m[16];
  Mat4() { identity(); }
  Mat4(f32 a00,f32 a01,f32 a02,f32 a03, f32 a10,f32 a11,f32 a12,f32 a13,
       f32 a20,f32 a21,f32 a22,f32 a23, f32 a30,f32 a31,f32 a32,f32 a33) {
    m[0]=a00; m[1]=a10; m[2]=a20; m[3]=a30;
    m[4]=a01; m[5]=a11; m[6]=a21; m[7]=a31;
    m[8]=a02; m[9]=a12; m[10]=a22; m[11]=a32;
    m[12]=a03; m[13]=a13; m[14]=a23; m[15]=a33;
  }
  void identity() { memset(m, 0, sizeof(m)); m[0] = m[5] = m[10] = m[15] = 1.0f; }
  static Mat4 identityMatrix() { Mat4 r; r.identity(); return r; }
  f32* data() { return m; }
  const f32* data() const { return m; }
  f32& at(int r, int c) { return m[c * 4 + r]; }
  f32 at(int r, int c) const { return m[c * 4 + r]; }

  Mat4 operator*(const Mat4& o) const {
    Mat4 r;
    for (int c = 0; c < 4; ++c)
      for (int row = 0; row < 4; ++row) {
        f32 s = 0;
        for (int k = 0; k < 4; ++k) s += at(row, k) * o.at(k, c);
        r.at(row, c) = s;
      }
    return r;
  }
  Vec4 operator*(const Vec4& v) const;
  Vec3 transformPoint(const Vec3& p) const {
    f32 x = m[0]*p.x + m[4]*p.y + m[8]*p.z + m[12];
    f32 y = m[1]*p.x + m[5]*p.y + m[9]*p.z + m[13];
    f32 z = m[2]*p.x + m[6]*p.y + m[10]*p.z + m[14];
    f32 w = m[3]*p.x + m[7]*p.y + m[11]*p.z + m[15];
    if (fabsf(w) > 1e-6f) { f32 iw = 1.0f / w; x *= iw; y *= iw; z *= iw; }
    return Vec3(x, y, z);
  }
  Vec3 transformDir(const Vec3& p) const {
    return Vec3(m[0]*p.x + m[4]*p.y + m[8]*p.z,
                m[1]*p.x + m[5]*p.y + m[9]*p.z,
                m[2]*p.x + m[6]*p.y + m[10]*p.z);
  }
  Mat4 translated(const Vec3& t) const { Mat4 r = *this; r.at(0,3)+=t.x; r.at(1,3)+=t.y; r.at(2,3)+=t.z; return r; }
  Mat4 scaled(const Vec3& s) const { Mat4 r = *this; for (int i=0;i<3;++i){ r.at(i,0)*=s.x; r.at(i,1)*=s.y; r.at(i,2)*=s.z; } return r; }
  Mat4 rotated(const Quat& q) const {
    Mat4 r; r.identity();
    f32 x=q.x,y=q.y,z=q.z,w=q.w;
    r.at(0,0)=1-2*(y*y+z*z); r.at(0,1)=2*(x*y-z*w);   r.at(0,2)=2*(x*z+y*w);
    r.at(1,0)=2*(x*y+z*w);   r.at(1,1)=1-2*(x*x+z*z); r.at(1,2)=2*(y*z-x*w);
    r.at(2,0)=2*(x*z-y*w);   r.at(2,1)=2*(y*z+x*w);   r.at(2,2)=1-2*(x*x+y*y);
    return r * (*this);
  }
  Mat4 transpose() const { Mat4 r; for (int i=0;i<4;++i) for (int j=0;j<4;++j) r.at(i,j)=at(j,i); return r; }
  static Mat4 perspective(f32 fovyRad, f32 aspect, f32 zn, f32 zf) {
    f32 f = 1.0f / tanf(fovyRad * 0.5f);
    Mat4 r; memset(r.m, 0, sizeof(r.m));
    r.at(0,0)=f/aspect; r.at(1,1)=f;
    r.at(2,2)=(zf+zn)/(zn-zf); r.at(2,3)=(2*zf*zn)/(zn-zf); r.at(3,2)=-1.0f;
    return r;
  }
  static Mat4 ortho(f32 l, f32 r_, f32 b, f32 t, f32 n, f32 f) {
    Mat4 r; memset(r.m, 0, sizeof(r.m));
    r.at(0,0)=2/(r_-l); r.at(1,1)=2/(t-b); r.at(2,2)=-2/(f-n);
    r.at(3,0)=-(r_+l)/(r_-l); r.at(3,1)=-(t+b)/(t-b); r.at(3,2)=-(f+n)/(f-n); r.at(3,3)=1;
    return r;
  }
  static Mat4 lookAt(const Vec3& eye, const Vec3& center, const Vec3& up) {
    Vec3 f = normalize(center - eye);
    Vec3 s = normalize(cross(f, up));
    Vec3 u = cross(s, f);
    Mat4 r;
    r.at(0,0)=s.x; r.at(0,1)=s.y; r.at(0,2)=s.z; r.at(0,3)=-dot(s, eye);
    r.at(1,0)=u.x; r.at(1,1)=u.y; r.at(1,2)=u.z; r.at(1,3)=-dot(u, eye);
    r.at(2,0)=-f.x; r.at(2,1)=-f.y; r.at(2,2)=-f.z; r.at(2,3)=dot(f, eye);
    r.at(3,0)=0; r.at(3,1)=0; r.at(3,2)=0; r.at(3,3)=1;
    return r;
  }
  // Inverse of a general 4x4 (used sparingly).
  Mat4 inverse() const;
};
inline Vec4 Mat4::operator*(const Vec4& v) const {
  return Vec4(m[0]*v.x+m[4]*v.y+m[8]*v.z+m[12]*v.w,
              m[1]*v.x+m[5]*v.y+m[9]*v.z+m[13]*v.w,
              m[2]*v.x+m[6]*v.y+m[10]*v.z+m[14]*v.w,
              m[3]*v.x+m[7]*v.y+m[11]*v.z+m[15]*v.w);
}
inline Mat4 Mat4::inverse() const {
  f32 inv[16];
  inv[0]=m[5]*m[10]*m[15]-m[5]*m[11]*m[14]-m[9]*m[6]*m[15]+m[9]*m[7]*m[14]+m[13]*m[6]*m[11]-m[13]*m[7]*m[10];
  inv[4]=-m[4]*m[10]*m[15]+m[4]*m[11]*m[14]+m[8]*m[6]*m[15]-m[8]*m[7]*m[14]-m[12]*m[6]*m[11]+m[12]*m[7]*m[10];
  inv[8]=m[4]*m[9]*m[15]-m[4]*m[11]*m[13]-m[8]*m[5]*m[15]+m[8]*m[7]*m[13]+m[12]*m[5]*m[11]-m[12]*m[7]*m[9];
  inv[12]=-m[4]*m[9]*m[14]+m[4]*m[10]*m[13]+m[8]*m[5]*m[14]-m[8]*m[6]*m[13]-m[12]*m[5]*m[10]+m[12]*m[6]*m[9];
  inv[1]=-m[1]*m[10]*m[15]+m[1]*m[11]*m[14]+m[9]*m[2]*m[15]-m[9]*m[3]*m[14]-m[13]*m[2]*m[11]+m[13]*m[3]*m[10];
  inv[5]=m[0]*m[10]*m[15]-m[0]*m[11]*m[14]-m[8]*m[2]*m[15]+m[8]*m[3]*m[14]+m[12]*m[2]*m[11]-m[12]*m[3]*m[10];
  inv[9]=-m[0]*m[9]*m[15]+m[0]*m[11]*m[13]+m[8]*m[1]*m[15]-m[8]*m[3]*m[13]-m[12]*m[1]*m[11]+m[12]*m[3]*m[9];
  inv[13]=m[0]*m[9]*m[14]-m[0]*m[10]*m[13]-m[8]*m[1]*m[14]+m[8]*m[2]*m[13]+m[12]*m[1]*m[10]-m[12]*m[2]*m[9];
  inv[2]=m[1]*m[6]*m[15]-m[1]*m[7]*m[14]-m[5]*m[2]*m[15]+m[5]*m[3]*m[14]+m[13]*m[2]*m[7]-m[13]*m[3]*m[6];
  inv[6]=-m[0]*m[6]*m[15]+m[0]*m[7]*m[14]+m[4]*m[2]*m[15]-m[4]*m[3]*m[14]-m[12]*m[2]*m[7]+m[12]*m[3]*m[6];
  inv[10]=m[0]*m[5]*m[15]-m[0]*m[7]*m[13]-m[4]*m[1]*m[15]+m[4]*m[3]*m[13]+m[12]*m[1]*m[7]-m[12]*m[3]*m[5];
  inv[14]=-m[0]*m[5]*m[14]+m[0]*m[6]*m[13]+m[4]*m[1]*m[14]-m[4]*m[2]*m[13]-m[12]*m[1]*m[6]+m[12]*m[2]*m[5];
  inv[3]=-m[1]*m[6]*m[11]+m[1]*m[7]*m[10]+m[5]*m[2]*m[11]-m[5]*m[3]*m[10]-m[9]*m[2]*m[7]+m[9]*m[3]*m[6];
  inv[7]=m[0]*m[6]*m[11]-m[0]*m[7]*m[10]-m[4]*m[2]*m[11]+m[4]*m[3]*m[10]+m[8]*m[2]*m[7]-m[8]*m[3]*m[6];
  inv[11]=-m[0]*m[5]*m[11]+m[0]*m[7]*m[9]+m[4]*m[1]*m[11]-m[4]*m[3]*m[9]-m[8]*m[1]*m[7]+m[8]*m[3]*m[5];
  inv[15]=m[0]*m[5]*m[10]-m[0]*m[6]*m[9]-m[4]*m[1]*m[10]+m[4]*m[2]*m[9]+m[8]*m[1]*m[6]-m[8]*m[2]*m[5];
  f32 det = m[0]*inv[0]+m[1]*inv[4]+m[2]*inv[8]+m[3]*inv[12];
  Mat4 r; if (fabsf(det) < 1e-12f) return r;
  det = 1.0f/det;
  for (int i=0;i<16;++i) r.m[i]=inv[i]*det;
  return r;
}

// ---------------------------------------------------------------------------
// AABB
// ---------------------------------------------------------------------------
struct AABB {
  Vec3 lo = Vec3(1e30f, 1e30f, 1e30f);
  Vec3 hi = Vec3(-1e30f, -1e30f, -1e30f);
  void reset() { lo = Vec3(1e30f, 1e30f, 1e30f); hi = Vec3(-1e30f, -1e30f, -1e30f); }
  void add(const Vec3& p) { lo = vmin(lo, p); hi = vmax(hi, p); }
  void add(const AABB& o) { lo = vmin(lo, o.lo); hi = vmax(hi, o.hi); }
  void expand(f32 e) { lo -= Vec3(e, e, e); hi += Vec3(e, e, e); }
  Vec3 center() const { return (lo + hi) * 0.5f; }
  Vec3 extent() const { return (hi - lo) * 0.5f; }
  bool valid() const { return lo.x <= hi.x; }
  bool contains(const Vec3& p) const { return p.x>=lo.x&&p.x<=hi.x&&p.y>=lo.y&&p.y<=hi.y&&p.z>=lo.z&&p.z<=hi.z; }
  bool overlaps(const AABB& o) const { return !(o.lo.x>hi.x||o.hi.x<lo.x||o.lo.y>hi.y||o.hi.y<lo.y||o.lo.z>hi.z||o.hi.z<lo.z); }
  bool containsXZ(const Vec3& p) const { return p.x>=lo.x&&p.x<=hi.x&&p.z>=lo.z&&p.z<=hi.z; }
  float distanceSq(const Vec3& p) const {
    f32 dx = fmaxf(fmaxf(lo.x-p.x, 0.0f), p.x-hi.x);
    f32 dy = fmaxf(fmaxf(lo.y-p.y, 0.0f), p.y-hi.y);
    f32 dz = fmaxf(fmaxf(lo.z-p.z, 0.0f), p.z-hi.z);
    return dx*dx+dy*dy+dz*dz;
  }
};

// ---------------------------------------------------------------------------
// Deterministic RNG (xorshift) - reproducible world generation
// ---------------------------------------------------------------------------
struct Rng {
  u64 s;
  Rng() : s(0x9E3779B97F4A7C15ull) {}
  explicit Rng(u64 seed) : s(seed ? seed : 0x9E3779B97F4A7C15ull) {}
  u64 next() { s ^= s << 13; s ^= s >> 7; s ^= s << 17; return s; }
  u32 u32v() { return (u32)(next() >> 32); }
  int rangei(int a, int b) { if (b <= a) return a; return a + (int)(u32v() % (u32)(b - a + 1)); }
  f32 rangef(f32 a, f32 b) { f32 t = (f32)((next() >> 40) & 0xFFFFFF) / 16777215.0f; return a + (b - a) * t; }
  f32 symf() { return rangef(-1.0f, 1.0f); }
  bool chance(f32 p) { return rangef(0, 1) < p; }
  Vec3 dir3() { f32 z = rangef(-1, 1), a = rangef(0, TAU), r = sqrtf(1 - z*z); return Vec3(r*cosf(a), z, r*sinf(a)); }
};

u64 hashString(const std::string& s);
f32 hashNoise(int x, int y, int seed = 0);
f32 valueNoise2D(f32 x, f32 y, int seed = 0);
f32 fbm2D(f32 x, f32 y, int octaves, f32 lacunarity = 2.0f, f32 gain = 0.5f, int seed = 0);

} // namespace aoh
