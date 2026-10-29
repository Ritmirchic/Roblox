#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENGINE="${GODOT_BIN:-godot}"
if ! command -v "$ENGINE" >/dev/null 2>&1; then
  echo "Godot 4.x was not found. Set GODOT_BIN to the installed Godot executable." >&2
  exit 1
fi
mkdir -p "$ROOT/build"
"$ENGINE" --headless --path "$ROOT" --export-release "Windows Desktop" "$ROOT/build/HORIZON_VELOCITY.exe"
if [[ ! -s "$ROOT/build/HORIZON_VELOCITY.exe" ]]; then
  echo "Export did not create the expected Windows executable." >&2
  exit 1
fi
echo "Created: $ROOT/build/HORIZON_VELOCITY.exe"
