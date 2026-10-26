#!/usr/bin/env python3
# ============================================================================
#  ASHES OF HUMANITY: LAST SIGNAL
#  Weapons and item props - original designs.
# ============================================================================
import math

from afbuild import MeshBuilder


def _gunstock(mb, mats, x, y, z, length=0.55, ry=0.0):
    wood = mats.index_of("WoodDark")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x - s * length * 0.3, y, z - c * length * 0.3), (0.05, 0.14, length), wood, 2.0)
    mb.add_box((x - s * length * 0.62, y + 0.02, z - c * length * 0.62), (0.06, 0.2, 0.16), wood, 2.0)


def knife(mb, mats, x, y, z, ry=0.0):
    steel = mats.index_of("Gunmetal")
    handle = mats.index_of("Leather")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y, z), (0.035, 0.035, 0.12), handle, 3.0)
    mb.add_box((x - s * 0.13, y, z - c * 0.13), (0.012, 0.055, 0.2), steel, 2.0)
    mb.add_box((x, y + 0.022, z), (0.045, 0.012, 0.03), steel, 3.0)


def combat_knife(mb, mats, x, y, z, ry=0.0):
    steel = mats.index_of("Gunmetal")
    handle = mats.index_of("Rubber")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y, z), (0.03, 0.04, 0.14), handle, 3.0)
    mb.add_box((x - s * 0.12, y, z - c * 0.12), (0.009, 0.05, 0.22), steel, 2.5)
    for e in (-1, 1):
        mb.add_box((x + e * 0.018 * c, y, z + e * 0.018 * s), (0.012, 0.05, 0.03), steel, 3.0)


def machete(mb, mats, x, y, z, ry=0.0):
    steel = mats.index_of("Gunmetal")
    handle = mats.index_of("Leather")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y, z), (0.035, 0.045, 0.16), handle, 3.0)
    mb.add_box((x - s * 0.27, y, z - c * 0.27), (0.008, 0.075, 0.42), steel, 1.5)


def fire_axe(mb, mats, x, y, z, ry=0.0):
    steel = mats.index_of("Gunmetal")
    wood = mats.index_of("Wood")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_cylinder((x, y, z), 0.022, 0.72, wood, 8, 2.0, axis="Z")
    head = (x - s * 0.1, y, z - c * 0.1)
    mb.add_box(head, (0.05, 0.16, 0.14), steel, 2.0)
    mb.add_box((head[0] - s * 0.09, head[1] + 0.02, head[2] - c * 0.09), (0.01, 0.2, 0.11), steel, 2.0)


def pipe_bat(mb, mats, x, y, z, ry=0.0):
    steel = mats.index_of("RustyMetal")
    mb.add_cylinder((x, y, z), 0.028, 0.78, steel, 8, 2.0, axis="Z")
    for e in (-1, 1):
        mb.add_box((x, y + e * 0.36, z), (0.05, 0.06, 0.05), steel, 2.0)


def pistol(mb, mats, x, y, z, ry=0.0):
    steel = mats.index_of("Gunmetal")
    grip = mats.index_of("Rubber")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y + 0.03, z), (0.035, 0.09, 0.22), steel, 2.0)
    mb.add_box((x - s * 0.05, y - 0.08, z - c * 0.05), (0.04, 0.17, 0.07), grip, 3.0)
    mb.add_box((x - s * 0.11, y + 0.03, z - c * 0.11), (0.03, 0.06, 0.09), steel, 2.5)


def revolver(mb, mats, x, y, z, ry=0.0):
    steel = mats.index_of("Gunmetal")
    grip = mats.index_of("WoodDark")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_cylinder((x, y, z), 0.035, 0.13, steel, 10, 2.0, axis="Z")
    mb.add_box((x - s * 0.12, y - 0.03, z - c * 0.12), (0.028, 0.05, 0.24), steel, 2.0)
    mb.add_box((x - s * 0.05, y - 0.12, z - c * 0.05), (0.042, 0.16, 0.07), grip, 3.0)


def shotgun(mb, mats, x, y, z, ry=0.0):
    steel = mats.index_of("Gunmetal")
    wood = mats.index_of("WoodDark")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_cylinder((x - s * 0.28, y + 0.03, z - c * 0.28), 0.017, 0.66, steel, 8, 2.0, axis="Z")
    mb.add_cylinder((x - s * 0.28, y - 0.015, z - c * 0.28), 0.015, 0.6, steel, 8, 2.0, axis="Z")
    mb.add_box((x, y - 0.02, z), (0.05, 0.09, 0.26), wood, 2.0)
    mb.add_box((x + s * 0.18, y - 0.02, z + c * 0.18), (0.055, 0.11, 0.34), wood, 2.0)


def rifle_ak(mb, mats, x, y, z, ry=0.0):
    steel = mats.index_of("Gunmetal")
    wood = mats.index_of("WoodDark")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_cylinder((x - s * 0.35, y + 0.02, z - c * 0.35), 0.014, 0.72, steel, 8, 2.0, axis="Z")
    mb.add_box((x, y + 0.01, z), (0.045, 0.08, 0.34), wood, 2.0)
    mb.add_box((x + s * 0.12, y - 0.03, z + c * 0.12), (0.05, 0.13, 0.3), wood, 2.0)
    mb.add_box((x - s * 0.08, y - 0.11, z - c * 0.08), (0.035, 0.14, 0.06), steel, 2.5)
    mb.add_box((x - s * 0.18, y + 0.07, z - c * 0.18), (0.03, 0.05, 0.16), steel, 2.5)


def hunting_rifle(mb, mats, x, y, z, ry=0.0):
    steel = mats.index_of("Gunmetal")
    wood = mats.index_of("Wood")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_cylinder((x - s * 0.34, y + 0.02, z - c * 0.34), 0.013, 0.74, steel, 8, 2.0, axis="Z")
    mb.add_box((x, y, z), (0.045, 0.08, 0.36), wood, 2.0)
    mb.add_box((x + s * 0.14, y - 0.01, z + c * 0.14), (0.05, 0.12, 0.34), wood, 2.0)


def smg(mb, mats, x, y, z, ry=0.0):
    steel = mats.index_of("Gunmetal")
    grip = mats.index_of("Rubber")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_cylinder((x - s * 0.22, y + 0.03, z - c * 0.22), 0.013, 0.46, steel, 8, 2.0, axis="Z")
    mb.add_box((x, y + 0.02, z), (0.045, 0.1, 0.3), steel, 2.0)
    mb.add_box((x - s * 0.04, y - 0.09, z - c * 0.04), (0.035, 0.13, 0.05), grip, 3.0)
    mb.add_box((x + s * 0.06, y - 0.08, z + c * 0.06), (0.04, 0.2, 0.05), grip, 3.0)


def crossbow(mb, mats, x, y, z, ry=0.0):
    wood = mats.index_of("Wood")
    steel = mats.index_of("Gunmetal")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y, z), (0.045, 0.05, 0.5), wood, 2.0)
    mb.add_box((x - s * 0.2, y + 0.03, z - c * 0.2), (0.62, 0.025, 0.035), steel, 2.0)
    mb.add_box((x - s * 0.08, y - 0.07, z - c * 0.08), (0.035, 0.11, 0.05), wood, 2.0)


def improvised_spear(mb, mats, x, y, z, ry=0.0):
    wood = mats.index_of("Wood")
    steel = mats.index_of("RustyMetal")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_cylinder((x, y, z), 0.02, 1.35, wood, 7, 2.0, axis="Z")
    mb.add_box((x - s * 0.22, y, z - c * 0.22), (0.02, 0.07, 0.24), steel, 2.0)


# ---------------------------------------------------------------------------
# Items
# ---------------------------------------------------------------------------
def medkit(mb, mats, x, y, z):
    m = mats.index_of("PlasticRed")
    md = mats.index_of("Plastic")
    mb.add_box((x, y + 0.1, z), (0.34, 0.2, 0.24), m, 2.0)
    mb.add_box((x, y + 0.21, z), (0.35, 0.02, 0.25), md, 2.0)
    mb.add_box((x, y + 0.22, z), (0.16, 0.01, 0.04), md, 3.0)
    mb.add_box((x, y + 0.22, z), (0.04, 0.01, 0.16), md, 3.0)


def bandage_roll(mb, mats, x, y, z):
    m = mats.index_of("Fabric")
    mb.add_cylinder((x, y + 0.05, z), 0.06, 0.1, m, 10, 3.0, axis="X")


def pill_bottle(mb, mats, x, y, z):
    m = mats.index_of("Plastic")
    mb.add_cylinder((x, y + 0.05, z), 0.028, 0.1, m, 10, 3.0)
    mb.add_cylinder((x, y + 0.11, z), 0.03, 0.02, mats.index_of("PlasticRed"), 10, 3.0)


def water_bottle(mb, mats, x, y, z):
    m = mats.index_of("Glass")
    mb.add_cylinder((x, y + 0.11, z), 0.04, 0.22, m, 10, 2.5)
    mb.add_cylinder((x, y + 0.235, z), 0.025, 0.03, mats.index_of("Plastic"), 10, 3.0)


def can_food(mb, mats, x, y, z):
    m = mats.index_of("MetalTin")
    mb.add_cylinder((x, y + 0.05, z), 0.04, 0.1, m, 10, 3.0)


def ration_pack(mb, mats, x, y, z):
    m = mats.index_of("FabricRed")
    mb.add_box((x, y + 0.06, z), (0.2, 0.12, 0.14), m, 2.5)


def battery(mb, mats, x, y, z):
    m = mats.index_of("Gunmetal")
    mb.add_cylinder((x, y + 0.04, z), 0.014, 0.08, m, 8, 3.0)


def ammo_box(mb, mats, x, y, z):
    m = mats.index_of("PaintedMetalGreen")
    md = mats.index_of("Gunmetal")
    mb.add_box((x, y + 0.08, z), (0.3, 0.16, 0.2), m, 2.0)
    mb.add_box((x, y + 0.165, z), (0.31, 0.02, 0.21), md, 2.4)


def ammo_pile(mb, mats, x, y, z, n=7):
    m = mats.index_of("Brass")
    for i in range(n):
        mb.add_cylinder((x + (i % 4) * 0.012, y + 0.012, z + (i // 4) * 0.02), 0.005, 0.024, m, 6, 4.0)


def jerrycan(mb, mats, x, y, z, ry=0.0):
    m = mats.index_of("PaintedMetalGreen")
    md = mats.index_of("Gunmetal")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y + 0.16, z), (0.18, 0.32, 0.3), m, 2.0)
    mb.add_box((x, y + 0.33, z), (0.19, 0.03, 0.31), md, 2.4)
    mb.add_cylinder((x + 0.05 * c, y + 0.36, z + 0.05 * s), 0.025, 0.05, md, 8, 3.0)


def radio_handheld(mb, mats, x, y, z, ry=0.0):
    m = mats.index_of("Plastic")
    md = mats.index_of("Gunmetal")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y + 0.07, z), (0.08, 0.14, 0.05), m, 3.0)
    mb.add_box((x, y + 0.16, z), (0.06, 0.04, 0.03), md, 3.0)
    mb.add_cylinder((x + 0.04 * c, y + 0.24, z + 0.04 * s), 0.006, 0.18, md, 6, 4.0)


def notebook(mb, mats, x, y, z, ry=0.0):
    m = mats.index_of("Paper")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y + 0.012, z), (0.15, 0.024, 0.21), m, 2.0)


def flashlight(mb, mats, x, y, z, ry=0.0):
    m = mats.index_of("Gunmetal")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_cylinder((x, y + 0.025, z), 0.025, 0.15, m, 10, 2.5, axis="Z")
    mb.add_cylinder((x, y + 0.115, z), 0.035, 0.04, m, 10, 2.5, axis="Z")


def helmet(mb, mats, x, y, z):
    m = mats.index_of("PaintedMetalGreen")
    md = mats.index_of("Gunmetal")
    mb.add_sphere((x, y + 0.09, z), 0.14, m, 6, 12, 1.6, squash=(1.0, 0.85, 1.05))
    mb.add_cylinder((x, y + 0.1, z), 0.145, 0.03, md, 12, 2.0, caps=False)


def armor_vest(mb, mats, x, y, z, ry=0.0):
    m = mats.index_of("Fabric")
    md = mats.index_of("PaintedMetalGreen")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y + 0.3, z), (0.42, 0.6, 0.24), md, 1.4)
    mb.add_box((x, y + 0.3, z + 0.13), (0.36, 0.44, 0.04), m, 1.8)


def backpack(mb, mats, x, y, z, ry=0.0):
    m = mats.index_of("Fabric")
    md = mats.index_of("Leather")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y + 0.28, z), (0.34, 0.5, 0.24), m, 1.4)
    mb.add_box((x, y + 0.16, z + 0.13), (0.3, 0.2, 0.04), md, 2.0)
    mb.add_box((x, y + 0.42, z), (0.3, 0.06, 0.2), md, 2.0)


def wood_plank(mb, mats, x, y, z, ry=0.0):
    m = mats.index_of("Wood")
    c, s = math.cos(ry), math.sin(ry)
    mb.add_box((x, y + 0.02, z), (0.12, 0.04, 1.1), m, 1.6)


def metal_scrap(mb, mats, x, y, z):
    m = mats.index_of("RustyMetal")
    mb.add_box((x, y + 0.05, z), (0.24, 0.1, 0.18), m, 1.6)


def electronic_scrap(mb, mats, x, y, z):
    m = mats.index_of("PaintedMetal")
    md = mats.index_of("Gunmetal")
    mb.add_box((x, y + 0.06, z), (0.22, 0.12, 0.16), m, 1.8)
    mb.add_box((x, y + 0.13, z), (0.1, 0.03, 0.1), md, 2.4)


def cloth_scrap(mb, mats, x, y, z):
    m = mats.index_of("Fabric")
    mb.add_box((x, y + 0.02, z), (0.26, 0.04, 0.22), m, 1.6)


def mushroom(mb, mats, x, y, z):
    m = mats.index_of("Mushroom")
    mb.add_cylinder((x, y + 0.05, z), 0.02, 0.1, m, 6, 3.0)
    mb.add_sphere((x, y + 0.1, z), 0.06, m, 5, 8, 3.0, squash=(1.0, 0.6, 1.0))


def herb(mb, mats, x, y, z):
    m = mats.index_of("Foliage")
    mb.add_sphere((x, y + 0.06, z), 0.07, m, 4, 6, 2.0, squash=(0.7, 1.2, 0.7))


def raw_meat(mb, mats, x, y, z):
    m = mats.index_of("Blood")
    mb.add_sphere((x, y + 0.05, z), 0.09, m, 5, 7, 2.0, squash=(1.2, 0.5, 1.0))
