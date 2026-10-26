#include "core/util.h"
#ifndef _WIN32
#include <unistd.h>
#include <sys/stat.h>
#endif
#include <cstdarg>
#include <cstdio>
#include <chrono>
#include <mutex>
#include <thread>
#include <filesystem>
#if defined(_WIN32)
#include <windows.h>
#endif

namespace aoh {

// ---------------------------------------------------------------- logging --
static std::mutex g_logMutex;
static FILE* g_logFile = nullptr;
static std::string g_dataRoot;

std::string formatStr(const char* fmt, ...) {
  char buf[4096];
  va_list ap; va_start(ap, fmt);
  int n = vsnprintf(buf, sizeof(buf), fmt, ap);
  va_end(ap);
  if (n < 0) return "";
  if ((size_t)n >= sizeof(buf)) buf[sizeof(buf) - 1] = 0;
  return std::string(buf);
}

void logInit(const std::string& logFile) {
  std::lock_guard<std::mutex> lk(g_logMutex);
  if (g_logFile) { fclose(g_logFile); g_logFile = nullptr; }
  if (!logFile.empty()) {
    makeDirs(logFile.substr(0, logFile.find_last_of("/\\")));
    g_logFile = fopen(logFile.c_str(), "wb");
  }
}

void logMsg(LogLevel lvl, const char* file, int line, const std::string& msg) {
  const char* tag = "INFO";
  switch (lvl) {
    case LogLevel::Trace: tag = "TRACE"; break;
    case LogLevel::Info: tag = "INFO "; break;
    case LogLevel::Warn: tag = "WARN "; break;
    case LogLevel::Error: tag = "ERROR"; break;
    case LogLevel::Critical: tag = "FATAL"; break;
  }
  const char* base = file;
  for (const char* p = file; *p; ++p) if (*p == '/' || *p == '\\') base = p + 1;
  std::lock_guard<std::mutex> lk(g_logMutex);
  std::string out = formatStr("[%s] [%s:%d] %s\n", tag, base, line, msg.c_str());
  fputs(out.c_str(), stdout);
  fflush(stdout);
  if (g_logFile) { fputs(out.c_str(), g_logFile); fflush(g_logFile); }
}

void logShutdown() {
  std::lock_guard<std::mutex> lk(g_logMutex);
  if (g_logFile) { fclose(g_logFile); g_logFile = nullptr; }
}

// ------------------------------------------------------------------ files --
bool fileExists(const std::string& path) {
  std::error_code ec;
  return std::filesystem::exists(path, ec) && std::filesystem::is_regular_file(path, ec);
}
bool dirExists(const std::string& path) {
  std::error_code ec;
  return std::filesystem::is_directory(path, ec);
}
bool makeDirs(const std::string& path) {
  if (path.empty()) return true;
  std::error_code ec;
  if (std::filesystem::is_directory(path, ec)) return true;
  std::filesystem::create_directories(path, ec);
  return !ec;
}
std::vector<u8> readFile(const std::string& path, bool* ok) {
  std::vector<u8> data;
  FILE* f = fopen(path.c_str(), "rb");
  if (!f) { if (ok) *ok = false; return data; }
  fseek(f, 0, SEEK_END);
  long sz = ftell(f);
  fseek(f, 0, SEEK_SET);
  if (sz > 0) {
    data.resize((size_t)sz);
    size_t got = fread(data.data(), 1, data.size(), f);
    data.resize(got);
  }
  fclose(f);
  if (ok) *ok = true;
  return data;
}
std::string readTextFile(const std::string& path) {
  std::vector<u8> d = readFile(path);
  return std::string((const char*)d.data(), d.size());
}
bool writeFile(const std::string& path, const void* data, size_t size) {
  size_t sep = path.find_last_of("/\\");
  if (sep != std::string::npos) {
    std::string dir = path.substr(0, sep);
    if (!dir.empty()) makeDirs(dir);
  }
  FILE* f = fopen(path.c_str(), "wb");
  if (!f) return false;
  size_t w = size ? fwrite(data, 1, size, f) : 0;
  fclose(f);
  return w == size;
}
bool writeTextFile(const std::string& path, const std::string& text) {
  return writeFile(path, text.data(), text.size());
}
std::vector<std::string> listDir(const std::string& path) {
  std::vector<std::string> out;
  std::error_code ec;
  for (auto& e : std::filesystem::directory_iterator(path, ec))
    out.push_back(e.path().filename().string());
  return out;
}
std::string exeDir() {
#if defined(_WIN32)
  char buf[MAX_PATH];
  DWORD n = GetModuleFileNameA(nullptr, buf, MAX_PATH);
  std::string p(buf, n);
  size_t s = p.find_last_of("\\/");
  return s == std::string::npos ? std::string(".") : p.substr(0, s);
#elif defined(__linux__)
  char buf[4096];
  ssize_t n = readlink("/proc/self/exe", buf, sizeof(buf) - 1);
  if (n > 0) { buf[n] = 0; std::string p(buf); size_t s = p.find_last_of('/'); return s == std::string::npos ? "." : p.substr(0, s); }
  return ".";
#else
  return ".";
#endif
}
void setDataRoot(const std::string& p) { g_dataRoot = p; }
std::string dataRoot() {
  if (!g_dataRoot.empty()) return g_dataRoot;
  return exeDir();
}
std::string joinPath(const std::string& a, const std::string& b) {
  if (a.empty()) return b;
  if (b.empty()) return a;
  if (b[0] == '/' || b[0] == '\\') return b;
  char c = a[a.size() - 1];
  if (c == '/' || c == '\\') return a + b;
  return a + "/" + b;
}

// ---------------------------------------------------------------- strings --
std::string toLower(std::string s) { for (auto& c : s) c = (char)tolower((unsigned char)c); return s; }
std::string toUpper(std::string s) { for (auto& c : s) c = (char)toupper((unsigned char)c); return s; }
std::string trim(const std::string& s) {
  size_t a = s.find_first_not_of(" \t\r\n");
  if (a == std::string::npos) return "";
  size_t b = s.find_last_not_of(" \t\r\n");
  return s.substr(a, b - a + 1);
}
bool startsWith(const std::string& s, const std::string& p) { return s.size() >= p.size() && s.compare(0, p.size(), p) == 0; }
bool endsWith(const std::string& s, const std::string& p) { return s.size() >= p.size() && s.compare(s.size() - p.size(), p.size(), p) == 0; }
std::vector<std::string> splitStr(const std::string& s, char d) {
  std::vector<std::string> out; std::string cur;
  for (char c : s) { if (c == d) { out.push_back(cur); cur.clear(); } else cur += c; }
  out.push_back(cur);
  return out;
}
std::string replaceAll(std::string s, const std::string& f, const std::string& t) {
  if (f.empty()) return s;
  size_t p = 0;
  while ((p = s.find(f, p)) != std::string::npos) { s.replace(p, f.size(), t); p += t.size(); }
  return s;
}
std::string formatFloat(float v, int d) {
  char buf[64]; snprintf(buf, sizeof(buf), "%.*f", d, v); return std::string(buf);
}

// ----------------------------------------------------------------- timing --
static std::chrono::high_resolution_clock::time_point g_last = std::chrono::high_resolution_clock::now();
static u64 g_frames = 0;
f64 timeNow() {
  return std::chrono::duration<double>(std::chrono::high_resolution_clock::now().time_since_epoch()).count();
}
f64 timeDelta() {
  auto now = std::chrono::high_resolution_clock::now();
  f64 d = std::chrono::duration<double>(now - g_last).count();
  g_last = now;
  return d;
}
u64 frameCount() { return g_frames; }

// -------------------------------------------------------------- utilities --
u64 hashString(const std::string& s) {
  u64 h = 1469598103934665603ull;
  for (unsigned char c : s) { h ^= c; h *= 1099511628211ull; }
  return h;
}
std::string uuid4() {
  static u64 counter = 0;
  u64 a = hashString(formatStr("%llu_%llu_%llu", (u64)timeNow() * 1000000.0, (u64)(uintptr_t)&counter, ++counter));
  char buf[64];
  snprintf(buf, sizeof(buf), "%08x-%04x-%04x-%04x-%012llx",
           (u32)(a & 0xFFFFFFFF), (u32)((a >> 32) & 0xFFFF), (u32)((a >> 48) & 0xFFFF),
           (u32)((a >> 16) & 0xFFFF), (u64)(a * 0x9E3779B97F4A7C15ull));
  return std::string(buf);
}

// ------------------------------------------------------------------ noise --
static inline f32 fade(f32 t) { return t * t * t * (t * (t * 6.0f - 15.0f) + 10.0f); }
static inline f32 grad2(int x, int y, int seed) {
  u32 h = (u32)(x * 374761393 + y * 668265263 + seed * 1442695040888963407ull);
  h = (h ^ (h >> 13)) * 1274126177u;
  h ^= (h >> 16);
  return (f32)(h & 0xFFFFFF) / 8388608.0f - 1.0f;
}
f32 valueNoise2D(f32 x, f32 y, int seed) {
  int xi = (int)floorf(x), yi = (int)floorf(y);
  f32 xf = x - xi, yf = y - yi;
  f32 u = fade(xf), v = fade(yf);
  f32 a = grad2(xi, yi, seed), b = grad2(xi + 1, yi, seed);
  f32 c = grad2(xi, yi + 1, seed), d = grad2(xi + 1, yi + 1, seed);
  return lerpf(lerpf(a, b, u), lerpf(c, d, u), v);
}
f32 fbm2D(f32 x, f32 y, int octaves, f32 lac, f32 gain, int seed) {
  f32 sum = 0, amp = 0.5f, norm = 0;
  for (int i = 0; i < octaves; ++i) {
    sum += valueNoise2D(x, y, seed + i * 131) * amp;
    norm += amp;
    x *= lac; y *= lac; amp *= gain;
  }
  return sum / (norm > 0 ? norm : 1.0f);
}
f32 hashNoise(int x, int y, int seed) { return valueNoise2D((f32)x, (f32)y, seed); }

}
