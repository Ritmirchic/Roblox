#pragma once
#include "platform/gl_types.h"

namespace aoh {

struct GLContextDesc {
  int  width = 1280;
  int  height = 720;
  bool vsync = true;
  bool coreProfile = true;
};

// nativeWindow: on Win32 an HWND, on X11 a Display*. Returns false on failure.
bool glInit(void* nativeWindow, const GLContextDesc& desc);
void glShutdown();
void glSwapBuffers();
void glGetDrawableSize(int& w, int& h);
void glSetDrawableSize(int w, int h);
const char* glVersion();
const char* glRenderer();
int  glLoadErrorCount();   // number of functions that failed to resolve
}
