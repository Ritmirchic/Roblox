"""Generate the original Horizon Velocity desktop icon (requires Pillow)."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SCALE = 4
N = 256
image = Image.new("RGBA", (N * SCALE, N * SCALE), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)

def pt(x, y):
    return (int(x * SCALE), int(y * SCALE))

# Deep blue enamel tile with a warm speed-mark and a cool coast underline.
draw.rounded_rectangle((pt(8, 8), pt(248, 248)), radius=48 * SCALE, fill="#101b25")
points = [(24, 174), (91, 55), (132, 55), (87, 139), (126, 139), (184, 61), (226, 61), (151, 188), (101, 188), (122, 152), (48, 152), (38, 174)]
mask = Image.new("L", image.size, 0)
ImageDraw.Draw(mask).polygon([pt(x, y) for x, y in points], fill=255)
gradient = Image.new("RGBA", image.size)
gd = ImageDraw.Draw(gradient)
for y in range(image.height):
    t = y / max(image.height - 1, 1)
    a, b = (245, 184, 75), (255, 86, 62)
    color = tuple(round(a[i] * (1 - t) + b[i] * t) for i in range(3)) + (255,)
    gd.line((0, y, image.width, y), fill=color)
image.alpha_composite(Image.composite(gradient, Image.new("RGBA", image.size), mask))
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((pt(38, 215), pt(218, 222)), radius=4 * SCALE, fill="#51d7d1")
image = image.resize((N, N), Image.Resampling.LANCZOS)
image.save(ROOT / "project/assets/icon.png", optimize=True)
image.save(ROOT / "project/assets/icon.ico", sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])
