#!/usr/bin/env python3
# ============================================================================
#  ASHES OF HUMANITY: LAST SIGNAL
#  Character construction and animation.
#
#  Every creature is built from an original procedural skeleton with
#  species-specific proportions, silhouettes and animation.  Clips are
#  authored with a small forward-kinematics solver.
# ============================================================================
import math
import random

from mathutils import Euler, Matrix, Quaternion, Vector

from afbuild import Clip, MeshBuilder, Rig, bake_clip, compute_skin_weights


# ---------------------------------------------------------------------------
# Species definitions
# ---------------------------------------------------------------------------
SPECIES = {
    "player": dict(
        height=1.80, build=1.0, arm=1.0, leg=1.0, head=1.0, shoulder=1.0,
        skin="Skin", cloth="Fabric", hunch=0.02, gait=1.0, head_yaw=0.0,
        features=[], colors={"coat": "Fabric", "pants": "FabricDark", "pack": "Fabric"},
    ),
    "hollow": dict(
        height=1.92, build=0.88, arm=1.12, leg=0.95, head=0.94, shoulder=1.05,
        skin="SkinRotting", cloth=None, hunch=0.16, gait=0.92, head_yaw=0.25,
        features=["hollow_eyes", "gaunt_ribs", "long_fingers"], colors={},
    ),
    "crawler": dict(
        height=1.05, build=0.72, arm=1.25, leg=0.6, head=0.85, shoulder=0.9,
        skin="SkinRotting", cloth=None, hunch=0.55, gait=1.5, head_yaw=0.1,
        features=["quadruped", "long_tail", "spine_spikes"], colors={},
    ),
    "watcher": dict(
        height=2.35, build=0.7, arm=1.35, leg=1.25, head=0.8, shoulder=1.2,
        skin="SkinPale", cloth=None, hunch=0.1, gait=0.8, head_yaw=0.0,
        features=["tall_thin", "no_lower_legs", "faceless"], colors={},
    ),
    "screamer": dict(
        height=1.98, build=0.7, arm=1.2, leg=1.1, head=1.25, shoulder=0.95,
        skin="SkinRotting", cloth=None, hunch=0.08, gait=0.95, head_yaw=0.0,
        features=["swollen_jaw", "distended_neck", "claws"], colors={},
    ),
    "brute": dict(
        height=2.55, build=1.65, arm=1.15, leg=1.05, head=0.9, shoulder=1.5,
        skin="SkinRotting", cloth=None, hunch=0.22, gait=0.8, head_yaw=0.0,
        features=["armoured_plates", "huge_arms", "thick_neck"], colors={},
    ),
    "mimic": dict(
        height=1.84, build=1.0, arm=1.0, leg=1.0, head=1.0, shoulder=1.0,
        skin="Skin", cloth=None, hunch=0.04, gait=1.0, head_yaw=0.0,
        features=["patchwork_skin", "no_face"], colors={},
    ),
    "burrower": dict(
        height=1.30, build=1.15, arm=0.9, leg=0.55, head=0.7, shoulder=1.1,
        skin="SkinRotting", cloth=None, hunch=0.5, gait=1.3, head_yaw=0.0,
        features=["digging_claws", "wide_chest", "segmented_back"], colors={},
    ),
    "stalker": dict(
        height=2.12, build=0.75, arm=1.3, leg=1.2, head=0.82, shoulder=1.1,
        skin="SkinPale", cloth=None, hunch=0.06, gait=0.85, head_yaw=0.0,
        features=["tall_thin", "blade_arms", "elongated_head"], colors={},
    ),
    "contaminated": dict(
        height=2.05, build=1.25, arm=1.1, leg=0.95, head=1.05, shoulder=1.25,
        skin="SkinRotting", cloth=None, hunch=0.12, gait=0.9, head_yaw=0.0,
        features=["bloated_sacs", "radiation_glow"], colors={},
    ),
    "pale_one": dict(
        height=2.28, build=0.82, arm=1.28, leg=1.18, head=0.88, shoulder=1.15,
        skin="SkinPale", cloth=None, hunch=0.05, gait=0.9, head_yaw=0.0,
        features=["tall_thin", "pale_skin", "claw_hands"], colors={},
    ),
    # ---- bosses ----
    "boss_hollow_king": dict(
        height=2.75, build=1.35, arm=1.2, leg=1.0, head=1.15, shoulder=1.55,
        skin="SkinRotting", cloth="Leather", hunch=0.14, gait=0.85, head_yaw=0.0,
        features=["crown_spikes", "armoured_plates", "huge_arms", "hollow_eyes",
                  "tattered_cloak"], colors={"cloak": "FabricRed"},
    ),
    "boss_iron_abomination": dict(
        height=3.05, build=1.9, arm=1.3, leg=0.95, head=0.85, shoulder=1.8,
        skin="Gunmetal", cloth=None, hunch=0.3, gait=0.7, head_yaw=0.0,
        features=["iron_plates", "huge_arms", "pipes", "no_lower_legs",
                  "vent_steam"], colors={},
    ),
    "boss_forest_matriarch": dict(
        height=2.95, build=1.3, arm=1.35, leg=1.05, head=0.9, shoulder=1.35,
        skin="Bark", cloth=None, hunch=0.08, gait=0.85, head_yaw=0.0,
        features=["root_legs", "branch_horns", "bark_skin", "wide_hips"],
        colors={},
    ),
    "boss_contaminated_titan": dict(
        height=3.35, build=2.0, arm=1.25, leg=0.9, head=0.8, shoulder=1.9,
        skin="SkinRotting", cloth=None, hunch=0.28, gait=0.65, head_yaw=0.0,
        features=["bloated_sacs", "radiation_glow", "armoured_plates", "huge_arms"],
        colors={},
    ),
    "boss_pale_commander": dict(
        height=2.90, build=1.05, arm=1.35, leg=1.2, head=0.9, shoulder=1.35,
        skin="SkinPale", cloth="Leather", hunch=0.04, gait=0.9, head_yaw=0.0,
        features=["tall_thin", "military_coat", "blade_arms", "helmet",
                  "pale_skin"], colors={"coat": "FabricDark"},
    ),
    "boss_last_signal": dict(
        height=3.10, build=1.25, arm=1.3, leg=1.1, head=0.95, shoulder=1.45,
        skin="SkinPale", cloth=None, hunch=0.05, gait=0.85, head_yaw=0.0,
        features=["tall_thin", "antenna_head", "emissive_core", "pale_skin",
                  "tattered_cloak"], colors={"cloak": "FabricDark"},
    ),
}


# ---------------------------------------------------------------------------
# Skeleton construction
# ---------------------------------------------------------------------------
def build_rig(spec):
    """Creates the bone hierarchy for a species."""
    H = spec["height"]
    arm = spec["arm"]
    leg = spec["leg"]
    head = spec["head"]
    sh = spec["shoulder"]
    build = spec["build"]

    hip_y = H * 0.50
    chest_y = hip_y + H * 0.20
    neck_y = chest_y + H * 0.09
    head_y = neck_y + H * 0.04

    thigh_len = H * 0.245 * leg
    shin_len = H * 0.235 * leg
    upperarm_len = H * 0.185 * arm
    forearm_len = H * 0.165 * arm
    shoulder_w = H * 0.105 * sh * build
    hip_w = H * 0.062 * build

    r = Rig()
    r.add("root", (0, 0, 0), (0, H * 0.06, 0), None)
    r.add("hips", (0, hip_y, 0), (0, hip_y + H * 0.05, 0), "root")
    r.add("spine", (0, hip_y, 0), (0, hip_y + H * 0.13, 0), "hips")
    r.add("chest", (0, chest_y - H * 0.04, 0), (0, chest_y, 0), "spine")
    r.add("neck", (0, neck_y - H * 0.02, 0), (0, neck_y, 0), "chest")
    r.add("head", (0, neck_y, 0), (0, neck_y + H * 0.09 * head, 0), "neck")
    for side, s in (("L", 1.0), ("R", -1.0)):
        r.add("shoulder." + side, (s * H * 0.02, chest_y - H * 0.02, 0),
              (s * shoulder_w, chest_y, 0), "chest")
        r.add("upperarm." + side, (s * shoulder_w, chest_y, 0),
              (s * (shoulder_w + H * 0.01), chest_y - upperarm_len, 0), "shoulder." + side)
        r.add("forearm." + side, (s * (shoulder_w + H * 0.01), chest_y - upperarm_len, 0),
              (s * (shoulder_w + H * 0.015), chest_y - upperarm_len - forearm_len, 0),
              "upperarm." + side)
        r.add("hand." + side, (s * (shoulder_w + H * 0.015), chest_y - upperarm_len - forearm_len, 0),
              (s * (shoulder_w + H * 0.02), chest_y - upperarm_len - forearm_len - H * 0.055, 0),
              "forearm." + side)
        r.add("thigh." + side, (s * hip_w, hip_y, 0), (s * hip_w, hip_y - thigh_len, 0), "hips")
        r.add("shin." + side, (s * hip_w, hip_y - thigh_len, 0),
              (s * hip_w, hip_y - thigh_len - shin_len, 0), "thigh." + side)
        r.add("foot." + side, (s * hip_w, hip_y - thigh_len - shin_len, 0),
              (s * hip_w, hip_y - thigh_len - shin_len + H * 0.02, H * 0.085), "shin." + side)
    return r


# ---------------------------------------------------------------------------
# Body geometry
# ---------------------------------------------------------------------------
def build_body(spec, mats, rng):
    """Builds the creature mesh from the rig."""
    mb = MeshBuilder()
    rig = build_rig(spec)
    H = spec["height"]
    build = spec["build"]
    skin = mats.index_of(spec.get("skin", "Skin"))
    cloth = mats.index_of(spec.get("cloth")) if spec.get("cloth") else -1
    feats = set(spec.get("features", []))

    def bp(name):
        b = rig.by_name[name]
        return b.head, b.tail

    # ---- torso ----
    hips_h, hips_t = bp("hips")
    chest_h, chest_t = bp("chest")
    head_h, head_t = bp("head")
    neck_h, _ = bp("neck")
    torso_w = H * 0.115 * build
    chest_w = H * 0.128 * build
    mb.add_box((0, (hips_h.y + chest_t.y) * 0.5, 0),
               (torso_w * 2, chest_t.y - hips_h.y + H * 0.03, H * 0.075 * build), skin, 1.1)
    mb.add_box((0, chest_t.y - H * 0.035, 0),
               (chest_w * 2, H * 0.085 * build, H * 0.082 * build), skin, 1.1)
    # shoulders
    for side, s in (("L", 1.0), ("R", -1.0)):
        sh_h, sh_t = bp("shoulder." + side)
        mb.add_capsule_limb(sh_h, sh_t, H * 0.045 * build, H * 0.04 * build, skin, 8, 1.2)
    # neck
    mb.add_capsule_limb(neck_h, head_h, H * 0.035 * build, H * 0.033 * build, skin, 8, 1.2)
    # head
    head_r = H * 0.058 * spec["head"]
    mb.add_sphere((head_h.x, head_h.y + head_r * 0.55, head_h.z),
                  head_r, skin, 7, 12, 1.2, squash=(0.92, 1.12, 1.0))
    mb.add_box((head_h.x, head_h.y + head_r * 0.28, head_h.z + head_r * 0.72),
               (head_r * 1.1, head_r * 0.5, head_r * 0.45), skin, 1.6)

    # ---- limbs ----
    for side in ("L", "R"):
        ua_h, ua_t = bp("upperarm." + side)
        fa_h, fa_t = bp("forearm." + side)
        hd_h, hd_t = bp("hand." + side)
        th_h, th_t = bp("thigh." + side)
        sh_h, sh_t = bp("shin." + side)
        ft_h, ft_t = bp("foot." + side)
        arm_r = H * 0.032 * build
        leg_r = H * 0.038 * build
        mb.add_capsule_limb(ua_h, ua_t, arm_r, arm_r * 0.85, skin, 8, 1.2)
        mb.add_capsule_limb(fa_h, fa_t, arm_r * 0.85, arm_r * 0.7, skin, 8, 1.2)
        mb.add_capsule_limb(hd_h, hd_t, arm_r * 0.8, arm_r * 0.55, skin, 7, 1.4)
        mb.add_capsule_limb(th_h, th_t, leg_r, leg_r * 0.8, skin, 8, 1.2)
        mb.add_capsule_limb(sh_h, sh_t, leg_r * 0.8, leg_r * 0.6, skin, 8, 1.2)
        mb.add_box((ft_h.x, ft_h.y + H * 0.008, ft_h.z + H * 0.025),
                   (leg_r * 2.0, H * 0.028, H * 0.075), skin, 1.4)

    # ---- species features ----
    if "hollow_eyes" in feats:
        eye = mats.index_of("EmissiveRed")
        for s in (-1, 1):
            mb.add_box((head_h.x + s * head_r * 0.36, head_h.y + head_r * 0.6,
                        head_h.z + head_r * 0.78), (head_r * 0.22, head_r * 0.14, head_r * 0.06),
                       eye, 2.0, color=(1.0, 0.35, 0.2, 1.0))
    if "faceless" in feats:
        pass
    if "no_face" in feats:
        pass
    if "gaunt_ribs" in feats:
        for i in range(5):
            yy = chest_t.y - H * 0.06 + i * H * 0.022
            mb.add_box((0, yy, H * 0.04), (torso_w * 1.5, H * 0.012, H * 0.012), skin, 2.0)
    if "long_fingers" in feats:
        for side, s in (("L", 1.0), ("R", -1.0)):
            hd_h, hd_t = bp("hand." + side)
            for i in range(4):
                off = (i - 1.5) * H * 0.012
                mb.add_capsule_limb((hd_t.x + off, hd_t.y, hd_t.z),
                                    (hd_t.x + off, hd_t.y - H * 0.075, hd_t.z + H * 0.012),
                                    H * 0.006, H * 0.003, skin, 5, 2.0)
    if "claws" in feats or "claw_hands" in feats:
        for side, s in (("L", 1.0), ("R", -1.0)):
            hd_h, hd_t = bp("hand." + side)
            for i in range(3):
                off = (i - 1.0) * H * 0.018
                mb.add_capsule_limb((hd_t.x + off, hd_t.y - H * 0.01, hd_t.z),
                                    (hd_t.x + off, hd_t.y - H * 0.065, hd_t.z + H * 0.025),
                                    H * 0.007, H * 0.0015, mats.index_of("Gunmetal"), 5, 2.0)
    if "blade_arms" in feats:
        for side, s in (("L", 1.0), ("R", -1.0)):
            fa_h, fa_t = bp("forearm." + side)
            hd_h, hd_t = bp("hand." + side)
            mb.add_box(((fa_t.x + hd_t.x) * 0.5, (fa_t.y + hd_t.y) * 0.5, hd_t.z + H * 0.03),
                       (H * 0.03, H * 0.22, H * 0.012), mats.index_of("Gunmetal"), 2.0)
    if "armoured_plates" in feats:
        plate = mats.index_of("RustyMetal")
        for i in range(4):
            yy = chest_t.y - H * 0.07 + i * H * 0.032
            mb.add_box((0, yy, H * 0.045), (chest_w * 1.9, H * 0.022, H * 0.03), plate, 1.6)
        for side, s in (("L", 1.0), ("R", -1.0)):
            ua_h, ua_t = bp("upperarm." + side)
            mb.add_sphere((ua_h.x, ua_h.y, ua_h.z), H * 0.05 * build, plate, 5, 9, 1.6)
    if "iron_plates" in feats:
        plate = mats.index_of("Gunmetal")
        for i in range(5):
            yy = chest_t.y - H * 0.09 + i * H * 0.036
            mb.add_box((0, yy, H * 0.05), (chest_w * 2.0, H * 0.026, H * 0.036), plate, 1.6)
        for side, s in (("L", 1.0), ("R", -1.0)):
            ua_h, ua_t = bp("upperarm." + side)
            fa_h, fa_t = bp("forearm." + side)
            mb.add_box((ua_h.x, (ua_h.y + ua_t.y) * 0.5, ua_h.z), (H * 0.07, H * 0.12, H * 0.07), plate, 1.6)
            mb.add_box((fa_h.x, (fa_h.y + fa_t.y) * 0.5, fa_h.z), (H * 0.06, H * 0.11, H * 0.06), plate, 1.6)
    if "spine_spikes" in feats:
        for i in range(7):
            t = i / 6.0
            yy = hips_h.y + t * (chest_t.y - hips_h.y)
            mb.add_capsule_limb((0, yy, -H * 0.035), (0, yy + H * 0.03, -H * 0.075),
                                H * 0.012, H * 0.002, skin, 5, 2.0)
    if "segmented_back" in feats:
        for i in range(6):
            t = i / 5.0
            yy = hips_h.y + t * (chest_t.y - hips_h.y)
            mb.add_box((0, yy, -H * 0.045), (H * 0.09, H * 0.03, H * 0.02), skin, 1.6)
    if "swollen_jaw" in feats:
        mb.add_sphere((head_h.x, head_h.y + head_r * 0.05, head_h.z + head_r * 0.55),
                      head_r * 0.78, skin, 6, 10, 1.4, squash=(1.0, 0.8, 1.1))
    if "distended_neck" in feats:
        mb.add_sphere((neck_h.x, neck_h.y + H * 0.01, neck_h.z), H * 0.045, skin, 5, 9, 1.4)
    if "bloated_sacs" in feats:
        for i in range(5):
            a = i * 1.25
            rr = H * 0.055
            mb.add_sphere((math.cos(a) * H * 0.05, hips_h.y + H * 0.05 + i * H * 0.02,
                           math.sin(a) * H * 0.05), rr, skin, 5, 9, 1.2)
    if "radiation_glow" in feats:
        glow = mats.index_of("EmissiveGreen")
        for i in range(6):
            a = i * 1.05
            mb.add_sphere((math.cos(a) * H * 0.055, hips_h.y + H * 0.04 + i * H * 0.025,
                           math.sin(a) * H * 0.055), H * 0.02, glow, 4, 7, 2.0,
                       color=(0.35, 1.0, 0.45, 1.0))
    if "thick_neck" in feats:
        mb.add_capsule_limb(neck_h, head_h, H * 0.05 * build, H * 0.048 * build, skin, 8, 1.2)
    if "huge_arms" in feats:
        for side, s in (("L", 1.0), ("R", -1.0)):
            ua_h, ua_t = bp("upperarm." + side)
            fa_h, fa_t = bp("forearm." + side)
            mb.add_capsule_limb(ua_h, ua_t, H * 0.05, H * 0.042, skin, 8, 1.2)
            mb.add_capsule_limb(fa_h, fa_t, H * 0.042, H * 0.032, skin, 8, 1.2)
    if "crown_spikes" in feats:
        for i in range(7):
            a = -1.1 + i * 0.36
            base = (head_h.x + math.sin(a) * head_r * 0.9, head_h.y + head_r * 1.05,
                    head_h.z + math.cos(a) * head_r * 0.55 - head_r * 0.1)
            mb.add_capsule_limb(base, (base[0], base[1] + H * 0.09, base[2] - H * 0.02),
                                H * 0.016, H * 0.002, mats.index_of("Gunmetal"), 6, 1.6)
    if "branch_horns" in feats:
        for s in (-1, 1):
            base = (head_h.x + s * head_r * 0.55, head_h.y + head_r * 0.9, head_h.z)
            tip = (base[0] + s * H * 0.08, base[1] + H * 0.11, base[2] - H * 0.05)
            mb.add_capsule_limb(base, tip, H * 0.018, H * 0.005, mats.index_of("Bark"), 6, 1.4)
            for k in range(3):
                t = 0.3 + k * 0.25
                p = (base[0] + (tip[0] - base[0]) * t, base[1] + (tip[1] - base[1]) * t,
                     base[2] + (tip[2] - base[2]) * t)
                mb.add_capsule_limb(p, (p[0] + s * H * 0.04, p[1] + H * 0.04, p[2] - H * 0.02),
                                    H * 0.009, H * 0.002, mats.index_of("Bark"), 5, 1.6)
    if "pipes" in feats:
        for s in (-1, 1):
            ua_h, ua_t = bp("upperarm." + side)
            mb.add_cylinder((ua_h.x + s * H * 0.03, (ua_h.y + ua_t.y) * 0.5, ua_h.z - H * 0.05),
                            H * 0.014, H * 0.16, mats.index_of("RustyMetal"), 8, 1.6)
    if "antenna_head" in feats:
        for i in range(3):
            a = -0.4 + i * 0.4
            base = (head_h.x + math.sin(a) * head_r * 0.5, head_h.y + head_r * 1.2, head_h.z)
            mb.add_cylinder(base, H * 0.006, H * 0.13, mats.index_of("Gunmetal"), 6, 2.0)
            mb.add_sphere((base[0], base[1] + H * 0.13, base[2]), H * 0.011,
                          mats.index_of("EmissiveCyan"), 4, 7, 2.0, color=(0.4, 0.9, 1.0, 1.0))
    if "emissive_core" in feats:
        mb.add_sphere((0, chest_t.y - H * 0.03, H * 0.055), H * 0.035,
                      mats.index_of("EmissiveCyan"), 6, 10, 2.0, color=(0.45, 0.95, 1.0, 1.0))
    if "root_legs" in feats:
        for side, s in (("L", 1.0), ("R", -1.0)):
            th_h, th_t = bp("thigh." + side)
            sh_h, sh_t = bp("shin." + side)
            mb.add_capsule_limb((th_h.x, th_h.y, th_h.z), (sh_h.x, sh_h.y, sh_h.z),
                                H * 0.055, H * 0.03, mats.index_of("Bark"), 7, 1.2)
    if "patchwork_skin" in feats:
        other = mats.index_of("SkinPale")
        for i in range(6):
            a = i * 1.05
            mb.add_box((math.cos(a) * H * 0.055, hips_h.y + H * 0.03 + i * H * 0.02,
                        math.sin(a) * H * 0.055), (H * 0.05, H * 0.05, H * 0.012), other, 1.6)
    if "helmet" in feats:
        mb.add_sphere((head_h.x, head_h.y + head_r * 0.6, head_h.z), head_r * 1.08,
                      mats.index_of("PaintedMetalGreen"), 6, 12, 1.6, squash=(1.0, 0.85, 1.05))
    if "digging_claws" in feats:
        for side, s in (("L", 1.0), ("R", -1.0)):
            hd_h, hd_t = bp("hand." + side)
            for i in range(3):
                off = (i - 1.0) * H * 0.03
                mb.add_capsule_limb((hd_t.x + off, hd_t.y, hd_t.z),
                                    (hd_t.x + off, hd_t.y - H * 0.07, hd_t.z + H * 0.03),
                                    H * 0.009, H * 0.002, mats.index_of("Gunmetal"), 5, 2.0)
    if "long_tail" in feats:
        pts = [(0, hips_h.y - H * 0.02, -H * 0.05)]
        for i in range(1, 6):
            t = i / 5.0
            pts.append((0, hips_h.y - H * 0.02 - H * 0.03 * math.sin(t * 2.2),
                        -H * 0.05 - H * 0.26 * t))
        for i in range(len(pts) - 1):
            mb.add_capsule_limb(pts[i], pts[i + 1], H * 0.02 * (1 - i / 6.0), H * 0.016 * (1 - i / 6.0),
                                skin, 6, 1.4)

    # ---- clothing ----
    if cloth >= 0:
        c = mats.index_of(spec.get("cloth"))
        mb.add_box((0, hips_h.y + H * 0.02, 0), (torso_w * 2.05, H * 0.16, H * 0.085 * build), c, 1.2)
        for side, s in (("L", 1.0), ("R", -1.0)):
            ua_h, ua_t = bp("upperarm." + side)
            mb.add_capsule_limb(ua_h, ua_t, H * 0.036 * build, H * 0.03 * build, c, 7, 1.2)
    if "tattered_cloak" in feats:
        c = mats.index_of(spec.get("colors", {}).get("cloak", "FabricRed"))
        for i in range(7):
            t = i / 6.0
            yy = chest_t.y - H * 0.06 - t * H * 0.42
            ww = chest_w * (2.1 + t * 0.5)
            mb.add_box((0, yy, -H * 0.05 - t * H * 0.01), (ww, H * 0.07, H * 0.012), c, 1.0)
    if "military_coat" in feats:
        c = mats.index_of("FabricDark")
        mb.add_box((0, hips_h.y + H * 0.03, 0), (torso_w * 2.1, H * 0.36, H * 0.09), c, 1.0)
    if spec["name"] == "player":
        pack = mats.index_of("Fabric")
        mb.add_box((0, hips_h.y + H * 0.08, -H * 0.075), (H * 0.16, H * 0.2, H * 0.07), pack, 1.2)
        for side, s in (("L", 1.0), ("R", -1.0)):
            th_h, th_t = bp("thigh." + side)
            mb.add_capsule_limb((th_h.x, th_h.y, th_h.z), (th_h.x, th_h.y - H * 0.24, th_h.z),
                                H * 0.045 * build, H * 0.036 * build, mats.index_of("FabricDark"), 7, 1.2)

    return mb, rig


# ---------------------------------------------------------------------------
# Animation authoring
# ---------------------------------------------------------------------------
def _pose_matrix(rig, pose, rest_local):
    """Computes world matrices for a pose dict {bone: (euler_xyz, offset)}."""
    world = {}
    for i, b in enumerate(rig.bones):
        rest = rest_local[i]
        if b.name in pose:
            eul, off = pose[b.name]
            local = rest @ Matrix.Translation(Vector(off)) @ Euler(eul, 'XYZ').to_matrix().to_4x4()
        else:
            local = rest
        if b.parent is None:
            world[b.name] = local
        else:
            world[b.name] = world[b.parent] @ local
    return world


def _clip_from_fn(rig, rest_local, name, duration, fn, fps=30.0, loop=True):
    frames = []
    steps = max(2, int(duration * fps))
    for i in range(steps + 1):
        t = duration * i / steps
        frames.append((t, _pose_matrix(rig, fn(t), rest_local)))
    c = Clip(name, duration, fps, loop)
    bake_clip(rig, c, frames)
    return c


def author_clips(spec, rig):
    """Produces the animation set for a species."""
    H = spec["height"]
    rest_local = rig.rest_local()
    gait = spec.get("gait", 1.0)
    hunch = spec.get("hunch", 0.0)
    clips = []

    def base_pose():
        p = {}
        p["root"] = ((0, 0, 0), (0, 0, 0))
        p["hips"] = ((hunch * 0.25, 0, 0), (0, 0, 0))
        p["spine"] = ((hunch * 0.25, 0, 0), (0, 0, 0))
        p["chest"] = ((hunch * 0.3, 0, 0), (0, 0, 0))
        p["head"] = ((-hunch * 0.25, 0, 0), (0, 0, 0))
        for side in ("L", "R"):
            p["upperarm." + side] = ((0.05, 0, 0), (0, 0, 0))
            p["forearm." + side] = ((0.25, 0, 0), (0, 0, 0))
            p["hand." + side] = ((0, 0, 0), (0, 0, 0))
            p["thigh." + side] = ((0, 0, 0), (0, 0, 0))
            p["shin." + side] = ((0, 0, 0), (0, 0, 0))
            p["foot." + side] = ((0, 0, 0), (0, 0, 0))
        return p

    def merge(a, b):
        p = dict(a)
        p.update(b)
        return p

    # ---- idle ----
    def idle_fn(t):
        p = base_pose()
        br = math.sin(t * 1.6) * 0.035
        p["chest"] = ((hunch * 0.3, br * 0.4, 0), (0, 0, 0))
        p["head"] = ((-hunch * 0.25 + math.sin(t * 0.7) * 0.05,
                      math.sin(t * 0.53) * 0.16, 0), (0, 0, 0))
        p["upperarm.L"] = ((0.05 + math.sin(t * 1.1) * 0.03, 0, 0), (0, 0, 0))
        p["upperarm.R"] = ((0.05 - math.sin(t * 1.1) * 0.03, 0, 0), (0, 0, 0))
        p["root"] = ((0, 0, 0), (0, math.sin(t * 1.6) * H * 0.006, 0))
        return p
    clips.append(_clip_from_fn(rig, rest_local, "idle", 3.0, idle_fn))

    # ---- walk ----
    def walk_fn(t):
        p = base_pose()
        ph = t * 4.2 * gait
        sw = math.sin(ph) * 0.42
        sw2 = math.sin(ph + math.pi) * 0.42
        p["thigh.L"] = ((sw, 0, 0), (0, 0, 0))
        p["thigh.R"] = ((sw2, 0, 0), (0, 0, 0))
        p["shin.L"] = ((max(0.0, -math.sin(ph - 0.9)) * 0.8, 0, 0), (0, 0, 0))
        p["shin.R"] = ((max(0.0, -math.sin(ph + math.pi - 0.9)) * 0.8, 0, 0), (0, 0, 0))
        p["foot.L"] = ((max(0.0, math.sin(ph - 0.4)) * 0.3, 0, 0), (0, 0, 0))
        p["foot.R"] = ((max(0.0, math.sin(ph + math.pi - 0.4)) * 0.3, 0, 0), (0, 0, 0))
        p["upperarm.L"] = ((-sw * 0.55, 0, 0.06), (0, 0, 0))
        p["upperarm.R"] = ((-sw2 * 0.55, 0, -0.06), (0, 0, 0))
        p["hips"] = ((hunch * 0.25, math.sin(ph) * 0.05, 0), (0, 0, 0))
        p["root"] = ((0, 0, 0), (0, abs(math.sin(ph)) * H * 0.014, 0))
        p["head"] = ((-hunch * 0.25, -math.sin(ph) * 0.04, 0), (0, 0, 0))
        return p
    clips.append(_clip_from_fn(rig, rest_local, "walk", 1.45 / gait, walk_fn))

    # ---- run ----
    def run_fn(t):
        p = base_pose()
        ph = t * 7.4 * gait
        sw = math.sin(ph) * 0.72
        sw2 = math.sin(ph + math.pi) * 0.72
        p["thigh.L"] = ((sw, 0, 0), (0, 0, 0))
        p["thigh.R"] = ((sw2, 0, 0), (0, 0, 0))
        p["shin.L"] = ((max(0.0, -math.sin(ph - 1.1)) * 1.5, 0, 0), (0, 0, 0))
        p["shin.R"] = ((max(0.0, -math.sin(ph + math.pi - 1.1)) * 1.5, 0, 0), (0, 0, 0))
        p["upperarm.L"] = ((-sw * 0.85, 0, 0.12), (0, 0, 0))
        p["upperarm.R"] = ((-sw2 * 0.85, 0, -0.12), (0, 0, 0))
        p["forearm.L"] = ((0.9, 0, 0), (0, 0, 0))
        p["forearm.R"] = ((0.9, 0, 0), (0, 0, 0))
        p["hips"] = ((hunch * 0.3, math.sin(ph) * 0.09, 0), (0, 0, 0))
        p["chest"] = ((hunch * 0.35, -math.sin(ph) * 0.06, 0), (0, 0, 0))
        p["root"] = ((0.10, 0, 0), (0, abs(math.sin(ph)) * H * 0.03, 0))
        p["head"] = ((-hunch * 0.3 + 0.12, 0, 0), (0, 0, 0))
        return p
    clips.append(_clip_from_fn(rig, rest_local, "run", 0.95 / gait, run_fn))

    # ---- attack (claw swipe) ----
    def attack_fn(t):
        p = base_pose()
        k = min(1.0, t / 0.45)
        wind = max(0.0, 1.0 - abs(t - 0.18) / 0.18)
        strike = max(0.0, 1.0 - abs(t - 0.42) / 0.22)
        p["upperarm.R"] = ((-1.2 * wind + 0.9 * strike, -0.6 * wind + 0.9 * strike, 0.3),
                           (0, 0, 0))
        p["forearm.R"] = ((0.7 - 0.9 * strike, 0, 0), (0, 0, 0))
        p["chest"] = ((hunch * 0.3 + 0.18 * strike, -0.35 * wind + 0.45 * strike, 0), (0, 0, 0))
        p["head"] = ((-hunch * 0.2 + 0.2 * strike, -0.2 * wind, 0), (0, 0, 0))
        p["root"] = ((0, 0, 0), (0, 0, -H * 0.02 * strike))
        p["thigh.L"] = ((0.25 * strike, 0, 0), (0, 0, 0))
        return p
    clips.append(_clip_from_fn(rig, rest_local, "attack", 0.8, attack_fn, loop=False))

    # ---- hit reaction ----
    def hit_fn(t):
        p = base_pose()
        k = max(0.0, 1.0 - t / 0.35)
        p["chest"] = ((-0.45 * k + hunch * 0.3, 0.1 * k, 0), (0, 0, 0))
        p["head"] = ((-0.5 * k - hunch * 0.25, 0.2 * k, 0), (0, 0, 0))
        p["root"] = ((-0.1 * k, 0, 0), (0, 0, -H * 0.01 * k))
        p["upperarm.L"] = ((0.4 * k, 0, 0.3 * k), (0, 0, 0))
        p["upperarm.R"] = ((0.4 * k, 0, -0.3 * k), (0, 0, 0))
        return p
    clips.append(_clip_from_fn(rig, rest_local, "hit", 0.45, hit_fn, loop=False))

    # ---- death ----
    def death_fn(t):
        p = base_pose()
        k = min(1.0, t / 0.9)
        p["root"] = ((0, 0, 0), (0, -H * 0.42 * k, 0))
        p["hips"] = ((1.2 * k + hunch * 0.25, 0, 0.15 * k), (0, 0, 0))
        p["spine"] = ((0.5 * k, 0, 0), (0, 0, 0))
        p["chest"] = ((0.3 * k, 0, 0), (0, 0, 0))
        p["head"] = ((0.6 * k, 0.2 * k, 0), (0, 0, 0))
        for side, s in (("L", 1.0), ("R", -1.0)):
            p["upperarm." + side] = ((0.5 * k, 0, s * 0.4 * k), (0, 0, 0))
            p["thigh." + side] = ((0.8 * k, 0, 0), (0, 0, 0))
            p["shin." + side] = ((0.9 * k, 0, 0), (0, 0, 0))
        return p
    clips.append(_clip_from_fn(rig, rest_local, "death", 1.1, death_fn, loop=False))

    # ---- scream (species specific) ----
    def scream_fn(t):
        p = base_pose()
        w = math.sin(min(1.0, t / 0.3) * math.pi * 0.5)
        p["head"] = ((-0.45 * w, 0, 0), (0, 0, -H * 0.01 * w))
        p["neck"] = ((0.2 * w, 0, 0), (0, 0, 0))
        p["chest"] = ((-0.25 * w + hunch * 0.3, 0, 0), (0, 0, 0))
        p["upperarm.L"] = ((-0.9 * w, 0.3 * w, 0.5 * w), (0, 0, 0))
        p["upperarm.R"] = ((-0.9 * w, -0.3 * w, -0.5 * w), (0, 0, 0))
        p["forearm.L"] = ((0.6 * w, 0, 0), (0, 0, 0))
        p["forearm.R"] = ((0.6 * w, 0, 0), (0, 0, 0))
        p["root"] = ((0, 0, 0), (0, 0, 0))
        return p
    clips.append(_clip_from_fn(rig, rest_local, "scream", 1.4, scream_fn))

    # ---- lunge ----
    def lunge_fn(t):
        p = base_pose()
        k = min(1.0, t / 0.35)
        p["root"] = ((0.25 * k, 0, 0), (0, 0, -H * 0.05 * k))
        p["hips"] = ((hunch * 0.35, 0, 0), (0, 0, 0))
        p["upperarm.L"] = ((-1.3 * k, 0.2 * k, 0.2), (0, 0, 0))
        p["upperarm.R"] = ((-1.3 * k, -0.2 * k, -0.2), (0, 0, 0))
        p["thigh.L"] = ((-0.5 * k, 0, 0), (0, 0, 0))
        p["thigh.R"] = ((0.4 * k, 0, 0), (0, 0, 0))
        return p
    clips.append(_clip_from_fn(rig, rest_local, "lunge", 0.6, lunge_fn, loop=False))

    return clips
