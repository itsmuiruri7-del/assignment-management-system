import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pino from 'pino';
import { PrismaClient } from '@prisma/client';
import loginScreenImagesRouter from './routes/loginScreenImages.js';
import settingsRouter from './routes/settings.js';
import seedRouter from './routes/seed.js';
import authRouter from './routes/auth.routes.js';
import indexRouter from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Logger (simple JSON logger)
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

// Initialize Prisma
const prisma = new PrismaClient();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'default-secret-key-change-in-production';
  logger.warn('Using default JWT_SECRET - set JWT_SECRET environment variable in production');
}

// Attempt to ensure database schema exists on startup
async function ensureDatabaseSchema() {
  try {
    logger.info('Checking database schema...');
    const userCount = await prisma.user.count();
    logger.info(`Database schema exists, found ${userCount} users`);
    return true;
  } catch (err) {
    logger.warn('Database schema check failed, attempting to create schema...', err.message);
    
    try {
      const { execSync } = await import('child_process');
      
      // Try db push
      try {
        execSync('npx prisma db push --skip-generate --accept-data-loss', { stdio: 'pipe' });
        logger.info('Schema created via db push');
      } catch (e) {
        logger.warn('db push failed, trying migrate deploy...');
        try {
          execSync('npx prisma migrate deploy --skip-generate', { stdio: 'pipe' });
          logger.info('Schema created via migrate deploy');
        } catch (migrateErr) {
          logger.warn('migrate deploy also failed, continuing anyway');
        }
      }
      
      return true;
    } catch (schemaErr) {
      logger.error('Could not ensure schema:', schemaErr.message);
      return false;
    }
  }
}

// Initialize schema before starting server
try {
  await ensureDatabaseSchema();
} catch (err) {
  logger.error('Failed to initialize schema:', err.message);
}

// Ensure admin user exists
async function ensureAdminUser() {
  try {
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (existingAdmin) {
      logger.info('Admin user already exists');
      return;
    }
    
    logger.info('Creating admin user...');
    const bcrypt = (await import('bcryptjs')).default;
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    await prisma.user.create({
      data: {
        name: 'System Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    
    logger.info('Admin user created successfully');
  } catch (err) {
    logger.warn('Could not create admin user:', err.message);
  }
}

try {
  await ensureAdminUser();
} catch (err) {
  logger.error('Failed to ensure admin user:', err.message);
}

// Middleware
// Configure CORS from env: comma-separated origins or '*' for permissive
const rawOrigins = process.env.CORS_ALLOWED_ORIGINS || '*';
const corsOptions = (() => {
  if (rawOrigins === '*') return { origin: true };
  const origins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);
  return {
    origin: (origin, callback) => {
      // allow requests with no origin (e.g., mobile apps, curl)
      if (!origin) return callback(null, true);
      if (origins.includes(origin)) return callback(null, true);
      callback(new Error('CORS not allowed by server'));
    },
  };
})();

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
// Legacy/common routes collection (assignments, submissions, users, auth)
app.use('/api', indexRouter);
app.use('/api/login-screen-images', loginScreenImagesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/seed', seedRouter);
app.use('/api/auth', authRouter);

// Emergency database fix endpoint (only works if backend is running)
app.post('/api/emergency/fix-database', async (_req, res) => {
  try {
    logger.info('Emergency database fix endpoint called');
    // This endpoint just returns success - it proves the server is running
    // The actual fix happens via prisma client initialization
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Try to query the database to trigger schema check
    try {
      const userCount = await prisma.user.count();
      return res.json({ 
        message: 'Database is healthy', 
        userCount,
        status: 'OK'
      });
    } catch (dbErr) {
      return res.status(500).json({ 
        message: 'Database table issue detected',
        error: dbErr.message,
        status: 'SCHEMA_MISSING'
      });
    }
  } catch (err) {
    logger.error({ err }, 'Emergency fix endpoint error');
    return res.status(500).json({ 
      message: 'Emergency fix failed',
      error: err.message
    });
  }
});

// Initialize database schema endpoint - creates tables if they don't exist
app.post('/api/init-database', async (_req, res) => {
  try {
    logger.info('Database initialization endpoint called');
    
    const { execSync } = await import('child_process');
    
    // Try to push schema
    try {
      execSync('npx prisma db push --skip-generate --accept-data-loss', { 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      logger.info('Schema pushed successfully');
    } catch (e) {
      logger.warn('db push attempt result:', e.message);
    }
    
    // Import PrismaClient and seed
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Verify schema exists
    const userCount = await prisma.user.count();
    
    // Check if admin exists
    const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    
    if (!adminExists) {
      // Create admin user
      const bcrypt = (await import('bcryptjs')).default;
      const hashedPassword = await bcrypt.hash('password', 10);
      
      await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      logger.info('Admin user created');
    }
    
    await prisma.$disconnect();
    
    return res.json({ 
      message: 'Database initialized successfully',
      status: 'OK',
      userCount: await prisma.user.count()
    });
  } catch (err) {
    logger.error({ err }, 'Database initialization error');
    return res.status(500).json({ 
      message: 'Database initialization failed',
      error: err.message
    });
  }
});

// Temporary debug: list users (limited fields) to inspect production emails
app.get('/api/debug/list-users', async (_req, res) => {
  try {
    logger.info('Debug list-users endpoint called');
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true },
      orderBy: { createdAt: 'asc' },
      take: 200
    });
    return res.json({ message: 'User list', count: users.length, users });
  } catch (err) {
    logger.error({ err }, 'Failed to list users');
    return res.status(500).json({ message: 'Failed to list users', error: err.message });
  }
});

// Update all user passwords to 123456
app.post('/api/update-all-passwords', async (_req, res) => {
  try {
    logger.info('Password update endpoint called');
    
    const bcrypt = (await import('bcryptjs')).default;
    const NEW_PASSWORD = '123456';
    const usersToUpdate = [
      'Patrick@patoh.com',
      'patoh@example.com',
      'kimanijj@gmail.com',
      'instructor@comp-sci.edu',
      'user.a@student.edu',
      'user1@gmail.com'
    ];
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
    
    const results = [];
    
    // Update each user
    for (const email of usersToUpdate) {
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user) {
          results.push({ email, status: 'not_found' });
          continue;
        }
        
        await prisma.user.update({
          where: { email },
          data: { password: hashedPassword }
        });
        
        results.push({ email, status: 'updated' });
      } catch (err) {
        results.push({ email, status: 'error', error: err.message });
      }
    }
    
    return res.json({ 
      message: 'Password update completed',
      status: 'OK',
      results
    });
  } catch (err) {
    logger.error({ err }, 'Password update error');
    return res.status(500).json({ 
      message: 'Password update failed',
      error: err.message
    });
  }
});

// Temporary: seed/upsert the six expected users and set password to 123456
app.post('/api/seed/ensure-default-users', async (_req, res) => {
  try {
    logger.info('Seed ensure-default-users endpoint called');
    const bcrypt = (await import('bcryptjs')).default;
    const NEW_PASSWORD = '123456';
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

    const usersToEnsure = [
      { email: 'Patrick@patoh.com', role: 'STUDENT', name: 'Patrick' },
      { email: 'patoh@example.com', role: 'ADMIN', name: 'Patoh' },
      { email: 'kimanijj@gmail.com', role: 'STUDENT', name: 'Kimanji' },
      { email: 'instructor@comp-sci.edu', role: 'INSTRUCTOR', name: 'Instructor' },
      { email: 'user.a@student.edu', role: 'STUDENT', name: 'User A' },
      { email: 'user1@gmail.com', role: 'INSTRUCTOR', name: 'User One' }
    ];

    const results = [];
    for (const u of usersToEnsure) {
      try {
        const upserted = await prisma.user.upsert({
          where: { email: u.email },
          update: { password: hashedPassword, name: u.name, role: u.role },
          create: { email: u.email, name: u.name, role: u.role, password: hashedPassword }
        });
        results.push({ email: u.email, status: 'upserted', id: upserted.id });
      } catch (err) {
        results.push({ email: u.email, status: 'error', error: err.message });
      }
    }

    return res.json({ message: 'Seed completed', results });
  } catch (err) {
    logger.error({ err }, 'Seed endpoint failed');
    return res.status(500).json({ message: 'Seed failed', error: err.message });
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('EDU_Platform API is running...');
});

// Start server
const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server is running');
});

// handle unexpected errors
process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled Rejection');
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception');
  process.exit(1);
});

export default app;
