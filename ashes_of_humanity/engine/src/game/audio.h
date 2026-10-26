// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Procedural audio: every sound is synthesised at runtime.
// ============================================================================
#pragma once
#include "core/math.h"
#include <string>
#include <vector>

namespace aoh {

enum SoundId {
  SND_GUNSHOT_PISTOL = 0, SND_GUNSHOT_RIFLE, SND_GUNSHOT_SHOTGUN, SND_MELEE_SWING,
  SND_MELEE_HIT, SND_RELOAD, SND_FOOTSTEP, SND_JUMP, SND_LAND, SND_PICKUP,
  SND_UI_CLICK, SND_UI_HOVER, SND_PLAYER_HURT, SND_MUTANT_SCREAM, SND_MUTANT_DEATH,
  SND_BOSS_ROAR, SND_EXPLOSION, SND_HEARTBEAT, SND_BREATH, SND_RADIO, SND_DOOR,
  SND_COUNT
};

class AudioSystem {
public:
  bool init();
  void shutdown();
  void setListener(const Vec3& pos, const Vec3& forward);
  void play(SoundId id, const Vec3& pos, f32 volume = 1.0f, f32 pitch = 1.0f);
  void playUI(SoundId id, f32 volume = 1.0f);
  void setAmbience(f32 wind, f32 drone, f32 rain);
  void update(f32 dt);
  bool active() const { return m_ready; }

private:
  struct Sample { std::vector<short> data; float duration; };
  struct Voice {
    const Sample* sample = nullptr;
    Vec3 pos;
    float volume = 1.0f;
    float pitch = 1.0f;
    float cursor = 0.0f;
    float age = 0.0f;
    bool active = false;
  };

  void synthesise();
  Sample makeGunshot(int kind);
  Sample makeSwing();
  Sample makeImpact(float low);
  Sample makeClick(float pitch);
  Sample makeFootstep();
  Sample makeScream(bool boss);
  Sample makeRadio();
  Sample makeExplosion();

  std::vector<Sample> m_samples;
  std::vector<Voice> m_voices;
  Vec3 m_listener, m_forward;
  bool m_ready = false;
  float m_wind = 0.3f, m_drone = 0.2f, m_rain = 0.0f;
  float m_ambPhase = 0.0f;
};

} // namespace aoh
