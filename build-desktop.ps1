param(
    [switch]$SkipTauriBuild,
    [switch]$SkipJreBundle
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
$JreDownloadUrl = "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jre/hotspot/normal/eclipse?project=jdk"

function Ensure-FrontendDependencies {
    $NodeModules = Join-Path $Front "node_modules"
    if (Test-Path (Join-Path $NodeModules "react-scripts")) {
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
}

function Ensure-BundledJre {
    if ($SkipJreBundle) {
        Write-Warning "Skipping bundled JRE. Galtek One will require system Java on target machines."
        return
    }

    if (Test-Path (Join-Path $TauriJreDir "bin\javaw.exe")) {
        Write-Host "Bundled JRE found at $TauriJreDir"
        return
    }

    Write-Host "Downloading bundled JRE 21..."
    $TempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("galtek-one-jre-" + [System.Guid]::NewGuid().ToString("N"))
    $ZipPath = Join-Path $TempRoot "jre.zip"
    $ExtractPath = Join-Path $TempRoot "extract"

    New-Item -ItemType Directory -Force -Path $TempRoot, $ExtractPath | Out-Null

    try {
        Invoke-WebRequest -Uri $JreDownloadUrl -OutFile $ZipPath
        Expand-Archive -LiteralPath $ZipPath -DestinationPath $ExtractPath -Force

        $JavaExe = Get-ChildItem -Path $ExtractPath -Recurse -Filter "java.exe" |
            Where-Object { $_.FullName -like "*\bin\java.exe" } |
            Select-Object -First 1

        if (-not $JavaExe) {
            throw "Downloaded JRE did not contain bin\java.exe."
        }

        $JreRoot = Split-Path -Parent (Split-Path -Parent $JavaExe.FullName)

        if (Test-Path $TauriJreDir) {
            Remove-Item -LiteralPath $TauriJreDir -Recurse -Force
        }

        New-Item -ItemType Directory -Force $TauriJreDir | Out-Null
        Copy-Item -Path (Join-Path $JreRoot "*") -Destination $TauriJreDir -Recurse -Force

        if (-not (Test-Path (Join-Path $TauriJreDir "bin\javaw.exe"))) {
            throw "Bundled JRE was copied, but bin\javaw.exe is missing."
        }

        Write-Host "Bundled JRE installed at $TauriJreDir"
    }
    finally {
        if (Test-Path $TempRoot) {
            Remove-Item -LiteralPath $TempRoot -Recurse -Force
        }
    }
}

Write-Host "== Galtek One desktop build =="
Ensure-FrontendDependencies
Ensure-BundledJre

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
