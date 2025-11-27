# Hosting Checklist

This checklist collects the minimal actions and env vars you should set before hosting the application.

- **Environment variables (backend)**:
  - `DATABASE_URL` — production database connection (e.g. `postgresql://user:pass@host:5432/dbname`). Avoid SQLite for multi-instance/production.
  - `JWT_SECRET` — required, strong random secret used to sign tokens. REQUIRED: app will fail to start without it.
  - `PORT` — optional; default is `5001`.

- **Environment variables (frontend)**:
  - `NEXT_PUBLIC_API_URL` — full API base URL including `/api` (e.g. `https://api.example.com/api`). Set this in your host and build environment.

- **Files & storage**:
  - `uploads/` directory (backend) is used for file uploads and is served at `/uploads` — for production use cloud storage (S3/Blob) or ensure persistence on the host.

- **Database**:
  - For production, use PostgreSQL/MySQL and update `prisma/schema.prisma` and `DATABASE_URL` accordingly.
  - Run Prisma migrations: `npx prisma migrate deploy` (on host) or `npx prisma migrate deploy --schema=./path` as needed.

### Migrate from SQLite to PostgreSQL

1. **Provision a PostgreSQL database** (e.g., AWS RDS, DigitalOcean, Heroku, or self-hosted).
   - Note the connection string: `postgresql://user:password@host:port/database_name`

2. **Backup your existing SQLite data** (optional but recommended):
   ```bash
   cp prisma/dev.db prisma/dev.db.backup
   ```

3. **Update `prisma/schema.prisma`** to use PostgreSQL:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   (Replace `sqlite` with `postgresql`.)

4. **Set the production `DATABASE_URL`** (do not commit this):
   ```bash
   export DATABASE_URL="postgresql://user:password@host:port/database_name"
   ```

5. **Create and run Prisma migrations**:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
   This will create all tables in the PostgreSQL database.

6. **Seed initial data** (if needed):
   ```bash
   npm run seed
   ```

7. **Test the connection**:
   ```bash
   JWT_SECRET="test-secret" DATABASE_URL="your-postgres-url" npm start
   ```
   Verify no database errors in logs.

### Migrate File Uploads to S3

Currently, file uploads are stored in `backend/uploads/` directory. For production, use AWS S3 or compatible storage:

1. **Install S3 client**:
   ```bash
   cd backend
   npm install aws-sdk
   ```

2. **Create an S3 bucket** in your AWS account with appropriate permissions.

3. **Set S3 environment variables** (on your host):
   ```bash
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_S3_BUCKET=your-bucket-name
   AWS_S3_REGION=us-east-1
   ```

4. **Update backend upload routes** (example for submissions route):
   Replace local disk writes with S3 `putObject()`:
   ```javascript
   import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
   
   const s3 = new S3Client({ region: process.env.AWS_S3_REGION });
   
   // In your upload handler:
   const key = `submissions/${Date.now()}-${file.originalname}`;
   await s3.send(new PutObjectCommand({
     Bucket: process.env.AWS_S3_BUCKET,
     Key: key,
     Body: file.buffer,
   }));
   const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;
   // Store fileUrl in database instead of local path
   ```

5. **Update download/serve endpoints**:
   - Return signed S3 URLs instead of serving from disk.
   - Use S3 presigned URLs for temporary access (expires in 15 minutes, etc.).

6. **Remove local upload directory from version control** (if not already):
   ```bash
   echo "uploads/" >> .gitignore
   ```

- **Build & start commands**:
  - Backend (from `Pato/backend`):

```powershell
# install deps
npm install
# run in production
NODE_ENV=production; JWT_SECRET="your-secret"; DATABASE_URL="your-db-url"; npm start
# or for development
npm run dev
```

  - Frontend (from `Pato/frontend`):

```powershell
npm install
# dev
npm run dev
# build for production
NEXT_PUBLIC_API_URL="https://api.example.com/api"; npm run build
# serve
NEXT_PUBLIC_API_URL="https://api.example.com/api"; npm run start
```

- **Security & config notes**:
  - Do not commit `.env` files. Use host-provided env var configuration.
  - Rotate `JWT_SECRET` if you suspect leaks (token invalidation may be required).
  - Limit CORS to trusted origins in production (replace permissive setup).
  - Replace console logs with structured logs for production if needed.

- **Optional improvements before hosting**:
  - Move file uploads to cloud storage and store URLs in the DB.
  - Add rate-limiting & request size limits to the backend.
  - Add monitoring and health checks (e.g., `/health` endpoint).

Files changed by the quick fixes in this repo:
- `backend/src/middleware/auth.js` — now fails to start if `JWT_SECRET` is missing.
- `frontend/src/services/api.ts` — logs a developer warning when `NEXT_PUBLIC_API_URL` is not set.

If you want, I can now run lint/tests (if you have scripts) or commit these changes.
