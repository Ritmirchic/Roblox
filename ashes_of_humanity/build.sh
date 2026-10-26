#!/bin/bash
# =============================================================================
#  ASHES OF HUMANITY: LAST SIGNAL - build script
#  Cross-compiles the native engine to Windows x86-64 with the Zig toolchain.
# =============================================================================
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENGINE="$ROOT/engine"
ZIG="${ZIG:-/home/user/tools/pylibs/ziglang/zig}"
OUT="$ROOT/build"

TARGET="${TARGET:-x86_64-windows-gnu}"
MODE="${MODE:-release}"
EXT="exe"

if [ "$MODE" = "debug" ]; then
  OPT="-O0 -g"
else
  OPT="-O2 -DNDEBUG"
fi

OBJDIR="$OUT/obj-$TARGET"
mkdir -p "$OBJDIR"

echo "=== Ashes of Humanity : Last Signal ==="
echo "target : $TARGET"
echo "mode   : $MODE"
echo "zig    : $($ZIG version)"

# --- Windows libraries -------------------------------------------------------
if [ "$TARGET" = "x86_64-windows-gnu" ]; then
  LIBS="-lopengl32 -lgdi32 -luser32 -lshell32 -lwinmm -ladvapi32 -lole32 -luuid"
  EXTRA=""
else
  LIBS="-lpthread -ldl"
  EXTRA=""
fi

SOURCES=$(find "$ENGINE/src" -name "*.cpp" | sort)
COUNT=$(echo "$SOURCES" | wc -l)
echo "sources: $COUNT"

OBJS=""
FAILED=0
for src in $SOURCES; do
  rel=$(echo "$src" | sed "s|$ENGINE/src/||; s|/|_|g; s|\.cpp$|.o|")
  obj="$OBJDIR/${rel}.o"
  OBJS="$OBJS $obj"
  if [ -f "$obj" ] && [ "$obj" -nt "$src" ] && [ "$FORCE_REBUILD" != "1" ]; then
    continue
  fi
  if ! $ZIG c++ -target "$TARGET" $OPT -std=c++17 -fno-exceptions -fno-rtti \
       -I"$ENGINE/src" -c "$src" -o "$obj" 2>"$OBJDIR/${rel}.err"; then
    echo "--- COMPILE FAILED: $src"
    cat "$OBJDIR/${rel}.err"
    FAILED=1
    break
  fi
  if [ -s "$OBJDIR/${rel}.err" ]; then
    echo "--- warnings in $src"
    head -12 "$OBJDIR/${rel}.err"
  fi
done

if [ "$FAILED" = "1" ]; then
  echo "BUILD FAILED"
  exit 1
fi

echo "linking..."
LINK_LIBS="$LIBS"
if [ "$TARGET" = "x86_64-windows-gnu" ]; then
  # static CRT + no external runtime dependencies
  LINK_LIBS="$LIBS -static -static-libgcc -static-libstdc++"
fi

# --- Windows resources (icon + version information) -------------------------
RES_OBJ=""
if [ "$TARGET" = "x86_64-windows-gnu" ] && [ -f "$ROOT/branding/ashes.res" ]; then
  RES_OBJ="$ROOT/branding/ashes.res"
fi

$ZIG c++ -target "$TARGET" $OPT $EXTRA -o "$OUT/AshesOfHumanity.$EXT" $OBJS $RES_OBJ $LINK_LIBS 2>"$OUT/link.err" || {
  echo "LINK FAILED"; cat "$OUT/link.err"; exit 1;
}
if [ -s "$OUT/link.err" ]; then head -20 "$OUT/link.err"; fi

SIZE=$(du -h "$OUT/AshesOfHumanity.$EXT" | cut -f1)
echo "built: $OUT/AshesOfHumanity.$EXT ($SIZE)"
