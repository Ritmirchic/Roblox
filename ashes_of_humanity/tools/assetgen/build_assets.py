#!/usr/bin/env python3
# ============================================================================
#  ASHES OF HUMANITY: LAST SIGNAL
#  Asset build pipeline (runs inside Blender).
#
#    blender --background --python build_assets.py -- [--only name]
#
#  Geometry is authored procedurally with the toolkit in afbuild.py, then
#  handed to Blender for mesh finishing: vertex welding, sharp-edge aware
#  normals, edge bevels and UV layout.  The result is written in the
#  engine's native .afm / .afa formats.
# ============================================================================
import os
import sys
import math
import random

import bpy
import bmesh
import numpy as np
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)

from afbuild import MeshBuilder, MaterialTable, export_mesh, export_clips
import characters as CH
import props as P
import weapons_items as W
import buildings as B

MESH_DIR = os.path.join(ROOT, "assets", "meshes")
ANIM_DIR = os.path.join(ROOT, "assets", "animations")
TEX_DIR = os.path.join(ROOT, "assets", "textures")

_bmats = {}


# ---------------------------------------------------------------------------
def discover_texture_sets():
    sets = set()
    for fn in sorted(os.listdir(TEX_DIR)):
        if fn.endswith("_a.aft"):
            sets.add(fn[:-6])
    return sorted(sets)


def build_material_table():
    tex = discover_texture_sets()
    mats = MaterialTable(tex)
    A = mats.add
    A("Concrete", "concrete", 0.0, 0.88)
    A("ConcreteDark", "concrete_dark", 0.0, 0.90)
    A("Brick", "brick", 0.0, 0.90)
    A("Plaster", "plaster", 0.0, 0.88)
    A("PlasterDirty", "plaster_dirty", 0.0, 0.90)
    A("Wood", "wood", 0.0, 0.82)
    A("WoodDark", "wood_dark", 0.0, 0.80)
    A("MetalPainted", "painted_metal", 0.85, 0.45)
    A("PaintedMetal", "painted_metal", 0.85, 0.45)
    A("PaintedMetalGreen", "painted_metal_green", 0.85, 0.48)
    A("RustyMetal", "rusted_metal", 0.80, 0.60)
    A("RustyMetalHeavy", "rusted_metal_heavy", 0.70, 0.70)
    A("Corrugated", "corrugated", 0.85, 0.50)
    A("PeelingPaint", "peeling_paint", 0.10, 0.70)
    A("Glass", "glass_dirty", 0.05, 0.12, tint=(0.70, 0.78, 0.80))
    A("Tile", "tile", 0.0, 0.40)
    A("Asphalt", "asphalt", 0.0, 0.85)
    A("Dirt", "dirt", 0.0, 0.95)
    A("Grass", "grass", 0.0, 0.92)
    A("Foliage", "foliage", 0.0, 0.80, alpha_test=True, double_sided=True, foliage=True)
    A("Bark", "bark", 0.0, 0.93)
    A("Fabric", "fabric", 0.0, 0.92)
    A("FabricDark", "fabric", 0.0, 0.92, tint=(0.42, 0.42, 0.44))
    A("FabricRed", "fabric_red", 0.0, 0.92)
    A("Leather", "leather", 0.0, 0.72)
    A("Gunmetal", "gunmetal", 0.95, 0.38)
    A("Steel", "gunmetal", 0.95, 0.32)
    A("Brass", "gunmetal", 0.95, 0.30, tint=(1.00, 0.78, 0.35))
    A("Plastic", "painted_metal", 0.0, 0.45, tint=(1.30, 1.30, 1.30))
    A("PlasticRed", "fabric_red", 0.0, 0.45)
    A("Rubber", "gunmetal", 0.0, 0.85, tint=(0.35, 0.35, 0.35))
    A("Paper", "plaster", 0.0, 0.90, tint=(1.40, 1.35, 1.20))
    A("Ceramic", "tile", 0.0, 0.25, tint=(1.25, 1.25, 1.22))
    A("MetalTin", "gunmetal", 0.90, 0.45)
    A("Screen", "gunmetal", 0.20, 0.20, tint=(0.40, 0.50, 0.60))
    A("Mushroom", "skin", 0.0, 0.80, tint=(1.50, 1.20, 1.00))
    A("Blood", "blood", 0.0, 0.45, alpha_test=True)
    A("Skin", "skin", 0.0, 0.62)
    A("SkinPale", "skin_pale", 0.0, 0.60)
    A("SkinRotting", "skin_rotting", 0.0, 0.72)
    A("EmissiveRed", "gunmetal", 0.0, 0.50, tint=(0.30, 0.06, 0.05), emissive=3.0)
    A("EmissiveGreen", "gunmetal", 0.0, 0.50, tint=(0.06, 0.30, 0.08), emissive=3.0)
    A("EmissiveCyan", "gunmetal", 0.0, 0.50, tint=(0.06, 0.28, 0.32), emissive=3.0)
    return mats


# ---------------------------------------------------------------------------
# Blender bridge
# ---------------------------------------------------------------------------
def _blender_materials(mats):
    for slot in mats.slots:
        nm = slot["name"]
        if nm not in _bmats:
            m = bpy.data.materials.new(nm)
            m.use_nodes = True
            bsdf = m.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs["Base Color"].default_value = (slot["albedo"][0],
                                                           slot["albedo"][1],
                                                           slot["albedo"][2], 1.0)
                bsdf.inputs["Metallic"].default_value = slot["metallic"]
                bsdf.inputs["Roughness"].default_value = slot["roughness"]
            _bmats[nm] = m
    return [_bmats[s["name"]] for s in mats.slots]


def blender_finish(mb, mats, bevel=0.0, segments=1, sharp_deg=40.0):
    """Welds, normals and bevels the authored geometry inside Blender and
    returns (positions, normals, uvs, indices, per-triangle materials)."""
    key = {}
    remap = []
    vpos = []
    for p in mb.pos:
        k = (round(p[0], 5), round(p[1], 5), round(p[2], 5))
        i = key.get(k)
        if i is None:
            i = len(vpos)
            key[k] = i
            vpos.append(p)
        remap.append(i)

    faces = []
    for t in range(0, len(mb.idx), 3):
        a, b, c = mb.idx[t], mb.idx[t + 1], mb.idx[t + 2]
        tri = (remap[a], remap[b], remap[c])
        if tri[0] == tri[1] or tri[1] == tri[2] or tri[0] == tri[2]:
            continue
        mi = mb.mat[t] if t < len(mb.mat) else 0
        faces.append((tri, mi, (mb.uv[a], mb.uv[b], mb.uv[c])))

    me = bpy.data.meshes.new("aoh_tmp")
    me.from_pydata([tuple(p) for p in vpos], [], [list(f[0]) for f in faces])
    me.update()
    uvl = me.uv_layers.new(name="UVMap")
    for pi, (tri, mi, uvs) in enumerate(faces):
        if pi >= len(me.polygons):
            break
        poly = me.polygons[pi]
        poly.material_index = mi
        poly.use_smooth = True
        for k, li in enumerate(poly.loop_indices):
            if k < 3:
                uvl.data[li].uv = uvs[k]

    # sharp edges (angle based) so boxes keep hard corners
    thr = math.radians(sharp_deg)
    bm = bmesh.new()
    bm.from_mesh(me)
    for e in bm.edges:
        if len(e.link_faces) == 2:
            try:
                e.smooth = e.calc_face_angle() <= thr
            except ValueError:
                e.smooth = True
        else:
            e.smooth = False
    bm.to_mesh(me)
    bm.free()
    me.update()

    ob = bpy.data.objects.new("aoh_tmp", me)
    bpy.context.scene.collection.objects.link(ob)
    for m in _blender_materials(mats):
        me.materials.append(m)

    if bevel > 0.0:
        mod = ob.modifiers.new("Bevel", 'BEVEL')
        mod.width = bevel
        mod.segments = segments
        mod.limit_method = 'ANGLE'
        mod.angle_limit = thr
        mod.miter_outer = 'MITER_ARC'
        mod.harden_normals = False
        mod.use_clamp_overlap = True

    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    out_me = ev.to_mesh()
    out_me.calc_loop_triangles()

    pos = []
    nrm = []
    uv = []
    idx = []
    fmat = []
    vcount = len(out_me.vertices)
    for t in out_me.loop_triangles:
        li = t.loops
        if len(li) != 3:
            continue
        base = len(pos)
        for k in range(3):
            vi = out_me.loops[li[k]].vertex_index
            v = out_me.vertices[vi]
            pos.append((v.co.x, v.co.y, v.co.z))
            try:
                cn = out_me.corner_normals[li[k]]
                nrm.append((cn.vector.x, cn.vector.y, cn.vector.z))
            except Exception:
                nrm.append((0.0, 1.0, 0.0))
            try:
                uvv = out_me.uv_layers[0].data[li[k]].uv
                uv.append((uvv[0], uvv[1]))
            except Exception:
                uv.append((0.0, 0.0))
        idx += [base, base + 1, base + 2]
        fmat += [t.material_index] * 3

    ev.to_mesh_clear()
    bpy.data.objects.remove(ob)
    if me.users == 0:
        bpy.data.meshes.remove(me)
    return pos, nrm, uv, idx, fmat


def export(name, mb, mats, bevel=0.0, rig=None, segments=1):
    pos, nrm, uv, idx, fmat = blender_finish(mb, mats, bevel, segments)
    out = MeshBuilder()
    out.pos = pos
    out.nrm = nrm
    out.uv = uv
    out.idx = idx
    out.mat = fmat
    out.col = [(1, 1, 1, 1)] * len(pos)
    path = os.path.join(MESH_DIR, name + ".afm")
    export_mesh(path, name, out, mats, rig)
    return path


# ---------------------------------------------------------------------------
def build_buildings(mats, rng, only=None):
    for bname, fn in B.BUILDINGS.items():
        if only and only not in bname:
            continue
        mb = fn(mats, rng.randint(1, 9999))
        export("bld_" + bname, mb, mats, bevel=0.012)
        print("  building:", bname, len(mb.pos), "verts")


def build_props(mats, rng, only=None):
    groups = []

    def g(name, fn, bevel=0.008):
        groups.append((name, fn, bevel))

    g("prop_crates", lambda mb: (
        P.crate_wood(mb, mats, 0, 0, 0, 0.7, rng),
        P.crate_metal(mb, mats, 1.0, 0, 0, 0.8, rng),
        P.barrel(mb, mats, 2.0, 0, 0),
        P.drum_metal(mb, mats, 3.0, 0, 0),
        P.pallet(mb, mats, 4.0, 0, 0)), 0.010)
    g("prop_furniture_a", lambda mb: (
        P.desk(mb, mats, 0, 0, 0, 0.0),
        P.chair(mb, mats, 1.2, 0, 0, 0.6),
        P.office_chair(mb, mats, 2.2, 0, 0, 0.0),
        P.workbench(mb, mats, 3.6, 0, 0, 0.0),
        P.table(mb, mats, 5.4, 0, 0, 0.0)), 0.008)
    g("prop_furniture_b", lambda mb: (
        P.bed(mb, mats, 0, 0, 0, 0.0),
        P.sofa(mb, mats, 1.6, 0, 0, 0.0),
        P.shelf(mb, mats, 3.0, 0, 0, 0.0),
        P.locker(mb, mats, 4.2, 0, 0, 0.0, 2),
        P.filing_cabinet(mb, mats, 5.4, 0, 0, 0.0)), 0.008)
    g("prop_furniture_c", lambda mb: (
        P.sink(mb, mats, 0, 0, 0, 0.0),
        P.toilet(mb, mats, 1.0, 0, 0, 0.0),
        P.medical_cart(mb, mats, 2.0, 0, 0, 0.0),
        P.ammo_crate(mb, mats, 3.0, 0, 0, 0.0)), 0.006)
    g("prop_equipment", lambda mb: (
        P.computer_terminal(mb, mats, 0, 0, 0, 0.0, True),
        P.radio_console(mb, mats, 1.8, 0, 0, 0.0, True),
        P.generator(mb, mats, 3.8, 0, 0, 0.0)), 0.006)
    g("prop_vehicle_car", lambda mb: (
        P.car_wreck(mb, mats, 0, 0, 0, 0.0, rng),
        P.tire(mb, mats, 3.0, 0, 0)), 0.010)
    g("prop_vehicle_truck", lambda mb: P.truck_wreck(mb, mats, 0, 0, 0, 0.4), 0.010)
    g("prop_vehicle_bus", lambda mb: P.bus_wreck(mb, mats, 0, 0, 0, 0.0), 0.010)
    g("prop_barricades", lambda mb: (
        P.sandbag_wall(mb, mats, 0, 0, 0, 0.0, 3.0, 3),
        P.barricade(mb, mats, 2.4, 0, 0, 0.0),
        P.traffic_cone(mb, mats, 3.4, 0, 0),
        P.tire(mb, mats, 4.4, 0, 0)), 0.012)
    g("prop_street", lambda mb: (
        P.fence_chain(mb, mats, 0, 0, 4.0, 0, 0.0, 2.2),
        P.lamp_post(mb, mats, 5.0, 0, 0, 0.0, 5.0)), 0.006)
    g("prop_industrial", lambda mb: (
        P.tank_vertical(mb, mats, 0, 0, 0, 1.5, 5.0),
        P.pipe_run(mb, mats, -3.0, 0.0, 3.0, 0.0, 3.0, 0.16)), 0.008)
    g("prop_cooling_tower", lambda mb: P.cooling_tower(mb, mats, 0, 0, 0), 0.0)
    g("prop_trees", lambda mb: (
        P.tree_pine(mb, mats, 0, 0, 0, 8.0, rng),
        P.tree_pine(mb, mats, 5.0, 0, 1.5, 6.5, rng),
        P.tree_dead(mb, mats, 9.0, 0, 0, 6.0, rng)), 0.0)
    g("prop_undergrowth", lambda mb: (
        P.bush(mb, mats, 0, 0, 0, 0.8, rng),
        P.bush(mb, mats, 1.4, 0, 0.6, 0.6, rng),
        P.rock(mb, mats, 2.6, 0, 0.2, 0.7, rng)), 0.0)

    for (name, fn, bevel) in groups:
        if only and only not in name:
            continue
        mb = MeshBuilder()
        fn(mb)
        export(name, mb, mats, bevel=bevel)
        print("  prop:", name, len(mb.pos), "verts")


def build_weapons(mats, rng, only=None):
    fns = [
        ("weapon_knife", lambda mb: W.knife(mb, mats, 0, 0, 0, 0.0)),
        ("weapon_combat_knife", lambda mb: W.combat_knife(mb, mats, 0, 0, 0, 0.0)),
        ("weapon_machete", lambda mb: W.machete(mb, mats, 0, 0, 0, 0.0)),
        ("weapon_axe", lambda mb: W.fire_axe(mb, mats, 0, 0, 0, 0.0)),
        ("weapon_pipe_bat", lambda mb: W.pipe_bat(mb, mats, 0, 0, 0, 0.0)),
        ("weapon_pistol", lambda mb: W.pistol(mb, mats, 0, 0, 0, 0.0)),
        ("weapon_revolver", lambda mb: W.revolver(mb, mats, 0, 0, 0, 0.0)),
        ("weapon_shotgun", lambda mb: W.shotgun(mb, mats, 0, 0, 0, 0.0)),
        ("weapon_rifle_ak", lambda mb: W.rifle_ak(mb, mats, 0, 0, 0, 0.0)),
        ("weapon_hunting_rifle", lambda mb: W.hunting_rifle(mb, mats, 0, 0, 0, 0.0)),
        ("weapon_smg", lambda mb: W.smg(mb, mats, 0, 0, 0, 0.0)),
        ("weapon_crossbow", lambda mb: W.crossbow(mb, mats, 0, 0, 0, 0.0)),
        ("weapon_spear", lambda mb: W.improvised_spear(mb, mats, 0, 0, 0, 0.0)),
    ]
    for (name, fn) in fns:
        if only and only not in name:
            continue
        mb = MeshBuilder()
        fn(mb)
        export(name, mb, mats, bevel=0.004)
        print("  weapon:", name)


def build_items(mats, rng, only=None):
    fns = [
        ("item_medkit", lambda mb: W.medkit(mb, mats, 0, 0, 0)),
        ("item_bandage", lambda mb: W.bandage_roll(mb, mats, 0, 0, 0)),
        ("item_pills", lambda mb: W.pill_bottle(mb, mats, 0, 0, 0)),
        ("item_water_bottle", lambda mb: W.water_bottle(mb, mats, 0, 0, 0)),
        ("item_can_food", lambda mb: W.can_food(mb, mats, 0, 0, 0)),
        ("item_ration", lambda mb: W.ration_pack(mb, mats, 0, 0, 0)),
        ("item_battery", lambda mb: W.battery(mb, mats, 0, 0, 0)),
        ("item_ammo_box", lambda mb: W.ammo_box(mb, mats, 0, 0, 0)),
        ("item_ammo_pile", lambda mb: W.ammo_pile(mb, mats, 0, 0, 0)),
        ("item_jerrycan", lambda mb: W.jerrycan(mb, mats, 0, 0, 0, 0.0)),
        ("item_radio", lambda mb: W.radio_handheld(mb, mats, 0, 0, 0, 0.0)),
        ("item_notebook", lambda mb: W.notebook(mb, mats, 0, 0, 0, 0.0)),
        ("item_flashlight", lambda mb: W.flashlight(mb, mats, 0, 0, 0, 0.0)),
        ("item_helmet", lambda mb: W.helmet(mb, mats, 0, 0, 0)),
        ("item_armor_vest", lambda mb: W.armor_vest(mb, mats, 0, 0, 0, 0.0)),
        ("item_backpack", lambda mb: W.backpack(mb, mats, 0, 0, 0, 0.0)),
        ("item_wood_plank", lambda mb: W.wood_plank(mb, mats, 0, 0, 0, 0.0)),
        ("item_metal_scrap", lambda mb: W.metal_scrap(mb, mats, 0, 0, 0)),
        ("item_electronics", lambda mb: W.electronic_scrap(mb, mats, 0, 0, 0)),
        ("item_cloth", lambda mb: W.cloth_scrap(mb, mats, 0, 0, 0)),
        ("item_mushroom", lambda mb: W.mushroom(mb, mats, 0, 0, 0)),
        ("item_herb", lambda mb: W.herb(mb, mats, 0, 0, 0)),
        ("item_meat_raw", lambda mb: W.raw_meat(mb, mats, 0, 0, 0)),
    ]
    for (name, fn) in fns:
        if only and only not in name:
            continue
        mb = MeshBuilder()
        fn(mb)
        export(name, mb, mats, bevel=0.003)
        print("  item:", name)


def build_characters(mats, rng, only=None):
    for cname, spec in CH.SPECIES.items():
        if only and only not in cname:
            continue
        sp = dict(spec)
        sp["name"] = cname
        mb, rig = CH.build_body(sp, mats, rng)
        export("char_" + cname, mb, mats, bevel=0.0, rig=rig)
        clips = CH.author_clips(sp, rig)
        export_clips(os.path.join(ANIM_DIR, cname + ".afa"), clips)
        print("  character:", cname, len(clips), "clips")


def main():
    argv = sys.argv
    only = None
    if "--" in argv:
        rest = argv[argv.index("--") + 1:]
        if "--only" in rest:
            only = rest[rest.index("--only") + 1]
    os.makedirs(MESH_DIR, exist_ok=True)
    os.makedirs(ANIM_DIR, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    mats = build_material_table()
    rng = random.Random(4242)
    print("texture sets:", len(mats.texture_sets), "material slots:", len(mats.slots))

    build_buildings(mats, rng, only)
    build_props(mats, rng, only)
    build_weapons(mats, rng, only)
    build_items(mats, rng, only)
    build_characters(mats, rng, only)

    meshes = sorted(os.listdir(MESH_DIR))
    anims = sorted(os.listdir(ANIM_DIR))
    print("MESHES", len(meshes), "ANIMS", len(anims))
    print("BUILD_ASSETS_OK")


if __name__ == "__main__":
    main()
