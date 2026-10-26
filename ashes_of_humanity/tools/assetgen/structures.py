#!/usr/bin/env python3
# ============================================================================
#  ASHES OF HUMANITY: LAST SIGNAL
#  Architecture kit - parametric building construction.
#
#  Buildings are assembled from real rooms: floors, ceilings, walls with
#  window and door openings, stairs, structural columns and roof forms.
# ============================================================================
import math
import random

from mathutils import Vector

from afbuild import MeshBuilder


class StructureBuilder:
    """Builds walls/floors/roofs with openings, plus helpers for detailing."""

    def __init__(self, mb, mats):
        self.mb = mb
        self.mats = mats

    # -- primitive surfaces -------------------------------------------------
    def floor(self, x0, z0, x1, z1, y, mat, uv=0.5, color=(1, 1, 1, 1)):
        self.mb.add_quad((x0, y, z1), (x1, y, z1), (x1, y, z0), (x0, y, z0), mat, uv, color)

    def ceiling(self, x0, z0, x1, z1, y, mat, uv=0.5, color=(1, 1, 1, 1)):
        self.mb.add_quad((x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1), mat, uv, color)

    def _box_uvw(self, u0, u1, v0, v1, w0, w1, p0, d, n, mat, uv, color):
        """Emits an oriented box.

        u runs along the wall direction d, v is vertical (up), w along n.
        Corner order: (u0,v0,w0) (u1,v0,w0) (u1,v1,w0) (u0,v1,w0)
                      (u0,v0,w1) (u1,v0,w1) (u1,v1,w1) (u0,v1,w1)
        """
        def P(u, v, w):
            return (p0.x + d.x * u + n.x * w, v, p0.z + d.z * u + n.z * w)
        c = [P(u0, v0, w0), P(u1, v0, w0), P(u1, v1, w0), P(u0, v1, w0),
             P(u0, v0, w1), P(u1, v0, w1), P(u1, v1, w1), P(u0, v1, w1)]
        q = self.mb.add_quad
        q(c[0], c[3], c[2], c[1], mat, uv, color)      # -n
        q(c[4], c[5], c[6], c[7], mat, uv, color)      # +n
        q(c[0], c[1], c[5], c[4], mat, uv, color)      # -up
        q(c[3], c[7], c[6], c[2], mat, uv, color)      # +up
        q(c[0], c[4], c[7], c[3], mat, uv, color)      # -d
        q(c[1], c[2], c[6], c[5], mat, uv, color)      # +d

    def wall(self, p0, p1, y0, y1, mat, openings=(), uv=0.5, color=(1, 1, 1, 1),
             thickness=0.22, solid=True):
        """Wall from p0->p1 (ground plane points), spanning y0..y1.

        openings: iterable of (u0, u1, oy0, oy1, kind)
          u is distance along the wall, kind: 'window' | 'door'
        """
        p0 = Vector((p0[0], 0, p0[1]))
        p1 = Vector((p1[0], 0, p1[1]))
        d = p1 - p0
        L = d.length
        if L < 1e-5:
            return
        d = d / L
        n = Vector((-d.z, 0, d.x))
        us = {0.0, L}
        ys = {y0, y1}
        for (u0, u1, oy0, oy1, _k) in openings:
            us.add(max(0.0, min(L, u0)))
            us.add(max(0.0, min(L, u1)))
            ys.add(max(y0, min(y1, oy0)))
            ys.add(max(y0, min(y1, oy1)))
        us = sorted(us)
        ys = sorted(ys)
        t = thickness * 0.5 if solid else 0.0
        for i in range(len(us) - 1):
            for j in range(len(ys) - 1):
                ua, ub = us[i], us[i + 1]
                ya, yb = ys[j], ys[j + 1]
                if ub - ua < 1e-4 or yb - ya < 1e-4:
                    continue
                um = (ua + ub) * 0.5
                ym = (ya + yb) * 0.5
                skip = False
                for (u0, u1, oy0, oy1, kind) in openings:
                    if u0 - 1e-3 <= um <= u1 + 1e-3 and oy0 - 1e-3 <= ym <= oy1 + 1e-3:
                        skip = True
                        break
                if skip:
                    continue
                if solid:
                    self._box_uvw(ua, ub, ya, yb, -t, t, p0, d, n, mat, uv, color)
                else:
                    a = p0 + d * ua
                    b = p0 + d * ub
                    q = [Vector((a.x, ya, a.z)), Vector((b.x, ya, b.z)),
                         Vector((b.x, yb, b.z)), Vector((a.x, yb, a.z))]
                    self.mb.add_quad(tuple(q[0]), tuple(q[1]), tuple(q[2]), tuple(q[3]),
                                     mat, uv, color)

    def wall_frame(self, p0, p1, y0, y1, mat, openings=(), uv=0.5, color=(1, 1, 1, 1), depth=0.12):
        """Adds a thin inner lining panel to a wall (used for two-sided rooms)."""
        self.wall(p1, p0, y0, y1, mat, openings, uv, color, thickness=0.0, solid=False)

    def column(self, x, z, y0, y1, size, mat, uv=0.5, color=(1, 1, 1, 1)):
        self.mb.add_box((x, (y0 + y1) * 0.5, z), (size, y1 - y0, size), mat, uv, color)

    def beam(self, x0, z0, x1, z1, y, size, mat, uv=0.5, color=(1, 1, 1, 1)):
        mx, mz = (x0 + x1) * 0.5, (z0 + z1) * 0.5
        dx, dz = abs(x1 - x0), abs(z1 - z0)
        sx = max(dx, size) if dx > dz else size
        sz = max(dz, size) if dz > dx else size
        self.mb.add_box((mx, y, mz), (sx, size, sz), mat, uv, color)

    def stairs(self, x, z, width, y0, y1, steps, mat, uv=0.5, color=(1, 1, 1, 1), direction=1):
        rise = (y1 - y0) / steps
        run = 0.28
        for i in range(steps):
            yy = y0 + rise * (i + 0.5)
            zz = z + direction * run * i
            self.mb.add_box((x, yy, zz + direction * run * 0.5), (width, rise * 0.98, run),
                            mat, uv, color)
        # side stringers
        for sx in (-1, 1):
            self.mb.add_box((x + sx * (width * 0.5 + 0.06), (y0 + y1) * 0.5,
                             z + direction * run * steps * 0.5),
                            (0.12, abs(y1 - y0) * 0.5, run * steps), mat, uv, color)

    def railing(self, p0, p1, y, mat, uv=0.5, height=1.05, color=(1, 1, 1, 1)):
        p0 = Vector((p0[0], 0, p0[1]))
        p1 = Vector((p1[0], 0, p1[1]))
        d = p1 - p0
        L = d.length
        if L < 1e-4:
            return
        d = d / L
        n = max(2, int(L / 1.6))
        for i in range(n + 1):
            p = p0 + d * (L * i / n)
            self.mb.add_box((p.x, y + height * 0.5, p.z), (0.06, height, 0.06), mat, uv, color)
        mx, mz = (p0.x + p1.x) * 0.5, (p0.z + p1.z) * 0.5
        sx = abs(d.x) * L + 0.08
        sz = abs(d.z) * L + 0.08
        self.mb.add_box((mx, y + height, mz), (sx, 0.07, sz), mat, uv, color)

    def window_glass(self, p0, p1, y0, y1, mat, uv=0.5, color=(0.75, 0.80, 0.82, 0.35)):
        self.wall(p0, p1, y0, y1, mat, (), uv, color, solid=False)

    def debris_pile(self, cx, cz, radius, count, mat, rng, uv=0.8, color=(1, 1, 1, 1)):
        for _ in range(count):
            a = rng.uniform(0, math.tau)
            r = radius * math.sqrt(rng.random())
            x = cx + math.cos(a) * r
            z = cz + math.sin(a) * r
            s = rng.uniform(0.12, 0.42)
            self.mb.add_box((x, s * 0.35, z), (s * rng.uniform(0.7, 1.6), s * 0.55,
                                               s * rng.uniform(0.7, 1.6)), mat, uv, color,
                            skip_bottom=True)

    def rubble_scatter(self, x0, z0, x1, z1, count, mat, rng, uv=0.8, color=(1, 1, 1, 1)):
        for _ in range(count):
            x = rng.uniform(x0, x1)
            z = rng.uniform(z0, z1)
            s = rng.uniform(0.08, 0.3)
            self.mb.add_box((x, s * 0.3, z), (s * 1.4, s * 0.5, s * 1.2), mat, uv, color,
                            skip_bottom=True)


# ---------------------------------------------------------------------------
# Opening helpers
# ---------------------------------------------------------------------------
def window_row(u_start, u_end, count, sill, height, width=1.1):
    """Evenly spaced window openings along a wall."""
    out = []
    if count <= 0:
        return out
    span = (u_end - u_start) / count
    for i in range(count):
        c = u_start + span * (i + 0.5)
        out.append((c - width * 0.5, c + width * 0.5, sill, sill + height, "window"))
    return out


def door(u, width=1.0, height=2.05):
    return [(u - width * 0.5, u + width * 0.5, 0.0, height, "door")]


def door_top(u, width=1.0, height=2.05, wall_h=3.0):
    return [(u - width * 0.5, u + width * 0.5, height, wall_h, "door")] + \
           [(u - width * 0.5, u + width * 0.5, 0.0, height, "void")]
