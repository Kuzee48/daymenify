import { Queue } from 'bullmq';
import { queueConnection } from './connection';

export { queueConnection } from './connection';
export * from './jobs';

/**
 * Queue Registry
 * Creates and exports all application queues with their default job options.
 */

/** Order processing queue - handles provider order submissions with retry */
export const orderQueue = new Queue('order-processing', {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

/** Product sync queue - syncs product catalogs from providers */
export const syncQueue = new Queue('product-sync', {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 30000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

/** Notification dispatch queue - sends notifications via various channels */
export const notificationQueue = new Queue('notifications', {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { count: 2000 },
    removeOnFail: { count: 1000 },
  },
});

/** Webhook processing queue - processes incoming webhooks asynchronously */
export const webhookQueue = new Queue('webhook-processing', {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 60000,
    },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 2000 },
  },
});

/** Cleanup queue - handles periodic data cleanup tasks */
export const cleanupQueue = new Queue('cleanup', {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
});
