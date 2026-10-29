"""Offline structural checks for the Horizon Velocity Godot source slice."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "project"


class ProjectStructureTests(unittest.TestCase):
    def test_main_scene_and_autoload_are_configured(self):
        config = (PROJECT / "project.godot").read_text()
        self.assertIn('run/main_scene="res://Main.tscn"', config)
        self.assertIn('SaveData="*res://scripts/save_data.gd"', config)
        self.assertTrue((PROJECT / "Main.tscn").is_file())
        sections = re.findall(r"^\[[^\]]+\]$", config, re.MULTILINE)
        self.assertEqual(len(sections), len(set(sections)), "duplicate project.godot sections")

    def test_driving_is_force_based_and_has_four_contact_points(self):
        vehicle = (PROJECT / "scripts/vehicle.gd").read_text()
        self.assertIn("extends RigidBody3D", vehicle)
        self.assertIn("const WHEEL_ANCHORS := [", vehicle)
        self.assertEqual(vehicle.split("const WHEEL_ANCHORS := [", 1)[1].split("]", 1)[0].count("Vector3("), 4)
        self.assertIn("apply_force(", vehicle)
        self.assertIn("create(origin, origin + down * MAX_RAY, 1)", vehicle)
        self.assertIn("func _surface_grip", vehicle)
        self.assertIn('drivetrain == "AWD"', vehicle)
        self.assertIn('drivetrain == "RWD"', vehicle)
        self.assertIn('drivetrain == "FWD"', vehicle)

    def test_variant_based_values_have_explicit_godot_types(self):
        main = (PROJECT / "scripts/main.gd").read_text()
        vehicle = (PROJECT / "scripts/vehicle.gd").read_text()
        self.assertIn("var result: Dictionary = item.duplicate()", main)
        self.assertIn("var y: float = (", vehicle)
        self.assertIn("var x: float = taper * float(row[1])", vehicle)

    def test_race_has_world_checkpoints_results_and_rewards(self):
        main = (PROJECT / "scripts/main.gd").read_text()
        self.assertIn("const EVENT_ID :=", main)
        self.assertIn("func _begin_countdown", main)
        self.assertIn("func _finish_race", main)
        self.assertIn("distance_to(race_route[checkpoint_index])", main)
        self.assertIn("SaveData.mark_event(EVENT_ID", main)
        self.assertGreaterEqual(main.split("var race_route", 1)[1].split("\n]", 1)[0].count("Vector3("), 10)
        self.assertIn("set_ai_route(race_route", main)

    def test_world_roads_have_static_collision_and_weather(self):
        world = (PROJECT / "scripts/world_builder.gd").read_text()
        self.assertIn("mesh.create_trimesh_shape()", world)
        self.assertIn("func set_weather", world)
        self.assertIn("func is_night", world)
        self.assertIn("func set_quality", world)
        self.assertIn("_build_festival()", world)
        self.assertIn("_build_biomes()", world)

    def test_persistent_profile_and_windows_export_preset_exist(self):
        save = (PROJECT / "scripts/save_data.gd").read_text()
        preset = (PROJECT / "export_presets.cfg").read_text()
        self.assertIn("user://horizon_velocity_save.json", save)
        self.assertIn("func load_game", save)
        self.assertIn("func save_game", save)
        self.assertIn('platform="Windows Desktop"', preset)
        self.assertIn('binary_format/architecture="x86_64"', preset)
        self.assertTrue((ROOT / "tools/export_windows.sh").is_file())

    def test_interface_exposes_gameplay_screens(self):
        interface = (PROJECT / "scripts/interface.gd").read_text()
        for method in ("show_title", "show_hud", "show_garage", "show_settings", "show_results", "show_pause"):
            self.assertIn(f"func {method}", interface)


if __name__ == "__main__":
    unittest.main()
