// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Immediate mode UI: font atlas, panels, bars and text.
// ============================================================================
#pragma once
#include "core/math.h"
#include "gfx/renderer.h"
#include <string>
#include <vector>

namespace aoh {

struct UIVertex { f32 x, y, u, v, r, g, b, a; };

class UIRenderer {
public:
  bool init(Renderer* renderer);
  void begin(int width, int height);
  void end();

  // Primitives (screen space, pixels, origin top-left)
  void rect(f32 x, f32 y, f32 w, f32 h, const Vec4& color);
  void rectOutline(f32 x, f32 y, f32 w, f32 h, const Vec4& color, f32 thickness = 1.0f);
  void panel(f32 x, f32 y, f32 w, f32 h, f32 alpha = 0.92f);
  void gradientV(f32 x, f32 y, f32 w, f32 h, const Vec4& top, const Vec4& bottom);
  void line(f32 x0, f32 y0, f32 x1, f32 y1, const Vec4& color, f32 thickness = 1.0f);
  void text(f32 x, f32 y, const std::string& s, const Vec4& color, f32 scale = 1.0f);
  void textShadow(f32 x, f32 y, const std::string& s, const Vec4& color, f32 scale = 1.0f);
  void bar(f32 x, f32 y, f32 w, f32 h, f32 value, const Vec4& fill, const Vec4& back);
  // Full bleed textured image.
  void image(f32 x, f32 y, f32 w, f32 h, GpuTexture* tex, const Vec4& tint);
  // Textured image scaled to fill the screen while preserving aspect.
  void imageCover(f32 x, f32 y, f32 w, f32 h, GpuTexture* tex, const Vec4& tint);
  f32  textWidth(const std::string& s, f32 scale = 1.0f) const;
  f32  lineHeight(f32 scale = 1.0f) const { return 8.0f * scale; }

  int width() const { return m_w; }
  int height() const { return m_h; }

private:
  struct Batch {
    GpuTexture* tex = nullptr;
    std::vector<UIVertex> verts;
    std::vector<int> indices;
  };

  void pushQuad(f32 x0, f32 y0, f32 x1, f32 y1, f32 u0, f32 v0, f32 u1, f32 v1, const Vec4& c);
  Batch& batchFor(GpuTexture* tex);

  Renderer* m_renderer = nullptr;
  GpuTexture* m_font = nullptr;
  std::vector<Batch> m_batches;
  int m_w = 1280, m_h = 720;
};

} // namespace aoh
