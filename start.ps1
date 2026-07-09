# start.ps1
# Starts the server and client dev servers, each in ITS OWN terminal tab
# (using Windows Terminal, if installed) so you can see both logs side by
# side and neither window closes automatically - even on error, since each
# tab runs "powershell -NoExit".
#
# Recommended: double-click start.bat
# Or run manually: powershell -ExecutionPolicy Bypass -File start.ps1

$RootDir   = $PSScriptRoot
$ServerDir = Join-Path $RootDir "server"
$ClientDir = Join-Path $RootDir "client"

function Info($msg) { Write-Host "[start] $msg" -ForegroundColor Cyan }
function Err($msg)  { Write-Host "[start] $msg" -ForegroundColor Red }

if (-not (Test-Path (Join-Path $ServerDir "node_modules"))) {
    Err "Server dependencies are not installed yet. Run setup.bat first."
    Read-Host "Press Enter to close"
    exit 1
}
if (-not (Test-Path (Join-Path $ClientDir "node_modules"))) {
    Err "Client dependencies are not installed yet. Run setup.bat first."
    Read-Host "Press Enter to close"
    exit 1
}

$wt = Get-Command wt -ErrorAction SilentlyContinue

if ($wt) {
    Info "Windows Terminal found - opening Server and Client each in its own tab..."

    $argsList = @(
        "-w", "0",
        "new-tab", "--title", "Server", "-d", $ServerDir, "powershell", "-NoExit", "-Command", "npm run dev",
        ";",
        "new-tab", "--title", "Client", "-d", $ClientDir, "powershell", "-NoExit", "-Command", "npm run dev"
    )
    Start-Process -FilePath "wt" -ArgumentList $argsList
}
else {
    Info "Windows Terminal (wt) not found - opening two separate PowerShell windows instead."
    Info "(Install 'Windows Terminal' from the Microsoft Store to get tabs instead.)"

    Start-Process powershell -ArgumentList @("-NoExit", "-Command", "cd `"$ServerDir`"; npm run dev")
    Start-Process powershell -ArgumentList @("-NoExit", "-Command", "cd `"$ClientDir`"; npm run dev")
}

Write-Host ""
Info "Server  -> http://localhost:3000"
Info "Client  -> http://localhost:5173"
Write-Host ""
Read-Host "Press Enter to close this launcher window (the Server/Client windows keep running)"
