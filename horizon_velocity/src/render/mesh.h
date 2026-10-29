// HORIZON VELOCITY - mesh & material primitives
#pragma once
#include "core/math.h"
#include <vector>
#include <string>
#include <functional>

namespace hv {

struct Vertex {
    Vec3 p, n;
    Vec2 uv;
    Vec4 col; // per-vertex tint / baked ambient occlusion (rgb), a = extra
    Vertex() {}
    Vertex(const Vec3& p_, const Vec3& n_, const Vec2& uv_, const Vec4& c_) : p(p_), n(n_), uv(uv_), col(c_) {}
};

// Material shading model used by both the software and GPU backends.
enum class Shade : uint8_t {
    Lit = 0,       // standard PBR
    Emissive = 1,  // lights, lamps, screens
    Glass = 2,     // translucent
    Unlit = 3,     // UI / sky / decals
    Water = 4,
    Foliage = 5,   // two-sided, wind, alpha test
    CarPaint = 6,  // clearcoat + flakes
    Asphalt = 7,   // road surface with stripe mask
    NoiseRock = 8, // triplanar-ish rock
    Terrain = 9,   // vertex-coloured terrain blend
};

struct Material {
    Shade shade = Shade::Lit;
    Color albedo{1, 1, 1, 1};
    float metallic = 0.0f;
    float roughness = 0.5f;
    Color emissive{0, 0, 0, 1};
    Vec2 uvScale{1, 1};
    int texture = -1;    // index into renderer texture table (atlas page)
    float specular = 0.5f;
    float clearcoat = 0.0f;
    float opacity = 1.0f;
    bool doubleSided = false;
    float windStrength = 0.0f;
    std::string name;
};

struct SubMesh {
    uint32_t start = 0, count = 0;
    int material = 0;
};

struct Mesh {
    std::vector<Vertex> verts;
    std::vector<uint32_t> idx;
    std::vector<SubMesh> subs;
    AABB bounds;
    std::string name;

    void clear() { verts.clear(); idx.clear(); subs.clear(); bounds = AABB(); }
    void finish(bool smooth = false);
    void recomputeBounds();
    void transform(const Mat4& m);
    void append(const Mesh& other, const Mat4& m, int matOverride = -1);
    uint32_t triCount() const { return (uint32_t)(idx.size() / 3); }
    uint32_t vertexCount() const { return (uint32_t)verts.size(); }
};

// Incremental mesh construction helper.
class MeshBuilder {
public:
    Mesh mesh;
    int currentMaterial = 0;
    Vec4 tint{1, 1, 1, 1};

    void setMaterial(int m) { currentMaterial = m; }
    void setTint(const Vec4& t) { tint = t; }
    void begin();
    uint32_t vert(const Vec3& p, const Vec3& n, const Vec2& uv);
    uint32_t vert(const Vec3& p, const Vec3& n, const Vec2& uv, const Vec4& col);
    void tri(uint32_t a, uint32_t b, uint32_t c);
    void tri(const Vec3& a, const Vec3& b, const Vec3& c, const Vec3& n);
    void quad(uint32_t a, uint32_t b, uint32_t c, uint32_t d);
    void quad(const Vec3& a, const Vec3& b, const Vec3& c, const Vec3& d, const Vec3& n);
    // textured quad with explicit uv rect
    void quadUV(const Vec3& a, const Vec3& b, const Vec3& c, const Vec3& d, const Vec3& n,
                const Vec2& ua, const Vec2& ub, const Vec2& uc, const Vec2& ud);
    void finishSub();   // close current material range
    void build(bool smoothNormals = false);

    // primitives
    void box(const Vec3& center, const Vec3& size, float uvScale = 1.0f, bool bottom = true);
    void boxMinMax(const Vec3& lo, const Vec3& hi, float uvScale = 1.0f);
    void boxRot(const Vec3& center, const Vec3& size, const Mat4& rot, float uvScale = 1.0f);
    void cylinder(const Vec3& a, const Vec3& b, float radius, int seg, bool caps = true);
    void cone(const Vec3& base, const Vec3& tip, float radius, int seg);
    void sphere(const Vec3& c, float r, int segU, int segV);
    void ellipsoid(const Vec3& c, const Vec3& r, int segU, int segV);
    void torus(const Vec3& c, const Vec3& axis, float R, float r, int segU, int segV);
    void lathe(const std::vector<Vec2>& profile, int seg, const Mat4& xform, bool capBottom = false, bool capTop = false);
    void strip(const std::vector<Vec3>& a, const std::vector<Vec3>& b, bool closed = false, bool flip = false);
    void disc(const Vec3& c, const Vec3& n, float r, int seg);
    void ring(const Vec3& c, const Vec3& n, float r0, float r1, int seg);
    void quadStrip(const std::vector<Vec3>& pts, const Vec3& n);
    // adds a mesh built separately
    void addMesh(const Mesh& m, const Mat4& xform, int matOverride = -1);
    // helpers for bevelled boxes (rounded corners), used for buildings / props
    void roundedBox(const Vec3& center, const Vec3& size, float radius, int seg, float uvScale);
};

// Surface nets (dual contouring) polygonisation of a signed distance field.
struct SdfGrid {
    Vec3 origin;
    Vec3 cell;
    int nx = 0, ny = 0, nz = 0;
    std::vector<float> field;
    float at(int i, int j, int k) const { return field[(size_t)(k * ny + j) * nx + i]; }
    float& at(int i, int j, int k) { return field[(size_t)(k * ny + j) * nx + i]; }
};
// Surface-nets polygonisation. `f` is evaluated at world positions for the grid
// samples and (sparsely) for vertex normals, giving a smooth continuous surface.
Mesh polygonizeSDF(const SdfGrid& g, const std::function<float(const Vec3&)>& f, float iso = 0.0f);
void sampleSDF(SdfGrid& g, const std::function<float(const Vec3&)>& f, float iso = 0.0f);

// Simple bounding volume hierarchy over triangles for ray tests / collision.
struct Tri { Vec3 a, b, c; };
struct RayHit { float t = -1; Vec3 normal; int triIndex = -1; };

} // namespace hv
