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
