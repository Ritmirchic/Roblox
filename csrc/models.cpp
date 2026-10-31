#include "models.hpp"
#include <algorithm>
#include <cmath>
#include <cstdio>
#include <fstream>

namespace sakuga {

namespace {

Tensor* slice_last(Tape& tape, Tensor* X, int offset, int len) {
    int B = X->shape[0];
    int Dtot = X->shape[1];
    Tensor* Y = tape.alloc({B, len}, X->requires_grad);
    for (int b = 0; b < B; ++b) {
        std::memcpy(
            Y->data.data() + static_cast<size_t>(b) * len,
            X->data.data() + static_cast<size_t>(b) * Dtot + offset,
            static_cast<size_t>(len) * sizeof(float)
        );
    }
    if (tape.record && X->requires_grad) {
        tape.add_op([X, Y, B, Dtot, offset, len]() {
            for (int b = 0; b < B; ++b) {
                float* dx = X->grad.data() + static_cast<size_t>(b) * Dtot + offset;
                const float* dy = Y->grad.data() + static_cast<size_t>(b) * len;
                #pragma omp simd
                for (int i = 0; i < len; ++i) dx[i] += dy[i];
            }
        });
    }
    return Y;
}

Tensor* mean_pool_axis1(Tape& tape, Tensor* X) {
    int B = X->shape[0];
    int N = X->shape[1];
    int D = X->shape[2];
    Tensor* Y = tape.alloc({B, D}, X->requires_grad);
    float invN = 1.0f / static_cast<float>(N);
    for (int b = 0; b < B; ++b) {
        float* yb = Y->data.data() + static_cast<size_t>(b) * D;
        std::memset(yb, 0, static_cast<size_t>(D) * sizeof(float));
        for (int n = 0; n < N; ++n) {
            const float* xbn = X->data.data() + (static_cast<size_t>(b) * N + n) * D;
            #pragma omp simd
            for (int d = 0; d < D; ++d) yb[d] += xbn[d] * invN;
        }
    }
    if (tape.record && X->requires_grad) {
        tape.add_op([X, Y, B, N, D, invN]() {
            for (int b = 0; b < B; ++b) {
                const float* dyb = Y->grad.data() + static_cast<size_t>(b) * D;
                for (int n = 0; n < N; ++n) {
                    float* dxbn = X->grad.data() + (static_cast<size_t>(b) * N + n) * D;
                    #pragma omp simd
                    for (int d = 0; d < D; ++d) dxbn[d] += dyb[d] * invN;
                }
            }
        });
    }
    return Y;
}

// Fold adjacent temporal frame pairs: X[B, T, H, W, C] -> Y[B, T/2, H, W, 2*C]
Tensor* fold_t2(Tape& tape, Tensor* X) {
    int B = X->shape[0], T = X->shape[1], H = X->shape[2], W = X->shape[3], C = X->shape[4];
    int T2 = T / 2, S = H * W, C2 = 2 * C;
    Tensor* Y = tape.alloc({B, T2, H, W, C2}, X->requires_grad);
    for (int b = 0; b < B; ++b) {
        for (int t = 0; t < T2; ++t) {
            const float* f0 = X->data.data() + ((static_cast<size_t>(b) * T + 2 * t) * S) * C;
            const float* f1 = X->data.data() + ((static_cast<size_t>(b) * T + 2 * t + 1) * S) * C;
            float* dst = Y->data.data() + ((static_cast<size_t>(b) * T2 + t) * S) * C2;
            for (int s = 0; s < S; ++s) {
                std::memcpy(dst + s * C2, f0 + s * C, C * sizeof(float));
                std::memcpy(dst + s * C2 + C, f1 + s * C, C * sizeof(float));
            }
        }
    }
    if (tape.record && X->requires_grad) {
        tape.add_op([X, Y, B, T, T2, S, C, C2]() {
            for (int b = 0; b < B; ++b) {
                for (int t = 0; t < T2; ++t) {
                    float* df0 = X->grad.data() + ((static_cast<size_t>(b) * T + 2 * t) * S) * C;
                    float* df1 = X->grad.data() + ((static_cast<size_t>(b) * T + 2 * t + 1) * S) * C;
                    const float* dy = Y->grad.data() + ((static_cast<size_t>(b) * T2 + t) * S) * C2;
                    for (int s = 0; s < S; ++s) {
                        const float* dys = dy + s * C2;
                        #pragma omp simd
                        for (int c = 0; c < C; ++c) {
                            df0[s * C + c] += dys[c];
                            df1[s * C + c] += dys[C + c];
                        }
                    }
                }
            }
        });
    }
    return Y;
}

// Unfold temporal frame pairs: X[B, T2, H, W, 2*C] -> Y[B, 2*T2, H, W, C]
Tensor* unfold_t2(Tape& tape, Tensor* X) {
    int B = X->shape[0], T2 = X->shape[1], H = X->shape[2], W = X->shape[3], C2 = X->shape[4];
    int T = T2 * 2, S = H * W, C = C2 / 2;
    Tensor* Y = tape.alloc({B, T, H, W, C}, X->requires_grad);
    for (int b = 0; b < B; ++b) {
        for (int t = 0; t < T2; ++t) {
            const float* src = X->data.data() + ((static_cast<size_t>(b) * T2 + t) * S) * C2;
            float* f0 = Y->data.data() + ((static_cast<size_t>(b) * T + 2 * t) * S) * C;
            float* f1 = Y->data.data() + ((static_cast<size_t>(b) * T + 2 * t + 1) * S) * C;
            for (int s = 0; s < S; ++s) {
                std::memcpy(f0 + s * C, src + s * C2, C * sizeof(float));
                std::memcpy(f1 + s * C, src + s * C2 + C, C * sizeof(float));
            }
        }
    }
    if (tape.record && X->requires_grad) {
        tape.add_op([X, Y, B, T, T2, S, C, C2]() {
            for (int b = 0; b < B; ++b) {
                for (int t = 0; t < T2; ++t) {
                    float* dx = X->grad.data() + ((static_cast<size_t>(b) * T2 + t) * S) * C2;
                    const float* dy0 = Y->grad.data() + ((static_cast<size_t>(b) * T + 2 * t) * S) * C;
                    const float* dy1 = Y->grad.data() + ((static_cast<size_t>(b) * T + 2 * t + 1) * S) * C;
                    for (int s = 0; s < S; ++s) {
                        float* dxs = dx + s * C2;
                        #pragma omp simd
                        for (int c = 0; c < C; ++c) {
                            dxs[c]     += dy0[s * C + c];
                            dxs[C + c] += dy1[s * C + c];
                        }
                    }
                }
            }
        });
    }
    return Y;
}

void sinusoidal_timestep(const float* tau, int B, int D, float* out) {
    int half = D / 2;
    for (int b = 0; b < B; ++b) {
        float t = tau[b] * 1000.0f;
        float* row = out + static_cast<size_t>(b) * D;
        for (int i = 0; i < half; ++i) {
            float freq = std::exp(-std::log(10000.0f) * static_cast<float>(i) / static_cast<float>(half));
            float ang = t * freq;
            row[i] = std::cos(ang);
            row[half + i] = std::sin(ang);
        }
    }
}

void fill_3d_rope_entry(int t_pos, int y_pos, int x_pos, float* cos_row, float* sin_row) {
    int coords[3] = {t_pos, y_pos, x_pos};
    for (int axis = 0; axis < 3; ++axis) {
        float c_val = static_cast<float>(coords[axis]);
        for (int p = 0; p < 6; ++p) {
            float freq = std::pow(32.0f, -static_cast<float>(p) / 6.0f);
            float ang = c_val * freq;
            cos_row[axis * 6 + p] = std::cos(ang);
            sin_row[axis * 6 + p] = std::sin(ang);
        }
    }
}

} // namespace

// ================= ResBlock3D =================

void ResBlock3D::init(int channels, RNG& rng) {
    C = channels;
    ln1_g = Tensor({C}, true); std::fill(ln1_g.data.begin(), ln1_g.data.end(), 1.0f);
    ln1_b = Tensor({C}, true);
    conv_sp_w = Tensor({9 * C, C}, true); rng.xavier(conv_sp_w, 0.7f);
    conv_sp_b = Tensor({C}, true);

    ln2_g = Tensor({C}, true); std::fill(ln2_g.data.begin(), ln2_g.data.end(), 1.0f);
    ln2_b = Tensor({C}, true);
    conv_t_w = Tensor({3 * C, C}, true); rng.xavier(conv_t_w, 0.5f);
    conv_t_b = Tensor({C}, true);
}

void ResBlock3D::collect_params(std::vector<Tensor*>& out) {
    out.push_back(&ln1_g); out.push_back(&ln1_b);
    out.push_back(&conv_sp_w); out.push_back(&conv_sp_b);
    out.push_back(&ln2_g); out.push_back(&ln2_b);
    out.push_back(&conv_t_w); out.push_back(&conv_t_b);
}

Tensor* ResBlock3D::forward(Tape& tape, Tensor* X) {
    int B = X->shape[0], T = X->shape[1], H = X->shape[2], W = X->shape[3];

    Tensor* h1 = ops::layernorm(tape, X, &ln1_g, &ln1_b);
    h1 = ops::silu(tape, h1);
    Tensor* h1_2d = ops::reshape(tape, h1, {B * T, H, W, C});
    Tensor* sp = ops::conv2d_3x3(tape, h1_2d, &conv_sp_w, &conv_sp_b);
    Tensor* sp_5d = ops::reshape(tape, sp, {B, T, H, W, C});
    Tensor* X_mid = ops::add(tape, X, sp_5d);

    Tensor* h2 = ops::layernorm(tape, X_mid, &ln2_g, &ln2_b);
    h2 = ops::silu(tape, h2);
    Tensor* h2_t = ops::reshape(tape, h2, {B, T, H * W, C});
    Tensor* tm = ops::conv1d_t3(tape, h2_t, &conv_t_w, &conv_t_b);
    Tensor* tm_5d = ops::reshape(tape, tm, {B, T, H, W, C});
    return ops::add(tape, X_mid, tm_5d);
}

// ================= PixelAnimeVAE =================

void PixelAnimeVAE::init(uint32_t seed) {
    RNG rng(seed);
    palette_emb = Tensor({PALETTE_SIZE, 8}, true);
    rng.normal(palette_emb.data, 0.0f, 0.30f);
    const uint8_t* rgb = get_master_palette_rgb();
    for (int k = 0; k < PALETTE_SIZE; ++k) {
        palette_emb.data[k * 8 + 0] = (static_cast<float>(rgb[k * 3 + 0]) / 127.5f) - 1.0f;
        palette_emb.data[k * 8 + 1] = (static_cast<float>(rgb[k * 3 + 1]) / 127.5f) - 1.0f;
        palette_emb.data[k * 8 + 2] = (static_cast<float>(rgb[k * 3 + 2]) / 127.5f) - 1.0f;
    }

    enc_in_w = Tensor({8 * 4 * 2, 36}, true); rng.xavier(enc_in_w);
    enc_in_b = Tensor({36}, true);
    enc_block.init(36, rng);

    to_lat_w = Tensor({36, LATENT_C}, true); rng.xavier(to_lat_w, 0.8f);
    to_lat_b = Tensor({LATENT_C}, true);

    from_lat_w = Tensor({LATENT_C, 36}, true); rng.xavier(from_lat_w);
    from_lat_b = Tensor({36}, true);
    dec_block.init(36, rng);

    dec_t_w = Tensor({36, 2 * 36}, true); rng.xavier(dec_t_w);
    dec_t_b = Tensor({2 * 36}, true);

    dec_sub_w = Tensor({36, 4 * 20}, true); rng.xavier(dec_sub_w);
    dec_sub_b = Tensor({4 * 20}, true);

    dec_head_w = Tensor({20, PALETTE_SIZE}, true); rng.xavier(dec_head_w);
    dec_head_b = Tensor({PALETTE_SIZE}, true);

    class_weights.assign(PALETTE_SIZE, 1.0f);
    class_weights[0] = 3.8f; // Ink outlines
    class_weights[1] = 2.4f;
    class_weights[3] = 3.2f; // Specular eye & blade highlights
    for (int k = 4; k <= 19; ++k) class_weights[k] = 4.2f; // Anime skin, blush, hero hair & irises
    class_weights[30] = 3.0f; // Torii vermilion
    class_weights[31] = 2.5f;
    for (int k = 36; k <= 43; ++k) class_weights[k] = 3.5f; // Outfits, katanas, neon, plasma/aura FX
}

std::vector<Tensor*> PixelAnimeVAE::parameters() {
    std::vector<Tensor*> ps = {
        &palette_emb,
        &enc_in_w, &enc_in_b,
        &to_lat_w, &to_lat_b,
        &from_lat_w, &from_lat_b,
        &dec_t_w, &dec_t_b,
        &dec_sub_w, &dec_sub_b,
        &dec_head_w, &dec_head_b
    };
    enc_block.collect_params(ps);
    dec_block.collect_params(ps);
    return ps;
}

Tensor* PixelAnimeVAE::encode(Tape& tape, const uint8_t* indices, int B) {
    size_t total = static_cast<size_t>(B) * CLIP_FRAMES * BASE_H * BASE_W;
    std::vector<int> idx_int(total);
    for (size_t i = 0; i < total; ++i) idx_int[i] = static_cast<int>(indices[i]);

    Tensor* emb = ops::embedding(tape, idx_int.data(), {B * CLIP_FRAMES, BASE_H, BASE_W}, &palette_emb);
    Tensor* s2d = ops::space_to_depth(tape, emb, 2); // [B*16, 32, 32, 32]
    s2d = ops::reshape(tape, s2d, {B, 16, 32, 32, 32});
    Tensor* ft = fold_t2(tape, s2d); // [B, 8, 32, 32, 64]
    Tensor* h = ops::linear(tape, ft, &enc_in_w, &enc_in_b); // [B, 8, 32, 32, 36]
    h = enc_block.forward(tape, h);
    h = ops::layernorm(tape, h);
    Tensor* raw_z = ops::linear(tape, h, &to_lat_w, &to_lat_b); // [B, 8, 32, 32, 8]
    return ops::tanh_scaled(tape, raw_z, 1.0f);
}

Tensor* PixelAnimeVAE::decode_logits(Tape& tape, Tensor* z) {
    int B = z->shape[0];
    Tensor* h = ops::linear(tape, z, &from_lat_w, &from_lat_b); // [B, 8, 32, 32, 36]
    h = dec_block.forward(tape, h);
    h = ops::silu(tape, h);
    Tensor* ht = ops::linear(tape, h, &dec_t_w, &dec_t_b); // [B, 8, 32, 32, 72]
    Tensor* u = unfold_t2(tape, ht); // [B, 16, 32, 32, 36]
    u = ops::silu(tape, u);
    Tensor* sub = ops::linear(tape, u, &dec_sub_w, &dec_sub_b); // [B, 16, 32, 32, 4*20=80]
    sub = ops::reshape(tape, sub, {B * 16, 32, 32, 4 * 20});
    Tensor* pix = ops::depth_to_space(tape, sub, 2); // [B*16, 64, 64, 20]
    pix = ops::silu(tape, pix);
    Tensor* logits = ops::linear(tape, pix, &dec_head_w, &dec_head_b); // [B*16, 64, 64, 48]
    return ops::reshape(tape, logits, {B * 16 * 64 * 64, PALETTE_SIZE});
}

void PixelAnimeVAE::decode_to_indices(const float* z_data, int B, uint8_t* out_indices) {
    Tape tape(false);
    Tensor* z = tape.alloc({B, LATENT_T, LATENT_H, LATENT_W, LATENT_C}, false);
    std::memcpy(z->data.data(), z_data, static_cast<size_t>(B * LATENT_DIM) * sizeof(float));
    Tensor* logits = decode_logits(tape, z);
    int N = B * CLIP_FRAMES * BASE_H * BASE_W;
    const float* lp = logits->data.data();

    #pragma omp parallel for schedule(static)
    for (int i = 0; i < N; ++i) {
        const float* row = lp + static_cast<size_t>(i) * PALETTE_SIZE;
        int best_k = 0;
        float best_v = row[0];
        for (int k = 1; k < PALETTE_SIZE; ++k) {
            if (row[k] > best_v) {
                best_v = row[k];
                best_k = k;
            }
        }
        out_indices[i] = static_cast<uint8_t>(best_k);
    }
}

// ================= DiTBlock =================

void DiTBlock::init(int dim, int heads, int mlp_dim, RNG& rng) {
    D = dim;
    H = heads;
    MlpD = mlp_dim;

    adaln_w = Tensor({D, 6 * D}, true);
    adaln_b = Tensor({6 * D}, true);
    for (int d = 0; d < D; ++d) {
        adaln_b.data[2 * D + d] = 0.05f;
        adaln_b.data[5 * D + d] = 0.05f;
    }

    q_w = Tensor({D, D}, true); rng.xavier(q_w);
    q_b = Tensor({D}, true);
    k_w = Tensor({D, D}, true); rng.xavier(k_w);
    k_b = Tensor({D}, true);
    v_w = Tensor({D, D}, true); rng.xavier(v_w);
    v_b = Tensor({D}, true);
    proj_w = Tensor({D, D}, true); rng.xavier(proj_w, 0.6f);
    proj_b = Tensor({D}, true);

    xln_q_g = Tensor({D}, true); std::fill(xln_q_g.data.begin(), xln_q_g.data.end(), 1.0f);
    xln_q_b = Tensor({D}, true);
    xq_w = Tensor({D, D}, true); rng.xavier(xq_w);
    xq_b = Tensor({D}, true);
    xk_w = Tensor({D, D}, true); rng.xavier(xk_w);
    xk_b = Tensor({D}, true);
    xv_w = Tensor({D, D}, true); rng.xavier(xv_w);
    xv_b = Tensor({D}, true);
    xproj_w = Tensor({D, D}, true); rng.xavier(xproj_w, 0.4f);
    xproj_b = Tensor({D}, true);

    mlp_w1 = Tensor({D, MlpD}, true); rng.xavier(mlp_w1);
    mlp_b1 = Tensor({MlpD}, true);
    mlp_w2 = Tensor({MlpD, D}, true); rng.xavier(mlp_w2, 0.6f);
    mlp_b2 = Tensor({D}, true);
}

void DiTBlock::collect_params(std::vector<Tensor*>& out) {
    out.insert(out.end(), {
        &adaln_w, &adaln_b,
        &q_w, &q_b, &k_w, &k_b, &v_w, &v_b, &proj_w, &proj_b,
        &xln_q_g, &xln_q_b, &xq_w, &xq_b, &xk_w, &xk_b, &xv_w, &xv_b, &xproj_w, &xproj_b,
        &mlp_w1, &mlp_b1, &mlp_w2, &mlp_b2
    });
}

Tensor* DiTBlock::forward(
    Tape& tape,
    Tensor* X,
    Tensor* Zprev_tok,
    Tensor* Cond_tok,
    Tensor* Cond_vec,
    const float* q_cos,
    const float* q_sin,
    const float* k_cos,
    const float* k_sin,
    std::vector<float>* attn_capture
) {
    Tensor* c_act = ops::silu(tape, Cond_vec);
    Tensor* mods = ops::linear(tape, c_act, &adaln_w, &adaln_b);
    Tensor* shift_sa  = slice_last(tape, mods, 0 * D, D);
    Tensor* scale_sa  = slice_last(tape, mods, 1 * D, D);
    Tensor* gate_sa   = slice_last(tape, mods, 2 * D, D);
    Tensor* shift_mlp = slice_last(tape, mods, 3 * D, D);
    Tensor* scale_mlp = slice_last(tape, mods, 4 * D, D);
    Tensor* gate_mlp  = slice_last(tape, mods, 5 * D, D);

    Tensor* h1 = ops::layernorm(tape, X);
    h1 = ops::scale_mod(tape, h1, scale_sa);
    h1 = ops::add_mod(tape, h1, shift_sa);

    Tensor* prev_norm = ops::layernorm(tape, Zprev_tok);
    Tensor* kv_in = ops::concat_axis1(tape, prev_norm, h1);

    Tensor* Q = ops::linear(tape, h1, &q_w, &q_b);
    Tensor* K = ops::linear(tape, kv_in, &k_w, &k_b);
    Tensor* V = ops::linear(tape, kv_in, &v_w, &v_b);

    Tensor* sa = ops::multihead_attention(tape, Q, K, V, H, q_cos, q_sin, k_cos, k_sin, attn_capture);
    sa = ops::linear(tape, sa, &proj_w, &proj_b);
    sa = ops::gate_mod(tape, sa, gate_sa);
    Tensor* X1 = ops::add(tape, X, sa);

    Tensor* xh = ops::layernorm(tape, X1, &xln_q_g, &xln_q_b);
    Tensor* xQ = ops::linear(tape, xh, &xq_w, &xq_b);
    Tensor* xK = ops::linear(tape, Cond_tok, &xk_w, &xk_b);
    Tensor* xV = ops::linear(tape, Cond_tok, &xv_w, &xv_b);
    Tensor* xa = ops::multihead_attention(tape, xQ, xK, xV, H);
    xa = ops::linear(tape, xa, &xproj_w, &xproj_b);
    Tensor* X2 = ops::add(tape, X1, xa);

    Tensor* h2 = ops::layernorm(tape, X2);
    h2 = ops::scale_mod(tape, h2, scale_mlp);
    h2 = ops::add_mod(tape, h2, shift_mlp);
    Tensor* m = ops::linear(tape, h2, &mlp_w1, &mlp_b1);
    m = ops::gelu(tape, m);
    m = ops::linear(tape, m, &mlp_w2, &mlp_b2);
    m = ops::gate_mod(tape, m, gate_mlp);
    return ops::add(tape, X2, m);
}

// ================= SakugaDiT =================

void SakugaDiT::init(uint32_t seed) {
    RNG rng(seed);
    x_embed_w = Tensor({PATCH_C, D}, true); rng.xavier(x_embed_w);
    x_embed_b = Tensor({D}, true);

    prev_embed_w = Tensor({PATCH_C, D}, true); rng.xavier(prev_embed_w);
    prev_embed_b = Tensor({D}, true);
    bos_prev_tok = Tensor({16, D}, true); rng.normal(bos_prev_tok.data, 0.0f, 0.02f);

    attr_emb = Tensor({64, D}, true); rng.normal(attr_emb.data, 0.0f, 0.04f);
    text_emb = Tensor({TEXT_VOCAB_SIZE, D}, true); rng.normal(text_emb.data, 0.0f, 0.04f);
    cond_pos_emb = Tensor({NUM_COND_TOKENS, D}, true); rng.normal(cond_pos_emb.data, 0.0f, 0.02f);
    prev_flag_emb = Tensor({2, D}, true); rng.normal(prev_flag_emb.data, 0.0f, 0.03f);

    t_mlp_w1 = Tensor({D, D}, true); rng.xavier(t_mlp_w1);
    t_mlp_b1 = Tensor({D}, true);
    t_mlp_w2 = Tensor({D, D}, true); rng.xavier(t_mlp_w2);
    t_mlp_b2 = Tensor({D}, true);

    blocks.resize(DEPTH);
    for (int i = 0; i < DEPTH; ++i) {
        blocks[i].init(D, HEADS, MLP_D, rng);
    }

    final_adaln_w = Tensor({D, 2 * D}, true);
    final_adaln_b = Tensor({2 * D}, true);
    final_out_w = Tensor({D, PATCH_C}, true); rng.xavier(final_out_w, 0.1f);
    final_out_b = Tensor({PATCH_C}, true);

    rope_q_cos.resize(128 * 18);
    rope_q_sin.resize(128 * 18);
    int idx = 0;
    for (int t = 1; t <= 8; ++t) {
        for (int y = 0; y < 4; ++y) {
            for (int x = 0; x < 4; ++x) {
                fill_3d_rope_entry(t, y, x, &rope_q_cos[idx * 18], &rope_q_sin[idx * 18]);
                ++idx;
            }
        }
    }

    rope_k_cos.resize(144 * 18);
    rope_k_sin.resize(144 * 18);
    int kidx = 0;
    for (int y = 0; y < 4; ++y) {
        for (int x = 0; x < 4; ++x) {
            fill_3d_rope_entry(0, y, x, &rope_k_cos[kidx * 18], &rope_k_sin[kidx * 18]);
            ++kidx;
        }
    }
    std::memcpy(&rope_k_cos[16 * 18], rope_q_cos.data(), 128 * 18 * sizeof(float));
    std::memcpy(&rope_k_sin[16 * 18], rope_q_sin.data(), 128 * 18 * sizeof(float));
}

std::vector<Tensor*> SakugaDiT::parameters() {
    std::vector<Tensor*> ps = {
        &x_embed_w, &x_embed_b,
        &prev_embed_w, &prev_embed_b, &bos_prev_tok,
        &attr_emb, &text_emb, &cond_pos_emb, &prev_flag_emb,
        &t_mlp_w1, &t_mlp_b1, &t_mlp_w2, &t_mlp_b2,
        &final_adaln_w, &final_adaln_b, &final_out_w, &final_out_b
    };
    for (auto& blk : blocks) blk.collect_params(ps);
    return ps;
}

Tensor* SakugaDiT::forward(
    Tape& tape,
    Tensor* z_t,
    const float* tau,
    const int* cond_ids,
    const int* drop_cond,
    const float* z_prev_frame,
    const int* has_prev,
    bool capture_attn
) {
    int B = z_t->shape[0];
    size_t fsz = LATENT_H * LATENT_W * LATENT_C; // 16*16*12 = 3072

    // 1. Patchify z_t: [B, 8, 32, 32, 8] -> space_to_depth(8) -> [B, 128, 512]
    Tensor* z_flat2d = ops::reshape(tape, z_t, {B * LATENT_T, LATENT_H, LATENT_W, LATENT_C});
    Tensor* z_patched = ops::space_to_depth(tape, z_flat2d, 8); // [B*8, 4, 4, 512]
    z_patched = ops::reshape(tape, z_patched, {B, 128, PATCH_C});
    Tensor* X = ops::linear(tape, z_patched, &x_embed_w, &x_embed_b); // [B, 128, D]

    // 2. Build previous-frame context tokens Zprev_tok: [B, 16, D]
    Tensor* Zprev_in = tape.alloc({B, LATENT_H, LATENT_W, LATENT_C}, false);
    for (int b = 0; b < B; ++b) {
        if (z_prev_frame && has_prev && has_prev[b] == 1) {
            std::memcpy(
                Zprev_in->data.data() + static_cast<size_t>(b) * fsz,
                z_prev_frame + static_cast<size_t>(b) * fsz,
                fsz * sizeof(float)
            );
        }
    }
    Tensor* zp_patch = ops::space_to_depth(tape, Zprev_in, 8); // [B, 4, 4, 512]
    zp_patch = ops::reshape(tape, zp_patch, {B, 16, PATCH_C});
    Tensor* zp_proj = ops::linear(tape, zp_patch, &prev_embed_w, &prev_embed_b); // [B, 16, D]

    Tensor* Zprev_tok = tape.alloc({B, 16, D}, zp_proj->requires_grad || bos_prev_tok.requires_grad);
    for (int b = 0; b < B; ++b) {
        bool hp = (z_prev_frame && has_prev && has_prev[b] == 1);
        float* dst = Zprev_tok->data.data() + static_cast<size_t>(b) * 16 * D;
        const float* src = hp
            ? (zp_proj->data.data() + static_cast<size_t>(b) * 16 * D)
            : bos_prev_tok.data.data();
        std::memcpy(dst, src, static_cast<size_t>(16 * D) * sizeof(float));
    }
    if (tape.record && Zprev_tok->requires_grad) {
        std::vector<int> hp_vec(B, 0);
        for (int b = 0; b < B; ++b) hp_vec[b] = (z_prev_frame && has_prev && has_prev[b] == 1) ? 1 : 0;
        Tensor* bos_ptr = &bos_prev_tok;
        tape.add_op([Zprev_tok, zp_proj, bos_ptr, B, hp_vec]() {
            for (int b = 0; b < B; ++b) {
                const float* dy = Zprev_tok->grad.data() + static_cast<size_t>(b) * 16 * D;
                float* dst = (hp_vec[b] == 1)
                    ? (zp_proj->grad.data() + static_cast<size_t>(b) * 16 * D)
                    : bos_ptr->grad.data();
                #pragma omp simd
                for (int i = 0; i < 16 * D; ++i) dst[i] += dy[i];
            }
        });
    }

    // 3. Build Conditioning Sequence [B, NUM_COND_TOKENS, D]
    std::vector<int> attr_idx(B * 7);
    std::vector<int> word_idx(B * 5);
    for (int b = 0; b < B; ++b) {
        bool dropped = (drop_cond && drop_cond[b] == 1);
        for (int j = 0; j < 7; ++j) {
            attr_idx[b * 7 + j] = dropped ? 63 : std::clamp(cond_ids[b * NUM_COND_TOKENS + j], 0, 62);
        }
        for (int j = 0; j < 5; ++j) {
            word_idx[b * 5 + j] = dropped ? 0 : std::clamp(cond_ids[b * NUM_COND_TOKENS + 7 + j], 0, TEXT_VOCAB_SIZE - 1);
        }
    }
    Tensor* a_tok = ops::embedding(tape, attr_idx.data(), {B, 7}, &attr_emb);
    Tensor* w_tok = ops::embedding(tape, word_idx.data(), {B, 5}, &text_emb);
    Tensor* c_seq = ops::concat_axis1(tape, a_tok, w_tok);

    std::vector<int> pos_ids(B * NUM_COND_TOKENS);
    for (int b = 0; b < B; ++b)
        for (int j = 0; j < NUM_COND_TOKENS; ++j) pos_ids[b * NUM_COND_TOKENS + j] = j;
    Tensor* c_pos = ops::embedding(tape, pos_ids.data(), {B, NUM_COND_TOKENS}, &cond_pos_emb);
    Tensor* Cond_tok = ops::add(tape, c_seq, c_pos);

    Tensor* t_sin = tape.alloc({B, D}, false);
    sinusoidal_timestep(tau, B, D, t_sin->data.data());
    Tensor* t_emb = ops::linear(tape, t_sin, &t_mlp_w1, &t_mlp_b1);
    t_emb = ops::silu(tape, t_emb);
    t_emb = ops::linear(tape, t_emb, &t_mlp_w2, &t_mlp_b2);

    Tensor* c_pool = mean_pool_axis1(tape, Cond_tok);
    std::vector<int> pf_ids(B, 0);
    for (int b = 0; b < B; ++b) pf_ids[b] = (z_prev_frame && has_prev && has_prev[b] == 1) ? 1 : 0;
    Tensor* pf_emb = ops::embedding(tape, pf_ids.data(), {B}, &prev_flag_emb);

    Tensor* Cond_vec = ops::add(tape, t_emb, c_pool);
    Cond_vec = ops::add(tape, Cond_vec, pf_emb);

    Tensor* h = X;
    for (int i = 0; i < DEPTH; ++i) {
        std::vector<float>* cap = (capture_attn && i == DEPTH - 1) ? &last_self_attn : nullptr;
        h = blocks[i].forward(
            tape, h, Zprev_tok, Cond_tok, Cond_vec,
            rope_q_cos.data(), rope_q_sin.data(),
            rope_k_cos.data(), rope_k_sin.data(),
            cap
        );
    }

    Tensor* fin_mod = ops::linear(tape, ops::silu(tape, Cond_vec), &final_adaln_w, &final_adaln_b);
    Tensor* fin_shift = slice_last(tape, fin_mod, 0, D);
    Tensor* fin_scale = slice_last(tape, fin_mod, D, D);
    h = ops::layernorm(tape, h);
    h = ops::scale_mod(tape, h, fin_scale);
    h = ops::add_mod(tape, h, fin_shift);

    Tensor* v_patch = ops::linear(tape, h, &final_out_w, &final_out_b); // [B, 128, 512]
    v_patch = ops::reshape(tape, v_patch, {B * LATENT_T, 4, 4, PATCH_C});
    Tensor* v_sp = ops::depth_to_space(tape, v_patch, 8); // [B*8, 32, 32, 8]
    Tensor* z1_hat = ops::reshape(tape, v_sp, {B, LATENT_T, LATENT_H, LATENT_W, LATENT_C});
    return ops::tanh_scaled(tape, z1_hat, 1.02f);
}

void SakugaDiT::sample_ode(
    const int* cond_ids_single,
    const float* z_prev_single,
    int has_prev_flag,
    int steps,
    float cfg_scale,
    int solver_type,
    uint32_t seed,
    float* out_z,
    float* out_trajectory,
    int num_snaps
) {
    steps = std::clamp(steps, 2, 100);
    RNG rng(seed);
    std::vector<float> z(LATENT_DIM);
    rng.normal(z, 0.0f, 1.0f);

    if (out_trajectory && num_snaps > 0) {
        std::memcpy(out_trajectory, z.data(), LATENT_DIM * sizeof(float));
    }

    bool use_cfg = (cfg_scale > 1.02f);
    int B_eval = use_cfg ? 2 : 1;

    int cond_batch[2 * NUM_COND_TOKENS];
    for (int j = 0; j < NUM_COND_TOKENS; ++j) {
        cond_batch[j] = cond_ids_single[j];
        cond_batch[NUM_COND_TOKENS + j] = cond_ids_single[j];
    }
    int drop_batch[2] = {0, 1};
    int hp_batch[2] = {has_prev_flag, has_prev_flag};
    std::vector<float> z_prev_batch;
    if (z_prev_single && has_prev_flag == 1) {
        size_t fsz = LATENT_H * LATENT_W * LATENT_C;
        z_prev_batch.resize(B_eval * fsz);
        for (int b = 0; b < B_eval; ++b) {
            std::memcpy(&z_prev_batch[b * fsz], z_prev_single, fsz * sizeof(float));
        }
    }

    float dt = 1.0f / static_cast<float>(steps);

    // x1-parameterized Rectified Flow velocity: v(z, tau) = (z1_hat_CFG(z, tau) - z) / max(1 - tau, dt)
    auto eval_velocity = [&](const std::vector<float>& z_cur, float t_val, std::vector<float>& v_out, bool cap) {
        Tape tape(false);
        Tensor* z_in = tape.alloc({B_eval, LATENT_T, LATENT_H, LATENT_W, LATENT_C}, false);
        for (int b = 0; b < B_eval; ++b) {
            std::memcpy(z_in->data.data() + b * LATENT_DIM, z_cur.data(), LATENT_DIM * sizeof(float));
        }
        float taus[2] = {t_val, t_val};
        Tensor* z1_pred = forward(
            tape, z_in, taus, cond_batch, drop_batch,
            z_prev_batch.empty() ? nullptr : z_prev_batch.data(),
            hp_batch, cap
        );
        float inv_rem = 1.0f / std::max(1.0f - t_val, dt);
        if (use_cfg) {
            const float* zc = z1_pred->data.data();
            const float* zu = z1_pred->data.data() + LATENT_DIM;
            #pragma omp simd
            for (int i = 0; i < LATENT_DIM; ++i) {
                float z1_g = std::clamp(zu[i] + cfg_scale * (zc[i] - zu[i]), -1.05f, 1.05f);
                v_out[i] = (z1_g - z_cur[i]) * inv_rem;
            }
        } else {
            const float* zc = z1_pred->data.data();
            #pragma omp simd
            for (int i = 0; i < LATENT_DIM; ++i) {
                v_out[i] = (zc[i] - z_cur[i]) * inv_rem;
            }
        }
    };

    std::vector<float> v1(LATENT_DIM), v2(LATENT_DIM), z_mid(LATENT_DIM);

    for (int s = 0; s < steps; ++s) {
        float t0 = static_cast<float>(s) * dt;
        bool is_last = (s == steps - 1);
        eval_velocity(z, t0, v1, is_last);

        if (solver_type == 1 && !is_last) {
            #pragma omp simd
            for (int i = 0; i < LATENT_DIM; ++i) z_mid[i] = z[i] + dt * v1[i];
            eval_velocity(z_mid, t0 + dt, v2, false);
            #pragma omp simd
            for (int i = 0; i < LATENT_DIM; ++i) z[i] += 0.5f * dt * (v1[i] + v2[i]);
        } else {
            #pragma omp simd
            for (int i = 0; i < LATENT_DIM; ++i) z[i] += dt * v1[i];
        }

        if (out_trajectory && num_snaps > 1) {
            for (int snap = 1; snap < num_snaps; ++snap) {
                int target_s = (snap * steps) / (num_snaps - 1) - 1;
                if (s == std::max(0, target_s)) {
                    std::memcpy(out_trajectory + static_cast<size_t>(snap) * LATENT_DIM, z.data(), LATENT_DIM * sizeof(float));
                }
            }
        }
    }

    for (int i = 0; i < LATENT_DIM; ++i) {
        z[i] = std::clamp(z[i], -1.15f, 1.15f);
    }
    std::memcpy(out_z, z.data(), LATENT_DIM * sizeof(float));
    if (out_trajectory && num_snaps > 1) {
        std::memcpy(out_trajectory + static_cast<size_t>(num_snaps - 1) * LATENT_DIM, z.data(), LATENT_DIM * sizeof(float));
    }
}

void build_cond_tokens(const AnimeSpec& spec, const int* word_ids5, int* out_cond12) {
    out_cond12[0] = 0  + (spec.hero_id % 6);
    out_cond12[1] = 8  + (spec.scene_id % 6);
    out_cond12[2] = 16 + (spec.time_id % 4);
    out_cond12[3] = 22 + (spec.framing_id % 4);
    out_cond12[4] = 28 + (spec.action_id % 6);
    out_cond12[5] = 36 + (spec.camera_id % 4);
    out_cond12[6] = 42 + (spec.fx_id % 5);
    for (int i = 0; i < 5; ++i) {
        out_cond12[7 + i] = word_ids5 ? std::clamp(word_ids5[i], 0, TEXT_VOCAB_SIZE - 1) : 0;
    }
}

bool save_checkpoint(const std::string& path, PixelAnimeVAE& vae, SakugaDiT& dit, int vae_steps, int dit_steps) {
    std::ofstream f(path, std::ios::binary);
    if (!f) return false;
    const char magic[8] = {'S', 'A', 'K', 'U', 'G', 'A', '0', '2'};
    f.write(magic, 8);
    f.write(reinterpret_cast<const char*>(&vae_steps), sizeof(int));
    f.write(reinterpret_cast<const char*>(&dit_steps), sizeof(int));

    auto write_params = [&](const std::vector<Tensor*>& ps) {
        uint32_t count = static_cast<uint32_t>(ps.size());
        f.write(reinterpret_cast<const char*>(&count), sizeof(uint32_t));
        for (Tensor* p : ps) {
            uint32_t n = static_cast<uint32_t>(p->numel());
            f.write(reinterpret_cast<const char*>(&n), sizeof(uint32_t));
            f.write(reinterpret_cast<const char*>(p->data.data()), n * sizeof(float));
        }
    };

    write_params(vae.parameters());
    write_params(dit.parameters());
    return f.good();
}

bool load_checkpoint(const std::string& path, PixelAnimeVAE& vae, SakugaDiT& dit, int* vae_steps, int* dit_steps) {
    std::ifstream f(path, std::ios::binary);
    if (!f) return false;
    char magic[8] = {};
    f.read(magic, 8);
    if (std::memcmp(magic, "SAKUGA02", 8) != 0) return false;
    int vs = 0, ds = 0;
    f.read(reinterpret_cast<char*>(&vs), sizeof(int));
    f.read(reinterpret_cast<char*>(&ds), sizeof(int));
    if (vae_steps) *vae_steps = vs;
    if (dit_steps) *dit_steps = ds;

    auto read_params = [&](const std::vector<Tensor*>& ps) -> bool {
        uint32_t count = 0;
        f.read(reinterpret_cast<char*>(&count), sizeof(uint32_t));
        if (count != ps.size()) return false;
        for (Tensor* p : ps) {
            uint32_t n = 0;
            f.read(reinterpret_cast<char*>(&n), sizeof(uint32_t));
            if (n != p->numel()) return false;
            f.read(reinterpret_cast<char*>(p->data.data()), n * sizeof(float));
        }
        return f.good();
    };

    if (!read_params(vae.parameters())) return false;
    if (!read_params(dit.parameters())) return false;
    return true;
}

} // namespace sakuga
