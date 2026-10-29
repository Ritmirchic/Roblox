// HORIZON VELOCITY - vehicle dynamics
// Raycast suspension + combined-slip tire model + drivetrain simulation.
#pragma once
#include "core/math.h"
#include <vector>

namespace hv {

enum class Surface : uint8_t {
    Asphalt = 0, AsphaltWet, Concrete, Gravel, Dirt, Sand, Grass, Snow, Rock, Count
};

// Per-surface grip / rolling characteristics
struct SurfaceInfo {
    const char* name;
    float friction;       // peak grip multiplier
    float rollingDrag;    // rolling resistance
    float roughness;      // suspension excitation
    float dustFactor;
};
const SurfaceInfo& surfaceInfo(Surface s);

enum class Drivetrain : uint8_t { FWD = 0, RWD, AWD };

struct WheelSpec {
    Vec3 pos;             // suspension top attach point, car local space (x fwd, y up, z right)
    bool front = false;
    bool left = false;
    bool driven = false;
    bool steered = false;
    float radius = 0.34f;
    float width = 0.25f;
    float inertia = 1.2f;     // kg m^2
};

struct VehicleSpec {
    // mass & geometry
    float mass = 1400.0f;         // kg
    Vec3 comOffset{0, 0, 0};      // centre of mass offset from the model origin
    float wheelBase = 2.6f;
    float trackWidth = 1.6f;
    Vec3 dims{4.3f, 1.3f, 1.85f};
    float inertiaScale = 1.0f;

    // engine
    float idleRpm = 800.0f;
    float redlineRpm = 7200.0f;
    float maxTorque = 400.0f;     // Nm at peak
    float peakRpm = 4500.0f;
    float engineBrakeTorque = 40.0f;
    float turboLag = 0.0f;        // 0..1, higher = more lag
    float turboBoost = 0.0f;      // 0..1 extra multiplier

    // transmission
    int gearCount = 6;
    float gearRatios[8] = {3.5f, 2.2f, 1.6f, 1.2f, 0.95f, 0.78f, 0.0f, 0.0f};
    float finalDrive = 3.5f;
    float shiftTime = 0.16f;
    float drivetrainEfficiency = 0.9f;
    float engineInertia = 0.18f;   // kg m^2 reflected through the gearbox
    float autoUpshiftRpm = 0.0f;  // 0 = derived from redline
    float autoDownshiftRpm = 0.0f;
    Drivetrain drivetrain = Drivetrain::RWD;
    float torqueSplitFront = 0.0f; // for AWD, 0..1
    float limitedSlip = 0.0f;      // 0 = open, 1 = locked

    // brakes
    float brakeTorque = 3200.0f;   // Nm total
    float handbrakeTorque = 2600.0f;
    float brakeBias = 0.62f;       // front share

    // suspension
    float suspTravel = 0.20f;
    float suspStiffnessFront = 38000.0f;  // N/m
    float suspStiffnessRear = 34000.0f;
    float suspDampingFront = 3800.0f;
    float suspDampingRear = 3400.0f;
    float antiRollFront = 12000.0f;
    float antiRollRear = 9000.0f;
    float rideHeight = 0.0f;

    // tires
    float gripLat = 1.42f;
    float gripLong = 1.50f;
    float tirePeakSlipAngle = 0.14f;   // rad
    float tirePeakSlipRatio = 0.11f;
    float wetGripScale = 0.78f;
    float snowGripScale = 0.42f;

    // aero
    float dragArea = 0.72f;        // Cd * A
    float downforceRear = 0.0f;    // CL * A
    float downforceFront = 0.0f;

    // steering
    float maxSteerDeg = 34.0f;
    float steerRate = 2.4f;        // rad/s of input response
    float ackermann = 0.35f;

    // assists (0 = off, 1 = full)
    float tractionControl = 0.0f;
    float absAssist = 0.0f;
    float stabilityAssist = 0.0f;
};

struct VehicleInput {
    float throttle = 0.0f;   // 0..1
    float brake = 0.0f;      // 0..1
    float steer = 0.0f;      // -1..1
    float handbrake = 0.0f;  // 0..1
    bool shiftUp = false, shiftDown = false;
    bool clutch = false;
    int targetGear = -1;     // -1 = auto
};

struct WheelState {
    float suspCompression = 0.0f;  // 0..1 (1 = fully compressed)
    float suspVel = 0.0f;
    float steerAngle = 0.0f;
    float spinAngle = 0.0f;
    float spinVel = 0.0f;          // rad/s
    float slipRatio = 0.0f;
    float slipAngle = 0.0f;
    float load = 0.0f;             // N
    bool grounded = false;
    Vec3 contactPoint;
    Vec3 contactNormal{0, 1, 0};
    Vec3 worldPos;
    float surfaceFriction = 1.0f;
    float skid = 0.0f;             // 0..1 tire scrub intensity (for FX)
    Surface surface = Surface::Asphalt;
    float spinSurface = 0.0f;      // wheel angular accel indicator
};

class WorldQuery {
public:
    virtual ~WorldQuery() {}
    virtual float heightAt(float x, float z) const = 0;
    virtual Surface surfaceAt(float x, float z) const = 0;
    // Push a sphere out of world geometry (buildings, props). Returns true if collided.
    virtual bool collideSphere(const Vec3& center, float radius, Vec3& outNormal, float& penetration) const { (void)center; (void)radius; (void)outNormal; (void)penetration; return false; }
    // Is this point inside drivable geometry (used to prevent spawning inside buildings)
    virtual bool isFree(const Vec3& p, float radius) const { (void)p; (void)radius; return true; }
};

class Vehicle {
public:
    VehicleSpec spec;
    std::vector<WheelSpec> wheelSpecs;
    std::vector<WheelState> wheels;

    // body state
    Vec3 position{0, 0, 0};
    Vec3 velocity;
    Mat4 orientation;
    Vec3 angularVel;
    Vec3 forward{1, 0, 0}, up{0, 1, 0}, right{0, 0, 1};

    // drivetrain state
    float engineRpm = 800.0f;
    float engineTorqueOut = 0.0f;
    int gear = 1;              // 0 = reverse, 1..gearCount
    float shiftTimer = 0.0f;
    float shiftCooldown = 0.0f;
    float clutchEngagement = 1.0f;
    float turboSpool = 0.0f;
    VehicleInput input;
    bool autoTransmission = true;

    // derived
    float speed() const { return velocity.length(); }
    float speedKph() const { return velocity.length() * 3.6f; }
    float forwardSpeed() const { return velocity.dot(forward); }
    float rpmFraction() const { return clampf((engineRpm - spec.idleRpm) / std::max(1.0f, spec.redlineRpm - spec.idleRpm), 0.0f, 1.05f); }
    Vec3 comWorld() const { return position + orientation.transformDir(spec.comOffset); }

    void setup(const VehicleSpec& s, const std::vector<WheelSpec>& ws);
    void reset(const Vec3& pos, float yaw, float groundY = 0.0f);
    void resetOnGround(const Vec3& pos, float yaw, const WorldQuery& world);
    void step(float dt, const WorldQuery& world);
    void applyImpulse(const Vec3& worldPos, const Vec3& impulse);

    float wheelRadiusAvg() const;
    void shiftUp();
    void shiftDown();
    float gearRatio() const;

    // force telemetry (N) for tuning & debug overlays
    float dbgWheelLong[8] = {0}, dbgWheelSlip[8] = {0};
    float dbgDriveN = 0, dbgDragN = 0, dbgRollN = 0, dbgTireLongN = 0, dbgTireLatN = 0, dbgDownforceN = 0;

    // telemetry for HUD / tests
    float avgDrivenSlip() const;
    float bodyRoll() const;
    float bodyPitch() const;   // pitch relative to ground
    float yawRate() const { return angularVel.dot(up); }

private:
    void stepWheels(float dt, const WorldQuery& world, float& outTotalWheelForce);
    void integrateBody(float dt, const Vec3& force, const Vec3& torque, const Vec3& comPos);
    float engineTorqueAt(float rpm) const;
    float driveTorqueApplied = 0.0f;
    Vec3 inertiaInv{1, 1, 1};  // diagonal inverse inertia in body space
    float idleTimer = 0.0f;
    float revLimiterTimer = 0.0f;
    float lastForwardSpeed = 0.0f;
    Vec3 prevVelocity;
    void applyAngular(float dt);
    Vec3 bodyForce; // accumulated world force
    Vec3 bodyTorque;
};

} // namespace hv
