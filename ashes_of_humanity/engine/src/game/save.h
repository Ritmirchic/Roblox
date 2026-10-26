// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Versioned save system with autosave and migration.
// ============================================================================
#pragma once
#include "game/entities.h"
#include "game/quests.h"
#include <string>
#include <vector>

namespace aoh {

struct SaveSettings {
  int graphicsQuality = 2;
  bool shadows = true;
  bool bloom = true;
  bool fxaa = true;
  bool volumetric = true;
  bool grain = true;
  f32  fov = 75.0f;
  f32  mouseSensitivity = 0.0022f;
  f32  masterVolume = 0.8f;
  bool invertY = false;
};

struct SaveData {
  u32 version = 3;
  u32 seed = 1337;
  f32 timeOfDay = 8.0f;
  f32 playTime = 0.0f;
  Vec3 playerPos;
  f32 playerYaw = 0.0f, playerPitch = 0.0f;
  SurvivalStats stats;
  BodyState body;
  int level = 1;
  f32 xp = 0.0f, xpNext = 120.0f;
  int attributes[AT_COUNT] = { 5, 5, 5, 5, 5, 5 };
  int skillRank[SK_COUNT] = { 0, 0, 0, 0 };
  int skillXp[SK_COUNT] = { 0, 0, 0, 0 };
  int skillPoints = 0;
  std::vector<ItemStack> inventory;    // 80 slots
  std::vector<ItemStack> equipment;    // 7 slots
  std::vector<std::string> flags;
  std::vector<int> questStates;       // per quest
  std::vector<int> questObjectives;   // flattened current counts
  SaveSettings settings;
};

class SaveSystem {
public:
  static const u32 CURRENT_VERSION = 3;
  static std::string savePath(int slot);
  static bool write(const SaveData& data, int slot);
  static bool read(SaveData& out, int slot);
  static bool exists(int slot);
  static bool validate(const SaveData& d);
  static bool migrate(SaveData& d, u32 fromVersion);
  static void capture(SaveData& out, const Player& p, const QuestSystem& q, f32 timeOfDay,
                      f32 playTime, u32 seed, const SaveSettings& settings);
};

} // namespace aoh
