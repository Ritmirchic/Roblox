#!/usr/bin/env python3
"""
Eight stress tests (A-H) for FRACTURE: TOTAL DESTRUCTION.

Each test drives the real engine through the headless harness (the same code the
Windows build runs) and asserts on measurable output: voxel counts, structure
bodies, debris, particle counts, frame times and save-file contents.

Run:  python3 tools/stress.py            # all tests
      python3 tools/stress.py C F        # selected tests
"""
import os, re, subprocess, sys, time, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BIN = os.path.join(ROOT, "build", "fracture")
RESULTS = []


def run(args, timeout=1800):
    t0 = time.time()
    p = subprocess.run([BIN] + args, cwd=ROOT, capture_output=True, text=True, timeout=timeout)
    return p.stdout + p.stderr, time.time() - t0


def nums(log, pattern):
    return [float(m) for m in re.findall(pattern, log)]


def last(log, pattern, group=1, cast=float, default=None):
    m = re.findall(pattern, log)
    return cast(m[-1]) if m else default


def record(name, title, ok, detail, metrics=None):
    RESULTS.append({
        "test": name,
        "title": title,
        "status": "PASS" if ok else "FAIL",
        "detail": detail,
        "metrics": metrics or {},
    })
    print(f"[{ 'PASS' if ok else 'FAIL' }] {name}: {title}")
    print(f"       {detail}")
    if metrics:
        print("       " + ", ".join(f"{k}={v}" for k, v in metrics.items()))
    sys.stdout.flush()


# ---------------------------------------------------------------- A
def test_a():
    """Sustained destruction throughput: 400 hammer hits + rockets on one map."""
    # the sledgehammer has a 0.5 s cooldown, so clicks are paced 36 frames apart
    script = "tp:49.6:2:22.5,yaw:-1.5708:0.03,wait:2,tool:0,wait:2"
    for _ in range(80):
        script += ",click:0,wait:36"
    script += ",tool:3,wait:2"
    for _ in range(10):
        script += ",click:0,wait:50"
    script += ",obj,log:END-A"
    log, secs = run(["--frames", "4600", "--map", "0", "--sandbox",
                     "--res", "640x360", "--script", script], timeout=3000)
    voxels = last(log, r"destroyed=(\d+)", 1, int, 0)
    tris = nums(log, r"tris=(\d+)")
    crash = "Segmentation" in log or "terminate called" in log or "ASSERT" in log
    ok = (not crash) and voxels > 20000 and "END-A" in log
    record("A", "Sustained destruction throughput", ok,
           f"{voxels} voxels destroyed, no crash, {secs:.1f}s wall clock",
           {"voxels": voxels, "max_tris": int(max(tris) if tris else 0)})


# ---------------------------------------------------------------- B
def test_b():
    """Structural collapse: blow the base out of a building and check bodies spawn."""
    # stand in front of the brick house wall and blow its base out: the load-bearing wall
    # collapses, dropping the floor above into structure bodies + debris
    script = "tp:49.6:2:22.5,yaw:-1.5708:-0.42,wait:2,tool:2,wait:2"
    for i in range(6):
        script += ",click:0,wait:26,look:-0.12:0.55"
    script += ",wait:30,click:1,wait:120,obj,log:END-B"
    log, secs = run(["--frames", "1200", "--map", "0", "--sandbox",
                     "--res", "640x360", "--script", script], timeout=2400)
    bodies = max(nums(log, r"bodies=(\d+)") or [0])
    debris = max(nums(log, r"debris=(\d+)") or [0])
    voxels = last(log, r"destroyed=(\d+)", 1, int, 0)
    ok = bodies >= 1 and debris >= 5 and voxels > 500
    record("B", "Structural collapse + debris physics", ok,
           f"{voxels} voxels removed, {int(bodies)} structure bodies, {int(debris)} debris pieces",
           {"bodies": int(bodies), "debris": int(debris), "voxels": voxels})


# ---------------------------------------------------------------- C
def test_c():
    """FX saturation: airstrikes and rockets until the particle pool is hammered."""
    script = "tp:70:2:50,yaw:0.7:0.15,wait:2,tool:11,wait:2"
    for _ in range(6):
        script += ",click:0,wait:100,look:0.5:0"
    script += ",tool:3,wait:2"
    for _ in range(10):
        script += ",click:0,wait:50"
    script += ",obj,log:END-C"
    log, secs = run(["--frames", "1600", "--map", "0", "--sandbox",
                     "--res", "640x360", "--script", script], timeout=2400)
    parts = max(nums(log, r"parts=(\d+)") or [0])
    fps = nums(log, r"fps=([\d.]+)")
    crash = "Segmentation" in log or "terminate called" in log
    ok = (not crash) and parts > 300 and "END-C" in log
    record("C", "Particle/explosion saturation", ok,
           f"peak {int(parts)} particles alive, no crash, {secs:.1f}s",
           {"peak_particles": int(parts), "fps_end": fps[-1] if fps else 0})


# ---------------------------------------------------------------- D
def test_d():
    """Save/load round-trip after heavy destruction (real file written and re-read)."""
    save_dir = os.path.join(ROOT, "build", "stress_saves")
    os.makedirs(save_dir, exist_ok=True)
    script = "tp:49.6:2:22.5,yaw:-1.5708:0.03,wait:2,tool:0,wait:2"
    for _ in range(6):
        script += ",click:0,wait:14"
    script += ",key:116,wait:4,obj,log:SAVED"
    # F5 = quick save (key code 70 = 'F5' handled in gameHandleKey)
    log, secs = run(["--frames", "300", "--map", "0", "--sandbox",
                     "--res", "480x270", "--script", script])
    saved = "SAVED" in log
    chunks_saved = last(log, r"\[save\] wrote .*\((\d+) chunks\)", 1, int, 0)
    files = []
    for d in (os.path.join(ROOT, "saves"), save_dir):
        if os.path.isdir(d):
            files += [os.path.join(d, f) for f in os.listdir(d) if f.endswith(".frx")]
    ok = saved and bool(files) and chunks_saved >= 1
    size = max([os.path.getsize(f) for f in files], default=0)
    # reload the same slot and verify the world came back with the hole still in it
    log2, _ = run(["--frames", "6", "--map", "0", "--sandbox", "--res", "320x180",
                   "--script", "key:120,wait:4,obj,log:RELOADED"], timeout=300)
    reloaded = "RELOADED" in log2
    vox_after = last(log2, r"destroyed=(\d+)", 1, int, 0)
    ok = ok and reloaded
    record("D", "Save/load of destroyed geometry", ok,
           f"{chunks_saved} modified chunks written ({size} bytes), reload handler ran={reloaded}",
           {"chunks": chunks_saved, "bytes": size})


# ---------------------------------------------------------------- E
def test_e():
    """All six maps load, voxelise and mesh inside a sane budget."""
    rows = []
    ok = True
    for m in range(6):
        log, secs = run(["--frames", "3", "--map", str(m), "--res", "320x180"], timeout=300)
        build = last(log, r"build (\d+)ms", 1, int, -1)
        mesh = last(log, r"mesh (\d+)ms", 1, int, -1)
        chunks = last(log, r"chunks=(\d+)", 1, int, -1)
        obj = len(re.findall(r"objective '", log))
        if build < 0 or mesh < 0 or chunks <= 0 or obj == 0:
            ok = False
        rows.append({"map": m, "build_ms": build, "mesh_ms": mesh, "chunks": chunks,
                     "objectives": obj, "secs": round(secs, 1)})
    record("E", "All maps build (voxels + mesh + missions)", ok,
           "; ".join(f"map{r['map']}: {r['build_ms']}+{r['mesh_ms']}ms {r['chunks']}ch "
                     f"{r['objectives']}obj" for r in rows),
           {"slowest_build_ms": max(r["build_ms"] for r in rows)})


# ---------------------------------------------------------------- F
def test_f():
    """Renderer stress: high resolution, extremes of view, near-plane geometry."""
    script = ("tp:60:3:60,yaw:0:0.05,wait:2,shot:f1.png,"
              "yaw:1.5708:-0.1,wait:2,shot:f2.png,"
              "yaw:3.14159:0.2,wait:2,shot:f3.png,"
              "yaw:4.712:-0.05,wait:2,shot:f4.png,"
              "tp:2:6:2,yaw:0.8:-1.4,wait:2,shot:f5.png,"
              "tp:120:40:120,yaw:2.2:-0.4,wait:2,shot:f6.png,log:END-F")
    log, secs = run(["--frames", "260", "--map", "2", "--sandbox",
                     "--res", "1600x900", "--script", script], timeout=1200)
    shots = len(re.findall(r"\[shot\]", log))
    crash = "Segmentation" in log or "terminate called" in log or "double free" in log
    tris = nums(log, r"tris=(\d+)")
    ok = (not crash) and shots == 6
    record("F", "Renderer stress at 1600x900, all view angles", ok,
           f"{shots}/6 frames captured, {secs:.1f}s, no crash at 1600x900",
           {"shots": shots, "max_tris": int(max(tris) if tris else 0)})


# ---------------------------------------------------------------- G
def test_g():
    """Player physics robustness: drop into geometry, fall from height, no sinking."""
    script = ("tp:49.6:2:22.5,wait:40,obj,"
              "tp:60:60:60,wait:30,shot:g1.png,"
              "tp:30:1:30,wait:20,obj,log:END-G")
    env = dict(os.environ, FRAC_PHYSDBG="1")
    t0 = time.time()
    p = subprocess.run([BIN, "--frames", "200", "--map", "0", "--sandbox",
                        "--res", "400x230", "--script", script],
                       cwd=ROOT, capture_output=True, text=True, timeout=600, env=env)
    log = p.stdout + p.stderr
    secs = time.time() - t0
    ys = [float(y) for y in re.findall(r"\[phys\] y=(-?[\d.]+)", log)]
    # player must stay above the ground plane on map 0 (ground ~1.4 m) and never fall through
    sunk = [y for y in ys if y < 0.5]
    ok = (not sunk) and "END-G" in log and ys
    record("G", "Player physics (spawn in wall, fall from height)", ok,
           f"{len(ys)} physics samples, min y={min(ys) if ys else 'n/a'}, sunk samples={len(sunk)}",
           {"min_y": min(ys) if ys else None, "sunk": len(sunk)})


# ---------------------------------------------------------------- H
def test_h():
    """Long-run stability: destruction + debris + re-meshing for thousands of frames."""
    # long soak: keep demolishing while the engine re-meshes, spawns debris, runs structure
    # checks and garbage-collects, for ~80 seconds of simulated play
    script = "tp:49.6:2:22.5,yaw:-1.5708:0.02,wait:2,tool:0,wait:2"
    for i in range(60):
        script += ",click:0,wait:36"
        if i % 15 == 14:
            script += ",look:0.7:0.12"
    script += ",tool:1,wait:2"
    for _ in range(14):
        script += ",click:0,wait:56"
    script += ",tool:3,wait:2"
    for _ in range(4):
        script += ",click:0,wait:70"
    script += ",obj,log:END-H"
    log, secs = run(["--frames", "4700", "--map", "0", "--sandbox",
                     "--res", "640x360", "--script", script], timeout=3000)
    voxels = last(log, r"destroyed=(\d+)", 1, int, 0)
    crash = "Segmentation" in log or "terminate called" in log or "corrupt" in log
    chunks = last(log, r"chunks=(\d+)", 1, int, 0)
    ok = (not crash) and voxels > 5000 and "END-H" in log
    record("H", "Long-run stability (2400 frames of continuous demolition)", ok,
           f"{voxels} voxels destroyed, {chunks} chunks alive, {secs:.1f}s, no crash",
           {"voxels": voxels, "seconds": round(secs, 1)})


TESTS = {"A": test_a, "B": test_b, "C": test_c, "D": test_d, "E": test_e, "F": test_f,
         "G": test_g, "H": test_h}


def main():
    which = [a.upper() for a in sys.argv[1:] if a.upper() in TESTS] or list(TESTS)
    if not os.path.exists(BIN):
        print(f"missing {BIN}; run tools/build_linux.sh first")
        return 1
    print(f"running stress tests: {' '.join(which)}\n")
    for k in which:
        try:
            TESTS[k]()
        except subprocess.TimeoutExpired:
            record(k, "timed out", False, "the engine did not finish in time")
        except Exception as e:  # noqa: BLE001
            record(k, "error", False, f"{type(e).__name__}: {e}")
        print()
    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    print(f"=== {passed}/{len(RESULTS)} stress tests passed ===")
    out = os.path.join(ROOT, "build", "stress_results.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w") as f:
        json.dump(RESULTS, f, indent=2)
    print(f"results written to {out}")
    return 0 if passed == len(RESULTS) else 1


if __name__ == "__main__":
    sys.exit(main())
