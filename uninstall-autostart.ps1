#Requires -RunAsAdministrator
# ============================================================
# Remove the KamimuraPlayers startup task and firewall rule.
#   powershell -ExecutionPolicy Bypass -File .\uninstall-autostart.ps1
# ============================================================
$taskName = 'KamimuraPlayers'
$port = 3002

Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Write-Host "[OK] Task '$taskName' removed (if it existed)"

Remove-NetFirewallRule -DisplayName "KamimuraPlayers (TCP $port)" -ErrorAction SilentlyContinue
Write-Host "[OK] Firewall rule removed (if it existed)"
