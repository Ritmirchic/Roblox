// game.cpp - game state, player controller, tools, missions, save/load
#include "frac.h"
#include <chrono>

Game g_game;
PlatformInput g_input;

ToolDef kTools[TOOL_COUNT] = {
    {"SLEDGEHAMMER", "Heavy melee demolition. Smashes concrete, shatters glass.", 0, 0.55f, 0},
    {"SHOTGUN", "Short range demolition firearm. Blasts holes through walls.", 24, 0.85f, 0},
    {"EXPLOSIVE CHARGE", "Stick to surfaces, detonate remotely. 8 active charges.", 8, 0.35f, 1},
    {"ROCKET LAUNCHER", "Heavy anti-structure rocket. Large blast radius.", 6, 1.5f, 1},
    {"BLOWTORCH", "Precision thermal cutter. Burns through wood and thin metal.", 100, 0.05f, 1},
    {"PLANK TOOL", "Builds walkable planks on any surface. For traversal.", 40, 0.3f, 2},
    {"FIRE EXTINGUISHER", "Suppresses fire and clears smoke.", 100, 0.05f, 2},
    {"GRAPPLE", "Fires a hook and pulls you toward it.", 1, 0.6f, 2},
    {"INDUSTRIAL CUTTER", "Heavy duty cutting beam. Cuts steel and rebar.", 100, 0.05f, 3},
    {"GRAVITY CABLE", "Anchors a tension cable that drags matter toward you.", 4, 0.8f, 3},
    {"DEMOLITION DRILL", "Penetrates concrete, stone and terrain. Digs tunnels.", 100, 0.05f, 4},
    {"AIRSTRIKE DESIGNATOR", "Marks a target for a simulated bombing run.", 3, 1.0f, 4},
};

uint32_t g_matColor[MAT_COUNT];

// sample the real texture atlas so the minimap shows the actual stone/brick/grass colours
static void buildMaterialColors() {
    Renderer& R = g_renderer;
    for (int i = 0; i < MAT_COUNT; i++) {
        g_matColor[i] = 0xFF808080;
        if (R.tiles.empty()) continue;
        const Tex& t = R.tiles[(kMats[i].texid + NTEX) % NTEX];
        if (t.w <= 0) continue;
        uint32_t sr = 0, sg = 0, sb = 0;
        int n = 0;
        for (int y = 0; y < t.h; y += 4)
            for (int x = 0; x < t.w; x += 4) {
                uint32_t c = t.px[y * t.w + x];
                sr += (c >> 16) & 255;
                sg += (c >> 8) & 255;
                sb += c & 255;
                n++;
            }
        if (!n) continue;
        g_matColor[i] = 0xFF000000u | ((sr / n) << 16) | ((sg / n) << 8) | (sb / n);
    }
}

std::string g_saveDir = "saves";
bool g_headless = false;
int g_headlessFrames = 0;
const char* g_capturePath = nullptr;
static std::vector<int> g_plankStrokes;

// ------------------------------------------------------------------ helpers
static void setSkyForTime(int tod, int weather) {
    Renderer& R = g_renderer;
    switch (tod) {
        case 0:   // dawn
            R.sunDir = normalize(Vec3(-0.45f, 0.32f, 0.83f));
            R.sunColor = Vec3(1.15f, 0.78f, 0.55f);
            R.skyColor = Vec3(0.45f, 0.55f, 0.78f);
            R.groundColor = Vec3(0.24f, 0.2f, 0.18f);
            R.fogColor = Vec3(0.62f, 0.63f, 0.7f);
            R.exposure = 1.15f;
            R.fogDensity = 0.0055f;
            break;
        case 2:   // dusk
            R.sunDir = normalize(Vec3(0.75f, 0.22f, -0.6f));
            R.sunColor = Vec3(1.05f, 0.62f, 0.4f);
            R.skyColor = Vec3(0.38f, 0.44f, 0.66f);
            R.groundColor = Vec3(0.2f, 0.17f, 0.16f);
            R.fogColor = Vec3(0.55f, 0.52f, 0.58f);
            R.exposure = 1.25f;
            R.fogDensity = 0.0060f;
            break;
        case 3:   // night
            R.sunDir = normalize(Vec3(-0.3f, 0.55f, 0.4f));
            R.sunColor = Vec3(0.16f, 0.2f, 0.34f);
            R.skyColor = Vec3(0.12f, 0.15f, 0.26f);
            R.groundColor = Vec3(0.05f, 0.05f, 0.07f);
            R.fogColor = Vec3(0.1f, 0.12f, 0.18f);
            R.exposure = 2.0f;
            R.fogDensity = 0.0075f;
            break;
        default:  // day
            R.sunDir = normalize(Vec3(0.42f, 0.72f, 0.55f));
            R.sunColor = Vec3(1.35f, 1.24f, 1.05f);
            R.skyColor = Vec3(0.46f, 0.62f, 0.92f);
            R.groundColor = Vec3(0.3f, 0.26f, 0.22f);
            R.fogColor = Vec3(0.7f, 0.76f, 0.84f);
            R.exposure = 1.0f;
            R.fogDensity = 0.0048f;
            break;
    }
    if (weather == 2 || weather == 4) {   // rain / storm
        R.sunColor = R.sunColor * 0.35f;
        R.skyColor = R.skyColor * 0.55f;
        R.fogColor = Vec3(0.42f, 0.45f, 0.5f);
        R.fogDensity = 0.011f;
        if (weather == 4) R.fogDensity = 0.014f;
    } else if (weather == 3) {   // fog
        R.fogDensity = 0.016f;
        R.fogColor = Vec3(0.62f, 0.65f, 0.68f);
    } else if (weather == 1) {   // cloudy
        R.sunColor = R.sunColor * 0.55f;
        R.skyColor = R.skyColor * 0.75f;
        R.fogColor = Vec3(0.6f, 0.63f, 0.68f);
        R.fogDensity = 0.0065f;
    }
}

void setTimeOfDay(int t) {
    g_game.timeOfDay = clampi(t, 0, 3);
    g_game.sandboxOpts.timeOfDay = g_game.timeOfDay;
    setSkyForTime(g_game.timeOfDay, g_game.weather);
}
void setWeather(int w) {
    g_game.weather = clampi(w, 0, 4);
    g_game.sandboxOpts.weather = g_game.weather;
    setSkyForTime(g_game.timeOfDay, g_game.weather);
}

// ------------------------------------------------------------------ init
void gameInit() {
    logf("[init] %s v%s", GAME_NAME, FRACTURE_VERSION);
    initMaterials();
    g_audio.init();
    g_phys.init();
    g_fx.init();
    g_renderer.init(1280, 720);
    g_game.sens = 0.22f;
    // starting kit: the sledgehammer plus the light utility tools, so the first contract
    // is playable straight away. Heavy demolition gear is earned through the campaign.
    g_game.unlockedTools = (1 << TOOL_HAMMER) | (1 << TOOL_SHOTGUN) | (1 << TOOL_CHARGE) |
                           (1 << TOOL_PLANK) | (1 << TOOL_EXTINGUISHER) | (1 << TOOL_GRAPPLE);
    g_renderer.set.viewDist = 150;
    g_renderer.set.fov = 78;
    buildMaterialColors();
    g_game.state = GS_MAIN_MENU;
    setSkyForTime(1, 0);
    logf("[init] ready");
}


// terrain height of the map (median of the height map: most of a map is ground, so this
// robustly finds the street/lawn level that objectives are measured from)
static float g_groundY = 1.4f;

static void computeGroundY() {
    World& w = g_game.world;
    std::vector<float> h;
    h.reserve(size_t(w.dims[0] / 4 + 1) * size_t(w.dims[2] / 4 + 1));
    for (int z = 0; z < w.dims[2]; z += 4)
        for (int x = 0; x < w.dims[0]; x += 4) h.push_back(w.sunmap[z * w.dims[0] + x]);
    if (h.empty()) return;
    std::nth_element(h.begin(), h.begin() + h.size() / 2, h.end());
    g_groundY = h[h.size() / 2];
    logf("[map] ground level %.2f m", g_groundY);
}

// count destructible voxels belonging to a "destroy" objective (ignores the ground slab
// underneath so the baseline always reflects actual structure)
static int countObjectiveVoxels(const Objective& o) {
    World& w = g_game.world;
    int r = int(o.radius / VOXSZ);
    int cx = int(o.pos.x / VOXSZ), cy = int(o.pos.y / VOXSZ), cz = int(o.pos.z / VOXSZ);
    // vertical column: from just below the ground reference up 6 m (or 1.5x radius),
    // so the player only has to flatten the structure in the area, not dig the street
    float topLimit = fmaxf(o.pos.y, g_groundY) + fmaxf(20.0f, o.radius * 2.5f);
    int yLo = int((g_groundY - 0.4f) / VOXSZ);
    int yHi = int(topLimit / VOXSZ);
    if (yLo < 0) yLo = 0;
    if (yHi > w.dims[1] - 1) yHi = w.dims[1] - 1;
    int count = 0;
    for (int z = cz - r; z <= cz + r; z++)
        for (int y = yLo; y <= yHi; y++)
            for (int x = cx - r; x <= cx + r; x++) {
                if (!w.inside(x, y, z)) continue;
                uint8_t m = w.get(x, y, z);
                if (!m) continue;
                // ground/terrain is not "structure": the player is never asked to dig up a
                // street, and counting it made every objective impossible to finish
                int kind = kMats[m].kind;
                if (kind == K_SOIL || m == MAT_ASPHALT) continue;
                float dx = (x - cx) * VOXSZ, dz = (z - cz) * VOXSZ;
                if (dx * dx + dz * dz > o.radius * o.radius) continue;
                count++;
            }
    return count;
}

// If a hand-authored objective coordinate lands on empty ground (the map builder moved a
// structure, or the text describes a landmark that got rebuilt), walk outwards until
// something solid is found and retarget the marker there.
static bool retargetObjective(Objective& o) {
    if (countObjectiveVoxels(o) > 40) return false;
    Objective best = o;
    int bestCount = 0;
    for (float rad = 2.0f; rad <= 26.0f; rad += 2.0f) {
        for (int k = 0; k < 16; k++) {
            float ang = float(k) / 16.0f * 2.0f * PI;
            Objective probe = o;
            probe.pos.x = o.pos.x + cosf(ang) * rad;
            probe.pos.z = o.pos.z + sinf(ang) * rad;
            World& w = g_game.world;
            probe.pos.x = clampf(probe.pos.x, 2.0f, w.dims[0] * VOXSZ - 2.0f);
            probe.pos.z = clampf(probe.pos.z, 2.0f, w.dims[2] * VOXSZ - 2.0f);
            probe.pos.y = g_groundY;
            int c = countObjectiveVoxels(probe);
            if (c > bestCount) {
                bestCount = c;
                best = probe;
            }
        }
        if (bestCount > 200) break;
    }
    if (bestCount <= 40) return false;
    o.pos = best.pos;
    logf("  retargeted '%s' to %.1f,%.1f,%.1f (%d voxels)", o.text.c_str(), o.pos.x, o.pos.y,
         o.pos.z, bestCount);
    return true;
}

// Give the player a full loadout. The sledgehammer never runs out (it is the melee
// fallback), every other tool starts each contract fully stocked.
void resetLoadout() {
    Player& p = g_game.player;
    for (int i = 0; i < TOOL_COUNT; i++) {
        p.ammo[i] = float(kTools[i].ammoMax);
        p.heat[i] = 0;
    }
    p.ammo[TOOL_HAMMER] = 1;
    p.fuelLeft = 100.0f;
    p.extinguishFuel = 100.0f;
    p.reloadT = 0;
    p.tool = TOOL_HAMMER;
    if (!(g_game.unlockedTools & (1 << p.tool))) p.tool = TOOL_HAMMER;
}

// how many voxels a destroy objective actually requires (shared by the HUD and the
// completion check so the percentage on screen matches the real condition)
int objectiveNeed(const Objective& o) {
    if (o.need > 0) return o.need;
    int need = int(o.targetCount * 0.4f);
    int cap = int(360.0f + o.radius * 70.0f);
    if (need > cap) need = cap;
    if (need < 300) need = 300;
    return need;
}

// ------------------------------------------------------------------ map load
void gameLoadMap(int mapIdx, bool sandbox, int missionIdx) {
    g_game.state = GS_LOADING;
    g_game.sandbox = sandbox;
    g_game.selMap = mapIdx;
    g_game.curMission = missionIdx;
    MapDef& md = kMaps[mapIdx];
    logf("[map] loading %s (%dx%dx%d)", md.name, md.dimx, md.dimy, md.dimz);
    auto t0 = std::chrono::high_resolution_clock::now();
    g_phys.clearAll();
    g_fx.clear();
    g_game.charges.clear();
    g_game.chargeNrm.clear();
    g_game.targets.clear();
    g_game.missions.clear();
    g_game.alarm = 0;
    g_game.alarmTriggered = false;
    g_game.totalDestroyed = 0;
    for (int i = 0; i < MAX_VEHICLES; i++) g_game.vehicles[i] = Vehicle();
    g_game.world.allocate(md.dimx, md.dimy, md.dimz);
    g_game.world.computeSunMap();
    md.build(g_game.world);
    g_game.world.computeSunMap();
    g_game.world.bakeLight();
    computeGroundY();
    auto t1 = std::chrono::high_resolution_clock::now();
    g_game.world.rebuildAll();
    auto t2 = std::chrono::high_resolution_clock::now();
    logf("[map] build %.0fms mesh %.0fms chunks=%d",
         std::chrono::duration<double, std::milli>(t1 - t0).count(),
         std::chrono::duration<double, std::milli>(t2 - t1).count(),
         int(g_game.world.chunks.size()));
    g_game.timeOfDay = md.timeOfDay;
    g_game.weather = md.weather;
    g_game.sandboxOpts.timeOfDay = md.timeOfDay;
    g_game.sandboxOpts.weather = md.weather;
    setSkyForTime(g_game.timeOfDay, g_game.weather);
    // player spawn: find ground
    Vec3 spawn = Vec3(md.dimx * VOXSZ * 0.5f, 0, md.dimz * VOXSZ * 0.5f);
    g_game.missions = buildMissions(mapIdx);
    if (!sandbox && missionIdx >= 0 && missionIdx < int(g_game.missions.size())) {
        Mission& m = g_game.missions[missionIdx];
        spawn = m.startPos;
        g_game.missionActive = true;
        g_game.missionTimer = m.timeLimit;
        g_game.state = GS_PLAYING;
    } else {
        g_game.missionActive = false;
        g_game.state = GS_PLAYING;
    }
    float top = g_game.world.topSolidY(int(spawn.x / VOXSZ), int(spawn.z / VOXSZ));
    g_game.player.pos = Vec3(spawn.x, top + 0.05f, spawn.z);
    g_game.player.vel = Vec3(0, 0, 0);
    g_game.player.yaw = 0;
    g_game.player.pitch = 0;
    g_game.player.health = 100;
    resetLoadout();
    g_game.player.inVehicle = false;
    g_game.player.vehicle = -1;
    g_game.player.carrying = false;
    if (!sandbox) {
        for (int i = 0; i < int(g_game.missions.size()); i++)
            if (i != missionIdx) g_game.missions[i].complete = true;
    }
    // snap reach-objectives to the top of whatever is standing there, and take a
    // baseline voxel count for destruction objectives
    for (auto& m : g_game.missions)
        for (auto& o : m.objectives) {
            if (o.type == 2) {
                // reach targets sit at street level: the player walks in, they do not have to
                // climb onto the roof of the building the marker is attached to
                o.pos.y = g_groundY;
            }
            if (o.type == 0) {
                retargetObjective(o);
                // measure from the ground under the target up past its top so the column
                // always covers the whole structure (walls *and* roof)
                int count = countObjectiveVoxels(o);
                o.targetCount = count;
                o.progress = 0;
                o.done = false;
                logf("  objective '%s' baseline %d voxels at %.1f,%.1f,%.1f", o.text.c_str(),
                     count, o.pos.x, o.pos.y, o.pos.z);
            }
        }
    g_game.introAlpha = 1.0f;
    g_game.toast = md.name;
    g_game.toastTime = 3.0f;
    logf("[map] ready, player at %.1f %.1f %.1f", g_game.player.pos.x, g_game.player.pos.y,
         g_game.player.pos.z);
}

void gameResetWorld() {
    int mi = g_game.curMission;
    bool sb = g_game.sandbox;
    gameLoadMap(g_game.selMap, sb, mi);
}

// ------------------------------------------------------------------ player
static bool boxSolid(World& w, const Vec3& mn, const Vec3& mx) {
    int x0 = int(floorf(mn.x / VOXSZ)), x1 = int(floorf(mx.x / VOXSZ));
    int y0 = int(floorf(mn.y / VOXSZ)), y1 = int(floorf(mx.y / VOXSZ));
    int z0 = int(floorf(mn.z / VOXSZ)), z1 = int(floorf(mx.z / VOXSZ));
    for (int z = z0; z <= z1; z++)
        for (int y = y0; y <= y1; y++)
            for (int x = x0; x <= x1; x++) {
                if (!w.inside(x, y, z)) return true;
                uint8_t m = w.get(x, y, z);
                if (m && !kMats[m].trans) return true;
            }
    return false;
}

void updatePlayer(float dt) {
    Player& p = g_game.player;
    World& w = g_game.world;
    if (p.inVehicle) return;
    float halfW = 0.33f;
    float height = p.crouch ? 1.15f : 1.75f;
    p.height = height;
    p.eyeHeight = height - 0.15f;

    // movement input
    float fwdIn = 0, rightIn = 0;
    if (g_input.keys['W']) fwdIn += 1;
    if (g_input.keys['S']) fwdIn -= 1;
    if (g_input.keys['D']) rightIn += 1;
    if (g_input.keys['A']) rightIn -= 1;
    Vec3 fwd(sinf(p.yaw), 0, cosf(p.yaw));
    Vec3 right(-cosf(p.yaw), 0, sinf(p.yaw));
    Vec3 wish = (fwd * fwdIn + right * rightIn);
    if (length(wish) > 0.01f) wish = normalize(wish);
    bool sprint = g_input.keys[VK_SHIFT_MARK] && !p.crouch;
    float speed = p.crouch ? 2.4f : (sprint ? 7.6f : 4.6f);
    if (p.grappling) speed *= 0.8f;
    Vec3 targetVel = wish * speed;
    float accel = p.onGround ? 14.0f : 3.5f;
    p.vel.x += (targetVel.x - p.vel.x) * fminf(1.0f, accel * dt);
    p.vel.z += (targetVel.z - p.vel.z) * fminf(1.0f, accel * dt);
    if (length(wish) < 0.01f && p.onGround) {
        p.vel.x *= (1.0f - fminf(1.0f, 12.0f * dt));
        p.vel.z *= (1.0f - fminf(1.0f, 12.0f * dt));
    }
    // gravity
    p.vel.y -= 19.0f * dt * g_game.sandboxOpts.gravityScale;
    // grapple pull
    if (p.grappling) {
        Vec3 d = p.grapplePoint - (p.pos + Vec3(0, p.eyeHeight * 0.5f, 0));
        float dist = length(d);
        if (dist < 1.4f) {
            p.grappling = false;
        } else {
            p.vel += normalize(d) * 26.0f * dt;
            if (length(p.vel) > 18.0f) p.vel = normalize(p.vel) * 18.0f;
            p.grappleDist = dist;
        }
    }
    // jump
    if (g_input.keyPressed[' '] && p.onGround && !p.crouch) {
        p.vel.y = 6.4f;
        p.onGround = false;
        g_audio.play(SND_JUMP, p.pos, 0.4f);
    }

    // unstick: if the player somehow ends up inside geometry (spawned in a wall, a
    // structure collapsed onto them, a carving re-meshed around them) push them out
    // upwards instead of letting them sink through the world
    {
        auto solidAt = [&](const Vec3& q) {
            return boxSolid(w, Vec3(q.x - halfW, q.y + 0.02f, q.z - halfW),
                            Vec3(q.x + halfW, q.y + height, q.z + halfW));
        };
        if (solidAt(p.pos)) {
            bool fixed = false;
            for (float up = 0.05f; up <= 3.0f; up += 0.05f) {
                Vec3 q = p.pos;
                q.y += up;
                if (!solidAt(q)) {
                    p.pos = q;
                    p.vel.y = fmaxf(p.vel.y, 0.0f);
                    p.onGround = true;
                    fixed = true;
                    break;
                }
            }
            if (!fixed) {
                // buried: climb out towards the nearest open column
                for (float ang = 0; ang < 6.28f && !fixed; ang += 0.4f) {
                    for (float rad = 0.6f; rad <= 4.0f && !fixed; rad += 0.6f) {
                        Vec3 q = p.pos + Vec3(cosf(ang) * rad, 0, sinf(ang) * rad);
                        for (float up = 0.05f; up <= 2.0f; up += 0.1f) {
                            Vec3 r2 = q;
                            r2.y += up;
                            if (!solidAt(r2)) {
                                p.pos = r2;
                                p.vel = Vec3(0, 0, 0);
                                p.onGround = true;
                                fixed = true;
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    // integrate with collision, per axis
    Vec3 mn(p.pos.x - halfW, p.pos.y, p.pos.z - halfW);
    Vec3 mx(p.pos.x + halfW, p.pos.y + height, p.pos.z + halfW);
    // X
    Vec3 test = p.pos;
    test.x += p.vel.x * dt;
    if (boxSolid(w, Vec3(test.x - halfW, test.y + 0.05f, test.z - halfW),
                 Vec3(test.x + halfW, test.y + height, test.z + halfW))) {
        // try step up
        bool stepped = false;
        for (float step = 0.2f; step <= 0.62f; step += 0.06f) {
            if (!boxSolid(w, Vec3(test.x - halfW, test.y + step, test.z - halfW),
                          Vec3(test.x + halfW, test.y + step + height, test.z + halfW))) {
                test.y += step;
                p.vel.y = fmaxf(p.vel.y, 0);
                stepped = true;
                break;
            }
        }
        if (!stepped) {
            p.vel.x = 0;
            test.x = p.pos.x;
        }
    }
    p.pos = test;
    // Z
    test = p.pos;
    test.z += p.vel.z * dt;
    if (boxSolid(w, Vec3(test.x - halfW, test.y + 0.05f, test.z - halfW),
                 Vec3(test.x + halfW, test.y + height, test.z + halfW))) {
        bool stepped = false;
        for (float step = 0.2f; step <= 0.62f; step += 0.06f) {
            if (!boxSolid(w, Vec3(test.x - halfW, test.y + step, test.z - halfW),
                          Vec3(test.x + halfW, test.y + step + height, test.z + halfW))) {
                test.y += step;
                p.vel.y = fmaxf(p.vel.y, 0);
                stepped = true;
                break;
            }
        }
        if (!stepped) {
            p.vel.z = 0;
            test.z = p.pos.z;
        }
    }
    p.pos = test;
    // Y
    test = p.pos;
    test.y += p.vel.y * dt;
    bool hitY = boxSolid(w, Vec3(test.x - halfW, test.y + 0.02f, test.z - halfW),
                         Vec3(test.x + halfW, test.y + height, test.z + halfW));
    if (hitY) {
        if (p.vel.y < 0) {
            p.onGround = true;
            if (p.vel.y < -7.0f) {
                g_audio.play(SND_LAND, p.pos, 0.5f);
                g_fx.addShake(0.05f, 0.1f);
            }
            // snap to ground
            for (float s = 0.0f; s < 0.4f; s += 0.02f) {
                if (!boxSolid(w, Vec3(test.x - halfW, test.y + s + 0.02f, test.z - halfW),
                              Vec3(test.x + halfW, test.y + s + height, test.z + halfW))) {
                    test.y += s;
                    break;
                }
            }
        }
        p.vel.y = 0;
    } else {
        if (p.vel.y <= 0) p.onGround = false;
    }
    p.pos = test;
    static int physFrame = 0;
    if (getenv("FRAC_PHYSDBG") && (++physFrame % 15) == 0)
        logf("[phys] y=%.4f vy=%.3f onGround=%d feetSolid=%d", p.pos.y, p.vel.y, int(p.onGround),
             int(boxSolid(w, Vec3(p.pos.x - halfW, p.pos.y + 0.02f, p.pos.z - halfW),
                          Vec3(p.pos.x + halfW, p.pos.y + height, p.pos.z + halfW))));
    // ground plane
    if (p.pos.y < 0) {
        p.pos.y = 0;
        p.onGround = true;
        p.vel.y = 0;
    }
    // out of world bounds => push back
    p.pos.x = clampf(p.pos.x, 1.0f, w.dims[0] * VOXSZ - 1.0f);
    p.pos.z = clampf(p.pos.z, 1.0f, w.dims[2] * VOXSZ - 1.0f);

    // footsteps
    float horizontalSpeed = length(Vec3(p.vel.x, 0, p.vel.z));
    if (p.onGround && horizontalSpeed > 0.7f) {
        p.stepDist += horizontalSpeed * dt;
        float stride = sprint ? 2.1f : 1.55f;
        if (p.stepDist > stride) {
            p.stepDist = 0;
            RayHit h = w.raycast(p.pos + Vec3(0, 0.1f, 0), Vec3(0, -1, 0), 1.2f);
            int snd = SND_FOOTSTEP;
            if (h.hit) {
                int k = kMats[h.mat].kind;
                if (k == K_METAL) snd = SND_FOOTSTEP_HARD;
                else if (k == K_STONE || k == K_CONCRETE || k == K_BRICK) snd = SND_FOOTSTEP_HARD;
            }
            g_audio.play(snd, p.pos, 0.32f, g_rng.range(0.9f, 1.12f));
            p.bob += 1.0f;
        }
    }
    p.velocityForCamera = p.vel;
    // camera bob
    static float bobPhase = 0;
    bobPhase += horizontalSpeed * dt * 1.8f;
    float bobAmt = p.onGround ? fminf(horizontalSpeed / 6.0f, 1.0f) * 0.035f : 0.0f;
    p.bob = sinf(bobPhase * 2.0f) * bobAmt;
    // flashlight
    if (p.flashlight > 0.5f) {
        Vec3 eye = p.pos + Vec3(0, p.eyeHeight, 0);
        Vec3 dir = Basis::yawPitch(p.yaw, p.pitch).mul(Vec3(0, 0, 1));
        g_renderer.addLight(eye + dir * 3.0f, Vec3(1.0f, 0.97f, 0.9f), 14.0f, 1.5f);
    }
}

// ------------------------------------------------------------------ raycast helper
bool worldRayHitAt(const Vec3& o, const Vec3& d, float maxd, RayHit& h) {
    h = g_game.world.raycast(o, d, maxd);
    return h.hit;
}

void damageVoxelsAt(const Vec3& p, const Vec3& n, float radius, int power, float impulse) {
    int removed = 0;
    g_game.world.carveSphere(p, radius, power, removed);
    if (removed > 0) {
        g_game.totalDestroyed += removed;
        g_phys.collapseQueue.push_back(p);
    }
    (void)n;
    (void)impulse;
}

// ------------------------------------------------------------------ vehicles
void spawnVehicle(int type, const Vec3& pos, float yaw) {
    static const struct { float len, wid, hei, mass; bool boat; const char* name; } defs[] = {
        {4.2f, 1.8f, 1.25f, 1300, false, "Sedan"},
        {5.0f, 2.0f, 1.6f, 2100, false, "Pickup"},
        {5.6f, 2.2f, 2.2f, 3200, false, "Delivery Van"},
        {7.4f, 2.5f, 2.9f, 8500, false, "Heavy Truck"},
        {4.6f, 2.6f, 2.4f, 12000, false, "Bulldozer"},
        {6.4f, 2.8f, 3.1f, 16000, false, "Excavator"},
        {3.4f, 1.5f, 2.0f, 3600, false, "Forklift"},
        {5.2f, 2.3f, 2.2f, 7200, false, "Demolition Truck"},
        {6.0f, 2.2f, 1.9f, 1800, true, "Speedboat"},
    };
    int idx = -1;
    for (int i = 0; i < MAX_VEHICLES; i++)
        if (!g_game.vehicles[i].active) { idx = i; break; }
    if (idx < 0) return;
    int ntypes = int(sizeof(defs) / sizeof(defs[0]));
    int t = clampi(type, 0, ntypes - 1);
    Vehicle& v = g_game.vehicles[idx];
    v = Vehicle();
    v.active = true;
    v.type = t;
    v.pos = pos;
    v.half = Vec3(defs[t].wid * 0.5f, defs[t].hei * 0.5f, defs[t].len * 0.5f);
    v.yaw = yaw;
    v.rot = Basis::rotAxis(Vec3(0, 1, 0), yaw);
    v.mass = defs[t].mass;
    v.isBoat = defs[t].boat;
    v.health = 100;
    v.id = g_game.nextVehicleId++;
    v.pos.y += v.half.y + 0.1f;
    // body colours
    static const Vec3 cols[] = {Vec3(0.62f, 0.13f, 0.11f), Vec3(0.15f, 0.25f, 0.55f),
                                Vec3(0.85f, 0.85f, 0.86f), Vec3(0.18f, 0.35f, 0.2f),
                                Vec3(0.9f, 0.72f, 0.12f), Vec3(0.35f, 0.36f, 0.38f)};
    v.color = cols[t % 6];
    v.hasArm = (t == 4 || t == 5);
}

// ------------------------------------------------------------------ tools
static float g_toolCooldown = 0;
struct Rocket { Vec3 pos, vel; float life; bool active; };
static std::vector<Rocket> g_rockets;
struct Projectile { Vec3 pos, vel; float life; bool active; int type; };
static std::vector<Projectile> g_projs;
struct Airstrike { Vec3 target; float timer; int bombs; float nextBomb; };
static std::vector<Airstrike> g_strikes;
struct Collectible { Vec3 pos; bool taken; int missionObj; };
static std::vector<Collectible> g_collectibles;

void spawnCollectible(const Vec3& p, int obj) {
    Collectible c;
    c.pos = p;
    c.taken = false;
    c.missionObj = obj;
    g_collectibles.push_back(c);
}
void clearCollectibles() { g_collectibles.clear(); }

static void placePlank(const RayHit& hit) {
    Player& p = g_game.player;
    if (!hit.hit) return;
    World& w = g_game.world;
    // build a 1-voxel thick walkable plank extending outward from the surface
    Vec3 dir = normalize(Basis::yawPitch(p.yaw, 0).mul(Vec3(0, 0, 1)));
    Vec3 start = hit.point + hit.nrm * 0.12f;
    int len = 14;   // 2.8 m
    int placed = 0;
    for (int i = 0; i < len; i++) {
        Vec3 c = start + dir * (i * VOXSZ * 1.0f);
        int vx = int(c.x / VOXSZ), vy = int(c.y / VOXSZ), vz = int(c.z / VOXSZ);
        // 3 wide
        for (int ox = -1; ox <= 1; ox++)
            for (int oz = -1; oz <= 1; oz++) {
                Vec3 off(ox * VOXSZ, 0, oz * VOXSZ);
                int ax = int((c.x + off.x) / VOXSZ), az = int((c.z + off.z) / VOXSZ);
                if (abs(ox) + abs(oz) > 1) continue;
                if (w.get(ax, vy, az) == MAT_AIR) {
                    w.set(ax, vy, az, MAT_PLANK);
                    placed++;
                }
            }
        (void)vx; (void)vz;
    }
    if (placed) {
        g_audio.play(SND_PLANK, hit.point, 0.8f);
        g_fx.sparks(hit.point, hit.nrm, 6, 0xFFFFFFFF);
        p.ammo[TOOL_PLANK] -= 1;
    }
}

void doToolUse(int button) {
    Player& p = g_game.player;
    if (p.inVehicle) return;
    if (g_toolCooldown > 0) return;
    if (!(g_game.unlockedTools & (1 << p.tool))) return;
    Renderer& R = g_renderer;
    Vec3 eye = p.pos + Vec3(0, p.eyeHeight + p.bob, 0);
    Vec3 dir = normalize(Basis::yawPitch(p.yaw, p.pitch).mul(Vec3(0, 0, 1)));
    bool infAmmo = g_game.sandbox && g_game.sandboxOpts.infiniteAmmo;
    RayHit hit = g_game.world.raycast(eye, dir, 60.0f);
    g_toolCooldown = kTools[p.tool].cooldown;
    if (getenv("FRAC_TOOLDBG"))
        logf("[tooldbg] tool=%d btn=%d hit=%d mat=%d t=%.2f eye=%.2f,%.2f,%.2f dir=%.2f,%.2f,%.2f ammo=%.0f",
             p.tool, button, int(hit.hit), int(hit.mat), hit.t, eye.x, eye.y, eye.z, dir.x, dir.y,
             dir.z, p.ammo[p.tool]);

    switch (p.tool) {
        case TOOL_HAMMER: {
            p.swinging = true;
            p.swingT = 0;
            g_toolCooldown = 0.5f;
            // delayed impact handled in doToolUpdate
            break;
        }
        case TOOL_SHOTGUN: {
            if (p.ammo[TOOL_SHOTGUN] <= 0 && !infAmmo) {
                g_audio.play2d(SND_UI_CLICK, 0.5f);
                break;
            }
            if (!infAmmo) p.ammo[TOOL_SHOTGUN] -= 1;
            p.recoil = 1.0f;
            g_audio.play(SND_GUNSHOT, eye, 1.0f);
            g_fx.addShake(0.12f, 0.12f);
            for (int i = 0; i < 9; i++) {
                Vec3 d = normalize(dir + Vec3(g_rng.range(-0.05f, 0.05f),
                                              g_rng.range(-0.05f, 0.05f),
                                              g_rng.range(-0.05f, 0.05f)));
                RayHit h = g_game.world.raycast(eye, d, 40.0f);
                if (h.hit) {
                    int power = 8;
                    int removed = 0;
                    g_game.world.carveSphere(h.point - d * 0.08f, 0.30f, power, removed);
                    g_game.totalDestroyed += removed;
                    g_fx.impact(h.point, h.nrm, h.mat, 2.5f);
                    if (i == 0) g_phys.collapseQueue.push_back(h.point);
                }
            }
            break;
        }
        case TOOL_CHARGE: {
            if (button == 1) {   // right button: detonate
                if (g_game.charges.empty()) break;
                for (size_t i = 0; i < g_game.charges.size(); i++)
                    g_fx.explosion(g_game.charges[i] + g_game.chargeNrm[i] * 0.25f, 6.5f,
                                   g_game.world);
                g_game.charges.clear();
                g_game.chargeNrm.clear();
                g_audio.play2d(SND_DETONATE, 0.9f);
                break;
            }
            if (hit.hit) {
                if (int(g_game.charges.size()) >= (infAmmo ? 24 : 8)) break;
                g_game.charges.push_back(hit.point + hit.nrm * 0.09f);
                g_game.chargeNrm.push_back(hit.nrm);
                g_audio.play(SND_PLACE, hit.point, 0.8f);
                if (!infAmmo) p.ammo[TOOL_CHARGE] = fmaxf(0, p.ammo[TOOL_CHARGE] - 1);
            }
            break;
        }
        case TOOL_ROCKET: {
            if (p.ammo[TOOL_ROCKET] <= 0 && !infAmmo) {
                g_audio.play2d(SND_UI_CLICK, 0.5f);
                break;
            }
            if (!infAmmo) p.ammo[TOOL_ROCKET] -= 1;
            Rocket r;
            r.pos = eye + dir * 0.6f;
            r.vel = dir * 45.0f;
            r.life = 4.0f;
            r.active = true;
            g_rockets.push_back(r);
            p.recoil = 1.4f;
            g_audio.play(SND_ROCKET_FIRE, eye, 1.0f);
            g_fx.smokePuff(eye + dir * 0.7f, 5, 0.3f);
            g_fx.addShake(0.15f, 0.2f);
            break;
        }
        case TOOL_BLOWTORCH: {
            if (p.fuelLeft <= 0) break;
            p.ammo[TOOL_BLOWTORCH] = p.fuelLeft;
            if (hit.hit) {
                int removed = 0;
                g_game.world.carveSphere(hit.point - hit.nrm * 0.05f, 0.16f, 4, removed);
                g_game.totalDestroyed += removed;
                g_fx.sparks(hit.point, hit.nrm, 4, 0xFFA08040);
                if (g_rng.f() < 0.3f) g_fx.smokePuff(hit.point, 1, 0.18f);
                if (g_rng.f() < 0.15f) g_fx.ignite(hit.point, 0.9f);
                if (removed) {
                    g_fx.impact(hit.point, hit.nrm, hit.mat, 0.8f);
                    g_phys.collapseQueue.push_back(hit.point);
                }
            }
            Vec3 muzzle = eye + dir * 0.7f;
            for (int i = 0; i < 2; i++)
                g_fx.spawn(muzzle, dir * g_rng.range(3, 8) + g_rng.dir() * 0.6f, 0.18f, 0.05f,
                           0.01f, packColor(1.0f, 0.7f, 0.3f, 1), 0.1f, 1, 1);
            if (!infAmmo) p.fuelLeft = fmaxf(0.0f, p.fuelLeft - 1.4f);
            if (g_rng.f() < 0.12f) g_audio.play(SND_BLOWTORCH, eye, 0.35f, 1.0f);
            g_toolCooldown = 0.04f;
            break;
        }
        case TOOL_PLANK: {
            if (p.ammo[TOOL_PLANK] <= 0 && !infAmmo) break;
            placePlank(hit);
            break;
        }
        case TOOL_EXTINGUISHER: {
            if (p.extinguishFuel <= 0) break;
            Vec3 muzzle = eye + dir * 0.8f;
            for (int i = 0; i < 5; i++) {
                Vec3 d = normalize(dir + g_rng.dir() * 0.14f);
                g_fx.spawn(muzzle, d * g_rng.range(6, 12), g_rng.range(0.5f, 1.0f), 0.2f, 0.7f,
                           rgba(225, 230, 235, 130), 0.15f, 0, 0);
            }
            g_fx.extinguish(eye + dir * 3.0f, 3.2f);
            if (!infAmmo) p.extinguishFuel = fmaxf(0.0f, p.extinguishFuel - 0.5f);
            g_toolCooldown = 0.05f;
            if (g_rng.f() < 0.1f) g_audio.play(SND_EXTINGUISH, eye, 0.3f);
            break;
        }
        case TOOL_GRAPPLE: {
            RayHit h = g_game.world.raycast(eye, dir, 48.0f);
            if (h.hit) {
                p.grappling = true;
                p.grapplePoint = h.point;
                g_audio.play(SND_GRAPPLE, eye, 0.9f);
                g_fx.sparks(h.point, h.nrm, 8, 0xFFFFFF80);
            }
            break;
        }
        case TOOL_CUTTER: {
            p.ammo[TOOL_CUTTER] = 100;
            if (hit.hit) {
                int removed = 0;
                // cutter is specialised vs metal
                int power = (kMats[hit.mat].kind == K_METAL) ? 26 : 9;
                g_game.world.carveSphere(hit.point - hit.nrm * 0.06f, 0.19f, power, removed);
                g_game.totalDestroyed += removed;
                g_fx.sparks(hit.point, hit.nrm, 10, 0xFFB0D0FF);
                if (removed) {
                    g_fx.impact(hit.point, hit.nrm, hit.mat, 1.2f);
                    g_phys.collapseQueue.push_back(hit.point);
                }
                if (g_rng.f() < 0.3f) g_audio.play(SND_CUTTER, eye, 0.4f, g_rng.range(0.9f, 1.1f));
            }
            g_toolCooldown = 0.04f;
            break;
        }
        case TOOL_CABLE: {
            if (!hit.hit) break;
            g_audio.play(SND_CABLE, eye, 0.9f);
            // pull all structures/debris within 12m toward the anchor
            Vec3 anchor = hit.point;
            for (auto* b : g_phys.bodies) {
                Vec3 d = anchor - b->pos;
                float dist = length(d);
                if (dist < 14.0f) {
                    Vec3 f = normalize(d);
                    b->vel += f * (26.0f / fmaxf(1.0f, b->mass / 900.0f));
                    b->angVel += Vec3(g_rng.range(-1, 1), g_rng.range(-1, 1), g_rng.range(-1, 1));
                    g_fx.sparks(b->pos, f, 4, 0xFFE0E0FF);
                }
            }
            for (auto& d : g_phys.debris) {
                if (!d.active) continue;
                Vec3 dd = anchor - d.pos;
                if (length(dd) < 8.0f) {
                    d.vel += normalize(dd) * 8.0f;
                    d.resting = 0;
                }
            }
            for (int i = 0; i < 8; i++)
                g_fx.spawn(eye + dir * (i * 1.5f), Vec3(0, 0, 0), 0.3f, 0.03f, 0.02f,
                           0xFFC0C0FF, 0, 1, 1);
            g_phys.collapseQueue.push_back(anchor);
            break;
        }
        case TOOL_DRILL: {
            if (hit.hit) {
                int removed = 0;
                g_game.world.carveSphere(hit.point - hit.nrm * 0.12f, 0.3f, 30, removed);
                g_game.totalDestroyed += removed;
                g_fx.impact(hit.point, hit.nrm, hit.mat, 1.4f);
                if (removed) g_phys.collapseQueue.push_back(hit.point);
                for (int i = 0; i < 3; i++)
                    g_fx.spawn(hit.point, g_rng.dir() * 2.0f, 0.4f, 0.04f, 0.02f,
                               rgba(160, 155, 150, 220), 1.5f, 3, 0);
                g_audio.play(SND_DRILL, eye, 0.3f, g_rng.range(0.85f, 1.1f));
            }
            g_toolCooldown = 0.07f;
            break;
        }
        case TOOL_AIRSTRIKE: {
            RayHit h = g_game.world.raycast(eye, dir, 220.0f);
            Vec3 target = h.hit ? h.point : eye + dir * 60.0f;
            Airstrike a;
            a.target = target;
            a.timer = 3.4f;
            a.bombs = 5;
            a.nextBomb = 0;
            g_strikes.push_back(a);
            g_audio.play2d(SND_AIRSTRIKE, 0.8f);
            g_game.toast = "AIRSTRIKE INBOUND";
            g_game.toastTime = 3.0f;
            break;
        }
        default: break;
    }
    (void)R;
}

void doToolUpdate(float dt) {
    Player& p = g_game.player;
    if (g_toolCooldown > 0) g_toolCooldown -= dt;
    Vec3 eye = p.pos + Vec3(0, p.eyeHeight + p.bob, 0);
    Vec3 dir = normalize(Basis::yawPitch(p.yaw, p.pitch).mul(Vec3(0, 0, 1)));
    // hammer impact timing
    if (p.swinging) {
        p.swingT += dt;
        float hitT = 0.16f;
        static bool impacted = false;
        if (p.swingT >= hitT && !impacted) {
            impacted = true;
            RayHit h = g_game.world.raycast(eye, dir, 3.0f);
            if (h.hit) {
                int power = 14;
                int removed = 0;
                g_game.world.carveSphere(h.point - h.nrm * 0.05f, 0.52f, power, removed);
                g_game.totalDestroyed += removed;
                g_fx.impact(h.point, h.nrm, h.mat, 3.0f);
                for (int i = 0; i < 3; i++) {
                    float s = VOXSZ * g_rng.range(1.0f, 2.0f);
                    g_phys.spawnDebris(h.point + h.nrm * 0.1f,
                                       h.nrm * g_rng.range(1, 3) + Vec3(0, g_rng.range(0.5f, 2.5f), 0),
                                       Vec3(s, s * 0.7f, s), h.mat,
                                       g_rng.dir() * g_rng.range(1, 6));
                }
                if (kMats[h.mat].kind == K_METAL)
                    g_audio.play(SND_HAMMER_METAL, h.point, 0.9f, g_rng.range(0.9f, 1.1f));
                else
                    g_audio.play(SND_HAMMER, h.point, 0.9f, g_rng.range(0.9f, 1.1f));
                g_fx.addShake(0.08f, 0.12f);
                if (removed) g_phys.collapseQueue.push_back(h.point);
            } else {
                g_audio.play(SND_HAMMER, eye + dir, 0.25f, 1.2f);
            }
        }
        if (p.swingT > 0.55f) {
            p.swinging = false;
            impacted = false;
        }
    }
    if (p.recoil > 0) p.recoil = fmaxf(0.0f, p.recoil - dt * 5.0f);
    // reload
    if (g_input.keyPressed['R'] && p.tool == TOOL_SHOTGUN && p.reloadT <= 0) {
        if (p.ammo[TOOL_SHOTGUN] < kTools[TOOL_SHOTGUN].ammoMax) p.reloadT = 1.1f;
    }
    if (p.reloadT > 0) {
        p.reloadT -= dt;
        if (p.reloadT <= 0) {
            p.ammo[TOOL_SHOTGUN] = kTools[TOOL_SHOTGUN].ammoMax;
            g_audio.play2d(SND_RELOAD, 0.8f);
        }
    }
    // charges: detonate with R
    if (g_input.keyPressed['R'] && p.tool == TOOL_CHARGE && !g_game.charges.empty()) {
        for (size_t i = 0; i < g_game.charges.size(); i++)
            g_fx.explosion(g_game.charges[i] + g_game.chargeNrm[i] * 0.25f, 6.5f, g_game.world);
        g_game.charges.clear();
        g_game.chargeNrm.clear();
        g_audio.play2d(SND_DETONATE, 0.9f);
    }
    // rockets
    for (auto& r : g_rockets) {
        if (!r.active) continue;
        r.life -= dt;
        Vec3 step = r.vel * dt;
        RayHit h = g_game.world.raycast(r.pos, normalize(r.vel), length(step) + 0.4f);
        if (h.hit) {
            g_fx.explosion(h.point, 9.0f, g_game.world);
            r.active = false;
            continue;
        }
        r.pos += step;
        if (g_rng.f() < 0.9f)
            g_fx.spawn(r.pos, Vec3(0, 0.3f, 0), 0.5f, 0.12f, 0.5f, rgba(160, 160, 160, 120), -0.1f,
                       0, 0);
        if (g_rng.f() < 0.6f)
            g_fx.spawn(r.pos, g_rng.dir() * 0.4f, 0.25f, 0.06f, 0.01f,
                       packColor(1.0f, 0.6f, 0.25f, 1), 0.1f, 1, 1);
        if (r.life <= 0) {
            g_fx.explosion(r.pos, 9.0f, g_game.world);
            r.active = false;
        }
    }
    // airstrikes
    for (auto& a : g_strikes) {
        a.timer -= dt;
        if (a.timer <= 0 && a.bombs > 0) {
            a.nextBomb -= dt;
            if (a.nextBomb <= 0) {
                a.nextBomb = 0.28f;
                a.bombs--;
                Vec3 t = a.target + Vec3(g_rng.range(-6, 6), 0, g_rng.range(-6, 6));
                // simulate the bomb falling
                RayHit h = g_game.world.raycast(t + Vec3(0, 80, 0), Vec3(0, -1, 0), 120.0f);
                Vec3 bp = h.hit ? h.point : t;
                g_fx.explosion(bp, 12.0f, g_game.world);
                for (int i = 0; i < 6; i++)
                    g_fx.spawn(bp + Vec3(0, 6, 0), Vec3(0, -30, 0), 0.25f, 0.3f, 0.1f,
                               rgba(200, 200, 200, 180), 0.0f, 0, 0);
            }
        }
    }
    for (int i = int(g_strikes.size()) - 1; i >= 0; i--)
        if (g_strikes[i].bombs <= 0 && g_strikes[i].timer <= -1.0f)
            g_strikes.erase(g_strikes.begin() + i);
    // blowtorch / cutter / drill continuous use
    if (g_input.mouse[0] && (p.tool == TOOL_BLOWTORCH || p.tool == TOOL_CUTTER ||
                             p.tool == TOOL_DRILL || p.tool == TOOL_EXTINGUISHER)) {
        if (p.tool == TOOL_BLOWTORCH && p.fuelLeft <= 0) {
        } else if (p.tool == TOOL_EXTINGUISHER && p.extinguishFuel <= 0) {
        } else {
            doToolUse(0);
        }
    }
    // remove dead rockets
    g_rockets.erase(std::remove_if(g_rockets.begin(), g_rockets.end(),
                                   [](const Rocket& r) { return !r.active; }),
                    g_rockets.end());
}

// ------------------------------------------------------------------ interact
void interactPressed() {
    Player& p = g_game.player;
    Vec3 eye = p.pos + Vec3(0, p.eyeHeight, 0);
    Vec3 dir = normalize(Basis::yawPitch(p.yaw, p.pitch).mul(Vec3(0, 0, 1)));
    // vehicles
    for (int i = 0; i < MAX_VEHICLES; i++) {
        Vehicle& v = g_game.vehicles[i];
        if (!v.active) continue;
        if (length(v.pos - eye) < 4.2f) {
            p.inVehicle = true;
            p.vehicle = i;
            v.occupied = true;
            g_audio.play(SND_PICKUP, v.pos, 0.7f);
            g_game.toast = "ENTERED VEHICLE - PRESS E TO EXIT";
            g_game.toastTime = 2.5f;
            return;
        }
    }
    // collectibles
    for (auto& c : g_collectibles) {
        if (c.taken) continue;
        if (length(c.pos - eye) < 3.0f) {
            c.taken = true;
            g_audio.play2d(SND_PICKUP, 0.9f);
            g_game.toast = "OBJECTIVE ITEM RECOVERED";
            g_game.toastTime = 2.0f;
            if (g_game.curMission >= 0 && g_game.curMission < int(g_game.missions.size())) {
                Mission& m = g_game.missions[g_game.curMission];
                for (auto& o : m.objectives)
                    if (o.type == 1 && !o.done && o.targetId == c.missionObj) {
                        o.progress++;
                        if (o.progress >= o.targetCount) o.done = true;
                    }
            }
            return;
        }
    }
    // carry debris
    if (!p.carrying) {
        float best = 3.2f;
        int bestIdx = -1;
        for (int i = 0; i < int(g_phys.debris.size()); i++) {
            Debris& d = g_phys.debris[i];
            if (!d.active) continue;
            Vec3 toP = d.pos - eye;
            float dist = length(toP);
            if (dist < best && dot(normalize(toP), dir) > 0.85f) {
                best = dist;
                bestIdx = i;
            }
        }
        if (bestIdx >= 0) {
            p.carrying = true;
            p.carryingBody = bestIdx;
            g_phys.debris[bestIdx].vel = Vec3(0, 0, 0);
            g_audio.play(SND_PICKUP, eye, 0.6f);
        }
    }
}
// ------------------------------------------------------------------ mission
void missionComplete() {
    if (!g_game.missionActive) return;
    g_game.missionActive = false;
    g_game.state = GS_MISSION_COMPLETE;
    if (g_game.curMission >= 0 && g_game.curMission < int(g_game.missions.size())) {
        Mission& m = g_game.missions[g_game.curMission];
        m.complete = true;
        g_game.money += m.money;
        if (m.rewardTool >= 0) g_game.unlockedTools |= (1 << m.rewardTool);
    }
    g_audio.play2d(SND_BEEP, 0.8f, 1.2f);
    logf("[mission] complete");
}

void missionFail(const char* reason) {
    if (!g_game.missionActive) return;
    g_game.missionActive = false;
    g_game.state = GS_FAILED;
    logf("[mission] failed: %s", reason);
    g_game.toast = reason;
    g_game.toastTime = 4.0f;
}

void updateMission(float dt) {
    if (!g_game.missionActive) return;
    if (g_game.curMission < 0 || g_game.curMission >= int(g_game.missions.size())) return;
    Mission& m = g_game.missions[g_game.curMission];
    g_game.missionTimer += dt;
    if (m.timed) {
        m.timeLimit -= dt;
        if (m.timeLimit <= 0) {
            missionFail("TIME EXPIRED");
            return;
        }
    }
    bool all = true;
    for (auto& o : m.objectives) {
        if (o.optional) continue;
        if (!o.done) {
            if (o.type == 0) {
                int count = countObjectiveVoxels(o);
                // "destroy" = the structure in the target area is mostly gone. The required
                // amount is capped so a big building is never an endless grind.
                int need = objectiveNeed(o);
                o.progress = o.targetCount - count;
                if (o.targetCount > 0 && o.progress >= need) {
                    o.done = true;
                    g_game.toast = std::string("OBJECTIVE COMPLETE: ") + o.text;
                    g_game.toastTime = 3.0f;
                    g_audio.play2d(SND_BEEP, 0.6f, 1.2f);
                }
            } else if (o.type == 2) {
                // horizontal distance with a generous vertical tolerance, so standing on the
                // ground floor, a ramp or a low ledge all count as "reached"
                Vec3 d3 = g_game.player.pos - o.pos;
                float dh = sqrtf(d3.x * d3.x + d3.z * d3.z);
                if (dh < o.radius && fabsf(d3.y) < 4.5f) {
                    o.done = true;
                    g_game.toast = std::string("OBJECTIVE COMPLETE: ") + o.text;
                    g_game.toastTime = 3.0f;
                    g_audio.play2d(SND_BEEP, 0.6f, 1.2f);
                }
            } else if (o.type == 4) {
                // triggered externally
            }
        }
        if (!o.done) all = false;
    }
    if (all && !m.objectives.empty()) missionComplete();
}

// ------------------------------------------------------------------ save/load
static void ensureDir(const std::string& d) {
    char cmd[512];
    snprintf(cmd, sizeof(cmd), "mkdir -p \"%s\"", d.c_str());
    platformMkdir(d.c_str());
}

void ensureSaveDir() { ensureDir(g_saveDir); }
std::string slotPath(int slot) {
    char buf[256];
    snprintf(buf, sizeof(buf), "%s/slot%d.frx", g_saveDir.c_str(), slot);
    return std::string(buf);
}
bool saveExists(int slot) {
    FILE* f = fopen(slotPath(slot).c_str(), "rb");
    if (!f) return false;
    fclose(f);
    return true;
}
void deleteSave(int slot) { remove(slotPath(slot).c_str()); }

// RLE chunk packing
static void packChunk(const uint8_t* v, std::vector<uint8_t>& out) {
    int i = 0;
    while (i < CHV) {
        uint8_t val = v[i];
        int run = 1;
        while (i + run < CHV && v[i + run] == val && run < 255) run++;
        out.push_back(val);
        out.push_back(uint8_t(run));
        i += run;
    }
}
static void unpackChunk(const std::vector<uint8_t>& in, size_t& off, uint8_t* v) {
    int i = 0;
    while (i < CHV && off + 1 < in.size()) {
        uint8_t val = in[off++];
        uint8_t run = in[off++];
        for (int k = 0; k < run && i < CHV; k++) v[i++] = val;
    }
}

bool saveGame(int slot) {
    ensureSaveDir();
    std::string path = slotPath(slot);
    FILE* f = fopen(path.c_str(), "wb");
    if (!f) return false;
    SaveHeader h;
    memset(&h, 0, sizeof(h));
    memcpy(h.magic, "FRACTURE", 8);
    h.version = 3;
    h.map = g_game.selMap;
    h.playerPos = g_game.player.pos;
    h.yaw = g_game.player.yaw;
    h.pitch = g_game.player.pitch;
    h.chapter = g_game.campaignChapter;
    h.unlockedTools = g_game.unlockedTools;
    h.money = int(g_game.money);
    h.sandbox = g_game.sandbox ? 1 : 0;
    h.sandboxOptions = g_game.sandboxOpts;
    for (int i = 0; i < 32 && i < int(g_game.missions.size()); i++)
        h.completedMissions[i] = g_game.missions[i].complete ? 1 : 0;
    // count chunks to save
    std::vector<Chunk*> saveList;
    for (Chunk* c : g_game.world.chunks)
        if (c && c->modified) saveList.push_back(c);
    h.chunkCount = int(saveList.size());
    fwrite(&h, sizeof(h), 1, f);
    int dims[3] = {g_game.world.dims[0], g_game.world.dims[1], g_game.world.dims[2]};
    fwrite(dims, sizeof(int), 3, f);
    // items
    int nItems = int(g_collectibles.size());
    fwrite(&nItems, sizeof(int), 1, f);
    for (auto& c : g_collectibles) {
        fwrite(&c.pos, sizeof(Vec3), 1, f);
        fwrite(&c.taken, sizeof(bool), 1, f);
        fwrite(&c.missionObj, sizeof(int), 1, f);
    }
    for (Chunk* c : saveList) {
        int coords[3] = {c->cx, c->cy, c->cz};
        fwrite(coords, sizeof(int), 3, f);
        std::vector<uint8_t> packed;
        packChunk(c->v, packed);
        int32_t n = int32_t(packed.size());
        fwrite(&n, sizeof(n), 1, f);
        fwrite(packed.data(), 1, packed.size(), f);
    }
    fclose(f);
    logf("[save] wrote %s (%d chunks)", path.c_str(), h.chunkCount);
    g_game.toast = "GAME SAVED";
    g_game.toastTime = 2.0f;
    return true;
}

bool loadGame(int slot) {
    std::string path = slotPath(slot);
    FILE* f = fopen(path.c_str(), "rb");
    if (!f) return false;
    SaveHeader h;
    if (fread(&h, sizeof(h), 1, f) != 1 || memcmp(h.magic, "FRACTURE", 8) != 0) {
        fclose(f);
        return false;
    }
    int dims[3];
    fread(dims, sizeof(int), 3, f);
    g_game.sandbox = h.sandbox != 0;
    gameLoadMap(h.map, g_game.sandbox, -1);
    g_game.world.free();
    g_game.world.allocate(dims[0], dims[1], dims[2]);
    g_game.world.computeSunMap();
    kMaps[h.map].build(g_game.world);
    g_game.world.computeSunMap();
    int nItems = 0;
    fread(&nItems, sizeof(int), 1, f);
    g_collectibles.clear();
    for (int i = 0; i < nItems; i++) {
        Collectible c;
        fread(&c.pos, sizeof(Vec3), 1, f);
        fread(&c.taken, sizeof(bool), 1, f);
        fread(&c.missionObj, sizeof(int), 1, f);
        g_collectibles.push_back(c);
    }
    for (int i = 0; i < h.chunkCount; i++) {
        int coords[3];
        if (fread(coords, sizeof(int), 3, f) != 3) break;
        int32_t n = 0;
        fread(&n, sizeof(n), 1, f);
        std::vector<uint8_t> packed(n);
        fread(packed.data(), 1, n, f);
        Chunk* c = g_game.world.chunkAt(coords[0], coords[1], coords[2]);
        if (!c) {
            // force allocation
            g_game.world.set(coords[0] * CH + 1, coords[1] * CH + 1, coords[2] * CH + 1,
                             MAT_AIR);
            c = g_game.world.chunkAt(coords[0], coords[1], coords[2]);
        }
        if (c) {
            size_t off = 0;
            unpackChunk(packed, off, c->v);
            int bx = c->cx * CH, by = c->cy * CH, bz = c->cz * CH;
            for (int z = 0; z < CH; z++)
                for (int y = 0; y < CH; y++)
                    for (int x = 0; x < CH; x++)
                        g_game.world.setRaw(bx + x, by + y, bz + z,
                                            c->v[(z * CH + y) * CH + x]);
            c->modified = true;
            c->mesh.dirty = true;
        }
    }
    fclose(f);
    g_game.world.computeSunMap();
    g_game.world.rebuildAll();
    g_game.player.pos = h.playerPos;
    g_game.player.yaw = h.yaw;
    g_game.player.pitch = h.pitch;
    g_game.campaignChapter = h.chapter;
    g_game.unlockedTools = h.unlockedTools;
    g_game.money = float(h.money);
    g_game.sandboxOpts = h.sandboxOptions;
    g_game.state = GS_PLAYING;
    logf("[load] %s ok", path.c_str());
    return true;
}

bool saveSandbox(const char* name) { return saveGame(9); }
bool loadSandbox(const char* name) { return loadGame(9); }

// ------------------------------------------------------------------ dynamic resolution
// This is a software rasteriser: fill rate is the bottleneck, and it scales directly with
// (render scale)^2. Rather than shipping one fixed resolution that is too slow on a laptop
// and too soft on a desktop, the internal resolution is trimmed/raised to hold the frame
// budget. The UI is drawn at native resolution either way, so only the 3D view changes.
static float g_resAccum = 0;
static int g_resSamples = 0;

void updateDynamicResolution(float dt) {
    Renderer& R = g_renderer;
    if (!g_game.dynamicResolution) return;
    if (g_game.state != GS_PLAYING && g_game.state != GS_PAUSED) return;
    // use measured wall-clock frame time, not the simulation dt: the headless harness runs a
    // fixed 60 Hz step, and on real hardware the two differ only when we are actually slow
    static std::chrono::high_resolution_clock::time_point last = 
        std::chrono::high_resolution_clock::now();
    auto now = std::chrono::high_resolution_clock::now();
    float real = std::chrono::duration<double>(now - last).count();
    last = now;
    if (real <= 0.0f || real > 0.5f) return;   // ignore pauses/loading hitches
    g_resAccum += real;
    g_resSamples++;
    if (g_resSamples < 40) return;
    float avg = g_resAccum / float(g_resSamples);
    g_resAccum = 0;
    g_resSamples = 0;
    int& scale = R.set.renderScale;
    int presetCap = g_game.resolutionCap;   // never exceed what the quality preset allows
    if (avg > 1.0f / 50.0f && scale > 50) {
        // too slow: drop in proportion to how far off we are
        int drop = (avg > 1.0f / 30.0f) ? 10 : 5;
        scale = std::max(50, scale - drop);
    } else if (avg < 1.0f / 58.0f && scale < presetCap) {
        scale = std::min(presetCap, scale + 2);
    }
}

// ------------------------------------------------------------------ main update
void gameUpdate(float dt) {
    g_game.deltaTime = dt;
    g_game.worldTime += dt;
    updateDynamicResolution(dt);
    g_camPosForBuild = g_game.player.pos;
    if (g_game.state == GS_PLAYING) {
        updatePlayer(dt);
        updateVehicles(dt);
        doToolUpdate(dt);
        g_phys.update(dt, g_game.world);
        g_fx.update(dt, g_game.world);
        structuralTick(g_game.world, dt);
        updateMission(dt);
        // collectibles pickup check
        for (auto& c : g_collectibles) {
            if (c.taken) continue;
            if (length(c.pos - g_game.player.pos) < 1.6f) {
                c.taken = true;
                g_audio.play2d(SND_PICKUP, 0.8f);
                if (g_game.curMission >= 0 && g_game.curMission < int(g_game.missions.size())) {
                    Mission& m = g_game.missions[g_game.curMission];
                    for (auto& o : m.objectives)
                        if (o.type == 1 && !o.done && o.targetId == c.missionObj) {
                            o.progress++;
                            if (o.progress >= o.targetCount) o.done = true;
                        }
                }
            }
        }
        // vehicle camera/exit
        if (g_game.player.inVehicle) {
            Vehicle& v = g_game.vehicles[g_game.player.vehicle];
            if (!v.active) {
                g_game.player.inVehicle = false;
            } else if (g_input.keyPressed['E']) {
                v.occupied = false;
                g_game.player.inVehicle = false;
                g_game.player.pos = v.pos + v.rot.x * (v.half.x + 1.0f);
                g_game.player.pos.y = v.pos.y;
            }
        }
        // timer / status
        g_game.world.buildDirty(7);
        g_game.player.flashlight = g_input.keys['F'] ? 1.0f : g_game.player.flashlight;
        if (g_input.keyPressed['F']) g_game.player.flashlight = g_game.player.flashlight > 0.5f ? 0 : 1;
        // keyboard tool selection
        for (int i = 0; i < 9; i++)
            if (g_input.keyPressed['1' + i]) {
                int idx = i;
                if (idx < TOOL_COUNT && (g_game.unlockedTools & (1 << idx))) {
                    g_game.player.tool = idx;
                    g_audio.play2d(SND_UI_CLICK, 0.4f);
                }
            }
        if (g_input.wheel != 0) {
            int dir = g_input.wheel > 0 ? 1 : -1;
            int t = g_game.player.tool;
            for (int i = 0; i < TOOL_COUNT; i++) {
                t = (t + dir + TOOL_COUNT) % TOOL_COUNT;
                if (g_game.unlockedTools & (1 << t)) {
                    g_game.player.tool = t;
                    break;
                }
            }
        }
        // health regen / fall damage
        if (length(g_game.player.vel) > 15.0f) {
            g_game.player.health -= dt * 2.0f;
            if (g_game.player.health <= 0 && !g_game.sandboxOpts.invincible)
                missionFail("ELIMINATED");
        }
        if (g_game.toastTime > 0) g_game.toastTime -= dt;
    } else {
        g_fx.update(dt * 0.0f, g_game.world);
    }
    g_game.introAlpha = fmaxf(0.0f, g_game.introAlpha - dt * 0.7f);
    // audio listener
    Vec3 eye = g_game.player.pos + Vec3(0, g_game.player.eyeHeight, 0);
    if (g_game.player.inVehicle) {
        Vehicle& v = g_game.vehicles[g_game.player.vehicle];
        eye = v.pos;
    }
    g_audio.update(eye, g_renderer.camRight);
    // fps
    g_game.fpsTimer += dt;
    g_game.fpsFrames++;
    if (g_game.fpsTimer > 0.5f) {
        g_game.fps = g_game.fpsFrames / g_game.fpsTimer;
        g_game.frameMs = g_game.fpsTimer / fmaxf(1, g_game.fpsFrames) * 1000.0f;
        g_game.fpsTimer = 0;
        g_game.fpsFrames = 0;
    }
}

// ------------------------------------------------------------------ render
static void updateCamera() {
    Player& p = g_game.player;
    Renderer& R = g_renderer;
    Vec3 eye;
    float yaw = p.yaw, pitch = p.pitch;
    if (p.inVehicle) {
        Vehicle& v = g_game.vehicles[p.vehicle];
        eye = v.pos + Vec3(0, v.half.y * 0.75f, 0) - v.rot.z * (v.half.z * 0.2f);
        yaw = v.yaw + PI;   // look forward along the vehicle
        pitch = p.pitch * 0.6f;
        yaw = p.yaw;
        eye = v.pos + Vec3(0, v.half.y * 0.8f, 0);
    } else {
        eye = p.pos + Vec3(0, p.eyeHeight + p.bob, 0);
    }
    R.camPos = eye;
    Basis b = Basis::yawPitch(yaw, pitch);
    R.camDir = normalize(b.mul(Vec3(0, 0, 1)));
    R.set.fov = p.fov;
    // shake
    if (g_fx.shake > 0.001f) {
        float s = g_fx.shake;
        R.camDir = normalize(R.camDir + Vec3(g_rng.range(-s, s), g_rng.range(-s, s),
                                             g_rng.range(-s, s)) * 0.22f);
        R.camPos = R.camPos + Vec3(g_rng.range(-s, s), g_rng.range(-s, s), g_rng.range(-s, s)) *
                              0.05f;
    }
}

// Load a map purely to sit behind the menus (attract-mode camera orbit).
void gameLoadMenuBackdrop() {
    gameLoadMap(0, true, -1);
    g_game.state = GS_MAIN_MENU;
    g_game.missionActive = false;
    // look at the street corner in Westhaven where the houses and the crane are
    g_game.menuCamTarget = Vec3(50.0f, 4.0f, 34.0f);
    g_game.menuCamDist = 40.0f;
    g_game.menuCamHeight = 9.0f;
    g_game.player.pos = Vec3(58.0f, 1.45f, 33.0f);
    g_game.player.yaw = 1.5708f;
    g_game.player.pitch = 0.0f;
}

// ------------------------------------------------------------------ menu backdrop
// The main menu is layered over a live 3D view of a loaded map with a slow orbiting
// camera, so the front end shows the real engine instead of a flat image.
void renderMenuBackdrop() {
    Renderer& R = g_renderer;
    if (g_game.world.chunks.empty()) return;
    float t = g_game.worldTime;
    Vec3 center = g_game.menuCamTarget;
    float ang = t * 0.06f;
    float rad = g_game.menuCamDist;
    Vec3 eye = center + Vec3(cosf(ang) * rad, g_game.menuCamHeight, sinf(ang) * rad);
    float wx = g_game.world.dims[0] * VOXSZ;
    float wz = g_game.world.dims[2] * VOXSZ;
    eye.x = clampf(eye.x, 3.0f, wx - 3.0f);
    eye.z = clampf(eye.z, 3.0f, wz - 3.0f);
    float top = g_game.world.topSolidY(int(eye.x / VOXSZ), int(eye.z / VOXSZ));
    if (eye.y < top + 2.0f) eye.y = top + 2.0f;
    R.camPos = eye;
    R.camDir = normalize(center - eye);
    R.set.fov = 62.0f;
    R.begin();
    R.drawSky();
    R.drawWorld(g_game.world);
    g_phys.draw();
    g_fx.render();
    R.flushSprites();
    R.finish();
}

void gameRender() {
    Renderer& R = g_renderer;
    if (g_game.state == GS_MAIN_MENU || g_game.state == GS_MAP_SELECT ||
        g_game.state == GS_SETTINGS || g_game.state == GS_CONTROLS || g_game.state == GS_CREDITS ||
        g_game.state == GS_CREDITS) {
        renderMenuBackdrop();
        renderMenu();
        return;
    }
    updateCamera();
    auto tp0 = std::chrono::high_resolution_clock::now();
    R.begin();
    R.drawSky();
    auto tp1 = std::chrono::high_resolution_clock::now();
    R.drawWorld(g_game.world);
    auto tp2 = std::chrono::high_resolution_clock::now();
    if (getenv("FRAC_PROF"))
        logf("[prof] sky %.1fms world %.1fms",
             std::chrono::duration<double, std::milli>(tp1 - tp0).count(),
             std::chrono::duration<double, std::milli>(tp2 - tp1).count());
    // world space markers for collectibles
    g_phys.draw();
    g_fx.render();
    R.flushSprites();
    // first-person tool must be drawn into the HDR buffer *before* tone mapping, otherwise
    // it silently disappears (it used to be drawn after finish())
    if (g_game.state == GS_PLAYING || g_game.state == GS_PAUSED) renderFirstPersonTool();
    R.finish();
    if (g_game.state == GS_PLAYING || g_game.state == GS_PAUSED) {
        renderHUD();
    }
    if (g_game.state == GS_PAUSED) renderPauseMenu();
    if (g_game.state == GS_MISSION_COMPLETE) renderMissionComplete();
    if (g_game.state == GS_FAILED) renderMissionComplete();
    if (g_game.state == GS_LOADING) {
        R.uiRect(0, 0, float(R.set.width), float(R.set.height), 0xFF0E1014);
        R.uiBigText(R.set.width * 0.5f - 260, R.set.height * 0.45f, "LOADING...", 0xFFE0E0E0, 0.8f);
    }
}

void gameShutdown() {
    g_game.world.free();
    logf("[shutdown]");
}

// ------------------------------------------------------------------ input glue
void handleMouseMove(float dx, float dy) {
    Player& p = g_game.player;
    float s = g_game.sens * 0.0022f;
    p.yaw -= dx * s;
    p.pitch += dy * s;
    p.pitch = clampf(p.pitch, -1.45f, 1.45f);
    if (p.yaw > PI * 4) p.yaw -= PI * 4;
    if (p.yaw < -PI * 4) p.yaw += PI * 4;
}

void gameHandleKey(int key, bool down) {
    if (!down) return;
    if (g_game.state == GS_PLAYING) {
        if (key == 'M') {
            g_game.showMinimap = !g_game.showMinimap;
            g_game.toast = g_game.showMinimap ? "MINIMAP ON" : "MINIMAP OFF";
            g_game.toastTime = 1.4f;
            return;
        }
        if (key == VK_KEY_F5) {
            ensureSaveDir();
            bool ok = saveGame(8);
            g_game.toast = ok ? "GAME SAVED (QUICK SLOT)" : "SAVE FAILED";
            g_game.toastTime = 2.0f;
            if (ok) g_audio.play2d(SND_BEEP, 0.5f, 1.3f);
            return;
        }
        if (key == VK_KEY_F9) {
            bool ok = loadGame(8);
            g_game.toast = ok ? "QUICK SAVE LOADED" : "NO QUICK SAVE";
            g_game.toastTime = 2.0f;
            return;
        }
    }
    if (key == 'T' && g_game.state == GS_PLAYING) {
        g_uiToolSelectOpen = 1;
        g_game.state = GS_TOOLSELECT;
    }
    if (key == 'Q' && g_game.state == GS_TOOLSELECT) {
        g_uiToolSelectOpen = 0;
        g_game.state = GS_PLAYING;
    }
}

void g_gameHandleKey(int key, bool down) { gameHandleKey(key, down); }

void gameHandleClick(int button, bool down) {
    (void)button;
    (void)down;
}

void PlatformInput::clearFrame() {
    mouseDX = mouseDY = 0;
    wheel = 0;
    for (int i = 0; i < 256; i++) keyPressed[i] = false;
    for (int i = 0; i < 3; i++) {
        mousePressed[i] = false;
        mouseReleased[i] = false;
    }
}
