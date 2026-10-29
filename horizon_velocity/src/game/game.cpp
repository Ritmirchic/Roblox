// HORIZON VELOCITY - game loop, cameras, events, traffic, HUD.
#include "game/game.h"
#include "render/materials.h"
#include <algorithm>
#include <cmath>
#include <cstdio>
#include <cstring>

namespace hv {

const char* cameraModeName(CameraMode m) {
    switch (m) {
        case CameraMode::Chase: return "CHASE";
        case CameraMode::ChaseFar: return "CHASE FAR";
        case CameraMode::Hood: return "HOOD";
        case CameraMode::Bumper: return "BUMPER";
        case CameraMode::Cockpit: return "COCKPIT";
        case CameraMode::Cinematic: return "CINEMATIC";
        case CameraMode::Orbit: return "ORBIT";
        case CameraMode::Photo: return "PHOTO";
        default: return "CAM";
    }
}

const char* eventTypeName(EventType t) {
    switch (t) {
        case EventType::Sprint: return "SPRINT";
        case EventType::Circuit: return "CIRCUIT";
        case EventType::TimeAttack: return "TIME ATTACK";
        case EventType::SpeedTrap: return "SPEED TRAP";
        case EventType::Drift: return "DRIFT";
        case EventType::FreeRoam: return "FREE ROAM";
        case EventType::LongDistance: return "LONG DISTANCE";
        case EventType::HillClimb: return "HILL CLIMB";
        case EventType::Drag: return "DRAG";
        case EventType::Delivery: return "DELIVERY";
        case EventType::Elimination: return "ELIMINATION";
        case EventType::OffroadTrail: return "OFFROAD TRAIL";
        case EventType::Showcase: return "SHOWCASE";
        default: return "EVENT";
    }
}

// ---------------------------------------------------------------------------
void Game::message(const std::string& s, float seconds) {
    lastMessage = s;
    messageTimer = seconds;
}

static Mat4 carTransform(const Vec3& pos, const Vec3& fwd, const Vec3& up) {
    Vec3 f = fwd.normalized();
    Vec3 r = up.cross(f).normalized();
    Vec3 u = f.cross(r).normalized();
    Mat4 m = Mat4::identity();
    m.at(0, 0) = f.x; m.at(1, 0) = f.y; m.at(2, 0) = f.z;
    m.at(0, 1) = u.x; m.at(1, 1) = u.y; m.at(2, 1) = u.z;
    m.at(0, 2) = r.x; m.at(1, 2) = r.y; m.at(2, 2) = r.z;
    m.at(0, 3) = pos.x; m.at(1, 3) = pos.y; m.at(2, 3) = pos.z;
    return m;
}

static float wrapAngle(float a) {
    while (a > PI) a -= TAU;
    while (a < -PI) a += TAU;
    return a;
}

// ---------------------------------------------------------------------------
bool Game::init(Renderer* r, int w, int h, uint64_t seed) {
    r_ = r;
    w_ = w; h_ = h;
    initVehicleMaterials();
    initWorldMaterials();
    world.generate(seed);
    world.buildStaticMeshes();
    wq_.w = &world;

    // ---- build every catalogue model once (16 models, ~8k tris each)
    const std::vector<CarDef>& cat = carCatalogue();
    int n = (int)cat.size();
    for (int i = 0; i < n; i++) {
        models_.push_back(buildCarVisual(cat[i], 1.0f, true));
        modelCarIdx_.push_back(i);
    }
    currentCar = 0;
    for (int i = 0; i < n; i++) ownedCars.push_back(i);
    playerDef = &cat[std::min(currentCar, (int)cat.size() - 1)];
    if (!models_.empty()) playerVisual = models_[0];
    player.setup(playerDef->spec, makeWheelSpecs(playerDef->style));
    player.autoTransmission = true;

    // ---- traffic: kinematic road followers spread over the network
    Rng rng(seed ^ 0x51ED2701u);
    traffic.resize(28);
    for (size_t i = 0; i < traffic.size(); i++) {
        TrafficCar& t = traffic[i];
        t.roadIdx = rng.rangeInt(0, (int)world.roads.size());
        const Road& rd = world.roads[t.roadIdx];
        t.t = rng.range(0.0f, 1.0f) * roadLength(t.roadIdx);
        t.dir = rng.chance(0.5f) ? 1 : -1;
        t.lane = rd.halfWidth * 0.45f;
        t.model = rng.rangeInt(0, (int)models_.size());
        t.targetSpeed = rng.range(11.0f, 22.0f);
        Vec3 p = sampleRoad(t.roadIdx, t.t);
        Vec3 d = sampleRoadDir(t.roadIdx, t.t);
        t.pos = p;
        t.yaw = std::atan2(d.z, d.x);
    }

    buildEvents();
    placeOnRoad(Vec3(0, 0, 0));
    cameraMode = CameraMode::Chase;
    camDist_ = 7.0f;
    ui_.begin(r, w, h);
    return true;
}

void Game::shutdown() {}

float Game::roadLength(int roadIdx) const {
    const Road& r = world.roads[roadIdx];
    float len = 0.0f;
    for (size_t i = 1; i < r.pts.size(); i++)
        len += Vec3(r.pts[i].x - r.pts[i - 1].x, 0, r.pts[i].z - r.pts[i - 1].z).length();
    return std::max(len, 1.0f);
}

Vec3 Game::sampleRoad(int roadIdx, float t) const {
    const Road& r = world.roads[roadIdx];
    if (r.pts.empty()) return Vec3();
    int n = (int)r.pts.size();
    float f = clampf(t / roadLength(roadIdx), 0.0f, 0.9999f) * (float)(n - 1);
    int i = (int)f;
    float fr = f - (float)i;
    return vlerp(r.pts[i], r.pts[std::min(i + 1, n - 1)], fr);
}

Vec3 Game::sampleRoadDir(int roadIdx, float t) const {
    Vec3 a = sampleRoad(roadIdx, t - 4.0f);
    Vec3 b = sampleRoad(roadIdx, t + 4.0f);
    Vec3 d(b.x - a.x, 0, b.z - a.z);
    if (d.lengthSq() < 1e-6f) return Vec3(1, 0, 0);
    return d.normalized();
}

void Game::placeOnRoad(const Vec3& hint) {
    Vec3 p, dir;
    bool found = world.nearestRoad(hint, p, dir, 4000.0f);
    Vec3 start = found ? p : Vec3(0, 0, 0);
    float yaw = found ? std::atan2(dir.z, dir.x) : 0.0f;
    player.resetOnGround(start, yaw, wq_);
    playerPos = player.position;
    playerYaw = yaw;
}

void Game::resetCar() {
    Vec3 p, dir;
    if (world.nearestRoad(player.position, p, dir, 120.0f)) {
        player.resetOnGround(p, std::atan2(dir.z, dir.x), wq_);
    } else {
        player.resetOnGround(player.position, playerYaw, wq_);
    }
    stats.resets++;
    message("VEHICLE RESET");
}

// ---------------------------------------------------------------------------
void Game::buildEvents() {
    static const char* chapterNames[5] = {"WELCOME TO AURORA", "COAST & CITY", "MOUNTAIN RUNS",
                                          "REDSTONE & FARMLAND", "THE FESTIVAL"};
    struct T { EventType t; const char* suffix; bool impl; };
    static const T kinds[10] = {
        {EventType::Sprint, "Coastal Sprint", true},
        {EventType::Circuit, "Circuit Trial", true},
        {EventType::TimeAttack, "Time Attack", true},
        {EventType::SpeedTrap, "Speed Trap", true},
        {EventType::Drift, "Drift Session", false},
        {EventType::HillClimb, "Hill Climb", false},
        {EventType::Drag, "Drag Battle", false},
        {EventType::LongDistance, "Long Haul", false},
        {EventType::Delivery, "Delivery Run", false},
        {EventType::Elimination, "Elimination", false},
    };
    eventCount = 0;
    for (int ch = 0; ch < 5; ch++) {
        for (int k = 0; k < 10 && eventCount < 50; k++) {
            EventDef& e = events[eventCount];
            char buf[96];
            std::snprintf(buf, sizeof buf, "%s: %s", chapterNames[ch], kinds[k].suffix);
            e.name = buf;
            e.type = kinds[k].t;
            e.chapter = ch;
            e.implemented = kinds[k].impl;
            // pick a road of roughly the right kind
            int wantCircuit = e.type == EventType::Circuit;
            int roadIdx = 0;
            for (size_t i = 0; i < world.roads.size(); i++) {
                const Road& rd = world.roads[i];
                if (wantCircuit ? rd.racing : !rd.racing) { roadIdx = (int)i; break; }
            }
            e.roadIdx = (roadIdx + ch * 3 + k) % (int)world.roads.size();
            e.distanceKm = world.roads[e.roadIdx].pts.size() * 5.0f * 0.001f;
            e.reward = 1500 + ch * 2500 + k * 400;
            e.xp = 120 + ch * 90 + k * 25;
            eventCount++;
        }
    }
}

bool Game::startEvent(int idx) {
    if (idx < 0 || idx >= eventCount) return false;
    const EventDef& e = events[idx];
    if (!e.implemented) {
        message(std::string(eventTypeName(e.type)) + " IS NOT IMPLEMENTED IN THIS BUILD", 4.0f);
        return false;
    }
    run = EventRun();
    run.eventIdx = idx;
    run.state = EventState::Running;
    run.timer = 0.0f;
    run.laps = e.type == EventType::Circuit ? 2 : 1;
    run.checkpoints = 4;
    run.checkpoint = 0;
    // start the player at the beginning of the route
    Vec3 p = sampleRoad(e.roadIdx, 0.0f);
    Vec3 d = sampleRoadDir(e.roadIdx, 0.0f);
    player.resetOnGround(p, std::atan2(d.z, d.x), wq_);
    racers.clear();
    if (e.type == EventType::Circuit) {
        for (int i = 0; i < 3; i++) {
            AiRacer a;
            a.model = (currentCar + 1 + i) % (int)models_.size();
            const std::vector<CarDef>& cat2 = carCatalogue();
            const CarDef& adef = cat2[modelCarIdx_[a.model] % (int)cat2.size()];
            a.v.setup(adef.spec, makeWheelSpecs(adef.style));
            a.v.autoTransmission = true;
            Vec3 sp = sampleRoad(e.roadIdx, (float)(i + 1) * 14.0f);
            a.v.resetOnGround(sp, std::atan2(d.z, d.x), wq_);
            a.progress = -(float)(i + 1) * 14.0f;
            racers.push_back(a);
        }
    }
    message(std::string(eventTypeName(e.type)) + " STARTED", 2.5f);
    return true;
}

// ---------------------------------------------------------------------------
void Game::updateTraffic(float dt) {
    for (TrafficCar& t : traffic) {
        float len = roadLength(t.roadIdx);
        const Road& rd = world.roads[t.roadIdx];
        // only move traffic that is reasonably near the player
        float d = distance(Vec3(t.pos.x, 0, t.pos.z), Vec3(player.position.x, 0, player.position.z));
        if (d > 900.0f) continue;
        t.speed = damp(t.speed, t.targetSpeed, 1.2f, dt);
        t.t += t.speed * dt * (float)t.dir;
        if (t.t > len) t.t -= len;
        if (t.t < 0.0f) t.t += len;
        Vec3 p = sampleRoad(t.roadIdx, t.t);
        Vec3 dir = sampleRoadDir(t.roadIdx, t.t) * (float)t.dir;
        Vec3 side(-dir.z, 0, dir.x);
        Vec3 target = p + side * t.lane * (float)t.dir;
        target.y = world.heightAt(target.x, target.z);
        t.pos = vlerp(t.pos, target, clampf(dt * 6.0f, 0.0f, 1.0f));
        float wantYaw = std::atan2(dir.z, dir.x);
        t.yaw += wrapAngle(wantYaw - t.yaw) * clampf(dt * 3.0f, 0.0f, 1.0f);
        (void)rd;
    }
}

void Game::updateRacers(float dt) {
    if (racers.empty()) return;
    const EventDef* e = run.eventIdx >= 0 ? &events[run.eventIdx] : nullptr;
    if (!e) return;
    float len = roadLength(e->roadIdx);
    for (AiRacer& a : racers) {
        // pure-pursuit steering along the circuit spline
        float look = clampf(a.progress + 16.0f, 0.0f, len);
        Vec3 target = sampleRoad(e->roadIdx, look);
        Vec3 to(target.x - a.v.position.x, 0, target.z - a.v.position.z);
        Vec3 fwd = a.v.forward;
        float ang = wrapAngle(std::atan2(fwd.z, fwd.x) - std::atan2(to.z, to.x));
        VehicleInput in;
        in.steer = clampf(-ang * 2.2f, -1.0f, 1.0f);
        float corner = std::fabs(ang);
        float targetSpeed = lerpf(52.0f, 26.0f, clampf(corner * 1.6f, 0.0f, 1.0f));
        float sp = a.v.forwardSpeed();
        in.throttle = sp < targetSpeed ? 1.0f : 0.0f;
        in.brake = sp > targetSpeed * 1.12f ? 1.0f : 0.0f;
        a.v.input = in;
        a.v.step(dt, wq_);
        a.progress += a.v.forwardSpeed() * dt;
        if (a.progress > len) { a.progress -= len; a.lapsDone++; }
        a.lapTime += dt;
    }
}

void Game::updateEvent(float dt) {
    if (run.state != EventState::Running) return;
    run.timer += dt;
    if (run.eventIdx < 0) return;
    const EventDef& e = events[run.eventIdx];
    float len = roadLength(e.roadIdx);
    // progress along the route
    Vec3 p = sampleRoad(e.roadIdx, 0.0f);
    (void)p;
    float best = 0.0f;
    for (size_t i = 0; i < world.roads[e.roadIdx].pts.size(); i += 4) {
        const Vec3& q = world.roads[e.roadIdx].pts[i];
        float d = distance(Vec3(q.x, 0, q.z), Vec3(player.position.x, 0, player.position.z));
        if (d < 60.0f) best = std::max(best, (float)i * 5.0f);
    }
    run.progress = clampf(best / len, 0.0f, 1.0f);
    if (run.progress > 0.985f) {
        run.progress = 1.0f;
        if (e.type == EventType::Circuit) {
            run.lap++;
            if (run.lap >= run.laps) {
                run.state = EventState::Finished;
                run.result = true;
                credits += e.reward;
                xp += e.xp;
                stats.eventsWon++;
                char buf[128];
                std::snprintf(buf, sizeof buf, "FINISHED IN %.1f S  +%d CR", run.timer, e.reward);
                message(buf, 5.0f);
            }
        } else {
            run.state = EventState::Finished;
            run.result = true;
            credits += e.reward;
            xp += e.xp;
            stats.eventsWon++;
            char buf[128];
            std::snprintf(buf, sizeof buf, "FINISHED IN %.1f S  +%d CR", run.timer, e.reward);
            message(buf, 5.0f);
        }
        if (run.bestTime <= 0.0f || run.timer < run.bestTime) run.bestTime = run.timer;
    }
    while (xp >= level * 1000) { xp -= level * 1000; level++; message("LEVEL UP", 3.0f); }
}

// ---------------------------------------------------------------------------
void Game::update(float dt, const InputState& in) {
    dt_ = dt;
    playTime += dt;
    timeOfDay += 0.0f;
    if (messageTimer > 0.0f) messageTimer -= dt;

    if (in.cameraCycle) {
        int m = ((int)cameraMode + in.cameraCycle + (int)CameraMode::Count) % (int)CameraMode::Count;
        cameraMode = (CameraMode)m;
        message(cameraModeName(cameraMode), 1.2f);
    }
    if (in.photoMode) {
        cameraMode = cameraMode == CameraMode::Photo ? CameraMode::Chase : CameraMode::Photo;
        photoInit_ = cameraMode == CameraMode::Photo;
        message(cameraModeName(cameraMode), 1.2f);
    }
    if (in.reset) resetCar();

    VehicleInput vi;
    vi.throttle = clampf(in.throttle, 0.0f, 1.0f);
    vi.brake = clampf(in.brake, 0.0f, 1.0f);
    vi.steer = clampf(in.steer, -1.0f, 1.0f);
    vi.handbrake = clampf(in.handbrake, 0.0f, 1.0f);
    vi.shiftUp = in.shiftUp;
    vi.shiftDown = in.shiftDown;
    if (in.toggleAuto) player.autoTransmission = !player.autoTransmission;

    if (autopilot_) {
        // scripted driver: follows the road it is on, used by --replay/--shots
        autoTimer_ += dt;
        Vec3 p, dir;
        float look = 14.0f + std::fabs(player.forwardSpeed()) * 0.7f;
        if (world.nearestRoad(player.position + player.forward * look, p, dir, 90.0f)) {
            Vec3 to(p.x - player.position.x, 0, p.z - player.position.z);
            float ang = wrapAngle(std::atan2(player.forward.z, player.forward.x) - std::atan2(to.z, to.x));
            vi.steer = clampf(-ang * 2.4f, -1.0f, 1.0f);
            float corner = std::fabs(ang);
            float want = lerpf(48.0f, 22.0f, clampf(corner * 1.5f, 0.0f, 1.0f));
            float sp = player.forwardSpeed();
            vi.throttle = sp < want ? 1.0f : 0.0f;
            vi.brake = sp > want * 1.1f ? 1.0f : 0.0f;
        } else {
            vi.throttle = 0.35f;
            vi.steer = 0.0f;
        }
    }

    player.input = vi;
    player.step(dt, wq_);
    playerPos = player.position;
    playerYaw = std::atan2(player.forward.z, player.forward.x);
    stats.topSpeedKph = std::max(stats.topSpeedKph, player.speedKph());
    stats.distanceKm += player.speed() * dt * 0.001f;
    if (world.heightAt(player.position.x, player.position.z) < -1.0f) resetCar();

    updateTraffic(dt);
    updateRacers(dt);
    updateEvent(dt);
    updateCamera(dt, in);

    camera.aspect = (float)w_ / (float)h_;
    frameCount_++;
}

void Game::updateCamera(float dt, const InputState& in) {
    Vec3 fwd = player.forward;
    Vec3 up = player.up;
    Vec3 pos = player.position;
    float speed = player.forwardSpeed();
    float blend = clampf(dt * 8.0f, 0.0f, 1.0f);

    if (cameraMode != prevCam_) { prevCam_ = cameraMode; orbitAngle_ = 0.0f; cinematicTimer_ = 0.0f; }

    Vec3 targetPos, lookAt;
    switch (cameraMode) {
        case CameraMode::Chase:
        case CameraMode::ChaseFar: {
            float dist = cameraMode == CameraMode::Chase ? 7.0f : 11.5f;
            float height = cameraMode == CameraMode::Chase ? 2.35f : 3.6f;
            dist += clampf(std::fabs(speed) * 0.055f, 0.0f, 2.2f);
            targetPos = pos - fwd * dist + Vec3(0, height, 0);
            lookAt = pos + fwd * (5.0f + std::fabs(speed) * 0.25f) + Vec3(0, 1.0f, 0);
            break;
        }
        case CameraMode::Hood:
            targetPos = pos + fwd * 0.55f + up * 1.02f;
            lookAt = targetPos + fwd * 12.0f + up * 0.15f;
            break;
        case CameraMode::Bumper:
            targetPos = pos + fwd * 2.05f + up * 0.55f;
            lookAt = targetPos + fwd * 14.0f;
            break;
        case CameraMode::Cockpit:
            targetPos = pos + fwd * 0.10f + up * 1.18f - player.right * 0.36f;
            lookAt = targetPos + fwd * 14.0f + up * 0.05f;
            break;
        case CameraMode::Cinematic: {
            cinematicTimer_ += dt;
            float a = cinematicTimer_ * 0.35f + 1.2f;
            targetPos = pos + Vec3(std::cos(a) * 9.0f, 2.6f + std::sin(a * 0.6f) * 1.2f, std::sin(a) * 9.0f);
            lookAt = pos + Vec3(0, 0.9f, 0);
            break;
        }
        case CameraMode::Orbit: {
            orbitAngle_ += dt * (std::fabs(speed) < 0.5f ? 0.55f : 0.18f);
            float r = 8.5f;
            targetPos = pos + Vec3(std::cos(orbitAngle_) * r, 2.2f, std::sin(orbitAngle_) * r);
            lookAt = pos + Vec3(0, 0.8f, 0);
            break;
        }
        case CameraMode::Photo: {
            camYaw_ += in.camYaw * dt * 1.6f;
            camPitch_ = clampf(camPitch_ + in.camPitch * dt * 1.2f, -1.2f, 1.2f);
            Vec3 dir(std::cos(camYaw_) * std::cos(camPitch_), std::sin(camPitch_), std::sin(camYaw_) * std::cos(camPitch_));
            Vec3 f = dir;
            targetPos = camera.pos + f * (in.camFwd * std::max(8.0f, std::fabs(speed) * 2.0f + 8.0f) * dt)
                      + Vec3(0, in.camUp * 8.0f * dt, 0);
            lookAt = targetPos + f * 20.0f;
            break;
        }
        default:
            targetPos = pos - fwd * 7.0f + Vec3(0, 2.4f, 0);
            lookAt = pos + fwd * 6.0f;
            break;
    }
    if (cameraMode == CameraMode::Photo && photoInit_) { camera.pos = targetPos; photoInit_ = false; }
    if (cameraMode == CameraMode::Photo) {
        camera.target = lookAt;
    } else {
        camera.pos = vlerp(camera.pos, targetPos, blend);
        camera.target = vlerp(camera.target, lookAt, clampf(dt * 14.0f, 0.0f, 1.0f));
    }
    // keep the camera above the ground
    float gh = world.heightAt(camera.pos.x, camera.pos.z) + 0.45f;
    if (camera.pos.y < gh) camera.pos.y = gh;
    camera.up = Vec3(0, 1, 0);
}

// ---------------------------------------------------------------------------
void Game::drawCar(Renderer& r, const CarVisual& vis, const Vehicle& v) {
    Vec3 up = v.up.normalized();
    Mat4 xf = carTransform(v.position, v.forward, up);
    r.mesh(vis.body, xf, -1);
    // wheels: suspension travel + steer + spin
    for (size_t i = 0; i < vis.wheelPositions.size() && i < 4; i++) {
        const WheelState& ws = v.wheels[i];
        Vec3 local = vis.wheelPositions[i];
        float comp = ws.suspCompression;
        local.y += (0.5f - comp) * 0.10f - 0.02f;
        Mat4 w = xf * Mat4::translation(local);
        w = w * Mat4::rotationY(ws.steerAngle);
        w = w * Mat4::rotationZ(ws.spinAngle);
        if (vis.wheelLeft[i]) w = w * Mat4::rotationX(PI);
        r.mesh(vis.wheel, w, -1);
    }
    r.mesh(vis.steeringWheel, xf * Mat4::translation(vis.steeringWheelPos) *
           Mat4::rotationZ(-player.wheels[0].steerAngle * 6.0f), -1);
}

void Game::render(Renderer& r) {
    Environment env;
    float tod = timeOfDay;
    float sunAngle = (tod / 24.0f) * TAU - PI * 0.5f;
    Vec3 sunDir(std::cos(sunAngle), std::sin(sunAngle), 0.35f);
    sunDir = sunDir.normalized();
    float day = clampf(sunDir.y * 3.0f, 0.0f, 1.0f);
    env.sunDir = sunDir;
    env.nightFactor = 1.0f - day;
    env.sunColor = vlerp(Vec3(1.0f, 0.55f, 0.32f), Vec3(1.0f, 0.96f, 0.90f), smoothstepf(0.05f, 0.4f, day));
    env.sunIntensity = lerpf(0.15f, 3.1f, day);
    env.ambientSky = vlerp(Vec3(0.06f, 0.08f, 0.16f), Vec3(0.36f, 0.47f, 0.64f), day);
    env.ambientGround = vlerp(Vec3(0.03f, 0.03f, 0.05f), Vec3(0.17f, 0.15f, 0.12f), day);
    env.skyZenith = vlerp(Vec3(0.02f, 0.03f, 0.09f), Vec3(0.20f, 0.38f, 0.74f), day);
    env.skyHorizon = vlerp(Vec3(0.08f, 0.09f, 0.16f), Vec3(0.66f, 0.75f, 0.87f), day);
    env.fogColor = vlerp(Vec3(0.07f, 0.08f, 0.14f), Vec3(0.68f, 0.74f, 0.82f), day);
    env.fogDensity = 0.00042f;
    env.timeOfDay = tod;
    env.exposure = lerpf(1.5f, 1.0f, day);
    r.setEnvironment(env);
    r.beginFrame(camera);

    world.draw(r, camera, 900.0f);

    // ---- cars
    const CarVisual& pv = models_.empty() ? playerVisual : models_[playerModel];
    drawCar(r, models_[std::max(0, std::min(playerModel, (int)models_.size() - 1))], player);
    for (const TrafficCar& t : traffic) {
        float d = distance(t.pos, camera.pos);
        if (d > 420.0f) continue;
        Mat4 xf = Mat4::translation(t.pos) * Mat4::rotationY(t.yaw);
        const CarVisual& cv = models_[t.model % (int)models_.size()];
        r.mesh(cv.body, xf, -1);
        for (size_t i = 0; i < cv.wheelPositions.size() && i < 4; i++) {
            Mat4 w = xf * Mat4::translation(cv.wheelPositions[i]);
            if (cv.wheelLeft[i]) w = w * Mat4::rotationX(PI);
            r.mesh(cv.wheel, w, -1);
        }
    }
    for (const AiRacer& a : racers) {
        drawCar(r, models_[a.model % (int)models_.size()], a.v);
    }

    r.endFrame();
    r.begin2D();
    drawHUD(r);
    r.end2D();
}

void Game::drawMinimap(Renderer& r, float x, float y, float size) {
    ui_.panel(x, y, size, size, Vec4(0.03f, 0.04f, 0.06f, 0.72f), Vec4(0.35f, 0.42f, 0.52f, 0.9f), 1.5f);
    float range = 700.0f;
    float sc = size / (range * 2.0f);
    Vec3 c = player.position;
    int stride = 8;
    for (const Road& rd : world.roads) {
        Vec4 col = rd.racing ? Vec4(0.55f, 0.35f, 0.9f, 0.9f)
                 : rd.highway ? Vec4(0.85f, 0.80f, 0.55f, 0.85f) : Vec4(0.55f, 0.62f, 0.70f, 0.7f);
        for (size_t i = 0; i + stride < rd.pts.size(); i += stride) {
            const Vec3& p = rd.pts[i];
            float dx = p.x - c.x, dz = p.z - c.z;
            if (std::fabs(dx) > range || std::fabs(dz) > range) continue;
            const Vec3& p2 = rd.pts[i + stride < rd.pts.size() ? i + stride : i];
            float dx2 = p2.x - c.x, dz2 = p2.z - c.z;
            if (std::fabs(dx2) > range || std::fabs(dz2) > range) continue;
            r.rect(x + size * 0.5f + dx * sc, y + size * 0.5f + dz * sc, 1.6f * ui_.scale, 1.6f * ui_.scale, col);
        }
    }
    // player arrow
    float px = x + size * 0.5f, py = y + size * 0.5f;
    float s = 5.0f * ui_.scale;
    float a = playerYaw;
    r.rect(px - s * 0.5f, py - s * 0.5f, s, s, ui::kAccent);
    r.rect(px + std::cos(a) * s * 0.9f - s * 0.3f, py + std::sin(a) * s * 0.9f - s * 0.3f, s * 0.6f, s * 0.6f, ui::kWhite);
    ui_.text(x + 8.0f * ui_.scale, y + size - 14.0f * ui_.scale, std::string("N"), 1.4f, ui::kDim);
}

void Game::drawHUD(Renderer& r) {
    float W = (float)w_, H = (float)h_;
    float S = ui_.scale;
    // ---- top left: event / progress
    if (run.state == EventState::Running && run.eventIdx >= 0) {
        const EventDef& e = events[run.eventIdx];
        ui_.panel(18.0f * S, 16.0f * S, 320.0f * S, 62.0f * S, Vec4(0.03f, 0.04f, 0.06f, 0.66f), Vec4(0.9f, 0.35f, 0.6f, 0.9f), 1.5f);
        ui_.text(28.0f * S, 24.0f * S, e.name, 1.7f, ui::kWhite);
        char buf[96];
        std::snprintf(buf, sizeof buf, "%02d:%05.2f   %d%%", (int)(run.timer / 60.0f), std::fmod(run.timer, 60.0f),
                      (int)(run.progress * 100.0f));
        ui_.text(28.0f * S, 48.0f * S, buf, 1.5f, ui::kAccent);
        if (e.type == EventType::Circuit) {
            std::snprintf(buf, sizeof buf, "LAP %d/%d", run.lap + 1, run.laps);
            ui_.textRight(328.0f * S, 48.0f * S, buf, 1.4f, ui::kDim);
        }
    } else {
        ui_.panel(18.0f * S, 16.0f * S, 250.0f * S, 46.0f * S, Vec4(0.03f, 0.04f, 0.06f, 0.55f), Vec4(0.3f, 0.36f, 0.45f, 0.9f), 1.5f);
        ui_.text(28.0f * S, 24.0f * S, regionName(world.regionAt(player.position.x, player.position.z)), 1.6f, ui::kWhite);
        char buf[64];
        std::snprintf(buf, sizeof buf, "%d CR   LV %d", credits, level);
        ui_.text(28.0f * S, 42.0f * S, buf, 1.3f, ui::kDim);
    }
    // ---- speed cluster bottom right
    float cx = W - 132.0f * S, cy = H - 118.0f * S;
    float rad = 74.0f * S;
    ui_.panel(cx - rad - 16.0f * S, cy - rad - 10.0f * S, rad * 2.0f + 32.0f * S, rad + 92.0f * S,
              Vec4(0.02f, 0.03f, 0.05f, 0.55f), Vec4(0.3f, 0.36f, 0.45f, 0.8f), 1.5f);
    ui_.gauge(cx, cy, rad, player.rpmFraction(), player.rpmFraction() > 0.92f ? ui::kRed : Vec4(0.95f, 0.62f, 0.15f, 1), 5.0f * S, 44);
    ui_.gauge(cx, cy, rad - 10.0f * S, clampf(std::fabs(player.speedKph()) / 320.0f, 0.0f, 1.0f),
              Vec4(0.25f, 0.75f, 1.0f, 0.9f), 3.5f * S, 44);
    char buf[48];
    std::snprintf(buf, sizeof buf, "%d", (int)std::fabs(player.speedKph()));
    ui_.textCenter(cx, cy - 24.0f * S, buf, 4.2f, ui::kWhite);
    ui_.textCenter(cx, cy + 6.0f * S, "KM/H", 1.3f, ui::kDim);
    std::snprintf(buf, sizeof buf, "%s%d", player.autoTransmission ? "A" : "M",
                  player.gear <= 0 ? 0 : player.gear);
    ui_.textCenter(cx, cy + 34.0f * S, buf, 2.2f, ui::kAccent);
    std::snprintf(buf, sizeof buf, "%d RPM", (int)player.engineRpm);
    ui_.textCenter(cx, cy + 62.0f * S, buf, 1.2f, ui::kDim);
    // ---- bottom left: minimap + car name
    drawMinimap(r, 20.0f * S, H - 208.0f * S, 188.0f * S);
    ui_.text(24.0f * S, H - 18.0f * S, playerDef ? playerDef->brand + " " + playerDef->name : "CAR", 1.4f, ui::kWhite);
    // ---- top right: camera + clock + fps
    std::snprintf(buf, sizeof buf, "%s   %02d:%02d   %d FPS", cameraModeName(cameraMode),
                  (int)timeOfDay, (int)(std::fmod(timeOfDay, 1.0f) * 60.0f), (int)(fps + 0.5f));
    ui_.textRight(W - 20.0f * S, 20.0f * S, buf, 1.4f, ui::kDim);
    // ---- centre message
    if (messageTimer > 0.0f && !lastMessage.empty()) {
        float a = clampf(messageTimer, 0.0f, 1.0f);
        ui_.textCenter(W * 0.5f, H * 0.16f, lastMessage, 2.0f, Vec4(1, 1, 1, a));
    }
    if (run.state == EventState::Finished && run.result) {
        ui_.textCenter(W * 0.5f, H * 0.3f, "EVENT COMPLETE", 3.0f, ui::kAccent);
        std::snprintf(buf, sizeof buf, "TIME %.2f S", run.timer);
        ui_.textCenter(W * 0.5f, H * 0.3f + 34.0f * S, buf, 2.0f, ui::kWhite);
    }
    // ---- drift / slip indicator
    if (player.avgDrivenSlip() > 0.10f && std::fabs(player.speedKph()) > 20.0f) {
        ui_.textCenter(W * 0.5f, H - 46.0f * S, "SLIP", 1.8f, ui::kRed);
    }
}

// ---------------------------------------------------------------------------
std::string Game::saveToText() const {
    char buf[512];
    std::snprintf(buf, sizeof buf,
                  "{\"seed\":%llu,\"credits\":%d,\"level\":%d,\"xp\":%d,\"car\":%d,"
                  "\"distanceKm\":%.2f,\"topSpeedKph\":%.1f,\"eventsWon\":%d,\"playTime\":%.1f}",
                  (unsigned long long)world.seed, credits, level, xp, currentCar,
                  stats.distanceKm, stats.topSpeedKph, stats.eventsWon, playTime);
    return std::string(buf);
}

bool Game::loadFromText(const std::string& s) {
    auto get = [&](const char* key) -> double {
        const char* p = std::strstr(s.c_str(), key);
        if (!p) return 0.0;
        p += std::strlen(key);
        while (*p && (*p == ':' || *p == ' ')) p++;
        return std::atof(p);
    };
    credits = (int)get("\"credits\"");
    level = (int)get("\"level\"");
    xp = (int)get("\"xp\"");
    currentCar = (int)get("\"car\"");
    stats.distanceKm = (float)get("\"distanceKm\"");
    stats.topSpeedKph = (float)get("\"topSpeedKph\"");
    stats.eventsWon = (int)get("\"eventsWon\"");
    playTime = (float)get("\"playTime\"");
    return true;
}

bool Game::saveFile(const std::string& path) const {
    FILE* f = std::fopen(path.c_str(), "wb");
    if (!f) return false;
    std::string s = saveToText();
    std::fwrite(s.data(), 1, s.size(), f);
    std::fclose(f);
    return true;
}

bool Game::loadFile(const std::string& path) {
    FILE* f = std::fopen(path.c_str(), "rb");
    if (!f) return false;
    std::string s;
    char buf[512];
    size_t n;
    while ((n = std::fread(buf, 1, sizeof buf, f)) > 0) s.append(buf, n);
    std::fclose(f);
    return loadFromText(s);
}

} // namespace hv
