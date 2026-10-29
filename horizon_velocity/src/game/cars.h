// HORIZON VELOCITY - vehicle catalogue and procedural vehicle modelling
#pragma once
#include "sim/vehicle.h"
#include "render/mesh.h"
#include "render/gfx.h"
#include <string>
#include <vector>

namespace hv {

enum class CarClass : uint8_t {
    Hatch = 0, Sedan, Muscle, Classic, SportsCoupe, European, Supercar, Hypercar,
    Rally, SUV, Pickup, TrackCar, Electric, VintageRacer, Count
};
const char* carClassName(CarClass c);

struct PaintColor {
    const char* name;
    uint32_t hex;
    float metallic = 0.75f;
    float clearcoat = 1.0f;
};

// A cross-section station along the body (t = 0 rear .. 1 front).
struct BodyStation {
    float t;
    float halfWidth;   // metres
    float topY;        // upper surface height
    float bottomY;     // lower surface height
};

struct BodyStyle {
    // profile spine
    float length = 4.5f;
    std::vector<BodyStation> stations;
    float wheelbase = 2.6f;
    float trackWidth = 1.6f;
    float wheelRadius = 0.34f;
    float tireWidth = 0.24f;
    float frontAxleT = 0.78f;   // axle position as fraction of length (0 rear .. 1 front)
    // greenhouse
    float cabinRearT = 0.30f;
    float cabinFrontT = 0.66f;
    float beltlineY = 0.92f;
    float roofHalfWidthFactor = 0.80f;
    float windshieldRake = 0.55f;   // horizontal run per vertical rise
    float rearGlassRake = 0.75f;
    // features
    float fenderFlare = 0.0f;
    float spoilerHeight = 0.0f;
    float spoilerWidth = 0.0f;
    float splitterDepth = 0.0f;
    float diffuserHeight = 0.0f;
    float hoodScoop = 0.0f;
    float rideHeight = 0.13f;
    float groundClearance = 0.12f;
    bool offroad = false;
    bool pickup = false;
    bool openWheel = false;
    float exhaustY = 0.30f;
    int grilleStyle = 0;
    float headlightY = 0.62f;
    float headlightX = 0.96f;
    float taillightY = 0.72f;
    float roofLineOffset = 0.0f;  // targa / open top
    float interiorWidth = 0.72f;
    int interiorStyle = 0;        // 0 = road car, 1 = race
};

struct CarDef {
    std::string id;
    std::string name;
    std::string brand;
    CarClass carClass = CarClass::Sedan;
    BodyStyle style;
    VehicleSpec spec;
    std::vector<PaintColor> palette;
    std::vector<std::string> decalOptions;
    int price = 60000;
    int unlockLevel = 0;
    std::string blurb;
    float drivetrainLabel = 0.0f;
    // engine character for the audio synth
    int cylinders = 6;
    float engineRpmPeak = 4600.0f;
    int engineLayout = 0; // 0 = V8, 1 = inline-6, 2 = flat-6, 3 = inline-4, 4 = V12, 5 = electric
};

struct CarVisual {
    Mesh body;             // paint, glass, trim, lights, interior
    Mesh wheel;            // one wheel (local +z = axle), mirrored per side
    Mesh steeringWheel;
    Mesh needleSpeed;
    Mesh needleRpm;
    Vec3 steeringWheelPos;
    Vec3 needlePos;
    float wheelRadius = 0.34f;
    std::vector<Vec3> wheelPositions;   // local, in the same order as the Vehicle wheel specs
    std::vector<bool> wheelLeft;
    int paintMaterial = -1;
    int paintMaterialAlt = -1;
    AABB bounds;
    int triCount = 0;
};

// material registry
void initVehicleMaterials();
int matPaint(const PaintColor& c, const char* name = "paint");
int matNamed(const char* name);
int texNamed(const char* name);

CarVisual buildCarVisual(const CarDef& def, float detailScale = 1.0f, bool withDetails = true);
const std::vector<CarDef>& carCatalogue();
const CarDef* findCar(const std::string& id);
std::vector<WheelSpec> makeWheelSpecs(const BodyStyle& s, const VehicleSpec* spec = nullptr);
std::string carClassLabel(CarClass c);

// world/scene materials
void initWorldMaterials();

} // namespace hv
