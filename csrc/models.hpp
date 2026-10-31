#pragma once

#include "sakuga_core.hpp"
#include "anime_palette_synth.hpp"
#include <string>
#include <vector>

namespace sakuga {

constexpr int LATENT_T = 8;
constexpr int LATENT_H = 32;
constexpr int LATENT_W = 32;
constexpr int LATENT_C = 8;
constexpr int LATENT_DIM = LATENT_T * LATENT_H * LATENT_W * LATENT_C; // 65536

constexpr int NUM_COND_TOKENS = 12; // 7 structured anime attributes + 5 text prompt word tokens
constexpr int TEXT_VOCAB_SIZE = 256;

// Factorized 3D Residual Block: Spatial 3x3 + Temporal 3 + LayerNorm + SiLU
struct ResBlock3D {
    int C = 0;
    Tensor ln1_g, ln1_b;
    Tensor conv_sp_w, conv_sp_b;
    Tensor ln2_g, ln2_b;
    Tensor conv_t_w, conv_t_b;

    void init(int channels, RNG& rng);
    void collect_params(std::vector<Tensor*>& out);
    // Input/Output shape: [B, T, H, W, C]
    Tensor* forward(Tape& tape, Tensor* X);
};

// Stage 1: High-Precision 32x32 Spatial-Aligned Pixel-Art Anime Video Autoencoder (2x2x2 patch = 1 float/pixel)
struct PixelAnimeVAE {
    Tensor palette_emb;           // [48, 8]
    Tensor enc_in_w, enc_in_b;    // [8*4*2 = 64, 36]
    ResBlock3D enc_block;         // C = 36 at [B, 8, 32, 32, 36]
    Tensor to_lat_w, to_lat_b;    // [36, 8]

    Tensor from_lat_w, from_lat_b;// [8, 36]
    ResBlock3D dec_block;         // C = 36 at [B, 8, 32, 32, 36]
    Tensor dec_t_w, dec_t_b;      // [36, 2*36=72] -> unfold temporal 2x -> [B, 16, 32, 32, 36]
    Tensor dec_sub_w, dec_sub_b;  // [36, 4*20=80] -> depth_to_space(2) -> [B*16, 64, 64, 20]
    Tensor dec_head_w, dec_head_b;// [20, 48] non-linear per-pixel palette classifier!

    std::vector<float> class_weights; // [48] foreground-boosted weights

    void init(uint32_t seed = 101);
    std::vector<Tensor*> parameters();

    // Encode [B, 16, 64, 64] uint8 indices -> [B, 8, 16, 16, 12] float latents in [-1, 1]
    Tensor* encode(Tape& tape, const uint8_t* indices, int B);

    // Decode [B, 8, 16, 16, 12] float latents -> [B*16*64*64, 48] palette logits
    Tensor* decode_logits(Tape& tape, Tensor* z);

    // Inference helper: decode latent [B * 24576] -> uint8 indices [B * 16 * 64 * 64]
    void decode_to_indices(const float* z_data, int B, uint8_t* out_indices);
};

// Single Sora-style DiT Block with 3D Spacetime RoPE + AdaLN-Zero + Cross-Attention
struct DiTBlock {
    int D = 180;
    int H = 5;
    int MlpD = 480;

    Tensor adaln_w, adaln_b;      // [D, 6*D]
    Tensor q_w, q_b;              // [D, D]
    Tensor k_w, k_b;              // [D, D]
    Tensor v_w, v_b;              // [D, D]
    Tensor proj_w, proj_b;        // [D, D]

    Tensor xln_q_g, xln_q_b;      // Cross-attention LayerNorm
    Tensor xq_w, xq_b;            // [D, D]
    Tensor xk_w, xk_b;            // [D, D]
    Tensor xv_w, xv_b;            // [D, D]
    Tensor xproj_w, xproj_b;      // [D, D]

    Tensor mlp_w1, mlp_b1;        // [D, MlpD]
    Tensor mlp_w2, mlp_b2;        // [MlpD, D]

    void init(int dim, int heads, int mlp_dim, RNG& rng);
    void collect_params(std::vector<Tensor*>& out);

    Tensor* forward(
        Tape& tape,
        Tensor* X,            // [B, 128, D]
        Tensor* Zprev_tok,    // [B, 16, D]
        Tensor* Cond_tok,     // [B, NUM_COND_TOKENS, D]
        Tensor* Cond_vec,     // [B, D]
        const float* q_cos,
        const float* q_sin,
        const float* k_cos,
        const float* k_sin,
        std::vector<float>* attn_capture = nullptr
    );
};

// Stage 2: SakugaDiT — Rectified Flow Matching Video Diffusion Transformer
struct SakugaDiT {
    static constexpr int D = 180;
    static constexpr int HEADS = 5;              // Dh = 36 -> 18 RoPE pairs (6_t + 6_y + 6_x)
    static constexpr int DEPTH = 5;
    static constexpr int MLP_D = 480;
    static constexpr int PATCH_C = LATENT_C * 64; // 8x8 spatial patchify on 32x32x8 -> 512!

    Tensor x_embed_w, x_embed_b;       // [192, D]
    Tensor prev_embed_w, prev_embed_b; // [192, D]
    Tensor bos_prev_tok;               // [16, D] learned token when has_prev == 0

    // Condition embeddings
    Tensor attr_emb;                   // [64, D]
    Tensor text_emb;                   // [TEXT_VOCAB_SIZE, D]
    Tensor cond_pos_emb;               // [NUM_COND_TOKENS, D]
    Tensor prev_flag_emb;              // [2, D]

    // Timestep + Global Condition MLP
    Tensor t_mlp_w1, t_mlp_b1;         // [D, D]
    Tensor t_mlp_w2, t_mlp_b2;         // [D, D]

    std::vector<DiTBlock> blocks;

    // Final AdaLN + Unpatchify head
    Tensor final_adaln_w, final_adaln_b; // [D, 2*D]
    Tensor final_out_w, final_out_b;     // [D, 192]

    // Precomputed 3D Axial RoPE tables
    std::vector<float> rope_q_cos, rope_q_sin;
    std::vector<float> rope_k_cos, rope_k_sin;

    std::vector<float> last_self_attn;
    std::vector<float> last_cross_attn;

    void init(uint32_t seed = 202);
    std::vector<Tensor*> parameters();

    Tensor* forward(
        Tape& tape,
        Tensor* z_t,               // [B, 8, 16, 16, 12]
        const float* tau,          // [B] in [0, 1]
        const int* cond_ids,       // [B * NUM_COND_TOKENS]
        const int* drop_cond,      // [B]
        const float* z_prev_frame, // [B * 1 * 16 * 16 * 12] or nullptr
        const int* has_prev,       // [B] 0 or 1
        bool capture_attn = false
    );

    void sample_ode(
        const int* cond_ids_single,
        const float* z_prev_single,
        int has_prev_flag,
        int steps,
        float cfg_scale,
        int solver_type,
        uint32_t seed,
        float* out_z,
        float* out_trajectory = nullptr,
        int num_snaps = 0
    );
};

void build_cond_tokens(const AnimeSpec& spec, const int* word_ids5, int* out_cond12);
bool save_checkpoint(const std::string& path, PixelAnimeVAE& vae, SakugaDiT& dit, int vae_steps, int dit_steps);
bool load_checkpoint(const std::string& path, PixelAnimeVAE& vae, SakugaDiT& dit, int* vae_steps, int* dit_steps);

} // namespace sakuga
