// platform_headless.cpp - Linux test/capture harness (no window, PNG output)
// Used for automated verification and screenshot capture during development.
#include "frac.h"
#include <chrono>
#include <thread>
#include <sys/stat.h>
#include <sys/types.h>
#include <string>
#include <vector>

static double g_startTime = 0;
static bool g_quit = false;

bool writePNG(const char* path, int w, int h, const uint32_t* pix);

double platformTime() {
    using namespace std::chrono;
    static auto t0 = steady_clock::now();
    if (g_startTime == 0) g_startTime = 1;
    return duration<double>(steady_clock::now() - t0).count();
}
void platformSleep(int ms) { std::this_thread::sleep_for(std::chrono::milliseconds(ms)); }
void platformRequestQuit() { g_quit = true; }
void platformMkdir(const char* path) { mkdir(path, 0755); }
void platformMixAudio(float* buf, int frames) { (void)buf; (void)frames; }

#include <string>
#include <vector>

struct Cmd {
    std::string op;
    float a = 0, b = 0, c = 0;
    std::string arg;
};

static std::vector<std::string> split(const std::string& s, char sep) {
    std::vector<std::string> out;
    size_t start = 0;
    while (start <= s.size()) {
        size_t p = s.find(sep, start);
        if (p == std::string::npos) p = s.size();
        out.push_back(s.substr(start, p - start));
        start = p + 1;
    }
    return out;
}

#ifndef FRACTURE_NO_MAIN
int main(int argc, char** argv) {
    g_headless = true;
    int frames = 120;
    int map = -1;
    int mission = -1;
    int resW = 1280, resH = 720;
    std::string script;
    std::string finalShot;
    bool sandbox = true;
    g_logFile = fopen("build/headless.log", "w");
    for (int i = 1; i < argc; i++) {
        std::string a = argv[i];
        auto next = [&](int def = 0) -> std::string {
            if (i + 1 < argc) return argv[++i];
            return std::to_string(def);
        };
        if (a == "--frames") frames = atoi(next(120).c_str());
        else if (a == "--map") map = atoi(next(0).c_str());
        else if (a == "--mission") { mission = atoi(next(0).c_str()); sandbox = false; }
        else if (a == "--script") script = next();
        else if (a == "--shot") finalShot = next();
        else if (a == "--res") {
            std::string r = next();
            auto p = r.find('x');
            if (p != std::string::npos) {
                resW = atoi(r.substr(0, p).c_str());
                resH = atoi(r.substr(p + 1).c_str());
            }
        } else if (a == "--sandbox") sandbox = true;
    }
    gameInit();
    if (map == -2) {
        // debug scene: single concrete cube on a floor, no map noise
        g_game.world.free();
        g_game.world.allocate(96, 60, 96);
        g_game.world.fillFast(0, 0, 0, 95, 1, 95, MAT_CONCRETE);
        g_game.world.fillFast(36, 2, 40, 56, 14, 60, MAT_BRICK);
        g_game.world.fillFast(20, 2, 40, 30, 12, 50, MAT_WOOD);
        g_game.world.fillFast(60, 2, 40, 70, 16, 70, MAT_CONCRETE);
        g_game.world.computeSunMap();
        g_game.world.syncChunks();
        g_game.world.bakeLight();
        g_game.world.rebuildAll();
        g_game.player.pos = Vec3(9.0f, 2.4f, 4.0f);
        g_game.player.yaw = 0.0f;
        g_game.player.pitch = 0.05f;
        g_game.state = GS_PLAYING;
        g_game.missionActive = false;
        g_game.unlockedTools = 0xFFFF;
        setTimeOfDay(1);
    }
    g_renderer.set.width = resW;
    g_renderer.set.height = resH;
    g_renderer.init(resW, resH);
    g_renderer.set.viewDist = 150;
    static std::vector<uint8_t> matbuf;
    if (getenv("FRAC_MATDBG")) {
        if (matbuf.size() < size_t(resW) * resH) matbuf.assign(size_t(resW) * resH, 0);
        g_dbgMatBuf = matbuf.data();
    }
    if (map >= 0) {
        g_game.sandbox = sandbox;
        gameLoadMap(map, sandbox, mission);
        if (sandbox) g_game.unlockedTools = 0xFFFF;
    } else if (map != -2) {
        g_game.state = GS_MAIN_MENU;
        if (getenv("FRAC_MENUBG")) gameLoadMenuBackdrop();
    }
    if (getenv("FRAC_INSPECT")) {
        // ASCII slice: X/Y at fixed Z, and X/Z at fixed Y
        World& w = g_game.world;
        int zs = atoi(getenv("FRAC_INSPECT"));
        logf("--- X/Y slice at z=%d (each char = 8x2 voxels) ---", zs);
        for (int y = w.dims[1] - 1; y >= 0; y -= 2) {
            char line[256];
            int n = 0;
            for (int x = 0; x < w.dims[0] && n < 200; x += 8) {
                int c = 0;
                for (int dx = 0; dx < 8; dx++)
                    for (int dy = 0; dy < 2; dy++)
                        if (w.get(x + dx, y + dy, zs)) c++;
                line[n++] = c == 0 ? ' ' : (c < 8 ? '.' : (c < 14 ? '+' : '#'));
            }
            line[n] = 0;
            logf("%3d |%s", y, line);
        }
    }
    // parse script
    std::vector<Cmd> cmds;
    for (auto& tok : split(script, ',')) {
        if (tok.empty()) continue;
        auto parts = split(tok, ':');
        Cmd c;
        c.op = parts[0];
        if (parts.size() > 1) c.a = float(atof(parts[1].c_str()));
        if (parts.size() > 2) c.b = float(atof(parts[2].c_str()));
        if (parts.size() > 3) c.c = float(atof(parts[3].c_str()));
        if (parts.size() > 1) c.arg = parts[1];
        cmds.push_back(c);
    }
    size_t ci = 0;
    int waitCounter = 0;
    double dt = 1.0 / 60.0;
    for (int f = 0; f < frames && !g_quit; f++) {
        g_input.clearFrame();
        // script execution
        while (ci < cmds.size()) {
            Cmd& c = cmds[ci];
            if (c.op == "wait") {
                if (waitCounter == 0) waitCounter = int(c.a) + 1;
                waitCounter--;
                if (waitCounter > 0) break;
                ci++;
                continue;
            } else if (c.op == "shot") {
                char buf[512];
                snprintf(buf, sizeof(buf), "build/%s", c.arg.c_str());
                gameRender();
                writePNG(buf, g_renderer.set.width, g_renderer.set.height,
                         g_renderer.framebuffer());
                logf("[shot] %s", buf);
                if (g_dbgMatBuf) {
                    // material map: distinct colours per material id
                    std::vector<uint32_t> mb(size_t(g_renderer.set.width) * g_renderer.set.height);
                    for (size_t i = 0; i < mb.size(); i++) {
                        uint8_t m = g_dbgMatBuf[i];
                        mb[i] = 0xFF000000u | ((m * 53u) % 256) << 16 | ((m * 97u) % 256) << 8 |
                                ((m * 29u) % 256);
                    }
                    char mb2[512];
                    snprintf(mb2, sizeof(mb2), "build/mat_%s", c.arg.c_str());
                    writePNG(mb2, g_renderer.set.width, g_renderer.set.height, mb.data());
                    logf("[matdbg] %s", mb2);
                    {
                        int px = int(getenv("FRAC_PROBEPIX") ? atoi(getenv("FRAC_PROBEPIX")) : 0);
                        int py = int(getenv("FRAC_PROBEY") ? atoi(getenv("FRAC_PROBEY")) : 80);
                        float ndcX = (px / float(g_renderer.set.width)) * 2.0f - 1.0f;
                        float ndcY = 1.0f - (py / float(g_renderer.set.height)) * 2.0f;
                        Basis cb = Basis::yawPitch(g_game.player.yaw, g_game.player.pitch);
                        Vec3 fwd2 = normalize(cb.mul(Vec3(0, 0, 1)));
                        Vec3 rgt = normalize(cross(fwd2, Vec3(0, 1, 0)));
                        Vec3 upv = cross(rgt, fwd2);
                        float aspect = float(g_renderer.set.width) / float(g_renderer.set.height);
                        float th = tanf(g_renderer.set.fov * DEG * 0.5f);
                        Vec3 d2 = normalize(fwd2 + rgt * (ndcX * th * aspect) + upv * (ndcY * th));
                        Vec3 eye2 = g_game.player.pos + Vec3(0, g_game.player.eyeHeight, 0);
                        RayHit hh = g_game.world.raycast(eye2, d2, 120.0f);
                        logf("[pixprobe] screen(%d,%d) dir=%.3f %.3f %.3f hit=%d mat=%d t=%.2f pt=%.2f %.2f %.2f drawnmat=%d",
                             px, py, d2.x, d2.y, d2.z, int(hh.hit), int(hh.mat), hh.t, hh.point.x,
                             hh.point.y, hh.point.z,
                             g_dbgMatBuf ? int(g_dbgMatBuf[py * g_renderer.set.width + px]) : -1);
                        {
                            const uint32_t* fb = g_renderer.framebuffer();
                            uint32_t c32 = fb[py * g_renderer.set.width + px];
                            logf("[pixcol] rgb=%d,%d,%d depth=%.3f",
                                 int((c32 >> 16) & 255), int((c32 >> 8) & 255), int(c32 & 255),
                                 g_renderer.rt.depth[py * g_renderer.set.width + px]);
                        }
                    }
                    {
                        Vec3 eye = g_game.player.pos + Vec3(0, g_game.player.eyeHeight, 0);
                        Vec3 dir = normalize(Basis::yawPitch(g_game.player.yaw,
                                                             g_game.player.pitch).mul(Vec3(0, 0, 1)));
                        RayHit h = g_game.world.raycast(eye, dir, 60.0f);
                        logf("[probe] eye=%.2f %.2f %.2f dir=%.2f %.2f %.2f hit=%d mat=%d t=%.2f pt=%.2f %.2f %.2f",
                             eye.x, eye.y, eye.z, dir.x, dir.y, dir.z, int(h.hit), int(h.mat), h.t,
                             h.point.x, h.point.y, h.point.z);
                        Vec3 up(0, 1, 0);
                        RayHit h2 = g_game.world.raycast(eye, up, 20.0f);
                        logf("[probe-up] hit=%d mat=%d t=%.2f", int(h2.hit), int(h2.mat), h2.t);
                    }
                    int cx = g_renderer.set.width / 2, cy = g_renderer.set.height / 3;
                    logf("[matdbg] centre-top pixel mat=%d", g_dbgMatBuf[cy * g_renderer.set.width + cx]);
                }
                ci++;
                continue;
            } else if (c.op == "key") {
                int k = (int)c.a;
                if (c.b == 0 && c.c == 0) {
                    g_input.keys[k] = true;
                    g_input.keyPressed[k] = true;
                }
                ci++;
                continue;
            } else if (c.op == "hold") {
                g_input.keys[(int)c.a] = true;
                ci++;
                continue;
            } else if (c.op == "release") {
                g_input.keys[(int)c.a] = false;
                ci++;
                continue;
            } else if (c.op == "click") {
                g_input.mouse[(int)c.a] = true;
                g_input.mousePressed[(int)c.a] = true;
                ci++;
                continue;
            } else if (c.op == "unclick") {
                g_input.mouse[(int)c.a] = false;
                g_input.mouseReleased[(int)c.a] = true;
                ci++;
                continue;
            } else if (c.op == "look") {
                handleMouseMove(c.a, c.b);
                ci++;
                continue;
            } else if (c.op == "tool") {
                g_game.player.tool = int(c.a);
                ci++;
                continue;
            } else if (c.op == "meshfaces") {
                int cx = int(c.a / VOXSZ) / CH, cy = int(c.b / VOXSZ) / CH,
                    cz = int(c.c / VOXSZ) / CH;
                Chunk* ch = g_game.world.chunkAt(cx, cy, cz);
                if (ch) {
                    logf("  chunk id=%d,%d,%d", ch->cx, ch->cy, ch->cz);
                    for (size_t i = 0; i + 3 < ch->mesh.idx.size(); i += 6) {
                        const RVert& v = ch->mesh.verts[ch->mesh.idx[i]];
                        logf("  face mat=%d n=(%d,%d,%d) p0=(%.2f %.2f %.2f) v0..=%.2f %.2f",
                             int(v.mat), int(v.nx), int(v.ny), int(v.nz), v.x, v.y, v.z,
                             ch->mesh.verts[ch->mesh.idx[i + 2]].x,
                             ch->mesh.verts[ch->mesh.idx[i + 2]].z);
                    }
                }
                ci++;
                continue;
            } else if (c.op == "chunkinfo") {
                int cx = int(c.a / VOXSZ) / CH, cy = int(c.b / VOXSZ) / CH,
                    cz = int(c.c / VOXSZ) / CH;
                Chunk* ch = g_game.world.chunkAt(cx, cy, cz);
                logf("[chunkinfo] dims=%d,%d,%d CH=%d", g_game.world.dims[0], g_game.world.dims[1],
                     g_game.world.dims[2], CH);
                if (!ch)
                    logf("[chunkinfo] %d,%d,%d: no chunk", cx, cy, cz);
                else
                    logf("[chunkinfo] %d,%d,%d built=%d dirty=%d nv=%d ni=%d t_nv=%d bb=(%.2f %.2f %.2f)-(%.2f %.2f %.2f)",
                         cx, cy, cz, int(ch->mesh.built), int(ch->mesh.dirty),
                         int(ch->mesh.verts.size()), int(ch->mesh.idx.size()),
                         int(ch->tmesh.verts.size()), ch->mesh.bb.mn.x, ch->mesh.bb.mn.y,
                         ch->mesh.bb.mn.z, ch->mesh.bb.mx.x, ch->mesh.bb.mx.y, ch->mesh.bb.mx.z);
                ci++;
                continue;
            } else if (c.op == "column") {
                int vx = int(c.a / VOXSZ), vz = int(c.b / VOXSZ);
                char line[512];
                int n = 0;
                n += snprintf(line + n, sizeof(line) - n, "column x=%.1fm z=%.1fm:", c.a, c.b);
                int last = -1;
                for (int y = 0; y < g_game.world.dims[1]; y++) {
                    int m = g_game.world.get(vx, y, vz);
                    if (m != last && n < 460) {
                        n += snprintf(line + n, sizeof(line) - n, " y%d=%s", y,
                                      m ? kMats[m].name : "air");
                        last = m;
                    }
                }
                logf("%s", line);
                ci++;
                continue;
            } else if (c.op == "yaw") {
                g_game.player.yaw = c.a;
                g_game.player.pitch = c.b;
                ci++;
                continue;
            } else if (c.op == "tp") {
                g_game.player.pos = Vec3(c.a, c.b, c.c);
                ci++;
                continue;
            } else if (c.op == "obj") {
                if (g_game.curMission >= 0 && g_game.curMission < int(g_game.missions.size())) {
                    Mission& m = g_game.missions[g_game.curMission];
                    logf("[obj] %s  active=%d  destroyed=%d", m.name.c_str(),
                         int(g_game.missionActive), g_game.totalDestroyed);
                    for (auto& o : m.objectives)
                        logf("   %s | type=%d target=%d progress=%d done=%d r=%.1f pos=%.1f,%.1f,%.1f",
                             o.text.c_str(), o.type, o.targetCount, o.progress, int(o.done),
                             o.radius, o.pos.x, o.pos.y, o.pos.z);
                } else {
                    logf("[obj] sandbox: destroyed=%d debris=%d bodies=%d parts=%d chunks=%d",
                         g_game.totalDestroyed, g_phys.activeDebris, int(g_phys.bodies.size()),
                         g_fx.activeParts, g_game.world.chunks.size());
                }
                ci++;
                continue;
            } else if (c.op == "state") {
                g_game.state = GameState(int(c.a));
                ci++;
                continue;
            } else if (c.op == "map") {
                gameLoadMap(int(c.a), true, -1);
                ci++;
                continue;
            } else if (c.op == "debug") {
                g_game.showDebug = true;
                ci++;
                continue;
            } else if (c.op == "log") {
                logf("[script] %s", c.arg.c_str());
                ci++;
                continue;
            } else {
                ci++;
                continue;
            }
        }
        if (g_game.state == GS_PLAYING) {
            if (g_input.mousePressed[0]) doToolUse(0);
            if (g_input.mousePressed[1]) doToolUse(1);
            if (g_input.keyPressed['E']) interactPressed();
        }
        gameUpdate(float(dt));
        if (g_game.state != GS_LOADING) gameRender();
        if ((f % 30) == 0)
            logf("[frame %d] state=%d fps=%.1f tris=%d chunks=%d debris=%d bodies=%d parts=%d cam=%.1f,%.1f,%.1f",
                 f, int(g_game.state), g_game.fps, g_renderer.statsTris,
                 g_renderer.statsChunks, g_phys.activeDebris, int(g_phys.bodies.size()),
                 g_fx.activeParts, g_renderer.camPos.x, g_renderer.camPos.y, g_renderer.camPos.z);
    }
    gameRender();
    if (!finalShot.empty()) {
        char buf[512];
        snprintf(buf, sizeof(buf), "build/%s", finalShot.c_str());
        writePNG(buf, g_renderer.set.width, g_renderer.set.height, g_renderer.framebuffer());
        logf("[shot] %s", buf);
    }
    logf("[done] frames=%d fps=%.1f", frames, g_game.fps);
    gameShutdown();
    if (g_logFile) fclose(g_logFile);
    return 0;
}

#endif
