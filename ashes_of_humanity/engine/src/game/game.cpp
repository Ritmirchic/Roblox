// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Game orchestrator implementation.
// ============================================================================
#include "game/game.h"
#include "core/util.h"
#include "platform/window.h"
#include <algorithm>
#include <cmath>
#include <cstdio>

namespace aoh {

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
static f32  saturateF(f32 v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
static std::string fmt(const char* f, ...) {
  char buf[256];
  va_list ap;
  va_start(ap, f);
  vsnprintf(buf, sizeof(buf), f, ap);
  va_end(ap);
  return std::string(buf);
}
static Vec3 rarityColor(int r) {
  switch (r) {
    case R_UNCOMMON: return Vec3(0.45f, 0.85f, 0.45f);
    case R_RARE:     return Vec3(0.40f, 0.60f, 0.95f);
    case R_EPIC:     return Vec3(0.72f, 0.42f, 0.92f);
    case R_LEGENDARY:return Vec3(0.98f, 0.72f, 0.25f);
    default:         return Vec3(0.80f, 0.80f, 0.80f);
  }
}

// ---------------------------------------------------------------------------
bool Game::init(void* nativeWindow, int width, int height) {
  RenderSettings rs;
  rs.width = width; rs.height = height;
  rs.quality = m_settings.graphicsQuality;
  rs.shadows = m_settings.shadows;
  rs.bloom = m_settings.bloom;
  rs.fxaa = m_settings.fxaa;
  rs.volumetric = m_settings.volumetric;
  rs.grain = m_settings.grain;
  rs.fov = m_settings.fov;

  m_renderer = new Renderer();
  if (!m_renderer->init(nativeWindow, rs)) {
    LOGW("game: renderer init failed - running in headless logic mode");
    delete m_renderer; m_renderer = nullptr;
  } else {
    if (!m_ui.init(m_renderer)) LOGW("game: UI font failed to build");
  }
  m_audio.init();

  m_items.build();
  m_weapons.build();
  linkWeaponItems(m_items, m_weapons);
  m_quests.build();
  m_crafting.build(m_items);

  if (!loadAssets()) LOGW("game: some assets are missing");

  m_ctx.world = &m_world;
  m_ctx.items = &m_items;
  m_ctx.weapons = &m_weapons;
  m_ctx.player = &m_player;
  m_ctx.mutants = &m_mutants;
  m_ctx.projectiles = &m_projectiles;
  m_ctx.particles = &m_particles;
  m_ctx.decals = &m_decals;
  m_ctx.texts = &m_texts;

  m_ai.build(&m_animLib);
  buildWorld(m_seed);
  spawnWorld();
  spawnPlayer();

  m_animator.setLibrary(&m_animLib);

  // dialogue tree
  m_dialogue.clear();
  {
    DialogueNode a;
    a.speaker = "RELAY";
    a.text = "\"ASHES OF HUMANITY... THIS FREQUENCY IS STILL WATCHED. ARE YOU ALONE?\"";
    a.choices = { "I am alone.", "Who is this?", "Turn it off." };
    a.next = { 1, 2, 4 };
    m_dialogue.push_back(a);
    DialogueNode b;
    b.speaker = "YOU";
    b.text = "Alone. For now.";
    b.choices = { "Keep talking." };
    b.next = { 3 };
    m_dialogue.push_back(b);
    DialogueNode c;
    c.speaker = "RELAY";
    c.text = "I am the last voice on the emergency band. They called us the Cartographers. We mapped the dead zones so the living could pass.";
    c.choices = { "Where is your team?", "Why call now?" };
    c.next = { 3, 5 };
    m_dialogue.push_back(c);
    DialogueNode d;
    d.speaker = "RELAY";
    d.text = "Most of us are gone. What is left is out past the Red Wasteland, at the origin of the signal. If you can walk there, we can talk.";
    d.choices = { "I will walk there.", "I cannot." };
    d.next = { -1, 6 };
    m_dialogue.push_back(d);
    DialogueNode e;
    e.speaker = "YOU";
    e.text = "...No.";
    e.choices = { "Silence the radio." };
    e.next = { -1 };
    m_dialogue.push_back(e);
    DialogueNode f;
    f.speaker = "RELAY";
    f.text = "Because the signal is not a call for help. It is a beacon. Something out there has been answering it for six years, and it is getting closer.";
    f.choices = { "Understood." };
    f.next = { 3 };
    m_dialogue.push_back(f);
    DialogueNode g;
    g.speaker = "YOU";
    g.text = "Then I will find it first.";
    g.choices = { "End transmission." };
    g.next = { -1 };
    m_dialogue.push_back(g);
  }

  setState(GS_MAIN_MENU);
  LOGI("game: initialised (seed %u)", m_seed);
  return true;
}

void Game::shutdown() {
  m_audio.shutdown();
  if (m_renderer) { m_renderer->shutdown(); delete m_renderer; m_renderer = nullptr; }
}

// ---------------------------------------------------------------------------
bool Game::loadAssets() {
  // Textures: one set per material slot index.
  std::vector<std::string> texNames = listDir("assets/textures");
  std::vector<std::string> sets;
  for (const std::string& n : texNames) {
    if (n.size() > 6 && n.compare(n.size() - 6, 6, "_a.aft") == 0)
      sets.push_back(n.substr(0, n.size() - 6));
  }
  std::sort(sets.begin(), sets.end());
  for (size_t i = 0; i < sets.size(); ++i) {
    m_setIndexByName[sets[i]] = (int)i;
    std::map<int, GpuTexture*> full;
    const char* suffix[3] = { "_a.aft", "_n.aft", "_o.aft" };
    for (int k = 0; k < 3; ++k) {
      std::string path = "assets/textures/" + sets[i] + suffix[k];
      TextureData td;
      bool ok = false;
      std::vector<u8> data = readFile(path, &ok);
      if (!ok || data.empty()) continue;
      if (!deserializeTexture(data.data(), data.size(), td)) continue;
      if (!m_renderer) continue;
      GpuTexture* t = m_renderer->createTexture(td, sets[i] + suffix[k]);
      if (t) full[k] = t;
    }
    if (!full.empty()) m_setCacheFull[(int)i] = full;
  }
  LOGI("assets: %d texture sets", (int)m_setCacheFull.size());

  // Branding (menu / loading artwork) lives outside the material set table.
  {
    const char* uiNames[3] = { "menu_background", "loading_screen", "title_logo" };
    for (int i = 0; i < 3; ++i) {
      std::string path = std::string("assets/ui/") + uiNames[i] + ".aft";
      bool ok = false;
      std::vector<u8> data = readFile(path, &ok);
      if (!ok || data.empty()) continue;
      TextureData td;
      if (!deserializeTexture(data.data(), data.size(), td)) continue;
      if (!m_renderer) continue;
      GpuTexture* t = m_renderer->createTexture(td, uiNames[i]);
      if (i == 0) m_menuBg = t;
      else if (i == 1) m_loadingBg = t;
      else m_titleLogo = t;
    }
  }

  // Meshes.
  std::vector<std::string> meshNames = listDir("assets/meshes");
  int loaded = 0;
  for (const std::string& n : meshNames) {
    if (n.size() < 5 || n.compare(n.size() - 4, 4, ".afm") != 0) continue;
    std::string path = "assets/meshes/" + n;
    bool ok = false;
    std::vector<u8> data = readFile(path, &ok);
    if (!ok || data.empty()) continue;
    Mesh m;
    if (!deserializeMesh(data.data(), data.size(), m)) { LOGE("assets: bad mesh %s", n.c_str()); continue; }
    std::string key = n.substr(0, n.size() - 4);
    m_assets.meshes[key] = m;
    if (m_renderer) {
      GpuMesh* g = m_renderer->createMesh(m);
      if (!g) continue;
      m_meshCache[key] = g;
    }
    loaded++;
  }
  LOGI("assets: %d meshes", loaded);

  // Animations.
  std::vector<std::string> animNames = listDir("assets/animations");
  int anims = 0;
  for (const std::string& n : animNames) {
    if (n.size() < 5 || n.compare(n.size() - 4, 4, ".afa") != 0) continue;
    std::string key = n.substr(0, n.size() - 4);
    if (m_animLib.loadFromFile("assets/animations/" + n, key)) anims++;
  }
  LOGI("assets: %d animation sets", anims);
  return loaded > 0;
}

// ---------------------------------------------------------------------------
void Game::buildWorld(u32 seed) {
  m_world.generate(seed);
  LOGI("world: %d sites, %d collision boxes", (int)m_world.sites().size(),
       (int)m_world.boxes().size());

  // ---- terrain chunks ----------------------------------------------------
  const float CHUNK = 260.0f;
  const int CHUNKS = 8;                  // 8 x 8 chunks covering +-1040 m
  const int SEG = 26;
  for (int cz = 0; cz < CHUNKS; ++cz) {
    for (int cx = 0; cx < CHUNKS; ++cx) {
      float ox = (cx - CHUNKS * 0.5f + 0.5f) * CHUNK;
      float oz = (cz - CHUNKS * 0.5f + 0.5f) * CHUNK;
      Mesh m;
      m.name = "terrain";
      for (int z = 0; z <= SEG; ++z) {
        for (int x = 0; x <= SEG; ++x) {
          float fx = (float)x / SEG, fz = (float)z / SEG;
          float wx = ox - CHUNK * 0.5f + fx * CHUNK;
          float wz = oz - CHUNK * 0.5f + fz * CHUNK;
          Vertex v;
          v.pos = Vec3(wx, m_world.heightAt(wx, wz), wz);
          v.nrm = m_world.normalAt(wx, wz);
          v.uv = Vec2(wx * 0.08f, wz * 0.08f);
          m.verts.push_back(v);
        }
      }
      for (int z = 0; z < SEG; ++z) {
        for (int x = 0; x < SEG; ++x) {
          u32 i0 = (u32)(z * (SEG + 1) + x);
          u32 i1 = i0 + 1, i2 = i0 + (u32)SEG + 1, i3 = i2 + 1;
          m.idx.push_back(i0); m.idx.push_back(i2); m.idx.push_back(i1);
          m.idx.push_back(i1); m.idx.push_back(i2); m.idx.push_back(i3);
        }
      }
      SubMesh sm; sm.firstIndex = 0; sm.indexCount = (u32)m.idx.size(); sm.material = 0;
      m.subMeshes.push_back(sm);
      Material mat;
      mat.name = "Ground";
      int region = m_world.regionAt(ox, oz);
      mat.albedo = Vec4(0.36f, 0.38f, 0.28f, 1.0f);
      mat.roughness = 0.94f;
      m.materials.push_back(mat);
      m.computeBounds();
      TerrainChunk ch;
      ch.mesh = m_renderer ? m_renderer->createMesh(m) : nullptr;
      ch.region = region;
      ch.bounds = m.bounds;
      m_chunks.push_back(ch);
    }
  }

  // ---- static site meshes + collision ------------------------------------
  for (const SiteDef& s : m_world.sites()) {
    const Mesh* cpu = m_assets.mesh(s.mesh);
    if (!cpu) { LOGW("world: missing mesh '%s'", s.mesh.c_str()); continue; }
    auto it = m_meshCache.find(s.mesh);
    GpuMesh* g = (it == m_meshCache.end()) ? nullptr : it->second;
    float y = m_world.heightAt(s.pos.x, s.pos.z);
    Mat4 xf = Mat4::identityMatrix().translated(Vec3(s.pos.x, y, s.pos.z));
    if (s.yaw != 0.0f) {
      Mat4 r = Mat4::identityMatrix();
      f32 c = cosf(s.yaw), sn = sinf(s.yaw);
      r.at(0,0) = c;  r.at(0,2) = sn;
      r.at(2,0) = -sn; r.at(2,2) = c;
      xf = r.translated(Vec3(s.pos.x, y, s.pos.z));
    }
    if (s.scale != 1.0f) xf = xf.scaled(Vec3(s.scale, s.scale, s.scale));
    StaticInstance inst;
    inst.mesh = g;
    inst.model = xf;
    inst.region = m_world.regionAt(s.pos.x, s.pos.z);
    inst.solid = s.solid;
    m_statics.push_back(inst);

    // collision from the authored mesh
    if (s.solid) {
      m_world.addMeshCollision(*cpu, xf, 0.45f);
    }
  }
  LOGI("world: %d static instances", (int)m_statics.size());
}

// ---------------------------------------------------------------------------
void Game::spawnWorld() {
  // Mutant populations per region.
  for (int r = 0; r < m_world.regions().size(); ++r) {
    const RegionDef& reg = m_world.region(r);
    int count = (int)(reg.hostility * 16.0f);
    m_ai.spawnPatrol(m_ctx, r, m_seed + (u32)r * 977u, count);
  }
  LOGI("world: %d mutants spawned", (int)m_mutants.size());
}

// ---------------------------------------------------------------------------
void Game::spawnPlayer() {
  Vec3 start(-620.0f, 0.0f, 430.0f);
  start.y = m_world.heightAt(start.x, start.z) + 0.2f;
  m_playerCtrl.spawn(m_player, start);
  m_player.yaw = 2.2f;
  m_player.stats.hunger = 78.0f;
  m_player.stats.thirst = 82.0f;
  m_player.stats.fatigue = 15.0f;
  m_player.stats.stress = 10.0f;

  // Starting kit.
  inventoryAdd(m_player, m_items, m_items.find("Combat Knife"), 1);
  inventoryAdd(m_player, m_items, m_items.find("Bandage"), 4);
  inventoryAdd(m_player, m_items, m_items.find("Canned Food"), 2);
  inventoryAdd(m_player, m_items, m_items.find("Water Bottle"), 1);
  inventoryAdd(m_player, m_items, m_items.find("Pistol"), 1);
  inventoryAdd(m_player, m_items, m_items.find("Pistol Ammo"), 24);
  m_player.equip[EQ_MAIN].defId = m_items.find("Pistol");
  m_player.equip[EQ_MAIN].count = 1;
  m_player.equip[EQ_MAIN].ammo = 15;
  m_player.equip[EQ_BACK].defId = m_items.find("Backpack");
  m_player.equip[EQ_BACK].count = 1;
}

// ---------------------------------------------------------------------------
void Game::setState(GameState s) {
  m_state = s;
  if (m_window) m_window->setCursorVisible(s != GS_PLAYING && s != GS_CUTSCENE);
  if (m_window) m_window->setCursorLocked(s == GS_PLAYING || s == GS_CUTSCENE);
}

// ---------------------------------------------------------------------------
void Game::handleHotkeys() {
  if (Input::keyPressed(KEY_ESCAPE)) {
    switch (m_state) {
      case GS_PLAYING: setState(GS_PAUSED); break;
      case GS_PAUSED: case GS_INVENTORY: case GS_SKILLS: case GS_CRAFTING:
      case GS_MAP: case GS_JOURNAL: case GS_SETTINGS: case GS_BUILD:
        setState(GS_PLAYING); break;
      default: break;
    }
  }
  if (m_state != GS_PLAYING) return;

  if (Input::keyPressed(KEY_TAB)) setState(GS_INVENTORY);
  if (Input::keyPressed(KEY_M)) setState(GS_MAP);
  if (Input::keyPressed(KEY_J)) setState(GS_JOURNAL);
  if (Input::keyPressed(KEY_K)) setState(GS_SKILLS);
  if (Input::keyPressed(KEY_C) && Input::keyDown(KEY_LSHIFT)) setState(GS_CRAFTING);
  if (Input::keyPressed(KEY_B)) setState(GS_BUILD);
  if (Input::keyPressed(KEY_V)) m_firstPerson = !m_firstPerson;
  if (Input::keyPressed(KEY_F3)) m_showPerf = !m_showPerf;
  if (Input::keyPressed(KEY_F)) {
    // quick heal
    if (inventoryCount(m_player, m_items.find("Bandage")) > 0 &&
        m_player.body.totalBleed() > 0.0f) {
      inventoryRemove(m_player, m_items.find("Bandage"), 1);
      for (int i = 0; i < BP_COUNT; ++i) m_player.body.bleed[i] = 0.0f;
      m_toast = "Bleeding stopped"; m_toastTimer = 2.0f;
    }
  }
  if (Input::keyPressed(KEY_R)) m_combat.startReload(m_ctx, m_player);
  if (Input::mouseDown(MOUSE_RIGHT)) m_player.ads = true; else m_player.ads = false;
  if (Input::mousePressed(MOUSE_LEFT)) m_combat.tryFire(m_ctx, m_player, m_playerCtrl);
  if (Input::mouseDown(MOUSE_LEFT)) {
    // automatic weapons keep firing
    ItemStack& gun = m_player.equip[EQ_MAIN];
    if (gun.defId >= 0) {
      const ItemDef& idef = m_items.def(gun.defId);
      if (idef.weaponId >= 0 && m_weapons.def(idef.weaponId).fireMode == 1)
        m_combat.tryFire(m_ctx, m_player, m_playerCtrl);
    }
  }
}

// ---------------------------------------------------------------------------
void Game::update(f32 dt) {
  m_time += dt;
  Input::beginFrame();
  handleHotkeys();

  bool uiOpen = (m_state != GS_PLAYING);
  bool playing = (m_state == GS_PLAYING || m_state == GS_BUILD);

  if (playing) {
    m_playTime += dt;
    m_ctx.time = m_time;
    m_ctx.timeOfDay = fmodf(m_time / 60.0f, 24.0f);
  }

  // ---- player ------------------------------------------------------------
  if (m_state == GS_PLAYING || m_state == GS_BUILD) {
    m_playerCtrl.update(m_player, m_world, dt, !uiOpen, false);
    // footsteps
    if (m_player.state == AS_WALK || m_player.state == AS_RUN) {
      if (m_player.footstepDist <= 0.01f) {
        m_audio.play(SND_FOOTSTEP, m_player.pos, 0.35f, 0.9f + 0.2f * ((rand() % 100) / 100.0f));
        m_player.footstepDist = 1.0f;
      }
    }
  }

  // ---- combat ------------------------------------------------------------
  m_combat.update(m_ctx, dt);
  if (m_state == GS_PLAYING) {
    m_ai.update(m_ctx, dt);
    m_quests.update(m_ctx, m_player);
    m_quests.onReach(m_ctx, m_player.pos);
  }
  m_audio.setListener(m_player.pos, m_playerCtrl.forwardVector(m_player));

  // ---- survival ----------------------------------------------------------
  if (m_state == GS_PLAYING || m_state == GS_DEATH) {
    int reg = m_world.regionAt(m_player.pos.x, m_player.pos.z);
    const RegionDef& r = m_world.region(reg);
    f32 ambient = m_weather.temperature + (r.id == REGION_WASTELAND ? 6.0f : 0.0f) -
                  (m_weather.rain > 0.4f ? 3.0f : 0.0f);
    m_ctx.radiationRate = r.radiation * 0.35f + (m_weather.kind == 5 ? 1.6f : 0.0f);
    m_playerCtrl.updateSurvival(m_player, dt, ambient, m_ctx.radiationRate, dt);
    if (m_player.dead && m_state != GS_DEATH) setState(GS_DEATH);
  }

  // ---- weather -----------------------------------------------------------
  updateWeather(dt);

  // ---- boss arenas -------------------------------------------------------
  if (m_state == GS_PLAYING) {
    for (BossArena& a : m_world.bossArenas()) {
      if (a.triggered) continue;
      if (dist2D(a.pos, m_player.pos) > a.radius * 1.6f) continue;
      a.triggered = true;
      Vec3 p = a.pos;
      p.y = m_world.heightAt(p.x, p.z);
      m_ai.spawn(m_ctx, a.bossIndex, p, a.bossIndex - 10);
      m_toast = a.name + " - something is waiting";
      m_toastTimer = 4.0f;
      m_audio.play(SND_BOSS_ROAR, p, 0.9f);
      LOGI("boss: %s engaged (species %d)", a.name.c_str(), a.bossIndex);
    }
  }

  // ---- interaction -------------------------------------------------------
  updateInteraction(dt);
  updateLoot();
  if (m_state == GS_PLAYING) updateWorldEvents(dt);
  if (m_state == GS_BUILD) updateBuildMode(dt);

  // ---- camera ------------------------------------------------------------
  updateCamera(dt);

  // ---- dialogue / cutscene ----------------------------------------------
  if (m_state == GS_DIALOGUE) updateDialogue();
  if (m_state == GS_CUTSCENE) updateCutscene(dt);

  // ---- audio -------------------------------------------------------------
  m_audio.update(dt);
  m_audio.setAmbience(m_weather.wind * 0.5f + m_weather.rain * 0.5f,
                      0.15f + 0.25f * (1.0f - m_weather.cloud), m_weather.rain);

  // ---- autosave ----------------------------------------------------------
  m_autosaveTimer += dt;
  if (m_autosaveTimer > 120.0f) { m_autosaveTimer = 0.0f; autosave(); }

  if (m_toastTimer > 0.0f) m_toastTimer -= dt;
  if (m_damageFlash > 0.0f) m_damageFlash = std::max(0.0f, m_damageFlash - dt * 1.6f);
}

// ---------------------------------------------------------------------------
void Game::updateWeather(f32 dt) {
  // Slow weather drift.
  m_weather.cloud = saturateF(m_weather.cloud + (0.02f * sinf(m_time * 0.021f)) * dt);
  f32 targetRain = 0.0f;
  switch (m_weather.kind) {
    case 1: targetRain = 0.0f; break;
    case 2: targetRain = 0.55f; break;
    case 3: targetRain = 1.0f; break;
    case 4: targetRain = 0.05f; break;
    case 5: targetRain = 0.2f; break;
    default: targetRain = 0.0f; break;
  }
  m_weather.rain += (targetRain - m_weather.rain) * saturateF(dt * 0.25f);
  m_weather.fog = 0.006f + m_weather.cloud * 0.006f + m_weather.rain * 0.010f +
                  (m_weather.kind == 4 ? 0.020f : 0.0f) + (m_weather.kind == 5 ? 0.008f : 0.0f);
  m_weather.wind = 0.25f + 0.45f * m_weather.cloud + (m_weather.kind == 3 ? 0.5f : 0.0f);
  m_weather.temperature = 14.0f - 6.0f * m_weather.cloud + 3.0f * (m_weather.kind == 5 ? 1.0f : 0.0f);
}

// ---------------------------------------------------------------------------
void Game::updateInteraction(f32 dt) {
  if (m_state != GS_PLAYING) return;
  Vec3 eye = m_playerCtrl.eyePosition(m_player);
  Vec3 fwd = m_playerCtrl.forwardVector(m_player);
  float t; Vec3 n; int bi;
  bool hit = m_world.raycast(eye, fwd, 3.2f, t, n, bi);
  m_player.interactTarget.clear();
  if (hit) {
    Vec3 p = eye + fwd * t;
    // loot containers sit at site positions
    for (const SiteDef& s : m_world.sites()) {
      if (!s.loot) continue;
      float sy = m_world.heightAt(s.pos.x, s.pos.z);
      if (dist2D(Vec3(s.pos.x, sy, s.pos.z), p) < 2.6f) {
        m_player.interactTarget = "container";
        break;
      }
    }
  }
  if (!m_player.interactTarget.empty() && Input::keyPressed(KEY_E)) {
    // open the container
    for (LootSpawn& l : m_world.loot()) {
      if (l.used) continue;
      if (dist2D(l.pos, m_player.pos) < 3.0f) { l.used = true; break; }
    }
    // grant a small cache
    int tier = 0;
    for (const SiteDef& s : m_world.sites()) {
      if (s.loot && dist2D(Vec3(s.pos.x, 0, s.pos.z), m_player.pos) < 3.0f) { tier = s.tier; break; }
    }
    static const char* common[] = { "Scrap Metal", "Cloth Scrap", "Wood Plank", "Bandage",
                                    "Canned Food", "Pistol Ammo", "Water Bottle" };
    int rolls = 2 + (rand() % 3) + tier;
    for (int i = 0; i < rolls; ++i) {
      const char* nm = common[rand() % 7];
      int id = m_items.find(nm);
      if (id >= 0) {
        inventoryAdd(m_player, m_items, id, 1 + (rand() % 3));
        m_quests.onCollect(m_ctx, id);
      }
    }
    if (tier >= 2 && (rand() % 100) < 35) {
      const char* rare[] = { "Field Medkit", "Combat Helmet", "Battery", "Submachine Gun" };
      int id = m_items.find(rare[rand() % 4]);
      if (id >= 0) inventoryAdd(m_player, m_items, id, 1);
    }
    m_audio.play(SND_PICKUP, m_player.pos, 0.6f);
    m_toast = "Searched the container";
    m_toastTimer = 2.2f;
  }
}

// ---------------------------------------------------------------------------
void Game::updateLoot() {
  // Keep the loot list in sync with the sites.
  if (m_world.loot().size() == m_world.sites().size()) return;
  m_world.loot().clear();
  u32 id = 0;
  for (const SiteDef& s : m_world.sites()) {
    if (!s.loot) continue;
    LootSpawn l;
    l.pos = Vec3(s.pos.x, m_world.heightAt(s.pos.x, s.pos.z), s.pos.z);
    l.tier = s.tier;
    l.id = id++;
    m_world.loot().push_back(l);
  }
}

// ---------------------------------------------------------------------------
void Game::updateWorldEvents(f32 dt) {
  static f32 eventTimer = 45.0f;
  eventTimer -= dt;
  if (eventTimer > 0.0f) return;
  eventTimer = 90.0f + (float)(rand() % 120);
  int kind = rand() % 4;
  if (kind == 0) {
    // horde
    for (int i = 0; i < 8; ++i) {
      f32 a = (float)(rand() % 6283) / 1000.0f;
      Vec3 p = m_player.pos + Vec3(cosf(a) * 55.0f, 0, sinf(a) * 55.0f);
      p.y = m_world.heightAt(p.x, p.z);
      m_ai.spawn(m_ctx, rand() % 6, p);
    }
    m_toast = "Movement in the dark";
    m_toastTimer = 3.0f;
  } else if (kind == 1) {
    m_weather.kind = 5;
    m_toast = "A radiation front is moving in";
    m_toastTimer = 3.5f;
  } else if (kind == 2) {
    m_weather.kind = 3;
    m_toast = "Storm front";
    m_toastTimer = 3.0f;
  } else {
    m_weather.kind = 0;
    m_toast = "The air clears";
    m_toastTimer = 3.0f;
  }
}

// ---------------------------------------------------------------------------
void Game::updateBuildMode(f32 dt) {
  Vec3 fwd = m_playerCtrl.forwardVector(m_player);
  Vec3 target = m_player.pos + fwd * 3.2f;
  target.y = m_world.heightAt(target.x, target.z);
  // snap to a 0.5 m grid
  target.x = roundf(target.x * 2.0f) / 2.0f;
  target.z = roundf(target.z * 2.0f) / 2.0f;
  m_buildPos = target;
  m_buildYaw = m_player.yaw + PI * 0.5f;

  // validity: no overlap with an existing piece and the ground is not too steep
  m_buildValid = true;
  for (const PlacedPiece& p : m_pieces) {
    if (dist2D(p.pos, target) < 2.0f) { m_buildValid = false; break; }
  }
  if (Input::mousePressed(MOUSE_LEFT) && m_buildValid) {
    PlacedPiece piece;
    piece.piece = m_buildPiece;
    piece.pos = m_buildPos;
    piece.yaw = m_buildYaw;
    const char* meshName = "prop_barricades";
    switch (m_buildPiece) {
      case BPB_BARRIER: meshName = "prop_barricades"; break;
      case BPB_CRATE:   meshName = "prop_crates"; break;
      case BPB_SANDBAG: meshName = "prop_barricades"; break;
      case BPB_TORCH:   meshName = "prop_street"; break;
      case BPB_WALL:    meshName = "bld_small_shed"; break;
      default: break;
    }
    auto it = m_meshCache.find(meshName);
    if (it != m_meshCache.end()) {
      piece.meshIndex = 0;
      StaticInstance inst;
      inst.mesh = it->second;
      inst.model = Mat4::identityMatrix().translated(piece.pos);
      inst.region = m_world.regionAt(piece.pos.x, piece.pos.z);
      inst.solid = true;
      m_statics.push_back(inst);
      const Mesh* src = m_assets.mesh(meshName);
      if (src) m_world.addMeshCollision(*src, inst.model, 0.45f);
      m_pieces.push_back(piece);
      m_audio.play(SND_UI_CLICK, m_player.pos, 0.4f);
      m_toast = "Piece placed";
      m_toastTimer = 1.4f;
    }
  }
  if (Input::keyPressed(KEY_1)) m_buildPiece = BPB_BARRIER;
  if (Input::keyPressed(KEY_2)) m_buildPiece = BPB_CRATE;
  if (Input::keyPressed(KEY_3)) m_buildPiece = BPB_SANDBAG;
  if (Input::keyPressed(KEY_4)) m_buildPiece = BPB_TORCH;
  if (Input::keyPressed(KEY_5)) m_buildPiece = BPB_WALL;
  if (Input::keyPressed(KEY_ENTER)) {
    // confirm and leave
    setState(GS_PLAYING);
  }
}

// ---------------------------------------------------------------------------
void Game::updateCamera(f32 dt) {
  (void)dt;
}

// ---------------------------------------------------------------------------
void Game::updateDialogue() {
  if (m_dialogueNode < 0 || m_dialogueNode >= (int)m_dialogue.size()) {
    setState(GS_PLAYING);
    return;
  }
  const DialogueNode& n = m_dialogue[m_dialogueNode];
  if (Input::keyPressed(KEY_ENTER) || Input::keyPressed(KEY_SPACE) ||
      Input::keyPressed(KEY_E)) {
    if (m_dialogueChoice < (int)n.next.size()) {
      int next = n.next[m_dialogueChoice];
      if (next < 0) setState(GS_PLAYING);
      else startDialogue(next);
    } else {
      setState(GS_PLAYING);
    }
  }
  for (size_t i = 0; i < n.choices.size() && i < 4; ++i) {
    if (Input::keyPressed((Key)(KEY_1 + (int)i))) {
      m_dialogueChoice = (int)i;
      int next = (m_dialogueChoice < (int)n.next.size()) ? n.next[m_dialogueChoice] : -1;
      if (next < 0) setState(GS_PLAYING);
      else startDialogue(next);
    }
  }
}

void Game::startDialogue(int node) {
  m_dialogueNode = node;
  m_dialogueChoice = 0;
  setState(GS_DIALOGUE);
}

// ---------------------------------------------------------------------------
void Game::startCutscene(int index) {
  m_cutsceneActive = true;
  m_cutsceneIndex = index;
  m_cutsceneTime = 0.0f;
  setState(GS_CUTSCENE);
}

void Game::updateCutscene(f32 dt) {
  m_cutsceneTime += dt;
  if (Input::keyPressed(KEY_ESCAPE) || Input::keyPressed(KEY_ENTER) ||
      Input::keyPressed(KEY_SPACE)) {
    m_cutsceneActive = false;
    setState(GS_PLAYING);
  }
}

// ---------------------------------------------------------------------------
void Game::autosave() {
  SaveData d;
  SaveSystem::capture(d, m_player, m_quests, m_ctx.timeOfDay, m_playTime, m_seed, m_settings);
  if (SaveSystem::write(d, 0)) LOGI("save: autosaved slot 0");
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
void Game::submitMeshByName(const std::string& name, const Mat4& xform) {
  auto it = m_meshCache.find(name);
  if (it == m_meshCache.end()) return;
  GpuMesh* g = it->second;
  for (const SubMesh& sm : g->subMeshes) {
    const Material& mat = g->materials[sm.material];
    TextureSet ts;
    auto sit = m_setCacheFull.find(mat.albedoTex);
    if (sit != m_setCacheFull.end()) {
      auto a = sit->second.find(0);
      auto n = sit->second.find(1);
      auto o = sit->second.find(2);
      if (a != sit->second.end()) ts.albedo = a->second;
      if (n != sit->second.end()) ts.normal = n->second;
      if (o != sit->second.end()) ts.orm = o->second;
    }
    m_renderer->submitMesh(g, xform, mat, ts, (int)(&sm - &g->subMeshes[0]));
  }
}

void Game::renderWorld() {
  // ---- terrain ----------------------------------------------------------
  for (const TerrainChunk& c : m_chunks) {
    if (!c.mesh) continue;
    float cx = (c.bounds.lo.x + c.bounds.hi.x) * 0.5f;
    float cz = (c.bounds.lo.z + c.bounds.hi.z) * 0.5f;
    if (dist2D(Vec3(cx, 0, cz), m_player.pos) > 560.0f) continue;
    int reg = m_world.regionAt(cx, cz);
    static const char* setNames[] = { "grass", "grass", "asphalt", "concrete",
                                      "tarmac_cracked", "dirt" };
    auto sit = m_setIndexByName.find(setNames[reg]);
    TextureSet ts;
    if (sit != m_setIndexByName.end()) {
      auto full = m_setCacheFull.find(sit->second);
      if (full != m_setCacheFull.end()) {
        auto a = full->second.find(0);
        auto n = full->second.find(1);
        auto o = full->second.find(2);
        if (a != full->second.end()) ts.albedo = a->second;
        if (n != full->second.end()) ts.normal = n->second;
        if (o != full->second.end()) ts.orm = o->second;
      }
    }
    for (size_t si = 0; si < c.mesh->subMeshes.size(); ++si) {
      const Material& mat = c.mesh->materials[c.mesh->subMeshes[si].material];
      m_renderer->submitMesh(c.mesh, Mat4::identityMatrix(), mat, ts, (int)si);
    }
  }

  // ---- static instances -------------------------------------------------
  for (const StaticInstance& inst : m_statics) {
    if (!inst.mesh) continue;
    Vec3 ip(inst.model.at(0, 3), inst.model.at(1, 3), inst.model.at(2, 3));
    if (dist2D(ip, m_player.pos) > 460.0f) continue;
    drawStatic(inst);
  }

  // ---- mutants ----------------------------------------------------------
  std::vector<Mat4> boneMats;
  for (Mutant& m : m_mutants) {
    if (m.dead && m.animTime > 8.0f) continue;
    if (dist2D(m.pos, m_player.pos) > 340.0f) continue;
    const SpeciesDef& sp = m_ai.species(m.species);
    auto it = m_meshCache.find(sp.mesh);
    if (it == m_meshCache.end()) continue;
    GpuMesh* g = it->second;
    if (!g->skinned) continue;
    m_animator.setSpecies(sp.animFile);
    const Mesh* cpuMesh = m_assets.mesh(sp.mesh);
    if (!cpuMesh) continue;
    m_animator.sample(cpuMesh->bones, m.anim, m.animTime, boneMats);
    int skinRow = m_renderer ? m_renderer->allocSkinRow(boneMats) : -1;
    Mat4 r = Mat4::identityMatrix();
    f32 c = cosf(m.yaw), s = sinf(m.yaw);
    r.at(0,0) = c; r.at(0,2) = s; r.at(2,0) = -s; r.at(2,2) = c;
    Mat4 model = r.translated(m.pos);
    for (size_t si = 0; si < g->subMeshes.size(); ++si) {
      const Material& mat = g->materials[g->subMeshes[si].material];
      m_renderer->submitSkinned(g, model, boneMats, mat, resolveTextures(mat), (int)si, skinRow);
    }
  }

  // ---- player body ------------------------------------------------------
  if (!m_firstPerson && (m_state == GS_PLAYING || m_state == GS_BUILD)) {
    auto it = m_meshCache.find("char_player");
    if (it != m_meshCache.end() && it->second->skinned) {
      GpuMesh* g = it->second;
      m_animator.setSpecies("player");
      int clip = 0;
      switch (m_player.state) {
        case AS_RUN: clip = 2; break;
        case AS_WALK: case AS_CROUCH: case AS_CRAWL: case AS_SWIM: clip = 1; break;
        case AS_DEAD: clip = 5; break;
        default: clip = 0; break;
      }
      const Mesh* cpuMesh = m_assets.mesh("char_player");
      if (cpuMesh) m_animator.sample(cpuMesh->bones, clip, m_time, boneMats);
      int skinRow = m_renderer ? m_renderer->allocSkinRow(boneMats) : -1;
      Mat4 r = Mat4::identityMatrix();
      f32 c = cosf(m_player.yaw), s = sinf(m_player.yaw);
      r.at(0,0) = c; r.at(0,2) = s; r.at(2,0) = -s; r.at(2,2) = c;
      Mat4 model = r.translated(m_player.pos);
      for (size_t si = 0; si < g->subMeshes.size(); ++si) {
        const Material& mat = g->materials[g->subMeshes[si].material];
        m_renderer->submitSkinned(g, model, boneMats, mat, resolveTextures(mat), (int)si, skinRow);
      }
    }
  }

  // ---- weapon in hand ---------------------------------------------------
  if ((m_state == GS_PLAYING) && m_player.equip[EQ_MAIN].defId >= 0) {
    const ItemDef& idef = m_items.def(m_player.equip[EQ_MAIN].defId);
    if (!idef.mesh.empty()) {
      CameraState cam;
      m_playerCtrl.buildCamera(m_player, m_world, cam, m_firstPerson, m_settings.fov);
      Mat4 r = Mat4::identityMatrix();
      f32 c = cosf(m_player.yaw), s = sinf(m_player.yaw);
      r.at(0,0) = c; r.at(0,2) = s; r.at(2,0) = -s; r.at(2,2) = c;
      Vec3 wp = m_playerCtrl.eyePosition(m_player) + cam.forward * 0.42f +
                cam.right * 0.20f - cam.up * 0.16f;
      Mat4 model = r.translated(wp);
      auto it = m_meshCache.find(idef.mesh);
      if (it != m_meshCache.end()) {
        GpuMesh* g = it->second;
        for (size_t si = 0; si < g->subMeshes.size(); ++si) {
          const Material& mat = g->materials[g->subMeshes[si].material];
          m_renderer->submitMesh(g, model, mat, resolveTextures(mat), (int)si);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
void Game::drawStatic(const StaticInstance& inst) {
  if (!inst.mesh) return;
  for (size_t si = 0; si < inst.mesh->subMeshes.size(); ++si) {
    const Material& mat = inst.mesh->materials[inst.mesh->subMeshes[si].material];
    m_renderer->submitMesh(inst.mesh, inst.model, mat, resolveTextures(mat), (int)si);
  }
}

TextureSet Game::resolveTextures(const Material& mat) {
  TextureSet ts;
  auto sit = m_setCacheFull.find(mat.albedoTex);
  if (sit == m_setCacheFull.end()) return ts;
  auto a = sit->second.find(0);
  auto n = sit->second.find(1);
  auto o = sit->second.find(2);
  if (a != sit->second.end()) ts.albedo = a->second;
  if (n != sit->second.end()) ts.normal = n->second;
  if (o != sit->second.end()) ts.orm = o->second;
  return ts;
}


} // namespace aoh
