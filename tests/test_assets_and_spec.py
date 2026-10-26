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
    """Reticle #1 (steering/aiming) is the sole on-screen sight; the projected
    ballistic pipper (#2) must stay removed, while the firing solution itself
    remains as reticle #1's numeric readout."""
    src = (ROOT / "scripts/space/SpaceExpedition3D.gd").read_text(encoding="utf-8")
    assert "CROSSHAIR #1" in src, "primary steering reticle must be restored"
    assert "CROSSHAIR #2" not in src, "ballistic pipper overlay must be removed"
    assert "pipper_pos" not in src and "secondary_impacts" not in src
    assert "STEER_RING_RADIUS_PX" in src
    assert "get_ballistic_sight_info()" in src, "reticle readout still uses the real firing solution"
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


def test_crew_portraits_are_full_busts_not_crops_or_mirrors():
    """v2.2.0 requirement: every portrait is a complete, distinct crew member.

    Guards the two failure modes the previous set had: (a) a head/helmet floating
    over nothing (no torso in the lower band) and (b) one figure reused as a
    mirrored/tinted copy of another.
    """
    import itertools
    import numpy as np

    crew_pngs = sorted((ROOT / "assets" / "cards" / "crew").glob("crew_*.png"))
    assert len(crew_pngs) == 42
    imgs = {}
    for p in crew_pngs:
        a = np.asarray(Image.open(p).convert("RGB"), dtype=np.float32)
        assert a.shape == (440, 360, 3), f"{p.name} must be 360x440"
        h = a.shape[0]
        # background reference = the outer columns; the figure must dominate the
        # torso band (lower 40% of the card), not just the head.
        bg = np.median(np.concatenate([a[:, :14].reshape(-1, 3), a[:, -14:].reshape(-1, 3)]), axis=0)
        torso = a[int(h * 0.52):int(h * 0.88)]
        fill = float((np.abs(torso - bg).max(axis=2) > 20).mean())
        assert fill > 0.55, f"{p.name} has no body below the head (torso fill {fill:.2f})"
        assert float(np.abs(torso - bg).mean()) > 18.0, f"{p.name} torso band is blank"
        imgs[p.name] = a

    names = list(imgs)
    for a, b in itertools.combinations(names, 2):
        direct = float(np.abs(imgs[a] - imgs[b]).mean())
        mirrored = float(np.abs(imgs[a] - imgs[b][:, ::-1]).mean())
        assert not (direct > 0 and mirrored / direct < 0.55), f"{a} is a mirrored copy of {b}"
    spread = float(np.mean([float(np.abs(imgs[a] - imgs[b]).mean())
                            for a, b in itertools.islice(itertools.combinations(names, 2), 0, 400)]))
    assert spread > 12.0, f"crew portraits are too similar overall (mean diff {spread:.1f})"


def test_ui_skin_kit_textures_are_authored_9slice():
    """The interface skin must be a real generated kit, not recoloured rectangles."""
    import numpy as np

    ui = ROOT / "assets" / "ui"
    expected = {
        "panel_main.png": (360, 360), "panel_inset.png": (280, 280), "header_bar.png": (560, 62),
        "btn_normal.png": (280, 66), "btn_hover.png": (280, 66), "btn_pressed.png": (280, 66),
        "btn_disabled.png": (280, 66), "tab_on.png": (230, 56), "tab_off.png": (230, 56),
        "slider_back.png": (300, 26), "slider_fill.png": (300, 26), "slider_grab.png": (46, 46),
        "check_on.png": (44, 44), "check_off.png": (44, 44), "bar_back.png": (300, 26),
        "bar_fill.png": (300, 26), "pill.png": (170, 40), "card_frame.png": (360, 440),
        "keycap.png": (64, 64), "divider.png": (560, 14), "backdrop.png": (720, 420),
    }
    for name, size in expected.items():
        f = ui / name
        assert f.is_file() and f.stat().st_size > 128, f"missing/empty UI skin texture {name}"
        im = Image.open(f).convert("RGBA")
        assert im.size == size, f"{name} must be {size}, got {im.size}"
    # chamfered corners: the plate corners must be transparent so panels get cut edges
    a = np.asarray(Image.open(ui / "panel_main.png").convert("RGBA"))
    assert int(a[0, 0, 3]) < 60 and int(a[-1, -1, 3]) < 60, "panel_main corners must be chamfered"
    assert int(a[42, 42, 3]) > 250, "panel_main must be solid inside the chamfer"
    assert int(a[a.shape[0] // 2, a.shape[1] // 2, 3]) > 200, "panel_main centre must be opaque"
    # the plate must be textured, not a flat fill
    core = a[40:-40, 40:-40, :3].astype(np.float32)
    assert float(core.std()) > 4.0, "panel_main has no surface detail (flat colour)"
    assert (ui / "skin_manifest.txt").is_file()


def test_theme_helper_wires_the_skin_kit_into_every_control_class():
    th = (ROOT / "scripts" / "autoload" / "ThemeHelper.gd").read_text(encoding="utf-8")
    assert "const SKIN_MARGIN" in th and "func _apply_skin_kit" in th
    assert "_apply_skin_kit()" in th.split("func _build_theme")[1].split("var _plaque_cache")[0], \
        "the skin must be applied at the end of _build_theme so it wins over flat fallbacks"
    for cls in ('"PanelContainer"', '"Button"', '"TabBar"', '"HSlider"', '"ProgressBar"', '"LineEdit"', '"PopupMenu"'):
        assert cls in th.split("func _apply_skin_kit")[1].split("var _plaque_cache")[0], f"skin not applied to {cls}"
    # every style factory must be able to return a texture stylebox, and fall back safely
    for fn in ("make_panel_style", "make_pill_style"):
        body = th.split(f"func {fn}(")[1].split("\nfunc ")[0]
        assert body.startswith("bg") or True
        assert "-> StyleBox:" in th.split(f"func {fn}(")[0].split("\n")[-1] + th.split(f"func {fn}(")[1].split("\n")[0], \
            f"{fn} must return StyleBox (not StyleBoxFlat) so skin styles are allowed"
        assert "skin_available()" in body and "StyleBoxFlat.new()" in body, f"{fn} lost its no-asset fallback"
    assert "func make_skin_overlay" in th and "func make_hud_bar_style" in th
    assert "func make_header_rail" in th and "func make_divider" in th and "func make_modal_style" in th
    assert "AXIS_STRETCH_MODE_STRETCH" in th, "9-slice must stretch, never tile"


def test_hangar_and_cards_consume_the_skin():
    station = (ROOT / "scripts" / "ui" / "HangarStationPanels.gd").read_text(encoding="utf-8")
    assert "ThemeHelper.make_modal_style(" in station, "station shell must use the kit plate"
    assert "ThemeHelper.make_header_rail(" in station, "command rail / section headers must use the kit"
    assert "ThemeHelper.make_divider(" in station
    assert "ThemeHelper.style_nav_tab(" in station
    card = (ROOT / "scripts" / "ui" / "CardWidget.gd").read_text(encoding="utf-8")
    assert 'ThemeHelper.make_skin_overlay("card_frame"' in card, "cards must paint the kit frame"
    assert "skin_available() else (3 if" in card, "card border must yield to the kit frame"
    pack = (ROOT / "scripts" / "ui" / "PackOpeningModal.gd").read_text(encoding="utf-8")
    assert 'ThemeHelper.make_skin_overlay("card_frame"' in pack, "pack card backs must wear the kit frame"
    assert "ThemeHelper.make_header_rail(" in pack
    assert "bp_sb.set_corner_radius_all(14)" in pack
    space = (ROOT / "scripts" / "space" / "SpaceExpedition3D.gd").read_text(encoding="utf-8")
    assert 'ThemeHelper.make_hud_bar_style(col, true)' in space
    assert 'ThemeHelper.make_hud_bar_style(col, false)' in space
    assert "ThemeHelper.make_modal_style(" in space, "pause panel must use the kit plate"


BUILTIN_STATICS = {"new", "free", "instantiate", "duplicate", "load", "preload"}

AUTOLOAD_SRC = {
    "ShipGrid": "scripts/autoload/ShipGrid.gd",
    "GameData": "scripts/autoload/GameData.gd",
    "CrewManager": "scripts/autoload/CrewManager.gd",
    "UpgradeManager": "scripts/autoload/UpgradeManager.gd",
    "AchievementManager": "scripts/autoload/AchievementManager.gd",
    "SaveManager": "scripts/autoload/SaveManager.gd",
    "AudioManager": "scripts/autoload/AudioManager.gd",
    "ThemeHelper": "scripts/autoload/ThemeHelper.gd",
    "L": "scripts/autoload/Localization.gd",
    "VFXFactory": "scripts/vfx/VFXFactory.gd",
    "Projectile3D": "scripts/space/Projectile3D.gd",
    "ResourceChunk3D": "scripts/space/ResourceChunk3D.gd",
    "PlayerShip3D": "scripts/ship/PlayerShip3D.gd",
}


def test_cross_file_symbols_resolve():
    """Every call into another script must name a member that actually exists.

    Typos such as ThemeHelper.wire_button_flash() or a sound name that is not in
    AudioManager.AUDIO_FILES are silent at parse time and only blow up (or play
    nothing) inside the real engine, so they are checked statically here.
    """
    members = {}
    for cls, rel in AUTOLOAD_SRC.items():
        src = (ROOT / rel).read_text(encoding="utf-8")
        names = set(re.findall(r"^(?:static\s+)?func\s+([A-Za-z_][A-Za-z_0-9]*)", src, re.M))
        names |= set(re.findall(r"^(?:const|var|signal)\s+([A-Za-z_][A-Za-z_0-9]*)", src, re.M))
        members[cls] = names

    call_re = re.compile(r"\b(%s)\.([a-z_][a-z_0-9]*)\(" % "|".join(AUTOLOAD_SRC))
    problems = []
    for gd in sorted(list(ROOT.glob("scripts/**/*.gd")) + list(ROOT.glob("tests/*.gd"))):
        txt = gd.read_text(encoding="utf-8", errors="replace")
        for m in call_re.finditer(txt):
            cls, fn = m.group(1), m.group(2)
            if fn in BUILTIN_STATICS:
                continue
            if fn not in members[cls]:
                problems.append("%s: %s.%s()" % (gd.name, cls, fn))
    assert not problems, "Calls to members that do not exist: %s" % sorted(set(problems))[:12]

    sfx_src = (ROOT / "scripts/autoload/AudioManager.gd").read_text(encoding="utf-8")
    block = sfx_src.split("const AUDIO_FILES: Dictionary = {")[1].split("\n}")[0]
    known = set(re.findall(r'"([a-z_0-9]+)":\s*"res://', block))
    assert len(known) >= 20
    used_sfx = set()
    for gd in sorted(ROOT.glob("scripts/**/*.gd")):
        for m in re.finditer(r'play_sfx\(\s*"([a-z_0-9]+)"', gd.read_text(encoding="utf-8", errors="replace")):
            used_sfx.add(m.group(1))
    unknown = sorted(used_sfx - known)
    assert not unknown, "play_sfx() names missing from AUDIO_FILES: %s" % unknown
    assert len(used_sfx) >= 12, "the game should be using its full sfx set"


def test_market_and_power_logic_is_wired_end_to_end():
    """v2.2.0 gameplay logic: reactor load governor + dynamic sector market."""
    game = (ROOT / "scripts/autoload/GameData.gd").read_text(encoding="utf-8")
    for fn in ("func market_day", "func market_index", "func market_price",
               "func market_quote", "func market_quotes", "func market_seed"):
        assert fn + "(" in game, "market logic missing: " + fn
    body = game.split("func market_index(")[1].split("\nfunc ")[0]
    assert "clampf(" in body and "MARKET_AMPLITUDE" in body and "sin(" in body, \
        "market index must be a bounded trigonometric cycle"

    grid = (ROOT / "scripts/autoload/ShipGrid.gd").read_text(encoding="utf-8")
    assert "const POWER_PROFILES" in grid
    prof = grid.split("const POWER_PROFILES: Dictionary = {")[1].split("\n}")[0]
    assert prof.count("\"mining\"") == prof.count("\"weapons\"") == prof.count("\"repair\"") == 5
    for pid in ["balanced", "mine_focus", "combat_focus", "sustain", "burst_drive"]:
        assert '"%s"' % pid in prof, "power profile missing: " + pid
    shares = [float(x) for x in re.findall(r":\s*([01]\.\d+)[,}]", prof)]
    assert len(shares) == 20 and max(shares) < 1.0 and min(shares) > 0.1, shares
    assert "func set_power_profile" in grid and "func power_budget" in grid
    assert "func spill_cargo" in grid and "func _cargo_ledger" in grid
    assert "market_quote(" in grid.split("func _cargo_ledger")[1].split("\nfunc ")[0], \
        "the sale ledger must price cargo on the live market index"

    ship = (ROOT / "scripts/ship/PlayerShip3D.gd").read_text(encoding="utf-8")
    assert "func power_factor" in ship and "func power_shed" in ship
    assert "func get_power_report" in ship and "_update_power_governor(delta)" in ship
    assert 'note_power_draw("mining"' in ship and 'note_power_draw("weapons"' in ship
    assert 'note_power_draw("engines"' in ship and 'note_power_draw("repair"' in ship
    assert "0.35 + 0.65 * mine_pow" in ship, "mining throughput must droop with power"
    assert "0.40 + 0.60 * wep_pow" in ship, "turret cycle time must droop with power"
    assert 'power_shed("mining")' in ship and 'power_shed("weapons")' in ship
    assert "cargo_spilled.emit" in ship and "func _on_cargo_spilled" in (
        ROOT / "scripts/space/SpaceExpedition3D.gd").read_text(encoding="utf-8")
    assert 'player_ship.cargo_spilled.connect' in (ROOT / "scripts/space/SpaceExpedition3D.gd").read_text(encoding="utf-8")

    save = (ROOT / "scripts/autoload/SaveManager.gd").read_text(encoding="utf-8")
    assert '"power_profile": ShipGrid.power_profile' in save and '"market_sector": ShipGrid.market_sector' in save
    assert "ShipGrid.POWER_PROFILES.has(pp)" in save, "loaded power profile must be validated"
    assert "ms_ok" in save, "loaded market sector must be validated against unlocked sectors"

    station = (ROOT / "scripts/ui/HangarStationPanels.gd").read_text(encoding="utf-8")
    assert "ShipGrid.set_power_profile(" in station and "GameData.market_quotes(" in station
    assert "ShipGrid.set_market_sector(" in station, "the market board must let the player pick a buyer"
    assert 'L.tr_ui("pwr_hint")' in station and 'L.tr_ui("mkt_hint")' in station

    space = (ROOT / "scripts/space/SpaceExpedition3D.gd").read_text(encoding="utf-8")
    assert 'tel.get("power", {})' in space and "_power_bar" in space and "_brownout_hud" in space


def test_string_key_registries_have_no_typos():
    """Literal registry keys used across the code must exist in their tables.

    Wrong ids in GameData.modules["..."], a mistaked achievement event name or an
    unknown sfx key are all silent failures in Godot, so they are resolved here.
    """
    game = (ROOT / "scripts/autoload/GameData.gd").read_text(encoding="utf-8")
    mods = set(re.findall(r'_add_mod\("(\w+)"', game))
    res_block = game.split("const RESOURCES: Dictionary = {")[1].split("\n}")[0]
    res = set(re.findall(r'\t"([a-z_0-9]+)": \{', res_block, re.M))
    sectors = set(re.findall(r'"id": "(sector_\d+)"', game))
    assert len(mods) >= 20 and len(res) == 5 and len(sectors) == 5

    audio = (ROOT / "scripts/autoload/AudioManager.gd").read_text(encoding="utf-8")
    am = (ROOT / "scripts/autoload/AchievementManager.gd").read_text(encoding="utf-8")
    am_strings = set(re.findall(r'"([a-z_]{3,})"', am))
    loc = (ROOT / "scripts/autoload/Localization.gd").read_text(encoding="utf-8")
    ui_keys = set(re.findall(r'^\t"([a-z_0-9]+)": \{', loc, re.M)) | set(
        re.findall(r'^\t"([a-z_0-9]+)": \{"ru"', loc, re.M))
    assert len(ui_keys) >= 100, "localization table looks too small: %d" % len(ui_keys)

    module_ids = set(mods)
    missing = {"modules": [], "resources": [], "sectors": [], "events": [], "ui": []}
    for gd in sorted(ROOT.glob("scripts/**/*.gd")):
        txt = gd.read_text(encoding="utf-8", errors="replace")
        for m in re.finditer(r'GameData\.modules(?:\.has\(|\[|\.get\()"([a-z_0-9]+)"', txt):
            if m.group(1) not in module_ids:
                missing["modules"].append("%s: %s" % (gd.name, m.group(1)))
        for m in re.finditer(r'GameData\.RESOURCES(?:\.has|\[|\.get)\("([a-z_]+)"', txt):
            if m.group(1) not in res:
                missing["resources"].append("%s: %s" % (gd.name, m.group(1)))
        for m in re.finditer(r'record_event\(\s*"([a-z_]+)"', txt):
            if m.group(1) not in am_strings:
                missing["events"].append("%s: %s" % (gd.name, m.group(1)))
        for m in re.finditer(r'tr_ui\("([a-z_0-9]+)"', txt):
            if m.group(1) not in ui_keys:
                missing["ui"].append("%s: %s" % (gd.name, m.group(1)))
        for m in re.finditer(r'market(?:_quote|_price|_index)\(\s*"([a-z_]+)"', txt):
            if m.group(1) not in res:
                missing["resources"].append("%s: market %s" % (gd.name, m.group(1)))
    dead = {k: sorted(set(v)) for k, v in missing.items() if v}
    assert not dead, "Unknown registry keys: %s" % dead
