#!/bin/bash
# Builds the Linux/headless binary (same sources as the Windows build).
cd "$(dirname "$0")/.."
mkdir -p build
g++ -std=c++17 -O2 -fno-exceptions -fno-rtti -w -Isrc -o build/fracture \
  src/core.cpp src/audio.cpp src/world.cpp src/render.cpp src/physics.cpp src/fx.cpp \
  src/game.cpp src/ui.cpp src/maps.cpp src/missions.cpp src/platform_headless.cpp \
  -lpthread -lm
