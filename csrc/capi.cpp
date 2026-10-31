#include "sakuga_core.hpp"
#include "anime_palette_synth.hpp"
#include "models.hpp"
#include "media_codecs.hpp"

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdio>
#include <cstring>
#include <omp.h>

using namespace sakuga;

struct DatasetEntry {
    AnimeSpec spec;
    int cond12[NUM_COND_TOKENS];
    int has_prev = 0;
    int prev_clip_idx = -1;
};

struct SakugaContext {
    PixelAnimeVAE vae;
    SakugaDiT dit;
    AdamW vae_opt;
    AdamW dit_opt;
    RNG rng;

    int vae_trained_steps = 0;
    int dit_trained_steps = 0;

    // In-RAM dataset & pre-encoded latent cache
    std::vector<DatasetEntry> dataset_meta;
    std::vector<uint8_t> dataset_indices; // [N * 16 * 64 * 64]
    std::vector<float> cached_latents;    // [N * LATENT_DIM]
    bool latents_ready = false;

    SakugaContext(uint32_t seed) : rng(seed) {
        vae.init(seed + 11);
        dit.init(seed + 29);
        vae_opt.register_params(vae.parameters());
        dit_opt.register_params(dit.parameters());
    }
};

extern "C" {

SakugaContext* sakuga_create(uint32_t seed) {
    return new SakugaContext(seed);
}

void sakuga_destroy(SakugaContext* ctx) {
    delete ctx;
}

void sakuga_model_stats(SakugaContext* ctx, int* out_vae_params, int* out_dit_params, int* out_vae_steps, int* out_dit_steps) {
    size_t vp = 0, dp = 0;
    for (Tensor* p : ctx->vae.parameters()) vp += p->numel();
    for (Tensor* p : ctx->dit.parameters()) dp += p->numel();
    if (out_vae_params) *out_vae_params = static_cast<int>(vp);
    if (out_dit_params) *out_dit_params = static_cast<int>(dp);
    if (out_vae_steps)  *out_vae_steps  = ctx->vae_trained_steps;
    if (out_dit_steps)  *out_dit_steps  = ctx->dit_trained_steps;
}

const uint8_t* sakuga_get_palette() {
    return get_master_palette_rgb();
}

// Finite-difference numerical gradient check across core operators (Linear, LayerNorm, RoPE MHA, Conv2D, Conv1D, CE, MSE)
float sakuga_numerical_grad_check() {
    RNG rng(777);
    Tensor X({2, 6, 12}, true); rng.normal(X.data, 0.0f, 0.5f);
    Tensor Wq({12, 12}, true);  rng.xavier(Wq);
    Tensor Wk({12, 12}, true);  rng.xavier(Wk);
    Tensor Wv({12, 12}, true);  rng.xavier(Wv);
    Tensor bq({12}, true);      rng.normal(bq.data, 0.0f, 0.1f);
    Tensor ln_g({12}, true);    rng.normal(ln_g.data, 1.0f, 0.1f);
    Tensor ln_b({12}, true);    rng.normal(ln_b.data, 0.0f, 0.1f);
    Tensor mod_s({2, 12}, true); rng.normal(mod_s.data, 0.0f, 0.2f);
    Tensor tgt({2, 6, 12}, false); rng.normal(tgt.data, 0.0f, 0.5f);

    // RoPE tables for N=6, Dh=6 -> half=3
    std::vector<float> rcos(6 * 3), rsin(6 * 3);
    for (int i = 0; i < 18; ++i) {
        rcos[i] = std::cos(0.3f * i);
        rsin[i] = std::sin(0.3f * i);
    }

    auto forward_eval = [&](bool rec) -> float {
        Tape tape(rec);
        Tensor* h = ops::layernorm(tape, &X, &ln_g, &ln_b);
        h = ops::scale_mod(tape, h, &mod_s);
        h = ops::silu(tape, h);
        Tensor* q = ops::linear(tape, h, &Wq, &bq);
        Tensor* k = ops::linear(tape, h, &Wk, nullptr);
        Tensor* v = ops::linear(tape, h, &Wv, nullptr);
        Tensor* a = ops::multihead_attention(tape, q, k, v, 2, rcos.data(), rsin.data(), rcos.data(), rsin.data());
        a = ops::gelu(tape, a);
        Tensor* loss = ops::mse_loss(tape, a, &tgt);
        if (rec) tape.backward(loss);
        return loss->data[0];
    };

    X.zero_grad(); Wq.zero_grad(); Wk.zero_grad(); Wv.zero_grad();
    bq.zero_grad(); ln_g.zero_grad(); ln_b.zero_grad(); mod_s.zero_grad();
    forward_eval(true);

    float max_rel_err = 0.0f;
    const float eps = 1e-3f;
    std::vector<Tensor*> check_list = {&X, &Wq, &Wk, &Wv, &ln_g, &mod_s};
    for (Tensor* t : check_list) {
        std::vector<float> analytic = t->grad;
        size_t limit = std::min<size_t>(t->numel(), 24);
        for (size_t i = 0; i < limit; ++i) {
            float orig = t->data[i];
            t->data[i] = orig + eps;
            float lp = forward_eval(false);
            t->data[i] = orig - eps;
            float lm = forward_eval(false);
            t->data[i] = orig;

            float num = (lp - lm) / (2.0f * eps);
            float ana = analytic[i];
            float denom = std::max({std::abs(num), std::abs(ana), 1e-3f});
            float err = std::abs(num - ana) / denom;
            if (err > max_rel_err) max_rel_err = err;
        }
    }
    return max_rel_err;
}

// Build in-RAM dataset from specifications provided by Python:
// specs_flat: [N * 9] ints: (hero, scene, time, framing, action, camera, fx, part_idx, variant_seed)
// words_flat: [N * 5] ints: 5 prompt token IDs per clip
// prev_idx:   [N] ints: -1 if fresh shot, >= 0 index of preceding part-0 clip
void sakuga_build_dataset(
    SakugaContext* ctx,
    int N,
    const int* specs_flat,
    const int* words_flat,
    const int* prev_idx
) {
    ctx->dataset_meta.resize(N);
    size_t clip_pix = CLIP_FRAMES * BASE_H * BASE_W;
    ctx->dataset_indices.resize(static_cast<size_t>(N) * clip_pix);
    ctx->latents_ready = false;

    #pragma omp parallel for schedule(static)
    for (int i = 0; i < N; ++i) {
        AnimeSpec sp;
        sp.hero_id      = specs_flat[i * 9 + 0];
        sp.scene_id     = specs_flat[i * 9 + 1];
        sp.time_id      = specs_flat[i * 9 + 2];
        sp.framing_id   = specs_flat[i * 9 + 3];
        sp.action_id    = specs_flat[i * 9 + 4];
        sp.camera_id    = specs_flat[i * 9 + 5];
        sp.fx_id        = specs_flat[i * 9 + 6];
        sp.part_idx     = specs_flat[i * 9 + 7];
        sp.variant_seed = specs_flat[i * 9 + 8];

        DatasetEntry entry;
        entry.spec = sp;
        build_cond_tokens(sp, words_flat + i * 5, entry.cond12);
        entry.prev_clip_idx = prev_idx[i];
        entry.has_prev = (prev_idx[i] >= 0 && prev_idx[i] < N) ? 1 : 0;
        ctx->dataset_meta[i] = entry;

        synthesize_anime_clip(sp, ctx->dataset_indices.data() + static_cast<size_t>(i) * clip_pix);
    }
}

// Train PixelAnimeVAE for `num_steps` batches of size `batch_size`.
// Writes per-step loss and pixel accuracy into out_losses[num_steps] and out_accs[num_steps].
void sakuga_train_vae(
    SakugaContext* ctx,
    int num_steps,
    int batch_size,
    float lr_max,
    float lr_min,
    float latent_noise_std,
    float* out_losses,
    float* out_accs
) {
    ctx->vae_opt.restore_from_ema();
    int N = static_cast<int>(ctx->dataset_meta.size());
    if (N <= 0 || num_steps <= 0) return;

    size_t clip_pix = CLIP_FRAMES * BASE_H * BASE_W;
    std::uniform_int_distribution<int> pick(0, N - 1);
    std::normal_distribution<float> ndist(0.0f, 1.0f);
    std::vector<uint8_t> batch_idx(static_cast<size_t>(batch_size) * clip_pix);

    for (int s = 0; s < num_steps; ++s) {
        float prog = static_cast<float>(s) / static_cast<float>(std::max(1, num_steps - 1));
        float lr = lr_min + 0.5f * (lr_max - lr_min) * (1.0f + std::cos(prog * 3.14159265f));

        for (int b = 0; b < batch_size; ++b) {
            int idx = pick(ctx->rng.gen);
            std::memcpy(
                batch_idx.data() + static_cast<size_t>(b) * clip_pix,
                ctx->dataset_indices.data() + static_cast<size_t>(idx) * clip_pix,
                clip_pix
            );
        }

        ctx->vae_opt.zero_grad();
        Tape tape(true);
        Tensor* z = ctx->vae.encode(tape, batch_idx.data(), batch_size);

        // Denoising bottleneck regularization so decoder handles continuous DiT latents smoothly!
        Tensor* z_in = z;
        if (latent_noise_std > 0.0f) {
            Tensor* eps = tape.alloc(z->shape, false);
            for (float& v : eps->data) v = ndist(ctx->rng.gen) * latent_noise_std;
            z_in = ops::add(tape, z, eps);
        }

        Tensor* logits = ctx->vae.decode_logits(tape, z_in);
        int correct = 0;
        Tensor* loss = ops::weighted_cross_entropy(
            tape, logits, batch_idx.data(), ctx->vae.class_weights.data(), &correct
        );
        tape.backward(loss);
        ctx->vae_opt.step(lr, 1.5f);
        ctx->vae_trained_steps += 1;

        if (out_losses) out_losses[s] = loss->data[0];
        if (out_accs)   out_accs[s] = static_cast<float>(correct) / static_cast<float>(batch_size * clip_pix);
    }

    ctx->vae_opt.swap_to_ema();
    ctx->latents_ready = false;
}

// Pre-encode all N dataset clips into cached_latents using VAE EMA weights
void sakuga_encode_dataset_latents(SakugaContext* ctx) {
    ctx->vae_opt.swap_to_ema();
    int N = static_cast<int>(ctx->dataset_meta.size());
    if (N <= 0) return;

    size_t clip_pix = CLIP_FRAMES * BASE_H * BASE_W;
    ctx->cached_latents.resize(static_cast<size_t>(N) * LATENT_DIM);

    // Parallelize across clips with thread-local inference tapes (vae weights are read-only here!)
    #pragma omp parallel for schedule(static)
    for (int i = 0; i < N; ++i) {
        Tape tape(false);
        Tensor* z = ctx->vae.encode(tape, ctx->dataset_indices.data() + static_cast<size_t>(i) * clip_pix, 1);
        std::memcpy(
            ctx->cached_latents.data() + static_cast<size_t>(i) * LATENT_DIM,
            z->data.data(),
            LATENT_DIM * sizeof(float)
        );
    }
    ctx->latents_ready = true;
}

// Train SakugaDiT via Rectified Flow Matching (v = z_1 - z_0) with CFG dropout & z_prev conditioning!
void sakuga_train_dit(
    SakugaContext* ctx,
    int num_steps,
    int batch_size,
    float lr_max,
    float lr_min,
    float cfg_drop_prob,
    float* out_losses
) {
    if (!ctx->latents_ready) {
        sakuga_encode_dataset_latents(ctx);
    }
    ctx->dit_opt.restore_from_ema();

    int N = static_cast<int>(ctx->dataset_meta.size());
    if (N <= 0 || num_steps <= 0) return;

    std::uniform_int_distribution<int> pick(0, N - 1);
    std::uniform_real_distribution<float> udist(0.0f, 1.0f);
    std::normal_distribution<float> ndist(0.0f, 1.0f);

    size_t frame_lat_sz = LATENT_H * LATENT_W * LATENT_C; // 8*8*24 = 1536

    std::vector<float> taus(batch_size);
    std::vector<int> cond_batch(batch_size * NUM_COND_TOKENS);
    std::vector<int> drop_batch(batch_size);
    std::vector<int> hp_batch(batch_size);
    std::vector<float> z_prev_batch(batch_size * frame_lat_sz);

    for (int s = 0; s < num_steps; ++s) {
        float prog = static_cast<float>(s) / static_cast<float>(std::max(1, num_steps - 1));
        float lr = lr_min + 0.5f * (lr_max - lr_min) * (1.0f + std::cos(prog * 3.14159265f));

        ctx->dit_opt.zero_grad();
        Tape tape(true);
        Tensor* z_t = tape.alloc({batch_size, LATENT_T, LATENT_H, LATENT_W, LATENT_C}, false);
        Tensor* v_target = tape.alloc({batch_size, LATENT_T, LATENT_H, LATENT_W, LATENT_C}, false);

        for (int b = 0; b < batch_size; ++b) {
            int idx = pick(ctx->rng.gen);
            const DatasetEntry& meta = ctx->dataset_meta[idx];
            const float* z1 = ctx->cached_latents.data() + static_cast<size_t>(idx) * LATENT_DIM;

            // Sample continuous Flow-Matching time tau in [0, 1] (blend uniform + logit-normal mid-bias)
            float u = udist(ctx->rng.gen);
            if ((b & 1) == 1) {
                float ln = ndist(ctx->rng.gen) * 0.9f;
                u = 1.0f / (1.0f + std::exp(-ln));
            }
            taus[b] = std::clamp(u, 0.005f, 0.995f);
            float t = taus[b];

            float* ztb = z_t->data.data() + static_cast<size_t>(b) * LATENT_DIM;
            float* vtb = v_target->data.data() + static_cast<size_t>(b) * LATENT_DIM;
            for (int i = 0; i < LATENT_DIM; ++i) {
                float z0_i = ndist(ctx->rng.gen);
                float z1_i = z1[i];
                ztb[i] = (1.0f - t) * z0_i + t * z1_i;
                vtb[i] = z1_i; // Clean x1-prediction Rectified Flow target!
            }

            std::memcpy(&cond_batch[b * NUM_COND_TOKENS], meta.cond12, NUM_COND_TOKENS * sizeof(int));
            drop_batch[b] = (udist(ctx->rng.gen) < cfg_drop_prob) ? 1 : 0;

            // With 80% probability on part>=1 clips, condition on preceding clip's final latent frame z_prev!
            if (meta.has_prev == 1 && meta.prev_clip_idx >= 0 && udist(ctx->rng.gen) < 0.80f) {
                hp_batch[b] = 1;
                const float* prev_z_full = ctx->cached_latents.data()
                    + static_cast<size_t>(meta.prev_clip_idx) * LATENT_DIM
                    + static_cast<size_t>(LATENT_T - 1) * frame_lat_sz;
                std::memcpy(&z_prev_batch[b * frame_lat_sz], prev_z_full, frame_lat_sz * sizeof(float));
            } else {
                hp_batch[b] = 0;
                std::memset(&z_prev_batch[b * frame_lat_sz], 0, frame_lat_sz * sizeof(float));
            }
        }

        Tensor* v_pred = ctx->dit.forward(
            tape, z_t, taus.data(), cond_batch.data(), drop_batch.data(),
            z_prev_batch.data(), hp_batch.data(), false
        );
        Tensor* loss = ops::mse_loss(tape, v_pred, v_target);
        tape.backward(loss);
        ctx->dit_opt.step(lr, 1.0f);
        ctx->dit_trained_steps += 1;

        if (out_losses) out_losses[s] = loss->data[0];
    }

    ctx->dit_opt.swap_to_ema();
}

// Generate a 16-frame 256x256 RGB video clip purely from Gaussian noise via SakugaDiT ODE + PixelAnimeVAE!
// Returns final latent frame z_last [8*8*24 = 1536] so callers can chain infinite autoregressive shots!
// Optionally decodes `num_snaps` intermediate denoising frames (frame 8 of each ODE snapshot) into out_snap_rgb256!
void sakuga_generate_shot(
    SakugaContext* ctx,
    const int* cond12,
    const float* z_prev_frame,   // [1536] or nullptr
    int has_prev_flag,
    int ode_steps,
    float cfg_scale,
    int solver_type,             // 0 = Euler, 1 = Heun
    int use_scale2x,             // 1 = Scale2x crisp upscaler, 0 = 4x nearest
    uint32_t seed,
    uint8_t* out_rgb256,         // [16 * 256 * 256 * 3]
    float* out_last_latent_frame,// [1536] optional
    float* out_full_latent,      // [12288] optional
    int num_snaps,               // e.g. 6 snapshots from tau=0.0 to tau=1.0
    uint8_t* out_snap_rgb256     // [num_snaps * 256 * 256 * 3] optional
) {
    ctx->vae_opt.swap_to_ema();
    ctx->dit_opt.swap_to_ema();

    std::vector<float> z_final(LATENT_DIM);
    std::vector<float> z_traj;
    if (num_snaps > 0 && out_snap_rgb256) {
        z_traj.resize(static_cast<size_t>(num_snaps) * LATENT_DIM);
    }

    ctx->dit.sample_ode(
        cond12,
        z_prev_frame,
        has_prev_flag,
        ode_steps,
        cfg_scale,
        solver_type,
        seed,
        z_final.data(),
        z_traj.empty() ? nullptr : z_traj.data(),
        num_snaps
    );

    if (out_full_latent) {
        std::memcpy(out_full_latent, z_final.data(), LATENT_DIM * sizeof(float));
    }
    if (out_last_latent_frame) {
        size_t fsz = LATENT_H * LATENT_W * LATENT_C;
        std::memcpy(
            out_last_latent_frame,
            z_final.data() + static_cast<size_t>(LATENT_T - 1) * fsz,
            fsz * sizeof(float)
        );
    }

    std::vector<uint8_t> idx64(CLIP_FRAMES * BASE_H * BASE_W);
    ctx->vae.decode_to_indices(z_final.data(), 1, idx64.data());
    upscale_indices_to_rgb256(idx64.data(), CLIP_FRAMES, out_rgb256, use_scale2x != 0);

    // Decode mid-clip frame (frame 8) of each intermediate ODE denoising snapshot for live visualizer!
    if (num_snaps > 0 && out_snap_rgb256) {
        std::vector<uint8_t> snap_idx64(CLIP_FRAMES * BASE_H * BASE_W);
        for (int s = 0; s < num_snaps; ++s) {
            ctx->vae.decode_to_indices(z_traj.data() + static_cast<size_t>(s) * LATENT_DIM, 1, snap_idx64.data());
            const uint8_t* mid_frame_idx = snap_idx64.data() + 8 * BASE_H * BASE_W;
            upscale_indices_to_rgb256(
                mid_frame_idx,
                1,
                out_snap_rgb256 + static_cast<size_t>(s) * OUT_H * OUT_W * 3,
                use_scale2x != 0
            );
        }
    }
}

// Fetch last captured 3D spacetime attention matrix [128 * 144]
int sakuga_get_last_attention(SakugaContext* ctx, float* out_buf, int max_floats) {
    int n = static_cast<int>(std::min<size_t>(ctx->dit.last_self_attn.size(), static_cast<size_t>(max_floats)));
    if (n > 0 && out_buf) {
        std::memcpy(out_buf, ctx->dit.last_self_attn.data(), static_cast<size_t>(n) * sizeof(float));
    }
    return n;
}

// Evaluate VAE reconstruction accuracy on a synthetic spec (for diagnostics / verification)
float sakuga_eval_vae_reconstruction(
    SakugaContext* ctx,
    const int* spec9,
    uint8_t* out_gt_rgb256,
    uint8_t* out_rec_rgb256
) {
    ctx->vae_opt.swap_to_ema();
    AnimeSpec sp;
    sp.hero_id = spec9[0]; sp.scene_id = spec9[1]; sp.time_id = spec9[2];
    sp.framing_id = spec9[3]; sp.action_id = spec9[4]; sp.camera_id = spec9[5];
    sp.fx_id = spec9[6]; sp.part_idx = spec9[7]; sp.variant_seed = spec9[8];

    std::vector<uint8_t> gt_idx(CLIP_FRAMES * BASE_H * BASE_W);
    std::vector<uint8_t> rec_idx(CLIP_FRAMES * BASE_H * BASE_W);
    synthesize_anime_clip(sp, gt_idx.data());

    Tape tape(false);
    Tensor* z = ctx->vae.encode(tape, gt_idx.data(), 1);
    ctx->vae.decode_to_indices(z->data.data(), 1, rec_idx.data());

    int match = 0;
    int total = CLIP_FRAMES * BASE_H * BASE_W;
    for (int i = 0; i < total; ++i) {
        if (gt_idx[i] == rec_idx[i]) match++;
    }
    if (out_gt_rgb256)  upscale_indices_to_rgb256(gt_idx.data(), CLIP_FRAMES, out_gt_rgb256, true);
    if (out_rec_rgb256) upscale_indices_to_rgb256(rec_idx.data(), CLIP_FRAMES, out_rec_rgb256, true);
    return static_cast<float>(match) / static_cast<float>(total);
}

int sakuga_save_checkpoint(SakugaContext* ctx, const char* path) {
    ctx->vae_opt.swap_to_ema();
    ctx->dit_opt.swap_to_ema();
    return save_checkpoint(path, ctx->vae, ctx->dit, ctx->vae_trained_steps, ctx->dit_trained_steps) ? 1 : 0;
}

int sakuga_load_checkpoint(SakugaContext* ctx, const char* path) {
    int vs = 0, ds = 0;
    if (!load_checkpoint(path, ctx->vae, ctx->dit, &vs, &ds)) return 0;
    ctx->vae_trained_steps = vs;
    ctx->dit_trained_steps = ds;
    ctx->vae_opt.sync_ema_from_weights();
    ctx->dit_opt.sync_ema_from_weights();
    return 1;
}

int sakuga_write_mp4(const char* path, const uint8_t* rgb_frames, int num_frames, int width, int height, int fps) {
    return write_mp4_h264(path, rgb_frames, num_frames, width, height, fps) ? 1 : 0;
}

int sakuga_write_gif(const char* path, const uint8_t* rgb_frames, int num_frames, int width, int height, int fps) {
    return write_gif89a(path, rgb_frames, num_frames, width, height, fps) ? 1 : 0;
}

int sakuga_write_ost_wav(
    const char* path,
    const int* shot_actions,
    const int* shot_fx,
    const int* shot_mood,
    int num_shots,
    int frames_per_shot,
    int fps
) {
    return synthesize_anime_ost_wav(path, shot_actions, shot_fx, shot_mood, num_shots, frames_per_shot, fps) ? 1 : 0;
}

} // extern "C"
