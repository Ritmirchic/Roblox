// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Modular quest framework.
// ============================================================================
#pragma once
#include "game/context.h"
#include <map>
#include <string>
#include <vector>

namespace aoh {

struct SaveData;

enum QuestState { QS_LOCKED = 0, QS_AVAILABLE, QS_ACTIVE, QS_COMPLETE, QS_FAILED };
enum ObjType { OBJ_KILL = 0, OBJ_COLLECT, OBJ_REACH, OBJ_INTERACT, OBJ_TALK, OBJ_SCAVENGE, OBJ_BOSS, OBJ_SURVIVE };

struct Objective {
  int type = OBJ_KILL;
  std::string desc;
  int target = -1;          // species index / item id / quest marker
  int need = 1;
  int have = 0;
  bool optional = false;
};

struct Quest {
  int id = 0;
  std::string title;
  std::string summary;
  std::string act;
  bool main = false;
  QuestState state = QS_LOCKED;
  std::vector<Objective> objectives;
  std::vector<int> prereq;
  std::vector<std::string> setFlags;
  std::vector<std::string> needFlags;
  int xp = 0;
  int rewardItem = -1;
  int rewardCount = 0;
  std::string rewardItemName;
  int region = 0;
  Vec3 marker;
  bool hasMarker = false;
};

class QuestSystem {
public:
  void build();
  void update(GameContext& ctx, Player& p);

  // Event hooks
  void onKill(GameContext& ctx, int species);
  void onCollect(GameContext& ctx, int itemDef);
  void onReach(GameContext& ctx, const Vec3& pos);
  void onTalk(GameContext& ctx, int npc);

  const Quest* quest(int id) const;
  const std::vector<Quest>& all() const { return m_quests; }
  void applySave(const SaveData& d);
  Quest* questPtr(int id);
  int  activeCount() const;
  int  completedCount() const;
  bool hasFlag(const std::string& f) const;
  void setFlag(const std::string& f);
  const std::vector<std::string>& flags() const { return m_flags; }
  // Quests that can be started right now.
  std::vector<int> available() const;
  // Marker of the closest active objective.
  bool nearestMarker(const Vec3& from, Vec3& out, std::string& title) const;

private:
  void refreshStates();
  void complete(Quest& q, GameContext& ctx, Player& p);
  int  findByTitle(const std::string& t) const;

  std::vector<Quest> m_quests;
  std::vector<std::string> m_flags;
  std::map<std::string, int> m_flagIndex;
};

} // namespace aoh
