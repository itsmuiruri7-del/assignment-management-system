# Render Backend Diagnostic Script
# Run this to check backend status and get logs from Render

param()

Write-Host "=== Render Backend Diagnostic ===" -ForegroundColor Cyan
Write-Host ""

$apiKeySecure = Read-Host -AsSecureString "Enter your Render API Key"
$RENDER_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKeySecure)
)

$backendServiceId = "srv-d4k430fdiees73b9a460"

Write-Host "Checking backend service status..." -ForegroundColor Yellow

try {
    $svc = Invoke-RestMethod -Headers @{ Authorization = "Bearer $RENDER_API_KEY" } -Uri "https://api.render.com/v1/services/$backendServiceId" -Method Get -ErrorAction Stop
    
    Write-Host ""
    Write-Host "Service Name: $($svc.name)" -ForegroundColor Cyan
    Write-Host "Service ID: $($svc.id)" -ForegroundColor Cyan
    Write-Host "Status: $($svc.status)" -ForegroundColor $(if($svc.status -eq 'available') { 'Green' } else { 'Yellow' })
    Write-Host ""
    
    if ($svc.status -ne 'available') {
        Write-Host "Service is not available. Current status: $($svc.status)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Common reasons:" -ForegroundColor Yellow
        Write-Host "  - Service is still deploying/starting" -ForegroundColor White
        Write-Host "  - Build failed (check Recent Deploys on Render)" -ForegroundColor White
        Write-Host "  - Service crashed (check Logs on Render)" -ForegroundColor White
    }
    else {
        Write-Host "Service is available and should be responding." -ForegroundColor Green
        Write-Host ""
        Write-Host "Environment variables:" -ForegroundColor Cyan
        if ($svc.envVars) {
            foreach ($env in $svc.envVars) {
                $val = $env.value
                if ($env.key -match 'SECRET|PASSWORD|TOKEN|KEY') {
                    $val = "***"
                }
                Write-Host "  $($env.key) = $val" -ForegroundColor White
            }
        }
    }
    
    Write-Host ""
    Write-Host "Recent deploys:" -ForegroundColor Cyan
    $deploys = Invoke-RestMethod -Headers @{ Authorization = "Bearer $RENDER_API_KEY" } -Uri "https://api.render.com/v1/services/$backendServiceId/deploys?limit=5" -Method Get -ErrorAction Stop
    
    if ($deploys.PSObject.Properties.Name -contains 'PSObject') {
        foreach ($deploy in $deploys) {
            $status = $deploy.status
            $statusColor = switch ($status) {
                'build_in_progress' { 'Yellow' }
                'deploy_in_progress' { 'Yellow' }
                'live' { 'Green' }
                'build_failed' { 'Red' }
                'deploy_failed' { 'Red' }
                default { 'White' }
            }
            Write-Host "  Deploy ID: $($deploy.id) | Status: $status | Created: $($deploy.createdAt)" -ForegroundColor $statusColor
        }
    }
}
catch {
    Write-Host "[ERROR] Failed to check service: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Manual Actions on Render Dashboard:" -ForegroundColor Cyan
Write-Host "  1. Go to https://dashboard.render.com" -ForegroundColor White
Write-Host "  2. Find 'assignment-backend' service" -ForegroundColor White
Write-Host "  3. Click 'Logs' tab to see why it might not be running" -ForegroundColor White
Write-Host "  4. Click 'Manual Deploy' to trigger a fresh deploy" -ForegroundColor White
