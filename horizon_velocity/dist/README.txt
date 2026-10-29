HORIZON VELOCITY - vertical slice (Windows x64)
===============================================

HORIZON_VELOCITY.exe  -  PE32+ x86-64, GUI subsystem, statically linked.
No installer, no DLLs, no runtime dependencies. Just run it.

IMPORTANT - performance
The renderer in this build is a CPU rasterizer, not a GPU pipeline. Expect
roughly 2-8 fps at 1280x720 depending on the CPU (it measured 2 fps on a
2-vCPU build machine). It is a correctness/verification build, not a playable
racer yet. GPU rendering is planned but was impossible to develop or test in
the sandbox that produced this binary (no GPU, no display, no Windows).

Controls (default bindings)
  W / S .............. throttle / brake
  A / D .............. steer left / right
  Space .............. handbrake
  Left Shift ......... shift up (manual mode)
  Left Ctrl .......... shift down
  T .................. toggle automatic / manual gearbox
  C .................. cycle camera (chase, chase far, hood, bumper,
                       cockpit, cinematic, orbit, photo)
  R .................. reset the car onto the nearest road
  M .................. map overlay
  P .................. enter/leave photo camera
  F .................. start the current event (chapter 1)
  Esc ................ pause

  Gamepad (first device): left stick steer, triggers throttle/brake,
  A camera, X handbrake, Start reset.

Command line
  --list             list the 16 cars
  --car <id>         start with a car, e.g. --car corsa_super
  --shots <dir>      render 9 verification PNGs and exit (works without input)
  --replay <csv>     drive 45 s on autopilot, write telemetry, exit
  --width/--height   window size, e.g. --width 960 --height 540 for more fps
  --seed <n>         world seed

If it does not start, that is the one thing that could not be verified on the
build machine: the file is a valid, statically linked PE32+ binary, but it was
never launched on Windows. The window/GL init path lives in
src/platform/platform_win.cpp.
