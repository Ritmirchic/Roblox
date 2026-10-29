"""Fast source-contract checks; these do not replace Godot runtime testing."""

from pathlib import Path
import struct
import unittest

ROOT = Path(__file__).resolve().parents[1]


class ProjectSourceContract(unittest.TestCase):
    def test_main_scene_and_resources_exist(self):
        project = (ROOT / "project.godot").read_text(encoding="utf-8")
        self.assertIn('run/main_scene="res://scenes/main.tscn"', project)
        scene = (ROOT / "scenes/main.tscn").read_text(encoding="utf-8")
        self.assertIn('path="res://scripts/game.gd"', scene)
        paths = (
            "scripts/game.gd",
            "scripts/car.gd",
            "scripts/world.gd",
            "scripts/minimap.gd",
            "scripts/input_setup.gd",
            "scripts/ui_skin.gd",
            "tools/export_windows.sh",
            "tools/build_matrix.sh",
            "assets/icon.svg",
        )
        for path in paths:
            self.assertTrue((ROOT / path).is_file(), path)

    def test_original_audio_asset_is_a_valid_wav(self):
        data = (ROOT / "assets/engine_loop.wav").read_bytes()
        self.assertGreater(len(data), 1000)
        self.assertEqual(data[:4], b"RIFF")
        self.assertEqual(data[8:12], b"WAVE")
        channels = struct.unpack_from("<H", data, 22)[0]
        sample_rate = struct.unpack_from("<I", data, 24)[0]
        self.assertEqual(channels, 1)
        self.assertEqual(sample_rate, 22050)

    def test_driving_racing_weather_and_cockpit_hooks_exist(self):
        car = (ROOT / "scripts/car.gd").read_text(encoding="utf-8")
        game = (ROOT / "scripts/game.gd").read_text(encoding="utf-8")
        world = (ROOT / "scripts/world.gd").read_text(encoding="utf-8")
        for feature in (
            "_integrate_forces",
            "intersect_ray",
            "SUSPENSION_STIFFNESS",
            "drivetrain",
            "apply_force",
            "cockpit_speed_display",
            "steering_wheel_node.rotation.z",
        ):
            self.assertIn(feature, car)
        for feature in (
            "_begin_race",
            "_update_race_progress",
            "_finish_race",
            "_save_game",
            "_load_save",
        ):
            self.assertIn(feature, game)
        route_names = ("Azure Run", "Greenvale Rally", "Silver Pass")
        self.assertEqual(sum(world.count(f'"{name}"') for name in route_names), 3)
        self.assertIn("create_trimesh_shape", world)
        for feature in ("set_weather", "_apply_day_phase", "CPUParticles3D"):
            self.assertIn(feature, world)

    def test_windows_export_targets_64_bit_with_embedded_data(self):
        preset = (ROOT / "export_presets.cfg").read_text(encoding="utf-8")
        self.assertIn('platform="Windows Desktop"', preset)
        self.assertIn('binary_format/architecture="x86_64"', preset)
        self.assertIn("binary_format/embed_pck=true", preset)
        self.assertIn("name=\"Windows Desktop (External PCK)\"", preset)
        self.assertIn("binary_format/embed_pck=false", preset)
        matrix = (ROOT / "tools/build_matrix.sh").read_text(encoding="utf-8")
        self.assertIn("HV_ATTEMPTS:-10", matrix)
        self.assertIn("HORIZON_VELOCITY.exe", preset)


if __name__ == "__main__":
    unittest.main()
