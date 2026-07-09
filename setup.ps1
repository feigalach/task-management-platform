# setup.ps1
# One-shot setup for the Task Management Platform, for Windows/PowerShell.
#
# Recommended: double-click setup.bat (it launches this with -NoExit, so the
# window stays open no matter what - including on error).
#
# Or run manually from an existing terminal:
#   powershell -ExecutionPolicy Bypass -File setup.ps1

$RootDir   = $PSScriptRoot
$ServerDir = Join-Path $RootDir "server"
$ClientDir = Join-Path $RootDir "client"
$DbName    = "task_management"

function Info($msg)  { Write-Host "[setup] $msg" -ForegroundColor Cyan }
function Warn($msg)  { Write-Host "[setup] $msg" -ForegroundColor Yellow }
function Err($msg)   { Write-Host "[setup] $msg" -ForegroundColor Red }

function Run-Checked($block, $errorMessage) {
    & $block
    if ($LASTEXITCODE -ne 0) {
        throw $errorMessage
    }
}

try {
    # 0. Sanity checks
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw "Node.js is not installed or not on PATH. Install Node.js 18+ and re-run."
    }
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        throw "npm is not installed or not on PATH."
    }
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker is not installed or not on PATH. Install Docker Desktop (and make sure it's running) and re-run."
    }
    Info "Node version: $(node -v)"

    # 1. Database via Docker Compose
    Info "Starting PostgreSQL container via Docker Compose..."
    Push-Location $RootDir
    Run-Checked { docker compose up -d } "docker compose up -d failed. Is Docker Desktop running?"
    Pop-Location

    Info "Waiting for PostgreSQL to accept connections..."
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        docker exec pg-taskmanagement pg_isready -U postgres *> $null
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
        Start-Sleep -Seconds 1
    }
    if (-not $ready) {
        throw "PostgreSQL did not become ready in time. Check: docker logs pg-taskmanagement"
    }
    Info "PostgreSQL is ready (database '$DbName' is created automatically by the container)."

    # 2. .env files (only created if missing - safe to re-run)
    $ServerEnv = Join-Path $ServerDir ".env"
    if (-not (Test-Path $ServerEnv)) {
        Copy-Item (Join-Path $ServerDir ".env.example") $ServerEnv
        Info "Created server/.env from .env.example."
    } else {
        Info "server/.env already exists - leaving it untouched."
    }

    $ClientEnv = Join-Path $ClientDir ".env"
    if (-not (Test-Path $ClientEnv)) {
        Copy-Item (Join-Path $ClientDir ".env.example") $ClientEnv
        Info "Created client/.env from .env.example."
    } else {
        Info "client/.env already exists - leaving it untouched."
    }

    # 3. Install dependencies
    Info "Installing server dependencies (this can take a minute)..."
    Push-Location $ServerDir
    Run-Checked { npm install } "npm install failed in server/"
    Pop-Location

    Info "Installing client dependencies..."
    Push-Location $ClientDir
    Run-Checked { npm install } "npm install failed in client/"
    Pop-Location

    # 4. Migrations
    Info "Running database migrations..."
    Push-Location $ServerDir
    Run-Checked { npm run migration:run } "Migrations failed. Check the error above."
    Pop-Location

    # 5. Seed demo users
    Info "Seeding demo users..."
    Push-Location $ServerDir
    Run-Checked { npm run seed } "Seeding failed. Check the error above."
    Pop-Location

    Write-Host ""
    Info "Setup complete!"
    Info "Start the app with: start.bat  (or: powershell -File start.ps1)"
}
catch {
    Write-Host ""
    Err "Setup failed: $($_.Exception.Message)"
    Err "Scroll up for the full error output."
}
finally {
    Write-Host ""
    Read-Host "Press Enter to close this window"
}
