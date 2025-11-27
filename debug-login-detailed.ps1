# Detailed Login Error Debug
# Shows exact error response from backend

param()

Write-Host "=== Detailed Login Error Debug ===" -ForegroundColor Cyan
Write-Host ""

$backend = "https://assignment-backend-qzrq.onrender.com"

Write-Host "Testing login endpoint with detailed error capture..." -ForegroundColor Yellow
Write-Host ""

$loginBody = @{
    email = "admin@example.com"
    password = "password"
} | ConvertTo-Json

Write-Host "Request Details:" -ForegroundColor Cyan
Write-Host "  URL: POST $backend/api/auth/login" -ForegroundColor White
Write-Host "  Body: $loginBody" -ForegroundColor White
Write-Host ""

try {
    $response = Invoke-WebRequest `
        -Uri "$backend/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response Body:" -ForegroundColor Cyan
    $response.Content | Write-Host
}
catch {
    Write-Host "ERROR CAUGHT" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "HTTP Status Code: $statusCode" -ForegroundColor Yellow
        
        try {
            $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $errorBody = $streamReader.ReadToEnd()
            $streamReader.Close()
            
            Write-Host ""
            Write-Host "Error Response Body:" -ForegroundColor Yellow
            Write-Host $errorBody -ForegroundColor White
            
            # Try to parse JSON
            try {
                $jsonError = $errorBody | ConvertFrom-Json
                Write-Host ""
                Write-Host "Parsed Error:" -ForegroundColor Cyan
                $jsonError | ConvertTo-Json | Write-Host
            }
            catch {
                # Not JSON, just show as is
            }
        }
        catch {
            Write-Host "Could not read response body" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "Exception: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Additional Diagnostics:" -ForegroundColor Green
Write-Host ""

Write-Host "1. Checking if backend is responding..." -ForegroundColor Yellow
try {
    $root = Invoke-WebRequest "$backend/" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "[OK] Backend root: $($root.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Backend not responding: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Checking if users exist in database..." -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod "$backend/api/users/instructors" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "[OK] Found $($users.Count) instructors" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Cannot fetch users: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Checking backend logs (check Render dashboard)..." -ForegroundColor Yellow
Write-Host "   Visit: https://dashboard.render.com" -ForegroundColor Cyan
Write-Host "   Find: assignment-backend" -ForegroundColor Cyan
Write-Host "   Click: Logs tab" -ForegroundColor Cyan
