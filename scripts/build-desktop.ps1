$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DesktopDir = Join-Path $ProjectRoot "desktop-app"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$ReleaseDir = Join-Path $ProjectRoot "releases"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Temple OS Desktop - Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Prerequisites
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js not found. Please install Node.js 20+."
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm not found."
}

# Step 1: Install frontend deps if needed
Write-Host "[1/5] Checking frontend dependencies..." -ForegroundColor Yellow
Push-Location $FrontendDir
if (-not (Test-Path "node_modules")) {
  Write-Host "  Installing frontend packages..."
  npm install
}
Pop-Location

# Step 2: Build frontend
Write-Host "[2/5] Building frontend (Next.js standalone)..." -ForegroundColor Yellow
Push-Location $FrontendDir
npm run build
Pop-Location
Write-Host "  Frontend build complete." -ForegroundColor Green

# Step 3: Install desktop deps if needed
Write-Host "[3/5] Checking desktop-app dependencies..." -ForegroundColor Yellow
Push-Location $DesktopDir
if (-not (Test-Path "node_modules")) {
  Write-Host "  Installing desktop-app packages..."
  npm install
}

# Ensure native module matches Electron version
Write-Host "  Rebuilding native modules for Electron..."
npm run rebuild:native 2>$null
Pop-Location

# Step 4: Package standalone version
Write-Host "[4/5] Packaging standalone version..." -ForegroundColor Yellow
Push-Location $DesktopDir
$env:TEMPLE_MODE = "standalone"
npm run pack:standalone
Pop-Location
Write-Host "  Standalone package complete." -ForegroundColor Green

# Step 5: Package networked version
Write-Host "[5/5] Packaging networked version..." -ForegroundColor Yellow
Push-Location $DesktopDir
Remove-Item Env:\TEMPLE_MODE -ErrorAction SilentlyContinue
npm run pack:networked
Pop-Location
Write-Host "  Networked package complete." -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Output: $ReleaseDir" -ForegroundColor White
Get-ChildItem $ReleaseDir -Filter "*.exe" | ForEach-Object {
  Write-Host "  $($_.Name)  ($('{0:N0} MB' -f ($_.Length / 1MB)))" -ForegroundColor White
}
Write-Host ""
Write-Host "Standalone:  TEMPLE_MODE=standalone  (no server needed)"
Write-Host "Networked:   TEMPLE_MODE=networked   (requires server)"
