#!/usr/bin/env python3
"""
FRACTURE: TOTAL DESTRUCTION - build script.

Targets:
  python3 build.py linux     -> native Linux build (used for automated tests / headless capture)
  python3 build.py windows   -> native Windows x86_64 GUI executable (cross-compiled with zig)
  python3 build.py all

The Windows build produces dist/FRACTURE_TOTAL_DESTRUCTION.exe with an embedded
icon + version resource (injected by tools/pe_res.py).
"""
import os, subprocess, sys, shutil, glob, time

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
BUILD = os.path.join(ROOT, "build")
DIST = os.path.join(ROOT, "dist")

ZIG_CANDIDATES = ["zig", "/tmp/zigpkg/ziglang/zig"]

BASEFLAGS = [
    "-std=c++17", "-O2", "-fno-exceptions", "-fno-rtti", "-fno-math-errno",
    "-ffast-math", "-Wall", "-Wno-unused-function", "-Wno-unused-variable",
    "-Wno-sign-compare", "-Wno-unused-but-set-variable", "-Wno-missing-braces",
    "-Wno-unused-private-field", "-Isrc",
]

SRCS = sorted(glob.glob(os.path.join(SRC, "*.cpp")))
COMMON = [s for s in SRCS if "platform_" not in os.path.basename(s)]
LINUX_SRCS = COMMON + [os.path.join(SRC, "platform_headless.cpp")]
if os.path.exists(os.path.join(SRC, "platform_win32.cpp")) and \
        os.path.basename(os.path.join(SRC, "platform_win32.cpp")) in [os.path.basename(x) for x in COMMON]:
    COMMON.remove(os.path.join(SRC, "platform_win32.cpp"))
WIN_SRCS = [s for s in COMMON] + [os.path.join(SRC, "platform_win32.cpp")]


def find_zig():
    for c in ZIG_CANDIDATES:
        if shutil.which(c) or os.path.exists(c):
            return c
    raise SystemExit("zig not found (pip install ziglang;" +
                     " expected at /tmp/zigpkg/ziglang/zig)")


def run(cmd, **kw):
    print("  $", " ".join(cmd[:6]) + (" ..." if len(cmd) > 6 else ""))
    t = time.time()
    r = subprocess.run(cmd, **kw)
    if r.returncode != 0:
        raise SystemExit("build failed (%d)" % r.returncode)
    print("    ok in %.1fs" % (time.time() - t))
    return r


def build_linux():
    os.makedirs(BUILD, exist_ok=True)
    out = os.path.join(BUILD, "fracture_linux")
    run(["g++"] + BASEFLAGS + ["-pthread", "-o", out] + LINUX_SRCS +
        ["-lpthread", "-lm"])
    return out


def build_windows(version="1.0.0"):
    zig = find_zig()
    os.makedirs(DIST, exist_ok=True)
    raw = os.path.join(BUILD, "fracture_win_raw.exe")
    final = os.path.join(DIST, "FRACTURE_TOTAL_DESTRUCTION.exe")
    os.makedirs(BUILD, exist_ok=True)
    run([zig, "c++", "-target", "x86_64-windows-gnu"] + BASEFLAGS + [
        "-static", "-static-libgcc", "-static-libstdc++",
        "-Wl,--subsystem,windows", "-mwindows",
        "-o", raw] + WIN_SRCS + [
        "-luser32", "-lgdi32", "-lwinmm", "-lole32", "-lshell32", "-ladvapi32",
        "-ldwmapi", "-lcomdlg32"])
    # icon / version info / manifest
    run([sys.executable, os.path.join(ROOT, "tools", "pe_res.py"),
         raw, final, version])
    # strip debug symbols a bit for size
    return final


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "all"
    if target in ("linux", "all"):
        print("[build] linux")
        build_linux()
    if target in ("windows", "all"):
        print("[build] windows")
        print("  ->", build_windows())
    print("done")


if __name__ == "__main__":
    main()
