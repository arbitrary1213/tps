$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DesktopDir = Join-Path $ProjectRoot "desktop-app"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$FrontendPort = 3900

if (-not (Test-Path $DesktopDir)) {
  throw "desktop-app directory not found: $DesktopDir"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is not installed or not in PATH. Install Node.js first."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm is not installed or not in PATH. Install Node.js first."
}

$portUsers = Get-NetTCPConnection -LocalPort $FrontendPort -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique
foreach ($processId in $portUsers) {
  if (-not $processId) {
    continue
  }
  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
  if (-not $process) {
    continue
  }

  Write-Host "Stopping old local frontend process on port $FrontendPort (PID $processId)..."
  Stop-Process -Id $processId -Force
}

Push-Location $DesktopDir
try {
  if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
    Write-Host "Installing frontend dependencies for local admin..."
    Push-Location $FrontendDir
    try {
      npm install
    }
    finally {
      Pop-Location
    }
  }

  Write-Host "Building local admin frontend..."
  Push-Location $FrontendDir
  try {
    npm run build
  }
  finally {
    Pop-Location
  }

  if (-not (Test-Path "node_modules")) {
    Write-Host "Installing desktop dependencies..."
    npm install
  }

  Write-Host "Checking desktop app..."
  npm run check

  Write-Host "Starting Temple OS Desktop..."
  npm start
}
finally {
  Pop-Location
}
