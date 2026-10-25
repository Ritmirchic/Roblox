#!/usr/bin/env python3
"""
Procedural 3D CAD/Mesh & PBR glTF 2.0 (.glb) Asset Pipeline for
SPACE MINER: BUILD & CONQUER.

Generates 53 game-ready binary glTF 2.0 (.glb) 3D models with:
- Multi-part chamfered/lathed/extruded/Voronoi-sculpted sci-fi & organic geometry
- Planar/tri-planar UV unwrapping + smooth/creased vertex normals
- Embedded PBR textures: Albedo, Tangent-Space Normal Map, Metallic-Roughness (ORM), Emissive
- Software PBR turnaround contact sheets in preview_renders/ for visual inspection.

Coordinate convention (Godot 4):
- +X right, +Y up, -Z forward.
- 1 ship grid cell = 2.0m x 2.0m x 2.0m (half-extent = 1.0m).
"""
import io
import math
import struct
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFont
import pygltflib
import trimesh

ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT / "assets" / "models"
TEX_DIR = ROOT / "assets" / "textures"
PREVIEW_DIR = ROOT / "preview_renders"


# ==============================================================================
# 1. PROCEDURAL PBR MATERIAL & TEXTURE GENERATOR (Albedo, Normal, ORM, Emissive)
# ==============================================================================

def height_to_normal_png(height: np.ndarray, strength: float = 3.0) -> bytes:
    """Computes tangent-space normal map PNG bytes from a [0..1] float heightmap."""
    dy = np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)
    dx = np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)
    nx = -dx * strength
    ny = -dy * strength
    nz = np.ones_like(height)
    inv_len = 1.0 / np.sqrt(nx * nx + ny * ny + nz * nz + 1e-8)
    rgb = np.stack(
        [
            np.clip((nx * inv_len * 0.5 + 0.5) * 255.0, 0, 255),
            np.clip((ny * inv_len * 0.5 + 0.5) * 255.0, 0, 255),
            np.clip((nz * inv_len * 0.5 + 0.5) * 255.0, 0, 255),
        ],
        axis=-1,
    ).astype(np.uint8)
    buf = io.BytesIO()
    Image.fromarray(rgb, mode="RGB").save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def array_to_png(arr: np.ndarray, mode: str = "RGB") -> bytes:
    buf = io.BytesIO()
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode=mode).save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def make_scifi_trim_pbr(
    primary_rgb: Tuple[int, int, int],
    secondary_rgb: Tuple[int, int, int],
    emissive_rgb: Tuple[int, int, int],
    metalness: float = 0.78,
    roughness: float = 0.34,
    size: int = 256,
    seed: int = 1,
) -> Dict[str, bytes]:
    """
    Creates a 4-quadrant sci-fi trim atlas:
    UV [0..0.5, 0..0.5]: Primary armored hull plates with recessed seams & rivets
    UV [0.5..1, 0..0.5]: Secondary dark mechanical/gunmetal vents & ribs
    UV [0..0.5, 0.5..1]: Industrial accent / hazard stripe / copper coil trim
    UV [0.5..1, 0.5..1]: Glowing emissive core / visor / energy cells
    Note: PNG row 0 = v=0 in glTF texture space.
    """
    rng = np.random.default_rng(seed)
    albedo = np.zeros((size, size, 3), dtype=np.float32)
    height = np.full((size, size), 0.5, dtype=np.float32)
    rough = np.full((size, size), roughness, dtype=np.float32)
    metal = np.full((size, size), metalness, dtype=np.float32)
    emiss = np.zeros((size, size, 3), dtype=np.float32)

    half = size // 2
    grain = rng.normal(0.0, 5.0, (size, size, 1)).astype(np.float32)

    # Quadrant 0 (top-left: u<0.5, v<0.5): Primary hull plating + bevel seams + bolts
    albedo[:half, :half] = np.array(primary_rgb, dtype=np.float32) + grain[:half, :half]
    for p in range(0, half, 32):
        height[p:p + 2, :half] = 0.18
        height[:half, p:p + 2] = 0.18
        albedo[p:p + 2, :half] *= 0.68
        albedo[:half, p:p + 2] *= 0.68
        # Corner rivets
        if p + 6 < half:
            height[p + 5:p + 8, p + 5:p + 8] = 0.82

    # Quadrant 1 (top-right: u>=0.5, v<0.5): Dark gunmetal mechanical louvres
    albedo[:half, half:] = np.array([38, 45, 58], dtype=np.float32) + grain[:half, half:] * 0.7
    metal[:half, half:] = 0.88
    rough[:half, half:] = 0.42
    for y in range(4, half, 8):
        height[y:y + 3, half + 6:size - 6] = 0.15
        albedo[y:y + 3, half + 6:size - 6] *= 0.55

    # Quadrant 2 (bottom-left: u<0.5, v>=0.5): Secondary trim + diagonal tech stripes
    albedo[half:, :half] = np.array(secondary_rgb, dtype=np.float32) + grain[half:, :half]
    metal[half:, :half] = min(0.95, metalness + 0.1)
    rough[half:, :half] = max(0.18, roughness - 0.08)
    yy, xx = np.mgrid[0:half, 0:half]
    stripes = ((xx + yy) // 12) % 2 == 0
    albedo[half:, :half][stripes] *= 0.84
    height[half:, :half][stripes] = 0.62

    # Quadrant 3 (bottom-right: u>=0.5, v>=0.5): Emissive energy core / canopy / lens
    albedo[half:, half:] = np.array(emissive_rgb, dtype=np.float32)
    emiss[half:, half:] = np.array(emissive_rgb, dtype=np.float32)
    rough[half:, half:] = 0.12
    metal[half:, half:] = 0.15
    # Hex energy lattice inside emissive quadrant
    yy2, xx2 = np.mgrid[0:half, 0:half]
    grid_mask = (xx2 % 16 < 2) | (yy2 % 16 < 2)
    emiss[half:, half:][grid_mask] *= 0.65
    height[half:, half:][grid_mask] = 0.35

    # glTF metallicRoughnessTexture: R=Occlusion(1.0), G=Roughness, B=Metallic
    orm = np.stack(
        [
            np.clip(180 + height * 75, 0, 255),
            np.clip(rough * 255.0, 0, 255),
            np.clip(metal * 255.0, 0, 255),
        ],
        axis=-1,
    )

    return {
        "albedo": array_to_png(albedo),
        "normal": height_to_normal_png(height, strength=3.4),
        "orm": array_to_png(orm),
        "emissive": array_to_png(emiss),
    }


def make_rock_crystal_pbr(
    rock_rgb: Tuple[int, int, int],
    vein_rgb: Tuple[int, int, int],
    emissive_vein: bool = True,
    metalness: float = 0.22,
    roughness: float = 0.82,
    size: int = 256,
    seed: int = 77,
) -> Dict[str, bytes]:
    """Creates rock + mineral vein + glowing crystal PBR atlas (left half rock, right half crystal/vein)."""
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32) / size

    # Multi-octave procedural rock noise
    noise = np.zeros((size, size), dtype=np.float32)
    for freq, amp in [(4, 0.45), (9, 0.28), (19, 0.16), (37, 0.11)]:
        phx = rng.uniform(0, 2 * math.pi)
        phy = rng.uniform(0, 2 * math.pi)
        noise += amp * (0.5 + 0.5 * np.sin(2 * math.pi * freq * xx + phx) * np.cos(2 * math.pi * freq * yy + phy))
    micro = rng.uniform(-0.08, 0.08, (size, size)).astype(np.float32)
    height = np.clip(noise + micro, 0.0, 1.0)

    albedo = np.zeros((size, size, 3), dtype=np.float32)
    emiss = np.zeros((size, size, 3), dtype=np.float32)
    rough = np.full((size, size), roughness, dtype=np.float32)
    metal = np.full((size, size), metalness, dtype=np.float32)

    half = size // 2
    # Left half (u < 0.5): Craggy asteroid rock with subtle mineral flecks
    rock_col = np.array(rock_rgb, dtype=np.float32)
    shade = 0.62 + 0.65 * height[:, :half, None]
    albedo[:, :half] = rock_col * shade
    fissure = np.abs(np.sin(14 * xx[:, :half] + 6 * height[:, :half])) < 0.09
    albedo[:, :half][fissure] = np.array(vein_rgb, dtype=np.float32) * 0.85
    if emissive_vein:
        emiss[:, :half][fissure] = np.array(vein_rgb, dtype=np.float32) * 0.55

    # Right half (u >= 0.5): Pure mineral crystal / metallic ore facet surface
    facet = 0.72 + 0.35 * np.cos(18 * xx[:, half:] - 12 * yy[:, half:])
    albedo[:, half:] = np.array(vein_rgb, dtype=np.float32) * facet[:, :, None]
    rough[:, half:] = 0.18
    metal[:, half:] = 0.65 if not emissive_vein else 0.30
    if emissive_vein:
        emiss[:, half:] = np.array(vein_rgb, dtype=np.float32) * 0.85

    orm = np.stack(
        [
            np.clip(150 + height * 105, 0, 255),
            np.clip(rough * 255.0, 0, 255),
            np.clip(metal * 255.0, 0, 255),
        ],
        axis=-1,
    )
    return {
        "albedo": array_to_png(albedo),
        "normal": height_to_normal_png(height, strength=4.2),
        "orm": array_to_png(orm),
        "emissive": array_to_png(emiss),
    }


# ==============================================================================
# 2. GEOMETRY PRIMITIVES & UV QUADRANT MAPPING
# ==============================================================================
# UV Quadrants matching make_scifi_trim_pbr:
# Q_PRIMARY = 0 (u in [0.03..0.47], v in [0.03..0.47])
# Q_DARK    = 1 (u in [0.53..0.97], v in [0.03..0.47])
# Q_TRIM    = 2 (u in [0.03..0.47], v in [0.53..0.97])
# Q_EMISS   = 3 (u in [0.53..0.97], v in [0.53..0.97])

Q_PRIMARY = 0
Q_DARK = 1
Q_TRIM = 2
Q_EMISS = 3


class PartBuilder:
    """Collects mesh sub-parts, splits sharp edges for crisp sci-fi normals, and maps UVs."""

    def __init__(self) -> None:
        self.vertices: List[np.ndarray] = []
        self.normals: List[np.ndarray] = []
        self.uvs: List[np.ndarray] = []
        self.faces: List[np.ndarray] = []
        self._v_offset = 0

    def add_mesh(
        self,
        mesh: trimesh.Trimesh,
        quadrant: int = Q_PRIMARY,
        smooth: bool = False,
        uv_mode: str = "quadrant",
        uv_scale: float = 0.5,
    ) -> None:
        m = mesh.copy()
        if not smooth:
            # Faceted / hard-edge split so every chamfered armor plate has crisp specular lighting
            verts = m.vertices[m.faces].reshape(-1, 3)
            faces = np.arange(len(verts), dtype=np.uint32).reshape(-1, 3)
            v0, v1, v2 = verts[faces[:, 0]], verts[faces[:, 1]], verts[faces[:, 2]]
            fn = np.cross(v1 - v0, v2 - v0)
            fn /= np.linalg.norm(fn, axis=1, keepdims=True) + 1e-9
            norms = np.repeat(fn, 3, axis=0)
        else:
            verts = np.asarray(m.vertices, dtype=np.float32)
            faces = np.asarray(m.faces, dtype=np.uint32)
            norms = np.asarray(m.vertex_normals, dtype=np.float32)

        # Tri-planar projection from dominant normal axis
        an = np.abs(norms)
        u_raw = np.where(an[:, 0] > an[:, 1], np.where(an[:, 0] > an[:, 2], verts[:, 2], verts[:, 0]), np.where(an[:, 1] > an[:, 2], verts[:, 0], verts[:, 0]))
        v_raw = np.where(an[:, 0] > an[:, 1], np.where(an[:, 0] > an[:, 2], verts[:, 1], verts[:, 1]), np.where(an[:, 1] > an[:, 2], verts[:, 2], verts[:, 1]))
        u_frac = np.mod(u_raw * uv_scale + 0.5, 1.0)
        v_frac = np.mod(v_raw * uv_scale + 0.5, 1.0)

        if uv_mode == "quadrant":
            u0 = 0.04 if (quadrant % 2 == 0) else 0.54
            v0 = 0.04 if (quadrant // 2 == 0) else 0.54
            uv = np.stack([u0 + u_frac * 0.42, v0 + v_frac * 0.42], axis=-1)
        elif uv_mode == "rock_left":
            uv = np.stack([0.03 + u_frac * 0.44, 0.03 + v_frac * 0.94], axis=-1)
        elif uv_mode == "crystal_right":
            uv = np.stack([0.53 + u_frac * 0.44, 0.03 + v_frac * 0.94], axis=-1)
        else:
            uv = np.stack([u_frac, v_frac], axis=-1)

        self.vertices.append(verts.astype(np.float32))
        self.normals.append(norms.astype(np.float32))
        self.uvs.append(uv.astype(np.float32))
        self.faces.append(faces.astype(np.uint32) + self._v_offset)
        self._v_offset += len(verts)

    def build_arrays(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        return (
            np.concatenate(self.vertices, axis=0),
            np.concatenate(self.normals, axis=0),
            np.concatenate(self.uvs, axis=0),
            np.concatenate(self.faces, axis=0),
        )


def xform(pos=(0.0, 0.0, 0.0), rot_xyz=(0.0, 0.0, 0.0), scale=(1.0, 1.0, 1.0)) -> np.ndarray:
    rx, ry, rz = [math.radians(a) for a in rot_xyz]
    cx, sx = math.cos(rx), math.sin(rx)
    cy, sy = math.cos(ry), math.sin(ry)
    cz, sz = math.cos(rz), math.sin(rz)
    mx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]], dtype=np.float64)
    my = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]], dtype=np.float64)
    mz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]], dtype=np.float64)
    r = mz @ my @ mx @ np.diag(scale)
    m = np.eye(4, dtype=np.float64)
    m[:3, :3] = r
    m[:3, 3] = pos
    return m


def chamfer_box(extents=(1.0, 1.0, 1.0), bevel: float = 0.08, pos=(0, 0, 0), rot_xyz=(0, 0, 0)) -> trimesh.Trimesh:
    """Builds a beveled sci-fi armor block via convex hull of inset corner triplets."""
    hx, hy, hz = extents[0] * 0.5, extents[1] * 0.5, extents[2] * 0.5
    b = min(bevel, hx * 0.45, hy * 0.45, hz * 0.45)
    pts = []
    for sx in (-1, 1):
        for sy in (-1, 1):
            for sz in (-1, 1):
                pts.append([sx * (hx - b), sy * hy, sz * hz])
                pts.append([sx * hx, sy * (hy - b), sz * hz])
                pts.append([sx * hx, sy * hy, sz * (hz - b)])
                pts.append([sx * (hx - b), sy * (hy - b), sz * hz])
                pts.append([sx * (hx - b), sy * hy, sz * (hz - b)])
                pts.append([sx * hx, sy * (hy - b), sz * (hz - b)])
    hull = trimesh.convex.convex_hull(np.array(pts, dtype=np.float64))
    hull.apply_transform(xform(pos=pos, rot_xyz=rot_xyz))
    return hull


def cyl(radius: float, height: float, sections: int = 12, pos=(0, 0, 0), rot_xyz=(0, 0, 0)) -> trimesh.Trimesh:
    """Cylinder originally along Z; rotated via rot_xyz and translated to pos."""
    m = trimesh.creation.cylinder(radius=radius, height=height, sections=sections)
    m.apply_transform(xform(pos=pos, rot_xyz=rot_xyz))
    return m


def cone_frustum(r_bottom: float, r_top: float, height: float, sections: int = 14, pos=(0, 0, 0), rot_xyz=(0, 0, 0)) -> trimesh.Trimesh:
    """Lathed frustum along Z from -height/2 (r_bottom) to +height/2 (r_top)."""
    angles = np.linspace(0, 2 * math.pi, sections, endpoint=False)
    v_bot = np.stack([r_bottom * np.cos(angles), r_bottom * np.sin(angles), np.full_like(angles, -height * 0.5)], axis=-1)
    v_top = np.stack([r_top * np.cos(angles), r_top * np.sin(angles), np.full_like(angles, height * 0.5)], axis=-1)
    c_bot = np.array([[0.0, 0.0, -height * 0.5]])
    c_top = np.array([[0.0, 0.0, height * 0.5]])
    verts = np.concatenate([v_bot, v_top, c_bot, c_top], axis=0)
    ib = 2 * sections
    it = 2 * sections + 1
    faces = []
    for i in range(sections):
        j = (i + 1) % sections
        faces.append([i, j, sections + j])
        faces.append([i, sections + j, sections + i])
        faces.append([ib, j, i])
        faces.append([it, sections + i, sections + j])
    m = trimesh.Trimesh(vertices=verts, faces=np.array(faces, dtype=np.int64), process=True)
    m.apply_transform(xform(pos=pos, rot_xyz=rot_xyz))
    return m


def torus_ring(major_r: float, minor_r: float, maj_sec: int = 18, min_sec: int = 8, pos=(0, 0, 0), rot_xyz=(0, 0, 0)) -> trimesh.Trimesh:
    m = trimesh.creation.torus(major_radius=major_r, minor_radius=minor_r, major_sections=maj_sec, minor_sections=min_sec)
    m.apply_transform(xform(pos=pos, rot_xyz=rot_xyz))
    return m


# ==============================================================================
# 3. BINARY GLTF 2.0 (.GLB) EXPORTER WITH EMBEDDED PBR TEXTURES
# ==============================================================================

def export_glb(
    path: Path,
    builder: PartBuilder,
    pbr_textures: Dict[str, bytes],
    emissive_factor: Tuple[float, float, float] = (1.2, 1.2, 1.2),
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    verts, norms, uvs, faces = builder.build_arrays()
    indices = faces.reshape(-1).astype(np.uint32)

    blob = bytearray()
    views = []

    def append_chunk(raw: bytes, target: int = 0) -> int:
        while len(blob) % 4 != 0:
            blob.append(0)
        offset = len(blob)
        blob.extend(raw)
        bv_idx = len(views)
        bv = pygltflib.BufferView(buffer=0, byteOffset=offset, byteLength=len(raw))
        if target:
            bv.target = target
        views.append(bv)
        return bv_idx

    bv_pos = append_chunk(verts.tobytes(), pygltflib.ARRAY_BUFFER)
    bv_nrm = append_chunk(norms.tobytes(), pygltflib.ARRAY_BUFFER)
    bv_uv = append_chunk(uvs.tobytes(), pygltflib.ARRAY_BUFFER)
    bv_idx = append_chunk(indices.tobytes(), pygltflib.ELEMENT_ARRAY_BUFFER)

    bv_alb = append_chunk(pbr_textures["albedo"])
    bv_nrm_tex = append_chunk(pbr_textures["normal"])
    bv_orm = append_chunk(pbr_textures["orm"])
    bv_emi = append_chunk(pbr_textures["emissive"])

    while len(blob) % 4 != 0:
        blob.append(0)

    vmin = verts.min(axis=0).tolist()
    vmax = verts.max(axis=0).tolist()

    gltf = pygltflib.GLTF2(
        scene=0,
        scenes=[pygltflib.Scene(nodes=[0])],
        nodes=[pygltflib.Node(mesh=0, name=path.stem)],
        meshes=[
            pygltflib.Mesh(
                name=path.stem,
                primitives=[
                    pygltflib.Primitive(
                        attributes=pygltflib.Attributes(POSITION=0, NORMAL=1, TEXCOORD_0=2),
                        indices=3,
                        material=0,
                    )
                ],
            )
        ],
        accessors=[
            pygltflib.Accessor(
                bufferView=bv_pos,
                componentType=pygltflib.FLOAT,
                count=len(verts),
                type=pygltflib.VEC3,
                min=vmin,
                max=vmax,
            ),
            pygltflib.Accessor(
                bufferView=bv_nrm,
                componentType=pygltflib.FLOAT,
                count=len(norms),
                type=pygltflib.VEC3,
            ),
            pygltflib.Accessor(
                bufferView=bv_uv,
                componentType=pygltflib.FLOAT,
                count=len(uvs),
                type=pygltflib.VEC2,
            ),
            pygltflib.Accessor(
                bufferView=bv_idx,
                componentType=pygltflib.UNSIGNED_INT,
                count=len(indices),
                type=pygltflib.SCALAR,
            ),
        ],
        bufferViews=views,
        buffers=[pygltflib.Buffer(byteLength=len(blob))],
        samplers=[
            pygltflib.Sampler(
                magFilter=pygltflib.LINEAR,
                minFilter=pygltflib.LINEAR_MIPMAP_LINEAR,
                wrapS=pygltflib.REPEAT,
                wrapT=pygltflib.REPEAT,
            )
        ],
        images=[
            pygltflib.Image(bufferView=bv_alb, mimeType="image/png", name="albedo"),
            pygltflib.Image(bufferView=bv_nrm_tex, mimeType="image/png", name="normal"),
            pygltflib.Image(bufferView=bv_orm, mimeType="image/png", name="orm"),
            pygltflib.Image(bufferView=bv_emi, mimeType="image/png", name="emissive"),
        ],
        textures=[
            pygltflib.Texture(sampler=0, source=0),
            pygltflib.Texture(sampler=0, source=1),
            pygltflib.Texture(sampler=0, source=2),
            pygltflib.Texture(sampler=0, source=3),
        ],
        materials=[
            pygltflib.Material(
                name=f"mat_{path.stem}",
                pbrMetallicRoughness=pygltflib.PbrMetallicRoughness(
                    baseColorTexture=pygltflib.TextureInfo(index=0),
                    metallicRoughnessTexture=pygltflib.TextureInfo(index=2),
                    metallicFactor=1.0,
                    roughnessFactor=1.0,
                ),
                normalTexture=pygltflib.NormalMaterialTexture(index=1, scale=1.0),
                occlusionTexture=pygltflib.OcclusionTextureInfo(index=2, strength=0.8),
                emissiveTexture=pygltflib.TextureInfo(index=3),
                emissiveFactor=list(emissive_factor),
                doubleSided=False,
            )
        ],
    )
    gltf.set_binary_blob(bytes(blob))
    gltf.save_binary(str(path))


# ==============================================================================
# 4. MODULAR SHIP & EQUIPMENT 3D MODEL DEFINITIONS
# ==============================================================================

def add_docking_base(pb: PartBuilder, size_z: float = 1.6) -> None:
    """Standardized octagonal mounting base pad so equipment locks mechanically onto ship cells."""
    pb.add_mesh(cyl(0.76, 0.20, sections=8, pos=(0, -0.88, 0), rot_xyz=(90, 22.5, 0)), Q_DARK)
    pb.add_mesh(chamfer_box((1.22, 0.16, min(1.5, size_z * 0.78)), 0.06, pos=(0, -0.74, 0)), Q_TRIM)


def build_ship_and_equipment_models() -> List[Tuple[str, PartBuilder, Dict[str, bytes]]]:
    preview_items = []

    pbr_hull = make_scifi_trim_pbr((196, 210, 228), (225, 162, 38), (35, 225, 255), seed=10)
    pbr_mining = make_scifi_trim_pbr((225, 168, 42), (72, 92, 118), (45, 235, 255), seed=20)
    pbr_collect = make_scifi_trim_pbr((58, 152, 205), (218, 148, 46), (80, 245, 220), seed=30)
    pbr_weapon = make_scifi_trim_pbr((86, 98, 118), (195, 62, 54), (255, 110, 45), seed=40)
    pbr_plasma = make_scifi_trim_pbr((76, 84, 115), (142, 72, 215), (165, 95, 255), seed=45)
    pbr_defense = make_scifi_trim_pbr((68, 118, 168), (195, 212, 232), (55, 215, 255), seed=50)
    pbr_utility = make_scifi_trim_pbr((152, 172, 188), (64, 168, 128), (85, 250, 165), seed=60)
    pbr_engine = make_scifi_trim_pbr((92, 108, 130), (225, 145, 38), (55, 215, 255), seed=70)

    # 1. Command Cockpit Mk1 (facing -Z)
    pb = PartBuilder()
    pb.add_mesh(chamfer_box((1.86, 1.32, 1.50), 0.18, pos=(0, -0.12, 0.22)), Q_PRIMARY)
    pb.add_mesh(cone_frustum(0.92, 0.42, 1.15, sections=8, pos=(0, -0.18, -0.82), rot_xyz=(0, 180, 22.5)), Q_PRIMARY)
    # Panoramic cyan visor canopy
    pb.add_mesh(cone_frustum(0.68, 0.30, 0.95, sections=8, pos=(0, 0.24, -0.45), rot_xyz=(-16, 180, 22.5)), Q_EMISS)
    # Canopy armor frame ribs & side sensor pods
    pb.add_mesh(chamfer_box((0.14, 0.36, 1.05), 0.03, pos=(0, 0.36, -0.35), rot_xyz=(-16, 0, 0)), Q_DARK)
    for sx in (-1, 1):
        pb.add_mesh(chamfer_box((0.32, 0.44, 1.24), 0.07, pos=(sx * 0.96, -0.14, 0.12)), Q_TRIM)
        pb.add_mesh(cyl(0.09, 0.55, 8, pos=(sx * 0.96, -0.14, -0.62)), Q_DARK)
        pb.add_mesh(cyl(0.06, 0.08, 8, pos=(sx * 0.96, -0.14, -0.90)), Q_EMISS)
    # Rear docking collar (+Z)
    pb.add_mesh(cyl(0.68, 0.22, 8, pos=(0, 0, 0.92)), Q_DARK)
    export_glb(MODELS_DIR / "ship" / "mod_cockpit_mk1.glb", pb, pbr_hull)
    preview_items.append(("Cockpit Mk1", pb, pbr_hull))

    # 2. Structural Hull Expansion Cell (2x2x2m modular chamfered spaceframe + 6 docking ports)
    pb = PartBuilder()
    pb.add_mesh(chamfer_box((1.88, 1.88, 1.88), 0.22, pos=(0, 0, 0)), Q_PRIMARY)
    for axis_rot, p in [
        ((0, 0, 0), (0, 0, 0.92)),
        ((0, 0, 0), (0, 0, -0.92)),
        ((90, 0, 0), (0, 0.92, 0)),
        ((90, 0, 0), (0, -0.92, 0)),
        ((0, 90, 0), (0.92, 0, 0)),
        ((0, 90, 0), (-0.92, 0, 0)),
    ]:
        pb.add_mesh(cyl(0.56, 0.16, 8, pos=p, rot_xyz=axis_rot), Q_DARK)
    for sx in (-0.82, 0.82):
        pb.add_mesh(chamfer_box((0.20, 0.22, 1.72), 0.04, pos=(sx, 0.84, 0)), Q_TRIM)
    export_glb(MODELS_DIR / "ship" / "mod_hull_cell.glb", pb, pbr_hull)
    preview_items.append(("Hull Cell", pb, pbr_hull))

    # 3. Basic Ion Engine (nozzle exhausting toward +Z)
    pb = PartBuilder()
    pb.add_mesh(chamfer_box((1.52, 1.38, 1.15), 0.16, pos=(0, 0, -0.32)), Q_PRIMARY)
    pb.add_mesh(cyl(0.58, 0.35, 12, pos=(0, 0, -0.88)), Q_DARK)
    pb.add_mesh(cone_frustum(0.50, 0.84, 0.82, 16, pos=(0, 0, 0.56)), Q_DARK)
    pb.add_mesh(torus_ring(0.68, 0.08, 16, 8, pos=(0, 0, 0.38)), Q_TRIM)
    pb.add_mesh(cyl(0.56, 0.14, 16, pos=(0, 0, 0.82)), Q_EMISS)
    for sx in (-0.78, 0.78):
        pb.add_mesh(cyl(0.14, 1.05, 8, pos=(sx, 0.25, -0.22)), Q_TRIM)
    export_glb(MODELS_DIR / "ship" / "mod_engine_basic.glb", pb, pbr_engine)
    preview_items.append(("Basic Engine", pb, pbr_engine))

    # ---- MINING CATEGORY (5) ----
    # 4. Basic Mining Laser
    pb = PartBuilder()
    add_docking_base(pb)
    pb.add_mesh(chamfer_box((0.92, 0.68, 1.05), 0.10, pos=(0, -0.32, 0.15)), Q_PRIMARY)
    for sx in (-0.26, 0.26):
        pb.add_mesh(cyl(0.11, 1.25, 10, pos=(sx, -0.25, -0.48)), Q_DARK)
        pb.add_mesh(cyl(0.08, 0.12, 10, pos=(sx, -0.25, -1.10)), Q_EMISS)
    pb.add_mesh(chamfer_box((0.76, 0.22, 0.72), 0.04, pos=(0, 0.10, 0.15)), Q_TRIM)
    export_glb(MODELS_DIR / "equipment" / "eq_mining_basic.glb", pb, pbr_mining)
    preview_items.append(("Basic Mining Laser", pb, pbr_mining))

    # 5. Advanced Mining Laser
    pb = PartBuilder()
    add_docking_base(pb)
    pb.add_mesh(cyl(0.56, 0.42, 12, pos=(0, -0.46, 0.10), rot_xyz=(90, 0, 0)), Q_DARK)
    pb.add_mesh(chamfer_box((1.10, 0.66, 1.15), 0.12, pos=(0, -0.05, 0.08)), Q_PRIMARY)
    for sx in (-0.32, 0.32):
        pb.add_mesh(cyl(0.14, 1.38, 12, pos=(sx, -0.04, -0.58)), Q_DARK)
        pb.add_mesh(torus_ring(0.17, 0.04, 12, 6, pos=(sx, -0.04, -0.82)), Q_TRIM)
        pb.add_mesh(cyl(0.10, 0.15, 12, pos=(sx, -0.04, -1.25)), Q_EMISS)
    pb.add_mesh(chamfer_box((0.36, 0.28, 0.65), 0.05, pos=(0, 0.38, -0.05)), Q_EMISS)
    export_glb(MODELS_DIR / "equipment" / "eq_mining_advanced.glb", pb, pbr_mining)

    # 6. Plasma Drill
    pb = PartBuilder()
    add_docking_base(pb)
    pb.add_mesh(chamfer_box((1.24, 0.85, 1.10), 0.14, pos=(0, -0.24, 0.25)), Q_PRIMARY)
    pb.add_mesh(cone_frustum(0.48, 0.12, 1.35, 10, pos=(0, -0.18, -0.68), rot_xyz=(0, 180, 0)), Q_DARK)
    for zc, r in [(-0.28, 0.46), (-0.58, 0.36), (-0.88, 0.25)]:
        pb.add_mesh(torus_ring(r, 0.055, 14, 6, pos=(0, -0.18, zc)), Q_EMISS)
    pb.add_mesh(cyl(0.10, 0.26, 10, pos=(0, -0.18, -1.32)), Q_EMISS)
    export_glb(MODELS_DIR / "equipment" / "eq_plasma_drill.glb", pb, pbr_plasma)
    preview_items.append(("Plasma Drill", pb, pbr_plasma))

    # 7. Crystal Extractor
    pb = PartBuilder()
    add_docking_base(pb)
    pb.add_mesh(chamfer_box((1.05, 0.72, 1.0), 0.12, pos=(0, -0.28, 0.22)), Q_PRIMARY)
    pb.add_mesh(cyl(0.26, 0.95, 8, pos=(0, -0.16, -0.42)), Q_EMISS)
    for ang in (30, 150, 270):
        rad = math.radians(ang)
        px, py = 0.42 * math.cos(rad), -0.16 + 0.42 * math.sin(rad)
        pb.add_mesh(chamfer_box((0.14, 0.14, 1.28), 0.03, pos=(px, py, -0.52)), Q_TRIM)
    export_glb(MODELS_DIR / "equipment" / "eq_crystal_extractor.glb", pb, pbr_collect)

    # 8. Heavy Mining Beam (1x1x2 spinal excavator: spans z in [-1.9, +1.9])
    pb = PartBuilder()
    add_docking_base(pb, size_z=3.4)
    pb.add_mesh(chamfer_box((1.48, 1.05, 2.55), 0.16, pos=(0, -0.15, 0.42)), Q_PRIMARY)
    for sx in (-0.62, 0.62):
        pb.add_mesh(cyl(0.26, 1.85, 12, pos=(sx, 0.18, 0.48)), Q_TRIM)
    pb.add_mesh(cyl(0.36, 2.35, 14, pos=(0, -0.12, -0.72)), Q_DARK)
    for zc in (-0.5, -1.0, -1.5):
        pb.add_mesh(torus_ring(0.42, 0.06, 14, 6, pos=(0, -0.12, zc)), Q_EMISS)
    pb.add_mesh(cyl(0.28, 0.18, 14, pos=(0, -0.12, -1.88)), Q_EMISS)
    export_glb(MODELS_DIR / "equipment" / "eq_heavy_mining_beam.glb", pb, pbr_mining)
    preview_items.append(("Heavy Mining Beam", pb, pbr_mining))

    # ---- COLLECTION CATEGORY (4) ----
    # 9. Magnetic Collector
    pb = PartBuilder()
    add_docking_base(pb)
    pb.add_mesh(chamfer_box((1.08, 0.56, 0.86), 0.10, pos=(0, -0.38, 0.20)), Q_PRIMARY)
    for sx in (-0.38, 0.38):
        pb.add_mesh(cyl(0.15, 0.92, 10, pos=(sx, -0.22, -0.38)), Q_TRIM)
        pb.add_mesh(cyl(0.18, 0.18, 10, pos=(sx, -0.22, -0.86)), Q_EMISS)
    pb.add_mesh(torus_ring(0.38, 0.10, 14, 8, pos=(0, -0.22, 0.05), rot_xyz=(90, 0, 0)), Q_TRIM)
    export_glb(MODELS_DIR / "equipment" / "eq_magnet_basic.glb", pb, pbr_collect)
    preview_items.append(("Magnetic Collector", pb, pbr_collect))

    # 10. Advanced Magnet
    pb = PartBuilder()
    add_docking_base(pb)
    pb.add_mesh(cyl(0.55, 0.58, 12, pos=(0, -0.38, 0), rot_xyz=(90, 0, 0)), Q_PRIMARY)
    pb.add_mesh(cone_frustum(0.28, 0.78, 0.45, 16, pos=(0, 0.12, -0.18), rot_xyz=(-35, 180, 0)), Q_DARK)
    pb.add_mesh(torus_ring(0.62, 0.06, 16, 6, pos=(0, 0.18, -0.24), rot_xyz=(-35, 0, 0)), Q_EMISS)
    pb.add_mesh(cyl(0.16, 0.40, 10, pos=(0, 0.26, -0.32), rot_xyz=(-35, 0, 0)), Q_EMISS)
    export_glb(MODELS_DIR / "equipment" / "eq_magnet_advanced.glb", pb, pbr_collect)

    # 11. Vacuum Collector
    pb = PartBuilder()
    add_docking_base(pb)
    pb.add_mesh(chamfer_box((1.28, 0.88, 1.05), 0.14, pos=(0, -0.22, 0.24)), Q_PRIMARY)
    pb.add_mesh(cone_frustum(0.42, 0.82, 0.78, 14, pos=(0, -0.18, -0.58), rot_xyz=(0, 180, 0)), Q_DARK)
    pb.add_mesh(torus_ring(0.76, 0.07, 16, 6, pos=(0, -0.18, -0.94)), Q_TRIM)
    pb.add_mesh(cyl(0.36, 0.12, 12, pos=(0, -0.18, -0.32)), Q_EMISS)
    export_glb(MODELS_DIR / "equipment" / "eq_vacuum_collector.glb", pb, pbr_collect)

    # 12. Wide-Range Collector (1x1x2 dorsal tractor pylon)
    pb = PartBuilder()
    add_docking_base(pb, size_z=3.2)
    pb.add_mesh(chamfer_box((1.36, 0.68, 2.75), 0.14, pos=(0, -0.34, 0)), Q_PRIMARY)
    for zc in (-0.85, 0.85):
        pb.add_mesh(cyl(0.28, 0.85, 10, pos=(0, 0.25, zc), rot_xyz=(90, 0, 0)), Q_DARK)
        pb.add_mesh(torus_ring(0.56, 0.07, 16, 6, pos=(0, 0.68, zc), rot_xyz=(90, 0, 0)), Q_EMISS)
        pb.add_mesh(cyl(0.18, 0.28, 10, pos=(0, 0.78, zc), rot_xyz=(90, 0, 0)), Q_EMISS)
    export_glb(MODELS_DIR / "equipment" / "eq_wide_collector.glb", pb, pbr_collect)

    # ---- WEAPONS CATEGORY (6) ----
    # 13. Machine Gun (6-barrel rotary gatling turret)
    pb = PartBuilder()
    add_docking_base(pb)
    pb.add_mesh(cyl(0.58, 0.36, 12, pos=(0, -0.48, 0.08), rot_xyz=(90, 0, 0)), Q_DARK)
    pb.add_mesh(chamfer_box((1.02, 0.62, 0.92), 0.10, pos=(0, -0.05, 0.18)), Q_PRIMARY)
    pb.add_mesh(cyl(0.32, 0.52, 10, pos=(0.56, -0.08, 0.18), rot_xyz=(0, 90, 0)), Q_TRIM)  # Ammo drum
    for i in range(6):
        ang = math.radians(i * 60)
        pb.add_mesh(cyl(0.055, 1.32, 8, pos=(0.17 * math.cos(ang), -0.05 + 0.17 * math.sin(ang), -0.68)), Q_DARK)
    pb.add_mesh(cyl(0.24, 0.10, 12, pos=(0, -0.05, -0.45)), Q_TRIM)
    pb.add_mesh(cyl(0.24, 0.10, 12, pos=(0, -0.05, -1.12)), Q_TRIM)
    export_glb(MODELS_DIR / "equipment" / "eq_machine_gun.glb", pb, pbr_weapon)
    preview_items.append(("Machine Gun", pb, pbr_weapon))

    # 14. Laser Cannon
    pb = PartBuilder()
    add_docking_base(pb)
    pb.add_mesh(cyl(0.58, 0.38, 12, pos=(0, -0.48, 0.05), rot_xyz=(90, 0, 0)), Q_DARK)
    pb.add_mesh(chamfer_box((1.16, 0.58, 1.08), 0.12, pos=(0, -0.04, 0.12)), Q_PRIMARY)
    for sx in (-0.34, 0.34):
        pb.add_mesh(chamfer_box((0.22, 0.24, 1.42), 0.04, pos=(sx, -0.04, -0.66)), Q_DARK)
        pb.add_mesh(cyl(0.075, 0.22, 10, pos=(sx, -0.04, -1.36)), Q_EMISS)
    pb.add_mesh(chamfer_box((0.44, 0.18, 0.72), 0.04, pos=(0, 0.28, 0.12)), Q_EMISS)
    export_glb(MODELS_DIR / "equipment" / "eq_laser_cannon.glb", pb, pbr_weapon)
    preview_items.append(("Laser Cannon", pb, pbr_weapon))

    # 15. Plasma Cannon
    pb = PartBuilder()
    add_docking_base(pb)
    pb.add_mesh(chamfer_box((1.22, 0.74, 1.15), 0.14, pos=(0, -0.22, 0.18)), Q_PRIMARY)
    pb.add_mesh(cyl(0.28, 1.35, 12, pos=(0, -0.10, -0.58)), Q_DARK)
    for zc in (-0.35, -0.68, -1.00):
        pb.add_mesh(torus_ring(0.34, 0.06, 12, 6, pos=(0, -0.10, zc)), Q_EMISS)
    pb.add_mesh(cyl(0.22, 0.14, 12, pos=(0, -0.10, -1.26)), Q_EMISS)
    export_glb(MODELS_DIR / "equipment" / "eq_plasma_cannon.glb", pb, pbr_plasma)

    # 16. Rocket Launcher (6-tube armored salvo pod)
    pb = PartBuilder()
    add_docking_base(pb)
    pb.add_mesh(chamfer_box((1.38, 0.96, 1.36), 0.14, pos=(0, -0.16, 0.0)), Q_PRIMARY)
    pb.add_mesh(chamfer_box((1.44, 0.20, 1.10), 0.04, pos=(0, 0.36, 0.05)), Q_TRIM)
    for rx in (-0.38, 0.0, 0.38):
        for ry in (-0.32, 0.04):
            pb.add_mesh(cyl(0.14, 1.44, 10, pos=(rx, ry, -0.02)), Q_DARK)
            pb.add_mesh(cone_frustum(0.11, 0.02, 0.18, 10, pos=(rx, ry, -0.72), rot_xyz=(0, 180, 0)), Q_EMISS)
    export_glb(MODELS_DIR / "equipment" / "eq_rocket_launcher.glb", pb, pbr_weapon)
    preview_items.append(("Rocket Launcher", pb, pbr_weapon))

    # 17. Guided Missile Battery (angled VLS launcher + radar dome)
    pb = PartBuilder()
    add_docking_base(pb)
    pb.add_mesh(chamfer_box((1.42, 0.92, 1.28), 0.14, pos=(0, -0.18, 0.06), rot_xyz=(18, 0, 0)), Q_PRIMARY)
    for rx in (-0.42, -0.14, 0.14, 0.42):
        for rz in (-0.22, 0.18):
            pb.add_mesh(cyl(0.10, 0.32, 8, pos=(rx, 0.26, rz), rot_xyz=(72, 0, 0)), Q_EMISS)
    pb.add_mesh(cone_frustum(0.30, 0.08, 0.34, 12, pos=(0, 0.38, 0.52), rot_xyz=(-90, 0, 0)), Q_TRIM)
    export_glb(MODELS_DIR / "equipment" / "eq_missile_battery.glb", pb, pbr_weapon)

    # 18. Hypervelocity Railgun (1x1x2 twin magnetic accelerator rails)
    pb = PartBuilder()
    add_docking_base(pb, size_z=3.4)
    pb.add_mesh(chamfer_box((1.32, 0.82, 1.65), 0.14, pos=(0, -0.22, 0.95)), Q_PRIMARY)
    for sx in (-0.24, 0.24):
        pb.add_mesh(chamfer_box((0.18, 0.32, 3.35), 0.03, pos=(sx, -0.10, -0.22)), Q_DARK)
    pb.add_mesh(chamfer_box((0.16, 0.12, 3.15), 0.02, pos=(0, -0.10, -0.20)), Q_EMISS)
    for zc in (-0.1, -0.65, -1.20, -1.70):
        pb.add_mesh(chamfer_box((0.82, 0.52, 0.14), 0.03, pos=(0, -0.10, zc)), Q_TRIM)
    export_glb(MODELS_DIR / "equipment" / "eq_railgun.glb", pb, pbr_weapon)
    preview_items.append(("Hypervelocity Railgun", pb, pbr_weapon))

    # ---- DEFENSE CATEGORY (4 + Drone) ----
    # 19. Shield Generator
    pb = PartBuilder()
    add_docking_base(pb)
    pb.add_mesh(cyl(0.68, 0.48, 12, pos=(0, -0.42, 0), rot_xyz=(90, 0, 0)), Q_PRIMARY)
    pb.add_mesh(torus_ring(0.56, 0.08, 16, 8, pos=(0, 0.08, 0), rot_xyz=(90, 0, 0)), Q_TRIM)
    pb.add_mesh(torus_ring(0.44, 0.06, 16, 8, pos=(0, 0.12, 0), rot_xyz=(35, 0, 0)), Q_EMISS)
    pb.add_mesh(trimesh.creation.icosphere(subdivisions=2, radius=0.30).apply_transform(xform(pos=(0, 0.12, 0))), Q_EMISS, smooth=True)
    for ang in (0, 90, 180, 270):
        rad = math.radians(ang)
        pb.add_mesh(chamfer_box((0.16, 0.62, 0.28), 0.04, pos=(0.58 * math.cos(rad), -0.02, 0.58 * math.sin(rad)), rot_xyz=(0, -ang, 0)), Q_PRIMARY)
    export_glb(MODELS_DIR / "equipment" / "eq_shield_gen.glb", pb, pbr_defense)
    preview_items.append(("Shield Generator", pb, pbr_defense))

    # 20. Reinforced Armor Plate
    pb = PartBuilder()
    pb.add_mesh(chamfer_box((1.92, 1.15, 1.92), 0.24, pos=(0, -0.35, 0)), Q_PRIMARY)
    for rx in (-0.52, 0.52):
        for rz in (-0.52, 0.52):
            pb.add_mesh(chamfer_box((0.72, 0.26, 0.72), 0.06, pos=(rx, 0.28, rz)), Q_TRIM)
    export_glb(MODELS_DIR / "equipment" / "eq_armor_plate.glb", pb, pbr_defense)

    # 21. Nano-Repair Module
    pb = PartBuilder()
    add_docking_base(pb)
    pb.add_mesh(chamfer_box((1.24, 0.72, 1.24), 0.12, pos=(0, -0.28, 0)), Q_PRIMARY)
    pb.add_mesh(cyl(0.34, 0.65, 12, pos=(0, 0.22, 0.22), rot_xyz=(90, 0, 0)), Q_EMISS)
    for sx in (-0.38, 0.38):
        pb.add_mesh(chamfer_box((0.14, 0.52, 0.14), 0.03, pos=(sx, 0.24, -0.28), rot_xyz=(-25, 0, 0)), Q_TRIM)
        pb.add_mesh(cyl(0.06, 0.22, 8, pos=(sx, 0.48, -0.45)), Q_EMISS)
    export_glb(MODELS_DIR / "equipment" / "eq_repair_module.glb", pb, pbr_utility)

    # 22. Defensive Drone Bay + Orbiting Drone
    pb = PartBuilder()
    add_docking_base(pb)
    pb.add_mesh(chamfer_box((1.48, 0.44, 1.48), 0.10, pos=(0, -0.46, 0)), Q_PRIMARY)
    pb.add_mesh(torus_ring(0.54, 0.07, 16, 6, pos=(0, -0.18, 0), rot_xyz=(90, 0, 0)), Q_EMISS)
    pb.add_mesh(cyl(0.38, 0.12, 12, pos=(0, -0.22, 0), rot_xyz=(90, 0, 0)), Q_DARK)
    export_glb(MODELS_DIR / "equipment" / "eq_defense_drone_bay.glb", pb, pbr_defense)

    pb = PartBuilder()
    pb.add_mesh(trimesh.creation.icosphere(subdivisions=1, radius=0.32), Q_PRIMARY)
    pb.add_mesh(torus_ring(0.46, 0.05, 12, 6, rot_xyz=(90, 0, 0)), Q_TRIM)
    pb.add_mesh(cyl(0.08, 0.45, 8, pos=(0, -0.08, -0.32)), Q_EMISS)
    export_glb(MODELS_DIR / "equipment" / "drone_orbiter.glb", pb, pbr_defense)

    # ---- UTILITY CATEGORY (5) ----
    # 23. Deep-Space Radar
    pb = PartBuilder()
    add_docking_base(pb)
    pb.add_mesh(cyl(0.24, 0.65, 10, pos=(0, -0.35, 0), rot_xyz=(90, 0, 0)), Q_DARK)
    pb.add_mesh(cone_frustum(0.18, 0.84, 0.36, 16, pos=(0, 0.26, -0.10), rot_xyz=(-55, 180, 0)), Q_PRIMARY)
    pb.add_mesh(cyl(0.05, 0.52, 8, pos=(0, 0.44, -0.28), rot_xyz=(-55, 0, 0)), Q_EMISS)
    export_glb(MODELS_DIR / "equipment" / "eq_radar.glb", pb, pbr_utility)

    # 24. Spectrographic Resource Scanner
    pb = PartBuilder()
    add_docking_base(pb)
    pb.add_mesh(chamfer_box((0.96, 0.62, 0.96), 0.10, pos=(0, -0.34, 0)), Q_PRIMARY)
    pb.add_mesh(chamfer_box((1.18, 0.36, 0.44), 0.06, pos=(0, 0.22, -0.08)), Q_DARK)
    for sx in (-0.36, 0.0, 0.36):
        pb.add_mesh(cyl(0.12, 0.18, 12, pos=(sx, 0.22, -0.30)), Q_EMISS)
    export_glb(MODELS_DIR / "equipment" / "eq_resource_scanner.glb", pb, pbr_utility)

    # 25. Tokamak Fusion Energy Generator
    pb = PartBuilder()
    add_docking_base(pb)
    pb.add_mesh(chamfer_box((1.44, 0.56, 1.44), 0.12, pos=(0, -0.38, 0)), Q_PRIMARY)
    pb.add_mesh(torus_ring(0.52, 0.22, 16, 10, pos=(0, 0.12, 0), rot_xyz=(90, 0, 0)), Q_EMISS)
    for ang in (0, 60, 120, 180, 240, 300):
        rad = math.radians(ang)
        pb.add_mesh(chamfer_box((0.12, 0.58, 0.32), 0.02, pos=(0.54 * math.cos(rad), 0.12, 0.54 * math.sin(rad)), rot_xyz=(0, -ang, 0)), Q_DARK)
    export_glb(MODELS_DIR / "equipment" / "eq_energy_generator.glb", pb, pbr_utility)
    preview_items.append(("Fusion Generator", pb, pbr_utility))

    # 26. Pressurized Cargo Expansion Pod
    pb = PartBuilder()
    pb.add_mesh(chamfer_box((1.78, 1.56, 1.78), 0.20, pos=(0, -0.08, 0)), Q_TRIM)
    for sx in (-0.46, 0.46):
        pb.add_mesh(cyl(0.38, 1.62, 10, pos=(sx, 0.05, 0)), Q_PRIMARY)
    pb.add_mesh(chamfer_box((1.84, 0.22, 0.36), 0.04, pos=(0, 0.05, 0)), Q_DARK)
    export_glb(MODELS_DIR / "equipment" / "eq_cargo_pod.glb", pb, pbr_mining)

    # 27. Vector Thruster Booster (twin high-output bells exhausting +Z)
    pb = PartBuilder()
    pb.add_mesh(chamfer_box((1.76, 1.24, 1.18), 0.16, pos=(0, 0, -0.28)), Q_PRIMARY)
    for sx in (-0.46, 0.46):
        pb.add_mesh(cone_frustum(0.34, 0.52, 0.84, 14, pos=(sx, 0, 0.56)), Q_DARK)
        pb.add_mesh(torus_ring(0.42, 0.055, 14, 6, pos=(sx, 0, 0.36)), Q_TRIM)
        pb.add_mesh(cyl(0.34, 0.14, 14, pos=(sx, 0, 0.84)), Q_EMISS)
    export_glb(MODELS_DIR / "equipment" / "eq_thruster_booster.glb", pb, pbr_engine)
    preview_items.append(("Thruster Booster", pb, pbr_engine))

    return preview_items


# ==============================================================================
# 5. SCULPTED SECTOR ASTEROIDS, RESOURCE CHUNKS & PROJECTILES
# ==============================================================================

def make_sculpted_rock(radius: float, seed: int, elongation=(1.0, 0.85, 1.15), subdivisions: int = 3) -> trimesh.Trimesh:
    """Voronoi-plane + multi-frequency ridge sculpted craggy asteroid (NEVER a plain sphere!)."""
    rng = np.random.default_rng(seed)
    m = trimesh.creation.icosphere(subdivisions=subdivisions, radius=radius)
    v = m.vertices.copy()
    dirs = v / (np.linalg.norm(v, axis=1, keepdims=True) + 1e-9)

    # Voronoi planar facets & craters
    cell_dirs = rng.standard_normal((14, 3))
    cell_dirs /= np.linalg.norm(cell_dirs, axis=1, keepdims=True)
    dots = dirs @ cell_dirs.T
    sorted_dots = np.sort(dots, axis=1)
    ridge = sorted_dots[:, -1] - sorted_dots[:, -2]  # 0 on sharp ridge seams, high in facet centers

    disp = 0.76 + 0.34 * (1.0 - np.clip(ridge * 2.2, 0, 1))
    # Crater depressions
    for cd in cell_dirs[:4]:
        d_ang = dirs @ cd
        crater = np.clip((d_ang - 0.78) / 0.22, 0.0, 1.0)
        disp -= 0.22 * (crater ** 1.5)

    # Multi-frequency harmonic crags
    disp += 0.12 * np.sin(4.3 * dirs[:, 0] + 1.1) * np.cos(3.7 * dirs[:, 1] - 0.5)
    disp += 0.07 * np.cos(7.9 * dirs[:, 2] + 2.0 * dirs[:, 0])

    v = dirs * (radius * disp[:, None]) * np.array(elongation)
    return trimesh.Trimesh(vertices=v, faces=m.faces, process=True)


def build_asteroids_and_chunks() -> List[Tuple[str, PartBuilder, Dict[str, bytes]]]:
    preview_items = []
    sector_specs = [
        ("ast_silicate_iron", (96, 88, 82), (185, 145, 96), False, 0.35, 0.85, 101, (1.25, 0.88, 1.05), 3),
        ("ast_crystal_geode", (66, 62, 92), (55, 235, 255), True, 0.25, 0.72, 102, (1.05, 1.0, 1.12), 8),
        ("ast_slag_wreck_rock", (78, 82, 90), (205, 118, 52), False, 0.68, 0.56, 103, (1.35, 0.78, 0.95), 4),
        ("ast_fulgurite_spire", (54, 50, 78), (175, 95, 255), True, 0.32, 0.65, 104, (0.78, 1.55, 0.82), 6),
        ("ast_void_monolith", (34, 30, 48), (255, 58, 145), True, 0.48, 0.45, 105, (0.92, 1.38, 0.92), 7),
    ]

    for name, rock_rgb, vein_rgb, em_vein, met, rgh, seed, elong, n_crystals in sector_specs:
        pbr = make_rock_crystal_pbr(rock_rgb, vein_rgb, em_vein, met, rgh, seed=seed)
        pb = PartBuilder()
        rock = make_sculpted_rock(2.2, seed=seed, elongation=elong, subdivisions=3)
        pb.add_mesh(rock, uv_mode="rock_left", smooth=False, uv_scale=0.28)

        rng = np.random.default_rng(seed + 500)
        for _ in range(n_crystals):
            d = rng.standard_normal(3)
            d /= np.linalg.norm(d)
            rot_y = math.degrees(math.atan2(d[0], d[2]))
            rot_x = -math.degrees(math.asin(np.clip(d[1], -1, 1)))
            shard = cone_frustum(
                rng.uniform(0.24, 0.42),
                0.03,
                rng.uniform(1.0, 1.65),
                sections=6,
                pos=tuple(d * 1.65),
                rot_xyz=(rot_x, rot_y, rng.uniform(0, 60)),
            )
            pb.add_mesh(shard, uv_mode="crystal_right", smooth=False)

        if name == "ast_slag_wreck_rock":
            # Embedded structural girder beam jutting from Iron Graveyard slag asteroid
            pb.add_mesh(chamfer_box((0.42, 0.42, 4.4), 0.04, pos=(0.4, 0.3, 0), rot_xyz=(25, 35, 10)), uv_mode="crystal_right")

        export_glb(MODELS_DIR / "asteroids" / f"{name}.glb", pb, pbr)
        if name in ("ast_silicate_iron", "ast_crystal_geode", "ast_void_monolith"):
            preview_items.append((name, pb, pbr))

    # 5 Collectible Physical Resource Chunks
    chunk_specs = [
        ("chunk_iron", (120, 110, 102), (215, 165, 105), False, 201),
        ("chunk_titanium", (140, 156, 178), (225, 240, 255), False, 202),
        ("chunk_crystal", (45, 140, 180), (65, 245, 255), True, 203),
        ("chunk_plasma_core", (88, 52, 145), (195, 110, 255), True, 204),
        ("chunk_void_iridium", (48, 28, 68), (255, 65, 155), True, 205),
    ]
    for cname, r_col, v_col, em, seed in chunk_specs:
        pbr = make_rock_crystal_pbr(r_col, v_col, em, metalness=0.55, roughness=0.35, size=128, seed=seed)
        pb = PartBuilder()
        core = make_sculpted_rock(0.42, seed=seed, elongation=(1.1, 0.9, 1.0), subdivisions=1)
        pb.add_mesh(core, uv_mode="rock_left")
        pb.add_mesh(cone_frustum(0.18, 0.02, 0.65, 6, pos=(0.12, 0.18, 0), rot_xyz=(35, 20, 0)), uv_mode="crystal_right")
        pb.add_mesh(cone_frustum(0.15, 0.02, 0.58, 6, pos=(-0.15, -0.10, 0.14), rot_xyz=(-40, -30, 0)), uv_mode="crystal_right")
        export_glb(MODELS_DIR / "asteroids" / f"{cname}.glb", pb, pbr)

    # Physical Projectiles: Rocket & Guided Missile (oriented -Z forward)
    pbr_proj = make_scifi_trim_pbr((215, 222, 232), (215, 62, 48), (255, 165, 45), size=128, seed=301)
    for pname, length, r_body, fin_span in [("proj_rocket", 0.95, 0.11, 0.28), ("proj_missile", 1.25, 0.095, 0.34)]:
        pb = PartBuilder()
        pb.add_mesh(cyl(r_body, length * 0.72, 10, pos=(0, 0, 0.10)), Q_PRIMARY)
        pb.add_mesh(cone_frustum(r_body, 0.015, length * 0.34, 10, pos=(0, 0, -length * 0.42), rot_xyz=(0, 180, 0)), Q_TRIM)
        pb.add_mesh(cyl(r_body * 0.75, 0.08, 10, pos=(0, 0, length * 0.46)), Q_EMISS)
        for ang in (0, 90, 180, 270):
            pb.add_mesh(chamfer_box((fin_span * 2, 0.025, 0.24), 0.005, pos=(0, 0, length * 0.34), rot_xyz=(0, 0, ang)), Q_DARK)
        export_glb(MODELS_DIR / "projectiles" / f"{pname}.glb", pb, pbr_proj)

    return preview_items


# ==============================================================================
# 6. FIVE ORIGINAL ENEMY SPACECRAFT MODELS (-Z Forward)
# ==============================================================================

def build_enemy_spacecraft() -> List[Tuple[str, PartBuilder, Dict[str, bytes]]]:
    preview_items = []

    # 1. Scout Drone (agile tri-wing interceptor with glowing red eye)
    pbr_scout = make_scifi_trim_pbr((68, 76, 94), (185, 48, 48), (255, 55, 55), seed=401)
    pb = PartBuilder()
    pb.add_mesh(trimesh.creation.icosphere(subdivisions=2, radius=0.85), Q_PRIMARY)
    pb.add_mesh(cyl(0.36, 0.30, 12, pos=(0, 0, -0.78)), Q_EMISS)
    for ang in (90, 210, 330):
        rad = math.radians(ang)
        pb.add_mesh(
            chamfer_box((0.16, 1.85, 0.88), 0.04, pos=(1.05 * math.cos(rad), 1.05 * math.sin(rad), 0.15), rot_xyz=(0, 0, ang - 90)),
            Q_TRIM,
        )
    pb.add_mesh(cone_frustum(0.32, 0.48, 0.45, 12, pos=(0, 0, 0.92)), Q_DARK)
    pb.add_mesh(cyl(0.32, 0.10, 12, pos=(0, 0, 1.12)), Q_EMISS)
    export_glb(MODELS_DIR / "enemies" / "enemy_scout_drone.glb", pb, pbr_scout)
    preview_items.append(("Enemy: Scout Drone", pb, pbr_scout))

    # 2. Raider Ship (pirate twin-boom fanged gunship)
    pbr_raider = make_scifi_trim_pbr((96, 62, 54), (218, 132, 36), (255, 125, 35), seed=402)
    pb = PartBuilder()
    pb.add_mesh(chamfer_box((1.55, 0.92, 2.85), 0.18, pos=(0, 0, 0.15)), Q_PRIMARY)
    pb.add_mesh(cone_frustum(0.62, 0.25, 1.10, 8, pos=(0, 0.12, -1.55), rot_xyz=(0, 180, 22.5)), Q_EMISS)
    for sx in (-1, 1):
        pb.add_mesh(chamfer_box((0.68, 0.56, 3.65), 0.10, pos=(sx * 1.48, -0.08, -0.25)), Q_TRIM)
        pb.add_mesh(cone_frustum(0.32, 0.06, 1.15, 6, pos=(sx * 1.48, -0.08, -2.45), rot_xyz=(0, 180, 0)), Q_DARK)
        pb.add_mesh(chamfer_box((0.92, 0.18, 1.25), 0.04, pos=(sx * 0.96, 0, 0.35), rot_xyz=(0, 0, sx * -12)), Q_PRIMARY)
        pb.add_mesh(cone_frustum(0.28, 0.44, 0.62, 12, pos=(sx * 1.48, -0.08, 1.75)), Q_EMISS)
    export_glb(MODELS_DIR / "enemies" / "enemy_raider_ship.glb", pb, pbr_raider)
    preview_items.append(("Enemy: Raider Ship", pb, pbr_raider))

    # 3. Heavy Drone (armored hexagonal gunship platform)
    pbr_heavy = make_scifi_trim_pbr((74, 88, 106), (195, 78, 42), (255, 85, 45), seed=403)
    pb = PartBuilder()
    pb.add_mesh(cyl(2.15, 1.05, 6, pos=(0, 0, 0), rot_xyz=(90, 0, 0)), Q_PRIMARY)
    pb.add_mesh(cyl(1.15, 0.52, 8, pos=(0, 0.65, 0), rot_xyz=(90, 0, 0)), Q_TRIM)
    pb.add_mesh(chamfer_box((0.95, 0.38, 0.85), 0.06, pos=(0, 0.68, -0.65)), Q_EMISS)
    for sx in (-1.25, 1.25):
        pb.add_mesh(cyl(0.20, 1.95, 10, pos=(sx, -0.15, -1.55)), Q_DARK)
        pb.add_mesh(cyl(0.14, 0.18, 10, pos=(sx, -0.15, -2.52)), Q_EMISS)
        pb.add_mesh(cone_frustum(0.36, 0.52, 0.68, 12, pos=(sx * 0.75, 0, 2.05)), Q_EMISS)
    export_glb(MODELS_DIR / "enemies" / "enemy_heavy_drone.glb", pb, pbr_heavy)

    # 4. Plasma Hunter (sleek crescent stealth striker)
    pbr_hunter = make_scifi_trim_pbr((46, 42, 74), (138, 65, 225), (185, 95, 255), seed=404)
    pb = PartBuilder()
    pb.add_mesh(cone_frustum(0.85, 0.20, 3.6, 8, pos=(0, 0, -0.45), rot_xyz=(0, 180, 22.5)), Q_PRIMARY)
    pb.add_mesh(chamfer_box((0.62, 0.36, 1.35), 0.08, pos=(0, 0.28, -0.85)), Q_EMISS)
    for sx in (-1, 1):
        pb.add_mesh(chamfer_box((2.45, 0.18, 1.32), 0.05, pos=(sx * 1.55, 0, 0.25), rot_xyz=(0, sx * -28, sx * -8)), Q_TRIM)
        pb.add_mesh(chamfer_box((1.95, 0.08, 0.28), 0.02, pos=(sx * 1.65, 0.02, -0.25), rot_xyz=(0, sx * -28, sx * -8)), Q_EMISS)
        pb.add_mesh(cyl(0.16, 1.45, 10, pos=(sx * 0.92, -0.15, -1.35)), Q_EMISS)
    pb.add_mesh(cone_frustum(0.42, 0.65, 0.75, 12, pos=(0, 0, 1.62)), Q_EMISS)
    export_glb(MODELS_DIR / "enemies" / "enemy_plasma_hunter.glb", pb, pbr_hunter)
    preview_items.append(("Enemy: Plasma Hunter", pb, pbr_hunter))

    # 5. Void Sentinel (capital-class ring dreadnought boss/mini-boss)
    pbr_void = make_scifi_trim_pbr((32, 28, 48), (195, 38, 112), (255, 55, 155), seed=405)
    pb = PartBuilder()
    pb.add_mesh(chamfer_box((2.35, 1.68, 6.4), 0.28, pos=(0, 0, 0.2)), Q_PRIMARY)
    pb.add_mesh(torus_ring(2.95, 0.34, 20, 10, pos=(0, 0, 0.35)), Q_TRIM)
    pb.add_mesh(torus_ring(2.35, 0.16, 20, 8, pos=(0, 0, -0.45)), Q_EMISS)
    pb.add_mesh(trimesh.creation.icosphere(subdivisions=2, radius=0.95).apply_transform(xform(pos=(0, 0, -1.65))), Q_EMISS, smooth=True)
    for sx in (-0.75, 0.75):
        pb.add_mesh(chamfer_box((0.36, 0.48, 5.2), 0.06, pos=(sx, 0.15, -2.15)), Q_DARK)
    for ang in (45, 135, 225, 315):
        rad = math.radians(ang)
        pb.add_mesh(chamfer_box((0.42, 2.8, 0.55), 0.06, pos=(1.65 * math.cos(rad), 1.65 * math.sin(rad), 0.35), rot_xyz=(0, 0, ang - 90)), Q_DARK)
    pb.add_mesh(cone_frustum(0.78, 1.18, 1.15, 14, pos=(0, 0, 3.65)), Q_EMISS)
    export_glb(MODELS_DIR / "enemies" / "enemy_void_sentinel.glb", pb, pbr_void)
    preview_items.append(("Enemy: Void Sentinel", pb, pbr_void))

    return preview_items


# ==============================================================================
# 7. DETAILED 3D SCI-FI HANGAR & SPACE ENVIRONMENT PROPS
# ==============================================================================

def build_hangar_and_env_props() -> None:
    pbr_ind = make_scifi_trim_pbr((72, 84, 102), (228, 162, 36), (48, 220, 255), seed=501)
    pbr_term = make_scifi_trim_pbr((54, 68, 92), (42, 165, 215), (65, 238, 255), seed=502)
    pbr_cargo = make_scifi_trim_pbr((88, 108, 96), (218, 142, 42), (255, 190, 55), seed=503)

    # 1. Hydraulic Ship Construction Platform (radius ~14m, top surface at y=0)
    pb = PartBuilder()
    pb.add_mesh(cyl(13.8, 0.85, 8, pos=(0, -0.45, 0), rot_xyz=(90, 22.5, 0)), Q_DARK)
    pb.add_mesh(cyl(12.2, 0.25, 8, pos=(0, -0.08, 0), rot_xyz=(90, 22.5, 0)), Q_PRIMARY)
    pb.add_mesh(torus_ring(12.4, 0.22, 24, 8, pos=(0, 0.02, 0), rot_xyz=(90, 0, 0)), Q_TRIM)
    pb.add_mesh(torus_ring(9.2, 0.10, 24, 6, pos=(0, 0.04, 0), rot_xyz=(90, 0, 0)), Q_EMISS)
    for ang in range(0, 360, 45):
        rad = math.radians(ang)
        pb.add_mesh(
            chamfer_box((1.2, 0.85, 2.4), 0.10, pos=(13.2 * math.cos(rad), -0.15, 13.2 * math.sin(rad)), rot_xyz=(0, -ang, 0)),
            Q_TRIM,
        )
    export_glb(MODELS_DIR / "hangar" / "hangar_platform.glb", pb, pbr_ind)

    # 2. Overhead Industrial Gantry Crane + Support Pillars
    pb = PartBuilder()
    pb.add_mesh(chamfer_box((34.0, 1.35, 2.2), 0.16, pos=(0, 13.5, 0)), Q_TRIM)
    pb.add_mesh(chamfer_box((5.2, 1.65, 3.0), 0.18, pos=(0, 12.8, 0)), Q_DARK)
    pb.add_mesh(cyl(0.45, 2.4, 12, pos=(0, 11.2, 0), rot_xyz=(90, 0, 0)), Q_EMISS)
    for sx in (-16.5, 16.5):
        pb.add_mesh(chamfer_box((1.8, 15.0, 2.2), 0.16, pos=(sx, 7.0, 0)), Q_PRIMARY)
        pb.add_mesh(chamfer_box((2.6, 1.2, 3.0), 0.14, pos=(sx, 0.2, 0)), Q_DARK)
    export_glb(MODELS_DIR / "hangar" / "hangar_gantry_crane.glb", pb, pbr_ind)

    # 3. Articulated Industrial Robotic Arm
    pb = PartBuilder()
    pb.add_mesh(cyl(1.35, 0.75, 12, pos=(0, 0.38, 0), rot_xyz=(90, 0, 0)), Q_DARK)
    pb.add_mesh(cyl(0.95, 1.10, 12, pos=(0, 1.15, 0), rot_xyz=(90, 0, 0)), Q_TRIM)
    pb.add_mesh(chamfer_box((0.72, 4.2, 0.86), 0.10, pos=(0, 3.1, -0.45), rot_xyz=(-18, 0, 0)), Q_TRIM)
    pb.add_mesh(cyl(0.58, 1.15, 12, pos=(0, 5.0, -1.10), rot_xyz=(0, 90, 0)), Q_DARK)
    pb.add_mesh(chamfer_box((0.56, 3.6, 0.68), 0.08, pos=(0, 5.9, -2.55), rot_xyz=(-62, 0, 0)), Q_PRIMARY)
    pb.add_mesh(cyl(0.24, 0.85, 10, pos=(0, 6.5, -4.25), rot_xyz=(-62, 0, 0)), Q_EMISS)
    export_glb(MODELS_DIR / "hangar" / "hangar_robotic_arm.glb", pb, pbr_ind)

    # 4. Interactive Sci-Fi Terminal Station Kiosk (facing +Z toward center)
    pb = PartBuilder()
    pb.add_mesh(chamfer_box((2.4, 0.30, 1.8), 0.08, pos=(0, 0.15, 0)), Q_DARK)
    pb.add_mesh(chamfer_box((1.65, 1.35, 1.05), 0.12, pos=(0, 0.92, -0.15)), Q_PRIMARY)
    pb.add_mesh(chamfer_box((1.95, 1.25, 0.18), 0.04, pos=(0, 2.05, -0.25), rot_xyz=(18, 0, 0)), Q_DARK)
    pb.add_mesh(chamfer_box((1.72, 1.02, 0.08), 0.02, pos=(0, 2.07, -0.16), rot_xyz=(18, 0, 0)), Q_EMISS)
    for sx in (-0.98, 0.98):
        pb.add_mesh(cyl(0.10, 2.6, 8, pos=(sx, 1.45, -0.25), rot_xyz=(90, 0, 0)), Q_TRIM)
    export_glb(MODELS_DIR / "hangar" / "hangar_terminal_station.glb", pb, pbr_term)

    # 5. Industrial Cargo Container Stack
    pb = PartBuilder()
    pb.add_mesh(chamfer_box((3.6, 2.1, 2.2), 0.16, pos=(-1.2, 1.05, 0)), Q_PRIMARY)
    pb.add_mesh(chamfer_box((3.6, 2.1, 2.2), 0.16, pos=(2.6, 1.05, 0.25), rot_xyz=(0, -12, 0)), Q_TRIM)
    pb.add_mesh(chamfer_box((3.2, 1.9, 2.0), 0.16, pos=(0.4, 3.05, 0.05), rot_xyz=(0, 6, 0)), Q_DARK)
    pb.add_mesh(cyl(0.55, 2.0, 12, pos=(-3.6, 1.0, 0.4), rot_xyz=(90, 0, 0)), Q_EMISS)
    export_glb(MODELS_DIR / "hangar" / "hangar_cargo_containers.glb", pb, pbr_cargo)

    # 6. Orbital Hangar Launch Bay Arch & Forcefield Frame
    pb = PartBuilder()
    pb.add_mesh(chamfer_box((32.0, 2.4, 3.2), 0.24, pos=(0, 15.2, 0)), Q_PRIMARY)
    pb.add_mesh(chamfer_box((32.0, 1.2, 3.4), 0.16, pos=(0, 0.6, 0)), Q_TRIM)
    for sx in (-15.2, 15.2):
        pb.add_mesh(chamfer_box((2.8, 16.0, 3.2), 0.24, pos=(sx, 8.0, 0)), Q_PRIMARY)
        pb.add_mesh(chamfer_box((0.45, 13.4, 0.65), 0.05, pos=(sx * 0.89, 8.0, 0)), Q_EMISS)
    export_glb(MODELS_DIR / "hangar" / "hangar_launch_gate.glb", pb, pbr_ind)

    # 7. Derelict Shipwreck Ribcage (for Iron Graveyard space sector)
    pb = PartBuilder()
    pb.add_mesh(chamfer_box((3.2, 1.4, 18.0), 0.22, pos=(0, -3.2, 0)), Q_DARK)
    for zc in (-7.0, -3.5, 0.0, 3.5, 7.0):
        pb.add_mesh(torus_ring(5.2, 0.42, 12, 6, pos=(0, 0, zc)), Q_PRIMARY)
    pb.add_mesh(chamfer_box((1.2, 1.2, 14.0), 0.12, pos=(3.6, 2.2, -1.0), rot_xyz=(6, 4, 15)), Q_TRIM)
    export_glb(MODELS_DIR / "hangar" / "env_derelict_hull.glb", pb, pbr_cargo)

    # 8. Space Extraction Warp Buoy / Return Gate
    pb = PartBuilder()
    pb.add_mesh(torus_ring(7.5, 0.58, 24, 10, pos=(0, 0, 0)), Q_PRIMARY)
    pb.add_mesh(torus_ring(6.6, 0.18, 24, 8, pos=(0, 0, 0)), Q_EMISS)
    for ang in (0, 90, 180, 270):
        rad = math.radians(ang)
        pb.add_mesh(chamfer_box((1.2, 2.2, 1.6), 0.12, pos=(7.8 * math.cos(rad), 7.8 * math.sin(rad), 0), rot_xyz=(0, 0, ang - 90)), Q_TRIM)
    export_glb(MODELS_DIR / "hangar" / "env_space_buoy.glb", pb, pbr_term)

    # Also save 512x512 shared Hangar floor/wall & Space detail textures in assets/textures/
    TEX_DIR.mkdir(parents=True, exist_ok=True)
    floor_pbr = make_scifi_trim_pbr((42, 52, 68), (64, 80, 104), (40, 205, 255), size=512, seed=909)
    (TEX_DIR / "hangar_floor_albedo.png").write_bytes(floor_pbr["albedo"])
    (TEX_DIR / "hangar_floor_normal.png").write_bytes(floor_pbr["normal"])
    (TEX_DIR / "hangar_floor_orm.png").write_bytes(floor_pbr["orm"])


# ==============================================================================
# 8. SOFTWARE PBR 3D RENDERER FOR VISUAL VALIDATION TURNAROUND SHEETS
# ==============================================================================

def render_builder_thumbnail(
    label: str,
    pb: PartBuilder,
    pbr: Dict[str, bytes],
    img_size: int = 300,
) -> Image.Image:
    """Painter's-algorithm Z-sorted PBR-lit triangle renderer for visual QC of .glb meshes."""
    verts, _, uvs, faces = pb.build_arrays()
    alb_img = np.asarray(Image.open(io.BytesIO(pbr["albedo"])).convert("RGB"), dtype=np.float32)
    emi_img = np.asarray(Image.open(io.BytesIO(pbr["emissive"])).convert("RGB"), dtype=np.float32)
    th, tw = alb_img.shape[:2]

    # Center and normalize model scale
    center = 0.5 * (verts.min(axis=0) + verts.max(axis=0))
    v = verts - center
    span = max(1e-4, np.linalg.norm(verts.max(axis=0) - verts.min(axis=0)))
    v = v / span * 1.95

    # Isometric 3/4 camera rotation (yaw=-142 deg so -Z front faces lower-left/front-right nicely, pitch=26 deg)
    ry = math.radians(145.0)
    rx = math.radians(26.0)
    my = np.array([[math.cos(ry), 0, math.sin(ry)], [0, 1, 0], [-math.sin(ry), 0, math.cos(ry)]])
    mx = np.array([[1, 0, 0], [0, math.cos(rx), -math.sin(rx)], [0, math.sin(rx), math.cos(rx)]])
    rot = mx @ my
    vr = v @ rot.T

    tri_v = vr[faces]
    v0, v1, v2 = tri_v[:, 0], tri_v[:, 1], tri_v[:, 2]
    fn = np.cross(v1 - v0, v2 - v0)
    fn_len = np.linalg.norm(fn, axis=1, keepdims=True)
    valid = (fn_len[:, 0] > 1e-8) & (fn[:, 2] > -0.05)
    fn = fn / (fn_len + 1e-9)

    tri_uv = uvs[faces].mean(axis=1)
    tx = np.clip((tri_uv[:, 0] * (tw - 1)).astype(int), 0, tw - 1)
    ty = np.clip((tri_uv[:, 1] * (th - 1)).astype(int), 0, th - 1)
    base_col = alb_img[ty, tx]
    emi_col = emi_img[ty, tx]

    key_dir = np.array([0.52, 0.68, 0.52])
    key_dir /= np.linalg.norm(key_dir)
    rim_dir = np.array([-0.65, 0.35, -0.45])
    rim_dir /= np.linalg.norm(rim_dir)
    view_dir = np.array([0.0, 0.0, 1.0])
    half_vec = (key_dir + view_dir) / np.linalg.norm(key_dir + view_dir)

    ndotl = np.clip(fn @ key_dir, 0.0, 1.0)[:, None]
    rim = np.clip(fn @ rim_dir, 0.0, 1.0)[:, None] * 0.35
    spec = (np.clip(fn @ half_vec, 0.0, 1.0) ** 22)[:, None] * 75.0

    lit = base_col * (0.28 + 0.85 * ndotl + rim) + spec + emi_col * 0.95
    lit = np.clip(lit, 0, 255).astype(np.uint8)

    # Perspective projection
    cam_dist = 3.4
    z_depth = tri_v.mean(axis=1)[:, 2]
    order = np.argsort(z_depth)

    canvas = Image.new("RGB", (img_size, img_size), (12, 18, 32))
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((2, 2, img_size - 3, img_size - 3), outline=(38, 76, 112), width=2)

    cx = img_size * 0.5
    cy = img_size * 0.48
    scale = img_size * 0.78

    for idx in order:
        if not valid[idx]:
            continue
        pts = []
        for k in range(3):
            px, py, pz = tri_v[idx, k]
            persp = 1.0 / max(0.6, cam_dist - pz)
            pts.append((cx + px * scale * persp, cy - py * scale * persp))
        c = tuple(int(x) for x in lit[idx])
        draw.polygon(pts, fill=c)

    fnt = ImageFont.truetype(str(ROOT / "assets" / "fonts" / "Rajdhani-Bold.ttf"), 20)
    draw.rectangle((4, img_size - 32, img_size - 5, img_size - 5), fill=(8, 13, 24))
    draw.text((12, img_size - 30), label, font=fnt, fill=(185, 232, 255))
    return canvas


def save_contact_sheet(items: List[Tuple[str, PartBuilder, Dict[str, bytes]]], out_path: Path, cols: int = 4) -> None:
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    cell = 300
    rows = math.ceil(len(items) / cols)
    sheet = Image.new("RGB", (cols * cell, rows * cell), (8, 12, 22))
    for i, (label, pb, pbr) in enumerate(items):
        thumb = render_builder_thumbnail(label, pb, pbr, cell)
        sheet.paste(thumb, ((i % cols) * cell, (i // cols) * cell))
    sheet.save(out_path)


if __name__ == "__main__":
    p1 = build_ship_and_equipment_models()
    p2 = build_asteroids_and_chunks()
    p3 = build_enemy_spacecraft()
    build_hangar_and_env_props()

    all_previews = p1 + p2 + p3
    save_contact_sheet(all_previews[:12], PREVIEW_DIR / "models_sheet_1.png", cols=4)
    save_contact_sheet(all_previews[12:], PREVIEW_DIR / "models_sheet_2.png", cols=4)

    glb_files = sorted(MODELS_DIR.rglob("*.glb"))
    total_kb = sum(f.stat().st_size for f in glb_files) / 1024.0
    print(f"Generated {len(glb_files)} game-ready PBR .glb 3D models ({total_kb:.1f} KB total).")
