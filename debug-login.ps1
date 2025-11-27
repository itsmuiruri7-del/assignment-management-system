# Debug Login Issue
# This script tests the login endpoint and shows exact responses

param()

Write-Host "=== Login Debug Script ===" -ForegroundColor Cyan
Write-Host ""

$backend = "https://assignment-backend-qzrq.onrender.com"

Write-Host "Step 1: Testing backend connectivity..." -ForegroundColor Yellow
try {
    $rootResp = Invoke-WebRequest "$backend/" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "[OK] Backend is responding: $($rootResp.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Backend not responding: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Testing API health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod "$backend/api/health" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "[OK] Health check: $($health.status)" -ForegroundColor Green
}
catch {
    Write-Host "[WARN] Health endpoint not available: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3: Testing database connectivity..." -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod "$backend/api/users/instructors" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "[OK] Database is working. Found $($users.Count) instructors" -ForegroundColor Green
    if ($users.Count -eq 0) {
        Write-Host "[WARN] No instructors in database - might need to seed" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "[ERROR] Database query failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 4: Testing login endpoint..." -ForegroundColor Yellow

$loginBody = @{
    email = "admin@example.com"
    password = "password"
} | ConvertTo-Json

Write-Host "Request: POST $backend/api/auth/login" -ForegroundColor Cyan
Write-Host "Body: $loginBody" -ForegroundColor White
Write-Host ""

try {
    $loginResp = Invoke-RestMethod "$backend/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    Write-Host "[OK] Login successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $loginResp | ConvertTo-Json | Write-Host
    
    if ($loginResp.token) {
        Write-Host ""
        Write-Host "Token received: $($loginResp.token.Substring(0, 20))..." -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "[ERROR] Token missing in response!" -ForegroundColor Red
    }
}
catch {
    $errorMsg = $_.Exception.Message
    Write-Host "[ERROR] Login failed: $errorMsg" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $streamReader.ReadToEnd()
        $streamReader.Close()
        
        Write-Host ""
        Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
        Write-Host "Response Body:" -ForegroundColor Cyan
        Write-Host $responseBody -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Debug Summary:" -ForegroundColor Cyan
Write-Host "  If you see 'Token received', login is working on backend" -ForegroundColor White
Write-Host "  If 'token' field is missing, check backend login controller" -ForegroundColor White
Write-Host "  If '404 Not Found', check backend is deployed correctly" -ForegroundColor White
Write-Host "  If '500 error', check backend logs on Render dashboard" -ForegroundColor White
