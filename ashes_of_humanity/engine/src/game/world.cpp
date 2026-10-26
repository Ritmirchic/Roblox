// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  World implementation.
// ============================================================================
#include "game/world.h"
#include "core/util.h"
#include <algorithm>
#include <cmath>

namespace aoh {

// ---------------------------------------------------------------------------
// Deterministic value noise
// ---------------------------------------------------------------------------
static inline float hash2(int x, int y, u32 seed) {
  u32 h = (u32)x * 374761393u + (u32)y * 668265263u + seed * 2246822519u;
  h = (h ^ (h >> 13)) * 1274126177u;
  return (float)((h ^ (h >> 16)) & 0xFFFFFF) / (float)0xFFFFFF;
}

static inline float smoothNoise(float x, float y, u32 seed) {
  int xi = (int)floorf(x), yi = (int)floorf(y);
  float xf = x - xi, yf = y - yi;
  float u = xf * xf * (3.0f - 2.0f * xf);
  float v = yf * yf * (3.0f - 2.0f * yf);
  float a = hash2(xi, yi, seed);
  float b = hash2(xi + 1, yi, seed);
  float c = hash2(xi, yi + 1, seed);
  float d = hash2(xi + 1, yi + 1, seed);
  return lerpf(lerpf(a, b, u), lerpf(c, d, u), v);
}

// ---------------------------------------------------------------------------
void World::generate(u32 seed) {
  m_seed = seed;
  m_regions.clear();
  m_sites.clear();
  m_boxes.clear();
  m_loot.clear();
  m_landmarks.clear();

  RegionDef r;

  r = RegionDef(); r.id = REGION_SUBURBS; r.name = "Dead Suburbs";
  r.subtitle = "Where the sirens stopped";
  r.center = Vec3(-620, 0, 480); r.radius = 420; r.ambient = Vec3(0.95f, 0.93f, 0.88f);
  r.fogDensity = 0.009f; r.radiation = 0.05f; r.hostility = 0.35f;
  m_regions.push_back(r);

  r = RegionDef(); r.id = REGION_FOREST; r.name = "Blackwood Forest";
  r.subtitle = "The trees remember";
  r.center = Vec3(-180, 0, 760); r.radius = 460; r.ambient = Vec3(0.80f, 0.92f, 0.78f);
  r.fogDensity = 0.016f; r.radiation = 0.08f; r.hostility = 0.55f;
  m_regions.push_back(r);

  r = RegionDef(); r.id = REGION_INDUSTRIAL; r.name = "Industrial Zone";
  r.subtitle = "Smoke over the rail yard";
  r.center = Vec3(-780, 0, -80); r.radius = 430; r.ambient = Vec3(0.88f, 0.86f, 0.82f);
  r.fogDensity = 0.014f; r.radiation = 0.22f; r.hostility = 0.45f;
  m_regions.push_back(r);

  r = RegionDef(); r.id = REGION_CITY; r.name = "Forgotten City";
  r.subtitle = "Concrete mausoleum";
  r.center = Vec3(-40, 0, 60); r.radius = 380; r.ambient = Vec3(0.82f, 0.84f, 0.90f);
  r.fogDensity = 0.011f; r.radiation = 0.12f; r.hostility = 0.60f;
  m_regions.push_back(r);

  r = RegionDef(); r.id = REGION_MILITARY; r.name = "Military Exclusion Zone";
  r.subtitle = "Do not enter";
  r.center = Vec3(560, 0, 120); r.radius = 400; r.ambient = Vec3(0.80f, 0.86f, 0.84f);
  r.fogDensity = 0.013f; r.radiation = 0.45f; r.hostility = 0.75f;
  m_regions.push_back(r);

  r = RegionDef(); r.id = REGION_WASTELAND; r.name = "Red Wasteland";
  r.subtitle = "Nothing grows here";
  r.center = Vec3(620, 0, 700); r.radius = 440; r.ambient = Vec3(1.0f, 0.78f, 0.62f);
  r.fogDensity = 0.019f; r.radiation = 0.30f; r.hostility = 0.65f;
  m_regions.push_back(r);

  buildRegionSites();
  buildBossArenas();

  // spatial grid for collision boxes
  m_cell = 8.0f;
  m_originX = -1700.0f; m_originZ = -1700.0f;
  m_gridW = 440; m_gridH = 440;
  m_grid.assign((size_t)m_gridW * m_gridH, {});
  for (u32 i = 0; i < m_boxes.size(); ++i) {
    const Box& b = m_boxes[i];
    int x0 = (int)floorf((b.lo.x - m_originX) / m_cell);
    int x1 = (int)floorf((b.hi.x - m_originX) / m_cell);
    int z0 = (int)floorf((b.lo.z - m_originZ) / m_cell);
    int z1 = (int)floorf((b.hi.z - m_originZ) / m_cell);
    x0 = std::max(0, x0); z0 = std::max(0, z0);
    x1 = std::min(m_gridW - 1, x1); z1 = std::min(m_gridH - 1, z1);
    for (int z = z0; z <= z1; ++z)
      for (int x = x0; x <= x1; ++x)
        m_grid[(size_t)z * m_gridW + x].push_back(i);
  }
}

void World::buildBossArenas() {
  m_arenas.clear();
  auto add = [&](const char* name, Vec3 p, float r, int boss) {
    BossArena a;
    a.name = name; a.pos = p; a.radius = r; a.bossIndex = boss;
    m_arenas.push_back(a);
  };
  add("Cathedral Plaza", Vec3(-150, 0, 120), 55.0f, 10);
  add("The Verdant Ring", Vec3(-300, 0, 900), 60.0f, 12);
  add("Furnace Hall", Vec3(-960, 0, -80), 60.0f, 11);
  add("The Red Bloom", Vec3(780, 0, 840), 65.0f, 13);
  add("Command Bunker", Vec3(620, 0, 140), 55.0f, 14);
  add("The Origin", Vec3(900, 0, 960), 70.0f, 15);
}

// ---------------------------------------------------------------------------
void World::clearCollision() {
  m_boxes.clear();
  for (auto& cell : m_grid) cell.clear();
}

// ---------------------------------------------------------------------------
// Region layouts
// ---------------------------------------------------------------------------
void World::buildRegionSites() {
  auto add = [&](const char* mesh, Vec3 p, float yaw = 0.0f, bool solid = true,
                 bool light = false, bool loot = false, int tier = 0, float scale = 1.0f) {
    SiteDef s; s.mesh = mesh; s.pos = p; s.yaw = yaw; s.solid = solid;
    s.light = light; s.loot = loot; s.tier = tier; s.scale = scale;
    m_sites.push_back(s);
    if (!solid) return;
    // Small props get a coarse collision volume here.  Buildings are
    // voxelised from their real geometry when the meshes are loaded.
    std::string m = mesh;
    float hx = 0.0f, hz = 0.0f, hy = 0.0f;
    if (m.rfind("prop_vehicle", 0) == 0)      { hx = hz = 2.6f; hy = 1.4f; }
    else if (m.rfind("prop_crates", 0) == 0)  { hx = hz = 1.1f; hy = 1.0f; }
    else if (m.rfind("prop_barricades", 0) == 0) { hx = 2.4f; hz = 0.5f; hy = 1.1f; }
    else if (m.rfind("prop_street", 0) == 0)  { hx = hz = 0.35f; hy = 3.2f; }
    else if (m.rfind("prop_tank", 0) == 0)    { hx = hz = 1.8f; hy = 2.4f; }
    else if (m.rfind("prop_watchtower", 0) == 0) { hx = hz = 2.0f; hy = 4.5f; }
    else if (m.rfind("prop_fence", 0) == 0)   { hx = 2.0f; hz = 0.2f; hy = 1.3f; }
    else if (m.rfind("prop_sandbag", 0) == 0){ hx = 1.6f; hz = 0.6f; hy = 0.9f; }
    else if (m.rfind("prop_tree", 0) == 0 || m.rfind("prop_bush", 0) == 0 ||
             m.rfind("prop_rock", 0) == 0 || m.rfind("prop_undergrowth", 0) == 0 ||
             m.rfind("prop_grass", 0) == 0)   { hx = hz = hy = 0.0f; }
    if (hx <= 0.0f) return;
    float gy = heightAt(p.x, p.z);
    Box b;
    b.lo = Vec3(p.x - hx, gy, p.z - hz);
    b.hi = Vec3(p.x + hx, gy + hy * 2.0f, p.z + hz);
    m_boxes.push_back(b);
  };

  // ---- Dead Suburbs: two residential streets and a small plaza ----------
  add("bld_house", Vec3(-760, 0, 330), 0.2f, true, false, true, 0);
  add("bld_house", Vec3(-660, 0, 300), 1.7f, true, false, true, 0);
  add("bld_house", Vec3(-560, 0, 330), 3.1f, true, false, true, 0);
  add("bld_house", Vec3(-470, 0, 300), 0.4f, true, false, true, 0);
  add("bld_house", Vec3(-700, 0, 520), 3.4f, true, false, true, 1);
  add("bld_house", Vec3(-590, 0, 560), 0.9f, true, false, true, 1);
  add("bld_house", Vec3(-480, 0, 520), 2.2f, true, false, true, 1);
  add("bld_apartment_block", Vec3(-330, 0, 420), 0.35f, true, false, true, 2);
  add("bld_shop", Vec3(-450, 0, 660), 1.9f, true, false, true, 1);
  add("bld_small_shed", Vec3(-820, 0, 470), 0.5f, true, false, true, 0);
  add("bld_small_shed", Vec3(-380, 0, 610), 2.4f, true, false, true, 0);
  add("bld_police_station", Vec3(-620, 0, 700), 0.9f, true, false, true, 3);
  add("prop_vehicle_car", Vec3(-600, 0, 380), 1.1f, true, false, false, 0, 1.0f);
  add("prop_vehicle_car", Vec3(-520, 0, 470), 2.7f, true, false, false, 0, 1.0f);
  add("prop_vehicle_truck", Vec3(-700, 0, 420), 0.4f, true, false, true, 1);
  add("prop_street", Vec3(-640, 0, 400), 0.0f, true, false, false, 0);
  add("prop_street", Vec3(-640, 0, 620), 0.0f, true, false, false, 0);
  add("prop_barricades", Vec3(-430, 0, 440), 0.6f, true, false, false, 0);
  add("prop_crates", Vec3(-540, 0, 470), 1.2f, true, false, true, 0);
  add("prop_undergrowth", Vec3(-760, 0, 600), 0.0f, false, false, false, 0);
  add("prop_undergrowth", Vec3(-350, 0, 330), 0.0f, false, false, false, 0);
  m_landmarks.push_back({"Riverside Suburbs", Vec3(-620, 0, 430)});
  m_landmarks.push_back({"Old Precinct", Vec3(-620, 0, 700)});

  // ---- Blackwood Forest: cabins, a ranger station, dense trees ----------
  add("bld_cabin", Vec3(-260, 0, 700), 0.6f, true, false, true, 1);
  add("bld_cabin", Vec3(-120, 0, 840), 2.1f, true, false, true, 1);
  add("bld_cabin", Vec3(-40, 0, 690), 4.0f, true, false, true, 1);
  add("bld_cabin", Vec3(-300, 0, 900), 1.2f, true, false, true, 2);
  add("bld_small_shed", Vec3(-160, 0, 760), 2.7f, true, false, true, 1);
  add("bld_watchtower", Vec3(60, 0, 880), 0.0f, true, false, true, 2);
  add("prop_trees", Vec3(-340, 0, 780), 0.3f, true, false, false, 0);
  add("prop_trees", Vec3(-80, 0, 950), 1.1f, true, false, false, 0);
  add("prop_trees", Vec3(-420, 0, 980), 2.2f, true, false, false, 0);
  add("prop_undergrowth", Vec3(-200, 0, 800), 0.5f, false, false, false, 0);
  add("prop_undergrowth", Vec3(-60, 0, 780), 1.4f, false, false, false, 0);
  add("prop_barricades", Vec3(-180, 0, 620), 0.2f, true, false, false, 0);
  m_landmarks.push_back({"Blackwood Camp", Vec3(-200, 0, 780)});
  m_landmarks.push_back({"The Matriarch's Clearing", Vec3(40, 0, 900)});

  // ---- Industrial Zone: warehouses, factory, cooling towers ------------
  add("bld_warehouse", Vec3(-900, 0, -140), 0.15f, true, false, true, 2);
  add("bld_warehouse", Vec3(-900, 0, 60), 3.14f, true, false, true, 2);
  add("bld_factory_shed", Vec3(-700, 0, -240), 0.4f, true, false, true, 3);
  add("bld_factory_shed", Vec3(-620, 0, -20), 1.6f, true, false, true, 3);
  add("bld_checkpoint", Vec3(-980, 0, -20), 0.0f, true, false, true, 3);
  add("bld_bunker", Vec3(-860, 0, 240), 0.9f, true, false, true, 4);
  add("prop_cooling_tower", Vec3(-1080, 0, 120), 0.0f, true, false, false, 0);
  add("prop_industrial", Vec3(-960, 0, -300), 0.0f, true, false, false, 0);
  add("prop_industrial", Vec3(-780, 0, 140), 1.2f, true, false, true, 2);
  add("prop_barricades", Vec3(-840, 0, -60), 0.9f, true, false, false, 0);
  add("prop_crates", Vec3(-740, 0, -160), 0.2f, true, false, true, 2);
  add("prop_vehicle_truck", Vec3(-820, 0, -40), 1.4f, true, false, false, 0);
  add("prop_vehicle_bus", Vec3(-760, 0, 60), 0.0f, true, false, false, 0);
  m_landmarks.push_back({"Rail Yard", Vec3(-900, 0, -40)});
  m_landmarks.push_back({"Cooling Stack", Vec3(-1080, 0, 120)});
  m_landmarks.push_back({"Bunker 7", Vec3(-860, 0, 240)});

  // ---- Forgotten City: dense blocks, hospital, shops --------------------
  add("bld_apartment_block", Vec3(-120, 0, -120), 0.2f, true, false, true, 2);
  add("bld_apartment_block", Vec3(60, 0, -160), 1.6f, true, false, true, 2);
  add("bld_apartment_block", Vec3(-160, 0, 200), 0.9f, true, false, true, 2);
  add("bld_hospital_wing", Vec3(140, 0, 160), 0.1f, true, false, true, 4);
  add("bld_shop", Vec3(-40, 0, 40), 2.3f, true, false, true, 1);
  add("bld_shop", Vec3(120, 0, -40), 0.8f, true, false, true, 1);
  add("bld_police_station", Vec3(-260, 0, 40), 1.4f, true, false, true, 3);
  add("bld_warehouse", Vec3(220, 0, 260), 2.7f, true, false, true, 2);
  add("prop_vehicle_bus", Vec3(-60, 0, 240), 1.1f, true, false, false, 0);
  add("prop_vehicle_car", Vec3(40, 0, 120), 2.4f, true, false, false, 0);
  add("prop_street", Vec3(-60, 0, 300), 0.0f, true, false, false, 0);
  add("prop_barricades", Vec3(-140, 0, 60), 0.3f, true, false, false, 0);
  m_landmarks.push_back({"Civic Plaza", Vec3(-40, 0, 40)});
  m_landmarks.push_back({"Saint Agnes Hospital", Vec3(140, 0, 160)});

  // ---- Military Exclusion Zone: checkpoints, watchtowers, bunkers -------
  add("bld_checkpoint", Vec3(420, 0, 60), 0.0f, true, false, true, 3);
  add("bld_checkpoint", Vec3(700, 0, 180), 0.0f, true, false, true, 3);
  add("bld_watchtower", Vec3(520, 0, 300), 0.0f, true, false, true, 4);
  add("bld_watchtower", Vec3(760, 0, -40), 0.0f, true, false, true, 4);
  add("bld_bunker", Vec3(620, 0, -20), 0.4f, true, false, true, 5);
  add("bld_factory_shed", Vec3(480, 0, -160), 1.1f, true, false, true, 4);
  add("prop_barricades", Vec3(540, 0, 80), 0.5f, true, false, false, 0);
  add("prop_barricades", Vec3(660, 0, 120), 1.3f, true, false, false, 0);
  add("prop_vehicle_truck", Vec3(460, 0, 160), 0.6f, true, false, true, 3);
  add("prop_crates", Vec3(700, 0, 60), 0.2f, true, false, true, 3);
  add("prop_industrial", Vec3(580, 0, -200), 0.4f, true, false, false, 0);
  m_landmarks.push_back({"Gate Delta", Vec3(420, 0, 60)});
  m_landmarks.push_back({"Command Bunker", Vec3(620, 0, -20)});

  // ---- Red Wasteland: crashed convoy, refinery ruins, towers -----------
  add("bld_factory_shed", Vec3(640, 0, 620), 0.7f, true, false, true, 3);
  add("bld_factory_shed", Vec3(820, 0, 760), 2.2f, true, false, true, 4);
  add("bld_bunker", Vec3(480, 0, 780), 1.9f, true, false, true, 4);
  add("bld_warehouse", Vec3(700, 0, 880), 0.0f, true, false, true, 3);
  add("bld_checkpoint", Vec3(560, 0, 640), 0.0f, true, false, true, 3);
  add("bld_watchtower", Vec3(880, 0, 620), 0.0f, true, false, true, 4);
  add("prop_vehicle_truck", Vec3(600, 0, 700), 1.7f, true, false, true, 2);
  add("prop_vehicle_bus", Vec3(660, 0, 720), 0.4f, true, false, false, 0);
  add("prop_vehicle_car", Vec3(720, 0, 700), 2.9f, true, false, false, 0);
  add("prop_industrial", Vec3(520, 0, 860), 0.0f, true, false, false, 0);
  add("prop_cooling_tower", Vec3(920, 0, 840), 0.0f, true, false, false, 0);
  add("prop_barricades", Vec3(620, 0, 660), 0.8f, true, false, false, 0);
  m_landmarks.push_back({"Convoy Wreck", Vec3(630, 0, 710)});
  m_landmarks.push_back({"Refinery Ruins", Vec3(740, 0, 800)});
  m_landmarks.push_back({"The Red Tower", Vec3(880, 0, 620)});

  // ---- transition buildings between regions ----------------------------
  add("bld_small_shed", Vec3(-420, 0, 250), 0.0f, true, false, true, 0);
  add("bld_small_shed", Vec3(-350, 0, 520), 1.0f, true, false, true, 0);
  add("bld_shop", Vec3(-320, 0, 640), 2.0f, true, false, true, 1);
  add("bld_small_shed", Vec3(220, 0, 460), 0.5f, true, false, true, 1);
  add("bld_house", Vec3(300, 0, 520), 1.9f, true, false, true, 1);
  add("bld_shop", Vec3(240, 0, 300), 0.7f, true, false, true, 1);
}

// ---------------------------------------------------------------------------
// Terrain
// ---------------------------------------------------------------------------
float World::noise2(float x, float z) const {
  return smoothNoise(x, z, m_seed) * 2.0f - 1.0f;
}

float World::fbm(float x, float z, int oct, float lac, float gain) const {
  float a = 1.0f, f = 1.0f, s = 0.0f, norm = 0.0f;
  for (int i = 0; i < oct; ++i) {
    s += a * smoothNoise(x * f, z * f, m_seed + (u32)i * 7919u);
    norm += a;
    a *= gain; f *= lac;
  }
  return s / norm;
}

int World::regionAt(float x, float z) const {
  int best = REGION_CITY;
  float bd = 1e30f;
  for (size_t i = 0; i < m_regions.size(); ++i) {
    float dx = x - m_regions[i].center.x;
    float dz = z - m_regions[i].center.z;
    float d = dx * dx + dz * dz;
    if (d < bd) { bd = d; best = (int)i; }
  }
  return best;
}

float World::heightAt(float x, float z) const {
  // Regional base terrain blended by region influence.
  float h = 0.0f;
  float wsum = 0.0f;
  for (size_t i = 0; i < m_regions.size(); ++i) {
    const RegionDef& r = m_regions[i];
    float dx = x - r.center.x, dz = z - r.center.z;
    float d = sqrtf(dx * dx + dz * dz);
    float w = 1.0f / (1.0f + powf(d / r.radius, 4.0f));
    float rh = 0.0f;
    switch (r.id) {
      case REGION_FOREST:
        rh = fbm(x * 0.0045f, z * 0.0045f, 4, 2.1f, 0.5f) * 34.0f
             + fbm(x * 0.02f, z * 0.02f, 3, 2.0f, 0.5f) * 3.5f;
        break;
      case REGION_INDUSTRIAL:
        rh = fbm(x * 0.0035f, z * 0.0035f, 3, 2.0f, 0.5f) * 12.0f;
        break;
      case REGION_CITY:
        rh = fbm(x * 0.006f, z * 0.006f, 3, 2.0f, 0.5f) * 8.0f;
        break;
      case REGION_MILITARY:
        rh = fbm(x * 0.005f, z * 0.005f, 3, 2.0f, 0.5f) * 16.0f
             + powf(fbm(x * 0.012f, z * 0.012f, 2, 2.0f, 0.5f), 2.0f) * 8.0f;
        break;
      case REGION_WASTELAND:
        rh = fbm(x * 0.003f, z * 0.003f, 4, 2.2f, 0.55f) * 26.0f
             + fabsf(fbm(x * 0.01f, z * 0.01f, 2, 2.0f, 0.5f)) * 6.0f;
        break;
      default:
        rh = fbm(x * 0.004f, z * 0.004f, 3, 2.0f, 0.5f) * 7.0f;
        break;
    }
    h += rh * w;
    wsum += w;
  }
  if (wsum > 1e-4f) h /= wsum;

  // Fine detail
  h += fbm(x * 0.06f, z * 0.06f, 2, 2.0f, 0.5f) * 0.55f;
  h += fbm(x * 0.21f, z * 0.21f, 2, 2.0f, 0.5f) * 0.14f;

  // Flatten the immediate footprint of structures so buildings sit level.
  float flat = 0.0f;
  for (const SiteDef& s : m_sites) {
    if (!s.solid) continue;
    float dx = x - s.pos.x, dz = z - s.pos.z;
    float r2 = dx * dx + dz * dz;
    float rad = 14.0f;
    if (r2 < rad * rad) {
      float t = 1.0f - sqrtf(r2) / rad;
      flat += t * t * 3.0f;
    }
  }
  h = lerpf(h, floorf(h / 3.0f) * 3.0f, saturate(flat * 0.35f));
  return h;
}

Vec3 World::normalAt(float x, float z) const {
  const float e = 0.75f;
  float hl = heightAt(x - e, z), hr = heightAt(x + e, z);
  float hd = heightAt(x, z - e), hu = heightAt(x, z + e);
  return normalize(Vec3(hl - hr, 2.0f * e, hd - hu));
}

// ---------------------------------------------------------------------------
// Collision
// ---------------------------------------------------------------------------
void World::addBox(const Box& b) {
  if (b.hi.x <= b.lo.x || b.hi.y <= b.lo.y || b.hi.z <= b.lo.z) return;
  m_boxes.push_back(b);
}

void World::addMeshCollision(const Mesh& mesh, const Mat4& xform, float cell) {
  // Voxelise the mesh into a coarse occupancy grid, then emit one box per
  // occupied cell.  Works for any authored building without hand data.
  AABB bb = mesh.bounds;
  Vec3 lo = xform.transformPoint(bb.lo);
  Vec3 hi = xform.transformPoint(bb.hi);
  for (int i = 0; i < 3; ++i) {
    if (lo[i] > hi[i]) std::swap(lo[i], hi[i]);
  }
  int nx = (int)ceilf((hi.x - lo.x) / cell);
  int ny = (int)ceilf((hi.y - lo.y) / cell);
  int nz = (int)ceilf((hi.z - lo.z) / cell);
  if (nx <= 0 || ny <= 0 || nz <= 0) return;
  if ((long long)nx * ny * nz > 400000LL) return;   // safety limit

  std::vector<u8> occ((size_t)nx * ny * nz, 0);
  // Rasterise triangles into the grid.
  for (size_t t = 0; t + 2 < mesh.idx.size(); t += 3) {
    const Vertex& a = mesh.verts[mesh.idx[t]];
    const Vertex& b = mesh.verts[mesh.idx[t + 1]];
    const Vertex& c = mesh.verts[mesh.idx[t + 2]];
    Vec3 p0 = xform.transformPoint(a.pos);
    Vec3 p1 = xform.transformPoint(b.pos);
    Vec3 p2 = xform.transformPoint(c.pos);
    Vec3 mn = p0; Vec3 mx = p0;
    for (int k = 0; k < 3; ++k) {
      mn[k] = std::min(mn[k], std::min(p1[k], p2[k]));
      mx[k] = std::max(mx[k], std::max(p1[k], p2[k]));
    }
    int x0 = std::max(0, (int)floorf((mn.x - lo.x) / cell));
    int x1 = std::min(nx - 1, (int)floorf((mx.x - lo.x) / cell));
    int y0 = std::max(0, (int)floorf((mn.y - lo.y) / cell));
    int y1 = std::min(ny - 1, (int)floorf((mx.y - lo.y) / cell));
    int z0 = std::max(0, (int)floorf((mn.z - lo.z) / cell));
    int z1 = std::min(nz - 1, (int)floorf((mx.z - lo.z) / cell));
    for (int z = z0; z <= z1; ++z)
      for (int y = y0; y <= y1; ++y)
        for (int x = x0; x <= x1; ++x) {
          Vec3 ctr(lo.x + (x + 0.5f) * cell, lo.y + (y + 0.5f) * cell, lo.z + (z + 0.5f) * cell);
          // barycentric point-in-triangle test in the dominant plane
          Vec3 e0 = p1 - p0, e1 = p2 - p0, e2 = ctr - p0;
          Vec3 pv = cross(e1, e2);
          float d = dot(e0, pv);
          if (fabsf(d) < 1e-8f) continue;
          float inv = 1.0f / d;
          float u = dot(e2, pv) * inv;
          Vec3 qv = cross(e0, e2);
          float v = dot(e1, qv) * inv;
          if (u >= 0.0f && v >= 0.0f && u + v <= 1.0f)
            occ[((size_t)z * ny + y) * nx + x] = 1;
        }
  }
  for (int z = 0; z < nz; ++z)
    for (int y = 0; y < ny; ++y)
      for (int x = 0; x < nx; ++x) {
        if (!occ[((size_t)z * ny + y) * nx + x]) continue;
        Box b;
        b.lo = Vec3(lo.x + x * cell, lo.y + y * cell, lo.z + z * cell);
        b.hi = b.lo + Vec3(cell, cell, cell);
        addBox(b);
      }
}

float World::supportHeight(float x, float z, float maxY) const {
  float best = heightAt(x, z);
  int gx = (int)floorf((x - m_originX) / m_cell);
  int gz = (int)floorf((z - m_originZ) / m_cell);
  if (gx < 0 || gz < 0 || gx >= m_gridW || gz >= m_gridH) return best;
  for (u32 bi : m_grid[(size_t)gz * m_gridW + gx]) {
    const Box& b = m_boxes[bi];
    if (x < b.lo.x || x > b.hi.x || z < b.lo.z || z > b.hi.z) continue;
    if (b.hi.y <= maxY + 0.05f && b.hi.y > best) best = b.hi.y;
  }
  return best;
}

bool World::raycast(const Vec3& origin, const Vec3& dir, float maxDist, float& t,
                    Vec3& normal, int& boxIndex) const {
  t = maxDist;
  boxIndex = -1;
  bool hit = false;
  Vec3 d = normalize(dir);
  // terrain march
  float step = 0.75f;
  float prevT = 0.0f;
  float prevDiff = origin.y - heightAt(origin.x, origin.z);
  for (float s = step; s <= maxDist; s += step) {
    Vec3 p = origin + d * s;
    float diff = p.y - heightAt(p.x, p.z);
    if (diff <= 0.0f && prevDiff > 0.0f) {
      float f = prevDiff / (prevDiff - diff + 1e-6f);
      t = prevT + (s - prevT) * f;
      normal = normalAt(p.x, p.z);
      hit = true;
      break;
    }
    prevDiff = diff; prevT = s;
  }
  if (hit) return true;

  // boxes
  int gx = (int)floorf((origin.x - m_originX) / m_cell);
  int gz = (int)floorf((origin.z - m_originZ) / m_cell);
  if (gx < 0 || gz < 0 || gx >= m_gridW || gz >= m_gridH) return false;
  std::vector<u32> seen;
  for (int dz = -1; dz <= 1; ++dz)
    for (int dx = -1; dx <= 1; ++dx) {
      int nx = gx + dx, nz = gz + dz;
      if (nx < 0 || nz < 0 || nx >= m_gridW || nz >= m_gridH) continue;
      for (u32 bi : m_grid[(size_t)nz * m_gridW + nx]) {
        if (std::find(seen.begin(), seen.end(), bi) != seen.end()) continue;
        seen.push_back(bi);
        const Box& b = m_boxes[bi];
        // slab test
        f32 t0 = 0.0f, t1 = maxDist;
        int axis = -1;
        f32 sgn = 1.0f;
        bool miss = false;
        const f32 o[3] = {origin.x, origin.y, origin.z};
        const f32 dd[3] = {d.x, d.y, d.z};
        const f32 blo[3] = {b.lo.x, b.lo.y, b.lo.z};
        const f32 bhi[3] = {b.hi.x, b.hi.y, b.hi.z};
        for (int a = 0; a < 3; ++a) {
          if (fabsf(dd[a]) < 1e-8f) {
            if (o[a] < blo[a] || o[a] > bhi[a]) { miss = true; break; }
            continue;
          }
          f32 inv = 1.0f / dd[a];
          f32 ta = (blo[a] - o[a]) * inv;
          f32 tb = (bhi[a] - o[a]) * inv;
          f32 s = -1.0f;
          if (ta > tb) { std::swap(ta, tb); s = 1.0f; }
          if (ta > t0) { t0 = ta; axis = a; sgn = s; }
          if (tb < t1) t1 = tb;
          if (t0 > t1) { miss = true; break; }
        }
        if (miss || axis < 0) continue;
        if (t0 > 0.0f && t0 < t) {
          t = t0;
          normal = Vec3(axis == 0 ? sgn : 0, axis == 1 ? sgn : 0, axis == 2 ? sgn : 0);
          boxIndex = (int)bi;
          hit = true;
        }
      }
    }
  return hit;
}

bool World::resolveCapsule(Vec3& pos, Vec3& vel, float radius, float height, float dt) const {
  // Axis separated resolution against boxes + ground.
  bool moved = false;
  const f32 eps = 1e-3f;

  // --- horizontal (XZ) ---
  for (int iter = 0; iter < 3; ++iter) {
    Vec3 next = pos;
    next.x += vel.x * dt;
    next.z += vel.z * dt;
    int gx = (int)floorf((next.x - m_originX) / m_cell);
    int gz = (int)floorf((next.z - m_originZ) / m_cell);
    if (gx < 0 || gz < 0 || gx >= m_gridW || gz >= m_gridH) { pos = next; continue; }
    bool hit = false;
    for (u32 bi : m_grid[(size_t)gz * m_gridW + gx]) {
      const Box& b = m_boxes[bi];
      // capsule occupies [pos.y, pos.y+height]; box overlap in Y?
      if (b.hi.y <= pos.y + 0.15f || b.lo.y >= pos.y + height) continue;
      float cx = clampf(next.x, b.lo.x, b.hi.x);
      float cz = clampf(next.z, b.lo.z, b.hi.z);
      float dx = next.x - cx, dz = next.z - cz;
      float d2 = dx * dx + dz * dz;
      if (d2 > radius * radius) continue;
      hit = true;
      if (d2 > 1e-8f) {
        float d = sqrtf(d2);
        float push = radius - d;
        next.x += dx / d * push;
        next.z += dz / d * push;
      } else {
        // centre inside: push out along the smallest axis
        float px = std::min(next.x - b.lo.x, b.hi.x - next.x);
        float pz = std::min(next.z - b.lo.z, b.hi.z - next.z);
        if (px < pz) next.x += (next.x - b.center().x > 0 ? 1 : -1) * (px + radius);
        else          next.z += (next.z - b.center().z > 0 ? 1 : -1) * (pz + radius);
      }
    }
    if (hit) {
      vel.x *= 0.0f; vel.z *= 0.0f;
      moved = true;
    }
    pos.x = next.x; pos.z = next.z;
  }

  // --- vertical ---
  float ground = supportHeight(pos.x, pos.z, pos.y + 0.35f);
  float newY = pos.y + vel.y * dt;
  if (newY <= ground + eps) {
    newY = ground;
    if (vel.y < 0.0f) vel.y = 0.0f;
    moved = true;
  }
  // ceiling
  float head = newY + height;
  int gx = (int)floorf((pos.x - m_originX) / m_cell);
  int gz = (int)floorf((pos.z - m_originZ) / m_cell);
  if (gx >= 0 && gz >= 0 && gx < m_gridW && gz < m_gridH) {
    for (u32 bi : m_grid[(size_t)gz * m_gridW + gx]) {
      const Box& b = m_boxes[bi];
      if (b.lo.y >= head || b.hi.y <= newY) continue;
      float cx = clampf(pos.x, b.lo.x, b.hi.x);
      float cz = clampf(pos.z, b.lo.z, b.hi.z);
      float dx = pos.x - cx, dz = pos.z - cz;
      if (dx * dx + dz * dz > radius * radius) continue;
      newY = b.lo.y - height - eps;
      if (vel.y > 0.0f) vel.y = 0.0f;
      moved = true;
    }
  }
  if (newY != pos.y) moved = true;
  pos.y = newY;
  return moved;
}

} // namespace aoh
