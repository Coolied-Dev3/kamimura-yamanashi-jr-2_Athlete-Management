#Requires -RunAsAdministrator
# ============================================================
# Rebuild the frontend and restart the auto-start server task.
# Run this (as Administrator) after changing the code.
#   powershell -ExecutionPolicy Bypass -File .\update-prod.ps1
# ============================================================
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host "Building frontend..."
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "[NG] build failed"; exit 1 }

Write-Host "Restarting service task..."
Stop-ScheduledTask -TaskName 'KamimuraPlayers' -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Start-ScheduledTask -TaskName 'KamimuraPlayers'
Start-Sleep -Seconds 5

try {
  $r = Invoke-WebRequest -UseBasicParsing "http://localhost:3002/teams" -TimeoutSec 10
  Write-Host "[OK] Server responded (HTTP $($r.StatusCode))"
} catch {
  Write-Host "[NG] Could not reach server. Check logs\server.log : $($_.Exception.Message)"
}
Write-Host "Done."
