import { Worker } from 'bullmq';
import { queueConnection } from '@/queues/connection';
import { processOrderJob } from './order.worker';
import { processSyncJob } from './sync.worker';
import { processNotificationJob } from './notification.worker';
import { logger } from '@/lib/logger';

const activeWorkers: Worker[] = [];

/**
 * Worker Bootstrap
 *
 * Starts all background workers for processing queued jobs.
 * Should be called during application startup.
 */
export function startWorkers(): void {
  const orderWorker = new Worker('order-processing', processOrderJob, {
    connection: queueConnection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000, // Max 10 jobs per second
    },
  });

  const syncWorker = new Worker('product-sync', processSyncJob, {
    connection: queueConnection,
    concurrency: 2,
  });

  const notificationWorker = new Worker('notifications', processNotificationJob, {
    connection: queueConnection,
    concurrency: 10,
  });

  // Track active workers for graceful shutdown
  activeWorkers.push(orderWorker, syncWorker, notificationWorker);

  // Register event handlers for monitoring
  const workers = [
    { name: 'order-processing', worker: orderWorker },
    { name: 'product-sync', worker: syncWorker },
    { name: 'notifications', worker: notificationWorker },
  ];

  workers.forEach(({ name, worker }) => {
    worker.on('completed', (job) => {
      logger.info({ queue: name, jobId: job.id, jobName: job.name }, 'Job completed');
    });

    worker.on('failed', (job, err) => {
      logger.error(
        { queue: name, jobId: job?.id, jobName: job?.name, error: err.message, stack: err.stack },
        'Job failed'
      );
    });

    worker.on('stalled', (jobId) => {
      logger.warn({ queue: name, jobId }, 'Job stalled');
    });

    worker.on('error', (err) => {
      logger.error({ queue: name, error: err.message }, 'Worker error');
    });
  });

  logger.info(
    {
      workers: workers.map((w) => w.name),
      concurrency: { order: 5, sync: 2, notification: 10 },
    },
    'All workers started'
  );
}

export { processOrderJob } from './order.worker';
export { processSyncJob } from './sync.worker';
export { processNotificationJob } from './notification.worker';

/**
 * Gracefully stop all active workers.
 * Waits for currently running jobs to complete before closing.
 */
export async function stopWorkers(): Promise<void> {
  logger.info('Stopping workers...');
  await Promise.all(activeWorkers.map(w => w.close()));
  logger.info('All workers stopped');
}
