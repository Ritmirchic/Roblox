#pragma once
#include "core/math.h"
#include "gfx/gfx_types.h"
#include <map>
#include <string>
#include <vector>

namespace aoh {

// ---------------------------------------------------------------------------
// Binary helpers
// ---------------------------------------------------------------------------
class BinWriter {
public:
  std::vector<u8> buf;
  void u8v(u8 v)   { buf.push_back(v); }
  void u16v(u16 v) { buf.push_back((u8)(v & 0xFF)); buf.push_back((u8)(v >> 8)); }
  void u32v(u32 v) { for (int i = 0; i < 4; ++i) buf.push_back((u8)((v >> (i * 8)) & 0xFF)); }
  void i32v(i32 v) { u32v((u32)v); }
  void u64v(u64 v) { for (int i = 0; i < 8; ++i) buf.push_back((u8)((v >> (i * 8)) & 0xFF)); }
  void f32v(f32 v)  { u32 t; memcpy(&t, &v, 4); u32v(t); }
  void vec3(const Vec3& v) { f32v(v.x); f32v(v.y); f32v(v.z); }
  void vec4(const Vec4& v) { f32v(v.x); f32v(v.y); f32v(v.z); f32v(v.w); }
  void str(const std::string& s) { u32v((u32)s.size()); buf.insert(buf.end(), s.begin(), s.end()); }
  void bytes(const void* p, size_t n) { const u8* b = (const u8*)p; buf.insert(buf.end(), b, b + n); }
  void raw(const std::vector<u8>& v) { buf.insert(buf.end(), v.begin(), v.end()); }
};

class BinReader {
public:
  const u8* p = nullptr;
  size_t n = 0, off = 0;
  bool ok = true;
  BinReader() {}
  BinReader(const u8* data, size_t size) : p(data), n(size) {}
  u8   u8v()  { if (off + 1 > n) { ok = false; return 0; } return p[off++]; }
  u16  u16v() { if (off + 2 > n) { ok = false; return 0; } u16 v; memcpy(&v, p + off, 2); off += 2; return v; }
  u32  u32v() { if (off + 4 > n) { ok = false; return 0; } u32 v; memcpy(&v, p + off, 4); off += 4; return v; }
  i32  i32v() { return (i32)u32v(); }
  u64  u64v() { if (off + 8 > n) { ok = false; return 0; } u64 v; memcpy(&v, p + off, 8); off += 8; return v; }
  f32  f32v() { if (off + 4 > n) { ok = false; return 0; } f32 v; memcpy(&v, p + off, 4); off += 4; return v; }
  Vec3 vec3() { f32 x = f32v(), y = f32v(), z = f32v(); return Vec3(x, y, z); }
  Vec4 vec4() { f32 x = f32v(), y = f32v(), z = f32v(), w = f32v(); return Vec4(x, y, z, w); }
  std::string str() { u32 l = u32v(); if (off + l > n) { ok = false; return ""; } std::string s((const char*)p + off, l); off += l; return s; }
  void bytes(void* dst, size_t cnt) { if (off + cnt > n) { ok = false; memset(dst, 0, cnt); return; } memcpy(dst, p + off, cnt); off += cnt; }
};

// ---------------------------------------------------------------------------
// Container format:  magic | version | flags | sectionCount | sections
// Each section: tag(u32) size(u64) payload
// ---------------------------------------------------------------------------
enum AssetSection {
  SEC_VERTICES = 0x56525458,  // 'VRTX'
  SEC_INDICES  = 0x494E4458,  // 'INDX'
  SEC_SUBMESH  = 0x534D4553,  // 'SMES'
  SEC_MATERIAL = 0x4D41544C,  // 'MATL'
  SEC_BONES    = 0x424F4E45,  // 'BONE'
  SEC_ANIMCLIP = 0x41434C50,  // 'ACLP'
  SEC_ANIMTRK  = 0x5452434B,  // 'TRCK'
  SEC_MESHINFO = 0x4D534846,  // 'MSHF'
};

struct AssetContainer {
  std::vector<u8> bytes;
  bool write(u32 magic, u16 version, const std::vector<std::pair<u32, std::vector<u8>>>& sections);
  bool read(const std::vector<u8>& data, u32 expectedMagic, u16& versionOut,
            std::map<u32, std::vector<u8>>& outSections);
};

// ---------------------------------------------------------------------------
// Texture data
// ---------------------------------------------------------------------------
struct TextureData {
  int width = 0, height = 0, mips = 0;
  int format = 0;      // 0 = RGBA8, 1 = RGB8
  std::vector<u8> data;      // tightly packed, all mip levels
  size_t levelSize(int level) const {
    int w = std::max(1, width >> level), h = std::max(1, height >> level);
    return (size_t)w * h * (format == 0 ? 4 : 3);
  }
  const u8* levelPtr(int level) const {
    size_t off = 0;
    for (int i = 0; i < level; ++i) off += levelSize(i);
    return data.data() + off;
  }
};

// ---------------------------------------------------------------------------
// Libraries
// ---------------------------------------------------------------------------
class AssetManager {
public:
  std::map<std::string, Mesh> meshes;
  std::map<std::string, AnimClip> clips;
  std::map<std::string, TextureData> textures;
  std::map<std::string, Material> materials;

  bool loadMeshFromFile(const std::string& path);
  bool saveMeshToFile(const std::string& path, const Mesh& m) const;
  bool loadAnimFromFile(const std::string& path);
  bool saveAnimToFile(const std::string& path, const std::vector<AnimClip>& clips) const;
  bool loadTextureFromFile(const std::string& path);
  bool saveTextureToFile(const std::string& path, const TextureData& t) const;

  const Mesh* mesh(const std::string& n) const {
    auto it = meshes.find(n);
    return it == meshes.end() ? nullptr : &it->second;
  }
  const AnimClip* clip(const std::string& n) const {
    auto it = clips.find(n);
    return it == clips.end() ? nullptr : &it->second;
  }
};

// Serialisation of geometry (used by the Blender export pipeline).
bool serializeMesh(const Mesh& m, std::vector<u8>& out);
bool deserializeMesh(const u8* data, size_t size, Mesh& out);
bool serializeAnim(const std::vector<AnimClip>& clips, std::vector<u8>& out);
bool deserializeAnim(const u8* data, size_t size, std::vector<AnimClip>& out);
bool serializeTexture(const TextureData& t, std::vector<u8>& out);
bool deserializeTexture(const u8* data, size_t size, TextureData& out);

} // namespace aoh
