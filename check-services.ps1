# Simple Render Service Status Check

param()

Write-Host "=== Render Service Status Check ===" -ForegroundColor Cyan
Write-Host ""

$apiKeySecure = Read-Host -AsSecureString "Enter your Render API Key"
$RENDER_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKeySecure)
)

$BACKEND_SERVICE_ID = "srv-d4k430fdiees73b9a460"
$FRONTEND_SERVICE_ID = "srv-d4k5g7ruibrs73f909og"

Write-Host "Fetching all services..." -ForegroundColor Yellow
Write-Host ""

try {
    $services = Invoke-RestMethod -Headers @{ Authorization = "Bearer $RENDER_API_KEY" } `
        -Uri "https://api.render.com/v1/services" `
        -Method Get `
        -ErrorAction Stop
    
    Write-Host "Found $($services.Count) services" -ForegroundColor Cyan
    Write-Host ""
    
    foreach ($svc in $services) {
        $statusColor = switch ($svc.status) {
            'available' { 'Green' }
            'building' { 'Yellow' }
            'deploying' { 'Yellow' }
            'suspended' { 'Red' }
            'crashed' { 'Red' }
            default { 'White' }
        }
        
        Write-Host "Service: $($svc.name)" -ForegroundColor White
        Write-Host "  ID: $($svc.id)" -ForegroundColor Cyan
        Write-Host "  Status: $($svc.status)" -ForegroundColor $statusColor
        Write-Host "  Type: $($svc.type)" -ForegroundColor White
        Write-Host "  Region: $($svc.region)" -ForegroundColor White
        Write-Host ""
        
        if ($svc.id -eq $BACKEND_SERVICE_ID) {
            Write-Host "  >>> This is your BACKEND <<<" -ForegroundColor Yellow
            Write-Host ""
        }
        elseif ($svc.id -eq $FRONTEND_SERVICE_ID) {
            Write-Host "  >>> This is your FRONTEND <<<" -ForegroundColor Yellow
            Write-Host ""
        }
    }
    
    Write-Host "Manual actions on Render dashboard:" -ForegroundColor Green
    Write-Host "  1. Visit https://dashboard.render.com" -ForegroundColor White
    Write-Host "  2. Look for 'assignment-backend' service" -ForegroundColor White
    Write-Host "  3. Check its status and recent logs" -ForegroundColor White
    Write-Host "  4. If crashed, click 'Manual Deploy' to restart" -ForegroundColor White
}
catch {
    Write-Host "[ERROR] Failed to fetch services: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  - Check that your Render API key is valid" -ForegroundColor White
    Write-Host "  - Visit https://dashboard.render.com to check account status" -ForegroundColor White
}
