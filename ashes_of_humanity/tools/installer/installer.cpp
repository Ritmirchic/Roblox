// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Installer payload extractor.
//
//  The installer executable has a ZIP archive appended to it.  At run time it
//  locates the archive inside its own image, inflates every entry and writes
//  the game to the chosen directory.
//
//  Everything that touches the file system uses the wide character API so
//  that non ASCII user names and folder names work correctly.
// ============================================================================
#include <windows.h>
#include <shellapi.h>
#include <shlobj.h>
#include <shlwapi.h>
#include <objbase.h>
#include "zipreader.h"
#include <cstdio>
#include <cstring>
#include <string>
#include <vector>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
static std::string toUtf8(const std::wstring& w) {
  if (w.empty()) return "";
  int n = WideCharToMultiByte(CP_UTF8, 0, w.c_str(), (int)w.size(), nullptr, 0, nullptr, nullptr);
  std::string out((size_t)n, '\0');
  WideCharToMultiByte(CP_UTF8, 0, w.c_str(), (int)w.size(), &out[0], n, nullptr, nullptr);
  return out;
}

static std::wstring fromUtf8(const std::string& s) {
  if (s.empty()) return L"";
  int n = MultiByteToWideChar(CP_UTF8, 0, s.c_str(), (int)s.size(), nullptr, 0);
  std::wstring out((size_t)n, L'\0');
  MultiByteToWideChar(CP_UTF8, 0, s.c_str(), (int)s.size(), &out[0], n);
  return out;
}

// ---------------------------------------------------------------------------
// Installer state
// ---------------------------------------------------------------------------
static HWND g_hwnd = nullptr;
static HWND g_pathEdit = nullptr;
static HWND g_status = nullptr;
static HWND g_progress = nullptr;
static HWND g_button = nullptr;
static HWND g_launchCheck = nullptr;
static std::wstring g_installDir;
static bool g_launch = true;

static void setStatus(const std::string& text) {
  if (g_status) SetWindowTextA(g_status, text.c_str());
}

// Creates every directory level of the path.  Accepts both separators.
static bool ensureDirs(const std::wstring& path) {
  std::wstring cur;
  for (size_t i = 0; i < path.size(); ++i) {
    cur += path[i];
    bool sep = (path[i] == L'\\' || path[i] == L'/');
    if (sep || i + 1 == path.size()) {
      if (cur.size() > 3) {
        if (!CreateDirectoryW(cur.c_str(), nullptr) && GetLastError() != ERROR_ALREADY_EXISTS)
          return false;
      }
    }
  }
  return true;
}

static void createShortcut(const std::wstring& exePath, const std::wstring& shortcutPath) {
  IShellLinkW* wl = nullptr;
  if (SUCCEEDED(CoCreateInstance(CLSID_ShellLink, nullptr, CLSCTX_INPROC_SERVER,
                                 IID_IShellLinkW, (void**)&wl))) {
    wl->SetPath(exePath.c_str());
    std::wstring work = exePath;
    PathRemoveFileSpecW(&work[0]);
    wl->SetWorkingDirectory(work.c_str());
    wl->SetDescription(L"ASHES OF HUMANITY: LAST SIGNAL");
    IPersistFile* pf = nullptr;
    if (SUCCEEDED(wl->QueryInterface(IID_IPersistFile, (void**)&pf))) {
      pf->Save(shortcutPath.c_str(), TRUE);
      pf->Release();
    }
    wl->Release();
  }
}

// ---------------------------------------------------------------------------
// The installation itself
// ---------------------------------------------------------------------------
static void doInstall() {
  setStatus("Reading package...");

  // locate our own executable
  std::wstring self(MAX_PATH, L'\0');
  DWORD n = GetModuleFileNameW(nullptr, &self[0], MAX_PATH);
  self.resize(n);
  HANDLE f = CreateFileW(self.c_str(), GENERIC_READ, FILE_SHARE_READ, nullptr, OPEN_EXISTING,
                         FILE_ATTRIBUTE_NORMAL, nullptr);
  if (f == INVALID_HANDLE_VALUE) { setStatus("Cannot read the installer."); return; }
  LARGE_INTEGER li;
  GetFileSizeEx(f, &li);
  size_t size = (size_t)li.QuadPart;
  std::vector<zip::u8> image(size);
  DWORD read = 0;
  if (!ReadFile(f, image.data(), (DWORD)size, &read, nullptr)) {
    CloseHandle(f);
    setStatus("Cannot read the installer.");
    return;
  }
  CloseHandle(f);

  std::vector<zip::ZipEntry> entries;
  size_t zipBase = 0;
  if (!zip::readZip(image.data(), size, entries, &zipBase)) {
    setStatus("The installer package is damaged.");
    return;
  }

  if (!ensureDirs(g_installDir)) {
    char msg[256];
    snprintf(msg, sizeof(msg), "Cannot create the folder (error %u)", (unsigned)GetLastError());
    setStatus(msg);
    return;
  }

  int done = 0;
  int total = (int)entries.size();
  for (size_t i = 0; i < entries.size(); ++i) {
    const zip::ZipEntry& e = entries[i];
    if (!e.name.empty() && e.name.back() == '/') {
      ensureDirs(g_installDir + L"\\" + fromUtf8(zip::nativePath(e.name)));
      continue;
    }

    // Archive paths use '/', Windows needs '\'.
    std::wstring rel = fromUtf8(zip::nativePath(e.name));
    std::wstring outPath = g_installDir + L"\\" + rel;

    size_t slash = outPath.find_last_of(L'\\');
    if (slash != std::wstring::npos && slash > 0) {
      if (!ensureDirs(outPath.substr(0, slash))) {
        char msg[512];
        snprintf(msg, sizeof(msg), "Cannot create folder (error %u)", (unsigned)GetLastError());
        setStatus(msg);
        return;
      }
    }

    std::vector<zip::u8> content;
    if (!zip::extractEntry(image.data(), size, e, content, zipBase)) {
      setStatus("Cannot unpack " + e.name);
      return;
    }

    HANDLE out = CreateFileW(outPath.c_str(), GENERIC_WRITE, 0, nullptr, CREATE_ALWAYS,
                             FILE_ATTRIBUTE_NORMAL, nullptr);
    if (out == INVALID_HANDLE_VALUE) {
      char msg[512];
      snprintf(msg, sizeof(msg), "Cannot write %s (error %u)", e.name.c_str(),
               (unsigned)GetLastError());
      setStatus(msg);
      return;
    }
    DWORD written = 0;
    BOOL ok = WriteFile(out, content.data(), (DWORD)content.size(), &written, nullptr);
    CloseHandle(out);
    if (!ok || written != (DWORD)content.size()) {
      setStatus("Short write on " + e.name);
      return;
    }

    done++;
    if (g_progress) {
      SendMessageA(g_progress, PBM_SETPOS, (WPARAM)((done * 100) / (total ? total : 1)), 0);
      char buf[64];
      snprintf(buf, sizeof(buf), "Extracting %d / %d", done, total);
      setStatus(buf);
    }
  }

  std::wstring gameExe = g_installDir + L"\\AshesOfHumanity.exe";

  // shortcuts
  wchar_t desktop[MAX_PATH], startMenu[MAX_PATH];
  SHGetFolderPathW(nullptr, CSIDL_DESKTOPDIRECTORY, nullptr, SHGFP_TYPE_CURRENT, desktop);
  SHGetFolderPathW(nullptr, CSIDL_PROGRAMS, nullptr, SHGFP_TYPE_CURRENT, startMenu);
  std::wstring progDir = std::wstring(startMenu) + L"\\Ashes of Humanity";
  ensureDirs(progDir);
  createShortcut(gameExe, progDir + L"\\Ashes of Humanity.lnk");
  createShortcut(gameExe, std::wstring(desktop) + L"\\Ashes of Humanity.lnk");

  setStatus("Installation complete.");
  if (g_button) EnableWindow(g_button, FALSE);
  if (g_launchCheck) EnableWindow(g_launchCheck, FALSE);
  if (g_launch) {
    Sleep(400);
    ShellExecuteW(nullptr, L"open", gameExe.c_str(), nullptr, nullptr, SW_SHOWNORMAL);
  }
}

static void browse(HWND hwnd) {
  BROWSEINFOW bi = {};
  bi.hwndOwner = hwnd;
  bi.lpszTitle = L"Choose the installation folder";
  bi.ulFlags = BIF_RETURNONLYFSDIRS | BIF_NEWDIALOGSTYLE;
  std::wstring buf(MAX_PATH, L'\0');
  bi.pszDisplayName = &buf[0];
  PIDLIST_ABSOLUTE pidl = SHBrowseForFolderW(&bi);
  if (pidl) {
    wchar_t path[MAX_PATH];
    if (SHGetPathFromIDListW(pidl, path)) {
      g_installDir = path;
      SetWindowTextW(g_pathEdit, g_installDir.c_str());
    }
    CoTaskMemFree(pidl);
  }
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------
static LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
  switch (msg) {
    case WM_CREATE: {
      CREATESTRUCTW* cs = (CREATESTRUCTW*)lp;
      HINSTANCE inst = (HINSTANCE)cs->lpCreateParams;
      g_hwnd = hwnd;
      SetWindowTextW(hwnd, L"ASHES OF HUMANITY: LAST SIGNAL - Installer");

      HFONT font = CreateFontW(15, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE, DEFAULT_CHARSET,
                               OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY,
                               DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI");
      HFONT bigFont = CreateFontW(26, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE, DEFAULT_CHARSET,
                                  OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY,
                                  DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI");
      RECT r;
      GetClientRect(hwnd, &r);
      int W = r.right, H = r.bottom;

      HWND title = CreateWindowExW(0, L"STATIC", L"ASHES OF HUMANITY: LAST SIGNAL",
                                   WS_CHILD | WS_VISIBLE, 24, 20, W - 48, 34, hwnd, nullptr,
                                   inst, nullptr);
      SendMessageW(title, WM_SETFONT, (WPARAM)bigFont, TRUE);
      HWND sub = CreateWindowExW(0, L"STATIC",
        L"Version 1.0.0  -  original 3D survival action RPG for Windows 64-bit.\r\n"
        L"The installer unpacks the game into the folder you choose.",
        WS_CHILD | WS_VISIBLE, 24, 58, W - 48, 44, hwnd, nullptr, inst, nullptr);
      SendMessageW(sub, WM_SETFONT, (WPARAM)font, TRUE);

      HWND lbl = CreateWindowExW(0, L"STATIC", L"Install to:", WS_CHILD | WS_VISIBLE,
                                 24, 118, 80, 22, hwnd, nullptr, inst, nullptr);
      SendMessageW(lbl, WM_SETFONT, (WPARAM)font, TRUE);

      g_pathEdit = CreateWindowExW(WS_EX_CLIENTEDGE, L"EDIT", g_installDir.c_str(),
                                   WS_CHILD | WS_VISIBLE | WS_TABSTOP | ES_AUTOHSCROLL,
                                   100, 114, W - 220, 26, hwnd, nullptr, inst, nullptr);
      SendMessageW(g_pathEdit, WM_SETFONT, (WPARAM)font, TRUE);
      HWND browseBtn = CreateWindowExW(0, L"BUTTON", L"Browse...",
                                       WS_CHILD | WS_VISIBLE | WS_TABSTOP | BS_PUSHBUTTON,
                                       W - 112, 114, 88, 26, hwnd, (HMENU)2, inst, nullptr);
      SendMessageW(browseBtn, WM_SETFONT, (WPARAM)font, TRUE);

      g_launchCheck = CreateWindowExW(0, L"BUTTON", L"Launch the game when the install finishes",
                                      WS_CHILD | WS_VISIBLE | WS_TABSTOP | BS_AUTOCHECKBOX,
                                      24, 152, W - 48, 24, hwnd, (HMENU)3, inst, nullptr);
      SendMessageW(g_launchCheck, WM_SETFONT, (WPARAM)font, TRUE);
      SendMessageW(g_launchCheck, BM_SETCHECK, BST_CHECKED, 0);

      g_progress = CreateWindowExW(0, L"PROGRESS32", L"", WS_CHILD | WS_VISIBLE,
                                   24, 186, W - 48, 18, hwnd, nullptr, inst, nullptr);
      SendMessageW(g_progress, PBM_SETRANGE, 0, MAKELPARAM(0, 100));

      g_status = CreateWindowExW(0, L"STATIC", L"Ready.", WS_CHILD | WS_VISIBLE,
                                 24, 212, W - 48, 22, hwnd, nullptr, inst, nullptr);
      SendMessageW(g_status, WM_SETFONT, (WPARAM)font, TRUE);

      g_button = CreateWindowExW(0, L"BUTTON", L"Install",
                                 WS_CHILD | WS_VISIBLE | WS_TABSTOP | BS_DEFPUSHBUTTON,
                                 W - 140, H - 56, 116, 32, hwnd, (HMENU)1, inst, nullptr);
      SendMessageW(g_button, WM_SETFONT, (WPARAM)font, TRUE);
      SetFocus(g_pathEdit);
      break;
    }
    case WM_COMMAND: {
      int id = LOWORD(wp);
      if (id == 1) {         // install
        wchar_t buf[MAX_PATH];
        GetWindowTextW(g_pathEdit, buf, MAX_PATH);
        g_installDir = buf;
        while (!g_installDir.empty() &&
               (g_installDir.back() == L'\\' || g_installDir.back() == L'/'))
          g_installDir.pop_back();
        g_launch = (SendMessageW(g_launchCheck, BM_GETCHECK, 0, 0) == BST_CHECKED);
        SetWindowTextW(g_button, L"Installing...");
        doInstall();
        SetWindowTextW(g_button, L"Installed");
      } else if (id == 2) {
        browse(hwnd);
      }
      break;
    }
    case WM_CLOSE:
      DestroyWindow(hwnd);
      break;
    case WM_DESTROY:
      PostQuitMessage(0);
      break;
    default:
      break;
  }
  return DefWindowProcW(hwnd, msg, wp, lp);
}

// The GUI entry point.
static int runInstaller(HINSTANCE inst);

int WINAPI WinMain(HINSTANCE inst, HINSTANCE, LPSTR, int) {
  return runInstaller(inst);
}

static int runInstaller(HINSTANCE inst) {
  CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);

  // default install folder
  wchar_t buf[MAX_PATH];
  if (SUCCEEDED(SHGetFolderPathW(nullptr, CSIDL_LOCAL_APPDATA, nullptr, SHGFP_TYPE_CURRENT, buf)))
    g_installDir = std::wstring(buf) + L"\\AshesOfHumanity";
  else
    g_installDir = L"C:\\AshesOfHumanity";

  WNDCLASSW wc = {};
  wc.hInstance = inst;
  wc.lpfnWndProc = WndProc;
  wc.lpszClassName = L"AshesInstaller";
  wc.hCursor = LoadCursorA(nullptr, IDC_ARROW);
  wc.hbrBackground = (HBRUSH)GetStockObject(BLACK_BRUSH);
  wc.hIcon = LoadIconW(inst, MAKEINTRESOURCEW(1));
  if (!wc.hIcon) wc.hIcon = LoadIconA(nullptr, IDI_APPLICATION);
  RegisterClassW(&wc);

  RECT r = { 0, 0, 560, 330 };
  AdjustWindowRect(&r, WS_OVERLAPPEDWINDOW, FALSE);
  HWND hwnd = CreateWindowExW(WS_EX_APPWINDOW, L"AshesInstaller",
                              L"ASHES OF HUMANITY: LAST SIGNAL - Installer",
                              WS_OVERLAPPEDWINDOW | WS_CLIPCHILDREN, CW_USEDEFAULT,
                              CW_USEDEFAULT, r.right - r.left, r.bottom - r.top,
                              nullptr, nullptr, inst, nullptr);
  if (!hwnd) return 1;
  ShowWindow(hwnd, SW_SHOW);
  UpdateWindow(hwnd);

  MSG msg;
  while (GetMessageW(&msg, nullptr, 0, 0) > 0) {
    TranslateMessage(&msg);
    DispatchMessageW(&msg);
  }
  CoUninitialize();
  return 0;
}
