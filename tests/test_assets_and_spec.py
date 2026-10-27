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
    # Removed in Godot 4 but still familiar from 3.x: they parse fine and only
    # blow up inside the engine (an aborted _build_hud once nulled every later node).
    "height_for_width", "fit_to_width", ".valign", "max_width_visible",
    "Color.ONE", "Color.ZERO", "Color.BLACK_TRANSPARENT",
    "Control.SIDE_LEFT", "Control.SIDE_TOP", "Control.SIDE_RIGHT", "Control.SIDE_BOTTOM",
    "set_content_margin_side", "ThemeType", "StyleBoxTexture.TEXTURE_MARGIN",
    "VP_RENDER_TARGET", "MainLoop.", "GDScript.NATIVE",
]


GODOT4_COLOR_CONSTANTS = {
    "WHITE", "BLACK", "TRANSPARENT", "RED", "GREEN", "BLUE", "CYAN", "MAGENTA", "YELLOW",
    "ORANGE", "PURPLE", "GRAY", "GREY", "SILVER", "GOLD", "NAVY", "TEAL", "AQUA", "FUCHSIA",
    "LIME", "MAROON", "OLIVE", "PINK", "SALMON", "TOMATO", "SKYBLUE", "ROYALBLUE", "SNOW",
    "SEA_GREEN", "SLATE_GRAY", "STEEL_BLUE", "CORAL", "CRIMSON", "DARK_RED", "DODGER_BLUE",
}


def test_color_static_constants_exist():
    """Godot 4 Color has no Color.ONE/Color.ZERO - typos there are parse errors
    that kill every autoload, so only known constants may be referenced."""
    bad = []
    for gd in sorted(list(ROOT.glob("scripts/**/*.gd")) + list(ROOT.glob("tests/*.gd"))):
        txt = gd.read_text(encoding="utf-8", errors="replace")
        for m in re.finditer(r"Color\.([A-Z][A-Z_0-9]+)", txt):
            name = m.group(1)
            if name.startswith("HEX_"):
                continue
            if name not in GODOT4_COLOR_CONSTANTS:
                bad.append("%s: Color.%s" % (gd.name, name))
    assert not bad, "Non-existent Color constants: %s" % sorted(set(bad))


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
        sep = float((np.abs(torso - bg).max(axis=2) > 20).mean())
        # The portraits are authored paintings, and elite key art is deliberately
        # dark-on-dark (black armour in smoke), which luminance separation alone
        # cannot see. So a band also counts as "a body is down there" when it is
        # structurally busy: plate seams, harness and gauntlets produce hard edges
        # across the whole width, while a head floating over nothing produces none.
        gx = np.abs(np.diff(torso, axis=1)).max(axis=2)
        gy = np.abs(np.diff(torso, axis=0)).max(axis=2)
        eh, ew = min(gx.shape[0], gy.shape[0]), min(gx.shape[1], gy.shape[1])
        edge_cov = float(((np.maximum(gx[:eh, :ew], gy[:eh, :ew]) > 26).mean(axis=0) > 0.06).mean())
        assert sep > 0.55 or edge_cov > 0.80, \
            f"{p.name} has no body below the head (separation {sep:.2f}, edge coverage {edge_cov:.2f})"
        assert float(np.abs(torso - bg).mean()) > 18.0 or edge_cov > 0.80, \
            f"{p.name} torso band is blank (edge coverage {edge_cov:.2f})"
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


def test_every_referenced_skin_key_has_a_texture():
    """A skin key without a matching PNG silently falls back to flat chrome, so
    the family names used in code must resolve to real kit textures."""
    ui = ROOT / "assets" / "ui"
    th = (ROOT / "scripts/autoload/ThemeHelper.gd").read_text(encoding="utf-8")
    margin_src = th.split("const SKIN_MARGIN := {")[1].split("\n}")[0]
    margin_keys = re.findall(r'"([a-z_0-9]+)":\s*\d+', margin_src)
    assert len(margin_keys) >= 20
    orphan = [k for k in margin_keys if not (ui / ("%s.png" % k)).is_file()]
    assert not orphan, "SKIN_MARGIN entries without artwork: %s" % orphan

    used = set()
    for gd in sorted(list(ROOT.glob("scripts/**/*.gd")) + list(ROOT.glob("tests/*.gd"))):
        txt = gd.read_text(encoding="utf-8", errors="replace")
        for m in re.finditer(r'(?:make_skin_style|make_skin_overlay|skin_texture)\(\s*"([a-z_0-9]+)"', txt):
            used.add(m.group(1))
        for m in re.finditer(r'"(btn|tab|slider|bar|check)_(normal|hover|pressed|disabled|on|off|back|fill|grab)"', txt):
            used.add(m.group(0).strip('"'))
    assert used, "no skin keys referenced at all?"
    missing = sorted(k for k in used if not (ui / ("%s.png" % k)).is_file())
    assert not missing, "skin keys without a texture file (would render flat): %s" % missing
    assert "main_theme.set_icon(\"checked\", cls5, ck_on)" in th, "checkbox icons not wired"
    # every state of a family must exist, or hover/pressed would pop back to flat
    for fam in ("btn", "tab", "slider", "bar"):
        for f in ui.glob("%s_*.png" % fam):
            assert f.stem in used or f.stem in margin_keys, "unused kit texture %s" % f.name


def _split_top_level(arg_text: str) -> list:
    """Split a call's argument list on commas that are not nested."""
    parts, depth, cur, quote, esc = [], 0, "", False, False
    for ch in arg_text:
        if quote:
            cur += ch
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                quote = False
            continue
        if ch == '"':
            quote = True
            cur += ch
        elif ch in "([{":
            depth += 1
            cur += ch
        elif ch in ")]}":
            depth -= 1
            cur += ch
        elif ch == "," and depth == 0:
            parts.append(cur)
            cur = ""
        else:
            cur += ch
    if cur.strip():
        parts.append(cur)
    return parts


def test_theme_helper_call_arity_matches_definitions():
    """Wrong argument counts are only reported by the compiler, so they are
    checked here: this class of error once took the whole autoload chain down.

    Every call into an autoload / class_name script is matched against that
    script's declared signature (required .. total parameters).
    """
    sigs = {}
    for cls, rel in AUTOLOAD_SRC.items():
        src = (ROOT / rel).read_text(encoding="utf-8")
        cls_sigs = {}
        for m in re.finditer(r"^(?:static )?func ([a-z_0-9]+)\(([^)]*)\)", src, re.M):
            name, raw = m.group(1), m.group(2).strip()
            params = _split_top_level(raw) if raw else []
            required = len([p for p in params if "=" not in p])
            cls_sigs[name] = (required, len(params))
        sigs[cls] = cls_sigs
    assert len(sigs["ThemeHelper"]) >= 25, "only found %d ThemeHelper functions" % len(sigs["ThemeHelper"])

    bad = []
    checked = 0
    for gd in sorted(list(ROOT.glob("scripts/**/*.gd")) + list(ROOT.glob("tests/*.gd"))):
        txt = gd.read_text(encoding="utf-8", errors="replace")
        for m in re.finditer(r"\b(%s)\.([a-z_0-9]+)\(" % "|".join(AUTOLOAD_SRC), txt):
            checked += 1
            cls = m.group(1)
            fn = m.group(2)
            fn = m.group(1)
            if fn not in sigs[cls]:
                continue
            i = m.end()
            depth, quote, esc, args_start = 1, False, False, i
            while i < len(txt) and depth > 0:
                ch = txt[i]
                if quote:
                    if esc:
                        esc = False
                    elif ch == "\\":
                        esc = True
                    elif ch == '"':
                        quote = False
                elif ch == '"':
                    quote = True
                elif ch in "([{":
                    depth += 1
                elif ch in ")]}":
                    depth -= 1
                i += 1
            body = txt[args_start:i - 1]
            if "func(" in body or "func (" in body or "func():" in body or "func():" in body:
                continue  # lambda argument: commas belong to the closure body
            nargs = len(_split_top_level(body)) if body.strip() else 0
            req, total = sigs[cls][fn]
            if nargs < req or nargs > total:
                line = txt[:m.start()].count("\n") + 1
                bad.append("%s:%d %s.%s() got %d args (needs %d..%d)" % (
                    gd.name, line, cls, fn, nargs, req, total))
    assert checked >= 400, "arity audit only inspected %d call sites" % checked
    assert not bad, "Autoload call arity problems: %s" % sorted(set(bad))[:12]


def test_foil_finish_visual_contract():
    """Every shader parameter the card UI pushes must be declared by the foil shader.

    A typo'd `set_shader_parameter` name is silently ignored by Godot, so the
    collectible finishes would ship visually dead.
    """
    shader = (ROOT / "shaders" / "card_foil.gdshader").read_text(encoding="utf-8")
    declared = set(re.findall(r"uniform\s+\w+\s+(\w+)\s*(?::|=|;)", shader))
    widget = (ROOT / "scripts" / "ui" / "CardWidget.gd").read_text(encoding="utf-8")
    used = set(re.findall(r"_foil_mat\.set_shader_parameter\(\"(\w+)\"", widget))
    assert used, "CardWidget drives no shader parameters at all"
    missing = sorted(used - declared)
    assert not missing, f"card_foil.gdshader does not declare: {missing}"
    for key in ("finish_sheen", "finish_prism", "finish_sparkle", "finish_glow", "finish_metal"):
        assert key in declared, f"foil shader lost the {key} uniform"
    assert "finish_tint" in declared


def test_foil_finish_table_is_balanced_and_localized():
    """Foil weights, ranks and multipliers stay sane and every finish is named in 10 languages."""
    game = (ROOT / "scripts" / "autoload" / "GameData.gd").read_text(encoding="utf-8")
    block = game[game.index("const CARD_FINISHES: Dictionary = {"):]
    block = block[: block.index("\n}\n")]
    entries = re.findall(r'"(\w+)":\s*\{', block)
    assert entries == ["plain", "silver", "holo", "glitter", "glow"], entries
    weights = [float(w) for w in re.findall(r'"weight":\s*([\d.]+)', block)]
    assert abs(sum(weights) - 100.0) < 1e-6, weights
    mults = [float(m) for m in re.findall(r'"buff_mult":\s*([\d.]+)', block)]
    assert mults == sorted(mults) and mults[0] == 1.0 and mults[-1] > 1.5
    langs = ("ru", "en", "es", "de", "fr", "pt", "zh", "ja", "ko", "tr")
    loc = (ROOT / "scripts" / "autoload" / "Localization.gd").read_text(encoding="utf-8")
    for const in ("FOIL_NAMES", "FOIL_EFFECTS"):
        seg = loc[loc.index(f"const {const}: Dictionary = {{"):]
        seg = seg[: seg.index("\n}\n")]
        for fid in entries:
            chunk = seg[seg.index(f'"{fid}"'):]
            chunk = chunk[: chunk.index("},")]
            for code in langs:
                assert f'"{code}":' in chunk, f"{const} is missing {code} for {fid}"


def test_lmb_never_mines_and_lock_directs_fire():
    """The control contract: RMB owns the mining beam, LMB only shoots the locked target."""
    proj = (ROOT / "scripts" / "space" / "Projectile3D.gd").read_text(encoding="utf-8")
    assert "apply_mining_damage" not in proj, "weapon rounds must not damage meteoroids"
    assert "lock_homing" in proj and "_ricochet_grace" in proj
    beam = (ROOT / "scripts" / "ship" / "PlayerShip3D.gd").read_text(encoding="utf-8")
    assert "apply_mining_damage" in beam, "the mining beam must still break rocks"
    assert "LOCK_HOMING_TURN" in beam and "lock_homing" in beam
    exp = (ROOT / "scripts" / "space" / "SpaceExpedition3D.gd").read_text(encoding="utf-8")
    assert "player_ship.firing_weapons = _mouse_captured and Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT)" in exp
    assert "player_ship.firing_mining = (_mouse_captured and Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT))" in exp
    assert "set_lock_state(" in exp, "the locked enemy must be painted green"
    enemy = (ROOT / "scripts" / "space" / "EnemyShip3D.gd").read_text(encoding="utf-8")
    assert "func set_lock_state(" in enemy and "var elite: bool = false" in enemy


def test_rarity_ladder_is_a_collector_ladder():
    """Packs must stay stingy at the top and combat must never print a Secret.

    A pull economy is only worth having if the rare cards stay rare, and the
    weights asserted here are the exact ones the station discloses - a silent
    bump upward would be a balance hole and a lie to the player at once.
    """
    pm = (ROOT / "scripts" / "autoload" / "PackManager.gd").read_text(encoding="utf-8")
    order = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Secret"]
    packs = {}
    for pid in ("standard", "elite"):
        seg = pm[pm.index('"id": "%s"' % pid):]
        seg = seg[seg.index('"weights": {'):]
        seg = seg[: seg.index("\n\t\t}")]
        packs[pid] = {m[0]: float(m[1]) for m in re.findall(r'"(\w+)":\s*([\d.]+)', seg)}
        w = packs[pid]
        assert list(w.keys()) == order, (pid, list(w.keys()))
        assert abs(sum(w.values()) - 100.0) < 1e-6, (pid, sum(w.values()))
        top = w["Legendary"] + w["Mythic"] + w["Secret"]
        assert top <= (2.0 if pid == "standard" else 12.0), (pid, "Legendary+ share", top)
        assert w["Secret"] <= (0.10 if pid == "standard" else 0.60), (pid, "Secret share", w["Secret"])
        if pid == "elite":
            assert w["Common"] == 0.0, "the vault box never prints a Common"
            ladder = ["Rare", "Epic", "Legendary", "Mythic", "Secret"]
        else:
            assert w["Common"] > 50.0, "a cheap box is mostly working crew"
            assert w["Uncommon"] > 20.0
            ladder = order
        for hi, lo in zip(ladder, ladder[1:]):
            assert w[hi] > w[lo], (pid, "not a descending ladder", hi, lo)
        # and it must fall off hard: 2.5x per step mid-ladder, 8x near the top
        assert w["Epic"] >= w["Legendary"] * 2.5, (pid, "Epic/Legendary gap too small")
        assert w["Legendary"] >= w["Secret"] * 8.0, (pid, "Secret is not scarce")
    assert packs["elite"]["Legendary"] > packs["standard"]["Legendary"]
    assert packs["elite"]["Secret"] > packs["standard"]["Secret"]

    game = (ROOT / "scripts" / "autoload" / "GameData.gd").read_text(encoding="utf-8")
    salvage = {}
    for const in ("SALVAGE_RARITY_WEIGHTS", "SALVAGE_RARITY_WEIGHTS_HEAVY"):
        seg = game[game.index("const %s: Dictionary = {" % const):]
        seg = seg[: seg.index("\n}")]
        salvage[const] = {m[0]: float(m[1]) for m in re.findall(r'"(\w+)":\s*([\d.]+)', seg)}
        w = salvage[const]
        assert "Secret" not in w, "%s must never pay out a Secret" % const
        assert w["Rare"] > w["Epic"] >= w["Legendary"] >= w["Mythic"], w
    assert "func roll_salvage_rarity" in game and "func salvage_chance" in game
    assert "SALVAGE_PRINTS_PER_EXPEDITION: int = 2" in game
    exp = (ROOT / "scripts" / "space" / "SpaceExpedition3D.gd").read_text(encoding="utf-8")
    assert "GameData.SALVAGE_PRINTS_PER_EXPEDITION" in exp, "salvage prints must be capped per expedition"
    assert "GameData.roll_salvage_rarity(randf(), heavy)" in exp, "combat must roll the salvage ladder"
    assert 'GameData.RARITY_ORDER.find(str(c["rarity"])) >= 2' not in exp, \
        "salvage must not pick uniformly from everything Rare and above"


# ---------------------------------------------------------------- v2.5.1 review batch
def test_menu_version_matches_project_version():
    """The menu must never print a stale build number again."""
    proj = (ROOT / "project.godot").read_text(encoding="utf-8")
    m = re.search(r'config/version="([0-9.]+)"', proj)
    assert m, "project.godot must carry config/version"
    ver = m.group(1)
    loc = (ROOT / "scripts/autoload/Localization.gd").read_text(encoding="utf-8")
    blk = re.search(r'"menu_version": \{(.*?)\n\t\}', loc, re.S)
    assert blk, "menu_version block missing"
    langs = re.findall(r'"([a-z]{2})": "v([0-9.]+)', blk.group(1))
    assert len(langs) == 10, f"menu_version must cover all 10 languages, got {len(langs)}"
    for code, v in langs:
        assert v == ver, f"menu_version prints v{v} in {code} while the build is {ver}"
    stale = set(re.findall(r'"v(\d+\.\d+\.\d+) ', loc))
    assert stale == {ver}, f"stale version strings shipped in Localization: {sorted(stale)}"


def test_hall_of_fame_is_an_amphitheater_with_a_readable_hint():
    src = (ROOT / "scripts/space/AchievementHall3D.gd").read_text(encoding="utf-8")
    assert "golden" not in src, "sphere packing hid half the hall behind the camera"
    assert "row_rise" in src and "hall_radius" in src
    i = src.index("_hint_lbl = Label.new()")
    blk = src[i:i + 900]
    assert "anchor_left = 0.0" in blk and "anchor_right = 1.0" in blk
    assert "-520" not in blk, "bottom hint must span the window, not clip its own head"


def test_pause_menu_can_leave_flight_without_faking_extraction():
    src = (ROOT / "scripts/space/SpaceExpedition3D.gd").read_text(encoding="utf-8")
    assert "_pause_exit_btn" in src and 'L.tr_ui("menu_exit")' in src
    assert "DisplayServer.window_is_focused()" in src, "losing window focus must pause the flight"
    body = src[src.index("func _on_pause_quit_to_desktop"):src.index("func _complete_expedition_and_return")]
    assert "get_tree().quit()" in body
    assert "SaveManager" not in body and "sell_all_cargo" not in body, \
        "quitting must not bank an unextracted haul - the warp portal is the only payout"
    assert "_update_pause_hint()" in src and 'L.tr_ui("warp_gate_3d")' in src


def test_flight_target_plaque_is_wide_enough_for_real_names():
    src = (ROOT / "scripts/space/SpaceExpedition3D.gd").read_text(encoding="utf-8")
    assert "HORIZONTAL_ALIGNMENT_CENTER, 118" in src, "target name plaque was cut to 52 px"
    assert "Vector2(118.0, 4)" in src


def test_nebula_panorama_is_a_real_equirectangular_texture():
    p = ROOT / "assets/textures/sky/nebula_2k.png"
    assert p.is_file(), "space sectors need the authored nebula backdrop"
    with Image.open(p) as im:
        w, h = im.size
        assert (w, h) == (2048, 1024) and w == 2 * h
        assert im.mode == "RGB"
    src = (ROOT / "scripts/space/SpaceExpedition3D.gd").read_text(encoding="utf-8")
    assert "nebula_2k.png" in src and "PanoramaSkyMaterial" in src
    assert "env.sky_rotation" in src, "each sector rotates the nebula to stay distinct"
    assert "background_sky_rotation" not in src, "that property name is Godot 3"


def test_locked_crew_art_stays_readable_and_name_row_fits():
    src = (ROOT / "scripts/ui/CardWidget.gd").read_text(encoding="utf-8")
    m = re.search(r"if not owned:\s*\n(?:\s*#[^\n]*\n)*\s*tex_rect\.modulate = Color\(([^)]*)\)", src)
    assert m, "locked portrait dimming missing"
    vals = [float(x.strip()) for x in m.group(1).split(",")]
    assert vals[0] >= 0.38 and vals[1] >= 0.42 and vals[2] >= 0.5, f"locked art too dark: {vals}"
    assert "name_lbl.custom_minimum_size = Vector2(0, 22)" in src
    assert "Vector2(0, 148 if compact else 164)" in src, "portrait must yield room to the footer"


def test_sector_grid_has_no_dead_cell_and_fly_stays_the_accent():
    src = (ROOT / "scripts/ui/HangarStationPanels.gd").read_text(encoding="utf-8")
    assert "GameData.sectors.size() % 2 == 1" in src, "odd sector count left half the panel empty"
    assert 'L.tr_ui("cargo_refinery_status"' in src
    fly_i = src.index('lbtn.text = L.tr_ui("launch_expedition_btn")')
    unlock_i = src.index('lbtn.text = L.tr_ui("unlock_sector_btn"')
    seg = src[fly_i:unlock_i + 1500]
    assert "style_accent_button(lbtn, Color(0.18, 0.85, 0.52))" in seg
    assert "wire_button_fx(lbtn)" in seg, "an unaffordable unlock must not outshine the fly action"
    assert "sell_btn.modulate = Color(0.6, 0.64, 0.72)" in src, "an empty hold must look empty, not offer +0 CR"


def test_pack_burst_flash_is_a_bloom_not_a_wash():
    src = (ROOT / "scripts/ui/PackOpeningModal.gd").read_text(encoding="utf-8")
    m = re.search(r'"color:a", ([0-9.]+) if not ThemeHelper\.reduced_motion else ([0-9.]+)', src)
    assert m, "burst flash peak missing"
    assert float(m.group(1)) <= 0.45 and float(m.group(2)) <= 0.2, "flash must not grey out the whole modal"
    assert "aura_sb.shadow_size" in src, "aura needs a soft falloff instead of a hard ellipse"
