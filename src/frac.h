// FRACTURE: TOTAL DESTRUCTION
// Custom voxel destruction engine - shared declarations.
// Target: native Windows x86_64 (software rasterizer, Win32, no external deps).
#pragma once

#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <cmath>
#include <string>
#include <vector>
#include <algorithm>
#include <functional>

// ------------------------------------------------------------------ config
#define FRACTURE_VERSION "1.0.0"
#define CH 16                 // chunk edge in voxels
#define CHV (CH * CH * CH)
// Function-key codes shared by both platforms (Win32 virtual-key values)
#define VK_KEY_F3 114
#define VK_KEY_F5 116
#define VK_KEY_F9 120
#define VK_KEY_F11 122
#define VOXSZ 0.2f            // metres per voxel
#define NTEX 42
#define GAME_NAME "FRACTURE: TOTAL DESTRUCTION"

static const float PI = 3.14159265358979f;
static const float DEG = PI / 180.0f;

// ------------------------------------------------------------------- math
struct Vec2 {
    float x = 0, y = 0;
    Vec2() {}
    Vec2(float a, float b) : x(a), y(b) {}
};
struct Vec3 {
    float x = 0, y = 0, z = 0;
    Vec3() {}
    Vec3(float a, float b, float c) : x(a), y(b), z(c) {}
    explicit Vec3(float a) : x(a), y(a), z(a) {}
    Vec3 operator+(const Vec3& o) const { return Vec3(x + o.x, y + o.y, z + o.z); }
    Vec3 operator-(const Vec3& o) const { return Vec3(x - o.x, y - o.y, z - o.z); }
    Vec3 operator*(float s) const { return Vec3(x * s, y * s, z * s); }
    Vec3 operator*(const Vec3& o) const { return Vec3(x * o.x, y * o.y, z * o.z); }
    Vec3 operator/(float s) const { float i = 1.0f / s; return Vec3(x * i, y * i, z * i); }
    Vec3& operator+=(const Vec3& o) { x += o.x; y += o.y; z += o.z; return *this; }
    Vec3& operator-=(const Vec3& o) { x -= o.x; y -= o.y; z -= o.z; return *this; }
    Vec3& operator*=(float s) { x *= s; y *= s; z *= s; return *this; }
    Vec3 operator-() const { return Vec3(-x, -y, -z); }
    float operator[](int i) const { return (&x)[i]; }
    float& operator[](int i) { return (&x)[i]; }
};
inline float dot(const Vec3& a, const Vec3& b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
inline Vec3 cross(const Vec3& a, const Vec3& b) {
    return Vec3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
}
inline float length(const Vec3& a) { return sqrtf(dot(a, a)); }
inline Vec3 normalize(const Vec3& a) { float l = length(a); return l > 1e-8f ? a / l : Vec3(0, 1, 0); }
inline Vec3 lerp(const Vec3& a, const Vec3& b, float t) { return a + (b - a) * t; }
inline float clampf(float v, float a, float b) { return v < a ? a : (v > b ? b : v); }
inline float saturate(float v) { return clampf(v, 0.0f, 1.0f); }
inline int clampi(int v, int a, int b) { return v < a ? a : (v > b ? b : v); }
inline float lerpf(float a, float b, float t) { return a + (b - a) * t; }
inline float signf(float v) { return v < 0 ? -1.0f : 1.0f; }
inline float smoothstepf(float a, float b, float x) {
    float t = saturate((x - a) / (b - a));
    return t * t * (3 - 2 * t);
}

struct Vec4 {
    float x = 0, y = 0, z = 0, w = 0;
    Vec4() {}
    Vec4(float a, float b, float c, float d) : x(a), y(b), z(c), w(d) {}
    Vec4(const Vec3& v, float d) : x(v.x), y(v.y), z(v.z), w(d) {}
};
struct Vec3i {
    int x = 0, y = 0, z = 0;
    Vec3i() {}
    Vec3i(int a, int b, int c) : x(a), y(b), z(c) {}
    bool operator==(const Vec3i& o) const { return x == o.x && y == o.y && z == o.z; }
    Vec3i operator+(const Vec3i& o) const { return Vec3i(x + o.x, y + o.y, z + o.z); }
    Vec3i operator-(const Vec3i& o) const { return Vec3i(x - o.x, y - o.y, z - o.z); }
    float operator[](int i) const { return float((&x)[i]); }
};
struct Mat4 {
    float m[16];  // column-major
    Mat4() { memset(m, 0, sizeof(m)); }
    static Mat4 ident() {
        Mat4 r;
        r.m[0] = r.m[5] = r.m[10] = r.m[15] = 1;
        return r;
    }
    static Mat4 perspective(float fovy, float aspect, float zn, float zf) {
        Mat4 r;
        float f = 1.0f / tanf(fovy * 0.5f);
        r.m[0] = f / aspect;
        r.m[5] = f;
        r.m[10] = (zf + zn) / (zn - zf);
        r.m[11] = -1.0f;
        r.m[14] = (2 * zf * zn) / (zn - zf);
        return r;
    }
    static Mat4 lookAt(const Vec3& eye, const Vec3& dir, const Vec3& up) {
        Vec3 f = normalize(dir);
        Vec3 s = normalize(cross(f, up));
        Vec3 u = cross(s, f);
        Mat4 r = ident();
        r.m[0] = s.x; r.m[4] = s.y; r.m[8] = s.z;
        r.m[1] = u.x; r.m[5] = u.y; r.m[9] = u.z;
        r.m[2] = -f.x; r.m[6] = -f.y; r.m[10] = -f.z;
        r.m[12] = -dot(s, eye);
        r.m[13] = -dot(u, eye);
        r.m[14] = dot(f, eye);
        return r;
    }
    static Mat4 mul(const Mat4& a, const Mat4& b) {
        Mat4 r;
        for (int c = 0; c < 4; c++)
            for (int rr = 0; rr < 4; rr++) {
                float s = 0;
                for (int k = 0; k < 4; k++) s += a.m[k * 4 + rr] * b.m[c * 4 + k];
                r.m[c * 4 + rr] = s;
            }
        return r;
    }
    static Mat4 translate(const Vec3& t) {
        Mat4 r = ident();
        r.m[12] = t.x; r.m[13] = t.y; r.m[14] = t.z;
        return r;
    }
    static Mat4 scale(const Vec3& t) {
        Mat4 r = ident();
        r.m[0] = t.x; r.m[5] = t.y; r.m[10] = t.z;
        return r;
    }
    Vec4 operator*(const Vec4& v) const {
        Vec4 r;
        r.x = m[0] * v.x + m[4] * v.y + m[8] * v.z + m[12] * v.w;
        r.y = m[1] * v.x + m[5] * v.y + m[9] * v.z + m[13] * v.w;
        r.z = m[2] * v.x + m[6] * v.y + m[10] * v.z + m[14] * v.w;
        r.w = m[3] * v.x + m[7] * v.y + m[11] * v.z + m[15] * v.w;
        return r;
    }
    Vec3 point(const Vec3& p) const {
        return Vec3(m[0] * p.x + m[4] * p.y + m[8] * p.z + m[12],
                    m[1] * p.x + m[5] * p.y + m[9] * p.z + m[13],
                    m[2] * p.x + m[6] * p.y + m[10] * p.z + m[14]);
    }
};

// 3x3 rotation stored as 3 basis vectors (columns)
struct Basis {
    Vec3 x = Vec3(1, 0, 0), y = Vec3(0, 1, 0), z = Vec3(0, 0, 1);
    Vec3 mul(const Vec3& v) const { return x * v.x + y * v.y + z * v.z; }
    Vec3 mulT(const Vec3& v) const { return Vec3(dot(x, v), dot(y, v), dot(z, v)); }
    Basis operator*(const Basis& o) const {
        Basis r;
        r.x = mul(o.x); r.y = mul(o.y); r.z = mul(o.z);
        return r;
    }
    void orthonormalize() {
        x = normalize(x);
        z = normalize(cross(x, y));
        y = cross(z, x);
    }
    static Basis rotAxis(Vec3 axis, float ang) {
        axis = normalize(axis);
        float c = cosf(ang), s = sinf(ang), t = 1 - c;
        float X = axis.x, Y = axis.y, Z = axis.z;
        Basis b;
        b.x = Vec3(t * X * X + c, t * X * Y + s * Z, t * X * Z - s * Y);
        b.y = Vec3(t * X * Y - s * Z, t * Y * Y + c, t * Y * Z + s * X);
        b.z = Vec3(t * X * Z + s * Y, t * Y * Z - s * X, t * Z * Z + c);
        return b;
    }
    static Basis yawPitch(float yaw, float pitch) {
        Basis ry = rotAxis(Vec3(0, 1, 0), yaw);
        Basis rp = rotAxis(Vec3(1, 0, 0), pitch);
        return ry * rp;
    }
};

struct AABB {
    Vec3 mn, mx;
    AABB() {}
    AABB(const Vec3& a, const Vec3& b) : mn(a), mx(b) {}
    bool hit(const AABB& o) const {
        return mn.x <= o.mx.x && mx.x >= o.mn.x && mn.y <= o.mx.y && mx.y >= o.mn.y &&
               mn.z <= o.mx.z && mx.z >= o.mn.z;
    }
    void grow(const Vec3& p) {
        mn.x = fminf(mn.x, p.x); mn.y = fminf(mn.y, p.y); mn.z = fminf(mn.z, p.z);
        mx.x = fmaxf(mx.x, p.x); mx.y = fmaxf(mx.y, p.y); mx.z = fmaxf(mx.z, p.z);
    }
};

// ------------------------------------------------------------------ random
struct RNG {
    uint32_t s = 12345;
    void seed(uint32_t v) { s = v ? v : 1; }
    uint32_t next() {
        s ^= s << 13; s ^= s >> 17; s ^= s << 5;
        return s;
    }
    float f() { return (next() >> 8) * (1.0f / 16777216.0f); }
    float range(float a, float b) { return a + (b - a) * f(); }
    int irange(int a, int b) { return a + int(f() * float(b - a + 1)); }
    Vec3 dir() {
        float z = range(-1, 1), t = range(0, 2 * PI), r = sqrtf(fmaxf(0, 1 - z * z));
        return Vec3(r * cosf(t), z, r * sinf(t));
    }
};
extern RNG g_rng;
float noise2(float x, float y);
float noise3(float x, float y, float z);
float fbm2(float x, float y, int oct);
float fbm3(float x, float y, float z, int oct);

// --------------------------------------------------------------- materials
enum MatId : uint8_t {
    MAT_AIR = 0,
    MAT_CONCRETE, MAT_CONCRETE_DIRTY, MAT_BRICK, MAT_BRICK_RED, MAT_PLASTER,
    MAT_WOOD, MAT_WOOD_DARK, MAT_PLANK, MAT_METAL, MAT_METAL_RUST, MAT_STEEL,
    MAT_GLASS, MAT_GLASS_DIRTY, MAT_ASPHALT, MAT_SOIL, MAT_GRASS, MAT_STONE,
    MAT_REBAR, MAT_TILE, MAT_ROOF, MAT_LEAVES, MAT_BARK, MAT_FABRIC, MAT_PLASTIC,
    MAT_PAINT_RED, MAT_PAINT_YELLOW, MAT_PAINT_WHITE, MAT_PAINT_BLUE, MAT_PAINT_GREEN,
    MAT_CARGO_RED, MAT_CARGO_BLUE, MAT_CARGO_GREEN, MAT_CARGO_YELLOW,
    MAT_SAND, MAT_GRAVEL, MAT_WATER, MAT_NEON, MAT_LAMP, MAT_RUBBER, MAT_CERAMIC,
    MAT_GOLD, MAT_COPPER, MAT_COUNT
};

enum MatKind : uint8_t {
    K_NONE = 0, K_WOOD, K_BRICK, K_CONCRETE, K_METAL, K_GLASS, K_PLASTER,
    K_STONE, K_SOIL, K_ASPHALT, K_REINFORCED, K_VEG, K_FABRIC, K_PLASTIC, K_LIQUID,
    K_CERAMIC
};

struct MatDef {
    const char* name;
    uint8_t kind;
    float strength;    // resistance to destruction (higher = tougher)
    float density;     // kg per m^3 (scaled) - affects debris
    float friction;
    float flammability;  // 0..1
    int texid;         // texture tile index
    float texScale;    // metres per texture repeat
    uint8_t trans;     // 1 = transparent
    uint8_t structural; // participates in structural connectivity
    float crumble;     // debris amount multiplier
};
extern MatDef kMats[MAT_COUNT];
// average colour of each material's texture, filled once from the loaded atlas
extern uint32_t g_matColor[MAT_COUNT];
void initMaterials();
inline const MatDef& mat(uint8_t id) { return kMats[id]; }
inline bool matSolid(uint8_t id) { return id != MAT_AIR; }
inline bool matOpaque(uint8_t id) { return id != MAT_AIR && !kMats[id].trans; }

// ------------------------------------------------------------------ world
struct Chunk;
struct RVert {
    float x, y, z;
    float u, v;
    int8_t nx, ny, nz, mat;
    float sun;   // baked sun visibility 0..1
    float ao;    // baked ambient occlusion 0..1
};
struct ChunkMesh {
    std::vector<RVert> verts;
    std::vector<uint32_t> idx;
    struct Batch { uint8_t mat; int first, count; };
    std::vector<Batch> batches;
    bool dirty = true;
    bool built = false;
    AABB bb;
};

struct Chunk {
    uint8_t v[CHV];
    ChunkMesh mesh, tmesh;      // opaque + transparent
    int cx, cy, cz;
    bool modified = false;
    bool solid = false;
    float lodDist = 0;
    bool queued = false;
};

struct RayHit {
    bool hit = false;
    float t = 0;
    Vec3i voxel;
    Vec3 nrm;
    uint8_t mat = MAT_AIR;
    Vec3 point;
};

struct World {
    int dims[3] = {0, 0, 0};       // in voxels
    uint8_t* vox = nullptr;         // flat voxel array (dims)
    uint8_t* flags = nullptr;       // per voxel flags (1 = never destroyable - world border)
    float* light = nullptr;         // coarse light volume RGB + sky, 4 floats per cell
    int ldim[3] = {0, 0, 0};        // light volume dims (cells of LCELL voxels)
    float* sunmap = nullptr;        // heightmap top solid per column (world units y)
    bool* skyvis = nullptr;
    std::vector<Chunk*> chunks;
    std::vector<int> chunkIndex;    // hash grid: chunk coords -> index

    // 3D noise map for terrain
    void allocate(int sx, int sy, int sz);
    void free();
    inline int idx(int x, int y, int z) const { return (z * dims[1] + y) * dims[0] + x; }
    inline bool inside(int x, int y, int z) const {
        return x >= 0 && y >= 0 && z >= 0 && x < dims[0] && y < dims[1] && z < dims[2];
    }
    inline uint8_t get(int x, int y, int z) const {
        if (!inside(x, y, z)) return MAT_AIR;
        return vox[idx(x, y, z)];
    }
    inline bool solidAt(int x, int y, int z) const { return get(x, y, z) != MAT_AIR; }
    inline Vec3 wp(int x, int y, int z) const { return Vec3(x * VOXSZ, y * VOXSZ, z * VOXSZ); }
    inline int vx(float wx) const { return int(floorf(wx / VOXSZ)); }
    inline bool solidW(const Vec3& p) const {
        return solidAt(vx(p.x), vx(p.y), vx(p.z));
    }
    void set(int x, int y, int z, uint8_t m, bool structuralEdit = true);
    void setRaw(int x, int y, int z, uint8_t m);
    bool carveSphere(const Vec3& c, float r, int maxStrength, int& removed, int* matHist = nullptr);
    bool carveBox(const Vec3& mn, const Vec3& mx, int maxStrength, int& removed);
    RayHit raycast(const Vec3& o, const Vec3& d, float maxDist, bool hitTransparent = false) const;
    float topSolidY(int x, int z) const;
    Chunk* chunkAt(int cx, int cy, int cz);
    Chunk* getChunk(int x, int y, int z);
    void markDirtyAround(int x, int y, int z, int r);
    void rebuildAll();
    void buildDirty(int budgetMs);
    void buildChunkMesh(Chunk* c);
    void computeSunMap();
    void bakeLight();
    Vec3 lightAt(const Vec3& p) const;
    void clearEdits();
    void syncChunks();
    void fillFast(int x0, int y0, int z0, int x1, int y1, int z1, uint8_t m);
};

// per-voxel flag
enum { VF_NONE = 0, VF_INDESTRUCTIBLE = 1 };

// ---------------------------------------------------------------- renderer
struct Tex {
    int w = 0, h = 0;
    std::vector<uint32_t> px;     // RGBA 8-bit packed 0xAABBGGRR? use 0xRRGGBBAA independent
    std::vector<uint8_t> mip[6];
    int mipW[6], mipH[6], nMip = 0;
    void buildMips();
};
struct Sprite {
    Vec3 pos;
    float size;
    uint32_t color;   // 0xAARRGGBB
    float alpha;
    int tex;
    float rot;
    int additive;
};
struct DynLight {
    Vec3 pos;
    Vec3 color;
    float radius;
    float intensity;
};
struct RenderSettings {
    int width = 1280, height = 720;
    int renderScale = 100;
    int shadows = 1;            // sun shadow marching on/off
    int shadowQuality = 2;      // 0..3
    int effectQuality = 2;
    int viewDist = 140;         // metres
    int aa = 1;                 // 0..2
    int bloom = 1;
    float fov = 78;
    int motionBlur = 0;
    int vsync = 1;
    int fpsLimit = 0;
    int aaQuality = 1;
};
struct ShapeBatch;
struct RenderTarget {
    int w = 0, h = 0;
    std::vector<float> color;   // RGB
    std::vector<float> depth;
    std::vector<uint8_t> ldr;   // RGBA output frame for platform blit
};
struct Renderer {
    RenderSettings set;
    RenderTarget rt;
    std::vector<Tex> tiles;     // material textures
    Tex sky;
    Tex font;
    Tex sprites;                // particle atlas
    Tex uiWhite;
    int width = 0, height = 0;
    Mat4 view, proj, viewproj;
    Vec3 camPos, camDir, camUp, camRight;
    std::vector<DynLight> lights;
    Vec3 sunDir, sunColor, skyColor, groundColor, fogColor;
    float fogDensity = 0.012f;
    float exposure = 1.0f;
    std::vector<Sprite> spriteList;
    int statsTris = 0, statsVerts = 0, statsChunks = 0;
    void init(int w, int h);
    void begin();
    void addLight(const Vec3& p, const Vec3& c, float radius, float intensity);
    void drawWorld(World& w);
    void drawSky();
    void flushSprites();
    void finish();     // post + tonemap into ldr
    uint32_t* framebuffer();
    // immediate 2D UI drawing (after finish)
    void uiRect(float x, float y, float w, float h, uint32_t col);
    void uiRectGrad(float x, float y, float w, float h, uint32_t c0, uint32_t c1);
    void uiText(float x, float y, const char* s, uint32_t col, float scale = 1.0f);
    void uiTextShadow(float x, float y, const char* s, uint32_t col, float scale = 1.0f);
    float uiTextWidth(const char* s, float scale = 1.0f);
    void uiLine(float x0, float y0, float x1, float y1, uint32_t col, float thick = 1);
    void uiImage(float x, float y, float w, float h, const Tex& t, uint32_t tint);
    void drawCrosshair(int style, float spread);
    void drawShape(const ShapeBatch& sb, float depthBias = 0);
    void drawLocalMesh(const std::vector<RVert>& v, const std::vector<uint32_t>& idx,
                       const std::vector<ChunkMesh::Batch>& batches, const Vec3& pos,
                       const Basis& rot);
    void uiBigText(float x, float y, const char* s, uint32_t col, float scale = 1.0f);
    float uiBigTextWidth(const char* s, float scale = 1.0f);
};
extern Renderer g_renderer;
extern uint8_t* g_dbgMatBuf;
extern bool g_noFog;

// shape drawing helper: builds triangles in a shared static mesh for sprites/boxes
struct ShapeBatch {
    std::vector<RVert> v;
    std::vector<uint32_t> i;
    void reset() { v.clear(); i.clear(); }
    void quad(const Vec3& a, const Vec3& b, const Vec3& c, const Vec3& d, const Vec3& n,
              uint8_t material, float u = 0, float v2 = 0, float u2 = 0, float v3 = 0);
    void box(const Vec3& c, const Vec3& half, const Basis& b, uint8_t material, float ao = 1);
    void cylinder(const Vec3& a, const Vec3& b, float r, int seg, uint8_t material);
};

// ----------------------------------------------------------------- physics
struct Debris {
    Vec3 pos, vel, half;
    Basis rot;
    Vec3 angVel;
    uint8_t mat;
    float life, maxLife;
    float resting;
    bool active;
    float scale;
};
struct StructBody {
    std::vector<RVert> meshVerts;
    std::vector<uint32_t> meshIdx;
    std::vector<struct ChunkMesh::Batch> meshBatches;
    Vec3 pos;          // centre of mass
    Vec3 vel, angVel;
    Basis rot;
    float mass;
    Vec3 half;         // bounding half extents (local)
    std::vector<uint8_t> vox;   // local voxel data
    std::vector<uint16_t> voxIdx; // compact list of solid voxel local indices
    Vec3i dim;                  // voxel dims
    bool alive;
    bool settled;
    float age;
    int voxCount;
    float damageAccum;
    uint8_t dominant;
    bool isVehicle = false;
    int vehicleId = -1;
    float sleepTimer = 0;
};
struct Physics {
    std::vector<Debris> debris;         // pooled
    std::vector<StructBody*> bodies;
    std::vector<Vec3> collapseQueue;    // pending region checks
    int maxDebris = 900;
    int maxBodies = 90;
    int activeDebris = 0;
    float quality = 1.0f;
    void init();
    Debris* spawnDebris(const Vec3& pos, const Vec3& vel, const Vec3& half, uint8_t m,
                        const Vec3& angVel = Vec3(0, 0, 0));
    StructBody* spawnStructure(const Vec3& pos, const Vec3i& dim, std::vector<uint8_t>& voxels,
                               Basis rot, uint8_t dominant);
    void update(float dt, World& w);
    void cullDebris();
    void draw();
    void clearAll();
};
extern Physics g_phys;

// structural collapse detection
void structuralCheck(World& w, const Vec3& center, float radius);
void structuralTick(World& w, float dt);
extern int g_collapseEvents;

// --------------------------------------------------------------------- fx
struct Particle {
    Vec3 pos, vel;
    float life, maxLife;
    float size0, size1;
    uint32_t col;
    float gravity;
    float drag;
    int tex;
    int additive;
    float rot, spin;
    bool active;
};
struct FireCell {
    Vec3i cell;
    float heat;
    float fuel;
    float smoke;
};
struct Decal {
    Vec3 pos, nrm;
    float size;
    float life;
    uint32_t col;
    int tex;
};
struct FX {
    std::vector<Particle> parts;
    std::vector<FireCell> fire;
    std::vector<Decal> decals;
    std::vector<Vec3> shockwaves;
    std::vector<float> shockAge;
    int maxParts = 2600;
    int activeParts = 0;
    float quality = 1.0f;
    float shake = 0;
    Vec3 shakeDir;
    float shakeTime = 0;
    void init();
    Particle* spawn(const Vec3& p, const Vec3& v, float life, float s0, float s1,
                    uint32_t col, float grav = 1, int tex = 0, int add = 0);
    void impact(const Vec3& p, const Vec3& n, uint8_t m, float power);
    void explosion(const Vec3& p, float power, World& w);
    void dustCloud(const Vec3& p, float radius, int count, uint8_t m);
    void sparks(const Vec3& p, const Vec3& n, int count, uint32_t col);
    void smokePuff(const Vec3& p, int count, float size);
    void addDecal(const Vec3& p, const Vec3& n, float size, int tex, uint32_t col);
    void ignite(const Vec3& p, float radius);
    void extinguish(const Vec3& p, float radius);
    void update(float dt, World& w);
    void applyExplosionDamage(World& w, const Vec3& p, float power, float radius);
    void clear();
    void addShake(float amt, float time);
    void render();
};
extern FX g_fx;

// ------------------------------------------------------------------ audio
enum SndId {
    SND_HAMMER = 0, SND_HAMMER_METAL, SND_GLASS_BREAK, SND_CONCRETE_BREAK,
    SND_WOOD_BREAK, SND_METAL_BREAK, SND_EXPLOSION, SND_EXPLOSION_BIG,
    SND_RUBBLE, SND_GUNSHOT, SND_RELOAD, SND_ROCKET_FIRE, SND_BLOWTORCH,
    SND_DRILL, SND_FOOTSTEP, SND_FOOTSTEP_HARD, SND_JUMP, SND_LAND,
    SND_ENGINE, SND_ENGINE_IDLE, SND_BEEP, SND_UI_CLICK, SND_UI_HOVER,
    SND_COLLAPSE, SND_CREAK, SND_FIRE, SND_PLACE, SND_GRAPPLE, SND_CABLE,
    SND_EXTINGUISH, SND_AIRSTRIKE, SND_ALARM, SND_PICKUP, SND_THROW,
    SND_CHARGE_BEEP, SND_WIND, SND_RAIN, SND_GLASS_HIT, SND_DIRT,
    SND_CRASH_SOFT, SND_CUTTER, SND_DETONATE, SND_FIRE_CRACKLE, SND_WOOD_HIT,
    SND_METAL_HIT, SND_STONE_HIT, SND_ALARM_BEEP, SND_ROCKET_LOOP, SND_AMB_CITY,
    SND_MUSIC_LOOP, SND_AMB_WIND, SND_AMB_INDUSTRIAL, SND_PLANK, SND_HOOK_HIT,
    SND_COUNT
};
struct AudioVoice {
    int snd;
    float pos3d[3];
    float vol, pitch, pan;
    bool loop;
    int loopId;
    bool alive;
    double startTime;
};
struct Audio {
    bool enabled = true;
    float master = 0.8f, sfxVol = 0.9f, musicVol = 0.6f;
    std::vector<short> samples[SND_COUNT];
    std::vector<AudioVoice> voices;
    float enginePitch = 1.0f;
    std::vector<int> loopVoices;   // SND_ENGINE persistent loops
    int activeLoops[SND_COUNT];
    void init();
    void generateSounds();
    void play(int snd, const Vec3& p, float vol = 1.0f, float pitch = 1.0f,
              bool spatial = true);
    void play2d(int snd, float vol = 1.0f, float pitch = 1.0f);
    int playLoop(int snd, const Vec3& p, float vol);
    void stopLoop(int id);
    void update(const Vec3& listener, const Vec3& right);
    void mix(float* out, int frames, int channels, const Vec3& listener, const Vec3& right);
    float musicTimer = 0;
};
extern Audio g_audio;

// --------------------------------------------------------------- game types
enum ToolId {
    TOOL_HAMMER = 0, TOOL_SHOTGUN, TOOL_CHARGE, TOOL_ROCKET, TOOL_BLOWTORCH,
    TOOL_PLANK, TOOL_EXTINGUISHER, TOOL_GRAPPLE, TOOL_CUTTER, TOOL_CABLE,
    TOOL_DRILL, TOOL_AIRSTRIKE, TOOL_COUNT
};
struct ToolDef {
    const char* name;
    const char* desc;
    float ammoMax;
    float cooldown;
    int unlockChapter;
};
extern ToolDef kTools[TOOL_COUNT];

struct Vehicle {
    bool active = false;
    int type = 0;
    Vec3 pos, vel;
    Basis rot;
    Vec3 half;
    float yaw = 0, wheelSpin = 0, steer = 0, speed = 0;
    float health = 100;
    float engine = 0;
    bool brake = false;
    bool occupied = false;
    int id = -1;
    float bob = 0;
    float damage = 0;
    Vec3 color;
    float mass = 1400;
    bool isBoat = false;
    bool hasArm = false;
    float armAngle = 0, armExtend = 0;
};
#define MAX_VEHICLES 8

struct Player {
    Vec3 pos;         // feet
    Vec3 vel;
    float yaw = 0, pitch = 0;
    bool onGround = false;
    bool crouch = false;
    float height = 1.75f;
    float eyeHeight = 1.6f;
    float bob = 0;
    float stepDist = 0;
    int tool = TOOL_HAMMER;
    float ammo[TOOL_COUNT];
    float heat[TOOL_COUNT];
    float health = 100;
    bool inVehicle = false;
    int vehicle = -1;
    float flashlight = 0;
    float swingT = 0;
    bool swinging = false;
    float recoil = 0;
    float sensitivity = 0.22f;
    float fov = 78;
    Vec3 velocityForCamera;
    bool grappling = false;
    Vec3 grapplePoint;
    float grappleDist = 0;
    Vec3 carryingPos;
    bool carrying = false;
    int carryingBody = -1;
    float interactTimer = 0;
    float toolAnim = 0;
    float reloadT = 0;
    float fuelLeft = 100;
    float extinguishFuel = 100;
    float noise = 0;
};

struct Objective {
    std::string text;
    bool done = false;
    bool optional = false;
    int type = 0;       // 0=destroy target, 1=collect, 2=reach, 3=kills, 4=custom
    int targetCount = 1;   // for destroy objectives: baseline voxel count (set at load)
    int need = 0;          // voxels that must be destroyed (0 = derive from targetCount)
    int progress = 0;
    Vec3 pos;
    float radius = 3;
    int targetId = -1;
    bool visible = true;
};

struct Mission {
    int id = 0;
    int chapter = 0;
    std::string name;
    std::string brief;
    std::string hint;
    std::vector<Objective> objectives;
    float timeLimit = 0;
    bool timed = false;
    bool complete = false;
    bool failed = false;
    int rewardTool = -1;
    float money = 0;
    Vec3 startPos;
    float startYaw = 0;
};

struct MapDef {
    const char* name;
    const char* desc;
    int dimx, dimy, dimz;   // voxels
    int seed;
    int timeOfDay;          // 0 dawn 1 day 2 dusk 3 night
    int weather;            // 0 clear 1 cloudy 2 rain 3 fog 4 storm
    void (*build)(World& w);
    const char* missions[8];
    int missionCount;
};

extern MapDef kMaps[6];
extern int g_mapCount;

// game global state
enum GameState {
    GS_MAIN_MENU = 0, GS_MAP_SELECT, GS_SETTINGS, GS_CONTROLS, GS_PLAYING,
    GS_PAUSED, GS_MISSION_BRIEF, GS_MISSION_COMPLETE, GS_LOADING,
    GS_SANDBOX_OPTIONS, GS_TOOLSELECT, GS_CREDITS, GS_VEHICLE_SELECT,
    GS_SAVES, GS_FAILED, GS_EDITOR, GS_COUNT
};

struct SandboxOptions {
    bool infiniteAmmo = false;
    bool invincible = false;
    bool infiniteFuel = false;
    float gravityScale = 1.0f;
    float explosionScale = 1.0f;
    bool fireEnabled = true;
    int debrisDensity = 2;      // 0..3
    int physicsQuality = 2;
    bool vehicleSpawning = true;
    int timeOfDay = 1;
    int weather = 0;
};

struct SaveHeader {
    char magic[8];
    int version;
    int map;
    Vec3 playerPos;
    float yaw, pitch;
    int chapter;
    int unlockedTools;
    int money;
    int sandbox;
    int completedMissions[32];
    SandboxOptions sandboxOptions;
    int chunkCount;
};

struct Game {
    GameState state = GS_MAIN_MENU;
    GameState prevState = GS_MAIN_MENU;
    int menuIndex = 0;
    int selMap = 0;
    World world;
    Player player;
    std::vector<Mission> missions;
    int curMission = -1;
    bool sandbox = true;
    int campaignChapter = 0;
    int unlockedTools = 0xF;      // bitmask
    float money = 0;
    bool missionActive = false;
    float missionTime = 0;
    Vehicle vehicles[MAX_VEHICLES];
    int nextVehicleId = 0;
    SandboxOptions sandboxOpts;
    int timeOfDay = 1;
    int weather = 0;
    float worldTime = 0;
    // input state
    float sens = 0.22f;
    float uiFlash = 0;
    std::string toast;
    float toastTime = 0;
    float fpsTimer = 0;
    int fpsFrames = 0;
    float fps = 0;
    float frameMs = 0;
    bool showDebug = false;
    float loadProgress = 0;
    std::string loadLabel;
    int saveSlots = 0;
    float missionTimer = 0;
    int totalDestroyed = 0;
    float collapseShakeTimer = 0;
    bool paused = false;
    float deltaTime = 0;
    float menuAnim = 0;
    int lastToolSelected = TOOL_HAMMER;
    bool showMinimap = true;
    bool dynamicResolution = true;   // adapt internal 3D resolution to hold the frame budget
    int resolutionCap = 100;         // upper bound imposed by the quality preset
    int qualityPreset = 2;      // 0 LOW 1 MEDIUM 2 HIGH 3 VERY HIGH 4 ULTRA
    Vec3 menuCamTarget;
    float menuCamDist = 52.0f;
    float menuCamHeight = 16.0f;
    bool firstPersonToolAnim = true;
    bool editorMode = false;
    int editorTool = 0;
    uint8_t editorMat = MAT_CONCRETE;
    float editorBrush = 1.5f;
    // charge placement
    std::vector<Vec3> charges;
    std::vector<Vec3> chargeNrm;
    // mission targets registry
    struct Target { Vec3 pos; float radius; float health; float maxHealth; bool destroyed; int missionIdx; };
    std::vector<Target> targets;
    // security/alarm
    float alarm = 0;
    bool alarmTriggered = false;
    float missionStartTime = 0;
    float flashTimer = 0;
    int screenshotMode = 0;
    float skyRot = 0;
    float introAlpha = 1.0f;
    float hitMarker = 0;
    int lastDamageSource = 0;
};

extern Game g_game;

// ---------------------------------------------------------------- functions
void gameInit();
void gameLoadMap(int mapIdx, bool sandbox, int missionIdx);
void gameUpdate(float dt);
void gameRender();
void gameShutdown();
void gameHandleClick(int button, bool down);
void gameHandleKey(int key, bool down);
void g_gameHandleKey(int key, bool down);
void handleMouseMove(float dx, float dy);
void updatePlayer(float dt);
void updateVehicles(float dt);
void renderHUD();
void renderMenu();
void updateMission(float dt);
bool worldRayHitAt(const Vec3& o, const Vec3& d, float maxd, RayHit& h);
void damageVoxelsAt(const Vec3& p, const Vec3& n, float radius, int power, float impulse);
void doToolUse(int button);
void doToolUpdate(float dt);
void renderFirstPersonTool();
bool saveGame(int slot);
void spawnCollectible(const Vec3& p, int obj);
void clearCollectibles();
bool loadGame(int slot);
void gameResetWorld();
void resetLoadout();
int objectiveNeed(const Objective& o);
void applyGraphicsPreset(int idx);
void gameLoadMenuBackdrop();
void renderMenuBackdrop();
void buildMap(int idx);
void spawnVehicle(int type, const Vec3& pos, float yaw);
void interactPressed();
void missionFail(const char* reason);
void missionComplete();
void setTimeOfDay(int t);
void setWeather(int w);
extern void platformRequestQuit();

// map builders
void buildWesthaven(World& w);
void buildBlackstone(World& w);
void buildDowntown(World& w);
void buildHarbor(World& w);
void buildRedCanyon(World& w);
void buildGrandMall(World& w);

// map authoring helpers (maps.cpp)
struct Builder {
    World* w;
    RNG rng;
    void fill(int x0, int y0, int z0, int x1, int y1, int z1, uint8_t m);
    void box(int x0, int y0, int z0, int x1, int y1, int z1, uint8_t m);  // hollow
    void walls(int x0, int z0, int x1, int z1, int y0, int y1, uint8_t m, int thick = 2);
    void pillar(int x, int z, int y0, int y1, int r, uint8_t m);
    void floorPlane(int x0, int z0, int x1, int z1, int y, uint8_t m);
    void room(int x0, int z0, int x1, int z1, int y0, int y1, uint8_t mat,
              uint8_t floorMat, uint8_t ceilMat, int thick);
    void doorway(int x, int y0, int z, int w, int h, bool alongX);
    void window(int x, int y, int z, int w, int h, bool alongX);
    void stairs(int x, int z, int y0, int steps, int dir, uint8_t m);
    void vehicleRoad(int x0, int z0, int x1, int z1, uint8_t m);
    void tree(int x, int z, int y, float height);
    void fence(int x0, int z0, int x1, int z1, uint8_t m);
    void lamp(int x, int z, int y);
    void crate(int x, int y, int z, uint8_t m, int size);
    void barrel(int x, int y, int z, uint8_t m);
    void car(int x, int z, int y, uint8_t body, float yaw);
};

// ---------------------------------------------------------------- platform
struct PlatformInput {
    int mouseAbsX = 0, mouseAbsY = 0;
    float mouseDX = 0, mouseDY = 0;
    int wheel = 0;
    bool keys[256];
    bool mouse[3];
    bool keyPressed[256];
    bool mousePressed[3];
    bool mouseReleased[3];
    bool shouldQuit = false;
    void clearFrame();
};
extern PlatformInput g_input;
int platformRun();          // win32 entry, runs game loop
double platformTime();
void platformSleep(int ms);
void platformMixAudio(float* buf, int frames);
extern bool g_headless;
extern int g_headlessFrames;
extern const char* g_capturePath;

// save/load
bool saveToDisk(const char* path);
bool loadFromDisk(const char* path);
extern std::string g_saveDir;
void ensureSaveDir();
bool saveExists(int slot);
std::string slotPath(int slot);
void deleteSave(int slot);
bool saveSandbox(const char* name);
bool loadSandbox(const char* name);

// ui helpers
struct UI {
    static bool button(Renderer& r, float x, float y, float w, float h, const char* label,
                       int id, bool selected = false);
    static bool slider(Renderer& r, float x, float y, float w, float& val, float mn, float mx,
                       const char* label, int id);
    static bool toggle(Renderer& r, float x, float y, float w, const char* label, bool& val, int id);
    static void panel(Renderer& r, float x, float y, float w, float h);
    static int hoverId;
    static int activeId;
    static float mouseX, mouseY;
    static bool mouseDown, mouseClicked;
};

#define VK_SHIFT_MARK 0x10
#define VK_CTRL_MARK 0x11
void platformMkdir(const char* path);
void renderPauseMenu();
void renderMissionComplete();
void renderToolSelect();
void renderMissionBrief();
void renderMenu();
void renderHUD();
std::vector<Mission> buildMissions(int mapIdx);
extern int g_uiToolSelectOpen;
extern Vec3 g_camPosForBuild;

// utils
uint32_t packColor(float r, float g, float b, float a = 1);
uint32_t rgba(int r, int g, int b, int a = 255);
Vec3 colorToVec(uint32_t c);
void logf(const char* fmt, ...);
extern FILE* g_logFile;
