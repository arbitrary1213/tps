param(
  [string]$OutputDir = "releases"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$ReleaseName = "temple-os-release-$Timestamp"
$ReleaseRoot = Join-Path $ProjectRoot $OutputDir
$StageDir = Join-Path $ReleaseRoot $ReleaseName
$ZipPath = Join-Path $ReleaseRoot "$ReleaseName.zip"

$ExcludedDirs = @(
  ".git",
  "node_modules",
  ".next",
  "dist",
  "backup",
  "logs",
  "frontend-deploy",
  "frontend-runtime",
  "desktop-app\node_modules",
  "releases"
)

$ExcludedFiles = @(
  ".env",
  "frontend.log",
  "*.tsbuildinfo",
  "npm-debug.log*",
  "yarn-debug.log*",
  "yarn-error.log*"
)

if (-not (Test-Path $ReleaseRoot)) {
  New-Item -ItemType Directory -Path $ReleaseRoot | Out-Null
}

if (Test-Path $StageDir) {
  Remove-Item -Recurse -Force $StageDir
}

New-Item -ItemType Directory -Path $StageDir | Out-Null

$robocopyArgs = @(
  $ProjectRoot,
  $StageDir,
  "/E",
  "/XD"
) + $ExcludedDirs + @(
  "/XF"
) + $ExcludedFiles + @(
  "/NFL",
  "/NDL",
  "/NJH",
  "/NJS",
  "/NP"
)

robocopy @robocopyArgs | Out-Null
if ($LASTEXITCODE -ge 8) {
  throw "robocopy failed with exit code $LASTEXITCODE"
}

if (Test-Path $ZipPath) {
  Remove-Item -Force $ZipPath
}

Compress-Archive -Path (Join-Path $StageDir "*") -DestinationPath $ZipPath -Force
Remove-Item -Recurse -Force $StageDir

Write-Output $ZipPath
