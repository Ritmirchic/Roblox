// core.cpp - noise, materials, colour, logging, PNG output
#include "frac.h"
#include <cstdarg>

RNG g_rng;
FILE* g_logFile = nullptr;

void logf(const char* fmt, ...) {
    char buf[2048];
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(buf, sizeof(buf), fmt, ap);
    va_end(ap);
    if (g_logFile) {
        fputs(buf, g_logFile);
        fputc('\n', g_logFile);
        fflush(g_logFile);
    }
    fputs(buf, stdout);
    fputc('\n', stdout);
    fflush(stdout);
}

uint32_t rgba(int r, int g, int b, int a) {
    return (uint32_t(a) << 24) | (uint32_t(clampi(r, 0, 255)) << 16) |
           (uint32_t(clampi(g, 0, 255)) << 8) | uint32_t(clampi(b, 0, 255));
}
uint32_t packColor(float r, float g, float b, float a) {
    return rgba(int(saturate(r) * 255), int(saturate(g) * 255), int(saturate(b) * 255),
                int(saturate(a) * 255));
}
Vec3 colorToVec(uint32_t c) {
    return Vec3(((c >> 16) & 255) / 255.0f, ((c >> 8) & 255) / 255.0f, (c & 255) / 255.0f);
}

// ------------------------------------------------------------------- noise
static inline uint32_t hash3(int x, int y, int z) {
    uint32_t h = uint32_t(x) * 374761393u + uint32_t(y) * 668265263u + uint32_t(z) * 2147483647u;
    h = (h ^ (h >> 13)) * 1274126177u;
    return h ^ (h >> 16);
}
static inline float hashf(int x, int y, int z) {
    return (hash3(x, y, z) >> 8) * (1.0f / 16777216.0f);
}
static inline float vnoise(float x, float y, float z) {
    int ix = int(floorf(x)), iy = int(floorf(y)), iz = int(floorf(z));
    float fx = x - ix, fy = y - iy, fz = z - iz;
    float ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz);
    float c000 = hashf(ix, iy, iz), c100 = hashf(ix + 1, iy, iz);
    float c010 = hashf(ix, iy + 1, iz), c110 = hashf(ix + 1, iy + 1, iz);
    float c001 = hashf(ix, iy, iz + 1), c101 = hashf(ix + 1, iy, iz + 1);
    float c011 = hashf(ix, iy + 1, iz + 1), c111 = hashf(ix + 1, iy + 1, iz + 1);
    float x00 = lerpf(c000, c100, ux), x10 = lerpf(c010, c110, ux);
    float x01 = lerpf(c001, c101, ux), x11 = lerpf(c011, c111, ux);
    return lerpf(lerpf(x00, x10, uy), lerpf(x01, x11, uy), uz);
}
float noise2(float x, float y) { return vnoise(x, y, 0.5f); }
float noise3(float x, float y, float z) { return vnoise(x, y, z); }
float fbm2(float x, float y, int oct) {
    float s = 0, a = 0.5f, f = 1;
    for (int i = 0; i < oct; i++) {
        s += vnoise(x * f, y * f, 0.5f) * a;
        f *= 2.03f;
        a *= 0.5f;
    }
    return s;
}
float fbm3(float x, float y, float z, int oct) {
    float s = 0, a = 0.5f, f = 1;
    for (int i = 0; i < oct; i++) {
        s += vnoise(x * f, y * f, z * f) * a;
        f *= 2.01f;
        a *= 0.5f;
    }
    return s;
}

// --------------------------------------------------------------- materials
MatDef kMats[MAT_COUNT];

void initMaterials() {
    // name, kind, strength, density, friction, flammability, texid, texScale,
    // trans, structural, crumble
    auto M = [](int id, const char* n, int kind, float st, float den, float fr, float fl,
                int tex, float ts, int tr, int str, float cr) {
        kMats[id].name = n;
        kMats[id].kind = kind;
        kMats[id].strength = st;
        kMats[id].density = den;
        kMats[id].friction = fr;
        kMats[id].flammability = fl;
        kMats[id].texid = tex;
        kMats[id].texScale = ts;
        kMats[id].trans = tr;
        kMats[id].structural = str;
        kMats[id].crumble = cr;
    };
    memset(kMats, 0, sizeof(kMats));
    M(MAT_AIR, "air", K_NONE, 0, 0, 0, 0, 0, 1, 0, 0, 0);
    M(MAT_CONCRETE, "concrete", K_CONCRETE, 3.0f, 2400, 0.8f, 0, 0, 2.0f, 0, 1, 1.2f);
    M(MAT_CONCRETE_DIRTY, "dirty concrete", K_CONCRETE, 3.0f, 2400, 0.85f, 0, 1, 2.0f, 0, 1, 1.2f);
    M(MAT_BRICK, "brick", K_BRICK, 2.0f, 1900, 0.7f, 0, 2, 1.5f, 0, 1, 1.0f);
    M(MAT_BRICK_RED, "red brick", K_BRICK, 2.0f, 1900, 0.7f, 0, 3, 1.5f, 0, 1, 1.0f);
    M(MAT_PLASTER, "plaster", K_PLASTER, 0.9f, 1200, 0.6f, 0, 4, 1.5f, 0, 1, 0.8f);
    M(MAT_WOOD, "wood", K_WOOD, 0.8f, 600, 0.55f, 0.85f, 5, 1.2f, 0, 1, 0.9f);
    M(MAT_WOOD_DARK, "dark wood", K_WOOD, 0.9f, 700, 0.55f, 0.8f, 6, 1.2f, 0, 1, 0.9f);
    M(MAT_PLANK, "plank", K_WOOD, 0.7f, 600, 0.6f, 0.9f, 7, 1.0f, 0, 1, 0.7f);
    M(MAT_METAL, "metal", K_METAL, 4.0f, 7800, 0.45f, 0, 8, 1.5f, 0, 1, 0.8f);
    M(MAT_METAL_RUST, "rusty metal", K_METAL, 3.2f, 7800, 0.5f, 0, 9, 1.5f, 0, 1, 0.8f);
    M(MAT_STEEL, "steel", K_METAL, 5.5f, 7850, 0.4f, 0, 10, 2.0f, 0, 1, 0.7f);
    M(MAT_GLASS, "glass", K_GLASS, 0.25f, 2500, 0.2f, 0, 11, 1.0f, 1, 0, 3.0f);
    M(MAT_GLASS_DIRTY, "dirty glass", K_GLASS, 0.3f, 2500, 0.2f, 0, 12, 1.0f, 1, 0, 3.0f);
    M(MAT_ASPHALT, "asphalt", K_ASPHALT, 2.2f, 2200, 0.75f, 0, 13, 3.0f, 0, 1, 1.0f);
    M(MAT_SOIL, "soil", K_SOIL, 0.4f, 1600, 0.8f, 0, 14, 1.5f, 0, 1, 0.6f);
    M(MAT_GRASS, "grass", K_SOIL, 0.45f, 1600, 0.9f, 0, 15, 2.0f, 0, 1, 0.6f);
    M(MAT_STONE, "stone", K_STONE, 5.0f, 2700, 0.8f, 0, 16, 2.5f, 0, 1, 1.4f);
    M(MAT_REBAR, "reinforced concrete", K_REINFORCED, 9.0f, 2500, 0.85f, 0, 17, 2.0f, 0, 1, 1.1f);
    M(MAT_TILE, "tile", K_CERAMIC, 1.2f, 2000, 0.4f, 0, 18, 0.8f, 0, 1, 2.0f);
    M(MAT_ROOF, "roof tile", K_BRICK, 1.4f, 1800, 0.6f, 0, 19, 1.0f, 0, 1, 1.8f);
    M(MAT_LEAVES, "foliage", K_VEG, 0.1f, 200, 0.6f, 1.0f, 20, 1.0f, 0, 0, 0.3f);
    M(MAT_BARK, "bark", K_WOOD, 1.2f, 500, 0.6f, 0.6f, 21, 0.8f, 0, 1, 0.6f);
    M(MAT_FABRIC, "fabric", K_FABRIC, 0.15f, 200, 0.5f, 0.9f, 22, 0.6f, 0, 0, 0.5f);
    M(MAT_PLASTIC, "plastic", K_PLASTIC, 0.5f, 900, 0.4f, 0.5f, 23, 0.8f, 0, 1, 0.9f);
    M(MAT_PAINT_RED, "red paint", K_METAL, 2.5f, 7800, 0.4f, 0.2f, 24, 1.5f, 0, 1, 0.8f);
    M(MAT_PAINT_YELLOW, "yellow paint", K_METAL, 2.5f, 7800, 0.4f, 0.2f, 25, 1.5f, 0, 1, 0.8f);
    M(MAT_PAINT_WHITE, "white paint", K_METAL, 2.5f, 7800, 0.4f, 0.2f, 26, 1.5f, 0, 1, 0.8f);
    M(MAT_PAINT_BLUE, "blue paint", K_METAL, 2.5f, 7800, 0.4f, 0.2f, 27, 1.5f, 0, 1, 0.8f);
    M(MAT_PAINT_GREEN, "green paint", K_METAL, 2.5f, 7800, 0.4f, 0.2f, 28, 1.5f, 0, 1, 0.8f);
    M(MAT_CARGO_RED, "red container", K_METAL, 3.0f, 7800, 0.5f, 0.1f, 29, 2.0f, 0, 1, 0.9f);
    M(MAT_CARGO_BLUE, "blue container", K_METAL, 3.0f, 7800, 0.5f, 0.1f, 30, 2.0f, 0, 1, 0.9f);
    M(MAT_CARGO_GREEN, "green container", K_METAL, 3.0f, 7800, 0.5f, 0.1f, 31, 2.0f, 0, 1, 0.9f);
    M(MAT_CARGO_YELLOW, "yellow container", K_METAL, 3.0f, 7800, 0.5f, 0.1f, 32, 2.0f, 0, 1, 0.9f);
    M(MAT_SAND, "sand", K_SOIL, 0.3f, 1500, 0.9f, 0, 33, 2.0f, 0, 1, 0.5f);
    M(MAT_GRAVEL, "gravel", K_SOIL, 0.6f, 1800, 0.9f, 0, 34, 1.5f, 0, 1, 1.0f);
    M(MAT_WATER, "water", K_LIQUID, 0.05f, 1000, 0.1f, 0, 35, 4.0f, 1, 0, 0.2f);
    M(MAT_NEON, "neon", K_PLASTIC, 0.4f, 800, 0.4f, 0, 36, 1.0f, 0, 0, 0.9f);
    M(MAT_LAMP, "lamp", K_PLASTIC, 0.4f, 800, 0.4f, 0, 37, 1.0f, 0, 0, 0.9f);
    M(MAT_RUBBER, "rubber", K_PLASTIC, 0.6f, 1100, 0.9f, 0.4f, 38, 0.7f, 0, 0, 0.7f);
    M(MAT_CERAMIC, "ceramic", K_CERAMIC, 1.0f, 2300, 0.4f, 0, 39, 0.7f, 0, 1, 2.2f);
    M(MAT_GOLD, "gold", K_METAL, 2.0f, 19000, 0.4f, 0, 40, 1.0f, 0, 1, 0.6f);
    M(MAT_COPPER, "copper", K_METAL, 3.0f, 8900, 0.45f, 0, 41, 1.2f, 0, 1, 0.7f);
}

// -------------------------------------------------------------- PNG output
static uint32_t crcTable[256];
static void initCRC() {
    static bool done = false;
    if (done) return;
    for (uint32_t n = 0; n < 256; n++) {
        uint32_t c = n;
        for (int k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320u ^ (c >> 1) : c >> 1;
        crcTable[n] = c;
    }
    done = true;
}
static uint32_t crc32buf(const uint8_t* buf, size_t len, uint32_t crc = 0xFFFFFFFFu) {
    initCRC();
    for (size_t i = 0; i < len; i++) crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >> 8);
    return crc;
}
static void put32(std::vector<uint8_t>& v, uint32_t x) {
    v.push_back(uint8_t(x >> 24)); v.push_back(uint8_t(x >> 16));
    v.push_back(uint8_t(x >> 8)); v.push_back(uint8_t(x));
}
static void chunkOut(std::vector<uint8_t>& out, const char* type, const std::vector<uint8_t>& data) {
    put32(out, uint32_t(data.size()));
    std::vector<uint8_t> td;
    td.insert(td.end(), type, type + 4);
    td.insert(td.end(), data.begin(), data.end());
    out.insert(out.end(), td.begin(), td.end());
    uint32_t c = crc32buf(td.data(), td.size()) ^ 0xFFFFFFFFu;
    put32(out, c);
}
// zlib stream with stored deflate blocks (simple, always valid)
static std::vector<uint8_t> zlibStored(const std::vector<uint8_t>& raw) {
    std::vector<uint8_t> z;
    z.push_back(0x78);
    z.push_back(0x01);
    size_t pos = 0;
    while (pos < raw.size()) {
        size_t n = std::min<size_t>(65535, raw.size() - pos);
        bool last = (pos + n >= raw.size());
        z.push_back(last ? 1 : 0);
        z.push_back(uint8_t(n & 0xFF));
        z.push_back(uint8_t(n >> 8));
        z.push_back(uint8_t((~n) & 0xFF));
        z.push_back(uint8_t(((~n) >> 8) & 0xFF));
        z.insert(z.end(), raw.begin() + pos, raw.begin() + pos + n);
        pos += n;
    }
    // adler32
    uint32_t a = 1, b = 0;
    for (uint8_t c : raw) {
        a = (a + c) % 65521;
        b = (b + a) % 65521;
    }
    put32(z, (b << 16) | a);
    return z;
}

bool writePNG(const char* path, int w, int h, const uint32_t* pix) {
    std::vector<uint8_t> raw;
    raw.reserve(size_t(h) * (w * 3 + 1));
    for (int y = 0; y < h; y++) {
        raw.push_back(0);
        for (int x = 0; x < w; x++) {
            uint32_t c = pix[y * w + x];
            raw.push_back(uint8_t((c >> 16) & 255));
            raw.push_back(uint8_t((c >> 8) & 255));
            raw.push_back(uint8_t(c & 255));
        }
    }
    std::vector<uint8_t> out = {0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};
    std::vector<uint8_t> ihdr;
    put32(ihdr, uint32_t(w));
    put32(ihdr, uint32_t(h));
    ihdr.push_back(8);  // bit depth
    ihdr.push_back(2);  // truecolor
    ihdr.push_back(0); ihdr.push_back(0); ihdr.push_back(0);
    chunkOut(out, "IHDR", ihdr);
    auto z = zlibStored(raw);
    chunkOut(out, "IDAT", z);
    chunkOut(out, "IEND", {});
    FILE* f = fopen(path, "wb");
    if (!f) return false;
    fwrite(out.data(), 1, out.size(), f);
    fclose(f);
    return true;
}
