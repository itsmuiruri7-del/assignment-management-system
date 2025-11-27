import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pino from 'pino';
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

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'default-secret-key-change-in-production';
  logger.warn('Using default JWT_SECRET - set JWT_SECRET environment variable in production');
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
