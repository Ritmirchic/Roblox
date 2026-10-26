// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Shared gameplay context.
// ============================================================================
#pragma once
#include "game/entities.h"
#include "game/world.h"
#include <functional>

namespace aoh {

struct GameContext {
  World* world = nullptr;
  ItemDatabase* items = nullptr;
  WeaponDatabase* weapons = nullptr;
  Player* player = nullptr;
  std::vector<Mutant>* mutants = nullptr;
  std::vector<Projectile>* projectiles = nullptr;
  std::vector<Particle>* particles = nullptr;
  std::vector<Decal>* decals = nullptr;
  std::vector<FloatingText>* texts = nullptr;

  f32  time = 0.0f;
  f32  timeOfDay = 8.0f;      // hours
  f32  ambientTemp = 18.0f;
  f32  radiationRate = 0.0f;
  bool noiseEvent = false;    // set when the player makes noise this frame
  f32  noiseRadius = 0.0f;

  void spawnParticles(const Vec3& pos, const Vec3& vel, int count, const Vec3& color,
                      f32 size, f32 life);
  void addText(const Vec3& pos, const std::string& txt, const Vec3& color);
  void makeNoise(const Vec3& pos, f32 radius);
};

} // namespace aoh
