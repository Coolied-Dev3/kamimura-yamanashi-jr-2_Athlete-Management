#Requires -RunAsAdministrator
# ============================================================
# Kamimura Club player-management system
# Windows auto-start setup (run once as Administrator)
#   - Open firewall TCP 3002 (for LAN access)
#   - Register a startup task (SYSTEM) that runs run-prod.cmd
# Usage (in an elevated PowerShell, inside this folder):
#   powershell -ExecutionPolicy Bypass -File .\install-autostart.ps1
# ============================================================

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cmd  = Join-Path $root 'run-prod.cmd'
$taskName = 'KamimuraPlayers'
$port = 3002

Write-Host "Project : $root"
Write-Host "Command : $cmd"

# 1) Firewall (allow inbound TCP 3002)
if (-not (Get-NetFirewallRule -DisplayName "KamimuraPlayers (TCP $port)" -ErrorAction SilentlyContinue)) {
  New-NetFirewallRule -DisplayName "KamimuraPlayers (TCP $port)" -Direction Inbound -Action Allow -Protocol TCP -LocalPort $port -Profile Any | Out-Null
  Write-Host "[OK] Firewall rule added (allow TCP $port)"
} else {
  Write-Host "[..] Firewall rule already exists"
}

# 2) Startup task (SYSTEM / at startup). Delay 30s to wait for MySQL.
$action  = New-ScheduledTaskAction -Execute $cmd
$trigger = New-ScheduledTaskTrigger -AtStartup
$trigger.Delay = 'PT30S'
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$settings  = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Write-Host "[OK] Startup task '$taskName' registered (SYSTEM / at startup / 30s delay)"

# 3) Start now and verify
Start-ScheduledTask -TaskName $taskName
Start-Sleep -Seconds 4
try {
  $r = Invoke-WebRequest -UseBasicParsing "http://localhost:$port/teams" -TimeoutSec 10
  Write-Host "[OK] Server responded (HTTP $($r.StatusCode))"
} catch {
  Write-Host "[NG] Could not reach server. Check logs\server.log : $($_.Exception.Message)"
}

$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.*' } | Select-Object -First 1 -ExpandProperty IPAddress)
Write-Host ""
Write-Host "=== Setup done ==="
Write-Host "This PC    : http://localhost:$port"
if ($ip) { Write-Host "LAN client : http://${ip}:$port" }
Write-Host "It will start automatically after reboot."
