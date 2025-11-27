# Render Deployment Script
# Usage: powershell -ExecutionPolicy Bypass -File .\deploy-render.ps1

param()

Write-Host "=== Render Deployment Script ===" -ForegroundColor Cyan
Write-Host "This will set env vars and trigger deploys on your Render services."
Write-Host ""

# Securely prompt for API key
$apiKeySecure = Read-Host -AsSecureString "Enter your Render API Key (will not echo)"
$RENDER_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKeySecure)
)

# Prompt for service IDs
Write-Host ""
$FRONTEND_SERVICE_ID = Read-Host "Enter FRONTEND service id (e.g., srv-xxxxxx)"
$BACKEND_SERVICE_ID = Read-Host "Enter BACKEND service id (e.g., srv-yyyyyy)"

$FRONTEND_API_URL = "https://assignment-backend-qzrq.onrender.com"
$BACKEND_CORS_ORIGIN = "https://assignment-frontend-64jd.onrender.com"

Write-Host ""
Write-Host "Config:" -ForegroundColor Green
Write-Host "  Frontend Service ID: $FRONTEND_SERVICE_ID"
Write-Host "  Backend Service ID: $BACKEND_SERVICE_ID"
Write-Host "  Frontend API URL: $FRONTEND_API_URL"
Write-Host "  Backend CORS Origin: $BACKEND_CORS_ORIGIN"
Write-Host ""

function Patch-ServiceEnvVars {
    param(
        [string]$serviceId,
        [string]$key,
        [string]$value,
        [string]$serviceName
    )

    $apiUrl = "https://api.render.com/v1/services/$serviceId"
    
    try {
        Write-Host "[$serviceName] Fetching current config..." -ForegroundColor Yellow
        $svc = Invoke-RestMethod -Headers @{ Authorization = "Bearer $RENDER_API_KEY" } -Uri $apiUrl -Method Get -ErrorAction Stop

        $envs = @()
        if ($svc.envVars) {
            foreach ($e in $svc.envVars) {
                $envs += @{
                    key = $e.key
                    value = $e.value
                    secure = $e.secure
                }
            }
        }

        # Remove existing entry with same key if present
        $envs = $envs | Where-Object { $_.key -ne $key }

        # Add new/updated entry
        $envs += @{ key = $key; value = $value; secure = $false }

        $body = @{ envVars = $envs } | ConvertTo-Json -Depth 10
        
        Write-Host "[$serviceName] Patching environment variable '$key'..." -ForegroundColor Yellow
        $patch = Invoke-RestMethod -Headers @{ Authorization = "Bearer $RENDER_API_KEY" } -Uri $apiUrl -Method Patch -ContentType "application/json" -Body $body -ErrorAction Stop
        
        Write-Host "[$serviceName] [OK] Environment variable patched successfully" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "[$serviceName] [ERROR] patching env vars: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Trigger-Deploy {
    param(
        [string]$serviceId,
        [string]$serviceName
    )

    $deployUrl = "https://api.render.com/v1/services/$serviceId/deploys"

    try {
        Write-Host "[$serviceName] Triggering deploy..." -ForegroundColor Yellow
        $resp = Invoke-RestMethod -Headers @{ Authorization = "Bearer $RENDER_API_KEY" } -Uri $deployUrl -Method Post -ContentType "application/json" -Body '{}' -ErrorAction Stop
        
        Write-Host "[$serviceName] [OK] Deploy triggered (id: $($resp.id))" -ForegroundColor Green
        return $resp.id
    } catch {
        Write-Host "[$serviceName] [ERROR] triggering deploy: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Execute deployment steps
Write-Host "Starting deployment..." -ForegroundColor Cyan
Write-Host ""

$success = $true

# Patch and deploy frontend
if (Patch-ServiceEnvVars -serviceId $FRONTEND_SERVICE_ID -key 'NEXT_PUBLIC_API_URL' -value $FRONTEND_API_URL -serviceName "Frontend") {
    Trigger-Deploy -serviceId $FRONTEND_SERVICE_ID -serviceName "Frontend" | Out-Null
} else {
    $success = $false
}

Write-Host ""

# Patch and deploy backend
if (Patch-ServiceEnvVars -serviceId $BACKEND_SERVICE_ID -key 'CORS_ALLOWED_ORIGINS' -value $BACKEND_CORS_ORIGIN -serviceName "Backend") {
    Trigger-Deploy -serviceId $BACKEND_SERVICE_ID -serviceName "Backend" | Out-Null
} else {
    $success = $false
}

Write-Host ""
if ($success) {
    Write-Host "[OK] Deployment complete! Both services will rebuild and deploy." -ForegroundColor Green
    Write-Host "  Check Render dashboard for build progress."
    Write-Host "  When deploys finish, run verification tests."
} else {
    Write-Host "[ERROR] Some operations failed. Check errors above." -ForegroundColor Red
}
