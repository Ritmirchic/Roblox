// HORIZON VELOCITY - AURORA COAST world: terrain, road network, props.
#pragma once
#include "core/math.h"
#include "core/noise.h"
#include "sim/vehicle.h"
#include <string>
#include <vector>

namespace hv {

class Renderer;
struct Camera;

// ---------------------------------------------------------------------------
// Regions of Aurora Coast. The map is 6 km x 6 km and every region is authored
// as a shape in that space rather than stitched from separate maps.
// ---------------------------------------------------------------------------
enum class Region : uint8_t {
    AuroraCity = 0, AzureCoast, SilverMountains, GreenvaleForest,
    RedstoneDesert, GoldenFarmland, FestivalGrounds, MotorsportPark, Count
};
const char* regionName(Region r);
Vec3 regionCenter(Region r);

const char* surfaceName(Surface s);

// ---------------------------------------------------------------------------
// A road is a polyline of evenly spaced samples with a width and a surface.
// ---------------------------------------------------------------------------
struct Road {
    std::string name;
    std::vector<Vec3> pts;      // sampled centre line, y = road surface height
    float halfWidth = 5.0f;
    Surface surface = Surface::Asphalt;
    bool racing = false;        // closed circuit
    bool highway = false;
    float speedLimit = 100.0f;  // km/h, used by traffic + AI
    // nearest point query (linear scan over a coarse index built at load time)
    int nearest(const Vec3& p, float& outT) const;
};

struct Prop {
    Vec3 pos;
    float yaw = 0.0f;
    float scale = 1.0f;
    uint8_t type = 0;           // PropType
    uint8_t variant = 0;
};

enum PropType : uint8_t {
    PropTree = 0, PropPalm, PropRock, PropBuilding, PropLamp, PropSign,
    PropBarrier, PropGrandstand, PropStage, PropContainer, PropKerbBlock, PropCone,
    PropCount
};

// ---------------------------------------------------------------------------
// World: height field + road network + static props. Generation is fully
// deterministic for a given seed, so saves only need the seed.
// ---------------------------------------------------------------------------
struct World {
    static constexpr float SIZE = 6000.0f;     // metres, centred on origin
    static constexpr int GRID = 481;           // height samples per axis
    static constexpr int CHUNKS = 10;          // render chunks per axis
    float cell = SIZE / (GRID - 1);

    std::vector<float> height;                 // GRID*GRID
    std::vector<uint8_t> roadMask;             // 0..255 how much road covers the cell
    std::vector<uint8_t> surfMask;             // Surface per cell
    std::vector<uint8_t> regionMask;           // Region per cell
    std::vector<uint8_t> vegDensity;           // 0..255 for terrain tint + prop scatter
    std::vector<Road> roads;
    // per-cell reference to the nearest road sample, so the physics can drive on
    // the exact road surface instead of the coarse height grid
    std::vector<uint8_t> roadRefId;      // road index + 1, 0 = no road
    std::vector<int32_t> roadRefSample;
    std::vector<Prop> props;
    uint64_t seed = 20261029;

    // statistics filled by generate()
    struct Stats {
        float minH = 0, maxH = 0;
        int roadSamples = 0, propCount = 0, treeCount = 0, buildingCount = 0;
        float roadLengthKm = 0;
    } stats;

    void generate(uint64_t seed);

    // ---- sampling ----
    bool roadSurfaceAt(float x, float z, float& outY) const;
    float heightAt(float x, float z) const;
    Vec3 normalAt(float x, float z) const;
    Surface surfaceAt(float x, float z) const;
    Region regionAt(float x, float z) const;
    bool isRoad(const Vec3& p, float margin = 0.0f) const;
    bool inBounds(float x, float z) const {
        return x > -SIZE * 0.5f + 8 && x < SIZE * 0.5f - 8 && z > -SIZE * 0.5f + 8 && z < SIZE * 0.5f - 8;
    }
    // closest road point (for respawn + minimap); returns false if none within maxDist
    bool nearestRoad(const Vec3& p, Vec3& outPoint, Vec3& outDir, float maxDist = 400.0f) const;

    // ---- rendering ----
    void buildStaticMeshes();                  // terrain chunks + road network, once
    struct DrawStats { int roadTris = 0, waterTris = 0, terrainChunks = 0; };
    void draw(Renderer& r, const Camera& cam, float viewDistance, DrawStats* drawStats = nullptr) const;
    struct Impl;
    Impl* impl = nullptr;
    ~World();
};

// Vehicle-side world adapter (raycast suspension + collisions).
struct WorldQueryImpl : WorldQuery {
    const World* w = nullptr;
    float heightAt(float x, float z) const override { return w->heightAt(x, z); }
    Surface surfaceAt(float x, float z) const override { return w->surfaceAt(x, z); }
    bool collideSphere(const Vec3& c, float radius, Vec3& n, float& pen) const override;
    bool isFree(const Vec3& p, float radius) const override { (void)p; (void)radius; return true; }
};



// implemented in roads.cpp / worldgen.cpp
void buildRoadNetwork(World& w, const Noise& n);
void carveRoads(World& w);
void buildProps(World& w, const Noise& n);
void buildTerrainMesh(World& w);
void buildRoadMeshes(World& w);

} // namespace hv
