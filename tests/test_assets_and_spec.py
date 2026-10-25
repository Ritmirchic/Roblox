import hashlib
import pathlib
import re
import subprocess
import wave

from PIL import Image
import pygltflib

ROOT = pathlib.Path(__file__).resolve().parent.parent


def test_all_gdscripts_parse_cleanly():
    gd_files = sorted(ROOT.glob("scripts/**/*.gd")) + sorted(ROOT.glob("tests/*.gd"))
    assert len(gd_files) >= 18
    cmd = [str(ROOT / ".venv" / "bin" / "gdparse")] + [str(f) for f in gd_files]
    res = subprocess.run(cmd, capture_output=True, text=True)
    assert res.returncode == 0, f"gdparse failed:\n{res.stderr}\n{res.stdout}"


def test_all_res_paths_exist():
    # Static literal res:// paths (excluding dynamic % formatting strings)
    pat = re.compile(r'"res://([^"%\n]+)"')
    checked = 0
    for f in list(ROOT.glob("scripts/**/*.gd")) + list(ROOT.glob("scenes/**/*.tscn")) + [ROOT / "project.godot", ROOT / "export_presets.cfg"]:
        txt = f.read_text(encoding="utf-8")
        for m in pat.finditer(txt):
            rel = m.group(1)
            # Ignore directory prefixes ending with '/'
            if rel.endswith("/"):
                assert (ROOT / rel).is_dir(), f"Missing directory res://{rel} referenced in {f.name}"
            else:
                target = ROOT / rel
                assert target.is_file() and target.stat().st_size > 0, f"Missing asset res://{rel} referenced in {f.name}"
                checked += 1
    assert checked >= 45


def test_no_emojis_in_game_scripts():
    emoji_re = re.compile(r"[\U0001F300-\U0001FAFF\u2600-\u27BF]")
    for f in ROOT.glob("scripts/**/*.gd"):
        txt = f.read_text(encoding="utf-8")
        assert not emoji_re.search(txt), f"Forbidden emoji character found in {f}"


def test_53_glb_3d_models_have_pbr_textures_and_normals():
    glbs = sorted((ROOT / "assets" / "models").rglob("*.glb"))
    assert len(glbs) == 53
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


def test_42_unique_crew_cards_and_30_achievement_cards():
    crew_pngs = sorted((ROOT / "assets" / "cards" / "crew").glob("crew_*.png"))
    assert len(crew_pngs) == 42
    hashes = set()
    for p in crew_pngs:
        im = Image.open(p)
        assert im.size == (360, 440)
        hashes.add(hashlib.sha256(p.read_bytes()).hexdigest())
    assert len(hashes) == 42, "Every single one of the 42 Crew Card illustrations must be unique!"

    ach_pngs = sorted((ROOT / "assets" / "cards" / "achievements").glob("ach_*.png"))
    assert len(ach_pngs) == 30
    ach_hashes = {hashlib.sha256(p.read_bytes()).hexdigest() for p in ach_pngs}
    assert len(ach_hashes) == 30, "Every single one of the 30 Achievement Card illustrations must be unique!"


def test_23_wav_audio_files_valid():
    wavs = sorted((ROOT / "assets" / "audio").glob("*.wav"))
    assert len(wavs) == 23
    for w in wavs:
        with wave.open(str(w), "rb") as wf:
            assert wf.getnchannels() == 1
            assert wf.getsampwidth() == 2
            assert wf.getnframes() > 500
