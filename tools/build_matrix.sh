#!/usr/bin/env bash
# Run ten independent attempts per supported Windows x64 export variant.
# The four variants execute concurrently; each variant's ten attempts are serial
# to avoid launching 40 memory-heavy Godot exporters at once.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ATTEMPTS="${HV_ATTEMPTS:-10}"
REPORT_DIR="${HV_MATRIX_DIR:-$ROOT/build/matrix}"
mkdir -p "$REPORT_DIR"

run_variant() {
  local preset="$1" mode="$2" slug="$3"
  local success=0 failure=0 attempt output log
  local variant_dir="$REPORT_DIR/$slug"
  mkdir -p "$variant_dir"
  for attempt in $(seq 1 "$ATTEMPTS"); do
    output="$variant_dir/attempt-$(printf '%02d' "$attempt")/HORIZON_VELOCITY.exe"
    log="$variant_dir/attempt-$(printf '%02d' "$attempt").log"
    if HV_PRESET="$preset" HV_EXPORT_MODE="$mode" HV_OUTPUT="$output" \
      "$ROOT/tools/export_windows.sh" >"$log" 2>&1; then
      success=$((success + 1))
      printf 'SUCCESS %s %s attempt %02d: %s\n' "$preset" "$mode" "$attempt" "$output"
    else
      failure=$((failure + 1))
      printf 'FAIL    %s %s attempt %02d: %s\n' "$preset" "$mode" "$attempt" "$(tail -n 1 "$log")"
    fi
  done
  printf '%s | mode=%s | attempts=%s | success=%s | failed=%s\n' \
    "$preset" "$mode" "$ATTEMPTS" "$success" "$failure" >"$variant_dir/summary.txt"
}

run_variant "Windows Desktop (Embedded PCK)" release embedded-release &
run_variant "Windows Desktop (Embedded PCK)" debug embedded-debug &
run_variant "Windows Desktop (External PCK)" release external-release &
run_variant "Windows Desktop (External PCK)" debug external-debug &
wait

cat "$REPORT_DIR"/*/summary.txt 2>/dev/null | sort | tee "$REPORT_DIR/summary.txt"
if grep -Eq 'failed=[1-9][0-9]*' "$REPORT_DIR"/*/summary.txt; then
  echo "At least one Windows export variant failed; inspect $REPORT_DIR for per-attempt logs." >&2
  exit 1
fi
