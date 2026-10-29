// HORIZON VELOCITY - shared material library (vehicles + world)
#pragma once

namespace hv {

struct PaintColor;
int matNamed(const char* name);
int matPaint(const PaintColor& c, const char* name);
int texNamed(const char* name);
void initVehicleMaterials();
// procedural world textures + terrain/road/prop materials
void initWorldMaterials();

} // namespace hv
