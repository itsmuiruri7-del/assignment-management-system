# Check Render Backend Environment Variables

param()

Write-Host "=== Check Render Backend Environment ===" -ForegroundColor Cyan
Write-Host ""

$apiKeySecure = Read-Host -AsSecureString "Enter your Render API Key"
$RENDER_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKeySecure)
)

$BACKEND_SERVICE_ID = "srv-d4k430fdiees73b9a460"

Write-Host "Fetching backend service configuration..." -ForegroundColor Yellow
Write-Host ""

try {
    $svc = Invoke-RestMethod -Headers @{ Authorization = "Bearer $RENDER_API_KEY" } `
        -Uri "https://api.render.com/v1/services/$BACKEND_SERVICE_ID" `
        -Method Get `
        -ErrorAction Stop
    
    Write-Host "Service: $($svc.name)" -ForegroundColor Cyan
    Write-Host "Status: $($svc.status)" -ForegroundColor $(if($svc.status -eq 'available') { 'Green' } else { 'Yellow' })
    Write-Host ""
    
    Write-Host "Environment Variables:" -ForegroundColor Green
    Write-Host "=====================" -ForegroundColor Green
    
    if ($svc.envVars) {
        foreach ($env in $svc.envVars) {
            $val = $env.value
            if ($env.key -match 'SECRET|PASSWORD|TOKEN|KEY|URL' -and $val.length -gt 20) {
                $val = $val.Substring(0, 20) + "..."
            }
            Write-Host "  $($env.key) = $val" -ForegroundColor White
        }
    } else {
        Write-Host "  (No environment variables set)" -ForegroundColor Yellow
    }
    
    # Check for required vars
    Write-Host ""
    Write-Host "Required Environment Variables Check:" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan
    
    $requiredVars = @('DATABASE_URL', 'JWT_SECRET', 'NODE_ENV')
    foreach ($required in $requiredVars) {
        $found = $svc.envVars | Where-Object { $_.key -eq $required }
        if ($found) {
            Write-Host "[OK] $required is set" -ForegroundColor Green
        } else {
            Write-Host "[MISSING] $required is NOT set" -ForegroundColor Red
        }
    }
}
catch {
    Write-Host "[ERROR] Failed to fetch service: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "If DATABASE_URL is missing:" -ForegroundColor Yellow
Write-Host "  1. Go to https://dashboard.render.com" -ForegroundColor White
Write-Host "  2. Find your PostgreSQL database" -ForegroundColor White
Write-Host "  3. Copy the External Database URL" -ForegroundColor White
Write-Host "  4. Add it to 'assignment-backend' service as DATABASE_URL env var" -ForegroundColor White
Write-Host "  5. Trigger Manual Deploy" -ForegroundColor White
