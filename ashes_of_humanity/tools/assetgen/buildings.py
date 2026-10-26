#!/usr/bin/env python3
# ============================================================================
#  ASHES OF HUMANITY: LAST SIGNAL
#  Building prefabs - complete structures with interiors, not shell boxes.
# ============================================================================
import math
import random

from afbuild import MeshBuilder
from structures import StructureBuilder, window_row, door, door_top
import props as P
import weapons_items as ITEMS


def _rng(seed):
    return random.Random(seed)


# ---------------------------------------------------------------------------
def house(mats, seed=1):
    """Suburban house: living room + kitchen downstairs, two bedrooms up,
    a porch and a detached garage."""
    rng = _rng(seed)
    mb = MeshBuilder()
    sb = StructureBuilder(mb, mats)
    W, D = 9.0, 7.2
    H0, H1 = 3.0, 2.7
    wall = mats.index_of("Plaster")
    floor_m = mats.index_of("Wood")
    trim = mats.index_of("WoodDark")

    # --- ground floor slab ---
    sb.floor(-W / 2, -D / 2, W / 2, D / 2, 0.0, floor_m, 0.6)
    sb.ceiling(-W / 2, -D / 2, W / 2, D / 2, H0, mats.index_of("ConcreteDark"), 0.5)

    # exterior walls with windows and a door
    sb.wall((-W / 2, -D / 2), (W / 2, -D / 2), 0, H0, wall,
            window_row(1.6, W - 1.6, 2, 0.95, 1.35) + door(W / 2, 1.1, 2.1), 0.5)
    sb.wall((W / 2, -D / 2), (W / 2, D / 2), 0, H0, wall,
            window_row(1.4, D - 1.4, 1, 0.95, 1.35), 0.5)
    sb.wall((W / 2, D / 2), (-W / 2, D / 2), 0, H0, wall,
            window_row(1.4, W - 1.4, 2, 0.95, 1.35), 0.5)
    sb.wall((-W / 2, D / 2), (-W / 2, -D / 2), 0, H0, wall,
            window_row(1.2, D - 1.2, 1, 0.95, 1.35), 0.5)

    # interior partition + doorway
    sb.wall((-W / 2, 0.4), (-0.6, 0.4), 0, H0, wall, door(-1.8, 1.0, 2.05), 0.5)
    sb.wall((-0.6, 0.4), (W / 2, 0.4), 0, H0, wall, [], 0.5)

    # upstairs
    sb.floor(-W / 2, -D / 2, W / 2, D / 2, H0, floor_m, 0.6)
    sb.wall((-W / 2, -D / 2), (W / 2, -D / 2), H0, H0 + H1, wall,
            window_row(1.6, W - 1.6, 2, H0 + 0.85, 1.25), 0.5)
    sb.wall((W / 2, -D / 2), (W / 2, D / 2), H0, H0 + H1, wall,
            window_row(1.4, D - 1.4, 1, H0 + 0.85, 1.25), 0.5)
    sb.wall((W / 2, D / 2), (-W / 2, D / 2), H0, H0 + H1, wall,
            window_row(1.4, W - 1.4, 2, H0 + 0.85, 1.25), 0.5)
    sb.wall((-W / 2, D / 2), (-W / 2, -D / 2), H0, H0 + H1, wall,
            window_row(1.2, D - 1.2, 1, H0 + 0.85, 1.25), 0.5)
    sb.wall((0.2, -D / 2), (0.2, D / 2), H0, H0 + H1, wall, door(0.2, 0.9, 2.05), 0.5)

    # roof: gable
    roof = mats.index_of("Corrugated")
    eave = H0 + H1
    ridge = eave + 2.1
    for s in (-1, 1):
        z = s * D / 2
        if s < 0:
            mb.add_quad((-W / 2 - 0.35, eave, z), (-W / 2 - 0.35, ridge, 0),
                        (W / 2 + 0.35, ridge, 0), (W / 2 + 0.35, eave, z), roof, 0.45)
        else:
            mb.add_quad((-W / 2 - 0.35, eave, z), (W / 2 + 0.35, eave, z),
                        (W / 2 + 0.35, ridge, 0), (-W / 2 - 0.35, ridge, 0), roof, 0.45)
    # gable ends
    gable = mats.index_of("Wood")
    for s in (-1, 1):
        x = s * W / 2
        if s < 0:
            mb.add_tri((x, eave, -D / 2), (x, eave, D / 2), (x, ridge, 0), gable, 0.6)
        else:
            mb.add_tri((x, eave, -D / 2), (x, ridge, 0), (x, eave, D / 2), gable, 0.6)

    # porch
    sb.floor(-W / 2 - 1.6, -D / 2 - 1.6, W / 2 + 1.6, -D / 2, 0.05, mats.index_of("ConcreteDark"), 0.6)
    for px in (-W / 2 - 1.2, -1.0, 1.0, W / 2 + 1.2):
        mb.add_cylinder((px, 1.3, -D / 2 - 1.4), 0.09, 2.6, trim, 8, 1.4)
    mb.add_box((0, 2.68, -D / 2 - 0.8), (W + 2.6, 0.12, 3.4), roof, 0.45)
    sb.stairs(W / 2 - 1.0, -D / 2 - 2.0, 1.1, 0.0, H0, 12, mats.index_of("ConcreteDark"), 0.6, direction=1)

    # interior furniture
    P.sofa(mb, mats, -2.6, 0.0, -1.8, 0.0)
    P.table(mb, mats, -2.6, 0.0, -0.2)
    P.chair(mb, mats, -1.3, 0.0, -0.2, 1.2)
    P.desk(mb, mats, 2.4, 0.0, -1.6, 3.1)
    P.computer_terminal(mb, mats, 2.9, 0.0, -1.9, 3.1, powered=rng.random() < 0.25)
    P.shelf(mb, mats, 3.9, 0.0, 1.2, 1.57)
    P.bed(mb, mats, -3.0, H0, 1.9, 0.0)
    P.bed(mb, mats, 1.2, H0, 1.9, 0.0)
    P.filing_cabinet(mb, mats, -0.9, 0.0, 2.6, 0.0)
    P.crate_wood(mb, mats, -W / 2 + 0.8, 0.0, D / 2 - 0.9, 0.7, rng)
    sb.rubble_scatter(-W / 2, -D / 2, W / 2, D / 2, 18, mats.index_of("ConcreteDark"), rng)
    return mb


def apartment_block(mats, seed=2):
    """Four storey apartment block with a central corridor and small flats."""
    rng = _rng(seed)
    mb = MeshBuilder()
    sb = StructureBuilder(mb, mats)
    W, D = 16.0, 11.0
    FH = 2.9
    floors = 4
    wall = mats.index_of("PlasterDirty")
    slab = mats.index_of("ConcreteDark")

    for f in range(floors):
        y = f * FH
        sb.floor(-W / 2, -D / 2, W / 2, D / 2, y, slab, 0.45)
        sb.ceiling(-W / 2, -D / 2, W / 2, D / 2, y + FH, slab, 0.45)
        sb.wall((-W / 2, -D / 2), (W / 2, -D / 2), y, y + FH, wall,
                window_row(2.0, W - 2.0, 5, y + 0.85, 1.35), 0.45)
        sb.wall((W / 2, -D / 2), (W / 2, D / 2), y, y + FH, wall,
                window_row(1.6, D - 1.6, 2, y + 0.85, 1.35), 0.45)
        sb.wall((W / 2, D / 2), (-W / 2, D / 2), y, y + FH, wall,
                window_row(2.0, W - 2.0, 5, y + 0.85, 1.35), 0.45)
        sb.wall((-W / 2, D / 2), (-W / 2, -D / 2), y, y + FH, wall,
                window_row(1.6, D - 1.6, 2, y + 0.85, 1.35), 0.45)
        # corridor walls
        for s in (-1, 1):
            sb.wall((-W / 2, s * 1.5), (W / 2, s * 1.5), y, y + FH, wall,
                    [(-W / 2 + 2.0, -W / 2 + 3.0, 0, 2.05, "door"),
                     (0.0, 1.0, 0, 2.05, "door"),
                     (W / 2 - 3.0, W / 2 - 2.0, 0, 2.05, "door")], 0.45)
        # flats furniture
        for k in range(3):
            fx = -W / 2 + 2.6 + k * (W / 3)
            P.bed(mb, mats, fx, y, -D / 2 + 2.2, 0.0)
            P.desk(mb, mats, fx + 1.2, y, D / 2 - 2.2, 3.1)
            P.locker(mb, mats, fx - 1.4, y, D / 2 - 2.0, 0.0, 2)
            if rng.random() < 0.6:
                sb.rubble_scatter(fx - 1.5, -D / 2, fx + 1.5, D / 2, 8, slab, rng)
    # stairwell core
    sb.stairs(-W / 2 + 1.6, -D / 2, 1.2, 0.0, floors * FH, int(floors * FH / 0.17), slab, 0.5, direction=1)
    # roof
    roof = mats.index_of("Corrugated")
    mb.add_quad((-W / 2 - 0.4, floors * FH, D / 2 + 0.4), (W / 2 + 0.4, floors * FH, D / 2 + 0.4),
                (W / 2 + 0.4, floors * FH, -D / 2 - 0.4), (-W / 2 - 0.4, floors * FH, -D / 2 - 0.4),
                roof, 0.45)
    sb.railing((-W / 2, -D / 2), (W / 2, -D / 2), floors * FH, mats.index_of("RustyMetal"))
    return mb


def warehouse(mats, seed=3):
    """Industrial warehouse with racking, skylights and a loading bay."""
    rng = _rng(seed)
    mb = MeshBuilder()
    sb = StructureBuilder(mb, mats)
    W, D, H = 26.0, 16.0, 6.5
    wall = mats.index_of("Corrugated")
    floor_m = mats.index_of("ConcreteDark")
    steel = mats.index_of("RustyMetal")

    sb.floor(-W / 2, -D / 2, W / 2, D / 2, 0.0, floor_m, 0.4)
    sb.ceiling(-W / 2, -D / 2, W / 2, D / 2, H, steel, 0.4)
    sb.wall((-W / 2, -D / 2), (W / 2, -D / 2), 0, H, wall, [], 0.4)
    sb.wall((W / 2, -D / 2), (W / 2, D / 2), 0, H, wall,
            [(6.0, 10.0, 0.0, 4.2, "door"), (-8.0, -5.0, 3.0, 4.6, "window")], 0.4)
    sb.wall((W / 2, D / 2), (-W / 2, D / 2), 0, H, wall,
            [(-6.0, -3.0, 3.0, 4.6, "window"), (4.0, 7.0, 0.0, 4.2, "door")], 0.4)
    sb.wall((-W / 2, D / 2), (-W / 2, -D / 2), 0, H, wall,
            [(-2.0, 1.0, 3.0, 4.6, "window")], 0.4)

    # roof trusses
    for i in range(7):
        x = -W / 2 + 2.0 + i * (W - 4.0) / 6.0
        sb.beam(x, -D / 2, x, D / 2, H - 0.35, 0.28, steel, 0.8)
    for i in range(5):
        z = -D / 2 + 1.5 + i * (D - 3.0) / 4.0
        sb.beam(-W / 2, z, W / 2, z, H - 0.7, 0.2, steel, 0.8)

    # racking
    for i in range(4):
        x = -W / 2 + 4.0 + i * 5.0
        for lev in range(4):
            mb.add_box((x, 0.9 + lev * 1.5, -D / 2 + 2.2), (0.12, 0.08, 1.2), steel, 1.6)
            mb.add_box((x, 0.9 + lev * 1.5, D / 2 - 2.2), (0.12, 0.08, 1.2), steel, 1.6)
        for px in (-0.5, 0.5):
            for pz in (-D / 2 + 2.2, D / 2 - 2.2):
                mb.add_box((x + px, 3.0, pz), (0.1, 6.0, 0.1), steel, 1.6)
        for lev in range(3):
            if rng.random() < 0.6:
                P.crate_metal(mb, mats, x, 0.9 + lev * 1.5, -D / 2 + 2.2, 0.8, rng)

    # office corner
    sb.wall((3.0, 1.5), (W / 2 - 0.2, 1.5), 0, 3.0, mats.index_of("Plaster"),
            [(6.0, 7.0, 0, 2.05, "door"), (9.0, 10.5, 0.9, 2.1, "window")], 0.45)
    P.desk(mb, mats, 6.0, 0, 3.0, 3.1)
    P.office_chair(mb, mats, 6.0, 0, 4.0, 3.1)
    P.filing_cabinet(mb, mats, 9.0, 0, 4.5, 1.57)

    P.generator(mb, mats, -W / 2 + 2.5, 0, D / 2 - 3.0)
    P.barrel(mb, mats, -W / 2 + 4.0, 0, D / 2 - 3.2)
    P.barrel(mb, mats, -W / 2 + 4.7, 0, D / 2 - 3.6)
    P.pallet(mb, mats, 0.0, 0, 5.5)
    P.crate_wood(mb, mats, 1.0, 0, 5.4, 0.8, rng)
    sb.rubble_scatter(-W / 2, -D / 2, W / 2, D / 2, 40, mats.index_of("ConcreteDark"), rng)
    return mb


def hospital_wing(mats, seed=4):
    """Hospital wing: reception, ward corridor, treatment rooms, operating theatre."""
    rng = _rng(seed)
    mb = MeshBuilder()
    sb = StructureBuilder(mb, mats)
    W, D, H = 22.0, 12.0, 3.4
    wall = mats.index_of("Plaster")
    tile = mats.index_of("Tile")
    white = mats.index_of("Ceramic")
    steel = mats.index_of("Gunmetal")

    sb.floor(-W / 2, -D / 2, W / 2, D / 2, 0.0, tile, 0.5)
    sb.ceiling(-W / 2, -D / 2, W / 2, D / 2, H, mats.index_of("ConcreteDark"), 0.5)
    sb.wall((-W / 2, -D / 2), (W / 2, -D / 2), 0, H, wall,
            window_row(2.0, W - 2.0, 4, 1.0, 1.6), 0.45)
    sb.wall((W / 2, -D / 2), (W / 2, D / 2), 0, H, wall, [], 0.45)
    sb.wall((W / 2, D / 2), (-W / 2, D / 2), 0, H, wall, [], 0.45)
    sb.wall((-W / 2, D / 2), (-W / 2, -D / 2), 0, H, wall, [], 0.45)

    # corridor walls with ward doors
    for s in (-1, 1):
        sb.wall((-W / 2, s * 1.7), (W / 2, s * 1.7), 0, H, wall,
                [(-7.5, -6.5, 0, 2.1, "door"), (-2.0, -1.0, 0, 2.1, "door"),
                 (3.5, 4.5, 0, 2.1, "door"), (7.5, 8.5, 0, 2.1, "door")], 0.45)

    # reception
    P.desk(mb, mats, -W / 2 + 2.6, 0, 0.0, 1.57)
    P.office_chair(mb, mats, -W / 2 + 2.6, 0, 1.2, 1.57)
    P.filing_cabinet(mb, mats, -W / 2 + 1.0, 0, 2.2, 0.0)

    # wards
    for i in range(4):
        x = -6.0 + i * 5.0
        P.bed(mb, mats, x, 0, 4.0, 0.0)
        P.bed(mb, mats, x, 0, -4.0, 0.0)
        P.medical_cart(mb, mats, x + 1.6, 0, 0.0, 0.0)
        P.filing_cabinet(mb, mats, x - 1.7, 0, 2.6, 1.57)

    # operating theatre
    sb.wall((8.5, -D / 2), (8.5, -1.7), 0, H, wall, [(8.5, 9.5, 0, 2.1, "door")], 0.45)
    mb.add_box((10.0, 0.85, 0.0), (0.85, 0.08, 2.2), steel, 1.4)
    mb.add_box((10.0, 0.4, 0.0), (0.18, 0.82, 0.18), steel, 1.6)
    mb.add_cylinder((10.0, 2.9, 0.0), 0.32, 0.14, steel, 12, 1.6)
    P.medical_cart(mb, mats, 9.2, 0, -2.6, 0.5)
    P.sink(mb, mats, 8.9, 0, 2.4, 1.57)

    sb.rubble_scatter(-W / 2, -D / 2, W / 2, D / 2, 26, tile, rng)
    return mb


def bunker(mats, seed=5):
    """Military exclusion-zone bunker: blast door, corridors, armory, lab."""
    rng = _rng(seed)
    mb = MeshBuilder()
    sb = StructureBuilder(mb, mats)
    W, D, H = 16.0, 14.0, 3.2
    wall = mats.index_of("ConcreteDark")
    steel = mats.index_of("RustyMetal")
    gun = mats.index_of("Gunmetal")

    sb.floor(-W / 2, -D / 2, W / 2, D / 2, 0.0, mats.index_of("Concrete"), 0.4)
    sb.ceiling(-W / 2, -D / 2, W / 2, D / 2, H, wall, 0.4)
    sb.wall((-W / 2, -D / 2), (W / 2, -D / 2), 0, H, wall, [], 0.4)
    sb.wall((W / 2, -D / 2), (W / 2, D / 2), 0, H, wall, [], 0.4)
    sb.wall((W / 2, D / 2), (-W / 2, D / 2), 0, H, wall, [], 0.4)
    sb.wall((-W / 2, D / 2), (-W / 2, -D / 2), 0, H, wall, [], 0.4)

    # central corridor
    for s in (-1, 1):
        sb.wall((-W / 2, s * 1.6), (W / 2, s * 1.6), 0, H, wall,
                [(-5.0, -4.0, 0, 2.2, "door"), (0.5, 1.5, 0, 2.2, "door"),
                 (5.0, 6.0, 0, 2.2, "door")], 0.45)
    # blast door
    mb.add_box((-W / 2 - 0.1, 1.3, 0.0), (0.22, 2.6, 2.2), gun, 1.0)
    mb.add_cylinder((-W / 2 - 0.3, 1.3, 0.0), 0.22, 0.4, gun, 12, 1.4, axis="X")
    for i in range(6):
        mb.add_box((-W / 2 - 0.25, 0.4 + i * 0.4, 0.0), (0.1, 0.1, 2.0), steel, 1.6)

    # rooms: armory, lab, generator, quarters
    P.ammo_crate(mb, mats, 2.0, 0, 3.4, 0.0)
    P.ammo_crate(mb, mats, 2.6, 0, 3.4, 0.0)
    P.ammo_crate(mb, mats, 2.3, 0.32, 3.4, 0.0)
    P.locker(mb, mats, -1.0, 0, 4.2, 0.0, 3)
    P.workbench(mb, mats, 3.6, 0, -3.6, 1.57)
    P.computer_terminal(mb, mats, 3.4, 0, -4.4, 0.0, powered=rng.random() < 0.4)
    P.generator(mb, mats, -5.6, 0, 4.4, 0.0)
    P.pipe_run(mb, mats, -W / 2, 5.6, W / 2, 5.6, H - 0.4, 0.14)
    P.pipe_run(mb, mats, -W / 2, 5.2, W / 2, 5.2, H - 0.55, 0.09)
    P.bed(mb, mats, -4.0, 0, -4.0, 0.0)
    P.bed(mb, mats, -1.0, 0, -4.0, 0.0)
    P.radio_console(mb, mats, -6.0, 0, -2.0, 0.0, powered=True)
    P.sandbag_wall(mb, mats, 6.0, 0, 5.0, 0.0, 3.0, 3)
    sb.rubble_scatter(-W / 2, -D / 2, W / 2, D / 2, 16, mats.index_of("Concrete"), rng)
    return mb


def police_station(mats, seed=6):
    """Police station: garage bays, lockers, cells and offices."""
    rng = _rng(seed)
    mb = MeshBuilder()
    sb = StructureBuilder(mb, mats)
    W, D, H = 18.0, 12.0, 3.4
    wall = mats.index_of("PlasterDirty")
    slab = mats.index_of("ConcreteDark")

    sb.floor(-W / 2, -D / 2, W / 2, D / 2, 0.0, slab, 0.45)
    sb.ceiling(-W / 2, -D / 2, W / 2, D / 2, H, slab, 0.45)
    sb.wall((-W / 2, -D / 2), (W / 2, -D / 2), 0, H, wall,
            [(-6.0, -2.5, 0, 3.0, "door"), (0.5, 4.0, 0, 3.0, "door")], 0.45)
    sb.wall((W / 2, -D / 2), (W / 2, D / 2), 0, H, wall, [], 0.45)
    sb.wall((W / 2, D / 2), (-W / 2, D / 2), 0, H, wall,
            [(-2.0, 2.0, 1.0, 2.3, "window")], 0.45)
    sb.wall((-W / 2, D / 2), (-W / 2, -D / 2), 0, H, wall, [], 0.45)

    # garage bays
    for i in range(3):
        x = -W / 2 + 3.0 + i * 4.0
        sb.wall((x - 2.0, D / 2 - 0.2), (x - 2.0, -1.0), 0, H, wall, [], 0.45)
        sb.wall((x - 2.0, -1.0), (x, -1.0), 0, H, wall, [], 0.45)
        P.car_wreck(mb, mats, x - 1.0, 0, 2.0, 0.0, rng)
    # cells
    for i in range(4):
        x = 2.0 + i * 1.8
        sb.wall((x, D / 2 - 0.2), (x, 2.0), 0, H, mats.index_of("Gunmetal"), [], 0.6)
        sb.wall((x, 2.0), (x + 1.8, 2.0), 0, H, mats.index_of("Gunmetal"), [], 0.6)
        mb.add_box((x + 0.9, 0.6, 2.05), (1.8, 1.2, 0.06), mats.index_of("Gunmetal"), 0.8)
    P.locker(mb, mats, -W / 2 + 1.2, 0, -3.0, 0.0, 4)
    P.desk(mb, mats, -1.0, 0, -4.5, 0.0)
    P.office_chair(mb, mats, -1.0, 0, -3.4, 3.14)
    P.computer_terminal(mb, mats, -1.6, 0, -4.8, 0.0, powered=rng.random() < 0.3)
    P.barricade(mb, mats, -W / 2 + 2.0, 0, -D / 2 + 1.0, 0.0)
    sb.rubble_scatter(-W / 2, -D / 2, W / 2, D / 2, 20, slab, rng)
    return mb


def shop(mats, seed=7):
    """Corner shop with a storefront, shelving, counter and back room."""
    rng = _rng(seed)
    mb = MeshBuilder()
    sb = StructureBuilder(mb, mats)
    W, D, H = 9.0, 7.0, 3.2
    wall = mats.index_of("PlasterDirty")
    shelf_m = mats.index_of("PaintedMetalGreen")

    sb.floor(-W / 2, -D / 2, W / 2, D / 2, 0.0, mats.index_of("Tile"), 0.6)
    sb.ceiling(-W / 2, -D / 2, W / 2, D / 2, H, mats.index_of("ConcreteDark"), 0.45)
    # storefront glazing
    sb.wall((-W / 2, -D / 2), (W / 2, -D / 2), 0, H, wall,
            [(0.6, W / 2 - 0.6, 0.0, 2.4, "door")], 0.45)
    sb.wall((W / 2, -D / 2), (W / 2, D / 2), 0, H, wall,
            [(-2.0, 2.0, 0.8, 2.2, "window")], 0.45)
    sb.wall((W / 2, D / 2), (-W / 2, D / 2), 0, H, wall, [], 0.45)
    sb.wall((-W / 2, D / 2), (-W / 2, -D / 2), 0, H, wall, [], 0.45)
    # shopfront sign board
    mb.add_box((0, H - 0.45, -D / 2 - 0.18), (W - 0.6, 0.7, 0.12), mats.index_of("PeelingPaint"), 1.0)

    for i in range(4):
        P.shelf(mb, mats, -W / 2 + 1.2 + i * 2.0, 0, D / 2 - 1.0, 0.0, 4, 1.4)
        for k in range(3):
            if rng.random() < 0.7:
                ITEMS.can_food(mb, mats, -W / 2 + 1.2 + i * 2.0 - 0.4 + rng.random() * 0.8,
                           0.4 + k * 0.5, D / 2 - 1.0)
    P.workbench(mb, mats, 2.4, 0, 1.0, 1.57)
    P.crate_wood(mb, mats, -2.0, 0, 0.5, 0.7, rng)
    P.crate_wood(mb, mats, -1.0, 0, 0.4, 0.6, rng)
    sb.rubble_scatter(-W / 2, -D / 2, W / 2, D / 2, 14, mats.index_of("Tile"), rng)
    return mb


def cabin(mats, seed=8):
    """Forest cabin: log walls, stone chimney, porch, loft."""
    rng = _rng(seed)
    mb = MeshBuilder()
    sb = StructureBuilder(mb, mats)
    W, D, H = 7.0, 6.0, 2.7
    log = mats.index_of("WoodDark")
    floor_m = mats.index_of("Wood")

    sb.floor(-W / 2, -D / 2, W / 2, D / 2, 0.0, floor_m, 0.7)
    sb.wall((-W / 2, -D / 2), (W / 2, -D / 2), 0, H, log,
            window_row(1.2, W - 1.2, 1, 0.9, 1.1) + door(W / 2 - 0.8, 0.95, 2.0), 0.7)
    sb.wall((W / 2, -D / 2), (W / 2, D / 2), 0, H, log,
            window_row(1.2, D - 1.2, 1, 0.9, 1.1), 0.7)
    sb.wall((W / 2, D / 2), (-W / 2, D / 2), 0, H, log,
            window_row(1.2, W - 1.2, 1, 0.9, 1.1), 0.7)
    sb.wall((-W / 2, D / 2), (-W / 2, -D / 2), 0, H, log, [], 0.7)
    # loft
    sb.floor(-W / 2, -D / 2, W / 2, 0.5, H - 0.3, floor_m, 0.7)
    sb.stairs(1.6, -D / 2, 1.0, 0.0, H - 0.3, 9, floor_m, 0.7, direction=1)
    # gable roof
    roof = mats.index_of("Corrugated")
    for s in (-1, 1):
        z = s * D / 2
        if s < 0:
            mb.add_quad((-W / 2 - 0.4, H, z), (-W / 2 - 0.4, H + 1.9, 0),
                        (W / 2 + 0.4, H + 1.9, 0), (W / 2 + 0.4, H, z), roof, 0.5)
        else:
            mb.add_quad((-W / 2 - 0.4, H, z), (W / 2 + 0.4, H, z),
                        (W / 2 + 0.4, H + 1.9, 0), (-W / 2 - 0.4, H + 1.9, 0), roof, 0.5)
    # chimney
    mb.add_box((W / 2 - 0.8, H + 1.3, D / 2 - 1.0), (0.8, 3.0, 0.8),
               mats.index_of("ConcreteDark"), 0.7)
    # porch
    sb.floor(-1.8, -D / 2 - 1.8, 1.8, -D / 2, 0.05, mats.index_of("WoodDark"), 0.7)
    for px in (-1.6, 1.6):
        mb.add_cylinder((px, 1.2, -D / 2 - 1.6), 0.1, 2.4, log, 8, 1.2)
    mb.add_box((0, 2.45, -D / 2 - 0.9), (3.8, 0.14, 2.2), roof, 0.5)
    # interior
    P.bed(mb, mats, -1.6, 0, 1.0, 0.0)
    P.workbench(mb, mats, 1.6, 0, 0.6, 1.57)
    P.crate_wood(mb, mats, 2.2, 0, -1.6, 0.7, rng)
    P.bed(mb, mats, 0.0, H - 0.3, 0.4, 0.0)
    sb.rubble_scatter(-W / 2, -D / 2, W / 2, D / 2, 12, mats.index_of("WoodDark"), rng)
    return mb


def factory_shed(mats, seed=9):
    """Industrial plant: high bay, pipework, tanks, control room."""
    rng = _rng(seed)
    mb = MeshBuilder()
    sb = StructureBuilder(mb, mats)
    W, D, H = 22.0, 14.0, 8.0
    wall = mats.index_of("ConcreteDark")
    steel = mats.index_of("RustyMetal")

    sb.floor(-W / 2, -D / 2, W / 2, D / 2, 0.0, mats.index_of("Concrete"), 0.35)
    sb.ceiling(-W / 2, -D / 2, W / 2, D / 2, H, steel, 0.4)
    sb.wall((-W / 2, -D / 2), (W / 2, -D / 2), 0, H, wall, [], 0.35)
    sb.wall((W / 2, -D / 2), (W / 2, D / 2), 0, H, wall,
            [(2.0, 5.0, 0, 4.5, "door"), (-6.0, -2.0, 5.0, 6.6, "window")], 0.35)
    sb.wall((W / 2, D / 2), (-W / 2, D / 2), 0, H, wall, [], 0.35)
    sb.wall((-W / 2, D / 2), (-W / 2, -D / 2), 0, H, wall, [], 0.35)
    # gantry crane
    for z in (-3.0, 3.0):
        sb.beam(-W / 2, z, W / 2, z, H - 1.2, 0.5, steel, 0.8)
    for i in range(4):
        x = -W / 2 + 3.0 + i * 5.0
        sb.beam(x, -3.0, x, 3.0, H - 1.0, 0.35, steel, 0.8)
    # pipework
    for i, yy in enumerate((H - 1.8, H - 2.2, H - 2.6)):
        P.pipe_run(mb, mats, -W / 2, D / 2 - 1.0 - i * 0.4, W / 2, D / 2 - 1.0 - i * 0.4, yy, 0.16)
    P.tank_vertical(mb, mats, -W / 2 + 3.0, 0, D / 2 - 4.0, 1.5, 5.0)
    P.tank_vertical(mb, mats, -W / 2 + 6.5, 0, D / 2 - 4.5, 1.2, 4.0)
    P.generator(mb, mats, W / 2 - 3.0, 0, -D / 2 + 2.0, 0.0)
    P.radio_console(mb, mats, W / 2 - 4.0, 0, D / 2 - 2.0, 3.14, powered=True)
    for i in range(5):
        P.barrel(mb, mats, -2.0 + i * 0.8, 0, -D / 2 + 1.5)
    sb.rubble_scatter(-W / 2, -D / 2, W / 2, D / 2, 34, mats.index_of("Concrete"), rng)
    return mb


def checkpoint(mats, seed=10):
    """Military checkpoint: barriers, guard tower, sandbags, vehicle block."""
    rng = _rng(seed)
    mb = MeshBuilder()
    sb = StructureBuilder(mb, mats)
    W, D = 12.0, 5.0
    H = 3.0
    wall = mats.index_of("ConcreteDark")

    sb.floor(-W / 2, -D / 2, W / 2, D / 2, 0.0, mats.index_of("Concrete"), 0.4)
    sb.wall((-W / 2, -D / 2), (-W / 2 + 1.0, -D / 2), 0, H, wall, [], 0.4)
    sb.wall((-W / 2, D / 2), (-W / 2 + 1.0, D / 2), 0, H, wall, [], 0.4)
    sb.wall((-W / 2 + 1.0, -D / 2), (-W / 2 + 1.0, D / 2), 0, H, wall,
            [(-1.2, 0.6, 0, 2.3, "door")], 0.4)
    sb.wall((W / 2 - 1.0, -D / 2), (W / 2, -D / 2), 0, H, wall, [], 0.4)
    sb.wall((W / 2 - 1.0, D / 2), (W / 2, D / 2), 0, H, wall, [], 0.4)
    sb.ceiling(-W / 2, -D / 2, W / 2, D / 2, H, wall, 0.4)
    P.desk(mb, mats, -W / 2 + 2.0, 0, 0.5, 1.57)
    P.locker(mb, mats, -W / 2 + 2.0, 0, -1.8, 0.0, 2)
    P.ammo_crate(mb, mats, -W / 2 + 3.4, 0, 1.6, 0.0)
    # barriers
    for i in range(3):
        P.barricade(mb, mats, -2.0 + i * 3.0, 0, -D / 2 + 0.6, 0.0)
    P.sandbag_wall(mb, mats, 3.0, 0, D / 2 - 1.0, 0.0, 4.0, 4)
    P.watchtower(mb, mats, W / 2 + 4.0, 0, 0.0, 8.0, rng)
    P.truck_wreck(mb, mats, W / 2 + 9.0, 0, -3.0, 0.3)
    P.fence_chain(mb, mats, -W / 2 - 6.0, D / 2, W / 2 + 2.0, D / 2, 0.0, 2.4)
    P.fence_chain(mb, mats, -W / 2 - 6.0, -D / 2, W / 2 + 2.0, -D / 2, 0.0, 2.4)
    return mb


def small_shed(mats, seed=11):
    """Generic outbuilding used to fill dead ground in the suburbs."""
    rng = _rng(seed)
    mb = MeshBuilder()
    sb = StructureBuilder(mb, mats)
    W, D, H = 4.5, 3.8, 2.5
    sb.floor(-W / 2, -D / 2, W / 2, D / 2, 0.0, mats.index_of("ConcreteDark"), 0.5)
    sb.wall((-W / 2, -D / 2), (W / 2, -D / 2), 0, H, mats.index_of("Wood"), door(0.0, 1.0, 2.05), 0.7)
    sb.wall((W / 2, -D / 2), (W / 2, D / 2), 0, H, mats.index_of("Wood"), [], 0.7)
    sb.wall((W / 2, D / 2), (-W / 2, D / 2), 0, H, mats.index_of("Wood"), [], 0.7)
    sb.wall((-W / 2, D / 2), (-W / 2, -D / 2), 0, H, mats.index_of("Wood"), [], 0.7)
    mb.add_box((0, H + 0.15, 0), (W + 0.5, 0.2, D + 0.5), mats.index_of("Corrugated"), 0.6)
    P.crate_wood(mb, mats, 1.0, 0, 0.8, 0.7, rng)
    P.barrel(mb, mats, -1.2, 0, 0.6)
    return mb


def watchtower_standalone(mats, seed=12):
    rng = _rng(seed)
    mb = MeshBuilder()
    P.watchtower(mb, mats, 0, 0, 0, 9.0, rng)
    P.barricade(mb, mats, 1.8, 0, 1.0, 0.4)
    P.sandbag_wall(mb, mats, -1.6, 0, 1.2, 0.0, 2.6, 3)
    return mb


def gas_station(mats, seed=13):
    rng = _rng(seed)
    mb = MeshBuilder()
    sb = StructureBuilder(mb, mats)
    # canopy
    for px in (-3.5, 3.5):
        mb.add_box((px, 2.2, 0), (0.4, 4.4, 0.4), mats.index_of("PaintedMetal"), 1.0)
    mb.add_box((0, 4.6, 0), (9.0, 0.5, 6.0), mats.index_of("PeelingPaint"), 0.6)
    mb.add_box((0, 4.3, 0), (8.6, 0.2, 5.6), mats.index_of("PaintedMetal"), 0.8)
    # pump islands
    for px in (-1.8, 1.8):
        mb.add_box((px, 0.15, 0), (1.0, 0.3, 3.0), mats.index_of("ConcreteDark"), 0.6)
        mb.add_box((px, 0.85, 0), (0.7, 1.1, 0.5), mats.index_of("PaintedMetal"), 1.2)
        mb.add_box((px, 1.5, 0), (0.8, 0.25, 0.6), mats.index_of("PaintedMetal"), 1.2)
    # kiosk
    kb = shop(mats, seed)
    return mb


BUILDINGS = {
    "house": house,
    "apartment_block": apartment_block,
    "warehouse": warehouse,
    "hospital_wing": hospital_wing,
    "bunker": bunker,
    "police_station": police_station,
    "shop": shop,
    "cabin": cabin,
    "factory_shed": factory_shed,
    "checkpoint": checkpoint,
    "small_shed": small_shed,
    "watchtower": watchtower_standalone,
}
