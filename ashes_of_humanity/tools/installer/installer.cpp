// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Installer payload extractor.
//
//  The installer executable has a ZIP archive appended to it.  At run time it
//  locates the archive inside its own image, inflates every entry and writes
//  the game to the chosen directory.
//
//  A compact DEFLATE (RFC 1951) decoder is included so the build has no
//  external dependencies.
// ============================================================================
#include <windows.h>
#include <shellapi.h>
#include "zipreader.h"
#include <shlobj.h>
#include <shlwapi.h>
#include <objbase.h>
#include <cstdio>
#include <cstring>
#include <string>
#include <vector>


// ---------------------------------------------------------------------------
// Installer
// ---------------------------------------------------------------------------
static HWND g_hwnd = nullptr;
static HWND g_pathEdit = nullptr;
static HWND g_status = nullptr;
static HWND g_progress = nullptr;
static HWND g_button = nullptr;
static HWND g_launchCheck = nullptr;
static std::string g_installDir;
static bool g_launch = true;
static std::string g_payloadExe;

static void setStatus(const char* text) {
  if (g_status) SetWindowTextA(g_status, text);
}

static bool ensureDirs(const std::string& path) {
  std::string cur;
  for (size_t i = 0; i < path.size(); ++i) {
    cur += path[i];
    if (path[i] == '\\' || i + 1 == path.size())
      CreateDirectoryA(cur.c_str(), nullptr);
  }
  return true;
}

static void createShortcut(const char* exePath, const char* shortcutPath) {
  IShellLinkW* link = nullptr;
  if (SUCCEEDED(CoCreateInstance(CLSID_ShellLink, nullptr, CLSCTX_INPROC_SERVER,
                                 IID_IShellLinkW, (void**)&link))) {
    IShellLinkW* wl = link;
    wchar_t wexe[MAX_PATH], work[MAX_PATH];
    MultiByteToWideChar(CP_ACP, 0, exePath, -1, wexe, MAX_PATH);
    wl->SetPath(wexe);
    lstrcpynW(work, wexe, MAX_PATH);
    PathRemoveFileSpecW(work);
    wl->SetWorkingDirectory(work);
    wl->SetDescription(L"ASHES OF HUMANITY: LAST SIGNAL");
    IPersistFile* pf = nullptr;
    if (SUCCEEDED(wl->QueryInterface(IID_IPersistFile, (void**)&pf))) {
      wchar_t sp[MAX_PATH];
      MultiByteToWideChar(CP_ACP, 0, shortcutPath, -1, sp, MAX_PATH);
      pf->Save(sp, TRUE);
      pf->Release();
    }
    link->Release();
  }
}

static void doInstall() {
  setStatus("Reading package...");
  // locate our own executable
  char self[MAX_PATH];
  GetModuleFileNameA(nullptr, self, MAX_PATH);
  HANDLE f = CreateFileA(self, GENERIC_READ, FILE_SHARE_READ, nullptr, OPEN_EXISTING,
                         FILE_ATTRIBUTE_NORMAL, nullptr);
  if (f == INVALID_HANDLE_VALUE) { setStatus("Cannot read the installer."); return; }
  LARGE_INTEGER li;
  GetFileSizeEx(f, &li);
  size_t size = (size_t)li.QuadPart;
  std::vector<zip::u8> image(size);
  DWORD read = 0;
  ReadFile(f, image.data(), (DWORD)size, &read, nullptr);
  CloseHandle(f);

  std::vector<zip::ZipEntry> entries;
  size_t zipBase = 0;
  if (!zip::readZip(image.data(), size, entries, &zipBase)) {
    setStatus("The installer package is damaged.");
    return;
  }

  ensureDirs(g_installDir);
  int done = 0;
  int total = (int)entries.size();
  for (size_t i = 0; i < entries.size(); ++i) {
    const zip::ZipEntry& e = entries[i];
    if (!e.name.empty() && e.name.back() == '/') {
      std::string dir = g_installDir + "\\" + e.name;
      ensureDirs(dir);
      continue;
    }
    std::string outPath = g_installDir + "\\" + e.name;
    size_t slash = outPath.find_last_of("\\/");
    if (slash != std::string::npos) ensureDirs(outPath.substr(0, slash));

    std::vector<zip::u8> content;
    if (!zip::extractEntry(image.data(), size, e, content, zipBase)) {
      setStatus("Failed to extract a file.");
      return;
    }
    HANDLE out = CreateFileA(outPath.c_str(), GENERIC_WRITE, 0, nullptr, CREATE_ALWAYS,
                             FILE_ATTRIBUTE_NORMAL, nullptr);
    if (out == INVALID_HANDLE_VALUE) { setStatus("Cannot write the game files."); return; }
    DWORD written = 0;
    WriteFile(out, content.data(), (DWORD)content.size(), &written, nullptr);
    CloseHandle(out);
    done++;
    if (g_progress) {
      SendMessageA(g_progress, PBM_SETPOS, (WPARAM)((done * 100) / (total ? total : 1)), 0);
      char buf[64];
      snprintf(buf, sizeof(buf), "Extracting %d / %d", done, total);
      setStatus(buf);
    }
  }

  std::string gameExe = g_installDir + "\\AshesOfHumanity.exe";
  g_payloadExe = gameExe;

  // shortcuts
  char desktop[MAX_PATH], startMenu[MAX_PATH];
  SHGetFolderPathA(nullptr, CSIDL_DESKTOPDIRECTORY, nullptr, SHGFP_TYPE_CURRENT, desktop);
  SHGetFolderPathA(nullptr, CSIDL_PROGRAMS, nullptr, SHGFP_TYPE_CURRENT, startMenu);
  std::string progDir = std::string(startMenu) + "\\Ashes of Humanity";
  ensureDirs(progDir);
  std::string lnk = progDir + "\\Ashes of Humanity.lnk";
  createShortcut(gameExe.c_str(), lnk.c_str());
  std::string dsk = std::string(desktop) + "\\Ashes of Humanity.lnk";
  createShortcut(gameExe.c_str(), dsk.c_str());

  setStatus("Installation complete.");
  if (g_button) EnableWindow(g_button, FALSE);
  if (g_launchCheck) EnableWindow(g_launchCheck, FALSE);
  if (g_launch) {
    Sleep(400);
    ShellExecuteA(nullptr, "open", gameExe.c_str(), nullptr, nullptr, SW_SHOWNORMAL);
  }
}

static void browse(HWND hwnd) {
  BROWSEINFOA bi = {0};
  bi.hwndOwner = hwnd;
  bi.lpszTitle = "Choose the installation folder";
  bi.ulFlags = BIF_RETURNONLYFSDIRS | BIF_NEWDIALOGSTYLE;
  char buf[MAX_PATH] = {0};
  bi.pszDisplayName = buf;
  PIDLIST_ABSOLUTE pidl = SHBrowseForFolderA(&bi);
  if (pidl) {
    char path[MAX_PATH];
    if (SHGetPathFromIDListA(pidl, path)) {
      g_installDir = path;
      SetWindowTextA(g_pathEdit, g_installDir.c_str());
    }
    CoTaskMemFree(pidl);
  }
}

static LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
  switch (msg) {
    case WM_CREATE: {
      CREATESTRUCTA* cs = (CREATESTRUCTA*)lp;
      HINSTANCE inst = (HINSTANCE)cs->lpCreateParams;
      g_hwnd = hwnd;
      SetWindowTextA(hwnd, "ASHES OF HUMANITY: LAST SIGNAL - Installer");

      HFONT font = CreateFontA(15, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE, DEFAULT_CHARSET,
                               OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY,
                               DEFAULT_PITCH | FF_DONTCARE, "Segoe UI");
      HFONT bigFont = CreateFontA(26, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE, DEFAULT_CHARSET,
                                  OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY,
                                  DEFAULT_PITCH | FF_DONTCARE, "Segoe UI");
      RECT r;
      GetClientRect(hwnd, &r);
      int W = r.right, H = r.bottom;

      HWND title = CreateWindowExA(0, "STATIC", "ASHES OF HUMANITY: LAST SIGNAL", WS_CHILD | WS_VISIBLE,
                                   24, 20, W - 48, 34, hwnd, nullptr, inst, nullptr);
      SendMessageA(title, WM_SETFONT, (WPARAM)bigFont, TRUE);
      HWND sub = CreateWindowExA(0, "STATIC",
        "Version 1.0.0  -  original 3D survival action RPG for Windows 64-bit.\r\n"
        "The installer unpacks the game into the folder you choose.",
        WS_CHILD | WS_VISIBLE, 24, 58, W - 48, 44, hwnd, nullptr, inst, nullptr);
      SendMessageA(sub, WM_SETFONT, (WPARAM)font, TRUE);

      HWND lbl = CreateWindowExA(0, "STATIC", "Install to:", WS_CHILD | WS_VISIBLE,
                                 24, 118, 80, 22, hwnd, nullptr, inst, nullptr);
      SendMessageA(lbl, WM_SETFONT, (WPARAM)font, TRUE);

      g_pathEdit = CreateWindowExA(WS_EX_CLIENTEDGE, "EDIT", g_installDir.c_str(),
                                   WS_CHILD | WS_VISIBLE | WS_TABSTOP | ES_AUTOHSCROLL,
                                   100, 114, W - 220, 26, hwnd, nullptr, inst, nullptr);
      SendMessageA(g_pathEdit, WM_SETFONT, (WPARAM)font, TRUE);
      HWND browseBtn = CreateWindowExA(0, "BUTTON", "Browse...",
                                       WS_CHILD | WS_VISIBLE | WS_TABSTOP | BS_PUSHBUTTON,
                                       W - 112, 114, 88, 26, hwnd, (HMENU)2, inst, nullptr);
      SendMessageA(browseBtn, WM_SETFONT, (WPARAM)font, TRUE);

      g_launchCheck = CreateWindowExA(0, "BUTTON", "Launch the game when the install finishes",
                                      WS_CHILD | WS_VISIBLE | WS_TABSTOP | BS_AUTOCHECKBOX,
                                      24, 152, W - 48, 24, hwnd, (HMENU)3, inst, nullptr);
      SendMessageA(g_launchCheck, WM_SETFONT, (WPARAM)font, TRUE);
      SendMessageA(g_launchCheck, BM_SETCHECK, BST_CHECKED, 0);

      g_progress = CreateWindowExA(0, "PROGRESS32", "", WS_CHILD | WS_VISIBLE,
                                   24, 186, W - 48, 18, hwnd, nullptr, inst, nullptr);
      SendMessageA(g_progress, PBM_SETRANGE, 0, MAKELPARAM(0, 100));

      g_status = CreateWindowExA(0, "STATIC", "Ready.", WS_CHILD | WS_VISIBLE,
                                 24, 212, W - 48, 22, hwnd, nullptr, inst, nullptr);
      SendMessageA(g_status, WM_SETFONT, (WPARAM)font, TRUE);

      g_button = CreateWindowExA(0, "BUTTON", "Install", WS_CHILD | WS_VISIBLE | WS_TABSTOP | BS_DEFPUSHBUTTON,
                                 W - 140, H - 56, 116, 32, hwnd, (HMENU)1, inst, nullptr);
      SendMessageA(g_button, WM_SETFONT, (WPARAM)font, TRUE);
      SetFocus(g_pathEdit);
      break;
    }
    case WM_COMMAND: {
      int id = LOWORD(wp);
      if (id == 1) {         // install
        char buf[MAX_PATH];
        GetWindowTextA(g_pathEdit, buf, MAX_PATH);
        g_installDir = buf;
        while (!g_installDir.empty() && (g_installDir.back() == '\\' || g_installDir.back() == '/'))
          g_installDir.pop_back();
        g_launch = (SendMessageA(g_launchCheck, BM_GETCHECK, 0, 0) == BST_CHECKED);
        SetWindowTextA(g_button, "Installing...");
        doInstall();
        SetWindowTextA(g_button, "Installed");
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
  return DefWindowProcA(hwnd, msg, wp, lp);
}

int WINAPI WinMain(HINSTANCE inst, HINSTANCE, LPSTR, int) {
  CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
  // default install folder
  char buf[MAX_PATH];
  if (SUCCEEDED(SHGetFolderPathA(nullptr, CSIDL_LOCAL_APPDATA, nullptr, SHGFP_TYPE_CURRENT, buf))) {
    g_installDir = std::string(buf) + "\\AshesOfHumanity";
  } else {
    g_installDir = "C:\\AshesOfHumanity";
  }

  WNDCLASSA wc = {};
  wc.hInstance = inst;
  wc.lpfnWndProc = WndProc;
  wc.lpszClassName = "AshesInstaller";
  wc.hCursor = LoadCursorA(nullptr, IDC_ARROW);
  wc.hbrBackground = (HBRUSH)GetStockObject(BLACK_BRUSH);
  wc.hIcon = LoadIconA(inst, MAKEINTRESOURCEA(1));
  if (!wc.hIcon) wc.hIcon = LoadIconA(nullptr, IDI_APPLICATION);
  RegisterClassA(&wc);

  RECT r = { 0, 0, 560, 330 };
  AdjustWindowRect(&r, WS_OVERLAPPEDWINDOW, FALSE);
  HWND hwnd = CreateWindowExA(WS_EX_APPWINDOW, "AshesInstaller",
                              "ASHES OF HUMANITY: LAST SIGNAL - Installer",
                              WS_OVERLAPPEDWINDOW | WS_CLIPCHILDREN, CW_USEDEFAULT,
                              CW_USEDEFAULT, r.right - r.left, r.bottom - r.top,
                              nullptr, nullptr, inst, nullptr);
  if (!hwnd) return 1;
  ShowWindow(hwnd, SW_SHOW);
  UpdateWindow(hwnd);

  MSG msg;
  while (GetMessageA(&msg, nullptr, 0, 0) > 0) {
    TranslateMessage(&msg);
    DispatchMessageA(&msg);
  }
  CoUninitialize();
  return 0;
}
