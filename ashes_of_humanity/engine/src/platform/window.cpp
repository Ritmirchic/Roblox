#include "platform/window.h"
#include "core/util.h"
#include <cstring>

#if defined(_WIN32)
#include <windows.h>
#endif

namespace aoh {

#if !defined(_WIN32)
static int   g_x11Keys[KEY_COUNT];
static int   g_x11KeysPressed[KEY_COUNT];
static int   g_x11Mouse[8];
static float g_x11MouseDx = 0, g_x11MouseDy = 0, g_x11MouseX = 0, g_x11MouseY = 0;
#endif

// ---------------------------------------------------------------------------
#if defined(_WIN32)
static LRESULT CALLBACK WndProc(HWND h, UINT msg, WPARAM wp, LPARAM lp) {
  Window* self = (Window*)GetWindowLongPtrA(h, GWLP_USERDATA);
  switch (msg) {
    case WM_CLOSE: if (self) self->requestClose(); return 0;
    case WM_DESTROY: if (self) self->requestClose(); return 0;
    case WM_SIZE: {
      if (self) {
        RECT rc; GetClientRect(h, &rc);
        self->m_width = rc.right - rc.left;
        self->m_height = rc.bottom - rc.top;
      }
      return 0;
    }
    case WM_SETFOCUS: if (self) self->m_focused = true; return 0;
    case WM_KILLFOCUS: if (self) self->m_focused = false; return 0;
    case WM_ACTIVATE: if (self) self->m_focused = (LOWORD(wp) != WA_INACTIVE); return 0;
  }
  return DefWindowProcA(h, msg, wp, lp);
}
#endif

bool Window::create(const WindowDesc& desc) {
  m_width = desc.width;
  m_height = desc.height;
#if defined(_WIN32)
  HINSTANCE inst = GetModuleHandleA(nullptr);
  WNDCLASSEXA wc = {};
  wc.cbSize = sizeof(wc);
  wc.style = WS_OVERLAPPEDWINDOW;
  wc.lpfnWndProc = WndProc;
  wc.hInstance = inst;
  wc.hCursor = LoadCursorA(nullptr, IDC_ARROW);
  wc.hIcon = LoadIconA(inst, MAKEINTRESOURCEA(1));
  if (!wc.hIcon) wc.hIcon = LoadIconA(nullptr, IDI_APPLICATION);
  wc.lpszClassName = "AshfallWindow";
  wc.hbrBackground = (HBRUSH)GetStockObject(BLACK_BRUSH);
  if (!RegisterClassExA(&wc)) {
    LOGE("window: RegisterClassEx failed (%u)", GetLastError());
    return false;
  }
  DWORD style = WS_OVERLAPPEDWINDOW;
  if (desc.fullscreen) style = WS_POPUP;
  RECT r{ 0, 0, desc.width, desc.height };
  AdjustWindowRect(&r, style, FALSE);
  HWND hwnd = CreateWindowExA(0, "AshfallWindow", desc.title.c_str(), style,
                              CW_USEDEFAULT, CW_USEDEFAULT, r.right - r.left, r.bottom - r.top,
                              nullptr, nullptr, inst, nullptr);
  if (!hwnd) {
    LOGE("window: CreateWindow failed (%u)", GetLastError());
    return false;
  }
  SetWindowLongPtrA(hwnd, GWLP_USERDATA, (LONG_PTR)this);
  {
    HICON icon = LoadIconA(inst, MAKEINTRESOURCEA(1));
    if (icon) SendMessageA(hwnd, WM_SETICON, ICON_SMALL, (LPARAM)icon);
    if (icon) SendMessageA(hwnd, WM_SETICON, ICON_BIG, (LPARAM)icon);
  }
  ShowWindow(hwnd, desc.fullscreen ? SW_SHOWMAXIMIZED : SW_SHOW);
  UpdateWindow(hwnd);
  m_handle = hwnd;
  return true;
#else
  // Headless host: no windowing available.
  (void)desc;
  LOGW("window: windowing not available on this platform (headless build)");
  return false;
#endif
}

void Window::destroy() {
#if defined(_WIN32)
  if (m_handle) { DestroyWindow((HWND)m_handle); m_handle = nullptr; }
#else
  m_handle = nullptr;
#endif
}

void Window::pumpEvents() {
#if defined(_WIN32)
  MSG msg;
  while (PeekMessageA(&msg, nullptr, 0, 0, PM_REMOVE)) {
    TranslateMessage(&msg);
    DispatchMessageA(&msg);
  }
#else
  // Headless host.
#endif
}

void Window::setTitle(const std::string& t) {
#if defined(_WIN32)
  if (m_handle) SetWindowTextA((HWND)m_handle, t.c_str());
#else
  (void)t;
#endif
}

void Window::setCursorVisible(bool v) {
#if defined(_WIN32)
  if (m_handle) {
    ShowCursor(v ? TRUE : FALSE);
    if (!v) SetCursor(nullptr);
  }
#endif
}

void Window::setCursorLocked(bool v) {
#if defined(_WIN32)
  if (!m_handle) return;
  if (v == m_cursorLocked) return;
  m_cursorLocked = v;
  RECT rc; GetWindowRect((HWND)m_handle, &rc);
  POINT c{ rc.left + (rc.right - rc.left) / 2, rc.top + (rc.bottom - rc.top) / 2 };
  if (v) {
    RECT clip; GetClientRect((HWND)m_handle, &clip);
    ClientToScreen((HWND)m_handle, (POINT*)&clip);
    clip.right = clip.left + (rc.right - rc.left);
    clip.bottom = clip.top + (rc.bottom - rc.top);
    ClipCursor(&clip);
    SetCursorPos(c.x, c.y);
  } else {
    ClipCursor(nullptr);
  }
#endif
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
static bool  g_keys[KEY_COUNT] = {false};
static bool  g_keysPrev[KEY_COUNT] = {false};
static bool  g_keysPressed[KEY_COUNT] = {false};
static bool  g_keysReleased[KEY_COUNT] = {false};
static bool  g_mouse[8] = {false};
static bool  g_mousePrev[8] = {false};
static bool  g_mousePressed[8] = {false};
static bool  g_mouseReleased[8] = {false};
static float g_mouseDx = 0, g_mouseDy = 0, g_wheel = 0;
static float g_mouseX = 0, g_mouseY = 0;

#if defined(_WIN32)
static int mapVk(int vk) {
  switch (vk) {
    case 'W': return KEY_W; case 'A': return KEY_A; case 'S': return KEY_S; case 'D': return KEY_D;
    case 'Q': return KEY_Q; case 'E': return KEY_E; case 'R': return KEY_R; case 'F': return KEY_F;
    case 'C': return KEY_C; case 'V': return KEY_V; case 'B': return KEY_B; case 'G': return KEY_G;
    case 'Z': return KEY_Z; case 'X': return KEY_X; case 'H': return KEY_H; case 'Y': return KEY_Y;
    case 'U': return KEY_U; case 'I': return KEY_I; case 'J': return KEY_J; case 'K': return KEY_K;
    case 'L': return KEY_L; case 'O': return KEY_O; case 'P': return KEY_P; case 'M': return KEY_M;
    case 'N': return KEY_N; case 'T': return KEY_T;
    case '0': return KEY_0; case '1': return KEY_1; case '2': return KEY_2; case '3': return KEY_3;
    case '4': return KEY_4; case '5': return KEY_5; case '6': return KEY_6; case '7': return KEY_7;
    case '8': return KEY_8; case '9': return KEY_9;
    case VK_ESCAPE: return KEY_ESCAPE; case VK_SPACE: return KEY_SPACE; case VK_RETURN: return KEY_ENTER;
    case VK_TAB: return KEY_TAB; case VK_BACK: return KEY_BACKSPACE;
    case VK_SHIFT: return KEY_SHIFT; case VK_CONTROL: return KEY_CTRL; case VK_MENU: return KEY_ALT;
    case VK_LEFT: return KEY_LEFT; case VK_RIGHT: return KEY_RIGHT; case VK_UP: return KEY_UP; case VK_DOWN: return KEY_DOWN;
    case VK_PRIOR: return KEY_PAGEUP; case VK_NEXT: return KEY_PAGEDOWN;
    case VK_HOME: return KEY_HOME; case VK_END: return KEY_END;
    case VK_INSERT: return KEY_INSERT; case VK_DELETE: return KEY_DELETE;
    case VK_LSHIFT: return KEY_LSHIFT; case VK_RSHIFT: return KEY_RSHIFT;
    case VK_LCONTROL: return KEY_LCTRL; case VK_RCONTROL: return KEY_RCTRL;
    case VK_LMENU: return KEY_LALT; case VK_RMENU: return KEY_RALT;
    case VK_OEM_MINUS: return KEY_MINUS; case VK_OEM_PLUS: return KEY_EQUAL;
    case VK_OEM_4: return KEY_LBRACKET; case VK_OEM_6: return KEY_RBRACKET;
    case VK_OEM_1: return KEY_SEMICOLON; case VK_OEM_7: return KEY_APOSTROPHE;
    case VK_OEM_3: return KEY_GRAVE; case VK_OEM_5: return KEY_BACKSLASH;
    case VK_OEM_COMMA: return KEY_COMMA; case VK_OEM_PERIOD: return KEY_PERIOD;
    case VK_OEM_2: return KEY_SLASH; case VK_CAPITAL: return KEY_CAPSLOCK;
    case VK_F1: return KEY_F1; case VK_F2: return KEY_F2; case VK_F3: return KEY_F3; case VK_F4: return KEY_F4;
    case VK_F5: return KEY_F5; case VK_F6: return KEY_F6; case VK_F7: return KEY_F7; case VK_F8: return KEY_F8;
    case VK_F9: return KEY_F9; case VK_F10: return KEY_F10; case VK_F11: return KEY_F11; case VK_F12: return KEY_F12;
    default: return KEY_NONE;
  }
}
#endif

void Input::beginFrame() {
  memcpy(g_keysPrev, g_keys, sizeof(g_keys));
  memcpy(g_mousePrev, g_mouse, sizeof(g_mouse));
  memset(g_keysPressed, 0, sizeof(g_keysPressed));
  memset(g_keysReleased, 0, sizeof(g_keysReleased));
  memset(g_mousePressed, 0, sizeof(g_mousePressed));
  memset(g_mouseReleased, 0, sizeof(g_mouseReleased));
  g_mouseDx = g_mouseDy = 0;
  g_wheel = 0;
#if defined(_WIN32)
  // Poll the whole virtual key range: the engine key codes are not the same
  // numbers as the Windows ones.
  static const int kMouseVk[5] = { VK_LBUTTON, VK_RBUTTON, VK_MBUTTON,
                                    VK_XBUTTON1, VK_XBUTTON2 };
  for (int i = 0; i < 256; ++i) {
    int code = mapVk(i);
    if (code == KEY_NONE) continue;
    bool down = (GetAsyncKeyState(i) & 0x8000) != 0;
    if (down && !g_keys[code]) g_keysPressed[code] = true;
    if (!down && g_keys[code]) g_keysReleased[code] = true;
    g_keys[code] = down;
  }
  for (int b = 0; b < 5; ++b) {
    bool down = (GetAsyncKeyState(kMouseVk[b]) & 0x8000) != 0;
    if (down && !g_mouse[b]) g_mousePressed[b] = true;
    if (!down && g_mouse[b]) g_mouseReleased[b] = true;
    g_mouse[b] = down;
  }
  POINT pt; GetCursorPos(&pt);
  g_mouseX = (float)pt.x; g_mouseY = (float)pt.y;
#else
  for (int i = 0; i < KEY_COUNT; ++i) {
    bool down = g_x11Keys[i] != 0;
    if (down && !g_keys[i]) g_keysPressed[i] = true;
    if (!down && g_keys[i]) g_keysReleased[i] = true;
    g_keys[i] = down;
  }
  for (int b = 0; b < 5; ++b) {
    bool down = g_x11Mouse[b] != 0;
    if (down && !g_mouse[b]) g_mousePressed[b] = true;
    if (!down && g_mouse[b]) g_mouseReleased[b] = true;
    g_mouse[b] = down;
  }
  g_mouseDx = g_x11MouseDx; g_mouseDy = g_x11MouseDy;
  g_x11MouseDx = g_x11MouseDy = 0;
  g_mouseX = g_x11MouseX; g_mouseY = g_x11MouseY;
#endif
}

bool Input::keyDown(Key k) { return (k >= 0 && k < KEY_COUNT) ? g_keys[k] : false; }
bool Input::keyPressed(Key k) { return (k >= 0 && k < KEY_COUNT) ? g_keysPressed[k] : false; }
bool Input::keyReleased(Key k) { return (k >= 0 && k < KEY_COUNT) ? g_keysReleased[k] : false; }
bool Input::mouseDown(MouseButton b) { return g_mouse[b]; }
bool Input::mousePressed(MouseButton b) { return g_mousePressed[b]; }
bool Input::mouseReleased(MouseButton b) { return g_mouseReleased[b]; }
float Input::mouseDeltaX() { return g_mouseDx; }
float Input::mouseDeltaY() { return g_mouseDy; }
float Input::wheelDelta() { return g_wheel; }
float Input::mouseX() { return g_mouseX; }
float Input::mouseY() { return g_mouseY; }
void Input::reset() {
  memset(g_keys, 0, sizeof(g_keys));
  memset(g_mouse, 0, sizeof(g_mouse));
}

bool inputTextEvent(std::string& out) {
  out.clear();
  return false;
}

} // namespace aoh
