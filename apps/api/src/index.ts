import 'dotenv/config';
import app from './app';
import { env } from '@/config';
import { logger } from '@/lib/logger';
import { disconnectPrisma } from '@/lib/prisma';
import { connectRedis, disconnectRedis } from '@/lib/redis';
import { stopWorkers } from '@/workers';

const server = app.listen(env.PORT, async () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
    },
    `🚀 Daymenify API server running on port ${env.PORT} [${env.NODE_ENV}]`
  );

  // Connect to Redis
  try {
    await connectRedis();
  } catch (err) {
    logger.error({ err }, 'Failed to connect to Redis on startup');
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, `Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await stopWorkers(); // Close all BullMQ workers gracefully
      await disconnectPrisma();
      await disconnectRedis();
    } catch (err) {
      logger.error({ err }, 'Error during shutdown cleanup');
    }

    logger.info('Graceful shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.fatal({ err: reason }, 'Unhandled Rejection');
  gracefulShutdown('unhandledRejection');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.fatal({ err: error }, 'Uncaught Exception');
  gracefulShutdown('uncaughtException');
});

export default server;
