// Round-trip test for the self-contained ZIP reader and the path logic the
// Windows installer uses (native separators + directory creation).
#include "zipreader.h"
#include <cstdio>
#include <cstdlib>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>

// Mirrors the installer helper: creates every level of the path.
static bool ensureDirs(const std::string& path) {
  std::string cur;
  for (size_t i = 0; i < path.size(); ++i) {
    cur += path[i];
    bool sep = (path[i] == '\\' || path[i] == '/');
    if (sep || i + 1 == path.size()) {
      if (cur.size() > 3) {
        std::string cmd = "mkdir -p '" + cur + "'";
        if (system(cmd.c_str()) != 0) return false;
      }
    }
  }
  return true;
}

int main(int argc, char** argv) {
  if (argc < 3) { std::printf("usage: test_extract <zip> <outdir>\n"); return 2; }
  std::ifstream f(argv[1], std::ios::binary);
  std::vector<zip::u8> data((std::istreambuf_iterator<char>(f)), std::istreambuf_iterator<char>());
  std::vector<zip::ZipEntry> entries;
  size_t base = 0;
  if (!zip::readZip(data.data(), data.size(), entries, &base)) { std::printf("ZIP PARSE FAILED\n"); return 1; }
  std::printf("entries: %d\n", (int)entries.size());
  int ok = 0, fail = 0;
  for (const zip::ZipEntry& e : entries) {
    if (!e.name.empty() && e.name.back() == '/') continue;
    std::string rel = zip::nativePath(e.name);          // '/' -> '\\'
    std::string outPath = std::string(argv[2]) + "/" + rel;
    size_t slash = outPath.find_last_of('\\');
    if (slash != std::string::npos && slash > 0) {
      if (!ensureDirs(outPath.substr(0, slash))) { std::printf("MKDIR FAIL %s\n", outPath.c_str()); fail++; continue; }
    }
    std::vector<zip::u8> out;
    if (!zip::extractEntry(data.data(), data.size(), e, out, base)) { std::printf("FAIL %s\n", e.name.c_str()); fail++; continue; }
    if (out.size() != e.uncompSize) { std::printf("SIZE MISMATCH %s %d vs %d\n", e.name.c_str(), (int)out.size(), (int)e.uncompSize); fail++; continue; }
    std::ofstream o(outPath, std::ios::binary);
    o.write((const char*)out.data(), (std::streamsize)out.size());
    o.close();
    if (!o) { std::printf("WRITE FAIL %s\n", outPath.c_str()); fail++; continue; }
    ok++;
  }
  std::printf("EXTRACT_OK %d failed %d\n", ok, fail);
  return fail ? 1 : 0;
}
