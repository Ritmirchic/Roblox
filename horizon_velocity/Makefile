# HORIZON VELOCITY build system
# Uses Zig as a self-contained C/C++ toolchain (native Linux + Windows cross-compile).
ZIG      ?= python3 -m ziglang
CXX      := $(ZIG) c++
CXXFLAGS := -std=c++17 -O2 -fno-exceptions -fno-rtti -Wall -Wno-unused-variable -Wno-unused-function \
            -Wno-unused-but-set-variable -I src
LDFLAGS  :=
RAYLIB   ?= /tmp/rlbuild/libraylib.a
SRC_DIR  := src
BUILD    := build

CORE_SRC := \
  $(SRC_DIR)/core/math.cpp \
  $(SRC_DIR)/core/noise.cpp \
  $(SRC_DIR)/render/mesh.cpp \
  $(SRC_DIR)/render/sdf.cpp \
  $(SRC_DIR)/sim/vehicle.cpp \
  $(SRC_DIR)/world/roads.cpp \
  $(SRC_DIR)/world/terrain.cpp \
  $(SRC_DIR)/world/worldgen.cpp \
  $(SRC_DIR)/game/cars.cpp \
  $(SRC_DIR)/game/events.cpp \
  $(SRC_DIR)/game/progression.cpp \
  $(SRC_DIR)/game/save.cpp \
  $(SRC_DIR)/game/ai_racer.cpp \
  $(SRC_DIR)/game/traffic.cpp \
  $(SRC_DIR)/audio/audio.cpp \
  $(SRC_DIR)/ui/ui.cpp \
  $(SRC_DIR)/game/game.cpp \
  $(SRC_DIR)/render/gfx_soft.cpp

.PHONY: all test shots clean win run
all: $(BUILD)/hv_linux

$(BUILD)/hv_linux: $(CORE_SRC) $(SRC_DIR)/main.cpp
	@mkdir -p $(BUILD)
	$(CXX) $(CXXFLAGS) -o $@ $^ $(SRC_DIR)/platform/platform_null.cpp

$(BUILD)/hv_test: $(CORE_SRC) tests/tests.cpp
	@mkdir -p $(BUILD)
	$(CXX) $(CXXFLAGS) -o $@ tests/tests.cpp $(CORE_SRC) $(SRC_DIR)/platform/platform_null.cpp

test: $(BUILD)/hv_test
	./$(BUILD)/hv_test

shots: $(BUILD)/hv_linux
	./$(BUILD)/hv_linux --shots out_shots

win: $(CORE_SRC) $(SRC_DIR)/main.cpp $(SRC_DIR)/platform/platform_win.cpp
	@mkdir -p $(BUILD)
	$(ZIG) c++ -target x86_64-windows-gnu -std=c++17 -O2 -fno-exceptions -fno-rtti \
	  -Wno-unused-variable -Wno-unused-function -I src -mwindows \
	  -o $(BUILD)/HORIZON_VELOCITY.exe \
	  $(SRC_DIR)/main.cpp $(SRC_DIR)/platform/platform_win.cpp $(CORE_SRC) \
	  $(RAYLIB) -lopengl32 -lgdi32 -lwinmm -lshell32 -lole32 -luser32
	@ls -la $(BUILD)/HORIZON_VELOCITY.exe

clean:
	rm -rf $(BUILD)
