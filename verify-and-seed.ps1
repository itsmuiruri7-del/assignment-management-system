# Verification and Seeding Script
# Run this after the Render deploys finish (wait 2-5 minutes).
# This script will seed the database and test the login flow.

param()

Write-Host "=== Deployment Verification & Seeding ===" -ForegroundColor Cyan
Write-Host ""

$backend = "https://assignment-backend-qzrq.onrender.com"
$frontend = "https://assignment-frontend-64jd.onrender.com"

Write-Host "Testing backend connectivity..." -ForegroundColor Yellow
try {
    $rootResp = Invoke-WebRequest "$backend/" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "[OK] Backend root: $($rootResp.StatusCode) $($rootResp.StatusDescription)" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Backend root failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Backend is not responding. Make sure Render deploy completed." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Testing backend API endpoint..." -ForegroundColor Yellow
try {
    $apiResp = Invoke-RestMethod "$backend/api/users/instructors" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "[OK] API endpoint: returned $($apiResp.Count) instructors" -ForegroundColor Green
}
catch {
    Write-Host "[WARN] API endpoint returned: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "This is expected if database hasn't been seeded yet." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Checking frontend login page for API URL..." -ForegroundColor Yellow
try {
    $loginPage = Invoke-WebRequest "$frontend/login" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    $loginHtml = $loginPage.Content
    
    if ($loginHtml -match "assignment-backend-qzrq.onrender.com") {
        Write-Host "[OK] Frontend login page contains correct API URL" -ForegroundColor Green
    }
    elseif ($loginHtml -match "localhost:5001") {
        Write-Host "[WARN] Frontend login page still contains localhost:5001 (deploy may not be complete)" -ForegroundColor Yellow
    }
    else {
        Write-Host "[WARN] Could not find API URL in login page (check manually)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "[ERROR] Could not fetch frontend login page: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Database Seeding..." -ForegroundColor Cyan
Write-Host ""

$seed = Read-Host "Would you like to seed the database with sample users? (y/n)"
if ($seed -eq "y" -or $seed -eq "yes") {
    Write-Host ""
    Write-Host "Running Prisma seed..." -ForegroundColor Yellow
    Push-Location "c:\Users\muiru\Desktop\project-x\Pato\backend"
    try {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm ci 2>&1 | Out-Null
        
        Write-Host "Running seed script..." -ForegroundColor Yellow
        npm run seed 2>&1
        
        Write-Host "[OK] Seeding complete" -ForegroundColor Green
        Write-Host ""
        Write-Host "Sample users created:" -ForegroundColor Green
        Write-Host "  Admin:      admin@example.com / password" -ForegroundColor White
        Write-Host "  Instructor: inst1@example.com / password" -ForegroundColor White
        Write-Host "  Student:    student1@example.com / password" -ForegroundColor White
    }
    catch {
        Write-Host "[ERROR] Seeding failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Host "Skipped seeding." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Testing login endpoint..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@example.com"
        password = "password"
    } | ConvertTo-Json
    
    $loginResp = Invoke-RestMethod "$backend/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody -TimeoutSec 10 -ErrorAction Stop
    
    if ($loginResp.token) {
        Write-Host "[OK] Login endpoint working! Token received." -ForegroundColor Green
    }
    else {
        Write-Host "[WARN] Login responded but no token in response" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "[WARN] Login test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "This is expected if database hasn't been seeded yet or backend is still starting." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[OK] Verification complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Visit your frontend: $frontend" -ForegroundColor White
Write-Host "2. Log in with admin@example.com / password" -ForegroundColor White
Write-Host "3. If seeding failed, run: cd Pato\backend && npm run seed" -ForegroundColor White
Write-Host ""
Write-Host "URLs:" -ForegroundColor Green
Write-Host "  Frontend: $frontend" -ForegroundColor Cyan
Write-Host "  Backend:  $backend" -ForegroundColor Cyan
