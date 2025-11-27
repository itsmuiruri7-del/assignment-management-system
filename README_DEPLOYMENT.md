# Assignment Management System - Render Deployment Files

## What's in this folder

- `RENDER_DEPLOYMENT.md` — Step-by-step guide to deploy on Render (read this first!)
- `Pato/backend/Dockerfile` — Container config for backend service
- `Pato/backend/.env.example` — Example environment variables
- `Pato/backend/import-postgresql.sql` — PostgreSQL database dump (ready to import)
- `Pato/frontend/next.config.js` — Updated to `output: 'export'` for static build

## Quick Start

1. **Read** `RENDER_DEPLOYMENT.md` for full instructions
2. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/repo-name.git
   git push -u origin main
   ```
3. **Follow the steps** in the deployment guide to create services on Render

## Files Ready for Deployment

✅ Backend: `Pato/backend/`
✅ Frontend: `Pato/frontend/`
✅ Database dump (PostgreSQL): `Pato/backend/import-postgresql.sql`
✅ Docker config: `Pato/backend/Dockerfile`
✅ Environment template: `Pato/backend/.env.example`

## Support

- Check logs on Render dashboard for errors
- Verify `DATABASE_URL` environment variable is set correctly
- Ensure frontend `NEXT_PUBLIC_API_URL` points to your backend URL

---

**Deploy with confidence!** 🚀
