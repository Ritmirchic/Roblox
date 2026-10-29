// platform_win32.cpp - Win32 window, GDI framebuffer blit, WaveOut audio, input
#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#include <mmsystem.h>
#include <cstdio>
#include "frac.h"

static HWND g_hwnd = nullptr;
static HDC g_hdc = nullptr;
static HBITMAP g_dib = nullptr;
static void* g_dibBits = nullptr;
static int g_winW = 1280, g_winH = 720;
static bool g_running = true;
static bool g_captured = false;
static LARGE_INTEGER g_qpcFreq, g_qpcStart;
static float g_accum = 0;

// ------------------------------------------------------------------ audio
#define AUDIO_BUFFERS 3
#define AUDIO_FRAMES 1024
static HWAVEOUT g_wave = nullptr;
static WAVEHDR g_waveHdr[AUDIO_BUFFERS];
static short g_waveData[AUDIO_BUFFERS][AUDIO_FRAMES * 2];
static HANDLE g_audioEvent = nullptr;
static bool g_audioRunning = false;
static DWORD g_audioThreadId = 0;
static int g_audioNext = 0;

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

static void createBackbuffer(int w, int h) {
    g_winW = w;
    g_winH = h;
    if (g_dib) DeleteObject(g_dib);
    BITMAPINFO bi;
    memset(&bi, 0, sizeof(bi));
    bi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    bi.bmiHeader.biWidth = w;
    bi.bmiHeader.biHeight = -h;   // top-down
    bi.bmiHeader.biPlanes = 1;
    bi.bmiHeader.biBitCount = 32;
    bi.bmiHeader.biCompression = BI_RGB;
    HDC screen = GetDC(nullptr);
    g_dib = CreateDIBSection(screen, &bi, DIB_RGB_COLORS, &g_dibBits, nullptr, 0);
    ReleaseDC(nullptr, screen);
    if (g_hdc) DeleteDC(g_hdc);
    g_hdc = CreateCompatibleDC(screen);
    SelectObject(g_hdc, g_dib);
}

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
        POINT sc = c;
        SetCursorPos(sc.x, sc.y);
    } else {
        ReleaseCapture();
        ShowCursor(TRUE);
        ClipCursor(nullptr);
    }
}

static void toggleFullscreen() {
    static bool full = true;
    static RECT savedRect;
    static LONG savedStyle = 0;
    full = !full;
    if (!full) {
        GetWindowRect(g_hwnd, &savedRect);
        savedStyle = GetWindowLong(g_hwnd, GWL_STYLE);
        MONITORINFO mi = {sizeof(mi)};
        GetMonitorInfo(MonitorFromWindow(g_hwnd, MONITOR_DEFAULTTOPRIMARY), &mi);
        SetWindowLong(g_hwnd, GWL_STYLE, WS_OVERLAPPEDWINDOW | WS_VISIBLE);
        SetWindowPos(g_hwnd, HWND_TOP, mi.rcWork.left + 60, mi.rcWork.top + 40, 1280, 720,
                     SWP_FRAMECHANGED);
    } else {
        MONITORINFO mi = {sizeof(mi)};
        GetMonitorInfo(MonitorFromWindow(g_hwnd, MONITOR_DEFAULTTOPRIMARY), &mi);
        SetWindowLong(g_hwnd, GWL_STYLE, WS_POPUP | WS_VISIBLE);
        SetWindowPos(g_hwnd, HWND_TOP, mi.rcMonitor.left, mi.rcMonitor.top,
                     mi.rcMonitor.right - mi.rcMonitor.left,
                     mi.rcMonitor.bottom - mi.rcMonitor.top, SWP_FRAMECHANGED);
    }
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
                createBackbuffer(w, h);
                g_renderer.set.width = w;
                g_renderer.set.height = h;
            }
            return 0;
        }
        case WM_KEYDOWN:
        case WM_SYSKEYDOWN: {
            int vk = int(wp);
            if (vk == VK_F11) {
                toggleFullscreen();
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
            if (vk == VK_RETURN) { /* handled by UI */ }
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

int WINAPI WinMain(HINSTANCE hInst, HINSTANCE, LPSTR, int) {
    QueryPerformanceFrequency(&g_qpcFreq);
    QueryPerformanceCounter(&g_qpcStart);
    SetProcessDPIAware();
    g_logFile = fopen("fracture_log.txt", "w");
    logf("%s v%s starting", GAME_NAME, FRACTURE_VERSION);
    WNDCLASSEX wc;
    memset(&wc, 0, sizeof(wc));
    wc.cbSize = sizeof(wc);
    wc.style = CS_HREDRAW | CS_VREDRAW | CS_OWNDC;
    wc.lpfnWndProc = wndProc;
    wc.hInstance = hInst;
    wc.hCursor = LoadCursor(nullptr, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)GetStockObject(BLACK_BRUSH);
    wc.lpszClassName = "FRACTURE";
    wc.hIcon = LoadIcon(hInst, MAKEINTRESOURCE(101));
    wc.hIconSm = wc.hIcon;
    RegisterClassEx(&wc);
    int sw = GetSystemMetrics(SM_CXSCREEN), sh = GetSystemMetrics(SM_CYSCREEN);
    g_hwnd = CreateWindowEx(0, "FRACTURE", "FRACTURE: TOTAL DESTRUCTION",
                            WS_POPUP | WS_VISIBLE, 0, 0, sw, sh, nullptr, nullptr, hInst,
                            nullptr);
    if (!g_hwnd) {
        MessageBoxA(nullptr, "Failed to create window", "FRACTURE", MB_ICONERROR);
        return 1;
    }
    ShowWindow(g_hwnd, SW_SHOW);
    SetFocus(g_hwnd);
    createBackbuffer(sw, sh);
    gameInit();
    gameLoadMenuBackdrop();
    g_renderer.set.width = sw;
    g_renderer.set.height = sh;
    g_renderer.init(sw, sh);
    g_renderer.set.viewDist = 150;
    initAudio();
    // start on a live 3D backdrop for the main menu
    gameLoadMap(0, true, -1);
    g_game.state = GS_MAIN_MENU;
    logf("[video] %dx%d", sw, sh);

    double last = platformTime();
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
        // mouse look (captured mode)
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
        // gameplay input
        if (g_game.state == GS_PLAYING) {
            if (g_input.mousePressed[0]) doToolUse(0);
            if (g_input.mousePressed[1]) doToolUse(1);
            if (g_input.keyPressed['E']) interactPressed();
        }
        gameUpdate(dt);
        gameRender();
        // blit
        if (g_dibBits && g_renderer.framebuffer()) {
            int n = g_renderer.set.width * g_renderer.set.height;
            memcpy(g_dibBits, g_renderer.framebuffer(), size_t(n) * 4);
            HDC dc = GetDC(g_hwnd);
            BitBlt(dc, 0, 0, g_winW, g_winH, g_hdc, 0, 0, SRCCOPY);
            ReleaseDC(g_hwnd, dc);
        }
        // clear per-frame input
        for (int i = 0; i < 256; i++) g_input.keyPressed[i] = false;
        for (int i = 0; i < 3; i++) {
            g_input.mousePressed[i] = false;
            g_input.mouseReleased[i] = false;
        }
        g_input.wheel = 0;
        // frame pacing
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
    if (g_logFile) fclose(g_logFile);
    return 0;
}
