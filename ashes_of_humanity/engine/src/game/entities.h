// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Gameplay entity definitions.
// ============================================================================
#pragma once
#include "core/math.h"
#include "core/util.h"
#include <map>
#include <string>
#include <vector>

namespace aoh {

// ---------------------------------------------------------------------------
// Body damage
// ---------------------------------------------------------------------------
enum BodyPart { BP_HEAD = 0, BP_TORSO, BP_ARM_L, BP_ARM_R, BP_LEG_L, BP_LEG_R, BP_COUNT };
inline const char* bodyPartName(int p) {
  static const char* n[BP_COUNT] = { "Head", "Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg" };
  return (p >= 0 && p < BP_COUNT) ? n[p] : "Body";
}

struct BodyState {
  f32 hp[BP_COUNT];
  f32 maxHp[BP_COUNT];
  f32 bleed[BP_COUNT];
  bool  broken[BP_COUNT];
  bool  infected[BP_COUNT];
  void reset(f32 total);
  f32 totalHp() const;
  f32 totalBleed() const;
};

// ---------------------------------------------------------------------------
// Survival statistics
// ---------------------------------------------------------------------------
struct SurvivalStats {
  f32 health = 100.0f, maxHealth = 100.0f;
  f32 hunger = 100.0f, thirst = 100.0f;
  f32 stamina = 100.0f, maxStamina = 100.0f;
  f32 temperature = 37.0f;      // Celsius, 37 nominal
  f32 radiation = 0.0f;         // 0..100
  f32 infection = 0.0f;         // 0..100
  f32 fatigue = 0.0f;           // 0..100
  f32 stress = 0.0f;            // 0..100 mental stress
  f32 bloodLoss = 0.0f;         // 0..100
  bool  dead = false;
  bool  incapacitated = false;
};

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------
enum ItemType { IT_WEAPON = 0, IT_AMMO, IT_MEDICAL, IT_FOOD, IT_DRINK, IT_TOOL,
                IT_MATERIAL, IT_ARMOR, IT_MISC, IT_VALUABLE, IT_BLUEPRINT };
enum Rarity { R_COMMON = 0, R_UNCOMMON, R_RARE, R_EPIC, R_LEGENDARY };

struct ItemDef {
  int id = 0;
  std::string name;
  std::string desc;
  int type = IT_MISC;
  int w = 1, h = 1;             // inventory grid footprint
  f32 weight = 0.2f;            // kg per unit
  int stack = 1;
  f32 durability = 0.0f;        // 0 = not durable
  int rarity = R_COMMON;
  int weaponId = -1;            // index into the weapon table
  int ammoType = -1;            // for ammo items
  int effect = 0;               // medical/food effect id
  f32 value = 10.0f;
  std::string mesh;
  bool  usable = false;         // can be consumed from the inventory
};

struct ItemStack {
  int defId = -1;
  int count = 0;
  f32 durability = 1.0f;        // 0..1
  int  ammo = 0;                // rounds in magazine (weapons)
  int  att[4] = { -1, -1, -1, -1 };   // fitted attachments (optic/muzzle/...)
  bool operator==(const ItemStack& o) const { return defId == o.defId; }
};

enum EquipSlot { EQ_HEAD = 0, EQ_TORSO, EQ_HANDS, EQ_LEGS, EQ_BACK, EQ_MAIN, EQ_OFF, EQ_COUNT };
inline const char* equipSlotName(int s) {
  static const char* n[EQ_COUNT] = { "Head", "Torso", "Hands", "Legs", "Back", "Main Hand", "Off Hand" };
  return (s >= 0 && s < EQ_COUNT) ? n[s] : "-";
}

// ---------------------------------------------------------------------------
// Weapons
// ---------------------------------------------------------------------------
enum WeaponKind { WK_MELEE = 0, WK_PISTOL, WK_SMG, WK_RIFLE, WK_SHOTGUN, WK_HEAVY, WK_BOW };

struct WeaponDef {
  int id = 0;
  std::string name;
  std::string desc;
  int kind = WK_MELEE;
  f32 damage = 20.0f;
  f32 rpm = 60.0f;
  int magSize = 0;
  f32 reloadTime = 2.0f;
  f32 spread = 0.02f;           // radians standing
  f32 spreadMove = 0.06f;
  f32 recoil = 0.02f;           // radians per shot
  f32 recoilRecover = 6.0f;
  f32 falloffStart = 30.0f;
  f32 falloffEnd = 90.0f;
  f32 minDamage = 0.25f;        // fraction at falloff end
  f32 range = 120.0f;
  int  pellets = 1;
  int  ammoType = -1;
  f32 muzzleVelocity = 0.0f;    // 0 = hitscan
  f32 durability = 100.0f;
  f32 weight = 2.0f;
  f32 adsZoom = 1.25f;
  f32 adsTime = 0.22f;
  f32 swingTime = 0.45f;        // melee
  f32 critMult = 2.0f;
  std::string mesh;
  int  fireMode = 0;            // 0 single, 1 auto, 2 burst
  int  clipCapacity = 0;        // attachments
  bool canScope = false;
  bool canSuppress = false;
  bool canGrip = false;
};

struct AttachmentDef {
  int id = 0;
  std::string name;
  std::string desc;
  int slot = 0;                 // 0 optic, 1 muzzle, 2 underbarrel, 3 magazine
  f32 spreadMod = 0.0f;
  f32 recoilMod = 0.0f;
  f32 damageMod = 0.0f;
  f32 zoomMod = 0.0f;
  int  ammoCapacityMod = 0;
  bool suppressor = false;
  std::string mesh;
};

// ---------------------------------------------------------------------------
// Actors
// ---------------------------------------------------------------------------
enum ActorState { AS_IDLE = 0, AS_WALK, AS_RUN, AS_CROUCH, AS_CRAWL, AS_SWIM,
                  AS_JUMP, AS_VAULT, AS_CLIMB, AS_DEAD, AS_ATTACK, AS_HURT, AS_LOOT,
                  // AI-only states (mutants)
                  AS_ALERT, AS_SEARCH, AS_FLEE, AS_STAGGER };

struct Mutant {
  int  species = 0;
  Vec3 pos, vel;
  f32  yaw = 0.0f;
  f32  hp = 100.0f, maxHp = 100.0f;
  f32  radius = 0.42f, height = 1.8f;
  f32  speed = 2.2f;
  f32  damage = 12.0f;
  f32  attackRange = 1.9f;
  f32  attackCooldown = 0.0f;
  f32  attackTimer = 0.0f;
  int   state = AS_IDLE;
  f32  stateTime = 0.0f;
  f32  alert = 0.0f;            // 0 unaware .. 1 fully alerted
  f32  loseTimer = 0.0f;
  Vec3 home, targetPos, lastSeen;
  bool hasTarget = false;
  Vec3 wanderTarget;
  f32  wanderTimer = 0.0f;
  int   anim = 0;
  f32  animTime = 0.0f;
  f32  animSpeed = 1.0f;
  bool dead = false;
  bool burning = false;
  f32  burnTime = 0.0f;
  f32  stagger = 0.0f;
  int   boss = -1;              // boss index if this is a boss
  int   phase = 0;
  f32  telegraph = 0.0f;
  f32  weakPointExposed = 0.0f;
  f32  pack = 0.0f;             // group aggression
};

struct Projectile {
  Vec3 pos, vel;
  f32  life = 0.0f;
  f32  damage = 0.0f;
  int   owner = -1;             // -1 = player
  int   weapon = -1;
  bool  active = false;
};

struct Particle {
  Vec3 pos, vel;
  Vec3 color = Vec3(1, 1, 1);
  f32  size = 0.1f;
  f32  life = 1.0f, maxLife = 1.0f;
  bool active = false;
};

struct Decal {
  Vec3 pos, normal;
  f32  size = 0.4f;
  f32  life = 30.0f;
  int  kind = 0;
};

struct FloatingText {
  Vec3 pos;
  std::string text;
  Vec3 color = Vec3(1, 0.9, 0.3f);
  f32  life = 1.6f;
  bool active = false;
};

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------
enum SkillId { SK_COMBAT = 0, SK_SURVIVAL, SK_ENGINEERING, SK_EXPLORATION, SK_COUNT };
enum AttributeId { AT_STRENGTH = 0, AT_AGILITY, AT_ENDURANCE, AT_INTELLECT,
                    AT_PERCEPTION, AT_WILLPOWER, AT_COUNT };
inline const char* attributeName(int a) {
  static const char* n[AT_COUNT] = { "Strength", "Agility", "Endurance", "Intellect",
                                     "Perception", "Willpower" };
  return (a >= 0 && a < AT_COUNT) ? n[a] : "?";
}
inline const char* skillName(int s) {
  static const char* n[SK_COUNT] = { "Combat", "Survival", "Engineering", "Exploration" };
  return (s >= 0 && s < SK_COUNT) ? n[s] : "?";
}

struct Player {
  Vec3 pos, vel;
  f32  yaw = 0.0f, pitch = 0.0f;
  f32  radius = 0.36f;
  f32  height = 1.78f;
  f32  crouchHeight = 1.15f;
  f32  crawlHeight = 0.62f;
  int   state = AS_IDLE;
  bool  grounded = true;
  bool  sprinting = false;
  bool  crouching = false;
  bool  crawling = false;
  bool  swimming = false;
  bool  climbing = false;
  bool  vaulting = false;
  f32   vaultTime = 0.0f;
  Vec3  vaultStart, vaultEnd;
  f32   vaultTimer = 0.0f;
  f32   stamina = 100.0f;
  f32   maxStamina = 100.0f;
  f32   staminaRegen = 18.0f;
  f32   staminaDrain = 16.0f;
  f32   walkSpeed = 2.4f;
  f32   runSpeed = 5.2f;
  f32   crouchSpeed = 1.3f;
  f32   crawlSpeed = 0.7f;
  f32   swimSpeed = 2.0f;
  f32   climbSpeed = 1.8f;
  f32   jumpSpeed = 5.2f;
  f32   mouseSensitivity = 0.0022f;
  bool  ads = false;
  f32   adsBlend = 0.0f;
  f32   recoilPitch = 0.0f, recoilYaw = 0.0f;
  f32   recoilVelPitch = 0.0f, recoilVelYaw = 0.0f;
  f32   bobPhase = 0.0f;
  f32   footstepDist = 0.0f;
  f32   lastHitTime = -99.0f;     // for brief invulnerability windows
  bool  inWater = false;
  f32   waterDepth = 0.0f;
  bool  onLadder = false;
  f32   ledgeGrab = 0.0f;

  // Survival
  SurvivalStats stats;
  BodyState body;

  // Progression
  int   level = 1;
  f32   xp = 0.0f;
  f32   xpNext = 120.0f;
  int   attributes[AT_COUNT] = { 5, 5, 5, 5, 5, 5 };
  int   skillPoints = 0;
  int   skillRank[SK_COUNT] = { 0, 0, 0, 0 };
  int   skillXp[SK_COUNT] = { 0, 0, 0, 0 };

  // Inventory
  static const int INV_W = 10, INV_H = 8;
  ItemStack inv[INV_W * INV_H];
  ItemStack equip[EQ_COUNT];

  // Weapon state
  int   activeWeapon = -1;      // slot index
  f32   fireTimer = 0.0f;
  f32   reloadTimer = 0.0f;
  bool  reloading = false;
  int   reloadWeapon = -1;
  f32   swingTimer = 0.0f;
  int   attachmentSlot[4] = { -1, -1, -1, -1 };  // per active weapon instance

  // State
  bool  dead = false;
  f32   deadTimer = 0.0f;
  f32   interactTimer = 0.0f;
  std::string interactTarget;
};

// ---------------------------------------------------------------------------
// Inventory helpers (implemented in items.cpp)
// ---------------------------------------------------------------------------
class ItemDatabase {
public:
  void build();
  const ItemDef& def(int id) const { return m_defs[id]; }
  int  find(const std::string& name) const;
  const std::vector<ItemDef>& defs() const { return m_defs; }
  const ItemDef* weaponItem(int weaponId) const;
  ItemDef& mutableDef(int id) { return m_defs[id]; }
private:
  std::vector<ItemDef> m_defs;
  std::map<std::string, int> m_byName;
};

class WeaponDatabase {
public:
  void build();
  const WeaponDef& def(int id) const { return m_weapons[id]; }
  int  find(const std::string& name) const;
  const std::vector<WeaponDef>& all() const { return m_weapons; }
  const std::vector<AttachmentDef>& attachments() const { return m_attachments; }
private:
  std::vector<WeaponDef> m_weapons;
  std::vector<AttachmentDef> m_attachments;
  std::map<std::string, int> m_byName;
};

} // namespace aoh
