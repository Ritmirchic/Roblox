"""Сборка витрины: постер, копии эпизодов, HTML-страница для просмотра."""
from __future__ import annotations

import os
import shutil

import numpy as np


def poster(times_by_ep: dict[int, list[float]], out: str = "showcase/poster.png",
           cols: int = 4, size: int = 256) -> str:
    from PIL import Image

    from .story import EPISODES
    from .timeline import Timeline

    tiles = []
    for ep, times in times_by_ep.items():
        tl = Timeline(EPISODES[ep](), fps=12, out_w=size, out_h=size)
        for t in times:
            tiles.append(Image.fromarray(tl.frame(int(round(t * 12)))))
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * size, rows * size), (10, 8, 16))
    for i, im in enumerate(tiles):
        sheet.paste(im, ((i % cols) * size, (i // cols) * size))
    os.makedirs(os.path.dirname(os.path.abspath(out)) or ".", exist_ok=True)
    sheet.save(out)
    return out


def copy_episodes(src_dir: str = "out", dst_dir: str = "showcase", fps: int = 12) -> list[str]:
    os.makedirs(dst_dir, exist_ok=True)
    made = []
    for ep in (1, 2, 3):
        src = os.path.join(src_dir, f"ep{ep:02d}_{fps}fps.mp4")
        if os.path.exists(src):
            dst = os.path.join(dst_dir, f"ep{ep:02d}.mp4")
            shutil.copyfile(src, dst)
            made.append(dst)
    return made


HTML = """<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>PIXANIME — пиксель-арт аниме, сгенерированное кодом</title>
<style>
  :root {{ --accent:#ffd08a; --bg:#120f1c; --panel:#1b1730; --text:#e9e6f5; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; background:var(--bg); color:var(--text);
         font-family:ui-monospace,SFMono-Regular,Menlo,monospace; line-height:1.55; }}
  header {{ padding:48px 24px 24px; text-align:center; }}
  h1 {{ margin:0 0 8px; font-size:34px; letter-spacing:.22em; color:var(--accent); }}
  .sub {{ color:#9a94b8; font-size:14px; letter-spacing:.08em; }}
  main {{ max-width:1100px; margin:0 auto; padding:0 24px 64px; }}
  .grid {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:20px; margin:28px 0; }}
  .card {{ background:var(--panel); border:1px solid #2b2646; padding:14px; }}
  .card h2 {{ font-size:15px; margin:0 0 4px; color:var(--accent); font-weight:600; }}
  .card p {{ margin:0 0 10px; font-size:12px; color:#9a94b8; }}
  video, img {{ width:100%; display:block; image-rendering:pixelated; background:#000; }}
  .note {{ font-size:13px; color:#b9b3d0; border-left:3px solid var(--accent); padding-left:14px; margin:26px 0; }}
  code {{ background:#241f3d; padding:1px 5px; border-radius:3px; font-size:12px; }}
  footer {{ text-align:center; color:#6d6688; font-size:12px; padding:24px; }}
</style>
</head>
<body>
<header>
  <h1>PIXANIME</h1>
  <div class="sub">процедурный пиксель-арт аниме-сериал + видео-диффузия с нуля · 256×256 · 12 fps</div>
</header>
<main>
  <div class="note">
    Три эпизода ниже нарисованы <b>кодом</b>: спрайты, фоны, анимация, диалоги, звук.
    Ниже — клип, который сгенерировала <b>нейросеть</b> (flow matching, 1.5 млн параметров,
    обучена 20 минут на CPU на кадрах этого же движка).
  </div>
  <div class="grid">
{cards}
  </div>
  <div class="note">
    Разрешение каждого кадра — 128×128, апскейл целым множителем ×2 → 256×256:
    иначе пиксель-арт «мылится». Крупный план — тот же приём: спрайт рисуется ×2.
  </div>
</main>
<footer>сгенерировано локально · код в репозитории · <code>python -m pixanime.cli render --episode 1</code></footer>
</body>
</html>
"""


def build_index(out: str = "showcase/index.html") -> str:
    cards = []
    eps = [
        ("ep01.mp4", "ЭПИЗОД 1 — Город, где кончается лето", "крыша на закате · 63 с"),
        ("ep02.mp4", "ЭПИЗОД 2 — Дождь идёт третий день", "улица под дождём · 44 с"),
        ("ep03.mp4", "ЭПИЗОД 3 — Три года спустя", "ночная крыша · 36 с"),
    ]
    for f, title, sub in eps:
        if os.path.exists(os.path.join(os.path.dirname(out), f)):
            cards.append(
                f'<div class="card"><h2>{title}</h2><p>{sub}</p>'
                f'<video src="{f}" controls loop muted playsinline></video></div>'
            )
    if os.path.exists(os.path.join(os.path.dirname(out), "ai_clip.gif")):
        cards.append('<div class="card"><h2>НЕЙРОСЕТЬ — клип 8×32×32</h2>'
                     '<p>flow matching · temporal attention · 24 шага Эйлера</p>'
                     '<img src="ai_clip.gif" alt="AI clip"></div>')
    if os.path.exists(os.path.join(os.path.dirname(out), "training_loss.png")):
        cards.append('<div class="card"><h2>КРИВАЯ ОБУЧЕНИЯ</h2><p>MSE по полю скоростей</p>'
                     '<img src="training_loss.png" alt="loss"></div>')
    if os.path.exists(os.path.join(os.path.dirname(out), "poster.png")):
        cards.append('<div class="card" style="grid-column:1/-1"><h2>КАДРЫ</h2>'
                     '<p>контактный лист из трёх эпизодов</p><img src="poster.png" alt="poster"></div>')
    html = HTML.format(cards="\n".join(cards))
    os.makedirs(os.path.dirname(os.path.abspath(out)) or ".", exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)
    return out


def build_all() -> None:
    from .ml.sample import generate

    os.makedirs("showcase", exist_ok=True)
    print(copy_episodes())
    poster({1: [2.5, 9, 18, 27], 2: [7, 16, 26, 38], 3: [6, 18, 25]})
    if os.path.exists("ckpt/pixvd.pt"):
        for cls, name in ((0, "rooftop_dusk"), (3, "park_day")):
            generate(cls=cls, n=3, steps=24, out=f"showcase/ai_{name}.gif", scale=8)
    if os.path.exists("ckpt/pixvd_loss.png"):
        shutil.copyfile("ckpt/pixvd_loss.png", "showcase/training_loss.png")
    print(build_index())
