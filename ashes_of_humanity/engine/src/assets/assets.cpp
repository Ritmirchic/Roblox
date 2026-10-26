#include "assets/assets.h"
#include "core/util.h"

namespace aoh {

// ---------------------------------------------------------------------------
void Mesh::computeBounds() {
  bounds.reset();
  for (const auto& v : verts) bounds.add(v.pos);
}
void Mesh::recalcNormals() {
  for (auto& v : verts) v.nrm = Vec3(0, 0, 0);
  for (size_t i = 0; i + 2 < idx.size(); i += 3) {
    const Vertex& a = verts[idx[i]];
    const Vertex& b = verts[idx[i + 1]];
    const Vertex& c = verts[idx[i + 2]];
    Vec3 fn = cross(b.pos - a.pos, c.pos - a.pos);
    verts[idx[i]].nrm += fn;
    verts[idx[i + 1]].nrm += fn;
    verts[idx[i + 2]].nrm += fn;
  }
  for (auto& v : verts) {
    f32 l = length(v.nrm);
    v.nrm = l > 1e-8f ? v.nrm / l : Vec3(0, 1, 0);
  }
}
void Mesh::buildTangents() {
  for (auto& v : verts) { v.tan = Vec4(1, 0, 0, 1); v.tan.w = 1.0f; }
  std::vector<Vec3> tanAcc(verts.size(), Vec3(0, 0, 0));
  std::vector<Vec3> bitAcc(verts.size(), Vec3(0, 0, 0));
  for (size_t i = 0; i + 2 < idx.size(); i += 3) {
    u32 i0 = idx[i], i1 = idx[i + 1], i2 = idx[i + 2];
    const Vertex& a = verts[i0]; const Vertex& b = verts[i1]; const Vertex& c = verts[i2];
    Vec3 e1 = b.pos - a.pos, e2 = c.pos - a.pos;
    Vec2 d1 = b.uv - a.uv, d2 = c.uv - a.uv;
    f32 det = d1.x * d2.y - d2.x * d1.y;
    if (fabsf(det) < 1e-9f) continue;
    f32 r = 1.0f / det;
    Vec3 t = (e1 * d2.y - e2 * d1.y) * r;
    Vec3 bt = (e2 * d1.x - e1 * d2.x) * r;
    tanAcc[i0] += t; tanAcc[i1] += t; tanAcc[i2] += t;
    bitAcc[i0] += bt; bitAcc[i1] += bt; bitAcc[i2] += bt;
  }
  for (size_t i = 0; i < verts.size(); ++i) {
    Vec3 t = tanAcc[i];
    Vec3 n = verts[i].nrm;
    if (lengthSq(t) < 1e-12f) {
      // Fallback: pick any perpendicular axis.
      Vec3 up = fabsf(n.y) < 0.99f ? Vec3(0, 1, 0) : Vec3(1, 0, 0);
      t = cross(up, n);
    }
    t = normalize(t - n * dot(n, t));
    f32 w = dot(cross(n, t), bitAcc[i]) < 0.0f ? -1.0f : 1.0f;
    verts[i].tan = Vec4(t.x, t.y, t.z, w);
  }
}
void Mesh::applyVertexTint(const std::function<void(const Vec3&, u8*, f32*)>& fn) {
  for (auto& v : verts) {
    f32 mask = 0.0f;
    fn(v.pos, v.col, &mask);
  }
}

// ---------------------------------------------------------------------------
bool AssetContainer::write(u32 magic, u16 version, const std::vector<std::pair<u32, std::vector<u8>>>& sections) {
  bytes.clear();
  BinWriter w;
  w.u32v(magic);
  w.u16v(version);
  w.u16v(0);
  w.u32v((u32)sections.size());
  for (const auto& s : sections) {
    w.u32v(s.first);
    w.u64v((u64)s.second.size());
    w.raw(s.second);
  }
  bytes = std::move(w.buf);
  return true;
}
bool AssetContainer::read(const std::vector<u8>& data, u32 expectedMagic, u16& versionOut,
                          std::map<u32, std::vector<u8>>& outSections) {
  outSections.clear();
  if (data.size() < 12) return false;
  BinReader r(data.data(), data.size());
  u32 magic = r.u32v();
  versionOut = r.u16v();
  r.u16v();
  u32 count = r.u32v();
  if (magic != expectedMagic) {
    LOGE("asset: bad magic %08x expected %08x", magic, expectedMagic);
    return false;
  }
  for (u32 i = 0; i < count; ++i) {
    u32 tag = r.u32v();
    u64 size = r.u64v();
    if (!r.ok || r.off + size > r.n) { LOGE("asset: truncated section"); return false; }
    std::vector<u8> sec(r.p + r.off, r.p + r.off + size);
    r.off += size;
    outSections[tag] = std::move(sec);
  }
  return r.ok;
}

// ---------------------------------------------------------------------------
bool serializeMesh(const Mesh& m, std::vector<u8>& out) {
  std::vector<std::pair<u32, std::vector<u8>>> sections;

  { BinWriter w;
    w.u32v((u32)m.verts.size());
    for (const auto& v : m.verts) {
      w.vec3(v.pos); w.vec3(v.nrm); w.vec4(v.tan); w.f32v(v.uv.x); w.f32v(v.uv.y);
      for (int i = 0; i < 4; ++i) w.u8v(v.col[i]);
      for (int i = 0; i < 4; ++i) w.u16v(v.joints[i]);
      for (int i = 0; i < 4; ++i) w.f32v(v.weights[i]);
    }
    sections.push_back({SEC_VERTICES, w.buf});
  }
  { BinWriter w;
    w.u32v((u32)m.idx.size());
    for (u32 i : m.idx) w.u32v(i);
    sections.push_back({SEC_INDICES, w.buf});
  }
  { BinWriter w;
    w.u32v((u32)m.subMeshes.size());
    for (const auto& s : m.subMeshes) { w.u32v(s.firstIndex); w.u32v(s.indexCount); w.i32v(s.material); }
    sections.push_back({SEC_SUBMESH, w.buf});
  }
  { BinWriter w;
    w.u32v((u32)m.materials.size());
    for (const auto& mat : m.materials) {
      w.str(mat.name);
      w.vec4(mat.albedo); w.f32v(mat.metallic); w.f32v(mat.roughness); w.vec4(mat.emissive);
      w.i32v(mat.albedoTex); w.i32v(mat.normalTex); w.i32v(mat.ormTex); w.i32v(mat.emissiveTex);
      w.f32v(mat.normalStrength); w.u32v(mat.flags);
    }
    sections.push_back({SEC_MATERIAL, w.buf});
  }
  { BinWriter w;
    w.u32v((u32)m.bones.size());
    for (const auto& b : m.bones) {
      w.str(b.name); w.i32v(b.parent); w.vec3(b.head); w.vec3(b.tail);
      for (int i = 0; i < 16; ++i) w.f32v(b.inverseBind.m[i]);
    }
    sections.push_back({SEC_BONES, w.buf});
  }
  { BinWriter w;
    w.str(m.name);
    w.u8v(m.skinned ? 1 : 0);
    w.vec3(m.bounds.lo); w.vec3(m.bounds.hi);
    sections.push_back({SEC_MESHINFO, w.buf});
  }
  AssetContainer c;
  c.write(0x314D4641, 1, sections);
  out = c.bytes;
  return true;
}

bool deserializeMesh(const u8* data, size_t size, Mesh& out) {
  std::map<u32, std::vector<u8>> sec;
  u16 ver = 0;
  AssetContainer c;
  if (!c.read(std::vector<u8>(data, data + size), 0x314D4641, ver, sec)) return false;

  auto itV = sec.find(SEC_VERTICES);
  auto itI = sec.find(SEC_INDICES);
  if (itV == sec.end() || itI == sec.end()) return false;
  {
    BinReader r(itV->second.data(), itV->second.size());
    u32 nv = r.u32v();
    out.verts.resize(nv);
    for (u32 i = 0; i < nv && r.ok; ++i) {
      Vertex& v = out.verts[i];
      v.pos = r.vec3(); v.nrm = r.vec3(); v.tan = r.vec4();
      v.uv.x = r.f32v(); v.uv.y = r.f32v();
      for (int k = 0; k < 4; ++k) v.col[k] = r.u8v();
      for (int k = 0; k < 4; ++k) v.joints[k] = r.u16v();
      for (int k = 0; k < 4; ++k) v.weights[k] = r.f32v();
    }
  }
  {
    BinReader r(itI->second.data(), itI->second.size());
    u32 ni = r.u32v();
    out.idx.resize(ni);
    for (u32 i = 0; i < ni && r.ok; ++i) out.idx[i] = r.u32v();
  }
  {
    auto it = sec.find(SEC_SUBMESH);
    if (it != sec.end()) {
      BinReader r(it->second.data(), it->second.size());
      u32 n = r.u32v();
      out.subMeshes.resize(n);
      for (u32 i = 0; i < n && r.ok; ++i) {
        out.subMeshes[i].firstIndex = r.u32v();
        out.subMeshes[i].indexCount = r.u32v();
        out.subMeshes[i].material = r.i32v();
      }
    }
  }
  {
    auto it = sec.find(SEC_MATERIAL);
    if (it != sec.end()) {
      BinReader r(it->second.data(), it->second.size());
      u32 n = r.u32v();
      out.materials.resize(n);
      for (u32 i = 0; i < n && r.ok; ++i) {
        Material& m = out.materials[i];
        m.name = r.str();
        m.albedo = r.vec4(); m.metallic = r.f32v(); m.roughness = r.f32v(); m.emissive = r.vec4();
        m.albedoTex = r.i32v(); m.normalTex = r.i32v(); m.ormTex = r.i32v(); m.emissiveTex = r.i32v();
        m.normalStrength = r.f32v(); m.flags = r.u32v();
      }
    }
  }
  {
    auto it = sec.find(SEC_BONES);
    if (it != sec.end()) {
      BinReader r(it->second.data(), it->second.size());
      u32 n = r.u32v();
      out.bones.resize(n);
      for (u32 i = 0; i < n && r.ok; ++i) {
        Bone& b = out.bones[i];
        b.name = r.str(); b.parent = r.i32v(); b.head = r.vec3(); b.tail = r.vec3();
        for (int k = 0; k < 16; ++k) b.inverseBind.m[k] = r.f32v();
      }
      out.skinned = !out.bones.empty();
    }
  }
  {
    auto it = sec.find(SEC_MESHINFO);
    if (it != sec.end()) {
      BinReader r(it->second.data(), it->second.size());
      out.name = r.str();
      out.skinned = r.u8v() != 0;
      out.bounds.lo = r.vec3(); out.bounds.hi = r.vec3();
    }
  }
  if (!out.skinned && !out.bones.empty()) out.skinned = true;
  if (!out.skinned) out.computeBounds();
  return true;
}

bool serializeAnim(const std::vector<AnimClip>& clips, std::vector<u8>& out) {
  std::vector<std::pair<u32, std::vector<u8>>> sections;
  { BinWriter w;
    w.u32v((u32)clips.size());
    for (const auto& c : clips) {
      w.str(c.name); w.f32v(c.duration); w.f32v(c.fps); w.u8v(c.loop ? 1 : 0);
      w.u32v((u32)c.tracks.size());
      for (const auto& t : c.tracks) {
        w.i32v(t.bone); w.i32v(t.channel); w.i32v(t.interp);
        w.u32v((u32)t.keys.size());
        for (const auto& k : t.keys) { w.f32v(k.t); w.f32v(k.v[0]); w.f32v(k.v[1]); w.f32v(k.v[2]); w.f32v(k.v[3]); }
      }
    }
    sections.push_back({SEC_ANIMCLIP, w.buf});
  }
  AssetContainer c;
  c.write(0x31464141, 1, sections);
  out = c.bytes;
  return true;
}

bool deserializeAnim(const u8* data, size_t size, std::vector<AnimClip>& out) {
  std::map<u32, std::vector<u8>> sec;
  u16 ver = 0;
  AssetContainer c;
  if (!c.read(std::vector<u8>(data, data + size), 0x31464141, ver, sec)) return false;
  auto it = sec.find(SEC_ANIMCLIP);
  if (it == sec.end()) return false;
  BinReader r(it->second.data(), it->second.size());
  u32 n = r.u32v();
  out.resize(n);
  for (u32 i = 0; i < n && r.ok; ++i) {
    AnimClip& c = out[i];
    c.name = r.str(); c.duration = r.f32v(); c.fps = r.f32v(); c.loop = r.u8v() != 0;
    u32 nt = r.u32v();
    c.tracks.resize(nt);
    for (u32 j = 0; j < nt && r.ok; ++j) {
      AnimTrack& t = c.tracks[j];
      t.bone = r.i32v(); t.channel = r.i32v(); t.interp = r.i32v();
      u32 nk = r.u32v();
      t.keys.resize(nk);
      for (u32 k = 0; k < nk && r.ok; ++k) {
        t.keys[k].t = r.f32v();
        for (int q = 0; q < 4; ++q) t.keys[k].v[q] = r.f32v();
      }
    }
  }
  return true;
}

bool serializeTexture(const TextureData& t, std::vector<u8>& out) {
  BinWriter w;
  w.u32v(0x31465441);       // 'AFT1'
  w.u16v(1);
  w.u16v((u16)t.format);
  w.u32v((u32)t.width);
  w.u32v((u32)t.height);
  w.u32v((u32)t.mips);
  w.u64v((u64)t.data.size());
  w.raw(t.data);
  out = std::move(w.buf);
  return true;
}

bool deserializeTexture(const u8* data, size_t size, TextureData& out) {
  if (size < 24) return false;
  BinReader r(data, size);
  u32 magic = r.u32v();
  if (magic != 0x31465441) return false;
  r.u16v();
  out.format = (int)r.u16v();
  out.width = (int)r.u32v();
  out.height = (int)r.u32v();
  out.mips = (int)r.u32v();
  u64 bytes = r.u64v();
  if (!r.ok || r.off + bytes > r.n) return false;
  out.data.assign(r.p + r.off, r.p + r.off + bytes);
  return true;
}

// ---------------------------------------------------------------------------
bool AssetManager::loadMeshFromFile(const std::string& path) {
  bool ok = false;
  std::vector<u8> d = readFile(path, &ok);
  if (!ok) return false;
  Mesh m;
  if (!deserializeMesh(d.data(), d.size(), m)) return false;
  meshes[m.name] = m;
  return true;
}
bool AssetManager::saveMeshToFile(const std::string& path, const Mesh& m) const {
  std::vector<u8> d;
  serializeMesh(m, d);
  return writeFile(path, d.data(), d.size());
}
bool AssetManager::loadAnimFromFile(const std::string& path) {
  bool ok = false;
  std::vector<u8> d = readFile(path, &ok);
  if (!ok) return false;
  std::vector<AnimClip> clips;
  if (!deserializeAnim(d.data(), d.size(), clips)) return false;
  for (auto& c : clips) this->clips[c.name] = c;
  return true;
}
bool AssetManager::saveAnimToFile(const std::string& path, const std::vector<AnimClip>& clips) const {
  std::vector<u8> d;
  serializeAnim(clips, d);
  return writeFile(path, d.data(), d.size());
}
bool AssetManager::loadTextureFromFile(const std::string& path) {
  bool ok = false;
  std::vector<u8> d = readFile(path, &ok);
  if (!ok) return false;
  TextureData t;
  if (!deserializeTexture(d.data(), d.size(), t)) return false;
  std::string name = path;
  size_t slash = name.find_last_of("/\\");
  if (slash != std::string::npos) name = name.substr(slash + 1);
  size_t dot = name.find_last_of('.');
  if (dot != std::string::npos) name = name.substr(0, dot);
  textures[name] = t;
  return true;
}
bool AssetManager::saveTextureToFile(const std::string& path, const TextureData& t) const {
  std::vector<u8> d;
  serializeTexture(t, d);
  return writeFile(path, d.data(), d.size());
}

} // namespace aoh
