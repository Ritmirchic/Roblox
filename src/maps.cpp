// maps.cpp - level construction: six original destructible environments
#include "frac.h"

MapDef kMaps[6] = {
    {"WESTHAVEN SUBURBS", "Residential district. Houses, garages, gas station, construction site.",
     620, 120, 620, 1, 1, 0, buildWesthaven, {}, 0},
    {"BLACKSTONE INDUSTRIAL", "Refinery and factories. Chain reaction demolition playground.",
     660, 130, 620, 2, 2, 1, buildBlackstone, {}, 0},
    {"DOWNTOWN COLLAPSE", "Dense urban blocks. Vertical destruction, parking decks.",
     560, 180, 560, 3, 1, 0, buildDowntown, {}, 0},
    {"HARBOR BREAKDOWN", "Container terminal, ships and cranes. Heavy wrecking.",
     700, 140, 640, 4, 0, 1, buildHarbor, {}, 0},
    {"RED CANYON TEST RANGE", "Military demolition range. Bunkers, tunnels, targets.",
     640, 150, 620, 5, 2, 2, buildRedCanyon, {}, 0},
    {"THE GRAND MALL", "Shopping and entertainment complex. Interior demolition.",
     600, 140, 600, 6, 1, 1, buildGrandMall, {}, 0},
};
int g_mapCount = 6;

static inline int MB(float metres) { return int(metres / VOXSZ + 0.5f); }

// ------------------------------------------------------------------ builder
void Builder::fill(int x0, int y0, int z0, int x1, int y1, int z1, uint8_t m) {
    w->fillFast(x0, y0, z0, x1, y1, z1, m);
}
void Builder::box(int x0, int y0, int z0, int x1, int y1, int z1, uint8_t m) {
    if (x0 > x1) std::swap(x0, x1);
    if (z0 > z1) std::swap(z0, z1);
    if (y0 > y1) std::swap(y0, y1);
    fill(x0, y0, z0, x1, y0, z1, m);
    fill(x0, y1, z0, x1, y1, z1, m);
    fill(x0, y0, z0, x0, y1, z1, m);
    fill(x1, y0, z0, x1, y1, z1, m);
    fill(x0, y0, z0, x1, y1, z0, m);
    fill(x0, y0, z1, x1, y1, z1, m);
}
void Builder::walls(int x0, int z0, int x1, int z1, int y0, int y1, uint8_t m, int thick) {
    if (x0 > x1) std::swap(x0, x1);
    if (z0 > z1) std::swap(z0, z1);
    fill(x0, y0, z0, x1, y1, z0 + thick - 1, m);
    fill(x0, y0, z1 - thick + 1, x1, y1, z1, m);
    fill(x0, y0, z0, x0 + thick - 1, y1, z1, m);
    fill(x1 - thick + 1, y0, z0, x1, y1, z1, m);
}
void Builder::pillar(int x, int z, int y0, int y1, int r, uint8_t m) {
    fill(x - r, y0, z - r, x + r, y1, z + r, m);
}
void Builder::floorPlane(int x0, int z0, int x1, int z1, int y, uint8_t m) {
    fill(x0, y, z0, x1, y, z1, m);
}
void Builder::room(int x0, int z0, int x1, int z1, int y0, int y1, uint8_t mat, uint8_t floorMat,
                   uint8_t ceilMat, int thick) {
    if (x0 > x1) std::swap(x0, x1);
    if (z0 > z1) std::swap(z0, z1);
    fill(x0, y0, z0, x1, y0 + thick - 1, z1, floorMat);
    fill(x0, y1 - thick + 1, z0, x1, y1, z1, ceilMat);
    walls(x0, z0, x1, z1, y0 + thick, y1 - thick, mat, thick);
}
void Builder::doorway(int x, int y0, int z, int wdt, int hgt, bool alongX) {
    if (alongX) fill(x - wdt / 2, y0, z - 3, x + wdt / 2, y0 + hgt, z + 3, MAT_AIR);
    else fill(x - 3, y0, z - wdt / 2, x + 3, y0 + hgt, z + wdt / 2, MAT_AIR);
}
void Builder::window(int x, int y, int z, int wdt, int hgt, bool alongX) {
    if (alongX) {
        fill(x - wdt / 2, y, z - 3, x + wdt / 2, y + hgt, z + 3, MAT_AIR);
        fill(x - wdt / 2, y, z - 1, x + wdt / 2, y + hgt, z + 1, MAT_GLASS);
    } else {
        fill(x - 3, y, z - wdt / 2, x + 3, y + hgt, z + wdt / 2, MAT_AIR);
        fill(x - 1, y, z - wdt / 2, x + 1, y + hgt, z + wdt / 2, MAT_GLASS);
    }
}
void Builder::stairs(int x, int z, int y0, int steps, int dir, uint8_t m) {
    for (int i = 0; i < steps; i++) {
        int sx = x, sz = z + dir * i;
        fill(sx - 5, y0 + i, sz, sx + 5, y0 + i, sz + dir, m);
        fill(sx - 5, y0, sz, sx + 5, y0 + i, sz + dir, m);
    }
}
void Builder::vehicleRoad(int x0, int z0, int x1, int z1, uint8_t m) {
    if (x0 > x1) std::swap(x0, x1);
    if (z0 > z1) std::swap(z0, z1);
    fill(x0, 0, z0, x1, 0, z1, m);
    // sidewalks
    fill(x0 - 4, 1, z0, x1 + 4, 1, z1, MAT_CONCRETE);
    fill(x0 + 2, 1, z0 + 2, x1 - 2, 1, z1 - 2, m);
}
void Builder::tree(int x, int z, int y, float height) {
    int h = MB(height);
    fill(x - 1, y, z - 1, x + 1, y + h, z + 1, MAT_BARK);
    int r = MB(1.6f) + rng.irange(0, 2);
    for (int dy = -r; dy <= r; dy++)
        for (int dz = -r; dz <= r; dz++)
            for (int dx = -r; dx <= r; dx++) {
                float d = sqrtf(float(dx * dx + dy * dy * 2 + dz * dz));
                if (d > r * 1.05f) continue;
                if (rng.f() < 0.12f) continue;
                fill(x + dx, y + h - r / 2 + dy + r, z + dz, x + dx,
                     y + h - r / 2 + dy + r, z + dz, MAT_LEAVES);
            }
}
void Builder::fence(int x0, int z0, int x1, int z1, uint8_t m) {
    if (x0 == x1) {
        for (int z = std::min(z0, z1); z <= std::max(z0, z1); z++) {
            fill(x0, 1, z, x0, MB(1.1f), z, m);
        }
    } else {
        for (int x = std::min(x0, x1); x <= std::max(x0, x1); x++) {
            fill(x, 1, z0, x, MB(1.1f), z0, m);
        }
    }
}
void Builder::lamp(int x, int z, int y) {
    fill(x, y, z, x, y + MB(5.0f), z, MAT_METAL);
    fill(x - 1, y + MB(5.0f), z - 1, x + 1, y + MB(5.0f), z + 1, MAT_LAMP);
}
void Builder::crate(int x, int y, int z, uint8_t m, int size) {
    fill(x, y, z, x + size, y + size, z + size, m);
    // edge frame
    fill(x, y, z, x + size, y, z, MAT_WOOD_DARK);
}
void Builder::barrel(int x, int y, int z, uint8_t m) {
    fill(x - 2, y, z - 2, x + 2, y + MB(1.0f), z + 2, m);
    fill(x - 2, y + MB(0.85f), z - 2, x + 2, y + MB(0.9f), z + 2, MAT_METAL);
}
void Builder::car(int x, int z, int y, uint8_t body, float yaw) {
    (void)yaw;
    fill(x - 8, y + 2, z - 3, x + 8, y + 6, z + 3, body);
    fill(x - 4, y + 7, z - 3, x + 3, y + 10, z + 3, body);
    fill(x - 3, y + 8, z - 3, x - 1, y + 10, z + 3, MAT_GLASS);
    fill(x - 8, y, z - 4, x - 5, y + 2, z + 4, MAT_RUBBER);
    fill(x + 5, y, z - 4, x + 8, y + 2, z + 4, MAT_RUBBER);
}

// ------------------------------------------------------------------ shared pieces
static void groundBase(Builder& b, uint8_t top, float hilliness) {
    World& w = *b.w;
    int hgt = MB(1.2f);
    for (int z = 0; z < w.dims[2]; z++)
        for (int x = 0; x < w.dims[0]; x++) {
            float n = fbm2(x * 0.012f, z * 0.012f, 3);
            int h = hgt + int((n - 0.5f) * hilliness);
            h = clampi(h, 2, w.dims[1] - 10);
            w.fillFast(x, 0, z, x, h - 1, z, MAT_SOIL);
            w.fillFast(x, h, z, x, h, z, top);
        }
}

static void furnishLiving(Builder& b, int x0, int z0, int x1, int z1, int y) {
    // sofa
    b.fill(x0 + 2, y + 1, z0 + 2, x0 + MB(2.2f), y + MB(0.5f), z0 + MB(1.0f), MAT_FABRIC);
    b.fill(x0 + 2, y + MB(0.5f), z0 + 2, x0 + MB(2.2f), y + MB(0.9f), z0 + 3, MAT_FABRIC);
    // coffee table
    b.fill(x0 + MB(2.6f), y + MB(0.45f), z0 + MB(1.4f), x0 + MB(3.8f), y + MB(0.5f),
           z0 + MB(2.4f), MAT_WOOD);
    // tv unit
    b.fill(x1 - MB(1.2f), y + 1, z0 + MB(1.0f), x1 - MB(0.9f), y + MB(0.6f), z0 + MB(2.4f),
           MAT_WOOD_DARK);
    b.fill(x1 - MB(0.95f), y + MB(0.8f), z0 + MB(1.1f), x1 - MB(0.9f), y + MB(1.5f),
           z0 + MB(2.3f), MAT_PLASTIC);
    (void)x1; (void)z1;
}

static void furnishKitchen(Builder& b, int x0, int z0, int x1, int z1, int y) {
    b.fill(x0 + 2, y + 1, z1 - MB(1.4f), x0 + MB(4.0f), y + MB(0.9f), z1 - MB(1.1f),
           MAT_PAINT_WHITE);
    b.fill(x0 + 2, y + 1, z1 - MB(1.4f), x0 + 2, y + MB(2.0f), z1 - MB(1.1f), MAT_PAINT_WHITE);
    // fridge
    b.fill(x1 - MB(1.6f), y + 1, z1 - MB(1.6f), x1 - MB(0.9f), y + MB(1.9f), z1 - MB(1.0f),
           MAT_METAL);
    (void)x1;
}

static void buildHouse(Builder& b, int x0, int z0, int wm, int dm, int floors, uint8_t wallMat,
                       uint8_t roofMat, bool garage, bool pool) {
    World& w = *b.w;
    int X0 = x0, Z0 = z0;
    int X1 = x0 + MB(float(wm)), Z1 = z0 + MB(float(dm));
    int floorH = MB(2.9f);
    int th = 2;
    int groundY = int(w.topSolidY(X0 + 2, Z0 + 2) / VOXSZ);
    if (groundY < 2) groundY = 2;
    b.fill(X0, groundY, Z0, X1, groundY, Z1, MAT_CONCRETE);
    int y = groundY + 1;
    for (int f = 0; f < floors; f++) {
        int yTop = y + floorH;
        // exterior walls
        b.walls(X0, Z0, X1, Z1, y, yTop, wallMat, th);
        // interior partition (split into 2-3 rooms)
        int midX = (X0 + X1) / 2;
        b.fill(midX, y, Z0 + th, midX + th - 1, yTop, Z1 - th, wallMat);
        b.doorway(midX, y, Z0 + MB(3.0f), MB(0.9f), MB(2.05f), false);
        if (f == 0) {
            int midZ = (Z0 + Z1) / 2 + MB(1.0f);
            b.fill(X0 + th, y, midZ, midX, yTop, midZ + th - 1, wallMat);
            b.doorway(X0 + MB(2.5f), y, midZ, MB(0.9f), MB(2.05f), true);
            // front door
            b.fill(X0 + MB(3.0f), y, Z0, X0 + MB(4.0f), y + MB(2.1f), Z0 + th - 1, MAT_WOOD);
        } else {
            int midZ = (Z0 + Z1) / 2;
            b.fill(X0 + th, y, midZ, midX, yTop, midZ + th - 1, wallMat);
            b.doorway(X0 + MB(3.0f), y, midZ, MB(0.9f), MB(2.05f), true);
        }
        // windows
        for (int i = 0; i < 3; i++) {
            int wx = X0 + MB(2.5f) + i * MB(3.2f);
            b.window(wx, y + MB(1.0f), Z0, MB(1.2f), MB(1.4f), true);
            b.window(wx, y + MB(1.0f), Z1, MB(1.2f), MB(1.4f), true);
        }
        for (int i = 0; i < 2; i++) {
            int wz = Z0 + MB(2.5f) + i * MB(3.4f);
            b.window(X1, y + MB(1.0f), wz, MB(1.2f), MB(1.4f), false);
        }
        // furniture
        if (f == 0) {
            furnishLiving(b, X0 + th, Z0 + th, midX, Z1 - th, y);
            furnishKitchen(b, midX + th, Z0 + th, X1 - th, Z1 - th, y);
        } else {
            int bx = X0 + MB(1.0f);
            b.fill(bx, y + 1, Z0 + MB(4.5f), bx + MB(2.0f), y + MB(0.6f), Z0 + MB(6.5f),
                   MAT_WOOD_DARK);
            b.fill(bx, y + MB(0.6f), Z0 + MB(4.5f), bx + MB(2.0f), y + MB(0.8f), Z0 + MB(6.5f),
                   MAT_FABRIC);
            b.fill(midX + MB(1.2f), y + 1, Z0 + MB(1.2f), midX + MB(2.2f), y + MB(0.8f),
                   Z0 + MB(2.2f), MAT_WOOD);
        }
        // ceiling / next floor
        b.fill(X0, yTop, Z0, X1, yTop + 1, Z1, MAT_WOOD_DARK);
        y = yTop + 2;
    }
    // stairs between floors (simple ramp of blocks)
    if (floors > 1) {
        int sy = groundY + 1;
        int sx = X1 - MB(1.8f);
        for (int i = 0; i < MB(2.9f); i++) {
            b.fill(sx, sy + i, Z1 - MB(4.0f) + i, sx + MB(1.6f), sy + i, Z1 - MB(4.0f) + i + 1,
                   MAT_WOOD);
        }
        b.fill(sx + MB(1.6f), sy, Z1 - MB(4.0f), sx + MB(1.7f), sy + MB(2.9f), Z1 - MB(4.0f),
               MAT_WOOD);
        b.fill(sx, sy, Z1 - MB(4.0f), sx, sy + MB(2.9f), Z1 - MB(4.0f), MAT_WOOD);
    }
    // roof
    if (roofMat == MAT_ROOF) {
        int yTop = y;
        for (int i = 0; i < MB(1.2f); i++) {
            int inset = MB(0.15f) * i;
            b.fill(X0 - 1 + inset, yTop + i, Z0 - 1 + inset, X1 + 1 - inset, yTop + i,
                   Z1 + 1 - inset, i == 0 ? MAT_PLASTER : roofMat);
        }
        // ridge
        b.fill((X0 + X1) / 2 - 2, yTop + MB(1.2f), Z0, (X0 + X1) / 2 + 2, yTop + MB(1.5f), Z1,
               roofMat);
    } else {
        b.fill(X0 - 1, y, Z0 - 1, X1 + 1, y + 1, Z1 + 1, MAT_CONCRETE);
        // parapet
        b.walls(X0 - 1, Z0 - 1, X1 + 1, Z1 + 1, y + 2, y + MB(0.9f), MAT_CONCRETE, 1);
    }
    if (garage) {
        int gx0 = X1 + 2, gx1 = X1 + MB(4.2f), gz0 = Z0 + MB(0.5f), gz1 = Z0 + MB(4.6f);
        b.walls(gx0, gz0, gx1, gz1, groundY + 1, groundY + MB(2.7f), MAT_CONCRETE, 2);
        b.fill(gx0, groundY + MB(2.7f), gz0, gx1, groundY + MB(2.8f), gz1, MAT_CONCRETE);
        b.fill(gx0, groundY + 1, gz0, gx1, groundY + MB(2.2f), gz0 + 1, MAT_AIR);
        b.fill(gx0 + 2, groundY + 1, gz0, gx1 - 2, groundY + MB(2.1f), gz0 + 2, MAT_METAL);
        b.car(gx0 + MB(2.0f), (gz0 + gz1) / 2 + MB(1.0f), groundY + 1, MAT_PAINT_BLUE, 0);
    }
    if (pool) {
        int px0 = X0 - MB(5.0f), pz0 = Z0 + MB(1.0f);
        int px1 = px0 + MB(4.0f), pz1 = pz0 + MB(3.0f);
        b.fill(px0, groundY, pz0, px1, groundY, pz1, MAT_WATER);
        b.fill(px0 - 1, groundY, pz0 - 1, px1 + 1, groundY, pz0, MAT_TILE);
        b.fill(px0 - 1, groundY, pz1, px1 + 1, groundY, pz1 + 1, MAT_TILE);
    }
    // fence around the yard
    b.fence(X0 - MB(3.0f), Z0 - MB(1.0f), X1 + MB(5.0f), Z0 - MB(1.0f), MAT_PLANK);
    b.fence(X0 - MB(3.0f), Z0 - MB(1.0f), X0 - MB(3.0f), Z1 + MB(2.0f), MAT_PLANK);
}

// ------------------------------------------------------------------ MAP 1
void buildWesthaven(World& w) {
    Builder b;
    b.w = &w;
    b.rng.seed(kMaps[0].seed);
    groundBase(b, MAT_GRASS, 4.0f);
    int cx = w.dims[0] / 2;
    int cz = w.dims[2] / 2;
    // main road along Z, cross road along X
    b.vehicleRoad(cx - MB(4.0f), 10, cx + MB(4.0f), w.dims[2] - 10, MAT_ASPHALT);
    b.vehicleRoad(10, cz - MB(4.0f), w.dims[0] - 10, cz + MB(4.0f), MAT_ASPHALT);
    // street lamps
    for (int z = 70; z < w.dims[2] - 60; z += 90) {
        b.lamp(cx - MB(5.2f), z, 1);
        b.lamp(cx + MB(5.2f), z + 45, 1);
    }
    // houses on both sides
    struct Plot { int x, z; int wm, dm; int floors; uint8_t wall, roof; bool gar, pool; };
    Plot plots[] = {
        {cx - MB(26.0f), 90, 11, 9, 2, MAT_BRICK, MAT_ROOF, true, true},
        {cx - MB(26.0f), 200, 12, 10, 2, MAT_PLASTER, MAT_ROOF, true, false},
        {cx - MB(26.0f), 320, 10, 9, 1, MAT_BRICK, MAT_ROOF, false, false},
        {cx - MB(26.0f), 440, 13, 10, 2, MAT_BRICK_RED, MAT_ROOF, true, true},
        {cx + MB(13.0f), 100, 12, 10, 2, MAT_PLASTER, MAT_ROOF, true, false},
        {cx + MB(13.0f), 230, 11, 9, 2, MAT_BRICK, MAT_ROOF, false, true},
        {cx + MB(13.0f), 350, 12, 9, 2, MAT_BRICK_RED, MAT_ROOF, true, false},
        {cx + MB(13.0f), 470, 11, 10, 1, MAT_PLASTER, MAT_ROOF, false, false},
    };
    for (auto& p : plots)
        buildHouse(b, p.x, p.z, p.wm, p.dm, p.floors, p.wall, p.roof, p.gar, p.pool);
    // trees and yards
    for (int i = 0; i < 40; i++) {
        int x = b.rng.irange(30, w.dims[0] - 30), z = b.rng.irange(30, w.dims[2] - 30);
        if (abs(x - cx) < MB(7.0f) || abs(z - cz) < MB(7.0f)) continue;
        b.tree(x, z, int(w.topSolidY(x, z) / VOXSZ) + 1, b.rng.range(3.5f, 6.0f));
    }
    // ---- convenience store (near the crossroads)
    {
        int x0 = cx + MB(9.0f), z0 = cz - MB(22.0f);
        int x1 = x0 + MB(11.0f), z1 = z0 + MB(9.0f);
        int gy = int(w.topSolidY(x0 + 4, z0 + 4) / VOXSZ);
        b.walls(x0, z0, x1, z1, gy + 1, gy + MB(4.2f), MAT_BRICK, 2);
        b.fill(x0, gy + 1, z0, x1, gy + 1, z1, MAT_TILE);
        b.fill(x0, gy + MB(4.2f), z0, x1, gy + MB(4.3f), z1, MAT_CONCRETE);
        // glass storefront
        b.fill(x0 + MB(1.0f), gy + 1, z1, x1 - MB(1.0f), gy + MB(3.0f), z1 + 1, MAT_GLASS);
        b.fill(x0, gy + 1, z0 + MB(3.5f), x0 + 1, gy + MB(2.4f), z0 + MB(5.0f), MAT_AIR);
        // shelving
        for (int i = 0; i < 4; i++) {
            int sx = x0 + MB(2.0f) + i * MB(2.2f);
            b.fill(sx, gy + 1, z0 + MB(1.2f), sx + MB(0.5f), gy + MB(1.8f), z0 + MB(6.0f),
                   MAT_METAL);
        }
        b.fill(x1 - MB(2.5f), gy + 1, z1 - MB(2.5f), x1 - MB(1.2f), gy + MB(1.1f), z1 - MB(1.2f),
               MAT_WOOD);
        b.fill(cx + MB(9.0f), gy + 1, cz - MB(26.0f), cx + MB(16.0f), gy + MB(0.2f),
               cz - MB(21.0f), MAT_ASPHALT);
    }
    // ---- gas station
    {
        int x0 = cx - MB(30.0f), z0 = cz + MB(12.0f);
        int gy = int(w.topSolidY(x0, z0) / VOXSZ);
        b.fill(x0, gy + 1, z0, x0 + MB(18.0f), gy + 1, z0 + MB(12.0f), MAT_ASPHALT);
        // canopy
        b.fill(x0 + MB(2.0f), gy + MB(4.6f), z0 + MB(2.0f), x0 + MB(16.0f), gy + MB(5.0f),
               z0 + MB(10.0f), MAT_PAINT_WHITE);
        for (int i = 0; i < 4; i++) {
            int px = x0 + MB(3.0f) + (i % 2) * MB(11.0f);
            int pz = z0 + MB(3.0f) + (i / 2) * MB(6.0f);
            b.fill(px, gy + 1, pz, px + 1, gy + MB(4.6f), pz + 1, MAT_METAL);
            b.fill(px - 1, gy + MB(5.0f), pz - 1, px + 2, gy + MB(5.2f), pz + 2, MAT_LAMP);
        }
        // pumps
        for (int i = 0; i < 2; i++) {
            int px = x0 + MB(6.0f) + i * MB(5.0f), pz = z0 + MB(5.5f);
            b.fill(px, gy + 1, pz, px + MB(0.8f), gy + MB(1.6f), pz + MB(0.6f), MAT_PAINT_RED);
            b.fill(px, gy + MB(1.6f), pz, px + MB(0.8f), gy + MB(1.9f), pz + MB(0.6f),
                   MAT_LAMP);
            // underground fuel tank access
            b.fill(px - 2, gy - MB(2.0f), pz - 2, px + 2, gy - 1, pz + 2, MAT_PAINT_YELLOW);
        }
        // shop building
        b.walls(x0 + MB(13.0f), z0 + MB(1.0f), x0 + MB(18.0f), z0 + MB(11.0f), gy + 1,
                gy + MB(3.4f), MAT_CONCRETE, 2);
        b.fill(x0 + MB(13.0f), gy + 1, z0 + MB(1.0f), x0 + MB(18.0f), gy + 1, z0 + MB(11.0f),
               MAT_TILE);
        b.fill(x0 + MB(13.0f), gy + MB(3.4f), z0 + MB(1.0f), x0 + MB(18.0f), gy + MB(3.5f),
               z0 + MB(11.0f), MAT_CONCRETE);
        b.window(x0 + MB(13.0f), gy + 1.2f, z0 + MB(6.0f), MB(2.0f), MB(1.6f), false);
    }
    // ---- construction site
    {
        int x0 = cx + MB(14.0f), z0 = cz + MB(16.0f);
        int gy = int(w.topSolidY(x0, z0) / VOXSZ);
        b.fill(x0, gy + 1, z0, x0 + MB(26.0f), gy + 1, z0 + MB(20.0f), MAT_GRAVEL);
        // steel frame under construction (5 levels)
        for (int f = 0; f < 5; f++) {
            int y = gy + 2 + f * MB(3.2f);
            for (int i = 0; i < 4; i++)
                for (int j = 0; j < 3; j++) {
                    int px = x0 + MB(2.0f) + i * MB(7.0f);
                    int pz = z0 + MB(2.0f) + j * MB(8.0f);
                    b.fill(px, y, pz, px + 1, y + MB(3.2f), pz + 1, MAT_STEEL);
                }
            if (f > 0) {
                b.fill(x0 + MB(2.0f), y, z0 + MB(2.0f), x0 + MB(23.0f), y, z0 + MB(18.0f),
                       f == 1 ? MAT_CONCRETE : MAT_PLANK);
            }
            b.fill(x0 + MB(2.0f), y + MB(3.2f), z0 + MB(2.0f), x0 + MB(23.0f), y + MB(3.2f),
                   z0 + MB(2.2f), MAT_METAL);
        }
        // crane
        b.fill(x0 - MB(2.0f), gy + 1, z0 + MB(4.0f), x0 - 1, gy + MB(14.0f), z0 + MB(5.0f),
               MAT_PAINT_YELLOW);
        b.fill(x0 - MB(6.0f), gy + MB(14.0f), z0 + MB(4.0f), x0 + MB(6.0f), gy + MB(14.5f),
               z0 + MB(5.0f), MAT_PAINT_YELLOW);
        // materials piles
        for (int i = 0; i < 12; i++)
            b.crate(x0 + b.rng.irange(1, 20) * 2, gy + 2, z0 + b.rng.irange(1, 14) * 2,
                    i % 3 ? MAT_WOOD : MAT_BRICK, 3);
        // porta cabin
        b.fill(x0 + MB(20.0f), gy + 2, z0 + MB(14.0f), x0 + MB(26.0f), gy + MB(2.6f),
               z0 + MB(19.0f), MAT_PAINT_WHITE);
    }
    // parked cars along the road
    for (int i = 0; i < 6; i++) {
        int z = 120 + i * 70;
        b.car(cx - MB(6.5f), z, 1, (i % 2) ? MAT_PAINT_RED : MAT_PAINT_BLUE, 0);
    }
    // vehicles the player can drive
    spawnVehicle(0, Vec3(cx * VOXSZ + 2.5f, 1.2f, (cz - MB(14.0f)) * VOXSZ), 0);
    spawnVehicle(1, Vec3(cx * VOXSZ - 3.0f, 1.2f, (cz + MB(22.0f)) * VOXSZ), 0.4f);
    spawnVehicle(4, Vec3((cx + MB(24.0f)) * VOXSZ, 1.2f, (cz + MB(30.0f)) * VOXSZ), 1.2f);
    w.syncChunks();
}

// ------------------------------------------------------------------ MAP 2
void buildBlackstone(World& w) {
    Builder b;
    b.w = &w;
    b.rng.seed(kMaps[1].seed);
    groundBase(b, MAT_GRAVEL, 3.0f);
    int cx = w.dims[0] / 2, cz = w.dims[2] / 2;
    b.vehicleRoad(cx - MB(6.0f), 10, cx + MB(6.0f), w.dims[2] - 10, MAT_ASPHALT);
    b.vehicleRoad(10, cz - MB(6.0f), w.dims[0] - 10, cz + MB(6.0f), MAT_ASPHALT);
    // ---- big warehouse
    auto warehouse = [&](int x0, int z0, int wm, int dm, int hm, uint8_t wall) {
        int gy = int(w.topSolidY(x0 + 3, z0 + 3) / VOXSZ);
        int x1 = x0 + MB(float(wm)), z1 = z0 + MB(float(dm));
        int yTop = gy + MB(float(hm));
        b.walls(x0, z0, x1, z1, gy + 1, yTop, wall, 3);
        b.fill(x0, gy + 1, z0, x1, gy + 1, z1, MAT_CONCRETE_DIRTY);
        b.fill(x0, yTop, z0, x1, yTop + 1, z1, MAT_METAL);
        // roof trusses
        for (int i = 0; i <= 6; i++) {
            int px = x0 + (x1 - x0) * i / 6;
            b.fill(px, yTop - MB(0.9f), z0, px + 1, yTop, z1, MAT_STEEL);
        }
        // big rolling door
        b.fill(x0 + MB(3.0f), gy + 1, z0, x0 + MB(10.0f), gy + MB(4.6f), z0 + 3, MAT_AIR);
        b.fill(x0 + MB(3.0f), gy + MB(4.6f), z0, x0 + MB(10.0f), gy + MB(5.0f), z0 + 3,
               MAT_METAL);
        // side door
        b.fill(x1, gy + 1, z0 + MB(4.0f), x1 - 3, gy + MB(2.2f), z0 + MB(5.2f), MAT_AIR);
        // interior office
        b.walls(x1 - MB(8.0f), z1 - MB(7.0f), x1 - 3, z1 - 3, gy + 1, gy + MB(3.0f),
                MAT_PLASTER, 2);
        b.fill(x1 - MB(8.0f), gy + 1, z1 - MB(7.0f), x1 - 3, gy + MB(3.0f), z1 - 3, MAT_AIR);
        b.fill(x1 - MB(8.0f), gy + 1, z1 - MB(7.0f), x1 - 3, gy + 2, z1 - 3, MAT_TILE);
        b.fill(x1 - MB(8.0f), gy + 1, z1 - MB(7.0f), x1 - 3, gy + 1, z1 - 3, MAT_TILE);
        b.fill(x1 - MB(8.0f), gy + 1, z1 - MB(7.0f), x1 - MB(7.7f), gy + MB(3.0f), z1 - 3,
               MAT_PLASTER);
        b.fill(x1 - MB(8.0f), gy + 1, z1 - MB(7.0f), x1 - 3, gy + MB(3.0f), z1 - MB(6.7f),
               MAT_PLASTER);
        b.doorway(x1 - MB(8.0f), gy + 1, z1 - MB(5.0f), MB(0.9f), MB(2.0f), false);
        // shelving rows
        for (int i = 0; i < 5; i++) {
            int px = x0 + MB(3.0f) + i * MB(6.0f);
            for (int lvl = 0; lvl < 3; lvl++) {
                b.fill(px, gy + 2 + lvl * MB(1.1f), z0 + MB(2.0f), px + MB(0.4f),
                       gy + 2 + lvl * MB(1.1f), z1 - MB(10.0f), MAT_METAL);
                for (int k = 0; k < 5; k++)
                    if (b.rng.f() < 0.7f)
                        b.fill(px, gy + 3 + lvl * MB(1.1f), z0 + MB(3.0f) + k * MB(3.0f),
                               px + MB(0.8f), gy + MB(1.0f) + 2 + lvl * MB(1.1f),
                               z0 + MB(4.0f) + k * MB(3.0f),
                               b.rng.f() < 0.5f ? MAT_WOOD : MAT_CARGO_YELLOW);
            }
        }
        for (int i = 0; i < 16; i++)
            b.crate(x0 + MB(2.0f) + b.rng.irange(0, 20) * 4, gy + 2,
                    z1 - MB(8.0f) + b.rng.irange(0, 4) * 4,
                    b.rng.f() < 0.5f ? MAT_WOOD : MAT_PLASTIC, 4);
    };
    warehouse(cx - MB(46.0f), cz - MB(52.0f), 34, 26, 9, MAT_METAL_RUST);
    warehouse(cx + MB(12.0f), cz - MB(54.0f), 30, 24, 8, MAT_CONCRETE_DIRTY);
    warehouse(cx - MB(44.0f), cz + MB(20.0f), 28, 22, 7, MAT_PAINT_BLUE);
    // ---- factory with furnaces and pipes
    {
        int x0 = cx + MB(16.0f), z0 = cz + MB(18.0f);
        int gy = int(w.topSolidY(x0 + 3, z0 + 3) / VOXSZ);
        int x1 = x0 + MB(30.0f), z1 = z0 + MB(24.0f);
        b.walls(x0, z0, x1, z1, gy + 1, gy + MB(7.0f), MAT_BRICK_RED, 3);
        b.fill(x0, gy + 1, z0, x1, gy + 1, z1, MAT_CONCRETE_DIRTY);
        b.fill(x0, gy + MB(7.0f), z0, x1, gy + MB(7.2f), z1, MAT_METAL);
        b.fill(x0 + MB(2.0f), gy + 1, z0, x0 + MB(8.0f), gy + MB(4.2f), z0 + 3, MAT_AIR);
        b.fill(x0 + MB(2.0f), gy + MB(4.2f), z0, x0 + MB(8.0f), gy + MB(4.6f), z0 + 3,
               MAT_METAL_RUST);
        // furnaces
        for (int i = 0; i < 3; i++) {
            int px = x0 + MB(4.0f) + i * MB(9.0f);
            b.fill(px, gy + 1, z1 - MB(7.0f), px + MB(3.0f), gy + MB(4.0f), z1 - MB(4.0f),
                   MAT_METAL_RUST);
            b.fill(px + 1, gy + 1, z1 - MB(4.2f), px + MB(2.0f), gy + MB(2.0f), z1 - MB(4.0f),
                   MAT_LAMP);
            b.fill(px + 1, gy + MB(4.0f), z1 - MB(6.0f), px + MB(2.0f), gy + MB(9.0f),
                   z1 - MB(5.0f), MAT_METAL_RUST);
        }
        // pipe runs
        for (int i = 0; i < 4; i++)
            b.fill(x0 + MB(2.0f), gy + MB(5.5f) + i, z0 + MB(2.0f), x1 - MB(2.0f),
                   gy + MB(5.7f) + i, z0 + MB(2.4f), MAT_METAL_RUST);
        // catwalk
        b.fill(x0 + MB(2.0f), gy + MB(4.6f), z0 + MB(10.0f), x1 - MB(2.0f), gy + MB(4.7f),
               z0 + MB(13.0f), MAT_METAL);
        b.fill(x0 + MB(2.0f), gy + MB(5.6f), z0 + MB(10.0f), x1 - MB(2.0f), gy + MB(5.7f),
               z0 + MB(10.2f), MAT_METAL);
    }
    // ---- storage tanks (chain reaction targets)
    for (int i = 0; i < 5; i++) {
        int tx = cx - MB(20.0f) + i * MB(9.0f), tz = cz - MB(24.0f);
        int gy = int(w.topSolidY(tx, tz) / VOXSZ);
        b.fill(tx - MB(3.0f), gy + 1, tz - MB(3.0f), tx + MB(3.0f), gy + MB(7.0f), tz + MB(3.0f),
               i % 2 ? MAT_PAINT_YELLOW : MAT_METAL_RUST);
        b.fill(tx - MB(3.0f), gy + MB(7.0f), tz - MB(3.0f), tx + MB(3.0f), gy + MB(7.4f),
               tz + MB(3.0f), MAT_METAL);
        // pipe to the next tank
        if (i < 4)
            b.fill(tx + MB(3.0f), gy + MB(3.0f), tz - 1, tx + MB(6.0f), gy + MB(3.4f), tz + 1,
                   MAT_METAL_RUST);
    }
    // ---- chimneys and cranes
    for (int i = 0; i < 2; i++) {
        int tx = cx - MB(40.0f) + i * MB(14.0f), tz = cz + MB(6.0f);
        int gy = int(w.topSolidY(tx, tz) / VOXSZ);
        b.fill(tx - 3, gy + 1, tz - 3, tx + 3, gy + MB(26.0f), tz + 3, MAT_BRICK_RED);
        b.fill(tx - 2, gy + MB(26.0f), tz - 2, tx + 2, gy + MB(27.0f), tz + 2, MAT_METAL_RUST);
    }
    // gantry crane over the yard
    {
        int gx = cx + MB(8.0f), gz = cz - MB(8.0f);
        int gy = int(w.topSolidY(gx, gz) / VOXSZ);
        for (int i = 0; i < 2; i++)
            b.fill(gx + i * MB(16.0f), gy + 1, gz, gx + i * MB(16.0f) + 2, gy + MB(12.0f),
                   gz + 2, MAT_PAINT_YELLOW);
        b.fill(gx, gy + MB(12.0f), gz, gx + MB(16.0f), gy + MB(12.6f), gz + 2, MAT_PAINT_YELLOW);
        b.fill(gx + MB(7.0f), gy + MB(6.0f), gz, gx + MB(7.4f), gy + MB(12.0f), gz + 1,
               MAT_METAL);
        b.fill(gx + MB(6.0f), gy + MB(4.0f), gz - 1, gx + MB(8.4f), gy + MB(5.4f), gz + 2,
               MAT_CARGO_RED);
    }
    // trucks on the yard
    for (int i = 0; i < 4; i++) {
        int tx = cx - MB(10.0f) + i * MB(9.0f), tz = cz + MB(4.0f);
        int gy = int(w.topSolidY(tx, tz) / VOXSZ);
        b.fill(tx - 3, gy + 1, tz - 8, tx + 3, gy + MB(3.2f), tz + 2, MAT_CARGO_BLUE);
        b.fill(tx - 3, gy + 1, tz + 2, tx + 3, gy + MB(2.4f), tz + 6, MAT_PAINT_RED);
        b.fill(tx - 3, gy + 1, tz + 4, tx + 3, gy + MB(1.9f), tz + 6, MAT_GLASS);
    }
    // perimeter wall
    b.walls(10, 10, w.dims[0] - 10, w.dims[2] - 10, 1, MB(3.0f), MAT_CONCRETE_DIRTY, 2);
    spawnVehicle(3, Vec3(cx * VOXSZ + 6.0f, 1.2f, (cz + MB(2.0f)) * VOXSZ), 0.2f);
    spawnVehicle(5, Vec3((cx - MB(24.0f)) * VOXSZ, 1.2f, (cz + MB(14.0f)) * VOXSZ), 1.0f);
    spawnVehicle(2, Vec3((cx + MB(2.0f)) * VOXSZ, 1.2f, (cz + MB(34.0f)) * VOXSZ), 0);
    w.syncChunks();
}

// ------------------------------------------------------------------ MAP 3
void buildDowntown(World& w) {
    Builder b;
    b.w = &w;
    b.rng.seed(kMaps[2].seed);
    groundBase(b, MAT_CONCRETE_DIRTY, 2.0f);
    int cx = w.dims[0] / 2, cz = w.dims[2] / 2;
    // street grid
    for (int i = -1; i <= 1; i++) {
        b.vehicleRoad(cx + i * MB(52.0f) - MB(5.0f), 10, cx + i * MB(52.0f) + MB(5.0f),
                      w.dims[2] - 10, MAT_ASPHALT);
        b.vehicleRoad(10, cz + i * MB(52.0f) - MB(5.0f), w.dims[0] - 10,
                      cz + i * MB(52.0f) + MB(5.0f), MAT_ASPHALT);
    }
    // multi storey buildings on blocks
    auto tower = [&](int x0, int z0, int wm, int dm, int floors, uint8_t wall, bool parking) {
        int gy = int(w.topSolidY(x0 + 2, z0 + 2) / VOXSZ);
        int x1 = x0 + MB(float(wm)), z1 = z0 + MB(float(dm));
        int fh = MB(3.4f);
        for (int f = 0; f < floors; f++) {
            int y = gy + 1 + f * fh;
            b.walls(x0, z0, x1, z1, y, y + fh, wall, 3);
            b.fill(x0, y, z0, x1, y, z1, MAT_CONCRETE);
            if (parking) {
                // open parking decks
                for (int i = 0; i < 4; i++) {
                    int px = x0 + MB(2.0f) + i * MB(6.0f);
                    b.fill(px, y, z0 + 2, px + 1, y + fh, z1 - 2, MAT_CONCRETE);
                }
                b.fill(x0 + 3, y, z0, x0 + MB(6.0f), y + MB(2.6f), z0 + 4, MAT_AIR);
                b.fill(x1 - MB(6.0f), y, z1 - 4, x1 - 3, y + MB(2.6f), z1, MAT_AIR);
            } else {
                // office interior
                int midX = (x0 + x1) / 2;
                b.fill(midX, y, z0 + 4, midX + 2, y + fh, z1 - 4, wall);
                b.doorway(midX, y, z0 + MB(4.0f), MB(1.0f), MB(2.2f), false);
                b.doorway(midX, y, z1 - MB(4.0f), MB(1.0f), MB(2.2f), false);
                // desks
                for (int i = 0; i < 4; i++)
                    b.fill(x0 + MB(2.0f) + i * MB(4.0f), y + MB(0.7f), z0 + MB(2.0f),
                           x0 + MB(3.6f) + i * MB(4.0f), y + MB(0.8f), z0 + MB(3.2f), MAT_WOOD);
                for (int i = 0; i < 4; i++)
                    b.fill(x0 + MB(2.0f) + i * MB(4.0f), y + MB(0.7f), z1 - MB(3.2f),
                           x0 + MB(3.6f) + i * MB(4.0f), y + MB(0.8f), z1 - MB(2.0f), MAT_WOOD);
                // windows all around
                for (int i = 0; i < 3; i++) {
                    b.window(x0 + MB(3.0f) + i * MB(4.0f), y + MB(1.0f), z0, MB(1.6f), MB(1.6f),
                             true);
                    b.window(x0 + MB(3.0f) + i * MB(4.0f), y + MB(1.0f), z1, MB(1.6f), MB(1.6f),
                             true);
                }
                for (int i = 0; i < 2; i++) {
                    b.window(x0, y + MB(1.0f), z0 + MB(3.0f) + i * MB(4.0f), MB(1.6f), MB(1.6f),
                             false);
                    b.window(x1, y + MB(1.0f), z0 + MB(3.0f) + i * MB(4.0f), MB(1.6f), MB(1.6f),
                             false);
                }
            }
        }
        // roof
        int yTop = gy + 1 + floors * fh;
        b.fill(x0, yTop, z0, x1, yTop, z1, MAT_CONCRETE);
        b.walls(x0, z0, x1, z1, yTop + 1, yTop + MB(1.0f), MAT_CONCRETE, 1);
        // rooftop equipment
        b.fill(x0 + MB(2.0f), yTop + 1, z0 + MB(2.0f), x0 + MB(4.0f), yTop + MB(2.0f),
               z0 + MB(4.0f), MAT_METAL);
        b.fill(x1 - MB(4.0f), yTop + 1, z1 - MB(4.0f), x1 - MB(2.0f), yTop + MB(1.6f),
               z1 - MB(2.0f), MAT_METAL_RUST);
        // entrance
        b.fill(x0 + MB(3.0f), gy + 1, z0, x0 + MB(5.0f), gy + MB(2.6f), z0 + 3, MAT_AIR);
        b.fill(x0 + MB(2.0f), gy + MB(2.6f), z0 - MB(0.4f), x0 + MB(6.0f), gy + MB(2.8f),
               z0 + 1, MAT_GLASS);
        // fire escape stairs (climbable)
        for (int f = 0; f < floors; f++) {
            int y = gy + 1 + f * fh;
            for (int i = 0; i < fh; i++)
                b.fill(x1 - MB(1.2f), y + i, z1 - MB(2.0f) - i, x1 - MB(0.6f), y + i,
                       z1 - MB(2.0f) - i + 1, MAT_METAL);
        }
    };
    tower(cx - MB(48.0f), cz - MB(48.0f), 26, 24, 6, MAT_CONCRETE, false);
    tower(cx + MB(16.0f), cz - MB(50.0f), 24, 28, 8, MAT_GLASS, false);
    tower(cx - MB(50.0f), cz + MB(14.0f), 28, 22, 4, MAT_BRICK, true);
    tower(cx + MB(14.0f), cz + MB(12.0f), 30, 26, 7, MAT_CONCRETE, false);
    tower(cx - MB(20.0f), cz - MB(20.0f), 18, 18, 3, MAT_BRICK_RED, false);
    // shops at street level
    for (int i = 0; i < 6; i++) {
        int x0 = cx - MB(46.0f) + (i % 3) * MB(30.0f);
        int z0 = cz + MB(40.0f) + (i / 3) * MB(20.0f);
        int gy = int(w.topSolidY(x0, z0) / VOXSZ);
        b.walls(x0, z0, x0 + MB(10.0f), z0 + MB(8.0f), gy + 1, gy + MB(3.6f), MAT_PLASTER, 2);
        b.fill(x0, gy + 1, z0, x0 + MB(10.0f), gy + 1, z0 + MB(8.0f), MAT_TILE);
        b.fill(x0, gy + MB(3.6f), z0, x0 + MB(10.0f), gy + MB(3.8f), z0 + MB(8.0f), MAT_CONCRETE);
        b.fill(x0 + MB(1.0f), gy + 1, z0 + MB(8.0f), x0 + MB(9.0f), gy + MB(2.8f), z0 + MB(8.4f),
               MAT_GLASS);
        b.fill(x0 + MB(4.0f), gy + 1, z0 - MB(1.0f), x0 + MB(6.0f), gy + MB(2.4f), z0,
               MAT_WOOD);
    }
    // elevated bridge connecting two blocks
    {
        int y = MB(16.0f);
        b.fill(cx - MB(20.0f), y, cz - MB(8.0f), cx + MB(20.0f), y + 1, cz + MB(8.0f),
               MAT_CONCRETE);
        for (int i = 0; i < 5; i++) {
            int px = cx - MB(18.0f) + i * MB(9.0f);
            b.fill(px, 1, cz - MB(6.0f), px + 2, y, cz - MB(5.0f), MAT_CONCRETE);
            b.fill(px, 1, cz + MB(5.0f), px + 2, y, cz + MB(6.0f), MAT_CONCRETE);
        }
    }
    // underground parking entrance
    {
        int px = cx + MB(6.0f), pz = cz - MB(40.0f);
        b.fill(px - MB(4.0f), 0, pz - MB(3.0f), px + MB(4.0f), MB(3.0f), pz + MB(3.0f), MAT_AIR);
        b.fill(px - MB(4.0f), MB(3.0f), pz - MB(3.0f), px + MB(4.0f), MB(3.2f), pz + MB(3.0f),
               MAT_CONCRETE);
    }
    spawnVehicle(0, Vec3((cx - 8) * VOXSZ, 1.2f, (cz - 20) * VOXSZ), 0);
    spawnVehicle(6, Vec3((cx + 12) * VOXSZ, 1.2f, (cz + 30) * VOXSZ), 1.5f);
    spawnVehicle(3, Vec3((cx - 10) * VOXSZ, 1.2f, (cz + 42) * VOXSZ), 0);
    w.syncChunks();
}

// ------------------------------------------------------------------ MAP 4
void buildHarbor(World& w) {
    Builder b;
    b.w = &w;
    b.rng.seed(kMaps[3].seed);
    groundBase(b, MAT_SAND, 2.0f);
    int cx = w.dims[0] / 2, cz = w.dims[2] / 2;
    // water basin on one half
    int waterZ = cz + MB(8.0f);
    w.fillFast(10, 0, waterZ, w.dims[0] - 10, MB(1.4f), w.dims[2] - 10, MAT_WATER);
    w.fillFast(10, 0, waterZ, w.dims[0] - 10, 0, w.dims[2] - 10, MAT_STONE);
    // quay wall
    for (int x = 10; x < w.dims[0] - 10; x++) {
        w.fillFast(x, 0, waterZ - 3, x, MB(2.0f), waterZ, MAT_CONCRETE);
    }
    // container stacks
    uint8_t colors[4] = {MAT_CARGO_RED, MAT_CARGO_BLUE, MAT_CARGO_GREEN, MAT_CARGO_YELLOW};
    for (int i = 0; i < 40; i++) {
        int x = 20 + (i % 10) * MB(3.2f);
        int z = 30 + (i / 10) * MB(3.0f);
        int gy = int(w.topSolidY(x, z) / VOXSZ);
        int stack = b.rng.irange(1, 3);
        for (int s = 0; s < stack; s++) {
            b.fill(x, gy + 1 + s * MB(2.6f), z, x + MB(2.5f), gy + MB(2.5f) + s * MB(2.6f),
                   z + MB(2.5f), colors[b.rng.irange(0, 3)]);
        }
    }
    // warehouses
    for (int i = 0; i < 2; i++) {
        int x0 = cx - MB(40.0f) + i * MB(44.0f);
        int z0 = 24;
        int gy = int(w.topSolidY(x0 + 3, z0 + 3) / VOXSZ);
        b.walls(x0, z0, x0 + MB(36.0f), z0 + MB(20.0f), gy + 1, gy + MB(8.0f), MAT_METAL_RUST, 3);
        b.fill(x0, gy + 1, z0, x0 + MB(36.0f), gy + 1, z0 + MB(20.0f), MAT_CONCRETE_DIRTY);
        b.fill(x0, gy + MB(8.0f), z0, x0 + MB(36.0f), gy + MB(8.2f), z0 + MB(20.0f), MAT_METAL);
        b.fill(x0 + MB(3.0f), gy + 1, z0, x0 + MB(12.0f), gy + MB(5.0f), z0 + 3, MAT_AIR);
    }
    // gantry cranes
    for (int i = 0; i < 3; i++) {
        int gx = cx - MB(30.0f) + i * MB(28.0f);
        int gz = waterZ - MB(4.0f);
        int gy = int(w.topSolidY(gx, gz - 4) / VOXSZ);
        b.fill(gx, gy + 1, gz - MB(6.0f), gx + 2, gy + MB(16.0f), gz - MB(5.0f), MAT_PAINT_YELLOW);
        b.fill(gx + MB(10.0f), gy + 1, gz - MB(6.0f), gx + MB(10.0f) + 2, gy + MB(16.0f),
               gz - MB(5.0f), MAT_PAINT_YELLOW);
        b.fill(gx, gy + MB(16.0f), gz - MB(6.0f), gx + MB(10.0f), gy + MB(17.0f), gz - MB(1.0f),
               MAT_PAINT_YELLOW);
        b.fill(gx + MB(5.0f), gy + MB(10.0f), gz - MB(2.0f), gx + MB(5.6f), gy + MB(16.0f),
               gz - MB(1.4f), MAT_METAL);
        b.fill(gx + MB(4.0f), gy + MB(9.0f), gz - MB(2.4f), gx + MB(6.6f), gy + MB(10.0f),
               gz - MB(1.0f), MAT_CARGO_BLUE);
    }
    // cargo ship
    {
        int sx = cx - MB(14.0f), sz = waterZ + MB(10.0f);
        b.fill(sx, MB(0.2f), sz, sx + MB(24.0f), MB(1.0f), sz + MB(44.0f), MAT_PAINT_RED);
        b.fill(sx, MB(1.0f), sz, sx + MB(24.0f), MB(4.2f), sz + MB(44.0f), MAT_METAL_RUST);
        b.fill(sx - MB(1.0f), MB(1.0f), sz + MB(40.0f), sx + MB(25.0f), MB(5.4f), sz + MB(44.0f),
               MAT_PAINT_WHITE);
        b.fill(sx + MB(6.0f), MB(4.0f), sz + MB(38.0f), sx + MB(18.0f), MB(7.0f), sz + MB(43.0f),
               MAT_PAINT_WHITE);
        for (int i = 0; i < 3; i++)
            for (int j = 0; j < 5; j++)
                b.fill(sx + MB(2.0f) + i * MB(7.0f), MB(4.2f), sz + MB(4.0f) + j * MB(6.0f),
                       sx + MB(8.0f) + i * MB(7.0f), MB(6.8f), sz + MB(9.5f) + j * MB(6.0f),
                       colors[(i + j) % 4]);
    }
    // fuel tanks
    for (int i = 0; i < 4; i++) {
        int tx = 30 + i * MB(9.0f), tz = waterZ - MB(18.0f);
        int gy = int(w.topSolidY(tx, tz) / VOXSZ);
        b.fill(tx - 5, gy + 1, tz - 5, tx + 5, gy + MB(6.0f), tz + 5,
               i % 2 ? MAT_PAINT_YELLOW : MAT_METAL_RUST);
        b.fill(tx - 5, gy + MB(6.0f), tz - 5, tx + 5, gy + MB(6.3f), tz + 5, MAT_METAL);
    }
    // small boats moored
    for (int i = 0; i < 3; i++) {
        int bx = cx + MB(20.0f) + i * MB(10.0f), bz = waterZ + MB(6.0f);
        b.fill(bx, MB(0.4f), bz, bx + MB(3.0f), MB(1.4f), bz + MB(7.0f), MAT_PAINT_WHITE);
        b.fill(bx + 1, MB(1.4f), bz + MB(3.0f), bx + MB(2.0f), MB(2.4f), bz + MB(5.0f),
               MAT_GLASS);
    }
    // dock lamps
    for (int i = 0; i < 6; i++) b.lamp(20 + i * MB(24.0f), waterZ - MB(6.0f), MB(2.0f));
    spawnVehicle(8, Vec3((cx + 4) * VOXSZ, 1.5f, (waterZ + MB(14.0f)) * VOXSZ), 0);
    spawnVehicle(3, Vec3((cx - 20) * VOXSZ, 1.2f, (waterZ - MB(30.0f)) * VOXSZ), 0.3f);
    spawnVehicle(6, Vec3((cx + 16) * VOXSZ, 1.2f, (waterZ - MB(26.0f)) * VOXSZ), 1.1f);
    w.syncChunks();
}

// ------------------------------------------------------------------ MAP 5
void buildRedCanyon(World& w) {
    Builder b;
    b.w = &w;
    b.rng.seed(kMaps[4].seed);
    // rocky terrain
    for (int z = 0; z < w.dims[2]; z++)
        for (int x = 0; x < w.dims[0]; x++) {
            float n = fbm2(x * 0.02f, z * 0.02f, 4);
            int h = MB(1.0f) + int(n * MB(6.0f));
            w.fillFast(x, 0, z, x, h - 1, z, MAT_STONE);
            w.fillFast(x, h, z, x, h, z, n > 0.55f ? MAT_SAND : MAT_SOIL);
        }
    int cx = w.dims[0] / 2, cz = w.dims[2] / 2;
    // flat test range area
    w.fillFast(cx - MB(34.0f), 0, cz - MB(34.0f), cx + MB(34.0f), MB(1.0f), cz + MB(34.0f),
               MAT_SAND);
    // concrete bunkers with tunnels
    auto bunker = [&](int x0, int z0, int wm, int dm, bool tunnel) {
        int gy = int(w.topSolidY(x0 + 3, z0 + 3) / VOXSZ);
        int x1 = x0 + MB(float(wm)), z1 = z0 + MB(float(dm));
        b.walls(x0, z0, x1, z1, gy + 1, gy + MB(3.4f), MAT_REBAR, 4);
        b.fill(x0, gy + 1, z0, x1, gy + 1, z1, MAT_CONCRETE_DIRTY);
        b.fill(x0, gy + MB(3.4f), z0, x1, gy + MB(4.0f), z1, MAT_REBAR);
        b.fill(x0 + MB(2.0f), gy + 1, z0, x0 + MB(4.0f), gy + MB(2.4f), z0 + 4, MAT_AIR);
        b.fill(x1 - MB(4.0f), gy + 1, z1 - 4, x1 - MB(2.0f), gy + MB(2.4f), z1, MAT_AIR);
        // firing slits
        for (int i = 0; i < 3; i++)
            b.fill(x0 + MB(3.0f) + i * MB(4.0f), gy + MB(1.6f), z0, x0 + MB(4.2f) + i * MB(4.0f),
                   gy + MB(2.0f), z0 + 4, MAT_AIR);
        if (tunnel) {
            // underground tunnel leading away
            for (int i = 0; i < MB(20.0f); i++) {
                b.fill(x1 + i, gy - MB(2.4f), (z0 + z1) / 2 - MB(1.2f), x1 + i, gy - 1,
                       (z0 + z1) / 2 + MB(1.2f), MAT_AIR);
                b.fill(x1 + i, gy - MB(2.8f), (z0 + z1) / 2 - MB(1.4f), x1 + i, gy - MB(2.4f),
                       (z0 + z1) / 2 + MB(1.4f), MAT_REBAR);
            }
        }
    };
    bunker(cx - MB(28.0f), cz - MB(24.0f), 14, 12, true);
    bunker(cx + MB(14.0f), cz - MB(26.0f), 16, 12, false);
    bunker(cx - MB(24.0f), cz + MB(12.0f), 12, 14, true);
    // target structures (wooden frames, brick walls)
    for (int i = 0; i < 5; i++) {
        int tx = cx - MB(16.0f) + i * MB(8.0f), tz = cz + MB(2.0f);
        int gy = int(w.topSolidY(tx, tz) / VOXSZ);
        for (int k = 0; k < 3; k++) {
            b.fill(tx, gy + 1, tz + k * MB(3.0f), tx + MB(0.4f), gy + MB(3.0f),
                   tz + k * MB(3.0f), MAT_PLANK);
            b.fill(tx, gy + MB(2.0f), tz + k * MB(3.0f), tx + MB(4.0f), gy + MB(3.0f),
                   tz + k * MB(3.0f), MAT_BRICK);
        }
    }
    // watchtowers
    for (int i = 0; i < 2; i++) {
        int tx = cx + i * MB(24.0f) - MB(12.0f), tz = cz - MB(36.0f);
        int gy = int(w.topSolidY(tx, tz) / VOXSZ);
        for (int k = 0; k < 4; k++) {
            int ox = (k % 2) * MB(3.0f), oz = (k / 2) * MB(3.0f);
            b.fill(tx + ox, gy + 1, tz + oz, tx + ox + 2, gy + MB(9.0f), tz + oz + 2, MAT_PLANK);
        }
        b.fill(tx - 2, gy + MB(9.0f), tz - 2, tx + MB(3.0f) + 2, gy + MB(9.4f), tz + MB(3.0f) + 2,
               MAT_WOOD);
        b.walls(tx - 1, tz - 1, tx + MB(3.0f) + 1, tz + MB(3.0f) + 1, gy + MB(9.4f),
                gy + MB(11.0f), MAT_PLANK, 1);
        b.fill(tx - 2, gy + MB(9.0f), tz - 2, tx + MB(3.0f) + 2, gy + MB(9.2f), tz - 1, MAT_WOOD);
    }
    // explosive storage bunker (chain reaction)
    {
        int x0 = cx + MB(26.0f), z0 = cz + MB(20.0f);
        int gy = int(w.topSolidY(x0, z0) / VOXSZ);
        b.walls(x0, z0, x0 + MB(10.0f), z0 + MB(8.0f), gy + 1, gy + MB(3.0f), MAT_CONCRETE, 3);
        b.fill(x0, gy + MB(3.0f), z0, x0 + MB(10.0f), gy + MB(3.2f), z0 + MB(8.0f), MAT_CONCRETE);
        b.fill(x0 + MB(4.0f), gy + 1, z0, x0 + MB(6.0f), gy + MB(2.2f), z0 + 3, MAT_WOOD);
        for (int i = 0; i < 8; i++)
            b.barrel(x0 + MB(2.0f) + (i % 4) * MB(2.0f), gy + 1, z0 + MB(2.0f) + (i / 4) * MB(2.0f),
                     MAT_PAINT_YELLOW);
    }
    // bridge over a canyon gap
    {
        int bz = cz + MB(40.0f);
        w.fillFast(cx - MB(6.0f), 0, bz - MB(4.0f), cx + MB(6.0f), MB(6.0f), bz + MB(4.0f),
                   MAT_AIR);
        b.fill(cx - MB(28.0f), MB(6.0f), bz - MB(3.0f), cx + MB(28.0f), MB(6.5f), bz + MB(3.0f),
               MAT_CONCRETE);
        for (int i = 0; i < 4; i++) {
            int px = cx - MB(24.0f) + i * MB(14.0f);
            b.fill(px, MB(0.5f), bz - MB(2.0f), px + 2, MB(6.0f), bz + MB(2.0f), MAT_CONCRETE);
        }
    }
    // military vehicles (static props)
    for (int i = 0; i < 3; i++) {
        int tx = cx - MB(20.0f) + i * MB(10.0f), tz = cz + MB(28.0f);
        int gy = int(w.topSolidY(tx, tz) / VOXSZ);
        b.fill(tx, gy + 1, tz, tx + MB(6.0f), gy + MB(2.4f), tz + MB(3.0f), MAT_PAINT_GREEN);
        b.fill(tx + 1, gy + MB(2.4f), tz + 1, tx + MB(3.0f), gy + MB(3.2f), tz + MB(2.4f),
               MAT_GLASS);
        b.fill(tx + MB(6.0f), gy + MB(1.4f), tz + 1, tx + MB(8.0f), gy + MB(1.8f), tz + 2,
               MAT_STEEL);
    }
    spawnVehicle(7, Vec3((cx - 6) * VOXSZ, 1.5f, (cz + 16) * VOXSZ), 0.2f);
    spawnVehicle(5, Vec3((cx + 18) * VOXSZ, 1.5f, (cz + 8) * VOXSZ), 2.0f);
    w.syncChunks();
}

// ------------------------------------------------------------------ MAP 6
void buildGrandMall(World& w) {
    Builder b;
    b.w = &w;
    b.rng.seed(kMaps[5].seed);
    groundBase(b, MAT_CONCRETE_DIRTY, 2.0f);
    int cx = w.dims[0] / 2, cz = w.dims[2] / 2;
    b.vehicleRoad(10, cz - MB(6.0f), w.dims[0] - 10, cz + MB(6.0f), MAT_ASPHALT);
    // big mall volume
    int x0 = cx - MB(46.0f), z0 = cz - MB(34.0f);
    int x1 = cx + MB(46.0f), z1 = cz + MB(30.0f);
    int gy = 2;
    int floors = 3;
    int fh = MB(4.6f);
    // outer shell with glass facade
    for (int f = 0; f < floors; f++) {
        int y = gy + f * fh;
        b.walls(x0, z0, x1, z1, y, y + fh, MAT_CONCRETE, 4);
        // storefront glass on the south face
        b.fill(x0 + MB(2.0f), y, z1 - 2, x1 - MB(2.0f), y + MB(3.2f), z1, MAT_GLASS);
        b.fill(x0 + MB(2.0f), y + MB(3.2f), z1 - 3, x1 - MB(2.0f), y + MB(3.6f), z1, MAT_METAL);
        // slab
        b.fill(x0, y + fh, z0, x1, y + fh + 1, z1, MAT_CONCRETE);
        // interior shops along a central atrium
        int ax0 = cx - MB(8.0f), ax1 = cx + MB(8.0f);
        for (int i = 0; i < 6; i++) {
            int sx = x0 + MB(4.0f) + i * MB(7.0f);
            if (sx > ax0 - MB(2.0f) && sx < ax1) continue;
            b.walls(sx, z0 + MB(6.0f), sx + MB(6.0f), z0 + MB(16.0f), y + 1, y + MB(3.4f),
                    MAT_PLASTER, 2);
            b.fill(sx + 1, y + 1, z0 + MB(6.0f), sx + MB(5.0f), y + MB(2.8f), z0 + MB(6.0f) + 2,
                   MAT_GLASS);
            b.fill(sx + 2, y + 1, z0 + MB(16.0f), sx + MB(4.0f), y + MB(2.4f), z0 + MB(16.0f) + 2,
                   MAT_AIR);
            b.fill(sx + 1, y + 1, z0 + MB(8.0f), sx + MB(5.0f), y + MB(1.0f), z0 + MB(11.0f),
                   MAT_TILE);
        }
        for (int i = 0; i < 5; i++) {
            int sx = x0 + MB(4.0f) + i * MB(8.0f);
            if (sx > ax0 - MB(2.0f) && sx < ax1) continue;
            b.walls(sx, z1 - MB(16.0f), sx + MB(6.0f), z1 - MB(6.0f), y + 1, y + MB(3.4f),
                    MAT_PLASTER, 2);
            b.fill(sx + 1, y + 1, z1 - MB(6.0f) - 2, sx + MB(5.0f), y + MB(2.8f), z1 - MB(6.0f),
                   MAT_GLASS);
        }
        // atrium railing
        b.fill(ax0, y + 1, z0 + MB(10.0f), ax0 + 1, y + MB(1.2f), z1 - MB(10.0f), MAT_STEEL);
        b.fill(ax1 - 1, y + 1, z0 + MB(10.0f), ax1, y + MB(1.2f), z1 - MB(10.0f), MAT_STEEL);
        // escalators in the atrium
        for (int k = 0; k < MB(3.5f); k++) {
            b.fill(ax0 + 2 + k / 2, y + k, cz - MB(3.0f), ax0 + MB(1.6f) + k / 2, y + k,
                   cz + MB(3.0f), MAT_METAL);
        }
    }
    // roof
    int yTop = gy + floors * fh;
    b.fill(x0 - 2, yTop + 1, z0 - 2, x1 + 2, yTop + 1, z1 + 2, MAT_CONCRETE);
    b.walls(x0 - 2, z0 - 2, x1 + 2, z1 + 2, yTop + 2, yTop + MB(1.2f), MAT_CONCRETE, 1);
    // rooftop HVAC
    for (int i = 0; i < 6; i++)
        b.fill(x0 + MB(6.0f) + i * MB(14.0f), yTop + 2, z0 + MB(6.0f), x0 + MB(10.0f) + i * MB(14.0f),
               yTop + MB(3.2f), z0 + MB(10.0f), MAT_METAL);
    // skylight
    b.fill(cx - MB(6.0f), yTop + 1, cz - MB(10.0f), cx + MB(6.0f), yTop + 1, cz + MB(10.0f),
           MAT_GLASS);
    // entrance canopy
    b.fill(x0 + MB(20.0f), gy + MB(4.0f), z1 + 1, x1 - MB(20.0f), gy + MB(4.4f), z1 + MB(4.0f),
           MAT_STEEL);
    for (int i = 0; i < 4; i++)
        b.fill(x0 + MB(22.0f) + i * MB(18.0f), gy, z1 + MB(3.0f), x0 + MB(22.6f) + i * MB(18.0f),
               gy + MB(4.0f), z1 + MB(3.6f), MAT_STEEL);
    // parking garage opposite
    {
        int px0 = cx - MB(36.0f), pz0 = z0 - MB(24.0f);
        for (int f = 0; f < 4; f++) {
            int y = gy + f * MB(3.2f);
            b.fill(px0, y, pz0, px0 + MB(46.0f), y + 1, pz0 + MB(18.0f), MAT_CONCRETE);
            for (int i = 0; i <= 6; i++)
                b.fill(px0 + i * MB(7.5f), y, pz0, px0 + i * MB(7.5f) + 2, y + MB(3.2f),
                       pz0 + MB(18.0f), MAT_CONCRETE);
            b.fill(px0, y, pz0 + MB(17.0f), px0 + MB(46.0f), y + MB(1.0f), pz0 + MB(18.0f),
                   MAT_CONCRETE);
        }
        // ramp
        for (int i = 0; i < MB(6.0f); i++)
            b.fill(px0 + MB(2.0f), gy + i, pz0 + MB(2.0f) + i, px0 + MB(8.0f), gy + i,
                   pz0 + MB(2.0f) + i + 1, MAT_CONCRETE);
    }
    spawnVehicle(0, Vec3((cx - 20) * VOXSZ, 1.2f, (cz + 10) * VOXSZ), 0);
    spawnVehicle(2, Vec3((cx + 22) * VOXSZ, 1.2f, (cz + 12) * VOXSZ), 1.5f);
    spawnVehicle(6, Vec3((cx - 30) * VOXSZ, 1.2f, (cz - 40) * VOXSZ), 0.6f);
    w.syncChunks();
}
