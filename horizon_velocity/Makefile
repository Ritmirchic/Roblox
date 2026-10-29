# HORIZON VELOCITY build system (Zig as a self-contained C/C++ toolchain)
ZIG      ?= python3 -m ziglang
CXX      := $(ZIG) c++
CXXFLAGS := -std=c++17 -O2 -fno-exceptions -fno-rtti -I src
BUILD    := build

SRC := \
  src/core/math.cpp src/core/noise.cpp \
  src/render/mesh.cpp src/render/sdf.cpp src/render/materials.cpp src/render/gfx_soft.cpp \
  src/sim/vehicle.cpp \
  src/world/terrain.cpp src/world/roads.cpp src/world/worldgen.cpp \
  src/game/cars.cpp src/game/car_list.cpp src/game/game.cpp \
  src/ui/ui.cpp

.PHONY: all test shots replay clean win
all: $(BUILD)/hv_linux

$(BUILD)/hv_linux: $(SRC) src/main.cpp src/platform/platform_null.cpp
	@mkdir -p $(BUILD)
	$(CXX) $(CXXFLAGS) -o $@ src/main.cpp src/platform/platform_null.cpp $(SRC)

$(BUILD)/hv_test: tests/tests.cpp src/sim/vehicle.cpp src/core/math.cpp src/core/noise.cpp
	@mkdir -p $(BUILD)
	$(CXX) $(CXXFLAGS) -o $@ tests/tests.cpp src/sim/vehicle.cpp src/core/math.cpp src/core/noise.cpp

test: $(BUILD)/hv_test
	./$(BUILD)/hv_test

shots: $(BUILD)/hv_linux
	./$(BUILD)/hv_linux --shots out_shots

replay: $(BUILD)/hv_linux
	./$(BUILD)/hv_linux --replay out_replay.csv

# Windows target: requires libraylib.a built for x86_64-windows-gnu (see REPORT.md)
win: $(SRC) src/main.cpp src/platform/platform_win.cpp
	@mkdir -p $(BUILD)
	$(ZIG) c++ -target x86_64-windows-gnu -std=c++17 -O2 -fno-exceptions -fno-rtti -I src -mwindows \
	  -o $(BUILD)/HORIZON_VELOCITY.exe \
	  src/main.cpp src/platform/platform_win.cpp $(SRC) build/libraylib.a \
	  -lopengl32 -lgdi32 -lwinmm -lshell32 -lole32 -luser32

clean:
	rm -rf $(BUILD)
