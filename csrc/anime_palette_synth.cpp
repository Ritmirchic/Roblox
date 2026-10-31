#include "anime_palette_synth.hpp"
#include <algorithm>
#include <cmath>
#include <cstring>

namespace sakuga {

static const uint8_t kPaletteRGB[PALETTE_SIZE * 3] = {
    // 0..3: Outlines & Neutrals
    16,  14,  26,   // 0: Deep Anime Ink
    38,  36,  56,   // 1: Charcoal Shadow
    78,  84, 114,   // 2: Slate Mid
    252, 253, 255,  // 3: Pure Specular White

    // 4..7: Anime Skin & Blush
    255, 232, 212,  // 4: Fair Skin Light
    242, 198, 172,  // 5: Skin Mid / Warm Cheek
    198, 140, 122,  // 6: Skin Cel-Shadow
    244, 112, 136,  // 7: Anime Blush / Lip Rose

    // 8..19: 6 Hero Hair, Iris & Signature Colors (Light, Dark)
    246,  64,  86,  // 8: Akane Crimson Light
    154,  24,  50,  // 9: Akane Crimson Shadow
     58, 214, 255,  // 10: Ren Cyber Azure Light
     24, 108, 186,  // 11: Ren Cyber Azure Shadow
    230, 226, 252,  // 12: Lumina Astral Silver Light
    146, 138, 198,  // 13: Lumina Astral Silver Shadow
    255, 216,  70,  // 14: Raiden Gold Light
    192, 126,  24,  // 15: Raiden Gold Shadow
    182,  94, 248,  // 16: Kuro Amethyst Light
     92,  38, 154,  // 17: Kuro Amethyst Shadow
     76, 232, 150,  // 18: Midori Emerald Light
     30, 136,  84,  // 19: Midori Emerald Shadow

    // 20..27: Anime Sky & Lighting Gradients
     36, 118, 232,  // 20: Shinkai Cerulean Top
    124, 210, 254,  // 21: Horizon Sky Cyan
     72,  34, 112,  // 22: Sunset Deep Violet
    238,  88, 102,  // 23: Sunset Coral Red
    255, 182,  94,  // 24: Sunset Golden Horizon
     14,  18,  44,  // 25: Midnight Deep Indigo
     28,  44,  94,  // 26: Night Navy
     52,  22,  88,  // 27: Cyberpunk Storm Violet

    // 28..35: Environment & Architecture
    255, 180, 212,  // 28: Sakura Blossom Pink
    222, 100, 156,  // 29: Sakura Deep Petal
    204,  50,  44,  // 30: Torii Vermilion
     66,  42,  46,  // 31: Dark Timber / Earth
     94, 188,  90,  // 32: Bamboo / Enoden Green Light
     32,  88,  56,  // 33: Forest / Enoden Deep Green
     58,  76, 126,  // 34: Distant Mountain Indigo
    126, 134, 162,  // 35: Carved Stone Light

    // 36..47: Outfits, Steel, Neon & Sakuga FX
     32,  46,  82,  // 36: Haori Midnight Navy
    230, 234, 246,  // 37: Crisp White Fabric Trim
    200, 216, 236,  // 38: Katana Steel Highlight
    110, 126, 156,  // 39: Katana Steel Shadow
    255,  52, 188,  // 40: Cyberpunk Neon Magenta
     44, 248, 236,  // 41: Cyberpunk Neon Cyan
    255, 136,  38,  // 42: Solar / Flame Ki Orange
    255, 246, 142,  // 43: Luminous Plasma Gold
     22,  72, 138,  // 44: Ocean Deep Blue
     94, 172, 238,  // 45: Ocean Shimmer Cyan
    255, 206, 116,  // 46: Lantern Warm Cream
    186, 194, 226   // 47: Cloud Mist Lavender
};

const uint8_t* get_master_palette_rgb() {
    return kPaletteRGB;
}

namespace {

struct Canvas128 {
    uint8_t px[BASE_H * BASE_W];

    inline void set(int x, int y, uint8_t c) {
        if (static_cast<unsigned>(x) < BASE_W && static_cast<unsigned>(y) < BASE_H) {
            px[y * BASE_W + x] = c;
        }
    }

    inline uint8_t get(int x, int y) const {
        x = std::clamp(x, 0, BASE_W - 1);
        y = std::clamp(y, 0, BASE_H - 1);
        return px[y * BASE_W + x];
    }

    void fill_rect(int x0, int y0, int w, int h, uint8_t c) {
        int x1 = std::min(BASE_W, x0 + w);
        int y1 = std::min(BASE_H, y0 + h);
        x0 = std::max(0, x0);
        y0 = std::max(0, y0);
        for (int y = y0; y < y1; ++y) {
            for (int x = x0; x < x1; ++x) px[y * BASE_W + x] = c;
        }
    }

    void rect_outlined(int x0, int y0, int w, int h, uint8_t fill_c, uint8_t out_c) {
        fill_rect(x0 - 1, y0 - 1, w + 2, h + 2, out_c);
        fill_rect(x0, y0, w, h, fill_c);
    }

    void fill_circle(int cx, int cy, int r, uint8_t c) {
        int r2 = r * r;
        for (int dy = -r; dy <= r; ++dy) {
            for (int dx = -r; dx <= r; ++dx) {
                if (dx * dx + dy * dy <= r2) set(cx + dx, cy + dy, c);
            }
        }
    }

    void circle_ring(int cx, int cy, int r_in, int r_out, uint8_t c) {
        int ri2 = r_in * r_in, ro2 = r_out * r_out;
        for (int dy = -r_out; dy <= r_out; ++dy) {
            for (int dx = -r_out; dx <= r_out; ++dx) {
                int d2 = dx * dx + dy * dy;
                if (d2 >= ri2 && d2 <= ro2) set(cx + dx, cy + dy, c);
            }
        }
    }

    void fill_ellipse(int cx, int cy, int rx, int ry, uint8_t c) {
        if (rx <= 0 || ry <= 0) return;
        for (int dy = -ry; dy <= ry; ++dy) {
            for (int dx = -rx; dx <= rx; ++dx) {
                float nx = static_cast<float>(dx) / static_cast<float>(rx);
                float ny = static_cast<float>(dy) / static_cast<float>(ry);
                if (nx * nx + ny * ny <= 1.0f) set(cx + dx, cy + dy, c);
            }
        }
    }

    void fill_ellipse_outlined(int cx, int cy, int rx, int ry, uint8_t fill_c, uint8_t out_c) {
        fill_ellipse(cx, cy, rx + 1, ry + 1, out_c);
        fill_ellipse(cx, cy, rx, ry, fill_c);
    }

    void line(int x0, int y0, int x1, int y1, uint8_t c, int thickness = 1) {
        int dx = std::abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
        int dy = -std::abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
        int err = dx + dy;
        int r = thickness / 2;
        while (true) {
            if (thickness <= 1) {
                set(x0, y0, c);
            } else {
                for (int ty = -r; ty <= r; ++ty)
                    for (int tx = -r; tx <= r; ++tx)
                        if (tx * tx + ty * ty <= r * r + 1) set(x0 + tx, y0 + ty, c);
            }
            if (x0 == x1 && y0 == y1) break;
            int e2 = 2 * err;
            if (e2 >= dy) { err += dy; x0 += sx; }
            if (e2 <= dx) { err += dx; y0 += sy; }
        }
    }

    void fill_tri(int x0, int y0, int x1, int y1, int x2, int y2, uint8_t c) {
        int minx = std::max(0, std::min({x0, x1, x2}));
        int maxx = std::min(BASE_W - 1, std::max({x0, x1, x2}));
        int miny = std::max(0, std::min({y0, y1, y2}));
        int maxy = std::min(BASE_H - 1, std::max({y0, y1, y2}));
        auto edge = [](int ax, int ay, int bx, int by, int px_x, int px_y) {
            return (px_x - ax) * (by - ay) - (px_y - ay) * (bx - ax);
        };
        int area = edge(x0, y0, x1, y1, x2, y2);
        if (area == 0) return;
        for (int y = miny; y <= maxy; ++y) {
            for (int x = minx; x <= maxx; ++x) {
                int w0 = edge(x1, y1, x2, y2, x, y);
                int w1 = edge(x2, y2, x0, y0, x, y);
                int w2 = edge(x0, y0, x1, y1, x, y);
                if ((area > 0 && w0 >= 0 && w1 >= 0 && w2 >= 0) ||
                    (area < 0 && w0 <= 0 && w1 <= 0 && w2 <= 0)) {
                    px[y * BASE_W + x] = c;
                }
            }
        }
    }

    // Tapered anime hair strand / blade lock with crisp dark ink outline
    void tapered_lock(int x0, int y0, int x1, int y1, int w_base, uint8_t fill_c, uint8_t out_c = 0) {
        float dx = static_cast<float>(x1 - x0);
        float dy = static_cast<float>(y1 - y0);
        float len = std::max(1.0f, std::sqrt(dx * dx + dy * dy));
        int nx = static_cast<int>(std::round(-dy / len * w_base));
        int ny = static_cast<int>(std::round(dx / len * w_base));
        fill_tri(x0 - nx - (nx >= 0 ? 1 : -1), y0 - ny, x0 + nx + (nx >= 0 ? 1 : -1), y0 + ny, x1, y1 + 1, out_c);
        fill_tri(x0 - nx, y0 - ny, x0 + nx, y0 + ny, x1, y1, fill_c);
        line(x0 - nx, y0 - ny, x1, y1, out_c, 1);
        line(x0 + nx, y0 + ny, x1, y1, out_c, 1);
    }
};

static inline uint8_t dither_2x2(int x, int y, float t, uint8_t c0, uint8_t c1) {
    static const float bayer[2][2] = {{0.18f, 0.68f}, {0.82f, 0.32f}};
    return (t > bayer[y & 1][x & 1]) ? c1 : c0;
}

static inline uint32_t hash_u32(uint32_t x) {
    x ^= x >> 16;
    x *= 0x7feb352dU;
    x ^= x >> 15;
    x *= 0x846ca68bU;
    x ^= x >> 16;
    return x;
}

// ================= 1. ANIME SKY & ATMOSPHERE (128x128) =================

void draw_sky_128(Canvas128& cv, int scene_id, int time_id, int cam_x, int global_f, int seed) {
    int sky_h = 98;
    bool eclipse = (scene_id == 4);
    for (int y = 0; y < BASE_H; ++y) {
        float fy = std::clamp(static_cast<float>(y) / static_cast<float>(sky_h), 0.0f, 1.0f);
        for (int x = 0; x < BASE_W; ++x) {
            uint8_t c = 25;
            if (eclipse) {
                if (fy < 0.45f) c = dither_2x2(x, y, fy / 0.45f, 25, 9);
                else c = dither_2x2(x, y, (fy - 0.45f) / 0.55f, 9, 23);
            } else if (time_id == 0) { // Golden Shinkai Sunset
                if (fy < 0.30f) c = dither_2x2(x, y, fy / 0.30f, 22, 23);
                else if (fy < 0.68f) c = dither_2x2(x, y, (fy - 0.30f) / 0.38f, 23, 24);
                else c = dither_2x2(x, y, (fy - 0.68f) / 0.32f, 24, 46);
            } else if (time_id == 1) { // Starry Midnight
                if (fy < 0.52f) c = dither_2x2(x, y, fy / 0.52f, 25, 26);
                else c = dither_2x2(x, y, (fy - 0.52f) / 0.48f, 26, 34);
            } else if (time_id == 2) { // Clear Shinkai Day
                if (fy < 0.45f) c = dither_2x2(x, y, fy / 0.45f, 20, 21);
                else if (fy < 0.82f) c = dither_2x2(x, y, (fy - 0.45f) / 0.37f, 21, 47);
                else c = 3;
            } else { // Neon Storm
                if (fy < 0.48f) c = dither_2x2(x, y, fy / 0.48f, 25, 27);
                else c = dither_2x2(x, y, (fy - 0.48f) / 0.52f, 27, 40);
            }
            cv.set(x, y, c);
        }
    }

    int sun_x = 94 - cam_x / 4;
    if (eclipse) {
        // Dramatic Crimson Eclipse Ring (Berserk / Fate style)
        cv.fill_circle(sun_x, 30, 17, 42);
        cv.circle_ring(sun_x, 30, 13, 15, 43);
        cv.circle_ring(sun_x, 30, 12, 13, 3);
        cv.fill_circle(sun_x, 30, 11, 0);
    } else if (time_id == 0) {
        // Warm glowing Anime Sunset Sun + horizontal cloud wisps
        cv.fill_circle(sun_x, 52, 18, 42);
        cv.fill_circle(sun_x, 52, 13, 43);
        cv.fill_circle(sun_x, 52, 8, 3);
        for (int k = 0; k < 4; ++k) {
            int cx = ((k * 36 + 18 - cam_x / 3 + global_f / 3) % 150 + 150) % 150 - 12;
            int cy = 24 + k * 9;
            cv.fill_ellipse(cx, cy, 16, 3, 23);
            cv.fill_ellipse(cx + 4, cy - 1, 11, 2, 46);
        }
    } else if (time_id == 1) {
        // Twinkling Stars + Huge Luminous Anime Full Moon
        for (int s = 0; s < 36; ++s) {
            uint32_t h = hash_u32(static_cast<uint32_t>(s * 197 + seed * 17));
            int sx = ((static_cast<int>(h & 127) - cam_x / 4) % 128 + 128) % 128;
            int sy = static_cast<int>((h >> 8) % 58);
            bool twinkle = ((global_f + s) % 8 == 0);
            cv.set(sx, sy, twinkle ? 3 : 47);
            if (twinkle && (s % 4 == 0)) {
                cv.set(sx - 1, sy, 41); cv.set(sx + 1, sy, 41);
                cv.set(sx, sy - 1, 41); cv.set(sx, sy + 1, 41);
            }
        }
        cv.fill_circle(sun_x, 28, 17, 47);
        cv.fill_circle(sun_x, 28, 15, 43);
        cv.fill_circle(sun_x + 2, 26, 11, 3);
    } else if (time_id == 2) {
        // Towering Makoto Shinkai Cumulus Clouds!
        for (int k = 0; k < 3; ++k) {
            int cx = ((k * 46 + 22 - cam_x / 3 + global_f / 4) % 156 + 156) % 156 - 14;
            int cy = 42 + (k % 2) * 8;
            cv.fill_circle(cx - 10, cy + 5, 11, 47);
            cv.fill_circle(cx + 10, cy + 4, 12, 47);
            cv.fill_circle(cx, cy, 15, 47);
            cv.fill_circle(cx - 8, cy + 2, 9, 3);
            cv.fill_circle(cx + 8, cy + 1, 10, 3);
            cv.fill_circle(cx, cy - 4, 13, 3);
        }
    } else if (time_id == 3) {
        // Jagged Storm Lightning Bolt
        if ((global_f % 16) == 5 || (global_f % 16) == 6) {
            int lx = 34 - cam_x / 3;
            cv.line(lx, 0, lx - 6, 20, 41, 2);
            cv.line(lx - 6, 20, lx + 5, 34, 3, 2);
            cv.line(lx + 5, 34, lx - 4, 58, 41, 1);
        }
    }
}

// ================= 2. CONCRETE ANIME ENVIRONMENTS (128x128) =================

void draw_sakura_branch_cluster(Canvas128& cv, int cx, int cy, int r) {
    // Organic anime cherry blossom canopy: deep shadow base -> lush pink puffs -> scattered white petal glints!
    cv.fill_circle(cx, cy + 3, r, 29);
    cv.fill_circle(cx - r * 2 / 3, cy + 2, r * 3 / 4, 29);
    cv.fill_circle(cx + r * 2 / 3, cy + 2, r * 3 / 4, 29);

    cv.fill_circle(cx, cy - 1, r - 2, 28);
    cv.fill_circle(cx - r * 2 / 3, cy, r * 3 / 4 - 1, 28);
    cv.fill_circle(cx + r * 2 / 3, cy - 1, r * 3 / 4 - 1, 28);
    cv.fill_circle(cx, cy - r / 2, r * 2 / 3, 28);

    // Delicate 2px white blossom highlights on sunlit upper crown
    for (int k = -2; k <= 2; ++k) {
        int hx = cx + k * (r / 3);
        int hy = cy - r / 2 + (std::abs(k) % 2) * 3;
        cv.fill_rect(hx - 1, hy - 1, 2, 2, 3);
    }
}

void draw_environment_128(Canvas128& cv, int scene_id, int time_id, int framing_id, int cam_x, int global_f) {
    if (framing_id == 2) {
        // Atmospheric anime depth-of-field bokeh backdrop for close-up portraits!
        for (int y = 92; y < BASE_H; ++y) {
            uint8_t gc = (scene_id == 1) ? 1 : (scene_id == 5 ? 44 : 33);
            for (int x = 0; x < BASE_W; ++x) cv.set(x, y, gc);
        }
        if (scene_id == 0) {
            draw_sakura_branch_cluster(cv, 18 - cam_x / 3, 22, 22);
            draw_sakura_branch_cluster(cv, 112 - cam_x / 3, 26, 20);
        } else if (scene_id == 1) {
            for (int b = 0; b < 10; ++b) {
                int bx = ((b * 19 + 9 - cam_x / 2) % 128 + 128) % 128;
                int by = 38 + (b % 4) * 14;
                cv.fill_circle(bx, by, 4, (b % 2 == 0) ? 40 : 41);
                cv.fill_circle(bx, by, 2, 3);
            }
        } else if (scene_id == 2) {
            for (int i = 0; i < 6; ++i) {
                int bx = (i * 24 + 8) % 128;
                cv.line(bx, 0, bx + 2, 92, 33, 3);
            }
        }
        return;
    }

    int ground_y = (framing_id == 1) ? 110 : 98;

    if (scene_id == 0) {
        // SCENE 0: Sakura Shrine & Mt. Fuji (Kimetsu / Shinkai style)
        int mx = 64 - cam_x / 5;
        for (int y = 48; y < ground_y; ++y) {
            int hw = (y - 48) * 7 / 5 + 5;
            bool snow = (y < 62 + ((y * 3) % 3));
            uint8_t mc = snow ? 3 : 34;
            for (int x = mx - hw; x <= mx + hw; ++x) cv.set(x, y, mc);
            cv.set(mx - hw, y, 26);
        }

        // Vermilion Torii Gate on right
        int tx = 94 - cam_x / 2;
        cv.rect_outlined(tx - 18, ground_y - 38, 4, 38, 30, 0);
        cv.rect_outlined(tx + 14, ground_y - 38, 4, 38, 30, 0);
        cv.rect_outlined(tx - 24, ground_y - 43, 48, 5, 30, 0);
        cv.fill_rect(tx - 26, ground_y - 45, 52, 2, 0); // Black kasagi top beam
        cv.rect_outlined(tx - 20, ground_y - 32, 40, 4, 30, 0);
        cv.rect_outlined(tx - 3, ground_y - 38, 6, 7, 46, 0); // Gold shrine plaque

        // Stone Toro Lantern
        int lx = tx - 28;
        cv.rect_outlined(lx - 3, ground_y - 16, 6, 16, 35, 0);
        cv.rect_outlined(lx - 5, ground_y - 20, 10, 4, 2, 0);
        cv.fill_rect(lx - 2, ground_y - 15, 4, 4, 43);

        // Weeping Sakura Tree on left
        int sx = 18 - cam_x / 2;
        cv.line(sx, ground_y, sx + 4, ground_y - 34, 31, 5);
        cv.line(sx + 3, ground_y - 28, sx + 20, ground_y - 44, 31, 3);
        cv.line(sx + 2, ground_y - 30, sx - 10, ground_y - 46, 31, 3);
        draw_sakura_branch_cluster(cv, sx + 4, ground_y - 48, 16);
        draw_sakura_branch_cluster(cv, sx + 20, ground_y - 42, 13);
        draw_sakura_branch_cluster(cv, sx - 8, ground_y - 44, 12);

        // Shrine courtyard stone path & grass
        cv.fill_rect(0, ground_y, BASE_W, BASE_H - ground_y, 33);
        cv.fill_rect(0, ground_y, BASE_W, 3, 32);
        cv.fill_rect(0, ground_y + 4, BASE_W, 10, 35);
        cv.line(0, ground_y + 4, BASE_W - 1, ground_y + 4, 0, 1);
    } else if (scene_id == 1) {
        // SCENE 1: Neo-Tokyo Cyberpunk Rooftop (Edgerunners / Akira style)
        for (int b = 0; b < 8; ++b) {
            int bx = ((b * 19 - cam_x / 2) % 152 + 152) % 152 - 12;
            int bh = 36 + (b * 13) % 38;
            int bw = 15 + (b % 3) * 4;
            int by = ground_y - bh;
            cv.rect_outlined(bx, by, bw, bh, 1, 0);
            cv.line(bx, by, bx + bw - 1, by, 2, 1);
            // Glowing skyscraper window grid
            for (int wy = by + 5; wy < ground_y - 4; wy += 5) {
                for (int wx = bx + 3; wx < bx + bw - 3; wx += 4) {
                    if (((wx + wy + b) % 3) != 0) {
                        uint8_t wc = (b % 2 == 0) ? 41 : 46;
                        cv.fill_rect(wx, wy, 2, 2, wc);
                    }
                }
            }
            // Vertical pixel neon signboards!
            if (b % 2 == 1) {
                uint8_t nc = (b % 4 == 1) ? 40 : 41;
                cv.rect_outlined(bx + bw, by + 6, 4, 20, nc, 0);
                for (int sy = by + 8; sy < by + 24; sy += 4) cv.fill_rect(bx + bw + 1, sy, 2, 2, 3);
            }
        }
        // Rooftop parapet, guardrail & wet neon reflections!
        cv.fill_rect(0, ground_y, BASE_W, BASE_H - ground_y, 1);
        cv.fill_rect(0, ground_y, BASE_W, 3, 35);
        cv.line(0, ground_y - 10, BASE_W - 1, ground_y - 10, 2, 1);
        for (int rx = (-cam_x % 14 + 14) % 14; rx < BASE_W; rx += 14) {
            cv.line(rx, ground_y - 10, rx, ground_y, 2, 1);
        }
        // Wet rooftop neon puddle shimmer
        cv.fill_ellipse(36, ground_y + 8, 16, 2, 40);
        cv.fill_ellipse(92, ground_y + 9, 18, 2, 41);
    } else if (scene_id == 2) {
        // SCENE 2: Moonlit Bamboo Shrine Forest (Samurai Champloo style)
        cv.fill_rect(0, ground_y - 22, BASE_W, 22, 33);
        for (int i = 0; i < 14; ++i) {
            int bx = ((i * 11 + 5 - cam_x / 2) % 144 + 144) % 144 - 8;
            int sway = static_cast<int>(std::sin(global_f * 0.22f + i) * 2.0f);
            uint8_t bc = (i % 2 == 0) ? 32 : 19;
            int thick = (i % 3 == 0) ? 3 : 2;
            cv.line(bx, ground_y, bx + sway, 4, bc, thick);
            for (int ny = 14; ny < ground_y; ny += 14) {
                int nx = bx + (sway * (ground_y - ny)) / ground_y;
                cv.line(nx - 2, ny, nx + 2, ny, 0, 1);
                if ((ny + i) % 28 == 0) {
                    cv.line(nx, ny, nx + 6, ny - 3, 32, 1);
                    cv.line(nx, ny, nx + 5, ny + 2, 19, 1);
                }
            }
        }
        // Glowing golden fireflies!
        for (int f = 0; f < 8; ++f) {
            int fx = ((f * 19 + global_f * 2) % 120) + 4;
            int fy = 54 + static_cast<int>(std::sin(global_f * 0.5f + f) * 10.0f);
            cv.fill_circle(fx, fy, 1, 43);
        }
        cv.fill_rect(0, ground_y, BASE_W, BASE_H - ground_y, 33);
        cv.fill_rect(0, ground_y, BASE_W, 3, 19);
    } else if (scene_id == 3) {
        // SCENE 3: Floating Sky Sanctuary (Frieren / Laputa style)
        for (int c = 0; c < 6; ++c) {
            int cx = ((c * 26 - cam_x / 3 + global_f / 3) % 150 + 150) % 150 - 10;
            cv.fill_circle(cx, ground_y + 4, 14, 47);
            cv.fill_circle(cx + 5, ground_y + 1, 11, 3);
        }
        // Ancient stone colonnade & levitating mana crystal
        int px = 22 - cam_x / 2;
        cv.rect_outlined(px, ground_y - 42, 8, 42, 37, 0);
        cv.rect_outlined(px - 3, ground_y - 45, 14, 4, 35, 0);
        int bob_c = static_cast<int>(std::sin(global_f * 0.4f) * 2.0f);
        cv.fill_tri(102, ground_y - 42 + bob_c, 97, ground_y - 32 + bob_c, 107, ground_y - 32 + bob_c, 41);
        cv.fill_tri(102, ground_y - 22 + bob_c, 97, ground_y - 32 + bob_c, 107, ground_y - 32 + bob_c, 10);

        cv.fill_rect(0, ground_y, BASE_W, BASE_H - ground_y, 35);
        cv.fill_rect(0, ground_y, BASE_W, 4, 37);
        cv.line(0, ground_y, BASE_W - 1, ground_y, 0, 1);
    } else if (scene_id == 4) {
        // SCENE 4: Eclipse Sword Hill (Unlimited Blade Works / Berserk style)
        for (int k = 0; k < 7; ++k) {
            int kx = k * 22 - (cam_x / 3) % 22;
            int kh = 18 + (k * 9) % 18;
            cv.fill_tri(kx - kh, ground_y, kx + kh, ground_y, kx, ground_y - kh, 1);
        }
        // Planted silhouette katanas in the hill!
        for (int s = 0; s < 5; ++s) {
            int sx = ((s * 27 + 12 - cam_x / 2) % 124 + 124) % 124;
            int tilt = (s % 2 == 0) ? 3 : -3;
            cv.line(sx, ground_y, sx + tilt, ground_y - 22, 0, 2);
            cv.line(sx + tilt - 4, ground_y - 16, sx + tilt + 4, ground_y - 16, 0, 2);
            cv.set(sx + tilt, ground_y - 22, 38);
        }
        cv.fill_rect(0, ground_y, BASE_W, BASE_H - ground_y, 31);
        cv.line(0, ground_y, BASE_W - 1, ground_y, 0, 1);
    } else {
        // SCENE 5: Kamakura Seaside Railroad Crossing (Slam Dunk / Shinkai iconic scene!)
        int sea_y = ground_y - 24;
        cv.fill_rect(0, sea_y, BASE_W, 24, (time_id == 0) ? 34 : 44);
        for (int y = sea_y + 2; y < ground_y - 8; y += 3) {
            int rw = 26 - (y - sea_y);
            int rx = 92 - cam_x / 3 + static_cast<int>(std::sin(global_f * 0.5f + y) * 3.0f);
            cv.fill_rect(rx - rw / 2, y, rw, 1, (time_id == 0) ? 43 : 45);
        }

        // Iconic Retro Green & Cream Anime Commuter Train passing along coast!
        int train_x = 136 - ((global_f * 4) % 210);
        int ty = ground_y - 26;
        for (int car = 0; car < 2; ++car) {
            int cx = train_x + car * 52;
            cv.rect_outlined(cx, ty, 48, 18, 33, 0);
            cv.fill_rect(cx, ty + 2, 48, 7, 46); // Cream upper stripe
            for (int w = 0; w < 4; ++w) {
                cv.rect_outlined(cx + 4 + w * 11, ty + 3, 7, 5, 21, 0);
            }
        }

        // Railroad tracks + yellow/black crossing pole with blinking red lamps!
        cv.fill_rect(0, ground_y - 7, BASE_W, 7, 2);
        cv.line(0, ground_y - 6, BASE_W - 1, ground_y - 6, 38, 1);
        int px = 104 - cam_x / 2;
        cv.rect_outlined(px, ground_y - 46, 3, 46, 14, 0);
        for (int yy = ground_y - 44; yy < ground_y; yy += 6) cv.fill_rect(px, yy, 3, 3, 0);
        bool lamp_alt = ((global_f / 3) % 2 == 0);
        cv.fill_circle(px - 3, ground_y - 34, 2, lamp_alt ? 8 : 9);
        cv.fill_circle(px + 5, ground_y - 34, 2, lamp_alt ? 9 : 8);

        // Overhead catenary wires
        cv.line(0, 26, BASE_W - 1, 28, 0, 1);
        cv.fill_rect(0, ground_y, BASE_W, BASE_H - ground_y, 2);
        cv.fill_rect(0, ground_y, BASE_W, 3, 37);
    }
}

// ================= 3. DETAILED ANIME CLOSE-UP PORTRAIT (128x128) =================

void draw_anime_eye_closeup(
    Canvas128& cv,
    int ex,
    int ey,
    int side, // -1 left eye, +1 right eye
    uint8_t iris_dark,
    uint8_t iris_light,
    bool blink,
    bool fierce_brows
) {
    if (blink) {
        cv.line(ex - 6, ey + 2, ex + 6, ey + 2, 0, 2);
        cv.line(ex + side * 4, ey + 2, ex + side * 7, ey, 0, 1);
    } else {
        // Crisp white sclera
        cv.fill_ellipse_outlined(ex, ey + 1, 7, 5, 3, 0);
        // 3-tone jewelled anime iris
        cv.fill_ellipse(ex, ey + 1, 5, 5, iris_dark);
        cv.fill_ellipse(ex, ey + 3, 4, 3, iris_light);
        // Deep vertical pupil
        cv.fill_rect(ex - 1, ey, 3, 4, 0);
        // Dual specular catchlights (signature anime eye sparkle!)
        cv.fill_rect(ex - 4, ey - 2, 3, 3, 3);
        cv.fill_rect(ex + 2, ey + 3, 2, 2, 3);
        // Thick winged anime upper eyelash + subtle lower lash
        cv.line(ex - 7, ey - 3, ex + 7, ey - 3, 0, 2);
        cv.line(ex - 6, ey - 4, ex + 5, ey - 4, 0, 1);
        cv.line(ex + side * 6, ey - 3, ex + side * 9, ey - 5, 0, 2); // Winged outer tip!
        cv.line(ex - 4, ey + 6, ex + 4, ey + 6, 0, 1);
    }
    // Cheek blush strokes
    cv.line(ex + side * 3, ey + 8, ex + side * 6, ey + 7, 7, 1);
    cv.line(ex + side * 5, ey + 9, ex + side * 8, ey + 8, 7, 1);

    // Expressive Anime Eyebrow (delicate 1px arch with clean forehead skin above it)
    int tilt = fierce_brows ? 2 : 0;
    cv.line(ex - 5, ey - 7 + side * tilt, ex + 5, ey - 7 - side * tilt, 0, 1);
}

// Smooth row-by-row anime head contour (zero internal seams: Pass 1 outline, Pass 2 skin + cel-shading!)
void draw_smooth_anime_face(Canvas128& cv, int cx, int cy, int rx, int ry_up, int ry_down) {
    auto half_w = [&](float dy) -> float {
        if (dy < 0.0f) {
            float t = std::clamp(-dy / std::max(1.0f, static_cast<float>(ry_up)), 0.0f, 1.0f);
            return rx * std::sqrt(std::max(0.0f, 1.0f - t * t));
        } else {
            // Classic anime jawline: gentle cheek curve from y=0..0.55, then smooth taper to delicate chin!
            float t = std::clamp(dy / std::max(1.0f, static_cast<float>(ry_down)), 0.0f, 1.0f);
            return rx * std::pow(std::max(0.0f, 1.0f - std::pow(t, 1.55f)), 0.68f);
        }
    };

    for (int dy = -ry_up - 1; dy <= ry_down + 1; ++dy) {
        int hw_out = static_cast<int>(std::round(half_w(static_cast<float>(dy)) + 1.2f));
        if (dy == -ry_up - 1 || dy == ry_down + 1) hw_out = std::max(2, hw_out / 2);
        cv.fill_rect(cx - hw_out, cy + dy, 2 * hw_out + 1, 1, 0);
    }
    for (int dy = -ry_up; dy <= ry_down; ++dy) {
        int hw = static_cast<int>(std::round(half_w(static_cast<float>(dy))));
        if (hw <= 0) continue;
        cv.fill_rect(cx - hw, cy + dy, 2 * hw + 1, 1, 4);
        // Soft anime cel-shadow along left cheek & temple
        int sh_w = std::max(1, hw / 5);
        cv.fill_rect(cx - hw, cy + dy, sh_w, 1, 5);
    }
}

// Two-pass trapezoid with clean 1px ink outline (for anime hakama, skirts, collars & haori sleeves)
void draw_trapezoid_outlined(
    Canvas128& cv, int cx_top, int y_top, int hw_top, int cx_bot, int y_bot, int hw_bot, uint8_t fill_c, uint8_t shade_c
) {
    if (y_bot <= y_top) return;
    int h = y_bot - y_top;
    for (int pass = 0; pass < 2; ++pass) {
        for (int i = -pass; i <= h + (1 - pass); ++i) {
            float t = std::clamp(static_cast<float>(i) / static_cast<float>(h), 0.0f, 1.0f);
            int cx = static_cast<int>(std::round(cx_top + (cx_bot - cx_top) * t));
            int hw = static_cast<int>(std::round(hw_top + (hw_bot - hw_top) * t)) + (pass == 0 ? 1 : 0);
            int y = y_top + i;
            if (pass == 0) {
                cv.fill_rect(cx - hw, y, 2 * hw + 1, 1, 0);
            } else if (i >= 0 && i <= h) {
                cv.fill_rect(cx - hw, y, 2 * hw + 1, 1, fill_c);
                int sw = std::max(2, hw / 3);
                cv.fill_rect(cx - hw, y, sw, 1, shade_c);
            }
        }
    }
}

void draw_closeup_character_128(Canvas128& cv, const AnimeSpec& spec, int global_f) {
    int hid = spec.hero_id % 6;
    uint8_t hair_l = static_cast<uint8_t>(8 + hid * 2);
    uint8_t hair_d = static_cast<uint8_t>(hair_l + 1);
    uint8_t coat_c = (hid == 0 || hid == 4) ? 36 : (hid == 3 ? 37 : (hid == 5 ? 19 : 1));
    uint8_t coat_sh = (coat_c == 37) ? 35 : 1;
    uint8_t accent_c = (hid == 0) ? 8 : (hid == 1 ? 41 : (hid == 3 ? 14 : 7));

    int sway = static_cast<int>(std::round(std::sin(global_f * 0.42f) * 2.0f));
    int breathe = (global_f % 8 >= 4) ? 1 : 0;
    int cx = 64;
    int cy = 58 + breathe;

    // Aura glow behind portrait when action_id == 5 (cleanly behind head, never obscuring face!)
    if (spec.action_id == 5) {
        int pulse = (global_f % 4);
        cv.circle_ring(cx, cy + 4, 38 + pulse, 45 + pulse, hair_l);
        cv.circle_ring(cx, cy + 4, 34 + pulse, 38 + pulse, 43);
    }

    // 1. Two-pass Back Hair Volume + Hero Ponytail / Twin-tails (zero internal black lines!)
    for (int pass = 0; pass < 2; ++pass) {
        uint8_t c = (pass == 0) ? 0 : hair_d;
        int pad = (pass == 0) ? 2 : 0;
        cv.fill_ellipse(cx - sway / 2, cy + 4, 29 + pad, 33 + pad, c);
        if (hid == 0) {
            cv.fill_ellipse(cx + 26 + sway / 2, cy - 8, 12 + pad, 20 + pad, c);
        } else if (hid == 2) {
            cv.fill_ellipse(cx - 30 + sway / 2, cy + 16, 9 + pad, 26 + pad, c);
            cv.fill_ellipse(cx + 30 + sway / 2, cy + 16, 9 + pad, 26 + pad, c);
        }
    }
    if (hid == 0) {
        cv.rect_outlined(cx + 15, cy - 24, 7, 7, 37, 0); // Akane white ponytail ribbon
    }

    // 2. Shoulders, Neck & Crisp Anime Seifuku / Haori Collar
    draw_trapezoid_outlined(cv, cx, 94 + breathe, 18, cx, 127, 42, coat_c, coat_sh);
    cv.rect_outlined(cx - 7, 80 + breathe, 14, 15, 5, 0); // Neck
    cv.fill_rect(cx - 7, 80 + breathe, 14, 5, 6);        // Under-chin shadow
    // Layered white V-collar + ribbon tie
    cv.line(cx - 14, 92 + breathe, cx, 110 + breathe, 0, 6);
    cv.line(cx + 14, 92 + breathe, cx, 110 + breathe, 0, 6);
    cv.line(cx - 14, 92 + breathe, cx, 110 + breathe, 37, 4);
    cv.line(cx + 14, 92 + breathe, cx, 110 + breathe, 37, 4);
    cv.fill_tri(cx - 6, 103 + breathe, cx + 6, 103 + breathe, cx, 117 + breathe, accent_c);

    // 3. Seamless Anime Face Contour (NO cheek black lines!)
    draw_smooth_anime_face(cv, cx, cy, 22, 18, 24);
    // Soft forehead shadow right under bangs
    cv.fill_rect(cx - 18, cy - 11, 36, 3, 5);

    // 4. Expressive Dual Anime Eyes + Nose + Lip-Sync Mouth!
    bool blink = ((global_f % 16) == 11);
    bool fierce = (spec.action_id >= 3);
    draw_anime_eye_closeup(cv, cx - 10, cy + 3, -1, hair_d, hair_l, blink, fierce);
    draw_anime_eye_closeup(cv, cx + 10, cy + 3, +1, hair_d, hair_l, blink, fierce);

    // Delicate anime nose shadow + highlight
    cv.line(cx, cy + 8, cx - 1, cy + 11, 6, 1);
    cv.set(cx + 1, cy + 10, 3);

    // Mouth
    int my = cy + 16;
    if (spec.action_id == 1) {
        int mphase = (global_f / 2) % 4;
        if (mphase == 0) {
            cv.line(cx - 3, my, cx + 3, my, 0, 1);
        } else if (mphase == 1) {
            cv.rect_outlined(cx - 3, my - 1, 6, 3, 7, 0);
        } else if (mphase == 2) {
            cv.rect_outlined(cx - 4, my - 2, 8, 5, 9, 0);
            cv.fill_rect(cx - 3, my - 2, 6, 1, 3);
            cv.fill_rect(cx - 3, my + 1, 6, 2, 7);
        } else {
            cv.rect_outlined(cx - 2, my - 1, 5, 2, 7, 0);
        }
    } else if (fierce) {
        cv.rect_outlined(cx - 4, my - 1, 8, 4, 9, 0);
        cv.fill_rect(cx - 3, my - 1, 6, 1, 3);
        cv.fill_rect(cx - 3, my + 1, 6, 2, 7);
    } else {
        cv.line(cx - 3, my, cx + 2, my, 0, 1);
        cv.set(cx + 3, my - 1, 0);
    }

    // 5. Seamless Two-Pass Anime Front Hair, Soft Feathered Bangs & Side Locks
    int bang_x[5] = {-16, -8, 0, 8, 16};
    int bang_len[5] = {10, 12, 13, 12, 10};
    for (int pass = 0; pass < 2; ++pass) {
        uint8_t hc = (pass == 0) ? 0 : hair_l;
        int p = (pass == 0) ? 1 : 0;
        // Upper hair crown dome
        cv.fill_ellipse(cx, cy - 16, 25 + p, 11 + p, hc);
        // Side hime-locks framing cheeks cleanly outside eyes
        cv.fill_tri(cx - 25 - p, cy - 14, cx - 17 + p, cy - 14, cx - 22 + sway, cy + 25 + p, hc);
        cv.fill_tri(cx + 17 - p, cy - 14, cx + 25 + p, cy - 14, cx + 22 + sway, cy + 25 + p, hc);
        // 5 soft feathered bangs stopping cleanly above eyebrows (ey - 8 = cy - 5)!
        for (int b = 0; b < 5; ++b) {
            int bx = cx + bang_x[b];
            int tip_y = cy - 22 + bang_len[b] + p;
            cv.fill_tri(bx - 6 - p, cy - 20, bx + 6 + p, cy - 20, bx + sway / 2, tip_y, hc);
        }
    }
    // Soft anime hair crown specular highlight curve (subtle 2px white shine!)
    for (int dx = -14; dx <= 14; dx += 5) {
        cv.fill_rect(cx + dx, cy - 20 + (std::abs(dx) > 8 ? 1 : 0), 3, 2, 3);
    }
    // Hair shadow depth accent along part
    cv.fill_rect(cx - 18, cy - 24, 36, 2, hair_d);

    if (hid == 1) {
        cv.rect_outlined(cx - 21, cy - 13, 42, 3, 1, 0);
        cv.fill_rect(cx - 6, cy - 13, 12, 2, 41);
    } else if (hid == 2) {
        cv.fill_circle(cx - 16, cy - 15, 3, 14);
        cv.set(cx - 16, cy - 15, 3);
    }
}

// ================= 4. ARTICULATED MEDIUM & WIDE ANIME CHARACTER (128x128) =================

void draw_full_hero_128(
    Canvas128& cv,
    int hero_id,
    int base_x,
    int ground_y,
    int dir,          // +1 facing right, -1 facing left
    int action_id,
    int global_f,
    bool medium_shot  // true = 78px tall detailed medium shot; false = 52px tall wide/duel shot
) {
    int hid = hero_id % 6;
    uint8_t hair_l = static_cast<uint8_t>(8 + hid * 2);
    uint8_t hair_d = static_cast<uint8_t>(hair_l + 1);
    uint8_t coat_c = (hid == 0 || hid == 4) ? 36 : (hid == 3 ? 37 : (hid == 5 ? 19 : 1));
    uint8_t pants_c = (hid == 0) ? 9 : ((hid == 3) ? 2 : 1); // Akane crimson/dark hakama!
    uint8_t pants_sh = (hid == 0) ? 1 : 0;
    uint8_t scarf_c = (hid == 1 || hid == 0) ? 8 : hair_l;

    int S = medium_shot ? 3 : 2;
    int bob = (action_id == 2) ? ((global_f % 4 < 2) ? -2 : 1) : ((global_f % 8 >= 4) ? 1 : 0);
    int lean = (action_id == 2 || (action_id == 3 && (global_f % 16) >= 5)) ? (dir * 2 * S) : 0;

    int head_cy = ground_y - 21 * S + bob;
    int hx = base_x + lean;
    int shoulder_y = head_cy + 5 * S - 1;
    int hip_y = shoulder_y + 7 * S;

    // 1. Clean Awakening Ki Aura BEHIND character (action_id == 5)
    if (action_id == 5) {
        int pulse = (global_f % 4) * 2;
        cv.fill_ellipse(hx, ground_y - 1, 13 * S + pulse, 3, hair_l);
        cv.fill_ellipse(hx, ground_y - 1, 9 * S + pulse, 2, 43);
        // Rising scalloped anime flame aura behind character
        cv.fill_ellipse(hx, hip_y - 3 * S, 9 * S + pulse / 2, 13 * S + pulse, hair_l);
        cv.fill_ellipse(hx, hip_y - 2 * S, 7 * S + pulse / 2, 11 * S + pulse, 43);
        for (int side = -1; side <= 1; side += 2) {
            int sx = hx + side * (9 * S + (global_f % 3));
            int sy = ground_y - ((global_f * 5 + (side > 0 ? 12 : 0)) % (18 * S));
            cv.line(sx, sy, sx - side * 2, sy - 6, 41, 1);
            cv.line(sx - side * 2, sy - 6, sx + side * 2, sy - 12, 3, 1);
        }
    }

    // 2. Two-Pass Smooth Flowing Scarf / Haori Ribbon (ZERO internal black rings!)
    for (int pass = 0; pass < 2; ++pass) {
        uint8_t sc = (pass == 0) ? 0 : scarf_c;
        int r = S + (pass == 0 ? 1 : 0);
        for (int i = 0; i < 6 * S; ++i) {
            int sx = hx - dir * (2 * S + i * 3 / 2);
            int wave = static_cast<int>(std::round(std::sin(global_f * 0.55f - i * 0.35f) * (1.3f * S)));
            int sy = shoulder_y + 3 + i / 3 + wave;
            cv.fill_circle(sx, sy, r, sc);
        }
    }

    // 3. Lower Body: Proper Anime Pleated Hakama / Skirt (Medium) or Articulated Run/Stance Legs (Wide)!
    if (medium_shot) {
        // Proper wide-waisted anime hakama trapezoid (hw_top = 3*S+1 -> hw_bot = 5*S+3, NEVER a pinched point!)
        draw_trapezoid_outlined(cv, hx, hip_y - 2, 3 * S + 1, hx, ground_y + 6, 5 * S + 3, pants_c, pants_sh);
        // Crisp hakama vertical pleat lines
        cv.line(hx - S, hip_y + 1, hx - 2 * S, ground_y + 5, 0, 1);
        cv.line(hx + S, hip_y + 1, hx + 2 * S, ground_y + 5, 0, 1);
    } else {
        float run_ang = (action_id == 2) ? (global_f * 0.85f) : 0.45f;
        int stride1 = static_cast<int>(std::sin(run_ang) * (action_id == 2 ? 9.0f : 5.0f));
        int stride2 = -stride1;
        // Short anime hakama / tunic skirt over legs
        draw_trapezoid_outlined(cv, hx, hip_y - 2, 6, hx, hip_y + 5, 9, pants_c, pants_sh);
        // Back & front legs
        cv.line(hx - dir * 2, hip_y + 4, hx + stride2, ground_y - 1, 0, 4);
        cv.line(hx - dir * 2, hip_y + 4, hx + stride2, ground_y - 2, 1, 2);
        cv.line(hx + dir * 2, hip_y + 4, hx + stride1, ground_y - 1, 0, 4);
        cv.line(hx + dir * 2, hip_y + 4, hx + stride1, ground_y - 2, 1, 2);
        cv.fill_rect(hx + stride1 - 1, ground_y - 3, 3, 2, 37);
        cv.fill_rect(hx + stride2 - 1, ground_y - 3, 3, 2, 37);
    }

    // 4. Detailed Anime Torso, Haori Jacket, Crisp White Eri Collar & Obi Sash
    draw_trapezoid_outlined(cv, hx, shoulder_y, 3 * S + 2, hx, hip_y, 3 * S, coat_c, 1);
    cv.line(hx - S, shoulder_y + 1, hx + dir * 2, shoulder_y + 3 * S, 37, S);
    cv.line(hx + S, shoulder_y + 1, hx + dir * 2, shoulder_y + 3 * S, 37, S);
    cv.rect_outlined(hx - 3 * S - 1, hip_y - S - 1, 6 * S + 2, S + 1, 37, 0);

    // 5. Seamless Two-Pass Anime Head, Hair & Crisp Eyes!
    int hr = 4 * S;
    int wind = static_cast<int>(std::sin(global_f * 0.5f) * 2.0f);
    // Back hair + Hero Ponytail (2-pass outline then fill!)
    for (int pass = 0; pass < 2; ++pass) {
        uint8_t hc = (pass == 0) ? 0 : hair_d;
        int pad = (pass == 0) ? 1 : 0;
        cv.fill_ellipse(hx - dir * S, head_cy, hr + 2 + pad, hr + 2 + pad, hc);
        if (hid == 0) {
            cv.fill_ellipse(hx - dir * (hr + 2 * S) - wind / 2, head_cy + S, 2 * S + pad, 3 * S + pad, (pass == 0) ? 0 : hair_l);
        }
    }
    if (hid == 0) {
        cv.rect_outlined(hx - dir * (hr + 1), head_cy - hr / 2 - 1, S + 1, S + 1, 37, 0);
    }

    // Neck + Seamless Tapered Anime Face
    cv.fill_rect(hx - S, head_cy + hr - 2, 2 * S, S + 2, 5);
    draw_smooth_anime_face(cv, hx, head_cy, hr, hr - 1, hr);

    // 3/4 View Dual Anime Eyes (sclera + colored iris + pupil + white catchlight!)
    bool blink = ((global_f % 16) == 12);
    int near_ex = hx - dir * (S / 2);
    int far_ex  = hx + dir * (2 * S + 1);
    int ey = head_cy + 1;
    int eye_h = medium_shot ? 4 : 3;
    int eye_w = medium_shot ? 3 : 2;

    for (int ei = 0; ei < 2; ++ei) {
        int ex = (ei == 0) ? near_ex : far_ex;
        int ew = (ei == 0) ? eye_w : std::max(2, eye_w - 1);
        if (blink) {
            cv.line(ex - 1, ey + 1, ex + ew, ey + 1, 0, 1);
        } else {
            cv.fill_rect(ex - 1, ey, ew + 1, eye_h, 3);
            cv.fill_rect(ex, ey, ew, eye_h, hair_d);
            cv.fill_rect(ex, ey + eye_h - 1, ew, 1, hair_l);
            cv.set(ex + (dir > 0 ? ew - 1 : 0), ey + 1, 0);
            cv.set(ex, ey, 3); // Catchlight sparkle!
            cv.line(ex - 1, ey - 1, ex + ew, ey - 1, 0, 1);
        }
    }

    // Mouth
    int mouth_x = hx + dir * S;
    int mouth_y = head_cy + hr - (medium_shot ? 3 : 2);
    if (action_id == 1 && ((global_f / 2) % 2 == 1)) {
        cv.fill_rect(mouth_x, mouth_y - 1, 2, 2, 7);
    } else if (action_id >= 3) {
        cv.fill_rect(mouth_x, mouth_y - 1, 2, 2, 9);
    } else {
        cv.line(mouth_x, mouth_y, mouth_x + 1, mouth_y, 0, 1);
    }

    // Seamless Two-Pass Front Hair Crown & Bangs (NO black comb teeth!)
    for (int pass = 0; pass < 2; ++pass) {
        uint8_t hc = (pass == 0) ? 0 : hair_l;
        int p = (pass == 0) ? 1 : 0;
        cv.fill_ellipse(hx, head_cy - hr + 2, hr + 1 + p, S + 2 + p, hc);
        // Side cheek lock behind ear
        cv.fill_tri(hx - dir * (hr + 1) - p, head_cy - 4, hx - dir * (hr - 3) + p, head_cy - 4, hx - dir * hr, head_cy + hr + 3 + p, hc);
        for (int b = -1; b <= 1; ++b) {
            int bx = hx + b * (2 * S);
            cv.fill_tri(bx - S - 1 - p, head_cy - hr + 2, bx + S + 1 + p, head_cy - hr + 2, bx + dir, ey - 2 + p, hc);
        }
    }
    cv.fill_rect(hx - S, head_cy - hr + 1, 2 * S + 1, 1, 3); // Subtle hair shine!

    // 6. Articulated Arms, Katana & Sakuga Action FX!
    int hand_x = hx + dir * (3 * S + 2);
    int hand_y = shoulder_y + 4 * S;
    int local_f = global_f % 16;

    cv.line(hx + dir * S, shoulder_y + 2, hand_x, hand_y, 0, S + 3);
    cv.line(hx + dir * S, shoulder_y + 2, hand_x, hand_y, coat_c, S + 1);
    cv.fill_circle(hand_x, hand_y, S - 1, 4);

    if (action_id == 3) {
        if (local_f < 5) {
            int sx = hx - dir * (2 * S);
            int sy = hip_y;
            cv.line(sx, sy, sx - dir * (7 * S), sy + 2 * S, 0, 3);
            cv.line(sx, sy, sx - dir * (7 * S), sy + 2 * S, 30, 1);
            if (local_f == 3 || local_f == 4) {
                cv.line(sx - 6, sy, sx + 6, sy, 3, 2);
                cv.line(sx, sy - 6, sx, sy + 6, 3, 2);
            }
        } else {
            int tip_x = hand_x + dir * (11 * S);
            int tip_y = hand_y - 5 * S;
            cv.line(hand_x, hand_y, tip_x, tip_y, 0, 4);
            cv.line(hand_x, hand_y, tip_x, tip_y, 3, 2);
            int arc_r = 9 * S + (local_f - 5) * 2;
            // Smooth two-pass glowing crescent slash ribbon!
            for (int a = -12; a <= 12; ++a) {
                float theta = a * 0.11f;
                int x_out = hx + dir * static_cast<int>(std::cos(theta) * arc_r);
                int y_out = shoulder_y + 3 * S + static_cast<int>(std::sin(theta) * arc_r);
                int x_in  = hx + dir * static_cast<int>(std::cos(theta) * (arc_r - 3 * S));
                int y_in  = shoulder_y + 3 * S + static_cast<int>(std::sin(theta) * (arc_r - 3 * S));
                cv.line(x_in, y_in, x_out, y_out, hair_l, 4);
                cv.line((x_in + x_out) / 2, (y_in + y_out) / 2, x_out, y_out, 43, 3);
                cv.fill_circle(x_out, y_out, 1, 3);
            }
        }
    } else if (action_id == 4) {
        int orb_x = hand_x + dir * (3 * S);
        int orb_y = hand_y - S;
        if (local_f < 6) {
            int r = S + local_f;
            cv.fill_circle(orb_x, orb_y, r + 2, hair_l);
            cv.fill_circle(orb_x, orb_y, r, 43);
            cv.fill_circle(orb_x, orb_y, std::max(2, r - 2), 3);
        } else {
            cv.fill_circle(orb_x, orb_y, 4 * S, hair_l);
            cv.fill_circle(orb_x, orb_y, 2 * S + 1, 3);
            int beam_end = (dir > 0) ? (BASE_W - 1) : 0;
            cv.line(orb_x, orb_y, beam_end, orb_y, hair_l, 4 * S + 1);
            cv.line(orb_x, orb_y, beam_end, orb_y, 43, 2 * S + 1);
            cv.line(orb_x, orb_y, beam_end, orb_y, 3, S);
        }
    } else {
        int guard_x = hand_x + dir * 2;
        int guard_y = hand_y - 2;
        int blade_x = hand_x + dir * (8 * S);
        int blade_y = hand_y - (8 * S);
        cv.line(guard_x - dir, guard_y - 3, guard_x + dir, guard_y + 3, 14, 2);
        cv.line(guard_x, guard_y, blade_x, blade_y, 0, 4);
        cv.line(guard_x, guard_y, blade_x, blade_y, 39, 2);
        cv.line(guard_x, guard_y - 1, blade_x, blade_y - 1, 3, 1);
    }
}

// ================= 5. WEATHER & SAKUGA SPEEDLINES (128x128) =================

void draw_weather_fx_128(Canvas128& cv, int fx_id, int global_f, int seed) {
    if (fx_id == 0) {
        // Drifting 2-pixel Sakura Petals
        for (int p = 0; p < 24; ++p) {
            uint32_t h = hash_u32(static_cast<uint32_t>(p * 977 + seed * 31));
            int px = ((static_cast<int>(h % 128) - global_f * 3 + static_cast<int>(std::sin(global_f * 0.4f + p) * 5.0f)) % 128 + 128) % 128;
            int py = ((static_cast<int>((h >> 8) % 128) + global_f * 3) % 128 + 128) % 128;
            uint8_t pc = (p % 2 == 0) ? 28 : 29;
            cv.fill_rect(px, py, 2, 2, pc);
            cv.set(px, py, 3);
        }
    } else if (fx_id == 1) {
        // Diagonal Anime Rain Streaks
        for (int r = 0; r < 34; ++r) {
            uint32_t h = hash_u32(static_cast<uint32_t>(r * 541 + seed * 19));
            int rx = ((static_cast<int>(h % 128) - global_f * 5) % 128 + 128) % 128;
            int ry = ((static_cast<int>((h >> 7) % 128) + global_f * 10) % 128 + 128) % 128;
            cv.line(rx, ry, rx - 3, ry + 7, 45, 1);
        }
    } else if (fx_id == 2) {
        // Rising Glowing Fire Embers
        for (int e = 0; e < 24; ++e) {
            uint32_t h = hash_u32(static_cast<uint32_t>(e * 733 + seed * 23));
            int ex = ((static_cast<int>(h % 128) + static_cast<int>(std::sin(global_f * 0.5f + e) * 4.0f)) % 128 + 128) % 128;
            int ey = ((static_cast<int>((h >> 8) % 128) - global_f * 4) % 128 + 128) % 128;
            cv.fill_rect(ex, ey, 2, 2, (e % 3 == 0) ? 43 : 42);
        }
    } else if (fx_id == 3) {
        // Falling Starlight / Snowflakes
        for (int s = 0; s < 24; ++s) {
            uint32_t h = hash_u32(static_cast<uint32_t>(s * 613 + seed * 13));
            int sx = ((static_cast<int>(h % 128) + static_cast<int>(std::cos(global_f * 0.3f + s) * 3.0f)) % 128 + 128) % 128;
            int sy = ((static_cast<int>((h >> 8) % 128) + global_f * 3) % 128 + 128) % 128;
            cv.fill_rect(sx, sy, 2, 2, (s % 2 == 0) ? 3 : 41);
        }
    } else if (fx_id == 4) {
        // Crisp Peripheral Anime Action Speedlines (strictly top & bottom bars so center face is clean!)
        for (int l = 0; l < 14; ++l) {
            uint32_t h = hash_u32(static_cast<uint32_t>(l * 389 + global_f * 29 + seed));
            int ly = static_cast<int>(h % 128);
            if (ly > 22 && ly < 106) continue;
            int lx = static_cast<int>((h >> 8) % 92);
            cv.line(lx, ly, lx + 28, ly, (l % 2 == 0) ? 3 : 41, 1);
        }
    }
}

} // namespace

void synthesize_anime_clip(const AnimeSpec& spec, uint8_t* out_indices) {
    for (int f = 0; f < CLIP_FRAMES; ++f) {
        int global_f = spec.part_idx * CLIP_FRAMES + f;
        Canvas128 cv;
        std::memset(cv.px, 0, sizeof(cv.px));

        int cam_x = 0;
        if (spec.camera_id == 1) cam_x = global_f * 3;
        else if (spec.camera_id == 2) cam_x = -global_f * 3;
        else if (spec.camera_id == 3) cam_x = global_f; // Smooth subtle camera drift, NEVER a sudden cut!

        draw_sky_128(cv, spec.scene_id % 6, spec.time_id % 4, cam_x, global_f, spec.variant_seed);
        draw_environment_128(cv, spec.scene_id % 6, spec.time_id % 4, spec.framing_id % 4, cam_x, global_f);

        int framing = spec.framing_id % 4;
        if (framing == 2) {
            draw_closeup_character_128(cv, spec, global_f);
        } else if (framing == 3) {
            // Duel Confrontation between Hero (left) and Rival (right)!
            int rival_id = (spec.hero_id + 3) % 6;
            int rush = (spec.action_id == 2 || spec.action_id == 3) ? std::min(16, (f * 4) / 3) : 0;
            draw_full_hero_128(cv, spec.hero_id % 6, 36 + rush, 99, +1, spec.action_id % 6, global_f, false);
            draw_full_hero_128(cv, rival_id, 92 - rush, 99, -1, spec.action_id % 6, global_f + 2, false);
            if (spec.action_id >= 3 && (f >= 6 && f <= 13)) {
                cv.fill_circle(64, 72, (f % 2 == 0) ? 8 : 11, 43);
                cv.fill_circle(64, 72, 4, 3);
                cv.line(48, 56, 80, 88, 3, 2);
                cv.line(48, 88, 80, 56, 41, 2);
            }
        } else {
            bool medium = (framing == 1);
            int hx = medium ? 58 : 54;
            if (spec.action_id == 2) {
                hx = 34 + f * 3;
            }
            int gy = medium ? 112 : 99;
            draw_full_hero_128(cv, spec.hero_id % 6, hx, gy, +1, spec.action_id % 6, global_f, medium);
        }

        draw_weather_fx_128(cv, spec.fx_id % 5, global_f, spec.variant_seed);

        std::memcpy(out_indices + static_cast<size_t>(f) * BASE_H * BASE_W, cv.px, BASE_H * BASE_W);
    }
}

void upscale_indices_to_rgb256(
    const uint8_t* indices_128,
    int num_frames,
    uint8_t* out_rgb_256,
    bool use_scale2x
) {
    for (int f = 0; f < num_frames; ++f) {
        const uint8_t* src = indices_128 + static_cast<size_t>(f) * BASE_H * BASE_W;
        uint8_t* dst_rgb = out_rgb_256 + static_cast<size_t>(f) * OUT_H * OUT_W * 3;

        if (use_scale2x) {
            // 1x EPX / Scale2x directly from native 128x128 -> crisp 256x256 RGB!
            for (int y = 0; y < BASE_H; ++y) {
                int ym = std::max(0, y - 1);
                int yp = std::min(BASE_H - 1, y + 1);
                for (int x = 0; x < BASE_W; ++x) {
                    int xm = std::max(0, x - 1);
                    int xp = std::min(BASE_W - 1, x + 1);

                    uint8_t P = src[y * BASE_W + x];
                    uint8_t A = src[ym * BASE_W + x];
                    uint8_t B = src[y * BASE_W + xp];
                    uint8_t C = src[y * BASE_W + xm];
                    uint8_t D = src[yp * BASE_W + x];

                    uint8_t E[4] = {P, P, P, P};
                    if (C == A && C != D && A != B) E[0] = A;
                    if (A == B && A != C && B != D) E[1] = B;
                    if (D == C && D != B && C != A) E[2] = C;
                    if (B == D && B != A && D != C) E[3] = D;

                    for (int q = 0; q < 4; ++q) {
                        uint8_t c = (E[q] < PALETTE_SIZE) ? E[q] : 0;
                        const uint8_t* rgb = kPaletteRGB + static_cast<int>(c) * 3;
                        int ox = 2 * x + (q & 1);
                        int oy = 2 * y + (q >> 1);
                        uint8_t* p = dst_rgb + (oy * OUT_W + ox) * 3;
                        p[0] = rgb[0]; p[1] = rgb[1]; p[2] = rgb[2];
                    }
                }
            }
        } else {
            for (int y = 0; y < BASE_H; ++y) {
                for (int x = 0; x < BASE_W; ++x) {
                    uint8_t c = src[y * BASE_W + x];
                    if (c >= PALETTE_SIZE) c = 0;
                    const uint8_t* rgb = kPaletteRGB + static_cast<int>(c) * 3;
                    for (int dy = 0; dy < 2; ++dy) {
                        for (int dx = 0; dx < 2; ++dx) {
                            uint8_t* p = dst_rgb + ((2 * y + dy) * OUT_W + (2 * x + dx)) * 3;
                            p[0] = rgb[0]; p[1] = rgb[1]; p[2] = rgb[2];
                        }
                    }
                }
            }
        }
    }
}

} // namespace sakuga
