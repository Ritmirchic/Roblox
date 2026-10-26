#include "platform/gl.h"
#include "core/util.h"
#include <vector>

#if defined(_WIN32)
#include <windows.h>
#else
#include <dlfcn.h>
#endif

// GL entry points live at global scope (see platform/gl_types.h).
#define AOH_DEF(ret, name, args) PFN_##name name = nullptr;
AOH_GL_FUNCS(AOH_DEF)
#undef AOH_DEF


namespace aoh {

static int g_loadErrors = 0;
static int g_drawW = 1280, g_drawH = 720;

#if defined(_WIN32)
typedef void* (WINAPI* PFN_wglGetProcAddress)(const char*);
typedef HGLRC (WINAPI* PFN_wglCreateContext)(HDC);
typedef BOOL  (WINAPI* PFN_wglMakeCurrent)(HDC, HGLRC);
typedef BOOL  (WINAPI* PFN_wglChoosePixelFormatARB)(HDC, const int*, const FLOAT*, UINT, UINT, int*, UINT*);
typedef HGLRC (WINAPI* PFN_wglCreateContextAttribsARB)(HDC, HGLRC, const int*);
typedef const char* (WINAPI* PFN_wglGetExtensionsStringARB)(HDC);
static HMODULE g_opengl32 = nullptr;
static PFN_wglGetProcAddress s_wglGetProcAddress = nullptr;
static HDC g_hdc = nullptr;
static HGLRC g_hglrc = nullptr;
#else
// The headless host has no GL context provider; the loader stays inert.
static void* g_libgl = nullptr;
#endif

static void* loadProc(const char* name) {
#if defined(_WIN32)
  void* p = s_wglGetProcAddress ? s_wglGetProcAddress(name) : nullptr;
  if (!p && g_opengl32) p = (void*)GetProcAddress(g_opengl32, name);
  return p;
#else
  (void)name;
  return nullptr;
#endif
}

bool glInit(void* nativeWindow, const GLContextDesc& desc) {
#if defined(_WIN32)
  HWND hwnd = (HWND)nativeWindow;
  g_hdc = GetDC(hwnd);
  if (!g_hdc) { LOGE("gl: GetDC failed"); return false; }

  PIXELFORMATDESCRIPTOR pfd = {};
  pfd.nSize = sizeof(pfd);
  pfd.nVersion = 1;
  pfd.dwFlags = PFD_DRAW_TO_WINDOW | PFD_SUPPORT_OPENGL | PFD_DOUBLEBUFFER;
  pfd.iPixelType = PFD_TYPE_RGBA;
  pfd.cColorBits = 32;
  pfd.cDepthBits = 24;
  pfd.cStencilBits = 8;
  pfd.iLayerType = PFD_MAIN_PLANE;
  int pf = ChoosePixelFormat(g_hdc, &pfd);
  if (!pf) { LOGE("gl: ChoosePixelFormat failed"); return false; }
  if (!SetPixelFormat(g_hdc, pf, &pfd)) { LOGE("gl: SetPixelFormat failed"); return false; }

  g_opengl32 = LoadLibraryA("opengl32.dll");
  if (!g_opengl32) { LOGE("gl: opengl32.dll missing"); return false; }
  s_wglGetProcAddress = (PFN_wglGetProcAddress)GetProcAddress(g_opengl32, "wglGetProcAddress");
  PFN_wglCreateContext wglCreateContext = (PFN_wglCreateContext)GetProcAddress(g_opengl32, "wglCreateContext");
  PFN_wglMakeCurrent wglMakeCurrent = (PFN_wglMakeCurrent)GetProcAddress(g_opengl32, "wglMakeCurrent");
  PFN_wglChoosePixelFormatARB wglChoosePixelFormatARB =
      (PFN_wglChoosePixelFormatARB)GetProcAddress(g_opengl32, "wglChoosePixelFormatARB");
  PFN_wglCreateContextAttribsARB wglCreateContextAttribsARB =
      (PFN_wglCreateContextAttribsARB)GetProcAddress(g_opengl32, "wglCreateContextAttribsARB");

  // Try a modern pixel format first (double buffered RGBA8 + depth24 stencil8).
  if (wglChoosePixelFormatARB) {
    const int pfAttribs[] = {
      0x2000 + 1, 0x00000001,  // WGL_DRAW_TO_WINDOW_ARB
      0x2000 + 2, 0x00000001,  // WGL_SUPPORT_OPENGL_ARB
      0x2000 + 3, 0x00000001,  // WGL_DOUBLEBUFFER_ARB
      0x2010 + 0, 8,           // WGL_RED_BITS_ARB
      0x2010 + 1, 8,           // WGL_GREEN_BITS_ARB
      0x2010 + 2, 8,           // WGL_BLUE_BITS_ARB
      0x2010 + 3, 8,           // WGL_ALPHA_BITS_ARB
      0x2010 + 5, 24,          // WGL_DEPTH_BITS_ARB
      0x2010 + 6, 8,           // WGL_STENCIL_BITS_ARB
      0x2010 + 8, 0x0020,      // WGL_PIXEL_TYPE_ARB = RGBA
      0
    };
    int pfId = 0; UINT n = 0;
    if (wglChoosePixelFormatARB(g_hdc, pfAttribs, nullptr, 1, 0, &pfId, &n) && n > 0 && pfId) {
      PIXELFORMATDESCRIPTOR pfd2 = {};
      DescribePixelFormat(g_hdc, pfId, sizeof(pfd2), &pfd2);
      SetPixelFormat(g_hdc, pfId, &pfd2);
    }
  }

  g_hglrc = wglCreateContext(g_hdc);
  if (!g_hglrc) { LOGE("gl: wglCreateContext failed"); return false; }
  if (!wglMakeCurrent(g_hdc, g_hglrc)) { LOGE("gl: wglMakeCurrent failed"); return false; }

  if (wglCreateContextAttribsARB) {
    const int ctxAttribs[] = {
      0x2091, 0x00000003,  // WGL_CONTEXT_MAJOR_VERSION_ARB
      0x2092, 0x00000003,  // WGL_CONTEXT_MINOR_VERSION_ARB
      0x9126, 0x00000001,  // WGL_CONTEXT_PROFILE_MASK_ARB
      0x00000001,          // WGL_CONTEXT_CORE_PROFILE_BIT_ARB
      0
    };
    HGLRC rc2 = wglCreateContextAttribsARB(g_hdc, nullptr, ctxAttribs);
    if (rc2) {
      wglMakeCurrent(g_hdc, rc2);
      wglMakeCurrent(g_hdc, nullptr);
      wglDeleteContext(g_hglrc);
      g_hglrc = rc2;
      wglMakeCurrent(g_hdc, g_hglrc);
    }
  }
#else
  // Headless host: no GL context can be created.
  (void)nativeWindow;
  LOGW("gl: OpenGL is not available on the headless host");
  return false;
#endif

#define AOH_LOAD(ret, name, args)                                              \
  name = (PFN_##name)loadProc(#name);                                          \
  if (!name) { g_loadErrors++; LOGW("gl: could not resolve %s", #name); }
  AOH_GL_FUNCS(AOH_LOAD)
#undef AOH_LOAD

  const char* ver = glGetString ? (const char*)glGetString(GL_VERSION) : nullptr;
  LOGI("gl: version=%s renderer=%s", ver ? ver : "?", glGetString ? (const char*)glGetString(GL_RENDERER) : "?");
  if (ver && !strstr(ver, "OpenGL")) { g_loadErrors++; }
  return g_loadErrors == 0;
}

void glShutdown() {
#if defined(_WIN32)
  if (g_hdc) { ReleaseDC((HWND)nullptr, g_hdc); g_hdc = nullptr; }
  if (g_opengl32) { FreeLibrary(g_opengl32); g_opengl32 = nullptr; }
#else
  if (g_libgl) { dlclose(g_libgl); g_libgl = nullptr; }
#endif
}

void glSwapBuffers() {
#if defined(_WIN32)
  if (g_hdc) SwapBuffers(g_hdc);
#endif
}

void glGetDrawableSize(int& w, int& h) { w = g_drawW; h = g_drawH; }
void glSetDrawableSize(int w, int h) { g_drawW = w; g_drawH = h; }

const char* glVersion() { return glGetString ? (const char*)glGetString(GL_VERSION) : ""; }
const char* glRenderer() { return glGetString ? (const char*)glGetString(GL_RENDERER) : ""; }
int glLoadErrorCount() { return g_loadErrors; }
}
