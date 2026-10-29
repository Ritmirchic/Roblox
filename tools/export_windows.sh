#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GODOT_BIN="${GODOT_BIN:-}"
if [[ -z "$GODOT_BIN" ]]; then
  for candidate in godot godot4; do
    if command -v "$candidate" >/dev/null 2>&1; then GODOT_BIN="$(command -v "$candidate")"; break; fi
  done
fi
if [[ -z "$GODOT_BIN" || ! -x "$GODOT_BIN" ]]; then
  echo "Godot 4.x was not found. Install Godot and its matching Windows export templates, then rerun." >&2
  exit 2
fi
mkdir -p "$ROOT/build"
"$GODOT_BIN" --headless --editor --path "$ROOT/project" --import
"$GODOT_BIN" --headless --path "$ROOT/project" --export-release "Windows Desktop" "$ROOT/build/HORIZON_VELOCITY.exe"
test -s "$ROOT/build/HORIZON_VELOCITY.exe"
echo "Exported Windows build: $ROOT/build/HORIZON_VELOCITY.exe"
if [[ -s "$ROOT/build/HORIZON_VELOCITY.pck" ]]; then
  echo "Companion game data: $ROOT/build/HORIZON_VELOCITY.pck"
else
  echo "Game data appears embedded in the executable."
fi
echo "Requires an actual Windows run / smoke test before distribution."
