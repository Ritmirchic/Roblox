// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Weapons, projectiles and damage resolution.
// ============================================================================
#pragma once
#include "game/context.h"
#include "game/player.h"

namespace aoh {

class CombatSystem {
public:
  void update(GameContext& ctx, f32 dt);

  // Returns true if a shot went off this frame.
  bool tryFire(GameContext& ctx, Player& p, PlayerController& pc);
  bool startReload(GameContext& ctx, Player& p);
  void damageMutant(GameContext& ctx, Mutant& m, f32 amount, const Vec3& hitPos,
                     const Vec3& dir, bool weakPoint);

  f32  spreadFor(const Player& p, const WeaponDef& w) const;
  f32  damageAtRange(const WeaponDef& w, f32 dist) const;
  int  ammoTypeFor(const Player& p) const;

  void spawnMuzzleFlash(GameContext& ctx, const Vec3& pos, const Vec3& dir);
  void spawnImpact(GameContext& ctx, const Vec3& pos, const Vec3& normal, const Vec3& color);
};

} // namespace aoh
