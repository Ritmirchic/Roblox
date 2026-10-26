#!/usr/bin/env python3
"""
Packages the release artifacts.

  ASHES_OF_HUMANITY_WINDOWS.zip  - the playable build (exe + assets + docs)
  ASHES_OF_HUMANITY_SOURCE.zip   - the complete project source
  ASHES_OF_HUMANITY_SETUP.exe    - self extracting installer (built separately)
"""
import os
import shutil
import zipfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "release")
EXE = os.path.join(ROOT, "build", "AshesOfHumanity.exe")


def add_tree(zf, src_dir, arc_root, skip_ext=(".pyc",)):
    for dirpath, dirs, files in os.walk(src_dir):
        dirs[:] = [d for d in dirs if d not in ("__pycache__", ".git")]
        for f in sorted(files):
            if f.endswith(skip_ext):
                continue
            full = os.path.join(dirpath, f)
            rel = os.path.relpath(full, src_dir)
            zf.write(full, os.path.join(arc_root, rel).replace("\\", "/"))


def build_windows_zip():
    path = os.path.join(OUT, "ASHES_OF_HUMANITY_WINDOWS.zip")
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        z.write(EXE, "AshesOfHumanity/AshesOfHumanity.exe")
        for doc in ("README.md", "README.txt", "LICENSE.txt"):
            p = os.path.join(ROOT, doc)
            if os.path.exists(p):
                z.write(p, "AshesOfHumanity/" + doc)
        add_tree(z, os.path.join(ROOT, "assets"), "AshesOfHumanity/assets")
    print("windows zip:", path, os.path.getsize(path), "bytes")
    return path


def build_source_zip():
    path = os.path.join(OUT, "ASHES_OF_HUMANITY_SOURCE.zip")
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for doc in ("README.md", "LICENSE.txt", "build.sh"):
            p = os.path.join(ROOT, doc)
            if os.path.exists(p):
                z.write(p, "AshesOfHumanity/" + doc)
        for d in ("engine", "tools", "branding", "assets"):
            src = os.path.join(ROOT, d)
            if os.path.isdir(src):
                add_tree(z, src, "AshesOfHumanity/" + d)
    print("source zip:", path, os.path.getsize(path), "bytes")
    return path


def main():
    os.makedirs(OUT, exist_ok=True)
    if not os.path.exists(EXE):
        raise SystemExit("build the Windows executable first: TARGET=x86_64-windows-gnu ./build.sh")
    build_windows_zip()
    build_source_zip()
    print("PACKAGE_OK")


if __name__ == "__main__":
    main()
