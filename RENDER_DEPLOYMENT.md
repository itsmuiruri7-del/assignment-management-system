# Deployment Guide: Render (Full Stack)

## Overview
This guide deploys your full stack (Next.js frontend + Express backend + PostgreSQL) on **Render** for free.

**Free Tier Limits:**
- Backend: 0.5 GB RAM, free tier sleeps after 15 min inactivity (~10s wake-up delay)
- PostgreSQL: 100 MB storage (sufficient for dev/demo)
- Frontend: Static site (unlimited)

**Cost:** Free forever on free tier, or upgrade to paid for better performance.

---

## Prerequisites

1. **GitHub account** — push your code there
2. **Render account** — sign up at https://render.com
3. **Your code** — in this repo structure:
   - `Pato/backend/` — Express server
   - `Pato/frontend/` — Next.js app
   - `Pato/backend/import-postgresql.sql` — database dump (already created)

---

## Step 1: Push Code to GitHub

### 1.1 Create a new GitHub repo
- Go to https://github.com/new
- Name: `assignment-management-system` (or your choice)
- Public or Private (up to you)
- Click "Create repository"

### 1.2 Push your local code
```bash
cd C:\Users\muiru\Desktop\project-x\Pato

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: backend, frontend, database dump"

# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/assignment-management-system.git

# Push to main
git branch -M main
git push -u origin main
```

---

## Step 2: Create PostgreSQL Database on Render

### 2.1 Log into Render
- Go to https://render.com
- Sign in or create account

### 2.2 Create PostgreSQL Database
1. Click **New +** → **PostgreSQL**
2. Fill in:
   - **Name:** `assignment-db`
   - **Database:** `assignment_db`
   - **Region:** Choose closest to you
   - **PostgreSQL Version:** 15 (default)
3. Click **Create Database**
4. Wait ~2 minutes for creation
5. Once ready, copy the **External Database URL** (looks like `postgresql://user:password@...`)
   - **SAVE THIS** — you'll need it for the backend

---

## Step 3: Import Database Dump into PostgreSQL

### 3.1 Connect to PostgreSQL and import SQL
1. In Render dashboard, open your PostgreSQL instance
2. Click **"Connect"** → copy the psql command
3. In your terminal:
   ```bash
   # Paste the psql command Render gives you
   # (it will connect you to the database)
   ```
4. Once connected, import the SQL dump:
   ```bash
   \i 'C:\Users\muiru\Desktop\project-x\Pato\backend\import-postgresql.sql'
   ```
5. Verify tables were created:
   ```bash
   \dt
   ```
   You should see: `User`, `Assignment`, `Submission`, `LoginScreenImage`, `AppSetting`, `_prisma_migrations`

---

## Step 4: Deploy Backend Service

### 4.1 Create Web Service on Render
1. In Render dashboard, click **New +** → **Web Service**
2. **Select repository:** Choose your GitHub repo from the list
3. Fill in settings:
   - **Name:** `assignment-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm ci && npx prisma generate`
   - **Start Command:** `node src/server.js`
   - **Region:** Same as PostgreSQL (for speed)
4. Click **Create Web Service**

### 4.2 Add Environment Variables
1. In the Web Service settings, scroll down to **Environment**
2. Click **Add Environment Variable** and add:
   ```
   Key: DATABASE_URL
   Value: [PASTE the PostgreSQL External URL from Step 2.1]
   
   Key: JWT_SECRET
   Value: your-secure-random-string-here (e.g., `super_secret_key_123456`)
   
   Key: NODE_ENV
   Value: production
   
   Key: CORS_ORIGIN
   Value: https://assignment-frontend.onrender.com (we'll set this properly in Step 5)
   ```
3. Click **Save changes**

### 4.3 Deploy
- Render will auto-deploy once you save. Watch the **Logs** tab for build progress.
- Once it says "Service is live", your backend is deployed!
- Note the backend URL: `https://assignment-backend.onrender.com` (or the name you chose)

---

## Step 5: Deploy Frontend (Static Site)

### 5.1 Build the static frontend locally
1. Update the frontend `next.config.js` (if you haven't already):
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'export',
     // Ensure API calls point to your backend
     env: {
       NEXT_PUBLIC_API_URL: 'https://assignment-backend.onrender.com/api'
     }
   };
   module.exports = nextConfig;
   ```

2. In terminal:
   ```bash
   cd C:\Users\muiru\Desktop\project-x\Pato\frontend
   npm install
   npm run build
   # This generates the `out/` folder with static files
   ```

### 5.2 Push to GitHub
```bash
cd C:\Users\muiru\Desktop\project-x\Pato
git add .
git commit -m "Update frontend for Render deployment"
git push origin main
```

### 5.3 Create Static Site on Render
1. In Render dashboard, click **New +** → **Static Site**
2. **Select repository:** Your GitHub repo
3. Fill in:
   - **Name:** `assignment-frontend`
   - **Build Command:** `cd frontend && npm ci && npm run build`
   - **Publish Directory:** `frontend/out`
   - **Region:** Same as backend
4. Click **Create Static Site**
5. Render will build and deploy. Once live, you'll get a URL like `https://assignment-frontend.onrender.com`

---

## Step 6: Update Backend CORS and Test

### 6.1 Update Backend CORS
1. In Render backend service, go to **Environment**
2. Update `CORS_ORIGIN` to: `https://assignment-frontend.onrender.com`
3. Save and Render will redeploy

### 6.2 Test the Full Stack
1. Visit `https://assignment-frontend.onrender.com` in your browser
2. Try:
   - **Login:** Use credentials from your test data (or register a new account)
   - **Upload assignment:** Try uploading a file
   - **Download file:** Verify downloads work
   - **View submissions:** Check the student dashboard

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend service keeps restarting | Check logs for errors. Common: missing `DATABASE_URL` env var. |
| "PostgreSQL connection failed" | Verify `DATABASE_URL` in Render env is correct. Test locally first. |
| Frontend gets 404 on navigation | Ensure you're using static build (check `next.config.js` has `output: 'export'`). |
| Backend API calls fail from frontend | Check CORS_ORIGIN matches your frontend URL. Verify backend is running (check logs). |
| Database import failed | Try importing manually via psql, or check SQL dump syntax. |

---

## Free Tier Caveats

1. **Cold starts:** Backend sleeps after 15 min inactivity; requests take ~10s to wake it up. Paid tier removes this.
2. **Storage:** PostgreSQL has 100 MB free; your data is small (dev/demo), so should be fine.
3. **RAM:** 0.5 GB is tight; if you add heavy features, upgrade to paid.

---

## Next Steps

- Set up a domain name (Render offers free subdomains; you can add custom domains on paid tier)
- Invite users to test the system
- If needed, upgrade to paid for better performance

---

## Support

- Render docs: https://render.com/docs
- PostgreSQL migration issues: Check the `import-postgresql.sql` syntax
- Backend issues: Check Render service logs for errors

Good luck! 🚀
