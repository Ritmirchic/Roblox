#!/usr/bin/env python3
"""Stream-render the loop and encode it (1080p master or 16K wallpaper)."""
import os
import subprocess
import sys
import time
import numpy as np
from PIL import Image
import render as R

FW, FH, CH = R.FW, R.FH, R.CH


def stream(dst, w, h, crf, preset, scale_vf, frames, fps):
    cmd = [R.ff(), '-y', '-loglevel', 'error',
           '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '%dx%d' % (w, h),
           '-r', str(fps), '-i', '-',
           '-vf', scale_vf,
           '-c:v', 'libx264', '-preset', preset, '-crf', str(crf),
           '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart',
           dst]
    t0 = time.time()
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    n = 0
    for i in frames:
        buf = R.geom(R.frame(keys, mg, mc, i, rng if n % 3 == 0 else None), i).tobytes()
        try:
            p.stdin.write(buf)
        except BrokenPipeError:
            break
        n += 1
        if n % 48 == 0:
            print('  %4d/%d frames  %.0fs  (%.1f fps)' % (n, len(frames), time.time() - t0, n / (time.time() - t0)),
                  flush=True)
    p.stdin.close()
    err = p.stderr.read().decode()
    rc = p.wait()
    print('  done rc=%d in %.0fs  %s' % (rc, time.time() - t0, os.path.getsize(dst) / 1e6 if os.path.exists(dst) else 0),
          flush=True)
    if rc:
        print(err[-2000:])
        sys.exit(1)



def encode_from_video(src_path, dst, w, h, crf, preset, vf, fps_out):
    """Re-encode an existing master at a different size (used for the 16K pass)."""
    cmd = [R.ff(), '-y', '-loglevel', 'error', '-i', src_path,
           '-vf', vf, '-r', str(fps_out),
           '-c:v', 'libx264', '-preset', preset, '-crf', str(crf),
           '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', dst]
    t0 = time.time()
    p = subprocess.run(cmd, capture_output=True)
    print('from-video rc=%d in %.0fs  %.1f MB' % (p.returncode, time.time() - t0,
          (os.path.getsize(dst) / 1e6) if os.path.exists(dst) else 0), flush=True)
    if p.returncode:
        print(p.stderr.decode()[-2000:]); sys.exit(1)

if __name__ == '__main__':
    import subprocess
    mode = sys.argv[1]
    out = sys.argv[2]
    keys, _ = R.load_keys()
    mg, mc = R.base_masks()
    rng = np.random.default_rng(11)
    fwd = list(range(R.NF))
    bwd = list(range(R.NF - 2, 0, -1))          # no duplicated frame at the loop seam
    if mode == '1080':
        frames = fwd + bwd
        print('1080p master, %d frames' % len(frames))
        stream(out, FW, FH, 17, 'medium', 'format=yuv420p', frames, R.FPS)
    elif mode == '16k':
        frames = [i for k, i in enumerate(fwd + bwd) if k % 2 == 0]   # 12 fps, same 20 s loop
        print('16K, %d frames (every other frame)' % len(frames))
        stream(out, FW, FH, 27, 'ultrafast',
               'scale=5760:3240:flags=lanczos,unsharp=5:5:0.4,scale=15360:8640:flags=lanczos,format=yuv420p',
               frames, R.FPS / 2)
    elif mode == '16k-from-master':
        m = sys.argv[3]
        print('16K upscaled from master (24 -> 12 fps)')
        encode_from_video(m, out, 15360, 8640, 27, 'ultrafast',
                          'scale=5760:3240:flags=lanczos,unsharp=5:5:0.5,scale=15360:8640:flags=lanczos,format=yuv420p',
                          R.FPS / 2)
    elif mode == '4k':
        frames = fwd + bwd
        print('4K, %d frames' % len(frames))
        stream(out, FW, FH, 20, 'fast', 'scale=3840:2160:flags=lanczos,format=yuv420p', frames, R.FPS)
