#!/usr/bin/env python3
# ============================================================================
#  ASHES OF HUMANITY: LAST SIGNAL
#  Prop library - original set dressing for the six world regions.
# ============================================================================
import math
import random

from afbuild import MeshBuilder


def crate_wood(mb, mats, x, y, z, s=0.7, rng=None):
    m = mats.index_of("Wood")
    mb.add_box((x, y + s * 0.5, z), (s, s, s), m, 1.2)
    md = mats.index_of("WoodDark")
    for dz in (-1, 1):
        mb.add_box((x, y + s * 0.5, z + dz * s * 0.5), (s * 1.02, s * 0.12, 0.04), md, 2.0)


def crate_metal(mb, mats, x, y, z, s=0.8, rng=None):
    m = mats.index_of("RustyMetal")
    md = mats.index_of("Gunmetal")
    mb.add_box((x, y + s * 0.5, z), (s, s, s), m, 1.0)
    for e in (-1, 1):
        mb.add_box((x + e * s * 0.5, y + s * 0.5, z), (0.05, s * 1.01, s * 1.01), md, 2.0)
        mb.add_box((x, y + s * 0.5, z + e * s * 0.5), (s * 1.01, s * 1.01, 0.05), md, 2.0)
    mb.add_box((x, y + s * 1.005, z), (s * 0.7, 0.03, s * 0.7), md, 2.0)


def barrel(mb, mats, x, y, z, rng=None):
    m = mats.index_of("RustyMetal")
    mb.add_cylinder((x, y + 0.44, z), 0.29, 0.88, m, 14, 1.2)
    md = mats.index_of("Gunmetal")
    for yy in (0.24, 0.64):
        mb.add_cylinder((x, y + yy, z), 0.305, 0.06, md, 14, 2.0, caps=False)


def drum_metal(mb, mats, x, y, z):
    m = mats.index_of("PaintedMetal")
    mb.add_cylinder((x, y + 0.44, z), 0.29, 0.88, m, 14, 1.0)
    md = mats.index_of("Gunmetal")
    for yy in (0.2, 0.68):
        mb.add_cylinder((x, y + yy, z), 0.305, 0.05, md, 14, 2.0, caps=False)


def pallet(mb, mats, x, y, z, rng=None):
    m = mats.index_of("Wood")
    md = mats.index_of("WoodDark")
    for i in range(5):
        mb.add_box((x - 0.5 + i * 0.25, y + 0.12, z), (0.12, 0.02, 1.0), md, 2.0)
    for zz in (-0.35, 0, 0.35):
        mb.add_box((x, y + 0.05, z + zz), (1.1, 0.08, 0.12), m, 2.0)


def desk(mb, mats, x, y, z, ry=0.0):
    m = mats.index_of("Wood")
    md = mats.index_of("WoodDark")
    c, s = math.cos(ry), math.sin(ry)

    def rot(px, pz):
        return (x + px * c - pz * s, z + px * s + pz * c)

    tx, tz = rot(0, 0)
    mb.add_box((tx, y + 0.74, tz), (1.5, 0.06, 0.75), m, 1.2)
    for px, pz in ((-0.68, -0.3), (0.68, -0.3), (-0.68, 0.3), (0.68, 0.3)):
        lx, lz = rot(px, pz)
        mb.add_box((lx, y + 0.37, lz), (0.07, 0.74, 0.07), md, 2.0)
    dx, dz = rot(0.3, 0)
    mb.add_box((dx, y + 0.60, dz), (0.45, 0.24, 0.7), md, 1.5)


def chair(mb, mats, x, y, z, ry=0.0):
    m = mats.index_of("Wood")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y + 0.45, z), (0.44, 0.05, 0.44), m, 1.6)
    bx, bz = x - s * 0.19, z + c * 0.19
    mb.add_box((bx, y + 0.70, bz), (0.44, 0.45, 0.05), m, 1.6)
    for px, pz in ((-0.18, -0.18), (0.18, -0.18), (-0.18, 0.18), (0.18, 0.18)):
        lx = x + px * c - pz * s
        lz = z + px * s + pz * c
        mb.add_box((lx, y + 0.22, lz), (0.05, 0.44, 0.05), m, 2.0)


def office_chair(mb, mats, x, y, z, ry=0.0):
    m = mats.index_of("Fabric")
    md = mats.index_of("Gunmetal")
    mb.add_cylinder((x, y + 0.05, z), 0.30, 0.08, md, 10, 2.0)
    mb.add_cylinder((x, y + 0.25, z), 0.05, 0.42, md, 8, 2.0)
    mb.add_box((x, y + 0.50, z), (0.48, 0.09, 0.46), m, 1.6)
    bx = x - math.sin(ry) * 0.21
    bz = z + math.cos(ry) * 0.21
    mb.add_box((bx, y + 0.85, bz), (0.46, 0.58, 0.08), m, 1.6)


def locker(mb, mats, x, y, z, ry=0.0, n=2):
    m = mats.index_of("PaintedMetalGreen")
    md = mats.index_of("Gunmetal")
    c, s = math.cos(ry), math.sin(ry)
    for i in range(n):
        px = (i - (n - 1) * 0.5) * 0.46
        lx = x + px * c
        lz = z + px * s
        mb.add_box((lx, y + 0.9, lz), (0.44, 1.8, 0.45), m, 1.2)
        mb.add_box((lx, y + 1.0, lz + 0.23), (0.36, 0.03, 0.02), md, 2.0)
        mb.add_box((lx + 0.15 * c, y + 1.0, lz + 0.15 * s), (0.03, 0.1, 0.03), md, 2.0)


def shelf(mb, mats, x, y, z, ry=0.0, levels=4, w=1.2):
    m = mats.index_of("PaintedMetalGreen")
    c, s = math.cos(ry), math.sin(ry)
    for lv in range(levels):
        yy = y + 0.25 + lv * 0.5
        mb.add_box((x, yy, z), (w, 0.04, 0.42), m, 1.4)
    for px in (-w * 0.5 + 0.04, w * 0.5 - 0.04):
        lx = x + px * c
        lz = z + px * s
        mb.add_box((lx, y + 1.1, lz), (0.05, 2.2, 0.42), m, 1.4)


def bed(mb, mats, x, y, z, ry=0.0):
    m = mats.index_of("Wood")
    mf = mats.index_of("Fabric")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y + 0.22, z), (1.0, 0.35, 2.0), m, 1.2)
    mb.add_box((x, y + 0.46, z), (0.95, 0.16, 1.9), mf, 1.0)
    mb.add_box((x - s * 0.95, y + 0.62, z + c * 0.95), (0.9, 0.16, 0.36), mf, 1.0)
    hx = x - s * 0.98
    hz = z + c * 0.98
    mb.add_box((hx, y + 0.55, hz), (1.0, 1.1, 0.08), m, 1.2)


def sofa(mb, mats, x, y, z, ry=0.0):
    mf = mats.index_of("Fabric")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y + 0.22, z), (1.9, 0.32, 0.8), mf, 1.0)
    mb.add_box((x - s * 0.36, y + 0.55, z + c * 0.36), (1.9, 0.5, 0.16), mf, 1.0)
    for e in (-1, 1):
        ex = x + e * 0.92 * c
        ez = z + e * 0.92 * s
        mb.add_box((ex, y + 0.38, ez), (0.16, 0.42, 0.8), mf, 1.0)


def workbench(mb, mats, x, y, z, ry=0.0):
    m = mats.index_of("Wood")
    md = mats.index_of("Gunmetal")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y + 0.88, z), (2.2, 0.08, 0.75), m, 1.2)
    for px, pz in ((-1.0, -0.3), (1.0, -0.3), (-1.0, 0.3), (1.0, 0.3)):
        lx = x + px * c - pz * s
        lz = z + px * s + pz * c
        mb.add_box((lx, y + 0.43, lz), (0.08, 0.86, 0.08), md, 2.0)
    mb.add_box((x, y + 0.45, z), (2.0, 0.05, 0.6), md, 1.5)


def generator(mb, mats, x, y, z, ry=0.0):
    m = mats.index_of("PaintedMetal")
    md = mats.index_of("Gunmetal")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y + 0.42, z), (1.3, 0.84, 0.8), m, 1.0)
    mb.add_box((x, y + 0.88, z), (1.1, 0.1, 0.7), md, 1.5)
    mb.add_cylinder((x + 0.3 * c, y + 1.05, z + 0.3 * s), 0.07, 0.26, md, 10, 2.0, axis="Y")
    for e in (-1, 1):
        mb.add_box((x + e * 0.65 * c, y + 0.12, z + e * 0.65 * s), (0.16, 0.24, 0.16), md, 2.0)


def computer_terminal(mb, mats, x, y, z, ry=0.0, powered=False):
    m = mats.index_of("Plastic")
    md = mats.index_of("Gunmetal")
    me = mats.index_of("Screen")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y + 0.4, z), (0.62, 0.8, 0.45), m, 1.2)
    mb.add_box((x, y + 0.06, z), (0.66, 0.06, 0.5), md, 1.6)
    sx = x + 0.22 * s
    sz = z - 0.22 * c
    mb.add_box((sx, y + 1.05, sz), (0.58, 0.46, 0.34), md, 1.4)
    mb.add_box((sx + 0.19 * s, y + 1.05, sz - 0.19 * c), (0.5, 0.38, 0.02), me, 1.2,
               color=(0.35, 0.85, 0.55, 1.0) if powered else (0.12, 0.14, 0.13, 1.0))


def filing_cabinet(mb, mats, x, y, z, ry=0.0, drawers=4):
    m = mats.index_of("PaintedMetal")
    md = mats.index_of("Gunmetal")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y + 0.65, z), (0.48, 1.3, 0.62), m, 1.2)
    for i in range(drawers):
        yy = y + 0.18 + i * 0.31
        mb.add_box((x - s * 0.31, yy, z + c * 0.31), (0.44, 0.26, 0.02), md, 2.0)
        mb.add_box((x - s * 0.31, yy, z + c * 0.31), (0.16, 0.03, 0.03), md, 2.0)


def sink(mb, mats, x, y, z, ry=0.0):
    mc = mats.index_of("Ceramic")
    md = mats.index_of("Gunmetal")
    mb.add_box((x, y + 0.88, z), (0.6, 0.2, 0.45), mc, 1.6)
    mb.add_box((x, y + 0.80, z), (0.46, 0.1, 0.32), md, 2.0)
    mb.add_cylinder((x, y + 1.02, z), 0.025, 0.24, md, 8, 3.0)


def toilet(mb, mats, x, y, z, ry=0.0):
    mc = mats.index_of("Ceramic")
    mb.add_box((x, y + 0.2, z), (0.38, 0.4, 0.5), mc, 1.6)
    mb.add_box((x, y + 0.44, z + 0.05), (0.4, 0.1, 0.56), mc, 1.6)
    mb.add_box((x, y + 0.58, z - 0.2), (0.4, 0.5, 0.16), mc, 1.6)


def car_wreck(mb, mats, x, y, z, ry=0.0, rng=None):
    """A stripped, rusting sedan.  Recognisable proportions: 4.3 m long."""
    body = mats.index_of("RustyMetal")
    glass = mats.index_of("Glass")
    md = mats.index_of("Gunmetal")
    c, s = math.cos(ry), math.sin(ry)

    def place(px, py, pz):
        return (x + px * c - pz * s, y + py, z + px * s + pz * c)

    mb.add_box(place(0, 0.55, 0), (1.78, 0.62, 4.3), body, 0.8)
    mb.add_box(place(0, 1.12, -0.25), (1.62, 0.58, 2.3), body, 0.8)
    mb.add_box(place(0, 1.12, -0.25), (1.66, 0.40, 2.1), glass, 1.0, color=(0.55, 0.60, 0.62, 0.4))
    for px in (-0.82, 0.82):
        for pz in (-1.45, 1.35):
            lx, ly, lz = place(px, 0.32, pz)
            mb.add_cylinder((lx, ly, lz), 0.32, 0.2, md, 12, 1.2, axis="X")
    for e in (-1, 1):
        lx, ly, lz = place(e * 0.55, 0.62, -2.16)
        mb.add_box((lx, ly, lz), (0.5, 0.16, 0.06), md, 2.0)


def truck_wreck(mb, mats, x, y, z, ry=0.0):
    body = mats.index_of("RustyMetal")
    md = mats.index_of("Gunmetal")
    c, s = math.cos(ry), math.sin(ry)

    def place(px, py, pz):
        return (x + px * c - pz * s, y + py, z + px * s + pz * c)

    mb.add_box(place(0, 1.1, 1.6), (2.3, 2.1, 3.0), body, 0.7)
    mb.add_box(place(0, 1.0, -2.0), (2.3, 0.5, 4.6), md, 0.9)
    for px in (-1.05, 1.05):
        for pz in (-2.6, 1.8, 3.0):
            lx, ly, lz = place(px, 0.45, pz)
            mb.add_cylinder((lx, ly, lz), 0.45, 0.28, md, 12, 1.0, axis="X")


def bus_wreck(mb, mats, x, y, z, ry=0.0):
    body = mats.index_of("RustyMetal")
    glass = mats.index_of("Glass")
    md = mats.index_of("Gunmetal")
    c, s = math.cos(ry), math.sin(ry)

    def place(px, py, pz):
        return (x + px * c - pz * s, y + py, z + px * s + pz * c)

    mb.add_box(place(0, 1.45, 0), (2.5, 2.0, 10.0), body, 0.6)
    for px in (-1.26, 1.26):
        mb.add_box(place(px, 1.7, 0), (0.03, 0.8, 8.6), glass, 1.0, color=(0.5, 0.55, 0.57, 0.35))
    for px in (-1.1, 1.1):
        for pz in (-3.8, 3.4):
            lx, ly, lz = place(px, 0.45, pz)
            mb.add_cylinder((lx, ly, lz), 0.45, 0.28, md, 12, 1.0, axis="X")


def sandbag_wall(mb, mats, x, y, z, ry=0.0, length=2.4, rows=3):
    m = mats.index_of("Fabric")
    c, s = math.cos(ry), math.sin(ry)
    n = int(length / 0.55)
    for r in range(rows):
        cnt = n - (r % 2)
        for i in range(cnt):
            px = (i - (cnt - 1) * 0.5) * 0.55 + (0.14 if r % 2 else 0.0)
            lx = x + px * c
            lz = z + px * s
            mb.add_box((lx, y + 0.13 + r * 0.24, lz), (0.5, 0.22, 0.34), m, 1.4)


def fence_chain(mb, mats, x0, z0, x1, z1, y, height=2.0, mat=None):
    m = mats.index_of("RustyMetal") if mat is None else mat
    posts = max(2, int(math.hypot(x1 - x0, z1 - z0) / 2.5))
    for i in range(posts + 1):
        t = i / posts
        px = x0 + (x1 - x0) * t
        pz = z0 + (z1 - z0) * t
        mb.add_cylinder((px, y + height * 0.5, pz), 0.05, height, m, 6, 2.0)
    # rails
    for hy in (y + height * 0.95, y + height * 0.55):
        mx, mz = (x0 + x1) * 0.5, (z0 + z1) * 0.5
        dx, dz = abs(x1 - x0), abs(z1 - z0)
        mb.add_box((mx, hy, mz), (max(dx, 0.05), 0.05, max(dz, 0.05)), m, 2.0)


def lamp_post(mb, mats, x, y, z, ry=0.0, height=5.0):
    m = mats.index_of("PaintedMetal")
    md = mats.index_of("Gunmetal")
    mb.add_cylinder((x, y + height * 0.5, z), 0.08, height, m, 8, 1.6)
    mb.add_box((x, y + 0.1, z), (0.3, 0.2, 0.3), md, 2.0)
    mb.add_box((x + 0.35, y + height - 0.1, z), (0.8, 0.1, 0.16), md, 2.0)


def traffic_cone(mb, mats, x, y, z):
    m = mats.index_of("Plastic")
    mb.add_box((x, y + 0.02, z), (0.36, 0.04, 0.36), m, 2.0)
    mb.add_cylinder((x, y + 0.30, z), 0.16, 0.56, m, 8, 2.0, radius_top=0.04)


def table(mb, mats, x, y, z, ry=0.0, w=1.1, d=0.7, h=0.74):
    """Simple wooden table."""
    m = mats.index_of("Wood")
    md = mats.index_of("WoodDark")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y + h, z), (w, 0.06, d), m, 1.2)
    for px in (-w * 0.5 + 0.09, w * 0.5 - 0.09):
        for pz in (-d * 0.5 + 0.09, d * 0.5 - 0.09):
            lx = x + px * c - pz * s
            lz = z + px * s + pz * c
            mb.add_box((lx, y + h * 0.5, lz), (0.07, h, 0.07), md, 2.0)
    mb.add_box((x, y + h * 0.35, z), (w - 0.2, 0.04, d - 0.2), md, 1.6)


def tire(mb, mats, x, y, z, r=0.34):
    m = mats.index_of("Rubber")
    mb.add_cylinder((x, y + r * 0.5, z), r, 0.24, m, 14, 1.6, axis="Y", caps=False)
    mb.add_cylinder((x, y + r * 0.5, z), r * 0.58, 0.26, m, 12, 1.6, axis="Y", caps=False)


def tree_pine(mb, mats, x, y, z, height=7.0, rng=None):
    bark = mats.index_of("Bark")
    leaf = mats.index_of("Foliage")
    mb.add_cylinder((x, y + height * 0.18, z), 0.26, height * 0.4, bark, 8, 1.2, radius_top=0.17)
    tiers = 4
    for i in range(tiers):
        t = i / (tiers - 1)
        r = (1.55 - t * 1.05) * (0.85 + (rng.random() * 0.2 if rng else 0))
        yy = y + height * (0.32 + t * 0.62)
        mb.add_cylinder((x, yy, z), r, height * 0.26, leaf, 9, 0.8, radius_top=r * 0.18,
                        color=(0.9, 1.0, 0.85, 1.0))


def tree_dead(mb, mats, x, y, z, height=6.5, rng=None):
    bark = mats.index_of("Bark")
    mb.add_cylinder((x, y + height * 0.5, z), 0.3, height, bark, 7, 1.2, radius_top=0.08)
    for i in range(4):
        a = rng.uniform(0, math.tau) if rng else i * 1.6
        yy = y + height * (0.4 + i * 0.12)
        ln = height * 0.22
        mb.add_capsule_limb((x, yy, z), (x + math.cos(a) * ln, yy + ln * 0.6, z + math.sin(a) * ln),
                            0.09, 0.02, bark, 6, 1.4)


def bush(mb, mats, x, y, z, r=0.7, rng=None):
    leaf = mats.index_of("Foliage")
    for i in range(4):
        a = rng.uniform(0, math.tau) if rng else i * 1.57
        rr = r * (0.5 + (rng.random() * 0.4 if rng else 0.3))
        mb.add_sphere((x + math.cos(a) * r * 0.4, y + r * 0.45, z + math.sin(a) * r * 0.4),
                      rr, leaf, 5, 7, 1.2, color=(0.85, 1.0, 0.8, 1.0))


def rock(mb, mats, x, y, z, r=0.6, rng=None):
    m = mats.index_of("ConcreteDark")
    mb.add_sphere((x, y + r * 0.45, z), r, m, 5, 7, 1.0, squash=(1.0, 0.72, 0.9))


def pipe_run(mb, mats, x0, z0, x1, z1, y, radius=0.12, mat=None):
    m = mats.index_of("RustyMetal") if mat is None else mat
    mx, mz = (x0 + x1) * 0.5, (z0 + z1) * 0.5
    dx, dz = abs(x1 - x0), abs(z1 - z0)
    if dx > dz:
        mb.add_cylinder((mx, y, mz), radius, dx, m, 10, 1.4, axis="X")
    else:
        mb.add_cylinder((mx, y, mz), radius, dz, m, 10, 1.4, axis="Z")


def tank_vertical(mb, mats, x, y, z, r=1.4, h=4.0):
    m = mats.index_of("PaintedMetal")
    md = mats.index_of("Gunmetal")
    mb.add_cylinder((x, y + h * 0.5, z), r, h, m, 16, 0.7)
    mb.add_cylinder((x, y + h + 0.15, z), r * 0.9, 0.3, md, 16, 1.0)
    for i in range(4):
        a = i * math.pi * 0.5
        mb.add_box((x + math.cos(a) * r * 0.95, y + h * 0.5, z + math.sin(a) * r * 0.95),
                   (0.12, h, 0.12), md, 2.0)


def cooling_tower(mb, mats, x, y, z, h=22.0, base_r=7.0, top_r=4.0):
    m = mats.index_of("Concrete")
    rings = 10
    for i in range(rings):
        t0 = i / rings
        t1 = (i + 1) / rings
        r0 = base_r + (top_r - base_r) * (t0 * t0 * 0.6 + t0 * 0.4)
        r1 = base_r + (top_r - base_r) * (t1 * t1 * 0.6 + t1 * 0.4)
        seg = 20
        for s in range(seg):
            a0 = 2 * math.pi * s / seg
            a1 = 2 * math.pi * (s + 1) / seg
            p00 = (x + math.cos(a0) * r0, y + h * t0, z + math.sin(a0) * r0)
            p01 = (x + math.cos(a0) * r1, y + h * t1, z + math.sin(a0) * r1)
            p11 = (x + math.cos(a1) * r1, y + h * t1, z + math.sin(a1) * r1)
            p10 = (x + math.cos(a1) * r0, y + h * t0, z + math.sin(a1) * r0)
            mb.add_quad(p00, p01, p11, p10, m, 0.4)


def watchtower(mb, mats, x, y, z, height=8.0, rng=None):
    wood = mats.index_of("Wood")
    md = mats.index_of("RustyMetal")
    for sx in (-1.5, 1.5):
        for sz in (-1.5, 1.5):
            mb.add_box((x + sx, y + height * 0.5, z + sz), (0.28, height, 0.28), wood, 1.0)
    mb.add_box((x, y + height * 0.5, z), (3.6, 0.16, 3.6), wood, 1.0)
    mb.add_box((x, y + height + 0.15, z), (3.2, 0.3, 3.2), wood, 1.0)
    for i in range(8):
        a = i * math.pi / 4
        px = x + math.cos(a) * 1.55
        pz = z + math.sin(a) * 1.55
        mb.add_box((px, y + height + 0.65, pz), (0.14, 1.0, 0.14), wood, 1.4)
    mb.add_box((x, y + height + 1.05, z), (3.4, 0.12, 3.4), md, 1.2)


def barricade(mb, mats, x, y, z, ry=0.0):
    m = mats.index_of("Wood")
    md = mats.index_of("RustyMetal")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y + 0.55, z), (2.0, 0.22, 0.12), m, 1.2)
    mb.add_box((x, y + 1.0, z), (2.0, 0.22, 0.12), m, 1.2)
    for e in (-1, 1):
        px = x + e * 0.8 * c
        pz = z + e * 0.8 * s
        mb.add_box((px, y + 0.5, pz), (0.12, 1.0, 0.5), md, 1.6)


def radio_console(mb, mats, x, y, z, ry=0.0, powered=True):
    m = mats.index_of("PaintedMetal")
    md = mats.index_of("Gunmetal")
    me = mats.index_of("Screen")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y + 0.45, z), (1.5, 0.9, 0.6), m, 1.0)
    sl = mb.add_box((x - s * 0.1, y + 0.95, z + c * 0.1), (1.5, 0.12, 0.62), md, 1.2)
    mb.add_box((x + 0.35 * s, y + 1.12, z - 0.35 * c), (0.5, 0.34, 0.16), md, 1.4)
    mb.add_box((x + 0.35 * s, y + 1.12, z - 0.35 * c - 0.09 * c), (0.42, 0.26, 0.02), me, 1.2,
               color=(0.4, 0.9, 0.6, 1.0) if powered else (0.1, 0.12, 0.11, 1.0))
    for i in range(4):
        mb.add_box((x - 0.5 + i * 0.3, y + 1.01, z + 0.12 * c), (0.16, 0.05, 0.16), md, 2.0)


def medical_cart(mb, mats, x, y, z, ry=0.0):
    m = mats.index_of("PaintedMetal")
    md = mats.index_of("Gunmetal")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y + 0.5, z), (0.7, 0.08, 0.48), m, 1.4)
    mb.add_box((x, y + 0.78, z), (0.7, 0.08, 0.48), m, 1.4)
    for px in (-0.3, 0.3):
        for pz in (-0.2, 0.2):
            mb.add_box((x + px * c, y + 0.45, z + px * s), (0.04, 0.9, 0.04), md, 2.0)
    mb.add_box((x - s * 0.22, y + 0.6, z + c * 0.22), (0.6, 0.12, 0.03), md, 1.6)


def ammo_crate(mb, mats, x, y, z, ry=0.0):
    m = mats.index_of("PaintedMetalGreen")
    md = mats.index_of("Gunmetal")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y + 0.16, z), (0.62, 0.32, 0.4), m, 1.4)
    mb.add_box((x, y + 0.33, z), (0.64, 0.03, 0.42), md, 1.8)
    mb.add_box((x - s * 0.2, y + 0.2, z + c * 0.2), (0.3, 0.05, 0.04), md, 2.0)
