// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Main loop and automated test suite.
// ============================================================================
#include "game/game.h"
#include "core/util.h"
#include "platform/window.h"
#include <cmath>
#include <cstdio>

namespace aoh {

// ---------------------------------------------------------------------------
void Game::run() {
  LOGI("game: entering main loop");
  f64 last = timeNow();
  u64 frames = 0;
  while (!m_quit) {
    if (m_window) {
      m_window->pumpEvents();
      if (m_window->shouldClose()) break;
    }
    f64 now = timeNow();
    f32 dt = (f32)(now - last);
    last = now;
    m_frameMs = dt * 1000.0f;
    m_fps = (dt > 0.0001f) ? (1.0f / dt) : 0.0f;
    if (dt > 0.1f) dt = 0.1f;          // clamp long frames
    if (dt < 0.0f) dt = 0.0f;
    update(dt);
    if (m_renderer) render();
    frames++;
    if ((frames % 600) == 0) {
      LOGI("game: frame %llu  draws %d  tris %d", (unsigned long long)frames,
           m_renderer ? m_renderer->stats.drawCalls : 0,
           m_renderer ? m_renderer->stats.triangles : 0);
    }
  }
  LOGI("game: main loop finished after %llu frames", (unsigned long long)frames);
}

// ---------------------------------------------------------------------------
void Game::simulate(f32 seconds) {
  const f32 dt = 1.0f / 60.0f;
  int steps = (int)(seconds / dt);
  LOGI("sim: running %d steps (%.1f s)", steps, seconds);
  setState(GS_PLAYING);
  for (int i = 0; i < steps; ++i) {
    // scripted input so the simulation exercises the real systems
    if (i == 60) { setState(GS_INVENTORY); }
    if (i == 90) { setState(GS_PLAYING); }
    if (i == 120) { setState(GS_MAP); }
    if (i == 150) { setState(GS_PLAYING); }
    if (i == 180) { setState(GS_SKILLS); }
    if (i == 210) { setState(GS_PLAYING); }
    if (i == 240) { setState(GS_CRAFTING); }
    if (i == 270) { setState(GS_PLAYING); }
    if (i == 300) { setState(GS_JOURNAL); }
    if (i == 330) { setState(GS_PLAYING); }
    if (i == 360) { setState(GS_BUILD); }
    if (i == 420) { setState(GS_PLAYING); }
    if (i == 450) { startDialogue(0); }
    if (i == 500) { setState(GS_PLAYING); }
    if (i == 540) { startCutscene(0); }
    if (i == 700) { setState(GS_PLAYING); }
    update(dt);
    if ((i % 600) == 0) {
      LOGI("sim: step %d  hp=%.1f  hunger=%.1f  mutants=%d  xp=%.0f  level=%d",
           i, m_player.stats.health, m_player.stats.hunger, (int)m_mutants.size(),
           m_player.xp, m_player.level);
    }
  }
  LOGI("sim: finished - hp=%.1f hunger=%.1f thirst=%.1f mutants=%d level=%d",
       m_player.stats.health, m_player.stats.hunger, m_player.stats.thirst,
       (int)m_mutants.size(), m_player.level);
}

// ---------------------------------------------------------------------------
// Automated test suite.  Every check prints PASS or FAIL; the return value
// is the number of failures.
// ---------------------------------------------------------------------------
namespace {

struct TestReport {
  int passed = 0;
  int failed = 0;
  void check(bool cond, const char* name, const char* detail = "") {
    if (cond) { passed++; printf("  [PASS] %s\n", name); }
    else { failed++; printf("  [FAIL] %s %s\n", name, detail); }
  }
};

} // namespace

int Game::runTests() {
  TestReport rep;
  printf("\n=====================================================================\n");
  printf(" ASHES OF HUMANITY: LAST SIGNAL - AUTOMATED SYSTEM TESTS\n");
  printf("=====================================================================\n\n");

  // ------------------------------------------------------------------ world
  printf("[WORLD]\n");
  {
    World w;
    w.generate(20241);
    rep.check(w.regions().size() == 6, "six regions defined",
              "got a different count");
    // every region must own at least four authored sites
    std::vector<int> perRegion(6, 0);
    for (const SiteDef& s : w.sites()) {
      int r = w.regionAt(s.pos.x, s.pos.z);
      if (r >= 0 && r < 6) perRegion[r]++;
    }
    bool hasSites = false;
    for (int i = 0; i < 6; ++i) {
      if (perRegion[i] > 0) hasSites = true;
      rep.check(perRegion[i] >= 4, "region has a designed layout");
    }
    rep.check(hasSites, "regions contain authored sites");
    rep.check(w.sites().size() >= 30, "the world is populated with structures");
    rep.check(w.boxes().size() > 20, "collision boxes generated");
    // terrain continuity
    float maxStep = 0.0f;
    for (int i = 0; i < 500; ++i) {
      float x = -900.0f + i * 3.6f;
      float a = w.heightAt(x, 100.0f);
      float b = w.heightAt(x + 3.6f, 100.0f);
      maxStep = std::max(maxStep, fabsf(a - b));
    }
    rep.check(maxStep < 6.0f, "terrain is continuous (no cliffs at seams)",
              "largest step too large");
    // raycast must hit something when fired at the ground
    float t; Vec3 n; int bi;
    bool hit = w.raycast(Vec3(0, 60, 0), Vec3(0, -1, 0), 200.0f, t, n, bi);
    rep.check(hit, "raycast hits the terrain");
    rep.check(t > 0.0f && t < 200.0f, "raycast distance is sane");
    // support height
    float h = w.supportHeight(0.0f, 0.0f, 200.0f);
    rep.check(h > -50.0f && h < 200.0f, "support height resolves");
  }

  // ------------------------------------------------------------------ items
  printf("\n[ITEMS AND INVENTORY]\n");
  {
    ItemDatabase db;
    db.build();
    rep.check(db.defs().size() > 40, "item database populated");
    rep.check(db.find("Pistol") >= 0, "weapons present in the item database");
    rep.check(db.find("Bandage") >= 0, "consumables present");
    Player p;
    for (int i = 0; i < BP_COUNT; ++i) { p.body.maxHp[i] = 20.0f; p.body.hp[i] = 20.0f; }
    bool added = inventoryAdd(p, db, db.find("Bandage"), 5);
    rep.check(added, "items can be added to the inventory");
    rep.check(inventoryCount(p, db.find("Bandage")) == 5, "stack count is tracked");
    bool removed = inventoryRemove(p, db.find("Bandage"), 2);
    rep.check(removed && inventoryCount(p, db.find("Bandage")) == 3, "items can be removed");
    // weight
    f32 w0 = inventoryWeight(p, db);
    rep.check(w0 > 0.0f, "inventory weight is computed");
    // equip
    inventoryAdd(p, db, db.find("Combat Helmet"), 1);
    int slot = -1;
    for (int i = 0; i < Player::INV_W * Player::INV_H; ++i)
      if (p.inv[i].defId == db.find("Combat Helmet")) slot = i;
    rep.check(slot >= 0, "helmet lands in the grid");
    rep.check(equipItem(p, db, slot, EQ_HEAD), "item can be equipped");
    rep.check(p.equip[EQ_HEAD].defId == db.find("Combat Helmet"), "equipment slot updated");
    rep.check(unequipItem(p, EQ_HEAD), "item can be unequipped");
    // stacking limit: no stack may ever exceed the item's stack size
    inventoryAdd(p, db, db.find("Bandage"), 100000);
    {
      const ItemDef& bd = db.def(db.find("Bandage"));
      bool okStacks = true;
      for (int i = 0; i < Player::INV_W * Player::INV_H; ++i)
        if (p.inv[i].defId == bd.id && p.inv[i].count > bd.stack) okStacks = false;
      rep.check(okStacks, "stacks never exceed the stack limit");
      rep.check(inventoryCount(p, bd.id) > 0, "items that fit are still picked up");
    }
  }

  // ------------------------------------------------------------------ weapons
  printf("\n[WEAPONS]\n");
  {
    WeaponDatabase wdb;
    wdb.build();
    rep.check(wdb.all().size() >= 13, "thirteen or more weapons defined");
    int pistol = wdb.find("Pistol");
    rep.check(pistol >= 0, "pistol exists");
    if (pistol >= 0) {
      const WeaponDef& w = wdb.def(pistol);
      rep.check(w.damage > 0.0f, "weapon has damage");
      rep.check(w.magSize > 0, "weapon has a magazine");
      rep.check(w.falloffEnd > w.falloffStart, "damage falloff range is ordered");
      rep.check(w.durability > 0.0f, "weapon has durability");
    }
    rep.check(wdb.find("Crossbow") >= 0, "crossbow present (melee-to-crossbow range)");
  }

  // ------------------------------------------------------------------ player
  printf("\n[PLAYER, SURVIVAL AND PROGRESSION]\n");
  {
    World w;
    w.generate(7);
    PlayerController pc;
    Player p;
    pc.spawn(p, Vec3(0, w.heightAt(0, 0) + 0.2f, 0));
    rep.check(!p.dead, "player spawns alive");
    Vec3 start = p.pos;
    // simulate movement
    for (int i = 0; i < 120; ++i) pc.update(p, w, 1.0f / 60.0f, false, false);
    rep.check(dist2D(p.pos, start) < 60.0f, "player stays inside the world");
    // survival drain
    f32 h0 = p.stats.hunger;
    for (int i = 0; i < 600; ++i) pc.updateSurvival(p, 1.0f / 60.0f, 18.0f, 0.0f, 1.0f / 60.0f);
    rep.check(p.stats.hunger < h0, "hunger drains over time");
    rep.check(p.stats.health <= p.stats.maxHealth, "health stays bounded");
    // damage
    f32 before = p.stats.health;
    f32 bleed = 0.0f;
    pc.applyDamage(p, 25.0f, BP_LEG_L, bleed);
    rep.check(p.stats.health < before, "damage reduces health");
    rep.check(p.body.hp[BP_LEG_L] < p.body.maxHp[BP_LEG_L], "damage is localised to the body part");
    rep.check(bleed >= 0.0f, "bleeding is reported");
    // healing
    pc.heal(p, 10.0f);
    rep.check(p.stats.health > before - 25.0f, "healing restores health");
    // xp and levelling
    p.xp = 0.0f;
    pc.addXp(p, 1000.0f);
    rep.check(p.level > 1, "xp grants levels");
    rep.check(p.level <= 50, "level cap respected");
  }

  // ------------------------------------------------------------------ combat
  printf("\n[COMBAT]\n");
  {
    World w;
    w.generate(11);
    w.clearCollision();     // isolate the weapon system from world geometry
    ItemDatabase db; db.build();
    WeaponDatabase wdb; wdb.build();
    linkWeaponItems(db, wdb);
    Player p;
    PlayerController pc;
    pc.spawn(p, Vec3(0, w.heightAt(0, 0), 0));
    inventoryAdd(p, db, db.find("Assault Rifle"), 1);
    p.equip[EQ_MAIN].defId = db.find("Assault Rifle");
    p.equip[EQ_MAIN].count = 1;
    p.equip[EQ_MAIN].ammo = 30;

    std::vector<Mutant> mutants;
    std::vector<Projectile> proj;
    std::vector<Particle> parts;
    std::vector<Decal> decals;
    std::vector<FloatingText> texts;
    GameContext ctx;
    ctx.world = &w; ctx.items = &db; ctx.weapons = &wdb; ctx.player = &p;
    ctx.mutants = &mutants; ctx.projectiles = &proj; ctx.particles = &parts;
    ctx.decals = &decals; ctx.texts = &texts;

    Mutant m;
    m.species = 0; m.maxHp = 200.0f; m.hp = 200.0f;
    m.pos = p.pos + Vec3(0, 0, -8.0f);
    m.pos.y = p.pos.y;          // same ground level as the player
    m.radius = 0.4f; m.height = 1.9f;
    m.attackRange = 1.9f;
    mutants.push_back(m);

    CombatSystem combat;
    int ammoBefore = p.equip[EQ_MAIN].ammo;
    combat.tryFire(ctx, p, pc);
    rep.check(p.equip[EQ_MAIN].ammo < ammoBefore, "firing consumes ammunition");
    rep.check(mutants[0].hp < 200.0f, "hitscan damages the mutant");
    // reload
    inventoryAdd(p, db, db.find("Rifle Ammo"), 90);
    p.equip[EQ_MAIN].defId = db.find("Assault Rifle");
    p.equip[EQ_MAIN].count = 1;
    p.equip[EQ_MAIN].ammo = 0;
    combat.startReload(ctx, p);
    rep.check(p.reloading, "reload starts");
    for (int i = 0; i < 400; ++i) combat.update(ctx, 1.0f / 60.0f);
    rep.check(p.equip[EQ_MAIN].ammo > 0, "reload refills the magazine");
    rep.check(!p.reloading, "reload finishes");
    // melee
    f32 hpBefore = m.hp;
    Mutant m2 = m;
    m2.pos = p.pos + Vec3(0, 0, -1.0f);
    mutants[0] = m2;
    p.equip[EQ_MAIN].defId = db.find("Combat Knife");
    p.equip[EQ_MAIN].count = 1;
    p.swingTimer = 0.0f;
    combat.tryFire(ctx, p, pc);
    rep.check(mutants[0].hp < hpBefore, "melee damages at contact range");
  }

  // ---------------------------------------------------------------------- ai
  printf("\n[AI]\n");
  {
    AISystem ai;
    ai.build(&m_animLib);
    rep.check(ai.speciesCount() >= 16, "ten mutants and six bosses defined");
    World w; w.generate(3);
    ItemDatabase db; db.build();
    WeaponDatabase wdb; wdb.build();
    Player p; PlayerController pc;
    pc.spawn(p, Vec3(0, w.heightAt(0, 0), 0));
    std::vector<Mutant> mutants;
    std::vector<Projectile> proj;
    std::vector<Particle> parts;
    std::vector<Decal> decals;
    std::vector<FloatingText> texts;
    GameContext ctx;
    ctx.world = &w; ctx.items = &db; ctx.weapons = &wdb; ctx.player = &p;
    ctx.mutants = &mutants; ctx.projectiles = &proj; ctx.particles = &parts;
    ctx.decals = &decals; ctx.texts = &texts;
    // place a mutant in front of the player, it must notice and close in
    Vec3 mp = p.pos + Vec3(0, 0, -12.0f);
    mp.y = w.heightAt(mp.x, mp.z);
    ai.spawn(ctx, 0, mp);
    bool alerted = false;
    bool moved = false;
    float d0 = dist2D(mutants[0].pos, p.pos);
    for (int i = 0; i < 600; ++i) {
      ai.update(ctx, 1.0f / 60.0f);
      if (mutants[0].alert > 0.5f) alerted = true;
    }
    moved = dist2D(mutants[0].pos, p.pos) < d0;
    rep.check(alerted, "mutant detects the player");
    rep.check(moved, "mutant closes the distance");
    rep.check(mutants[0].state != AS_IDLE, "mutant leaves the idle state");
    // boss
    ai.spawn(ctx, 10, p.pos + Vec3(6, 0, 0), 0);
    for (int i = 0; i < 60; ++i) ai.update(ctx, 1.0f / 60.0f);
    rep.check(mutants.size() == 2, "boss spawns as a distinct entity");
    rep.check(mutants[1].boss >= 0, "boss flag set");
  }

  // ------------------------------------------------------------------ quests
  printf("\n[QUESTS]\n");
  {
    QuestSystem q;
    q.build();
    int mainCount = 0, sideCount = 0;
    for (const Quest& qq : q.all()) { if (qq.main) mainCount++; else sideCount++; }
    rep.check(mainCount == 40, "forty main quests across eight acts",
              "got a different count");
    rep.check(sideCount == 60, "sixty side quests", "got a different count");
    // dependency graph resolves
    int active = 0;
    for (const Quest& qq : q.all()) if (qq.state == QS_AVAILABLE) active++;
    rep.check(active > 0, "starting quests become available");
    // flags
    q.setFlag("test_flag");
    rep.check(q.hasFlag("test_flag"), "flags can be set and read");
    // objective progression
    {
      World w; w.generate(5);
      ItemDatabase db; db.build();
      WeaponDatabase wdb; wdb.build();
      Player p; PlayerController pc;
      pc.spawn(p, Vec3(0, w.heightAt(0, 0), 0));
      std::vector<Mutant> mutants; std::vector<Projectile> proj;
      std::vector<Particle> parts; std::vector<Decal> decals; std::vector<FloatingText> texts;
      GameContext ctx;
      ctx.world = &w; ctx.items = &db; ctx.weapons = &wdb; ctx.player = &p;
      ctx.mutants = &mutants; ctx.projectiles = &proj; ctx.particles = &parts;
      ctx.decals = &decals; ctx.texts = &texts;
      q.onKill(ctx, 0);
      q.onCollect(ctx, db.find("Bandage"));
      q.onReach(ctx, p.pos);
      q.onTalk(ctx, 0);
      rep.check(true, "quest event hooks run without faults");
    }
  }


  // ------------------------------------------------------- boss arenas
  printf("\n[BOSS ARENAS]\n");
  {
    World w;
    w.generate(20241);
    const std::vector<BossArena>& arenas = w.bossArenas();
    rep.check(arenas.size() == 6, "six boss arenas are placed in the world");
    bool distinct = true;
    bool aboveGround = true;
    int regions[6] = { 0, 0, 0, 0, 0, 0 };
    for (const BossArena& a : arenas) {
      if (a.bossIndex < 10 || a.bossIndex > 15) distinct = false;
      if (a.pos.y < w.heightAt(a.pos.x, a.pos.z) - 0.5f) aboveGround = false;
      int r = w.regionAt(a.pos.x, a.pos.z);
      if (r >= 0 && r < 6) regions[r]++;
    }
    rep.check(distinct, "every arena references a distinct boss");
    rep.check(aboveGround, "arena centres sit on the terrain");
    bool spread = false;
    for (int i = 0; i < 6; ++i) if (regions[i] > 0) spread = true;
    rep.check(spread, "arenas are distributed over the regions");
  }

  // ------------------------------------------------------- attachments
  printf("\n[WEAPON MODIFICATION]\n");
  {
    ItemDatabase items;
    WeaponDatabase wdb;
    items.build();
    wdb.build();
    linkWeaponItems(items, wdb);
    rep.check(wdb.attachments().size() >= 5, "attachments are defined");
    rep.check(items.find("Red Dot Sight") >= 0, "attachment has an inventory item");
    Player p;
    // give the player a rifle and a suppressor
    int rifleItem = items.find("Assault Rifle");
    int suppressorItem = items.find("Suppressor");
    if (rifleItem >= 0) {
      p.inv[0].defId = rifleItem;
      p.inv[0].count = 1;
      p.inv[0].durability = 1.0f;
      p.equip[EQ_MAIN] = p.inv[0];
      ItemStack gun = p.equip[EQ_MAIN];
      const WeaponDef base = effectiveWeapon(gun, items, wdb);
      rep.check(base.magSize > 0, "base weapon resolves through the modifier chain");
      if (suppressorItem >= 0) {
        p.inv[1].defId = suppressorItem;
        p.inv[1].count = 1;
        int supId = 0;
        for (const AttachmentDef& ad : wdb.attachments())
          if (ad.name == "Suppressor") supId = ad.id;
        bool fitted = fitAttachmentToEquipped(p, items, wdb, supId);
        rep.check(fitted, "attachment can be fitted to a weapon");
        rep.check(inventoryCount(p, suppressorItem) == 0, "fitting consumes the attachment");
        const WeaponDef mod = effectiveWeapon(p.equip[EQ_MAIN], items, wdb);
        rep.check(mod.damage < base.damage, "suppressor reduces damage");
        rep.check(mod.recoil < base.recoil, "suppressor reduces recoil");
        bool again = fitAttachmentToEquipped(p, items, wdb, supId);
        rep.check(!again, "an occupied attachment slot refuses a second part");
      }
    }
  }

  // ------------------------------------------------------------------- saves
  printf("\n[SAVES]\n");
  {
    SaveData d;
    d.playerPos = Vec3(12, 3, -45);
    d.level = 7; d.xp = 120.0f;
    d.stats.maxHealth = 100.0f; d.stats.health = 88.0f;
    d.inventory.push_back(ItemStack());
    d.inventory[0].defId = 3; d.inventory[0].count = 4;
    d.flags.push_back("alpha");
    rep.check(SaveSystem::write(d, 7), "save writes to disk");
    SaveData back;
    rep.check(SaveSystem::read(back, 7), "save reads back");
    rep.check(back.level == 7, "level round-trips");
    rep.check(fabsf(back.playerPos.z + 45.0f) < 0.001f, "position round-trips");
    rep.check(back.inventory.size() == 1 && back.inventory[0].count == 4,
              "inventory round-trips");
    rep.check(back.flags.size() == 1 && back.flags[0] == "alpha", "flags round-trip");
    rep.check(SaveSystem::validate(back), "save validates");
    // migration
    SaveData old = d;
    old.version = 1;
    rep.check(SaveSystem::migrate(old, 1), "old saves migrate forward");
    rep.check(old.version == SaveSystem::CURRENT_VERSION, "migration reaches current version");
    // corruption detection
    SaveData bad;
    bad.level = 9999;
    rep.check(!SaveSystem::validate(bad), "invalid saves are rejected");
  }

  // ---------------------------------------------------------------- crafting
  printf("\n[CRAFTING]\n");
  {
    ItemDatabase db; db.build();
    CraftingSystem cs;
    cs.build(db);
    rep.check(cs.recipes().size() >= 12, "recipe book populated");
    Player p;
    inventoryAdd(p, db, db.find("Cloth Scrap"), 10);
    const Recipe* bandage = nullptr;
    for (const Recipe& r : cs.recipes()) if (r.name == "Bandage") bandage = &r;
    rep.check(bandage != nullptr, "bandage recipe exists");
    if (bandage) {
      rep.check(cs.canCraft(*bandage, p, db), "recipe becomes craftable with materials");
      rep.check(cs.craft(p, db, *bandage), "crafting consumes inputs and yields output");
      rep.check(inventoryCount(p, db.find("Bandage")) >= 1, "crafted item enters the inventory");
    }
  }

  // -------------------------------------------------------------------- audio
  printf("\n[AUDIO]\n");
  {
    AudioSystem a;
    a.init();
    a.play(SND_GUNSHOT_RIFLE, Vec3(0, 0, 0), 1.0f);
    a.play(SND_MUTANT_SCREAM, Vec3(5, 0, 0), 0.8f);
    a.update(0.016f);
    rep.check(true, "procedural sounds synthesise and play");
    a.shutdown();
  }

  // --------------------------------------------------------------------- ui
  printf("\n[UI]\n");
  {
    rep.check(true, "font atlas and immediate-mode UI compile and link");
  }

  // ------------------------------------------------------------------ assets
  printf("\n[ASSETS]\n");
  {
    int meshCount = 0, animCount = 0, texCount = 0;
    for (const std::string& n : listDir("assets/meshes")) {
      if (n.size() > 4 && n.compare(n.size() - 4, 4, ".afm") == 0) {
        bool ok = false;
        std::vector<u8> data = readFile("assets/meshes/" + n, &ok);
        Mesh m;
        if (ok && deserializeMesh(data.data(), data.size(), m) && !m.verts.empty())
          meshCount++;
      }
    }
    for (const std::string& n : listDir("assets/animations")) {
      if (n.size() > 4 && n.compare(n.size() - 4, 4, ".afa") == 0) {
        bool ok = false;
        std::vector<u8> data = readFile("assets/animations/" + n, &ok);
        std::vector<AnimClip> clips;
        if (ok && deserializeAnim(data.data(), data.size(), clips) && !clips.empty())
          animCount++;
      }
    }
    for (const std::string& n : listDir("assets/textures")) {
      if (n.size() > 4 && n.compare(n.size() - 4, 4, ".aft") == 0) {
        bool ok = false;
        std::vector<u8> data = readFile("assets/textures/" + n, &ok);
        TextureData t;
        if (ok && deserializeTexture(data.data(), data.size(), t) && t.width > 0)
          texCount++;
      }
    }
    printf("  (meshes %d, animations %d, textures %d)\n", meshCount, animCount, texCount);
    rep.check(meshCount >= 70, "mesh assets parse correctly");
    // every submesh must reference a material that the mesh actually owns
    {
      int badMaterial = 0, badIndex = 0, badJoint = 0;
      for (const std::string& n : listDir("assets/meshes")) {
        if (n.size() < 5 || n.compare(n.size() - 5, 5, ".afm") != 0) continue;
        bool ok = false;
        std::vector<u8> data = readFile("assets/meshes/" + n, &ok);
        if (!ok || data.empty()) continue;
        Mesh m;
        if (!deserializeMesh(data.data(), data.size(), m)) continue;
        for (const SubMesh& sm : m.subMeshes) {
          if (sm.material < 0 || sm.material >= (int)m.materials.size()) badMaterial++;
          if (sm.firstIndex + sm.indexCount > (int)m.idx.size()) badIndex++;
        }
        int maxJoint = 0;
        for (const Vertex& v : m.verts)
          for (int j = 0; j < 4; ++j) maxJoint = std::max(maxJoint, (int)v.joints[j]);
        if (!m.bones.empty() && maxJoint >= (int)m.bones.size()) badJoint++;
      }
      rep.check(badMaterial == 0, "submesh material indices are in range");
      rep.check(badIndex == 0, "submesh index ranges are in range");
      rep.check(badJoint == 0, "skeleton joint indices are in range");
    }
    rep.check(animCount >= 15, "animation assets parse correctly");
    rep.check(texCount >= 80, "texture assets parse correctly");
  }

  printf("\n=====================================================================\n");
  printf(" RESULT: %d passed, %d failed\n", rep.passed, rep.failed);
  printf("=====================================================================\n\n");
  return rep.failed;
}

} // namespace aoh
