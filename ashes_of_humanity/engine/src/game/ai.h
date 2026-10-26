// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Mutant and boss artificial intelligence.
// ============================================================================
#pragma once
#include "game/anim.h"
#include "game/context.h"
#include "game/combat.h"

namespace aoh {

struct SpeciesDef {
  int id = 0;
  std::string name;
  std::string mesh;
  std::string animFile;
  f32 hp = 100.0f;
  f32 speed = 2.2f;
  f32 damage = 12.0f;
  f32 attackRange = 1.9f;
  f32 attackCooldown = 1.4f;
  f32 radius = 0.42f;
  f32 height = 1.8f;
  f32 sight = 34.0f;
  f32 hearing = 18.0f;
  f32 packRadius = 12.0f;
  int  aggression = 1;         // 0 skittish, 3 relentless
  bool packHunter = false;
  bool ranged = false;
  bool summons = false;
  bool explodes = false;
  bool flees = false;
  int  clipIdle = 0, clipWalk = 1, clipRun = 2, clipAttack = 3;
  int  clipHit = 4, clipDeath = 5, clipScream = 6, clipLunge = 7;
};

class AISystem {
public:
  void build(const AnimLibrary* lib);
  const SpeciesDef& species(int i) const { return m_species[i]; }
  int  speciesCount() const { return (int)m_species.size(); }
  const std::vector<SpeciesDef>& all() const { return m_species; }

  void spawn(GameContext& ctx, int species, const Vec3& pos, int bossIndex = -1);
  void update(GameContext& ctx, f32 dt);
  void spawnPatrol(GameContext& ctx, int regionId, u32 seed, int count);

  // Helpers used by the game layer for quest triggers.
  int  aliveCount() const;
  void alertAll(GameContext& ctx, const Vec3& pos, f32 radius);

private:
  void updateOne(GameContext& ctx, Mutant& m, f32 dt);
  bool canSee(const GameContext& ctx, const Mutant& m, const Vec3& target) const;
  void moveToward(GameContext& ctx, Mutant& m, const Vec3& target, f32 speed, f32 dt);
  void attackPlayer(GameContext& ctx, Mutant& m);
  void updateBoss(GameContext& ctx, Mutant& m, f32 dt);
  void setAnim(Mutant& m, int clip);

  std::vector<SpeciesDef> m_species;
  const AnimLibrary* m_lib = nullptr;
};

} // namespace aoh
