// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Combat implementation.
// ============================================================================
#include "game/combat.h"
#include "game/items.h"
#include <algorithm>
#include <cmath>

namespace aoh {

// ---------------------------------------------------------------------------
void GameContext::spawnParticles(const Vec3& pos, const Vec3& vel, int count, const Vec3& color,
                                 f32 size, f32 life) {
  if (!particles) return;
  for (int i = 0; i < count; ++i) {
    Particle p;
    p.pos = pos;
    p.vel = vel;
    p.color = color;
    p.size = size * (0.6f + 0.8f * ((float)(rand() % 1000) / 1000.0f));
    p.maxLife = life * (0.6f + 0.8f * ((float)(rand() % 1000) / 1000.0f));
    p.life = p.maxLife;
    p.active = true;
    particles->push_back(p);
    if (particles->size() > 900) particles->erase(particles->begin());
  }
}

void GameContext::addText(const Vec3& pos, const std::string& txt, const Vec3& color) {
  if (!texts) return;
  FloatingText t;
  t.pos = pos; t.text = txt; t.color = color; t.life = 1.6f; t.active = true;
  texts->push_back(t);
  if (texts->size() > 64) texts->erase(texts->begin());
}

void GameContext::makeNoise(const Vec3& pos, f32 radius) {
  noiseEvent = true;
  noiseRadius = std::max(noiseRadius, radius);
}

// ---------------------------------------------------------------------------
f32 CombatSystem::spreadFor(const Player& p, const WeaponDef& w) const {
  f32 s = p.ads ? w.spread * 0.45f : w.spread;
  if (p.state == AS_RUN) s = w.spreadMove;
  else if (p.state == AS_WALK) s = lerpf(w.spread, w.spreadMove, 0.5f);
  if (p.crouching) s *= 0.7f;
  if (p.crawling) s *= 0.55f;
  s *= (1.0f + p.stats.fatigue * 0.0022f);
  s *= (1.0f + p.recoilPitch * 6.0f);
  return s;
}

f32 CombatSystem::damageAtRange(const WeaponDef& w, f32 dist) const {
  if (dist <= w.falloffStart) return w.damage;
  if (dist >= w.falloffEnd) return w.damage * w.minDamage;
  f32 t = (dist - w.falloffStart) / std::max(0.01f, w.falloffEnd - w.falloffStart);
  return lerpf(w.damage, w.damage * w.minDamage, t);
}

int CombatSystem::ammoTypeFor(const Player& p) const {
  if (p.equip[EQ_MAIN].defId < 0 || !p.equip[EQ_MAIN].count) return -1;
  return 0;
}

// ---------------------------------------------------------------------------
void CombatSystem::spawnMuzzleFlash(GameContext& ctx, const Vec3& pos, const Vec3& dir) {
  ctx.spawnParticles(pos + dir * 0.35f, dir * 3.0f, 8, Vec3(1.0f, 0.75f, 0.35f), 0.09f, 0.09f);
  ctx.spawnParticles(pos + dir * 0.5f, dir * 1.2f, 4, Vec3(0.6f, 0.6f, 0.6f), 0.14f, 0.5f);
  ctx.makeNoise(pos, 55.0f);
}

void CombatSystem::spawnImpact(GameContext& ctx, const Vec3& pos, const Vec3& normal,
                               const Vec3& color) {
  Vec3 v(normal.x * 1.6f + (rand() % 100) / 100.0f - 0.5f,
         normal.y * 1.6f + (rand() % 100) / 100.0f - 0.5f + 1.2f,
         normal.z * 1.6f + (rand() % 100) / 100.0f - 0.5f);
  ctx.spawnParticles(pos, v, 7, color, 0.055f, 0.45f);
}

// ---------------------------------------------------------------------------
bool CombatSystem::tryFire(GameContext& ctx, Player& p, PlayerController& pc) {
  if (p.dead || p.reloading) return false;
  ItemStack& gun = p.equip[EQ_MAIN];
  if (gun.defId < 0 || gun.count <= 0) return false;
  const ItemDef* idef = ctx.items->def(gun.defId).weaponId >= 0
                            ? &ctx.items->def(gun.defId) : nullptr;
  if (!idef || idef->weaponId < 0) return false;
  const WeaponDef w = effectiveWeapon(gun, *ctx.items, *ctx.weapons);
  if (w.kind == WK_MELEE) {
    // melee swing
    if (p.swingTimer > 0.0f) return false;
    p.swingTimer = w.swingTime;
    Vec3 eye = pc.eyePosition(p);
    Vec3 fwd = pc.forwardVector(p);
    bool hit = false;
    for (Mutant& m : *ctx.mutants) {
      if (m.dead) continue;
      // melee reach is measured horizontally
      Vec3 to = m.pos - eye;
      f32 dh = length(Vec3(to.x, 0.0f, to.z));
      f32 reach = w.range + m.radius;
      if (dh > reach) continue;
      Vec3 flat = normalize(Vec3(to.x, 0.0f, to.z));
      Vec3 fwdFlat = normalize(Vec3(fwd.x, 0.0f, fwd.z));
      if (dot(flat, fwdFlat) < 0.35f) continue;
      f32 dmg = w.damage * (0.9f + 0.2f * ((rand() % 100) / 100.0f));
      bool weak = (m.boss >= 0 && dot(normalize(to), fwd) > 0.8f);
      damageMutant(ctx, m, dmg, m.pos + to * 0.5f, fwd, weak);
      hit = true;
      break;
    }
    // also hit breakable props
    if (!hit) {
      Vec3 target = eye + fwd * w.range;
      float t; Vec3 n; int bi;
      if (ctx.world->raycast(eye, fwd, w.range, t, n, bi)) {
        spawnImpact(ctx, eye + fwd * t, n, Vec3(0.55f, 0.5f, 0.45f));
        p.stamina = std::max(0.0f, p.stamina - 3.0f);
      }
    }
    ctx.makeNoise(p.pos, 8.0f);
    return true;
  }

  // ---- ranged ----------------------------------------------------------
  if (p.fireTimer > 0.0f) return false;
  if (gun.ammo <= 0) { startReload(ctx, p); return false; }
  gun.ammo--;
  p.fireTimer = 60.0f / w.rpm;

  Vec3 eye = pc.eyePosition(p);
  Vec3 fwd = pc.forwardVector(p);
  f32 spread = spreadFor(p, w);
  // recoil kick
  p.recoilVelPitch += w.recoil * 26.0f;
  p.recoilVelYaw += ((rand() % 200) / 100.0f - 1.0f) * w.recoil * 16.0f;

  Vec3 origin = eye + fwd * 0.5f;
  spawnMuzzleFlash(ctx, origin, fwd);

  for (int i = 0; i < w.pellets; ++i) {
    Vec3 dir = fwd;
    if (spread > 0.0f) {
      f32 a = (rand() % 2000) / 1000.0f - 1.0f;
      f32 b = (rand() % 2000) / 1000.0f - 1.0f;
      Vec3 right = normalize(cross(fwd, Vec3(0, 1, 0)));
      Vec3 up = cross(right, fwd);
      dir = normalize(fwd + right * a * spread + up * b * spread);
    }
    f32 bestT = w.range;
    int hitMutant = -1;
    Vec3 hitPos, hitNormal;
    bool hitSomething = false;
    // world
    float t; Vec3 n; int bi;
    if (ctx.world->raycast(origin, dir, w.range, t, n, bi)) {
      bestT = t; hitPos = origin + dir * t; hitNormal = n; hitSomething = true;
    }
    // mutants: vertical capsule from the feet to the head
    for (size_t mi = 0; mi < ctx.mutants->size(); ++mi) {
      Mutant& m = (*ctx.mutants)[mi];
      if (m.dead) continue;
      f32 r = m.radius + 0.12f;
      f32 bestLocal = 1e30f;
      f32 bestLocalT = 1e30f;
      const int SEG = 8;
      for (int si = 0; si <= SEG; ++si) {
        f32 fy = (f32)si / (f32)SEG;
        Vec3 c = m.pos + Vec3(0, m.height * fy, 0);
        Vec3 oc = c - origin;
        f32 proj = dot(oc, dir);
        if (proj < 0.0f || proj > bestT) continue;
        f32 d2 = lengthSq(oc - dir * proj);
        if (d2 > r * r) continue;
        f32 tt = proj - sqrtf(std::max(0.0f, r * r - d2));
        if (tt < 0.0f || tt > bestT) continue;
        if (tt < bestLocalT) { bestLocalT = tt; bestLocal = fy; }
      }
      if (bestLocalT > bestT) continue;
      bestT = bestLocalT;
      hitMutant = (int)mi;
      hitPos = origin + dir * bestT;
      hitNormal = -dir;
      hitSomething = true;
    }
    if (hitSomething) {
      if (hitMutant >= 0) {
        Mutant& m = (*ctx.mutants)[hitMutant];
        f32 dmg = damageAtRange(w, bestT);
        bool weak = (m.boss >= 0) && (dot(normalize(m.pos + Vec3(0, m.height * 0.55f, 0) - hitPos),
                                          -dir) > 0.55f);
        damageMutant(ctx, m, dmg, hitPos, dir, weak);
        spawnImpact(ctx, hitPos, hitNormal, Vec3(0.45f, 0.05f, 0.05f));
      } else {
        spawnImpact(ctx, hitPos, hitNormal, Vec3(0.6f, 0.55f, 0.5f));
        Decal d; d.pos = hitPos; d.normal = hitNormal; d.size = 0.09f + 0.05f * (rand() % 100) / 100.0f;
        d.life = 22.0f; d.kind = 0;
        if (ctx.decals) ctx.decals->push_back(d);
      }
    }
    // tracer
    ctx.spawnParticles(origin + dir * 0.6f, dir * 30.0f, 1, Vec3(1.0f, 0.85f, 0.45f), 0.03f, 0.06f);
  }
  return true;
}

// ---------------------------------------------------------------------------
bool CombatSystem::startReload(GameContext& ctx, Player& p) {
  ItemStack& gun = p.equip[EQ_MAIN];
  if (gun.defId < 0 || !gun.count) return false;
  const ItemDef& idef = ctx.items->def(gun.defId);
  if (idef.weaponId < 0) return false;
  const WeaponDef& w = ctx.weapons->def(idef.weaponId);
  if (w.magSize <= 0) return false;
  if (gun.ammo >= w.magSize) return false;
  // find matching ammo in the pack
  int ammoDef = -1;
  for (const ItemDef& d : ctx.items->defs()) {
    if (d.type == IT_AMMO && d.ammoType == w.ammoType) { ammoDef = d.id; break; }
  }
  if (ammoDef < 0) return false;
  if (inventoryCount(p, ammoDef) <= 0) return false;
  p.reloading = true;
  p.reloadTimer = w.reloadTime;
  p.reloadWeapon = w.id;
  return true;
}

// ---------------------------------------------------------------------------
void CombatSystem::damageMutant(GameContext& ctx, Mutant& m, f32 amount, const Vec3& hitPos,
                                 const Vec3& dir, bool weakPoint) {
  if (m.dead) return;
  f32 dmg = amount;
  if (weakPoint) dmg *= 2.4f;
  m.hp -= dmg;
  m.stagger = std::max(m.stagger, weakPoint ? 0.55f : 0.22f);
  m.alert = 1.0f;
  m.hasTarget = true;
  m.lastSeen = ctx.player ? ctx.player->pos : m.lastSeen;
  Vec3 col = weakPoint ? Vec3(1.0f, 0.55f, 0.1f) : Vec3(1.0f, 0.85f, 0.3f);
  char buf[64];
  snprintf(buf, sizeof(buf), "%d", (int)dmg);
  ctx.addText(m.pos + Vec3(0, m.height * 0.9f, 0), buf, col);
  ctx.spawnParticles(hitPos, -dir * 2.0f + Vec3(0, 1.0f, 0), 8, Vec3(0.5f, 0.06f, 0.06f), 0.05f, 0.5f);
  if (m.hp <= 0.0f) {
    m.hp = 0.0f;
    m.dead = true;
    m.state = AS_DEAD;
    m.anim = 5;   // death clip
    m.animTime = 0.0f;
    ctx.makeNoise(m.pos, 25.0f);
  }
}

// ---------------------------------------------------------------------------
void CombatSystem::update(GameContext& ctx, f32 dt) {
  // ---- player reload ----------------------------------------------------
  Player* p = ctx.player;
  if (p) {
    if (p->reloading) {
      p->reloadTimer -= dt;
      if (p->reloadTimer <= 0.0f) {
        ItemStack& gun = p->equip[EQ_MAIN];
        if (gun.defId >= 0) {
          const ItemDef& idef = ctx.items->def(gun.defId);
          if (idef.weaponId >= 0) {
            const WeaponDef& w = ctx.weapons->def(idef.weaponId);
            int ammoDef = -1;
            for (const ItemDef& d : ctx.items->defs())
              if (d.type == IT_AMMO && d.ammoType == w.ammoType) { ammoDef = d.id; break; }
            if (ammoDef >= 0) {
              int need = w.magSize - gun.ammo;
              int have = inventoryCount(*p, ammoDef);
              int take = std::min(need, have);
              if (take > 0) {
                inventoryRemove(*p, ammoDef, take);
                gun.ammo += take;
              }
            }
          }
        }
        p->reloading = false;
      }
    }
    if (p->fireTimer > 0.0f) p->fireTimer = std::max(0.0f, p->fireTimer - dt);
    if (p->swingTimer > 0.0f) p->swingTimer = std::max(0.0f, p->swingTimer - dt);
  }

  // ---- projectiles ------------------------------------------------------
  if (ctx.projectiles) {
    for (Projectile& pr : *ctx.projectiles) {
      if (!pr.active) continue;
      pr.life -= dt;
      if (pr.life <= 0.0f) { pr.active = false; continue; }
      Vec3 step = pr.vel * dt;
      float t; Vec3 n; int bi;
      if (ctx.world->raycast(pr.pos, normalize(step), length(step) + 0.05f, t, n, bi)) {
        pr.pos = pr.pos + normalize(step) * t;
        spawnImpact(ctx, pr.pos, n, Vec3(0.5f, 0.45f, 0.4f));
        pr.active = false;
        continue;
      }
      pr.pos += step;
    }
  }

  // ---- particles --------------------------------------------------------
  if (ctx.particles) {
    for (Particle& pt : *ctx.particles) {
      if (!pt.active) continue;
      pt.life -= dt;
      if (pt.life <= 0.0f) { pt.active = false; continue; }
      pt.vel.y -= 6.0f * dt;
      pt.pos += pt.vel * dt;
      if (ctx.world) {
        float gy = ctx.world->heightAt(pt.pos.x, pt.pos.z);
        if (pt.pos.y < gy) { pt.pos.y = gy; pt.vel = Vec3(0, 0, 0); pt.life = std::min(pt.life, 0.25f); }
      }
    }
  }
  if (ctx.decals) {
    for (Decal& d : *ctx.decals) d.life -= dt;
    // compact
    if (ctx.decals->size() > 300) ctx.decals->erase(ctx.decals->begin());
  }
  if (ctx.texts) {
    for (FloatingText& t : *ctx.texts) { t.life -= dt; t.pos.y += dt * 0.8f; }
    if (ctx.texts->size() > 64) ctx.texts->erase(ctx.texts->begin());
  }
}

} // namespace aoh
