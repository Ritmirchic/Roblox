#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENGINE="${GODOT_BIN:-godot}"
MODE="${HV_EXPORT_MODE:-release}"
PRESET="${HV_PRESET:-Windows Desktop (Embedded PCK)}"

case "$MODE" in
  release) EXPORT_FLAG="--export-release" ;;
  debug) EXPORT_FLAG="--export-debug" ;;
  *) echo "HV_EXPORT_MODE must be 'release' or 'debug'." >&2; exit 2 ;;
esac

if ! command -v "$ENGINE" >/dev/null 2>&1; then
  echo "Godot 4.x was not found. Set GODOT_BIN to the installed Godot executable." >&2
  exit 1
fi

case "$PRESET" in
  "Windows Desktop (Embedded PCK)") DEFAULT_OUTPUT="$ROOT/build/embedded/HORIZON_VELOCITY.exe" ;;
  "Windows Desktop (External PCK)") DEFAULT_OUTPUT="$ROOT/build/external/HORIZON_VELOCITY.exe" ;;
  *) echo "Unknown Windows export preset: $PRESET" >&2; exit 2 ;;
esac
OUTPUT="${HV_OUTPUT:-$DEFAULT_OUTPUT}"
mkdir -p "$(dirname "$OUTPUT")"
"$ENGINE" --headless --path "$ROOT" "$EXPORT_FLAG" "$PRESET" "$OUTPUT"
if [[ ! -s "$OUTPUT" ]]; then
  echo "Export did not create the expected executable: $OUTPUT" >&2
  exit 1
fi
echo "Created: $OUTPUT"
