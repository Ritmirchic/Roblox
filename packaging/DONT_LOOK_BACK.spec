# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec — builds a single-file windowed DONT_LOOK_BACK executable."""
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(SPEC)))
a = Analysis(
    [os.path.join(ROOT, "main.py")],
    pathex=[ROOT],
    binaries=[],
    datas=[(os.path.join(ROOT, "assets"), "assets")],
    hiddenimports=["pygame", "numpy"],
    hookspath=[], runtime_hooks=[], excludes=["tkinter", "matplotlib"],
    noarchive=False,
)
pyz = PYZ(a.pure)
exe = EXE(
    pyz, a.scripts, a.binaries, a.datas, [],
    name="DONT_LOOK_BACK",
    debug=False, bootloader_ignore_signals=False, strip=False, upx=False,
    console=False,               # no debug/console window in release
    icon=os.path.join(ROOT, "icon.ico") if os.path.exists(os.path.join(ROOT, "icon.ico")) else None,
)
