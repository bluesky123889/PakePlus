# Sync the web app (project root) into desktop/web for Tauri bundling.
# Usage:  powershell -NoProfile -ExecutionPolicy Bypass -File .\desktop\sync-web.ps1
#         (or just double-click sync-web.cmd)
# NOTE: keep this file ASCII-only so Windows PowerShell 5.1 (no BOM) parses it.
$ErrorActionPreference = 'Stop'

$desktopDir = $PSScriptRoot
$rootDir = Split-Path -Parent $desktopDir
$webDir = Join-Path $desktopDir 'web'

if (-not (Test-Path (Join-Path $rootDir 'index.html'))) {
    throw "index.html not found in $rootDir - is the script inside desktop\ ?"
}

if (Test-Path $webDir) { Remove-Item -LiteralPath $webDir -Recurse -Force }
New-Item -ItemType Directory -Path $webDir | Out-Null

Copy-Item -LiteralPath (Join-Path $rootDir 'index.html') -Destination $webDir
Copy-Item -LiteralPath (Join-Path $rootDir 'style.css') -Destination $webDir

Get-ChildItem -LiteralPath $rootDir -Filter '*.min.js' -File | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $webDir
}

$srcJs = Join-Path $rootDir 'js'
if (Test-Path $srcJs) {
    Copy-Item -LiteralPath $srcJs -Destination $webDir -Recurse
}

$count = (Get-ChildItem -LiteralPath $webDir -Recurse -File).Count
Write-Host "Synced web assets to $webDir ($count files)" -ForegroundColor Green
