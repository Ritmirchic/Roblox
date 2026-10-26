// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Save system implementation.
// ============================================================================
#include "game/save.h"
#include "assets/assets.h"
#include "core/util.h"
#include <cstring>

namespace aoh {

static const u32 SAVE_MAGIC = 0x53415641;   // 'AVAS'

std::string SaveSystem::savePath(int slot) {
  char buf[64];
  snprintf(buf, sizeof(buf), "ashes_slot%d.sav", slot);
  return std::string(buf);
}

// ---------------------------------------------------------------------------
bool SaveSystem::write(const SaveData& d, int slot) {
  BinWriter w;
  w.u32v(SAVE_MAGIC);
  w.u32v(CURRENT_VERSION);
  w.u32v(d.seed);
  w.f32v(d.timeOfDay);
  w.f32v(d.playTime);
  w.vec3(d.playerPos);
  w.f32v(d.playerYaw);
  w.f32v(d.playerPitch);
  // stats
  w.f32v(d.stats.health); w.f32v(d.stats.maxHealth);
  w.f32v(d.stats.hunger); w.f32v(d.stats.thirst);
  w.f32v(d.stats.stamina); w.f32v(d.stats.maxStamina);
  w.f32v(d.stats.temperature); w.f32v(d.stats.radiation);
  w.f32v(d.stats.infection); w.f32v(d.stats.fatigue);
  w.f32v(d.stats.stress); w.f32v(d.stats.bloodLoss);
  w.u8v(d.stats.dead ? 1 : 0);
  // body
  for (int i = 0; i < BP_COUNT; ++i) {
    w.f32v(d.body.hp[i]); w.f32v(d.body.maxHp[i]); w.f32v(d.body.bleed[i]);
    w.u8v(d.body.broken[i] ? 1 : 0);
    w.u8v(d.body.infected[i] ? 1 : 0);
  }
  // progression
  w.u32v((u32)d.level);
  w.f32v(d.xp); w.f32v(d.xpNext);
  for (int i = 0; i < AT_COUNT; ++i) w.u32v((u32)d.attributes[i]);
  for (int i = 0; i < SK_COUNT; ++i) { w.u32v((u32)d.skillRank[i]); w.u32v((u32)d.skillXp[i]); }
  w.u32v((u32)d.skillPoints);
  // inventory
  w.u32v((u32)d.inventory.size());
  for (const ItemStack& s : d.inventory) {
    w.i32v(s.defId); w.u32v((u32)s.count); w.f32v(s.durability); w.i32v(s.ammo);
  }
  w.u32v((u32)d.equipment.size());
  for (const ItemStack& s : d.equipment) {
    w.i32v(s.defId); w.u32v((u32)s.count); w.f32v(s.durability); w.i32v(s.ammo);
  }
  // flags
  w.u32v((u32)d.flags.size());
  for (const std::string& f : d.flags) w.str(f);
  // quests
  w.u32v((u32)d.questStates.size());
  for (int s : d.questStates) w.u32v((u32)s);
  w.u32v((u32)d.questObjectives.size());
  for (int o : d.questObjectives) w.u32v((u32)o);
  // settings
  w.u32v((u32)d.settings.graphicsQuality);
  w.u8v(d.settings.shadows ? 1 : 0);
  w.u8v(d.settings.bloom ? 1 : 0);
  w.u8v(d.settings.fxaa ? 1 : 0);
  w.u8v(d.settings.volumetric ? 1 : 0);
  w.u8v(d.settings.grain ? 1 : 0);
  w.f32v(d.settings.fov);
  w.f32v(d.settings.mouseSensitivity);
  w.f32v(d.settings.masterVolume);
  w.u8v(d.settings.invertY ? 1 : 0);
  return writeFile(savePath(slot), w.buf.data(), w.buf.size());
}

// ---------------------------------------------------------------------------
bool SaveSystem::read(SaveData& out, int slot) {
  bool ok = false;
  std::vector<u8> data = readFile(savePath(slot), &ok);
  if (!ok || data.size() < 16) return false;
  BinReader r(data.data(), data.size());
  u32 magic = r.u32v();
  u32 version = r.u32v();
  if (magic != SAVE_MAGIC) { LOGE("save: bad magic in slot %d", slot); return false; }
  out.version = version;
  out.seed = r.u32v();
  out.timeOfDay = r.f32v();
  out.playTime = r.f32v();
  out.playerPos = r.vec3();
  out.playerYaw = r.f32v();
  out.playerPitch = r.f32v();
  out.stats.health = r.f32v(); out.stats.maxHealth = r.f32v();
  out.stats.hunger = r.f32v(); out.stats.thirst = r.f32v();
  out.stats.stamina = r.f32v(); out.stats.maxStamina = r.f32v();
  out.stats.temperature = r.f32v(); out.stats.radiation = r.f32v();
  out.stats.infection = r.f32v(); out.stats.fatigue = r.f32v();
  out.stats.stress = r.f32v(); out.stats.bloodLoss = r.f32v();
  out.stats.dead = r.u8v() != 0;
  for (int i = 0; i < BP_COUNT; ++i) {
    out.body.hp[i] = r.f32v(); out.body.maxHp[i] = r.f32v(); out.body.bleed[i] = r.f32v();
    out.body.broken[i] = r.u8v() != 0;
    out.body.infected[i] = r.u8v() != 0;
  }
  out.level = (int)r.u32v();
  out.xp = r.f32v(); out.xpNext = r.f32v();
  for (int i = 0; i < AT_COUNT; ++i) out.attributes[i] = (int)r.u32v();
  for (int i = 0; i < SK_COUNT; ++i) { out.skillRank[i] = (int)r.u32v(); out.skillXp[i] = (int)r.u32v(); }
  out.skillPoints = (int)r.u32v();
  u32 n = r.u32v();
  out.inventory.clear();
  for (u32 i = 0; i < n && r.ok; ++i) {
    ItemStack s;
    s.defId = r.i32v(); s.count = (int)r.u32v(); s.durability = r.f32v(); s.ammo = r.i32v();
    out.inventory.push_back(s);
  }
  n = r.u32v();
  out.equipment.clear();
  for (u32 i = 0; i < n && r.ok; ++i) {
    ItemStack s;
    s.defId = r.i32v(); s.count = (int)r.u32v(); s.durability = r.f32v(); s.ammo = r.i32v();
    out.equipment.push_back(s);
  }
  n = r.u32v();
  out.flags.clear();
  for (u32 i = 0; i < n && r.ok; ++i) out.flags.push_back(r.str());
  n = r.u32v();
  out.questStates.clear();
  for (u32 i = 0; i < n && r.ok; ++i) out.questStates.push_back((int)r.u32v());
  n = r.u32v();
  out.questObjectives.clear();
  for (u32 i = 0; i < n && r.ok; ++i) out.questObjectives.push_back((int)r.u32v());
  out.settings.graphicsQuality = (int)r.u32v();
  out.settings.shadows = r.u8v() != 0;
  out.settings.bloom = r.u8v() != 0;
  out.settings.fxaa = r.u8v() != 0;
  out.settings.volumetric = r.u8v() != 0;
  out.settings.grain = r.u8v() != 0;
  out.settings.fov = r.f32v();
  out.settings.mouseSensitivity = r.f32v();
  out.settings.masterVolume = r.f32v();
  out.settings.invertY = r.u8v() != 0;
  if (!r.ok) { LOGE("save: slot %d truncated", slot); return false; }
  if (version < CURRENT_VERSION) {
    if (!migrate(out, version)) return false;
  }
  return validate(out);
}

// ---------------------------------------------------------------------------
bool SaveSystem::exists(int slot) { return fileExists(savePath(slot)); }

// ---------------------------------------------------------------------------
bool SaveSystem::validate(const SaveData& d) {
  if (d.level < 1 || d.level > 200) return false;
  if (d.stats.maxHealth <= 0.0f) return false;
  for (int i = 0; i < AT_COUNT; ++i) if (d.attributes[i] < 0 || d.attributes[i] > 99) return false;
  for (int i = 0; i < SK_COUNT; ++i) if (d.skillRank[i] < 0 || d.skillRank[i] > 10) return false;
  if (d.inventory.size() > 4096) return false;
  if (d.flags.size() > 8192) return false;
  if (d.timeOfDay < 0.0f || d.timeOfDay > 24.0f) return false;
  return true;
}

// ---------------------------------------------------------------------------
bool SaveSystem::migrate(SaveData& d, u32 fromVersion) {
  LOGI("save: migrating version %u -> %u", fromVersion, CURRENT_VERSION);
  if (fromVersion == 1) {
    // v1 had no body-part damage and no skill xp
    for (int i = 0; i < BP_COUNT; ++i) {
      if (d.body.maxHp[i] <= 0.0f) d.body.maxHp[i] = d.stats.maxHealth * 0.2f;
      if (d.body.hp[i] <= 0.0f) d.body.hp[i] = d.body.maxHp[i];
    }
    for (int i = 0; i < SK_COUNT; ++i) d.skillXp[i] = 0;
    d.version = 2;
  }
  if (d.version == 2) {
    // v2 had no settings block; restore defaults
    d.settings.graphicsQuality = 2;
    d.settings.fov = 75.0f;
    d.settings.mouseSensitivity = 0.0022f;
    d.settings.masterVolume = 0.8f;
    d.version = 3;
  }
  d.version = CURRENT_VERSION;
  return true;
}

// ---------------------------------------------------------------------------
void SaveSystem::capture(SaveData& out, const Player& p, const QuestSystem& q, f32 timeOfDay,
                          f32 playTime, u32 seed, const SaveSettings& settings) {
  out.seed = seed;
  out.timeOfDay = timeOfDay;
  out.playTime = playTime;
  out.playerPos = p.pos;
  out.playerYaw = p.yaw;
  out.playerPitch = p.pitch;
  out.stats = p.stats;
  out.body = p.body;
  out.level = p.level;
  out.xp = p.xp;
  out.xpNext = p.xpNext;
  for (int i = 0; i < AT_COUNT; ++i) out.attributes[i] = p.attributes[i];
  for (int i = 0; i < SK_COUNT; ++i) { out.skillRank[i] = p.skillRank[i]; out.skillXp[i] = p.skillXp[i]; }
  out.skillPoints = p.skillPoints;
  out.inventory.assign(Player::INV_W * Player::INV_H, ItemStack());
  for (int i = 0; i < Player::INV_W * Player::INV_H; ++i) out.inventory[i] = p.inv[i];
  out.equipment.assign(EQ_COUNT, ItemStack());
  for (int i = 0; i < EQ_COUNT; ++i) out.equipment[i] = p.equip[i];
  out.flags = q.flags();
  out.questStates.clear();
  out.questObjectives.clear();
  for (const Quest& qq : q.all()) {
    out.questStates.push_back((int)qq.state);
    for (const Objective& o : qq.objectives) out.questObjectives.push_back(o.have);
  }
  out.settings = settings;
}

} // namespace aoh
