// HORIZON VELOCITY - headless simulation tests
// Verifies vehicle dynamics, world generation and gameplay logic without a GPU.
#include "sim/vehicle.h"
#include "core/noise.h"
#include <cstdio>
#include <cstring>
#include <cmath>
#include <string>
#include <vector>

using namespace hv;

static int g_fail = 0, g_pass = 0;
static void check(bool cond, const char* what, const char* extra = "") {
    if (cond) { g_pass++; printf("  \033[32mPASS\033[0m %s %s\n", what, extra); }
    else { g_fail++; printf("  \033[31mFAIL\033[0m %s %s\n", what, extra); }
}
static void checkRange(float v, float lo, float hi, const char* what) {
    char buf[128]; snprintf(buf, sizeof buf, "(value %.3f, expected %.3f..%.3f)", v, lo, hi);
    check(v >= lo && v <= hi, what, buf);
}

// flat test world
struct FlatWorld : WorldQuery {
    float y = 0;
    Surface surf = Surface::Asphalt;
    float heightAt(float, float) const override { return y; }
    Surface surfaceAt(float, float) const override { return surf; }
};

struct SlopeWorld : WorldQuery {
    float slope = 0.0f; // radians of incline along +x
    float heightAt(float x, float) const override { return std::tan(slope) * x; }
    Surface surfaceAt(float, float) const override { return Surface::Asphalt; }
};

static std::vector<WheelSpec> makeWheels(float wb, float tw, float r, Drivetrain dt) {
    std::vector<WheelSpec> w(4);
    float hx = wb * 0.5f, hz = tw * 0.5f;
    // front left, front right, rear left, rear right
    float ay = r + 0.10f; // suspension top mount (mid-travel) above the model origin
    w[0].pos = Vec3(hx, ay, -hz);  w[0].front = true;  w[0].left = true;
    w[1].pos = Vec3(hx, ay, hz);   w[1].front = true;  w[1].left = false;
    w[2].pos = Vec3(-hx, ay, -hz); w[2].front = false; w[2].left = true;
    w[3].pos = Vec3(-hx, ay, hz);  w[3].front = false; w[3].left = false;
    for (int i = 0; i < 4; i++) { w[i].radius = r; w[i].width = 0.24f; w[i].inertia = 3.0f; }
    w[0].steered = w[1].steered = true;
    if (dt == Drivetrain::RWD) { w[2].driven = w[3].driven = true; }
    else if (dt == Drivetrain::FWD) { w[0].driven = w[1].driven = true; }
    else { for (int i = 0; i < 4; i++) w[i].driven = true; }
    return w;
}

static VehicleSpec sportSpec(Drivetrain dt) {
    VehicleSpec s;
    s.mass = 1450; s.dims = Vec3(4.4f, 1.26f, 1.88f); s.wheelBase = 2.65f; s.trackWidth = 1.60f;
    s.maxTorque = 520; s.peakRpm = 4600; s.redlineRpm = 7000; s.idleRpm = 850;
    s.gearCount = 6;
    float gr[8] = {3.4f, 2.05f, 1.55f, 1.22f, 1.0f, 0.82f, 0.0f, 0.0f};
    memcpy(s.gearRatios, gr, sizeof gr);
    s.finalDrive = 3.7f; s.drivetrain = dt;
    s.torqueSplitFront = 0.42f;
    s.brakeTorque = 9000; s.handbrakeTorque = 3000;
    s.dragArea = 0.70f; s.downforceRear = 0.35f; s.downforceFront = 0.18f;
    s.suspStiffnessFront = 42000; s.suspStiffnessRear = 38000;
    s.suspDampingFront = 4200; s.suspDampingRear = 3900;
    s.gripLat = 1.02f; s.gripLong = 1.06f; s.tractionControl = 0.6f; s.absAssist = 0.4f;

    return s;
}

static float runAccel(Vehicle& v, const FlatWorld& world, float targetKph, float maxSeconds, float& distOut) {
    float t = 0, dt = 1.0f / 240.0f;
    v.reset(Vec3(0, 0, 0), 0, 0);
    v.input = VehicleInput();
    v.input.throttle = 1.0f;
    Vec3 start = v.position;
    while (t < maxSeconds) {
        v.input.steer = 0;
        v.step(dt, world);
        t += dt;
        if (v.speedKph() >= targetKph) break;
    }
    distOut = (v.position - start).length();
    return t;
}

int main(int argc, char** argv) {
    printf("\n=== HORIZON VELOCITY :: headless test suite ===\n\n");
    bool verbose = argc > 1 && strcmp(argv[1], "-v") == 0;
    (void)verbose;

    FlatWorld world;

    // ---------------------------------------------------------------- 1. baseline accel
    printf("[1] Longitudinal performance (RWD sports car)\n");
    {
        Vehicle v; v.setup(sportSpec(Drivetrain::RWD), makeWheels(2.65f, 1.6f, 0.34f, Drivetrain::RWD));
        float dist = 0;
        float t = runAccel(v, world, 100.0f, 20.0f, dist);
        printf("     0-100 km/h = %.2f s, %.1f m\n", t, dist);
        checkRange(t, 3.5f, 8.0f, "0-100 km/h time in a plausible range");
        check(v.position.y > -0.2f && v.position.y < 3.0f, "car stays on the ground during launch");
        check(!std::isnan(v.position.x) && !std::isnan(v.velocity.y), "no NaN in state");
        // top speed run
        v.reset(Vec3(0,0,0), 0, 0);
        v.input.throttle = 1.0f;
        float dt = 1.0f/240.0f;
        for (int i = 0; i < 240 * 70; i++) v.step(dt, world);
        printf("     top speed = %.1f km/h (gear %d, rpm %.0f)\n", v.speedKph(), v.gear, v.engineRpm);
        checkRange(v.speedKph(), 180.0f, 340.0f, "top speed in a plausible range");
        check(v.gear == v.spec.gearCount, "reaches top gear");
    }

    // ---------------------------------------------------------------- 2. braking
    printf("\n[2] Braking\n");
    {
        Vehicle v; v.setup(sportSpec(Drivetrain::RWD), makeWheels(2.65f, 1.6f, 0.34f, Drivetrain::RWD));
        v.reset(Vec3(0,0,0), 0, 0);
        float dt = 1.0f/240.0f;
        v.input.throttle = 1;
        int guard = 0;
        while (v.speedKph() < 100.0f && guard++ < 240 * 30) v.step(dt, world);
        Vec3 p0 = v.position;
        v.input.throttle = 0; v.input.brake = 1;
        float t = 0;
        while (v.speedKph() > 3.0f && t < 12.0f) { v.step(dt, world); t += dt; }
        float dist = (v.position - p0).length();
        printf("     100-0 km/h = %.2f s, %.1f m\n", t, dist);
        checkRange(dist, 28.0f, 70.0f, "braking distance plausible");
        check(std::fabs(v.velocity.y) < 2.0f, "no vertical explosion while braking");
    }

    // ---------------------------------------------------------------- 3. drivetrain differences
    printf("\n[3] Drivetrain behaviour\n");
    {
        float tRWD = 0, tFWD = 0, tAWD = 0, d;
        Vehicle vr; vr.setup(sportSpec(Drivetrain::RWD), makeWheels(2.65f,1.6f,0.34f,Drivetrain::RWD));
        Vehicle vf; vf.setup(sportSpec(Drivetrain::FWD), makeWheels(2.65f,1.6f,0.34f,Drivetrain::FWD));
        Vehicle va; va.setup(sportSpec(Drivetrain::AWD), makeWheels(2.65f,1.6f,0.34f,Drivetrain::AWD));
        tRWD = runAccel(vr, world, 100.0f, 20.0f, d);
        tFWD = runAccel(vf, world, 100.0f, 20.0f, d);
        tAWD = runAccel(va, world, 100.0f, 20.0f, d);
        printf("     RWD %.2fs  FWD %.2fs  AWD %.2fs\n", tRWD, tFWD, tAWD);
        check(tAWD < tRWD && tRWD < tFWD, "AWD launches harder than RWD, which beats FWD");
        // wheelspin distribution: RWD unloads the rear, FWD unloads the front
        vr.reset(Vec3(0,0,0),0,0); vf.reset(Vec3(0,0,0),0,0);
        vr.input.throttle = 1; vf.input.throttle = 1;
        for (int i = 0; i < 240; i++) { vr.step(1.0f/240.0f, world); vf.step(1.0f/240.0f, world); }
        float rwdRear = std::fabs(vr.wheels[2].slipRatio), rwdFront = std::fabs(vr.wheels[0].slipRatio);
        float fwdFront = std::fabs(vf.wheels[0].slipRatio), fwdRear = std::fabs(vf.wheels[2].slipRatio);
        printf("     RWD slip rear %.2f front %.2f | FWD slip front %.2f rear %.2f\n", rwdRear, rwdFront, fwdFront, fwdRear);
        check(rwdRear > rwdFront * 2.0f, "RWD spins its rear wheels far more than its fronts");
        check(fwdFront > fwdRear * 2.0f, "FWD spins its front wheels far more than its rears");
    }

    // ---------------------------------------------------------------- 4. cornering
    printf("\n[4] Body behaviour in corners\n");
    {
        Vehicle v; v.setup(sportSpec(Drivetrain::RWD), makeWheels(2.65f,1.6f,0.34f,Drivetrain::RWD));
        v.reset(Vec3(0,0,0), 0, 0);
        float dt = 1.0f/240.0f;
        v.input.throttle = 0.55f;
        // get to speed
        for (int i = 0; i < 240 * 4; i++) v.step(dt, world);
        float yawSum = 0, speedSum = 0;
        int n = 0;
        for (int i = 0; i < 240 * 3; i++) {
            v.input.steer = 0.5f; // steady right turn
            v.step(dt, world);
            if (i > 120) { yawSum += v.angularVel.dot(v.up); speedSum += v.speedKph(); n++; }
        }
        float meanYaw = yawSum / std::max(1, n);
        float meanSpeed = speedSum / std::max(1, n);
        printf("     steady-state yaw rate %.3f rad/s at %.0f km/h\n", meanYaw, meanSpeed);
        check(meanYaw < -0.05f, "steering right produces negative (right) yaw");
        check(std::fabs(meanYaw) < 3.0f, "yaw rate stays bounded");
        check(v.position.y > -0.5f && v.position.y < 3.0f, "car does not fly or sink in corners");
        // lateral g
        float latG = std::fabs(meanYaw) * (meanSpeed / 3.6f) / 9.81f;
        printf("     lateral acceleration ~ %.2f g\n", latG);
        checkRange(latG, 0.2f, 2.0f, "cornering grip in a plausible range");
    }

    // ---------------------------------------------------------------- 5. suspension / ground
    printf("\n[5] Suspension & ground contact\n");
    {
        Vehicle v; v.setup(sportSpec(Drivetrain::RWD), makeWheels(2.65f,1.6f,0.34f,Drivetrain::RWD));
        v.reset(Vec3(0,0,0), 0, 0);
        for (int i = 0; i < 240 * 2; i++) v.step(1.0f/240.0f, world);
        int grounded = 0;
        for (auto& w : v.wheels) if (w.grounded) grounded++;
        printf("     grounded wheels: %d, body y = %.3f\n", grounded, v.position.y);
        check(grounded == 4, "all four wheels stay in contact");
        checkRange(v.position.y, -0.15f, 0.6f, "ride height sensible");
        float totalLoad = 0;
        for (auto& w : v.wheels) totalLoad += w.load;
        printf("     total wheel load %.0f N (weight %.0f N)\n", totalLoad, v.spec.mass * 9.81f);
        check(totalLoad > v.spec.mass * 9.81f * 0.7f && totalLoad < v.spec.mass * 9.81f * 1.4f,
              "suspension carries the vehicle weight");
    }

    // ---------------------------------------------------------------- 6. slopes
    printf("\n[6] Slope handling\n");
    {
        SlopeWorld slope; slope.slope = 0.12f; // ~7 degrees
        Vehicle v; v.setup(sportSpec(Drivetrain::AWD), makeWheels(2.65f,1.6f,0.34f,Drivetrain::AWD));
        v.resetOnGround(Vec3(0,0,0), 0, slope);
        v.input.throttle = 1;
        for (int i = 0; i < 240 * 5; i++) v.step(1.0f/240.0f, slope);
        printf("     uphill speed %.1f km/h, y = %.2f (expected %.2f)\n", v.speedKph(), v.position.y, std::tan(slope.slope) * v.position.x);
        check(v.position.x > 5.0f, "car drives uphill (positive x)");
        check(v.speedKph() > 20.0f, "car can climb a 7 degree slope");
        check(std::fabs(v.position.y - std::tan(slope.slope) * v.position.x) < 1.2f, "car follows the slope surface");
    }

    // ---------------------------------------------------------------- 7. surfaces
    printf("\n[7] Surface dependent grip\n");
    {
        auto testSurface = [&](Surface s) {
            FlatWorld w; w.surf = s;
            Vehicle v; v.setup(sportSpec(Drivetrain::RWD), makeWheels(2.65f,1.6f,0.34f,Drivetrain::RWD));
            v.reset(Vec3(0,0,0),0,0);
            float dt = 1.0f/240.0f;
            v.input.throttle = 0.6f;
            for (int i = 0; i < 240*3; i++) v.step(dt, w);
            float yaw0 = 0, spd = 0; int n = 0;
            for (int i = 0; i < 240*2; i++) {
                v.input.steer = 0.4f;
                v.step(dt, w);
                if (i > 60) { yaw0 += std::fabs(v.angularVel.dot(v.up)); spd += v.speedKph(); n++; }
            }
            return std::pair<float,float>(yaw0/std::max(1,n), spd/std::max(1,n));
        };
        auto asph = testSurface(Surface::Asphalt);
        auto dirt = testSurface(Surface::Dirt);
        auto snow = testSurface(Surface::Snow);
        printf("     asphalt yaw %.3f @ %.0f km/h | dirt yaw %.3f @ %.0f | snow yaw %.3f @ %.0f\n",
               asph.first, asph.second, dirt.first, dirt.second, snow.first, snow.second);
        check(dirt.first < asph.first * 0.95f || dirt.second < asph.second * 0.95f, "loose surfaces reduce cornering performance");
        check(snow.second < asph.second, "snow reduces achievable speed");
    }

    // ---------------------------------------------------------------- 8. gearbox
    printf("\n[8] Transmission\n");
    {
        Vehicle v; v.setup(sportSpec(Drivetrain::RWD), makeWheels(2.65f,1.6f,0.34f,Drivetrain::RWD));
        v.reset(Vec3(0,0,0),0,0);
        int maxGear = 0;
        float dt = 1.0f/240.0f;
        v.input.throttle = 1;
        for (int i = 0; i < 240*60; i++) { v.step(dt, world); maxGear = std::max(maxGear, v.gear); }
        check(maxGear == 6, "automatic gearbox reaches 6th");
        check(v.engineRpm >= v.spec.idleRpm * 0.8f, "engine never stalls");
        // manual downshift
        v.autoTransmission = false;
        v.input.throttle = 0.2f;
        int g0 = v.gear;
        v.shiftDown();
        for (int i = 0; i < 30; i++) v.step(dt, world);
        check(v.gear == g0 - 1, "manual downshift works");
        // reverse from standstill
        Vehicle r; r.setup(sportSpec(Drivetrain::RWD), makeWheels(2.65f,1.6f,0.34f,Drivetrain::RWD));
        r.reset(Vec3(0,0,0),0,0);
        r.gear = 0;
        r.input.throttle = 0.6f;
        for (int i = 0; i < 240*3; i++) r.step(dt, world);
        printf("     reverse moves car to x = %.2f\n", r.position.x);
        check(r.position.x < -1.0f, "reverse gear drives backwards");
    }

    // ---------------------------------------------------------------- 9. noise determinism
    printf("\n[9] Deterministic noise\n");
    {
        Noise n1, n2;
        n1.init(1234); n2.init(1234);
        float a = n1.fbm2(12.3f, 44.1f, 5);
        float b = n2.fbm2(12.3f, 44.1f, 5);
        check(std::fabs(a - b) < 1e-9f, "noise is deterministic across instances");
        check(std::fabs(a) < 2.0f, "fbm output bounded");
        Noise n3; n3.init(999);
        check(std::fabs(n3.fbm2(12.3f, 44.1f, 5) - a) > 1e-6f, "different seeds give different terrain");
    }

    // ---------------------------------------------------------------- 10. long drive stability
    printf("\n[10] Long run stability (60 s at speed)\n");
    {
        Vehicle v; v.setup(sportSpec(Drivetrain::AWD), makeWheels(2.65f,1.6f,0.34f,Drivetrain::AWD));
        v.reset(Vec3(0,0,0),0,0);
        float dt = 1.0f/240.0f;
        v.input.throttle = 1;
        bool ok = true;
        for (int i = 0; i < 240*60; i++) {
            v.input.steer = std::sin(i * 0.002f) * 0.25f;
            v.step(dt, world);
            if (std::isnan(v.position.x) || std::isnan(v.velocity.x)) { ok = false; break; }
            if (v.position.y < -2.0f || v.position.y > 8.0f) { ok = false; break; }
        }
        check(ok, "no instability over a one minute simulated drive");

        // rollover check with hard steering at speed
        Vehicle r; r.setup(sportSpec(Drivetrain::RWD), makeWheels(2.65f,1.6f,0.34f,Drivetrain::RWD));
        r.reset(Vec3(0,0,0),0,0);
        r.input.throttle = 1;
        for (int i = 0; i < 240*8; i++) r.step(dt, world);
        for (int i = 0; i < 240*2; i++) { r.input.steer = 1.0f; r.input.handbrake = 0.4f; r.step(dt, world); }
        printf("     up vector after drift attempt: (%.2f, %.2f, %.2f)\n", r.up.x, r.up.y, r.up.z);
        check(r.up.y > 0.55f, "car does not flip over during aggressive driving");
    }

    printf("\n=== %d passed, %d failed ===\n\n", g_pass, g_fail);
    return g_fail == 0 ? 0 : 1;
}
