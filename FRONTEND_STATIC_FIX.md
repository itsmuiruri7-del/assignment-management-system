# Render Frontend Static Site Fix

## Problem
The frontend was using pre-built static files from `frontend_static/` directory, which:
- Become outdated after each rebuild
- Have hardcoded API URLs
- Accumulate stale HTML/CSS warnings

## Solution

### Step 1: Remove `frontend_static/` from Git Tracking
```powershell
cd c:\Users\muiru\Desktop\project-x
git rm -r --cached Pato/frontend/frontend_static
git commit -m "Remove frontend_static from git (will be auto-generated on Render)"
git push origin main
```

### Step 2: Verify Render Frontend Configuration

On Render dashboard:
1. Go to **assignment-frontend** Static Site
2. Settings → **Build & Deploy**
3. Verify:
   - **Build Command:** `cd Pato/frontend && npm ci && npm run build`
   - **Publish Directory:** `Pato/frontend/out` (NOT `Pato/frontend/frontend_static`)
   - **Auto Deploy:** Enabled

### Step 3: Trigger Rebuild
```powershell
# Push a minor change to trigger Render rebuild
git commit --allow-empty -m "Trigger frontend rebuild with correct output directory"
git push origin main

# Or manually trigger in Render dashboard: Dashboard → assignment-frontend → Manual Deploy
```

## Why This Works
- ✅ `npm run build` creates static export to `out/` (not `frontend_static/`)
- ✅ `out/` is generated fresh with latest code + environment variables
- ✅ No stale files committed to git
- ✅ API URLs baked into build at **build time** (static export), using the correct `NEXT_PUBLIC_API_URL` env var set on Render

## Environment Variables
- **Frontend (NEXT_PUBLIC_API_URL):** Set to `https://assignment-backend-qzrq.onrender.com`
- **Backend (CORS_ALLOWED_ORIGINS):** Set to `https://assignment-frontend-64jd.onrender.com`

## Verification
After Render rebuilds, run:
```powershell
powershell -ExecutionPolicy Bypass -File c:\Users\muiru\Desktop\project-x\verify-and-seed.ps1
```

Expected output:
```
[OK] Backend root: 200 OK
[OK] API endpoint: returned X instructors
[OK] Frontend login page contains correct API URL
```
