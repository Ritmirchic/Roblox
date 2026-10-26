import hashlib
import pathlib
import re
import wave

from gdtoolkit.parser import parser as gd_parser
from PIL import Image
import pygltflib

ROOT = pathlib.Path(__file__).resolve().parent.parent


def test_all_gdscripts_parse_cleanly():
    gd_files = sorted(ROOT.glob("scripts/**/*.gd")) + sorted(ROOT.glob("tests/*.gd"))
    assert len(gd_files) >= 19
    for f in gd_files:
        src = f.read_text(encoding="utf-8")
        tree = gd_parser.parse(src)
        assert tree is not None, f"gdparse failed on {f}"


def test_all_res_paths_exist():
    pat = re.compile(r'"res://([^"%\n]+)"')
    checked = 0
    for f in list(ROOT.glob("scripts/**/*.gd")) + list(ROOT.glob("scenes/**/*.tscn")) + [ROOT / "project.godot", ROOT / "export_presets.cfg"]:
        txt = f.read_text(encoding="utf-8")
        for m in pat.finditer(txt):
            rel = m.group(1)
            if rel.endswith("/"):
                assert (ROOT / rel).is_dir(), f"Missing directory res://{rel} referenced in {f.name}"
            else:
                target = ROOT / rel
                assert target.is_file() and target.stat().st_size > 0, f"Missing asset res://{rel} referenced in {f.name}"
                checked += 1
    assert checked >= 50


def test_no_emojis_in_game_scripts():
    emoji_re = re.compile(r"[\U0001F300-\U0001FAFF\u2600-\u27BF]")
    for f in ROOT.glob("scripts/**/*.gd"):
        txt = f.read_text(encoding="utf-8")
        assert not emoji_re.search(txt), f"Forbidden emoji character found in {f}"


def test_multilingual_font_suite_and_10_languages():
    expected_fonts = [
        "Exo2-ExtraBold.ttf",
        "Exo2-Bold.ttf",
        "Exo2-Medium.ttf",
        "JetBrainsMono-SemiBold.ttf",
        "SciFiSymbols.ttf",
        "CJK-SC.ttf",
        "CJK-JP.ttf",
        "CJK-KR.ttf",
    ]
    for fn in expected_fonts:
        fp = ROOT / "assets" / "fonts" / fn
        assert fp.is_file() and fp.stat().st_size > 1000, f"Missing bundled font {fn}"

    loc_src = (ROOT / "scripts" / "autoload" / "Localization.gd").read_text(encoding="utf-8")
    assert 'var current_lang: String = "ru"' in loc_src, "Russian must be primary default language"
    for code in ["ru", "en", "es", "de", "fr", "pt", "zh", "ja", "ko", "tr"]:
        assert f'"{code}"' in loc_src, f"Missing language code {code} in Localization.gd"


def test_54_glb_3d_models_have_pbr_textures_and_normals():
    glbs = sorted((ROOT / "assets" / "models").rglob("*.glb"))
    assert len(glbs) == 54
    for p in glbs:
        g = pygltflib.GLTF2().load_binary(str(p))
        assert len(g.meshes) == 1
        prim = g.meshes[0].primitives[0]
        assert prim.attributes.POSITION is not None
        assert prim.attributes.NORMAL is not None
        assert prim.attributes.TEXCOORD_0 is not None
        assert len(g.textures) == 4
        mat = g.materials[0]
        assert mat.pbrMetallicRoughness.baseColorTexture is not None
        assert mat.pbrMetallicRoughness.metallicRoughnessTexture is not None
        assert mat.normalTexture is not None
        assert mat.emissiveTexture is not None


def test_42_unique_crew_cards_and_30_achievement_cards_and_packs():
    crew_pngs = sorted((ROOT / "assets" / "cards" / "crew").glob("crew_*.png"))
    assert len(crew_pngs) == 42
    hashes = set()
    for p in crew_pngs:
        im = Image.open(p)
        assert im.size == (360, 440), f"Unexpected crew portrait size {im.size} on {p.name}"
        hashes.add(hashlib.sha256(p.read_bytes()).hexdigest())
    assert len(hashes) == 42, "Every single one of the 42 Crew Card illustrations must be unique!"

    ach_pngs = sorted((ROOT / "assets" / "cards" / "achievements").glob("ach_*.png"))
    assert len(ach_pngs) == 30
    ach_hashes = set()
    for p in ach_pngs:
        im = Image.open(p)
        assert im.size == (360, 204), f"Unexpected achievement card size {im.size} on {p.name}"
        ach_hashes.add(hashlib.sha256(p.read_bytes()).hexdigest())
    assert len(ach_hashes) == 30, "Every single one of the 30 Achievement Card illustrations must be unique!"

    for special, expected_sz in [
        ("card_back.png", (360, 520)),
        ("pack_standard.png", (380, 540)),
        ("pack_elite.png", (380, 540)),
    ]:
        sp = ROOT / "assets" / "cards" / special
        assert sp.is_file() and Image.open(sp).size == expected_sz


def test_23_studio_44100hz_wav_audio_files_valid():
    wavs = sorted((ROOT / "assets" / "audio").glob("*.wav"))
    assert len(wavs) == 23
    for w in wavs:
        with wave.open(str(w), "rb") as wf:
            assert wf.getnchannels() == 1
            assert wf.getsampwidth() == 2
            assert wf.getframerate() == 44100, f"WAV {w.name} must be 44.1 kHz studio audio"
            assert wf.getnframes() > 1500


def _font_codepoints(path):
    """Codepoints covered by one font. fontTools is imported lazily so pytest
    collection of the other asset tests never depends on it."""
    from fontTools.ttLib import TTFont
    return set(TTFont(str(path)).getBestCmap().keys())


def test_every_localization_string_renders_in_bundled_fonts():
    """Every character of every in-game string must exist in the font chain,
    otherwise Russian/CJK/players see tofu boxes instead of text."""
    chain = [
        "Exo2-ExtraBold.ttf", "Exo2-Medium.ttf", "JetBrainsMono-SemiBold.ttf",
        "SciFiSymbols.ttf", "CJK-SC.ttf", "CJK-JP.ttf", "CJK-KR.ttf",
    ]
    covered = set()
    for fn in chain:
        covered |= _font_codepoints(ROOT / "assets" / "fonts" / fn)
    assert 0x430 in covered and 0x436 in covered, "Cyrillic must be covered"

    missing = {}
    for gd in sorted(list(ROOT.glob("scripts/**/*.gd")) + list(ROOT.glob("tests/*.gd"))):
        text = gd.read_text(encoding="utf-8", errors="replace")
        for m in re.finditer(r'"([^"\\\n]*)"', text):
            for ch in m.group(1):
                if ord(ch) > 0x7F and ord(ch) not in covered:
                    missing.setdefault(ch, set()).add(gd.name)
    assert not missing, "Glyphs missing from bundled font chain: %s" % {
        "U+%04X %s" % (ord(c), "".join(sorted(v))[:60]) for c, v in list(missing.items())[:10]
    }


def test_seven_unique_rarity_plaque_backdrops():
    """Redrawn achievement backgrounds: one procedurally shaded plaque per rarity."""
    rarities = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "secret"]
    seen = set()
    for r in rarities:
        fp = ROOT / "assets" / "cards" / "achievements" / ("bg_%s.png" % r)
        assert fp.is_file(), "missing achievement backdrop %s" % fp.name
        im = Image.open(fp)
        assert im.size == (640, 360), "unexpected backdrop size %s on %s" % (im.size, fp.name)
        h = hashlib.sha256(fp.read_bytes()).hexdigest()
        assert h not in seen, "backdrops must not be recolors of each other: %s" % r
        seen.add(h)
    assert len(seen) == 7


def test_eighteen_unique_upgrade_icons():
    icons = sorted((ROOT / "assets" / "icons" / "upgrades").glob("upg_*.png"))
    assert len(icons) == 18, "expected 18 upgrade protocol icons, found %d" % len(icons)
    hs = {hashlib.sha256(p.read_bytes()).hexdigest() for p in icons}
    assert len(hs) == 18, "upgrade icons must all be unique"


def test_hall_of_achievements_scene_wired():
    hall = ROOT / "scripts" / "space" / "AchievementHall3D.gd"
    src = hall.read_text(encoding="utf-8")
    assert "class_name AchievementHall3D" in src
    assert "signal return_to_hangar" in src
    for needed in ["WorldEnvironment", "Camera3D", "CPUParticles3D", "PlaneMesh",
                   "BILLBOARD_ENABLED", "hall_entries()", "unproject_position"]:
        assert needed in src, "hall must really build 3D content (%s)" % needed
    main = (ROOT / "scripts" / "ui" / "Main.gd").read_text(encoding="utf-8")
    assert "AchievementHall3D.new()" in main and "_enter_achievement_hall" in main
    am = (ROOT / "scripts" / "autoload" / "AchievementManager.gd").read_text(encoding="utf-8")
    for fn in ["func hall_entries()", "func earned_count()", "func total_card_count()", "var album_meta"]:
        assert fn in am, "AchievementManager missing %s" % fn


def test_settings_are_functional_not_cosmetic():
    """Every settings key must be declared, persisted, applied and consumed by real code."""
    keys = ["ui_scale", "camera_fov", "invert_y_axis", "crosshair_opacity", "screen_shake",
            "show_hud_bars", "achievement_toasts", "auto_save", "vsync_enabled", "fps_cap"]
    th = (ROOT / "scripts/autoload/ThemeHelper.gd").read_text(encoding="utf-8")
    for k in keys:
        assert "var %s:" % k in th, "ThemeHelper must declare setting %s" % k
        assert '"%s"' % k in th, "ThemeHelper must persist setting %s" % k
    assert "Engine.max_fps" in th and "window_set_vsync_mode" in th and "content_scale_factor" in th

    ui = (ROOT / "scripts/ui/HangarStationPanels.gd").read_text(encoding="utf-8")
    for k in keys:
        assert "ThemeHelper.%s =" % k in ui, "settings UI must write ThemeHelper.%s" % k

    flight = (ROOT / "scripts/space/SpaceExpedition3D.gd").read_text(encoding="utf-8")
    assert "ThemeHelper.camera_fov" in flight, "FOV setting must drive the flight camera"
    assert "ThemeHelper.invert_y_axis" in flight, "invert-pitch setting must drive mouse flight"
    assert "ThemeHelper.screen_shake" in flight and "_shake_trauma" in flight, "shake setting must drive real trauma"
    assert "ThemeHelper.crosshair_opacity" in flight, "crosshair opacity must drive HUD drawing"
    assert "ThemeHelper.show_hud_bars" in flight, "resource-panel setting must toggle the HUD stack"
    assert "ThemeHelper.achievement_toasts" in flight, "popup setting must gate achievement notifications"

    sm = (ROOT / "scripts/autoload/SaveManager.gd").read_text(encoding="utf-8")
    assert "func autosave()" in sm and "func flush_pending_autosave()" in sm
    assert "ThemeHelper.auto_save" in sm, "auto-save toggle must gate transactional saves"


def test_only_one_crosshair_and_portal_only_exit():
    src = (ROOT / "scripts/space/SpaceExpedition3D.gd").read_text(encoding="utf-8")
    assert "CROSSHAIR #2" in src
    assert "STEER_RING_RADIUS_PX" in src
    assert 'event.keycode == KEY_H' not in src, "instant exit hotkey must be removed"
    assert "WARP_EXIT_RADIUS" in src or "9.5" in src, "warp gate proximity must remain the only exit"


def test_pack_art_has_transparent_silhouette():
    for name in ("pack_standard.png", "pack_elite.png"):
        im = Image.open(ROOT / "assets" / "cards" / name)
        assert im.mode == "RGBA", "%s must keep an alpha channel" % name
        a = im.getchannel("A")
        w, h = im.size
        edge = [a.getpixel((x, 0)) for x in range(0, w, 7)] + \
               [a.getpixel((x, h - 1)) for x in range(0, w, 7)] + \
               [a.getpixel((0, y)) for y in range(0, h, 7)] + \
               [a.getpixel((w - 1, y)) for y in range(0, h, 7)]
        assert max(edge) == 0, "%s still has an opaque black edge" % name


def test_every_tr_ui_key_exists_in_all_ten_languages():
    loc_src = (ROOT / "scripts/autoload/Localization.gd").read_text(encoding="utf-8")
    used = set()
    for gd in list(ROOT.glob("scripts/**/*.gd")):
        for m in re.finditer(r'tr_ui\("([a-z0-9_]+)"', gd.read_text(encoding="utf-8", errors="replace")):
            used.add(m.group(1))
    lang_re = re.compile(r'"(%s)"\s*:' % "|".join(
        ["ru", "en", "es", "de", "fr", "pt", "zh", "ja", "ko", "tr"]))
    missing = []
    for key in sorted(used):
        blk = re.search(r'\n\t"%s": \{(.*?)\n\t\}' % re.escape(key), loc_src, re.DOTALL)
        if not blk:
            missing.append(key + " (absent)")
            continue
        langs = set(lang_re.findall(blk.group(1)))
        if len(langs) != 10:
            missing.append("%s (only %s)" % (key, ",".join(sorted(langs))))
    assert not missing, "Localization keys with missing languages: %s" % missing[:12]


# Identifiers that look plausible but do not exist in Godot 4.3. gdtoolkit's
# parser accepts them, so they must be banned statically or they only explode
# inside the real engine (as Control.SIDE_* and Color(Color, float) did).
GODOT4_BAD_SYMBOLS = [
    "Control.SIDE_LEFT", "Control.SIDE_TOP", "Control.SIDE_RIGHT", "Control.SIDE_BOTTOM",
    "set_content_margin_side", "ThemeType", "StyleBoxTexture.TEXTURE_MARGIN",
    "VP_RENDER_TARGET", "MainLoop.", "GDScript.NATIVE",
]


def test_no_nonexistent_godot4_identifiers():
    offenders = []
    for gd in list(ROOT.glob("scripts/**/*.gd")) + list(ROOT.glob("tests/*.gd")):
        src = gd.read_text(encoding="utf-8", errors="replace")
        for bad in GODOT4_BAD_SYMBOLS:
            if bad in src:
                offenders.append("%s: %s" % (gd.name, bad))
        for m in re.finditer(r"Color\(\s*[A-Za-z_][\w.\[\]]*\s*,\s*[\d.]+\s*\)", src):
            offenders.append("%s: Color(Color, alpha) -> %s" % (gd.name, m.group(0)))
    assert not offenders, "Invalid Godot 4 API usage: %s" % offenders[:8]


# Critical bootstrap calls that must be issued from _ready(). A refactor once
# inserted a handler between `func _ready()` and its body: the moved statements
# became the tail of the new function, so the UI never built itself. GDScript
# still parsed fine, so this must be asserted structurally.
BOOTSTRAP_CONTRACT = {
    "scripts/ui/HangarStationPanels.gd": ["_build_shell()"],
    "scripts/ui/Main.gd": ["_build_transition_curtain()"],
    "scripts/hangar/Hangar3D.gd": [
        "_build_3d_hangar_environment()", "_build_camera_rig()",
        "_build_ship_and_gizmos()", "_build_hangar_ui()",
    ],
    "scripts/space/SpaceExpedition3D.gd": [
        "_build_sector_environment()", "_spawn_player_and_containers()",
        "_populate_asteroids_and_props()", "_build_expedition_hud()",
    ],
    "scripts/space/AchievementHall3D.gd": [
        "_build_environment()", "_build_camera()", "_build_hud()", "_rebuild_cards()",
    ],
}


def _top_level_funcs(src):
    """Map 'func name' -> body lines, using only zero-indent definitions."""
    out, cur, body = {}, None, []
    for line in src.splitlines():
        m = re.match(r"^func\s+([A-Za-z_]\w*)\s*\(", line)
        if m:
            if cur:
                out[cur] = body
            cur, body = m.group(1), []
            continue
        if cur is not None:
            if line.strip() and not line.startswith(("\t", " ")):
                out[cur] = body
                cur, body = None, []
            else:
                body.append(line)
    if cur:
        out[cur] = body
    return out


def test_ui_bootstrap_contract():
    problems = []
    for rel, calls in BOOTSTRAP_CONTRACT.items():
        funcs = _top_level_funcs((ROOT / rel).read_text(encoding="utf-8"))
        ready = funcs.get("_ready")
        if ready is None:
            problems.append("%s: no _ready()" % rel)
            continue
        joined = "\n".join(ready)
        for c in calls:
            if c not in joined:
                problems.append("%s: _ready() must call %s" % (rel, c))
        defined = set(re.findall(r"\nfunc\s+(\w+)", "\n".join(ready)))
        if defined:
            problems.append("%s: _ready() body contains nested func defs %s" % (rel, sorted(defined)))
    assert not problems, "UI bootstrap contract violated: %s" % problems


def test_no_mesh_instance_billboard_property():
    """`billboard` is a Label3D / BaseMaterial3D feature; MeshInstance3D has no such
    property, and Godot only reports the bad assignment at runtime."""
    offenders = []
    for gd in ROOT.glob("scripts/**/*.gd"):
        src = gd.read_text(encoding="utf-8", errors="replace")
        mesh_vars = set(re.findall(r"var\s+(\w+)\s*:?=?\s*MeshInstance3D\.new\(\)", src))
        for m in re.finditer(r"^\s*(\w+)\.billboard\s*=", src, re.MULTILINE):
            if m.group(1) in mesh_vars:
                offenders.append("%s: %s.billboard" % (gd.name, m.group(1)))
    assert not offenders, "set material.billboard_mode on the mesh material instead: %s" % offenders
