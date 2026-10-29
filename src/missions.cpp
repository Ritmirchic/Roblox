// missions.cpp - campaign definition (30 missions across the six environments)
// Coordinates are world metres measured from the map origin corner and snapped to the
// ground, so objectives always line up with the structures built in maps.cpp.
#include "frac.h"

static Vec3 mkw(float mx, float mz, float lift = 0.0f) {
    World& w = g_game.world;
    float x = clampf(mx, 2.0f, w.dims[0] * VOXSZ - 2.0f);
    float z = clampf(mz, 2.0f, w.dims[2] * VOXSZ - 2.0f);
    float y = w.topSolidY(int(x / VOXSZ), int(z / VOXSZ));
    return Vec3(x, y + lift, z);
}

static Objective mkDestroy(const char* text, Vec3 p, float radius, int need = 0) {
    Objective o;
    o.text = text;
    o.type = 0;
    o.pos = p;
    o.radius = radius;
    // "breach"/"open" jobs only need a walkable hole; demolition jobs use the automatic
    // threshold derived from how much structure is actually standing there
    if (need == 0 && (strncmp(text, "BREACH", 6) == 0 || strncmp(text, "OPEN", 4) == 0))
        need = 340;
    o.need = need;
    return o;
}
static Objective mkCollect(const char* text, int count, int id) {
    Objective o;
    o.text = text;
    o.type = 1;
    o.targetCount = count;
    o.targetId = id;
    o.radius = 2.0f;
    return o;
}
static Objective mkReach(const char* text, Vec3 p, float radius) {
    Objective o;
    o.text = text;
    o.type = 2;
    o.pos = p;
    o.radius = radius;
    return o;
}

static Mission startMission(int id, int chapter, const char* name, const char* brief,
                            const char* hint, Vec3 start, float yaw) {
    Mission m;
    m.id = id;
    m.chapter = chapter;
    m.name = name;
    m.brief = brief;
    m.hint = hint;
    m.startPos = start;
    m.startYaw = yaw;
    m.money = 2500 + chapter * 1800;
    m.rewardTool = -1;
    return m;
}

std::vector<Mission> buildMissions(int mapIdx) {
    std::vector<Mission> list;
    clearCollectibles();

    if (mapIdx == 0) {
        // ------------------------------------------------ WESTHAVEN
        {   // 1 - introduce the hammer
            Mission m = startMission(0, 1, "FIRST CONTRACT",
                                     "The developer wants the blue house gone, starting with the "
                                     "east wall. Break in, then walk through your own doorway.",
                                     "Sledgehammer: LMB. Concrete needs a couple of hits.",
                                     mkw(58, 33), 1.5708f);
            m.objectives.push_back(mkDestroy("BREACH THE EAST WALL", mkw(47, 22.5f, 1.0f), 3.0f));
            m.objectives.push_back(mkReach("ENTER THE HOUSE", mkw(44, 22.5f), 3.5f));
            m.rewardTool = TOOL_BLOWTORCH;
            list.push_back(m);
        }
        {   // 2 - shotgun
            Mission m = startMission(1, 1, "CLEARING THE LOT",
                                     "Three structures, one afternoon. The client wants them "
                                     "unrecognisable.",
                                     "The shotgun widens holes fast. Aim at the same spot.",
                                     mkw(58, 44), 1.5708f);
            m.objectives.push_back(mkDestroy("DESTROY THE GARAGE WALL", mkw(49, 21.0f), 3.0f));
            m.objectives.push_back(mkDestroy("SMASH THE HOUSE WINDOWS", mkw(47, 40.5f), 3.0f));
            m.objectives.push_back(mkDestroy("WRECK THE STORE FRONT", mkw(76, 49.0f), 4.0f));
            m.rewardTool = TOOL_DRILL;
            list.push_back(m);
        }
        {   // 3 - collectibles
            Mission m = startMission(2, 1, "EVIDENCE RECOVERY",
                                     "Three crates of documents are still inside the houses. "
                                     "Bring them out before the dozers arrive.",
                                     "Walk up to a crate and press E.",
                                     mkw(58, 33), 1.5708f);
            m.objectives.push_back(mkCollect("RECOVER 3 DOCUMENT CRATES", 3, 1));
            spawnCollectible(mkw(44, 22.5f, 0.8f), 1);
            spawnCollectible(mkw(80, 27.0f, 0.8f), 1);
            spawnCollectible(mkw(44, 46.0f, 0.8f), 1);
            m.rewardTool = TOOL_CABLE;
            list.push_back(m);
        }
        {   // 4 - charges, timed
            Mission m = startMission(3, 1, "GAS LEAK",
                                     "The station's main tank is venting. Bring the canopy down "
                                     "before the fire brigade seals the block.",
                                     "Charges: LMB to stick, R or RMB to detonate.",
                                     mkw(58, 74), 1.5708f);
            m.objectives.push_back(mkDestroy("COLLAPSE THE STATION CANOPY", mkw(40, 80), 6.0f));
            m.timed = true;
            m.timeLimit = 240;
            m.rewardTool = TOOL_ROCKET;
            list.push_back(m);
        }
        {   // 5 - big finale for the district
            Mission m = startMission(4, 1, "URBAN RENEWAL",
                                     "Everything on the block goes. Make an example of it.",
                                     "Rockets for distance, charges for supports.",
                                     mkw(58, 44), 1.5708f);
            m.objectives.push_back(mkDestroy("DEMOLISH HOUSE A", mkw(42, 22.5f), 5.0f));
            m.objectives.push_back(mkDestroy("DEMOLISH HOUSE B", mkw(42, 45.0f), 5.0f));
            m.objectives.push_back(mkDestroy("BRING DOWN THE SITE CRANE", mkw(74, 82), 5.0f));
            m.rewardTool = TOOL_EXTINGUISHER;
            list.push_back(m);
        }
    } else if (mapIdx == 1) {
        // ------------------------------------------------ BLACKSTONE
        {   // 6
            Mission m = startMission(5, 2, "INDUSTRIAL DAMAGE",
                                     "Warehouse B was welded shut. Make your own entrance and "
                                     "clear the racking.",
                                     "Charges on the wall, then walk through the hole.",
                                     mkw(66, 46), 1.5708f);
            m.objectives.push_back(mkDestroy("BREACH WAREHOUSE B", mkw(78, 22.0f), 5.0f));
            m.objectives.push_back(mkDestroy("DESTROY THE SHELVING ROWS", mkw(92, 22.0f), 6.0f));
            m.rewardTool = TOOL_GRAPPLE;
            list.push_back(m);
        }
        {   // 7
            Mission m = startMission(6, 2, "CHAIN REACTION",
                                     "Fuel storage is the priority. One charge should do the "
                                     "rest of the work.",
                                     "The tanks chain detonate. Keep your distance.",
                                     mkw(66, 46), 0);
            m.objectives.push_back(mkDestroy("DETONATE THE TANK FARM", mkw(64, 41.0f), 9.0f));
            m.objectives.push_back(mkDestroy("DROP THE FACTORY CHIMNEY", mkw(33, 68), 6.0f));
            m.rewardTool = TOOL_CUTTER;
            list.push_back(m);
        }
        {   // 8
            Mission m = startMission(7, 2, "MACHINERY SABOTAGE",
                                     "The furnace line has to go before the night shift clocks in.",
                                     "The cutter slices metal fast. Aim at the pipe runs.",
                                     mkw(66, 74), 1.5708f);
            m.objectives.push_back(mkDestroy("WRECK THE FURNACES", mkw(96, 96), 6.0f));
            m.objectives.push_back(mkDestroy("SEVER THE PIPE RUNS", mkw(90, 84), 4.0f));
            m.timed = true;
            m.timeLimit = 240;
            m.rewardTool = TOOL_CABLE;
            list.push_back(m);
        }
        {   // 9
            Mission m = startMission(8, 2, "HEAVY CARGO",
                                     "A jammed turbine housing blocks the access road. Break it "
                                     "up and reach the extraction point.",
                                     "The drill eats reinforced concrete.",
                                     mkw(66, 58), 0);
            m.objectives.push_back(mkDestroy("BREAK THE TURBINE HOUSING", mkw(74, 55), 4.0f));
            m.objectives.push_back(mkReach("REACH THE EXTRACTION POINT", mkw(30, 100), 6.0f));
            m.rewardTool = TOOL_DRILL;
            list.push_back(m);
        }
        {   // 10
            Mission m = startMission(9, 2, "REFINERY TAKEDOWN",
                                     "The whole plant comes down. Nothing leaves standing.",
                                     "Fire spreads through wood and fuel - keep an escape route.",
                                     mkw(66, 46), 0);
            m.objectives.push_back(mkDestroy("COLLAPSE WAREHOUSE A", mkw(36, 22), 8.0f));
            m.objectives.push_back(mkDestroy("DESTROY THE FURNACE HALL", mkw(96, 92), 8.0f));
            m.objectives.push_back(mkDestroy("BRING DOWN THE GANTRY", mkw(82, 54), 6.0f));
            m.rewardTool = TOOL_AIRSTRIKE;
            list.push_back(m);
        }
    } else if (mapIdx == 2) {
        // ------------------------------------------------ DOWNTOWN
        {   // 11
            Mission m = startMission(10, 3, "THE CORPORATE WAR",
                                     "A rival firm owns this block. Make their tower unusable.",
                                     "Take out the ground floor columns - the floors follow.",
                                     mkw(56, 44), 0);
            m.objectives.push_back(mkDestroy("BREACH THE TOWER GROUND FLOOR", mkw(21, 20), 5.0f));
            m.objectives.push_back(mkDestroy("COLLAPSE THE PARKING DECK", mkw(20, 81), 7.0f));
            m.rewardTool = TOOL_CUTTER;
            list.push_back(m);
        }
        {   // 12
            Mission m = startMission(11, 3, "PRECISION ENTRY",
                                     "Security watches every door. Go through the facade instead "
                                     "and lift their files.",
                                     "A rocket through the glass opens a whole floor.",
                                     mkw(56, 44), 0);
            m.objectives.push_back(mkDestroy("OPEN THE GLASS FACADE", mkw(84, 20), 5.0f));
            m.objectives.push_back(mkCollect("RECOVER 2 FILES", 2, 2));
            spawnCollectible(mkw(84, 18, 1.0f), 2);
            spawnCollectible(mkw(48, 44, 1.0f), 2);
            m.rewardTool = TOOL_GRAPPLE;
            list.push_back(m);
        }
        {   // 13
            Mission m = startMission(12, 3, "TIMED EXTRACTION",
                                     "Three targets, four minutes, one way out.",
                                     "Plan the escape before you set the first charge.",
                                     mkw(56, 60), 0);
            m.objectives.push_back(mkDestroy("TARGET A - SHOP ROW", mkw(40, 100), 5.0f));
            m.objectives.push_back(mkDestroy("TARGET B - OFFICE BLOCK", mkw(20, 81), 6.0f));
            m.objectives.push_back(mkDestroy("TARGET C - SKYBRIDGE", mkw(56, 56), 6.0f));
            m.timed = true;
            m.timeLimit = 300;
            m.rewardTool = TOOL_DRILL;
            list.push_back(m);
        }
        {   // 14
            Mission m = startMission(13, 3, "VERTICAL ASSAULT",
                                     "Get onto the eight storey roof without using the stairs.",
                                     "Grapple to a ledge, or blast your own staircase.",
                                     mkw(80, 44), 0);
            m.objectives.push_back(mkReach("TOWER ROOFTOP", mkw(84, 20), 4.0f));
            m.objectives.push_back(mkDestroy("DESTROY THE ROOF HVAC", mkw(74, 12), 4.0f));
            m.rewardTool = TOOL_AIRSTRIKE;
            list.push_back(m);
        }
        {   // 15
            Mission m = startMission(14, 3, "DOWNTOWN COLLAPSE",
                                     "Bring the block down. The city is watching.",
                                     "Ground floor supports decide everything.",
                                     mkw(56, 60), 0);
            m.objectives.push_back(mkDestroy("COLLAPSE THE GLASS TOWER", mkw(84, 20), 8.0f));
            m.objectives.push_back(mkDestroy("COLLAPSE THE OFFICE BLOCK", mkw(85, 81), 8.0f));
            m.rewardTool = -1;
            list.push_back(m);
        }
    } else if (mapIdx == 3) {
        // ------------------------------------------------ HARBOR
        {   // 16
            Mission m = startMission(15, 4, "CRITICAL FAILURE",
                                     "A container stack is leaning over the quay. Topple it "
                                     "into the water before it takes the crane with it.",
                                     "Charges at the base of the stack.",
                                     mkw(70, 60), 0);
            m.objectives.push_back(mkDestroy("TOPPLE THE CONTAINER STACK", mkw(40, 50), 5.0f));
            m.objectives.push_back(mkReach("RETURN TO THE QUAY", mkw(70, 62), 6.0f));
            m.rewardTool = TOOL_CABLE;
            list.push_back(m);
        }
        {   // 17
            Mission m = startMission(16, 4, "BRIDGE COLLAPSE",
                                     "The gantry blocks the channel. Drop it and the tanks "
                                     "behind it.",
                                     "Cut the legs, then the deck.",
                                     mkw(70, 60), 0);
            m.objectives.push_back(mkDestroy("BRING DOWN THE GANTRY CRANE", mkw(60, 64), 6.0f));
            m.objectives.push_back(mkDestroy("DESTROY THE FUEL TANKS", mkw(23, 50), 6.0f));
            m.rewardTool = TOOL_EXTINGUISHER;
            list.push_back(m);
        }
        {   // 18
            Mission m = startMission(17, 4, "SALVAGE RUN",
                                     "Three manifests are aboard the moored freighter. Get them "
                                     "before the tide turns.",
                                     "The hull is steel - the drill or the cutter work best.",
                                     mkw(70, 66), 0);
            m.objectives.push_back(mkCollect("RECOVER 3 MANIFESTS", 3, 3));
            spawnCollectible(mkw(64, 92, 1.0f), 3);
            spawnCollectible(mkw(72, 100, 1.0f), 3);
            spawnCollectible(mkw(78, 90, 1.0f), 3);
            m.timed = true;
            m.timeLimit = 260;
            m.rewardTool = TOOL_CABLE;
            list.push_back(m);
        }
        {   // 19
            Mission m = startMission(18, 4, "TANKER FIRE",
                                     "A tanker has ruptured and the docks are burning. Bring the "
                                     "tanks down and clear the warehouse.",
                                     "The extinguisher keeps the fire off you.",
                                     mkw(70, 60), 0);
            m.objectives.push_back(mkDestroy("DESTROY THE TANK FARM", mkw(23, 50), 6.0f));
            m.objectives.push_back(mkDestroy("BREACH THE WEST WAREHOUSE", mkw(40, 15), 7.0f));
            m.rewardTool = TOOL_DRILL;
            list.push_back(m);
        }
        {   // 20
            Mission m = startMission(19, 4, "HARBOR BREAKDOWN",
                                     "Total clearance of the terminal. Everything is fair game.",
                                     "Take your time and work the chain reactions.",
                                     mkw(70, 62), 0);
            m.objectives.push_back(mkDestroy("CLEAR THE CONTAINER YARD", mkw(60, 50), 8.0f));
            m.objectives.push_back(mkDestroy("DESTROY THE SHIP SUPERSTRUCTURE", mkw(68, 108), 7.0f));
            m.objectives.push_back(mkDestroy("COLLAPSE THE CRANE", mkw(50, 64), 6.0f));
            m.rewardTool = TOOL_AIRSTRIKE;
            list.push_back(m);
        }
    } else if (mapIdx == 4) {
        // ------------------------------------------------ RED CANYON
        {   // 21
            Mission m = startMission(20, 5, "TEST RANGE ALPHA",
                                     "Prove the new charges on the target frames and the "
                                     "watchtower.",
                                     "Charges and rockets. Watch the range markers.",
                                     mkw(64, 78), 0);
            m.objectives.push_back(mkDestroy("DESTROY THE TARGET FRAMES", mkw(56, 67), 6.0f));
            m.objectives.push_back(mkDestroy("DESTROY THE WATCHTOWER", mkw(52, 26), 5.0f));
            m.rewardTool = TOOL_ROCKET;
            list.push_back(m);
        }
        {   // 22
            Mission m = startMission(21, 5, "BUNKER BUSTER",
                                     "Penetrate the reinforced bunkers and pull the test data.",
                                     "Reinforced concrete needs the drill or heavy explosives.",
                                     mkw(64, 78), 0);
            m.objectives.push_back(mkDestroy("BREACH BUNKER ONE", mkw(43, 44), 5.0f));
            m.objectives.push_back(mkCollect("RECOVER 2 DATA CORES", 2, 4));
            spawnCollectible(mkw(43, 44, 1.0f), 4);
            spawnCollectible(mkw(86, 42, 1.0f), 4);
            m.rewardTool = TOOL_CABLE;
            list.push_back(m);
        }
        {   // 23
            Mission m = startMission(22, 5, "UNDERGROUND",
                                     "There is a tunnel network under the range. Open it up.",
                                     "Dig straight down with the drill.",
                                     mkw(64, 78), 0);
            m.objectives.push_back(mkDestroy("OPEN THE TUNNEL NETWORK", mkw(56, 44), 6.0f));
            m.objectives.push_back(mkReach("REACH THE UNDERGROUND CHAMBER", mkw(70, 44), 7.0f));
            m.rewardTool = TOOL_GRAPPLE;
            list.push_back(m);
        }
        {   // 24
            Mission m = startMission(23, 5, "CANYON BRIDGE",
                                     "The bridge must go. Take every pier with it.",
                                     "Cut the piers, then drop the span.",
                                     mkw(64, 84), 0);
            m.objectives.push_back(mkDestroy("COLLAPSE THE BRIDGE", mkw(64, 102), 8.0f));
            m.timed = true;
            m.timeLimit = 240;
            m.rewardTool = TOOL_DRILL;
            list.push_back(m);
        }
        {   // 25
            Mission m = startMission(24, 5, "TOTAL FRACTURE",
                                     "The range is being decommissioned. Flatten every bunker, "
                                     "tower and store. Leave nothing standing.",
                                     "This is what you trained for.",
                                     mkw(64, 78), 0);
            m.objectives.push_back(mkDestroy("BUNKER COMPLEX", mkw(43, 44), 8.0f));
            m.objectives.push_back(mkDestroy("SECOND BUNKER", mkw(86, 42), 8.0f));
            m.objectives.push_back(mkDestroy("EXPLOSIVES STORE", mkw(95, 86), 6.0f));
            m.objectives.push_back(mkDestroy("BRIDGE SPAN", mkw(64, 102), 8.0f));
            m.rewardTool = TOOL_AIRSTRIKE;
            list.push_back(m);
        }
    } else {
        // ------------------------------------------------ GRAND MALL
        {   // 26
            Mission m = startMission(25, 5, "GRAND OPENING",
                                     "The mall never opened. Time to close it for good.",
                                     "Interior demolition - work the atrium columns.",
                                     mkw(60, 100), 0);
            m.objectives.push_back(mkDestroy("BREACH THE MALL FACADE", mkw(60, 90), 7.0f));
            m.objectives.push_back(mkDestroy("COLLAPSE THE ATRIUM", mkw(60, 60), 9.0f));
            m.rewardTool = TOOL_ROCKET;
            list.push_back(m);
        }
        {   // 27
            Mission m = startMission(26, 5, "FLOOR BY FLOOR",
                                     "Bring the upper floors down onto the ground floor.",
                                     "Kill the support columns on level one.",
                                     mkw(60, 100), 0);
            m.objectives.push_back(mkDestroy("WEST SHOP ROW", mkw(28, 40), 7.0f));
            m.objectives.push_back(mkDestroy("EAST SHOP ROW", mkw(92, 40), 7.0f));
            m.objectives.push_back(mkDestroy("ROOFTOP HVAC", mkw(30, 32), 5.0f));
            m.rewardTool = TOOL_CUTTER;
            list.push_back(m);
        }
        {   // 28
            Mission m = startMission(27, 5, "PARKING GARAGE",
                                     "Drop the parking deck onto the mall entrance.",
                                     "Cut the pillars at the base.",
                                     mkw(44, 14), 0);
            m.objectives.push_back(mkDestroy("COLLAPSE THE PARKING DECK", mkw(46, 12), 8.0f));
            m.timed = true;
            m.timeLimit = 220;
            m.rewardTool = TOOL_DRILL;
            list.push_back(m);
        }
        {   // 29
            Mission m = startMission(28, 5, "EVACUATION",
                                     "Get the last three crates out before the mall comes down.",
                                     "Move fast - the structure is already unstable.",
                                     mkw(60, 100), 0);
            m.objectives.push_back(mkCollect("RECOVER 3 CRATES", 3, 5));
            spawnCollectible(mkw(40, 60, 1.0f), 5);
            spawnCollectible(mkw(80, 60, 1.0f), 5);
            spawnCollectible(mkw(60, 40, 1.0f), 5);
            m.timed = true;
            m.timeLimit = 200;
            m.rewardTool = TOOL_AIRSTRIKE;
            list.push_back(m);
        }
        {   // 30
            Mission m = startMission(29, 5, "TOTAL DESTRUCTION",
                                     "The commissioner's last order: leave a hole in the skyline.",
                                     "Everything you have. Bring the complex down.",
                                     mkw(60, 100), 0);
            m.objectives.push_back(mkDestroy("DESTROY THE WEST WING", mkw(24, 60), 9.0f));
            m.objectives.push_back(mkDestroy("DESTROY THE EAST WING", mkw(96, 60), 9.0f));
            m.objectives.push_back(mkDestroy("DESTROY THE PARKING GARAGE", mkw(46, 12), 9.0f));
            m.objectives.push_back(mkReach("EXTRACT", mkw(60, 110), 8.0f));
            m.rewardTool = -1;
            list.push_back(m);
        }
    }
    return list;
}
