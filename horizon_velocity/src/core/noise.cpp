#include "core/noise.h"

namespace hv {

static inline float quintic(float t) { return t * t * t * (t * (t * 6.0f - 15.0f) + 10.0f); }

float Noise::grad2(int ix, int iy, float fx, float fy) const {
    float a = hashFloat(ix, iy, 0, seed_) * TAU;
    return std::cos(a) * fx + std::sin(a) * fy;
}

float Noise::noise2(float x, float y) const {
    int ix = (int)std::floor(x), iy = (int)std::floor(y);
    float fx = x - ix, fy = y - iy;
    float u = quintic(fx), v = quintic(fy);
    float n00 = grad2(ix, iy, fx, fy);
    float n10 = grad2(ix + 1, iy, fx - 1, fy);
    float n01 = grad2(ix, iy + 1, fx, fy - 1);
    float n11 = grad2(ix + 1, iy + 1, fx - 1, fy - 1);
    return lerpf(lerpf(n00, n10, u), lerpf(n01, n11, u), v) * 0.7071f * 2.0f;
}

float Noise::grad3(int ix, int iy, int iz, float fx, float fy, float fz) const {
    float a = hashFloat(ix, iy, iz, seed_) * TAU;
    float b = hashFloat(ix, iy, iz, seed_ ^ 0x9e3779b9u) * PI - PI * 0.5f;
    Vec3 g(std::cos(a) * std::cos(b), std::sin(b), std::sin(a) * std::cos(b));
    return g.x * fx + g.y * fy + g.z * fz;
}

float Noise::noise3(const Vec3& p) const {
    int ix = (int)std::floor(p.x), iy = (int)std::floor(p.y), iz = (int)std::floor(p.z);
    float fx = p.x - ix, fy = p.y - iy, fz = p.z - iz;
    float u = quintic(fx), v = quintic(fy), w = quintic(fz);
    float n000 = grad3(ix, iy, iz, fx, fy, fz);
    float n100 = grad3(ix+1, iy, iz, fx-1, fy, fz);
    float n010 = grad3(ix, iy+1, iz, fx, fy-1, fz);
    float n110 = grad3(ix+1, iy+1, iz, fx-1, fy-1, fz);
    float n001 = grad3(ix, iy, iz+1, fx, fy, fz-1);
    float n101 = grad3(ix+1, iy, iz+1, fx-1, fy, fz-1);
    float n011 = grad3(ix, iy+1, iz+1, fx, fy-1, fz-1);
    float n111 = grad3(ix+1, iy+1, iz+1, fx-1, fy-1, fz-1);
    float x0 = lerpf(lerpf(n000, n100, u), lerpf(n010, n110, u), v);
    float x1 = lerpf(lerpf(n001, n101, u), lerpf(n011, n111, u), v);
    return lerpf(x0, x1, w) * 1.6f;
}

float Noise::fbm2(float x, float y, int octaves, float lacunarity, float gain) const {
    float sum = 0, amp = 1, norm = 0, fx = x, fy = y;
    for (int i = 0; i < octaves; i++) {
        sum += noise2(fx, fy) * amp;
        norm += amp;
        amp *= gain;
        fx *= lacunarity; fy *= lacunarity;
        fx += 13.7f; fy -= 7.3f;
    }
    return sum / std::max(1e-5f, norm);
}

float Noise::fbm3(const Vec3& p, int octaves, float lacunarity, float gain) const {
    float sum = 0, amp = 1, norm = 0;
    Vec3 q = p;
    for (int i = 0; i < octaves; i++) {
        sum += noise3(q) * amp;
        norm += amp;
        amp *= gain;
        q = q * lacunarity + Vec3(11.3f, 5.1f, -9.7f);
    }
    return sum / std::max(1e-5f, norm);
}

float Noise::ridged2(float x, float y, int octaves) const {
    float sum = 0, amp = 1, norm = 0, fx = x, fy = y;
    for (int i = 0; i < octaves; i++) {
        float n = 1.0f - std::fabs(noise2(fx, fy));
        n *= n;
        sum += n * amp;
        norm += amp;
        amp *= 0.5f;
        fx *= 2.03f; fy *= 2.03f;
    }
    return sum / std::max(1e-5f, norm);
}

float Noise::ridge3(const Vec3& p, int octaves) const {
    float sum = 0, amp = 1, norm = 0;
    Vec3 q = p;
    for (int i = 0; i < octaves; i++) {
        float n = 1.0f - std::fabs(noise3(q));
        n *= n;
        sum += n * amp; norm += amp;
        amp *= 0.5f;
        q = q * 2.03f + Vec3(3.1f, -2.7f, 5.3f);
    }
    return sum / std::max(1e-5f, norm);
}

float Noise::billow2(float x, float y, int octaves) const {
    float sum = 0, amp = 1, norm = 0, fx = x, fy = y;
    for (int i = 0; i < octaves; i++) {
        sum += std::fabs(noise2(fx, fy)) * amp;
        norm += amp;
        amp *= 0.5f;
        fx *= 2.05f; fy *= 2.05f;
    }
    return sum / std::max(1e-5f, norm);
}

} // namespace hv
