// HORIZON VELOCITY - vehicle catalogue (original brands and models)
#include "game/cars.h"
#include <cstring>

namespace hv {

namespace {

struct StyleParams {
    float length = 4.5f, width = 1.85f, wb = 2.65f, track = 1.60f;
    float wheelR = 0.34f, tireW = 0.25f;
    float rideH = 0.13f, beltY = 0.90f, roofY = 1.30f;
    float deckY = 0.98f, hoodY = 0.92f, noseY = 0.78f, tailY = 0.95f;
    float cabinRearT = 0.30f, cabinFrontT = 0.66f;
    float noseW = 0.86f, tailW = 0.92f;
    float windshieldRake = 0.55f, rearRake = 0.75f;
    float flare = 0.0f, spoilerH = 0.0f, spoilerW = 0.0f;
    float splitter = 0.0f, diffuser = 0.0f, scoop = 0.0f;
    float roofHalf = 0.80f, interiorW = 0.72f;
    int interior = 0;
    bool offroad = false, pickup = false;
    float headY = 0.70f, tailLY = 0.78f, exhaustY = 0.30f;
    int grille = 0;
};

BodyStyle build(const StyleParams& p) {
    BodyStyle s;
    s.length = p.length;
    s.wheelbase = p.wb;
    s.trackWidth = p.track;
    s.wheelRadius = p.wheelR;
    s.tireWidth = p.tireW;
    s.rideHeight = p.rideH;
    s.groundClearance = p.rideH;
    s.beltlineY = p.beltY;
    s.cabinRearT = p.cabinRearT;
    s.cabinFrontT = p.cabinFrontT;
    s.windshieldRake = p.windshieldRake;
    s.rearGlassRake = p.rearRake;
    s.roofHalfWidthFactor = p.roofHalf;
    s.fenderFlare = p.flare;
    s.spoilerHeight = p.spoilerH;
    s.spoilerWidth = p.spoilerW;
    s.splitterDepth = p.splitter;
    s.diffuserHeight = p.diffuser;
    s.hoodScoop = p.scoop;
    s.offroad = p.offroad;
    s.pickup = p.pickup;
    s.interiorStyle = p.interior;
    s.interiorWidth = p.interiorW;
    s.exhaustY = p.exhaustY;
    s.grilleStyle = p.grille;
    s.headlightY = p.headY;
    s.taillightY = p.tailLY;
    const int N = 15;
    // Body width is driven by the track: the arch lips have to sit just proud of
    // the tyres, otherwise the wheels read as recessed wells.
    float halfW = std::min(p.width, p.track + p.tireW + 0.05f) * 0.5f;
    for (int i = 0; i < N; i++) {
        float t = (float)i / (N - 1);
        float topY;
        float c0 = p.cabinRearT, c1 = p.cabinFrontT;
        float midRoof = (c0 + c1) * 0.5f;
        if (t <= c0) {
            // rear deck: low at the tail, rising only as it meets the cabin
            topY = p.tailY + (p.deckY - p.tailY) * std::pow(clampf(t / std::max(0.01f, c0), 0.0f, 1.0f), 2.2f);
        } else if (t <= midRoof) {
            topY = lerpf(p.deckY, p.roofY, smoothstepf(c0, midRoof, t));
        } else if (t <= c1) {
            topY = p.roofY - 0.012f * std::sin((t - midRoof) / std::max(0.01f, c1 - midRoof) * PI);
        } else if (t <= c1 + 0.12f) {
            topY = lerpf(p.roofY, p.hoodY, smoothstepf(c1, c1 + 0.12f, t));
        } else {
            // hood stays flat, then dives to the nose
            float u = clampf((t - c1 - 0.12f) / std::max(0.01f, 0.88f - c1), 0.0f, 1.0f);
            topY = p.hoodY - (p.hoodY - p.noseY) * std::pow(u, 2.4f);
        }
        // width taper
        float w = halfW;
        if (t < 0.14f) w = lerpf(p.tailW * halfW, halfW, smoothstepf(0.0f, 0.14f, t));
        else if (t > 0.86f) w = lerpf(halfW, p.noseW * halfW, smoothstepf(0.86f, 1.0f, t));
        // fender bulges at the axles
        float axleT[2] = {0.5f - p.wb / p.length * 0.5f, 0.5f + p.wb / p.length * 0.5f};
        for (int a = 0; a < 2; a++) {
            float d = (t - axleT[a]) / 0.075f;
            w += halfW * 0.035f * std::exp(-d * d);
        }
        float bottomY = p.rideH + 0.02f;
        if (t < 0.08f) bottomY = p.rideH + 0.05f * (1.0f - t / 0.08f);
        if (t > 0.92f) bottomY = p.rideH + 0.05f * ((t - 0.92f) / 0.08f);
        s.stations.push_back({t, w, topY, bottomY});
    }
    return s;
}

PaintColor pc(const char* name, uint32_t hex, float metallic = 0.78f, float clear = 1.0f) {
    PaintColor c; c.name = name; c.hex = hex; c.metallic = metallic; c.clearcoat = clear; return c;
}

VehicleSpec baseSpec(float mass, float torque, float peakRpm, float redline, int gears,
                     float finalDrive, Drivetrain dt, float dragArea = 0.68f) {
    VehicleSpec s;
    s.mass = mass;
    s.maxTorque = torque;
    s.peakRpm = peakRpm;
    s.redlineRpm = redline;
    s.idleRpm = 800;
    s.gearCount = gears;
    s.finalDrive = finalDrive;
    s.drivetrain = dt;
    s.dragArea = dragArea;
    s.drivetrainEfficiency = 0.90f;
    s.brakeTorque = mass * 6.2f;
    s.handbrakeTorque = mass * 2.2f;
    s.suspStiffnessFront = mass * 29.0f;
    s.suspStiffnessRear = mass * 26.0f;
    s.suspDampingFront = mass * 2.9f;
    s.suspDampingRear = mass * 2.6f;
    s.antiRollFront = mass * 8.2f;
    s.antiRollRear = mass * 6.0f;
    s.tirePeakSlipAngle = 0.145f;
    s.tirePeakSlipRatio = 0.115f;
    s.gripLat = 1.0f;
    s.gripLong = 1.04f;
    s.tractionControl = 0.55f;
    s.absAssist = 0.45f;
    s.stabilityAssist = 0.12f;
    s.engineInertia = 0.18f;
    return s;
}

void setGears(VehicleSpec& s, const float* ratios, int n) {
    for (int i = 0; i < 8; i++) s.gearRatios[i] = i < n ? ratios[i] : 0.0f;
    s.gearCount = n;
}

const float GEARS_6_SPORT[6] = {3.42f, 2.11f, 1.55f, 1.20f, 0.97f, 0.80f};
const float GEARS_6_CLOSE[6] = {3.10f, 2.15f, 1.66f, 1.32f, 1.09f, 0.92f};
const float GEARS_7_DCT[7] = {3.60f, 2.42f, 1.86f, 1.48f, 1.21f, 1.00f, 0.85f};
const float GEARS_6_MUSCLE[6] = {2.90f, 1.86f, 1.38f, 1.10f, 0.90f, 0.76f};
const float GEARS_5_OFFROAD[5] = {4.20f, 2.55f, 1.62f, 1.18f, 0.92f};
const float GEARS_1_EV[1] = {1.0f};

std::vector<CarDef>& catalogueStorage() {
    static std::vector<CarDef> cars;
    return cars;
}

void buildCatalogue() {
    std::vector<CarDef>& C = catalogueStorage();

    // ------------------------------------------------ 1. hot hatch (starter)
    {
        CarDef d;
        d.id = "vento_gt"; d.name = "Vento GT"; d.brand = "AURORA MOTORWORKS";
        d.carClass = CarClass::Hatch; d.price = 28000;
        StyleParams p;
        p.length = 4.05f; p.width = 1.78f; p.wb = 2.58f; p.track = 1.54f;
        p.wheelR = 0.32f; p.tireW = 0.225f; p.rideH = 0.14f; p.beltY = 0.92f;
        p.roofY = 1.46f; p.deckY = 1.20f; p.hoodY = 0.95f; p.noseY = 0.80f; p.tailY = 1.22f;
        p.cabinRearT = 0.26f; p.cabinFrontT = 0.63f; p.noseW = 0.88f; p.tailW = 0.94f;
        p.windshieldRake = 0.72f; p.rearRake = 0.28f; p.roofHalf = 0.86f;
        p.headY = 0.76f; p.tailLY = 0.95f; p.exhaustY = 0.28f;
        d.style = build(p);
        d.spec = baseSpec(1380, 290, 4200, 6600, 6, 3.55f, Drivetrain::FWD, 0.66f);
        setGears(d.spec, GEARS_6_SPORT, 6);
        d.spec.downforceFront = 0.05f; d.spec.downforceRear = 0.08f;
        d.palette = {pc("Aurora Blue", 0x1F5FBF), pc("Pearl White", 0xF2F2F0, 0.35f),
                     pc("Signal Red", 0xC41E24), pc("Graphite", 0x3A3D42)};
        d.decalOptions = {"Clean", "Festival Stripes", "Number Panel"};
        d.blurb = "The friendly front-wheel-drive hot hatch that starts every Horizon Velocity story.";
        d.cylinders = 4; d.engineRpmPeak = 4200; d.engineLayout = 3;
        C.push_back(d);
    }
    // ------------------------------------------------ 2. hot hatch track
    {
        CarDef d;
        d.id = "vento_rs"; d.name = "Vento RS Clubsport"; d.brand = "AURORA MOTORWORKS";
        d.carClass = CarClass::Hatch; d.price = 62000; d.unlockLevel = 2;
        StyleParams p;
        p.length = 4.08f; p.width = 1.83f; p.wb = 2.59f; p.track = 1.57f;
        p.wheelR = 0.325f; p.tireW = 0.245f; p.rideH = 0.105f; p.beltY = 0.90f;
        p.roofY = 1.43f; p.deckY = 1.18f; p.hoodY = 0.93f; p.noseY = 0.76f; p.tailY = 1.20f;
        p.cabinRearT = 0.26f; p.cabinFrontT = 0.63f; p.noseW = 0.90f; p.tailW = 0.95f;
        p.windshieldRake = 0.70f; p.rearRake = 0.28f; p.roofHalf = 0.85f;
        p.flare = 0.055f; p.spoilerH = 0.10f; p.spoilerW = 0.72f; p.splitter = 0.10f; p.diffuser = 0.10f;
        p.headY = 0.74f; p.tailLY = 0.94f; p.interior = 1;
        d.style = build(p);
        d.spec = baseSpec(1330, 340, 4500, 7200, 6, 3.70f, Drivetrain::FWD, 0.70f);
        setGears(d.spec, GEARS_6_CLOSE, 6);
        d.spec.downforceFront = 0.14f; d.spec.downforceRear = 0.22f;
        d.spec.gripLat = 1.10f; d.spec.tractionControl = 0.35f;
        d.palette = {pc("Clubsport Yellow", 0xF0C020), pc("Nardo Grey", 0x9AA0A6),
                     pc("Racing Green", 0x1E5B3C)};
        d.blurb = "Stripped, caged and boosted: the hatch that punches far above its class.";
        d.cylinders = 4; d.engineRpmPeak = 4500; d.engineLayout = 3;
        C.push_back(d);
    }
    // ------------------------------------------------ 3. sports sedan
    {
        CarDef d;
        d.id = "sierra_30t"; d.name = "Sierra 3.0T"; d.brand = "MERIDIAN";
        d.carClass = CarClass::Sedan; d.price = 74000; d.unlockLevel = 1;
        StyleParams p;
        p.length = 4.86f; p.width = 1.86f; p.wb = 2.84f; p.track = 1.61f;
        p.wheelR = 0.34f; p.tireW = 0.245f; p.rideH = 0.135f; p.beltY = 0.94f;
        p.roofY = 1.44f; p.deckY = 1.06f; p.hoodY = 0.98f; p.noseY = 0.80f; p.tailY = 1.02f;
        p.cabinRearT = 0.30f; p.cabinFrontT = 0.64f; p.noseW = 0.90f; p.tailW = 0.93f;
        p.windshieldRake = 0.62f; p.rearRake = 0.55f; p.roofHalf = 0.84f;
        p.headY = 0.76f; p.tailLY = 0.86f;
        d.style = build(p);
        d.spec = baseSpec(1720, 470, 4000, 6800, 7, 3.42f, Drivetrain::AWD, 0.64f);
        setGears(d.spec, GEARS_7_DCT, 7);
        d.spec.torqueSplitFront = 0.40f;
        d.spec.downforceFront = 0.06f; d.spec.downforceRear = 0.14f;
        d.palette = {pc("Glacier Silver", 0xC9CDD2), pc("Midnight Black", 0x14161A),
                     pc("Aurora Blue", 0x2A62C8), pc("Sahara Bronze", 0x8B6A46)};
        d.blurb = "Twin-turbo all-wheel-drive executive express that does everything well.";
        d.cylinders = 6; d.engineRpmPeak = 4000; d.engineLayout = 1;
        C.push_back(d);
    }
    // ------------------------------------------------ 4. European GT
    {
        CarDef d;
        d.id = "corsa_gt"; d.name = "Corsa GT V8"; d.brand = "VELOCITA";
        d.carClass = CarClass::European; d.price = 168000; d.unlockLevel = 3;
        StyleParams p;
        p.length = 4.72f; p.width = 1.93f; p.wb = 2.76f; p.track = 1.66f;
        p.wheelR = 0.345f; p.tireW = 0.285f; p.rideH = 0.115f; p.beltY = 0.88f;
        p.roofY = 1.31f; p.deckY = 1.00f; p.hoodY = 0.90f; p.noseY = 0.66f; p.tailY = 0.98f;
        p.cabinRearT = 0.34f; p.cabinFrontT = 0.60f; p.noseW = 0.92f; p.tailW = 0.95f;
        p.windshieldRake = 0.85f; p.rearRake = 1.15f; p.roofHalf = 0.76f;
        p.flare = 0.05f; p.diffuser = 0.14f; p.splitter = 0.09f; p.headY = 0.62f; p.tailLY = 0.80f;
        d.style = build(p);
        d.spec = baseSpec(1610, 660, 4800, 7600, 7, 3.55f, Drivetrain::RWD, 0.62f);
        setGears(d.spec, GEARS_7_DCT, 7);
        d.spec.downforceFront = 0.16f; d.spec.downforceRear = 0.30f;
        d.spec.gripLat = 1.12f; d.spec.tractionControl = 0.42f;
        d.palette = {pc("Rosso Velocita", 0xB31217), pc("Bianco Pearl", 0xEFEFEA, 0.3f),
                     pc("Blu Notte", 0x16224A), pc("Verde Bosco", 0x24402F)};
        d.blurb = "A long-legged front-mid-engine grand tourer with a screaming V8.";
        d.cylinders = 8; d.engineRpmPeak = 4800; d.engineLayout = 0;
        C.push_back(d);
    }
    // ------------------------------------------------ 5. classic muscle
    {
        CarDef d;
        d.id = "ravager_427"; d.name = "Ravager 427"; d.brand = "CALDERA";
        d.carClass = CarClass::Classic; d.price = 132000; d.unlockLevel = 3;
        StyleParams p;
        p.length = 5.05f; p.width = 1.98f; p.wb = 2.95f; p.track = 1.63f;
        p.wheelR = 0.355f; p.tireW = 0.27f; p.rideH = 0.145f; p.beltY = 1.00f;
        p.roofY = 1.34f; p.deckY = 1.06f; p.hoodY = 1.02f; p.noseY = 0.92f; p.tailY = 1.04f;
        p.cabinRearT = 0.32f; p.cabinFrontT = 0.58f; p.noseW = 0.93f; p.tailW = 0.96f;
        p.windshieldRake = 0.40f; p.rearRake = 0.32f; p.roofHalf = 0.86f;
        p.headY = 0.86f; p.tailLY = 0.92f; p.exhaustY = 0.26f; p.interior = 0;
        d.style = build(p);
        d.spec = baseSpec(1620, 700, 3800, 6200, 4, 3.15f, Drivetrain::RWD, 0.78f);
        float g[4] = {2.52f, 1.60f, 1.18f, 1.0f};
        setGears(d.spec, g, 4);
        d.spec.tractionControl = 0.10f; d.spec.absAssist = 0.0f; d.spec.stabilityAssist = 0.0f;
        d.spec.gripLat = 0.92f; d.spec.gripLong = 0.98f;
        d.spec.downforceFront = 0.0f; d.spec.downforceRear = 0.0f;
        d.spec.engineInertia = 0.30f;
        d.palette = {pc("Satin Black", 0x151515, 0.2f, 0.4f), pc("Caldera Orange", 0xD4610F),
                     pc("Candy Apple Red", 0x8E1418), pc("Grabber Blue", 0x1E86C9)};
        d.blurb = "Big-block, four-speed, no apologies. A corner-carving muscle icon.";
        d.cylinders = 8; d.engineRpmPeak = 3800; d.engineLayout = 0;
        C.push_back(d);
    }
    // ------------------------------------------------ 6. modern muscle
    {
        CarDef d;
        d.id = "ravager_gt"; d.name = "Ravager GT 6.2"; d.brand = "CALDERA";
        d.carClass = CarClass::Muscle; d.price = 96000; d.unlockLevel = 2;
        StyleParams p;
        p.length = 4.98f; p.width = 1.96f; p.wb = 2.87f; p.track = 1.64f;
        p.wheelR = 0.35f; p.tireW = 0.305f; p.rideH = 0.125f; p.beltY = 0.98f;
        p.roofY = 1.38f; p.deckY = 1.04f; p.hoodY = 1.00f; p.noseY = 0.86f; p.tailY = 1.02f;
        p.cabinRearT = 0.30f; p.cabinFrontT = 0.60f; p.noseW = 0.94f; p.tailW = 0.96f;
        p.windshieldRake = 0.52f; p.rearRake = 0.42f; p.roofHalf = 0.87f;
        p.flare = 0.04f; p.spoilerH = 0.05f; p.spoilerW = 0.9f; p.diffuser = 0.10f;
        p.headY = 0.86f; p.tailLY = 0.92f;
        d.style = build(p);
        d.spec = baseSpec(1790, 640, 4400, 6600, 6, 3.28f, Drivetrain::RWD, 0.74f);
        setGears(d.spec, GEARS_6_MUSCLE, 6);
        d.spec.tractionControl = 0.45f;
        d.spec.gripLat = 1.02f; d.spec.gripLong = 1.08f;
        d.spec.downforceFront = 0.04f; d.spec.downforceRear = 0.10f;
        d.palette = {pc("Torch Red", 0xBE1A1E), pc("Apex Black", 0x1A1C1F), pc("Steel Grey", 0x6E7378),
                     pc("Sunburst Yellow", 0xE8B416)};
        d.blurb = "Naturally aspirated V8, rear drive, and a soundtrack you will not forget.";
        d.cylinders = 8; d.engineRpmPeak = 4400; d.engineLayout = 0;
        C.push_back(d);
    }
    // ------------------------------------------------ 7. JDM coupe
    {
        CarDef d;
        d.id = "tensa_r"; d.name = "Tensa R"; d.brand = "KAIZEN";
        d.carClass = CarClass::SportsCoupe; d.price = 82000; d.unlockLevel = 2;
        StyleParams p;
        p.length = 4.42f; p.width = 1.80f; p.wb = 2.58f; p.track = 1.56f;
        p.wheelR = 0.335f; p.tireW = 0.255f; p.rideH = 0.115f; p.beltY = 0.88f;
        p.roofY = 1.29f; p.deckY = 0.98f; p.hoodY = 0.90f; p.noseY = 0.72f; p.tailY = 0.96f;
        p.cabinRearT = 0.30f; p.cabinFrontT = 0.62f; p.noseW = 0.90f; p.tailW = 0.93f;
        p.windshieldRake = 0.66f; p.rearRake = 0.95f; p.roofHalf = 0.79f;
        p.flare = 0.045f; p.spoilerH = 0.08f; p.spoilerW = 0.82f; p.diffuser = 0.12f;
        p.headY = 0.66f; p.tailLY = 0.80f;
        d.style = build(p);
        d.spec = baseSpec(1420, 430, 4800, 7600, 6, 3.90f, Drivetrain::RWD, 0.64f);
        setGears(d.spec, GEARS_6_CLOSE, 6);
        d.spec.tractionControl = 0.35f; d.spec.gripLat = 1.08f;
        d.spec.downforceFront = 0.10f; d.spec.downforceRear = 0.20f;
        d.spec.turboBoost = 0.18f; d.spec.turboLag = 0.35f;
        d.palette = {pc("Bayside Blue", 0x2C4FA3), pc("Championship White", 0xEDEDEA, 0.25f),
                     pc("Midnight Purple", 0x3B2A55), pc("Sonic Silver", 0xA9AEB3)};
        d.blurb = "Turbocharged, rear-drive and endlessly tunable - the drift crowd's favourite.";
        d.cylinders = 4; d.engineRpmPeak = 4800; d.engineLayout = 3;
        C.push_back(d);
    }
    // ------------------------------------------------ 8. JDM AWD flagship
    {
        CarDef d;
        d.id = "tensa_gtx"; d.name = "Tensa GT-X"; d.brand = "KAIZEN";
        d.carClass = CarClass::SportsCoupe; d.price = 118000; d.unlockLevel = 3;
        StyleParams p;
        p.length = 4.58f; p.width = 1.86f; p.wb = 2.68f; p.track = 1.60f;
        p.wheelR = 0.34f; p.tireW = 0.27f; p.rideH = 0.11f; p.beltY = 0.90f;
        p.roofY = 1.32f; p.deckY = 1.00f; p.hoodY = 0.92f; p.noseY = 0.74f; p.tailY = 0.98f;
        p.cabinRearT = 0.30f; p.cabinFrontT = 0.61f; p.noseW = 0.91f; p.tailW = 0.94f;
        p.windshieldRake = 0.68f; p.rearRake = 0.90f; p.roofHalf = 0.80f;
        p.flare = 0.06f; p.spoilerH = 0.10f; p.spoilerW = 0.88f; p.diffuser = 0.14f; p.splitter = 0.06f;
        p.headY = 0.68f; p.tailLY = 0.82f;
        d.style = build(p);
        d.spec = baseSpec(1520, 520, 4200, 7200, 6, 3.85f, Drivetrain::AWD, 0.68f);
        setGears(d.spec, GEARS_6_CLOSE, 6);
        d.spec.torqueSplitFront = 0.35f;
        d.spec.gripLat = 1.14f; d.spec.tractionControl = 0.5f;
        d.spec.downforceFront = 0.16f; d.spec.downforceRear = 0.26f;
        d.spec.turboBoost = 0.22f; d.spec.turboLag = 0.25f;
        d.palette = {pc("Gunmetal Grey", 0x4A4E54), pc("Bayside Blue", 0x2C4FA3),
                     pc("Pearl White", 0xEDEDEA, 0.3f), pc("Sunset Orange", 0xD65A1F)};
        d.blurb = "All-wheel-drive traction with a twin-turbo flat-six punch.";
        d.cylinders = 6; d.engineRpmPeak = 4200; d.engineLayout = 2;
        C.push_back(d);
    }
    // ------------------------------------------------ 9. supercar
    {
        CarDef d;
        d.id = "corsa_super"; d.name = "Corsa Superleggera"; d.brand = "VELOCITA";
        d.carClass = CarClass::Supercar; d.price = 340000; d.unlockLevel = 4;
        StyleParams p;
        p.length = 4.58f; p.width = 2.02f; p.wb = 2.66f; p.track = 1.70f;
        p.wheelR = 0.35f; p.tireW = 0.335f; p.rideH = 0.085f; p.beltY = 0.82f;
        p.roofY = 1.16f; p.deckY = 0.98f; p.hoodY = 0.76f; p.noseY = 0.52f; p.tailY = 0.92f;
        p.cabinRearT = 0.34f; p.cabinFrontT = 0.58f; p.noseW = 0.94f; p.tailW = 0.97f;
        p.windshieldRake = 1.25f; p.rearRake = 1.05f; p.roofHalf = 0.72f;
        p.flare = 0.075f; p.spoilerH = 0.12f; p.spoilerW = 1.0f; p.diffuser = 0.22f; p.splitter = 0.13f;
        p.scoop = 0.20f; p.headY = 0.54f; p.tailLY = 0.72f; p.exhaustY = 0.24f;
        p.interior = 0;
        d.style = build(p);
        d.spec = baseSpec(1430, 720, 6500, 8500, 7, 3.60f, Drivetrain::RWD, 0.72f);
        setGears(d.spec, GEARS_7_DCT, 7);
        d.spec.gripLat = 1.24f; d.spec.gripLong = 1.16f;
        d.spec.suspStiffnessFront = 1430 * 38.0f; d.spec.suspStiffnessRear = 1430 * 34.0f;
        d.spec.downforceFront = 0.42f; d.spec.downforceRear = 0.66f;
        d.spec.tractionControl = 0.4f; d.spec.stabilityAssist = 0.18f;
        d.spec.brakeTorque = 1430 * 8.6f;
        d.palette = {pc("Giallo Corsa", 0xF0B41A), pc("Rosso Fuoco", 0xA81318),
                     pc("Nero Lucido", 0x121316), pc("Bianco Avus", 0xF0EFE9, 0.25f)};
        d.blurb = "Mid-engined, carbon-tubbed and brutally quick on a mountain pass.";
        d.cylinders = 10; d.engineRpmPeak = 6500; d.engineLayout = 0;
        C.push_back(d);
    }
    // ------------------------------------------------ 10. hypercar
    {
        CarDef d;
        d.id = "apex9"; d.name = "Apex-9 Hybrid"; d.brand = "IKON";
        d.carClass = CarClass::Hypercar; d.price = 1250000; d.unlockLevel = 5;
        StyleParams p;
        p.length = 4.72f; p.width = 2.06f; p.wb = 2.72f; p.track = 1.72f;
        p.wheelR = 0.355f; p.tireW = 0.345f; p.rideH = 0.075f; p.beltY = 0.78f;
        p.roofY = 1.10f; p.deckY = 0.94f; p.hoodY = 0.70f; p.noseY = 0.46f; p.tailY = 0.88f;
        p.cabinRearT = 0.34f; p.cabinFrontT = 0.56f; p.noseW = 0.95f; p.tailW = 0.98f;
        p.windshieldRake = 1.35f; p.rearRake = 1.0f; p.roofHalf = 0.70f;
        p.flare = 0.085f; p.spoilerH = 0.20f; p.spoilerW = 1.05f; p.diffuser = 0.26f; p.splitter = 0.16f;
        p.scoop = 0.26f; p.headY = 0.48f; p.tailLY = 0.68f; p.exhaustY = 0.22f;
        d.style = build(p);
        d.spec = baseSpec(1380, 900, 7200, 9000, 7, 3.75f, Drivetrain::AWD, 0.76f);
        setGears(d.spec, GEARS_7_DCT, 7);
        d.spec.torqueSplitFront = 0.28f;
        d.spec.gripLat = 1.32f; d.spec.gripLong = 1.24f;
        d.spec.suspStiffnessFront = 1380 * 44.0f; d.spec.suspStiffnessRear = 1380 * 38.0f;
        d.spec.downforceFront = 0.75f; d.spec.downforceRear = 1.15f;
        d.spec.brakeTorque = 1380 * 10.0f;
        d.spec.tractionControl = 0.5f; d.spec.stabilityAssist = 0.22f;
        d.palette = {pc("Liquid Silver", 0xBFC4CA), pc("Ikon Blue", 0x1552D8),
                     pc("Exposed Carbon", 0x1A1B1E, 0.35f, 0.8f), pc("Sunburst Orange", 0xE2601A)};
        d.blurb = "Hybrid all-wheel drive with active aero - the festival's halo machine.";
        d.cylinders = 12; d.engineRpmPeak = 7200; d.engineLayout = 4;
        C.push_back(d);
    }
    // ------------------------------------------------ 11. rally
    {
        CarDef d;
        d.id = "fjell_rally"; d.name = "Fjell Rally R5"; d.brand = "NORDHAVN";
        d.carClass = CarClass::Rally; d.price = 145000; d.unlockLevel = 3;
        StyleParams p;
        p.length = 4.12f; p.width = 1.86f; p.wb = 2.60f; p.track = 1.62f;
        p.wheelR = 0.315f; p.tireW = 0.225f; p.rideH = 0.185f; p.beltY = 0.92f;
        p.roofY = 1.42f; p.deckY = 1.18f; p.hoodY = 0.96f; p.noseY = 0.82f; p.tailY = 1.16f;
        p.cabinRearT = 0.26f; p.cabinFrontT = 0.62f; p.noseW = 0.90f; p.tailW = 0.94f;
        p.windshieldRake = 0.68f; p.rearRake = 0.30f; p.roofHalf = 0.86f;
        p.flare = 0.075f; p.spoilerH = 0.22f; p.spoilerW = 0.95f; p.diffuser = 0.14f;
        p.headY = 0.80f; p.tailLY = 0.96f; p.interior = 1;
        d.style = build(p);
        d.spec = baseSpec(1290, 480, 4600, 7200, 6, 4.10f, Drivetrain::AWD, 0.72f);
        setGears(d.spec, GEARS_6_CLOSE, 6);
        d.spec.torqueSplitFront = 0.45f;
        d.spec.gripLat = 1.06f; d.spec.gripLong = 1.10f;
        d.spec.suspStiffnessFront = 1290 * 24.0f; d.spec.suspStiffnessRear = 1290 * 22.0f;
        d.spec.suspTravel = 0.26f;
        d.spec.downforceFront = 0.05f; d.spec.downforceRear = 0.12f;
        d.spec.tractionControl = 0.45f;
        d.palette = {pc("Nordhavn Blue", 0x1B4E9C), pc("Snow White", 0xEEEEEA, 0.3f),
                     pc("Rally Yellow", 0xE8C21C, 0.4f)};
        d.blurb = "Long-travel suspension and all-wheel drive built for gravel and snow.";
        d.cylinders = 4; d.engineRpmPeak = 4600; d.engineLayout = 3;
        C.push_back(d);
    }
    // ------------------------------------------------ 12. SUV
    {
        CarDef d;
        d.id = "trailmaster"; d.name = "Trailmaster 4x4"; d.brand = "TERRANOVA";
        d.carClass = CarClass::SUV; d.price = 88000; d.unlockLevel = 2;
        StyleParams p;
        p.length = 4.92f; p.width = 2.00f; p.wb = 2.92f; p.track = 1.68f;
        p.wheelR = 0.40f; p.tireW = 0.28f; p.rideH = 0.24f; p.beltY = 1.12f;
        p.roofY = 1.78f; p.deckY = 1.68f; p.hoodY = 1.12f; p.noseY = 0.98f; p.tailY = 1.62f;
        p.cabinRearT = 0.22f; p.cabinFrontT = 0.64f; p.noseW = 0.94f; p.tailW = 0.96f;
        p.windshieldRake = 0.35f; p.rearRake = 0.18f; p.roofHalf = 0.90f;
        p.offroad = true; p.headY = 0.94f; p.tailLY = 1.10f; p.exhaustY = 0.40f;
        d.style = build(p);
        d.spec = baseSpec(2380, 620, 3600, 6000, 6, 3.55f, Drivetrain::AWD, 0.98f);
        setGears(d.spec, GEARS_5_OFFROAD, 5);
        d.spec.torqueSplitFront = 0.45f;
        d.spec.suspTravel = 0.30f;
        d.spec.suspStiffnessFront = 2380 * 22.0f; d.spec.suspStiffnessRear = 2380 * 20.0f;
        d.spec.gripLat = 0.96f; d.spec.tractionControl = 0.55f;
        d.spec.limitedSlip = 0.4f;
        d.palette = {pc("Desert Sand", 0xB99C6C), pc("Forest Green", 0x2A4232),
                     pc("Arctic White", 0xE9E9E4), pc("Slate Grey", 0x5A6068)};
        d.blurb = "Body-on-frame all-terrain machine that shrugs off dunes and forest tracks.";
        d.cylinders = 6; d.engineRpmPeak = 3600; d.engineLayout = 0;
        C.push_back(d);
    }
    // ------------------------------------------------ 13. pickup
    {
        CarDef d;
        d.id = "hauler_150"; d.name = "Hauler 150 V8"; d.brand = "TERRANOVA";
        d.carClass = CarClass::Pickup; d.price = 76000; d.unlockLevel = 2;
        StyleParams p;
        p.length = 5.42f; p.width = 2.04f; p.wb = 3.42f; p.track = 1.72f;
        p.wheelR = 0.40f; p.tireW = 0.29f; p.rideH = 0.235f; p.beltY = 1.16f;
        p.roofY = 1.86f; p.deckY = 1.20f; p.hoodY = 1.20f; p.noseY = 1.06f; p.tailY = 1.16f;
        p.cabinRearT = 0.24f; p.cabinFrontT = 0.50f; p.noseW = 0.95f; p.tailW = 0.97f;
        p.windshieldRake = 0.32f; p.rearRake = 0.14f; p.roofHalf = 0.92f;
        p.offroad = true; p.pickup = true;
        p.headY = 1.02f; p.tailLY = 1.06f; p.exhaustY = 0.42f;
        d.style = build(p);
        d.spec = baseSpec(2520, 680, 3800, 6200, 6, 3.73f, Drivetrain::AWD, 1.05f);
        setGears(d.spec, GEARS_5_OFFROAD, 5);
        d.spec.torqueSplitFront = 0.42f;
        d.spec.suspTravel = 0.28f;
        d.spec.limitedSlip = 0.55f;
        d.spec.gripLat = 0.94f;
        d.palette = {pc("Workhorse White", 0xE8E8E2), pc("Bronze Ember", 0x9A5C2A),
                     pc("Deep Blue", 0x1F3A63), pc("Matte Black", 0x1C1D1F, 0.2f, 0.35f)};
        d.blurb = "A V8 workhorse that will happily tow your race car, then race it.";
        d.cylinders = 8; d.engineRpmPeak = 3800; d.engineLayout = 0;
        C.push_back(d);
    }
    // ------------------------------------------------ 14. electric
    {
        CarDef d;
        d.id = "lumen_s"; d.name = "Lumen S Performance"; d.brand = "VOLT";
        d.carClass = CarClass::Electric; d.price = 108000; d.unlockLevel = 3;
        StyleParams p;
        p.length = 4.86f; p.width = 1.92f; p.wb = 2.96f; p.track = 1.66f;
        p.wheelR = 0.355f; p.tireW = 0.265f; p.rideH = 0.115f; p.beltY = 0.90f;
        p.roofY = 1.40f; p.deckY = 1.10f; p.hoodY = 0.92f; p.noseY = 0.76f; p.tailY = 1.04f;
        p.cabinRearT = 0.28f; p.cabinFrontT = 0.62f; p.noseW = 0.90f; p.tailW = 0.93f;
        p.windshieldRake = 0.95f; p.rearRake = 0.85f; p.roofHalf = 0.80f;
        p.headY = 0.70f; p.tailLY = 0.84f;
        d.style = build(p);
        d.spec = baseSpec(2120, 780, 2000, 15500, 1, 9.5f, Drivetrain::AWD, 0.60f);
        setGears(d.spec, GEARS_1_EV, 1);
        d.spec.idleRpm = 0.0f;
        d.spec.torqueSplitFront = 0.0f;
        d.spec.torqueSplitFront = 0.35f;
        d.spec.gripLat = 1.12f;
        d.spec.tractionControl = 0.62f;
        d.spec.engineInertia = 0.05f;
        d.spec.downforceFront = 0.04f; d.spec.downforceRear = 0.06f;
        d.palette = {pc("Lumen White", 0xEFEFEA, 0.2f), pc("Voltaic Blue", 0x1E6EE0),
                     pc("Titan Grey", 0x646A70), pc("Midnight", 0x161A21)};
        d.blurb = "Silent, instant and savagely quick off the line. Zero gears, all torque.";
        d.cylinders = 0; d.engineRpmPeak = 2000; d.engineLayout = 5;
        C.push_back(d);
    }
    // ------------------------------------------------ 15. track car
    {
        CarDef d;
        d.id = "apex_trk"; d.name = "Apex Track Special"; d.brand = "IKON";
        d.carClass = CarClass::TrackCar; d.price = 420000; d.unlockLevel = 4;
        StyleParams p;
        p.length = 4.52f; p.width = 2.00f; p.wb = 2.62f; p.track = 1.70f;
        p.wheelR = 0.35f; p.tireW = 0.325f; p.rideH = 0.075f; p.beltY = 0.80f;
        p.roofY = 1.14f; p.deckY = 0.94f; p.hoodY = 0.72f; p.noseY = 0.48f; p.tailY = 0.90f;
        p.cabinRearT = 0.33f; p.cabinFrontT = 0.57f; p.noseW = 0.95f; p.tailW = 0.98f;
        p.windshieldRake = 1.15f; p.rearRake = 0.95f; p.roofHalf = 0.72f;
        p.flare = 0.09f; p.spoilerH = 0.34f; p.spoilerW = 1.15f; p.diffuser = 0.30f; p.splitter = 0.18f;
        p.headY = 0.50f; p.tailLY = 0.70f; p.interior = 1;
        d.style = build(p);
        d.spec = baseSpec(1180, 760, 7000, 8800, 6, 3.90f, Drivetrain::RWD, 0.80f);
        setGears(d.spec, GEARS_7_DCT, 7);
        d.spec.gripLat = 1.40f; d.spec.gripLong = 1.30f;
        d.spec.suspStiffnessFront = 1180 * 52.0f; d.spec.suspStiffnessRear = 1180 * 46.0f;
        d.spec.suspDampingFront = 1180 * 4.6f; d.spec.suspDampingRear = 1180 * 4.2f;
        d.spec.downforceFront = 0.95f; d.spec.downforceRear = 1.45f;
        d.spec.brakeTorque = 1180 * 12.0f;
        d.spec.tractionControl = 0.25f; d.spec.stabilityAssist = 0.05f;
        d.spec.absAssist = 0.25f;
        d.palette = {pc("Exposed Carbon", 0x1A1B1E, 0.4f, 0.7f), pc("Acid Green", 0xB8E01A),
                     pc("Track White", 0xF0F0EC, 0.2f)};
        d.blurb = "No carpet, no compromise: a pure lap-time weapon for the Grand Motorsport Park.";
        d.cylinders = 8; d.engineRpmPeak = 7000; d.engineLayout = 0;
        C.push_back(d);
    }
    // ------------------------------------------------ 16. vintage racer
    {
        CarDef d;
        d.id = "corsa_vintage"; d.name = "Corsa Tipo 250"; d.brand = "VELOCITA";
        d.carClass = CarClass::VintageRacer; d.price = 460000; d.unlockLevel = 5;
        StyleParams p;
        p.length = 4.22f; p.width = 1.70f; p.wb = 2.45f; p.track = 1.42f;
        p.wheelR = 0.33f; p.tireW = 0.185f; p.rideH = 0.15f; p.beltY = 0.86f;
        p.roofY = 1.34f; p.deckY = 0.96f; p.hoodY = 0.88f; p.noseY = 0.72f; p.tailY = 0.94f;
        p.cabinRearT = 0.30f; p.cabinFrontT = 0.58f; p.noseW = 0.86f; p.tailW = 0.90f;
        p.windshieldRake = 0.30f; p.rearRake = 0.28f; p.roofHalf = 0.84f;
        p.headY = 0.78f; p.tailLY = 0.86f; p.exhaustY = 0.30f; p.interior = 1;
        d.style = build(p);
        d.spec = baseSpec(1080, 400, 6000, 8000, 5, 3.70f, Drivetrain::RWD, 0.86f);
        float g5[5] = {2.80f, 1.90f, 1.42f, 1.12f, 0.92f};
        setGears(d.spec, g5, 5);
        d.spec.gripLat = 0.88f; d.spec.gripLong = 0.92f;
        d.spec.tractionControl = 0.0f; d.spec.absAssist = 0.0f; d.spec.stabilityAssist = 0.0f;
        d.spec.brakeTorque = 1080 * 5.0f;
        d.spec.engineInertia = 0.32f;
        d.palette = {pc("Rosso Storico", 0x9C1B18), pc("British Racing Green", 0x123A28),
                     pc("French Blue", 0x22458C)};
        d.blurb = "A hand-built sixties endurance racer with no driver aids whatsoever.";
        d.cylinders = 12; d.engineRpmPeak = 6000; d.engineLayout = 4;
        C.push_back(d);
    }
}

} // namespace

const std::vector<CarDef>& carCatalogue() {
    std::vector<CarDef>& c = catalogueStorage();
    if (c.empty()) buildCatalogue();
    return c;
}

const CarDef* findCar(const std::string& id) {
    for (auto& c : carCatalogue()) if (c.id == id) return &c;
    return nullptr;
}

} // namespace hv
