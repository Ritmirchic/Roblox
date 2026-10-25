#!/usr/bin/env python3
"""
AAA Numba-JIT 2K UV-Textured + Tangent-Space Normal-Mapped + Cook-Torrance GGX PBR
Card & Fighter Renderer for SPACE MINER: BUILD & CONQUER v2.0.0:
- Preserves AI-generated hero paintings (card_back, pack_standard, pack_elite, crew_01..07).
- Renders crew_08..crew_42 using posed 1K/2K normal-mapped Vanguard sci-fi armor +
  SciFiHelmet / DamagedHelmet / FlightHelmet / Vanguard Visor + 3D role weapons.
- Renders ach_01..ach_30 using unit-normalized, smooth-shaded PBR 3D ships, weapons,
  crystal asteroids, pirate raiders, and dreadnought sentinels.
"""
import math
from pathlib import Path
from typing import List, Tuple

import numba
import numpy as np
from scipy.ndimage import gaussian_filter
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
import trimesh

ROOT = Path(__file__).resolve().parent.parent
CARDS_DIR = ROOT / "assets" / "cards"
CREW_DIR = CARDS_DIR / "crew"
ACH_DIR = CARDS_DIR / "achievements"
MODELS_DIR = ROOT / "assets" / "models"
HERO_CACHE = Path("/tmp/pbr_hero_models")

RARITY_THEMES = {
    "Common":    {"rim": (0.48, 0.78, 1.00), "neb1": (0.05, 0.11, 0.22), "neb2": (0.18, 0.34, 0.50), "em": (0.28, 0.86, 1.00)},
    "Uncommon":  {"rim": (0.24, 0.96, 0.62), "neb1": (0.04, 0.15, 0.14), "neb2": (0.12, 0.44, 0.34), "em": (0.30, 1.00, 0.68)},
    "Rare":      {"rim": (0.26, 0.74, 1.00), "neb1": (0.04, 0.10, 0.28), "neb2": (0.14, 0.40, 0.76), "em": (0.36, 0.88, 1.00)},
    "Epic":      {"rim": (0.84, 0.38, 1.00), "neb1": (0.14, 0.04, 0.26), "neb2": (0.46, 0.14, 0.72), "em": (0.92, 0.44, 1.00)},
    "Legendary": {"rim": (1.00, 0.78, 0.22), "neb1": (0.22, 0.10, 0.03), "neb2": (0.64, 0.36, 0.08), "em": (1.00, 0.84, 0.28)},
    "Mythic":    {"rim": (0.24, 1.00, 0.94), "neb1": (0.15, 0.04, 0.26), "neb2": (0.12, 0.58, 0.68), "em": (0.32, 1.00, 0.96)},
    "Secret":    {"rim": (1.00, 0.26, 0.54), "neb1": (0.14, 0.02, 0.12), "neb2": (0.60, 0.08, 0.32), "em": (1.00, 0.34, 0.62)},
}

CREW_META = [
    (1, "Miner", "Common"), (2, "Pilot", "Common"), (3, "Engineer", "Common"), (4, "Gunner", "Common"),
    (5, "Collector", "Common"), (6, "Navigator", "Common"), (7, "Miner", "Common"), (8, "Engineer", "Common"),
    (9, "Pilot", "Common"), (10, "Collector", "Common"),
    (11, "Miner", "Uncommon"), (12, "Gunner", "Uncommon"), (13, "Pilot", "Uncommon"), (14, "Engineer", "Uncommon"),
    (15, "Collector", "Uncommon"), (16, "Scientist", "Uncommon"), (17, "Commander", "Uncommon"), (18, "Navigator", "Uncommon"),
    (19, "Collector", "Rare"), (20, "Gunner", "Rare"), (21, "Miner", "Rare"), (22, "Pilot", "Rare"),
    (23, "Engineer", "Rare"), (24, "Scientist", "Rare"), (25, "Commander", "Rare"),
    (26, "Engineer", "Epic"), (27, "Gunner", "Epic"), (28, "Miner", "Epic"), (29, "Pilot", "Epic"),
    (30, "Collector", "Epic"), (31, "Scientist", "Epic"),
    (32, "Gunner", "Legendary"), (33, "Pilot", "Legendary"), (34, "Miner", "Legendary"),
    (35, "Commander", "Legendary"), (36, "Engineer", "Legendary"),
    (37, "Miner", "Mythic"), (38, "Commander", "Mythic"), (39, "Gunner", "Mythic"), (40, "Pilot", "Mythic"),
    (41, "Scientist", "Secret"), (42, "Commander", "Secret"),
]


def fit_cover(im: Image.Image, target_w: int, target_h: int) -> Image.Image:
    src_w, src_h = im.size
    scale = max(target_w / src_w, target_h / src_h)
    nw, nh = int(round(src_w * scale)), int(round(src_h * scale))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - target_w) // 2
    top = max(0, int((nh - target_h) * 0.25))
    return resized.crop((left, top, left + target_w, top + target_h))


def pil_to_tex(im, default_rgb=(180, 190, 205), max_dim=1024) -> np.ndarray:
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


def pose_vanguard_arms(verts: np.ndarray, norms: np.ndarray, angle_deg: float = 64.0) -> Tuple[np.ndarray, np.ndarray]:
    v = verts.copy()
    n = norms.copy()
    max_ang = math.radians(angle_deg)
    for sign in (-1.0, 1.0):
        px_piv, py_piv = sign * 0.175, 1.435
        dist_out = (v[:, 0] * sign) - 0.155
        mask = (dist_out > 0.0) & (v[:, 1] > 1.15)
        w = np.clip(dist_out[mask] / 0.12, 0.0, 1.0)
        ang = -sign * max_ang * w
        ca, sa = np.cos(ang), np.sin(ang)
        dx = v[mask, 0] - px_piv
        dy = v[mask, 1] - py_piv
        v[mask, 0] = px_piv + dx * ca - dy * sa
        v[mask, 1] = py_piv + dx * sa + dy * ca
        nx0, ny0 = n[mask, 0], n[mask, 1]
        n[mask, 0] = nx0 * ca - ny0 * sa
        n[mask, 1] = nx0 * sa + ny0 * ca
    return v, n


def load_pbr_parts(
    path: Path,
    clip_y_min: float = -1e9,
    clip_y_max: float = 1e9,
    normalize_unit: bool = False,
    pose_arms: bool = False,
    exclude_substrings: Tuple[str, ...] = (),
) -> List[PBRPart]:
    sc = trimesh.load(str(path))
    parts: List[PBRPart] = []
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

    # Optional scene-wide unit normalization so multi-mesh ships/enemies preserve relative part positions
    if normalize_unit and geoms:
        all_v = np.vstack([ np.asarray(g.vertices, dtype=np.float32) for _, g in geoms ])
        center = 0.5 * (all_v.min(axis=0) + all_v.max(axis=0))
        rad = float(np.max(np.linalg.norm(all_v - center, axis=1))) + 1e-6
    else:
        center = np.zeros(3, dtype=np.float32)
        rad = 1.0

    for gname, g in geoms:
        verts = (np.asarray(g.vertices, dtype=np.float32) - center) / rad
        faces = np.asarray(g.faces, dtype=np.int32)
        # Smooth vertex normals across shared positions while preserving UV seams!
        vnorms = np.asarray(g.vertex_normals, dtype=np.float32)
        vis = g.visual
        if hasattr(vis, "uv") and vis.uv is not None and len(vis.uv) == len(verts):
            uvs = np.asarray(vis.uv, dtype=np.float32)
        else:
            uvs = np.zeros((len(verts), 2), dtype=np.float32)

        if pose_arms:
            verts, vnorms = pose_vanguard_arms(verts, vnorms, 65.0)

        if clip_y_min > -1e8 or clip_y_max < 1e8:
            y0, y1, y2 = verts[faces[:, 0], 1], verts[faces[:, 1], 1], verts[faces[:, 2], 1]
            keep = (y0 >= clip_y_min) & (y1 >= clip_y_min) & (y2 >= clip_y_min) & (y0 <= clip_y_max) & (y1 <= clip_y_max) & (y2 <= clip_y_max)
            faces = faces[keep]
            if len(faces) == 0:
                continue

        mat = getattr(vis, "material", None)
        b_im = getattr(mat, "baseColorTexture", None)
        n_im = getattr(mat, "normalTexture", None)
        mr_im = getattr(mat, "metallicRoughnessTexture", None)
        em_im = getattr(mat, "emissiveTexture", None)

        bfac = getattr(mat, "baseColorFactor", None)
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
def sample_tex(tex: np.ndarray, u: float, v: float) -> Tuple[float, float, float]:
    th, tw, _ = tex.shape
    uu = u - math.floor(u)
    vv = 1.0 - (v - math.floor(v))
    fx = uu * (tw - 1)
    fy = vv * (th - 1)
    x0 = int(fx)
    y0 = int(fy)
    x1 = min(tw - 1, x0 + 1)
    y1 = min(th - 1, y0 + 1)
    dx = fx - x0
    dy = fy - y0
    w00 = (1.0 - dx) * (1.0 - dy)
    w10 = dx * (1.0 - dy)
    w01 = (1.0 - dx) * dy
    w11 = dx * dy
    r = tex[y0, x0, 0] * w00 + tex[y0, x1, 0] * w10 + tex[y1, x0, 0] * w01 + tex[y1, x1, 0] * w11
    g = tex[y0, x0, 1] * w00 + tex[y0, x1, 1] * w10 + tex[y1, x0, 1] * w01 + tex[y1, x1, 1] * w11
    b = tex[y0, x0, 2] * w00 + tex[y0, x1, 2] * w10 + tex[y1, x0, 2] * w01 + tex[y1, x1, 2] * w11
    return r, g, b


@numba.njit(fastmath=True)
def rasterize_pbr_jit(
    v_cam: np.ndarray,
    n_cam: np.ndarray,
    uvs: np.ndarray,
    faces: np.ndarray,
    base_tex: np.ndarray,
    norm_tex: np.ndarray,
    mr_tex: np.ndarray,
    em_tex: np.ndarray,
    tint: np.ndarray,
    rim_col: np.ndarray,
    em_tint: np.ndarray,
    em_boost: float,
    fov_px: float,
    zbuf: np.ndarray,
    cbuf: np.ndarray,
    sil_buf: np.ndarray,
) -> None:
    h, w = zbuf.shape
    hw = w * 0.5
    hh = h * 0.5

    klx, kly, klz = 0.54, 0.56, 0.63
    flx, fly, flz = -0.66, 0.28, 0.69
    rlx, rly, rlz = -0.58, 0.42, -0.70

    for fi in range(faces.shape[0]):
        i0 = faces[fi, 0]
        i1 = faces[fi, 1]
        i2 = faces[fi, 2]

        z0, z1, z2 = v_cam[i0, 2], v_cam[i1, 2], v_cam[i2, 2]
        if z0 >= -0.15 or z1 >= -0.15 or z2 >= -0.15:
            continue

        iz0 = -1.0 / z0
        iz1 = -1.0 / z1
        iz2 = -1.0 / z2

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

        e1x = v_cam[i1, 0] - v_cam[i0, 0]
        e1y = v_cam[i1, 1] - v_cam[i0, 1]
        e1z = v_cam[i1, 2] - v_cam[i0, 2]
        e2x = v_cam[i2, 0] - v_cam[i0, 0]
        e2y = v_cam[i2, 1] - v_cam[i0, 1]
        e2z = v_cam[i2, 2] - v_cam[i0, 2]
        du1 = uvs[i1, 0] - uvs[i0, 0]
        dv1 = uvs[i1, 1] - uvs[i0, 1]
        du2 = uvs[i2, 0] - uvs[i0, 0]
        dv2 = uvs[i2, 1] - uvs[i0, 1]
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
                if w0 < 0.0:
                    continue
                w1 = ((sy2 - sy0) * (fx - sx2) + (sx0 - sx2) * (fy - sy2)) * inv_den
                if w1 < 0.0:
                    continue
                w2 = 1.0 - w0 - w1
                if w2 < 0.0:
                    continue

                p0 = w0 * iz0
                p1 = w1 * iz1
                p2 = w2 * iz2
                iz_sum = p0 + p1 + p2
                depth = 1.0 / iz_sum
                if depth >= zbuf[py, px]:
                    continue

                zbuf[py, px] = depth
                sil_buf[py, px] = 1.0
                bc0 = p0 * depth
                bc1 = p1 * depth
                bc2 = p2 * depth

                u = uvs[i0, 0] * bc0 + uvs[i1, 0] * bc1 + uvs[i2, 0] * bc2
                v = uvs[i0, 1] * bc0 + uvs[i1, 1] * bc1 + uvs[i2, 1] * bc2

                ar, ag, ab = sample_tex(base_tex, u, v)
                lum = 0.299 * ar + 0.587 * ag + 0.114 * ab
                ar = ar * 0.30 + (lum ** 1.25) * tint[0] * 0.62
                ag = ag * 0.30 + (lum ** 1.25) * tint[1] * 0.62
                ab = ab * 0.30 + (lum ** 1.25) * tint[2] * 0.62

                ao_val, rough, metal = sample_tex(mr_tex, u, v)
                if ao_val < 0.15:
                    ao_val = 0.85
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


def make_transform(rot_deg: Tuple[float, float, float], scale: float, pos: Tuple[float, float, float]):
    rx, ry, rz = [math.radians(a) for a in rot_deg]
    cx, sx = math.cos(rx), math.sin(rx)
    cy, sy = math.cos(ry), math.sin(ry)
    cz, sz = math.cos(rz), math.sin(rz)
    mat_x = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]], dtype=np.float32)
    mat_y = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]], dtype=np.float32)
    mat_z = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]], dtype=np.float32)
    rmat = mat_z @ mat_y @ mat_x
    return rmat * scale, rmat, np.array(pos, dtype=np.float32)


def draw_parts(parts: List[PBRPart], rot_deg, scale: float, pos, tint, rim_col, em_tint, em_boost: float, fov_px: float, zbuf, cbuf, sil_buf) -> None:
    smat, rmat, tvec = make_transform(rot_deg, scale, pos)
    tint_a = np.array(tint, dtype=np.float32)
    rim_a = np.array(rim_col, dtype=np.float32)
    em_a = np.array(em_tint, dtype=np.float32)
    for p in parts:
        eb = 1.45 if "visor" in p.name.lower() else em_boost
        vc = np.ascontiguousarray(p.verts @ smat.T + tvec, dtype=np.float32)
        nc = np.ascontiguousarray(p.vnorms @ rmat.T, dtype=np.float32)
        rasterize_pbr_jit(vc, nc, p.uvs, p.faces, p.base_tex, p.norm_tex, p.mr_tex, p.em_tex, tint_a, rim_a, em_a, eb, fov_px, zbuf, cbuf, sil_buf)


def fbm2d(x: np.ndarray, y: np.ndarray, seed: int) -> np.ndarray:
    val = np.zeros_like(x, dtype=np.float32)
    amp = 0.54
    freq = 1.7
    for o in range(5):
        ph1 = (seed * 1.37 + o * 2.91) % 6.283
        ph2 = (seed * 2.13 + o * 1.73) % 6.283
        n = np.sin(x * freq + np.cos(y * freq * 1.17 + ph1) + ph2) * np.cos(y * freq * 0.93 - np.sin(x * freq * 0.85 + ph2))
        val += amp * (0.5 + 0.5 * n)
        x, y = x * 0.86 - y * 0.50, x * 0.50 + y * 0.86
        freq *= 1.95
        amp *= 0.52
    return np.clip(val, 0.0, 1.0)


def build_space_backdrop(w: int, h: int, seed: int, neb1, neb2, rim) -> np.ndarray:
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
    py = -0.38
    pr = 0.65
    pd = np.sqrt((uvx - px) ** 2 + (uvy - py) ** 2)
    pmask = (pd < pr).astype(np.float32)
    pz = np.sqrt(np.maximum(0.0, pr * pr - (uvx - px) ** 2 - (uvy - py) ** 2)) / pr
    p_lit = np.maximum(0.0, ((uvx - px) * (-px * 1.5) + (uvy - py) * (-0.5) + pz * 0.45))
    cresc = np.power(np.clip(1.0 - pz, 0.0, 1.0), 2.6) * np.clip(p_lit * 2.2, 0.0, 1.2)
    for c in range(3):
        pcol = neb1[c] * 0.30 + neb2[c] * p_lit * 0.55 + rim[c] * cresc * 1.05
        bg[:, :, c] = bg[:, :, c] * (1.0 - pmask * 0.84) + pcol * pmask * 0.84

    for _ in range(135):
        sx = int(rng.integers(2, w - 3))
        sy = int(rng.integers(2, h - 3))
        inten = float(rng.uniform(0.35, 1.45))
        bg[sy, sx] += inten
        if inten > 0.95:
            bg[sy - 1:sy + 2, sx] += inten * 0.35
            bg[sy, sx - 1:sx + 2] += inten * 0.35
    return bg


def finalize_hdr_image(cbuf: np.ndarray, bg: np.ndarray, sil_buf: np.ndarray, rim_col, em_col, out_w: int, out_h: int, seed: int) -> Image.Image:
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


def main() -> None:
    CREW_DIR.mkdir(parents=True, exist_ok=True)
    ACH_DIR.mkdir(parents=True, exist_ok=True)

    if Path("/tmp/test_card_back.png").exists():
        cb = fit_cover(Image.open("/tmp/test_card_back.png").convert("RGBA"), 360, 520)
        cb.save(CARDS_DIR / "card_back.png", optimize=True)

    for pname in ["pack_standard.png", "pack_elite.png"]:
        src = Path("/tmp/raw_art") / pname
        if src.exists():
            pk = fit_cover(Image.open(src).convert("RGBA"), 380, 540)
            pk.save(CARDS_DIR / pname, optimize=True)

    print("Loading 1K/2K PBR Armored Vanguard, Hero Helmets & 3D Weapons...")
    # Vanguard armor faces -Z natively, so rotating yaw ~ 180 faces straight into camera!
    van_torso = load_pbr_parts(HERO_CACHE / "mv" / "soldier.glb", clip_y_min=0.82, clip_y_max=1.56, pose_arms=True, exclude_substrings=("visor",))
    van_full = load_pbr_parts(HERO_CACHE / "mv" / "soldier.glb", clip_y_min=0.82, pose_arms=True)
    helm_damaged = load_pbr_parts(HERO_CACHE / "DamagedHelmet" / "DamagedHelmet.glb")
    helm_scifi = load_pbr_parts(HERO_CACHE / "SciFiHelmet" / "SciFiHelmet.gltf")
    # Exclude RubberWood_low museum display stand so ONLY leather/metal/glass/lenses/hose render!
    helm_flight = load_pbr_parts(HERO_CACHE / "FlightHelmet" / "FlightHelmet.gltf", exclude_substrings=("RubberWood",))

    role_weapons = {
        "Miner": load_pbr_parts(MODELS_DIR / "equipment" / "eq_plasma_drill.glb", normalize_unit=True),
        "Pilot": load_pbr_parts(MODELS_DIR / "equipment" / "eq_thruster_booster.glb", normalize_unit=True),
        "Engineer": load_pbr_parts(MODELS_DIR / "equipment" / "eq_energy_generator.glb", normalize_unit=True),
        "Gunner": load_pbr_parts(MODELS_DIR / "equipment" / "eq_machine_gun.glb", normalize_unit=True),
        "Collector": load_pbr_parts(MODELS_DIR / "equipment" / "eq_magnet_advanced.glb", normalize_unit=True),
        "Navigator": load_pbr_parts(MODELS_DIR / "equipment" / "eq_magnetic_radar.glb", normalize_unit=True),
        "Scientist": load_pbr_parts(MODELS_DIR / "equipment" / "eq_crystal_extractor.glb", normalize_unit=True),
        "Commander": load_pbr_parts(MODELS_DIR / "equipment" / "eq_railgun.glb", normalize_unit=True),
    }

    armor_tints = [
        (0.42, 0.58, 0.82),  # Cobalt steel
        (0.84, 0.60, 0.28),  # Industrial amber-gold
        (0.32, 0.72, 0.68),  # Tactical cryo-teal
        (0.78, 0.28, 0.34),  # Crimson vanguard
        (0.62, 0.68, 0.78),  # Brushed gunmetal
        (0.58, 0.36, 0.86),  # Void amethyst
        (0.92, 0.74, 0.30),  # Sovereign auric gold
    ]

    for idx, role, rarity in CREW_META:
        ai_src = Path("/tmp/raw_art") / f"crew_{idx:02d}.png"
        dst = CREW_DIR / f"crew_{idx:02d}.png"
        if ai_src.exists():
            im = fit_cover(Image.open(ai_src).convert("RGB"), 360, 440)
            im = ImageEnhance.Contrast(im).enhance(1.06)
            im.save(dst, optimize=True)
            continue

        w, h = 540, 660
        theme = RARITY_THEMES[rarity]
        rim, em = theme["rim"], theme["em"]
        tint = armor_tints[(idx * 3 + 2) % len(armor_tints)]
        if rarity in ("Legendary", "Mythic"):
            tint = (0.96, 0.76, 0.30) if idx % 2 == 0 else (0.34, 0.88, 0.92)
        elif rarity == "Secret":
            tint = (0.90, 0.24, 0.50) if idx == 41 else (1.00, 0.82, 0.38)

        bg = build_space_backdrop(w, h, 4100 + idx * 53, theme["neb1"], theme["neb2"], rim)
        cbuf = bg.copy()
        zbuf = np.full((h, w), 1e9, dtype=np.float32)
        sil_buf = np.zeros((h, w), dtype=np.float32)
        fov_px = h * 1.55

        turn = ((-1) ** idx) * (15.0 + (idx % 5) * 4.5)
        head_turn = turn + ((-1) ** (idx // 2)) * 7.0
        pitch = 3.0 + ((idx % 3) - 1) * 2.5

        helm_mode = idx % 4
        torso_y = -1.53
        torso_z = -1.05
        if helm_mode == 0:
            draw_parts(van_torso, (pitch, 180.0 + turn, 0), 1.0, (0.0, torso_y, torso_z), tint, rim, em, 0.0, fov_px, zbuf, cbuf, sil_buf)
            draw_parts(helm_scifi, (pitch - 2, head_turn, 0), 0.108, (0.0, 0.09, torso_z + 0.02), tint, rim, em, 0.0, fov_px, zbuf, cbuf, sil_buf)
        elif helm_mode == 1:
            draw_parts(van_torso, (pitch, 180.0 + turn, 0), 1.0, (0.0, torso_y, torso_z), tint, rim, em, 0.0, fov_px, zbuf, cbuf, sil_buf)
            draw_parts(helm_damaged, (pitch + 3, head_turn, 0), 0.138, (0.0, 0.11, torso_z + 0.02), tint, rim, em, 0.04, fov_px, zbuf, cbuf, sil_buf)
        elif helm_mode == 2:
            draw_parts(van_torso, (pitch, 180.0 + turn, 0), 1.0, (0.0, torso_y, torso_z), tint, rim, em, 0.0, fov_px, zbuf, cbuf, sil_buf)
            draw_parts(helm_flight, (pitch, head_turn, 0), 0.54, (0.0, -0.18, torso_z + 0.01), tint, rim, em, 0.0, fov_px, zbuf, cbuf, sil_buf)
        else:
            # Full Vanguard Space Marine + glowing emissive visor slit!
            draw_parts(van_full, (pitch, 180.0 + turn, 0), 1.02, (0.0, -1.55, -1.02), tint, rim, em, 0.0, fov_px, zbuf, cbuf, sil_buf)

        # Shoulder-mounted 3D Role Weapon / Tech Rig
        side = 0.23 if turn < 0 else -0.23
        draw_parts(
            role_weapons[role],
            (18.0, turn + 28.0, -12.0 * np.sign(side)),
            0.135,
            (side, 0.02, torso_z - 0.08),
            tint, rim, em, 0.05, fov_px, zbuf, cbuf, sil_buf,
        )

        # Distant background spacecraft / crystal asteroid silhouette
        draw_parts(role_weapons["Commander" if idx % 2 == 0 else "Scientist"], (20, idx * 41, 14), 0.26, (-side * 2.8, 0.36, -2.8), rim, rim, em, 0.02, fov_px, zbuf, cbuf, sil_buf)

        im = finalize_hdr_image(cbuf, bg, sil_buf, rim, em, 360, 440, 5000 + idx * 29)
        im.save(dst, optimize=True)
    print("Rendered all 42 Fighter Crew Cards!")

    # 2. Render 30 Full-PBR 3D Space Action Achievement Cards (unit-normalized meshes!)
    ship_parts = [
        (load_pbr_parts(MODELS_DIR / "ship" / "mod_cockpit_mk1.glb", normalize_unit=True), (0.0, 0.0, 0.0), 0.42),
        (load_pbr_parts(MODELS_DIR / "ship" / "mod_hull_cell.glb", normalize_unit=True), (-0.52, 0.0, 0.0), 0.32),
        (load_pbr_parts(MODELS_DIR / "ship" / "mod_hull_cell.glb", normalize_unit=True), (0.52, 0.0, 0.0), 0.32),
        (load_pbr_parts(MODELS_DIR / "ship" / "mod_engine_basic.glb", normalize_unit=True), (0.0, 0.0, 0.56), 0.34),
        (load_pbr_parts(MODELS_DIR / "equipment" / "eq_mining_advanced.glb", normalize_unit=True), (-0.52, 0.30, 0.0), 0.26),
        (load_pbr_parts(MODELS_DIR / "equipment" / "eq_laser_cannon.glb", normalize_unit=True), (0.52, 0.30, 0.0), 0.26),
    ]
    ast_lib = [
        load_pbr_parts(MODELS_DIR / "asteroids" / "ast_silicate_iron.glb", normalize_unit=True),
        load_pbr_parts(MODELS_DIR / "asteroids" / "ast_crystal_geode.glb", normalize_unit=True),
        load_pbr_parts(MODELS_DIR / "asteroids" / "ast_slag_wreck_rock.glb", normalize_unit=True),
        load_pbr_parts(MODELS_DIR / "asteroids" / "ast_fulgurite_spire.glb", normalize_unit=True),
        load_pbr_parts(MODELS_DIR / "asteroids" / "ast_void_monolith.glb", normalize_unit=True),
    ]
    en_lib = [
        load_pbr_parts(MODELS_DIR / "enemies" / "enemy_scout_drone.glb", normalize_unit=True),
        load_pbr_parts(MODELS_DIR / "enemies" / "enemy_raider_ship.glb", normalize_unit=True),
        load_pbr_parts(MODELS_DIR / "enemies" / "enemy_heavy_drone.glb", normalize_unit=True),
        load_pbr_parts(MODELS_DIR / "enemies" / "enemy_plasma_hunter.glb", normalize_unit=True),
        load_pbr_parts(MODELS_DIR / "enemies" / "enemy_void_sentinel.glb", normalize_unit=True),
    ]

    rar_cycle = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"]
    for i in range(1, 31):
        w, h = 560, 316
        theme = RARITY_THEMES[rar_cycle[(i * 2 + 1) % len(rar_cycle)]]
        rim, em = theme["rim"], theme["em"]
        bg = build_space_backdrop(w, h, 9100 + i * 71, theme["neb1"], theme["neb2"], rim)
        cbuf = bg.copy()
        zbuf = np.full((h, w), 1e9, dtype=np.float32)
        sil_buf = np.zeros((h, w), dtype=np.float32)
        fov_px = h * 1.25

        ship_yaw = 132.0 + (i % 5) * 6.0
        sy_r = math.radians(ship_yaw)
        for sp_parts, loc, sc_p in ship_parts:
            wx = loc[0] * math.cos(sy_r) + loc[2] * math.sin(sy_r)
            wz = -loc[0] * math.sin(sy_r) + loc[2] * math.cos(sy_r)
            draw_parts(
                sp_parts, (14.0, ship_yaw, -12.0), sc_p,
                (-1.05 + wx * 0.55, -0.26 + loc[1] * 0.55, -2.95 + wz * 0.55),
                (0.75, 0.84, 0.96), rim, em, 0.02, fov_px, zbuf, cbuf, sil_buf,
            )

        if i % 2 == 1:
            draw_parts(ast_lib[i % len(ast_lib)], (22 * i, 37 * i, 15), 0.78, (0.95, 0.14, -3.1), (0.65, 0.78, 0.90), rim, em, 0.04, fov_px, zbuf, cbuf, sil_buf)
            draw_parts(ast_lib[(i + 1) % len(ast_lib)], (45, 19 * i, 8), 0.36, (0.12, 0.58, -4.6), (0.55, 0.62, 0.75), rim, em, 0.0, fov_px, zbuf, cbuf, sil_buf)
        else:
            draw_parts(en_lib[i % len(en_lib)], (-16, -42 - (i % 6) * 7, 18), 0.82, (0.92, 0.18, -3.0), (0.92, 0.36, 0.44), rim, em, 0.06, fov_px, zbuf, cbuf, sil_buf)
            draw_parts(en_lib[(i + 2) % len(en_lib)], (-10, -35, 12), 0.42, (0.24, 0.60, -4.5), (0.75, 0.42, 0.55), rim, em, 0.03, fov_px, zbuf, cbuf, sil_buf)

        ach_im = finalize_hdr_image(cbuf, bg, sil_buf, rim, em, 360, 204, 9900 + i * 43).convert("RGBA")

        fx = Image.new("RGBA", (360, 204), (0, 0, 0, 0))
        fd = ImageDraw.Draw(fx)
        em255 = tuple(int(min(255, c * 255)) for c in em)
        p0, p1 = (110, 118), (242, 86)
        fd.line([p0, p1], fill=(*em255, 195), width=7)
        fd.line([p0, p1], fill=(255, 255, 255, 245), width=2)
        fd.ellipse((p1[0] - 20, p1[1] - 20, p1[0] + 20, p1[1] + 20), fill=(*em255, 170))
        fd.ellipse((p1[0] - 8, p1[1] - 8, p1[0] + 8, p1[1] + 8), fill=(255, 255, 255, 255))
        fx = Image.alpha_composite(fx.filter(ImageFilter.GaussianBlur(4)), fx)
        Image.alpha_composite(ach_im, fx).convert("RGB").save(ACH_DIR / f"ach_{i:02d}.png", optimize=True)

    print("Rendered all 30 Full-PBR 3D Achievement Cards!")


if __name__ == "__main__":
    main()
