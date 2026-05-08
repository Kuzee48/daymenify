import { ConnectionOptions } from 'bullmq';
import { env } from '@/config';

/**
 * Shared BullMQ Redis connection options.
 * Parses the REDIS_URL environment variable into BullMQ-compatible connection config.
 */
const redisUrl = new URL(env.REDIS_URL);

export const queueConnection: ConnectionOptions = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || '6379'),
  password: redisUrl.password || undefined,
  maxRetriesPerRequest: null, // Required for BullMQ workers
};
