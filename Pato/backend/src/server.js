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
