# Find PostgreSQL Database on Render

param()

Write-Host "=== Find Your PostgreSQL Database ===" -ForegroundColor Cyan
Write-Host ""

$apiKeySecure = Read-Host -AsSecureString "Enter your Render API Key"
$RENDER_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKeySecure)
)

Write-Host ""
Write-Host "Fetching all databases from your Render account..." -ForegroundColor Yellow
Write-Host ""

try {
    $services = Invoke-RestMethod -Headers @{ Authorization = "Bearer $RENDER_API_KEY" } `
        -Uri "https://api.render.com/v1/services?limit=100" `
        -Method Get `
        -ErrorAction Stop
    
    Write-Host "Found $($services.Count) services" -ForegroundColor Cyan
    Write-Host ""
    
    $databases = $services | Where-Object { $_.type -eq "pgsql" }
    
    if ($databases.Count -eq 0) {
        Write-Host "[ERROR] No PostgreSQL databases found!" -ForegroundColor Red
        Write-Host ""
        Write-Host "You need to create a PostgreSQL database on Render:" -ForegroundColor Yellow
        Write-Host "  1. Go to https://dashboard.render.com" -ForegroundColor White
        Write-Host "  2. Click 'New +'" -ForegroundColor White
        Write-Host "  3. Select 'PostgreSQL'" -ForegroundColor White
        Write-Host "  4. Create the database" -ForegroundColor White
        exit 1
    }
    
    Write-Host "PostgreSQL Databases Found:" -ForegroundColor Green
    Write-Host "===========================" -ForegroundColor Green
    
    foreach ($db in $databases) {
        Write-Host ""
        Write-Host "Name: $($db.name)" -ForegroundColor Cyan
        Write-Host "ID: $($db.id)" -ForegroundColor White
        Write-Host "Status: $($db.status)" -ForegroundColor $(if($db.status -eq 'available') { 'Green' } else { 'Yellow' })
        Write-Host "Region: $($db.region)" -ForegroundColor White
        
        # Try to get database credentials
        try {
            $dbDetails = Invoke-RestMethod -Headers @{ Authorization = "Bearer $RENDER_API_KEY" } `
                -Uri "https://api.render.com/v1/services/$($db.id)" `
                -Method Get `
                -ErrorAction Stop
            
            if ($dbDetails.databaseUserPassword) {
                Write-Host ""
                Write-Host "Database Details:" -ForegroundColor Yellow
                Write-Host "  Username: $($dbDetails.databaseUsername)" -ForegroundColor White
                Write-Host "  Database: $($dbDetails.databaseName)" -ForegroundColor White
                Write-Host "  Host: $($dbDetails.databaseHost)" -ForegroundColor White
                Write-Host "  Port: $($dbDetails.databasePort)" -ForegroundColor White
                
                # Construct connection string
                $dbUrl = "postgresql://$($dbDetails.databaseUsername):$($dbDetails.databaseUserPassword)@$($dbDetails.databaseHost):$($dbDetails.databasePort)/$($dbDetails.databaseName)"
                Write-Host ""
                Write-Host "Connection URL (External):" -ForegroundColor Green
                Write-Host $dbUrl -ForegroundColor Cyan
                Write-Host ""
                Write-Host "Copy the URL above and use it in set-backend-env-vars.ps1" -ForegroundColor Yellow
            }
        }
        catch {
            Write-Host "Could not fetch database details: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}
catch {
    Write-Host "[ERROR] Failed to fetch services: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Alternative: Get Database URL from Dashboard" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  1. Visit: https://dashboard.render.com" -ForegroundColor White
Write-Host "  2. Click on your PostgreSQL database (assignment-db or similar)" -ForegroundColor White
Write-Host "  3. Scroll down to 'Connections'" -ForegroundColor White
Write-Host "  4. Copy the 'External Database URL'" -ForegroundColor White
Write-Host "  5. Paste it when running set-backend-env-vars.ps1" -ForegroundColor White
