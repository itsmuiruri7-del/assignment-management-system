# Automatic database fix script
# This script pushes the Prisma schema and seeds the database

Write-Host "=== Automatic Database Fix ===" -ForegroundColor Cyan
Write-Host "This will push the schema to the Render database and seed it with test users"
Write-Host ""

$backendDir = "c:\Users\muiru\Desktop\project-x\Pato\backend"
Set-Location $backendDir

Write-Host "Step 1: Pushing Prisma schema to database..." -ForegroundColor Yellow
try {
    $output = & npx prisma db push --skip-generate --accept-data-loss 2>&1
    Write-Host $output -ForegroundColor Green
    Write-Host "[OK] Schema pushed successfully" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to push schema: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Seeding database with test users..." -ForegroundColor Yellow
try {
    $output = & npm run seed 2>&1
    Write-Host $output -ForegroundColor Green
    Write-Host "[OK] Database seeded successfully" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to seed database: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Testing login..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

$loginUrl = "https://assignment-backend-qzrq.onrender.com/api/auth/login"
$body = @{
    email = "admin@example.com"
    password = "password"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri $loginUrl -Method POST -ContentType "application/json" -Body $body -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.token) {
        Write-Host "[OK] Login successful! Token received" -ForegroundColor Green
        Write-Host "Token: $($data.token.Substring(0, 20))..." -ForegroundColor Cyan
    } else {
        Write-Host "[ERROR] Login failed: No token in response" -ForegroundColor Red
        Write-Host "Response: $($response.Content)" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] Backend request failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Fix Complete ===" -ForegroundColor Green
Write-Host "If login test shows [OK], the deployment is working!"
