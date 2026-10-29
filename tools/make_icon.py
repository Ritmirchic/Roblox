#!/usr/bin/env python3
"""
make_icon.py - draws the FRACTURE game icon and writes assets/icon.ico
Original artwork (procedurally drawn): cracked concrete block with a hammer
silhouette on a hazard-striped background.
"""
import os, math
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "icon.ico")


def draw(size):
    S = size
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # rounded dark plate
    r = int(S * 0.16)
    d.rounded_rectangle([1, 1, S - 2, S - 2], radius=r, fill=(26, 28, 32, 255))
    d.rounded_rectangle([1, 1, S - 2, S - 2], radius=r, outline=(255, 176, 58, 255),
                        width=max(1, S // 32))
    # hazard stripes band (clipped to the plate)
    band = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    bd = ImageDraw.Draw(band)
    y0 = int(S * 0.76)
    bd.rectangle([0, y0, S, int(S * 0.90)], fill=(232, 168, 40, 255))
    step = max(3, S // 10)
    for x in range(-S, S * 2, step * 2):
        bd.polygon([(x, y0), (x + step, y0), (x + step - S // 8, int(S * 0.90)),
                    (x - S // 8, int(S * 0.90))], fill=(24, 24, 26, 255))
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([2, 2, S - 3, S - 3], radius=r, fill=255)
    img.paste(band, (0, 0), Image.composite(band.split()[3], Image.new("L", (S, S), 0), mask))
    # cracked concrete block
    bx0, by0, bx1, by1 = int(S * 0.18), int(S * 0.26), int(S * 0.82), int(S * 0.74)
    br = max(2, S // 28)
    d.rounded_rectangle([bx0, by0, bx1, by1], radius=br, fill=(146, 144, 138, 255))
    d.rounded_rectangle([bx0, by0, bx1, by0 + (by1 - by0) // 3], radius=br,
                        fill=(180, 178, 172, 255))
    d.rounded_rectangle([bx0 + 2, by0 + 2, bx1 - 2, by1 - 2], radius=br,
                        outline=(96, 94, 90, 255), width=max(1, S // 48))
    # jagged crack through the block
    crack = [(int(S * 0.42), by0 + 2), (int(S * 0.47), int(S * 0.40)),
             (int(S * 0.39), int(S * 0.50)), (int(S * 0.46), int(S * 0.60)),
             (int(S * 0.42), by1 - 2)]
    d.line(crack, fill=(28, 28, 30, 255), width=max(2, S // 26), joint="curve")
    d.line([(int(S * 0.47), int(S * 0.40)), (int(S * 0.60), int(S * 0.34))],
           fill=(28, 28, 30, 255), width=max(1, S // 44))
    # sledgehammer: thick diagonal handle + head
    hx, hy = int(S * 0.66), int(S * 0.10)
    tx, ty = int(S * 0.44), int(S * 0.40)
    d.line([(hx, hy), (tx, ty)], fill=(206, 156, 74, 255), width=max(4, S // 13))
    d.line([(hx + S // 90, hy), (tx + S // 90, ty)], fill=(232, 184, 106, 255),
           width=max(1, S // 40))
    # hammer head perpendicular to the handle
    ang = math.atan2(ty - hy, tx - hx)
    hl = S * 0.075
    hw = S * 0.016
    cx, cy = hx + math.cos(ang) * S * 0.02, hy + math.sin(ang) * S * 0.02
    px, py = -math.sin(ang) * hl, math.cos(ang) * hl
    d.polygon([(cx + px, cy + py), (cx + px + math.cos(ang) * hw * 2, cy + py + math.sin(ang) * hw * 2),
               (cx - px + math.cos(ang) * hw * 2, cy - py + math.sin(ang) * hw * 2),
               (cx - px, cy - py)], fill=(214, 218, 224, 255))
    d.polygon([(cx + px, cy + py), (cx + px + math.cos(ang) * hw * 2, cy + py + math.sin(ang) * hw * 2),
               (cx - px + math.cos(ang) * hw * 2, cy - py + math.sin(ang) * hw * 2),
               (cx - px, cy - py)], outline=(120, 124, 130, 255))
    return img


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    sizes = [16, 24, 32, 48, 64, 128, 256]
    imgs = [draw(s) for s in sizes]
    # ICO container with PNG payloads (Vista+); small sizes as BMP for compatibility
    import struct
    entries = []
    blobs = []
    for im in imgs:
        import io
        b = io.BytesIO()
        im.save(b, format="PNG")
        blobs.append(b.getvalue())
    header = struct.pack("<HHH", 0, 1, len(imgs))
    offset = 6 + 16 * len(imgs)
    data = bytearray(header)
    for im, blob in zip(imgs, blobs):
        w = 0 if im.width >= 256 else im.width
        h = 0 if im.height >= 256 else im.height
        data += struct.pack("<BBBBHHII", w, h, 0, 0, 1, 32, len(blob), offset)
        offset += len(blob)
    for blob in blobs:
        data += blob
    with open(OUT, "wb") as f:
        f.write(data)
    # also a PNG copy for docs
    imgs[-1].save(os.path.join(ROOT, "assets", "icon.png"))
    print("wrote", OUT, len(data), "bytes")


if __name__ == "__main__":
    main()
