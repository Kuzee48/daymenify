import rateLimit, { Options } from 'express-rate-limit';
import { env } from '@/config';
import { RateLimitError } from '@/lib/errors';

/**
 * Creates a configurable rate limiter middleware.
 * Uses express-rate-limit with custom error handling.
 */
export function createRateLimiter(options?: Partial<Options>) {
  return rateLimit({
    windowMs: options?.windowMs ?? env.RATE_LIMIT_WINDOW_MS,
    max: options?.max ?? env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new RateLimitError());
    },
    ...options,
  });
}

/**
 * Strict rate limiter for sensitive endpoints (auth, password reset).
 * 5 requests per 15 minutes.
 */
export const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: (_req, _res, next) => {
    next(new RateLimitError('Too many attempts, please try again in 15 minutes'));
  },
});

/**
 * Default API rate limiter.
 */
export const defaultRateLimiter = createRateLimiter();
