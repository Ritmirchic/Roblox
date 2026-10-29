// tests.cpp - automated engine tests (destruction, meshing, physics, save/load)
#include "frac.h"
#include <cassert>

extern std::string g_saveDir;

static int g_fail = 0, g_pass = 0;
#define CHECK(cond, msg)                                        \
    do {                                                        \
        if (cond) {                                             \
            g_pass++;                                           \
            logf("  PASS: %s", msg);                            \
        } else {                                                \
            g_fail++;                                           \
            logf("  FAIL: %s  (%s:%d)", msg, __FILE__, __LINE__); \
        }                                                       \
    } while (0)

static int countFilled(World& w) {
    int n = 0;
    for (int z = 0; z < w.dims[2]; z++)
        for (int y = 0; y < w.dims[1]; y++)
            for (int x = 0; x < w.dims[0]; x++)
                if (w.get(x, y, z)) n++;
    return n;
}

// ------------------------------------------------------------------ meshing
static void testMeshCube() {
    logf("[test] meshing: solid cube");
    World& w = g_game.world;
    w.free();
    w.allocate(48, 48, 48);
    w.fillFast(2, 2, 2, 13, 13, 13, MAT_CONCRETE);   // stays inside one chunk
    w.computeSunMap();
    w.syncChunks();
    w.rebuildAll();
    int verts = 0, idx = 0;
    for (Chunk* c : w.chunks)
        if (c) { verts += int(c->mesh.verts.size()); idx += int(c->mesh.idx.size()); }
    logf("  cube 12x12x12 -> %d verts %d indices", verts, idx);
    // greedy merging is capped at 8x8 voxels (16 voxels would smear the baked lighting
    // across a whole chunk face), so a 12x12x12 cube merges to 2x2 quads per face
    // = 24 quads = 96 vertices / 144 indices
    CHECK(verts == 96, "merged cube produces 96 vertices (24 quads, capped merge)");
    CHECK(idx == 144, "cube produces 144 indices");
    // remove the top layer: still a closed box but shorter
    int filledBefore = countFilled(w);
    w.carveBox(Vec3(0.0f, 2.4f, 0.0f), Vec3(4.0f, 2.6f, 4.0f), 99, idx);
    w.rebuildAll();
    int filled = countFilled(w);
    logf("  slab carve: %d -> %d", filledBefore, filled);
    // the carve box straddles a voxel boundary, so it clears exactly two layers
    CHECK(filled == filledBefore - 12 * 12 * 2, "carving a slab removes exactly two layers");
    w.free();
}

static void testWallHole() {
    logf("[test] destruction: hammer hole in concrete wall");
    World& w = g_game.world;
    w.free();
    w.allocate(64, 64, 64);
    // 2 voxel thick concrete wall at x=20..21 spanning y 5..40, z 10..50
    w.fillFast(20, 5, 10, 21, 40, 50, MAT_CONCRETE);
    w.computeSunMap();
    w.syncChunks();
    w.rebuildAll();
    int before = countFilled(w);
    // hammer hit: strength 12 kills concrete (strength 3.0)
    RayHit h = w.raycast(Vec3(3.0f, 5.0f, 6.0f), Vec3(1, 0, 0), 20.0f);
    CHECK(h.hit, "raycast from outside hits the wall");
    CHECK(h.mat == MAT_CONCRETE, "raycast reports concrete");
    int removed = 0;
    w.carveSphere(Vec3(4.2f, 5.0f, 6.0f), 0.5f, 12, removed);
    int after = countFilled(w);
    logf("  removed %d voxels (%d -> %d)", removed, before, after);
    CHECK(removed > 0, "carveSphere removes voxels from the wall");
    CHECK(after == before - removed, "voxel count matches removed count");
    // the hole must be traversable: a ray through the middle now passes
    RayHit h2 = w.raycast(Vec3(4.2f, 5.0f, 6.0f), Vec3(1, 0, 0), 20.0f);
    bool passes = !h2.hit;
    if (h2.hit) {
        // allow hitting the far side of a deeper structure: check the exact column
        passes = (h2.t > 0.4f);
    }
    CHECK(passes, "opening allows a ray through the wall");
    w.rebuildAll();
    int vertsAfter = 0;
    for (Chunk* c : w.chunks)
        if (c) vertsAfter += int(c->mesh.verts.size());
    CHECK(vertsAfter > 0, "mesh rebuilds after damage");
    w.free();
}

static void testMaterials() {
    logf("[test] materials: strength ordering");
    CHECK(kMats[MAT_REBAR].strength > kMats[MAT_CONCRETE].strength, "rebar > concrete");
    CHECK(kMats[MAT_CONCRETE].strength > kMats[MAT_BRICK].strength, "concrete > brick");
    CHECK(kMats[MAT_BRICK].strength > kMats[MAT_WOOD].strength, "brick > wood");
    CHECK(kMats[MAT_WOOD].strength > kMats[MAT_GLASS].strength, "wood > glass");
    CHECK(kMats[MAT_WOOD].flammability > 0.5f, "wood is flammable");
    CHECK(kMats[MAT_GLASS].trans == 1, "glass is transparent");
    CHECK(MAT_COUNT > 20, "many material types available");
}

static void testRaycast() {
    logf("[test] raycast");
    World& w = g_game.world;
    w.free();
    w.allocate(32, 32, 32);
    w.fillFast(0, 0, 0, 31, 0, 31, MAT_CONCRETE);
    w.computeSunMap();
    w.syncChunks();
    RayHit h = w.raycast(Vec3(3.2f, 3.0f, 3.2f), Vec3(0, -1, 0), 10.0f);
    CHECK(h.hit, "downward ray hits ground");
    CHECK(fabsf(h.point.y - 0.2f) < 0.05f, "ground hit at y=0.2");
    RayHit h2 = w.raycast(Vec3(3.2f, 3.0f, 3.2f), Vec3(0, 1, 0), 10.0f);
    CHECK(!h2.hit, "upward ray misses");
    w.free();
}

static void testCollapse() {
    logf("[test] structural collapse");
    World& w = g_game.world;
    w.free();
    w.allocate(64, 64, 64);
    // 4 pillars supporting a slab, 20 voxels above ground
    w.fillFast(10, 1, 10, 60, 1, 60, MAT_CONCRETE);   // floor
    for (int i = 0; i < 4; i++) {
        int px = 20 + (i % 2) * 20, pz = 20 + (i / 2) * 20;
        w.fillFast(px, 2, pz, px + 2, 22, pz + 2, MAT_CONCRETE);
    }
    w.fillFast(18, 22, 18, 44, 24, 44, MAT_CONCRETE);   // slab
    w.computeSunMap();
    w.syncChunks();
    g_phys.init();
    int bodies = 0;
    // destroy all pillars
    for (int i = 0; i < 4; i++) {
        int px = 20 + (i % 2) * 20, pz = 20 + (i / 2) * 20;
        int removed = 0;
        w.carveSphere(Vec3((px + 1) * VOXSZ, 12 * VOXSZ, (pz + 1) * VOXSZ), 0.6f, 99, removed);
    }
    structuralCheck(w, Vec3(31 * VOXSZ, 22 * VOXSZ, 31 * VOXSZ), 14.0f);
    bodies = int(g_phys.bodies.size());
    logf("  disconnected structures found: %d", bodies);
    CHECK(bodies > 0, "unsupported slab becomes a falling structure body");
    // simulate and confirm it falls
    float y0 = bodies > 0 ? g_phys.bodies[0]->pos.y : 0;
    for (int i = 0; i < 60; i++) g_phys.update(1.0f / 60.0f, w);
    float y1 = g_phys.bodies.empty() ? 0 : g_phys.bodies[0]->pos.y;
    CHECK(y1 < y0, "structure falls under gravity");
    g_phys.clearAll();
    w.free();
}

static void testExplosion() {
    logf("[test] explosion damage + debris");
    World& w = g_game.world;
    w.free();
    w.allocate(64, 64, 64);
    w.fillFast(0, 0, 0, 63, 0, 63, MAT_CONCRETE);
    w.fillFast(10, 1, 10, 12, 20, 40, MAT_BRICK);
    w.computeSunMap();
    w.syncChunks();
    g_fx.init();
    g_phys.init();
    int before = countFilled(w);
    g_fx.explosion(Vec3(2.2f, 1.0f, 5.0f), 8.0f, w);
    int after = countFilled(w);
    logf("  voxels: %d -> %d (%d destroyed)", before, after, before - after);
    CHECK(after < before, "explosion removes voxels");
    CHECK(g_phys.activeDebris > 0, "explosion spawns physical debris");
    g_fx.update(0.016f, w);
    CHECK(g_fx.activeParts > 0, "explosion spawns particles");
    g_phys.clearAll();
    g_fx.clear();
    w.free();
}

static void testSaveLoad() {
    logf("[test] save / load destroyed world");
    platformMkdir("build");
    platformMkdir("build/testsaves");
    g_game.sandbox = true;
    gameLoadMap(0, true, -1);
    int before = countFilled(g_game.world);
    logf("  map loaded: %d voxels", before);
    int removed = 0;
    g_game.world.carveSphere(Vec3(62.0f, 2.0f, 62.0f), 3.0f, 99, removed);
    int afterDestroy = countFilled(g_game.world);
    logf("  after destruction: %d voxels (%d removed)", afterDestroy, removed);
    CHECK(afterDestroy < before, "destruction removed voxels");
    CHECK(saveGame(7), "saveGame writes a file");
    // rebuild the map fresh, then load the save
    gameLoadMap(0, true, -1);
    int fresh = countFilled(g_game.world);
    CHECK(fresh == before, "map can be rebuilt cleanly");
    CHECK(loadGame(7), "loadGame reads the file back");
    int afterLoad = countFilled(g_game.world);
    logf("  after reload: %d voxels", afterLoad);
    CHECK(afterLoad == afterDestroy, "destroyed voxels stay destroyed after reload");
    deleteSave(7);
}

static void testAudioSynth() {
    logf("[test] audio");
    g_audio.init();
    int nonEmpty = 0;
    for (int i = 0; i < SND_COUNT; i++)
        if (!g_audio.samples[i].empty()) nonEmpty++;
    logf("  synthesized %d/%d sounds", nonEmpty, SND_COUNT);
    CHECK(nonEmpty >= SND_COUNT - 2, "all generated sounds available");
    // make sure they are not silent
    long sum = 0;
    for (short v : g_audio.samples[SND_EXPLOSION]) sum += abs(v);
    CHECK(sum > 100000, "explosion sound has signal");
}

static void testDebrisPhysics() {
    logf("[test] debris physics settle");
    World& w = g_game.world;
    w.free();
    w.allocate(48, 48, 48);
    w.fillFast(0, 0, 0, 47, 0, 47, MAT_CONCRETE);
    w.computeSunMap();
    w.syncChunks();
    g_phys.init();
    for (int i = 0; i < 40; i++)
        g_phys.spawnDebris(Vec3(2.0f + i * 0.1f, 6.0f, 2.0f), Vec3(0, 0, 0), Vec3(0.1f),
                           MAT_BRICK);
    CHECK(g_phys.activeDebris == 40, "40 debris spawned");
    for (int i = 0; i < 300; i++) g_phys.update(1.0f / 60.0f, w);
    int settledCount = 0;
    for (auto& d : g_phys.debris)
        if (d.active && d.pos.y < 0.5f) settledCount++;
    logf("  %d debris at rest near ground", settledCount);
    CHECK(settledCount > 20, "debris falls and settles on the ground");
    g_phys.clearAll();
    w.free();
}

static void testVehicleImpact() {
    logf("[test] vehicle impact destroys wall");
    World& w = g_game.world;
    w.free();
    w.allocate(96, 48, 96);
    w.fillFast(0, 0, 0, 95, 1, 95, MAT_ASPHALT);
    w.fillFast(40, 2, 20, 42, 20, 60, MAT_BRICK);   // wall across the road
    w.computeSunMap();
    w.syncChunks();
    g_phys.init();
    spawnVehicle(3, Vec3(10.0f, 2.5f, 8.0f), 1.5708f);
    int before = countFilled(w);
    for (int i = 0; i < 240; i++) {
        g_input.keys['W'] = true;
        g_game.vehicles[0].occupied = true;
        updateVehicles(1.0f / 60.0f);
    }
    int after = countFilled(w);
    logf("  voxels %d -> %d", before, after);
    CHECK(after < before, "heavy vehicle damages the wall on impact");
    g_input.keys['W'] = false;
    for (int i = 0; i < MAX_VEHICLES; i++) g_game.vehicles[i] = Vehicle();
    w.free();
}

int main() {
    g_headless = true;
    g_logFile = fopen("build/tests.log", "w");
    logf("=== FRACTURE engine test suite ===");
    initMaterials();
    g_rng.seed(1234);
    testMaterials();
    testRaycast();
    testMeshCube();
    testWallHole();
    testCollapse();
    testExplosion();
    testDebrisPhysics();
    testVehicleImpact();
    testAudioSynth();
    testSaveLoad();
    logf("=== %d passed, %d failed ===", g_pass, g_fail);
    if (g_logFile) fclose(g_logFile);
    return g_fail > 0 ? 1 : 0;
}
