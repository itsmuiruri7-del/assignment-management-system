# Auto-Seed Database Script
# This automatically configures DATABASE_URL and runs the seed

param()

Write-Host "=== Auto-Seed Database ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
$envFile = "c:\Users\muiru\Desktop\project-x\Pato\backend\.env"

if (Test-Path $envFile) {
    Write-Host "[OK] .env file exists" -ForegroundColor Green
    Write-Host "Current content:" -ForegroundColor Yellow
    Get-Content $envFile | Write-Host
    Write-Host ""
}

Write-Host "Enter your PostgreSQL connection URL:" -ForegroundColor Yellow
Write-Host "(Should start with postgresql:// or postgres://)" -ForegroundColor White
Write-Host ""

$dbUrlSecure = Read-Host -AsSecureString "Database URL"
$DATABASE_URL = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbUrlSecure)
)

Write-Host ""
Write-Host "Creating/updating .env file..." -ForegroundColor Yellow

# Create or update .env file
@"
DATABASE_URL=$DATABASE_URL
JWT_SECRET=default-secret-key-change-in-production
NODE_ENV=development
"@ | Set-Content $envFile

Write-Host "[OK] .env file updated" -ForegroundColor Green
Write-Host ""

Write-Host "Generating Prisma client..." -ForegroundColor Yellow
Push-Location "c:\Users\muiru\Desktop\project-x\Pato\backend"

try {
    npx prisma generate 2>&1
    Write-Host ""
    Write-Host "Running seed script..." -ForegroundColor Yellow
    npm run seed 2>&1
    Write-Host ""
    Write-Host "[OK] Seeding complete!" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Seeding failed: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Visit: https://assignment-frontend-64jd.onrender.com" -ForegroundColor White
Write-Host "  2. Log in with: admin@example.com / password" -ForegroundColor White
