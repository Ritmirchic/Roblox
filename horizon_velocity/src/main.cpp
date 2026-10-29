// HORIZON VELOCITY - entry point. Interactive on Windows; headless capture on
// any platform (--shots / --replay) for reproducible verification.
#include "game/game.h"
#include "render/gfx.h"
#include "platform/platform.h"
#include <chrono>
#include <cstdio>
#include <cstring>
#include <string>
#include <vector>
#include <cstdlib>

using namespace hv;

static double nowSeconds() {
    using clock = std::chrono::high_resolution_clock;
    return std::chrono::duration<double>(clock::now().time_since_epoch()).count();
}

int main(int argc, char** argv) {
    int W = 1280, H = 720;
    uint64_t seed = 20261029;
    std::string shotDir, replayOut, carId;
    bool interactive = true;
    int shotFrames = 0;
    for (int i = 1; i < argc; i++) {
        std::string a = argv[i];
        auto next = [&]() -> std::string { return (i + 1 < argc) ? argv[++i] : std::string(); };
        if (a == "--shots") { shotDir = next(); interactive = false; }
        else if (a == "--replay") { replayOut = next(); interactive = false; }
        else if (a == "--car") { carId = next(); }
        else if (a == "--seed") { seed = (uint64_t)std::atoll(next().c_str()); }
        else if (a == "--width") { W = std::atoi(next().c_str()); }
        else if (a == "--height") { H = std::atoi(next().c_str()); }
        else if (a == "--frame") { shotFrames = std::atoi(next().c_str()); }
        else if (a == "--help" || a == "-h") {
            std::printf("HORIZON VELOCITY\n"
                        "  --shots <dir>     render a set of verification screenshots and exit\n"
                        "  --replay <csv>    run a scripted drive, write telemetry CSV, exit\n"
                        "  --car <id>        start car id (see --list)\n"
                        "  --list            list the vehicle catalogue\n"
                        "  --seed <n>        world seed\n"
                        "  --width/--height  window or offscreen size\n");
            return 0;
        } else if (a == "--list") {
            for (const CarDef& d : carCatalogue())
                std::printf("%-14s %-10s %s %s  %d CR\n", d.id.c_str(), d.brand.c_str(), d.name.c_str(),
                            carClassName(d.carClass), d.price);
            return 0;
        }
    }

    double t0 = nowSeconds();
    auto renderer = createSoftwareRenderer();
    if (!renderer || !renderer->init(W, H, false)) {
        std::printf("renderer init failed\n");
        return 1;
    }
    QualitySettings q;
    q.shadows = true;
    q.bloom = true;
    q.reflections = true;
    q.shadowRes = 1024;
    q.viewDistance = 900.0f;
    renderer->setQuality(q);

    Game game;
    if (!game.init(renderer.get(), W, H, seed)) {
        std::printf("game init failed\n");
        return 1;
    }
    double tInit = nowSeconds() - t0;
    std::printf("init: %.2f s   cars=%d  roads=%zu  props=%d  tris(terrain+roads)=%d\n",
                tInit, (int)carCatalogue().size(), game.world.roads.size(), (int)game.world.props.size(),
                (int)game.world.stats.propCount);
    std::printf("world: %.1f km2  height %.0f..%.0f m  roads %.1f km  trees %d  buildings %d\n",
                36.0, game.world.stats.minH, game.world.stats.maxH, game.world.stats.roadLengthKm,
                game.world.stats.treeCount, game.world.stats.buildingCount);
    if (!carId.empty()) {
        for (int i = 0; i < (int)carCatalogue().size(); i++)
            if (carCatalogue()[i].id == carId) game.currentCar = i;
    }

    if (std::getenv("HV_DEBUG")) {
        int nan = 0;
        for (float h : game.world.height) if (!(h == h)) nan++;
        std::printf("[dbg] height samples=%zu NaN=%d  first=%.2f\n", game.world.height.size(), nan, game.world.height[0]);
        int emptyChunks = 0, totalChunks = 0;
        for (int i = 0; i < 100; i++) for (int l = 0; l < 3; l++) { totalChunks++; }
        std::printf("[dbg] player pos(%.2f %.2f %.2f) up(%.2f %.2f %.2f) wheelsGrounded=%d\n",
                    game.player.position.x, game.player.position.y, game.player.position.z,
                    game.player.up.x, game.player.up.y, game.player.up.z,
                    (int)(game.player.wheels[0].grounded + game.player.wheels[1].grounded +
                          game.player.wheels[2].grounded + game.player.wheels[3].grounded));
        std::printf("[dbg] player body tris=%u bounds y %.2f..%.2f empty=%d\n",
                    game.playerVisual.body.triCount(), game.playerVisual.body.bounds.lo.y,
                    game.playerVisual.body.bounds.hi.y, (int)game.playerVisual.body.idx.empty());
        std::printf("[dbg] rpm=%.0f gear=%d speed=%.2f thr=%.2f\n", game.player.engineRpm,
                    game.player.gear, game.player.speed(), game.player.input.throttle);
        World::DrawStats ds;
        game.world.draw(*renderer, game.camera, 900.0f, &ds);
        std::printf("[dbg] draw: terrainChunks=%d roadTris=%d waterTris=%d\n", ds.terrainChunks, ds.roadTris, ds.waterTris);
        (void)emptyChunks; (void)totalChunks;
    }
    // ------------------------------------------------------------ headless modes
    if (!shotDir.empty()) {
        game.setAutopilot(true);
        InputState in;
        int frames = shotFrames > 0 ? shotFrames : 8;
        double total = 0.0;
        int shots = 0;
        const float dt = 1.0f / 60.0f;
        // warm up: drive along the coastal highway so the shots are on the road
        for (int i = 0; i < 240; i++) game.update(dt, in);
        struct Shot { CameraMode mode; float tod; const char* name; };
        Shot list[] = {
            {CameraMode::Chase, 9.5f, "01_chase_dawn"},
            {CameraMode::ChaseFar, 13.0f, "02_chase_far_noon"},
            {CameraMode::Hood, 17.5f, "03_hood_sunset"},
            {CameraMode::Cockpit, 12.0f, "04_cockpit"},
            {CameraMode::Bumper, 15.0f, "05_bumper"},
            {CameraMode::Cinematic, 19.5f, "06_cinematic_dusk"},
            {CameraMode::Orbit, 21.6f, "07_orbit_night"},
            {CameraMode::Cinematic, 6.5f, "08_cinematic_sunrise"},
        };
        for (const Shot& s : list) {
            game.cameraMode = s.mode;
            game.timeOfDay = s.tod;
            for (int i = 0; i < frames; i++) game.update(dt, in);
            double a = nowSeconds();
            game.render(*renderer);
            double frameMs = (nowSeconds() - a) * 1000.0;
            total += frameMs;
            char path[512];
            std::snprintf(path, sizeof path, "%s/%s.png", shotDir.c_str(), s.name);
            writePNG32(path, renderer->framebuffer(), renderer->width(), renderer->height());
            std::printf("  %-22s car(%.1f %.1f %.1f) cam(%.1f %.1f %.1f) ground %.1f\n", s.name,
                        game.player.position.x, game.player.position.y, game.player.position.z,
                        game.camera.pos.x, game.camera.pos.y, game.camera.pos.z,
                        game.world.heightAt(game.player.position.x, game.player.position.z));
            std::printf("  %-22s %6.1f ms  %6d draws %8d tris -> %s\n", s.name, frameMs,
                        renderer->drawCalls(), renderer->triangles(), path);
            shots++;
            // drive on between shots
            for (int i = 0; i < 60; i++) game.update(dt, in);
        }
        // diagnostic: high oblique view of the city to verify terrain + roads exist
        {
            game.camera.pos = Vec3(320.0f, 260.0f, 520.0f);
            game.camera.target = Vec3(0.0f, 13.0f, 0.0f);
            game.camera.aspect = (float)W / (float)H;
            game.render(*renderer);
            writePNG32((shotDir + "/09_city_oblique.png").c_str(), renderer->framebuffer(),
                       renderer->width(), renderer->height());
            std::printf("  09_city_oblique        %6d draws %8d tris\n", renderer->drawCalls(), renderer->triangles());
        }
        std::printf("shots: %d  mean render %.1f ms (%.1f fps) at %dx%d\n", shots, total / shots,
                    1000.0 / (total / shots), W, H);
        return 0;
    }

    if (!replayOut.empty()) {
        game.setAutopilot(true);
        InputState in;
        FILE* f = std::fopen(replayOut.c_str(), "wb");
        std::fprintf(f, "t,speed_kph,rpm,gear,throttle,brake,steer,x,y,z,heading,slip\n");
        const float dt = 1.0f / 60.0f;
        double t = 0.0;
        for (int i = 0; i < 60 * 45; i++) {
            game.update(dt, in);
            t += dt;
            if (i % 6 == 0)
                std::fprintf(f, "%.3f,%.2f,%.0f,%d,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.3f,%.3f\n",
                             t, game.player.speedKph(), game.player.engineRpm, game.player.gear,
                             game.player.input.throttle, game.player.input.brake, game.player.input.steer,
                             game.player.position.x, game.player.position.y, game.player.position.z,
                             game.playerYaw, game.player.avgDrivenSlip());
        }
        std::fclose(f);
        std::printf("replay: 45 s written to %s  (top %.1f km/h, %.2f km)\n", replayOut.c_str(),
                    game.stats.topSpeedKph, game.stats.distanceKm);
        return 0;
    }

    // ------------------------------------------------------------ interactive
    auto platform = createPlatform();
    if (!platform) {
        std::printf("no platform backend: use --shots or --replay\n");
        return 1;
    }
    if (!platform->init(W, H, "HORIZON VELOCITY")) {
        std::printf("platform init failed\n");
        return 1;
    }
    game.saveFile("horizon_velocity_save.json");
    double prev = nowSeconds();
    float fpsAvg = 60.0f;
    while (!platform->shouldQuit()) {
        InputState in;
        platform->poll(in);
        double cur = nowSeconds();
        float dt = (float)std::min(0.05, std::max(0.0005, cur - prev));
        prev = cur;
        fpsAvg = lerpf(fpsAvg, 1.0f / dt, 0.06f);
        game.fps = fpsAvg;
        static float evtTimer = 0.0f;
        evtTimer += dt;
        if (in.interact) { game.startEvent(0); }
        game.update(dt, in);
        game.render(*renderer);
        platform->present(renderer->framebuffer(), renderer->width(), renderer->height());
    }
    game.saveFile("horizon_velocity_save.json");
    platform->shutdown();
    return 0;
}
