# Verification and Seeding Script
# Run this after the Render deploys finish (wait 2-5 minutes).

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
}

Write-Host ""
Write-Host "Testing backend API endpoint..." -ForegroundColor Yellow
try {
    $apiResp = Invoke-RestMethod "$backend/api/users/instructors" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "[OK] API endpoint: returned $($apiResp.Count) instructors" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] API endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
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
Write-Host "Verification complete!" -ForegroundColor Green
Write-Host ""

$seed = Read-Host "Would you like to run database seeding now? (y/n)"
if ($seed -eq "y" -or $seed -eq "yes") {
    Write-Host ""
    Write-Host "Running Prisma seed..." -ForegroundColor Yellow
    Push-Location "c:\Users\muiru\Desktop\project-x\Pato\backend"
    try {
        npm ci 2>&1 | Out-Null
        npm run seed 2>&1
        Write-Host "[OK] Seeding complete" -ForegroundColor Green
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
Write-Host "[OK] All done! Your app should now be live:" -ForegroundColor Green
Write-Host "  Frontend: $frontend"
Write-Host "  Backend: $backend"
