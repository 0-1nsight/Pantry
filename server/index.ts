import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import authRoutes from './auth.js';
import itemsRoutes from './items.js';
import { closePool } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Security headers
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  } : false,
}));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 1000, // requests per window
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/auth', limiter);

// CORS
app.use(cors({
  origin: isProduction
    ? [process.env.FRONTEND_URL].filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// Routes
app.use('/auth', authRoutes);
app.use('/items', itemsRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: isProduction ? 'Internal server error' : err.message });
});

// Graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} (${isProduction ? 'production' : 'development'})`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    await closePool();
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(async () => {
    await closePool();
    console.log('Server closed');
    process.exit(0);
  });
});
