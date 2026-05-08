import { Router, Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { success } from '@/lib/response';
import { asyncHandler } from '@/lib/async-handler';
import { logger } from '@/lib/logger';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const checks: Record<string, string> = {
      api: 'healthy',
    };

    // Check database connectivity
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = 'healthy';
    } catch (err) {
      logger.warn({ err }, 'Database health check failed');
      checks.database = 'unhealthy';
    }

    // Check Redis connectivity
    try {
      await redis.ping();
      checks.redis = 'healthy';
    } catch (err) {
      logger.warn({ err }, 'Redis health check failed');
      checks.redis = 'unhealthy';
    }

    const isHealthy = Object.values(checks).every((status) => status === 'healthy');

    if (!isHealthy) {
      return res.status(503).json({
        success: true,
        data: {
          status: 'degraded',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          checks,
        },
      });
    }

    return success(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    });
  })
);

export default router;
