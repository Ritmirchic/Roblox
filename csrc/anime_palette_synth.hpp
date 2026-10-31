#pragma once

#include <cstdint>
#include <vector>

namespace sakuga {

constexpr int PALETTE_SIZE = 48;
constexpr int BASE_H = 128;
constexpr int BASE_W = 128;
constexpr int OUT_H = 256;
constexpr int OUT_W = 256;
constexpr int CLIP_FRAMES = 16;

struct AnimeSpec {
    int hero_id = 0;     // 0..5 (Akane, Ren, Lumina, Raiden, Kuro, Midori)
    int scene_id = 0;    // 0..5 (Sakura Shrine, Neo-Tokyo, Bamboo Moon, Sky Sanctuary, Eclipse Blade Hill, Kamakura Crossing)
    int time_id = 0;     // 0..3 (Sunset, Midnight, Clear Shinkai Day, Neon Storm)
    int framing_id = 0;  // 0..3 (Wide, Medium, Close-Up Portrait, Duel)
    int action_id = 0;   // 0..5 (Calm Wind, Dialogue, High-Speed Dash, Katana Slash, Arcane Beam, Awakening Aura)
    int camera_id = 0;   // 0..3 (Static, Pan Right, Pan Left, Subtle Push)
    int fx_id = 0;       // 0..4 (Sakura Petals, Rain, Embers, Starfall/Snow, Speedlines)
    int part_idx = 0;    // 0, 1, 2... continuous temporal chunk index
    int variant_seed = 0;
};

// Returns pointer to 48 * 3 uint8 RGB palette table
const uint8_t* get_master_palette_rgb();

// Synthesize a 16-frame 128x128 palette-indexed anime clip (out_indices size = 16 * 128 * 128)
void synthesize_anime_clip(const AnimeSpec& spec, uint8_t* out_indices);

// Convert 128x128 palette indices to crisp 256x256 RGB using EPX/Scale2x (128->256)
// If use_scale2x == false, uses pure 2x nearest-neighbor (128->256).
void upscale_indices_to_rgb256(
    const uint8_t* indices_128,
    int num_frames,
    uint8_t* out_rgb_256,
    bool use_scale2x = true
);

} // namespace sakuga
