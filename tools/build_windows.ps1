[CmdletBinding()]
param(
    [string]$Godot = "godot",
    [string]$InnoSetupCompiler = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Build = Join-Path $Root "build"
$Exe = Join-Path $Build "DONT_LOOK_BACK.exe"
New-Item -ItemType Directory -Force -Path $Build | Out-Null

Write-Host "Validating project scripts and importing project resources..."
& $Godot --headless --editor --path $Root --quit
if ($LASTEXITCODE -ne 0) { throw "Godot project validation failed (exit $LASTEXITCODE)." }

Write-Host "Running the 30-anomaly smoke suite..."
& $Godot --headless --path $Root --script "res://tests/anomaly_smoke.gd"
if ($LASTEXITCODE -ne 0) { throw "Anomaly smoke tests failed (exit $LASTEXITCODE)." }

Write-Host "Exporting a standalone 64-bit Windows release..."
& $Godot --headless --path $Root --export-release "Windows Desktop" $Exe
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $Exe)) {
    throw "Windows release export failed. Install the matching Godot export templates and retry."
}

if (-not $InnoSetupCompiler) {
    $Candidates = @(
        (Join-Path ${env:ProgramFiles(x86)} "Inno Setup 6\ISCC.exe"),
        (Join-Path $env:ProgramFiles "Inno Setup 6\ISCC.exe")
    )
    $InnoSetupCompiler = $Candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if ($InnoSetupCompiler -and (Test-Path $InnoSetupCompiler)) {
    Write-Host "Compiling the optional installer..."
    & $InnoSetupCompiler (Join-Path $Root "installer\DONT_LOOK_BACK.iss")
    if ($LASTEXITCODE -ne 0) { throw "Inno Setup compilation failed (exit $LASTEXITCODE)." }
} else {
    Write-Warning "Inno Setup was not found. The standalone game was exported; installer source is installer/DONT_LOOK_BACK.iss."
}

$SourceZip = Join-Path $Root "DONT_LOOK_BACK_SOURCE.zip"
$ProjectFiles = Get-ChildItem -Path $Root -Force | Where-Object {
    $_.Name -notin @(".git", ".godot", "build", "__pycache__", "DONT_LOOK_BACK_SOURCE.zip")
}
Compress-Archive -Path $ProjectFiles.FullName -DestinationPath $SourceZip -CompressionLevel Optimal -Force
Write-Host "Release build complete."
Write-Host "Game:      $Exe"
if (Test-Path (Join-Path $Build "DONT_LOOK_BACK_SETUP.exe")) {
    Write-Host "Installer: $(Join-Path $Build 'DONT_LOOK_BACK_SETUP.exe')"
}
Write-Host "Source:    $SourceZip"
