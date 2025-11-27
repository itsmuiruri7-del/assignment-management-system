# Set All Required Environment Variables on Render Backend

param()

Write-Host "=== Set Backend Environment Variables ===" -ForegroundColor Cyan
Write-Host ""

$apiKeySecure = Read-Host -AsSecureString "Enter your Render API Key"
$RENDER_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKeySecure)
)

Write-Host ""
Write-Host "Enter your PostgreSQL connection details from Render dashboard:" -ForegroundColor Yellow
Write-Host "  (Find these in: https://dashboard.render.com -> Your PostgreSQL database)" -ForegroundColor White
Write-Host ""

$dbUrlSecure = Read-Host -AsSecureString "Enter PostgreSQL External Database URL (starts with postgresql://)"
$DATABASE_URL = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbUrlSecure)
)

$BACKEND_SERVICE_ID = "srv-d4k430fdiees73b9a460"
$FRONTEND_URL = "https://assignment-frontend-64jd.onrender.com"

Write-Host ""
Write-Host "Setting environment variables on backend..." -ForegroundColor Yellow
Write-Host ""

# Generate a secure JWT secret
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object { [char]$_ })

# Build environment variables array
$envVars = @(
    @{ key = 'DATABASE_URL'; value = $DATABASE_URL; secure = $true }
    @{ key = 'JWT_SECRET'; value = $jwtSecret; secure = $true }
    @{ key = 'NODE_ENV'; value = 'production'; secure = $false }
    @{ key = 'CORS_ALLOWED_ORIGINS'; value = $FRONTEND_URL; secure = $false }
)

Write-Host "Environment variables to set:" -ForegroundColor Cyan
foreach ($env in $envVars) {
    $displayVal = $env.value
    if ($env.secure -or $env.value.length -gt 30) {
        $displayVal = $displayVal.Substring(0, [Math]::Min(20, $displayVal.length)) + "..."
    }
    Write-Host "  $($env.key) = $displayVal" -ForegroundColor White
}
Write-Host ""

$confirm = Read-Host "Continue? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "yes") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Patching backend service..." -ForegroundColor Yellow

$body = @{ envVars = $envVars } | ConvertTo-Json -Depth 10

try {
    $result = Invoke-RestMethod -Headers @{ Authorization = "Bearer $RENDER_API_KEY" } `
        -Uri "https://api.render.com/v1/services/$BACKEND_SERVICE_ID" `
        -Method Patch `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "[OK] Environment variables set successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Triggering manual deploy to apply changes..." -ForegroundColor Yellow
    
    $deployResult = Invoke-RestMethod -Headers @{ Authorization = "Bearer $RENDER_API_KEY" } `
        -Uri "https://api.render.com/v1/services/$BACKEND_SERVICE_ID/deploys" `
        -Method Post `
        -ContentType "application/json" `
        -Body '{}' `
        -ErrorAction Stop
    
    Write-Host "[OK] Deploy triggered (ID: $($deployResult.id))" -ForegroundColor Green
    Write-Host ""
    Write-Host "The backend service will now rebuild with all required environment variables." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Wait 3-5 minutes for Render to rebuild and deploy" -ForegroundColor White
    Write-Host "  2. Run: powershell -ExecutionPolicy Bypass -File verify-and-seed.ps1" -ForegroundColor White
    Write-Host "  3. This will test login and seed the database" -ForegroundColor White
}
catch {
    Write-Host "[ERROR] Failed to set environment variables: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        try {
            $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $errorBody = $streamReader.ReadToEnd()
            $streamReader.Close()
            Write-Host "Response: $errorBody" -ForegroundColor Yellow
        }
        catch { }
    }
}
