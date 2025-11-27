# Quick Render Deploy Trigger
# This manually triggers a fresh deploy on Render after recent fixes

param()

Write-Host "=== Render Quick Deploy Trigger ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will manually trigger fresh deploys of both services." -ForegroundColor White
Write-Host ""

$apiKeySecure = Read-Host -AsSecureString "Enter your Render API Key"
$RENDER_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKeySecure)
)

$FRONTEND_SERVICE_ID = "srv-d4k5g7ruibrs73f909og"
$BACKEND_SERVICE_ID = "srv-d4k430fdiees73b9a460"

function Trigger-Deploy {
    param([string]$serviceId, [string]$serviceName)
    
    $deployUrl = "https://api.render.com/v1/services/$serviceId/deploys"
    
    try {
        Write-Host "Triggering $serviceName deploy..." -ForegroundColor Yellow
        $resp = Invoke-RestMethod -Headers @{ Authorization = "Bearer $RENDER_API_KEY" } -Uri $deployUrl -Method Post -ContentType "application/json" -Body '{}' -ErrorAction Stop
        
        Write-Host "[OK] $serviceName deploy triggered (id: $($resp.id))" -ForegroundColor Green
        return $resp.id
    } catch {
        Write-Host "[ERROR] Failed to trigger $serviceName deploy: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

Write-Host "Starting fresh deploys..." -ForegroundColor Cyan
Write-Host ""

$frontendId = Trigger-Deploy $FRONTEND_SERVICE_ID "Frontend"
Write-Host ""
$backendId = Trigger-Deploy $BACKEND_SERVICE_ID "Backend"

Write-Host ""
Write-Host "Deploy Status:" -ForegroundColor Green
Write-Host "  Frontend: $frontendId" -ForegroundColor Cyan
Write-Host "  Backend:  $backendId" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Wait 3-5 minutes for Render to build and deploy" -ForegroundColor White
Write-Host "  2. Run: powershell -ExecutionPolicy Bypass -File verify-and-seed.ps1" -ForegroundColor White
Write-Host "  3. Verification script will retry connecting to backend" -ForegroundColor White
