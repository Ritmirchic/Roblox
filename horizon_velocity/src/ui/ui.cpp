// HORIZON VELOCITY - 2D overlay drawing
#include "ui/ui.h"
#include "ui/font.h"
#include <cmath>
#include <cstring>

namespace hv {
namespace ui {

const Vec4 kWhite(0.97f, 0.98f, 1.0f, 1.0f);
const Vec4 kDim(0.62f, 0.67f, 0.74f, 1.0f);
const Vec4 kAccent(1.0f, 0.36f, 0.62f, 1.0f);
const Vec4 kDark(0.04f, 0.05f, 0.07f, 0.80f);
const Vec4 kRed(1.0f, 0.22f, 0.20f, 1.0f);
const Vec4 kGreen(0.35f, 1.0f, 0.55f, 1.0f);

static const uint8_t* glyphFor(char c) {
    if (c >= 'a' && c <= 'z') c = (char)(c - 'a' + 'A');
    for (int i = 0; i < FONT_GLYPH_COUNT; i++)
        if (FONT_CHARS[i] == c) return FONT_GLYPHS[i];
    return FONT_GLYPHS[0];
}

void UI::text(float x, float y, const std::string& s, float size, const Vec4& col) {
    if (!r) return;
    float px = size * scale;
    float adv = px * 6.0f;
    float cx = x;
    for (char ch : s) {
        if (ch == '\n') { cx = x; y += px * 9.0f; continue; }
        const uint8_t* g = glyphFor(ch);
        for (int row = 0; row < FONT_H; row++) {
            int runStart = -1;
            for (int c = 0; c <= FONT_W; c++) {
                bool on = c < FONT_W && (g[c] >> row) & 1;
                if (on && runStart < 0) runStart = c;
                if (!on && runStart >= 0) {
                    r->rect(cx + runStart * px, y + row * px, (c - runStart) * px, px, col);
                    runStart = -1;
                }
            }
        }
        cx += adv;
    }
}

void UI::panel(float x, float y, float pw, float ph, const Vec4& fill, const Vec4& edge, float border) {
    if (!r) return;
    r->rect(x, y, pw, ph, fill);
    if (border > 0.0f) {
        r->rect(x, y, pw, border, edge);
        r->rect(x, y + ph - border, pw, border, edge);
        r->rect(x, y, border, ph, edge);
        r->rect(x + pw - border, y, border, ph, edge);
    }
}

void UI::bar(float x, float y, float bw, float bh, float t, const Vec4& back, const Vec4& fill) {
    if (!r) return;
    r->rect(x, y, bw, bh, back);
    float v = clampf(t, 0.0f, 1.0f);
    r->rect(x, y, bw * v, bh, fill);
}

void UI::gauge(float cx, float cy, float radius, float t, const Vec4& col, float thickness, int segs) {
    if (!r) return;
    float a0 = PI * 0.75f, a1 = PI * 2.25f;
    int n = std::max(2, (int)(segs * clampf(t, 0.0f, 1.0f)));
    for (int i = 0; i < n; i++) {
        float f0 = (float)i / (float)segs, f1 = (float)(i + 1) / (float)segs;
        float ang = lerpf(a0, a1, f0 * clampf(t, 0.0f, 1.0f));
        float rr = radius;
        r->rect(cx + std::cos(ang) * rr - thickness * 0.5f, cy + std::sin(ang) * rr - thickness * 0.5f,
                thickness, thickness, col);
        (void)f1;
    }
}

void UI::crosshair(float cx, float cy, float size, const Vec4& col) {
    if (!r) return;
    r->rect(cx - size, cy - 1.0f, size * 2.0f, 2.0f, col);
    r->rect(cx - 1.0f, cy - size, 2.0f, size * 2.0f, col);
}

} // namespace ui
} // namespace hv
