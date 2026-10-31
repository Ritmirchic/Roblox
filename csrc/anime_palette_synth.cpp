#include "anime_palette_synth.hpp"
#include <algorithm>
#include <cmath>
#include <cstring>

namespace sakuga {

static const uint8_t kPaletteRGB[PALETTE_SIZE * 3] = {
    // 0..3: Outlines & Neutrals
    18,  16,  28,   // 0: Deep Anime Ink
    40,  38,  58,   // 1: Charcoal Shadow
    78,  84, 112,   // 2: Slate Mid
    250, 252, 255,  // 3: Pure Specular White

    // 4..7: Skin & Blush
    255, 228, 206,  // 4: Fair Skin Light
    242, 196, 168,  // 5: Skin Mid
    204, 146, 126,  // 6: Skin Shadow
    242, 116, 138,  // 7: Anime Blush / Lip

    // 8..19: 6 Hero Hair & Aura Pairs (Light, Dark)
    246,  66,  88,  // 8: Akane Crimson Light
    158,  28,  54,  // 9: Akane Crimson Shadow
     62, 212, 255,  // 10: Ren Cyber Azure Light
     26, 114, 188,  // 11: Ren Cyber Azure Shadow
    228, 224, 250,  // 12: Lumina Astral Silver Light
    152, 146, 198,  // 13: Lumina Astral Silver Shadow
    255, 216,  74,  // 14: Raiden Gold Light
    196, 132,  28,  // 15: Raiden Gold Shadow
    180,  96, 248,  // 16: Kuro Amethyst Light
     96,  40, 156,  // 17: Kuro Amethyst Shadow
     80, 232, 152,  // 18: Midori Emerald Light
     32, 138,  86,  // 19: Midori Emerald Shadow

    // 20..27: Sky & Atmosphere
     40, 120, 230,  // 20: Shinkai Cerulean Top
    126, 208, 252,  // 21: Horizon Sky Cyan
     76,  38, 114,  // 22: Sunset Deep Violet
    238,  90, 104,  // 23: Sunset Coral Red
    255, 180,  96,  // 24: Sunset Golden Horizon
     15,  20,  48,  // 25: Midnight Deep Indigo
     30,  46,  96,  // 26: Night Navy
     54,  24,  90,  // 27: Cyberpunk Storm Violet

    // 28..35: Environment & Nature
    255, 178, 210,  // 28: Sakura Blossom Pink
    224, 104, 158,  // 29: Sakura Deep Petal
    198,  52,  46,  // 30: Torii Vermilion
     68,  44,  48,  // 31: Dark Wood / Roof
     96, 188,  92,  // 32: Bamboo / Grass Light
     34,  88,  58,  // 33: Forest Deep Green
     60,  78, 126,  // 34: Distant Mountain Blue
    120, 128, 156,  // 35: Stone / Concrete Light

    // 36..47: Outfits, Weapons, Neon & Sakuga FX
     34,  48,  84,  // 36: Haori Navy
    228, 232, 244,  // 37: Outfit White Trim
    196, 212, 232,  // 38: Katana Steel Light
    112, 128, 158,  // 39: Katana Steel Dark
    255,  54, 190,  // 40: Neon Magenta
     46, 248, 236,  // 41: Neon Cyan Glow
    255, 138,  40,  // 42: Fire / Ki Orange
    255, 246, 148,  // 43: Plasma Yellow Core
     24,  74, 140,  // 44: Ocean Deep Blue
     96, 170, 236,  // 45: Water Shimmer
    255, 204, 118,  // 46: Lantern Warm Gold
    188, 196, 226   // 47: Cloud Lavender Mist
};

const uint8_t* get_master_palette_rgb() {
    return kPaletteRGB;
}

namespace {

struct Canvas64 {
    uint8_t px[BASE_H * BASE_W];

    inline void set(int x, int y, uint8_t c) {
        if (x >= 0 && x < BASE_W && y >= 0 && y < BASE_H) {
            px[y * BASE_W + x] = c;
        }
    }

    inline uint8_t get(int x, int y) const {
        x = std::clamp(x, 0, BASE_W - 1);
        y = std::clamp(y, 0, BASE_H - 1);
        return px[y * BASE_W + x];
    }

    void fill_rect(int x0, int y0, int w, int h, uint8_t c) {
        for (int y = y0; y < y0 + h; ++y) {
            for (int x = x0; x < x0 + w; ++x) {
                set(x, y, c);
            }
        }
    }

    void fill_circle(int cx, int cy, int r, uint8_t c) {
        int r2 = r * r;
        for (int dy = -r; dy <= r; ++dy) {
            for (int dx = -r; dx <= r; ++dx) {
                if (dx * dx + dy * dy <= r2) {
                    set(cx + dx, cy + dy, c);
                }
            }
        }
    }

    void fill_ellipse_outlined(int cx, int cy, int rx, int ry, uint8_t fill_c, uint8_t out_c) {
        for (int dy = -ry - 1; dy <= ry + 1; ++dy) {
            for (int dx = -rx - 1; dx <= rx + 1; ++dx) {
                float nx = static_cast<float>(dx) / std::max(1.0f, static_cast<float>(rx));
                float ny = static_cast<float>(dy) / std::max(1.0f, static_cast<float>(ry));
                float d = nx * nx + ny * ny;
                if (d <= 1.0f) {
                    set(cx + dx, cy + dy, fill_c);
                } else if (d <= 1.42f) {
                    set(cx + dx, cy + dy, out_c);
                }
            }
        }
    }

    void line(int x0, int y0, int x1, int y1, uint8_t c, int thickness = 1) {
        int dx = std::abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
        int dy = -std::abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
        int err = dx + dy;
        while (true) {
            if (thickness <= 1) {
                set(x0, y0, c);
            } else {
                for (int ty = -thickness / 2; ty <= thickness / 2; ++ty)
                    for (int tx = -thickness / 2; tx <= thickness / 2; ++tx)
                        set(x0 + tx, y0 + ty, c);
            }
            if (x0 == x1 && y0 == y1) break;
            int e2 = 2 * err;
            if (e2 >= dy) { err += dy; x0 += sx; }
            if (e2 <= dx) { err += dx; y0 += sy; }
        }
    }
};

// Bayer 2x2 ordered dithering helper for authentic 16-bit sky gradients
static inline uint8_t dither_band(int x, int y, float t, uint8_t c0, uint8_t c1) {
    static const float bayer[2][2] = {{0.15f, 0.65f}, {0.85f, 0.35f}};
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

void draw_sky(Canvas64& cv, int time_id, int cam_shift_x, int global_f, int seed) {
    int sky_h = 46;
    for (int y = 0; y < BASE_H; ++y) {
        float fy = static_cast<float>(y) / static_cast<float>(sky_h);
        for (int x = 0; x < BASE_W; ++x) {
            uint8_t c = 25;
            if (time_id == 0) { // Sunset
                if (fy < 0.35f) c = dither_band(x, y, fy / 0.35f, 22, 23);
                else if (fy < 0.75f) c = dither_band(x, y, (fy - 0.35f) / 0.40f, 23, 24);
                else c = 24;
            } else if (time_id == 1) { // Midnight
                if (fy < 0.55f) c = dither_band(x, y, fy / 0.55f, 25, 26);
                else c = dither_band(x, y, std::min(1.0f, (fy - 0.55f) / 0.45f), 26, 34);
            } else if (time_id == 2) { // Shinkai Day
                if (fy < 0.50f) c = dither_band(x, y, fy / 0.50f, 20, 21);
                else c = dither_band(x, y, std::min(1.0f, (fy - 0.50f) / 0.50f), 21, 3);
            } else { // Neon Storm
                if (fy < 0.50f) c = dither_band(x, y, fy / 0.50f, 25, 27);
                else c = dither_band(x, y, std::min(1.0f, (fy - 0.50f) / 0.50f), 27, 40);
            }
            cv.set(x, y, c);
        }
    }

    // Celestial objects
    int sun_x = 46 - cam_shift_x / 3;
    if (time_id == 0) {
        // Warm glowing sunset sun
        cv.fill_circle(sun_x, 26, 9, 42);
        cv.fill_circle(sun_x, 26, 7, 43);
        cv.fill_circle(sun_x, 26, 4, 3);
    } else if (time_id == 1) {
        // Twinkling stars + Luminous Anime Moon
        for (int s = 0; s < 18; ++s) {
            uint32_t h = hash_u32(static_cast<uint32_t>(s * 131 + seed * 17));
            int sx = ((static_cast<int>(h & 63) - cam_shift_x / 4) % 64 + 64) % 64;
            int sy = static_cast<int>((h >> 8) % 28);
            bool twinkle = ((global_f + s) % 6 == 0);
            cv.set(sx, sy, twinkle ? 3 : 47);
        }
        cv.fill_circle(sun_x, 14, 8, 47);
        cv.fill_circle(sun_x, 14, 7, 43);
        cv.fill_circle(sun_x + 1, 13, 5, 3);
    } else if (time_id == 2) {
        // Fluffy anime cumulus clouds
        for (int k = 0; k < 3; ++k) {
            int cx = ((k * 24 + 10 - cam_shift_x / 3 + global_f / 4) % 80) - 8;
            int cy = 18 + (k % 2) * 5;
            cv.fill_circle(cx, cy + 2, 6, 47);
            cv.fill_circle(cx + 5, cy + 1, 7, 47);
            cv.fill_circle(cx - 4, cy + 1, 5, 3);
            cv.fill_circle(cx + 2, cy - 2, 6, 3);
            cv.fill_circle(cx + 6, cy, 5, 3);
        }
    } else if (time_id == 3) {
        // Occasional storm lightning bolt in distant sky
        if ((global_f % 16) == 5 || (global_f % 16) == 6) {
            int lx = 18 - cam_shift_x / 3;
            cv.line(lx, 0, lx - 3, 10, 41, 1);
            cv.line(lx - 3, 10, lx + 2, 16, 3, 1);
            cv.line(lx + 2, 16, lx - 2, 28, 41, 1);
        }
    }
}

void draw_environment(Canvas64& cv, int scene_id, int time_id, int framing_id, int cam_x, int global_f) {
    // For close-up portraits, blur/simplify background softly into bokeh horizon
    if (framing_id == 2) {
        for (int y = 44; y < BASE_H; ++y) {
            uint8_t gc = (scene_id == 1) ? 1 : (scene_id == 5 ? 44 : 33);
            for (int x = 0; x < BASE_W; ++x) cv.set(x, y, gc);
        }
        if (scene_id == 0) {
            // Soft sakura canopy silhouette behind close-up
            cv.fill_circle(10 - cam_x / 3, 12, 14, 29);
            cv.fill_circle(14 - cam_x / 3, 8, 12, 28);
            cv.fill_circle(56 - cam_x / 3, 14, 13, 29);
        } else if (scene_id == 1) {
            // Cyberpunk bokeh neon lights behind close-up
            for (int b = 0; b < 6; ++b) {
                int bx = ((b * 13 + 5 - cam_x / 2) % 64 + 64) % 64;
                int by = 22 + (b % 3) * 8;
                cv.fill_circle(bx, by, 2, (b % 2 == 0) ? 40 : 41);
            }
        }
        return;
    }

    int ground_y = (framing_id == 1) ? 54 : 48;

    if (scene_id == 0) {
        // 0: Sakura Shrine — Mt Fuji + Torii + Cherry Blossom Tree + Bridge
        int mx = 32 - cam_x / 4;
        for (int y = 24; y < ground_y; ++y) {
            int half_w = (y - 24) * 5 / 4 + 3;
            uint8_t mc = (y < 30) ? 3 : 34;
            for (int x = mx - half_w; x <= mx + half_w; ++x) cv.set(x, y, mc);
        }
        // Torii Gate
        int tx = 46 - cam_x / 2;
        cv.fill_rect(tx - 10, ground_y - 18, 2, 18, 30);
        cv.fill_rect(tx + 8, ground_y - 18, 2, 18, 30);
        cv.fill_rect(tx - 13, ground_y - 20, 26, 3, 30);
        cv.fill_rect(tx - 14, ground_y - 21, 28, 1, 0);
        cv.fill_rect(tx - 11, ground_y - 15, 22, 2, 30);

        // Sakura tree on left
        int sx = 10 - cam_x / 2;
        cv.line(sx, ground_y, sx + 2, ground_y - 16, 31, 2);
        cv.line(sx + 2, ground_y - 14, sx + 10, ground_y - 22, 31, 2);
        cv.fill_circle(sx + 2, ground_y - 24, 10, 29);
        cv.fill_circle(sx + 10, ground_y - 21, 8, 28);
        cv.fill_circle(sx - 2, ground_y - 26, 7, 28);

        // Ground grass + stone path
        cv.fill_rect(0, ground_y, BASE_W, BASE_H - ground_y, 33);
        cv.fill_rect(0, ground_y, BASE_W, 2, 32);
        cv.fill_rect(0, ground_y + 3, BASE_W, 5, 35);
    } else if (scene_id == 1) {
        // 1: Neo-Tokyo Cyberpunk Rooftop
        for (int b = 0; b < 7; ++b) {
            int bx = ((b * 11 - cam_x / 2) % 76 + 76) % 76 - 8;
            int bh = 18 + (b * 7) % 18;
            int bw = 8 + (b % 3) * 2;
            int by = ground_y - bh;
            cv.fill_rect(bx, by, bw, bh, 1);
            cv.line(bx, by, bx + bw - 1, by, 2, 1);
            // Lit windows + neon sign
            for (int wy = by + 3; wy < ground_y - 2; wy += 3) {
                for (int wx = bx + 2; wx < bx + bw - 1; wx += 3) {
                    if (((wx + wy + b) % 3) != 0) {
                        cv.set(wx, wy, (b % 2 == 0) ? 41 : 46);
                    }
                }
            }
            if (b % 2 == 1) {
                cv.fill_rect(bx + bw - 1, by + 4, 2, 9, (b % 4 == 1) ? 40 : 41);
            }
        }
        // Rooftop concrete + neon railing
        cv.fill_rect(0, ground_y, BASE_W, BASE_H - ground_y, 1);
        cv.fill_rect(0, ground_y, BASE_W, 2, 35);
        cv.line(0, ground_y - 5, BASE_W - 1, ground_y - 5, 2, 1);
        for (int rx = (-cam_x % 8 + 8) % 8; rx < BASE_W; rx += 8) {
            cv.line(rx, ground_y - 5, rx, ground_y, 2, 1);
        }
    } else if (scene_id == 2) {
        // 2: Bamboo Moon Forest
        cv.fill_rect(0, ground_y - 10, BASE_W, 10, 33);
        for (int i = 0; i < 10; ++i) {
            int bx = ((i * 8 + 3 - cam_x / 2) % 72 + 72) % 72 - 4;
            int sway = static_cast<int>(std::sin(global_f * 0.25f + i) * 1.2f);
            uint8_t bc = (i % 2 == 0) ? 32 : 19;
            cv.line(bx, ground_y, bx + sway, 4, bc, (i % 3 == 0) ? 2 : 1);
            for (int ny = 10; ny < ground_y; ny += 8) {
                cv.set(bx + (sway * (ground_y - ny)) / ground_y, ny, 0);
            }
        }
        // Warm stone lantern
        int lx = 50 - cam_x;
        cv.fill_rect(lx - 2, ground_y - 10, 5, 10, 2);
        cv.fill_rect(lx - 4, ground_y - 12, 9, 2, 35);
        cv.fill_rect(lx - 1, ground_y - 9, 3, 3, 46);
        cv.fill_rect(0, ground_y, BASE_W, BASE_H - ground_y, 33);
        cv.fill_rect(0, ground_y, BASE_W, 2, 19);
    } else if (scene_id == 3) {
        // 3: Floating Sky Citadel
        for (int c = 0; c < 5; ++c) {
            int cx = ((c * 16 - cam_x / 3 + global_f / 3) % 76) - 6;
            cv.fill_circle(cx, ground_y + 4, 9, 47);
            cv.fill_circle(cx + 4, ground_y + 2, 7, 3);
        }
        // Floating distant island
        int ix = 48 - cam_x / 3;
        cv.fill_rect(ix - 8, 22, 16, 3, 32);
        for (int dy = 0; dy < 7; ++dy) {
            cv.fill_rect(ix - 7 + dy, 25 + dy, 14 - 2 * dy, 1, 31);
        }
        // Main citadel stone terrace + glowing crystal pillar
        cv.fill_rect(0, ground_y, BASE_W, BASE_H - ground_y, 35);
        cv.fill_rect(0, ground_y, BASE_W, 2, 37);
        int px = 14 - cam_x / 2;
        cv.fill_rect(px, ground_y - 18, 4, 18, 37);
        cv.fill_circle(px + 2, ground_y - 21 - (global_f % 4 == 0 ? 1 : 0), 3, 41);
    } else if (scene_id == 4) {
        // 4: Crimson Volcanic Battlefield
        for (int k = 0; k < 6; ++k) {
            int kx = k * 13 - (cam_x / 3) % 13;
            int kh = 12 + (k * 5) % 10;
            for (int y = ground_y - kh; y < ground_y; ++y) {
                int hw = (y - (ground_y - kh)) + 2;
                cv.fill_rect(kx - hw, y, 2 * hw, 1, 1);
            }
        }
        cv.fill_rect(0, ground_y, BASE_W, BASE_H - ground_y, 31);
        // Glowing magma fissure
        for (int x = 0; x < BASE_W; ++x) {
            int fy = ground_y + 4 + static_cast<int>(std::sin((x + cam_x) * 0.25f) * 2.0f);
            cv.set(x, fy, 42);
            if ((x + global_f) % 3 == 0) cv.set(x, fy + 1, 43);
        }
    } else {
        // 5: Seaside Sunset / Shinkai Station
        int sea_y = ground_y - 10;
        cv.fill_rect(0, sea_y, BASE_W, 10, (time_id == 0) ? 34 : 44);
        // Shimmering water reflections
        for (int y = sea_y + 1; y < ground_y; y += 2) {
            int rw = 12 - (y - sea_y);
            int rx = 46 - cam_x / 3 + static_cast<int>(std::sin(global_f * 0.6f + y) * 2.0f);
            uint8_t rc = (time_id == 0) ? 24 : 45;
            cv.fill_rect(rx - rw / 2, y, rw, 1, rc);
        }
        // Utility pole & power lines
        int ux = ((22 - cam_x / 2) % 64 + 64) % 64;
        cv.fill_rect(ux, 10, 2, ground_y - 10, 0);
        cv.fill_rect(ux - 4, 14, 10, 1, 0);
        for (int x = 0; x < BASE_W; ++x) {
            int sag = ((x - ux) * (x - ux)) / 180;
            cv.set(x, 14 + std::min(6, sag), 0);
        }
        // Platform + white safety railing
        cv.fill_rect(0, ground_y, BASE_W, BASE_H - ground_y, 2);
        cv.fill_rect(0, ground_y, BASE_W, 2, 37);
        cv.line(0, ground_y - 5, BASE_W - 1, ground_y - 5, 37, 1);
    }
}

void draw_closeup_character(Canvas64& cv, const AnimeSpec& spec, int global_f) {
    uint8_t hair_l = static_cast<uint8_t>(8 + (spec.hero_id % 6) * 2);
    uint8_t hair_d = static_cast<uint8_t>(hair_l + 1);
    uint8_t outfit_c = (spec.hero_id == 0 || spec.hero_id == 4) ? 36 : (spec.hero_id == 2 ? 17 : 1);

    int sway = static_cast<int>(std::round(std::sin(global_f * 0.45f) * 1.6f));
    int breathe = (global_f % 8 >= 4) ? 1 : 0;
    int cx = 32;
    int cy = 32 + breathe;

    // Back hair volume with dark outline
    cv.fill_ellipse_outlined(cx - sway / 2, cy + 2, 16, 19, hair_d, 0);

    // Shoulders & high anime collar
    cv.fill_ellipse_outlined(cx, 58 + breathe, 18, 10, outfit_c, 0);
    cv.fill_rect(cx - 4, 44 + breathe, 8, 6, 5); // neck
    cv.line(cx - 6, 49 + breathe, cx, 55 + breathe, 37, 2);
    cv.line(cx + 6, 49 + breathe, cx, 55 + breathe, 37, 2);

    // Anime face shape (soft rounded jaw + chin)
    cv.fill_ellipse_outlined(cx, cy + 2, 12, 13, 4, 0);
    // Warm skin shading along left edge & chin
    for (int dy = -6; dy <= 10; ++dy) {
        cv.set(cx - 10, cy + 2 + dy / 2, 5);
    }

    // Expressive large Anime Eyes!
    bool blink = ((global_f % 16) == 11);
    int eye_y = cy + 2;
    for (int side = -1; side <= 1; side += 2) {
        int ex = cx + side * 5;
        if (blink) {
            cv.line(ex - 3, eye_y + 1, ex + 3, eye_y + 1, 0, 1);
            cv.set(ex + side * 2, eye_y, 0);
        } else {
            // Sclera white
            cv.fill_rect(ex - 3, eye_y - 2, 6, 5, 3);
            // Colored iris (2-tone)
            cv.fill_rect(ex - 2, eye_y - 2, 4, 5, hair_d);
            cv.fill_rect(ex - 2, eye_y + 1, 4, 2, hair_l);
            // Pupil
            cv.fill_rect(ex - 1, eye_y - 1, 2, 2, 0);
            // Thick anime upper eyelash
            cv.line(ex - 3, eye_y - 3, ex + 3, eye_y - 3, 0, 1);
            cv.set(ex + side * 3, eye_y - 2, 0);
            // Bright white specular catchlight!
            cv.set(ex - 2, eye_y - 2, 3);
            cv.set(ex + 1, eye_y + 1, 3);
        }
        // Cheek blush
        cv.set(ex + side * 2, eye_y + 4, 7);
        cv.set(ex + side * 3, eye_y + 4, 7);
        // Eyebrows (angled fiercely for action >= 3)
        int brow_tilt = (spec.action_id >= 3) ? 1 : 0;
        cv.line(ex - 3, eye_y - 5 - side * brow_tilt, ex + 3, eye_y - 5 + side * brow_tilt, 0, 1);
    }

    // Nose pixel & Mouth (animated talking in Dialogue or battle shout in Action!)
    cv.set(cx, eye_y + 4, 6);
    if (spec.action_id == 1) {
        // Lip-sync talking cycle
        int mouth_open = (global_f / 2) % 3;
        if (mouth_open == 0) {
            cv.line(cx - 2, eye_y + 7, cx + 2, eye_y + 7, 0, 1);
        } else if (mouth_open == 1) {
            cv.fill_rect(cx - 2, eye_y + 7, 4, 2, 7);
            cv.line(cx - 2, eye_y + 6, cx + 2, eye_y + 6, 0, 1);
        } else {
            cv.fill_rect(cx - 2, eye_y + 6, 5, 3, 9);
            cv.fill_rect(cx - 1, eye_y + 7, 3, 2, 7);
        }
    } else if (spec.action_id >= 3) {
        // Determined shout / smirk
        cv.fill_rect(cx - 2, eye_y + 6, 5, 3, 0);
        cv.fill_rect(cx - 1, eye_y + 7, 3, 2, 7);
    } else {
        // Subtle serene anime smile
        cv.line(cx - 2, eye_y + 7, cx + 1, eye_y + 7, 0, 1);
        cv.set(cx + 2, eye_y + 6, 0);
    }

    // Spiky / Flowing Anime Front Bangs + Crown Highlight + Side Locks
    cv.fill_ellipse_outlined(cx, cy - 9, 14, 6, hair_l, 0);
    // Anime hair shine band across crown
    for (int dx = -8; dx <= 8; dx += 2) {
        cv.set(cx + dx, cy - 10, 3);
    }
    // Forehead bangs swaying with wind
    for (int b = -3; b <= 3; ++b) {
        int bx = cx + b * 4;
        int tip_x = bx + sway + (b % 2);
        int tip_y = cy - 1 + (std::abs(b) % 2) * 3;
        cv.line(bx, cy - 7, tip_x, tip_y, hair_l, 2);
        cv.set(tip_x, tip_y + 1, 0);
    }
    // Side locks framing face
    cv.line(cx - 12, cy - 4, cx - 13 + sway, cy + 16, hair_l, 3);
    cv.line(cx + 12, cy - 4, cx + 13 + sway, cy + 16, hair_l, 3);
}

void draw_full_hero(
    Canvas64& cv,
    int hero_id,
    int base_x,
    int ground_y,
    int dir, // +1 facing right, -1 facing left
    int action_id,
    int global_f,
    bool medium_scale
) {
    uint8_t hair_l = static_cast<uint8_t>(8 + (hero_id % 6) * 2);
    uint8_t hair_d = static_cast<uint8_t>(hair_l + 1);
    uint8_t coat_c = (hero_id == 0 || hero_id == 4) ? 36 : (hero_id == 3 ? 37 : 1);
    uint8_t scarf_c = (hero_id == 1) ? 8 : hair_l;

    int bob = (action_id == 2) ? ((global_f % 4 < 2) ? -1 : 1) : ((global_f % 8 >= 4) ? 1 : 0);
    int lean = (action_id == 2 || (action_id == 3 && (global_f % 16) >= 5)) ? (dir * 3) : 0;
    int scale_y = medium_scale ? 6 : 0;
    int hy = ground_y - 24 - scale_y + bob;
    int hx = base_x + lean;

    // Flowing anime cape / scarf trailing in the wind!
    for (int s = 0; s < 10 + scale_y / 2; ++s) {
        int sx = hx - dir * (2 + s);
        int sy = hy + 8 + s / 2 + static_cast<int>(std::round(std::sin(global_f * 0.6f - s * 0.45f) * 2.0f));
        cv.fill_rect(sx - 1, sy - 1, 3, 3 + s / 4, scarf_c);
        cv.set(sx, sy + 2 + s / 4, 0);
    }

    // Awakening Aura behind character (action_id == 5)
    if (action_id == 5) {
        int r_aura = 12 + (global_f % 3) * 2;
        for (int a = 0; a < 16; ++a) {
            float ang = a * (3.14159f * 2.0f / 16.0f) + global_f * 0.3f;
            int ax = hx + static_cast<int>(std::cos(ang) * r_aura);
            int ay = hy + 10 + static_cast<int>(std::sin(ang) * (r_aura + 3)) - (global_f % 4);
            cv.line(hx, hy + 10, ax, ay, (a % 2 == 0) ? hair_l : 43, 1);
        }
    }

    // Legs (animated run cycle or wide combat stance)
    if (!medium_scale) {
        int stride = (action_id == 2) ? static_cast<int>(std::sin(global_f * 0.9f) * 5.0f) : 3;
        cv.line(hx - 2, hy + 16, hx - stride, ground_y - 1, 0, 3);
        cv.line(hx + 2, hy + 16, hx + stride, ground_y - 1, 0, 3);
        cv.line(hx - 2, hy + 16, hx - stride, ground_y - 2, coat_c, 1);
        cv.line(hx + 2, hy + 16, hx + stride, ground_y - 2, coat_c, 1);
    }

    // Torso / Haori coat with white belt sash
    int torso_h = medium_scale ? 18 : 10;
    cv.fill_ellipse_outlined(hx, hy + 11, medium_scale ? 6 : 5, torso_h / 2 + 1, coat_c, 0);
    cv.fill_rect(hx - 4, hy + 12, 8, 2, 37);

    // Head + Anime Hair + Eyes
    int head_r = medium_scale ? 7 : 5;
    cv.fill_ellipse_outlined(hx - dir, hy - 1, head_r + 2, head_r + 1, hair_d, 0);
    cv.fill_ellipse_outlined(hx, hy, head_r, head_r, 4, 0);
    // Hair crown + spiky bangs
    cv.fill_ellipse_outlined(hx, hy - head_r + 1, head_r + 1, 3, hair_l, 0);
    int wind = static_cast<int>(std::sin(global_f * 0.5f) * 2.0f);
    cv.line(hx - dir * 3, hy - head_r, hx - dir * (6 + std::abs(wind)), hy + 2, hair_l, 2);
    // Eye in facing direction
    bool blink = ((global_f % 16) == 12);
    int ex = hx + dir * 2;
    if (!blink) {
        cv.fill_rect(ex - 1, hy - 1, 2, 3, hair_d);
        cv.set(ex - 1, hy - 1, 3); // white highlight
        cv.set(ex, hy, 0);
    } else {
        cv.line(ex - 1, hy, ex + 1, hy, 0, 1);
    }

    // Weapon & Sakuga Action Effects!
    int hand_x = hx + dir * 4;
    int hand_y = hy + 10;
    int local_f = global_f % 16;

    if (action_id == 3) {
        // Crescent Katana Slash Sakuga!
        if (local_f < 5) {
            // Sheathed wind-up + hilt flash!
            cv.line(hx - dir * 2, hy + 12, hx - dir * 10, hy + 15, 38, 1);
            if (local_f == 3 || local_f == 4) {
                cv.line(hx - dir * 5, hy + 12, hx + dir * 3, hy + 12, 3, 1);
                cv.line(hx - dir * 1, hy + 8, hx - dir * 1, hy + 16, 3, 1);
            }
        } else {
            // Sweeping glowing crescent slash arc!
            cv.line(hand_x, hand_y, hand_x + dir * 13, hand_y - 7, 3, 2);
            int arc_r = 13 + (local_f - 5);
            for (int a = -7; a <= 7; ++a) {
                float theta = a * 0.16f;
                int sx1 = hx + dir * static_cast<int>(std::cos(theta) * arc_r);
                int sy1 = hy + 8 + static_cast<int>(std::sin(theta) * arc_r);
                int sx2 = hx + dir * static_cast<int>(std::cos(theta) * (arc_r - 3));
                int sy2 = hy + 8 + static_cast<int>(std::sin(theta) * (arc_r - 3));
                cv.line(sx2, sy2, sx1, sy1, hair_l, 2);
                cv.set(sx1, sy1, 43);
                if (a % 2 == 0) cv.set(sx1 - dir, sy1, 3);
            }
        }
    } else if (action_id == 4) {
        // Arcane Spell Orb -> Energy Beam!
        int orb_x = hand_x + dir * 4;
        int orb_y = hand_y - 2;
        if (local_f < 6) {
            int r = 2 + local_f / 2;
            cv.fill_circle(orb_x, orb_y, r + 1, hair_l);
            cv.fill_circle(orb_x, orb_y, std::max(1, r - 1), 3);
        } else {
            cv.fill_circle(orb_x, orb_y, 5, hair_l);
            cv.fill_circle(orb_x, orb_y, 3, 3);
            int beam_end = (dir > 0) ? (BASE_W - 1) : 0;
            cv.line(orb_x, orb_y, beam_end, orb_y, hair_l, 5);
            cv.line(orb_x, orb_y, beam_end, orb_y, 43, 3);
            cv.line(orb_x, orb_y, beam_end, orb_y, 3, 1);
        }
    } else {
        // Held Katana / Staff gleaming
        cv.line(hand_x, hand_y, hand_x + dir * 9, hand_y - 9, 39, 2);
        cv.line(hand_x, hand_y, hand_x + dir * 9, hand_y - 9, 38, 1);
        cv.set(hand_x + dir * 9, hand_y - 9, 3);
    }
}

void draw_weather_fx(Canvas64& cv, int fx_id, int global_f, int seed) {
    if (fx_id == 0) {
        // Drifting Sakura Petals
        for (int p = 0; p < 16; ++p) {
            uint32_t h = hash_u32(static_cast<uint32_t>(p * 977 + seed * 31));
            int px = ((static_cast<int>(h % 64) - global_f * 2 + static_cast<int>(std::sin(global_f * 0.4f + p) * 3.0f)) % 64 + 64) % 64;
            int py = ((static_cast<int>((h >> 8) % 64) + global_f * 2) % 64 + 64) % 64;
            uint8_t pc = (p % 2 == 0) ? 28 : 29;
            cv.set(px, py, pc);
            cv.set(px + 1, py, pc);
        }
    } else if (fx_id == 1) {
        // Heavy Anime Rain + Ripples
        for (int r = 0; r < 22; ++r) {
            uint32_t h = hash_u32(static_cast<uint32_t>(r * 541 + seed * 19));
            int rx = ((static_cast<int>(h % 64) - global_f * 3) % 64 + 64) % 64;
            int ry = ((static_cast<int>((h >> 7) % 64) + global_f * 6) % 64 + 64) % 64;
            cv.line(rx, ry, rx - 2, ry + 4, 45, 1);
        }
    } else if (fx_id == 2) {
        // Rising Glowing Embers
        for (int e = 0; e < 16; ++e) {
            uint32_t h = hash_u32(static_cast<uint32_t>(e * 733 + seed * 23));
            int ex = ((static_cast<int>(h % 64) + static_cast<int>(std::sin(global_f * 0.5f + e) * 3.0f)) % 64 + 64) % 64;
            int ey = ((static_cast<int>((h >> 8) % 64) - global_f * 3) % 64 + 64) % 64;
            cv.set(ex, ey, (e % 3 == 0) ? 43 : 42);
        }
    } else if (fx_id == 3) {
        // Starlight / Snowfall
        for (int s = 0; s < 16; ++s) {
            uint32_t h = hash_u32(static_cast<uint32_t>(s * 613 + seed * 13));
            int sx = ((static_cast<int>(h % 64) + static_cast<int>(std::cos(global_f * 0.3f + s) * 2.0f)) % 64 + 64) % 64;
            int sy = ((static_cast<int>((h >> 8) % 64) + global_f * 2) % 64 + 64) % 64;
            cv.set(sx, sy, (s % 2 == 0) ? 3 : 41);
        }
    } else if (fx_id == 4) {
        // Anime Action Speedlines along top/bottom/sides
        for (int l = 0; l < 10; ++l) {
            uint32_t h = hash_u32(static_cast<uint32_t>(l * 389 + global_f * 29 + seed));
            int ly = static_cast<int>(h % 64);
            if (ly > 14 && ly < 50) continue;
            int lx = static_cast<int>((h >> 8) % 44);
            cv.line(lx, ly, lx + 14, ly, (l % 2 == 0) ? 3 : 41, 1);
        }
    }
}

} // namespace

void synthesize_anime_clip(const AnimeSpec& spec, uint8_t* out_indices) {
    for (int f = 0; f < CLIP_FRAMES; ++f) {
        int global_f = spec.part_idx * CLIP_FRAMES + f;
        Canvas64 cv;
        std::memset(cv.px, 0, sizeof(cv.px));

        int cam_x = 0;
        if (spec.camera_id == 1) cam_x = global_f * 2;
        else if (spec.camera_id == 2) cam_x = -global_f * 2;

        draw_sky(cv, spec.time_id % 4, cam_x, global_f, spec.variant_seed);
        draw_environment(cv, spec.scene_id % 6, spec.time_id % 4, spec.framing_id % 4, cam_x, global_f);

        int framing = spec.framing_id % 4;
        if (framing == 2) {
            draw_closeup_character(cv, spec, global_f);
        } else if (framing == 3) {
            // Duel between Hero (left) and Rival (right)!
            int rival_id = (spec.hero_id + 3) % 6;
            int rush = (spec.action_id == 2 || spec.action_id == 3) ? std::min(8, (f * 2) / 3) : 0;
            draw_full_hero(cv, spec.hero_id % 6, 17 + rush, 49, +1, spec.action_id % 6, global_f, false);
            draw_full_hero(cv, rival_id, 47 - rush, 49, -1, spec.action_id % 6, global_f + 2, false);
            if (spec.action_id >= 3 && (f >= 6 && f <= 13)) {
                // Clash spark burst at center!
                cv.fill_circle(32, 36, (f % 2 == 0) ? 4 : 6, 43);
                cv.fill_circle(32, 36, 2, 3);
                cv.line(24, 28, 40, 44, 3, 1);
                cv.line(24, 44, 40, 28, 41, 1);
            }
        } else {
            bool medium = (framing == 1 || (spec.camera_id == 3 && f >= 8));
            int hx = 28;
            if (spec.action_id == 2) {
                hx = 18 + (f * 3) / 2;
            }
            int gy = medium ? 56 : 49;
            draw_full_hero(cv, spec.hero_id % 6, hx, gy, +1, spec.action_id % 6, global_f, medium);
        }

        draw_weather_fx(cv, spec.fx_id % 5, global_f, spec.variant_seed);

        // Classic Sakuga single-frame impact flash highlight border on peak slash frame!
        if (spec.action_id == 3 && f == 7) {
            for (int x = 0; x < BASE_W; ++x) {
                cv.set(x, 0, 3); cv.set(x, BASE_H - 1, 3);
            }
            for (int y = 0; y < BASE_H; ++y) {
                cv.set(0, y, 3); cv.set(BASE_W - 1, y, 3);
            }
        }

        std::memcpy(out_indices + static_cast<size_t>(f) * BASE_H * BASE_W, cv.px, BASE_H * BASE_W);
    }
}

void upscale_indices_to_rgb256(
    const uint8_t* indices_64,
    int num_frames,
    uint8_t* out_rgb_256,
    bool use_scale2x
) {
    std::vector<uint8_t> idx_128(128 * 128);

    for (int f = 0; f < num_frames; ++f) {
        const uint8_t* src = indices_64 + static_cast<size_t>(f) * BASE_H * BASE_W;
        uint8_t* dst_rgb = out_rgb_256 + static_cast<size_t>(f) * OUT_H * OUT_W * 3;

        if (use_scale2x) {
            // Classic EPX / Scale2x pixel-art algorithm (64x64 -> 128x128):
            // Smooths pixel-art diagonals while strictly preserving palette colors!
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

                    uint8_t E0 = P, E1 = P, E2 = P, E3 = P;
                    if (C == A && C != D && A != B) E0 = A;
                    if (A == B && A != C && B != D) E1 = B;
                    if (D == C && D != B && C != A) E2 = C;
                    if (B == D && B != A && D != C) E3 = D;

                    idx_128[(2 * y) * 128 + (2 * x)]         = E0;
                    idx_128[(2 * y) * 128 + (2 * x + 1)]     = E1;
                    idx_128[(2 * y + 1) * 128 + (2 * x)]     = E2;
                    idx_128[(2 * y + 1) * 128 + (2 * x + 1)] = E3;
                }
            }

            // Crisp 2x nearest-neighbor from 128x128 -> 256x256 RGB
            for (int y = 0; y < 128; ++y) {
                for (int x = 0; x < 128; ++x) {
                    uint8_t c = idx_128[y * 128 + x];
                    if (c >= PALETTE_SIZE) c = 0;
                    const uint8_t* rgb = kPaletteRGB + static_cast<int>(c) * 3;
                    for (int dy = 0; dy < 2; ++dy) {
                        for (int dx = 0; dx < 2; ++dx) {
                            uint8_t* p = dst_rgb + ((2 * y + dy) * OUT_W + (2 * x + dx)) * 3;
                            p[0] = rgb[0];
                            p[1] = rgb[1];
                            p[2] = rgb[2];
                        }
                    }
                }
            }
        } else {
            // Pure 4x nearest-neighbor from 64x64 -> 256x256 RGB
            for (int y = 0; y < BASE_H; ++y) {
                for (int x = 0; x < BASE_W; ++x) {
                    uint8_t c = src[y * BASE_W + x];
                    if (c >= PALETTE_SIZE) c = 0;
                    const uint8_t* rgb = kPaletteRGB + static_cast<int>(c) * 3;
                    for (int dy = 0; dy < 4; ++dy) {
                        for (int dx = 0; dx < 4; ++dx) {
                            uint8_t* p = dst_rgb + ((4 * y + dy) * OUT_W + (4 * x + dx)) * 3;
                            p[0] = rgb[0];
                            p[1] = rgb[1];
                            p[2] = rgb[2];
                        }
                    }
                }
            }
        }
    }
}

} // namespace sakuga
