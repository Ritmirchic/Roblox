#pragma once

#include <cmath>
#include <cstdint>
#include <cstring>
#include <functional>
#include <memory>
#include <random>
#include <string>
#include <vector>

namespace sakuga {

struct Tensor {
    std::vector<int> shape;
    std::vector<float> data;
    std::vector<float> grad;
    bool requires_grad = false;

    Tensor() = default;
    Tensor(const std::vector<int>& s, bool req_grad = false)
        : shape(s), requires_grad(req_grad) {
        size_t n = numel();
        data.assign(n, 0.0f);
        if (req_grad) {
            grad.assign(n, 0.0f);
        }
    }

    size_t numel() const {
        if (shape.empty()) return 0;
        size_t p = 1;
        for (int d : shape) p *= static_cast<size_t>(d);
        return p;
    }

    void zero_grad() {
        if (requires_grad) {
            std::fill(grad.begin(), grad.end(), 0.0f);
        }
    }
};

struct Tape {
    bool record = true;
    std::vector<std::unique_ptr<Tensor>> arena;
    std::vector<std::function<void()>> backward_ops;

    explicit Tape(bool rec = true) : record(rec) {
        arena.reserve(256);
        if (rec) backward_ops.reserve(256);
    }

    Tensor* alloc(const std::vector<int>& shape, bool req_grad = false) {
        auto t = std::make_unique<Tensor>(shape, req_grad && record);
        Tensor* ptr = t.get();
        arena.push_back(std::move(t));
        return ptr;
    }

    void add_op(std::function<void()> fn) {
        if (record) {
            backward_ops.push_back(std::move(fn));
        }
    }

    void backward(Tensor* loss) {
        if (!record || !loss || !loss->requires_grad) return;
        if (loss->grad.empty()) loss->grad.assign(loss->numel(), 0.0f);
        loss->grad[0] = 1.0f;
        for (int i = static_cast<int>(backward_ops.size()) - 1; i >= 0; --i) {
            backward_ops[i]();
        }
    }
};

// Parameter initialization utilities
struct RNG {
    std::mt19937 gen;
    explicit RNG(uint32_t seed = 42) : gen(seed) {}

    void normal(std::vector<float>& buf, float mean = 0.0f, float std_dev = 0.02f) {
        std::normal_distribution<float> dist(mean, std_dev);
        for (float& v : buf) v = dist(gen);
    }

    void xavier(Tensor& t, float gain = 1.0f) {
        int fan_in = t.shape.size() >= 2 ? t.shape[0] : static_cast<int>(t.numel());
        int fan_out = t.shape.size() >= 2 ? t.shape.back() : static_cast<int>(t.numel());
        float std_dev = gain * std::sqrt(2.0f / static_cast<float>(fan_in + fan_out));
        normal(t.data, 0.0f, std_dev);
    }
};

// AdamW + EMA Optimizer
struct AdamW {
    std::vector<Tensor*> params;
    std::vector<std::vector<float>> m;
    std::vector<std::vector<float>> v;
    std::vector<std::vector<float>> ema;
    std::vector<std::vector<float>> backup;
    int step_count = 0;
    float beta1 = 0.9f;
    float beta2 = 0.995f;
    float eps = 1e-8f;
    float weight_decay = 1e-4f;
    float ema_decay = 0.992f;
    bool using_ema = false;

    void register_params(const std::vector<Tensor*>& ps) {
        params = ps;
        m.resize(ps.size());
        v.resize(ps.size());
        ema.resize(ps.size());
        backup.resize(ps.size());
        for (size_t i = 0; i < ps.size(); ++i) {
            size_t n = ps[i]->numel();
            m[i].assign(n, 0.0f);
            v[i].assign(n, 0.0f);
            ema[i] = ps[i]->data;
            backup[i].resize(n);
        }
    }

    void sync_ema_from_weights() {
        for (size_t i = 0; i < params.size(); ++i) {
            ema[i] = params[i]->data;
        }
    }

    void zero_grad() {
        for (Tensor* p : params) p->zero_grad();
    }

    float step(float lr, float max_grad_norm = 1.0f);

    void swap_to_ema() {
        if (using_ema) return;
        for (size_t i = 0; i < params.size(); ++i) {
            backup[i] = params[i]->data;
            params[i]->data = ema[i];
        }
        using_ema = true;
    }

    void restore_from_ema() {
        if (!using_ema) return;
        for (size_t i = 0; i < params.size(); ++i) {
            params[i]->data = backup[i];
        }
        using_ema = false;
    }
};

// Core differentiable operators
namespace ops {

// Y[..., Out] = X[..., In] @ W[In, Out] + b[Out] (b optional)
Tensor* linear(Tape& tape, Tensor* X, Tensor* W, Tensor* b = nullptr);

// Elementwise ops
Tensor* add(Tape& tape, Tensor* A, Tensor* B);
// X[B, N, D] + S[B, D] (broadcast across middle dim N)
Tensor* add_mod(Tape& tape, Tensor* X, Tensor* S);
// X[B, N, D] * (1.0f + S[B, D]) (AdaLN scale modulation)
Tensor* scale_mod(Tape& tape, Tensor* X, Tensor* S);
// X[B, N, D] * G[B, D] (AdaLN gate modulation)
Tensor* gate_mod(Tape& tape, Tensor* X, Tensor* G);

Tensor* silu(Tape& tape, Tensor* X);
Tensor* gelu(Tape& tape, Tensor* X);
Tensor* tanh_scaled(Tape& tape, Tensor* X, float scale = 1.0f);

// LayerNorm over last dim D. gamma & beta [D] optional (can be nullptr for AdaLN)
Tensor* layernorm(Tape& tape, Tensor* X, Tensor* gamma = nullptr, Tensor* beta = nullptr, float eps = 1e-5f);

// Embedding lookup: indices[N] -> Out[N, D] from table[V, D]
Tensor* embedding(Tape& tape, const int* indices, const std::vector<int>& out_prefix_shape, Tensor* table);

// Replicate-padded 3x3 2D convolution on X[N_frames, H, W, Cin] with W[9*Cin, Cout], b[Cout]
Tensor* conv2d_3x3(Tape& tape, Tensor* X, Tensor* W, Tensor* b = nullptr);

// Replicate-padded 3-tap 1D temporal convolution on X[B, T, S, Cin] with W[3*Cin, Cout], b[Cout]
Tensor* conv1d_t3(Tape& tape, Tensor* X, Tensor* W, Tensor* b = nullptr);

// Space-to-depth and depth-to-space on X[N, H, W, C]
Tensor* space_to_depth(Tape& tape, Tensor* X, int p);
Tensor* depth_to_space(Tape& tape, Tensor* X, int p);

// 3D 2x2x2 block fold / unfold on X[B, T, H, W, C]
Tensor* fold3d_2x2x2(Tape& tape, Tensor* X);
Tensor* unfold3d_2x2x2(Tape& tape, Tensor* X);

// Reshape view (copies data cleanly on tape; cheap for compact latents)
Tensor* reshape(Tape& tape, Tensor* X, const std::vector<int>& new_shape);

// Transpose middle two axes of 4D tensor: [B, A, C, D] -> [B, C, A, D]
Tensor* transpose_12(Tape& tape, Tensor* X);

// Concatenate along axis 1 for 3D tensors: A[B, N1, D], B[B, N2, D] -> Out[B, N1+N2, D]
Tensor* concat_axis1(Tape& tape, Tensor* A, Tensor* B);

// Multi-head attention on Q[B, Nq, D], K[B, Nk, D], V[B, Nk, D] where D = H * Dh.
// Optional RoPE cos/sin tables: q_cos/q_sin [Nq, Dh/2], k_cos/k_sin [Nk, Dh/2].
// Optional attention output map capture (last call averaged over heads) if attn_out != nullptr.
Tensor* multihead_attention(
    Tape& tape,
    Tensor* Q,
    Tensor* K,
    Tensor* V,
    int H,
    const float* q_cos = nullptr,
    const float* q_sin = nullptr,
    const float* k_cos = nullptr,
    const float* k_sin = nullptr,
    std::vector<float>* attn_capture = nullptr
);

// Weighted Cross-Entropy on logits[N, K] vs uint8 targets[N] with class_weights[K]
Tensor* weighted_cross_entropy(
    Tape& tape,
    Tensor* logits,
    const uint8_t* targets,
    const float* class_weights,
    int* correct_count = nullptr
);

// Mean Squared Error on pred[...] vs target[...]
Tensor* mse_loss(Tape& tape, Tensor* pred, Tensor* target);

} // namespace ops
} // namespace sakuga
