// HORIZON VELOCITY - shared material library (vehicles + world)
#include "render/materials.h"
#include "render/gfx.h"
#include "core/noise.h"
#include "game/cars.h"
#include <map>
#include <string>

namespace hv {

// ---------------------------------------------------------------- materials
static std::map<std::string, int> g_matCache;

int matNamed(const char* name) {
    auto it = g_matCache.find(name);
    if (it != g_matCache.end()) return it->second;
    Material m;
    m.name = name;
    std::string n(name);
    if (n == "glass") { m.shade = Shade::Glass; m.albedo = Color(0.55f, 0.60f, 0.62f); m.opacity = 0.30f; m.roughness = 0.06f; m.metallic = 0.0f; m.doubleSided = false; }
    else if (n == "glass_tint") { m.shade = Shade::Glass; m.albedo = Color(0.16f, 0.17f, 0.19f); m.opacity = 0.55f; m.roughness = 0.05f; }
    else if (n == "chrome") { m.metallic = 1.0f; m.roughness = 0.07f; m.albedo = Color(0.86f, 0.87f, 0.89f); }
    else if (n == "brushed") { m.metallic = 1.0f; m.roughness = 0.30f; m.albedo = Color(0.72f, 0.73f, 0.75f); }
    else if (n == "blackplastic") { m.metallic = 0.0f; m.roughness = 0.62f; m.albedo = Color(0.035f, 0.035f, 0.038f); }
    else if (n == "rubber") { m.metallic = 0.0f; m.roughness = 0.92f; m.albedo = Color(0.022f, 0.022f, 0.024f); }
    else if (n == "rim") { m.metallic = 1.0f; m.roughness = 0.22f; m.albedo = Color(0.62f, 0.63f, 0.66f); }
    else if (n == "rimdark") { m.metallic = 0.9f; m.roughness = 0.35f; m.albedo = Color(0.14f, 0.145f, 0.16f); }
    else if (n == "caliper") { m.metallic = 0.25f; m.roughness = 0.32f; m.albedo = Color(0.62f, 0.06f, 0.06f); }
    else if (n == "disc") { m.metallic = 1.0f; m.roughness = 0.42f; m.albedo = Color(0.34f, 0.34f, 0.36f); }
    else if (n == "leather") { m.metallic = 0.0f; m.roughness = 0.68f; m.albedo = Color(0.055f, 0.05f, 0.048f); }
    else if (n == "leather_tan") { m.metallic = 0.0f; m.roughness = 0.62f; m.albedo = Color(0.31f, 0.22f, 0.13f); }
    else if (n == "interior") { m.metallic = 0.0f; m.roughness = 0.55f; m.albedo = Color(0.028f, 0.028f, 0.031f); }
    else if (n == "softtouch") { m.metallic = 0.0f; m.roughness = 0.45f; m.albedo = Color(0.06f, 0.062f, 0.068f); }
    else if (n == "screen") { m.shade = Shade::Emissive; m.albedo = Color(0.1f,0.3f,0.4f); m.emissive = Color(0.25f, 0.85f, 1.0f, 1.6f); m.roughness = 0.15f; }
    else if (n == "headlight") { m.shade = Shade::Emissive; m.albedo = Color(0.9f,0.92f,1.0f); m.emissive = Color(1.0f, 0.97f, 0.90f, 2.4f); m.roughness = 0.12f; m.metallic = 0.2f; }
    else  if (n == "headlight_off") { m.shade = Shade::Emissive; m.albedo = Color(0.75f,0.78f,0.82f); m.emissive = Color(0.10f, 0.11f, 0.13f, 1.0f); m.roughness = 0.10f; m.metallic = 0.3f; }
    else if (n == "drl") { m.shade = Shade::Emissive; m.albedo = Color(1,1,1); m.emissive = Color(1.0f, 0.98f, 0.94f, 3.2f); }
    else if (n == "taillight") { m.shade = Shade::Emissive; m.albedo = Color(0.6f,0.05f,0.05f); m.emissive = Color(1.0f, 0.08f, 0.06f, 2.0f); m.roughness = 0.15f; }
    else if (n == "brakelight") { m.shade = Shade::Emissive; m.albedo = Color(0.7f,0.06f,0.06f); m.emissive = Color(1.0f, 0.10f, 0.08f, 3.6f); }
    else if (n == "reverse_light") { m.shade = Shade::Emissive; m.albedo = Color(1,1,1); m.emissive = Color(1.0f, 1.0f, 1.0f, 1.6f); }
    else if (n == "carbon") { m.metallic = 0.45f; m.roughness = 0.28f; m.albedo = Color(0.028f, 0.028f, 0.031f); }
    else if (n == "grille") { m.metallic = 0.55f; m.roughness = 0.45f; m.albedo = Color(0.03f, 0.03f, 0.034f); }
    else if (n == "plate") { m.metallic = 0.0f; m.roughness = 0.55f; m.albedo = Color(0.86f, 0.86f, 0.82f); }
    else if (n == "gold") { m.metallic = 1.0f; m.roughness = 0.22f; m.albedo = Color(0.85f, 0.66f, 0.30f); }
    else if (n == "copper") { m.metallic = 1.0f; m.roughness = 0.30f; m.albedo = Color(0.72f, 0.42f, 0.26f); }
    else if (n == "white") { m.metallic = 0.0f; m.roughness = 0.45f; m.albedo = Color(0.85f,0.85f,0.86f); }
    // ---- world surfaces
    else if (n == "road_asphalt") { m.shade = Shade::Asphalt; m.albedo = Color(0.20f,0.20f,0.21f); m.roughness = 0.80f; m.texture = texNamed("asphalt_grain"); m.texture2 = texNamed("road_mask"); m.uvScale = Vec2(1.0f, 1.0f); }
    else if (n == "road_concrete") { m.shade = Shade::Asphalt; m.albedo = Color(0.28f,0.28f,0.29f); m.roughness = 0.72f; m.texture = texNamed("asphalt_grain"); m.texture2 = texNamed("road_mask"); }
    else if (n == "road_dirt") { m.shade = Shade::Lit; m.albedo = Color(0.30f,0.22f,0.14f); m.roughness = 0.94f; m.texture = texNamed("dirt_grain"); m.uvScale = Vec2(6,6); }
    else if (n == "road_gravel") { m.shade = Shade::Lit; m.albedo = Color(0.34f,0.31f,0.27f); m.roughness = 0.93f; m.texture = texNamed("dirt_grain"); m.uvScale = Vec2(8,8); }
    else if (n == "paint_line") { m.shade = Shade::Lit; m.albedo = Color(0.88f,0.88f,0.84f); m.roughness = 0.55f; }
    else if (n == "terrain_grass") { m.shade = Shade::Terrain; m.albedo = Color(0.42f,0.55f,0.26f); m.roughness = 0.95f; m.texture = texNamed("grass_detail"); m.uvScale = Vec2(1,1); }
    else if (n == "terrain_forest") { m.shade = Shade::Terrain; m.albedo = Color(0.28f,0.42f,0.20f); m.roughness = 0.96f; m.texture = texNamed("grass_detail"); }
    else if (n == "terrain_sand") { m.shade = Shade::Terrain; m.albedo = Color(0.84f,0.76f,0.55f); m.roughness = 0.92f; m.texture = texNamed("dirt_grain"); }
    else if (n == "terrain_dirt") { m.shade = Shade::Terrain; m.albedo = Color(0.62f,0.48f,0.33f); m.roughness = 0.94f; m.texture = texNamed("dirt_grain"); }
    else if (n == "terrain_rock") { m.shade = Shade::Terrain; m.albedo = Color(0.58f,0.57f,0.54f); m.roughness = 0.88f; m.texture = texNamed("dirt_grain"); }
    else if (n == "terrain_snow") { m.shade = Shade::Terrain; m.albedo = Color(0.94f,0.96f,1.00f); m.roughness = 0.72f; }
    else if (n == "terrain_farm") { m.shade = Shade::Terrain; m.albedo = Color(0.62f,0.56f,0.30f); m.roughness = 0.95f; m.texture = texNamed("grass_light"); }
    else if (n == "terrain_concrete") { m.shade = Shade::Terrain; m.albedo = Color(0.56f,0.56f,0.57f); m.roughness = 0.86f; m.texture = texNamed("asphalt_grain"); m.uvScale = Vec2(4,4); }
    else if (n == "kerb_red") { m.shade = Shade::Lit; m.albedo = Color(0.62f,0.09f,0.08f); m.roughness = 0.55f; }
    else if (n == "kerb_white") { m.shade = Shade::Lit; m.albedo = Color(0.84f,0.84f,0.82f); m.roughness = 0.55f; }
    else if (n == "water") { m.shade = Shade::Water; m.albedo = Color(0.05f,0.20f,0.30f); m.roughness = 0.06f; m.doubleSided = true; }
    // ---- props
    else if (n == "tree_bark") { m.shade = Shade::Lit; m.albedo = Color(0.34f,0.25f,0.17f); m.roughness = 0.90f; m.texture = texNamed("dirt_grain"); m.uvScale = Vec2(2,2); }
    else if (n == "leaf") { m.shade = Shade::Foliage; m.albedo = Color(0.26f,0.44f,0.16f); m.roughness = 0.86f; m.doubleSided = true; m.windStrength = 0.55f; m.texture = texNamed("foliage"); }
    else if (n == "leaf_palm") { m.shade = Shade::Foliage; m.albedo = Color(0.32f,0.50f,0.20f); m.roughness = 0.82f; m.doubleSided = true; m.windStrength = 0.8f; m.texture = texNamed("foliage"); }
    else if (n == "leaf_autumn") { m.shade = Shade::Foliage; m.albedo = Color(0.36f,0.24f,0.08f); m.roughness = 0.88f; m.doubleSided = true; m.windStrength = 0.4f; m.texture = texNamed("foliage"); }
    else if (n == "concrete_wall") { m.shade = Shade::Lit; m.albedo = Color(0.62f,0.61f,0.58f); m.roughness = 0.82f; m.texture = texNamed("concrete_detail"); m.uvScale = Vec2(3,3); }
    else if (n == "building_glass") { m.shade = Shade::Lit; m.albedo = Color(0.13f,0.17f,0.21f); m.metallic = 0.85f; m.roughness = 0.10f; }
    else if (n == "building_white") { m.shade = Shade::Lit; m.albedo = Color(0.80f,0.80f,0.78f); m.roughness = 0.70f; }
    else if (n == "building_brick") { m.shade = Shade::Lit; m.albedo = Color(0.42f,0.20f,0.14f); m.roughness = 0.86f; m.texture = texNamed("concrete_detail"); }
    else if (n == "metal_pole") { m.shade = Shade::Lit; m.metallic = 0.75f; m.roughness = 0.40f; m.albedo = Color(0.42f,0.44f,0.46f); }
    else if (n == "sign_green") { m.shade = Shade::Lit; m.albedo = Color(0.08f,0.30f,0.16f); m.roughness = 0.55f; }
    else if (n == "barrier") { m.shade = Shade::Lit; m.metallic = 0.8f; m.roughness = 0.45f; m.albedo = Color(0.62f,0.64f,0.66f); }
    else if (n == "lamp_glow") { m.shade = Shade::Emissive; m.albedo = Color(1,1,1); m.emissive = Color(1.0f, 0.86f, 0.62f, 3.0f); }
    else if (n == "stage_black") { m.shade = Shade::Lit; m.albedo = Color(0.04f,0.04f,0.05f); m.roughness = 0.6f; }
    else if (n == "festival_pink") { m.shade = Shade::Emissive; m.albedo = Color(0.9f,0.2f,0.5f); m.emissive = Color(1.0f, 0.16f, 0.55f, 2.2f); }
    else if (n == "festival_cyan") { m.shade = Shade::Emissive; m.albedo = Color(0.2f,0.8f,0.9f); m.emissive = Color(0.15f, 0.85f, 1.0f, 2.2f); }
    else if (n == "tire_track") { m.shade = Shade::Lit; m.albedo = Color(0.12f,0.12f,0.13f); m.roughness = 0.9f; }
    else { m.metallic = 0.1f; m.roughness = 0.5f; m.albedo = Color(0.5f,0.5f,0.5f); }
    int idx = assets().addMaterial(m);
    g_matCache[name] = idx;
    return idx;
}

int matPaint(const PaintColor& c, const char* name) {
    Material m;
    m.name = name;
    m.shade = Shade::CarPaint;
    m.albedo = Color::fromHex(c.hex);
    m.metallic = c.metallic;
    m.roughness = 0.16f + (1.0f - c.clearcoat) * 0.4f;
    m.clearcoat = c.clearcoat;
    return assets().addMaterial(m);
}

int texNamed(const char* name) {
    int t = assets().tex(name);
    return t;
}

void initVehicleMaterials() {
    // pre-create the shared materials so indices are stable
    const char* names[] = {"glass", "glass_tint", "chrome", "brushed", "blackplastic", "rubber", "rim",
                           "rimdark", "caliper", "disc", "leather", "leather_tan", "interior", "softtouch",
                           "screen", "headlight", "headlight_off", "drl", "taillight", "brakelight",
                           "reverse_light", "carbon", "grille", "plate", "gold", "copper", "white"};
    for (auto n : names) matNamed(n);
}


} // namespace hv

namespace hv {

static Texture makeNoiseTex(const char* name, int w, int h, float scale, Vec3 lo, Vec3 hi, uint32_t seed) {
    Texture t;
    t.w = w; t.h = h;
    t.name = name;
    t.px.resize((size_t)w * h);
    Noise n;
    n.init(seed);
    for (int y = 0; y < h; y++)
        for (int x = 0; x < w; x++) {
            // tileable noise via 4-corner blend
            float fx = (float)x / w, fy = (float)y / h;
            float v = n.fbm2(fx * scale, fy * scale, 4) * 0.5f + 0.5f;
            float v2 = n.fbm2(fx * scale * 4.0f + 31.0f, fy * scale * 4.0f + 17.0f, 3) * 0.5f + 0.5f;
            float m = clampf(v * 0.72f + v2 * 0.28f, 0.0f, 1.0f);
            Vec3 c = vlerp(lo, hi, m);
            uint32_t r = (uint32_t)(clampf(c.x, 0, 1) * 255.0f);
            uint32_t g = (uint32_t)(clampf(c.y, 0, 1) * 255.0f);
            uint32_t b = (uint32_t)(clampf(c.z, 0, 1) * 255.0f);
            t.px[(size_t)y * w + x] = r | (g << 8) | (b << 16) | (255u << 24);
        }
    return t;
}

// Road surface marking mask: u across the carriageway, v along it.
static Texture makeRoadMask(int w, int h, bool centreLine, bool edges, bool dashes) {
    Texture t;
    t.w = w; t.h = h;
    t.name = "road_mask";
    t.px.assign((size_t)w * h, 0xFF000000u);
    for (int y = 0; y < h; y++) {
        for (int x = 0; x < w; x++) {
            float u = (float)x / (float)(w - 1);
            int mark = 0;
            if (edges && (u < 0.045f || u > 0.955f)) mark = 1;
            if (centreLine) {
                float du = std::fabs(u - 0.5f);
                if (du < 0.011f) {
                    if (!dashes) mark = 1;
                    else if (((float)y / (float)h) < 0.55f) mark = 1;   // dash gap
                }
                if (du > 0.235f && du < 0.247f && ((float)y / (float)h) < 0.5f) mark = 1;
            }
            if (mark) t.px[(size_t)y * w + x] = 0xFFFFFFFFu;   // r channel = mask
        }
    }
    return t;
}

void initWorldMaterials() {
    if (assets().tex("asphalt_grain") < 0) {
        assets().addTexture(makeNoiseTex("asphalt_grain", 256, 256, 26.0f, Vec3(0.35f, 0.35f, 0.36f), Vec3(0.85f, 0.85f, 0.87f), 7));
        assets().addTexture(makeNoiseTex("dirt_grain", 128, 128, 14.0f, Vec3(0.55f, 0.55f, 0.55f), Vec3(1.0f, 1.0f, 1.0f), 11));
        assets().addTexture(makeNoiseTex("grass_detail", 128, 128, 18.0f, Vec3(0.62f, 0.62f, 0.58f), Vec3(1.0f, 1.0f, 0.96f), 23));
        assets().addTexture(makeNoiseTex("grass_light", 128, 128, 12.0f, Vec3(0.60f, 0.58f, 0.52f), Vec3(1.0f, 0.98f, 0.90f), 31));
        assets().addTexture(makeNoiseTex("concrete_detail", 128, 128, 10.0f, Vec3(0.72f, 0.72f, 0.72f), Vec3(1.0f, 1.0f, 1.0f), 41));
        assets().addTexture(makeNoiseTex("foliage", 128, 128, 15.0f, Vec3(0.55f, 0.55f, 0.50f), Vec3(1.0f, 1.0f, 0.95f), 53));
        assets().addTexture(makeRoadMask(64, 256, true, true, true));
    }
    const char* names[] = {
        "road_asphalt", "road_concrete", "road_dirt", "road_gravel", "paint_line",
        "terrain_grass", "terrain_forest", "terrain_sand", "terrain_dirt", "terrain_rock",
        "terrain_snow", "terrain_farm", "terrain_concrete", "kerb_red", "kerb_white", "water",
        "tree_bark", "leaf", "leaf_palm", "leaf_autumn", "concrete_wall", "building_glass",
        "building_white", "building_brick", "metal_pole", "sign_green", "barrier", "lamp_glow",
        "stage_black", "festival_pink", "festival_cyan", "tire_track"
    };
    for (auto n : names) matNamed(n);
}

} // namespace hv
