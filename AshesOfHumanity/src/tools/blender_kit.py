#!/usr/bin/env python3
"""Original game-ready asset pipeline built on headless Blender (bpy 5.x).

Generates modular architecture, props, weapons, nature, mutant creatures and
bosses, and exports each as a GLB with PBR materials and sensibly named
segments so Godot can drive procedural animation. Run with the stubs-enabled
venv python; no display server required.
"""
import bpy
import math
import os
import sys

OUT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..",
                                    "assets", "models"))
os.makedirs(OUT, exist_ok=True)


# --------------------------------------------------------------------- utils
def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    # Persistent materials carry a fake user (see material()); only purge
    # geometry/data blocks here.
    for datablocks in (bpy.data.meshes, bpy.data.curves,
                       bpy.data.cameras, bpy.data.lights):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def material(name, color, roughness=0.7, metallic=0.0, emission=None,
             emission_strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_fake_user = True
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return m


def assign(obj, mat):
    obj.data.materials.append(mat)
    return obj


def join_parts(parts, name):
    active = parts[0]
    bpy.ops.object.select_all(action="DESELECT")
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = active
    bpy.ops.object.join()
    active.name = name
    return active


def box(name, loc, scale, mat, bevel=0.0, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        mod = o.modifiers.new("bev", "BEVEL")
        mod.width = bevel
        mod.segments = 2
        bpy.ops.object.modifier_apply(modifier=mod.name)
    assign(o, mat)
    return o


def cyl(name, loc, radius, depth, mat, vertices=12, rot=(0, 0, 0),
        radius2=None):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices, radius1=radius,
        radius2=radius if radius2 is None else radius2, depth=depth,
        location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    assign(o, mat)
    return o


def sphere(name, loc, scale, mat, segments=12, rings=6):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings,
                                         radius=1.0, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign(o, mat)
    return o


def torus(name, loc, major, minor, mat, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major, minor_radius=minor, major_segments=12,
        minor_segments=6, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    assign(o, mat)
    return o


def export_glb(name):
    path = os.path.join(OUT, name + ".glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB",
                              export_apply=True)
    print("exported", name, flush=True)


# ----------------------------------------------------------------- materials
class M:
    concrete = None
    dark_concrete = None
    rust = None
    metal = None
    wood = None
    dark_wood = None
    glass = None
    fabric = None
    rubber = None
    skin = None
    blood = None
    emissive_red = None
    moss = None
    car_blue = None
    car_rust = None
    bone = None
    mutant_flesh = None
    mutant_dark = None


def init_materials():
    M.concrete = material("concrete", (0.42, 0.41, 0.39), 0.85)
    M.dark_concrete = material("dark_concrete", (0.22, 0.22, 0.23), 0.9)
    M.rust = material("rust", (0.45, 0.24, 0.13), 0.8, 0.35)
    M.metal = material("metal", (0.31, 0.33, 0.36), 0.45, 0.85)
    M.wood = material("wood", (0.42, 0.3, 0.18), 0.8)
    M.dark_wood = material("dark_wood", (0.2, 0.14, 0.09), 0.85)
    M.glass = material("glass", (0.1, 0.14, 0.16), 0.15, 0.1)
    M.fabric = material("fabric", (0.23, 0.25, 0.2), 0.9)
    M.rubber = material("rubber", (0.05, 0.05, 0.06), 0.95)
    M.skin = material("skin", (0.62, 0.5, 0.42), 0.7)
    M.blood = material("blood", (0.25, 0.03, 0.03), 0.35)
    M.emissive_red = material("emissive_red", (0.6, 0.05, 0.03), 0.4,
                              emission=(1.0, 0.08, 0.04),
                              emission_strength=3.0)
    M.moss = material("moss", (0.2, 0.28, 0.14), 0.95)
    M.car_blue = material("car_blue", (0.12, 0.2, 0.3), 0.5, 0.6)
    M.car_rust = material("car_rust", (0.33, 0.2, 0.13), 0.85, 0.4)
    M.bone = material("bone", (0.72, 0.68, 0.58), 0.8)
    M.mutant_flesh = material("mutant_flesh", (0.45, 0.43, 0.38), 0.6)
    M.mutant_dark = material("mutant_dark", (0.16, 0.17, 0.15), 0.7)
    M.contaminated = material("contaminated", (0.3, 0.42, 0.2), 0.5,
                              emission=(0.25, 0.7, 0.15),
                              emission_strength=1.4)


# ------------------------------------------------------------- architecture
def arch_kit():
    reset_scene()
    parts = []
    # wall plain 4x3x0.25 with damaged top edge
    parts.append(box("wall_plain", (0, 0, 1.5), (4, 0.25, 3), M.concrete, 0.03))
    parts.append(box("wall_damage", (1.4, 0, 3.05), (0.8, 0.28, 0.35),
                     M.dark_concrete, 0.05))
    # wall with window opening (two pillars + lintel + sill)
    parts.append(box("win_l", (-1.3, 0, 1.5), (1.4, 0.25, 3), M.concrete, 0.03))
    parts.append(box("win_r", (1.3, 0, 1.5), (1.4, 0.25, 3), M.concrete, 0.03))
    parts.append(box("win_top", (0, 0, 2.55), (1.2, 0.25, 0.9), M.concrete, 0.03))
    parts.append(box("win_bottom", (0, 0, 0.45), (1.2, 0.25, 0.9),
                     M.concrete, 0.03))
    parts.append(box("win_glass", (0, 0, 1.5), (1.1, 0.05, 1.1), M.glass))
    parts.append(box("win_frame", (0, -0.02, 1.5), (1.2, 0.08, 0.08), M.metal))
    # wall with door opening
    parts.append(box("door_l", (-1.35, 0, 1.4), (1.3, 0.25, 2.8), M.concrete, 0.03))
    parts.append(box("door_r", (1.35, 0, 1.4), (1.3, 0.25, 2.8), M.concrete, 0.03))
    parts.append(box("door_top", (0, 0, 2.55), (1.4, 0.25, 0.9), M.concrete, 0.03))
    # floor slab and roof slab
    parts.append(box("floor_slab", (0, 0, -0.1), (4, 4, 0.2), M.dark_concrete, 0.02))
    parts.append(box("roof_slab", (0, 0, 3.1), (4.4, 4.4, 0.25), M.concrete, 0.02))
    # standalone door (hinged visual frame + panel)
    parts.append(box("door_panel", (0, 0, 1.2), (1.1, 0.08, 2.4), M.wood, 0.02))
    parts.append(box("door_handle", (0.4, -0.08, 1.2), (0.08, 0.12, 0.08),
                     M.metal))
    # pillar
    parts.append(box("pillar", (0, 0, 2), (0.5, 0.5, 4), M.concrete, 0.04))
    # stairs (5 steps)
    for i in range(5):
        parts.append(box(f"step_{i}", (0, i * 0.35, i * 0.18 + 0.09),
                         (1.4, 0.4, 0.18), M.concrete, 0.01))
    # barricade plank + sandbag wall + fence panel
    parts.append(box("barricade", (0, 0, 0.6), (2.4, 0.12, 1.2), M.wood, 0.02,
                     rot=(0, math.radians(70), 0)))
    for i in range(4):
        parts.append(box(f"sandbag_{i}", (0, 0, 0.15 + i * 0.22),
                         (1.6, 0.5, 0.25), M.fabric, 0.1,
                     rot=(0, 0, math.radians(3 if i % 2 else -3))))
    parts.append(box("fence_frame_l", (-1.4, 0, 1.1), (0.1, 0.1, 2.2), M.metal))
    parts.append(box("fence_frame_r", (1.4, 0, 1.1), (0.1, 0.1, 2.2), M.metal))
    for i in range(3):
        parts.append(box(f"fence_bar_{i}", (0, 0, 0.4 + i * 0.7),
                         (2.9, 0.06, 0.06), M.metal))
    join_parts(parts, "arch_kit")
    export_glb("arch_kit")


# -------------------------------------------------------------------- props
def prop_crate():
    reset_scene()
    p = [box("crate_body", (0, 0, 0.5), (1.1, 1.1, 1.0), M.wood, 0.04)]
    for z in (0.15, 0.85):
        p.append(box("crate_band", (0, 0, z), (1.14, 1.14, 0.1), M.dark_wood))
    p.append(box("crate_cross", (0, -0.56, 0.5), (0.9, 0.05, 0.12),
                 M.dark_wood, rot=(0, 0, math.radians(35))))
    join_parts(p, "prop_crate")
    export_glb("prop_crate")


def prop_barrel():
    reset_scene()
    p = [cyl("barrel_body", (0, 0, 0.6), 0.42, 1.2, M.rust, vertices=14),
         torus("barrel_ring1", (0, 0, 0.25), 0.42, 0.03, M.metal),
         torus("barrel_ring2", (0, 0, 0.95), 0.42, 0.03, M.metal),
         cyl("barrel_lid", (0, 0, 1.21), 0.38, 0.04, M.metal, vertices=14)]
    join_parts(p, "prop_barrel")
    export_glb("prop_barrel")


def prop_shelf():
    reset_scene()
    p = [box("shelf_back", (0, 0.45, 1.1), (2, 0.08, 2.2), M.metal)]
    for x in (-0.95, 0.95):
        p.append(box("shelf_side", (x, 0, 1.1), (0.08, 0.9, 2.2), M.metal))
    for z in (0.15, 0.85, 1.55, 2.15):
        p.append(box("shelf_board", (0, 0, z), (2, 0.9, 0.06), M.metal))
    for i in range(6):
        p.append(box(f"shelf_box_{i}",
                     (-0.6 + (i % 3) * 0.6, 0, 0.35 + (i // 3) * 0.7),
                     (0.4, 0.5, 0.3), M.wood, 0.02))
    join_parts(p, "prop_shelf")
    export_glb("prop_shelf")


def prop_furniture():
    reset_scene()
    p = []
    # table
    p.append(box("table_top", (0, 0, 0.95), (2, 1, 0.08), M.wood, 0.02))
    for x in (-0.9, 0.9):
        for y in (-0.4, 0.4):
            p.append(box("table_leg", (x, y, 0.47), (0.1, 0.1, 0.94),
                         M.dark_wood))
    # chair
    p.append(box("chair_seat", (2.2, 0, 0.55), (0.55, 0.55, 0.07), M.wood))
    for x in (1.98, 2.42):
        for y in (-0.2, 0.2):
            p.append(box("chair_leg", (x, y, 0.27), (0.07, 0.07, 0.54),
                         M.dark_wood))
    p.append(box("chair_back", (2.44, 0, 0.95), (0.07, 0.55, 0.8), M.wood))
    # bed frame + mattress
    p.append(box("bed_frame", (-2.4, 0, 0.3), (2.1, 1, 0.25), M.metal, 0.03))
    p.append(box("bed_mattress", (-2.4, 0, 0.52), (2, 0.95, 0.22),
                 M.fabric, 0.08))
    p.append(box("bed_pillow", (-3.1, 0, 0.68), (0.4, 0.6, 0.12),
                 M.fabric, 0.06))
    # locker
    p.append(box("locker_body", (0, 1.8, 1.1), (0.8, 0.6, 2.2), M.metal, 0.03))
    p.append(box("locker_door", (0, 1.48, 1.1), (0.7, 0.04, 2.0),
                 M.dark_concrete, 0.02))
    p.append(box("locker_vent", (0, 1.45, 1.7), (0.4, 0.03, 0.3),
                 M.rust))
    join_parts(p, "prop_furniture")
    export_glb("prop_furniture")


def prop_car():
    reset_scene()
    p = []
    # wrecked sedan, ~4.2 m long
    p.append(box("car_chassis", (0, 0, 0.55), (4.2, 1.8, 0.5), M.car_rust, 0.12))
    p.append(box("car_cabin", (-0.3, 0, 1.15), (2.1, 1.65, 0.8),
                 M.car_blue, 0.12, rot=(0, 0, math.radians(-4))))
    p.append(box("car_hood", (1.5, 0, 0.95), (1.1, 1.7, 0.3), M.car_blue, 0.08))
    p.append(box("car_trunk", (-1.7, 0, 0.9), (0.8, 1.7, 0.35),
                 M.car_rust, 0.08))
    p.append(box("car_windshield", (0.65, 0, 1.25), (0.08, 1.5, 0.6),
                 M.glass, rot=(0, math.radians(25), 0)))
    p.append(box("car_rearwindow", (-1.25, 0, 1.25), (0.08, 1.5, 0.55),
                 M.glass, rot=(0, math.radians(-20), 0)))
    for x in (-1.4, 1.4):
        for y in (-0.85, 0.85):
            p.append(cyl("car_wheel", (x, y, 0.4), 0.38, 0.3, M.rubber,
                         vertices=14, rot=(math.pi / 2, 0, 0)))
    p.append(box("car_headlight_l", (2.12, -0.6, 0.75), (0.08, 0.35, 0.2),
                 M.emissive_red))
    p.append(box("car_rust_patch", (0.8, -0.91, 0.6), (0.7, 0.04, 0.3),
                 M.rust))
    join_parts(p, "prop_car_wreck")
    export_glb("prop_car_wreck")


def prop_industrial():
    reset_scene()
    p = []
    # generator
    p.append(box("gen_frame", (0, 0, 0.5), (1.6, 1, 1), M.metal, 0.05))
    p.append(cyl("gen_motor", (-0.3, 0, 0.85), 0.3, 0.6, M.dark_concrete,
                 vertices=12, rot=(math.pi / 2, 0, 0)))
    p.append(box("gen_panel", (0.55, -0.51, 0.7), (0.4, 0.05, 0.5),
                 M.rust))
    p.append(box("gen_light", (0.55, -0.55, 0.9), (0.1, 0.04, 0.1),
                 M.emissive_red))
    for x in (-0.6, 0.6):
        p.append(box("gen_foot", (x, 0, 0.08), (0.2, 0.8, 0.16), M.rubber))
    # workbench
    p.append(box("bench_top", (2.4, 0, 1.0), (2.2, 0.9, 0.1), M.wood))
    for x in (1.5, 3.3):
        for y in (-0.35, 0.35):
            p.append(box("bench_leg", (x, y, 0.5), (0.1, 0.1, 1.0), M.metal))
    p.append(box("bench_vice", (3.1, -0.2, 1.15), (0.35, 0.3, 0.25),
                 M.metal, 0.03))
    # dumpster
    p.append(box("dumpster", (-2.6, 0, 0.7), (2, 1.2, 1.3), M.rust, 0.08))
    p.append(box("dumpster_lid", (-2.6, 0, 1.42), (2.1, 1.3, 0.1),
                 M.dark_concrete, 0.04, rot=(math.radians(8), 0, 0)))
    # gas can + traffic cone
    p.append(box("gascan", (0, 1.6, 0.3), (0.35, 0.25, 0.55), M.rust, 0.05))
    p.append(cyl("cone", (1.6, 1.6, 0.35), 0.22, 0.7,
                 material("cone_orange", (0.85, 0.35, 0.08), 0.7),
                 vertices=10, radius2=0.05))
    join_parts(p, "prop_industrial")
    export_glb("prop_industrial")


def prop_streetlight():
    reset_scene()
    p = [cyl("pole", (0, 0, 3), 0.09, 6, M.metal, vertices=10),
         box("arm", (0.5, 0, 5.9), (1.1, 0.1, 0.1), M.metal),
         box("lamp_head", (1.05, 0, 5.75), (0.35, 0.3, 0.2),
             M.dark_concrete, 0.04),
         sphere("lamp_bulb", (1.05, 0, 5.6), (0.12, 0.12, 0.12),
                material("lamp_glow", (0.9, 0.85, 0.6), 0.3,
                         emission=(1.0, 0.9, 0.6),
                         emission_strength=4.0))]
    join_parts(p, "prop_streetlight")
    export_glb("prop_streetlight")


def prop_debris():
    reset_scene()
    p = []
    for i in range(10):
        ang = i * 0.7
        p.append(box(f"rubble_{i}",
                     (math.cos(ang) * 0.6, math.sin(ang) * 0.6, 0.1 + i * 0.03),
                     (0.3 + (i % 3) * 0.12, 0.3, 0.2), M.concrete, 0.03,
                     rot=(ang, ang * 0.5, ang * 0.3)))
    for i in range(4):
        p.append(cyl(f"pipe_{i}", (i * 0.3 - 0.5, 0.4, 0.12), 0.08, 1.4,
                     M.rust, vertices=8, rot=(math.pi / 2, 0, i * 0.4)))
    p.append(torus("tire", (-0.6, -0.5, 0.25), 0.35, 0.12, M.rubber,
                   rot=(math.pi / 2, 0, 0)))
    join_parts(p, "prop_debris")
    export_glb("prop_debris")


# ------------------------------------------------------------------ weapons
def weapon_kit():
    reset_scene()
    p = []
    # knife
    p.append(box("knife_blade", (0, 0, 0.35), (0.06, 0.5, 0.12),
                 M.metal, 0.02))
    p.append(box("knife_grip", (0, -0.32, 0.35), (0.09, 0.22, 0.1),
                 M.rubber, 0.02))
    # fire axe
    p.append(cyl("axe_handle", (0.3, 0, 0.55), 0.035, 1.1, M.wood,
                 vertices=8, rot=(0, 0, 0)))
    p.append(box("axe_head", (0.3, 0, 1.05), (0.35, 0.1, 0.28),
                 M.metal, 0.03))
    # pipe bat
    p.append(cyl("bat_pipe", (0.65, 0, 0.5), 0.06, 1.0, M.rust,
                 vertices=10))
    # pistol
    p.append(box("pistol_body", (1.05, 0, 0.3), (0.1, 0.3, 0.16),
                 M.metal, 0.02))
    p.append(box("pistol_grip", (1.05, -0.12, 0.12), (0.09, 0.16, 0.22),
                 M.rubber, 0.02, rot=(math.radians(-15), 0, 0)))
    p.append(cyl("pistol_barrel", (1.05, 0.12, 0.3), 0.035, 0.22,
                 M.dark_concrete, vertices=8, rot=(math.pi / 2, 0, 0)))
    # shotgun
    p.append(cyl("shot_barrel", (1.6, 0, 0.45), 0.04, 0.9, M.metal,
                 vertices=10, rot=(math.pi / 2, 0, 0)))
    p.append(box("shot_pump", (1.6, -0.05, 0.4), (0.08, 0.25, 0.08),
                 M.wood))
    p.append(box("shot_stock", (1.6, -0.5, 0.42), (0.09, 0.35, 0.16),
                 M.wood, 0.03))
    # rifle
    p.append(cyl("rifle_barrel", (2.2, 0.05, 0.5), 0.03, 1.0, M.metal,
                 vertices=8, rot=(math.pi / 2, 0, 0)))
    p.append(box("rifle_body", (2.2, -0.3, 0.45), (0.09, 0.4, 0.16),
                 M.dark_concrete, 0.02))
    p.append(box("rifle_mag", (2.2, -0.28, 0.28), (0.07, 0.12, 0.22),
                 M.metal, rot=(math.radians(10), 0, 0)))
    p.append(box("rifle_scope", (2.2, -0.15, 0.6), (0.06, 0.22, 0.08),
                 M.metal, 0.02))
    p.append(box("rifle_stock", (2.2, -0.6, 0.45), (0.08, 0.3, 0.14),
                 M.wood, 0.03))
    # crossbow
    p.append(box("xbow_stock", (2.8, -0.2, 0.45), (0.08, 0.7, 0.12),
                 M.wood, 0.02))
    p.append(box("xbow_limb_l", (2.65, -0.1, 0.5), (0.5, 0.05, 0.06),
                 M.metal, rot=(0, 0, math.radians(25))))
    p.append(box("xbow_limb_r", (2.95, -0.1, 0.5), (0.5, 0.05, 0.06),
                 M.metal, rot=(0, 0, math.radians(-25))))
    p.append(cyl("xbow_bolt", (2.8, 0.1, 0.48), 0.015, 0.5, M.metal,
                 vertices=6, rot=(math.pi / 2, 0, 0)))
    join_parts(p, "weapon_kit")
    export_glb("weapon_kit")


# ------------------------------------------------------------------ nature
def nature_kit():
    reset_scene()
    p = []
    # dead tree
    p.append(cyl("trunk", (0, 0, 1.8), 0.22, 3.6, M.dark_wood, vertices=8,
                 radius2=0.12))
    for i, (z, ang, ln) in enumerate(((2.2, 0.3, 1.1), (2.7, 2.4, 0.9),
                                      (3.1, 4.2, 0.7), (1.6, 5.1, 0.8))):
        p.append(cyl(f"branch_{i}",
                     (math.cos(ang) * ln * 0.4, math.sin(ang) * ln * 0.4, z),
                     0.09, ln, M.dark_wood, vertices=6, radius2=0.03,
                     rot=(math.radians(55), 0, ang)))
    # pine
    p.append(cyl("pine_trunk", (4, 0, 1.2), 0.14, 2.4, M.dark_wood,
                 vertices=7, radius2=0.08))
    for i in range(3):
        p.append(cyl(f"pine_layer_{i}", (4, 0, 1.6 + i * 0.8),
                     1.1 - i * 0.28, 1.2,
                     material("pine", (0.12, 0.22, 0.14), 0.9),
                     vertices=9, radius2=0.05))
    # rocks
    for i, (x, s) in enumerate(((-3, 0.7), (-2, 0.4), (-3.6, 0.5))):
        p.append(sphere(f"rock_{i}", (x, 2, s * 0.5), (s, s * 0.8, s * 0.6),
                        M.dark_concrete))
    # bush and grass tufts
    for i in range(3):
        p.append(sphere(f"bush_{i}", (2 + i, 2.2, 0.35), (0.5, 0.5, 0.4),
                        M.moss, segments=8, rings=4))
    for i in range(5):
        p.append(cyl(f"grass_{i}", (-2 + i * 0.3, -2, 0.25), 0.02, 0.5,
                     M.moss, vertices=4, radius2=0.005,
                     rot=(math.radians(12 * (i % 2)), 0, i)))
    # fallen log
    p.append(cyl("log", (-1, -2.5, 0.2), 0.18, 1.8, M.dark_wood, vertices=8,
                 rot=(math.pi / 2, 0, 0.3)))
    join_parts(p, "nature_kit")
    export_glb("nature_kit")


# --------------------------------------------------------------- humanoids
def humanoid(prefix, height, flesh, accent, build=1.0, long_arms=1.0,
             head_scale=(0.22, 0.24, 0.22), extras=None):
    """Segmented humanoid; part names carry prefix for Godot lookup."""
    p = []
    hip = height * 0.52

    def named(n):
        return f"{prefix}_{n}"

    p.append(box(named("torso"), (0, 0, hip + height * 0.18),
                 (0.42 * build, 0.24 * build, height * 0.34), flesh, 0.05))
    p.append(box(named("pelvis"), (0, 0, hip - height * 0.04),
                 (0.36 * build, 0.2 * build, height * 0.12), accent, 0.04))
    p.append(sphere(named("head"), (0, 0, hip + height * 0.42),
                    head_scale, flesh, segments=10, rings=6))
    for side, x in (("l", -0.26 * build), ("r", 0.26 * build)):
        arm_len = height * 0.32 * long_arms
        p.append(cyl(named(f"arm_{side}"),
                     (x, 0, hip + height * 0.12), 0.07 * build, arm_len,
                     flesh, vertices=8, radius2=0.05))
        p.append(sphere(named(f"hand_{side}"),
                        (x, 0, hip + height * 0.12 - arm_len / 2 - 0.05),
                        (0.07, 0.06, 0.09), flesh, segments=8, rings=4))
        p.append(cyl(named(f"leg_{side}"),
                     (x * 0.55, 0, hip * 0.52), 0.09 * build,
                     height * 0.44, accent, vertices=8, radius2=0.06))
        p.append(box(named(f"foot_{side}"),
                     (x * 0.55, -0.08, 0.06), (0.13, 0.24, 0.1),
                     M.rubber, 0.02))
    if extras:
        p.extend(extras(prefix, hip, height, flesh, accent))
    return p


def player_survivor():
    reset_scene()
    jacket = material("jacket", (0.28, 0.3, 0.26), 0.85)
    jeans = material("jeans", (0.16, 0.19, 0.26), 0.9)

    def extras(prefix, hip, height, flesh, accent):
        return [
            box(f"{prefix}_backpack", (0, 0.18, hip + height * 0.18),
                (0.36, 0.2, height * 0.28), M.fabric, 0.06),
            box(f"{prefix}_vest", (0, -0.14, hip + height * 0.2),
                (0.4, 0.06, height * 0.26), M.dark_concrete, 0.03),
        ]
    p = humanoid("survivor", 1.8, jacket, jeans, build=1.0,
                 long_arms=1.0, extras=extras)
    join_parts(p, "player_survivor")
    export_glb("player_survivor")


def mutants():
    specs = [
        # name, height, flesh, accent, build, long_arms, head_scale, extras fn
        ("hollow", 1.75, M.mutant_flesh, M.mutant_dark, 0.85, 1.25,
         (0.18, 0.2, 0.26), "hollow"),
        ("crawler", 0.95, M.mutant_dark, M.mutant_flesh, 1.1, 1.8,
         (0.2, 0.16, 0.16), "crawler"),
        ("watcher", 2.1, material("watcher_skin", (0.4, 0.44, 0.4), 0.5),
         M.mutant_dark, 0.7, 1.1, (0.16, 0.18, 0.3), "watcher"),
        ("screamer", 1.6, material("screamer_skin", (0.55, 0.5, 0.45), 0.55),
         M.blood, 0.75, 1.3, (0.24, 0.22, 0.3), "screamer"),
        ("brute", 2.4, M.mutant_dark, M.rust, 1.7, 0.95,
         (0.28, 0.26, 0.26), "brute"),
        ("mimic", 1.5, material("mimic_skin", (0.48, 0.42, 0.36), 0.6),
         M.mutant_dark, 0.9, 1.2, (0.2, 0.22, 0.2), "mimic"),
        ("burrower", 1.2, material("burrower_skin", (0.36, 0.3, 0.24), 0.9),
         M.dark_concrete, 1.0, 1.5, (0.18, 0.16, 0.14), "burrower"),
        ("stalker", 1.85, material("stalker_skin", (0.24, 0.26, 0.22), 0.5),
         M.mutant_dark, 0.8, 1.35, (0.17, 0.19, 0.22), "stalker"),
        ("contaminated", 1.7, M.contaminated, M.mutant_dark, 1.05, 1.15,
         (0.21, 0.22, 0.21), "contaminated"),
        ("pale_one", 2.0, material("pale_skin", (0.72, 0.72, 0.68), 0.45),
         M.mutant_dark, 0.85, 1.4, (0.19, 0.21, 0.24), "pale"),
    ]

    def hollow_extras(prefix, hip, h, flesh, accent):
        return [sphere(f"{prefix}_eye_l", (-0.07, -0.17, hip + h * 0.43),
                       (0.03, 0.02, 0.03), M.emissive_red, segments=6, rings=4),
                sphere(f"{prefix}_eye_r", (0.07, -0.17, hip + h * 0.43),
                       (0.03, 0.02, 0.03), M.emissive_red, segments=6, rings=4)]

    def brute_extras(prefix, hip, h, flesh, accent):
        return [box(f"{prefix}_plate", (0, -0.16, hip + h * 0.2),
                    (0.5, 0.1, h * 0.3), M.rust, 0.05),
                sphere(f"{prefix}_fist_l", (-0.4, 0, hip - 0.1),
                       (0.16, 0.14, 0.16), accent, segments=8, rings=4),
                sphere(f"{prefix}_fist_r", (0.4, 0, hip - 0.1),
                       (0.16, 0.14, 0.16), accent, segments=8, rings=4)]

    def contaminated_extras(prefix, hip, h, flesh, accent):
        return [sphere(f"{prefix}_glow_l", (-0.08, -0.17, hip + h * 0.42),
                       (0.04, 0.03, 0.04), M.contaminated, segments=6, rings=4),
                sphere(f"{prefix}_glow_r", (0.08, -0.17, hip + h * 0.42),
                       (0.04, 0.03, 0.04), M.contaminated, segments=6, rings=4),
                cyl(f"{prefix}_spike", (0, 0, hip + h * 0.5), 0.04, 0.3,
                    M.bone, vertices=6, radius2=0.0)]

    def generic_extras(prefix, hip, h, flesh, accent):
        return [cyl(f"{prefix}_claw_l", (-0.26, 0, hip - h * 0.05),
                    0.02, 0.18, M.bone, vertices=5, radius2=0.0),
                cyl(f"{prefix}_claw_r", (0.26, 0, hip - h * 0.05),
                    0.02, 0.18, M.bone, vertices=5, radius2=0.0)]

    extra_map = {
        "hollow": hollow_extras, "crawler": generic_extras,
        "watcher": hollow_extras, "screamer": generic_extras,
        "brute": brute_extras, "mimic": generic_extras,
        "burrower": generic_extras, "stalker": hollow_extras,
        "contaminated": contaminated_extras, "pale": hollow_extras,
    }

    for (name, height, flesh, accent, build, la, hs, key) in specs:
        reset_scene()
        parts = humanoid(f"mut_{name}", height, flesh, accent, build=build,
                         long_arms=la, head_scale=hs,
                         extras=extra_map[key])
        join_parts(parts, f"mutant_{name}")
        export_glb(f"mutant_{name}")


def bosses():
    # Hollow King: tall emaciated crowned humanoid
    reset_scene()
    crown_mat = material("crown_metal", (0.5, 0.42, 0.16), 0.35, 0.9)
    king_flesh = material("king_flesh", (0.5, 0.47, 0.4), 0.65)

    def king_extras(prefix, hip, h, flesh, accent):
        spikes = []
        for i in range(7):
            ang = i / 7 * math.tau
            spikes.append(cyl(f"{prefix}_crown_{i}",
                              (math.cos(ang) * 0.16, math.sin(ang) * 0.16,
                               hip + h * 0.52), 0.03, 0.3, crown_mat,
                              vertices=5, radius2=0.0,
                              rot=(math.radians(20) * math.sin(ang), 0, ang)))
        spikes += [
            torus(f"{prefix}_halo_ring", (0, 0, hip + h * 0.5), 0.4, 0.03,
                  M.emissive_red, rot=(math.pi / 2, 0, 0)),
            box(f"{prefix}_rib_l", (-0.12, -0.14, hip + h * 0.2),
                (0.08, 0.05, h * 0.22), M.bone),
            box(f"{prefix}_rib_r", (0.12, -0.14, hip + h * 0.2),
                (0.08, 0.05, h * 0.22), M.bone),
        ]
        return spikes
    p = humanoid("boss_king", 3.0, king_flesh, M.mutant_dark, build=0.9,
                 long_arms=1.5, head_scale=(0.24, 0.26, 0.28),
                 extras=king_extras)
    join_parts(p, "boss_hollow_king")
    export_glb("boss_hollow_king")

    # Iron Abomination: metal-fused quadruped-ish heavy behemoth
    reset_scene()
    p = [box("boss_iron_core", (0, 0, 1.4), (1.6, 1.1, 1.4), M.rust, 0.1),
         box("boss_iron_head", (0, -1.0, 1.7), (0.8, 0.7, 0.7),
             M.metal, 0.08),
         sphere("boss_iron_eye", (0, -1.36, 1.75), (0.12, 0.06, 0.12),
                M.emissive_red, segments=8, rings=4)]
    for i, (x, y) in enumerate(((-0.9, -0.6), (0.9, -0.6),
                                (-0.9, 0.6), (0.9, 0.6))):
        p.append(cyl(f"boss_iron_leg_{i}", (x, y, 0.7), 0.18, 1.4,
                     M.metal, vertices=8, radius2=0.12))
        p.append(box(f"boss_iron_foot_{i}", (x, y - 0.1, 0.12),
                     (0.4, 0.5, 0.24), M.dark_concrete, 0.04))
    for i in range(5):
        p.append(cyl(f"boss_iron_spike_{i}",
                     (-0.5 + i * 0.25, 0, 2.2), 0.06, 0.6, M.metal,
                     vertices=6, radius2=0.0))
    p.append(box("boss_iron_saw", (1.1, -0.8, 1.2), (0.15, 0.7, 0.7),
                 M.metal, 0.05, rot=(0, math.radians(20), 0)))
    join_parts(p, "boss_iron_abomination")
    export_glb("boss_iron_abomination")

    # Forest Matriarch: bloated multi-limbed plant-mutant
    reset_scene()
    mat_flesh = material("matriarch_flesh", (0.3, 0.38, 0.22), 0.7)
    p = [sphere("boss_matr_belly", (0, 0, 1.3), (1.1, 0.95, 1.15),
                mat_flesh, segments=12, rings=7),
         sphere("boss_matr_head", (0, -0.7, 2.2), (0.4, 0.36, 0.4),
                mat_flesh, segments=10, rings=6)]
    for i in range(4):
        ang = i * math.tau / 4 + 0.4
        x, y = math.cos(ang) * 1.1, math.sin(ang) * 1.1
        p.append(cyl(f"boss_matr_limb_{i}", (x * 0.6, y * 0.6, 0.9),
                     0.14, 1.7, M.moss, vertices=8, radius2=0.06,
                     rot=(math.radians(35), 0, ang)))
        p.append(sphere(f"boss_matr_claw_{i}", (x, y, 0.25),
                        (0.2, 0.2, 0.15), M.bone, segments=6, rings=4))
    for i in range(6):
        ang = i * math.tau / 6
        p.append(cyl(f"boss_matr_tendril_{i}",
                     (math.cos(ang) * 0.5, math.sin(ang) * 0.5, 2.6),
                     0.05, 1.0, M.moss, vertices=6, radius2=0.01,
                     rot=(math.radians(30), 0, ang)))
        p.append(sphere(f"boss_matr_sac_{i}",
                        (math.cos(ang) * 0.9, math.sin(ang) * 0.9, 2.9),
                        (0.12, 0.12, 0.12), M.contaminated, segments=8, rings=5))
    join_parts(p, "boss_forest_matriarch")
    export_glb("boss_forest_matriarch")


def main():
    init_materials()
    arch_kit()
    prop_crate()
    prop_barrel()
    prop_shelf()
    prop_furniture()
    prop_car()
    prop_industrial()
    prop_streetlight()
    prop_debris()
    weapon_kit()
    nature_kit()
    player_survivor()
    mutants()
    bosses()
    print("ALL BLENDER ASSETS EXPORTED")


if __name__ == "__main__":
    main()
