import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { asyncHandler } from '@/lib/async-handler';
import { strictRateLimiter } from '@/middleware/rate-limiter.middleware';
import { loginSchema, registerSchema, refreshSchema } from './auth.validator';

const router = Router();

router.post(
  '/register',
  strictRateLimiter,
  validate({ body: registerSchema }),
  asyncHandler(authController.register)
);

router.post(
  '/login',
  strictRateLimiter,
  validate({ body: loginSchema }),
  asyncHandler(authController.login)
);

router.post(
  '/refresh',
  authenticate,
  validate({ body: refreshSchema }),
  asyncHandler(authController.refresh)
);

router.post(
  '/logout',
  authenticate,
  asyncHandler(authController.logout)
);

export default router;
