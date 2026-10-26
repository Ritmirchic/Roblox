// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  UI renderer with a built-in 5x7 bitmap font.
// ============================================================================
#include "game/ui.h"
#include "assets/assets.h"
#include <cstring>

namespace aoh {

// ---------------------------------------------------------------------------
// Classic 5x7 cell font, ASCII 32..126.  Each glyph is five columns; the low
// seven bits of every column are the lit pixels from the top row down.
// ---------------------------------------------------------------------------
static const u8 FONT5x7[95][5] = {
  {0x00,0x00,0x00,0x00,0x00}, {0x00,0x00,0x5F,0x00,0x00}, {0x00,0x07,0x00,0x07,0x00},
  {0x14,0x7F,0x14,0x7F,0x14}, {0x24,0x2A,0x7F,0x2A,0x12}, {0x23,0x13,0x08,0x64,0x62},
  {0x36,0x49,0x55,0x22,0x50}, {0x00,0x05,0x03,0x00,0x00}, {0x00,0x1C,0x22,0x41,0x00},
  {0x00,0x41,0x22,0x1C,0x00}, {0x14,0x08,0x3E,0x08,0x14}, {0x08,0x08,0x3E,0x08,0x08},
  {0x00,0x50,0x30,0x00,0x00}, {0x08,0x08,0x08,0x08,0x08}, {0x00,0x60,0x60,0x00,0x00},
  {0x20,0x10,0x08,0x04,0x02}, {0x3E,0x51,0x49,0x45,0x3E}, {0x00,0x42,0x7F,0x40,0x00},
  {0x42,0x61,0x51,0x49,0x46}, {0x21,0x41,0x45,0x4B,0x31}, {0x18,0x14,0x12,0x7F,0x10},
  {0x27,0x45,0x45,0x45,0x39}, {0x3C,0x4A,0x49,0x49,0x30}, {0x01,0x71,0x09,0x05,0x03},
  {0x36,0x49,0x49,0x49,0x36}, {0x06,0x49,0x49,0x29,0x1E}, {0x00,0x36,0x36,0x00,0x00},
  {0x00,0x56,0x36,0x00,0x00}, {0x08,0x14,0x22,0x41,0x00}, {0x14,0x14,0x14,0x14,0x14},
  {0x00,0x41,0x22,0x14,0x08}, {0x02,0x01,0x51,0x09,0x06}, {0x32,0x49,0x79,0x41,0x3E},
  {0x7E,0x11,0x11,0x11,0x7E}, {0x7F,0x49,0x49,0x49,0x36}, {0x3E,0x41,0x41,0x41,0x22},
  {0x7F,0x41,0x41,0x22,0x1C}, {0x7F,0x49,0x49,0x49,0x41}, {0x7F,0x09,0x09,0x09,0x01},
  {0x3E,0x41,0x49,0x49,0x7A}, {0x7F,0x08,0x08,0x08,0x7F}, {0x00,0x41,0x7F,0x41,0x00},
  {0x20,0x40,0x41,0x3F,0x01}, {0x7F,0x08,0x14,0x22,0x41}, {0x7F,0x40,0x40,0x40,0x40},
  {0x7F,0x02,0x0C,0x02,0x7F}, {0x7F,0x04,0x08,0x10,0x7F}, {0x3E,0x41,0x41,0x41,0x3E},
  {0x7F,0x09,0x09,0x09,0x06}, {0x3E,0x41,0x51,0x21,0x5E}, {0x7F,0x09,0x19,0x29,0x46},
  {0x46,0x49,0x49,0x49,0x31}, {0x01,0x01,0x7F,0x01,0x01}, {0x3F,0x40,0x40,0x40,0x3F},
  {0x1F,0x20,0x40,0x20,0x1F}, {0x3F,0x40,0x38,0x40,0x3F}, {0x63,0x14,0x08,0x14,0x63},
  {0x07,0x08,0x70,0x08,0x07}, {0x61,0x51,0x49,0x45,0x43}, {0x00,0x7F,0x41,0x41,0x00},
  {0x02,0x04,0x08,0x10,0x20}, {0x00,0x41,0x41,0x7F,0x00}, {0x04,0x02,0x01,0x02,0x04},
  {0x40,0x40,0x40,0x40,0x40}, {0x00,0x01,0x02,0x04,0x00}, {0x20,0x54,0x54,0x54,0x78},
  {0x7F,0x48,0x44,0x44,0x38}, {0x38,0x44,0x44,0x44,0x20}, {0x38,0x44,0x44,0x48,0x7F},
  {0x38,0x54,0x54,0x54,0x18}, {0x08,0x7E,0x09,0x01,0x02}, {0x0C,0x52,0x52,0x52,0x3E},
  {0x7F,0x08,0x04,0x04,0x78}, {0x00,0x44,0x7D,0x40,0x00}, {0x20,0x40,0x44,0x3D,0x00},
  {0x7F,0x10,0x28,0x44,0x00}, {0x00,0x41,0x7F,0x40,0x00}, {0x7C,0x04,0x18,0x04,0x78},
  {0x7C,0x08,0x04,0x04,0x78}, {0x38,0x44,0x44,0x44,0x38}, {0x7C,0x14,0x14,0x14,0x08},
  {0x08,0x14,0x14,0x18,0x7C}, {0x7C,0x08,0x04,0x04,0x08}, {0x48,0x54,0x54,0x54,0x20},
  {0x04,0x3F,0x44,0x40,0x20}, {0x3C,0x40,0x40,0x20,0x7C}, {0x1C,0x20,0x40,0x20,0x1C},
  {0x3C,0x40,0x30,0x40,0x3C}, {0x44,0x28,0x10,0x28,0x44}, {0x0C,0x50,0x50,0x50,0x3C},
  {0x44,0x64,0x54,0x4C,0x44}, {0x00,0x08,0x36,0x41,0x00}, {0x00,0x00,0x7F,0x00,0x00},
  {0x00,0x41,0x36,0x08,0x00}, {0x08,0x04,0x08,0x10,0x08},
};

// ---------------------------------------------------------------------------
bool UIRenderer::init(Renderer* renderer) {
  m_renderer = renderer;
  if (!renderer) return false;
  const int cellW = 6, cellH = 8;
  const int cols = 16, rows = 6;
  TextureData td;
  td.width = cols * cellW;
  td.height = rows * cellH;
  td.format = 0;   // RGBA8
  td.mips = 1;
  td.data.assign((size_t)td.width * td.height * 4, 0);
  for (int i = 0; i < 95; ++i) {
    int cx = (i % cols) * cellW;
    int cy = (i / cols) * cellH;
    for (int c = 0; c < 5; ++c) {
      u8 bits = FONT5x7[i][c];
      for (int r = 0; r < 7; ++r) {
        if (bits & (1 << r)) {
          int px = cx + c;
          int py = cy + r;
          size_t o = ((size_t)py * td.width + px) * 4;
          td.data[o + 0] = 255; td.data[o + 1] = 255; td.data[o + 2] = 255; td.data[o + 3] = 255;
        }
      }
    }
  }
  m_font = renderer->createTexture(td, "font5x7");
  return m_font != nullptr;
}

void UIRenderer::begin(int width, int height) {
  m_w = width; m_h = height;
  m_batches.clear();
}

UIRenderer::Batch& UIRenderer::batchFor(GpuTexture* tex) {
  if (!m_batches.empty() && m_batches.back().tex == tex) return m_batches.back();
  Batch b;
  b.tex = tex;
  m_batches.push_back(b);
  return m_batches.back();
}

void UIRenderer::end() {
  if (!m_renderer) return;
  for (const Batch& b : m_batches) {
    if (b.verts.empty()) continue;
    std::vector<float> v;
    v.reserve(b.verts.size() * 8);
    for (const UIVertex& u : b.verts) {
      v.push_back(u.x); v.push_back(u.y);
      v.push_back(u.u); v.push_back(u.v);
      v.push_back(u.r); v.push_back(u.g); v.push_back(u.b); v.push_back(u.a);
    }
    TextureSet tex;
    tex.albedo = b.tex;
    m_renderer->submitUI(v, b.indices, tex);
  }
}

void UIRenderer::pushQuad(f32 x0, f32 y0, f32 x1, f32 y1, f32 u0, f32 v0, f32 u1, f32 v1,
                           const Vec4& c) {
  Batch& b = batchFor(m_font);
  int base = (int)b.verts.size();
  b.verts.push_back({ x0, y0, u0, v0, c.x, c.y, c.z, c.w });
  b.verts.push_back({ x1, y0, u1, v0, c.x, c.y, c.z, c.w });
  b.verts.push_back({ x1, y1, u1, v1, c.x, c.y, c.z, c.w });
  b.verts.push_back({ x0, y1, u0, v1, c.x, c.y, c.z, c.w });
  b.indices.push_back(base);     b.indices.push_back(base + 1); b.indices.push_back(base + 2);
  b.indices.push_back(base);     b.indices.push_back(base + 2); b.indices.push_back(base + 3);
}

void UIRenderer::image(f32 x, f32 y, f32 w, f32 h, GpuTexture* tex, const Vec4& tint) {
  if (!tex) return;
  Batch& b = batchFor(tex);
  int base = (int)b.verts.size();
  b.verts.push_back({ x,     y,     0, 0, tint.x, tint.y, tint.z, tint.w });
  b.verts.push_back({ x + w, y,     1, 0, tint.x, tint.y, tint.z, tint.w });
  b.verts.push_back({ x + w, y + h, 1, 1, tint.x, tint.y, tint.z, tint.w });
  b.verts.push_back({ x,     y + h, 0, 1, tint.x, tint.y, tint.z, tint.w });
  b.indices.push_back(base); b.indices.push_back(base + 1); b.indices.push_back(base + 2);
  b.indices.push_back(base); b.indices.push_back(base + 2); b.indices.push_back(base + 3);
}

void UIRenderer::imageCover(f32 x, f32 y, f32 w, f32 h, GpuTexture* tex, const Vec4& tint) {
  if (!tex || tex->width <= 0 || tex->height <= 0) return;
  f32 ta = (f32)tex->width / (f32)tex->height;
  f32 sa = w / h;
  f32 dw = w, dh = h;
  if (ta > sa) dw = h * ta; else dh = w / ta;
  image(x + (w - dw) * 0.5f, y + (h - dh) * 0.5f, dw, dh, tex, tint);
}

// ---------------------------------------------------------------------------
void UIRenderer::rect(f32 x, f32 y, f32 w, f32 h, const Vec4& color) {
  pushQuad(x, y, x + w, y + h, 0, 0, 0, 0, color);
}

void UIRenderer::rectOutline(f32 x, f32 y, f32 w, f32 h, const Vec4& color, f32 thickness) {
  rect(x, y, w, thickness, color);
  rect(x, y + h - thickness, w, thickness, color);
  rect(x, y + thickness, thickness, h - thickness * 2.0f, color);
  rect(x + w - thickness, y + thickness, thickness, h - thickness * 2.0f, color);
}

void UIRenderer::panel(f32 x, f32 y, f32 w, f32 h, f32 alpha) {
  Vec4 bg(0.055f, 0.062f, 0.070f, alpha);
  rect(x, y, w, h, bg);
  Vec4 edge(0.30f, 0.33f, 0.36f, alpha);
  rectOutline(x, y, w, h, edge, 1.0f);
  // subtle top highlight
  rect(x + 1, y + 1, w - 2, 1.0f, Vec4(0.45f, 0.48f, 0.52f, alpha * 0.35f));
}

void UIRenderer::gradientV(f32 x, f32 y, f32 w, f32 h, const Vec4& top, const Vec4& bottom) {
  const int steps = 24;
  for (int i = 0; i < steps; ++i) {
    f32 t = (f32)i / steps;
    f32 t2 = (f32)(i + 1) / steps;
    Vec4 c(lerpf(top.x, bottom.x, t), lerpf(top.y, bottom.y, t),
           lerpf(top.z, bottom.z, t), lerpf(top.w, bottom.w, t));
    rect(x, y + h * t, w, h * (t2 - t) + 1.0f, c);
  }
}

void UIRenderer::line(f32 x0, f32 y0, f32 x1, f32 y1, const Vec4& color, f32 thickness) {
  f32 dx = x1 - x0, dy = y1 - y0;
  f32 len = sqrtf(dx * dx + dy * dy);
  if (len < 1e-4f) return;
  f32 nx = -dy / len * thickness * 0.5f;
  f32 ny = dx / len * thickness * 0.5f;
  Batch& bt = batchFor(m_font);
  int b = (int)bt.verts.size();
  bt.verts.push_back({ x0 + nx, y0 + ny, 0, 0, color.x, color.y, color.z, color.w });
  bt.verts.push_back({ x1 + nx, y1 + ny, 0, 0, color.x, color.y, color.z, color.w });
  bt.verts.push_back({ x1 - nx, y1 - ny, 0, 0, color.x, color.y, color.z, color.w });
  bt.verts.push_back({ x0 - nx, y0 - ny, 0, 0, color.x, color.y, color.z, color.w });
  bt.indices.push_back(b); bt.indices.push_back(b + 1); bt.indices.push_back(b + 2);
  bt.indices.push_back(b); bt.indices.push_back(b + 2); bt.indices.push_back(b + 3);
}

// ---------------------------------------------------------------------------
void UIRenderer::text(f32 x, f32 y, const std::string& s, const Vec4& color, f32 scale) {
  const f32 cellW = 6.0f * scale;
  const f32 cellH = 8.0f * scale;
  f32 cx = x;
  for (size_t i = 0; i < s.size(); ++i) {
    char ch = s[i];
    if (ch == '\n') { cx = x; y += cellH; continue; }
    int idx = (int)(unsigned char)ch - 32;
    if (idx < 0 || idx >= 95) { cx += cellW; continue; }
    int col = idx % 16, row = idx / 16;
    f32 u0 = (f32)(col * 6) / 96.0f;
    f32 v0 = (f32)(row * 8) / 48.0f;
    f32 u1 = (f32)(col * 6 + 5) / 96.0f;
    f32 v1 = (f32)(row * 8 + 7) / 48.0f;
    pushQuad(cx, y, cx + cellW, y + cellH, u0, v0, u1, v1, color);
    cx += cellW;
  }
}

void UIRenderer::textShadow(f32 x, f32 y, const std::string& s, const Vec4& color, f32 scale) {
  text(x + scale, y + scale, s, Vec4(0, 0, 0, color.w * 0.75f), scale);
  text(x, y, s, color, scale);
}

f32 UIRenderer::textWidth(const std::string& s, f32 scale) const {
  f32 best = 0.0f, cur = 0.0f;
  for (char ch : s) {
    if (ch == '\n') { best = std::max(best, cur); cur = 0.0f; continue; }
    cur += 6.0f * scale;
  }
  return std::max(best, cur);
}

void UIRenderer::bar(f32 x, f32 y, f32 w, f32 h, f32 value, const Vec4& fill, const Vec4& back) {
  rect(x, y, w, h, back);
  f32 v = saturate(value);
  if (v > 0.0f) rect(x, y, w * v, h, fill);
  rectOutline(x, y, w, h, Vec4(0, 0, 0, 0.55f), 1.0f);
}

} // namespace aoh
