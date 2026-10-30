"""Командная строка: рендер эпизодов, кадров, саундтрека, обучение модели."""
from __future__ import annotations

import argparse
import os
import sys
import time

import numpy as np


def cmd_render(args) -> None:
    from .audio import make_soundtrack
    from .encode import MP4Writer, GIFWriter, mux_audio
    from .story import EPISODES
    from .timeline import Timeline

    shots = EPISODES[args.episode](fps=args.fps)
    tl = Timeline(shots, fps=args.fps, out_w=args.size, out_h=args.size)
    print(tl.summary())

    os.makedirs(args.out_dir, exist_ok=True)
    base = os.path.join(args.out_dir, f"ep{args.episode:02d}_{args.fps}fps")

    audio_path = None
    if not args.no_audio:
        audio_path = base + ".wav"
        t0 = time.time()
        mood = {"1": "dusk"}.get(str(args.episode), "dusk")
        track = make_soundtrack(tl.duration + 0.5, seed=args.episode, mood=mood)
        track.write(audio_path)
        print(f"саундтрек: {audio_path} ({time.time()-t0:.1f} c)")

    i0 = int(round(args.start * args.fps))
    i1 = int(round(args.end * args.fps)) if args.end else tl.n_frames
    indices = range(max(0, i0), min(tl.n_frames, i1))
    if args.start or args.end:
        print(f"фрагмент: кадры {indices.start}..{indices.stop - 1}")

    if args.gif:
        gw = GIFWriter(base + ".gif", args.size, args.size, fps=args.fps)
        for i in indices:
            gw.write(tl.frame(i))
        gw.close()
        print(f"GIF: {base}.gif")
        return

    mp4 = base + ".mp4"
    writer = MP4Writer(mp4, args.size, args.size, fps=args.fps, audio=audio_path)
    t0 = time.time()
    n = 0
    for i in indices:
        writer.write(tl.frame(i))
        n += 1
        if n % 120 == 0:
            print(f"  {n}/{tl.n_frames} кадров")
    writer.close()
    dt = time.time() - t0
    print(f"видео: {mp4} — {n} кадров за {dt:.1f} c ({n/max(dt,1e-6):.1f} к/с)")
    if os.path.exists(mp4):
        print(f"размер: {os.path.getsize(mp4)/1e6:.1f} МБ")


def cmd_still(args) -> None:
    from PIL import Image

    from .story import EPISODES
    from .timeline import Timeline

    tl = Timeline(EPISODES[args.episode](fps=args.fps), fps=args.fps, out_w=args.size, out_h=args.size)
    times = [float(x) for x in args.times.split(",")]
    os.makedirs(args.out_dir, exist_ok=True)
    for t in times:
        img = tl.frame(int(round(t * args.fps)))
        path = os.path.join(args.out_dir, f"still_{t:05.1f}.png")
        Image.fromarray(img).save(path)
        print(path)


def cmd_links(args) -> None:
    from .showcase import DEFAULT_BRANCH, DEFAULT_REPO, direct_links, write_downloads

    links = direct_links(repo=args.repo, branch=args.branch, sandbox=args.sandbox, port=args.port)
    for ln in links:
        print(ln)
    if args.write:
        print("\nзаписано:", write_downloads(repo=args.repo, branch=args.branch, sandbox=args.sandbox, port=args.port))


def main(argv=None) -> int:
    p = argparse.ArgumentParser(prog="pixanime", description="Процедурный пиксель-арт аниме-сериал")
    sub = p.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("render", help="отрендерить эпизод в MP4 (или GIF)")
    r.add_argument("--episode", type=int, default=1)
    r.add_argument("--out-dir", default="out")
    r.add_argument("--fps", type=int, default=12)
    r.add_argument("--size", type=int, default=256)
    r.add_argument("--gif", action="store_true")
    r.add_argument("--no-audio", action="store_true")
    r.add_argument("--start", type=float, default=0.0, help="начало фрагмента, сек")
    r.add_argument("--end", type=float, default=0.0, help="конец фрагмента, сек (0 — до конца)")
    r.set_defaults(func=cmd_render)

    s = sub.add_parser("still", help="сохранить отдельные кадры в PNG")
    s.add_argument("--episode", type=int, default=1)
    s.add_argument("--times", default="2,8,16,24,32,44,56")
    s.add_argument("--fps", type=int, default=12)
    s.add_argument("--size", type=int, default=256)
    s.add_argument("--out-dir", default="out/stills")
    s.set_defaults(func=cmd_still)

    lk = sub.add_parser("links", help="прямые ссылки на скачивание всех артефактов")
    lk.add_argument("--repo", default="Ritmirchic/Roblox")
    lk.add_argument("--branch", default="arena/ea6487a8-roblox")
    lk.add_argument("--sandbox", default=None, help="id песочницы E2B для ссылок превью")
    lk.add_argument("--port", type=int, default=8000)
    lk.add_argument("--write", action="store_true", help="записать showcase/downloads.md")
    lk.set_defaults(func=cmd_links)

    a = p.parse_args(argv)
    a.func(a)
    return 0


if __name__ == "__main__":
    sys.exit(main())
