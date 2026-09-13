import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import characterRoutes from './routes/character.js';
import shopRoutes from './routes/shop.js';
import { initSchema } from './db/index.js';
import { ensureShopSeeded } from './db/seed.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// Basic security headers without pulling in helmet as a dependency.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// Schema/seed run once per cold start (idempotent — IF NOT EXISTS / count-guarded)
// and every request waits on the same promise, so this is safe on both a
// long-running server and a serverless platform that spins up fresh instances.
let readyPromise = null;
function ensureReady() {
  if (!readyPromise) {
    readyPromise = (async () => {
      await initSchema();
      await ensureShopSeeded();
    })();
  }
  return readyPromise;
}

app.use(async (req, res, next) => {
  try {
    await ensureReady();
    next();
  } catch (err) {
    next(err);
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/tasks', apiLimiter, taskRoutes);
app.use('/api/character', apiLimiter, characterRoutes);
app.use('/api/shop', apiLimiter, shopRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
});

export default app;
export { ensureReady };
