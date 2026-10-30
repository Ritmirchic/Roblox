"""Витрина второго сезона: постеры, лист персонажей, контактные листы, index.html."""
from __future__ import annotations

import glob
import os
import shutil

import numpy as np
from PIL import Image

from ..font import draw_text, text_size
from . import bg as BG
from .char import Pose, render
from .film import Actor, Cam, Shot, caption, render_shot, subtitle
from .rig import Clip, blinks, idle
from .series import AOI, CAST, MIKA, REN, YUKI, close, medium, wide

SHOW = "showcase"
OUT = "out/hi"


def _save(arr: np.ndarray, path: str, scale: int = 2) -> str:
    img = arr
    if scale != 1:
        img = np.repeat(np.repeat(img, scale, axis=0), scale, axis=1)
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    Image.fromarray(img).save(path)
    return path


# ---------------------------------------------------------------------------
def contact_sheet(paths: list[str], out: str, cols: int = 4, every: int = 14) -> str:
    """Сетка кадров из готовых mp4 (через ffmpeg, он уже нужен для рендера)."""
    import subprocess
    from ..encode import ffmpeg_path

    exe = ffmpeg_path()
    tiles = []
    tmp = os.path.join(".scratch", "cs")
    os.makedirs(tmp, exist_ok=True)
    for i, p in enumerate(paths):
        dst = os.path.join(tmp, f"t{i}.png")
        subprocess.run([exe, "-y", "-loglevel", "error", "-i", p,
                        "-vf", f"select='not(mod(n\\,{every}))',scale=256:144",
                        "-frames:v", str(cols), dst], check=True)
        im = Image.open(dst)
        tiles.append(np.array(im))
    rows = []
    per_row = cols
    for r in range(0, len(tiles), per_row):
        chunk = tiles[r:r + per_row]
        while len(chunk) < per_row:
            chunk.append(np.zeros_like(tiles[0]))
        rows.append(np.hstack(chunk))
    img = np.vstack(rows)
    Image.fromarray(img).resize((img.shape[1] * 2, img.shape[0] * 2), Image.NEAREST).save(out)
    return out


def cast_sheet(path: str = f"{SHOW}/s_cast.png", scale: int = 3) -> str:
    """Model sheet: четыре персонажа в одной позе + подписи и палитры."""
    pose = Pose(hip_l=0.06, hip_r=-0.05, sh_l=0.12, sh_r=0.12, el_l=0.2, el_r=0.2,
                mouth_curve=0.35, blush=0.25)
    n = len(CAST)
    sp_w, sp_h = 58, 132
    pad_top, pad_bot = 26, 30
    W = sp_w * n
    H = sp_h + pad_top + pad_bot
    canvas = np.zeros((H, W, 3), np.uint8)
    # фон-градиент
    for y in range(H):
        t = y / (H - 1)
        canvas[y, :] = (int(44 + 26 * t), int(38 + 22 * t), int(58 + 24 * t))
    names = ["АОЙ", "МИКА", "ЮКИ", "РЕН"]
    roles = ["КАШТАН", "ХВОСТЫ", "КАРЕ", "БОБ"]
    for i, (key, look) in enumerate(CAST.items()):
        b = render(look, pose)
        x0 = i * sp_w
        bx, by = 53, 24
        sub = canvas[pad_top:pad_top + sp_h, x0:x0 + sp_w]
        crop_m = b.mask.m[by:by + sp_h, bx:bx + sp_w]
        sub[crop_m] = b.rgb[by:by + sp_h, bx:bx + sp_w][crop_m]
        # подпись
        tw, _ = text_size(names[i])
        _put_text(canvas, x0 + (sp_w - tw) // 2, 8, names[i], (250, 244, 232))
        rw, _ = text_size(roles[i])
        _put_text(canvas, x0 + (sp_w - rw) // 2, H - 21, roles[i], (188, 186, 210))
        # палитра персонажа
        cols = [look.hair_color, look.skin, look.eye, look.cloth, look.skirt, look.accent]
        for k, c in enumerate(cols):
            canvas[H - 10:H - 6, x0 + 12 + k * 10:x0 + 20 + k * 10] = c
    return _save(canvas, path, scale)


def _put_text(rgb: np.ndarray, x: int, y: int, text: str, color, outline=(20, 16, 28),
              scale: int = 1) -> None:
    class R:
        def put(self, px, py, col):
            if 0 <= py < rgb.shape[0] and 0 <= px < rgb.shape[1]:
                rgb[py, px] = col
    draw_text(R(), x, y, text, color, outline=outline, scale=scale)


def poster(path: str = f"{SHOW}/s_poster.png") -> str:
    """Постер: ночная крыша, четверо, название сезона."""
    light = BG.LIGHTS["night"]
    y = 126
    actors = []
    for i, (key, look) in enumerate(CAST.items()):
        clip = Clip([idle(k / 12) for k in range(24)])
        actors.append(Actor(look, clip, x=[84, 112, 142, 172][i], y=y,
                            depth=0.04 if i in (1, 2) else 0.0,
                            flip=False))
    shot = Shot(kind="rooftop", light="night", frames=1, actors=actors, seed=77,
                cam_from=Cam(cx=128, cy=76, zoom=1.06), cam_to=Cam(cx=128, cy=76, zoom=1.06),
                grain=0.03)
    frame = render_shot(shot)[0]
    big = np.repeat(np.repeat(frame.rgb, 3, axis=0), 3, axis=1)      # 768x432
    # подрезаем до квадрата 768x768 с полем сверху под заголовок
    W = big.shape[1]
    canvas = np.zeros((W, W, 3), np.uint8)
    canvas[:] = (14, 12, 26)
    canvas[W - big.shape[0]:] = big
    # заливка верхнего поля градиентом неба
    for row in range(W - big.shape[0]):
        t = row / max(1, W - big.shape[0])
        canvas[row, :] = (int(14 + 26 * t), int(12 + 24 * t), int(26 + 46 * t))
    title = "ВЕСЕННИЙ СВЕТ"
    sub = "ВТОРОЙ СЕЗОН  ·  4 ЭПИЗОДА"
    tw, _ = text_size(title, scale=5)
    _put_text(canvas, (W - tw) // 2, 96, title, (252, 246, 236), (26, 20, 40), scale=5)
    sw, _ = text_size(sub, scale=2)
    _put_text(canvas, (W - sw) // 2, 150, sub, (246, 214, 170), (26, 20, 40), scale=2)
    # линия под заголовком
    canvas[186:188, (W - tw) // 2:(W + tw) // 2] = (246, 214, 170)
    return _save(canvas, path, 1)


def label_frame(frame_path: str, text: str, out: str, scale: int = 2) -> str:
    im = np.array(Image.open(frame_path))
    im = np.repeat(np.repeat(im, scale, axis=0), scale, axis=1)
    tw, _ = text_size(text, scale=2)
    _put_text(im, (im.shape[1] - tw) // 2, im.shape[0] - 28, text, (250, 246, 236), (20, 16, 28))
    Image.fromarray(im).save(out)
    return out


# ---------------------------------------------------------------------------
def build_all(log=print) -> dict:
    os.makedirs(SHOW, exist_ok=True)
    made = {}
    log("постер...")
    made["poster"] = poster()
    log("лист персонажей...")
    made["cast"] = cast_sheet()
    log("эпизоды -> showcase...")
    for ep in ("ep01_hi", "ep02_hi", "ep03_hi", "ep04_hi"):
        for suffix in ("_sound.mp4", "_excerpt.gif"):
            src = os.path.join(OUT, ep + suffix)
            if os.path.exists(src):
                dst = os.path.join(SHOW, f"s_{ep.replace('_hi', '')}{suffix.replace('_sound', '')}")
                shutil.copyfile(src, dst)
                made[os.path.basename(dst)] = dst
                log(f"  {dst}")
    # кадры-кадрики для превью
    from ..encode import ffmpeg_path
    import subprocess
    exe = ffmpeg_path()
    for ep, t in (("ep01_hi", 7.5), ("ep02_hi", 6.0), ("ep03_hi", 5.0), ("ep04_hi", 9.0)):
        src = os.path.join(OUT, f"{ep}_sound.mp4")
        dst = os.path.join(SHOW, f"s_{ep.replace('_hi', '')}_still.png")
        subprocess.run([exe, "-y", "-loglevel", "error", "-ss", str(t), "-i", src,
                        "-frames:v", "1", dst], check=True)
        made[os.path.basename(dst)] = dst
    return made


if __name__ == "__main__":
    print(build_all())


# ---------------------------------------------------------------------------
def build_index(path: str = f"{SHOW}/index.html", repo: str = "Ritmirchic/Roblox",
                branch: str = "arena/ea6487a8-roblox", sandbox: str | None = None,
                port: int = 8000) -> str:
    """Одна страница: второй сезон, нейросеть, лист персонажей, ссылки."""
    raw = f"https://github.com/{repo}/raw/{branch}/showcase"

    def dl(name: str) -> str:
        return f"{raw}/{name}"

    eps = [
        ("s_ep01.mp4", "Эпизод 1 — Утро", "Аой опаздывает в школу, Мика ждёт у ворот.", "s_ep01_excerpt.gif"),
        ("s_ep02.mp4", "Эпизод 2 — Крыша", "Закат на крыше: разговор о времени и прыжок.", "s_ep02_excerpt.gif"),
        ("s_ep03.mp4", "Эпизод 3 — Дождь", "Станция, дождь, зонт на двоих.", "s_ep03_excerpt.gif"),
        ("s_ep04.mp4", "Эпизод 4 — Звёзды", "Ночь, все четверо, падающая звезда.", "s_ep04_excerpt.gif"),
    ]
    cards = "\n".join(
        f'''  <article class="card">
    <h2>{title}</h2>
    <p class="sub">{desc}</p>
    <video src="{dl(v)}" poster="{dl(v.replace('.mp4', '_still.png'))}" controls muted loop playsinline></video>
    <div class="row">
      <a class="btn" href="{dl(v)}" download>скачать MP4</a>
      <a class="btn ghost" href="{dl(g)}" download>GIF</a>
    </div>
  </article>''' for v, title, desc, g in eps)

    html = f'''<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Весенний свет — второй сезон</title>
<style>
  :root {{ --ink:#f2eefc; --dim:#a79fc4; --bg:#141122; --card:#1d1930; --acc:#f0b46a; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; background:radial-gradient(120% 80% at 50% 0%, #241d3d 0%, var(--bg) 60%);
         color:var(--ink); font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }}
  header {{ padding:48px 20px 24px; text-align:center; }}
  h1 {{ margin:0 0 8px; font-size:clamp(28px,5vw,46px); letter-spacing:.06em; }}
  header p {{ margin:0; color:var(--dim); }}
  main {{ max-width:1120px; margin:0 auto; padding:0 20px 64px; }}
  .grid {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:20px; }}
  .card {{ background:var(--card); border-radius:16px; padding:16px; box-shadow:0 10px 30px #0006; }}
  .card h2 {{ margin:0 0 2px; font-size:19px; }}
  .card .sub {{ margin:0 0 10px; color:var(--dim); font-size:14px; }}
  video {{ width:100%; border-radius:10px; image-rendering:pixelated; background:#000; display:block; }}
  img.shot {{ width:100%; border-radius:10px; image-rendering:pixelated; display:block; }}
  .row {{ display:flex; gap:10px; margin-top:12px; flex-wrap:wrap; }}
  .btn {{ background:var(--acc); color:#241a0a; text-decoration:none; font-weight:600;
          padding:9px 14px; border-radius:9px; font-size:14px; }}
  .btn.ghost {{ background:transparent; color:var(--ink); border:1px solid #4a4270; }}
  .btn:hover {{ filter:brightness(1.08); }}
  h3 {{ margin:44px 0 12px; font-size:15px; letter-spacing:.14em; color:var(--dim); text-transform:uppercase; }}
  .wide {{ margin-top:20px; }}
  footer {{ text-align:center; color:var(--dim); font-size:13px; padding:24px; }}
  code {{ background:#0004; padding:1px 5px; border-radius:5px; }}
</style></head>
<body>
<header>
  <h1>ВЕСЕННИЙ СВЕТ</h1>
  <p>второй сезон · 4 эпизода · 512×288 · всё нарисовано кодом с нуля</p>
</header>
<main>
  <div class="grid">{cards}</div>

  <h3>Арт и персонажи</h3>
  <div class="grid">
    <article class="card">
      <h2>Постер сезона</h2>
      <p class="sub">четверо на крыше, ночь, звёзды</p>
      <img class="shot" src="{dl('s_poster.png')}" alt="постер">
      <div class="row"><a class="btn" href="{dl('s_poster.png')}" download>скачать PNG</a></div>
    </article>
    <article class="card">
      <h2>Лист персонажей</h2>
      <p class="sub">пропорции, палитры, причёски, одежда</p>
      <img class="shot" src="{dl('s_cast.png')}" alt="каст">
      <div class="row"><a class="btn" href="{dl('s_cast.png')}" download>скачать PNG</a></div>
    </article>
  </div>

  <h3>Нейросеть: поза → спрайт</h3>
  <div class="grid">
    <article class="card">
      <h2>Движок против сети</h2>
      <p class="sub">сверху — правила, снизу — обученная модель (L1, CPU)</p>
      <img class="shot" src="{dl('s_neural.png')}" alt="сравнение">
      <div class="row"><a class="btn" href="{dl('s_neural.png')}" download>скачать PNG</a></div>
    </article>
    <article class="card">
      <h2>Твин позы</h2>
      <p class="sub">промежуточные кадры рисует сеть, а не интерполятор</p>
      <img class="shot" src="{dl('s_neural_tween.gif')}" alt="твин">
      <div class="row">
        <a class="btn" href="{dl('s_neural_tween.gif')}" download>GIF</a>
        <a class="btn ghost" href="{dl('s_neural_loss.png')}" download>кривая обучения</a>
      </div>
    </article>
  </div>

  <h3>Первый сезон (128→256, старый движок)</h3>
  <div class="row">
    <a class="btn ghost" href="{dl('ep01.mp4')}" download>ep01.mp4</a>
    <a class="btn ghost" href="{dl('ep02.mp4')}" download>ep02.mp4</a>
    <a class="btn ghost" href="{dl('ep03.mp4')}" download>ep03.mp4</a>
    <a class="btn ghost" href="{dl('downloads.md')}">все ссылки списком</a>
    <a class="btn ghost" href="{raw}/../README.md">README</a>
  </div>
</main>
<footer>
  Изображение: собственный растр и полигоны. Звук: собственный чиптюн-синтез.
  Сеть: обучена в песочнице на CPU за минуты, данные — кадры движка.
</footer>
</body></html>'''
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    return path
