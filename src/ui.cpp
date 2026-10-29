// ui.cpp - menus, HUD, first person tool rendering, settings screens
#include "frac.h"
#include <string>

int UI::hoverId = -1;
int UI::activeId = -1;
float UI::mouseX = 0, UI::mouseY = 0;
bool UI::mouseDown = false;
bool UI::mouseClicked = false;

int g_uiToolSelectOpen = 0;
static int g_menuTab = 0;         // 0 graphics, 1 audio, 2 controls
static int g_menuPage = 0;
static float g_slideReset = 0;

static const uint32_t COL_ACCENT = 0xFFFFB03A;
static const uint32_t COL_ACCENT_DIM = 0xFF8A5F20;
static const uint32_t COL_TEXT = 0xFFDADDE2;
static const uint32_t COL_TEXT_DIM = 0xFF8A9099;
static const uint32_t COL_PANEL = 0xE8141619;
static const uint32_t COL_PANEL_LIGHT = 0x30FFFFFF;
static const uint32_t COL_DANGER = 0xFFE05040;

static bool hitRect(float x, float y, float w, float h) {
    return UI::mouseX >= x && UI::mouseX <= x + w && UI::mouseY >= y && UI::mouseY <= y + h;
}

void UI::panel(Renderer& r, float x, float y, float w, float h) {
    r.uiRect(x, y, w, h, COL_PANEL);
    r.uiRect(x, y, w, 2, COL_ACCENT_DIM);
    r.uiRect(x, y + h - 1, w, 1, 0x40000000);
}

bool UI::button(Renderer& r, float x, float y, float w, float h, const char* label, int id,
                bool selected) {
    bool hover = hitRect(x, y, w, h);
    if (hover) hoverId = id;
    uint32_t base = selected ? 0xFF2E3946 : 0xF41A1F26;   // near-opaque so labels stay legible
    if (hover) base = selected ? 0xFF3C4A5A : 0xFA262E38;
    r.uiRect(x, y, w, h, base);
    // left accent bar
    r.uiRect(x, y, 3, h, (hover || selected) ? COL_ACCENT : COL_ACCENT_DIM);
    r.uiRect(x, y, w, 1, COL_PANEL_LIGHT);
    uint32_t tc = (hover || selected) ? 0xFFFFFFFF : COL_TEXT;
    r.uiText(x + 18, y + (h - 20) * 0.5f, label, tc, 1.0f);
    bool clicked = hover && mouseClicked;
    if (clicked) {
        g_audio.play2d(SND_UI_CLICK, 0.35f);
        activeId = id;
    }
    return clicked;
}

bool UI::toggle(Renderer& r, float x, float y, float w, const char* label, bool& val, int id) {
    bool hover = hitRect(x, y, w, 30);
    if (hover) hoverId = id;
    r.uiRect(x, y, w, 30, hover ? 0xF0262E38 : 0xD01A1F26);
    r.uiText(x + 12, y + 5, label, COL_TEXT, 1.0f);
    float bx = x + w - 52;
    r.uiRect(bx, y + 8, 40, 14, val ? COL_ACCENT_DIM : 0xFF33383F);
    r.uiRect(bx + (val ? 21 : 1), y + 9, 18, 12, val ? COL_ACCENT : 0xFFA0A6AE);
    if (hover && mouseClicked) {
        val = !val;
        g_audio.play2d(SND_UI_CLICK, 0.3f);
        return true;
    }
    return false;
}

bool UI::slider(Renderer& r, float x, float y, float w, float& val, float mn, float mx,
                const char* label, int id) {
    bool hover = hitRect(x, y, w, 30);
    if (hover) hoverId = id;
    r.uiRect(x, y, w, 30, hover ? 0xF0262E38 : 0xD01A1F26);
    char buf[160];
    snprintf(buf, sizeof(buf), "%s", label);
    r.uiText(x + 12, y + 5, buf, COL_TEXT, 1.0f);
    char vb[32];
    snprintf(vb, sizeof(vb), "%.0f", val);
    r.uiText(x + w - 44, y + 5, vb, COL_ACCENT, 1.0f);
    float t = (mx > mn) ? (val - mn) / (mx - mn) : 0;
    r.uiRect(x + 12, y + 22, w - 24, 3, 0xFF33383F);
    r.uiRect(x + 12, y + 22, (w - 24) * t, 3, COL_ACCENT);
    r.uiRect(x + 12 + (w - 24) * t - 3, y + 19, 6, 9, 0xFFFFFFFF);
    bool changed = false;
    if (hover && mouseDown) {
        float nt = saturate((mouseX - (x + 12)) / fmaxf(1.0f, w - 24));
        val = mn + (mx - mn) * nt;
        changed = true;
    }
    return changed;
}

// ------------------------------------------------------------------ tool model
// Viewmodel boxes are authored small (they are life-size metres); this inflates them so
// the held tool reads as a solid object in the lower-right of the screen.
static float g_vmScale = 0.75f;
 // viewmodel transform (applied to every tool batch before rasterising)
static float g_vmZoom = 1.0f;      // uniform scale about the camera (1 = authored size)
static float g_vmFwd = 0.30f;       // metres further from the eye (held out in front)
static float g_vmLift = -0.14f;    // raises the tool into frame (view-space metres)
static float g_vmShift = 0.12f;    // sideways offset towards the lower-right corner

static void addBox(ShapeBatch& sb, const Vec3& pos, const Vec3& half, const Basis& b,
                   uint8_t mat) {
    sb.box(pos, half * g_vmScale, b, mat);
}

void renderFirstPersonTool() {
    Player& p = g_game.player;
    static int dbgOnce = 0;
    if (getenv("FRAC_VMDBG") && dbgOnce++ < 6) logf("[vm] called tool=%d inVehicle=%d", p.tool, int(p.inVehicle));
    if (p.inVehicle) return;
    Renderer& R = g_renderer;
    // view space -> world
    Vec3 right = normalize(cross(R.camDir, Vec3(0, 1, 0)));
    Vec3 up = cross(right, R.camDir);
    auto toWorld = [&](Vec3 v) { return R.camPos + right * v.x + up * v.y + R.camDir * v.z; };
    Basis camBasis;
    camBasis.x = right;
    camBasis.y = up;
    camBasis.z = -R.camDir;

    float swing = 0;
    if (p.swinging) {
        float t = clampf(p.swingT / 0.55f, 0, 1);
        swing = sinf(t * PI) * 1.5f;
        if (t > 0.4f) swing = (1.0f - (t - 0.4f) / 0.6f) * 0.35f;
    }
    float bobX = sinf(p.bob * 6.0f) * 0.01f;
    float bobY = fabsf(cosf(p.bob * 6.0f)) * 0.008f;
    float recoil = p.recoil * 0.09f;
    static ShapeBatch sb;
    sb.reset();
    Basis rb = camBasis;

    switch (p.tool) {
        case TOOL_HAMMER: {
            float ang = -0.5f + swing * 1.9f;
            Basis arm = Basis::rotAxis(Vec3(1, 0, 0), ang);
            Basis fin = camBasis * arm;
            Vec3 base = toWorld(Vec3(0.26f + bobX, -0.26f + bobY - recoil, 0.62f));
            addBox(sb, base, Vec3(0.032f, 0.032f, 0.26f), fin, MAT_WOOD_DARK);
            addBox(sb, base + fin.mul(Vec3(0, 0, 0.27f)), Vec3(0.09f, 0.075f, 0.09f), fin,
                   MAT_STEEL);
            addBox(sb, base + fin.mul(Vec3(0, 0.07f, 0.27f)), Vec3(0.075f, 0.02f, 0.075f), fin,
                   MAT_METAL_RUST);
            break;
        }
        case TOOL_SHOTGUN: {
            // receiver + barrel + pump + stock, held low-right and angled slightly in
            Vec3 base = toWorld(Vec3(0.16f + bobX, -0.17f + bobY - recoil, 0.46f));
            Basis fin = camBasis * Basis::rotAxis(Vec3(1, 0, 0), 0.06f);
            // receiver
            addBox(sb, base, Vec3(0.035f, 0.045f, 0.11f), fin, MAT_METAL);
            // barrel
            addBox(sb, base + fin.mul(Vec3(0, 0.018f, 0.26f)), Vec3(0.019f, 0.019f, 0.19f), fin,
                   MAT_STEEL);
            // magazine tube under the barrel
            addBox(sb, base + fin.mul(Vec3(0, -0.022f, 0.24f)), Vec3(0.016f, 0.016f, 0.16f), fin,
                   MAT_METAL_RUST);
            // wooden pump grip
            addBox(sb, base + fin.mul(Vec3(0, -0.02f, 0.16f)), Vec3(0.032f, 0.030f, 0.055f), fin,
                   MAT_WOOD);
            // stock
            addBox(sb, base + fin.mul(Vec3(0, -0.035f, -0.14f)), Vec3(0.028f, 0.045f, 0.11f), fin,
                   MAT_WOOD_DARK);
            // gloved hand on the pump
            addBox(sb, base + fin.mul(Vec3(-0.01f, -0.055f, 0.15f)), Vec3(0.035f, 0.032f, 0.045f),
                   fin, MAT_FABRIC);
            break;
        }
        case TOOL_ROCKET: {
            Vec3 base = toWorld(Vec3(0.24f + bobX, -0.22f + bobY - recoil * 2, 0.55f));
            Basis fin = camBasis;
            addBox(sb, base, Vec3(0.075f, 0.075f, 0.38f), fin, MAT_PAINT_GREEN);
            addBox(sb, base + fin.mul(Vec3(0, 0.09f, 0)), Vec3(0.02f, 0.02f, 0.2f), fin,
                   MAT_METAL);
            addBox(sb, base + fin.mul(Vec3(0, -0.1f, 0.05f)), Vec3(0.03f, 0.06f, 0.04f), fin,
                   MAT_RUBBER);
            break;
        }
        case TOOL_BLOWTORCH: {
            Vec3 base = toWorld(Vec3(0.24f + bobX, -0.2f + bobY, 0.52f));
            Basis fin = camBasis;
            addBox(sb, base, Vec3(0.055f, 0.055f, 0.17f), fin, MAT_PAINT_RED);
            addBox(sb, base + fin.mul(Vec3(0, 0, 0.2f)), Vec3(0.015f, 0.015f, 0.11f), fin,
                   MAT_COPPER);
            break;
        }
        case TOOL_CUTTER: {
            Vec3 base = toWorld(Vec3(0.22f + bobX, -0.2f + bobY, 0.55f));
            Basis fin = camBasis;
            addBox(sb, base, Vec3(0.05f, 0.05f, 0.26f), fin, MAT_METAL);
            addBox(sb, base + fin.mul(Vec3(0, 0, 0.28f)), Vec3(0.02f, 0.02f, 0.1f), fin,
                   MAT_NEON);
            break;
        }
        case TOOL_DRILL: {
            Vec3 base = toWorld(Vec3(0.24f + bobX, -0.22f + bobY, 0.52f));
            Basis fin = camBasis;
            addBox(sb, base, Vec3(0.06f, 0.06f, 0.2f), fin, MAT_PAINT_YELLOW);
            addBox(sb, base + fin.mul(Vec3(0, 0, 0.3f)), Vec3(0.025f, 0.025f, 0.16f), fin,
                   MAT_STEEL);
            break;
        }
        case TOOL_CHARGE: {
            Vec3 base = toWorld(Vec3(0.2f + bobX, -0.24f + bobY, 0.5f));
            addBox(sb, base, Vec3(0.07f, 0.05f, 0.05f), camBasis, MAT_PAINT_YELLOW);
            addBox(sb, base + camBasis.mul(Vec3(0.05f, 0, 0)), Vec3(0.03f, 0.03f, 0.03f), camBasis,
                   MAT_NEON);
            break;
        }
        case TOOL_PLANK: {
            Vec3 base = toWorld(Vec3(0.22f + bobX, -0.24f + bobY, 0.55f));
            addBox(sb, base, Vec3(0.16f, 0.02f, 0.02f), camBasis, MAT_PLANK);
            addBox(sb, base + camBasis.mul(Vec3(0.18f, 0, 0.05f)), Vec3(0.06f, 0.02f, 0.06f),
                   camBasis, MAT_WOOD);
            break;
        }
        case TOOL_EXTINGUISHER: {
            Vec3 base = toWorld(Vec3(0.22f + bobX, -0.2f + bobY, 0.5f));
            Basis fin = camBasis;
            addBox(sb, base, Vec3(0.09f, 0.09f, 0.22f), fin, MAT_PAINT_RED);
            addBox(sb, base + fin.mul(Vec3(0, 0, 0.24f)), Vec3(0.02f, 0.02f, 0.08f), fin,
                   MAT_METAL);
            break;
        }
        case TOOL_GRAPPLE: {
            Vec3 base = toWorld(Vec3(0.24f + bobX, -0.22f + bobY, 0.5f));
            Basis fin = camBasis;
            addBox(sb, base, Vec3(0.05f, 0.05f, 0.16f), fin, MAT_PAINT_BLUE);
            addBox(sb, base + fin.mul(Vec3(0, 0, 0.19f)), Vec3(0.02f, 0.02f, 0.07f), fin,
                   MAT_STEEL);
            break;
        }
        case TOOL_CABLE: {
            Vec3 base = toWorld(Vec3(0.22f + bobX, -0.22f + bobY, 0.5f));
            addBox(sb, base, Vec3(0.07f, 0.07f, 0.1f), camBasis, MAT_METAL);
            addBox(sb, base + camBasis.mul(Vec3(0, 0, 0.14f)), Vec3(0.03f, 0.03f, 0.05f),
                   camBasis, MAT_NEON);
            break;
        }
        case TOOL_AIRSTRIKE: {
            Vec3 base = toWorld(Vec3(0.2f + bobX, -0.24f + bobY, 0.5f));
            addBox(sb, base, Vec3(0.06f, 0.04f, 0.12f), camBasis, MAT_PAINT_GREEN);
            addBox(sb, base + camBasis.mul(Vec3(0, 0.06f, 0)), Vec3(0.005f, 0.05f, 0.005f),
                   camBasis, MAT_STEEL);
            break;
        }
        default: break;
    }
    // place the viewmodel: zoom out from the eye, then drop it to the lower-right corner
    for (auto& v : sb.v) {
        Vec3 rel = Vec3(v.x, v.y, v.z) - R.camPos;
        Vec3 loc(dot(rel, right), dot(rel, up), dot(rel, R.camDir));
        loc = loc * g_vmZoom;
        loc.z = fmaxf(0.45f, loc.z + g_vmFwd);
        Vec3 wp = R.camPos + right * (loc.x + g_vmShift) + up * (loc.y + g_vmLift) +
                  R.camDir * loc.z;
        v.x = wp.x;
        v.y = wp.y;
        v.z = wp.z;
    }
    R.addLight(toWorld(Vec3(0.2f, -0.1f, 0.5f)), Vec3(1.0f, 0.98f, 0.94f), 3.0f, 0.85f);
    if (getenv("FRAC_VMDBG")) {
        Vec3 mn(1e9f,1e9f,1e9f), mx(-1e9f,-1e9f,-1e9f);
        for (auto& v : sb.v) { mn.x=fminf(mn.x,v.x); mn.y=fminf(mn.y,v.y); mn.z=fminf(mn.z,v.z);
                               mx.x=fmaxf(mx.x,v.x); mx.y=fmaxf(mx.y,v.y); mx.z=fmaxf(mx.z,v.z); }
        logf("[vm] after-transform world bbox (%.2f %.2f %.2f)-(%.2f %.2f %.2f) cam=(%.2f %.2f %.2f)",
             mn.x,mn.y,mn.z,mx.x,mx.y,mx.z, R.camPos.x,R.camPos.y,R.camPos.z);
    }
    if (getenv("FRAC_VMDBG") && dbgOnce < 12) {
        logf("[vm] verts=%d idx=%d cam=%.2f,%.2f,%.2f", int(sb.v.size()), int(sb.i.size()),
             R.camPos.x, R.camPos.y, R.camPos.z);
        if (!sb.v.empty())
            logf("[vm] v0=(%.2f %.2f %.2f)", sb.v[0].x, sb.v[0].y, sb.v[0].z);
        dbgOnce += 10;
    }
    g_noFog = true;
    R.drawShape(sb);
    g_noFog = false;
    // grapple rope
    if (p.grappling) {
        Vec3 eye = R.camPos;
        int seg = 14;
        for (int i = 0; i < seg; i++) {
            Vec3 a = eye + (p.grapplePoint - eye) * (float(i) / seg);
            Vec3 b = eye + (p.grapplePoint - eye) * (float(i + 1) / seg);
            ShapeBatch rope;
            rope.reset();
            rope.box((a + b) * 0.5f, Vec3(0.012f, 0.012f, 0.012f), Basis(), MAT_STEEL);
            R.drawShape(rope);
        }
    }
}

// ------------------------------------------------------------------ HUD
// ---------------------------------------------------------------- minimap
// A real top-down view of the voxel world around the player: for every texel we look up
// the topmost solid voxel and paint it with that material's atlas colour. Rebuilt a few
// times per second (not every frame) so it stays cheap.
static Tex g_miniTex;
static float g_miniTimer = 0;
static Vec3 g_miniCenter(-1e9f);

static void updateMinimap() {
    const int MS = 160;                 // minimap resolution in texels
    const float span = 110.0f;          // metres covered corner to corner
    World& w = g_game.world;
    if (w.chunks.empty()) return;
    if (g_miniTex.w != MS) {
        g_miniTex.w = g_miniTex.h = MS;
        g_miniTex.px.assign(size_t(MS) * MS, 0xFF101418);
    }
    float pxPerM = MS / span;
    Vec3 p = g_game.player.pos;
    g_miniCenter = p;
    for (int ty = 0; ty < MS; ty++) {
        for (int tx = 0; tx < MS; tx++) {
            // +x right, +z down; player in the middle
            float wx = p.x + (tx - MS * 0.5f) / pxPerM;
            float wz = p.z + (ty - MS * 0.5f) / pxPerM;
            int vx = int(wx / VOXSZ), vz = int(wz / VOXSZ);
            uint32_t col;
            if (!w.inside(vx, 0, vz)) {
                col = 0xFF0C0F12;
            } else {
                int topVox = clampi(int(w.topSolidY(vx, vz) / VOXSZ) - 1, 0, w.dims[1] - 1);
                uint8_t m = w.get(vx, topVox, vz);
                if (!m) m = MAT_SOIL;
                col = g_matColor[m];
                // subtle height shading so buildings read as blocks, not flat colour
                float hgt = topVox * VOXSZ;
                float k = clampf(0.72f + hgt * 0.045f, 0.72f, 1.22f);
                uint32_t r = uint32_t(clampf(float((col >> 16) & 255) * k, 0.0f, 255.0f));
                uint32_t g = uint32_t(clampf(float((col >> 8) & 255) * k, 0.0f, 255.0f));
                uint32_t b = uint32_t(clampf(float(col & 255) * k, 0.0f, 255.0f));
                col = 0xFF000000u | (r << 16) | (g << 8) | b;
            }
            g_miniTex.px[size_t(ty) * MS + tx] = col;
        }
    }
    g_miniTimer = 0.35f;
    g_miniCenter = p;
}

static void drawMinimap(Renderer& R, float W) {
    if (!g_game.showMinimap) return;
    float size = clampf(W * 0.19f, 108.0f, 190.0f);
    float x = W - size - 18.0f, y = 18.0f;
    g_miniTimer -= g_game.deltaTime;
    if (g_miniTimer <= 0 || length(g_game.player.pos - g_miniCenter) > 6.0f) updateMinimap();
    if (g_miniTex.w == 0) return;
    R.uiRect(x - 3, y - 3, size + 6, size + 6, 0xE0101418);
    R.uiRect(x - 3, y - 3, size + 6, 2, COL_ACCENT_DIM);
    R.uiImage(x, y, size, size, g_miniTex, 0xFFFFFFFF);
    // player marker + facing wedge, north indicator
    float cx = x + size * 0.5f, cy = y + size * 0.5f;
    float yaw = g_game.player.yaw;
    float dx = sinf(yaw), dz = cosf(yaw);
    R.uiLine(cx, cy, cx + dx * 13.0f, cy + dz * 13.0f, COL_ACCENT, 2.0f);
    R.uiRect(cx - 2.5f, cy - 2.5f, 5, 5, 0xFFFFFFFF);
    R.uiText(x + 4, y + size + 6, "N", COL_TEXT_DIM, 0.8f);
    // objective markers inside the covered area
    if (g_game.curMission >= 0 && g_game.curMission < int(g_game.missions.size())) {
        Mission& m = g_game.missions[g_game.curMission];
        float pxPerM = size / 110.0f;
        Vec3 p = g_game.player.pos;
        for (auto& o : m.objectives) {
            if (o.type != 0 && o.type != 2) continue;
            float ox = cx + (o.pos.x - p.x) * pxPerM;
            float oy = cy + (o.pos.z - p.z) * pxPerM;
            if (ox < x + 4 || ox > x + size - 4 || oy < y + 4 || oy > y + size - 4) continue;
            uint32_t oc = o.done ? 0xFF54C060 : 0xFFFFB03A;
            R.uiRect(ox - 3, oy - 3, 6, 6, oc);
            R.uiRect(ox - 5, oy - 5, 10, 1, oc);
        }
    }
    // compass letters on the frame
    R.uiText(x + size - 12, y + 2, "E", COL_TEXT_DIM, 0.8f);
}

void renderHUD() {
    Renderer& R = g_renderer;
    Player& p = g_game.player;
    float W = float(R.set.width), H = float(R.set.height);
    drawMinimap(R, W);
    // crosshair
    float spread = 0;
    if (p.tool == TOOL_SHOTGUN) spread = 0.6f;
    R.drawCrosshair(p.tool == TOOL_SHOTGUN ? 0 : 1, spread);
    // hit marker
    if (g_game.hitMarker > 0) g_game.hitMarker -= g_game.deltaTime;

    // bottom left: health + tool
    UI::panel(R, 16, H - 116, 300, 100);
    R.uiText(28, H - 104, "HEALTH", COL_TEXT_DIM, 1.0f);
    R.uiRect(28, H - 86, 200, 10, 0xFF2A2E34);
    R.uiRect(28, H - 86, 200 * saturate(p.health / 100.0f), 10,
             p.health > 40 ? 0xFF54C060 : COL_DANGER);
    char buf[128];
    snprintf(buf, sizeof(buf), "%.0f", p.health);
    R.uiText(236, H - 104, buf, COL_TEXT, 1.0f);
    // tool + ammo
    R.uiText(28, H - 62, kTools[p.tool].name, COL_ACCENT, 1.0f);
    const char* ammoStr = "-";
    snprintf(buf, sizeof(buf), "%.0f",
             p.tool == TOOL_BLOWTORCH ? p.fuelLeft
             : p.tool == TOOL_EXTINGUISHER ? p.extinguishFuel
             : p.tool == TOOL_CHARGE ? (float)g_game.charges.size()
             : p.ammo[p.tool]);
    ammoStr = buf;
    bool noAmmo = (p.tool == TOOL_SHOTGUN || p.tool == TOOL_ROCKET) && p.ammo[p.tool] <= 0;
    R.uiText(28, H - 42, noAmmo ? "OUT OF AMMO" : ammoStr, noAmmo ? COL_DANGER : COL_TEXT,
             1.0f);
    if (p.reloadT > 0) {
        R.uiRect(28, H - 24, 120, 4, 0xFF2A2E34);
        R.uiRect(28, H - 24, 120 * (1.0f - p.reloadT / 1.1f), 4, COL_ACCENT);
    } else if (p.tool == TOOL_CHARGE && !g_game.charges.empty()) {
        R.uiText(150, H - 42, "[RMB/R] DETONATE", COL_DANGER, 1.0f);
    } else if (p.tool == TOOL_PLANK) {
        R.uiText(120, H - 42, "LMB: BUILD PLANK", COL_TEXT_DIM, 1.0f);
    } else if (p.tool == TOOL_GRAPPLE) {
        R.uiText(120, H - 42, "LMB: FIRE HOOK", COL_TEXT_DIM, 1.0f);
    }

    // tool wheel (bottom center)
    int unlocked = 0;
    for (int i = 0; i < TOOL_COUNT; i++)
        if (g_game.unlockedTools & (1 << i)) unlocked++;
    float slotW = 46, gap = 6;
    float totalW = unlocked * (slotW + gap) - gap;
    float sx0 = W * 0.5f - totalW * 0.5f;
    int shown = 0;
    for (int i = 0; i < TOOL_COUNT; i++) {
        if (!(g_game.unlockedTools & (1 << i))) continue;
        float x = sx0 + shown * (slotW + gap);
        float y = H - 66;
        bool sel = (p.tool == i);
        R.uiRect(x, y, slotW, 46, sel ? 0xFF3A4658 : 0xC0181C22);
        if (sel) R.uiRect(x, y, slotW, 2, COL_ACCENT);
        snprintf(buf, sizeof(buf), "%d", i + 1);
        R.uiText(x + 5, y + 4, buf, sel ? COL_ACCENT : COL_TEXT_DIM, 0.85f);
        // simple glyph for tool
        R.uiRect(x + slotW * 0.5f - 8, y + 18, 16, 14, sel ? COL_ACCENT : 0xFF565E68);
        shown++;
    }

    // mission objectives
    if (g_game.missionActive && g_game.curMission >= 0 &&
        g_game.curMission < int(g_game.missions.size())) {
        Mission& m = g_game.missions[g_game.curMission];
        float oy = 18;
        UI::panel(R, 16, oy, 330, 30 + m.objectives.size() * 22 + 24);
        R.uiText(28, oy + 8, m.name.c_str(), COL_ACCENT, 1.0f);
        float yy = oy + 34;
        for (auto& o : m.objectives) {
            uint32_t c = o.done ? 0xFF54C060 : COL_TEXT;
            R.uiRect(28, yy + 6, 6, 6, o.done ? 0xFF54C060 : COL_TEXT_DIM);
            R.uiText(42, yy, o.text.c_str(), c, 0.95f);
            if (o.type == 0 && o.targetCount > 0) {
                // progress towards the amount that actually completes the objective
                float pct = 100.0f * float(o.progress) / fmaxf(1.0f, float(objectiveNeed(o)));
                pct = saturate(pct / 100.0f) * 100.0f;
                snprintf(buf, sizeof(buf), "%.0f%%", pct);
                R.uiText(330, yy, buf, o.done ? 0xFF54C060 : COL_TEXT_DIM, 0.9f);
            }
            yy += 22;
        }
        if (m.timed) {
            snprintf(buf, sizeof(buf), "TIME %.1f", m.timeLimit);
            R.uiText(28, yy + 4, buf, m.timeLimit < 20 ? COL_DANGER : COL_TEXT, 1.0f);
        }
    }
    // stats / debug
    if (g_game.showDebug) {
        char b2[256];
        snprintf(b2, sizeof(b2), "FPS %.0f (%.1fms) tris %d chunks %d parts %d debris %d",
                 g_game.fps, g_game.frameMs, R.statsTris, R.statsChunks, g_fx.activeParts,
                 g_phys.activeDebris);
        R.uiTextShadow(16, H - 150, b2, 0xFFB0FFB0, 0.95f);
        snprintf(b2, sizeof(b2), "pos %.1f %.1f %.1f  destroyed %d  bodies %d",
                 p.pos.x, p.pos.y, p.pos.z, g_game.totalDestroyed, int(g_phys.bodies.size()));
        R.uiTextShadow(16, H - 172, b2, 0xFFB0FFB0, 0.95f);
    }
    // vehicle hud
    if (p.inVehicle) {
        Vehicle& v = g_game.vehicles[p.vehicle];
        UI::panel(R, W * 0.5f - 130, H - 150, 260, 54);
        snprintf(buf, sizeof(buf), "SPEED %.0f KM/H", v.speed * 3.6f);
        R.uiText(W * 0.5f - 110, H - 138, buf, COL_ACCENT, 1.1f);
        R.uiRect(W * 0.5f - 110, H - 114, 200, 6, 0xFF2A2E34);
        R.uiRect(W * 0.5f - 110, H - 114, 200 * saturate(v.health / 100.0f), 6,
                 v.health > 40 ? 0xFF54C060 : COL_DANGER);
    }
    // toast
    if (g_game.toastTime > 0) {
        float a = saturate(g_game.toastTime);
        uint32_t c = packColor(1, 1, 1, a);
        float tw = R.uiTextWidth(g_game.toast.c_str(), 1.2f);
        R.uiText(W * 0.5f - tw * 0.5f, 120, g_game.toast.c_str(), c, 1.2f);
    }
    // crosshair info: looking at material
    Vec3 eye = p.pos + Vec3(0, p.eyeHeight, 0);
    Vec3 dir = normalize(Basis::yawPitch(p.yaw, p.pitch).mul(Vec3(0, 0, 1)));
    RayHit h = g_game.world.raycast(eye, dir, 12.0f);
    if (h.hit) {
        char b3[96];
        snprintf(b3, sizeof(b3), "%s  %.1fm", kMats[h.mat].name, h.t);
        R.uiText(W * 0.5f + 22, H * 0.5f + 16, b3, 0xC0FFFFFF, 0.9f);
    }
    // alarm indicator
    if (g_game.alarm > 0) {
        float pulse = 0.5f + 0.5f * sinf(g_game.worldTime * 8.0f);
        R.uiRect(0, 0, W, 4, packColor(1, 0.2f, 0.15f, 0.5f + 0.5f * pulse));
        R.uiText(W * 0.5f - 60, 60, "! ALARM !", packColor(1, 0.3f, 0.2f, 1), 1.4f);
    }
    // vignette when hurt
    if (p.health < 40) {
        float a = (1.0f - p.health / 40.0f) * 0.4f;
        R.uiRect(0, 0, W, H, packColor(0.6f, 0.05f, 0.05f, a * 0.35f));
    }
}

// ------------------------------------------------------------------ menus
static float g_menuTime = 0;
static void drawMenuBackground(Renderer& R) {
    // the live 3D attract view is already in the frame; lay a soft scrim over the left
    // third so menu text stays readable on any backdrop, plus a vignette
    float W = R.set.width, H = R.set.height;
    int steps = 16;
    for (int i = 0; i < steps; i++) {
        float f = 1.0f - float(i) / steps;
        float a = 0.80f * f * f;
        R.uiRect(0, 0, W * (0.30f + i * 0.010f), H, packColor(0.02f, 0.025f, 0.032f, a));
    }
    // soft vignette on the right edge (many thin steps = no visible banding)
    for (int i = 0; i < 24; i++) {
        float f = float(i) / 24.0f;
        float a = 0.05f + 0.20f * f * f;
        R.uiRect(W * (0.84f + f * 0.16f), 0, W * 0.018f, H, packColor(0.01f, 0.012f, 0.016f, a));
    }
    // thin scan lines for an industrial CRT feel
    for (int y = 0; y < H; y += 4) R.uiRect(0, float(y), W, 1, 0x06000000);
}

static void drawTitle(Renderer& R, float x, float y) {
    R.uiBigText(x + 2, y + 2, "FRACTURE", 0xB0000000, 1.35f);
    R.uiBigText(x, y, "FRACTURE", 0xFFFFFFFF, 1.35f);
    R.uiRect(x + 3, y + 62, 420, 3, COL_ACCENT);
    R.uiTextShadow(x + 6, y + 74, "T O T A L   D E S T R U C T I O N", COL_ACCENT, 1.0f);
}

// Apply a named graphics preset. Presets touch every quality knob that costs frame time
// (render scale, draw distance, effects density, bloom), so LOW runs on old laptops and
// ULTRA pushes the software rasteriser.
void applyGraphicsPreset(int idx) {
    Renderer& R = g_renderer;
    g_game.qualityPreset = clampi(idx, 0, 4);
    switch (g_game.qualityPreset) {
        case 0:   // LOW
            R.set.renderScale = 60;
            R.set.viewDist = 90;
            g_fx.quality = 0.35f;
            g_phys.quality = 0.4f;
            R.set.bloom = 0;
            break;
        case 1:   // MEDIUM
            R.set.renderScale = 75;
            R.set.viewDist = 120;
            g_fx.quality = 0.6f;
            g_phys.quality = 0.7f;
            R.set.shadows = 1;
            R.set.bloom = 0;
            break;
        case 2:   // HIGH
            R.set.renderScale = 100;
            R.set.viewDist = 150;
            g_fx.quality = 0.85f;
            g_phys.quality = 1.0f;
            R.set.bloom = 1;
            break;
        case 3:   // VERY HIGH
            R.set.renderScale = 100;
            R.set.viewDist = 200;
            g_fx.quality = 1.0f;
            g_phys.quality = 1.0f;
            R.set.bloom = 1;
            break;
        default:  // ULTRA
            R.set.renderScale = 125;
            R.set.viewDist = 260;
            g_fx.quality = 1.0f;
            g_phys.quality = 1.0f;
            R.set.bloom = 1;
            break;
    }
    logf("[settings] graphics preset %d applied", g_game.qualityPreset);
}

void renderMenu() {
    Renderer& R = g_renderer;
    float W = R.set.width, H = R.set.height;
    UI::mouseX = float(g_input.mouseAbsX);
    UI::mouseY = float(g_input.mouseAbsY);
    UI::mouseDown = g_input.mouse[0];
    UI::mouseClicked = g_input.mousePressed[0];
    drawMenuBackground(R);
    float x = 90, y = 110;
    switch (g_game.state) {
        case GS_MAIN_MENU: {
            float titleY = H * 0.155f;
            drawTitle(R, x, titleY);
            const char* items[] = {"CAMPAIGN", "SANDBOX", "MAP SELECT", "SETTINGS", "CONTROLS",
                                   "QUIT"};
            float by0 = H * 0.395f;
            float gap = fminf(48.0f, (H * 0.50f) / 6.0f);
            float bh = fminf(40.0f, gap - 8.0f);
            for (int i = 0; i < 6; i++) {
                if (UI::button(R, x, by0 + i * gap, 340, bh, items[i], 100 + i)) {
                    switch (i) {
                        case 0: {
                            // campaign: jump to first incomplete mission
                            g_game.sandbox = false;
                            g_game.campaignChapter = 0;
                            int mapIdx = 0;
                            int mission = 0;
                            gameLoadMap(mapIdx, false, mission);
                            break;
                        }
                        case 1: g_game.sandbox = true; g_game.state = GS_MAP_SELECT; break;
                        case 2: g_game.state = GS_MAP_SELECT; break;
                        case 3: g_game.prevState = GS_MAIN_MENU; g_game.state = GS_SETTINGS; break;
                        case 4: g_game.state = GS_CONTROLS; break;
                        case 5: platformRequestQuit(); break;
                    }
                }
            }
            {
                std::string ver = std::string("v") + FRACTURE_VERSION +
                                  "   custom voxel engine   -   software ray-marched lighting";
                float vw = R.uiTextWidth(ver.c_str(), 1.0f) + 24.0f;
                R.uiRect(x - 8, H - 44, vw, 30, 0xA80B1016);
                R.uiText(x + 4, H - 36, ver.c_str(), COL_TEXT_DIM, 1.0f);
            }
            // right-hand info block on its own dark plate so it reads over any backdrop
            float pw = 430.0f, ph = 58.0f;
            float rx = W - pw - 40.0f, ry = H - ph - 40.0f;
            R.uiRect(rx, ry, pw, ph, 0xB00B1016);
            R.uiRect(rx, ry, 3, ph, COL_ACCENT);
            R.uiText(rx + 16, ry + 10, "30 CONTRACTS   -   6 MAPS   -   12 TOOLS", COL_ACCENT, 1.0f);
            R.uiText(rx + 16, ry + 32, "every wall is made of real voxels", COL_TEXT_DIM, 0.9f);
            break;
        }
        case GS_MAP_SELECT: {
            R.uiBigText(x, 56, "SELECT MAP", 0xFFFFFFFF, 1.0f);
            // two columns of three so all six maps fit any window height
            float cw = fminf(430.0f, (W - x * 2.0f - 24.0f) * 0.5f);
            float rh = fminf(78.0f, (H - 230.0f) / 3.0f);
            for (int i = 0; i < g_mapCount; i++) {
                int col = i / 3, row = i % 3;
                float bx = x + col * (cw + 24.0f);
                float by = 112.0f + row * (rh + 8.0f);
                bool hov = hitRect(bx, by, cw, rh);
                R.uiRect(bx, by, cw, rh, hov ? 0xF42A3340 : 0xEE14181D);
                R.uiRect(bx, by, 4, rh, hov ? COL_ACCENT : COL_ACCENT_DIM);
                R.uiText(bx + 16, by + 8, kMaps[i].name, hov ? 0xFFFFFFFF : COL_TEXT, 1.05f);
                // fit the description inside the card instead of letting it run over the edge
                std::string desc = kMaps[i].desc;
                const float dsc = 0.78f;
                int maxChars = int((cw - 34.0f) / (13.0f * 0.62f * dsc));
                if (int(desc.size()) > maxChars) {
                    desc = desc.substr(0, std::max(0, maxChars - 3));
                    while (!desc.empty() && desc.back() == ' ') desc.pop_back();
                    desc += "...";
                }
                R.uiText(bx + 16, by + 32, desc.c_str(), COL_TEXT_DIM, dsc);
                std::string extra = "built area  " + std::to_string(int(kMaps[i].dimx * VOXSZ)) + " x " +
                                    std::to_string(int(kMaps[i].dimz * VOXSZ)) + " m";
                R.uiText(bx + 16, by + rh - 18, extra.c_str(), 0xFF6C7A88, 0.78f);
                if (hov && UI::mouseClicked) {
                    gameLoadMap(i, true, -1);
                }
            }
            if (UI::button(R, x, H - 66, 200, 40, "BACK", 200)) g_game.state = GS_MAIN_MENU;
            R.uiText(x + 224, H - 52, "click a map to drop in with the full tool set", COL_TEXT_DIM,
                     0.9f);
            break;
        }
        case GS_SETTINGS: {
            R.uiBigText(x, 44, "SETTINGS", 0xFFFFFFFF, 1.0f);
            const char* tabs[] = {"GRAPHICS", "AUDIO", "SANDBOX"};
            for (int i = 0; i < 3; i++)
                if (UI::button(R, x + i * 170, 100, 160, 36, tabs[i], 300 + i, g_menuTab == i))
                    g_menuTab = i;
            float yy = 158;
            if (g_menuTab == 0) {
                // quality presets - one click sets every graphics knob at once
                static const char* qn[] = {"LOW", "MEDIUM", "HIGH", "VERY HIGH", "ULTRA"};
                R.uiText(x, yy - 18, "QUALITY PRESET", COL_ACCENT, 0.9f);
                float bw = (520.0f - 4 * 8.0f) / 5.0f;
                for (int i = 0; i < 5; i++)
                    if (UI::button(R, x + i * (bw + 8.0f), yy, bw, 32, qn[i], 450 + i,
                                   g_game.qualityPreset == i))
                        applyGraphicsPreset(i);
                // two columns of settings so everything fits above the BACK button
                float c1 = x, c2 = x + 276.0f, cw2 = 244.0f;
                float r1 = yy + 52.0f, r2 = r1, step = 38.0f;
                float rs = float(R.set.renderScale);
                if (UI::slider(R, c1, r1, cw2, rs, 50, 125, "Render scale %", 400))
                    R.set.renderScale = int(rs);
                r1 += step;
                float vd = float(R.set.viewDist);
                if (UI::slider(R, c1, r1, cw2, vd, 60, 260, "View dist (m)", 401))
                    R.set.viewDist = int(vd);
                r1 += step;
                float fov = R.set.fov;
                if (UI::slider(R, c1, r1, cw2, fov, 60, 110, "Field of view", 402)) R.set.fov = fov;
                r1 += step;
                float exp = R.exposure;
                if (UI::slider(R, c1, r1, cw2, exp, 0.5f, 2.5f, "Brightness", 403))
                    R.exposure = exp;
                r1 += step;
                float sens = g_game.sens * 100.0f;
                if (UI::slider(R, c1, r1, cw2, sens, 5, 100, "Mouse sens.", 406))
                    g_game.sens = sens / 100.0f;

                bool bl = R.set.bloom != 0;
                if (UI::toggle(R, c2, r2 - 2, cw2, "Bloom", bl, 404)) R.set.bloom = bl ? 1 : 0;
                r2 += step;
                bool dbg = g_game.showDebug;
                if (UI::toggle(R, c2, r2 - 2, cw2, "Perf stats (F3)", dbg, 405))
                    g_game.showDebug = dbg;
                r2 += step;
                bool sm = R.set.shadows != 0;
                if (UI::toggle(R, c2, r2 - 2, cw2, "Sun shadows", sm, 408))
                    R.set.shadows = sm ? 1 : 0;
                r2 += step;
                float dq = g_fx.quality * 100.0f;
                if (UI::slider(R, c2, r2, cw2, dq, 30, 100, "FX density %", 407)) {
                    g_fx.quality = dq / 100.0f;
                    g_phys.quality = dq / 100.0f;
                }
                r2 += step;
                R.uiText(c2, r2, "preset also sets scale & distance", COL_TEXT_DIM, 0.78f);
            } else if (g_menuTab == 1) {
                float m = g_audio.master * 100;
                if (UI::slider(R, x, yy, 520, m, 0, 100, "Master volume", 410))
                    g_audio.master = m / 100.0f;
                yy += 36;
                float s = g_audio.sfxVol * 100;
                if (UI::slider(R, x, yy, 520, s, 0, 100, "Effects volume", 411))
                    g_audio.sfxVol = s / 100.0f;
                yy += 36;
                bool en = g_audio.enabled;
                if (UI::toggle(R, x, yy, 520, "Audio enabled", en, 412)) g_audio.enabled = en;
            } else {
                bool inf = g_game.sandboxOpts.infiniteAmmo;
                if (UI::toggle(R, x, yy, 520, "Unlimited ammunition", inf, 420))
                    g_game.sandboxOpts.infiniteAmmo = inf;
                yy += 36;
                bool inv = g_game.sandboxOpts.invincible;
                if (UI::toggle(R, x, yy, 520, "Invincibility", inv, 421))
                    g_game.sandboxOpts.invincible = inv;
                yy += 36;
                bool fire = g_game.sandboxOpts.fireEnabled;
                if (UI::toggle(R, x, yy, 520, "Fire simulation", fire, 422))
                    g_game.sandboxOpts.fireEnabled = fire;
                yy += 36;
                float g = g_game.sandboxOpts.gravityScale * 100;
                if (UI::slider(R, x, yy, 520, g, 20, 200, "Gravity (%)", 423))
                    g_game.sandboxOpts.gravityScale = g / 100.0f;
                yy += 36;
                float ex = g_game.sandboxOpts.explosionScale * 100;
                if (UI::slider(R, x, yy, 520, ex, 50, 400, "Explosion power (%)", 424))
                    g_game.sandboxOpts.explosionScale = ex / 100.0f;
                yy += 36;
                float tod = float(g_game.timeOfDay);
                if (UI::slider(R, x, yy, 520, tod, 0, 3, "Time of day (0 dawn 3 night)", 425))
                    setTimeOfDay(int(tod));
                yy += 36;
                float we = float(g_game.weather);
                if (UI::slider(R, x, yy, 520, we, 0, 4, "Weather (0 clear 4 storm)", 426))
                    setWeather(int(we));
            }
            if (UI::button(R, x, H - 80, 200, 42, "BACK", 490))
                g_game.state = g_game.prevState == GS_PAUSED ? GS_PAUSED : GS_MAIN_MENU;
            break;
        }
        case GS_CONTROLS: {
            R.uiBigText(x, 44, "CONTROLS", 0xFFFFFFFF, 1.0f);
            // two columns, grouped
            const char* left[] = {
                "W A S D", "MOUSE", "SHIFT", "CTRL", "SPACE", "E",
                "LMB", "RMB", "R", "F",
            };
            const char* leftD[] = {
                "MOVE", "LOOK", "SPRINT", "CROUCH", "JUMP", "INTERACT / ENTER / EXIT VEHICLE",
                "USE TOOL", "SECONDARY (DETONATE CHARGES)", "RELOAD / DETONATE", "FLASHLIGHT",
            };
            const char* right[] = {"1 - 9 / WHEEL", "TAB", "F3", "F11", "ESC", "F5 / F9",
                                   "M", "", "", ""};
            const char* rightD[] = {"SELECT TOOL", "TOOL INVENTORY", "PERFORMANCE STATS",
                                    "FULLSCREEN", "PAUSE MENU", "QUICK SAVE / LOAD", "MINIMAP", "",
                                    "", ""};
            float rowH = 26.0f, y0 = 112.0f;
            for (int i = 0; i < 10; i++) {
                if (left[i][0]) {
                    R.uiText(x, y0 + i * rowH, left[i], COL_ACCENT, 0.95f);
                    R.uiText(x + 130, y0 + i * rowH, leftD[i], COL_TEXT, 0.95f);
                }
                if (right[i][0]) {
                    R.uiText(x + 430, y0 + i * rowH, right[i], COL_ACCENT, 0.95f);
                    R.uiText(x + 560, y0 + i * rowH, rightD[i], COL_TEXT, 0.95f);
                }
            }
            if (UI::button(R, x, H - 62, 200, 40, "BACK", 500)) g_game.state = GS_MAIN_MENU;
            break;
        }
        default: break;
    }
    // custom cursor
    R.uiRect(UI::mouseX - 1, UI::mouseY - 8, 2, 16, 0xFFFFFFFF);
    R.uiRect(UI::mouseX - 8, UI::mouseY - 1, 16, 2, 0xFFFFFFFF);
    R.uiRect(UI::mouseX - 1, UI::mouseY - 1, 2, 2, COL_ACCENT);
}

void renderPauseMenu() {
    Renderer& R = g_renderer;
    float W = R.set.width, H = R.set.height;
    UI::mouseX = float(g_input.mouseAbsX);
    UI::mouseY = float(g_input.mouseAbsY);
    UI::mouseDown = g_input.mouse[0];
    UI::mouseClicked = g_input.mousePressed[0];
    R.uiRect(0, 0, W, H, 0xA0080A0C);
    float x = W * 0.5f - 220, y = H * 0.28f;
    UI::panel(R, x - 20, y - 60, 480, 430);
    R.uiBigText(x, y - 40, "PAUSED", 0xFFFFFFFF, 1.0f);
    const char* items[] = {"RESUME", "SAVE GAME", "LOAD GAME", "SETTINGS", "RESTART MAP",
                           "MAIN MENU"};
    for (int i = 0; i < 6; i++) {
        if (UI::button(R, x, y + 30 + i * 48, 440, 40, items[i], 600 + i)) {
            switch (i) {
                case 0: g_game.state = GS_PLAYING; break;
                case 1: saveGame(1); break;
                case 2:
                    if (loadGame(1)) g_game.state = GS_PLAYING;
                    break;
                case 3:
                    g_game.prevState = GS_PAUSED;
                    g_game.state = GS_SETTINGS;
                    break;
                case 4: gameResetWorld(); break;
                case 5:
                    g_game.state = GS_MAIN_MENU;
                    break;
            }
        }
    }
    R.uiRect(UI::mouseX - 1, UI::mouseY - 8, 2, 16, 0xFFFFFFFF);
    R.uiRect(UI::mouseX - 8, UI::mouseY - 1, 16, 2, 0xFFFFFFFF);
}

void renderMissionComplete() {
    Renderer& R = g_renderer;
    float W = R.set.width, H = R.set.height;
    UI::mouseX = float(g_input.mouseAbsX);
    UI::mouseY = float(g_input.mouseAbsY);
    UI::mouseDown = g_input.mouse[0];
    UI::mouseClicked = g_input.mousePressed[0];
    bool failed = g_game.state == GS_FAILED;
    R.uiRect(0, 0, W, H, 0xB0080A0C);
    float x = W * 0.5f - 240, y = H * 0.3f;
    UI::panel(R, x - 20, y - 70, 520, 360);
    R.uiBigText(x, y - 50, failed ? "MISSION FAILED" : "MISSION COMPLETE",
                failed ? COL_DANGER : COL_ACCENT, 0.95f);
    char buf[128];
    if (!failed) {
        snprintf(buf, sizeof(buf), "DESTRUCTION: %d voxels", g_game.totalDestroyed);
        R.uiText(x, y + 20, buf, COL_TEXT, 1.0f);
        snprintf(buf, sizeof(buf), "TIME: %.1f s", g_game.missionTimer);
        R.uiText(x, y + 46, buf, COL_TEXT, 1.0f);
        snprintf(buf, sizeof(buf), "FEE: $%.0f", g_game.money);
        R.uiText(x, y + 72, buf, COL_TEXT, 1.0f);
    } else {
        R.uiText(x, y + 20, g_game.toast.c_str(), COL_TEXT, 1.0f);
    }
    if (UI::button(R, x, y + 130, 240, 42, "RETRY", 700)) {
        gameLoadMap(g_game.selMap, g_game.sandbox, g_game.curMission);
    }
    if (UI::button(R, x + 260, y + 130, 240, 42, "MAIN MENU", 701)) {
        g_game.state = GS_MAIN_MENU;
    }
    R.uiRect(UI::mouseX - 1, UI::mouseY - 8, 2, 16, 0xFFFFFFFF);
    R.uiRect(UI::mouseX - 8, UI::mouseY - 1, 16, 2, 0xFFFFFFFF);
}

void renderToolSelect() {
    Renderer& R = g_renderer;
    float W = R.set.width, H = R.set.height;
    UI::mouseX = float(g_input.mouseAbsX);
    UI::mouseY = float(g_input.mouseAbsY);
    UI::mouseClicked = g_input.mousePressed[0];
    UI::mouseDown = g_input.mouse[0];
    R.uiRect(0, 0, W, H, 0x90080A0C);
    float pw = 720, ph = 460;
    float px = W * 0.5f - pw * 0.5f, py = H * 0.5f - ph * 0.5f;
    UI::panel(R, px, py, pw, ph);
    R.uiBigText(px + 20, py + 10, "TOOL INVENTORY", 0xFFFFFFFF, 0.62f);
    for (int i = 0; i < TOOL_COUNT; i++) {
        int col = i % 3, row = i / 3;
        float bx = px + 20 + col * 230, by = py + 80 + row * 92;
        bool unlocked = (g_game.unlockedTools & (1 << i)) != 0;
        bool sel = g_game.player.tool == i;
        uint32_t bg = !unlocked ? 0x60101418 : (sel ? 0xF03A4658 : 0xC014181D);
        R.uiRect(bx, by, 218, 84, bg);
        R.uiRect(bx, by, 3, 84, sel ? COL_ACCENT : (unlocked ? COL_ACCENT_DIM : 0xFF33383F));
        R.uiText(bx + 12, by + 8, kTools[i].name, unlocked ? COL_TEXT : 0xFF565E68, 0.95f);
        R.uiText(bx + 12, by + 30, unlocked ? kTools[i].desc : "LOCKED - COMPLETE MISSIONS",
                 COL_TEXT_DIM, 0.72f);
        if (unlocked && hitRect(bx, by, 218, 84) && UI::mouseClicked) {
            g_game.player.tool = i;
            g_audio.play2d(SND_UI_CLICK, 0.4f);
        }
        char num[8];
        snprintf(num, sizeof(num), "%d", i + 1);
        R.uiText(bx + 196, by + 8, num, COL_TEXT_DIM, 0.85f);
    }
    R.uiText(px + 20, py + ph - 26, "TAB / ESC TO CLOSE", COL_TEXT_DIM, 0.9f);
}
