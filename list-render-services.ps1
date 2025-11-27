# List Render Services Script
# This will show all your Render services with their IDs

$apiKeySecure = Read-Host -AsSecureString "Enter your Render API Key (will not echo)"
$RENDER_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKeySecure)
)

Write-Host ""
Write-Host "Fetching your Render services..." -ForegroundColor Cyan

try {
    $services = Invoke-RestMethod -Headers @{ Authorization = "Bearer $RENDER_API_KEY" } -Uri "https://api.render.com/v1/services" -Method Get -ErrorAction Stop
    
    Write-Host ""
    Write-Host "Available Services:" -ForegroundColor Green
    Write-Host ""
    
    foreach ($svc in $services) {
        Write-Host "Name: $($svc.name)" -ForegroundColor Yellow
        Write-Host "ID:   $($svc.id)" -ForegroundColor Cyan
        Write-Host "Type: $($svc.type)" -ForegroundColor White
        Write-Host "---"
    }
    
    Write-Host ""
    Write-Host "Use the IDs above in deploy-render.ps1" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Failed to fetch services: $($_.Exception.Message)" -ForegroundColor Red
}
