/*
 * Space Miner uninstaller - removes the game folder, shortcuts and registry entry.
 * Installed alongside the game by SPACE_MINER_SETUP.exe.
 */
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>
#include <shlobj.h>
#include <shellapi.h>
#include <stdio.h>
#include <wchar.h>

static void remove_tree(const wchar_t *dir) {
    wchar_t pattern[MAX_PATH];
    _snwprintf(pattern, MAX_PATH, L"%s\\*", dir);
    WIN32_FIND_DATAW fd;
    HANDLE h = FindFirstFileW(pattern, &fd);
    if (h != INVALID_HANDLE_VALUE) {
        do {
            if (!wcscmp(fd.cFileName, L".") || !wcscmp(fd.cFileName, L"..")) continue;
            wchar_t child[MAX_PATH];
            _snwprintf(child, MAX_PATH, L"%s\\%s", dir, fd.cFileName);
            if (fd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) remove_tree(child);
            else DeleteFileW(child);
        } while (FindNextFileW(h, &fd));
        FindClose(h);
    }
    RemoveDirectoryW(dir);
}

int WINAPI wWinMain(HINSTANCE hInstance, HINSTANCE hPrev, PWSTR cmdline, int showCmd) {
    (void)hInstance; (void)hPrev; (void)cmdline; (void)showCmd;
    if (MessageBoxW(NULL,
            L"Remove Space Miner: Build & Conquer from this computer?\n\n"
            L"Saved progress is stored by your browser profile and is not deleted by this step.",
            L"Uninstall Space Miner", MB_ICONQUESTION | MB_YESNO) != IDYES) {
        return 0;
    }

    wchar_t selfPath[MAX_PATH];
    GetModuleFileNameW(NULL, selfPath, MAX_PATH);
    wchar_t installDir[MAX_PATH];
    wcscpy(installDir, selfPath);
    wchar_t *slash = wcsrchr(installDir, L'\\');
    if (slash) *slash = 0;

    /* Shortcuts. */
    wchar_t path[MAX_PATH], link[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPathW(NULL, CSIDL_PROGRAMS, NULL, 0, path))) {
        _snwprintf(link, MAX_PATH, L"%s\\Space Miner - Build & Conquer.lnk", path);
        DeleteFileW(link);
    }
    if (SUCCEEDED(SHGetFolderPathW(NULL, CSIDL_DESKTOPDIRECTORY, NULL, 0, path))) {
        _snwprintf(link, MAX_PATH, L"%s\\Space Miner.lnk", path);
        DeleteFileW(link);
    }
    RegDeleteKeyW(HKEY_CURRENT_USER,
        L"Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\SpaceMinerBuildAndConquer");

    /* Remove the game payload, then schedule deletion of the folder + this exe. */
    wchar_t gameDir[MAX_PATH];
    _snwprintf(gameDir, MAX_PATH, L"%s\\game", installDir);
    remove_tree(gameDir);
    wchar_t exePath[MAX_PATH];
    _snwprintf(exePath, MAX_PATH, L"%s\\SpaceMiner.exe", installDir);
    DeleteFileW(exePath);
    _snwprintf(exePath, MAX_PATH, L"%s\\README.txt", installDir);
    DeleteFileW(exePath);
    _snwprintf(exePath, MAX_PATH, L"%s\\LICENSE.txt", installDir);
    DeleteFileW(exePath);

    wchar_t cmd[MAX_PATH * 3];
    _snwprintf(cmd, MAX_PATH * 3,
        L"cmd.exe /c ping 127.0.0.1 -n 3 > nul & del /q \"%s\" & rmdir \"%s\"", selfPath, installDir);
    STARTUPINFOW si; PROCESS_INFORMATION pi;
    ZeroMemory(&si, sizeof(si)); si.cb = sizeof(si);
    si.dwFlags = STARTF_USESHOWWINDOW; si.wShowWindow = SW_HIDE;
    ZeroMemory(&pi, sizeof(pi));
    CreateProcessW(NULL, cmd, NULL, NULL, FALSE, CREATE_NO_WINDOW, NULL, NULL, &si, &pi);

    MessageBoxW(NULL, L"Space Miner has been removed.", L"Uninstall complete", MB_ICONINFORMATION | MB_OK);
    return 0;
}
