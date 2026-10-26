// Round-trip test for the self-contained ZIP reader.
#include "zipreader.h"
#include <cstdio>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>

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
    std::vector<zip::u8> out;
    if (!zip::extractEntry(data.data(), data.size(), e, out, base)) { std::printf("FAIL %s\n", e.name.c_str()); fail++; continue; }
    if (out.size() != e.uncompSize) { std::printf("SIZE MISMATCH %s %d vs %d\n", e.name.c_str(), (int)out.size(), (int)e.uncompSize); fail++; continue; }
    std::string outPath = std::string(argv[2]) + "/" + e.name;
    { // create the parent directory chain
      std::string dir;
      for (size_t i = 0; i < outPath.size(); ++i) {
        dir += outPath[i];
        if (outPath[i] == '/') { std::string d = dir.substr(0, dir.size() - 1); std::string cmd = "mkdir -p '" + d + "'"; if (system(cmd.c_str()) != 0) {} }
      }
    }
    std::ofstream o(outPath, std::ios::binary);
    o.write((const char*)out.data(), (std::streamsize)out.size());
    ok++;
  }
  std::printf("EXTRACT_OK %d failed %d\n", ok, fail);
  return fail ? 1 : 0;
}
