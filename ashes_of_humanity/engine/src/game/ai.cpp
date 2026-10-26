// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Mutant and boss AI implementation.
// ============================================================================
#include "game/ai.h"
#include "game/player.h"
#include <algorithm>
#include <cmath>

namespace aoh {

// ---------------------------------------------------------------------------
void AISystem::build(const AnimLibrary* lib) {
  m_lib = lib;
  m_species.clear();
  auto add = [&](const char* name, const char* mesh, const char* animFile, f32 hp, f32 speed,
                 f32 dmg, f32 range, f32 radius, f32 height, f32 sight, f32 hearing,
                 int aggression, bool pack, bool ranged, bool summons, bool explodes,
                 bool flees) {
    SpeciesDef s;
    s.id = (int)m_species.size();
    s.name = name; s.mesh = mesh; s.animFile = animFile;
    s.hp = hp; s.speed = speed; s.damage = dmg; s.attackRange = range;
    s.attackCooldown = 1.3f + (1.0f - aggression) * 0.4f;
    s.radius = radius; s.height = height; s.sight = sight; s.hearing = hearing;
    s.aggression = aggression; s.packHunter = pack; s.ranged = ranged;
    s.summons = summons; s.explodes = explodes; s.flees = flees;
    s.packRadius = 14.0f + aggression * 8.0f;
    if (lib) {
      s.clipIdle = lib->clipIndex(animFile, "idle");
      s.clipWalk = lib->clipIndex(animFile, "walk");
      s.clipRun = lib->clipIndex(animFile, "run");
      s.clipAttack = lib->clipIndex(animFile, "attack");
      s.clipHit = lib->clipIndex(animFile, "hit");
      s.clipDeath = lib->clipIndex(animFile, "death");
      s.clipScream = lib->clipIndex(animFile, "scream");
      s.clipLunge = lib->clipIndex(animFile, "lunge");
    }
    m_species.push_back(s);
  };

  // --- mutants -----------------------------------------------------------
  add("Hollow", "char_hollow", "hollow", 110, 2.6f, 14, 1.9f, 0.40f, 1.92f, 40, 22, 2, true, false, false, false, false);
  add("Crawler", "char_crawler", "crawler", 70, 3.6f, 10, 1.5f, 0.36f, 1.05f, 32, 26, 3, true, false, false, false, false);
  add("Watcher", "char_watcher", "watcher", 150, 2.1f, 16, 2.1f, 0.42f, 2.35f, 52, 30, 1, false, true, false, false, true);
  add("Screamer", "char_screamer", "screamer", 95, 2.9f, 12, 2.0f, 0.40f, 1.98f, 44, 40, 2, true, false, true, false, false);
  add("Brute", "char_brute", "brute", 320, 1.9f, 34, 2.4f, 0.60f, 2.55f, 30, 18, 2, false, false, false, false, false);
  add("Mimic", "char_mimic", "mimic", 130, 2.4f, 18, 2.0f, 0.38f, 1.84f, 36, 20, 3, true, false, false, false, false);
  add("Burrower", "char_burrower", "burrower", 100, 3.9f, 15, 1.6f, 0.42f, 1.30f, 26, 34, 3, false, false, false, false, false);
  add("Stalker", "char_stalker", "stalker", 140, 3.2f, 22, 2.1f, 0.38f, 2.12f, 46, 26, 3, true, false, false, false, false);
  add("Contaminated", "char_contaminated", "contaminated", 190, 2.2f, 20, 2.0f, 0.55f, 2.05f, 28, 20, 1, false, false, false, true, false);
  add("Pale One", "char_pale_one", "pale_one", 260, 2.8f, 26, 2.2f, 0.42f, 2.28f, 50, 28, 3, true, true, false, false, false);

  // --- bosses ------------------------------------------------------------
  add("The Hollow King", "char_boss_hollow_king", "boss_hollow_king", 2400, 2.4f, 32,
      2.6f, 0.62f, 2.75f, 55, 45, 3, true, false, true, false, false);
  add("Iron Abomination", "char_boss_iron_abomination", "boss_iron_abomination", 3200, 2.0f, 44,
      2.8f, 0.78f, 3.05f, 45, 30, 2, false, false, false, false, false);
  add("The Forest Matriarch", "char_boss_forest_matriarch", "boss_forest_matriarch", 2800, 2.2f, 36,
      2.7f, 0.66f, 2.95f, 52, 40, 2, true, false, true, false, false);
  add("Contaminated Titan", "char_boss_contaminated_titan", "boss_contaminated_titan", 3800, 1.8f, 48,
      2.9f, 0.85f, 3.35f, 40, 34, 1, false, false, false, true, false);
  add("The Pale Commander", "char_boss_pale_commander", "boss_pale_commander", 3000, 2.6f, 40,
      2.7f, 0.58f, 2.90f, 58, 42, 3, true, true, false, false, false);
  add("Last Signal", "char_boss_last_signal", "boss_last_signal", 4600, 2.6f, 52,
      3.0f, 0.62f, 3.10f, 70, 60, 3, true, true, true, false, false);
}

// ---------------------------------------------------------------------------
void AISystem::spawn(GameContext& ctx, int species, const Vec3& pos, int bossIndex) {
  if (species < 0 || species >= (int)m_species.size()) return;
  const SpeciesDef& s = m_species[species];
  Mutant m;
  m.species = species;
  m.pos = pos;
  m.vel = Vec3(0, 0, 0);
  m.home = pos;
  m.maxHp = s.hp; m.hp = s.hp;
  m.speed = s.speed; m.damage = s.damage;
  m.attackRange = s.attackRange; m.attackCooldown = s.attackCooldown;
  m.radius = s.radius; m.height = s.height;
  m.state = AS_IDLE;
  m.anim = s.clipIdle;
  m.animTime = (float)(rand() % 1000) / 1000.0f * 2.0f;
  m.wanderTimer = 1.0f + (float)(rand() % 500) / 100.0f;
  m.boss = bossIndex;
  m.pack = s.packHunter ? 1.0f : 0.0f;
  ctx.mutants->push_back(m);
}

// ---------------------------------------------------------------------------
int AISystem::aliveCount() const { return 0; }

void AISystem::alertAll(GameContext& ctx, const Vec3& pos, f32 radius) {
  for (Mutant& m : *ctx.mutants) {
    if (m.dead) continue;
    if (dist2D(m.pos, pos) <= radius) {
      m.alert = 1.0f;
      m.hasTarget = true;
      m.lastSeen = pos;
    }
  }
}

// ---------------------------------------------------------------------------
bool AISystem::canSee(const GameContext& ctx, const Mutant& m, const Vec3& target) const {
  if (!ctx.world || !ctx.player) return false;
  Vec3 eye = m.pos + Vec3(0, m.height * 0.85f, 0);
  Vec3 to = target - eye;
  f32 d = length(to);
  if (d > m_species[m.species].sight) return false;
  Vec3 fwd(sinf(m.yaw), 0, cosf(m.yaw));
  Vec3 flat = normalize(Vec3(to.x, 0, to.z));
  if (d > 3.0f && dot(flat, fwd) < -0.25f) return false;   // roughly 105 degree cone
  float t; Vec3 n; int bi;
  if (ctx.world->raycast(eye, normalize(to), d, t, n, bi)) {
    if (t < d - 0.4f) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
void AISystem::moveToward(GameContext& ctx, Mutant& m, const Vec3& target, f32 speed, f32 dt) {
  if (!ctx.world) return;
  Vec3 dir = target - m.pos;
  dir.y = 0.0f;
  if (lengthSq(dir) < 1e-6f) return;
  dir = normalize(dir);

  // obstacle avoidance: try rotated directions
  const f32 offsets[5] = { 0.0f, 0.55f, -0.55f, 1.15f, -1.15f };
  Vec3 best = dir;
  for (int i = 0; i < 5; ++i) {
    f32 a = offsets[i];
    f32 s = sinf(a), c = cosf(a);
    Vec3 d2(dir.x * c - dir.z * s, 0, dir.x * s + dir.z * c);
    Vec3 probe = m.pos + d2 * 1.4f + Vec3(0, 0.9f, 0);
    float t; Vec3 n; int bi;
    bool blocked = ctx.world->raycast(m.pos + Vec3(0, 0.9f, 0), d2, 1.5f, t, n, bi);
    if (!blocked) { best = d2; break; }
    if (i == 4) best = dir;
  }

  Vec3 desired = best * speed;
  m.vel.x = moveTowards(m.vel.x, desired.x, 9.0f * dt);
  m.vel.z = moveTowards(m.vel.z, desired.z, 9.0f * dt);
  m.pos += m.vel * dt;

  // ground snap
  float gy = ctx.world->heightAt(m.pos.x, m.pos.z);
  m.pos.y = lerpf(m.pos.y, gy, saturate(dt * 12.0f));

  // facing
  Vec3 v = m.vel;
  if (lengthSq(v) > 0.02f) {
    f32 want = atan2f(v.x, v.z);
    f32 diff = want - m.yaw;
    while (diff > PI) diff -= TAU;
    while (diff < -PI) diff += TAU;
    m.yaw += diff * saturate(dt * 7.0f);
  }

  // separate from other mutants
  for (Mutant& o : *ctx.mutants) {
    if (&o == &m || o.dead) continue;
    Vec3 d = m.pos - o.pos;
    f32 dist = lengthSq(Vec3(d.x, 0, d.z));
    f32 rsum = m.radius + o.radius;
    if (dist < rsum * rsum && dist > 1e-5f) {
      f32 l = sqrtf(dist);
      m.pos += Vec3(d.x / l, 0, d.z / l) * (rsum - l) * 0.5f;
    }
  }
}

// ---------------------------------------------------------------------------
void AISystem::setAnim(Mutant& m, int clip) {
  if (clip < 0) return;
  if (m.anim != clip) { m.anim = clip; m.animTime = 0.0f; }
}

void AISystem::attackPlayer(GameContext& ctx, Mutant& m) {
  Player* p = ctx.player;
  if (!p) return;
  const SpeciesDef& s = m_species[m.species];
  Vec3 eye = m.pos + Vec3(0, m.height * 0.7f, 0);
  Vec3 to = p->pos - eye;
  f32 d = length(to);
  if (d > s.attackRange + 0.6f) return;
  Vec3 flat = normalize(Vec3(to.x, 0, to.z));
  Vec3 fwd(sinf(m.yaw), 0, cosf(m.yaw));
  if (dot(flat, fwd) < 0.1f) return;

  PlayerController pc;
  f32 bleed = 0.0f;
  f32 dmg = s.damage * (0.85f + 0.3f * ((float)(rand() % 100) / 100.0f));
  pc.applyDamage(*p, dmg, BP_TORSO, bleed);
  ctx.addText(p->pos + Vec3(0, 1.9f, 0), "-" + std::to_string((int)dmg), Vec3(1, 0.25f, 0.2f));
  ctx.spawnParticles(p->pos + Vec3(0, 1.0f, 0), Vec3(0, 1.0f, 0), 6, Vec3(0.5f, 0.05f, 0.05f), 0.05f, 0.4f);
  ctx.makeNoise(m.pos, 18.0f);
}

// ---------------------------------------------------------------------------
void AISystem::updateOne(GameContext& ctx, Mutant& m, f32 dt) {
  const SpeciesDef& s = m_species[m.species];
  Player* p = ctx.player;
  m.stateTime += dt;
  m.animTime += dt;
  if (m.stagger > 0.0f) m.stagger = std::max(0.0f, m.stagger - dt);

  if (m.dead) {
    setAnim(m, s.clipDeath);
    return;
  }

  bool playerVisible = false;
  f32 distToPlayer = 1e9f;
  if (p && !p->dead) {
    distToPlayer = dist2D(m.pos, p->pos);
    playerVisible = canSee(ctx, m, p->pos + Vec3(0, 1.2f, 0));
  }

  // hearing
  if (ctx.noiseEvent && ctx.noiseRadius > 0.0f && p) {
    if (distToPlayer < s.hearing + ctx.noiseRadius * 0.35f) {
      m.alert = std::max(m.alert, 0.75f);
      m.lastSeen = p->pos;
      m.hasTarget = true;
      if (m.state == AS_IDLE || m.state == AS_WALK) { m.state = AS_ALERT; m.stateTime = 0.0f; }
    }
  }
  ctx.noiseEvent = false;
  ctx.noiseRadius = 0.0f;

  if (playerVisible) {
    m.alert = std::min(1.0f, m.alert + dt * 2.2f);
    m.lastSeen = p->pos;
    m.hasTarget = true;
    m.loseTimer = 0.0f;
  } else {
    m.loseTimer += dt;
    if (m.loseTimer > 6.0f) m.alert = std::max(0.0f, m.alert - dt * 0.25f);
  }

  // pack behaviour: alerted mutants call others
  if (m.alert > 0.6f && s.packHunter) {
    for (Mutant& o : *ctx.mutants) {
      if (&o == &m || o.dead) continue;
      if (dist2D(o.pos, m.pos) < s.packRadius && o.alert < 0.4f) {
        o.alert = std::max(o.alert, 0.5f);
        o.hasTarget = true;
        o.lastSeen = m.lastSeen;
      }
    }
  }

  // state machine ---------------------------------------------------------
  switch (m.state) {
    case AS_IDLE: {
      setAnim(m, s.clipIdle);
      m.vel.x = moveTowards(m.vel.x, 0.0f, 8.0f * dt);
      m.vel.z = moveTowards(m.vel.z, 0.0f, 8.0f * dt);
      m.pos += m.vel * dt;
      if (ctx.world) m.pos.y = lerpf(m.pos.y, ctx.world->heightAt(m.pos.x, m.pos.z), saturate(dt * 10.0f));
      m.wanderTimer -= dt;
      // look around
      m.yaw += sinf(ctx.time * 0.7f + m.animTime * 0.3f) * 0.004f;
      if (m.wanderTimer <= 0.0f || m.alert > 0.3f) {
        m.wanderTimer = 4.0f + (float)(rand() % 500) / 100.0f;
        if (m.alert > 0.3f) { m.state = AS_ALERT; m.stateTime = 0.0f; setAnim(m, s.clipScream); }
        else { m.state = AS_WALK; m.stateTime = 0.0f; }
      }
      break;
    }
    case AS_WALK: {
      setAnim(m, s.clipWalk);
      m.wanderTimer -= dt;
      if (m.wanderTimer <= 0.0f) {
        m.state = AS_IDLE; m.stateTime = 0.0f; m.wanderTimer = 2.0f + (float)(rand() % 400) / 100.0f;
        break;
      }
      Vec3 target = m.home + Vec3(sinf(m.wanderTimer * 0.7f + m.animTime) * 12.0f, 0,
                                   cosf(m.wanderTimer * 0.5f + m.animTime * 0.7f) * 12.0f);
      moveToward(ctx, m, target, s.speed * 0.45f, dt);
      if (m.alert > 0.35f) { m.state = AS_ALERT; m.stateTime = 0.0f; setAnim(m, s.clipScream); }
      break;
    }
    case AS_ALERT: {
      // pause and roar, then pursue
      setAnim(m, s.clipScream);
      m.vel.x = moveTowards(m.vel.x, 0.0f, 10.0f * dt);
      m.vel.z = moveTowards(m.vel.z, 0.0f, 10.0f * dt);
      if (p) {
        f32 want = atan2f(p->pos.x - m.pos.x, p->pos.z - m.pos.z);
        f32 diff = want - m.yaw;
        while (diff > PI) diff -= TAU;
        while (diff < -PI) diff += TAU;
        m.yaw += diff * saturate(dt * 5.0f);
      }
      if (m.stateTime > 0.7f) {
        m.state = AS_RUN; m.stateTime = 0.0f;
        if (s.summons) {
          // the screamer calls more of them
          for (int i = 0; i < 2; ++i) {
            f32 a = (float)(rand() % 628) / 100.0f;
            Vec3 pos = m.pos + Vec3(cosf(a) * 6.0f, 0, sinf(a) * 6.0f);
            if (ctx.world) pos.y = ctx.world->heightAt(pos.x, pos.z);
            spawn(ctx, 0, pos);
          }
          ctx.makeNoise(m.pos, 45.0f);
        }
      }
      break;
    }
    case AS_RUN: {
      setAnim(m, s.clipRun);
      if (!m.hasTarget) { m.state = AS_IDLE; m.stateTime = 0.0f; break; }
      f32 speed = s.speed * (1.0f + m.alert * 0.25f);
      moveToward(ctx, m, m.lastSeen, speed, dt);
      if (p && !p->dead && distToPlayer < s.attackRange) {
        m.state = AS_ATTACK; m.stateTime = 0.0f; m.attackTimer = 0.0f;
      } else if (m.loseTimer > 7.0f) {
        m.state = AS_SEARCH; m.stateTime = 0.0f;
      }
      break;
    }
    case AS_SEARCH: {
      setAnim(m, s.clipWalk);
      moveToward(ctx, m, m.lastSeen, s.speed * 0.6f, dt);
      if (m.stateTime > 9.0f || (p && playerVisible)) {
        m.state = playerVisible ? AS_RUN : AS_IDLE;
        m.stateTime = 0.0f;
      }
      break;
    }
    case AS_ATTACK: {
      // wind-up telegraph then strike
      m.attackTimer += dt;
      setAnim(m, m.attackTimer < 0.45f ? s.clipLunge : s.clipAttack);
      m.vel.x = moveTowards(m.vel.x, 0.0f, 12.0f * dt);
      m.vel.z = moveTowards(m.vel.z, 0.0f, 12.0f * dt);
      if (m.attackTimer >= 0.45f && m.attackTimer - dt < 0.45f) {
        attackPlayer(ctx, m);
      }
      if (m.attackTimer > 0.95f) {
        m.attackTimer = 0.0f;
        m.state = AS_RUN; m.stateTime = 0.0f;
      }
      break;
    }
    default:
      m.state = AS_IDLE;
      break;
  }

  // flee behaviour for wounded skittish species
  if (s.flees && m.hp < m.maxHp * 0.25f && p) {
    Vec3 away = normalize(Vec3(m.pos.x - p->pos.x, 0, m.pos.z - p->pos.z));
    moveToward(ctx, m, m.pos + away * 12.0f, s.speed * 1.2f, dt);
  }
}

// ---------------------------------------------------------------------------
void AISystem::updateBoss(GameContext& ctx, Mutant& m, f32 dt) {
  Player* p = ctx.player;
  const SpeciesDef& s = m_species[m.species];
  if (!p || p->dead) {
    m.vel.x = moveTowards(m.vel.x, 0, 8 * dt);
    m.vel.z = moveTowards(m.vel.z, 0, 8 * dt);
    m.pos += m.vel * dt;
    if (ctx.world) m.pos.y = lerpf(m.pos.y, ctx.world->heightAt(m.pos.x, m.pos.z), saturate(dt * 10));
    setAnim(m, s.clipIdle);
    return;
  }

  f32 hpFrac = m.hp / m.maxHp;
  int newPhase = 0;
  if (hpFrac < 0.25f) newPhase = 2;
  else if (hpFrac < 0.60f) newPhase = 1;
  if (newPhase != m.phase) {
    m.phase = newPhase;
    m.state = AS_ALERT;
    m.stateTime = 0.0f;
    setAnim(m, s.clipScream);
    ctx.makeNoise(m.pos, 60.0f);
    ctx.addText(m.pos + Vec3(0, m.height, 0), s.name + " changes stance", Vec3(1, 0.5f, 0.2f));
  }

  f32 dist = dist2D(m.pos, p->pos);
  bool visible = canSee(ctx, m, p->pos + Vec3(0, 1.2f, 0));

  // phase specific patterns
  m.telegraph += dt;
  if (m.state == AS_ALERT) {
    setAnim(m, s.clipScream);
    m.vel.x = moveTowards(m.vel.x, 0, 10 * dt);
    m.vel.z = moveTowards(m.vel.z, 0, 10 * dt);
    if (m.stateTime > 1.1f) {
      m.state = AS_RUN; m.stateTime = 0.0f;
      // phase 2+ summons adds
      if (m.phase >= 1 && s.summons) {
        for (int i = 0; i < (m.phase + 1); ++i) {
          f32 a = (float)(rand() % 628) / 100.0f;
          Vec3 pos = m.pos + Vec3(cosf(a) * 8.0f, 0, sinf(a) * 8.0f);
          if (ctx.world) pos.y = ctx.world->heightAt(pos.x, pos.z);
          spawn(ctx, 0, pos);
        }
      }
    }
    return;
  }

  if (dist > s.attackRange) {
    m.state = AS_RUN;
    setAnim(m, s.clipRun);
    f32 sp = s.speed * (1.0f + m.phase * 0.18f);
    moveToward(ctx, m, p->pos, sp, dt);
  } else {
    m.state = AS_ATTACK;
    m.attackTimer += dt;
    setAnim(m, m.attackTimer < 0.55f ? s.clipLunge : s.clipAttack);
    m.vel.x = moveTowards(m.vel.x, 0, 14 * dt);
    m.vel.z = moveTowards(m.vel.z, 0, 14 * dt);
    if (m.attackTimer >= 0.55f && m.attackTimer - dt < 0.55f) {
      attackPlayer(ctx, m);
      // phase 3: area shockwave
      if (m.phase >= 2) {
        ctx.spawnParticles(m.pos + Vec3(0, 0.3f, 0), Vec3(0, 2.0f, 0), 26, Vec3(0.7f, 0.6f, 0.4f), 0.14f, 0.9f);
        if (dist < 6.0f) {
          PlayerController pc; f32 b = 0.0f;
          pc.applyDamage(*p, 14.0f, BP_LEG_L, b);
        }
        ctx.makeNoise(m.pos, 40.0f);
      }
    }
    if (m.attackTimer > 1.25f) { m.attackTimer = 0.0f; m.state = AS_RUN; }
  }

  // weak point exposure: the boss opens up after a heavy attack
  m.weakPointExposed = std::max(0.0f, m.weakPointExposed - dt);
  if (m.state == AS_ATTACK && m.attackTimer < 0.2f) m.weakPointExposed = 1.0f;
}

// ---------------------------------------------------------------------------
void AISystem::update(GameContext& ctx, f32 dt) {
  if (!ctx.mutants) return;
  // Attack tokens: only a couple of mutants may strike at the same time, the
  // rest of the pack circles.  This keeps a swarm from chain-killing.
  int attacking = 0;
  for (const Mutant& m : *ctx.mutants)
    if (!m.dead && m.state == AS_ATTACK) attacking++;
  for (Mutant& m : *ctx.mutants) {
    if (!m.dead && m.state == AS_ATTACK && attacking > 2) {
      m.state = AS_RUN;
      m.attackTimer = 0.0f;
      attacking--;
    }
  }
  for (Mutant& m : *ctx.mutants) {
    if (m.boss >= 0) updateBoss(ctx, m, dt);
    else updateOne(ctx, m, dt);
    // burning damage
    if (m.burning) {
      m.burnTime -= dt;
      m.hp -= 6.0f * dt;
      if (m.burnTime <= 0.0f) m.burning = false;
      if (m.hp <= 0.0f && !m.dead) {
        m.dead = true; m.hp = 0.0f; m.state = AS_DEAD;
      }
    }
  }
  // cull long dead corpses
  if (ctx.mutants->size() > 220) {
    for (size_t i = 0; i < ctx.mutants->size();) {
      if ((*ctx.mutants)[i].dead) ctx.mutants->erase(ctx.mutants->begin() + i);
      else ++i;
    }
  }
}

// ---------------------------------------------------------------------------
void AISystem::spawnPatrol(GameContext& ctx, int regionId, u32 seed, int count) {
  if (!ctx.world || regionId < 0 || regionId >= (int)ctx.world->regions().size()) return;
  const RegionDef& r = ctx.world->region(regionId);
  int total = (int)m_species.size() - 6;   // mutants only
  for (int i = 0; i < count; ++i) {
    f32 a = (float)(rand() % 6283) / 1000.0f;
    f32 rad = 60.0f + (float)(rand() % 3000) / 10.0f;
    Vec3 pos = r.center + Vec3(cosf(a) * rad, 0, sinf(a) * rad);
    pos.y = ctx.world->heightAt(pos.x, pos.z);
    // pick a species weighted by the region hostility
    int sp = rand() % total;
    if (r.id == REGION_FOREST && (rand() % 100) < 45) sp = 0;
    if (r.id == REGION_INDUSTRIAL && (rand() % 100) < 40) sp = 4;
    if (r.id == REGION_MILITARY && (rand() % 100) < 40) sp = 9;
    if (r.id == REGION_WASTELAND && (rand() % 100) < 45) sp = 8;
    if (r.id == REGION_CITY && (rand() % 100) < 40) sp = 5;
    spawn(ctx, sp, pos);
  }
}

} // namespace aoh
