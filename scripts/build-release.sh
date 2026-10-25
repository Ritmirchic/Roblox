#!/usr/bin/env bash
# Full release pipeline: test -> web build -> icon -> native cross-compile -> package.
set -euo pipefail
cd "$(dirname "$0")/.."

ZIG="${ZIG_CMD:-/home/user/.toolvenv/bin/python -m ziglang}"
WIN_TARGET="x86_64-windows-gnu"

echo "=============================================="
echo " SPACE MINER - RELEASE BUILD"
echo "=============================================="

echo
echo ">> 1. automated tests"
node --experimental-strip-types scripts/run-tests.mjs

echo
echo ">> 1b. headless gameplay smoke test"
node --experimental-strip-types scripts/smoke-test.mjs 2>&1 | grep -v "toNonIndexed"

echo
echo ">> 2. type check"
npx tsc --noEmit -p tsconfig.json
echo "   no type errors"

echo
echo ">> 3. web build"
npm run build

echo
echo ">> 4. application icon"
node scripts/make-icon.mjs build

echo
echo ">> 5. native Windows binaries (${WIN_TARGET})"
mkdir -p build/tmp
cp build/spaceminer.ico native/spaceminer.ico
(cd native && $ZIG rc /:auto-includes gnu /fo ../build/app.res app.rc > /dev/null)
$ZIG cc -target $WIN_TARGET -O2 -municode native/launcher.c build/app.res \
    -o build/SpaceMiner.exe -lws2_32 -lshell32 -lole32 -Wl,--subsystem,windows
$ZIG cc -target $WIN_TARGET -O2 -municode native/installer.c build/app.res \
    -o build/setup_stub.exe -lshell32 -lole32 -luuid -ladvapi32 -lcomctl32 -lgdi32 -luser32 -Wl,--subsystem,windows
$ZIG cc -target $WIN_TARGET -O2 -municode native/uninstall.c build/app.res \
    -o build/uninstall.exe -lshell32 -lole32 -ladvapi32 -luser32 -Wl,--subsystem,windows
echo "   SpaceMiner.exe, setup_stub.exe, uninstall.exe built"

echo
echo ">> 6. launcher self-test (same C core, POSIX build)"
$ZIG cc -DSM_POSIX -O2 native/launcher.c -o build/tmp/launcher_test
./build/tmp/launcher_test dist --self-test
$ZIG cc -O2 native/pack_test.c -o build/tmp/pack_test

echo
echo ">> 7. live HTTP serving test against the real build output"
./build/tmp/launcher_test dist > build/tmp/port.txt &
SERVER_PID=$!
sleep 1
PORT=$(cat build/tmp/port.txt)
cleanup_server() { kill "$SERVER_PID" 2>/dev/null || true; }
trap cleanup_server EXIT
check() {
  local path="$1" expect="$2" label="$3"
  local code
  code=$(curl -s --path-as-is --max-time 5 -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}${path}" || true)
  if [ "$code" != "$expect" ]; then echo "   FAIL ${label}: got ${code}, expected ${expect}"; exit 1; fi
  echo "   ok   ${label} (${code})"
}
check "/" 200 "index.html"
check "/$(cd dist && ls assets/*.js | head -1)" 200 "bundle"
check "/$(cd dist && ls assets/*.css | head -1)" 200 "stylesheet"
check "/../../etc/passwd" 403 "path traversal blocked"
curl -s "http://127.0.0.1:${PORT}/__quit" > /dev/null || true
wait $SERVER_PID 2>/dev/null || true

echo
echo ">> 8. packaging"
node scripts/package-release.mjs

echo
echo ">> 9. PE verification"
python3 scripts/verify-pe.py release/SPACE_MINER_SETUP.exe build/SpaceMiner.exe build/uninstall.exe

echo
echo "=============================================="
echo " BUILD COMPLETE"
echo "=============================================="
ls -la release/
