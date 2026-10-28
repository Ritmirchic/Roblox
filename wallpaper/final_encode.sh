#!/bin/sh
# Final 16K deliverable + preview assets.
# NOTE: -threads 2 is REQUIRED. With this static ffmpeg build the default
# thread count OOM-kills the process (rc=137) when encoding 15360x8640.
cd /home/user/Roblox/wallpaper
EXE=$(cat build/ffexe.txt)

echo "[1/3] 16K (15360x8640, 12 fps)"
"$EXE" -y -loglevel error -threads 2 -i master_1920x1080.mp4 \
  -vf "scale=15360:8640:flags=lanczos,format=yuv420p" \
  -r 12 -c:v libx264 -preset ultrafast -crf 36 -pix_fmt yuv420p \
  -profile:v high -movflags +faststart wallpaper_15360x8640.mp4 -stats
echo "  rc=$?"
ls -la wallpaper_15360x8640.mp4

echo "[2/3] preview clip 1280x720"
"$EXE" -y -loglevel error -i master_1920x1080.mp4 \
  -vf "scale=1280:720:flags=lanczos,format=yuv420p" \
  -c:v libx264 -preset fast -crf 28 -movflags +faststart preview_1280x720.mp4
echo "  rc=$?"

echo "[3/3] preview gif 480x270"
"$EXE" -y -loglevel error -i master_1920x1080.mp4 \
  -vf "fps=12,scale=480:270:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:allow_diffusion=0" \
  -loop 0 preview_loop.gif
echo "  rc=$?"
echo "ALL DONE"
