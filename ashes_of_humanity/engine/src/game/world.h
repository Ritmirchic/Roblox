// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  World: terrain, regions, spatial layout and collision.
// ============================================================================
#pragma once
#include "core/math.h"
#include "gfx/gfx_types.h"
#include <map>
#include <string>
#include <vector>

namespace aoh {

// ---------------------------------------------------------------------------
// Regions
// ---------------------------------------------------------------------------
enum RegionId {
  REGION_SUBURBS = 0,
  REGION_FOREST = 1,
  REGION_INDUSTRIAL = 2,
  REGION_CITY = 3,
  REGION_MILITARY = 4,
  REGION_WASTELAND = 5,
  REGION_COUNT = 6
};

struct RegionDef {
  int id = 0;
  std::string name;
  std::string subtitle;
  Vec3 center;              // world centre
  float radius = 300.0f;    // influence radius
  Vec3 ambient;             // ambient light tint
  float fogDensity = 0.01f;
  float radiation = 0.0f;   // 0..1 background radiation
  float hostility = 0.3f;   // mutant density
  int groundTex = -1;
};

struct SiteDef {
  std::string mesh;        // mesh name in the asset library
  Vec3 pos;
  float yaw = 0.0f;
  float scale = 1.0f;
  bool solid = true;       // generates collision
  bool light = false;
  bool loot = false;       // spawns a loot container
  int  tier = 0;           // loot rarity tier bias
};

// ---------------------------------------------------------------------------
// Boss arenas
// ---------------------------------------------------------------------------
struct BossArena {
  std::string name;
  Vec3 pos;
  float radius = 60.0f;
  int  bossIndex = -1;      // index into the species table (10..15)
  bool triggered = false;
};

// ---------------------------------------------------------------------------
// Collision
// ---------------------------------------------------------------------------
struct Box {
  Vec3 lo, hi;
  Vec3 center() const { return (lo + hi) * 0.5f; }
  Vec3 size() const { return hi - lo; }
  bool contains(const Vec3& p) const {
    return p.x >= lo.x && p.x <= hi.x && p.y >= lo.y && p.y <= hi.y &&
           p.z >= lo.z && p.z <= hi.z;
  }
};

// ---------------------------------------------------------------------------
// Loot containers
// ---------------------------------------------------------------------------
struct LootSpawn {
  Vec3 pos;
  int tier = 0;
  bool used = false;
  u32 id = 0;
};

// ---------------------------------------------------------------------------
// World
// ---------------------------------------------------------------------------
class World {
public:
  void generate(u32 seed);

  // Terrain
  float heightAt(float x, float z) const;
  Vec3 normalAt(float x, float z) const;
  float waterLevel() const { return m_waterLevel; }
  bool isWater(float x, float z) const { return heightAt(x, z) < m_waterLevel; }
  int regionAt(float x, float z) const;

  // Collision
  void addBox(const Box& b);
  // Removes every collision volume (used by the automated tests and by the
  // "no collision" debug option).
  void clearCollision();
  void addMeshCollision(const Mesh& mesh, const Mat4& xform, float cell = 0.45f);
  // Resolves a vertical capsule against the world.  Returns true if moved.
  bool resolveCapsule(Vec3& pos, Vec3& vel, float radius, float height, float dt) const;
  // Ray vs world (terrain + boxes).  Returns true on hit; t is in metres.
  bool raycast(const Vec3& origin, const Vec3& dir, float maxDist, float& t,
               Vec3& normal, int& boxIndex) const;
  // Ground probe: returns the highest support height under (x,z) <= pos.y + eps.
  float supportHeight(float x, float z, float maxY) const;

  const std::vector<Box>& boxes() const { return m_boxes; }
  const std::vector<RegionDef>& regions() const { return m_regions; }
  const RegionDef& region(int i) const { return m_regions[i]; }
  const std::vector<SiteDef>& sites() const { return m_sites; }
  const std::vector<LootSpawn>& loot() const { return m_loot; }
  std::vector<LootSpawn>& loot() { return m_loot; }

  // Major landmarks (for the map screen and quest markers).
  const std::vector<std::pair<std::string, Vec3>>& landmarks() const { return m_landmarks; }
  // Boss arenas.
  const std::vector<BossArena>& bossArenas() const { return m_arenas; }
  std::vector<BossArena>& bossArenas() { return m_arenas; }

  u32 seed() const { return m_seed; }

private:
  void buildRegionSites();
  void buildBossArenas();
  float noise2(float x, float z) const;
  float fbm(float x, float z, int oct, float lac, float gain) const;

  u32 m_seed = 1337;
  std::vector<RegionDef> m_regions;
  std::vector<SiteDef> m_sites;
  std::vector<Box> m_boxes;
  std::vector<LootSpawn> m_loot;
  std::vector<std::pair<std::string, Vec3>> m_landmarks;
  std::vector<BossArena> m_arenas;
  float m_waterLevel = -1.2f;

  // uniform grid over the boxes
  float m_cell = 8.0f;
  float m_originX = -1600.0f, m_originZ = -1600.0f;
  int m_gridW = 400, m_gridH = 400;
  std::vector<std::vector<u32>> m_grid;
};

} // namespace aoh
