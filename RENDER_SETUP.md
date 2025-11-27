# Render Setup & GitHub Actions — Quick Guide

This file explains the minimal steps to configure Render and GitHub Actions so the frontend and backend are deployed with the correct environment variables and build cache.

1) Create a Render API Key
- Sign in to Render → Account → API Keys → Create an API key. Copy the key.

2) Find your Render Service IDs
- Open the Render dashboard and select a service. The service ID is shown in the URL (or use the Render API). Example service URL: `https://dashboard.render.com/services/srv-xxxxxxxx` → service id is `srv-xxxxxxxx`.

3) Add GitHub repository secrets
- In your GitHub repository: Settings → Secrets → Actions, add these secrets:
  - `RENDER_API_KEY` — the API key from step 1
  - `RENDER_FRONTEND_SERVICE_ID` — the frontend service id from step 2
  - `RENDER_BACKEND_SERVICE_ID` — the backend service id from step 2

4) Run the workflow to patch env vars and deploy
- In GitHub Actions, open the workflow `Update Render env vars and trigger deploy` and click **Run workflow**. This will:
  - Set `NEXT_PUBLIC_API_URL=https://assignment-backend-qzrq.onrender.com` on the frontend service
  - Trigger a frontend deploy
  - Set `CORS_ALLOWED_ORIGINS=https://assignment-frontend-64jd.onrender.com` on the backend service
  - Trigger a backend deploy

5) (Optional) Configure Render build cache
- For faster rebuilds, configure the Static Site to cache `.next/cache` and `node_modules`: Render Dashboard → Static Site → Settings → Advanced → Persisted Cache Directories.

Notes
- If you need different values (different Render URLs), edit the workflow file at `.github/workflows/render-set-env-and-deploy.yml` and replace the hardcoded URLs.
- The CI cache workflow `.github/workflows/ci-cache-and-build.yml` caches npm and `.next/cache` for GitHub Actions builds.
