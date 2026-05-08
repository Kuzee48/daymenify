import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from '@/config';
import { logger } from '@/lib/logger';
import { requestId } from '@/middleware/request-id.middleware';
import { defaultRateLimiter } from '@/middleware/rate-limiter.middleware';
import { errorHandler } from '@/middleware/error-handler.middleware';
import { NotFoundError } from '@/lib/errors';
import apiRoutes from '@/routes';

const app = express();

// Trust proxy (for rate limiter behind reverse proxy)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  })
);

// Compression
app.use(compression());

// Cookie parser
app.use(cookieParser());

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID
app.use(requestId);

// HTTP request logger
const morganFormat = env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message: string) => {
        logger.info(message.trim());
      },
    },
    skip: (req) => req.url === '/api/v1/health',
  })
);

// Rate limiter
app.use(defaultRateLimiter);

// API routes
app.use('/api/v1', apiRoutes);

// 404 handler for unmatched routes
app.use((_req, _res, next) => {
  next(new NotFoundError('Route'));
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
