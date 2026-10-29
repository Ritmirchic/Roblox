// HORIZON VELOCITY - game state, cameras, HUD, events, traffic.
#pragma once
#include "core/math.h"
#include "game/cars.h"
#include "render/gfx.h"
#include "sim/vehicle.h"
#include "ui/ui.h"
#include "world/world.h"
#include <string>
#include <vector>

namespace hv {

struct InputState {
    float throttle = 0.0f, brake = 0.0f, steer = 0.0f, handbrake = 0.0f;
    bool shiftUp = false, shiftDown = false, toggleAuto = false, reset = false;
    int cameraCycle = 0;            // +1 per press
    bool pause = false, mapToggle = false, photoMode = false;
    bool menuUp = false, menuDown = false, menuSelect = false, menuBack = false;
    bool interact = false;
    // free camera axes (photo mode)
    float camYaw = 0.0f, camPitch = 0.0f, camFwd = 0.0f, camRight = 0.0f, camUp = 0.0f;
};

enum class CameraMode : int {
    Chase = 0, ChaseFar, Hood, Bumper, Cockpit, Cinematic, Orbit, Photo, Count
};
const char* cameraModeName(CameraMode m);

enum class EventType : int {
    Sprint = 0, Circuit, TimeAttack, SpeedTrap, Drift, FreeRoam,
    LongDistance, HillClimb, Drag, Delivery, Elimination, OffroadTrail, Showcase,
    Count
};
const char* eventTypeName(EventType t);

struct EventDef {
    std::string name;
    EventType type = EventType::Sprint;
    int chapter = 0;
    int roadIdx = 0;
    float distanceKm = 0.0f;
    int reward = 0;
    int xp = 0;
    bool implemented = false;   // honest flag: false = catalogue only in this build
};

enum class EventState { Idle = 0, Running, Finished, Failed };

struct EventRun {
    EventState state = EventState::Idle;
    int eventIdx = -1;
    float timer = 0.0f;
    float distance = 0.0f;
    float bestTime = 0.0f;
    int checkpoint = 0;
    int checkpoints = 0;
    int lap = 0, laps = 1;
    float progress = 0.0f;       // 0..1 along the route
    float driftScore = 0.0f;
    bool result = false;
};

struct TrafficCar {
    Vec3 pos;
    float yaw = 0.0f;
    float speed = 0.0f;
    float targetSpeed = 0.0f;
    int roadIdx = 0;
    float t = 0.0f;              // distance along the road (metres)
    int dir = 1;
    float lane = 1.7f;
    int model = 0;
    Vehicle v;                   // used for the nearest cars only
    bool simulated = false;
};

struct AiRacer {
    Vehicle v;
    int model = 0;
    float progress = 0.0f;       // metres along the circuit
    float lookahead = 14.0f;
    int lapsDone = 0;
    float lapTime = 0.0f, bestLap = 0.0f;
};

class Game {
public:
    bool init(Renderer* r, int w, int h, uint64_t seed);
    void update(float dt, const InputState& in);
    void render(Renderer& r);
    void shutdown();

    // scripted driving for the headless harness
    void setAutopilot(bool on) { autopilot_ = on; }
    bool startEvent(int idx);
    void resetCar();

    World world;
    Vehicle player;
    const CarDef* playerDef = nullptr;
    CarVisual playerVisual;
    Vec3 playerPos{0, 0, 0};
    float playerYaw = 0.0f;

    EventDef events[50];
    int eventCount = 0;
    EventRun run;
    std::vector<TrafficCar> traffic;
    std::vector<AiRacer> racers;

    CameraMode cameraMode = CameraMode::Chase;
    Camera camera;
    float timeOfDay = 10.5f;
    float playTime = 0.0f;
    float fps = 0.0f;

    // progression / save state
    int credits = 25000, level = 1, xp = 0;
    std::vector<int> ownedCars;
    int currentCar = 0;
    int playerModel = 0;
    std::string lastMessage;
    float messageTimer = 0.0f;
    void message(const std::string& s, float seconds = 3.0f);

    std::string saveToText() const;
    bool loadFromText(const std::string& s);
    bool saveFile(const std::string& path) const;
    bool loadFile(const std::string& path);

    struct Stats {
        float topSpeedKph = 0, maxLateralG = 0, distanceKm = 0, driftTotal = 0;
        int resets = 0, eventsWon = 0;
    } stats;

private:
    void updateCamera(float dt, const InputState& in);
    void updateTraffic(float dt);
    void updateRacers(float dt);
    void updateEvent(float dt);
    void drawCar(Renderer& r, const CarVisual& vis, const Vehicle& v);
    void drawHUD(Renderer& r);
    void drawMinimap(Renderer& r, float x, float y, float size);
    void buildEvents();
    void placeOnRoad(const Vec3& hint);
    float roadLength(int roadIdx) const;
    Vec3 sampleRoad(int roadIdx, float t) const;
    Vec3 sampleRoadDir(int roadIdx, float t) const;

    Renderer* r_ = nullptr;
    int w_ = 1280, h_ = 720;
    WorldQueryImpl wq_;
    ui::UI ui_;
    CameraMode prevCam_ = CameraMode::Chase;
    float camYaw_ = 0.0f, camPitch_ = -0.12f, camDist_ = 7.0f;
    Vec3 camLook_{0, 0, 0};
    float orbitAngle_ = 0.0f;
    float cinematicTimer_ = 0.0f;
    bool autopilot_ = false;
    bool photoInit_ = true;
    float autoTimer_ = 0.0f;
    float dt_ = 0.016f;
    std::vector<CarVisual> models_;
    std::vector<int> modelCarIdx_;
    int frameCount_ = 0;
    float frameMs_ = 0.0f;
};

} // namespace hv
