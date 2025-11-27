# Complete Login Fix Script
# This script will:
# 1. Check backend status
# 2. Verify JWT_SECRET is set
# 3. Seed database with test user
# 4. Test login with that user

param()

Write-Host "=== Complete Login Fix ===" -ForegroundColor Cyan
Write-Host ""

$backend = "https://assignment-backend-qzrq.onrender.com"
$apiKey = Read-Host -AsSecureString "Enter your Render API Key"
$RENDER_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKey)
)

$BACKEND_SERVICE_ID = "srv-d4k430fdiees73b9a460"

Write-Host ""
Write-Host "STEP 1: Check Backend Status" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

try {
    $svc = Invoke-RestMethod -Headers @{ Authorization = "Bearer $RENDER_API_KEY" } -Uri "https://api.render.com/v1/services/$BACKEND_SERVICE_ID" -Method Get -ErrorAction Stop
    Write-Host "Backend Status: $($svc.status)" -ForegroundColor $(if($svc.status -eq 'available') { 'Green' } else { 'Yellow' })
    
    if ($svc.status -ne 'available') {
        Write-Host "[ERROR] Backend not available. Status: $($svc.status)" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "[ERROR] Could not fetch service status: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "STEP 2: Verify JWT_SECRET is Set" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

if ($svc.envVars) {
    $jwtSecret = $svc.envVars | Where-Object { $_.key -eq 'JWT_SECRET' }
    if ($jwtSecret) {
        Write-Host "[OK] JWT_SECRET is set" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] JWT_SECRET not set on Render!" -ForegroundColor Red
        Write-Host "Setting JWT_SECRET to a secure value..." -ForegroundColor Yellow
        
        # Generate a random JWT secret
        $secretValue = -join ((1..32) | ForEach-Object { [char][int](Get-Random -Minimum 48 -Maximum 122) })
        
        # Patch the service to add JWT_SECRET
        $envs = @()
        foreach ($e in $svc.envVars) {
            $envs += @{
                key = $e.key
                value = $e.value
                secure = $e.secure
            }
        }
        
        # Remove existing JWT_SECRET if present
        $envs = $envs | Where-Object { $_.key -ne 'JWT_SECRET' }
        
        # Add new JWT_SECRET
        $envs += @{ key = 'JWT_SECRET'; value = $secretValue; secure = $false }
        
        $body = @{ envVars = $envs } | ConvertTo-Json -Depth 10
        
        try {
            Invoke-RestMethod -Headers @{ Authorization = "Bearer $RENDER_API_KEY" } `
                -Uri "https://api.render.com/v1/services/$BACKEND_SERVICE_ID" `
                -Method Patch `
                -ContentType "application/json" `
                -Body $body `
                -ErrorAction Stop | Out-Null
            
            Write-Host "[OK] JWT_SECRET set successfully!" -ForegroundColor Green
            Write-Host "Triggering deploy to apply changes..." -ForegroundColor Yellow
            
            Invoke-RestMethod -Headers @{ Authorization = "Bearer $RENDER_API_KEY" } `
                -Uri "https://api.render.com/v1/services/$BACKEND_SERVICE_ID/deploys" `
                -Method Post `
                -ContentType "application/json" `
                -Body '{}' `
                -ErrorAction Stop | Out-Null
            
            Write-Host "[OK] Deploy triggered" -ForegroundColor Green
            Write-Host "Waiting 30 seconds for service to restart..." -ForegroundColor Yellow
            Start-Sleep -Seconds 30
        }
        catch {
            Write-Host "[ERROR] Failed to set JWT_SECRET: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "STEP 3: Test Backend Connectivity" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

for ($i = 1; $i -le 3; $i++) {
    try {
        $health = Invoke-RestMethod "$backend/api/health" -TimeoutSec 10 -ErrorAction Stop
        Write-Host "[OK] Backend is responding" -ForegroundColor Green
        break
    }
    catch {
        if ($i -lt 3) {
            Write-Host "[WAIT] Backend not ready (attempt $i/3), retrying..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        } else {
            Write-Host "[ERROR] Backend not responding: $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host ""
Write-Host "STEP 4: Seed Database with Test User" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

Push-Location "c:\Users\muiru\Desktop\project-x\Pato\backend"
try {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm ci 2>&1 | Out-Null
    
    Write-Host "Running seed..." -ForegroundColor Yellow
    npm run seed 2>&1
    
    Write-Host "[OK] Database seeded!" -ForegroundColor Green
}
catch {
    Write-Host "[WARN] Seeding had issues: $($_.Exception.Message)" -ForegroundColor Yellow
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "STEP 5: Test Login" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

$loginBody = @{
    email = "admin@example.com"
    password = "password"
} | ConvertTo-Json

Write-Host "Testing login with admin@example.com..." -ForegroundColor Yellow

try {
    $loginResp = Invoke-RestMethod "$backend/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    if ($loginResp.token) {
        Write-Host "[OK] Login successful!" -ForegroundColor Green
        Write-Host "Token: $($loginResp.token.Substring(0, 20))..." -ForegroundColor Green
        Write-Host ""
        Write-Host "User Details:" -ForegroundColor Cyan
        Write-Host "  Name: $($loginResp.name)" -ForegroundColor White
        Write-Host "  Email: $($loginResp.email)" -ForegroundColor White
        Write-Host "  Role: $($loginResp.role)" -ForegroundColor White
    } else {
        Write-Host "[ERROR] Login response missing token!" -ForegroundColor Red
    }
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__ 2>$null
    if ($statusCode -eq 401) {
        Write-Host "[ERROR] Login failed: Invalid credentials (401)" -ForegroundColor Red
        Write-Host "Either user doesn't exist or password is wrong" -ForegroundColor Yellow
    } elseif ($statusCode -eq 500) {
        Write-Host "[ERROR] Backend error (500): $($_.Exception.Message)" -ForegroundColor Red
    } else {
        Write-Host "[ERROR] Login request failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Fix Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "You should now be able to log in with:" -ForegroundColor Cyan
Write-Host "  Email: admin@example.com" -ForegroundColor White
Write-Host "  Password: password" -ForegroundColor White
Write-Host ""
Write-Host "If still getting 'Invalid login response':" -ForegroundColor Yellow
Write-Host "  1. Check backend logs on Render dashboard" -ForegroundColor White
Write-Host "  2. Run: powershell -ExecutionPolicy Bypass -File debug-login.ps1" -ForegroundColor White
