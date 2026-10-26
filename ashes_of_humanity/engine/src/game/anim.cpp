// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Animation sampling implementation.
// ============================================================================
#include "game/anim.h"
#include "core/util.h"
#include <algorithm>
#include <cmath>

namespace aoh {

bool AnimLibrary::loadFromFile(const std::string& path, const std::string& species) {
  std::vector<u8> data;
  bool ok = false;
  data = readFile(path, &ok);
  if (!ok || data.empty()) {
    LOGE("anim: cannot read %s", path.c_str());
    return false;
  }
  std::vector<AnimClip> list;
  if (!deserializeAnim(data.data(), data.size(), list)) {
    LOGE("anim: cannot parse %s", path.c_str());
    return false;
  }
  std::vector<int> idx;
  for (size_t i = 0; i < list.size(); ++i) {
    idx.push_back((int)i);
    clipIndexByName[species + "/" + list[i].name] = (int)i;
  }
  clips[species] = list;
  return true;
}

int AnimLibrary::clipIndex(const std::string& species, const std::string& clip) const {
  auto it = clipIndexByName.find(species + "/" + clip);
  return it == clipIndexByName.end() ? -1 : it->second;
}

// ---------------------------------------------------------------------------
static Quat slerpQuat(const Quat& a, const Quat& b, f32 t) {
  f32 d = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
  Quat e = b;
  if (d < 0.0f) { e.x = -b.x; e.y = -b.y; e.z = -b.z; e.w = -b.w; d = -d; }
  if (d > 0.9995f) {
    Quat r(a.x + (e.x - a.x) * t, a.y + (e.y - a.y) * t, a.z + (e.z - a.z) * t,
           a.w + (e.w - a.w) * t);
    f32 l = sqrtf(r.x * r.x + r.y * r.y + r.z * r.z + r.w * r.w);
    if (l > 1e-6f) { r.x /= l; r.y /= l; r.z /= l; r.w /= l; }
    return r;
  }
  f32 theta = acosf(clampf(d, -1.0f, 1.0f));
  f32 s = sinf(theta);
  f32 sa = sinf((1.0f - t) * theta) / s;
  f32 sb = sinf(t * theta) / s;
  return Quat(a.x * sa + e.x * sb, a.y * sa + e.y * sb, a.z * sa + e.z * sb,
              a.w * sa + e.w * sb);
}

void Animator::sample(const std::vector<Bone>& bones, int clipIndex, f32 time,
                      std::vector<Mat4>& out) const {
  out.assign(bones.size(), Mat4::identityMatrix());
  if (!m_lib) return;
  auto it = m_lib->clips.find(m_species);
  if (it == m_lib->clips.end()) return;
  const std::vector<AnimClip>& list = it->second;
  if (clipIndex < 0 || clipIndex >= (int)list.size()) return;
  const AnimClip& clip = list[clipIndex];

  f32 t = clip.duration > 0.0f ? fmodf(time, clip.duration) : 0.0f;
  if (t < 0.0f) t += clip.duration;

  // The exporter writes tracks indexed by the bone index in the clip file.
  // We need the mapping bone index -> track; the clip stores absolute indices.
  for (size_t bi = 0; bi < bones.size(); ++bi) {
    const AnimTrack* pt = nullptr;
    const AnimTrack* rt = nullptr;
    for (const AnimTrack& tr : clip.tracks) {
      if (tr.bone != (i32)bi) continue;
      if (tr.channel == CH_POS) pt = &tr;
      else if (tr.channel == CH_ROT) rt = &tr;
    }
    Vec3 pos = bones[bi].head;
    Quat rot = Quat::identity();
    if (pt && !pt->keys.empty()) {
      // find the surrounding keys
      size_t k = 0;
      while (k + 1 < pt->keys.size() && pt->keys[k + 1].t <= t) ++k;
      const AnimKey& k0 = pt->keys[k];
      const AnimKey& k1 = pt->keys[(k + 1 < pt->keys.size()) ? k + 1 : k];
      f32 span = k1.t - k0.t;
      f32 f = span > 1e-5f ? clampf((t - k0.t) / span, 0.0f, 1.0f) : 0.0f;
      pos = Vec3(lerpf(k0.v[0], k1.v[0], f), lerpf(k0.v[1], k1.v[1], f),
                 lerpf(k0.v[2], k1.v[2], f));
    }
    if (rt && !rt->keys.empty()) {
      size_t k = 0;
      while (k + 1 < rt->keys.size() && rt->keys[k + 1].t <= t) ++k;
      const AnimKey& k0 = rt->keys[k];
      const AnimKey& k1 = rt->keys[(k + 1 < rt->keys.size()) ? k + 1 : k];
      f32 span = k1.t - k0.t;
      f32 f = span > 1e-5f ? clampf((t - k0.t) / span, 0.0f, 1.0f) : 0.0f;
      Quat a(k0.v[0], k0.v[1], k0.v[2], k0.v[3]);
      Quat b(k1.v[0], k1.v[1], k1.v[2], k1.v[3]);
      rot = slerpQuat(a, b, f);
    }
    // Build the bone frame: translation + rotation (columns = rotation basis)
    Mat4 r;
    r.at(0, 0) = 1 - 2 * (rot.y * rot.y + rot.z * rot.z);
    r.at(0, 1) = 2 * (rot.x * rot.y - rot.z * rot.w);
    r.at(0, 2) = 2 * (rot.x * rot.z + rot.y * rot.w);
    r.at(1, 0) = 2 * (rot.x * rot.y + rot.z * rot.w);
    r.at(1, 1) = 1 - 2 * (rot.x * rot.x + rot.z * rot.z);
    r.at(1, 2) = 2 * (rot.y * rot.z - rot.x * rot.w);
    r.at(2, 0) = 2 * (rot.x * rot.z - rot.y * rot.w);
    r.at(2, 1) = 2 * (rot.y * rot.z + rot.x * rot.w);
    r.at(2, 2) = 1 - 2 * (rot.x * rot.x + rot.y * rot.y);
    r.at(0, 3) = pos.x; r.at(1, 3) = pos.y; r.at(2, 3) = pos.z;
    out[bi] = r * bones[bi].inverseBind;
  }
}

} // namespace aoh
