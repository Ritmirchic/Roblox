#!/usr/bin/env python3
"""Re-download hero model references into /tmp/pbr_hero_models (persist-safe)."""
import base64, json, urllib.request
from pathlib import Path

CACHE = Path("/tmp/pbr_hero_models")
CACHE.mkdir(parents=True, exist_ok=True)

def gh_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "SpaceMinerBuild"})
    return json.loads(urllib.request.urlopen(req, timeout=60).read().decode())

def download_file(owner, repo, path, dst: Path):
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists() and dst.stat().st_size > 100:
        print("exists", dst.name)
        return
    meta = gh_json(f"https://api.github.com/repos/{owner}/{repo}/contents/{path}")
    if isinstance(meta, dict) and meta.get("content"):
        dst.write_bytes(base64.b64decode(meta["content"]))
    elif isinstance(meta, dict) and meta.get("git_url"):
        blob = gh_json(meta["git_url"])
        dst.write_bytes(base64.b64decode(blob["content"]))
    else:
        print("FAILED", path)
        return
    print("ok", dst.name, dst.stat().st_size)

def download_dir(owner, repo, dir_path, dst_dir: Path):
    dst_dir.mkdir(parents=True, exist_ok=True)
    items = gh_json(f"https://api.github.com/repos/{owner}/{repo}/contents/{dir_path}")
    for it in items:
        if it["type"] == "file":
            download_file(owner, repo, it["path"], dst_dir / it["name"])

# model-viewer shared-assets (Apache-2.0) — astronaut, robot, vanguard soldier
for m in ["Astronaut.glb", "NeilArmstrong.glb", "RobotExpressive.glb", "soldier.glb"]:
    download_file("google", "model-viewer", f"packages/shared-assets/models/{m}", CACHE / "mv" / m)

# three.js examples — vanguard Soldier.glb armor + Xbot robot
for m in ["Soldier.glb", "Xbot.glb"]:
    download_file("mrdoob", "three.js", f"examples/models/gltf/{m}", CACHE / "three" / m)

# Khronos glTF-Sample-Assets helmets (CC0 / CC-BY-4.0)
download_dir("KhronosGroup", "glTF-Sample-Assets", "Models/DamagedHelmet/glTF-Binary", CACHE / "DamagedHelmet")
download_dir("KhronosGroup", "glTF-Sample-Assets", "Models/SciFiHelmet/glTF", CACHE / "SciFiHelmet")
download_dir("KhronosGroup", "glTF-Sample-Assets", "Models/FlightHelmet/glTF", CACHE / "FlightHelmet")
print("DOWNLOAD_DONE")
