param([string]$Prefix = (Join-Path $env:LOCALAPPDATA 'Driftline-cli'))
$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path $PSScriptRoot -Parent
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Install Node.js 22 or newer first.'
}
$major = [int]((& node --version).TrimStart('v').Split('.')[0])
if ($major -lt 22) { throw 'Node.js 22 or newer is required.' }
& npm.cmd install --global --prefix $Prefix --offline --ignore-scripts --no-audit --no-fund $projectDirectory
if ($LASTEXITCODE -ne 0) { throw 'Local CLI registration failed.' }
Write-Output "Registered Driftline from this checkout. Keep the checkout in place."
Write-Output "Run: & '$Prefix\driftline.cmd' check"
Write-Output "To remove registration: npm.cmd uninstall --global --prefix '$Prefix' driftline"
