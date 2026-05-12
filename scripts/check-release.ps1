param(
  [Parameter(Mandatory = $true)]
  [string]$ZipPath
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $ZipPath)) {
  throw "Release package not found: $ZipPath"
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $ZipPath))

try {
  $names = $zip.Entries | ForEach-Object { $_.FullName.Replace("\", "/") }

  $required = @(
    "backend/package.json",
    "frontend/package.json",
    "desktop-app/package.json",
    "print-service/package.json",
    "docker/.env.example"
  )

  $forbiddenPatterns = @(
    "(^|/)node_modules/",
    "(^|/)\.next/",
    "(^|/)dist/",
    "(^|/)backup/",
    "(^|/)logs/",
    "(^|/)frontend-deploy/",
    "(^|/)frontend-runtime/",
    "(^|)\.env$",
    "(^|/)backend/\.env$",
    "(^|/)docker/\.env$",
    "frontend\.log$"
  )

  $missing = $required | Where-Object { $names -notcontains $_ }
  if ($missing.Count -gt 0) {
    throw "Release package is missing required files: $($missing -join ', ')"
  }

  $forbidden = foreach ($pattern in $forbiddenPatterns) {
    $names | Where-Object { $_ -match $pattern }
  }

  if ($forbidden.Count -gt 0) {
    throw "Release package contains forbidden files: $($forbidden | Select-Object -First 20 -join ', ')"
  }

  Write-Output "Release package OK: $ZipPath"
}
finally {
  $zip.Dispose()
}
