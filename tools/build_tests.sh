#!/bin/bash
cd "$(dirname "$0")/.."
mkdir -p build
g++ -std=c++17 -O1 -g -fno-exceptions -fno-rtti -w -DFRACTURE_NO_MAIN -Isrc -o build/tests \
  src/core.cpp src/audio.cpp src/world.cpp src/render.cpp src/physics.cpp src/fx.cpp \
  src/game.cpp src/ui.cpp src/maps.cpp src/missions.cpp src/platform_headless.cpp \
  tests/tests.cpp -lpthread -lm
