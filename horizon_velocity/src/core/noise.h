// HORIZON VELOCITY - deterministic noise & RNG
#pragma once
#include "core/math.h"

namespace hv {

// ---- PCG32 ----
struct Rng {
    uint64_t state = 0x853c49e6748fea9bULL;
    uint64_t inc = 0xda3e39cb94b95bdbULL;
    explicit Rng(uint64_t seed = 12345u) { reseed(seed); }
    void reseed(uint64_t seed) {
        state = 0u; inc = (seed << 1u) | 1u;
        next(); state += seed; next();
    }
    uint32_t next() {
        uint64_t old = state;
        state = old * 6364136223846793005ULL + inc;
        uint32_t xorshifted = (uint32_t)(((old >> 18u) ^ old) >> 27u);
        uint32_t rot = (uint32_t)(old >> 59u);
        return (xorshifted >> rot) | (xorshifted << ((-rot) & 31));
    }
    float nextFloat() { return (float)(next() >> 8) * (1.0f / 16777216.0f); }
    float range(float a, float b) { return a + (b - a) * nextFloat(); }
    int rangeInt(int a, int b) { return a + (int)(next() % (uint32_t)std::max(1, b - a)); }
    Vec3 inSphere() {
        float z = range(-1, 1), a = range(0, TAU), r = std::sqrt(std::max(0.0f, 1 - z * z));
        return {r * std::cos(a), z, r * std::sin(a)};
    }
    bool chance(float p) { return nextFloat() < p; }
};

inline uint32_t hashU32(uint32_t x) {
    x ^= x >> 16; x *= 0x7feb352dU; x ^= x >> 15; x *= 0x846ca68bU; x ^= x >> 16;
    return x;
}
inline float hashFloat(int x, int y, int z, uint32_t seed = 0) {
    uint32_t h = hashU32((uint32_t)x * 0x8da6b343U ^ (uint32_t)y * 0xd8163841U ^ (uint32_t)z * 0xcb1ab31fU ^ seed);
    return (float)(h & 0xFFFFFF) / (float)0xFFFFFF;
}

// ---- value / gradient noise ----
class Noise {
public:
    void init(uint32_t seed) { seed_ = seed; }
    // 2D gradient noise in [-1,1]
    float noise2(float x, float y) const;
    float noise3(const Vec3& p) const;
    float fbm2(float x, float y, int octaves, float lacunarity = 2.0f, float gain = 0.5f) const;
    float fbm3(const Vec3& p, int octaves, float lacunarity = 2.02f, float gain = 0.5f) const;
    // ridged multifractal - good for mountains
    float ridged2(float x, float y, int octaves) const;
    float ridge3(const Vec3& p, int octaves) const;
    float billow2(float x, float y, int octaves) const;
private:
    uint32_t seed_ = 0;
    float grad2(int ix, int iy, float fx, float fy) const;
    float grad3(int ix, int iy, int iz, float fx, float fy, float fz) const;
};

} // namespace hv
