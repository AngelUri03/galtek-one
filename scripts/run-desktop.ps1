param(
    [switch]$PreferPortable
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ReleaseExe = Join-Path $Root "galtek-one-front\src-tauri\target\release\galtek-one.exe"
$PortableExe = Join-Path $Root "dist-desktop\Galtek One Portable\Galtek One.exe"

$CandidatePaths = if ($PreferPortable) {
    @($PortableExe, $ReleaseExe)
}
else {
    @($ReleaseExe, $PortableExe)
}

$Exe = $CandidatePaths |
    Where-Object { Test-Path -LiteralPath $_ } |
    Select-Object -First 1

if (-not $Exe) {
    $Exe = Get-ChildItem -Path (Join-Path $Root "dist-desktop") -Recurse -Filter "*.exe" -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notmatch "(?i)setup|installer" } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -ExpandProperty FullName -First 1
}

if (-not $Exe) {
    throw "No se encontro un ejecutable. Genera uno primero con: npm run exe:build"
}

Write-Host "Opening desktop app: $Exe"
Start-Process -FilePath $Exe -WorkingDirectory (Split-Path -Parent $Exe)
