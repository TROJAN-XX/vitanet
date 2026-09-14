import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import env from './config/env.js';
import { JSON_BODY_LIMIT } from './config/constants.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { loggerMiddleware } from './middleware/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import mediaRoutes from './routes/media.js';
import postRoutes from './routes/posts.js';
import feedRoutes from './routes/feed.js';
import notificationRoutes from './routes/notifications.js';
import reportRoutes from './routes/reports.js';
import adminRoutes from './routes/admin.js';
import { csrfProtection } from './middleware/csrf.js';
import { generalLimiter } from './middleware/rateLimiter.js';

const app = express();

// ── Trust proxy (Render is behind a reverse proxy) ──
app.set('trust proxy', 1);

// ── Security headers ──
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://challenges.cloudflare.com'],
      frameSrc: ["'self'", 'https://challenges.cloudflare.com'],
      connectSrc: ["'self'", env.APP_ORIGIN],
      imgSrc: ["'self'", 'data:', 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// ── CORS ──
const allowedOrigins = [env.APP_ORIGIN];
if (env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 86400,
}));

// ── Body parsing with size limits ──
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: false, limit: JSON_BODY_LIMIT }));

// ── Cookies ──
app.use(cookieParser(env.COOKIE_SECRET));

// ── Request ID & Logging ──
app.use(requestIdMiddleware);
app.use(loggerMiddleware);

// ── CSRF Protection ──
app.use(csrfProtection);

// ── Global Rate Limit ──
app.use(generalLimiter);

// ── Routes ──
app.use('/', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/feed', feedRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/admin', adminRoutes);

// ── 404 & Error handling ──
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
