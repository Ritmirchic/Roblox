// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Player controller implementation.
// ============================================================================
#include "game/player.h"
#include "game/save.h"
#include "platform/window.h"
#include <algorithm>
#include <cmath>

namespace aoh {

// ---------------------------------------------------------------------------
void BodyState::reset(f32 total) {
  for (int i = 0; i < BP_COUNT; ++i) {
    maxHp[i] = total * 0.2f;
    hp[i] = maxHp[i];
    bleed[i] = 0.0f;
    broken[i] = false;
    infected[i] = false;
  }
}
f32 BodyState::totalHp() const {
  f32 s = 0;
  for (int i = 0; i < BP_COUNT; ++i) s += hp[i];
  return s;
}
f32 BodyState::totalBleed() const {
  f32 s = 0;
  for (int i = 0; i < BP_COUNT; ++i) s += bleed[i];
  return s;
}

// ---------------------------------------------------------------------------
void PlayerController::spawn(Player& p, const Vec3& pos) {
  p.pos = pos;
  p.vel = Vec3(0, 0, 0);
  p.state = AS_IDLE;
  p.grounded = true;
  p.dead = false;
  p.stats.dead = false;
  p.body.reset(p.stats.maxHealth);
  p.stamina = p.maxStamina;
}

f32 PlayerController::carryCapacity(const Player& p) const {
  return 22.0f + p.attributes[AT_STRENGTH] * 1.6f + p.skillRank[SK_SURVIVAL] * 2.5f;
}

Vec3 PlayerController::eyePosition(const Player& p) const {
  f32 h = p.crawling ? p.crawlHeight : (p.crouching ? p.crouchHeight : p.height);
  return Vec3(p.pos.x, p.pos.y + h - 0.16f, p.pos.z);
}

Vec3 PlayerController::forwardVector(const Player& p) const {
  f32 cp = cosf(p.pitch), sp = sinf(p.pitch);
  f32 cy = cosf(p.yaw), sy = sinf(p.yaw);
  // yaw 0 looks towards -Z
  return normalize(Vec3(sy * cp, sp, -cy * cp));
}

// ---------------------------------------------------------------------------
void PlayerController::update(Player& p, const World& w, f32 dt, bool acceptInput, bool uiOpen) {
  m_clock += dt;
  if (p.dead) {
    p.deadTimer += dt;
    p.vel = Vec3(0, 0, 0);
    return;
  }

  // ---- look ------------------------------------------------------------
  if (acceptInput && !uiOpen) {
    f32 dx = Input::mouseDeltaX() * p.mouseSensitivity;
    f32 dy = Input::mouseDeltaY() * p.mouseSensitivity;
    p.yaw += dx;
    p.pitch = clampf(p.pitch - dy, -1.45f, 1.35f);
  }

  // ---- input -----------------------------------------------------------
  f32 inX = 0.0f, inZ = 0.0f;
  bool wantSprint = false, wantCrouch = false, wantCrawl = false, wantJump = false;
  if (acceptInput && !uiOpen) {
    if (Input::keyDown(KEY_W)) inZ += 1.0f;
    if (Input::keyDown(KEY_S)) inZ -= 1.0f;
    if (Input::keyDown(KEY_A)) inX -= 1.0f;
    if (Input::keyDown(KEY_D)) inX += 1.0f;
    wantSprint = Input::keyDown(KEY_LSHIFT);
    wantCrouch = Input::keyDown(KEY_LCTRL);
    wantCrawl = Input::keyDown(KEY_C);
    wantJump = Input::keyPressed(KEY_SPACE);
  }

  // ---- environment -----------------------------------------------------
  f32 groundH = w.heightAt(p.pos.x, p.pos.z);
  float depth = w.waterLevel() - groundH;
  p.waterDepth = depth;
  p.inWater = depth > 0.9f;
  p.swimming = p.inWater && depth > 1.6f;

  // ---- stance ----------------------------------------------------------
  if (p.swimming) {
    p.crouching = false; p.crawling = false;
  } else {
    if (wantCrawl) { p.crawling = true; p.crouching = true; }
    else if (wantCrouch) { p.crawling = false; p.crouching = true; }
    else if (!p.vaulting) { p.crouching = false; p.crawling = false; }
  }

  // ---- desired velocity -------------------------------------------------
  f32 cy = cosf(p.yaw), sy = sinf(p.yaw);
  Vec3 wish = Vec3(sy * inZ + cy * inX, 0.0f, -cy * inZ + sy * inX);
  if (lengthSq(wish) > 1e-6f) wish = normalize(wish);

  f32 speed = p.walkSpeed;
  bool moving = lengthSq(wish) > 1e-6f;

  p.sprinting = false;
  if (wantSprint && moving && p.stamina > 1.0f && !p.crouching && !p.crawling && !p.swimming) {
    p.sprinting = true;
    speed = p.runSpeed + p.attributes[AT_AGILITY] * 0.06f;
  }
  if (p.crawling) speed = p.crawlSpeed;
  else if (p.crouching) speed = p.crouchSpeed;
  if (p.swimming) speed = p.swimSpeed;

  // stamina
  if (p.sprinting) {
    p.stamina = std::max(0.0f, p.stamina - p.staminaDrain * dt);
  } else if (p.swimming) {
    p.stamina = std::max(0.0f, p.stamina - p.staminaDrain * 0.45f * dt);
  } else {
    f32 regen = p.staminaRegen * (p.crouching ? 1.6f : 1.0f);
    if (p.stats.fatigue > 70.0f) regen *= 0.6f;
    p.stamina = std::min(p.maxStamina, p.stamina + regen * dt);
  }

  // ---- vaulting --------------------------------------------------------
  if (p.vaulting) {
    p.vaultTimer += dt;
    f32 k = saturate(p.vaultTimer / 0.55f);
    p.pos = p.vaultStart + (p.vaultEnd - p.vaultStart) * k;
    p.pos.y = lerpf(p.vaultStart.y, p.vaultEnd.y, k) + sinf(k * PI) * 0.25f;
    p.vel = Vec3(0, 0, 0);
    if (k >= 1.0f) { p.vaulting = false; p.grounded = true; }
    p.state = AS_VAULT;
    return;
  }

  // vault detection: a low obstacle ahead while sprinting
  if (acceptInput && !uiOpen && p.sprinting && moving && p.grounded) {
    Vec3 ahead = p.pos + wish * 0.85f;
    float h0 = w.supportHeight(p.pos.x, p.pos.z, p.pos.y + 0.6f);
    float h1 = w.supportHeight(ahead.x, ahead.z, p.pos.y + 1.4f);
    if (h1 > h0 + 0.35f && h1 - h0 < 1.35f) {
      p.vaulting = true;
      p.vaultTimer = 0.0f;
      p.vaultStart = p.pos;
      p.vaultEnd = Vec3(ahead.x + wish.x * 0.55f, h1, ahead.z + wish.z * 0.55f);
      p.stamina = std::max(0.0f, p.stamina - 8.0f);
      p.state = AS_VAULT;
      return;
    }
  }

  // ---- climbing --------------------------------------------------------
  if (acceptInput && !uiOpen && Input::keyDown(KEY_E) && p.grounded) {
    // look for a ledge 1.4 - 2.4 m high in front
    Vec3 ahead = p.pos + wish * 0.7f;
    float h = w.supportHeight(ahead.x, ahead.z, p.pos.y + 2.6f);
    if (h > p.pos.y + 1.2f && h < p.pos.y + 2.6f && moving) {
      p.climbing = true;
    }
  }
  if (p.climbing) {
    p.vel = Vec3(0, 0, 0);
    p.pos.y += p.climbSpeed * dt;
    p.state = AS_CLIMB;
    if (!Input::keyDown(KEY_E) || acceptInput == false) p.climbing = false;
    // top out
    float h = w.supportHeight(p.pos.x, p.pos.z, p.pos.y + 0.5f);
    if (h <= p.pos.y + 0.1f) { p.climbing = false; }
    return;
  }

  // ---- integrate -------------------------------------------------------
  f32 accel = p.grounded ? 14.0f : 3.0f;
  Vec3 targetVel = wish * speed;
  p.vel.x = moveTowards(p.vel.x, targetVel.x, accel * dt);
  p.vel.z = moveTowards(p.vel.z, targetVel.z, accel * dt);

  if (p.swimming) {
    p.vel.y = 0.0f;
    // buoyancy keeps the head at the surface
    float targetY = w.waterLevel() - 1.1f;
    p.vel.y = (targetY - p.pos.y) * 2.0f;
  } else if (p.grounded) {
    if (wantJump && p.stamina > 12.0f && !p.crawling) {
      p.vel.y = p.jumpSpeed + p.attributes[AT_AGILITY] * 0.05f;
      p.grounded = false;
      p.stamina = std::max(0.0f, p.stamina - 10.0f);
      if (p.crouching) p.crouching = false;
    } else {
      p.vel.y = -2.0f;   // stick to the ground
    }
  } else {
    p.vel.y -= 18.0f * dt;
  }

  Vec3 before = p.pos;
  w.resolveCapsule(p.pos, p.vel, p.radius,
                    p.crawling ? p.crawlHeight : (p.crouching ? p.crouchHeight : p.height), dt);

  // grounded check
  float gy = w.supportHeight(p.pos.x, p.pos.z, p.pos.y + 0.35f);
  if (p.pos.y <= gy + 0.06f && p.vel.y <= 0.0f) {
    p.grounded = true;
    p.pos.y = gy;
    p.vel.y = 0.0f;
  } else {
    p.grounded = false;
  }

  // ---- footsteps / bob --------------------------------------------------
  Vec3 moved = p.pos - before;
  p.footstepDist += length(moved);
  f32 stride = p.sprinting ? 2.1f : (p.crouching ? 1.2f : 1.6f);
  if (p.grounded && !p.swimming && p.footstepDist > stride) p.footstepDist = 0.0f;
  if (moving && p.grounded) p.bobPhase += dt * (p.sprinting ? 11.0f : 7.0f);

  // ---- state -----------------------------------------------------------
  if (p.swimming) p.state = AS_SWIM;
  else if (p.climbing) p.state = AS_CLIMB;
  else if (!p.grounded) p.state = AS_JUMP;
  else if (p.crawling) p.state = AS_CRAWL;
  else if (p.crouching) p.state = AS_CROUCH;
  else if (p.sprinting && moving) p.state = AS_RUN;
  else if (moving) p.state = AS_WALK;
  else p.state = AS_IDLE;

  // recoil recovery
  p.recoilPitch = moveTowards(p.recoilPitch, 0.0f, p.recoilVelPitch * dt);
  p.recoilYaw = moveTowards(p.recoilYaw, 0.0f, p.recoilVelYaw * dt);
  p.recoilVelPitch *= (1.0f - 6.0f * dt);
  p.recoilVelYaw *= (1.0f - 6.0f * dt);
}

// ---------------------------------------------------------------------------
void PlayerController::updateSurvival(Player& p, f32 dt, f32 ambientTemp, f32 radiationRate,
                                      f32 dtReal) {
  SurvivalStats& s = p.stats;
  if (s.dead) return;

  // hunger and thirst
  f32 activity = (p.sprinting ? 2.2f : (p.state == AS_WALK || p.state == AS_RUN ? 1.0f : 0.6f));
  s.hunger = std::max(0.0f, s.hunger - dtReal * 0.085f * activity);
  s.thirst = std::max(0.0f, s.thirst - dtReal * 0.125f * activity);

  // fatigue
  if (s.hunger <= 0.0f || s.thirst <= 0.0f) s.fatigue = std::min(100.0f, s.fatigue + dtReal * 0.6f);
  else s.fatigue = std::max(0.0f, s.fatigue - dtReal * 0.25f);

  // ---- core body temperature -------------------------------------------
  // 37 C is normal.  Cold air pulls the core temperature down, clothing and
  // shelter slow that down, and a fire or a hot meal pushes it back up.
  {
    f32 chill = clampf((24.0f - ambientTemp) / 22.0f, 0.0f, 1.0f);
    f32 insulation = 0.30f;
    if (p.equip[EQ_TORSO].defId >= 0) insulation += 0.22f;
    if (p.equip[EQ_LEGS].defId >= 0)  insulation += 0.08f;
    if (p.equip[EQ_HEAD].defId >= 0)  insulation += 0.05f;
    insulation = clampf(insulation, 0.0f, 0.85f);
    f32 heatLoss = chill * (1.0f - insulation) * 0.22f;
    f32 heatGain = 0.0f;
    if (ambientTemp > 30.0f) heatGain = (ambientTemp - 30.0f) * 0.02f;
    // the body always tries to return to 37
    s.temperature += (37.0f - s.temperature) * 0.035f * dtReal;
    s.temperature -= heatLoss * dtReal;
    s.temperature += heatGain * dtReal;
    if (s.fatigue > 70.0f) s.temperature -= 0.006f * dtReal;
    s.temperature = clampf(s.temperature, 20.0f, 44.0f);
  }

  // radiation
  s.radiation = std::min(100.0f, s.radiation + radiationRate * dtReal);
  s.radiation = std::max(0.0f, s.radiation - dtReal * 0.05f * (p.equip[EQ_BACK].defId >= 0 ? 1.4f : 1.0f));

  // infection grows with radiation and untreated wounds
  f32 inf = 0.02f;
  if (s.radiation > 25.0f) inf += (s.radiation - 25.0f) * 0.012f;
  for (int i = 0; i < BP_COUNT; ++i)
    if (p.body.infected[i]) inf += 0.05f;
  s.infection = std::min(100.0f, s.infection + inf * dtReal);

  // bleeding
  f32 bleed = p.body.totalBleed();
  s.bloodLoss = std::min(100.0f, bleed * 100.0f);
  if (bleed > 0.0f) {
    s.health = std::max(0.0f, s.health - bleed * 0.9f * dtReal);
    for (int i = 0; i < BP_COUNT; ++i)
      if (p.body.bleed[i] > 0.0f) p.body.bleed[i] = std::max(0.0f, p.body.bleed[i] - dtReal * 0.012f);
  }

  // hunger / thirst / infection / radiation drain health
  f32 drain = 0.0f;
  if (s.hunger <= 0.0f) drain += 0.45f;
  if (s.thirst <= 0.0f) drain += 0.8f;
  if (s.infection > 40.0f) drain += (s.infection - 40.0f) * 0.03f;
  if (s.radiation > 70.0f) drain += (s.radiation - 70.0f) * 0.04f;
  if (s.temperature < 35.4f) drain += (35.4f - s.temperature) * 0.30f;
  if (s.temperature > 38.6f) drain += (s.temperature - 38.6f) * 0.40f;
  if (drain > 0.0f) s.health = std::max(0.0f, s.health - drain * dtReal);

  // stress: darkness, low health, radiation, isolation
  f32 stressRate = 0.0f;
  if (s.health < 40.0f) stressRate += (40.0f - s.health) * 0.012f;
  stressRate += s.radiation * 0.004f;
  stressRate += s.infection * 0.005f;
  stressRate += s.fatigue * 0.006f;
  stressRate -= 0.35f;   // natural recovery
  s.stress = clampf(s.stress + stressRate * dtReal, 0.0f, 100.0f);

  // stamina recovery is hampered by fatigue and hunger
  if (s.fatigue > 50.0f) p.maxStamina = 100.0f - (s.fatigue - 50.0f) * 0.4f;
  else p.maxStamina = 100.0f + p.attributes[AT_ENDURANCE] * 1.2f;

  if (s.health <= 0.0f) { s.dead = true; p.dead = true; }
  s.incapacitated = s.health < 15.0f;
}

// ---------------------------------------------------------------------------
void PlayerController::applyDamage(Player& p, f32 amount, int part, f32& outBleed) {
  outBleed = 0.0f;
  if (p.dead) return;
  if (part < 0 || part >= BP_COUNT) part = BP_TORSO;
  f32 mult = 1.0f;
  if (part == BP_HEAD) mult = 2.4f;
  else if (part == BP_ARM_L || part == BP_ARM_R) mult = 0.7f;
  else if (part == BP_LEG_L || part == BP_LEG_R) mult = 0.8f;
  f32 dmg = amount * mult;
  // brief invulnerability window so a group cannot chain-hit instantly
  if (f32 now = m_clock; now - p.lastHitTime < 0.7f) dmg *= 0.25f;
  p.lastHitTime = m_clock;
  p.body.hp[part] = std::max(0.0f, p.body.hp[part] - dmg);
  p.stats.health = std::max(0.0f, p.stats.health - dmg);
  // wounds bleed
  if (dmg > 8.0f) {
    p.body.bleed[part] = std::min(1.0f, p.body.bleed[part] + dmg * 0.004f);
    outBleed = p.body.bleed[part];
  }
  if (p.body.hp[part] <= 0.0f && !p.body.broken[part]) {
    p.body.broken[part] = true;
    p.stats.stress = std::min(100.0f, p.stats.stress + 12.0f);
  }
  p.stats.stress = std::min(100.0f, p.stats.stress + dmg * 0.12f);
  if (p.stats.health <= 0.0f) { p.stats.dead = true; p.dead = true; }
}

void PlayerController::heal(Player& p, f32 amount) {
  f32 room = 0.0f;
  for (int i = 0; i < BP_COUNT; ++i) {
    f32 add = std::min(amount, p.body.maxHp[i] - p.body.hp[i]);
    p.body.hp[i] += add;
    room += add;
  }
  p.stats.health = std::min(p.stats.maxHealth, p.stats.health + room);
}

void PlayerController::addXp(Player& p, f32 amount) {
  p.xp += amount;
  while (p.xp >= p.xpNext) {
    p.xp -= p.xpNext;
    p.level++;
    p.xpNext = 120.0f + (p.level - 1) * 95.0f;
    p.skillPoints += 2;
    p.stats.maxHealth += 5.0f;
    p.body.maxHp[BP_HEAD] = p.stats.maxHealth * 0.2f;
    p.body.maxHp[BP_TORSO] = p.stats.maxHealth * 0.2f;
    p.body.maxHp[BP_ARM_L] = p.stats.maxHealth * 0.2f;
    p.body.maxHp[BP_ARM_R] = p.stats.maxHealth * 0.2f;
    p.body.maxHp[BP_LEG_L] = p.stats.maxHealth * 0.2f;
    p.body.maxHp[BP_LEG_R] = p.stats.maxHealth * 0.2f;
    for (int i = 0; i < BP_COUNT; ++i) p.body.hp[i] = p.body.maxHp[i];
  }
}

void PlayerController::respawn(Player& p, const Vec3& pos) {
  p.dead = false;
  p.stats.dead = false;
  p.stats.health = p.stats.maxHealth;
  p.stats.hunger = 70.0f;
  p.stats.thirst = 70.0f;
  p.stats.radiation = 0.0f;
  p.stats.infection = 0.0f;
  p.stats.fatigue = 20.0f;
  p.stats.stress = 15.0f;
  p.body.reset(p.stats.maxHealth);
  p.pos = pos;
  p.vel = Vec3(0, 0, 0);
  p.deadTimer = 0.0f;
}

// ---------------------------------------------------------------------------
void PlayerController::buildCamera(const Player& p, const World& w, CameraState& out,
                                   bool firstPerson, f32 fovBase) const {
  Vec3 fwd = forwardVector(p);
  Vec3 right = normalize(cross(fwd, Vec3(0, 1, 0)));
  Vec3 up = cross(right, fwd);
  out.forward = fwd; out.right = right; out.up = up;

  f32 bob = 0.0f;
  if (p.state == AS_WALK || p.state == AS_RUN) {
    bob = sinf(p.bobPhase) * (p.sprinting ? 0.055f : 0.032f);
  }
  Vec3 eye = eyePosition(p);
  eye.y += bob;

  out.firstPerson = firstPerson;
  if (firstPerson) {
    out.pos = eye;
    out.fov = fovBase / (p.ads ? 1.5f : 1.0f);
    return;
  }

  // third person: spring arm with collision
  f32 armLen = 3.4f;
  if (p.ads) armLen = 1.9f;
  Vec3 pivot = eye + Vec3(0, 0.25f, 0);
  Vec3 desired = pivot - fwd * armLen + Vec3(0, 0.15f, 0);
  float t = 0.0f;
  Vec3 nrm;
  int bi = 0;
  if (w.raycast(pivot, desired - pivot, 1.0f, t, nrm, bi)) {
    desired = pivot + normalize(desired - pivot) * std::max(0.25f, t - 0.25f);
  }
  out.pos = desired;
  out.fov = fovBase / (p.ads ? 1.35f : 1.0f);
}

// ---------------------------------------------------------------------------
void PlayerController::respawn(Player& p, const World& w) {
  // Recover at the nearest safe site with a penalty.
  Vec3 best = p.pos;
  f32 bestD = 1e30f;
  for (const SiteDef& s : w.sites()) {
    if (s.loot) continue;             // not a safe place
    f32 d = dist2D(Vec3(s.pos.x, 0, s.pos.z), p.pos);
    if (d < bestD) { bestD = d; best = Vec3(s.pos.x, 0, s.pos.z); }
  }
  if (bestD > 1e29f) best = p.pos;
  best.y = w.heightAt(best.x, best.z) + 0.2f;
  respawn(p, best);
}

void PlayerController::applySave(Player& p, const SaveData& d) {
  p.pos = d.playerPos;
  p.yaw = d.playerYaw;
  p.pitch = d.playerPitch;
  p.stats = d.stats;
  p.body = d.body;
  p.level = d.level;
  p.xp = d.xp;
  p.xpNext = d.xpNext;
  for (int i = 0; i < AT_COUNT; ++i) p.attributes[i] = d.attributes[i];
  for (int i = 0; i < SK_COUNT; ++i) { p.skillRank[i] = d.skillRank[i]; p.skillXp[i] = d.skillXp[i]; }
  p.skillPoints = d.skillPoints;
  for (int i = 0; i < Player::INV_W * Player::INV_H && i < (int)d.inventory.size(); ++i)
    p.inv[i] = d.inventory[i];
  for (int i = 0; i < EQ_COUNT && i < (int)d.equipment.size(); ++i)
    p.equip[i] = d.equipment[i];
}

} // namespace aoh
