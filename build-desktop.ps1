param(
    [switch]$SkipTauriBuild
)

$ErrorActionPreference = "Stop"

$CargoBin = Join-Path $env:USERPROFILE ".cargo\bin"
if (Test-Path $CargoBin) {
    $env:PATH = "$CargoBin;$env:PATH"
}

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Back = Join-Path $Root "galtek-one-back"
$Front = Join-Path $Root "galtek-one-front"
$BackendJar = Join-Path $Back "target\galtek-one-back-0.0.1.jar"
$TauriBackendDir = Join-Path $Front "src-tauri\resources\backend"
$TauriBackendJar = Join-Path $TauriBackendDir "galtek-one-back.jar"
$TauriJreDir = Join-Path $Front "src-tauri\resources\jre"

Write-Host "== Galtek One desktop build =="
Write-Host "Building backend..."
Push-Location $Back
try {
    .\mvnw.cmd -DskipTests package
}
finally {
    Pop-Location
}

New-Item -ItemType Directory -Force $TauriBackendDir | Out-Null
Copy-Item -LiteralPath $BackendJar -Destination $TauriBackendJar -Force
Write-Host "Backend copied to $TauriBackendJar"

if (-not (Test-Path (Join-Path $TauriJreDir "bin\java.exe"))) {
    Write-Warning "No bundled JRE found at $TauriJreDir. Galtek One will use system Java unless you place a Windows JRE there."
}

Write-Host "Building frontend..."
Push-Location $Front
try {
    npm.cmd run build

    if ($SkipTauriBuild) {
        Write-Host "Skipping Tauri build by request."
        return
    }

    if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
        throw "Rust/Cargo is not installed or not in PATH. Install Rust, reopen the terminal, then run this script again."
    }

    npm.cmd run desktop:build
}
finally {
    Pop-Location
}