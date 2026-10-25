@echo off
REM ============================================================
REM  DON'T LOOK BACK — one-click Windows release build
REM  Requires: Python 3.11+ on PATH. Optional: Inno Setup 6.
REM ============================================================
setlocal
cd /d "%~dp0\.."
echo [1/4] Installing dependencies...
python -m pip install --upgrade pip >nul
python -m pip install pygame numpy pillow PyInstaller || goto :err
echo [2/4] Running automated tests...
set SDL_VIDEODRIVER=dummy
set SDL_AUDIODRIVER=dummy
python tests\test_game.py || goto :err
echo [3/4] Building DONT_LOOK_BACK.exe ...
python -m PyInstaller --clean --noconfirm packaging\DONT_LOOK_BACK.spec || goto :err
if not exist release mkdir release
copy /Y dist\DONT_LOOK_BACK.exe release\DONT_LOOK_BACK.exe >nul
echo [4/4] Building installer (if Inno Setup is present)...
where ISCC >nul 2>nul && (ISCC packaging\installer.iss) || echo   Inno Setup not found - skipping DONT_LOOK_BACK_SETUP.exe
echo.
echo DONE. See the release\ folder.
pause
exit /b 0
:err
echo BUILD FAILED - see messages above.
pause
exit /b 1
