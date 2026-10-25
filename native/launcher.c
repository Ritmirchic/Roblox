/*
 * SPACE MINER: BUILD & CONQUER - native Windows launcher
 * ------------------------------------------------------
 * A self-contained Win64 host for the game runtime:
 *   1. locates the "game" folder next to the executable,
 *   2. serves it over a loopback-only HTTP server (no external network access),
 *   3. opens the game full-screen in an isolated Chromium/Edge app window
 *      (falls back to the default browser),
 *   4. shuts the server down when the game window closes.
 *
 * The HTTP core is platform neutral so the exact same code is compiled and
 * functionally tested on Linux during the build (see scripts/build-windows.sh).
 *
 * Build (Windows):  zig cc -target x86_64-windows-gnu -O2 launcher.c -o SpaceMiner.exe -lws2_32 -lshell32 -lole32
 * Build (test):     zig cc -DSM_POSIX -O2 launcher.c -o launcher_test
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <time.h>

#ifdef SM_POSIX
  #include <sys/socket.h>
  #include <netinet/in.h>
  #include <arpa/inet.h>
  #include <unistd.h>
  #include <pthread.h>
  typedef int sm_socket;
  #define SM_INVALID (-1)
  #define sm_close close
  #define SM_PATH_SEP '/'
#else
  #ifndef WIN32_LEAN_AND_MEAN
  #define WIN32_LEAN_AND_MEAN
  #endif
  #include <winsock2.h>
  #include <ws2tcpip.h>
  #include <windows.h>
  #include <shellapi.h>
  typedef SOCKET sm_socket;
  #define SM_INVALID INVALID_SOCKET
  #define sm_close closesocket
  #define SM_PATH_SEP '\\'
#endif

#define SM_PORT_FIRST 51731
#define SM_PORT_LAST  51760
#define SM_MAX_PATH   4096
#define SM_BUF        65536

static char g_root[SM_MAX_PATH];     /* directory containing index.html */
static volatile int g_running = 1;
static int g_port = 0;

/* ------------------------------------------------------------------ helpers */

static const char *mime_for(const char *path) {
    const char *dot = strrchr(path, '.');
    if (!dot) return "application/octet-stream";
    if (!strcmp(dot, ".html") || !strcmp(dot, ".htm")) return "text/html; charset=utf-8";
    if (!strcmp(dot, ".js") || !strcmp(dot, ".mjs"))   return "text/javascript; charset=utf-8";
    if (!strcmp(dot, ".css"))  return "text/css; charset=utf-8";
    if (!strcmp(dot, ".json")) return "application/json; charset=utf-8";
    if (!strcmp(dot, ".png"))  return "image/png";
    if (!strcmp(dot, ".jpg") || !strcmp(dot, ".jpeg")) return "image/jpeg";
    if (!strcmp(dot, ".svg"))  return "image/svg+xml";
    if (!strcmp(dot, ".ico"))  return "image/x-icon";
    if (!strcmp(dot, ".woff2")) return "font/woff2";
    if (!strcmp(dot, ".woff")) return "font/woff";
    if (!strcmp(dot, ".ttf"))  return "font/ttf";
    if (!strcmp(dot, ".wasm")) return "application/wasm";
    if (!strcmp(dot, ".map"))  return "application/json";
    return "application/octet-stream";
}

/* Percent-decode and reject any attempt to escape the game directory. */
static int sanitize_path(const char *raw, char *out, size_t out_size) {
    size_t o = 0;
    for (size_t i = 0; raw[i] && raw[i] != '?' && raw[i] != '#'; i++) {
        char c = raw[i];
        if (c == '%' && raw[i + 1] && raw[i + 2]) {
            char hex[3] = { raw[i + 1], raw[i + 2], 0 };
            c = (char)strtol(hex, NULL, 16);
            i += 2;
        }
        if (c == '\\') c = '/';
        if (o + 1 >= out_size) return 0;
        out[o++] = c;
    }
    out[o] = 0;
    if (strstr(out, "..")) return 0;              /* no directory traversal */
    if (out[0] != '/') return 0;
    return 1;
}

static int join_path(const char *root, const char *rel, char *out, size_t out_size) {
    size_t rl = strlen(root);
    if (rl + strlen(rel) + 2 >= out_size) return 0;
    strcpy(out, root);
    if (rl > 0 && out[rl - 1] != '/' && out[rl - 1] != '\\') {
        out[rl] = SM_PATH_SEP;
        out[rl + 1] = 0;
        rl++;
    }
    const char *r = rel;
    while (*r == '/') r++;
    size_t o = rl;
    for (; *r; r++) {
        out[o++] = (*r == '/') ? SM_PATH_SEP : *r;
    }
    out[o] = 0;
    return 1;
}

static unsigned char *read_whole_file(const char *path, long *size_out) {
    FILE *f = fopen(path, "rb");
    if (!f) return NULL;
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);
    if (size < 0) { fclose(f); return NULL; }
    unsigned char *buf = (unsigned char *)malloc((size_t)size + 1);
    if (!buf) { fclose(f); return NULL; }
    size_t got = fread(buf, 1, (size_t)size, f);
    fclose(f);
    buf[got] = 0;
    *size_out = (long)got;
    return buf;
}

static void send_all(sm_socket s, const char *data, size_t len) {
    size_t sent = 0;
    while (sent < len) {
        int n = send(s, data + sent, (int)(len - sent), 0);
        if (n <= 0) return;
        sent += (size_t)n;
    }
}

static void send_simple(sm_socket s, const char *status, const char *body) {
    char head[512];
    int n = snprintf(head, sizeof(head),
        "HTTP/1.1 %s\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: %u\r\n"
        "Connection: close\r\n\r\n", status, (unsigned)strlen(body));
    send_all(s, head, (size_t)n);
    send_all(s, body, strlen(body));
}

/* Serves one request. Returns 1 when the client asked the server to quit. */
static int handle_client(sm_socket client) {
    char buf[SM_BUF];
    int received = recv(client, buf, sizeof(buf) - 1, 0);
    if (received <= 0) return 0;
    buf[received] = 0;

    char method[8] = {0};
    char target[SM_MAX_PATH] = {0};
    if (sscanf(buf, "%7s %4095s", method, target) != 2) {
        send_simple(client, "400 Bad Request", "bad request");
        return 0;
    }
    if (strcmp(method, "GET") != 0 && strcmp(method, "HEAD") != 0) {
        send_simple(client, "405 Method Not Allowed", "method not allowed");
        return 0;
    }

    char clean[SM_MAX_PATH];
    if (!sanitize_path(target, clean, sizeof(clean))) {
        send_simple(client, "403 Forbidden", "forbidden");
        return 0;
    }
    if (!strcmp(clean, "/__quit")) {
        send_simple(client, "200 OK", "bye");
        return 1;
    }
    if (!strcmp(clean, "/")) strcpy(clean, "/index.html");

    char full[SM_MAX_PATH];
    if (!join_path(g_root, clean, full, sizeof(full))) {
        send_simple(client, "414 URI Too Long", "path too long");
        return 0;
    }

    long size = 0;
    unsigned char *data = read_whole_file(full, &size);
    if (!data) {
        /* Single page app fallback. */
        char fallback[SM_MAX_PATH];
        if (join_path(g_root, "/index.html", fallback, sizeof(fallback))) {
            data = read_whole_file(fallback, &size);
            if (data) strcpy(clean, "/index.html");
        }
        if (!data) {
            send_simple(client, "404 Not Found", "not found");
            return 0;
        }
    }

    char head[1024];
    int n = snprintf(head, sizeof(head),
        "HTTP/1.1 200 OK\r\nContent-Type: %s\r\nContent-Length: %ld\r\n"
        "Cache-Control: no-cache\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n",
        mime_for(clean), size);
    send_all(client, head, (size_t)n);
    if (strcmp(method, "HEAD") != 0) send_all(client, (const char *)data, (size_t)size);
    free(data);
    return 0;
}

static sm_socket bind_loopback(int *port_out) {
    for (int port = SM_PORT_FIRST; port <= SM_PORT_LAST; port++) {
        sm_socket s = socket(AF_INET, SOCK_STREAM, 0);
        if (s == SM_INVALID) continue;
        int yes = 1;
        setsockopt(s, SOL_SOCKET, SO_REUSEADDR, (const char *)&yes, sizeof(yes));
        struct sockaddr_in addr;
        memset(&addr, 0, sizeof(addr));
        addr.sin_family = AF_INET;
        addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);   /* localhost only */
        addr.sin_port = htons((unsigned short)port);
        if (bind(s, (struct sockaddr *)&addr, sizeof(addr)) == 0 && listen(s, 16) == 0) {
            *port_out = port;
            return s;
        }
        sm_close(s);
    }
    return SM_INVALID;
}

static void serve_forever(sm_socket server) {
    while (g_running) {
        struct sockaddr_in client_addr;
#ifdef SM_POSIX
        socklen_t len = sizeof(client_addr);
#else
        int len = sizeof(client_addr);
#endif
        sm_socket client = accept(server, (struct sockaddr *)&client_addr, &len);
        if (client == SM_INVALID) continue;
        int quit = handle_client(client);
        sm_close(client);
        if (quit) break;
    }
    sm_close(server);
}

/* ------------------------------------------------------------------ Windows */
#ifndef SM_POSIX

static DWORD WINAPI server_thread(LPVOID param) {
    serve_forever((sm_socket)(uintptr_t)param);
    return 0;
}

static int file_exists_w(const wchar_t *path) {
    DWORD attr = GetFileAttributesW(path);
    return attr != INVALID_FILE_ATTRIBUTES && !(attr & FILE_ATTRIBUTE_DIRECTORY);
}

/* Finds a Chromium-family browser so the game can run in a clean app window. */
static int find_browser(wchar_t *out, size_t count) {
    static const wchar_t *candidates[] = {
        L"%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe",
        L"%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe",
        L"%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe",
        L"%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe",
        L"%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe",
        L"%ProgramFiles%\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
    };
    for (size_t i = 0; i < sizeof(candidates) / sizeof(candidates[0]); i++) {
        wchar_t expanded[MAX_PATH];
        if (!ExpandEnvironmentStringsW(candidates[i], expanded, MAX_PATH)) continue;
        if (file_exists_w(expanded)) {
            wcsncpy(out, expanded, count - 1);
            out[count - 1] = 0;
            return 1;
        }
    }
    return 0;
}

int WINAPI wWinMain(HINSTANCE hInstance, HINSTANCE hPrev, PWSTR cmdline, int showCmd) {
    (void)hInstance; (void)hPrev; (void)cmdline; (void)showCmd;

    /* Resolve <exe dir>\game as the web root. */
    wchar_t exePathW[MAX_PATH];
    GetModuleFileNameW(NULL, exePathW, MAX_PATH);
    wchar_t *slash = wcsrchr(exePathW, L'\\');
    if (slash) *slash = 0;
    wchar_t rootW[MAX_PATH];
    _snwprintf(rootW, MAX_PATH, L"%s\\game", exePathW);
    WideCharToMultiByte(CP_UTF8, 0, rootW, -1, g_root, sizeof(g_root), NULL, NULL);

    wchar_t indexW[MAX_PATH];
    _snwprintf(indexW, MAX_PATH, L"%s\\index.html", rootW);
    if (!file_exists_w(indexW)) {
        MessageBoxW(NULL,
            L"Game data not found.\n\nThe 'game' folder must sit next to SpaceMiner.exe.\n"
            L"Please re-extract the whole archive, keeping its folder structure.",
            L"Space Miner: Build & Conquer", MB_ICONERROR | MB_OK);
        return 1;
    }

    WSADATA wsa;
    if (WSAStartup(MAKEWORD(2, 2), &wsa) != 0) {
        MessageBoxW(NULL, L"Windows Sockets could not be initialised.", L"Space Miner", MB_ICONERROR | MB_OK);
        return 1;
    }
    sm_socket server = bind_loopback(&g_port);
    if (server == SM_INVALID) {
        MessageBoxW(NULL, L"No free local port could be opened for the game runtime.", L"Space Miner", MB_ICONERROR | MB_OK);
        WSACleanup();
        return 1;
    }
    HANDLE thread = CreateThread(NULL, 0, server_thread, (LPVOID)(uintptr_t)server, 0, NULL);

    wchar_t url[128];
    _snwprintf(url, 128, L"http://127.0.0.1:%d/index.html", g_port);

    wchar_t browser[MAX_PATH];
    int launched = 0;
    if (find_browser(browser, MAX_PATH)) {
        wchar_t profile[MAX_PATH];
        wchar_t localApp[MAX_PATH];
        ExpandEnvironmentStringsW(L"%LocalAppData%", localApp, MAX_PATH);
        _snwprintf(profile, MAX_PATH, L"%s\\SpaceMiner\\runtime", localApp);
        CreateDirectoryW(localApp, NULL);
        wchar_t parent[MAX_PATH];
        _snwprintf(parent, MAX_PATH, L"%s\\SpaceMiner", localApp);
        CreateDirectoryW(parent, NULL);
        CreateDirectoryW(profile, NULL);

        wchar_t args[2048];
        _snwprintf(args, 2048,
            L"\"%s\" --app=%s --user-data-dir=\"%s\" --start-maximized --no-first-run "
            L"--no-default-browser-check --disable-translate --disable-features=Translate,TranslateUI "
            L"--autoplay-policy=no-user-gesture-required --disable-background-networking",
            browser, url, profile);

        STARTUPINFOW si;
        PROCESS_INFORMATION pi;
        ZeroMemory(&si, sizeof(si));
        si.cb = sizeof(si);
        ZeroMemory(&pi, sizeof(pi));
        if (CreateProcessW(NULL, args, NULL, NULL, FALSE, 0, NULL, NULL, &si, &pi)) {
            launched = 1;
            WaitForSingleObject(pi.hProcess, INFINITE);   /* runs until the window closes */
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
        }
    }

    if (!launched) {
        /* No Chromium-family browser: hand off to the default browser and wait for the player. */
        ShellExecuteW(NULL, L"open", url, NULL, NULL, SW_SHOWNORMAL);
        MessageBoxW(NULL,
            L"Space Miner is running in your web browser.\n\n"
            L"Keep this message open while you play.\nClick OK to shut the game runtime down.",
            L"Space Miner: Build & Conquer", MB_ICONINFORMATION | MB_OK);
    }

    /* Stop the server: unblock accept() with a loopback connection. */
    g_running = 0;
    sm_socket poke = socket(AF_INET, SOCK_STREAM, 0);
    if (poke != SM_INVALID) {
        struct sockaddr_in addr;
        memset(&addr, 0, sizeof(addr));
        addr.sin_family = AF_INET;
        addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
        addr.sin_port = htons((unsigned short)g_port);
        if (connect(poke, (struct sockaddr *)&addr, sizeof(addr)) == 0) {
            const char *req = "GET /__quit HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n";
            send(poke, req, (int)strlen(req), 0);
        }
        sm_close(poke);
    }
    if (thread) {
        WaitForSingleObject(thread, 3000);
        CloseHandle(thread);
    }
    WSACleanup();
    return 0;
}

#else /* ------------------------------------------------------------- POSIX */

/*
 * POSIX build used by the build pipeline to functionally test the HTTP core
 * (path sanitising, MIME types, SPA fallback, range of served files).
 */
int main(int argc, char **argv) {
    if (argc < 2) {
        fprintf(stderr, "usage: %s <web-root> [--self-test]\n", argv[0]);
        return 2;
    }
    snprintf(g_root, sizeof(g_root), "%s", argv[1]);

    if (argc > 2 && !strcmp(argv[2], "--self-test")) {
        char out[SM_MAX_PATH];
        int failures = 0;
        struct { const char *in; int ok; } cases[] = {
            { "/index.html", 1 }, { "/assets/app.js", 1 }, { "/../etc/passwd", 0 },
            { "/a/../../b", 0 }, { "/%2e%2e/secret", 0 }, { "/ok%20file.png", 1 },
        };
        for (size_t i = 0; i < sizeof(cases) / sizeof(cases[0]); i++) {
            int got = sanitize_path(cases[i].in, out, sizeof(out));
            if (got != cases[i].ok) {
                printf("FAIL sanitize_path(%s) = %d, expected %d\n", cases[i].in, got, cases[i].ok);
                failures++;
            }
        }
        if (strcmp(mime_for("/x/app.js"), "text/javascript; charset=utf-8")) { printf("FAIL mime js\n"); failures++; }
        if (strcmp(mime_for("/x/style.css"), "text/css; charset=utf-8")) { printf("FAIL mime css\n"); failures++; }
        if (strcmp(mime_for("/x/art.png"), "image/png")) { printf("FAIL mime png\n"); failures++; }
        char joined[SM_MAX_PATH];
        join_path("/srv/game", "/assets/a.js", joined, sizeof(joined));
        if (strcmp(joined, "/srv/game/assets/a.js")) { printf("FAIL join_path -> %s\n", joined); failures++; }
        printf(failures ? "launcher self-test FAILED (%d)\n" : "launcher self-test passed\n", failures);
        return failures ? 1 : 0;
    }

    sm_socket server = bind_loopback(&g_port);
    if (server == SM_INVALID) {
        fprintf(stderr, "could not bind a loopback port\n");
        return 1;
    }
    printf("%d\n", g_port);
    fflush(stdout);
    serve_forever(server);
    return 0;
}

#endif
