// platform_win32.cpp - Win32 window, GDI presentation, WaveOut audio, input
//
// Presentation notes (this file used to show a permanently black window on some machines):
//  * the old code created a memory DC from a screen DC that had already been released with
//    ReleaseDC(); when that handle was rejected by CreateCompatibleDC() every BitBlt() failed
//    silently and the window kept its black class background forever. Nothing is cached from
//    a DC any more - each frame is pushed straight to the window DC with SetDIBitsToDevice().
//  * the window used to open as a borderless popup at full desktop resolution, so the very
//    first frame could take seconds on a 4K display with no feedback at all. It now opens
//    windowed at a conservative size and shows a splash while the world builds.
//  * every stage of startup is written to fracture_log.txt, and a fatal error shows a message
//    box instead of leaving a silent black rectangle behind.

#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#include <mmsystem.h>
#include <cstdio>
#include <cstring>
#include <cctype>
#include <cstdint>
#include <string>
#include <vector>
#include "frac.h"

static HWND g_hwnd = nullptr;
static int g_clientW = 1280, g_clientH = 720;
static bool g_running = true;
static bool g_captured = false;
static bool g_fullscreen = false;
static RECT g_windowedRect = {0, 0, 1280, 720};
static LONG g_windowedStyle = WS_OVERLAPPEDWINDOW;
static LARGE_INTEGER g_qpcFreq, g_qpcStart;
static bool g_presentLogged = false;
static bool g_presentBroken = false;
static int g_presentFails = 0;
static bool g_presentFatalShown = false;

// ------------------------------------------------------------------ crash reporting
static LONG WINAPI crashFilter(EXCEPTION_POINTERS* ep) {
    unsigned long code = 0;
    void* addr = nullptr;
    if (ep && ep->ExceptionRecord) {
        code = ep->ExceptionRecord->ExceptionCode;
        addr = ep->ExceptionRecord->ExceptionAddress;
    }
    logf("[crash] unhandled exception %08lX at %p", code, addr);
    if (g_logFile) fflush(g_logFile);
    char msg[512];
    snprintf(msg, sizeof(msg),
             "FRACTURE crashed.\n\nException code: 0x%08lX\nAddress: %p\n\n"
             "A log was written next to the executable (fracture_log.txt).",
             code, addr);
    MessageBoxA(nullptr, msg, "FRACTURE - fatal error", MB_ICONERROR | MB_OK);
    return EXCEPTION_EXECUTE_HANDLER;
}

// ------------------------------------------------------------------ audio
#define AUDIO_BUFFERS 3
#define AUDIO_FRAMES 1024
static HWAVEOUT g_wave = nullptr;
static WAVEHDR g_waveHdr[AUDIO_BUFFERS];
static short g_waveData[AUDIO_BUFFERS][AUDIO_FRAMES * 2];
static HANDLE g_audioEvent = nullptr;
static bool g_audioRunning = false;
static DWORD g_audioThreadId = 0;

static DWORD WINAPI audioThread(LPVOID) {
    float mixbuf[AUDIO_FRAMES * 2];
    while (g_audioRunning) {
        WaitForSingleObject(g_audioEvent, 100);
        for (int i = 0; i < AUDIO_BUFFERS; i++) {
            if (g_waveHdr[i].dwFlags & WHDR_DONE) {
                Vec3 eye = g_game.player.pos + Vec3(0, g_game.player.eyeHeight, 0);
                if (g_game.player.inVehicle) eye = g_game.vehicles[g_game.player.vehicle].pos;
                g_audio.mix(mixbuf, AUDIO_FRAMES, 2, eye, g_renderer.camRight);
                for (int k = 0; k < AUDIO_FRAMES * 2; k++) {
                    float v = clampf(mixbuf[k], -1.0f, 1.0f);
                    g_waveData[i][k] = short(v * 32000.0f);
                }
                g_waveHdr[i].dwFlags &= ~WHDR_DONE;
                waveOutWrite(g_wave, &g_waveHdr[i], sizeof(WAVEHDR));
                break;
            }
        }
    }
    return 0;
}

static void initAudio() {
    WAVEFORMATEX fmt;
    memset(&fmt, 0, sizeof(fmt));
    fmt.wFormatTag = WAVE_FORMAT_PCM;
    fmt.nChannels = 2;
    fmt.nSamplesPerSec = 22050;
    fmt.wBitsPerSample = 16;
    fmt.nBlockAlign = fmt.nChannels * fmt.wBitsPerSample / 8;
    fmt.nAvgBytesPerSec = fmt.nSamplesPerSec * fmt.nBlockAlign;
    g_audioEvent = CreateEventW(nullptr, FALSE, FALSE, nullptr);
    if (waveOutOpen(&g_wave, WAVE_MAPPER, &fmt, (DWORD_PTR)g_audioEvent, 0, CALLBACK_EVENT) !=
        MMSYSERR_NOERROR) {
        logf("[audio] waveOutOpen failed, running silent");
        g_audio.enabled = false;
        return;
    }
    for (int i = 0; i < AUDIO_BUFFERS; i++) {
        memset(&g_waveHdr[i], 0, sizeof(WAVEHDR));
        g_waveHdr[i].lpData = (LPSTR)g_waveData[i];
        g_waveHdr[i].dwBufferLength = AUDIO_FRAMES * 2 * sizeof(short);
        waveOutPrepareHeader(g_wave, &g_waveHdr[i], sizeof(WAVEHDR));
        g_waveHdr[i].dwFlags |= WHDR_DONE;
    }
    g_audioRunning = true;
    CreateThread(nullptr, 0, audioThread, nullptr, 0, &g_audioThreadId);
    logf("[audio] waveOut opened %d Hz stereo", int(fmt.nSamplesPerSec));
}

// ------------------------------------------------------------------ helpers
double platformTime() {
    LARGE_INTEGER now;
    QueryPerformanceCounter(&now);
    return double(now.QuadPart - g_qpcStart.QuadPart) / double(g_qpcFreq.QuadPart);
}
void platformSleep(int ms) { Sleep(ms); }
void platformRequestQuit() { g_running = false; }
void platformMkdir(const char* path) { CreateDirectoryA(path, nullptr); }
void platformMixAudio(float* buf, int frames) { (void)buf; (void)frames; }

static int clientWidth() {
    RECT rc;
    GetClientRect(g_hwnd, &rc);
    int w = rc.right - rc.left;
    return w > 0 ? w : 1;
}
static int clientHeight() {
    RECT rc;
    GetClientRect(g_hwnd, &rc);
    int h = rc.bottom - rc.top;
    return h > 0 ? h : 1;
}

// ------------------------------------------------------------------ presentation
// The renderer writes BGRA bytes, which is exactly what a 32-bit BI_RGB DIB expects, so the
// frame is handed to GDI with no colour conversion. Sizes are matched defensively: if the
// client area and the render target ever disagree the frame is fitted instead of memcpy'd out
// of bounds.
static std::vector<uint32_t> g_present;

// Hands one BGRA frame to GDI. Shared by the game loop and the startup self-test.
static bool blitFrame(const void* pixels, int w, int h) {
    if (!g_hwnd || !pixels || w <= 0 || h <= 0) return false;
    BITMAPINFO bi;
    memset(&bi, 0, sizeof(bi));
    bi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    bi.bmiHeader.biWidth = w;
    bi.bmiHeader.biHeight = -h;   // top-down rows
    bi.bmiHeader.biPlanes = 1;
    bi.bmiHeader.biBitCount = 32;
    bi.bmiHeader.biCompression = BI_RGB;
    HDC dc = GetDC(g_hwnd);
    if (!dc) return false;
    int ok = SetDIBitsToDevice(dc, 0, 0, w, h, 0, 0, 0, h, pixels, &bi, DIB_RGB_COLORS);
    if (!ok)
        ok = StretchDIBits(dc, 0, 0, w, h, 0, 0, w, h, pixels, &bi, DIB_RGB_COLORS, SRCCOPY);
    ReleaseDC(g_hwnd, dc);
    return ok != 0;
}

// Proves on the customer's own machine that frames actually reach the window: paints four
// known colour patches, pushes them through the real presentation path and reads them back.
// The verdict goes to fracture_log.txt, so a "black screen" report is diagnosable.
static void selftestPresent() {
    int w = g_clientW, h = g_clientH;
    if (w < 16 || h < 16) {
        logf("[selftest] client area too small (%dx%d)", w, h);
        return;
    }
    std::vector<uint32_t> buf(size_t(w) * h);
    // memory order is B,G,R,X, exactly what a 32-bit DIB expects
    const uint32_t red = 0x000000FFu, green = 0x0000FF00u, blue = 0x00FF0000u,
                   white = 0x00FFFFFFu;
    for (int y = 0; y < h; y++)
        for (int x = 0; x < w; x++) {
            uint32_t c = (y < h / 2) ? (x < w / 2 ? red : green) : (x < w / 2 ? blue : white);
            buf[size_t(y) * w + x] = c;
        }
    bool blitted = blitFrame(buf.data(), w, h);
    HDC dc = GetDC(g_hwnd);
    COLORREF r1 = 0, r2 = 0, r3 = 0, r4 = 0;
    if (dc) {
        r1 = GetPixel(dc, w / 4, h / 4);
        r2 = GetPixel(dc, 3 * w / 4, h / 4);
        r3 = GetPixel(dc, w / 4, 3 * h / 4);
        r4 = GetPixel(dc, 3 * w / 4, 3 * h / 4);
        ReleaseDC(g_hwnd, dc);
    }
    bool ok = blitted && r1 == 0x000000FFu && r2 == 0x0000FF00u && r3 == 0x00FF0000u &&
              r4 == 0x00FFFFFFu;
    logf("[selftest] presentation %s (blit=%d read back %06lX %06lX %06lX %06lX)", ok ? "OK" : "FAILED",
         blitted ? 1 : 0, (unsigned long)r1, (unsigned long)r2, (unsigned long)r3,
         (unsigned long)r4);
    if (!blitted) {
        logf("[selftest] the window is not receiving frames - the DIB blit is not working on "
             "this system");
        MessageBoxA(g_hwnd,
                    "FRACTURE could not draw into its window on this system.\n\n"
                    "Please send fracture_log.txt (next to the executable) with your report.\n\n"
                    "The game will keep running so you can still try the audio and controls.",
                    "FRACTURE - display problem", MB_ICONWARNING | MB_OK);
    }
}

static void presentFrame() {
    if (!g_hwnd) return;
    const uint32_t* src = g_renderer.framebuffer();
    if (!src) return;
    int sw = g_renderer.set.width, sh = g_renderer.set.height;
    if (sw <= 0 || sh <= 0) return;
    int w = g_clientW, h = g_clientH;
    if (w <= 0 || h <= 0) return;

    const uint32_t* pixels = src;
    if (w != sw || h != sh) {
        g_present.resize(size_t(w) * h);
        for (int y = 0; y < h; y++) {
            int sy = int(int64_t(y) * sh / h);
            if (sy >= sh) sy = sh - 1;
            const uint32_t* srow = src + size_t(sy) * sw;
            uint32_t* drow = g_present.data() + size_t(y) * w;
            if (sw == w) {
                memcpy(drow, srow, size_t(w) * 4);
            } else {
                for (int x = 0; x < w; x++) {
                    int sx = int(int64_t(x) * sw / w);
                    if (sx >= sw) sx = sw - 1;
                    drow[x] = srow[sx];
                }
            }
        }
        pixels = g_present.data();
    }

    bool ok = blitFrame(pixels, w, h);
    if (!ok) {
        if (!g_presentBroken) {
            g_presentBroken = true;
            logf("[video] DIB presentation failed (err %lu) - retrying next frame",
                 GetLastError());
        }
        if (++g_presentFails == 180 && !g_presentFatalShown) {
            g_presentFatalShown = true;
            logf("[video] presentation has failed %d frames in a row", g_presentFails);
            MessageBoxA(g_hwnd,
                        "FRACTURE cannot present frames on this system (GDI rejected every "
                        "blit).\n\nThe log file next to the executable has the error codes.",
                        "FRACTURE - display problem", MB_ICONERROR | MB_OK);
        }
        return;
    }
    if (!g_presentLogged) {
        g_presentLogged = true;
        // mean luminance of the frame we are about to show: tells a black renderer apart from
        // a renderer whose output never reaches the window
        long long sum = 0;
        int samples = 0;
        int step = (h / 24) > 0 ? h / 24 : 1;
        for (int y = 0; y < h; y += step) {
            const uint32_t* row = pixels + size_t(y) * w;
            for (int x = 0; x < w; x += 8) {
                uint32_t c = row[x];
                sum += (c & 255) + ((c >> 8) & 255) + ((c >> 16) & 255);
                samples++;
            }
        }
        float mean = samples ? float(sum) / float(samples * 3) : -1.0f;
        logf("[video] presenting %dx%d (frame %dx%d) mean luminance %.0f", w, h, sw, sh, mean);
    }
    g_presentBroken = false;
    g_presentFails = 0;
}

// Draws a centred message over a dark frame and pushes it to the screen immediately, so the
// window never sits empty while the world is being generated.
static void splash(const char* title, const char* subtitle) {
    Renderer& R = g_renderer;
    R.set.width = g_clientW;
    R.set.height = g_clientH;
    R.begin();
    R.finish();
    float W = float(R.set.width), H = float(R.set.height);
    R.uiRect(0, 0, W, H, 0xFF0A0C10);
    R.uiRect(0, H * 0.5f - 78.0f, W, 3.0f, 0xFFE8A33D);
    R.uiBigText(W * 0.5f - R.uiBigTextWidth(title, 1.4f) * 0.5f, H * 0.5f - 78.0f, title,
                0xFFFFFFFF, 1.4f);
    if (subtitle)
        R.uiText(W * 0.5f - R.uiTextWidth(subtitle, 1.2f) * 0.5f, H * 0.5f + 26.0f, subtitle,
                 0xFFB9C2CC, 1.2f);
    presentFrame();
    logf("[boot] splash: %s", subtitle ? subtitle : title);
}

// ------------------------------------------------------------------ window
static void setCapture(bool on) {
    if (on == g_captured) return;
    g_captured = on;
    if (on) {
        SetCapture(g_hwnd);
        ShowCursor(FALSE);
        RECT rc;
        GetClientRect(g_hwnd, &rc);
        POINT c = {(rc.right - rc.left) / 2, (rc.bottom - rc.top) / 2};
        ClientToScreen(g_hwnd, &c);
        ClipCursor(&rc);
        SetCursorPos(c.x, c.y);
    } else {
        ReleaseCapture();
        ShowCursor(TRUE);
        ClipCursor(nullptr);
    }
}

static void enterFullscreen(bool on) {
    if (on == g_fullscreen) return;
    g_fullscreen = on;
    if (on) {
        GetWindowRect(g_hwnd, &g_windowedRect);
        g_windowedStyle = GetWindowLongA(g_hwnd, GWL_STYLE);
        MONITORINFO mi;
        mi.cbSize = sizeof(mi);
        GetMonitorInfoA(MonitorFromWindow(g_hwnd, MONITOR_DEFAULTTOPRIMARY), &mi);
        SetWindowLongA(g_hwnd, GWL_STYLE, WS_POPUP | WS_VISIBLE);
        SetWindowPos(g_hwnd, HWND_TOP, mi.rcMonitor.left, mi.rcMonitor.top,
                     mi.rcMonitor.right - mi.rcMonitor.left,
                     mi.rcMonitor.bottom - mi.rcMonitor.top, SWP_FRAMECHANGED);
    } else {
        SetWindowLongA(g_hwnd, GWL_STYLE, g_windowedStyle);
        SetWindowPos(g_hwnd, HWND_TOP, g_windowedRect.left, g_windowedRect.top,
                     g_windowedRect.right - g_windowedRect.left,
                     g_windowedRect.bottom - g_windowedRect.top, SWP_FRAMECHANGED);
    }
    ShowWindow(g_hwnd, SW_SHOW);
    SetForegroundWindow(g_hwnd);
    SetFocus(g_hwnd);
    logf("[video] %s", on ? "fullscreen" : "windowed");
}

// ------------------------------------------------------------------ wndproc
static LRESULT CALLBACK wndProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
    switch (msg) {
        case WM_DESTROY:
            PostQuitMessage(0);
            g_running = false;
            return 0;
        case WM_CLOSE:
            g_running = false;
            PostQuitMessage(0);
            return 0;
        case WM_SIZE: {
            int w = LOWORD(lp), h = HIWORD(lp);
            if (w > 0 && h > 0) {
                g_clientW = w;
                g_clientH = h;
                g_renderer.set.width = w;
                g_renderer.set.height = h;
            }
            return 0;
        }
        case WM_ERASEBKGND:
            return 1;   // the frame itself covers the window; no flicker
        case WM_PAINT: {
            PAINTSTRUCT ps;
            HDC dc = BeginPaint(hwnd, &ps);
            (void)dc;
            EndPaint(hwnd, &ps);
            presentFrame();
            return 0;
        }
        case WM_KEYDOWN:
        case WM_SYSKEYDOWN: {
            int vk = int(wp);
            bool repeat = (lp & 0x40000000L) != 0;
            if (vk == VK_F11 && !repeat) {
                enterFullscreen(!g_fullscreen);
                return 0;
            }
            if (vk == VK_F3) g_game.showDebug = !g_game.showDebug;
            if (vk == VK_ESCAPE) {
                if (g_game.state == GS_PLAYING) {
                    g_game.state = GS_PAUSED;
                    setCapture(false);
                } else if (g_game.state == GS_PAUSED) {
                    g_game.state = GS_PLAYING;
                    setCapture(true);
                }
            }
            if (vk == VK_TAB) {
                if (g_game.state == GS_PLAYING) {
                    g_uiToolSelectOpen = 1;
                    g_game.state = GS_TOOLSELECT;
                    setCapture(false);
                } else if (g_game.state == GS_TOOLSELECT) {
                    g_uiToolSelectOpen = 0;
                    g_game.state = GS_PLAYING;
                    setCapture(true);
                }
                return 0;
            }
            if (vk < 256 && !g_input.keys[vk]) g_input.keyPressed[vk] = true;
            if (vk < 256) g_input.keys[vk] = true;
            g_gameHandleKey(vk, true);
            return 0;
        }
        case WM_KEYUP:
        case WM_SYSKEYUP: {
            int vk = int(wp);
            if (vk < 256) g_input.keys[vk] = false;
            g_gameHandleKey(vk, false);
            return 0;
        }
        case WM_LBUTTONDOWN:
            g_input.mouse[0] = true;
            g_input.mousePressed[0] = true;
            return 0;
        case WM_LBUTTONUP:
            g_input.mouse[0] = false;
            g_input.mouseReleased[0] = true;
            return 0;
        case WM_RBUTTONDOWN:
            g_input.mouse[1] = true;
            g_input.mousePressed[1] = true;
            return 0;
        case WM_RBUTTONUP:
            g_input.mouse[1] = false;
            g_input.mouseReleased[1] = true;
            return 0;
        case WM_MBUTTONDOWN:
            g_input.mouse[2] = true;
            g_input.mousePressed[2] = true;
            return 0;
        case WM_MOUSEWHEEL:
            g_input.wheel += GET_WHEEL_DELTA_WPARAM(wp) / WHEEL_DELTA;
            return 0;
        case WM_MOUSEMOVE: {
            if (!g_captured) {
                g_input.mouseAbsX = LOWORD(lp);
                g_input.mouseAbsY = HIWORD(lp);
            }
            return 0;
        }
        case WM_SETCURSOR:
            if (g_captured) {
                SetCursor(nullptr);
                return TRUE;
            }
            break;
        case WM_ACTIVATE:
            if (LOWORD(wp) == WA_INACTIVE && g_game.state == GS_PLAYING) {
                g_game.state = GS_PAUSED;
                setCapture(false);
            }
            return 0;
    }
    return DefWindowProc(hwnd, msg, wp, lp);
}

// ------------------------------------------------------------------ startup helpers
static bool g_safeMode = false;
static bool g_startWindowed = true;
static int g_wantW = 1280, g_wantH = 720;

static void parseCommandLine(const char* cmd) {
    if (!cmd) return;
    std::string s(cmd);
    for (size_t i = 0; i < s.size(); i++) s[i] = char(tolower((unsigned char)s[i]));
    if (s.find("--fullscreen") != std::string::npos) g_startWindowed = false;
    if (s.find("--safe") != std::string::npos) g_safeMode = true;
    size_t p = s.find("--res ");
    if (p == std::string::npos) p = s.find("--res=");
    if (p != std::string::npos) {
        const char* q = cmd + p + 6;
        int w = 0, h = 0;
        if (sscanf(q, "%dx%d", &w, &h) == 2 || sscanf(q, "%d,%d", &w, &h) == 2) {
            if (w >= 320 && h >= 200 && w <= 7680 && h <= 4320) {
                g_wantW = w;
                g_wantH = h;
            }
        }
    }
}

int WINAPI WinMain(HINSTANCE hInst, HINSTANCE, LPSTR, int) {
    QueryPerformanceFrequency(&g_qpcFreq);
    QueryPerformanceCounter(&g_qpcStart);
    SetProcessDPIAware();
    SetUnhandledExceptionFilter(crashFilter);

    parseCommandLine(GetCommandLineA());
    g_logFile = fopen("fracture_log.txt", "w");
    if (!g_logFile) {
        // read-only install directory: fall back to the user profile
        char alt[MAX_PATH];
        DWORD n = GetEnvironmentVariableA("LOCALAPPDATA", alt, MAX_PATH);
        if (n > 0 && n < MAX_PATH - 32) {
            snprintf(alt + n, MAX_PATH - n, "\\FRACTURE");
            CreateDirectoryA(alt, nullptr);
            snprintf(alt + n, MAX_PATH - n, "\\FRACTURE\\fracture_log.txt");
            g_logFile = fopen(alt, "w");
        }
    }
    logf("%s v%s starting", GAME_NAME, FRACTURE_VERSION);
    logf("[boot] safe mode %s, windowed start %s", g_safeMode ? "on" : "off",
         g_startWindowed ? "on" : "off");

    // A marker left behind by a previous run means that run never reached its clean shutdown
    // path; start small and with the lowest preset so the machine can still be driven.
    bool crashedBefore = false;
    {
        FILE* f = fopen("fracture_run.lock", "rb");
        if (f) {
            crashedBefore = true;
            fclose(f);
        }
        f = fopen("fracture_run.lock", "wb");
        if (f) {
            fputs("running\n", f);
            fclose(f);
        }
    }
    if (crashedBefore && !g_safeMode) {
        g_safeMode = true;
        logf("[boot] previous run did not shut down cleanly - enabling safe mode");
    }

    WNDCLASSEXA wc;
    memset(&wc, 0, sizeof(wc));
    wc.cbSize = sizeof(wc);
    wc.style = CS_HREDRAW | CS_VREDRAW;
    wc.lpfnWndProc = wndProc;
    wc.hInstance = hInst;
    wc.hCursor = LoadCursor(nullptr, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)GetStockObject(BLACK_BRUSH);
    wc.lpszClassName = "FRACTURE";
    wc.hIcon = LoadIconA(hInst, MAKEINTRESOURCEA(101));
    wc.hIconSm = wc.hIcon;
    if (!RegisterClassExA(&wc)) logf("[boot] RegisterClassExA failed (err %lu)", GetLastError());
    if (!wc.hIcon) logf("[boot] window icon resource missing");

    RECT work = {0, 0, 1280, 720};
    SystemParametersInfoA(SPI_GETWORKAREA, 0, &work, 0);
    int maxW = work.right - work.left, maxH = work.bottom - work.top;

    if (g_safeMode) {
        if (g_wantW > 960) { g_wantW = 960; g_wantH = 540; }
    }
    if (!g_startWindowed) {
        MONITORINFO mi;
        mi.cbSize = sizeof(mi);
        GetMonitorInfoA(MonitorFromPoint(POINT{0, 0}, MONITOR_DEFAULTTOPRIMARY), &mi);
        maxW = mi.rcMonitor.right - mi.rcMonitor.left;
        maxH = mi.rcMonitor.bottom - mi.rcMonitor.top;
    }
    int winW = g_wantW, winH = g_wantH;
    if (winW > maxW) { winW = maxW; winH = winW * 9 / 16; }
    if (winH > maxH) { winH = maxH; winW = winH * 16 / 9; }
    if (winW < 640) winW = 640;
    if (winH < 360) winH = 360;

    DWORD style = g_startWindowed ? WS_OVERLAPPEDWINDOW : (WS_POPUP | WS_VISIBLE);
    RECT wr = {0, 0, winW, winH};
    if (g_startWindowed) AdjustWindowRect(&wr, style, FALSE);
    int ww = wr.right - wr.left, wh = wr.bottom - wr.top;
    int wx = work.left + (maxW - ww) / 2, wy = work.top + (maxH - wh) / 2;
    if (wx < 0) wx = 0;
    if (wy < 0) wy = 0;

    g_hwnd = CreateWindowExA(0, "FRACTURE", "FRACTURE: TOTAL DESTRUCTION", style, wx, wy, ww, wh,
                             nullptr, nullptr, hInst, nullptr);
    if (!g_hwnd) {
        logf("[boot] CreateWindowExA failed (err %lu)", GetLastError());
        MessageBoxA(nullptr,
                    "Could not create the game window.\nSee fracture_log.txt next to the "
                    "executable.",
                    "FRACTURE", MB_ICONERROR);
        return 1;
    }
    ShowWindow(g_hwnd, SW_SHOW);
    UpdateWindow(g_hwnd);
    SetForegroundWindow(g_hwnd);
    SetFocus(g_hwnd);
    if (!g_startWindowed) enterFullscreen(true);
    g_clientW = clientWidth();
    g_clientH = clientHeight();
    logf("[boot] window %dx%d, client %dx%d", ww, wh, g_clientW, g_clientH);

    // everything below is reported to the splash screen as it happens
    gameInit();
    g_renderer.set.width = g_clientW;
    g_renderer.set.height = g_clientH;
    g_renderer.init(g_clientW, g_clientH);
    g_renderer.set.viewDist = 150;
    if (g_safeMode) {
        applyGraphicsPreset(0);      // LOW
        g_game.dynamicResolution = true;
        g_renderer.set.renderScale = 70;
        g_game.resolutionCap = 70;
    }
    logf("[boot] renderer ready at %dx%d", g_renderer.set.width, g_renderer.set.height);
    loadSettings();
    selftestPresent();

    splash("FRACTURE", "BUILDING WORLD...");
    gameLoadMenuBackdrop();
    gameLoadMap(0, true, -1);
    g_game.state = GS_MAIN_MENU;
    logf("[boot] menu world ready, entering main loop");

    initAudio();

    double last = platformTime();
    double fpsTimer = last;
    int fpsFrames = 0;
    MSG msg;
    while (g_running) {
        while (PeekMessage(&msg, nullptr, 0, 0, PM_REMOVE)) {
            if (msg.message == WM_QUIT) g_running = false;
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        }
        if (!g_running) break;
        double now = platformTime();
        float dt = float(now - last);
        last = now;
        if (dt > 0.25f) dt = 0.25f;
        bool wantCapture = (g_game.state == GS_PLAYING);
        setCapture(wantCapture);
        if (g_captured) {
            POINT p;
            GetCursorPos(&p);
            RECT rc;
            GetClientRect(g_hwnd, &rc);
            POINT c = {(rc.right - rc.left) / 2, (rc.bottom - rc.top) / 2};
            ClientToScreen(g_hwnd, &c);
            int dx = p.x - c.x, dy = p.y - c.y;
            if (dx || dy) {
                handleMouseMove(float(dx), float(dy));
                SetCursorPos(c.x, c.y);
            }
        }
        if (g_game.state == GS_PLAYING) {
            if (g_input.mousePressed[0]) doToolUse(0);
            if (g_input.mousePressed[1]) doToolUse(1);
            if (g_input.keyPressed['E']) interactPressed();
        }
        gameUpdate(dt);
        gameRender();
        presentFrame();

        for (int i = 0; i < 256; i++) g_input.keyPressed[i] = false;
        for (int i = 0; i < 3; i++) {
            g_input.mousePressed[i] = false;
            g_input.mouseReleased[i] = false;
        }
        g_input.wheel = 0;

        fpsFrames++;
        if (now - fpsTimer >= 5.0) {
            logf("[perf] %.1f fps over %.0fs, render %dx%d (scale %d%%)", fpsFrames / (now - fpsTimer),
                 now - fpsTimer, g_renderer.set.width, g_renderer.set.height,
                 g_renderer.set.renderScale);
            fpsTimer = now;
            fpsFrames = 0;
        }

        if (g_renderer.set.fpsLimit > 0) {
            double target = 1.0 / g_renderer.set.fpsLimit;
            double frameTime = platformTime() - now;
            if (frameTime < target) platformSleep(int((target - frameTime) * 1000.0));
        }
    }
    g_audioRunning = false;
    if (g_audioEvent) SetEvent(g_audioEvent);
    platformSleep(120);
    if (g_wave) waveOutClose(g_wave);
    gameShutdown();
    remove("fracture_run.lock");
    logf("[shutdown] clean exit");
    if (g_logFile) fclose(g_logFile);
    return 0;
}
