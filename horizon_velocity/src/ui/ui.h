// HORIZON VELOCITY - immediate-mode 2D overlay (bitmap font + HUD primitives)
#pragma once
#include "core/math.h"
#include "render/gfx.h"
#include <string>

namespace hv {
namespace ui {

struct UI {
    Renderer* r = nullptr;
    float w = 1280, h = 720;
    float scale = 1.0f;          // 1.0 at 1280x720, scales with resolution

    void begin(Renderer* rr, int ww, int hh) {
        r = rr; w = (float)ww; h = (float)hh;
        scale = clampf(hh / 720.0f, 0.7f, 3.0f);
    }
    float textWidth(const std::string& s, float size) const {
        return (float)s.size() * size * 6.0f;
    }
    void text(float x, float y, const std::string& s, float size, const Vec4& col);
    void textRight(float xRight, float y, const std::string& s, float size, const Vec4& col) {
        text(xRight - textWidth(s, size), y, s, size, col);
    }
    void textCenter(float xc, float y, const std::string& s, float size, const Vec4& col) {
        text(xc - textWidth(s, size) * 0.5f, y, s, size, col);
    }
    void panel(float x, float y, float pw, float ph, const Vec4& fill, const Vec4& edge, float border = 2.0f);
    void bar(float x, float y, float bw, float bh, float t, const Vec4& back, const Vec4& fill);
    void gauge(float cx, float cy, float radius, float t, const Vec4& col, float thickness, int segs = 40);
    void crosshair(float cx, float cy, float size, const Vec4& col);
};

// shared HUD palette
extern const Vec4 kWhite, kDim, kAccent, kDark, kRed, kGreen;

} // namespace ui
} // namespace hv
