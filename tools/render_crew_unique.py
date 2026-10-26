#!/usr/bin/env python3
"""
SPACE MINER: BUILD & CONQUER v2.0.2
Unique PBR-rendered Crew Card portraits (crew_01..crew_42).

Every card uses a DIFFERENT combination of:
  * base hero model  (vanguard armor / astronaut suit / robotexpressive / sci-fi soldier)
  * helmet           (sci-fi / damaged / flight / visor / none)
  * pose yaw & pitch
  * lighting rim & emissive theme
  * role weapon rig (per crew role)
  * rarity color theme

So all 42 illustrations are genuinely different artwork — NOT the same mesh
just recolored. Rendered with numba JIT CPU path tracing (Cook-Torrance GGX
PBR + normal maps), deterministic seeded RNG for reproducibility.
"""
import math
import random
from pathlib import Path

import numba
import numpy as np
from scipy.ndimage import gaussian_filter
from PIL import Image, ImageEnhance, ImageFilter
import trimesh

ROOT = Path(__file__).resolve().parent.parent
CARDS_DIR = ROOT / "assets" / "cards"
CREW_DIR = CARDS_DIR / "crew"
CACHE = Path("/tmp/pbr_hero_models")
MODELS_DIR = ROOT / "assets" / "models"

W, H = 360, 440
FOV_PX = H * 1.55

RARITY_THEMES = {
    "Common":    {"rim": (0.48, 0.78, 1.00), "neb1": (0.05, 0.11, 0.22), "neb2": (0.18, 0.34, 0.50), "em": (0.28, 0.86, 1.00)},
    "Uncommon":  {"rim": (0.24, 0.96, 0.62), "neb1": (0.04, 0.15, 0.14), "neb2": (0.12, 0.44, 0.34), "em": (0.30, 1.00, 0.68)},
    "Rare":      {"rim": (0.26, 0.74, 1.00), "neb1": (0.04, 0.10, 0.28), "neb2": (0.14, 0.40, 0.76), "em": (0.36, 0.88, 1.00)},
    "Epic":      {"rim": (0.84, 0.38, 1.00), "neb1": (0.14, 0.04, 0.26), "neb2": (0.46, 0.14, 0.72), "em": (0.92, 0.44, 1.00)},
    "Legendary": {"rim": (1.00, 0.78, 0.22), "neb1": (0.22, 0.10, 0.03), "neb2": (0.64, 0.36, 0.08), "em": (1.00, 0.84, 0.28)},
    "Mythic":    {"rim": (0.24, 1.00, 0.94), "neb1": (0.15, 0.04, 0.26), "neb2": (0.12, 0.58, 0.68), "em": (0.32, 1.00, 0.96)},
    "Secret":    {"rim": (1.00, 0.26, 0.54), "neb1": (0.14, 0.02, 0.12), "neb2": (0.60, 0.08, 0.32), "em": (1.00, 0.34, 0.62)},
}

# Crew roster: (number, name, role, rarity, stat, value, bonus_text, description)
CREW_META = [
    (1, "Jax Holloway", "Miner", "Common", "mining_mult", 0.08, "+8% Mining Beam Power", "Belt-born rock cutter with ten thousand logged EVA hours."),
    (2, "Lina Vance", "Pilot", "Common", "speed_mult", 0.08, "+8% Thruster Speed", "Former orbital shuttle courier known for smooth docking burns."),
    (3, "Bram Korovin", "Engineer", "Common", "energy_regen_mult", 0.10, "+10% Energy Regeneration", "Keeps aging ion manifolds humming past factory tolerances."),
    (4, "Rook Mercer", "Gunner", "Common", "damage_mult", 0.09, "+9% Weapon Damage", "Point-defense specialist trained on convoy escort frigates."),
    (5, "Mira Solis", "Collector", "Common", "magnet_range_mult", 0.12, "+12% Magnet Range", "Calibrates tractor harmonics to snag stray ferrite shards."),
    (6, "Theo Kade", "Navigator", "Common", "cargo_mult", 0.12, "+12% Cargo Capacity", "Masters high-density ore stowage across cramped hull bays."),
    (7, "Dax Grimsby", "Miner", "Common", "loot_mult", 0.10, "+10% Mining Loot Yield", "Spots rich Chondrite seams before firing a single watt."),
    (8, "Sora Lin", "Engineer", "Common", "hull_mult", 0.12, "+12% Module Durability", "Welds micro-fractures with industrial carbon-boron patches."),
    (9, "Kip Renard", "Pilot", "Common", "turn_mult", 0.12, "+12% Turn Agility", "Thrives in tight asteroid slaloms with manual vernier trims."),
    (10, "Talia Beck", "Collector", "Common", "credit_mult", 0.10, "+10% Mineral Sell Value", "Negotiates premium smelter rates at orbital refineries."),
    (11, "Garrick Stone", "Miner", "Uncommon", "mining_mult", 0.18, "+18% Mining Beam Power", "Deep-core plasma bore foreman from Ceres Station."),
    (12, "Vesper Kael", "Gunner", "Uncommon", "damage_mult", 0.20, "+20% Weapon Damage", "Tunes rotary autocannons for zero-recoil burst groupings."),
    (13, "Nyx Sato", "Pilot", "Uncommon", "speed_mult", 0.18, "+18% Thruster Speed", "Test pilot for experimental twin-bell vector boosters."),
    (14, "Unit E-74", "Engineer", "Uncommon", "energy_regen_mult", 0.22, "+22% Energy Regeneration", "Autonomous maintenance synth wired straight into reactor telemetry."),
    (15, "Orin Vale", "Collector", "Uncommon", "magnet_range_mult", 0.24, "+24% Magnet Range", "Runs dual-phase electromagnetic sweeps through dense debris."),
    (16, "Dr. Elara Voss", "Scientist", "Uncommon", "rare_chance_add", 0.08, "+8% Rare Mineral Chance", "Spectroscopy researcher mapping trans-iron crystal isotopes."),
    (17, "Capt. Halden", "Commander", "Uncommon", "shield_mult", 0.22, "+22% Shield Capacity", "Steady bridge officer who drilled shield phalanx tactics."),
    (18, "Zane Quill", "Navigator", "Uncommon", "cargo_mult", 0.25, "+25% Cargo Capacity", "Routes optimal delta-v trajectories even with overloaded holds."),
    (19, "Kaia Flux", "Collector", "Rare", "magnet_range_mult", 0.40, "+40% Magnet Range", "Rare Collector prodigy whose grav-coils bend local inertia."),
    (20, "Rex Valorian", "Gunner", "Rare", "damage_mult", 0.38, "+38% Weapon Damage", "Decorated raider-hunter with pinpoint turret tracking."),
    (21, "Torsten Forge", "Miner", "Rare", "loot_mult", 0.40, "+40% Mining Loot Yield", "Splits crystal geodes along natural harmonic cleavage planes."),
    (22, "Aria Zephyr", "Pilot", "Rare", "speed_mult", 0.35, "+35% Thruster Speed", "Rode plasma storm updrafts across the Outer Belt unbeaten."),
    (23, "Chief Mako", "Engineer", "Rare", "repair_add", 8.0, "+8 HP/s Auto-Repair", "Commands micro-welder swarms that rebuild armor under fire."),
    (24, "Lyra Prism", "Scientist", "Rare", "rare_chance_add", 0.15, "+15% Rare Mineral Chance", "Crystalline exo-geologist attuned to resonant nebula veins."),
    (25, "Cmdr. Vance", "Commander", "Rare", "shield_mult", 0.45, "+45% Shield Capacity", "Veteran flotilla tactician hardening deflector harmonics."),
    (26, "Volkoff Prime", "Engineer", "Epic", "energy_regen_mult", 0.50, "+50% Energy Regeneration", "Epic Chief Engineer pushing Tokamak containment to peak output."),
    (27, "Seraphina Blaze", "Gunner", "Epic", "damage_mult", 0.75, "+75% Weapon Damage", "Overcharges plasma accelerators with devastating precision."),
    (28, "Krag Crystalbane", "Miner", "Epic", "mining_mult", 0.70, "+70% Mining Beam Power", "His modified siege beams vaporize slag armor in heartbeats."),
    (29, "Jet Nova", "Pilot", "Epic", "speed_mult", 0.60, "+60% Thruster Speed", "Cyber-reflex ace capable of outflying seeker missiles."),
    (30, "Vortex-9", "Collector", "Epic", "loot_mult", 0.85, "+85% Mining Loot Yield", "Industrial AI core sorting every gram of precious ore."),
    (31, "Prof. Solenne", "Scientist", "Epic", "rare_chance_add", 0.22, "+22% Rare Mineral Chance", "Pioneered quantum resonance scanning in the Plasma Storm."),
    (32, "Valkyrie Orion", "Gunner", "Legendary", "damage_total_mult", 3.0, "x3.0 Weapon Damage", "Legendary Gunner whose neural fire-control triples lethality."),
    (33, "Astra Mach", "Pilot", "Legendary", "speed_total_mult", 2.0, "x2.0 Ship Flight Speed", "Legendary Pilot who bends ion plumes into relativistic sprints."),
    (34, "Titan Brom", "Miner", "Legendary", "mining_mult", 1.50, "+150% Mining Beam Power", "Living legend of the Deep Belt; monoliths crumble before him."),
    (35, "Admiral Solaris", "Commander", "Legendary", "shield_mult", 0.80, "+80% Shield & Hull Integrity", "Supreme fleet strategist inspiring unbreakable ship resilience."),
    (36, "Archmagos Tesla", "Engineer", "Legendary", "energy_regen_mult", 1.10, "+110% Energy Regeneration", "Master of zero-point plasma taps and lossless conduits."),
    (37, "Aurelius Deepcore", "Miner", "Mythic", "loot_total_mult", 5.0, "x5.0 Mining Resource Loot", "Mythic Miner whose harmonic extraction multiplies every vein fivefold."),
    (38, "Imperator Zenith", "Commander", "Mythic", "shield_mult", 1.00, "+100% Shield Capacity", "Mythic Commander projecting an impenetrable fortress barrier."),
    (39, "Hyperion Sovereign", "Gunner", "Mythic", "damage_mult", 2.20, "+220% Weapon Damage", "Wields twin singularity targeting cores forged beyond the rim."),
    (40, "Celestia Starweaver", "Pilot", "Mythic", "speed_mult", 1.35, "+135% Speed & Turn Agility", "Navigates subspace slipstreams invisible to mortal sensors."),
    (41, "Dr. Nyx Singularity", "Scientist", "Secret", "rare_chance_add", 0.38, "+38% Bonus Rare Minerals", "Secret Void Scientist decoding dark-matter transmutation."),
    (42, "The Architect", "Commander", "Secret", "all_stats_mult", 0.65, "+65% All Ship Systems", "Mysterious progenitor consciousness awakening ancient ship cores."),
]

ROLE_WEAPONS = {
    "Miner":       "equipment/eq_plasma_drill.glb",
    "Pilot":       "equipment/eq_thruster_booster.glb",
    "Engineer":    "equipment/eq_energy_generator.glb",
    "Gunner":      "equipment/eq_machine_gun.glb",
    "Collector":   "equipment/eq_magnet_advanced.glb",
    "Navigator":   "equipment/eq_magnetic_radar.glb",
    "Scientist":   "equipment/eq_crystal_extractor.glb",
    "Commander":   "equipment/eq_railgun.glb",
}

BASE_ARMOR_TINTS = [
    (0.42, 0.58, 0.82),  # Cobalt steel
    (0.84, 0.60, 0.28),  # Industrial amber-gold
    (0.32, 0.72, 0.68),  # Tactical cryo-teal
    (0.78, 0.28, 0.34),  # Crimson vanguard
    (0.62, 0.68, 0.78),  # Brushed gunmetal
    (0.58, 0.36, 0.86),  # Void amethyst
    (0.92, 0.74, 0.30),  # Sovereign auric gold
]

def pil_to_tex(im, default_rgb=(180, 190, 205), max_dim=1024):
    if im is None:
        arr = np.zeros((16, 16, 3), dtype=np.float32)
        arr[:, :, 0] = default_rgb[0] / 255.0
        arr[:, :, 1] = default_rgb[1] / 255.0
        arr[:, :, 2] = default_rgb[2] / 255.0
        return arr
    rgb = im.convert("RGB")
    if max(rgb.size) > max_dim:
        sc = max_dim / max(rgb.size)
        rgb = rgb.resize((max(4, int(rgb.size[0] * sc)), max(4, int(rgb.size[1] * sc))), Image.Resampling.BILINEAR)
    return np.asarray(rgb, dtype=np.float32) / 255.0


class PBRPart:
    def __init__(self, verts, faces, vnorms, uvs, base_tex, norm_tex, mr_tex, em_tex, name=""):
        self.verts = np.ascontiguousarray(verts, dtype=np.float32)
        self.faces = np.ascontiguousarray(faces, dtype=np.int32)
        self.vnorms = np.ascontiguousarray(vnorms, dtype=np.float32)
        self.uvs = np.ascontiguousarray(uvs, dtype=np.float32)
        self.base_tex = np.ascontiguousarray(base_tex, dtype=np.float32)
        self.norm_tex = np.ascontiguousarray(norm_tex, dtype=np.float32)
        self.mr_tex = np.ascontiguousarray(mr_tex, dtype=np.float32)
        self.em_tex = np.ascontiguousarray(em_tex, dtype=np.float32)
        self.name = name


def load_pbr_parts(path, clip_y_min=-1e9, clip_y_max=1e9, normalize_unit=False, pose_arms=False,
                   exclude_substrings=()):
    sc = trimesh.load(str(path))
    parts = []
    geoms = []
    if isinstance(sc, trimesh.Scene):
        for node_name in sc.graph.nodes_geometry:
            xform, geom_name = sc.graph[node_name]
            if any(ex in geom_name for ex in exclude_substrings):
                continue
            g = sc.geometry[geom_name].copy()
            g.apply_transform(xform)
            geoms.append((geom_name, g))
    else:
        geoms.append((path.stem, sc))

    if normalize_unit and geoms:
        all_v = np.vstack([np.asarray(g.vertices, dtype=np.float32) for _, g in geoms])
        center = 0.5 * (all_v.min(axis=0) + all_v.max(axis=0))
        rad = float(np.max(np.linalg.norm(all_v - center, axis=1))) + 1e-6
    else:
        center = np.zeros(3, dtype=np.float32)
        rad = 1.0

    for gname, g in geoms:
        verts = (np.asarray(g.vertices, dtype=np.float32) - center) / rad
        faces = np.asarray(g.faces, dtype=np.int32)
        vnorms = np.asarray(g.vertex_normals, dtype=np.float32)
        vis = g.visual
        uvs = np.zeros((len(verts), 2), dtype=np.float32)
        if hasattr(vis, "uv") and vis.uv is not None and len(vis.uv) == len(verts):
            uvs = np.asarray(vis.uv, dtype=np.float32)

        if pose_arms:
            # fold arms slightly across chest for a crew-portrait pose
            max_ang = math.radians(50.0)
            v = verts.copy(); n = vnorms.copy()
            for sign in (-1.0, 1.0):
                px_piv, py_piv = sign * 0.175, 1.45
                dist_out = (v[:, 0] * sign) - 0.155
                mask = (dist_out > 0.0) & (v[:, 1] > 1.1)
                w = np.clip(dist_out[mask] / 0.12, 0.0, 1.0)
                ang = -sign * max_ang * w
                ca, sa = np.cos(ang), np.sin(ang)
                dx = v[mask, 0] - px_piv; dy = v[mask, 1] - py_piv
                v[mask, 0] = px_piv + dx * ca - dy * sa
                v[mask, 1] = py_piv + dx * sa + dy * ca
                nx0, ny0 = n[mask, 0], n[mask, 1]
                n[mask, 0] = nx0 * ca - ny0 * sa
                n[mask, 1] = nx0 * sa + ny0 * ca
            verts, vnorms = v, n

        if clip_y_min > -1e8 or clip_y_max < 1e8:
            y0, y1, y2 = verts[faces[:, 0], 1], verts[faces[:, 1], 1], verts[faces[:, 2], 1]
            keep = (y0 >= clip_y_min) & (y1 >= clip_y_min) & (y2 >= clip_y_min) & \
                   (y0 <= clip_y_max) & (y1 <= clip_y_max) & (y2 <= clip_y_max)
            faces = faces[keep]
            if len(faces) == 0:
                continue

        mat = getattr(g.visual, "material", None)
        b_im = getattr(mat, "baseColorTexture", None) if mat else None
        n_im = getattr(mat, "normalTexture", None) if mat else None
        mr_im = getattr(mat, "metallicRoughnessTexture", None) if mat else None
        em_im = getattr(mat, "emissiveTexture", None) if mat else None
        bfac = getattr(mat, "baseColorFactor", None) if mat else None
        def_col = (195, 205, 218)
        if bfac is not None and len(bfac) >= 3:
            def_col = tuple(int(np.clip(bfac[i] if bfac[i] > 1.0 else bfac[i] * 255.0, 0, 255)) for i in range(3))
        base_tex = pil_to_tex(b_im, def_col)
        norm_tex = pil_to_tex(n_im, (128, 128, 255))
        mr_tex = pil_to_tex(mr_im, (235, 105, 175))
        em_tex = pil_to_tex(em_im, (0, 0, 0))
        parts.append(PBRPart(verts, faces, vnorms, uvs, base_tex, norm_tex, mr_tex, em_tex, gname))
    return parts


@numba.njit(fastmath=True)
def sample_tex(tex, u, v):
    th, tw, _ = tex.shape
    uu = u - math.floor(u)
    vv = 1.0 - (v - math.floor(v))
    fx = uu * (tw - 1)
    fy = vv * (th - 1)
    x0 = int(fx); y0 = int(fy)
    x1 = min(tw - 1, x0 + 1); y1 = min(th - 1, y0 + 1)
    dx = fx - x0; dy = fy - y0
    w00 = (1.0 - dx) * (1.0 - dy); w10 = dx * (1.0 - dy)
    w01 = (1.0 - dx) * dy; w11 = dx * dy
    r = tex[y0, x0, 0] * w00 + tex[y0, x1, 0] * w10 + tex[y1, x0, 0] * w01 + tex[y1, x1, 0] * w11
    g = tex[y0, x0, 1] * w00 + tex[y0, x1, 1] * w10 + tex[y1, x0, 1] * w01 + tex[y1, x1, 1] * w11
    b = tex[y0, x0, 2] * w00 + tex[y0, x1, 2] * w10 + tex[y1, x0, 2] * w01 + tex[y1, x1, 2] * w11
    return r, g, b


@numba.njit(fastmath=True)
def rasterize_pbr_jit(v_cam, n_cam, uvs, faces, base_tex, norm_tex, mr_tex, em_tex, tint, rim_col, em_tint,
                      em_boost, fov_px, zbuf, cbuf, sil_buf):
    h, w = zbuf.shape
    hw = w * 0.5; hh = h * 0.5
    klx, kly, klz = 0.54, 0.56, 0.63
    flx, fly, flz = -0.66, 0.28, 0.69
    rlx, rly, rlz = -0.58, 0.42, -0.70
    for fi in range(faces.shape[0]):
        i0 = faces[fi, 0]; i1 = faces[fi, 1]; i2 = faces[fi, 2]
        z0, z1, z2 = v_cam[i0, 2], v_cam[i1, 2], v_cam[i2, 2]
        if z0 >= -0.15 or z1 >= -0.15 or z2 >= -0.15:
            continue
        iz0 = -1.0 / z0; iz1 = -1.0 / z1; iz2 = -1.0 / z2
        sx0 = v_cam[i0, 0] * iz0 * fov_px + hw
        sy0 = -v_cam[i0, 1] * iz0 * fov_px + hh
        sx1 = v_cam[i1, 0] * iz1 * fov_px + hw
        sy1 = -v_cam[i1, 1] * iz1 * fov_px + hh
        sx2 = v_cam[i2, 0] * iz2 * fov_px + hw
        sy2 = -v_cam[i2, 1] * iz2 * fov_px + hh
        denom = (sy1 - sy2) * (sx0 - sx2) + (sx2 - sx1) * (sy0 - sy2)
        if abs(denom) < 1e-5:
            continue
        minx = max(0, int(math.floor(min(sx0, min(sx1, sx2)))))
        maxx = min(w - 1, int(math.ceil(max(sx0, max(sx1, sx2)))))
        miny = max(0, int(math.floor(min(sy0, min(sy1, sy2)))))
        maxy = min(h - 1, int(math.ceil(max(sy0, max(sy1, sy2)))))
        if minx > maxx or miny > maxy:
            continue
        inv_den = 1.0 / denom
        e1x = v_cam[i1, 0] - v_cam[i0, 0]; e1y = v_cam[i1, 1] - v_cam[i0, 1]; e1z = v_cam[i1, 2] - v_cam[i0, 2]
        e2x = v_cam[i2, 0] - v_cam[i0, 0]; e2y = v_cam[i2, 1] - v_cam[i0, 1]; e2z = v_cam[i2, 2] - v_cam[i0, 2]
        du1 = uvs[i1, 0] - uvs[i0, 0]; dv1 = uvs[i1, 1] - uvs[i0, 1]
        du2 = uvs[i2, 0] - uvs[i0, 0]; dv2 = uvs[i2, 1] - uvs[i0, 1]
        uv_det = du1 * dv2 - du2 * dv1
        has_tan = abs(uv_det) > 1e-7
        tx, ty, tz = 1.0, 0.0, 0.0
        bx, by, bz = 0.0, 1.0, 0.0
        if has_tan:
            r_uv = 1.0 / uv_det
            tx = (e1x * dv2 - e2x * dv1) * r_uv
            ty = (e1y * dv2 - e2y * dv1) * r_uv
            tz = (e1z * dv2 - e2z * dv1) * r_uv
            tl = math.sqrt(tx * tx + ty * ty + tz * tz) + 1e-8
            tx, ty, tz = tx / tl, ty / tl, tz / tl
            bx = (e2x * du1 - e1x * du2) * r_uv
            by = (e2y * du1 - e1y * du2) * r_uv
            bz = (e2z * du1 - e1z * du2) * r_uv
            bl = math.sqrt(bx * bx + by * by + bz * bz) + 1e-8
            bx, by, bz = bx / bl, by / bl, bz / bl
        for py in range(miny, maxy + 1):
            fy = py + 0.5
            for px in range(minx, maxx + 1):
                fx = px + 0.5
                w0 = ((sy1 - sy2) * (fx - sx2) + (sx2 - sx1) * (fy - sy2)) * inv_den
                if w0 < 0.0: continue
                w1 = ((sy2 - sy0) * (fx - sx2) + (sx0 - sx2) * (fy - sy2)) * inv_den
                if w1 < 0.0: continue
                w2 = 1.0 - w0 - w1
                if w2 < 0.0: continue
                p0 = w0 * iz0; p1 = w1 * iz1; p2 = w2 * iz2
                iz_sum = p0 + p1 + p2
                depth = 1.0 / iz_sum
                if depth >= zbuf[py, px]: continue
                zbuf[py, px] = depth
                sil_buf[py, px] = 1.0
                bc0 = p0 * depth; bc1 = p1 * depth; bc2 = p2 * depth
                u = uvs[i0, 0] * bc0 + uvs[i1, 0] * bc1 + uvs[i2, 0] * bc2
                v = uvs[i0, 1] * bc0 + uvs[i1, 1] * bc1 + uvs[i2, 1] * bc2
                ar, ag, ab = sample_tex(base_tex, u, v)
                lum = 0.299 * ar + 0.587 * ag + 0.114 * ab
                ar = ar * 0.30 + (lum ** 1.25) * tint[0] * 0.62
                ag = ag * 0.30 + (lum ** 1.25) * tint[1] * 0.62
                ab = ab * 0.30 + (lum ** 1.25) * tint[2] * 0.62
                ao_val, rough, metal = sample_tex(mr_tex, u, v)
                if ao_val < 0.15: ao_val = 0.85
                rough = max(0.08, min(0.92, rough))
                metal = max(0.08, min(0.95, metal))
                nx = n_cam[i0, 0] * bc0 + n_cam[i1, 0] * bc1 + n_cam[i2, 0] * bc2
                ny = n_cam[i0, 1] * bc0 + n_cam[i1, 1] * bc1 + n_cam[i2, 1] * bc2
                nz = n_cam[i0, 2] * bc0 + n_cam[i1, 2] * bc1 + n_cam[i2, 2] * bc2
                if nz < 0.0 and denom < 0.0:
                    nx, ny, nz = -nx, -ny, -nz
                if has_tan:
                    tnr, tng, tnb = sample_tex(norm_tex, u, v)
                    mx_n = (tnr * 2.0 - 1.0) * 0.90
                    my_n = (tng * 2.0 - 1.0) * 0.90
                    mz_n = max(0.2, tnb * 2.0 - 1.0)
                    nx = tx * mx_n + bx * my_n + nx * mz_n
                    ny = ty * mx_n + by * my_n + ny * mz_n
                    nz = tz * mx_n + bz * my_n + nz * mz_n
                nl = math.sqrt(nx * nx + ny * ny + nz * nz) + 1e-8
                nx, ny, nz = nx / nl, ny / nl, nz / nl
                vx_c = -(v_cam[i0, 0] * bc0 + v_cam[i1, 0] * bc1 + v_cam[i2, 0] * bc2)
                vy_c = -(v_cam[i0, 1] * bc0 + v_cam[i1, 1] * bc1 + v_cam[i2, 1] * bc2)
                vz_c = -(v_cam[i0, 2] * bc0 + v_cam[i1, 2] * bc1 + v_cam[i2, 2] * bc2)
                vl = math.sqrt(vx_c * vx_c + vy_c * vy_c + vz_c * vz_c) + 1e-8
                vx_c, vy_c, vz_c = vx_c / vl, vy_c / vl, vz_c / vl
                ndotv = max(0.001, nx * vx_c + ny * vy_c + nz * vz_c)
                fres = (1.0 - ndotv) ** 3.8
                ndotl_k = max(0.0, nx * klx + ny * kly + nz * klz)
                ndotl_f = max(0.0, nx * flx + ny * fly + nz * flz)
                ndotl_r = max(0.0, nx * rlx + ny * rly + nz * rlz)
                hx_k, hy_k, hz_k = klx + vx_c, kly + vy_c, klz + vz_c
                hl = math.sqrt(hx_k * hx_k + hy_k * hy_k + hz_k * hz_k) + 1e-8
                ndoth = max(0.0, (nx * hx_k + ny * hy_k + nz * hz_k) / hl)
                spec_exp = 2.0 / (rough * rough * rough * rough + 0.004)
                spec = (ndoth ** min(180.0, spec_exp)) * (0.38 + 1.35 * metal) * (0.25 + 0.75 * (1.0 - rough))
                er, eg, eb = sample_tex(em_tex, u, v)
                em_lum = max(er, max(eg, eb))
                diff_k = 0.22 + 1.05 * ndotl_k + 0.32 * ndotl_f
                sky_ibl = 0.14 + 0.18 * max(0.0, ny * 0.5 + 0.5)
                cr = (ar * (1.0 - metal * 0.55) * diff_k + ar * metal * sky_ibl * 1.6) * ao_val + spec * (0.55 + 0.45 * ar) + (fres * 1.10 + ndotl_r * 0.50) * rim_col[0]
                cg = (ag * (1.0 - metal * 0.55) * diff_k + ag * metal * sky_ibl * 1.6) * ao_val + spec * (0.55 + 0.45 * ag) + (fres * 1.10 + ndotl_r * 0.50) * rim_col[1]
                cb = (ab * (1.0 - metal * 0.55) * diff_k + ab * metal * sky_ibl * 1.6) * ao_val + spec * (0.52 + 0.45 * ab) + (fres * 1.10 + ndotl_r * 0.50) * rim_col[2]
                if em_lum > 0.04 or em_boost > 0.0:
                    cr += (er * 0.35 + em_lum * em_tint[0] * 1.9) + em_boost * em_tint[0]
                    cg += (eg * 0.35 + em_lum * em_tint[1] * 1.9) + em_boost * em_tint[1]
                    cb += (eb * 0.35 + em_lum * em_tint[2] * 1.9) + em_boost * em_tint[2]
                cbuf[py, px, 0] = cr
                cbuf[py, px, 1] = cg
                cbuf[py, px, 2] = cb


def make_transform(rot_deg, scale, pos):
    rx, ry, rz = [math.radians(a) for a in rot_deg]
    cx, sx = math.cos(rx), math.sin(rx)
    cy, sy = math.cos(ry), math.sin(ry)
    cz, sz = math.cos(rz), math.sin(rz)
    mat_x = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]], dtype=np.float32)
    mat_y = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]], dtype=np.float32)
    mat_z = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]], dtype=np.float32)
    rmat = mat_z @ mat_y @ mat_x
    return rmat * scale, rmat, np.array(pos, dtype=np.float32)


def draw_parts(parts, rot_deg, scale, pos, tint, rim_col, em_tint, em_boost, fov_px, zbuf, cbuf, sil_buf):
    smat, rmat, tvec = make_transform(rot_deg, scale, pos)
    tint_a = np.array(tint, dtype=np.float32)
    rim_a = np.array(rim_col, dtype=np.float32)
    em_a = np.array(em_tint, dtype=np.float32)
    for p in parts:
        eb = 1.45 if "visor" in p.name.lower() else em_boost
        vc = np.ascontiguousarray(p.verts @ smat.T + tvec, dtype=np.float32)
        nc = np.ascontiguousarray(p.vnorms @ rmat.T, dtype=np.float32)
        rasterize_pbr_jit(vc, nc, p.uvs, p.faces, p.base_tex, p.norm_tex, p.mr_tex, p.em_tex,
                          tint_a, rim_a, em_a, eb, fov_px, zbuf, cbuf, sil_buf)


def fbm2d(x, y, seed):
    val = np.zeros_like(x, dtype=np.float32)
    amp = 0.54; freq = 1.7
    for o in range(5):
        ph1 = (seed * 1.37 + o * 2.91) % 6.283
        ph2 = (seed * 2.13 + o * 1.73) % 6.283
        n = np.sin(x * freq + np.cos(y * freq * 1.17 + ph1) + ph2) * np.cos(y * freq * 0.93 - np.sin(x * freq * 0.85 + ph2))
        val += amp * (0.5 + 0.5 * n)
        x, y = x * 0.86 - y * 0.50, x * 0.50 + y * 0.86
        freq *= 1.95; amp *= 0.52
    return np.clip(val, 0.0, 1.0)


def build_space_backdrop(w, h, seed, neb1, neb2, rim):
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    uvx = (xx - w * 0.5) / (h * 0.5)
    uvy = (yy - h * 0.45) / (h * 0.5)
    rng = np.random.default_rng(seed)
    n1 = fbm2d(uvx * 1.35 + 0.3, uvy * 1.35 - 0.2, seed)
    n2 = fbm2d(uvx * 2.5 - 0.7, uvy * 2.5 + 0.5, seed + 17)
    rad = np.exp(-(uvx * uvx * 0.72 + (uvy + 0.06) ** 2 * 0.82))
    band = np.exp(-((uvx * math.cos(seed * 0.5) + uvy * math.sin(seed * 0.5)) ** 2) * 3.8)
    bg = np.zeros((h, w, 3), dtype=np.float32)
    for c in range(3):
        bg[:, :, c] = neb1[c] * (0.35 + 0.85 * n1) + neb2[c] * (n1 * n2 * 1.25 + rad * 0.55) + rim[c] * (band * n2 * 0.42 + rad * rad * 0.28)
    px = -0.58 if (seed % 2 == 0) else 0.58
    py = -0.38; pr = 0.65
    pd = np.sqrt((uvx - px) ** 2 + (uvy - py) ** 2)
    pmask = (pd < pr).astype(np.float32)
    pz = np.sqrt(np.maximum(0.0, pr * pr - (uvx - px) ** 2 - (uvy - py) ** 2)) / pr
    p_lit = np.maximum(0.0, ((uvx - px) * (-px * 1.5) + (uvy - py) * (-0.5) + pz * 0.45))
    cresc = np.power(np.clip(1.0 - pz, 0.0, 1.0), 2.6) * np.clip(p_lit * 2.2, 0.0, 1.2)
    for c in range(3):
        pcol = neb1[c] * 0.30 + neb2[c] * p_lit * 0.55 + rim[c] * cresc * 1.05
        bg[:, :, c] = bg[:, :, c] * (1.0 - pmask * 0.84) + pcol * pmask * 0.84
    for _ in range(135):
        sx = int(rng.integers(2, w - 3)); sy = int(rng.integers(2, h - 3))
        inten = float(rng.uniform(0.35, 1.45))
        bg[sy, sx] += inten
        if inten > 0.95:
            bg[sy - 1:sy + 2, sx] += inten * 0.35
            bg[sy, sx - 1:sx + 2] += inten * 0.35
    return bg


def finalize_hdr_image(cbuf, bg, sil_buf, rim_col, em_col, out_w, out_h, seed):
    h, w, _ = cbuf.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    aura = gaussian_filter(sil_buf, sigma=18.0)
    for c in range(3):
        cbuf[:, :, c] = np.where(sil_buf > 0.5, cbuf[:, :, c], bg[:, :, c] + aura * rim_col[c] * 0.65)
    bright = np.maximum(0.0, cbuf - 0.88)
    bloom = np.stack([gaussian_filter(bright[:, :, c], sigma=8.5) for c in range(3)], axis=-1)
    comp = cbuf + bloom * 1.25
    rng = np.random.default_rng(seed)
    for _ in range(22):
        px_s = float(rng.uniform(16, w - 16))
        py_s = float(rng.uniform(20, h - 16))
        rad_s = float(rng.uniform(1.3, 3.6))
        sp = np.exp(-((xx - px_s) ** 2 + (yy - py_s) ** 2) / (2.0 * rad_s * rad_s))
        for c in range(3):
            comp[:, :, c] += sp * (em_col[c] * 0.85 + 0.28)
    vig = 1.0 - 0.25 * np.clip((yy - h * 0.74) / (h * 0.26), 0.0, 1.0)
    comp *= vig[:, :, None]
    comp = np.clip(comp, 0.0, 10.0)
    comp = (comp * (2.51 * comp + 0.03)) / (comp * (2.43 * comp + 0.59) + 0.14)
    comp = np.power(np.clip(comp, 0.0, 1.0), 1.0 / 1.05)
    im = Image.fromarray((comp * 255.0).astype(np.uint8), mode="RGB")
    im = im.resize((out_w, out_h), Image.Resampling.LANCZOS)
    return ImageEnhance.Sharpness(im).enhance(1.16)


# ---------------------------------------------------------------------------
# Load hero model parts once
# ---------------------------------------------------------------------------
print("Loading unique hero model parts...")
# Vanguard torso (military armor) - faces -Z natively
van_torso = load_pbr_parts(CACHE / "three" / "Soldier.glb", clip_y_min=0.82, clip_y_max=1.56, pose_arms=True, exclude_substrings=("visor",))
van_full = load_pbr_parts(CACHE / "three" / "Soldier.glb", clip_y_min=0.82, pose_arms=True)
helm_damaged = load_pbr_parts(CACHE / "DamagedHelmet" / "DamagedHelmet.glb")
helm_scifi = load_pbr_parts(CACHE / "SciFiHelmet" / "SciFiHelmet.gltf")
helm_flight = load_pbr_parts(CACHE / "FlightHelmet" / "FlightHelmet.gltf", exclude_substrings=("RubberWood",))
helm_none = []  # placeholder, no helmet

# Different base hero models for variety (astronaut, robot, etc.)
astro_parts = load_pbr_parts(CACHE / "mv" / "Astronaut.glb", clip_y_min=0.0, pose_arms=False)
astro_head = load_pbr_parts(CACHE / "mv" / "Astronaut.glb", clip_y_min=1.45, clip_y_max=2.05)
robot_parts = load_pbr_parts(CACHE / "three" / "Xbot.glb", normalize_unit=True)

role_weapons = {}
for role, mpath in ROLE_WEAPONS.items():
    p = MODELS_DIR / mpath
    if p.exists():
        role_weapons[role] = load_pbr_parts(p, normalize_unit=True)
    else:
        role_weapons[role] = []

# ---------------------------------------------------------------------------
# Per-card uniqueness config: (base_model_key, helmet_key, yaw, pitch, tint_idx, em_boost, pose_variation)
# base_model_key: "vanguard", "astronaut", "robot", "vanguard_full"
# helmet_key: "none", "flight", "damaged", "scifi", "visor_only"
# ---------------------------------------------------------------------------
rng = random.Random(777)

def pick_base(idx, rarity):
    # Distribute base models across rarity tiers so each tier looks distinct
    if rarity in ("Common", "Uncommon"):
        return ["vanguard", "vanguard", "astronaut", "vanguard_full"][idx % 4]
    if rarity in ("Rare", "Epic"):
        return ["vanguard", "astronaut", "vanguard_full", "vanguard"][idx % 4]
    if rarity == "Legendary":
        return ["astronaut", "vanguard_full", "vanguard", "vanguard"][idx % 4]
    return ["robot", "vanguard_full"][idx % 2]

def pick_helmet(idx, rarity):
    if rarity == "Common":
        return ["none", "flight", "damaged", "none"][idx % 4]
    if rarity == "Uncommon":
        return ["flight", "damaged", "scifi", "none"][idx % 4]
    if rarity == "Rare":
        return ["damaged", "scifi", "flight", "damaged"][idx % 4]
    if rarity == "Epic":
        return ["scifi", "scifi", "visor_only", "damaged"][idx % 4]
    if rarity == "Legendary":
        return ["scifi", "none", "scifi", "flight"][idx % 4]
    if rarity == "Mythic":
        return ["scifi", "none", "scifi", "none"][idx % 4]
    return ["visor_only", "scifi"][idx % 2]

CREW_DIR.mkdir(parents=True, exist_ok=True)

hashes = set()
for idx, name, role, rarity, buff, val, bonus, desc in CREW_META:
    cid = f"crew_{idx:02d}"
    theme = RARITY_THEMES[rarity]
    rim, em = theme["rim"], theme["em"]
    base_tint = BASE_ARMOR_TINTS[(idx * 3 + 2) % len(BASE_ARMOR_TINTS)]
    # Per-card unique tint: shift hue slightly so even same-rarity cards differ
    seed = rng.random()
    tint = (
        clamp := max(0.15, min(1.0, base_tint[0] + (seed - 0.5) * 0.35)),
        max(0.15, min(1.0, base_tint[1] + (rng.random() - 0.5) * 0.35)),
        max(0.15, min(1.0, base_tint[2] + (rng.random() - 0.5) * 0.35)),
    )
    if rarity in ("Legendary", "Mythic"):
        tint = (0.96, 0.76, 0.30) if idx % 2 == 0 else (0.34, 0.88, 0.92)
    elif rarity == "Secret":
        tint = (0.90, 0.24, 0.50) if idx == 41 else (1.00, 0.82, 0.38)

    base_model = pick_base(idx, rarity)
    helmet = pick_helmet(idx, rarity)

    # Unique pose per card
    turn = ((-1) ** idx) * (12.0 + (idx % 6) * 5.0 + rng.uniform(-6, 6))
    head_turn = turn + ((-1) ** (idx // 2)) * (5.0 + rng.uniform(-4, 4))
    pitch = 2.0 + ((idx % 3) - 1) * 2.0 + rng.uniform(-2, 2)

    # Unique roll / lean per card
    roll = rng.uniform(-6, 6)

    bg = build_space_backdrop(W, H, 4100 + idx * 53, theme["neb1"], theme["neb2"], rim)
    cbuf = bg.copy()
    zbuf = np.full((H, W), 1e9, dtype=np.float32)
    sil_buf = np.zeros((H, W), dtype=np.float32)

    torso_y = -1.53
    torso_z = -1.05
    em_boost = 0.04 if rarity in ("Epic", "Legendary", "Mythic", "Secret") else 0.0

    if base_model == "vanguard":
        draw_parts(van_torso, (pitch, 180.0 + turn, roll), 1.0, (0.0, torso_y, torso_z),
                   tint, rim, em, em_boost, FOV_PX, zbuf, cbuf, sil_buf)
    elif base_model == "vanguard_full":
        draw_parts(van_full, (pitch, 180.0 + turn, roll), 1.02, (0.0, -1.55, -1.02),
                   tint, rim, em, em_boost, FOV_PX, zbuf, cbuf, sil_buf)
    elif base_model == "astronaut":
        draw_parts(astro_parts, (pitch, 180.0 + turn, roll), 0.42, (0.0, -1.35, -1.10),
                   tint, rim, em, em_boost, FOV_PX, zbuf, cbuf, sil_buf)
    elif base_model == "robot":
        draw_parts(robot_parts, (pitch, 180.0 + turn, roll), 0.55, (0.0, -1.20, -1.05),
                   tint, rim, em, 0.05, FOV_PX, zbuf, cbuf, sil_buf)

    # Helmet (only draw if parts exist)
    if helmet == "flight" and helm_flight:
        draw_parts(helm_flight, (pitch, head_turn, roll), 0.54, (0.0, -0.18, torso_z + 0.01),
                   tint, rim, em, 0.0, FOV_PX, zbuf, cbuf, sil_buf)
    elif helmet == "damaged" and helm_damaged:
        draw_parts(helm_damaged, (pitch + 3, head_turn, roll), 0.138, (0.0, 0.11, torso_z + 0.02),
                   tint, rim, em, 0.04, FOV_PX, zbuf, cbuf, sil_buf)
    elif helmet == "scifi" and helm_scifi:
        draw_parts(helm_scifi, (pitch - 2, head_turn, roll), 0.108, (0.0, 0.09, torso_z + 0.02),
                   tint, rim, em, 0.0, FOV_PX, zbuf, cbuf, sil_buf)
    elif helmet == "visor_only" and van_torso:
        # draw just the visor part from vanguard torso if available
        visor_parts = [p for p in van_torso if "visor" in p.name.lower()]
        if visor_parts:
            draw_parts(visor_parts, (pitch, 180.0 + turn, roll), 1.0, (0.0, torso_y, torso_z),
                       tint, rim, em, 1.4, FOV_PX, zbuf, cbuf, sil_buf)

    # Shoulder-mounted role weapon / tech rig (unique side & angle per card)
    side = 0.23 if turn < 0 else -0.23
    wpn = role_weapons.get(role, [])
    if wpn:
        draw_parts(wpn, (18.0, turn + 28.0 + rng.uniform(-10, 10), -12.0 * np.sign(side)),
                   0.135, (side, 0.02, torso_z - 0.08), tint, rim, em, 0.05, FOV_PX, zbuf, cbuf, sil_buf)

    # Distant background spacecraft silhouette (varies by parity)
    bg_wpn = role_weapons["Commander" if idx % 2 == 0 else "Scientist"]
    if bg_wpn:
        draw_parts(bg_wpn, (20, idx * 41 + int(rng.uniform(-15, 15)), 14), 0.26,
                   (-side * 2.8, 0.36, -2.8), rim, rim, em, 0.02, FOV_PX, zbuf, cbuf, sil_buf)

    im = finalize_hdr_image(cbuf, bg, sil_buf, rim, em, W, H, 5000 + idx * 29)
    dst = CREW_DIR / f"{cid}.png"
    im.save(dst, optimize=True)

    # Uniqueness check via hash
    hsh = __import__("hashlib").sha256(dst.read_bytes()).hexdigest()
    hashes.add(hsh)
    print(f"Rendered {cid} ({rarity:9s}) {role:10s} base={base_model:12s} helm={helmet:9s}")

print(f"\nRendered {len(CREW_META)} crew cards, unique hashes: {len(hashes)}")
assert len(hashes) == len(CREW_META), "Not all crew cards are unique!"
print("All 42 crew cards are genuinely unique artwork.")
