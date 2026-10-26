#!/usr/bin/env python3
"""
Builds ASHES_OF_HUMANITY_SETUP.exe.

The installer stub (installer.exe) is compiled for Windows x86-64 and the
deflated game package is appended to it.  At run time the installer locates the
ZIP inside its own image and unpacks it.
"""
import os
import shutil
import subprocess
import sys
import zipfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "build")
ZIG = os.environ.get("ZIG", "/home/user/tools/pylibs/ziglang/zig")
TARGET = "x86_64-windows-gnu"

GAME_FILES = [
    ("build/AshesOfHumanity.exe", "AshesOfHumanity.exe"),
    ("assets", "assets"),
    ("README.txt", "README.txt"),
    ("LICENSE.txt", "LICENSE.txt"),
]


def build_package(zip_path):
    """Creates the deflated payload archive."""
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for rel, arc in GAME_FILES:
            src = os.path.join(ROOT, rel)
            if not os.path.exists(src):
                print("skip missing:", rel)
                continue
            if os.path.isdir(src):
                for dirpath, _dirs, files in os.walk(src):
                    for f in sorted(files):
                        full = os.path.join(dirpath, f)
                        arcname = os.path.join(arc, os.path.relpath(full, src)).replace("\\", "/")
                        z.write(full, arcname)
            else:
                z.write(src, arc)
    print("package:", zip_path, os.path.getsize(zip_path), "bytes")


def main():
    os.makedirs(OUT, exist_ok=True)
    pkg = os.path.join(OUT, "game_payload.zip")
    build_package(pkg)

    stub = os.path.join(OUT, "installer_stub.exe")
    src = os.path.join(ROOT, "tools", "installer", "installer.cpp")
    res = os.path.join(ROOT, "branding", "ashes.res")
    cmd = [ZIG, "c++", "-target", TARGET, "-O2", "-std=c++17", "-fno-exceptions", "-fno-rtti",
           "-I", os.path.join(ROOT, "engine", "src"), src, "-o", stub]
    if os.path.exists(res):
        cmd.append(res)
    cmd += ["-Wl,--subsystem,windows", "-lopengl32", "-lgdi32", "-luser32", "-lshell32",
            "-lole32", "-luuid", "-lshlwapi"]
    print("compiling installer stub...")
    subprocess.check_call(cmd)

    final = os.path.join(OUT, "ASHES_OF_HUMANITY_SETUP.exe")
    shutil.copyfile(stub, final)
    with open(final, "ab") as out:
        with open(pkg, "rb") as f:
            shutil.copyfileobj(f, out, 1024 * 1024)
    os.remove(pkg)
    print("installer:", final, os.path.getsize(final), "bytes")
    print("INSTALLER_OK")


if __name__ == "__main__":
    main()
