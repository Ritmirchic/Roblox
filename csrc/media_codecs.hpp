#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace sakuga {

// Write a genuine ISO/IEC 14496-10 H.264 Baseline + ISO-BMFF (.mp4) video file from RGB24 frames [num_frames * W * H * 3]
bool write_mp4_h264(
    const std::string& path,
    const uint8_t* rgb_frames,
    int num_frames,
    int width,
    int height,
    int fps
);

// Write a lossless GIF89a with LZW compression from RGB24 frames [num_frames * W * H * 3]
bool write_gif89a(
    const std::string& path,
    const uint8_t* rgb_frames,
    int num_frames,
    int width,
    int height,
    int fps
);

// Synthesize an original Japanese-scale anime soundtrack + action SFX WAV file synchronized to shots!
// shot_actions & shot_fx: arrays of length num_shots, frames_per_shot: frames per shot at `fps`.
bool synthesize_anime_ost_wav(
    const std::string& path,
    const int* shot_actions,
    const int* shot_fx,
    const int* shot_Mood,
    int num_shots,
    int frames_per_shot,
    int fps
);

} // namespace sakuga
