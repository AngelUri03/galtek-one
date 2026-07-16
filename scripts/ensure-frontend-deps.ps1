$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Front = Join-Path $Root "galtek-one-front"
$EnvPath = Join-Path $Front ".env"
$EnvExamplePath = Join-Path $Front ".env.example"
$ReactScripts = Join-Path $Front "node_modules\react-scripts"

if (-not (Test-Path -LiteralPath $EnvPath) -and (Test-Path -LiteralPath $EnvExamplePath)) {
    Copy-Item -LiteralPath $EnvExamplePath -Destination $EnvPath
    Write-Host "Frontend env created: $EnvPath"
}

if (Test-Path -LiteralPath $ReactScripts) {
    Write-Host "Frontend dependencies found."
    return
}

Write-Host "Installing frontend dependencies..."
Push-Location $Front
try {
    npm.cmd ci
}
finally {
    Pop-Location
}
