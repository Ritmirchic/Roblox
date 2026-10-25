"""Repository-level release checks that need only Python's standard library."""
from pathlib import Path
import re
import struct
import unittest
import wave

ROOT = Path(__file__).resolve().parents[1]


class ReleaseContractTests(unittest.TestCase):
    def test_all_thirty_anomalies_are_declared_and_dispatched(self):
        source = (ROOT / "scripts" / "anomaly_director.gd").read_text(encoding="utf-8")
        catalog = source.split("const CATALOG := [", 1)[1].split("\n]\n", 1)[0]
        titles = re.findall(r'"title":\s*"([^"]+)"', catalog)
        self.assertEqual(len(titles), 30, f"catalog contains {len(titles)} titles")
        cases = {int(number) for number in re.findall(r"^\s*(\d+):$", source, re.MULTILINE)}
        self.assertEqual(cases, set(range(1, 31)), "every catalog ID needs a runtime match case")
        self.assertIn("func clear()", source, "anomalies need reset behavior")
        self.assertIn("func begin(index: int)", source, "anomalies need a runtime activation API")

    def test_original_sound_library_is_valid_pcm(self):
        expected = {
            "ambience.wav", "footstep.wav", "whisper.wav", "knock.wav", "scream.wav",
            "radio.wav", "elevator.wav", "breath.wav", "creak.wav", "entity.wav",
        }
        found = {path.name for path in (ROOT / "assets" / "audio").glob("*.wav")}
        self.assertTrue(expected <= found, f"missing cues: {sorted(expected - found)}")
        for filename in expected:
            with wave.open(str(ROOT / "assets" / "audio" / filename), "rb") as clip:
                self.assertEqual(clip.getframerate(), 22050)
                self.assertEqual(clip.getnchannels(), 1)
                self.assertEqual(clip.getsampwidth(), 2)
                self.assertGreater(clip.getnframes(), 1000)

    def test_world_and_all_three_story_routes_are_present(self):
        world = (ROOT / "scripts" / "world_builder.gd").read_text(encoding="utf-8")
        game = (ROOT / "scripts" / "game.gd").read_text(encoding="utf-8")
        for landmark in [
            "maintenance", "laundry", "storage", "records", "_build_basement",
            "hidden_archive_door", "basement_emergency_exit", "elevator_doors",
        ]:
            self.assertIn(landmark, world)
        for ending in ["_ending_stairs", "_ending_elevator", "_ending_archive"]:
            self.assertIn(f"func {ending}()", game)
        self.assertIn("func validate_layout()", world)
        self.assertIn("func _write_save()", game)

    def test_windows_release_assets_exist(self):
        self.assertTrue((ROOT / "export_presets.cfg").is_file())
        self.assertTrue((ROOT / "installer" / "DONT_LOOK_BACK.iss").is_file())
        self.assertTrue((ROOT / "tools" / "build_windows.ps1").is_file())
        ico = (ROOT / "assets" / "icon.ico").read_bytes()
        self.assertEqual(struct.unpack_from("<HHH", ico), (0, 1, 1))
        self.assertTrue((ROOT / "assets" / "loading_splash.png").read_bytes().startswith(b"\x89PNG"))

    def test_godot_project_has_no_editor_or_debug_main_scene(self):
        project = (ROOT / "project.godot").read_text(encoding="utf-8")
        self.assertIn('config/name="DON\'T LOOK BACK"', project)
        self.assertIn('run/main_scene="res://scenes/game.tscn"', project)
        self.assertIn('renderer/rendering_method="gl_compatibility"', project)
        for resource in [
            "scenes/game.tscn", "scripts/game.gd", "scripts/world_builder.gd",
            "scripts/player_controller.gd", "scripts/anomaly_director.gd",
            "scripts/entity_ai.gd", "scripts/door.gd",
        ]:
            self.assertTrue((ROOT / resource).is_file(), f"missing project resource {resource}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
