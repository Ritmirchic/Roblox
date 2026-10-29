#include "sim/vehicle.h"
#include <cstring>

namespace hv {

static const SurfaceInfo kSurfaces[(int)Surface::Count] = {
    // name          friction rolling roughness dust
    {"Asphalt",      1.00f, 1.00f, 0.25f, 0.05f},
    {"Wet Asphalt",  0.78f, 1.10f, 0.25f, 0.10f},
    {"Concrete",     1.02f, 1.05f, 0.35f, 0.15f},
    {"Gravel",       0.62f, 2.60f, 1.00f, 1.00f},
    {"Dirt",         0.58f, 2.80f, 0.85f, 0.90f},
    {"Sand",         0.44f, 4.20f, 0.70f, 1.00f},
    {"Grass",        0.52f, 3.40f, 0.80f, 0.40f},
    {"Snow",         0.34f, 2.20f, 0.55f, 0.20f},
    {"Rock",         0.86f, 3.00f, 1.20f, 0.30f},
};

const SurfaceInfo& surfaceInfo(Surface s) {
    int i = (int)s;
    if (i < 0 || i >= (int)Surface::Count) i = 0;
    return kSurfaces[i];
}

// stable tire curve: peaks with value 1.0 at s = peak, falls away smoothly
static inline float tireCurve(float s, float peak) {
    float x = std::fabs(s) / std::max(0.02f, peak);
    if (x < 1.0f) return std::sin(x * PI * 0.5f);
    return 1.0f - 0.30f * (1.0f - 1.0f / x);
}

void Vehicle::setup(const VehicleSpec& s, const std::vector<WheelSpec>& ws) {
    spec = s;
    wheelSpecs = ws;
    wheels.assign(ws.size(), WheelState());
    // diagonal inertia (body space): x = roll axis, y = yaw axis, z = pitch axis
    float m = spec.mass;
    float Iroll = m / 12.0f * (spec.dims.y * spec.dims.y + spec.dims.z * spec.dims.z) * spec.inertiaScale;
    float Iyaw = m / 12.0f * (spec.dims.x * spec.dims.x + spec.dims.z * spec.dims.z) * spec.inertiaScale;
    float Ipitch = m / 12.0f * (spec.dims.x * spec.dims.x + spec.dims.y * spec.dims.y) * spec.inertiaScale;
    inertiaInv = Vec3(1.0f / std::max(1.0f, Iroll), 1.0f / std::max(1.0f, Iyaw), 1.0f / std::max(1.0f, Ipitch)) * 1.15f;
    if (spec.autoUpshiftRpm <= 0.0f) spec.autoUpshiftRpm = spec.redlineRpm * 0.95f;
    if (spec.autoDownshiftRpm <= 0.0f) spec.autoDownshiftRpm = spec.redlineRpm * 0.42f;
    orientation = Mat4::identity();
    gear = 1;
}

float Vehicle::gearRatio() const {
    if (gear <= 0) return -3.2f;
    int g = std::min(gear, spec.gearCount);
    return spec.gearRatios[std::max(0, g - 1)];
}

float Vehicle::wheelRadiusAvg() const {
    float r = 0;
    for (auto& w : wheelSpecs) r += w.radius;
    return wheelSpecs.empty() ? 0.34f : r / (float)wheelSpecs.size();
}

void Vehicle::reset(const Vec3& pos, float yaw, float groundY) {
    position = Vec3(pos.x, groundY + spec.rideHeight + 0.02f, pos.z);
    velocity = Vec3(0, 0, 0);
    angularVel = Vec3(0, 0, 0);
    orientation = Mat4::rotationY(yaw);
    engineRpm = spec.idleRpm;
    gear = 1;
    shiftTimer = 0;
    turboSpool = 0;
    for (auto& w : wheels) {
        w = WheelState();
        w.suspCompression = 0.5f;
    }
    input = VehicleInput();
}

void Vehicle::resetOnGround(const Vec3& pos, float yaw, const WorldQuery& world) {
    float h = world.heightAt(pos.x, pos.z);
    reset(pos, yaw, h);
    // settle suspension a touch so the car does not drop
    for (int i = 0; i < 10; i++) {
        VehicleInput keep = input;
        step(1.0f / 120.0f, world);
        input = keep;
    }
}

void Vehicle::shiftUp() {
    if (shiftTimer > 0) return;
    if (gear < spec.gearCount) { gear++; shiftTimer = spec.shiftTime; }
}
void Vehicle::shiftDown() {
    if (shiftTimer > 0) return;
    if (gear > -1) { gear--; shiftTimer = spec.shiftTime; }
}

float Vehicle::engineTorqueAt(float rpm) const {
    float peak = std::max(1200.0f, spec.peakRpm);
    float red = std::max(peak + 400.0f, spec.redlineRpm);
    float t;
    if (rpm <= peak) {
        float n = rpm / peak;
        t = 0.58f + 0.42f * std::sqrt(clampf(n, 0.0f, 1.0f));
    } else {
        float n = (rpm - peak) / std::max(1.0f, red - peak);
        t = 1.0f - 0.42f * n * n;
    }
    t = std::max(0.0f, t);
    if (rpm > spec.redlineRpm) t *= std::max(0.0f, 1.0f - (rpm - spec.redlineRpm) / 900.0f);
    return spec.maxTorque * t;
}

// ------------------------------------------------------------------ step
void Vehicle::step(float dt, const WorldQuery& world) {
    // internal substepping for tire/wheel stability
    int nsub = std::max(1, (int)std::ceil(dt / 0.0025f));
    nsub = std::min(nsub, 12);
    float h = dt / (float)nsub;
    for (int s = 0; s < nsub; s++) {
        // ---- orientation basis
        forward = orientation.transformDir(Vec3(1, 0, 0)).normalized();
        up = orientation.transformDir(Vec3(0, 1, 0)).normalized();
        right = orientation.transformDir(Vec3(0, 0, 1)).normalized();

        Vec3 com = comWorld();
        Vec3 force(0, -9.81f * spec.mass, 0);
        Vec3 torque(0, 0, 0);
        dbgTireLongN = dbgTireLatN = 0.0f;

        if (shiftTimer > 0) shiftTimer -= h;

        // ---------------- drivetrain / engine ----------------
        float drivenSpin = 0;
        int drivenCount = 0;
        for (size_t i = 0; i < wheels.size(); i++) {
            if (wheelSpecs[i].driven) { drivenSpin += std::fabs(wheels[i].spinVel); drivenCount++; }
        }
        if (drivenCount == 0) { drivenCount = 1; }
        drivenSpin /= (float)drivenCount;
        float r = wheelRadiusAvg();
        float ratio = std::fabs(gearRatio()) * spec.finalDrive;
        float wheelRpm = drivenSpin * 60.0f / (2.0f * PI);
        float rpmFromWheels = wheelRpm * ratio;
        // road-speed rpm (used for gearbox decisions so wheelspin cannot make it hunt)
        float roadRpm = std::fabs(forwardSpeed()) / (2.0f * PI * r) * 60.0f * ratio;

        bool shifting = shiftTimer > 0.0f;
        float throttle = clampf(input.throttle, 0.0f, 1.0f);
        float brakeInput = clampf(input.brake, 0.0f, 1.0f);

        const float ws_rpm_scale = 60.0f / (2.0f * PI) * ratio;
        // ---- clutch / engine speed ----
        // The clutch slips below ~1.25x idle: the engine can then free-rev with
        // throttle (launch) instead of being pinned to the road speed.
        float lockRpm = roadRpm;
        bool clutchSlip = lockRpm < spec.idleRpm * 1.25f;
        if (clutchSlip && !shifting) {
            float targetRpm = spec.idleRpm + throttle * (spec.redlineRpm * 0.62f - spec.idleRpm);
            engineRpm = damp(engineRpm, targetRpm, 7.5f, h);
        } else {
            // engine speed tracks the driven wheels (wheelspin revs the engine),
            // but never sits below the road-speed implied rpm
            float spinRpm = std::max(0.0f, std::fabs(wheels.empty() ? 0.0f : (wheels[wheelSpecs.size()-1].spinVel)) * ws_rpm_scale);
            float targetRpm = std::max(spec.idleRpm, std::max(lockRpm, spinRpm));
            float response = 16.0f + 30.0f * (1.0f - spec.turboLag);
            engineRpm = damp(engineRpm, targetRpm, response, h);
        }
        engineRpm = clampf(engineRpm, spec.idleRpm * 0.85f, spec.redlineRpm * 1.02f);
        float clutch = 1.0f;

        // turbo spool
        float spoolTarget = clampf(engineRpm / std::max(1500.0f, spec.peakRpm), 0.0f, 1.0f) * throttle;
        turboSpool = moveTowards(turboSpool, spoolTarget, h / std::max(0.08f, spec.turboLag) * 1.4f);

        float torqueCurve = engineTorqueAt(engineRpm);
        float boost = 1.0f + spec.turboBoost * turboSpool * 0.9f;
        float engineTorque = torqueCurve * throttle * boost * clutch;
        if (shifting) engineTorque = 0.0f;
        if (revLimiterTimer > 0) { engineTorque = 0.0f; revLimiterTimer -= h; }
        if (engineRpm > spec.redlineRpm) { revLimiterTimer = 0.06f; }
        // engine braking when off throttle
        if (throttle < 0.05f && std::fabs(forwardSpeed()) > 1.5f) {
            engineTorque -= spec.engineBrakeTorque * clampf(engineRpm / spec.redlineRpm, 0.2f, 1.0f);
        }

        float axleTorque = engineTorque * gearRatio() * spec.finalDrive * spec.drivetrainEfficiency;
        driveTorqueApplied = axleTorque;
        float splitFront = spec.drivetrain == Drivetrain::FWD ? 1.0f :
                           (spec.drivetrain == Drivetrain::RWD ? 0.0f : clampf(spec.torqueSplitFront, 0.05f, 0.95f));
        int frontDriven = 0, rearDriven = 0;
        for (size_t i = 0; i < wheels.size(); i++) if (wheelSpecs[i].driven) {
            if (wheelSpecs[i].front) frontDriven++; else rearDriven++;
        }
        // ---- automatic gearbox (with hysteresis so it never hunts) ----
        if (shiftCooldown > 0.0f) shiftCooldown -= h;
        if (autoTransmission && input.targetGear < 0 && shiftTimer <= 0.0f && shiftCooldown <= 0.0f) {
            float red = spec.redlineRpm;
            float upThresh = red * (throttle > 0.4f ? 0.52f : 0.62f);
            float downThresh = red * (throttle > 0.6f ? 0.46f : 0.30f);
            if (gear == 0) {
                if (velocity.dot(forward) > 0.5f) { gear = 1; shiftTimer = spec.shiftTime; shiftCooldown = 0.4f; }
            } else if (!clutchSlip && gear < spec.gearCount && roadRpm > upThresh && forwardSpeed() > 3.0f) {
                // shift where the next gear delivers more wheel torque
                float ratioCur = gearRatio();
                float ratioNext = spec.gearRatios[gear];
                float rpmAfter = roadRpm * ratioNext / ratioCur;
                bool stronger = engineTorqueAt(rpmAfter) * ratioNext >= engineTorqueAt(roadRpm) * ratioCur * 0.995f;
                if (rpmAfter > red * 0.42f && (stronger || roadRpm > red * 0.94f)) {
                    gear++; shiftTimer = spec.shiftTime; shiftCooldown = 0.55f;
                }
            } else if (gear > 1 && roadRpm < downThresh) {
                float rpmAfter = roadRpm * spec.gearRatios[gear - 2] / gearRatio();
                if (rpmAfter < red * 0.80f) { gear--; shiftTimer = spec.shiftTime * 0.7f; shiftCooldown = 0.65f; }
            }
        } else if (input.targetGear >= 0 && input.targetGear != gear && shiftTimer <= 0.0f) {
            gear = clampf((float)input.targetGear, 0.0f, (float)spec.gearCount);
            shiftTimer = spec.shiftTime;
            shiftCooldown = 0.35f;
        }

        // ---------------- per wheel ----------------
        float totalLoad = 0.0f;
        Vec3 suspForceVec(0, 0, 0);
        float avgDriveSlip = 0.0f;
        for (size_t i = 0; i < wheels.size(); i++) {
            WheelSpec& ws = wheelSpecs[i];
            WheelState& w = wheels[i];
            Vec3 attachLocal = ws.pos;
            Vec3 attachWorld = position + orientation.transformDir(attachLocal);
            float rayLen = ws.radius + spec.suspTravel;
            // raycast downward against the terrain
            Vec3 rayDir = -up;
            float tHit = -1.0f;
            float t = 0.0f;
            for (int it = 0; it < 5; it++) {
                Vec3 p = attachWorld + rayDir * t;
                float gh = world.heightAt(p.x, p.z);
                float d = p.y - gh;
                if (d <= 0.0f) { tHit = t; break; }
                t += d / std::max(0.25f, -rayDir.y);
                if (t > rayLen) break;
            }
            if (tHit < 0.0f) tHit = rayLen + 1.0f;

            bool grounded = tHit <= rayLen;
            w.grounded = grounded;
            if (!grounded) {
                w.suspCompression = moveTowards(w.suspCompression, 0.0f, h * 2.0f);
                w.load = 0.0f;
                w.skid = moveTowards(w.skid, 0.0f, h * 2.0f);
                w.surfaceFriction = 1.0f;
                // free-spinning wheel slowly returns to rolling speed
                float brakeT = brakeInput * spec.brakeTorque * 0.5f * (ws.front ? spec.brakeBias : (1 - spec.brakeBias));
                w.spinVel = moveTowards(w.spinVel, 0.0f, (brakeT / std::max(0.2f, ws.inertia)) * h);
                w.spinAngle += w.spinVel * h;
                w.worldPos = attachWorld + rayDir * (ws.radius + spec.suspTravel * (1.0f - w.suspCompression));
                continue;
            }

            Vec3 contact = rayDir * tHit + attachWorld;
            Surface surf = world.surfaceAt(contact.x, contact.z);
            w.surface = surf;
            w.contactPoint = contact;
            w.contactNormal = up; // simple: terrain normal approximated from car up for stability
            float groundCompression = clampf(rayLen - tHit, 0.0f, spec.suspTravel * 1.25f);
            float prevComp = w.suspCompression;
            w.suspCompression = clampf(groundCompression / std::max(0.02f, spec.suspTravel), 0.0f, 1.25f);
            float compVel = (w.suspCompression - prevComp) * spec.suspTravel / h;
            compVel = clampf(compVel, -4.0f, 4.0f);
            w.suspVel = compVel;
            w.worldPos = attachWorld - up * std::max(0.0f, tHit - ws.radius);

            float stiffness = ws.front ? spec.suspStiffnessFront : spec.suspStiffnessRear;
            float damping = ws.front ? spec.suspDampingFront : spec.suspDampingRear;
            float compRatio = groundCompression / std::max(0.02f, spec.suspTravel);
            float bumpStop = 1.0f + 4.0f * compRatio * compRatio * (compRatio > 1.0f ? 1.0f : 0.0f);
            float springForce = stiffness * groundCompression * bumpStop + damping * compVel;
            // anti-roll bars
            int mate = -1;
            for (size_t j = 0; j < wheels.size(); j++) {
                if (j != i && wheelSpecs[j].front == ws.front && wheelSpecs[j].left != ws.left) { mate = (int)j; break; }
            }
            if (mate >= 0) {
                float arb = ws.front ? spec.antiRollFront : spec.antiRollRear;
                float diff = (w.suspCompression - wheels[mate].suspCompression) * spec.suspTravel;
                springForce += arb * diff;
                springForce = std::max(0.0f, springForce);
            }
            float maxSpring = spec.mass * 9.81f * 2.2f;
            springForce = clampf(springForce, 0.0f, maxSpring);
            w.load = springForce;
            totalLoad += springForce;
            Vec3 contactRel = contact - com;
            force += up * springForce;
            torque += contactRel.cross(up * springForce);

            // per-wheel surface grip
            const SurfaceInfo& si = surfaceInfo(surf);
            float wetScale = 1.0f;
            if (surf == Surface::AsphaltWet) wetScale = spec.wetGripScale;
            if (surf == Surface::Snow) wetScale = spec.snowGripScale;
            float mu = si.friction * wetScale;
            // lateral and longitudinal peak multipliers (combined-slip ellipse below)
            float muLat = mu * spec.gripLat;
            float muLong = mu * spec.gripLong;
            w.surfaceFriction = mu;

            // wheel directions
            float steerAng = w.steerAngle;
            Mat4 steerRot = Mat4::rotationY(steerAng);
            Vec3 fw = (orientation * steerRot).transformDir(Vec3(1, 0, 0)).normalized();
            Vec3 lat = fw.cross(up).normalized();
            // velocity at contact patch
            Vec3 rel = contact - com;
            Vec3 vPt = velocity + angularVel.cross(rel);
            float vLong = vPt.dot(fw);
            float vLat = vPt.dot(lat);

            float Fz = springForce;
            float maxF = mu * Fz;
            float maxFlat = muLat * Fz, maxFlong = muLong * Fz;
            // slip angle
            float slipAngle = std::atan2(vLat, std::max(1.2f, std::fabs(vLong)));
            w.slipAngle = slipAngle;
            float latForce = -signf(slipAngle) * maxFlat * tireCurve(slipAngle, spec.tirePeakSlipAngle);
            latForce = clampf(latForce, -maxFlat * 1.15f, maxFlat * 1.15f);

            // longitudinal: wheel spin vs ground
            float wheelSurfaceSpeed = w.spinVel * ws.radius;
            float refSpeed = std::max(2.0f, std::max(std::fabs(vLong), std::fabs(wheelSurfaceSpeed)));
            float targetSlipRatio = (wheelSurfaceSpeed - vLong) / refSpeed;
            w.slipRatio = damp(w.slipRatio, clampf(targetSlipRatio, -1.5f, 1.5f), 60.0f, h);
            float longForce = signf(w.slipRatio) * maxFlong * tireCurve(w.slipRatio, spec.tirePeakSlipRatio);
            longForce = clampf(longForce, -maxFlong * 1.15f, maxFlong * 1.15f);

            // combined slip friction ellipse
            float ux = longForce / std::max(1.0f, maxFlong);
            float uy = latForce / std::max(1.0f, maxFlat);
            float mag = std::sqrt(ux * ux + uy * uy);
            if (mag > 1.0f) { longForce /= mag; latForce /= mag; }
            // low-speed stabilization: damp lateral creep
            float speedDamp = clampf(std::fabs(vLong) / 2.0f, 0.0f, 1.0f);
            latForce *= lerpf(0.55f, 1.0f, speedDamp);

            Vec3 tireForce = fw * longForce + lat * latForce;
            dbgTireLongN += longForce;
            if (i < 8) { dbgWheelLong[i] = longForce; dbgWheelSlip[i] = w.slipRatio; }
            dbgTireLatN += latForce;
            force += tireForce;
            torque += contact.cross(tireForce) - com.cross(tireForce);

            // skid intensity for effects
            float scrub = clampf((mag - 0.86f) / 0.35f, 0.0f, 1.0f);
            w.skid = damp(w.skid, scrub, 18.0f, h);

            // ---- wheel spin dynamics
            float driveTorque = 0.0f;
            if (ws.driven && !shifting) {
                float share = ws.front ? (frontDriven ? splitFront / frontDriven : 0.0f)
                                       : (rearDriven ? (1.0f - splitFront) / rearDriven : 0.0f);
                if (spec.drivetrain == Drivetrain::RWD) share = rearDriven ? 1.0f / rearDriven : 0.0f;
                if (spec.drivetrain == Drivetrain::FWD) share = frontDriven ? 1.0f / frontDriven : 0.0f;
                driveTorque = axleTorque * share;
                // limited slip: bias torque toward the slower wheel
                if (spec.limitedSlip > 0.01f) {
                    for (size_t j = 0; j < wheels.size(); j++) {
                        if (j == i || !wheelSpecs[j].driven) continue;
                        if (wheelSpecs[j].front != ws.front) continue;
                        float d = w.spinVel - wheels[j].spinVel;
                        driveTorque -= d * spec.limitedSlip * 8.0f;
                    }
                }
            }
            float brakeT = 0.0f;
            if (brakeInput > 0.01f) {
                brakeT = brakeInput * spec.brakeTorque * (ws.front ? spec.brakeBias / std::max(1, frontDriven + 2) * 2.0f
                                                                : (1.0f - spec.brakeBias) / std::max(1, rearDriven + 2) * 2.0f);
                // ABS: reduce brake if wheel is locking
                if (spec.absAssist > 0.0f) {
                    float absPenalty = clampf((std::fabs(w.slipRatio) - 0.25f) / 0.5f, 0.0f, 1.0f);
                    brakeT *= 1.0f - absPenalty * spec.absAssist * 0.85f;
                }
            }
            if (input.handbrake > 0.01f && !ws.front) {
                brakeT += input.handbrake * spec.handbrakeTorque * 0.5f;
            }
            // TCS: cut drive torque on excessive wheelspin
            if (spec.tractionControl > 0.01f && ws.driven) {
                float excess = clampf((std::fabs(targetSlipRatio) - spec.tirePeakSlipRatio) * 3.5f, 0.0f, 1.0f);
                driveTorque *= 1.0f - excess * spec.tractionControl * 0.95f;
            }
            float netTorque = driveTorque - longForce * ws.radius;
            // engine + gearbox inertia reflected through the final drive limits
            // how violently a driven wheel can spin up
            float effInertia = ws.inertia;
            if (ws.driven) effInertia += spec.engineInertia * ratio * ratio / (float)std::max(1, drivenCount);
            float accel = netTorque / std::max(0.15f, effInertia);
            w.spinVel += accel * h;
            // brakes act against rotation direction
            if (brakeT > 0.0f) {
                float decel = brakeT / std::max(0.15f, ws.inertia) * h;
                if (std::fabs(w.spinVel) <= decel) w.spinVel = 0.0f;
                else w.spinVel -= signf(w.spinVel) * decel;
            }
            // rolling resistance on loose surfaces
            w.spinVel -= w.spinVel * si.rollingDrag * 0.02f * h * 10.0f;
            w.spinAngle += w.spinVel * h;
            if (ws.driven) avgDriveSlip += std::fabs(w.slipRatio);
        }
        if (drivenCount > 0) avgDriveSlip /= (float)std::max(1, drivenCount);

        // steering: rate-limited, speed sensitive, with countersteer blend
        float curSpeedKph = speedKph();
        float steerLimit = spec.maxSteerDeg * DEG;
        float speedFactor = 1.0f / (1.0f + curSpeedKph * 0.0075f);
        steerLimit *= lerpf(1.0f, speedFactor, 0.85f);
        float targetSteer = -clampf(input.steer, -1.0f, 1.0f) * steerLimit;
        // assist: add a bit of opposite lock when the car is oversteering hard
        if (spec.stabilityAssist > 0.01f) {
            float yawRate = angularVel.dot(up);
            targetSteer += clampf(-yawRate * 0.12f, -0.25f, 0.25f) * spec.stabilityAssist;
        }
        float steerDelta = (targetSteer - (wheels.empty() ? 0.0f : wheels[0].steerAngle));
        float maxDelta = spec.steerRate * 2.6f * h;
        float applied = clampf(steerDelta, -maxDelta, maxDelta);
        for (size_t i = 0; i < wheels.size(); i++) {
            if (!wheelSpecs[i].steered) continue;
            wheels[i].steerAngle += applied;
            // ackermann: inner wheel steers more
            if (wheels.size() >= 2) {
                float ack = applied * spec.ackermann * (wheelSpecs[i].left ? 1.0f : -1.0f);
                wheels[i].steerAngle += ack;
            }
            wheels[i].steerAngle = clampf(wheels[i].steerAngle, -steerLimit * 1.15f, steerLimit * 1.15f);
        }

        // aerodynamic drag + downforce
        Vec3 vdir = velocity.normalized();
        float v2 = velocity.lengthSq();
        float rho = 1.225f;
        if (v2 > 0.01f) {
            float drag = 0.5f * rho * spec.dragArea * v2;
            dbgDragN = drag;
            force -= vdir * drag;
            float lift = 0.5f * rho * (spec.downforceFront + spec.downforceRear) * v2;
            dbgDownforceN = lift;
            force -= up * lift;
        }
        // rolling resistance / drivetrain drag
        // rolling resistance: roughly Crr * weight, scaled by the surface under the wheels
        float surfRoll = 0.0f; int rollN = 0;
        for (auto& w : wheels) if (w.grounded) { surfRoll += surfaceInfo(w.surface).rollingDrag; rollN++; }
        if (rollN > 0) surfRoll /= (float)rollN; else surfRoll = 1.0f;
        float rollForce = spec.mass * 9.81f * 0.013f * surfRoll;
        dbgRollN = rollForce;
        if (velocity.lengthSq() > 0.01f) force -= velocity.normalized() * rollForce;

        // body tilt from suspension load difference (visual + aero stability)
        // (handled by torque from spring forces above)

        // stability assist: damp yaw rate above a threshold
        if (spec.stabilityAssist > 0.01f) {
            float targetYaw = clampf(velocity.dot(right) * -0.9f, -1.2f, 1.2f);
            float yawErr = angularVel.dot(up) - targetYaw;
            torque += up * (-yawErr * 2600.0f * spec.stabilityAssist);
        }

        // ---------------- world collision ----------------
        {
            Vec3 pts[5] = {
                position + orientation.transformDir(Vec3(spec.dims.x * 0.46f, 0.60f, 0)),
                position + orientation.transformDir(Vec3(-spec.dims.x * 0.46f, 0.60f, 0)),
                position + orientation.transformDir(Vec3(0, 0.60f, spec.dims.z * 0.46f)),
                position + orientation.transformDir(Vec3(0, 0.60f, -spec.dims.z * 0.46f)),
                position + orientation.transformDir(Vec3(0, spec.dims.y * 0.5f, 0))
            };
            for (int p = 0; p < 5; p++) {
                Vec3 n; float pen = 0;
                if (world.collideSphere(pts[p], 0.34f, n, pen)) {
                    position += n * std::min(pen, 0.5f);
                    float vn = velocity.dot(n);
                    if (vn < 0) {
                        Vec3 imp = n * (-vn * spec.mass * 0.85f);
                        velocity += imp / spec.mass;
                        Vec3 rel2 = pts[p] - com;
                        torque += rel2.cross(imp) * 0.55f;
                    }
                    velocity *= 0.985f;
                }
            }
        }

        integrateBody(h, force, torque, com);
    }
}

void Vehicle::integrateBody(float dt, const Vec3& force, const Vec3& torque, const Vec3& com) {
    Vec3 accel = force / spec.mass;
    velocity += accel * dt;
    position += velocity * dt;

    // angular: torque about COM -> body-space angular acceleration
    Mat4 Rt = orientation.transposed();
    Vec3 tb = Rt.transformDir(torque);
    Vec3 wb = Rt.transformDir(angularVel);
    Vec3 alpha(tb.x * inertiaInv.x, tb.y * inertiaInv.y, tb.z * inertiaInv.z);
    wb += alpha * dt;
    // damping
    wb *= (1.0f - 1.5f * dt);
    angularVel = orientation.transformDir(wb);

    float wlen = angularVel.length();
    if (wlen > 1e-6f) {
        Mat4 dR = Mat4::axisAngle(angularVel / wlen, wlen * dt);
        orientation = dR * orientation;
        // re-orthonormalise
        Vec3 x = orientation.transformDir(Vec3(1, 0, 0)).normalized();
        Vec3 y = orientation.transformDir(Vec3(0, 1, 0));
        Vec3 z = x.cross(y).normalized();
        y = z.cross(x).normalized();
        orientation.at(0,0) = x.x; orientation.at(1,0) = x.y; orientation.at(2,0) = x.z;
        orientation.at(0,1) = y.x; orientation.at(1,1) = y.y; orientation.at(2,1) = y.z;
        orientation.at(0,2) = z.x; orientation.at(1,2) = z.y; orientation.at(2,2) = z.z;
        orientation.at(0,3) = orientation.at(1,3) = orientation.at(2,3) = 0.0f;
    }
    (void)com;
}

void Vehicle::applyImpulse(const Vec3& worldPos, const Vec3& impulse) {
    velocity += impulse / spec.mass;
    Vec3 rel = worldPos - comWorld();
    Vec3 tb = orientation.transposed().transformDir(rel.cross(impulse));
    Vec3 wb = orientation.transposed().transformDir(angularVel);
    wb += Vec3(tb.x * inertiaInv.x, tb.y * inertiaInv.y, tb.z * inertiaInv.z);
    angularVel = orientation.transformDir(wb);
}

float Vehicle::avgDrivenSlip() const {
    float s = 0; int n = 0;
    for (size_t i = 0; i < wheels.size(); i++) if (wheelSpecs[i].driven) { s += std::fabs(wheels[i].slipRatio); n++; }
    return n ? s / n : 0.0f;
}

float Vehicle::bodyRoll() const {
    // roll angle from up vector relative to world up
    Vec3 fwdFlat(forward.x, 0, forward.z);
    if (fwdFlat.lengthSq() < 1e-5f) return 0.0f;
    fwdFlat = fwdFlat.normalized();
    Vec3 rightFlat = fwdFlat.cross(Vec3(0, 1, 0)).normalized();
    return std::atan2(up.dot(rightFlat), up.dot(Vec3(0, 1, 0)));
}

float Vehicle::bodyPitch() const {
    Vec3 fwdFlat(forward.x, 0, forward.z);
    if (fwdFlat.lengthSq() < 1e-5f) return 0.0f;
    fwdFlat = fwdFlat.normalized();
    return std::atan2(up.dot(fwdFlat), up.dot(Vec3(0, 1, 0)));
}

} // namespace hv
