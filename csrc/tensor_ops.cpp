#include "sakuga_core.hpp"
#include <algorithm>
#include <omp.h>

namespace sakuga {

float AdamW::step(float lr, float max_grad_norm) {
    step_count += 1;
    double sq_norm = 0.0;
    for (Tensor* p : params) {
        if (!p->requires_grad) continue;
        const float* g = p->grad.data();
        size_t n = p->numel();
        double local = 0.0;
        #pragma omp simd reduction(+:local)
        for (size_t i = 0; i < n; ++i) {
            local += static_cast<double>(g[i]) * static_cast<double>(g[i]);
        }
        sq_norm += local;
    }
    float grad_norm = static_cast<float>(std::sqrt(sq_norm));
    float clip_coef = 1.0f;
    if (max_grad_norm > 0.0f && grad_norm > max_grad_norm) {
        clip_coef = max_grad_norm / (grad_norm + 1e-6f);
    }

    float bc1 = 1.0f - std::pow(beta1, static_cast<float>(step_count));
    float bc2 = 1.0f - std::pow(beta2, static_cast<float>(step_count));
    float cur_ema = std::min(ema_decay, (1.0f + static_cast<float>(step_count)) / (10.0f + static_cast<float>(step_count)));

    for (size_t pi = 0; pi < params.size(); ++pi) {
        Tensor* p = params[pi];
        if (!p->requires_grad) continue;
        size_t n = p->numel();
        float* w = p->data.data();
        const float* g = p->grad.data();
        float* pm = m[pi].data();
        float* pv = v[pi].data();
        float* pema = ema[pi].data();
        // Do not decay 1D bias/norm tensors
        float wd = (p->shape.size() >= 2) ? weight_decay : 0.0f;

        #pragma omp parallel for schedule(static) if(n > 4096)
        for (size_t i = 0; i < n; ++i) {
            float gi = std::clamp(g[i] * clip_coef, -10.0f, 10.0f);
            pm[i] = beta1 * pm[i] + (1.0f - beta1) * gi;
            pv[i] = beta2 * pv[i] + (1.0f - beta2) * gi * gi;
            float m_hat = pm[i] / bc1;
            float v_hat = pv[i] / bc2;
            w[i] -= lr * (m_hat / (std::sqrt(v_hat) + eps) + wd * w[i]);
            pema[i] = cur_ema * pema[i] + (1.0f - cur_ema) * w[i];
        }
    }
    return grad_norm;
}

namespace ops {

Tensor* linear(Tape& tape, Tensor* X, Tensor* W, Tensor* b) {
    int In = W->shape[0];
    int Out = W->shape[1];
    size_t total_x = X->numel();
    int M = static_cast<int>(total_x / static_cast<size_t>(In));

    std::vector<int> out_shape = X->shape;
    out_shape.back() = Out;
    bool req = (X->requires_grad || W->requires_grad || (b && b->requires_grad));
    Tensor* Y = tape.alloc(out_shape, req);

    const float* xp = X->data.data();
    const float* wp = W->data.data();
    const float* bp = b ? b->data.data() : nullptr;
    float* yp = Y->data.data();

    int64_t flops = static_cast<int64_t>(M) * In * Out;
    #pragma omp parallel for schedule(static) if(flops > 65536)
    for (int m = 0; m < M; ++m) {
        float* ym = yp + static_cast<size_t>(m) * Out;
        if (bp) {
            std::memcpy(ym, bp, static_cast<size_t>(Out) * sizeof(float));
        } else {
            std::memset(ym, 0, static_cast<size_t>(Out) * sizeof(float));
        }
        const float* xm = xp + static_cast<size_t>(m) * In;
        for (int k = 0; k < In; ++k) {
            float xmk = xm[k];
            const float* wk = wp + static_cast<size_t>(k) * Out;
            #pragma omp simd
            for (int n = 0; n < Out; ++n) {
                ym[n] += xmk * wk[n];
            }
        }
    }

    if (tape.record && req) {
        tape.add_op([X, W, b, Y, M, In, Out]() {
            const float* dyp = Y->grad.data();
            int64_t b_flops = static_cast<int64_t>(M) * In * Out;
            if (X->requires_grad) {
                float* dxp = X->grad.data();
                const float* wp_b = W->data.data();
                #pragma omp parallel for schedule(static) if(b_flops > 65536)
                for (int m = 0; m < M; ++m) {
                    const float* dym = dyp + static_cast<size_t>(m) * Out;
                    float* dxm = dxp + static_cast<size_t>(m) * In;
                    for (int k = 0; k < In; ++k) {
                        const float* wk = wp_b + static_cast<size_t>(k) * Out;
                        float acc = 0.0f;
                        #pragma omp simd reduction(+:acc)
                        for (int n = 0; n < Out; ++n) {
                            acc += dym[n] * wk[n];
                        }
                        dxm[k] += acc;
                    }
                }
            }
            if (W->requires_grad) {
                float* dwp = W->grad.data();
                const float* xp_b = X->data.data();
                size_t w_sz = static_cast<size_t>(In) * Out;
                if (b_flops > 65536 && M >= 8) {
                    #pragma omp parallel
                    {
                        std::vector<float> local_dw(w_sz, 0.0f);
                        #pragma omp for schedule(static) nowait
                        for (int m = 0; m < M; ++m) {
                            const float* xm = xp_b + static_cast<size_t>(m) * In;
                            const float* dym = dyp + static_cast<size_t>(m) * Out;
                            for (int k = 0; k < In; ++k) {
                                float xmk = xm[k];
                                float* ldwk = local_dw.data() + static_cast<size_t>(k) * Out;
                                #pragma omp simd
                                for (int n = 0; n < Out; ++n) {
                                    ldwk[n] += xmk * dym[n];
                                }
                            }
                        }
                        #pragma omp critical
                        {
                            #pragma omp simd
                            for (size_t i = 0; i < w_sz; ++i) dwp[i] += local_dw[i];
                        }
                    }
                } else {
                    for (int m = 0; m < M; ++m) {
                        const float* xm = xp_b + static_cast<size_t>(m) * In;
                        const float* dym = dyp + static_cast<size_t>(m) * Out;
                        for (int k = 0; k < In; ++k) {
                            float xmk = xm[k];
                            float* dwk = dwp + static_cast<size_t>(k) * Out;
                            #pragma omp simd
                            for (int n = 0; n < Out; ++n) {
                                dwk[n] += xmk * dym[n];
                            }
                        }
                    }
                }
            }
            if (b && b->requires_grad) {
                float* dbp = b->grad.data();
                if (M > 512) {
                    #pragma omp parallel
                    {
                        std::vector<float> local_db(Out, 0.0f);
                        #pragma omp for schedule(static) nowait
                        for (int m = 0; m < M; ++m) {
                            const float* dym = dyp + static_cast<size_t>(m) * Out;
                            #pragma omp simd
                            for (int n = 0; n < Out; ++n) local_db[n] += dym[n];
                        }
                        #pragma omp critical
                        {
                            #pragma omp simd
                            for (int n = 0; n < Out; ++n) dbp[n] += local_db[n];
                        }
                    }
                } else {
                    for (int m = 0; m < M; ++m) {
                        const float* dym = dyp + static_cast<size_t>(m) * Out;
                        #pragma omp simd
                        for (int n = 0; n < Out; ++n) {
                            dbp[n] += dym[n];
                        }
                    }
                }
            }
        });
    }
    return Y;
}

Tensor* add(Tape& tape, Tensor* A, Tensor* B) {
    bool req = A->requires_grad || B->requires_grad;
    Tensor* Y = tape.alloc(A->shape, req);
    size_t n = A->numel();
    const float* ap = A->data.data();
    const float* bp = B->data.data();
    float* yp = Y->data.data();
    #pragma omp simd
    for (size_t i = 0; i < n; ++i) yp[i] = ap[i] + bp[i];

    if (tape.record && req) {
        tape.add_op([A, B, Y, n]() {
            const float* dy = Y->grad.data();
            if (A->requires_grad) {
                float* da = A->grad.data();
                #pragma omp simd
                for (size_t i = 0; i < n; ++i) da[i] += dy[i];
            }
            if (B->requires_grad) {
                float* db = B->grad.data();
                #pragma omp simd
                for (size_t i = 0; i < n; ++i) db[i] += dy[i];
            }
        });
    }
    return Y;
}

Tensor* add_mod(Tape& tape, Tensor* X, Tensor* S) {
    int B = X->shape[0];
    int N = X->shape[1];
    int D = X->shape[2];
    bool req = X->requires_grad || S->requires_grad;
    Tensor* Y = tape.alloc(X->shape, req);
    for (int b = 0; b < B; ++b) {
        const float* sb = S->data.data() + static_cast<size_t>(b) * D;
        for (int n = 0; n < N; ++n) {
            size_t off = (static_cast<size_t>(b) * N + n) * D;
            const float* xp = X->data.data() + off;
            float* yp = Y->data.data() + off;
            #pragma omp simd
            for (int d = 0; d < D; ++d) yp[d] = xp[d] + sb[d];
        }
    }
    if (tape.record && req) {
        tape.add_op([X, S, Y, B, N, D]() {
            for (int b = 0; b < B; ++b) {
                float* dsb = S->requires_grad ? (S->grad.data() + static_cast<size_t>(b) * D) : nullptr;
                for (int n = 0; n < N; ++n) {
                    size_t off = (static_cast<size_t>(b) * N + n) * D;
                    const float* dyp = Y->grad.data() + off;
                    if (X->requires_grad) {
                        float* dxp = X->grad.data() + off;
                        #pragma omp simd
                        for (int d = 0; d < D; ++d) dxp[d] += dyp[d];
                    }
                    if (dsb) {
                        #pragma omp simd
                        for (int d = 0; d < D; ++d) dsb[d] += dyp[d];
                    }
                }
            }
        });
    }
    return Y;
}

Tensor* scale_mod(Tape& tape, Tensor* X, Tensor* S) {
    int B = X->shape[0];
    int N = X->shape[1];
    int D = X->shape[2];
    bool req = X->requires_grad || S->requires_grad;
    Tensor* Y = tape.alloc(X->shape, req);
    for (int b = 0; b < B; ++b) {
        const float* sb = S->data.data() + static_cast<size_t>(b) * D;
        for (int n = 0; n < N; ++n) {
            size_t off = (static_cast<size_t>(b) * N + n) * D;
            const float* xp = X->data.data() + off;
            float* yp = Y->data.data() + off;
            #pragma omp simd
            for (int d = 0; d < D; ++d) yp[d] = xp[d] * (1.0f + sb[d]);
        }
    }
    if (tape.record && req) {
        tape.add_op([X, S, Y, B, N, D]() {
            for (int b = 0; b < B; ++b) {
                const float* sb = S->data.data() + static_cast<size_t>(b) * D;
                float* dsb = S->requires_grad ? (S->grad.data() + static_cast<size_t>(b) * D) : nullptr;
                for (int n = 0; n < N; ++n) {
                    size_t off = (static_cast<size_t>(b) * N + n) * D;
                    const float* xp = X->data.data() + off;
                    const float* dyp = Y->grad.data() + off;
                    if (X->requires_grad) {
                        float* dxp = X->grad.data() + off;
                        #pragma omp simd
                        for (int d = 0; d < D; ++d) dxp[d] += dyp[d] * (1.0f + sb[d]);
                    }
                    if (dsb) {
                        #pragma omp simd
                        for (int d = 0; d < D; ++d) dsb[d] += dyp[d] * xp[d];
                    }
                }
            }
        });
    }
    return Y;
}

Tensor* gate_mod(Tape& tape, Tensor* X, Tensor* G) {
    int B = X->shape[0];
    int N = X->shape[1];
    int D = X->shape[2];
    bool req = X->requires_grad || G->requires_grad;
    Tensor* Y = tape.alloc(X->shape, req);
    for (int b = 0; b < B; ++b) {
        const float* gb = G->data.data() + static_cast<size_t>(b) * D;
        for (int n = 0; n < N; ++n) {
            size_t off = (static_cast<size_t>(b) * N + n) * D;
            const float* xp = X->data.data() + off;
            float* yp = Y->data.data() + off;
            #pragma omp simd
            for (int d = 0; d < D; ++d) yp[d] = xp[d] * gb[d];
        }
    }
    if (tape.record && req) {
        tape.add_op([X, G, Y, B, N, D]() {
            for (int b = 0; b < B; ++b) {
                const float* gb = G->data.data() + static_cast<size_t>(b) * D;
                float* dgb = G->requires_grad ? (G->grad.data() + static_cast<size_t>(b) * D) : nullptr;
                for (int n = 0; n < N; ++n) {
                    size_t off = (static_cast<size_t>(b) * N + n) * D;
                    const float* xp = X->data.data() + off;
                    const float* dyp = Y->grad.data() + off;
                    if (X->requires_grad) {
                        float* dxp = X->grad.data() + off;
                        #pragma omp simd
                        for (int d = 0; d < D; ++d) dxp[d] += dyp[d] * gb[d];
                    }
                    if (dgb) {
                        #pragma omp simd
                        for (int d = 0; d < D; ++d) dgb[d] += dyp[d] * xp[d];
                    }
                }
            }
        });
    }
    return Y;
}

Tensor* silu(Tape& tape, Tensor* X) {
    bool req = X->requires_grad;
    Tensor* Y = tape.alloc(X->shape, req);
    size_t n = X->numel();
    const float* xp = X->data.data();
    float* yp = Y->data.data();
    #pragma omp parallel for schedule(static) if(n > 8192)
    for (size_t i = 0; i < n; ++i) {
        float x = xp[i];
        float sig = 1.0f / (1.0f + std::exp(-x));
        yp[i] = x * sig;
    }
    if (tape.record && req) {
        tape.add_op([X, Y, n]() {
            const float* xp_b = X->data.data();
            const float* dyp = Y->grad.data();
            float* dxp = X->grad.data();
            #pragma omp parallel for schedule(static) if(n > 8192)
            for (size_t i = 0; i < n; ++i) {
                float x = xp_b[i];
                float sig = 1.0f / (1.0f + std::exp(-x));
                float d = sig * (1.0f + x * (1.0f - sig));
                dxp[i] += dyp[i] * d;
            }
        });
    }
    return Y;
}

Tensor* gelu(Tape& tape, Tensor* X) {
    bool req = X->requires_grad;
    Tensor* Y = tape.alloc(X->shape, req);
    size_t n = X->numel();
    const float* xp = X->data.data();
    float* yp = Y->data.data();
    constexpr float kSqrt2Pi = 0.7978845608f;
    #pragma omp parallel for schedule(static) if(n > 8192)
    for (size_t i = 0; i < n; ++i) {
        float x = xp[i];
        float u = kSqrt2Pi * (x + 0.044715f * x * x * x);
        yp[i] = 0.5f * x * (1.0f + std::tanh(u));
    }
    if (tape.record && req) {
        tape.add_op([X, Y, n]() {
            const float* xp_b = X->data.data();
            const float* dyp = Y->grad.data();
            float* dxp = X->grad.data();
            constexpr float kSqrt2Pi_b = 0.7978845608f;
            #pragma omp parallel for schedule(static) if(n > 8192)
            for (size_t i = 0; i < n; ++i) {
                float x = xp_b[i];
                float u = kSqrt2Pi_b * (x + 0.044715f * x * x * x);
                float th = std::tanh(u);
                float sech2 = 1.0f - th * th;
                float du = kSqrt2Pi_b * (1.0f + 3.0f * 0.044715f * x * x);
                float d = 0.5f * (1.0f + th) + 0.5f * x * sech2 * du;
                dxp[i] += dyp[i] * d;
            }
        });
    }
    return Y;
}

Tensor* tanh_scaled(Tape& tape, Tensor* X, float scale) {
    bool req = X->requires_grad;
    Tensor* Y = tape.alloc(X->shape, req);
    size_t n = X->numel();
    const float* xp = X->data.data();
    float* yp = Y->data.data();
    for (size_t i = 0; i < n; ++i) {
        yp[i] = scale * std::tanh(xp[i] / scale);
    }
    if (tape.record && req) {
        tape.add_op([X, Y, n, scale]() {
            const float* yp_b = Y->data.data();
            const float* dyp = Y->grad.data();
            float* dxp = X->grad.data();
            for (size_t i = 0; i < n; ++i) {
                float th = yp_b[i] / scale;
                dxp[i] += dyp[i] * (1.0f - th * th);
            }
        });
    }
    return Y;
}

Tensor* layernorm(Tape& tape, Tensor* X, Tensor* gamma, Tensor* beta, float eps) {
    int D = X->shape.back();
    int M = static_cast<int>(X->numel() / static_cast<size_t>(D));
    bool req = X->requires_grad || (gamma && gamma->requires_grad) || (beta && beta->requires_grad);
    Tensor* Y = tape.alloc(X->shape, req);
    Tensor* Xhat = tape.alloc(X->shape, false);
    Tensor* Rstd = tape.alloc({M}, false);

    const float* xp = X->data.data();
    const float* gp = gamma ? gamma->data.data() : nullptr;
    const float* bp = beta ? beta->data.data() : nullptr;
    float* yp = Y->data.data();
    float* xhp = Xhat->data.data();
    float* rsp = Rstd->data.data();

    #pragma omp parallel for schedule(static) if(M > 64)
    for (int m = 0; m < M; ++m) {
        const float* xm = xp + static_cast<size_t>(m) * D;
        float* ym = yp + static_cast<size_t>(m) * D;
        float* xhm = xhp + static_cast<size_t>(m) * D;
        float sum = 0.0f;
        #pragma omp simd reduction(+:sum)
        for (int d = 0; d < D; ++d) sum += xm[d];
        float mean = sum / static_cast<float>(D);

        float vsum = 0.0f;
        #pragma omp simd reduction(+:vsum)
        for (int d = 0; d < D; ++d) {
            float diff = xm[d] - mean;
            vsum += diff * diff;
        }
        float rstd = 1.0f / std::sqrt(vsum / static_cast<float>(D) + eps);
        rsp[m] = rstd;

        for (int d = 0; d < D; ++d) {
            float xh = (xm[d] - mean) * rstd;
            xhm[d] = xh;
            float v = gp ? (xh * gp[d]) : xh;
            if (bp) v += bp[d];
            ym[d] = v;
        }
    }

    if (tape.record && req) {
        tape.add_op([X, gamma, beta, Y, Xhat, Rstd, M, D]() {
            const float* dyp = Y->grad.data();
            const float* xhp_b = Xhat->data.data();
            const float* rsp_b = Rstd->data.data();
            const float* gp_b = gamma ? gamma->data.data() : nullptr;

            if (X->requires_grad) {
                float* dxp = X->grad.data();
                #pragma omp parallel for schedule(static) if(M > 64)
                for (int m = 0; m < M; ++m) {
                    const float* dym = dyp + static_cast<size_t>(m) * D;
                    const float* xhm = xhp_b + static_cast<size_t>(m) * D;
                    float* dxm = dxp + static_cast<size_t>(m) * D;
                    float rstd = rsp_b[m];

                    float m_dy = 0.0f;
                    float m_dy_xh = 0.0f;
                    for (int d = 0; d < D; ++d) {
                        float dyh = gp_b ? (dym[d] * gp_b[d]) : dym[d];
                        m_dy += dyh;
                        m_dy_xh += dyh * xhm[d];
                    }
                    m_dy /= static_cast<float>(D);
                    m_dy_xh /= static_cast<float>(D);

                    #pragma omp simd
                    for (int d = 0; d < D; ++d) {
                        float dyh = gp_b ? (dym[d] * gp_b[d]) : dym[d];
                        dxm[d] += rstd * (dyh - m_dy - xhm[d] * m_dy_xh);
                    }
                }
            }
            if (gamma && gamma->requires_grad) {
                float* dgp = gamma->grad.data();
                for (int m = 0; m < M; ++m) {
                    const float* dym = dyp + static_cast<size_t>(m) * D;
                    const float* xhm = xhp_b + static_cast<size_t>(m) * D;
                    #pragma omp simd
                    for (int d = 0; d < D; ++d) dgp[d] += dym[d] * xhm[d];
                }
            }
            if (beta && beta->requires_grad) {
                float* dbp = beta->grad.data();
                for (int m = 0; m < M; ++m) {
                    const float* dym = dyp + static_cast<size_t>(m) * D;
                    #pragma omp simd
                    for (int d = 0; d < D; ++d) dbp[d] += dym[d];
                }
            }
        });
    }
    return Y;
}

Tensor* embedding(Tape& tape, const int* indices, const std::vector<int>& out_prefix_shape, Tensor* table) {
    int V = table->shape[0];
    int D = table->shape[1];
    std::vector<int> out_shape = out_prefix_shape;
    out_shape.push_back(D);
    bool req = table->requires_grad;
    Tensor* Y = tape.alloc(out_shape, req);
    size_t count = Y->numel() / static_cast<size_t>(D);

    std::vector<int> idx_copy(count);
    for (size_t i = 0; i < count; ++i) {
        int id = indices[i];
        if (id < 0) id = 0;
        if (id >= V) id = V - 1;
        idx_copy[i] = id;
        std::memcpy(
            Y->data.data() + i * D,
            table->data.data() + static_cast<size_t>(id) * D,
            static_cast<size_t>(D) * sizeof(float)
        );
    }

    if (tape.record && req) {
        tape.add_op([table, Y, idx_copy, count, D]() {
            float* dtab = table->grad.data();
            const float* dyp = Y->grad.data();
            for (size_t i = 0; i < count; ++i) {
                int id = idx_copy[i];
                float* row = dtab + static_cast<size_t>(id) * D;
                const float* dy = dyp + i * D;
                #pragma omp simd
                for (int d = 0; d < D; ++d) row[d] += dy[d];
            }
        });
    }
    return Y;
}

Tensor* conv2d_3x3(Tape& tape, Tensor* X, Tensor* W, Tensor* b) {
    // X: [N_frames, H, W_sp, Cin], W: [9 * Cin, Cout]
    int Nf = X->shape[0];
    int H = X->shape[1];
    int Wsp = X->shape[2];
    int Cin = X->shape[3];

    Tensor* Col = tape.alloc({Nf, H, Wsp, 9 * Cin}, X->requires_grad);
    const float* xp = X->data.data();
    float* cp = Col->data.data();

    #pragma omp parallel for schedule(static) if(Nf * H > 16)
    for (int n = 0; n < Nf; ++n) {
        const float* xn = xp + static_cast<size_t>(n) * H * Wsp * Cin;
        float* cn = cp + static_cast<size_t>(n) * H * Wsp * (9 * Cin);
        for (int y = 0; y < H; ++y) {
            for (int x = 0; x < Wsp; ++x) {
                float* dst = cn + static_cast<size_t>(y * Wsp + x) * (9 * Cin);
                int k = 0;
                for (int dy = -1; dy <= 1; ++dy) {
                    int yy = std::clamp(y + dy, 0, H - 1);
                    for (int dx = -1; dx <= 1; ++dx) {
                        int xx = std::clamp(x + dx, 0, Wsp - 1);
                        const float* src = xn + static_cast<size_t>(yy * Wsp + xx) * Cin;
                        std::memcpy(dst + k * Cin, src, static_cast<size_t>(Cin) * sizeof(float));
                        ++k;
                    }
                }
            }
        }
    }

    if (tape.record && X->requires_grad) {
        tape.add_op([X, Col, Nf, H, Wsp, Cin]() {
            float* dxp = X->grad.data();
            const float* dcp = Col->grad.data();
            #pragma omp parallel for schedule(static) if(Nf > 2)
            for (int n = 0; n < Nf; ++n) {
                float* dxn = dxp + static_cast<size_t>(n) * H * Wsp * Cin;
                const float* dcn = dcp + static_cast<size_t>(n) * H * Wsp * (9 * Cin);
                for (int y = 0; y < H; ++y) {
                    for (int x = 0; x < Wsp; ++x) {
                        const float* src = dcn + static_cast<size_t>(y * Wsp + x) * (9 * Cin);
                        int k = 0;
                        for (int dy = -1; dy <= 1; ++dy) {
                            int yy = std::clamp(y + dy, 0, H - 1);
                            for (int dx = -1; dx <= 1; ++dx) {
                                int xx = std::clamp(x + dx, 0, Wsp - 1);
                                float* dst = dxn + static_cast<size_t>(yy * Wsp + xx) * Cin;
                                const float* sk = src + k * Cin;
                                #pragma omp simd
                                for (int c = 0; c < Cin; ++c) dst[c] += sk[c];
                                ++k;
                            }
                        }
                    }
                }
            }
        });
    }

    return linear(tape, Col, W, b);
}

Tensor* conv1d_t3(Tape& tape, Tensor* X, Tensor* W, Tensor* b) {
    // X: [B, T, S, Cin], W: [3 * Cin, Cout]
    int B = X->shape[0];
    int T = X->shape[1];
    int S = X->shape[2];
    int Cin = X->shape[3];

    Tensor* Col = tape.alloc({B, T, S, 3 * Cin}, X->requires_grad);
    const float* xp = X->data.data();
    float* cp = Col->data.data();

    #pragma omp parallel for schedule(static) if(B * T > 8)
    for (int bi = 0; bi < B; ++bi) {
        const float* xb = xp + static_cast<size_t>(bi) * T * S * Cin;
        float* cb = cp + static_cast<size_t>(bi) * T * S * (3 * Cin);
        for (int t = 0; t < T; ++t) {
            int t0 = std::clamp(t - 1, 0, T - 1);
            int t1 = t;
            int t2 = std::clamp(t + 1, 0, T - 1);
            for (int s = 0; s < S; ++s) {
                float* dst = cb + static_cast<size_t>(t * S + s) * (3 * Cin);
                std::memcpy(dst + 0 * Cin, xb + static_cast<size_t>(t0 * S + s) * Cin, static_cast<size_t>(Cin) * sizeof(float));
                std::memcpy(dst + 1 * Cin, xb + static_cast<size_t>(t1 * S + s) * Cin, static_cast<size_t>(Cin) * sizeof(float));
                std::memcpy(dst + 2 * Cin, xb + static_cast<size_t>(t2 * S + s) * Cin, static_cast<size_t>(Cin) * sizeof(float));
            }
        }
    }

    if (tape.record && X->requires_grad) {
        tape.add_op([X, Col, B, T, S, Cin]() {
            float* dxp = X->grad.data();
            const float* dcp = Col->grad.data();
            for (int bi = 0; bi < B; ++bi) {
                float* dxb = dxp + static_cast<size_t>(bi) * T * S * Cin;
                const float* dcb = dcp + static_cast<size_t>(bi) * T * S * (3 * Cin);
                for (int t = 0; t < T; ++t) {
                    int ts[3] = {std::clamp(t - 1, 0, T - 1), t, std::clamp(t + 1, 0, T - 1)};
                    for (int s = 0; s < S; ++s) {
                        const float* src = dcb + static_cast<size_t>(t * S + s) * (3 * Cin);
                        for (int k = 0; k < 3; ++k) {
                            float* dst = dxb + static_cast<size_t>(ts[k] * S + s) * Cin;
                            const float* sk = src + k * Cin;
                            #pragma omp simd
                            for (int c = 0; c < Cin; ++c) dst[c] += sk[c];
                        }
                    }
                }
            }
        });
    }

    return linear(tape, Col, W, b);
}

Tensor* space_to_depth(Tape& tape, Tensor* X, int p) {
    int N = X->shape[0];
    int H = X->shape[1];
    int W = X->shape[2];
    int C = X->shape[3];
    int Hp = H / p;
    int Wp = W / p;
    int Cp = C * p * p;

    Tensor* Y = tape.alloc({N, Hp, Wp, Cp}, X->requires_grad);
    const float* xp = X->data.data();
    float* yp = Y->data.data();

    for (int n = 0; n < N; ++n) {
        for (int hy = 0; hy < Hp; ++hy) {
            for (int wx = 0; wx < Wp; ++wx) {
                float* dst = yp + ((static_cast<size_t>(n) * Hp + hy) * Wp + wx) * Cp;
                int sub = 0;
                for (int py = 0; py < p; ++py) {
                    for (int px = 0; px < p; ++px) {
                        const float* src = xp + ((static_cast<size_t>(n) * H + (hy * p + py)) * W + (wx * p + px)) * C;
                        std::memcpy(dst + sub * C, src, static_cast<size_t>(C) * sizeof(float));
                        ++sub;
                    }
                }
            }
        }
    }

    if (tape.record && X->requires_grad) {
        tape.add_op([X, Y, N, H, W, C, p, Hp, Wp, Cp]() {
            float* dxp = X->grad.data();
            const float* dyp = Y->grad.data();
            for (int n = 0; n < N; ++n) {
                for (int hy = 0; hy < Hp; ++hy) {
                    for (int wx = 0; wx < Wp; ++wx) {
                        const float* src = dyp + ((static_cast<size_t>(n) * Hp + hy) * Wp + wx) * Cp;
                        int sub = 0;
                        for (int py = 0; py < p; ++py) {
                            for (int px = 0; px < p; ++px) {
                                float* dst = dxp + ((static_cast<size_t>(n) * H + (hy * p + py)) * W + (wx * p + px)) * C;
                                const float* ss = src + sub * C;
                                #pragma omp simd
                                for (int c = 0; c < C; ++c) dst[c] += ss[c];
                                ++sub;
                            }
                        }
                    }
                }
            }
        });
    }
    return Y;
}

Tensor* depth_to_space(Tape& tape, Tensor* X, int p) {
    int N = X->shape[0];
    int Hp = X->shape[1];
    int Wp = X->shape[2];
    int Cp = X->shape[3];
    int C = Cp / (p * p);
    int H = Hp * p;
    int W = Wp * p;

    Tensor* Y = tape.alloc({N, H, W, C}, X->requires_grad);
    const float* xp = X->data.data();
    float* yp = Y->data.data();

    for (int n = 0; n < N; ++n) {
        for (int hy = 0; hy < Hp; ++hy) {
            for (int wx = 0; wx < Wp; ++wx) {
                const float* src = xp + ((static_cast<size_t>(n) * Hp + hy) * Wp + wx) * Cp;
                int sub = 0;
                for (int py = 0; py < p; ++py) {
                    for (int px = 0; px < p; ++px) {
                        float* dst = yp + ((static_cast<size_t>(n) * H + (hy * p + py)) * W + (wx * p + px)) * C;
                        std::memcpy(dst, src + sub * C, static_cast<size_t>(C) * sizeof(float));
                        ++sub;
                    }
                }
            }
        }
    }

    if (tape.record && X->requires_grad) {
        tape.add_op([X, Y, N, H, W, C, p, Hp, Wp, Cp]() {
            float* dxp = X->grad.data();
            const float* dyp = Y->grad.data();
            for (int n = 0; n < N; ++n) {
                for (int hy = 0; hy < Hp; ++hy) {
                    for (int wx = 0; wx < Wp; ++wx) {
                        float* dst = dxp + ((static_cast<size_t>(n) * Hp + hy) * Wp + wx) * Cp;
                        int sub = 0;
                        for (int py = 0; py < p; ++py) {
                            for (int px = 0; px < p; ++px) {
                                const float* src = dyp + ((static_cast<size_t>(n) * H + (hy * p + py)) * W + (wx * p + px)) * C;
                                float* ds = dst + sub * C;
                                #pragma omp simd
                                for (int c = 0; c < C; ++c) ds[c] += src[c];
                                ++sub;
                            }
                        }
                    }
                }
            }
        });
    }
    return Y;
}

Tensor* fold3d_2x2x2(Tape& tape, Tensor* X) {
    int B = X->shape[0];
    int T = X->shape[1];
    int H = X->shape[2];
    int W = X->shape[3];
    int C = X->shape[4];
    int T2 = T / 2, H2 = H / 2, W2 = W / 2, C8 = C * 8;

    Tensor* Y = tape.alloc({B, T2, H2, W2, C8}, X->requires_grad);
    const float* xp = X->data.data();
    float* yp = Y->data.data();

    for (int b = 0; b < B; ++b) {
        for (int t = 0; t < T2; ++t) {
            for (int y = 0; y < H2; ++y) {
                for (int x = 0; x < W2; ++x) {
                    float* dst = yp + (((static_cast<size_t>(b) * T2 + t) * H2 + y) * W2 + x) * C8;
                    int sub = 0;
                    for (int dt = 0; dt < 2; ++dt) {
                        for (int dy = 0; dy < 2; ++dy) {
                            for (int dx = 0; dx < 2; ++dx) {
                                const float* src = xp + (((static_cast<size_t>(b) * T + (2 * t + dt)) * H + (2 * y + dy)) * W + (2 * x + dx)) * C;
                                std::memcpy(dst + sub * C, src, static_cast<size_t>(C) * sizeof(float));
                                ++sub;
                            }
                        }
                    }
                }
            }
        }
    }

    if (tape.record && X->requires_grad) {
        tape.add_op([X, Y, B, T, H, W, C, T2, H2, W2, C8]() {
            float* dxp = X->grad.data();
            const float* dyp = Y->grad.data();
            for (int b = 0; b < B; ++b) {
                for (int t = 0; t < T2; ++t) {
                    for (int y = 0; y < H2; ++y) {
                        for (int x = 0; x < W2; ++x) {
                            const float* src = dyp + (((static_cast<size_t>(b) * T2 + t) * H2 + y) * W2 + x) * C8;
                            int sub = 0;
                            for (int dt = 0; dt < 2; ++dt) {
                                for (int dy = 0; dy < 2; ++dy) {
                                    for (int dx = 0; dx < 2; ++dx) {
                                        float* dst = dxp + (((static_cast<size_t>(b) * T + (2 * t + dt)) * H + (2 * y + dy)) * W + (2 * x + dx)) * C;
                                        const float* ss = src + sub * C;
                                        #pragma omp simd
                                        for (int c = 0; c < C; ++c) dst[c] += ss[c];
                                        ++sub;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    return Y;
}

Tensor* unfold3d_2x2x2(Tape& tape, Tensor* X) {
    int B = X->shape[0];
    int T2 = X->shape[1];
    int H2 = X->shape[2];
    int W2 = X->shape[3];
    int C8 = X->shape[4];
    int C = C8 / 8;
    int T = T2 * 2, H = H2 * 2, W = W2 * 2;

    Tensor* Y = tape.alloc({B, T, H, W, C}, X->requires_grad);
    const float* xp = X->data.data();
    float* yp = Y->data.data();

    for (int b = 0; b < B; ++b) {
        for (int t = 0; t < T2; ++t) {
            for (int y = 0; y < H2; ++y) {
                for (int x = 0; x < W2; ++x) {
                    const float* src = xp + (((static_cast<size_t>(b) * T2 + t) * H2 + y) * W2 + x) * C8;
                    int sub = 0;
                    for (int dt = 0; dt < 2; ++dt) {
                        for (int dy = 0; dy < 2; ++dy) {
                            for (int dx = 0; dx < 2; ++dx) {
                                float* dst = yp + (((static_cast<size_t>(b) * T + (2 * t + dt)) * H + (2 * y + dy)) * W + (2 * x + dx)) * C;
                                std::memcpy(dst, src + sub * C, static_cast<size_t>(C) * sizeof(float));
                                ++sub;
                            }
                        }
                    }
                }
            }
        }
    }

    if (tape.record && X->requires_grad) {
        tape.add_op([X, Y, B, T, H, W, C, T2, H2, W2, C8]() {
            float* dxp = X->grad.data();
            const float* dyp = Y->grad.data();
            for (int b = 0; b < B; ++b) {
                for (int t = 0; t < T2; ++t) {
                    for (int y = 0; y < H2; ++y) {
                        for (int x = 0; x < W2; ++x) {
                            float* dst = dxp + (((static_cast<size_t>(b) * T2 + t) * H2 + y) * W2 + x) * C8;
                            int sub = 0;
                            for (int dt = 0; dt < 2; ++dt) {
                                for (int dy = 0; dy < 2; ++dy) {
                                    for (int dx = 0; dx < 2; ++dx) {
                                        const float* src = dyp + (((static_cast<size_t>(b) * T + (2 * t + dt)) * H + (2 * y + dy)) * W + (2 * x + dx)) * C;
                                        float* ds = dst + sub * C;
                                        #pragma omp simd
                                        for (int c = 0; c < C; ++c) ds[c] += src[c];
                                        ++sub;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    return Y;
}

Tensor* reshape(Tape& tape, Tensor* X, const std::vector<int>& new_shape) {
    Tensor* Y = tape.alloc(new_shape, X->requires_grad);
    Y->data = X->data;
    if (tape.record && X->requires_grad) {
        size_t n = X->numel();
        tape.add_op([X, Y, n]() {
            float* dx = X->grad.data();
            const float* dy = Y->grad.data();
            #pragma omp simd
            for (size_t i = 0; i < n; ++i) dx[i] += dy[i];
        });
    }
    return Y;
}

Tensor* transpose_12(Tape& tape, Tensor* X) {
    int B = X->shape[0];
    int A = X->shape[1];
    int C = X->shape[2];
    int D = X->shape[3];
    Tensor* Y = tape.alloc({B, C, A, D}, X->requires_grad);
    const float* xp = X->data.data();
    float* yp = Y->data.data();

    for (int b = 0; b < B; ++b) {
        for (int a = 0; a < A; ++a) {
            for (int c = 0; c < C; ++c) {
                const float* src = xp + ((static_cast<size_t>(b) * A + a) * C + c) * D;
                float* dst = yp + ((static_cast<size_t>(b) * C + c) * A + a) * D;
                std::memcpy(dst, src, static_cast<size_t>(D) * sizeof(float));
            }
        }
    }

    if (tape.record && X->requires_grad) {
        tape.add_op([X, Y, B, A, C, D]() {
            float* dxp = X->grad.data();
            const float* dyp = Y->grad.data();
            for (int b = 0; b < B; ++b) {
                for (int a = 0; a < A; ++a) {
                    for (int c = 0; c < C; ++c) {
                        float* dst = dxp + ((static_cast<size_t>(b) * A + a) * C + c) * D;
                        const float* src = dyp + ((static_cast<size_t>(b) * C + c) * A + a) * D;
                        #pragma omp simd
                        for (int d = 0; d < D; ++d) dst[d] += src[d];
                    }
                }
            }
        });
    }
    return Y;
}

Tensor* concat_axis1(Tape& tape, Tensor* A, Tensor* B) {
    int Batch = A->shape[0];
    int N1 = A->shape[1];
    int N2 = B->shape[1];
    int D = A->shape[2];
    bool req = A->requires_grad || B->requires_grad;
    Tensor* Y = tape.alloc({Batch, N1 + N2, D}, req);

    for (int b = 0; b < Batch; ++b) {
        float* yd = Y->data.data() + static_cast<size_t>(b) * (N1 + N2) * D;
        std::memcpy(yd, A->data.data() + static_cast<size_t>(b) * N1 * D, static_cast<size_t>(N1 * D) * sizeof(float));
        std::memcpy(yd + N1 * D, B->data.data() + static_cast<size_t>(b) * N2 * D, static_cast<size_t>(N2 * D) * sizeof(float));
    }

    if (tape.record && req) {
        tape.add_op([A, B, Y, Batch, N1, N2, D]() {
            for (int b = 0; b < Batch; ++b) {
                const float* dy = Y->grad.data() + static_cast<size_t>(b) * (N1 + N2) * D;
                if (A->requires_grad) {
                    float* da = A->grad.data() + static_cast<size_t>(b) * N1 * D;
                    #pragma omp simd
                    for (int i = 0; i < N1 * D; ++i) da[i] += dy[i];
                }
                if (B->requires_grad) {
                    float* db = B->grad.data() + static_cast<size_t>(b) * N2 * D;
                    const float* dy2 = dy + N1 * D;
                    #pragma omp simd
                    for (int i = 0; i < N2 * D; ++i) db[i] += dy2[i];
                }
            }
        });
    }
    return Y;
}

Tensor* multihead_attention(
    Tape& tape,
    Tensor* Q,
    Tensor* K,
    Tensor* V,
    int H,
    const float* q_cos,
    const float* q_sin,
    const float* k_cos,
    const float* k_sin,
    std::vector<float>* attn_capture
) {
    int B = Q->shape[0];
    int Nq = Q->shape[1];
    int D = Q->shape[2];
    int Nk = K->shape[1];
    int Dh = D / H;
    int half = Dh / 2;

    bool req = Q->requires_grad || K->requires_grad || V->requires_grad;
    Tensor* Y = tape.alloc({B, Nq, D}, req);
    Tensor* Qr = tape.alloc({B, Nq, D}, false);
    Tensor* Kr = tape.alloc({B, Nk, D}, false);
    Tensor* Probs = tape.alloc({B * H, Nq, Nk}, false);

    // Apply RoPE if provided
    if (q_cos && q_sin) {
        for (int b = 0; b < B; ++b) {
            for (int n = 0; n < Nq; ++n) {
                const float* cs = q_cos + static_cast<size_t>(n) * half;
                const float* sn = q_sin + static_cast<size_t>(n) * half;
                for (int h = 0; h < H; ++h) {
                    const float* src = Q->data.data() + ((static_cast<size_t>(b) * Nq + n) * H + h) * Dh;
                    float* dst = Qr->data.data() + ((static_cast<size_t>(b) * Nq + n) * H + h) * Dh;
                    for (int p = 0; p < half; ++p) {
                        float x0 = src[2 * p];
                        float x1 = src[2 * p + 1];
                        dst[2 * p]     = x0 * cs[p] - x1 * sn[p];
                        dst[2 * p + 1] = x0 * sn[p] + x1 * cs[p];
                    }
                }
            }
        }
    } else {
        Qr->data = Q->data;
    }

    if (k_cos && k_sin) {
        for (int b = 0; b < B; ++b) {
            for (int n = 0; n < Nk; ++n) {
                const float* cs = k_cos + static_cast<size_t>(n) * half;
                const float* sn = k_sin + static_cast<size_t>(n) * half;
                for (int h = 0; h < H; ++h) {
                    const float* src = K->data.data() + ((static_cast<size_t>(b) * Nk + n) * H + h) * Dh;
                    float* dst = Kr->data.data() + ((static_cast<size_t>(b) * Nk + n) * H + h) * Dh;
                    for (int p = 0; p < half; ++p) {
                        float x0 = src[2 * p];
                        float x1 = src[2 * p + 1];
                        dst[2 * p]     = x0 * cs[p] - x1 * sn[p];
                        dst[2 * p + 1] = x0 * sn[p] + x1 * cs[p];
                    }
                }
            }
        }
    } else {
        Kr->data = K->data;
    }

    float scale = 1.0f / std::sqrt(static_cast<float>(Dh));
    int BH = B * H;

    #pragma omp parallel for schedule(static) if(BH >= 4)
    for (int bh = 0; bh < BH; ++bh) {
        int b = bh / H;
        int h = bh % H;
        float* pb = Probs->data.data() + static_cast<size_t>(bh) * Nq * Nk;
        for (int i = 0; i < Nq; ++i) {
            const float* qi = Qr->data.data() + ((static_cast<size_t>(b) * Nq + i) * H + h) * Dh;
            float* p_row = pb + static_cast<size_t>(i) * Nk;
            float max_s = -1e30f;
            for (int j = 0; j < Nk; ++j) {
                const float* kj = Kr->data.data() + ((static_cast<size_t>(b) * Nk + j) * H + h) * Dh;
                float dot = 0.0f;
                #pragma omp simd reduction(+:dot)
                for (int d = 0; d < Dh; ++d) dot += qi[d] * kj[d];
                float s = dot * scale;
                p_row[j] = s;
                if (s > max_s) max_s = s;
            }
            float sum_e = 0.0f;
            for (int j = 0; j < Nk; ++j) {
                float e = std::exp(p_row[j] - max_s);
                p_row[j] = e;
                sum_e += e;
            }
            float inv = 1.0f / (sum_e + 1e-12f);
            for (int j = 0; j < Nk; ++j) p_row[j] *= inv;

            float* yo = Y->data.data() + ((static_cast<size_t>(b) * Nq + i) * H + h) * Dh;
            std::memset(yo, 0, static_cast<size_t>(Dh) * sizeof(float));
            for (int j = 0; j < Nk; ++j) {
                float pij = p_row[j];
                const float* vj = V->data.data() + ((static_cast<size_t>(b) * Nk + j) * H + h) * Dh;
                #pragma omp simd
                for (int d = 0; d < Dh; ++d) yo[d] += pij * vj[d];
            }
        }
    }

    if (attn_capture) {
        attn_capture->assign(static_cast<size_t>(Nq * Nk), 0.0f);
        float invH = 1.0f / static_cast<float>(H);
        for (int h = 0; h < H; ++h) {
            const float* pb = Probs->data.data() + static_cast<size_t>(h) * Nq * Nk;
            for (int idx = 0; idx < Nq * Nk; ++idx) {
                (*attn_capture)[idx] += pb[idx] * invH;
            }
        }
    }

    if (tape.record && req) {
        std::vector<float> q_cos_vec, q_sin_vec, k_cos_vec, k_sin_vec;
        if (q_cos && q_sin) {
            q_cos_vec.assign(q_cos, q_cos + Nq * half);
            q_sin_vec.assign(q_sin, q_sin + Nq * half);
        }
        if (k_cos && k_sin) {
            k_cos_vec.assign(k_cos, k_cos + Nk * half);
            k_sin_vec.assign(k_sin, k_sin + Nk * half);
        }

        tape.add_op([Q, K, V, Y, Qr, Kr, Probs, B, Nq, Nk, H, Dh, half, scale,
                     q_cos_vec = std::move(q_cos_vec), q_sin_vec = std::move(q_sin_vec),
                     k_cos_vec = std::move(k_cos_vec), k_sin_vec = std::move(k_sin_vec)]() {
            int BH_b = B * H;
            std::vector<float> dQr(Q->numel(), 0.0f);
            std::vector<float> dKr(K->numel(), 0.0f);

            #pragma omp parallel for schedule(static) if(BH_b >= 4)
            for (int bh = 0; bh < BH_b; ++bh) {
                int b = bh / H;
                int h = bh % H;
                const float* pb = Probs->data.data() + static_cast<size_t>(bh) * Nq * Nk;
                std::vector<float> dP(Nk);
                std::vector<float> dS(Nk);

                for (int i = 0; i < Nq; ++i) {
                    const float* dyo = Y->grad.data() + ((static_cast<size_t>(b) * Nq + i) * H + h) * Dh;
                    const float* p_row = pb + static_cast<size_t>(i) * Nk;

                    float dot_p_dp = 0.0f;
                    for (int j = 0; j < Nk; ++j) {
                        const float* vj = V->data.data() + ((static_cast<size_t>(b) * Nk + j) * H + h) * Dh;
                        float dp = 0.0f;
                        #pragma omp simd reduction(+:dp)
                        for (int d = 0; d < Dh; ++d) dp += dyo[d] * vj[d];
                        dP[j] = dp;
                        dot_p_dp += p_row[j] * dp;

                        if (V->requires_grad) {
                            float* dvj = V->grad.data() + ((static_cast<size_t>(b) * Nk + j) * H + h) * Dh;
                            float pij = p_row[j];
                            #pragma omp simd
                            for (int d = 0; d < Dh; ++d) dvj[d] += pij * dyo[d];
                        }
                    }

                    for (int j = 0; j < Nk; ++j) {
                        dS[j] = scale * p_row[j] * (dP[j] - dot_p_dp);
                    }

                    if (Q->requires_grad) {
                        float* dq_i = dQr.data() + ((static_cast<size_t>(b) * Nq + i) * H + h) * Dh;
                        for (int j = 0; j < Nk; ++j) {
                            float ds = dS[j];
                            const float* kj = Kr->data.data() + ((static_cast<size_t>(b) * Nk + j) * H + h) * Dh;
                            #pragma omp simd
                            for (int d = 0; d < Dh; ++d) dq_i[d] += ds * kj[d];
                        }
                    }

                    if (K->requires_grad) {
                        const float* qi = Qr->data.data() + ((static_cast<size_t>(b) * Nq + i) * H + h) * Dh;
                        for (int j = 0; j < Nk; ++j) {
                            float ds = dS[j];
                            float* dk_j = dKr.data() + ((static_cast<size_t>(b) * Nk + j) * H + h) * Dh;
                            #pragma omp simd
                            for (int d = 0; d < Dh; ++d) dk_j[d] += ds * qi[d];
                        }
                    }
                }
            }

            if (Q->requires_grad) {
                if (!q_cos_vec.empty()) {
                    for (int b = 0; b < B; ++b) {
                        for (int n = 0; n < Nq; ++n) {
                            const float* cs = q_cos_vec.data() + static_cast<size_t>(n) * half;
                            const float* sn = q_sin_vec.data() + static_cast<size_t>(n) * half;
                            for (int h = 0; h < H; ++h) {
                                const float* src = dQr.data() + ((static_cast<size_t>(b) * Nq + n) * H + h) * Dh;
                                float* dst = Q->grad.data() + ((static_cast<size_t>(b) * Nq + n) * H + h) * Dh;
                                for (int p = 0; p < half; ++p) {
                                    float g0 = src[2 * p];
                                    float g1 = src[2 * p + 1];
                                    dst[2 * p]     +=  g0 * cs[p] + g1 * sn[p];
                                    dst[2 * p + 1] += -g0 * sn[p] + g1 * cs[p];
                                }
                            }
                        }
                    }
                } else {
                    float* dst = Q->grad.data();
                    size_t n = dQr.size();
                    #pragma omp simd
                    for (size_t i = 0; i < n; ++i) dst[i] += dQr[i];
                }
            }

            if (K->requires_grad) {
                if (!k_cos_vec.empty()) {
                    for (int b = 0; b < B; ++b) {
                        for (int n = 0; n < Nk; ++n) {
                            const float* cs = k_cos_vec.data() + static_cast<size_t>(n) * half;
                            const float* sn = k_sin_vec.data() + static_cast<size_t>(n) * half;
                            for (int h = 0; h < H; ++h) {
                                const float* src = dKr.data() + ((static_cast<size_t>(b) * Nk + n) * H + h) * Dh;
                                float* dst = K->grad.data() + ((static_cast<size_t>(b) * Nk + n) * H + h) * Dh;
                                for (int p = 0; p < half; ++p) {
                                    float g0 = src[2 * p];
                                    float g1 = src[2 * p + 1];
                                    dst[2 * p]     +=  g0 * cs[p] + g1 * sn[p];
                                    dst[2 * p + 1] += -g0 * sn[p] + g1 * cs[p];
                                }
                            }
                        }
                    }
                } else {
                    float* dst = K->grad.data();
                    size_t n = dKr.size();
                    #pragma omp simd
                    for (size_t i = 0; i < n; ++i) dst[i] += dKr[i];
                }
            }
        });
    }

    return Y;
}

Tensor* weighted_cross_entropy(
    Tape& tape,
    Tensor* logits,
    const uint8_t* targets,
    const float* class_weights,
    int* correct_count
) {
    int K = logits->shape.back();
    int N = static_cast<int>(logits->numel() / static_cast<size_t>(K));
    bool req = logits->requires_grad;
    Tensor* Loss = tape.alloc({1}, req);
    Tensor* Softmax = tape.alloc({N, K}, false);

    const float* lp = logits->data.data();
    float* sp = Softmax->data.data();

    double total_loss = 0.0;
    double total_weight = 0.0;
    int correct = 0;

    #pragma omp parallel for reduction(+:total_loss,total_weight,correct) schedule(static) if(N > 512)
    for (int i = 0; i < N; ++i) {
        const float* row = lp + static_cast<size_t>(i) * K;
        float* srow = sp + static_cast<size_t>(i) * K;
        float max_v = row[0];
        int argmax = 0;
        for (int k = 1; k < K; ++k) {
            if (row[k] > max_v) {
                max_v = row[k];
                argmax = k;
            }
        }
        int tgt = static_cast<int>(targets[i]);
        if (argmax == tgt) correct += 1;

        float sum_e = 0.0f;
        for (int k = 0; k < K; ++k) {
            float e = std::exp(row[k] - max_v);
            srow[k] = e;
            sum_e += e;
        }
        float inv = 1.0f / (sum_e + 1e-12f);
        for (int k = 0; k < K; ++k) srow[k] *= inv;

        float w = class_weights ? class_weights[tgt] : 1.0f;
        float pt = std::max(srow[tgt], 1e-12f);
        total_loss += -static_cast<double>(w) * std::log(static_cast<double>(pt));
        total_weight += static_cast<double>(w);
    }

    if (correct_count) *correct_count = correct;
    float norm = static_cast<float>(std::max(total_weight, 1e-8));
    Loss->data[0] = static_cast<float>(total_loss / std::max(total_weight, 1e-8));

    if (tape.record && req) {
        std::vector<uint8_t> tgt_copy(targets, targets + N);
        std::vector<float> cw_copy;
        if (class_weights) cw_copy.assign(class_weights, class_weights + K);

        tape.add_op([logits, Softmax, Loss, N, K, norm,
                     tgt_copy = std::move(tgt_copy), cw_copy = std::move(cw_copy)]() {
            float upstream = Loss->grad[0] / norm;
            float* dlp = logits->grad.data();
            const float* sp_b = Softmax->data.data();

            #pragma omp parallel for schedule(static) if(N > 512)
            for (int i = 0; i < N; ++i) {
                int tgt = static_cast<int>(tgt_copy[i]);
                float w = cw_copy.empty() ? 1.0f : cw_copy[tgt];
                float scale = upstream * w;
                float* drow = dlp + static_cast<size_t>(i) * K;
                const float* srow = sp_b + static_cast<size_t>(i) * K;
                for (int k = 0; k < K; ++k) {
                    float indicator = (k == tgt) ? 1.0f : 0.0f;
                    drow[k] += scale * (srow[k] - indicator);
                }
            }
        });
    }
    return Loss;
}

Tensor* mse_loss(Tape& tape, Tensor* pred, Tensor* target) {
    size_t n = pred->numel();
    bool req = pred->requires_grad;
    Tensor* Loss = tape.alloc({1}, req);
    const float* pp = pred->data.data();
    const float* tp = target->data.data();

    double sum = 0.0;
    #pragma omp simd reduction(+:sum)
    for (size_t i = 0; i < n; ++i) {
        double d = static_cast<double>(pp[i]) - static_cast<double>(tp[i]);
        sum += d * d;
    }
    Loss->data[0] = static_cast<float>(sum / static_cast<double>(n));

    if (tape.record && req) {
        tape.add_op([pred, target, Loss, n]() {
            float scale = Loss->grad[0] * (2.0f / static_cast<float>(n));
            float* dp = pred->grad.data();
            const float* pp_b = pred->data.data();
            const float* tp_b = target->data.data();
            #pragma omp simd
            for (size_t i = 0; i < n; ++i) {
                dp[i] += scale * (pp_b[i] - tp_b[i]);
            }
        });
    }
    return Loss;
}

} // namespace ops
} // namespace sakuga
