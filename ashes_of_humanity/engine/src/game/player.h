// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Player controller, camera and survival model.
// ============================================================================
#pragma once
#include "core/math.h"
#include "game/entities.h"
#include "game/world.h"

namespace aoh {

struct SaveData;

struct CameraState {
  Vec3 pos;
  Vec3 forward = Vec3(0, 0, -1);
  Vec3 right = Vec3(1, 0, 0);
  Vec3 up = Vec3(0, 1, 0);
  f32  fov = 75.0f;
  bool firstPerson = false;
};

class PlayerController {
public:
  void spawn(Player& p, const Vec3& pos);

  // Returns true when the player is alive and able to act.
  void update(Player& p, const World& w, f32 dt, bool acceptInput, bool uiOpen);
  void updateSurvival(Player& p, f32 dt, f32 ambientTemp, f32 radiationRate, f32 dtReal);
  void buildCamera(const Player& p, const World& w, CameraState& out, bool firstPerson,
                   f32 fovBase) const;

  // Damage entry point.  part < 0 picks the nearest body part by hit height.
  void applyDamage(Player& p, f32 amount, int part, f32& outBleed);
  void heal(Player& p, f32 amount);
  void addXp(Player& p, f32 amount);
  void respawn(Player& p, const Vec3& pos);
  void respawn(Player& p, const World& w);
  void applySave(Player& p, const SaveData& d);
  f32  carryCapacity(const Player& p) const;

private:
  f32  m_clock = 0.0f;      // seconds of simulated time
public:

  // Helpers shared with combat.
  Vec3 eyePosition(const Player& p) const;
  Vec3 forwardVector(const Player& p) const;

  f32 clock() const { return m_clock; }
};

} // namespace aoh
