#pragma once
#include "core/math.h"
#include <string>
#include <vector>

namespace aoh {

// ---------------------------------------------------------------------------
// Vertex layout used by every skinned/static mesh in the game.
//   loc 0 : position   (3 x f32)
//   loc 1 : normal     (3 x f32)
//   loc 2 : tangent    (4 x f32, xyz + handedness)
//   loc 3 : uv0        (2 x f32)
//   loc 4 : color      (4 x u8 normalised)
//   loc 5 : joints     (4 x u16)
//   loc 6 : weights    (4 x f32)
// ---------------------------------------------------------------------------
struct Vertex {
  Vec3 pos;
  Vec3 nrm;
  Vec4 tan;
  Vec2 uv;
  u8   col[4];
  u16  joints[4];
  f32  weights[4];
  Vertex() : tan(1, 0, 0, 1) { col[0] = col[1] = col[2] = col[3] = 255; weights[0] = 1.0f; }
};

struct SubMesh {
  u32 firstIndex = 0;
  u32 indexCount = 0;
  i32 material = 0;
};

struct Bone {
  std::string name;
  i32 parent = -1;
  Vec3 head;
  Vec3 tail;
  Mat4 inverseBind;    // world -> bone space at bind time
};

struct Material {
  std::string name;
  Vec4 albedo = Vec4(0.8f, 0.8f, 0.8f, 1.0f);
  f32 metallic = 0.0f;
  f32 roughness = 0.7f;
  Vec4 emissive = Vec4(0, 0, 0, 0);
  // Texture slots (index into the material library, -1 = none)
  i32 albedoTex = -1;
  i32 normalTex = -1;
  i32 ormTex = -1;     // r: ao, g: roughness, b: metallic
  i32 emissiveTex = -1;
  f32 normalStrength = 1.0f;
  u32 flags = 0;      // bit0: double sided, bit1: alpha tested, bit2: emissive only
};

enum MatFlags { MAT_DOUBLE_SIDED = 1u << 0, MAT_ALPHA_TEST = 1u << 1, MAT_UNLIT = 1u << 2, MAT_FOLIAGE = 1u << 3 };

// ---------------------------------------------------------------------------
// Mesh: CPU-side representation (also the on-disk format payload).
// ---------------------------------------------------------------------------
struct Mesh {
  std::string name;
  std::vector<Vertex> verts;
  std::vector<u32> idx;
  std::vector<SubMesh> subMeshes;
  std::vector<Material> materials;
  std::vector<Bone> bones;
  AABB bounds;
  bool skinned = false;

  void computeBounds();
  void recalcNormals();
  void buildTangents();
  // Recalculate per-vertex colours from a callback (used for vertex paint).
  void applyVertexTint(const std::function<void(const Vec3&, u8*, f32*)>& fn);
};

// ---------------------------------------------------------------------------
// Animation clip: keyframe tracks per bone channel.
// ---------------------------------------------------------------------------
struct AnimKey {
  f32 t = 0.0f;
  f32 v[4] = {0, 0, 0, 1};
};
// CH_POS uses v[0..2], CH_ROT uses v[0..3] as a quaternion (x,y,z,w),
// CH_SCALE uses v[0..2].
enum AnimChannel { CH_POS = 0, CH_ROT = 1, CH_SCALE = 2 };

struct AnimTrack {
  i32 bone = -1;
  i32 channel = 0;
  std::vector<AnimKey> keys;
  int interp = 0;   // 0 = step, 1 = linear, 2 = cubic(hermite)
};

struct AnimClip {
  std::string name;
  f32 duration = 0.0f;
  f32 fps = 30.0f;
  bool loop = true;
  std::vector<AnimTrack> tracks;
};

} // namespace aoh
