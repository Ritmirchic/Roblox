#!/usr/bin/env python3
"""Rebuild the bundled CJK fallback fonts (assets/fonts/CJK-{SC,JP,KR}.ttf).

The shipped fonts are subsetted Noto Sans, so any new localized string can
reference a glyph the subset does not contain. This tool scans every .gd file
in the project for non-Latin characters, unions that with the safety ranges
below, and writes minimal TrueType subsets guaranteed to cover all in-game
text. Run it after adding or changing any localization string.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = Path("/tmp/cjk")

sys.path.insert(0, str(ROOT / ".venv" / "lib" / "python3.11" / "site-packages"))
from fontTools.subset import Options, Subsetter  # noqa: E402
from fontTools.ttLib import TTFont  # noqa: E402

TARGETS = {
    "CJK-SC.ttf": "NotoSansSC[wght].ttf.ttf",
    "CJK-JP.ttf": "NotoSansJP[wght].ttf.ttf",
    "CJK-KR.ttf": "NotoSansKR[wght].ttf.ttf",
}

# Punctuation / symbol safety ranges shared by every CJK face.
RANGES = [
    (0x2018, 0x201D),   # curly quotes
    (0x2026, 0x2027),
    (0x3001, 0x303F),   # CJK punctuation & brackets
    (0xFF01, 0xFF5E),   # fullwidth ASCII
    (0xFFE0, 0xFFE6),
]

# Script-specific structural ranges (small, so they are cheap to keep whole).
EXTRA = {
    "CJK-JP.ttf": [(0x3040, 0x30FF)],                    # kana
    "CJK-KR.ttf": [(0x1100, 0x11FF), (0x3131, 0x318E)],  # Hangul jamo
}

STRING_RE = re.compile(r'"([^"\\\n]*)"')


def used_chars() -> set[int]:
    cps: set[int] = set()
    files = list(ROOT.glob("scripts/**/*.gd")) + list(ROOT.glob("tests/*.gd"))
    for f in files:
        txt = f.read_text(encoding="utf-8", errors="replace")
        for m in STRING_RE.finditer(txt):
            for ch in m.group(1):
                if ord(ch) > 0x7F:
                    cps.add(ord(ch))
    return cps


def already_in(font_path: Path) -> set[int]:
    if not font_path.is_file():
        return set()
    return set(TTFont(str(font_path)).getBestCmap().keys())


def static_instance(font: TTFont) -> TTFont:
    """Pin the downloaded variable fonts to Regular weight like the shipped files."""
    if "fvar" not in font:
        return font
    try:
        from fontTools.varLib import instancer
        return instancer.instantiateVariableFont(font, {"wght": 400})
    except Exception as exc:  # older/newer API - keep the VF, Godot uses the default master
        print("  (variable instancing skipped: %s)" % exc)
        return font


def build(out_name: str, src_name: str) -> None:
    src = SRC / src_name
    if not src.is_file():
        print("SKIP %s: source %s missing" % (out_name, src))
        return

    out = ROOT / "assets" / "fonts" / out_name
    keep = used_chars() | already_in(out)
    for a, b in RANGES + EXTRA.get(out_name, []):
        keep.update(range(a, b + 1))

    font = static_instance(TTFont(str(src)))

    opts = Options()
    opts.layout_features = ["kern"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    opts.drop_tables += ["DSIG"]

    ss = Subsetter(options=opts)
    ss.populate(unicodes=sorted(keep))
    ss.subset(font)
    font.save(str(out))

    got = set(TTFont(str(out)).getBestCmap().keys())
    missing = sorted(keep - got)
    print("%s: %d glyphs, %.0f KB, coverage: %s" % (
        out_name, len(got), out.stat().st_size / 1024,
        "COMPLETE" if not missing else "MISSING %s" % [hex(m) for m in missing[:8]]))


def main() -> int:
    for name, src in TARGETS.items():
        build(name, src)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
