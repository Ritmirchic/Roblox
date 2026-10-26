// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Entry point.
// ============================================================================
#include "core/util.h"
#include "game/game.h"
#include "platform/window.h"
#include <cstdio>
#include <cstring>
#include <string>

using namespace aoh;

#ifdef _WIN32
#include <windows.h>
static void hideConsole() {
  HWND h = GetConsoleWindow();
  if (h) ShowWindow(h, SW_HIDE);
}
#else
static void hideConsole() {}
#endif

int main(int argc, char** argv) {
  logInit("ashes_log.txt");

  int width = 1280, height = 720;
  bool fullscreen = false;
  bool headless = false;
  bool runTests = false;
  float simSeconds = 0.0f;
  u32 seed = 20241;

  for (int i = 1; i < argc; ++i) {
    std::string a = argv[i];
    auto next = [&](const char* def) -> std::string {
      if (i + 1 < argc) return argv[++i];
      return def;
    };
    if (a == "--width") width = atoi(next("1280").c_str());
    else if (a == "--height") height = atoi(next("720").c_str());
    else if (a == "--fullscreen") fullscreen = true;
    else if (a == "--headless") headless = true;
    else if (a == "--test") runTests = true;
    else if (a == "--sim") simSeconds = (float)atof(next("30").c_str());
    else if (a == "--seed") seed = (u32)atoi(next("20241").c_str());
    else if (a == "--help" || a == "-h") {
      printf("ASHES OF HUMANITY: LAST SIGNAL\n"
             "  --width N --height N   window size\n"
             "  --fullscreen           borderless fullscreen\n"
             "  --headless             no window, logic only\n"
             "  --test                 run the automated system tests and exit\n"
             "  --seed N               world seed\n"
             "  --sim SECONDS          headless gameplay simulation\n");
      return 0;
    }
  }

  // Resolve the data root: prefer the working directory, fall back to the
  // directory next to the executable.
  if (!dirExists("assets")) {
    std::string ex = exeDir();
    setDataRoot(joinPath(ex, "assets"));
    if (!dirExists(joinPath(ex, "assets"))) setDataRoot("assets");
  }

  Game game;

  if (simSeconds > 0.0f) {
    if (!game.init(nullptr, width, height)) { LOGE("main: game init failed"); return 2; }
    game.simulate(simSeconds);
    game.shutdown();
    logShutdown();
    return 0;
  }

  if (runTests) {
    // Logic-only run: no window, no GPU.
    if (!game.init(nullptr, width, height)) {
      LOGE("main: game init failed");
      return 2;
    }
    int failures = game.runTests();
    game.shutdown();
    logShutdown();
    return failures == 0 ? 0 : 1;
  }

  // A clean window in normal play; the console stays for --test and --sim.
  hideConsole();

  WindowDesc wd;
  wd.width = width; wd.height = height;
  wd.title = "ASHES OF HUMANITY: LAST SIGNAL";
  wd.fullscreen = fullscreen;

  Window window;
  if (!headless && !window.create(wd)) {
    LOGE("main: window creation failed");
    printf("Could not create a window (no display?).\n"
           "Run with --test for the automated system tests.\n");
    logShutdown();
    return 3;
  }

  if (!game.init(window.nativeHandle(), width, height)) {
    LOGE("main: game init failed");
    window.destroy();
    logShutdown();
    return 2;
  }

  game.run();
  game.shutdown();
  window.destroy();
  logShutdown();
  return 0;
}
