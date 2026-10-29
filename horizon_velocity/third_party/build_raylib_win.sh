#!/bin/bash
set -e
ZIG="python3 -m ziglang"
SRC=/tmp/raylib-5.5/src
OUT=/tmp/rlbuild
mkdir -p $OUT && cd $OUT
COMMON="-target x86_64-windows-gnu -O2 -fno-sanitize=undefined -DPLATFORM_DESKTOP -DGRAPHICS_API_OPENGL_33 -I$SRC -I$SRC/external/glfw/include"
$ZIG cc $COMMON -c $SRC/rcore.c    -o rcore.o    -Wno-everything &
$ZIG cc $COMMON -c $SRC/rshapes.c  -o rshapes.o  -Wno-everything &
$ZIG cc $COMMON -c $SRC/rtextures.c -o rtextures.o -Wno-everything &
$ZIG cc $COMMON -c $SRC/rtext.c    -o rtext.o    -Wno-everything &
$ZIG cc $COMMON -c $SRC/rmodels.c  -o rmodels.o  -Wno-everything &
wait
$ZIG cc $COMMON -c $SRC/raudio.c   -o raudio.o   -Wno-everything &
$ZIG cc $COMMON -c $SRC/utils.c    -o utils.o    -Wno-everything &
$ZIG cc $COMMON -c $SRC/rglfw.c    -o rglfw.o    -Wno-everything &
wait
$ZIG ar rcs libraylib.a *.o
echo "BUILD_DONE"
ls -la libraylib.a
