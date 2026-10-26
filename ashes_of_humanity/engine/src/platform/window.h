#pragma once
#include "core/math.h"
#include <string>

namespace aoh {

// Virtual key codes (engine independent)
enum Key {
  KEY_NONE = 0,
  KEY_ESCAPE = 1, KEY_F1, KEY_F2, KEY_F3, KEY_F4, KEY_F5, KEY_F6, KEY_F7, KEY_F8, KEY_F9, KEY_F10, KEY_F11, KEY_F12,
  KEY_0, KEY_1, KEY_2, KEY_3, KEY_4, KEY_5, KEY_6, KEY_7, KEY_8, KEY_9,
  KEY_A, KEY_B, KEY_C, KEY_D, KEY_E, KEY_F, KEY_G, KEY_H, KEY_I, KEY_J, KEY_K, KEY_L, KEY_M,
  KEY_N, KEY_O, KEY_P, KEY_Q, KEY_R, KEY_S, KEY_T, KEY_U, KEY_V, KEY_W, KEY_X, KEY_Y, KEY_Z,
  KEY_SPACE, KEY_ENTER, KEY_ESC, KEY_TAB, KEY_BACKSPACE, KEY_SHIFT, KEY_CTRL, KEY_ALT,
  KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_PAGEUP, KEY_PAGEDOWN, KEY_HOME, KEY_END, KEY_INSERT, KEY_DELETE,
  KEY_LSHIFT, KEY_RSHIFT, KEY_LCTRL, KEY_RCTRL, KEY_LALT, KEY_RALT,
  KEY_MINUS, KEY_EQUAL, KEY_LBRACKET, KEY_RBRACKET, KEY_SEMICOLON, KEY_APOSTROPHE,
  KEY_GRAVE, KEY_BACKSLASH, KEY_COMMA, KEY_PERIOD, KEY_SLASH, KEY_CAPSLOCK,
  KEY_COUNT
};

enum MouseButton { MOUSE_LEFT = 0, MOUSE_RIGHT, MOUSE_MIDDLE, MOUSE_BUTTON4, MOUSE_BUTTON5 };

struct WindowDesc {
  int width = 1280;
  int height = 720;
  std::string title = "Ashes of Humanity: Last Signal";
  bool fullscreen = false;
  bool vsync = true;
};

class Window {
public:
  bool create(const WindowDesc& desc);
  void destroy();
  void pumpEvents();
  bool shouldClose() const { return m_close; }
  void requestClose() { m_close = true; }
  void* nativeHandle() const { return m_handle; }
  int width() const { return m_width; }
  int height() const { return m_height; }
  void setTitle(const std::string& t);
  void setCursorVisible(bool v);
  void setCursorLocked(bool v);
  bool isCursorLocked() const { return m_cursorLocked; }
  bool isFocused() const { return m_focused; }
  int  displayIndex() const { return m_display; }

  // Platform state (public so the native window procedure can update it).
  void* m_handle = nullptr;
  int m_width = 1280, m_height = 720;
  bool m_close = false;
  bool m_cursorLocked = false;
  bool m_focused = true;
  int  m_display = 0;
  unsigned long m_x11win = 0;
};

// ---------------------------------------------------------------------------
class Input {
public:
  static void beginFrame();
  static bool keyDown(Key k);
  static bool keyPressed(Key k);
  static bool keyReleased(Key k);
  static bool mouseDown(MouseButton b);
  static bool mousePressed(MouseButton b);
  static bool mouseReleased(MouseButton b);
  static float mouseDeltaX();
  static float mouseDeltaY();
  static float wheelDelta();
  static float mouseX();
  static float mouseY();
  static void reset();
};

// Text input (console / chat)
bool inputTextEvent(std::string& out);
}
