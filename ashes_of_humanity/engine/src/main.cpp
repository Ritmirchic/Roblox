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
static void fatalBox(const char* text) {
  MessageBoxA(nullptr, text, "ASHES OF HUMANITY: LAST SIGNAL", MB_OK | MB_ICONERROR);
}
#else
static void hideConsole() {}
static void fatalBox(const char*) {}
#endif

int main(int argc, char** argv) {
  // The log always lands next to the executable so a crash can be inspected.
  {
    std::string logPath = joinPath(exeDir(), "ashes_log.txt");
    logInit(logPath);
  }

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
  bool haveAssets = dirExists("assets");
  if (!haveAssets) {
    std::string ex = exeDir();
    setDataRoot(joinPath(ex, "assets"));
    haveAssets = dirExists(joinPath(ex, "assets"));
    if (!haveAssets) setDataRoot("assets");
  }
  if (!haveAssets && !runTests && simSeconds <= 0.0f) {
    fatalBox("The 'assets' folder was not found.\n\n"
             "Keep the game folder structure intact: 'assets' has to sit next to\n"
             "AshesOfHumanity.exe.  Reinstall the game or unzip the archive again.");
    return 3;
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
  game.setWindow(&window);
  if (!headless && !window.create(wd)) {
    LOGE("main: window creation failed");
    printf("Could not create a window (no display?).\n"
           "Run with --test for the automated system tests.\n");
    logShutdown();
    return 3;
  }

  if (!game.init(window.nativeHandle(), width, height)) {
    LOGE("main: game init failed");
    fatalBox("The game could not start.\n\n"
             "Your graphics driver may not support OpenGL 3.3.  See ashes_log.txt\n"
             "next to the executable for the full log.");
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
