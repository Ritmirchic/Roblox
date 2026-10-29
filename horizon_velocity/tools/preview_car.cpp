// Offline renderer harness: renders a vehicle for visual inspection.
#include "game/cars.h"
#include "render/gfx.h"
#include <cstdio>
#include <cstring>

using namespace hv;

static int g_groundMat = -1;

static Mesh buildStudioFloor() {
    MeshBuilder mb;
    mb.begin();
    Material m;
    m.name = "studio_floor";
    m.shade = Shade::Lit;
    m.albedo = Color(0.16f, 0.165f, 0.17f);
    m.roughness = 0.45f;
    m.metallic = 0.0f;
    g_groundMat = assets().addMaterial(m);
    mb.setMaterial(g_groundMat);
    float S = 40.0f;
    mb.quad(Vec3(-S, 0, -S), Vec3(S, 0, -S), Vec3(S, 0, S), Vec3(-S, 0, S), Vec3(0,1,0));
    mb.build(false);
    return mb.mesh;
}

int main(int argc, char** argv) {
    const char* carId = argc > 1 ? argv[1] : "corsa_super";
    const char* outPath = argc > 2 ? argv[2] : "/tmp/car.png";
    float yaw = argc > 3 ? (float)atof(argv[3]) : 0.6f;
    int W = argc > 4 ? atoi(argv[4]) : 1280;
    int H = argc > 5 ? atoi(argv[5]) : 720;
    bool interior = argc > 6 && strcmp(argv[6], "interior") == 0;
    bool hullOnly = argc > 6 && strcmp(argv[6], "hull") == 0;
    bool noShadow = false;
    for (int i = 1; i < argc; i++) if (strcmp(argv[i], "noshadow") == 0) noShadow = true;

    initVehicleMaterials();
    const CarDef* def = findCar(carId);
    if (!def) { printf("unknown car %s\n", carId); return 1; }
    printf("building %s (%s %s)...\n", def->id.c_str(), def->brand.c_str(), def->name.c_str());
    CarVisual vis = buildCarVisual(*def, 1.0f, !hullOnly);
    printf("  body: %u verts, %u tris, %u submeshes\n", vis.body.vertexCount(), vis.body.triCount(), (unsigned)vis.body.subs.size());
    printf("  wheel: %u tris\n", vis.wheel.triCount());

    auto r = createSoftwareRenderer();
    QualitySettings q;
    q.shadows = !noShadow;
    q.bloom = true;
    q.reflections = true;
    q.shadowRes = 2048;
    r->init(W, H, false);
    r->setQuality(q);

    Mesh floor = buildStudioFloor();

    Environment env;
    env.sunDir = Vec3(-0.45f, 0.62f, 0.55f).normalized();
    env.sunColor = Vec3(1.0f, 0.96f, 0.90f);
    env.sunIntensity = 3.4f;
    env.skyZenith = Vec3(0.16f, 0.32f, 0.62f);
    env.skyHorizon = Vec3(0.68f, 0.76f, 0.86f);
    env.ambientSky = Vec3(0.36f, 0.46f, 0.60f);
    env.ambientGround = Vec3(0.18f, 0.17f, 0.15f);
    env.fogColor = Vec3(0.70f, 0.76f, 0.84f);
    env.fogDensity = 0.0018f;
    env.exposure = 1.05f;
    env.cloudCover = 0.30f;
    r->setEnvironment(env);

    Camera cam;
    cam.aspect = (float)W / (float)H;
    if (interior) {
        cam.pos = Vec3(-0.18f, 1.14f, -0.38f);
        cam.target = Vec3(6.0f, 1.02f, -0.30f);
        cam.fovY = 78.0f * DEG;
    } else {
        float d = 7.4f;
        cam.pos = Vec3(std::cos(yaw) * d, 2.05f, std::sin(yaw) * d);
        cam.target = Vec3(0.0f, 0.72f, 0.0f);
        cam.fovY = 42.0f * DEG;
    }

    r->beginFrame(cam);
    r->mesh(floor, Mat4::identity(), g_groundMat);
    int forceMat = -1;
    if (hullOnly) {
        Material m; m.name = "hull_preview"; m.shade = Shade::CarPaint;
        m.albedo = Color::fromHex(0xC8202A); m.metallic = 0.85f; m.roughness = 0.18f; m.clearcoat = 1.0f;
        forceMat = assets().addMaterial(m);
    }
    r->mesh(vis.body, Mat4::identity(), forceMat);
    for (size_t i = 0; i < vis.wheelPositions.size(); i++) {
        Vec3 p = vis.wheelPositions[i];
        float zsign = vis.wheelLeft[i] ? 1.0f : -1.0f;   // mirror for the other side
        Mat4 xf = Mat4::translation(p) * Mat4::rotationY(vis.wheelLeft[i] ? PI : 0.0f);
        (void)zsign;
        r->mesh(vis.wheel, xf);
    }
    // steering wheel and gauges
    r->mesh(vis.steeringWheel, Mat4::translation(vis.steeringWheelPos) * Mat4::rotationZ(PI * 0.5f) * Mat4::rotationX(0.32f));
    r->endFrame();

    if (!writePNG32(outPath, r->framebuffer(), W, H)) { printf("write failed\n"); return 1; }
    printf("wrote %s (%dx%d), %d draws, %d tris\n", outPath, W, H, r->drawCalls(), r->triangles());
    return 0;
}
