/*
 * SPACE_MINER_SETUP.exe - Windows installer for Space Miner: Build & Conquer.
 *
 * Single-file installer: the complete game is appended to this executable as an
 * SMPACK archive (see smpack.h). No admin rights are required - the game installs
 * into %LOCALAPPDATA%\Programs\SpaceMiner.
 *
 * Features: progress UI, optional desktop shortcut, Start Menu shortcut,
 * Add/Remove Programs registration and a bundled uninstaller.
 *
 * Build: zig cc -target x86_64-windows-gnu -O2 -municode installer.c setup.res \
 *            -o SPACE_MINER_SETUP_stub.exe -lshell32 -lole32 -luuid -ladvapi32 -Wl,--subsystem,windows
 */
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>
#include <shlobj.h>
#include <shellapi.h>
#include <objbase.h>
#include <commctrl.h>
#include "smpack.h"

#define ID_INSTALL   1001
#define ID_CANCEL    1002
#define ID_DESKTOP   1003
#define ID_PROGRESS  1004
#define ID_STATUS    1005
#define ID_LAUNCH    1006

static HWND g_hwnd, g_progress, g_status, g_desktopCheck, g_installBtn, g_launchCheck;
static wchar_t g_installDir[MAX_PATH];
static wchar_t g_selfPath[MAX_PATH];
static int g_done = 0;

static void set_status(const wchar_t *text) {
    if (g_status) SetWindowTextW(g_status, text);
}

static void ensure_directory(const wchar_t *path) {
    wchar_t tmp[MAX_PATH];
    wcsncpy(tmp, path, MAX_PATH - 1);
    tmp[MAX_PATH - 1] = 0;
    for (wchar_t *p = tmp + 3; *p; p++) {
        if (*p == L'\\') {
            *p = 0;
            CreateDirectoryW(tmp, NULL);
            *p = L'\\';
        }
    }
    CreateDirectoryW(tmp, NULL);
}

static int create_shortcut(const wchar_t *target, const wchar_t *linkPath, const wchar_t *desc, const wchar_t *workDir) {
    IShellLinkW *link = NULL;
    IPersistFile *file = NULL;
    HRESULT hr = CoCreateInstance(&CLSID_ShellLink, NULL, CLSCTX_INPROC_SERVER, &IID_IShellLinkW, (void **)&link);
    if (FAILED(hr)) return 0;
    link->lpVtbl->SetPath(link, target);
    link->lpVtbl->SetDescription(link, desc);
    link->lpVtbl->SetWorkingDirectory(link, workDir);
    link->lpVtbl->SetIconLocation(link, target, 0);
    hr = link->lpVtbl->QueryInterface(link, &IID_IPersistFile, (void **)&file);
    if (SUCCEEDED(hr)) {
        hr = file->lpVtbl->Save(file, linkPath, TRUE);
        file->lpVtbl->Release(file);
    }
    link->lpVtbl->Release(link);
    return SUCCEEDED(hr);
}

static void register_uninstall(uint64_t sizeKb) {
    HKEY key;
    if (RegCreateKeyExW(HKEY_CURRENT_USER,
            L"Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\SpaceMinerBuildAndConquer",
            0, NULL, 0, KEY_WRITE, NULL, &key, NULL) != ERROR_SUCCESS) return;

    wchar_t exe[MAX_PATH], uninst[MAX_PATH], icon[MAX_PATH];
    _snwprintf(exe, MAX_PATH, L"%s\\SpaceMiner.exe", g_installDir);
    _snwprintf(uninst, MAX_PATH, L"\"%s\\uninstall.exe\"", g_installDir);
    _snwprintf(icon, MAX_PATH, L"%s\\SpaceMiner.exe,0", g_installDir);

    const wchar_t *name = L"Space Miner: Build & Conquer";
    const wchar_t *publisher = L"Orbital Foundry Games";
    const wchar_t *version = L"1.0.0";
    RegSetValueExW(key, L"DisplayName", 0, REG_SZ, (const BYTE *)name, (DWORD)((wcslen(name) + 1) * 2));
    RegSetValueExW(key, L"DisplayIcon", 0, REG_SZ, (const BYTE *)icon, (DWORD)((wcslen(icon) + 1) * 2));
    RegSetValueExW(key, L"DisplayVersion", 0, REG_SZ, (const BYTE *)version, (DWORD)((wcslen(version) + 1) * 2));
    RegSetValueExW(key, L"Publisher", 0, REG_SZ, (const BYTE *)publisher, (DWORD)((wcslen(publisher) + 1) * 2));
    RegSetValueExW(key, L"InstallLocation", 0, REG_SZ, (const BYTE *)g_installDir, (DWORD)((wcslen(g_installDir) + 1) * 2));
    RegSetValueExW(key, L"UninstallString", 0, REG_SZ, (const BYTE *)uninst, (DWORD)((wcslen(uninst) + 1) * 2));
    DWORD sz = (DWORD)sizeKb;
    RegSetValueExW(key, L"EstimatedSize", 0, REG_DWORD, (const BYTE *)&sz, sizeof(sz));
    DWORD one = 1;
    RegSetValueExW(key, L"NoModify", 0, REG_DWORD, (const BYTE *)&one, sizeof(one));
    RegSetValueExW(key, L"NoRepair", 0, REG_DWORD, (const BYTE *)&one, sizeof(one));
    RegCloseKey(key);
}

/* Extracts the appended SMPACK payload into the install directory. */
static int run_install(void) {
    char selfUtf8[MAX_PATH * 3];
    WideCharToMultiByte(CP_UTF8, 0, g_selfPath, -1, selfUtf8, sizeof(selfUtf8), NULL, NULL);
    FILE *f = _wfopen(g_selfPath, L"rb");
    if (!f) {
        MessageBoxW(g_hwnd, L"Installer payload could not be opened.", L"Space Miner Setup", MB_ICONERROR);
        return 0;
    }
    long archiveOffset = 0;
    uint64_t entryCount = 0;
    if (!smpack_read_footer(f, &archiveOffset, &entryCount) || entryCount == 0) {
        fclose(f);
        MessageBoxW(g_hwnd, L"This installer is missing its game payload.", L"Space Miner Setup", MB_ICONERROR);
        return 0;
    }
    fseek(f, archiveOffset, SEEK_SET);
    ensure_directory(g_installDir);
    SendMessageW(g_progress, PBM_SETRANGE32, 0, (LPARAM)entryCount);

    uint64_t totalBytes = 0;
    char buffer[65536];
    for (uint64_t i = 0; i < entryCount; i++) {
        smpack_entry entry;
        if (!smpack_read_entry(f, &entry)) {
            fclose(f);
            MessageBoxW(g_hwnd, L"The installer payload is damaged.", L"Space Miner Setup", MB_ICONERROR);
            return 0;
        }
        wchar_t rel[1024];
        MultiByteToWideChar(CP_UTF8, 0, entry.path, -1, rel, 1024);
        for (wchar_t *p = rel; *p; p++) if (*p == L'/') *p = L'\\';
        wchar_t out[MAX_PATH];
        _snwprintf(out, MAX_PATH, L"%s\\%s", g_installDir, rel);
        wchar_t dir[MAX_PATH];
        wcsncpy(dir, out, MAX_PATH);
        wchar_t *slash = wcsrchr(dir, L'\\');
        if (slash) { *slash = 0; ensure_directory(dir); }

        FILE *o = _wfopen(out, L"wb");
        if (!o) {
            fclose(f);
            MessageBoxW(g_hwnd, L"A game file could not be written. Check disk space and permissions.",
                        L"Space Miner Setup", MB_ICONERROR);
            return 0;
        }
        uint64_t left = entry.size;
        while (left) {
            size_t chunk = left > sizeof(buffer) ? sizeof(buffer) : (size_t)left;
            if (fread(buffer, 1, chunk, f) != chunk) { fclose(o); fclose(f); return 0; }
            fwrite(buffer, 1, chunk, o);
            left -= chunk;
        }
        fclose(o);
        totalBytes += entry.size;

        wchar_t msg[1200];
        _snwprintf(msg, 1200, L"Installing  %s", rel);
        set_status(msg);
        SendMessageW(g_progress, PBM_SETPOS, (WPARAM)(i + 1), 0);
    }
    fclose(f);

    /* Shortcuts. */
    wchar_t exePath[MAX_PATH];
    _snwprintf(exePath, MAX_PATH, L"%s\\SpaceMiner.exe", g_installDir);

    wchar_t startMenu[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPathW(NULL, CSIDL_PROGRAMS, NULL, 0, startMenu))) {
        wchar_t linkPath[MAX_PATH];
        _snwprintf(linkPath, MAX_PATH, L"%s\\Space Miner - Build & Conquer.lnk", startMenu);
        create_shortcut(exePath, linkPath, L"Space Miner: Build & Conquer", g_installDir);
    }
    if (SendMessageW(g_desktopCheck, BM_GETCHECK, 0, 0) == BST_CHECKED) {
        wchar_t desktop[MAX_PATH];
        if (SUCCEEDED(SHGetFolderPathW(NULL, CSIDL_DESKTOPDIRECTORY, NULL, 0, desktop))) {
            wchar_t linkPath[MAX_PATH];
            _snwprintf(linkPath, MAX_PATH, L"%s\\Space Miner.lnk", desktop);
            create_shortcut(exePath, linkPath, L"Space Miner: Build & Conquer", g_installDir);
        }
    }
    register_uninstall(totalBytes / 1024);
    set_status(L"Installation complete.");
    return 1;
}

static void paint_header(HWND hwnd) {
    PAINTSTRUCT ps;
    HDC hdc = BeginPaint(hwnd, &ps);
    RECT rc;
    GetClientRect(hwnd, &rc);

    /* Background. */
    HBRUSH bg = CreateSolidBrush(RGB(8, 12, 28));
    FillRect(hdc, &rc, bg);
    DeleteObject(bg);

    /* Header band. */
    RECT header = { 0, 0, rc.right, 96 };
    for (int y = 0; y < 96; y++) {
        int t = (y * 255) / 96;
        HBRUSH line = CreateSolidBrush(RGB(10 + t / 8, 20 + t / 5, 60 + t / 3));
        RECT lr = { 0, y, rc.right, y + 1 };
        FillRect(hdc, &lr, line);
        DeleteObject(line);
    }
    RECT accent = { 0, 94, rc.right, 96 };
    HBRUSH ab = CreateSolidBrush(RGB(0, 229, 255));
    FillRect(hdc, &accent, ab);
    DeleteObject(ab);

    HFONT title = CreateFontW(30, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE, DEFAULT_CHARSET,
        OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY, DEFAULT_PITCH, L"Segoe UI");
    HFONT sub = CreateFontW(16, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE, DEFAULT_CHARSET,
        OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY, DEFAULT_PITCH, L"Segoe UI");
    SetBkMode(hdc, TRANSPARENT);
    SelectObject(hdc, title);
    SetTextColor(hdc, RGB(255, 255, 255));
    TextOutW(hdc, 28, 22, L"SPACE MINER", 11);
    SelectObject(hdc, sub);
    SetTextColor(hdc, RGB(140, 200, 255));
    TextOutW(hdc, 29, 58, L"BUILD & CONQUER   ·   Version 1.0.0", 35);

    SetTextColor(hdc, RGB(214, 228, 255));
    TextOutW(hdc, 28, 120, L"This will install Space Miner: Build & Conquer on your computer.", 63);
    SetTextColor(hdc, RGB(150, 170, 205));
    wchar_t pathLine[MAX_PATH + 32];
    _snwprintf(pathLine, MAX_PATH + 32, L"Install folder:  %s", g_installDir);
    TextOutW(hdc, 28, 146, pathLine, (int)wcslen(pathLine));
    TextOutW(hdc, 28, 170, L"No administrator rights are required. The game runs offline.", 59);

    DeleteObject(title);
    DeleteObject(sub);
    EndPaint(hwnd, &ps);
}

static LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
    switch (msg) {
        case WM_PAINT: paint_header(hwnd); return 0;
        case WM_CTLCOLORSTATIC: {
            HDC hdc = (HDC)wp;
            SetBkMode(hdc, TRANSPARENT);
            SetTextColor(hdc, RGB(200, 216, 245));
            return (LRESULT)GetStockObject(NULL_BRUSH);
        }
        case WM_COMMAND:
            if (LOWORD(wp) == ID_INSTALL) {
                if (g_done) {
                    if (SendMessageW(g_launchCheck, BM_GETCHECK, 0, 0) == BST_CHECKED) {
                        wchar_t exePath[MAX_PATH];
                        _snwprintf(exePath, MAX_PATH, L"%s\\SpaceMiner.exe", g_installDir);
                        ShellExecuteW(NULL, L"open", exePath, NULL, g_installDir, SW_SHOWNORMAL);
                    }
                    PostQuitMessage(0);
                    return 0;
                }
                EnableWindow(g_installBtn, FALSE);
                EnableWindow(g_desktopCheck, FALSE);
                if (run_install()) {
                    g_done = 1;
                    SetWindowTextW(g_installBtn, L"Finish");
                    EnableWindow(g_installBtn, TRUE);
                    ShowWindow(g_launchCheck, SW_SHOW);
                } else {
                    EnableWindow(g_installBtn, TRUE);
                    EnableWindow(g_desktopCheck, TRUE);
                }
            } else if (LOWORD(wp) == ID_CANCEL) {
                PostQuitMessage(0);
            }
            return 0;
        case WM_DESTROY: PostQuitMessage(0); return 0;
    }
    return DefWindowProcW(hwnd, msg, wp, lp);
}

int WINAPI wWinMain(HINSTANCE hInstance, HINSTANCE hPrev, PWSTR cmdline, int showCmd) {
    (void)hPrev; (void)cmdline; (void)showCmd;
    CoInitializeEx(NULL, COINIT_APARTMENTTHREADED);
    INITCOMMONCONTROLSEX icc = { sizeof(icc), ICC_PROGRESS_CLASS | ICC_STANDARD_CLASSES };
    InitCommonControlsEx(&icc);

    GetModuleFileNameW(NULL, g_selfPath, MAX_PATH);
    wchar_t localApp[MAX_PATH];
    if (!ExpandEnvironmentStringsW(L"%LocalAppData%", localApp, MAX_PATH)) wcscpy(localApp, L"C:\\");
    _snwprintf(g_installDir, MAX_PATH, L"%s\\Programs\\SpaceMiner", localApp);

    WNDCLASSW wc;
    ZeroMemory(&wc, sizeof(wc));
    wc.lpfnWndProc = WndProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = L"SpaceMinerSetup";
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.hIcon = LoadIconW(hInstance, MAKEINTRESOURCEW(1));
    RegisterClassW(&wc);

    int w = 620, h = 400;
    int x = (GetSystemMetrics(SM_CXSCREEN) - w) / 2;
    int y = (GetSystemMetrics(SM_CYSCREEN) - h) / 2;
    g_hwnd = CreateWindowExW(0, L"SpaceMinerSetup", L"Space Miner: Build & Conquer - Setup",
        WS_OVERLAPPED | WS_CAPTION | WS_SYSMENU | WS_MINIMIZEBOX, x, y, w, h,
        NULL, NULL, hInstance, NULL);

    HFONT uiFont = CreateFontW(15, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE, DEFAULT_CHARSET,
        OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY, DEFAULT_PITCH, L"Segoe UI");

    g_desktopCheck = CreateWindowW(L"BUTTON", L"Create a desktop shortcut",
        WS_VISIBLE | WS_CHILD | BS_AUTOCHECKBOX, 28, 204, 280, 24, g_hwnd, (HMENU)ID_DESKTOP, hInstance, NULL);
    SendMessageW(g_desktopCheck, BM_SETCHECK, BST_CHECKED, 0);
    SendMessageW(g_desktopCheck, WM_SETFONT, (WPARAM)uiFont, TRUE);

    g_launchCheck = CreateWindowW(L"BUTTON", L"Launch Space Miner now",
        WS_CHILD | BS_AUTOCHECKBOX, 28, 230, 280, 24, g_hwnd, (HMENU)ID_LAUNCH, hInstance, NULL);
    SendMessageW(g_launchCheck, BM_SETCHECK, BST_CHECKED, 0);
    SendMessageW(g_launchCheck, WM_SETFONT, (WPARAM)uiFont, TRUE);

    g_progress = CreateWindowExW(0, PROGRESS_CLASSW, NULL, WS_VISIBLE | WS_CHILD,
        28, 268, 556, 18, g_hwnd, (HMENU)ID_PROGRESS, hInstance, NULL);

    g_status = CreateWindowW(L"STATIC", L"Ready to install.", WS_VISIBLE | WS_CHILD | SS_LEFTNOWORDWRAP,
        28, 292, 556, 20, g_hwnd, (HMENU)ID_STATUS, hInstance, NULL);
    SendMessageW(g_status, WM_SETFONT, (WPARAM)uiFont, TRUE);

    g_installBtn = CreateWindowW(L"BUTTON", L"Install", WS_VISIBLE | WS_CHILD | BS_DEFPUSHBUTTON,
        452, 322, 132, 32, g_hwnd, (HMENU)ID_INSTALL, hInstance, NULL);
    SendMessageW(g_installBtn, WM_SETFONT, (WPARAM)uiFont, TRUE);

    HWND cancel = CreateWindowW(L"BUTTON", L"Cancel", WS_VISIBLE | WS_CHILD,
        312, 322, 132, 32, g_hwnd, (HMENU)ID_CANCEL, hInstance, NULL);
    SendMessageW(cancel, WM_SETFONT, (WPARAM)uiFont, TRUE);

    ShowWindow(g_hwnd, SW_SHOW);
    UpdateWindow(g_hwnd);

    MSG msg;
    while (GetMessageW(&msg, NULL, 0, 0) > 0) {
        if (!IsDialogMessageW(g_hwnd, &msg)) {
            TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }
    }
    CoUninitialize();
    return 0;
}
