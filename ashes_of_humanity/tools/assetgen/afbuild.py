#!/usr/bin/env python3
# ============================================================================
#  ASHES OF HUMANITY: LAST SIGNAL
#  Blender geometry / rigging / animation toolkit.
#
#  Runs inside Blender (bpy).  Provides:
#    * deterministic procedural mesh construction with box-projected UVs
#    * an armature + automatic skin weighting
#    * a small forward-kinematics solver used to author original animation clips
#    * exporters for the engine's .afm / .afa binary formats
# ============================================================================
import math
import os
import struct

import bmesh
import bpy
import numpy as np
from mathutils import Euler, Matrix, Quaternion, Vector

# ---------------------------------------------------------------------------
# Binary export helpers (must match engine/src/assets/assets.cpp)
# ---------------------------------------------------------------------------
SEC_VERTICES = 0x56525458
SEC_INDICES = 0x494E4458
SEC_SUBMESH = 0x534D4553
SEC_MATERIAL = 0x4D41544C
SEC_BONES = 0x424F4E45
SEC_MESHINFO = 0x4D534846
SEC_ANIMCLIP = 0x41434C50

MAT_DOUBLE_SIDED = 1 << 0
MAT_ALPHA_TEST = 1 << 1
MAT_UNLIT = 1 << 2
MAT_FOLIAGE = 1 << 3


class BinWriter:
    def __init__(self):
        self.buf = bytearray()

    def u8(self, v):
        self.buf += struct.pack("<B", v & 0xFF)

    def u16(self, v):
        self.buf += struct.pack("<H", v & 0xFFFF)

    def u32(self, v):
        self.buf += struct.pack("<I", v & 0xFFFFFFFF)

    def i32v(self, v):
        self.buf += struct.pack("<i", int(v))

    def u64(self, v):
        self.buf += struct.pack("<Q", v & 0xFFFFFFFFFFFFFFFF)

    def f32(self, v):
        self.buf += struct.pack("<f", float(v))

    def vec3(self, v):
        for c in range(3):
            self.f32(v[c])

    def vec4(self, v):
        for c in range(4):
            self.f32(v[c])

    def str(self, s):
        b = s.encode("utf-8")
        self.u32(len(b))
        self.buf += b

    def raw(self, b):
        self.buf += bytes(b)


def write_container(path, magic, version, sections):
    """sections: list of (tag, bytes)"""
    out = bytearray()
    out += struct.pack("<IHHI", magic, version, 0, len(sections))
    for tag, payload in sections:
        out += struct.pack("<IQ", tag, len(payload))
        out += bytes(payload)
    with open(path, "wb") as f:
        f.write(bytes(out))


# ---------------------------------------------------------------------------
# Mesh construction
# ---------------------------------------------------------------------------
class MeshBuilder:
    """Accumulates vertices / normals / uvs / triangles with material slots."""

    def __init__(self):
        self.pos = []
        self.nrm = []
        self.uv = []
        self.col = []
        self.idx = []
        self.mat = []
        self.groups = {}          # material name -> list of (indices, color)

    def add_quad(self, p0, p1, p2, p3, mat, uv_scale=1.0, color=(1, 1, 1, 1), flip=False):
        base = len(self.pos)
        pts = [p0, p1, p2, p3]
        if flip:
            pts = [p3, p2, p1, p0]
        n = _face_normal(pts[0], pts[1], pts[2])
        # box projection UVs based on the dominant normal axis
        ax = max(range(3), key=lambda i: abs(n[i]))
        uvs = []
        for p in pts:
            if ax == 0:
                uvs.append((p[2] * uv_scale, p[1] * uv_scale))
            elif ax == 1:
                uvs.append((p[0] * uv_scale, p[2] * uv_scale))
            else:
                uvs.append((p[0] * uv_scale, p[1] * uv_scale))
        for i in range(4):
            self.pos.append(tuple(float(c) for c in pts[i]))
            self.nrm.append(tuple(float(c) for c in n))
            self.uv.append(uvs[i])
            self.col.append(tuple(float(c) for c in color))
        self.idx += [base, base + 1, base + 2, base, base + 2, base + 3]
        self.mat += [mat, mat]

    def add_tri(self, p0, p1, p2, mat, uv_scale=1.0, color=(1, 1, 1, 1)):
        base = len(self.pos)
        pts = [p0, p1, p2]
        n = _face_normal(p0, p1, p2)
        ax = max(range(3), key=lambda i: abs(n[i]))
        uvs = []
        for p in pts:
            if ax == 0:
                uvs.append((p[2] * uv_scale, p[1] * uv_scale))
            elif ax == 1:
                uvs.append((p[0] * uv_scale, p[2] * uv_scale))
            else:
                uvs.append((p[0] * uv_scale, p[1] * uv_scale))
        for i in range(3):
            self.pos.append(tuple(float(c) for c in pts[i]))
            self.nrm.append(tuple(float(c) for c in n))
            self.uv.append(uvs[i])
            self.col.append(tuple(float(c) for c in color))
        self.idx += [base, base + 1, base + 2]
        self.mat += [mat]

    def add_box(self, center, size, mat, uv_scale=1.0, color=(1, 1, 1, 1),
                skip_bottom=False, skip_top=False, skip_faces=()):
        """Axis aligned box.  The world is Y-up: size[1] is the vertical size."""
        cx, cy, cz = center
        hx, hy, hz = size[0] * 0.5, size[1] * 0.5, size[2] * 0.5
        x0, x1 = cx - hx, cx + hx
        y0, y1 = cy - hy, cy + hy
        z0, z1 = cz - hz, cz + hz
        if "top" not in skip_faces and not skip_top:
            self.add_quad((x0, y1, z1), (x1, y1, z1), (x1, y1, z0), (x0, y1, z0), mat, uv_scale, color)
        if "bottom" not in skip_faces and not skip_bottom:
            self.add_quad((x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1), mat, uv_scale, color)
        if "south" not in skip_faces:
            self.add_quad((x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1), mat, uv_scale, color)
        if "north" not in skip_faces:
            self.add_quad((x1, y0, z0), (x0, y0, z0), (x0, y1, z0), (x1, y1, z0), mat, uv_scale, color)
        if "west" not in skip_faces:
            self.add_quad((x0, y0, z0), (x0, y0, z1), (x0, y1, z1), (x0, y1, z0), mat, uv_scale, color)
        if "east" not in skip_faces:
            self.add_quad((x1, y0, z1), (x1, y0, z0), (x1, y1, z0), (x1, y1, z1), mat, uv_scale, color)

    def add_cylinder(self, center, radius, height, mat, segments=12, uv_scale=1.0,
                     color=(1, 1, 1, 1), axis="Y", radius_top=None, caps=True):
        """Cylinder / truncated cone.  axis: 'Y' (default, vertical), 'X' or 'Z'.

        The ring is wound right-handed about the axis so that the generated
        side faces point outwards and the caps point along the axis.
        """
        cx, cy, cz = center
        rt = radius if radius_top is None else radius_top
        hh = height * 0.5
        ring0, ring1 = [], []
        for i in range(segments):
            a = 2.0 * math.pi * i / segments
            ca, sa = math.cos(a), math.sin(a)
            if axis == "Y":
                ring0.append((cx + radius * ca, cy - hh, cz - radius * sa))
                ring1.append((cx + rt * ca, cy + hh, cz - rt * sa))
            elif axis == "X":
                ring0.append((cx - hh, cy + radius * ca, cz + radius * sa))
                ring1.append((cx + hh, cy + rt * ca, cz + rt * sa))
            else:
                ring0.append((cx + radius * ca, cy + radius * sa, cz - hh))
                ring1.append((cx + rt * ca, cy + rt * sa, cz + hh))
        for i in range(segments):
            j = (i + 1) % segments
            self.add_quad(ring0[i], ring0[j], ring1[j], ring1[i], mat, uv_scale, color)
        if caps:
            c0 = (cx, cy - hh, cz) if axis == "Y" else (
                (cx - hh, cy, cz) if axis == "X" else (cx, cy, cz - hh))
            c1 = (cx, cy + hh, cz) if axis == "Y" else (
                (cx + hh, cy, cz) if axis == "X" else (cx, cy, cz + hh))
            for i in range(1, segments - 1):
                self.add_tri(c0, ring0[i + 1], ring0[i], mat, uv_scale, color)
                self.add_tri(c1, ring1[i], ring1[i + 1], mat, uv_scale, color)

    def add_sphere(self, center, radius, mat, rings=8, segments=12, uv_scale=1.0,
                   color=(1, 1, 1, 1), squash=(1.0, 1.0, 1.0)):
        cx, cy, cz = center
        grid = []
        for r in range(rings + 1):
            phi = math.pi * r / rings
            row = []
            for s in range(segments + 1):
                a = 2.0 * math.pi * s / segments
                x = math.sin(phi) * math.cos(a)
                y = math.cos(phi)
                z = math.sin(phi) * math.sin(a)
                row.append((cx + radius * x * squash[0], cy + radius * y * squash[1],
                            cz + radius * z * squash[2]))
            grid.append(row)
        for r in range(rings):
            for s in range(segments):
                p00, p10 = grid[r][s], grid[r][s + 1]
                p01, p11 = grid[r + 1][s], grid[r + 1][s + 1]
                self.add_quad(p00, p10, p11, p01, mat, uv_scale, color)

    def add_capsule_limb(self, p0, p1, r0, r1, mat, segments=8, uv_scale=1.0,
                         color=(1, 1, 1, 1)):
        """Tapered capsule between two points (used for limbs)."""
        p0v, p1v = Vector(p0), Vector(p1)
        axis = (p1v - p0v)
        length = axis.length
        if length < 1e-6:
            return
        zdir = axis.normalized()
        up = Vector((0, 0, 1))
        if abs(zdir.dot(up)) > 0.98:
            up = Vector((1, 0, 0))
        xdir = zdir.cross(up).normalized()
        ydir = xdir.cross(zdir).normalized()
        ring0, ring1 = [], []
        for i in range(segments):
            a = 2.0 * math.pi * i / segments
            off = xdir * (math.cos(a) * r0) + ydir * (math.sin(a) * r0)
            ring0.append(tuple(p0v + off))
        for i in range(segments):
            a = 2.0 * math.pi * i / segments
            off = xdir * (math.cos(a) * r1) + ydir * (math.sin(a) * r1)
            ring1.append(tuple(p1v + off))
        for i in range(segments):
            j = (i + 1) % segments
            self.add_quad(ring0[i], ring0[j], ring1[j], ring1[i], mat, uv_scale, color)
        # rounded caps
        self.add_sphere(p0, r0, mat, rings=4, segments=segments, uv_scale=uv_scale,
                        color=color, squash=(1, 1, 1))
        self.add_sphere(p1, r1, mat, rings=4, segments=segments, uv_scale=uv_scale,
                        color=color, squash=(1, 1, 1))

    def add_wedge(self, p0, p1, p2, p3, mat, uv_scale=1.0, color=(1, 1, 1, 1)):
        self.add_quad(p0, p1, p2, p3, mat, uv_scale, color)


def _face_normal(p0, p1, p2):
    a = Vector(p0)
    b = Vector(p1)
    c = Vector(p2)
    n = (b - a).cross(c - a)
    if n.length < 1e-9:
        return (0.0, 1.0, 0.0)
    n.normalize()
    return (n.x, n.y, n.z)


# ---------------------------------------------------------------------------
# Skinning
# ---------------------------------------------------------------------------
class Bone:
    def __init__(self, name, head, tail, parent=None):
        self.name = name
        self.head = Vector(head)
        self.tail = Vector(tail)
        self.parent = parent
        self.children = []

    def length(self):
        return max((self.tail - self.head).length, 1e-4)


class Rig:
    """A lightweight bone hierarchy with FK evaluation."""

    def __init__(self):
        self.bones = []
        self.by_name = {}

    def add(self, name, head, tail, parent=None):
        b = Bone(name, head, tail, parent)
        self.bones.append(b)
        self.by_name[name] = b
        if parent is not None:
            self.by_name[parent].children.append(name)
        return b

    def index(self, name):
        for i, b in enumerate(self.bones):
            if b.name == name:
                return i
        return -1

    def _frame(self, b):
        """Rest frame of a bone: origin at the head, +Y along head->tail."""
        h = Vector(b.head)
        t = Vector(b.tail)
        y = t - h
        if y.length < 1e-6:
            y = Vector((0.0, 1.0, 0.0))
        y.normalize()
        up = Vector((0.0, 0.0, 1.0))
        if abs(y.dot(up)) > 0.995:
            up = Vector((1.0, 0.0, 0.0))
        x = y.cross(up).normalized()
        z = x.cross(y).normalized()
        m = Matrix.Identity(4)
        for r in range(3):
            m[r][0] = x[r]
            m[r][1] = y[r]
            m[r][2] = z[r]
            m[r][3] = h[r]
        return m

    def rest_world(self):
        """World rest frame per bone."""
        return [self._frame(b) for b in self.bones]

    def rest_local(self):
        """Rest frame of each bone relative to its parent."""
        w = self.rest_world()
        out = []
        for i, b in enumerate(self.bones):
            if b.parent is None:
                out.append(w[i])
            else:
                out.append(w[self.index(b.parent)].inverted() @ w[i])
        return out

    def inverse_bind(self):
        """Matrix mapping model space into each bone's rest space."""
        return [m.inverted() for m in self.rest_world()]


def _bone_local(head, tail, parent_name):
    """Local rest matrix of a bone relative to its parent bone."""
    h = Vector(head)
    t = Vector(tail)
    ydir = (t - h)
    if ydir.length < 1e-6:
        ydir = Vector((0, 1, 0))
    ydir.normalize()
    up = Vector((0, 0, 1))
    if abs(ydir.dot(up)) > 0.995:
        up = Vector((1, 0, 0))
    xdir = ydir.cross(up).normalized()
    zdir = xdir.cross(ydir).normalized()
    m = Matrix.Identity(4)
    for r in range(3):
        m[r][0] = xdir[r]
        m[r][1] = ydir[r]
        m[r][2] = zdir[r]
        m[r][3] = h[r]
    return m


def compute_skin_weights(positions, rig):
    """Weight every vertex to the two closest bone segments with smooth falloff."""
    n = len(positions)
    joints = np.zeros((n, 4), dtype=np.uint16)
    weights = np.zeros((n, 4), dtype=np.float32)
    segs = []
    for i, b in enumerate(rig.bones):
        p = rig.by_name.get(b.parent)
        if p is None:
            a = b.head
            d = b.tail - b.head
            if d.length < 1e-5:
                d = Vector((0, 1, 0))
            segs.append((i, a, d.normalized(), b.length()))
        else:
            a = b.head
            d = b.tail - b.head
            if d.length < 1e-5:
                d = Vector((0, 1, 0))
            segs.append((i, a, d.normalized(), b.length()))
    for vi in range(n):
        p = Vector(positions[vi])
        best = []
        for (bi, a, d, blen) in segs:
            rel = p - a
            t = max(0.0, min(blen, rel.dot(d)))
            closest = a + d * t
            dist = (p - closest).length
            best.append((dist, bi))
        best.sort(key=lambda x: x[0])
        d0, b0 = best[0]
        d1, b1 = best[1]
        w0 = 1.0 / max(d0, 1e-3) ** 2
        w1 = 1.0 / max(d1, 1e-3) ** 2
        if w0 + w1 < 1e-9:
            w0, w1 = 1.0, 0.0
        else:
            w0 /= (w0 + w1)
            w1 /= (w0 + w1)
        joints[vi] = (b0, b1, 0, 0)
        weights[vi] = (w0, w1, 0.0, 0.0)
    return joints, weights


# ---------------------------------------------------------------------------
# Animation authoring
# ---------------------------------------------------------------------------
class Clip:
    """A named animation with per-bone local TRS keyframes."""

    def __init__(self, name, duration, fps=30.0, loop=True):
        self.name = name
        self.duration = duration
        self.fps = fps
        self.loop = loop
        self.tracks = []          # (bone_index, channel, [(t, values...)])

    def add(self, bone_index, channel, keys, interp=1):
        self.tracks.append((bone_index, channel, keys, interp))


def bake_clip(rig, clip, world_frames):
    """world_frames: list of (time, {bone_name: world_matrix}) -> bone tracks.

    Each bone gets a world space position track (the animated head), a world
    space rotation quaternion and a scale track.  The engine composes them
    directly into skinning matrices, so no hierarchy is needed at runtime.
    """
    bones = rig.bones
    for bi, b in enumerate(bones):
        pos_keys = []
        rot_keys = []
        scale_keys = []
        for (t, wm) in world_frames:
            m = wm.get(b.name)
            if m is None:
                continue
            loc, quat, scl = m.decompose()
            pos_keys.append((t, (loc.x, loc.y, loc.z)))
            rot_keys.append((t, (quat.x, quat.y, quat.z, quat.w)))
            scale_keys.append((t, (scl.x, scl.y, scl.z)))
        if pos_keys:
            clip.add(bi, 0, pos_keys)
            clip.add(bi, 1, rot_keys)
            clip.add(bi, 2, scale_keys)


# ---------------------------------------------------------------------------
# Material table
# ---------------------------------------------------------------------------
class MaterialTable:
    """Maps Blender material names to engine material slots."""

    def __init__(self, texture_sets):
        self.texture_sets = sorted(texture_sets)
        self.texture_id = {name: i for i, name in enumerate(self.texture_sets)}
        self.slots = []          # list of dicts
        self.slot_index = {}

    def add(self, name, tex="concrete", metallic=0.0, roughness=0.8, tint=(1, 1, 1),
            alpha_test=False, double_sided=False, emissive=0.0, foliage=False):
        if name in self.slot_index:
            return self.slot_index[name]
        idx = len(self.slots)
        tid = self.texture_id.get(tex, -1)
        self.slots.append({
            "name": name,
            "tex": tex,
            "albedo": (tint[0], tint[1], tint[2], 1.0),
            "metallic": metallic,
            "roughness": roughness,
            "emissive": (emissive, emissive, emissive, 1.0 if emissive > 0 else 0.0),
            "albedoTex": tid,
            "normalTex": tid,
            "ormTex": tid,
            "emissiveTex": -1,
            "normalStrength": 1.0,
            "flags": (MAT_ALPHA_TEST if alpha_test else 0) | (MAT_DOUBLE_SIDED if double_sided else 0)
                     | (MAT_FOLIAGE if foliage else 0),
        })
        self.slot_index[name] = idx
        return idx

    def index_of(self, name):
        return self.slot_index.get(name, 0)


# ---------------------------------------------------------------------------
# Mesh export
# ---------------------------------------------------------------------------
def _compute_tangents(mb):
    """Per-vertex tangents from the accumulated geometry."""
    n = len(mb.pos)
    tan = np.zeros((n, 3), np.float32)
    bit = np.zeros((n, 3), np.float32)
    P = np.array(mb.pos, np.float32)
    UV = np.array(mb.uv, np.float32)
    for i in range(0, len(mb.idx), 3):
        i0, i1, i2 = mb.idx[i], mb.idx[i + 1], mb.idx[i + 2]
        e1 = P[i1] - P[i0]
        e2 = P[i2] - P[i0]
        d1 = UV[i1] - UV[i0]
        d2 = UV[i2] - UV[i0]
        det = d1[0] * d2[1] - d2[0] * d1[1]
        if abs(det) < 1e-9:
            continue
        r = 1.0 / det
        t = (e1 * d2[1] - e2 * d1[1]) * r
        b = (e2 * d1[0] - e1 * d2[0]) * r
        for k in (i0, i1, i2):
            tan[k] += t
            bit[k] += b
    N = np.array(mb.nrm, np.float32)
    out = np.zeros((n, 4), np.float32)
    for i in range(n):
        t = tan[i]
        nn = N[i]
        if np.dot(t, t) < 1e-12:
            t = np.cross([0, 0, 1] if abs(nn[1]) < 0.99 else [1, 0, 0], nn)
        t = t - nn * np.dot(nn, t)
        ln = np.linalg.norm(t)
        if ln < 1e-8:
            t = np.array([1, 0, 0], np.float32)
            ln = 1.0
        t = t / ln
        w = -1.0 if np.dot(np.cross(nn, t), bit[i]) < 0 else 1.0
        out[i] = (t[0], t[1], t[2], w)
    return out


def export_mesh(path, name, mb, mats, rig=None):
    """Write a .afm file."""
    n = len(mb.pos)
    tangents = _compute_tangents(mb)
    if rig is not None:
        joints, weights = compute_skin_weights(mb.pos, rig)
    else:
        joints = np.zeros((n, 4), np.uint16)
        weights = np.zeros((n, 4), np.float32)
        weights[:, 0] = 1.0

    w = BinWriter()
    w.u32(n)
    for i in range(n):
        w.vec3(mb.pos[i])
        w.vec3(mb.nrm[i])
        w.vec4(tangents[i])
        w.f32(mb.uv[i][0])
        w.f32(mb.uv[i][1])
        for c in range(4):
            w.u8(int(max(0, min(255, mb.col[i][c] * 255))))
        for j in range(4):
            w.u16(int(joints[i][j]))
        for j in range(4):
            w.f32(float(weights[i][j]))
    sec_vert = w.buf

    w = BinWriter()
    w.u32(len(mb.idx))
    for i in mb.idx:
        w.u32(i)
    sec_idx = w.buf

    # submeshes grouped by material
    sub = []
    cur = -1
    for i, mi in enumerate(mb.mat):
        if mi != cur:
            sub.append((i, mi))
            cur = mi
    w = BinWriter()
    w.u32(len(sub))
    for (start, mi) in sub:
        count = 0
        for j in range(start, len(mb.mat)):
            if mb.mat[j] != mi:
                break
            count += 1
        w.u32(start)
        w.u32(count)
        w.i32v(mi)
    sec_sub = w.buf

    # materials actually used
    used = sorted(set(mb.mat))
    remap = {old: i for i, old in enumerate(used)}
    w = BinWriter()
    w.u32(len(used))
    for old in used:
        m = mats.slots[old]
        w.str(m["name"])
        w.vec4(m["albedo"])
        w.f32(m["metallic"])
        w.f32(m["roughness"])
        w.vec4(m["emissive"])
        w.i32v(m["albedoTex"])
        w.i32v(m["normalTex"])
        w.i32v(m["ormTex"])
        w.i32v(m["emissiveTex"])
        w.f32(m["normalStrength"])
        w.u32(m["flags"])
    sec_mat = w.buf

    w = BinWriter()
    if rig is not None:
        inv = rig.inverse_bind()
        w.u32(len(rig.bones))
        for i, b in enumerate(rig.bones):
            w.str(b.name)
            w.i32v(rig.index(b.parent) if b.parent else -1)
            w.vec3(b.head)
            w.vec3(b.tail)
            mm = inv[i]
            # column-major to match the engine's Mat4 memory layout
            for c in range(4):
                for r in range(4):
                    w.f32(mm[r][c])
    else:
        w.u32(0)
    sec_bone = w.buf

    lo = np.min(np.array(mb.pos, np.float32), axis=0) if n else np.zeros(3, np.float32)
    hi = np.max(np.array(mb.pos, np.float32), axis=0) if n else np.zeros(3, np.float32)
    w = BinWriter()
    w.str(name)
    w.u8(1 if rig is not None else 0)
    w.vec3(lo)
    w.vec3(hi)
    sec_info = w.buf

    write_container(path, 0x314D4641, 1, [
        (SEC_VERTICES, sec_vert),
        (SEC_INDICES, sec_idx),
        (SEC_SUBMESH, sec_sub),
        (SEC_MATERIAL, sec_mat),
        (SEC_BONES, sec_bone),
        (SEC_MESHINFO, sec_info),
    ])


def export_clips(path, clips):
    w = BinWriter()
    w.u32(len(clips))
    for c in clips:
        w.str(c.name)
        w.f32(c.duration)
        w.f32(c.fps)
        w.u8(1 if c.loop else 0)
        w.u32(len(c.tracks))
        for (bi, channel, keys, interp) in c.tracks:
            w.i32v(bi)
            w.i32v(channel)
            w.i32v(interp)
            w.u32(len(keys))
            for k in keys:
                w.f32(k[0])
                for j in range(4):
                    w.f32(k[1][j] if j < len(k[1]) else (1.0 if channel == 1 else 0.0))
    write_container(path, 0x31464141, 1, [(SEC_ANIMCLIP, w.buf)])
