import { syncQueue, cleanupQueue, orderQueue } from '@/queues';
import { logger } from '@/lib/logger';

/**
 * Cron Job Scheduler
 *
 * Uses BullMQ repeatable jobs for scheduling instead of node-cron.
 * This ensures jobs are executed exactly once even with multiple instances,
 * and provides built-in retry, monitoring, and persistence.
 */
export async function startCronJobs(): Promise<void> {
  try {
    // ──────────────────────────────────────────────────────────
    // Product Sync - Every 30 minutes
    // ──────────────────────────────────────────────────────────
    await syncQueue.add(
      'scheduled-sync',
      {
        providerId: 'all',
        providerCode: 'all',
        syncType: 'price_only' as const,
        triggeredBy: 'cron' as const,
      },
      {
        repeat: {
          pattern: '*/30 * * * *', // Every 30 minutes
        },
        jobId: 'cron-product-sync',
      }
    );

    // ──────────────────────────────────────────────────────────
    // Payment Expiry Check - Every 5 minutes
    // ──────────────────────────────────────────────────────────
    await cleanupQueue.add(
      'payment-expiry-check',
      {
        type: 'expired_payments' as const,
      },
      {
        repeat: {
          pattern: '*/5 * * * *', // Every 5 minutes
        },
        jobId: 'cron-payment-expiry',
      }
    );

    // ──────────────────────────────────────────────────────────
    // Provider Health Check - Every 2 minutes
    // ──────────────────────────────────────────────────────────
    await cleanupQueue.add(
      'provider-health-check',
      {
        type: 'provider_health' as const,
      },
      {
        repeat: {
          pattern: '*/2 * * * *', // Every 2 minutes
        },
        jobId: 'cron-provider-health',
      }
    );

    // ──────────────────────────────────────────────────────────
    // Cleanup Old Data - Daily at 3 AM
    // ──────────────────────────────────────────────────────────
    await cleanupQueue.add(
      'cleanup-old-data',
      {
        type: 'old_logs' as const,
        olderThanDays: 30,
      },
      {
        repeat: {
          pattern: '0 3 * * *', // Daily at 3 AM
        },
        jobId: 'cron-cleanup-old-data',
      }
    );

    // ──────────────────────────────────────────────────────────
    // Cleanup Old Notifications - Daily at 4 AM
    // ──────────────────────────────────────────────────────────
    await cleanupQueue.add(
      'cleanup-notifications',
      {
        type: 'old_notifications' as const,
        olderThanDays: 90,
      },
      {
        repeat: {
          pattern: '0 4 * * *', // Daily at 4 AM
        },
        jobId: 'cron-cleanup-notifications',
      }
    );

    // ──────────────────────────────────────────────────────────
    // Cleanup Stale Sessions - Daily at 2 AM
    // ──────────────────────────────────────────────────────────
    await cleanupQueue.add(
      'cleanup-sessions',
      {
        type: 'stale_sessions' as const,
        olderThanDays: 7,
      },
      {
        repeat: {
          pattern: '0 2 * * *', // Daily at 2 AM
        },
        jobId: 'cron-cleanup-sessions',
      }
    );

    logger.info(
      {
        schedules: {
          'product-sync': '*/30 * * * *',
          'payment-expiry-check': '*/5 * * * *',
          'provider-health-check': '*/2 * * * *',
          'cleanup-old-data': '0 3 * * *',
          'cleanup-notifications': '0 4 * * *',
          'cleanup-sessions': '0 2 * * *',
        },
      },
      'Cron jobs scheduled'
    );
  } catch (error) {
    logger.error({ error }, 'Failed to schedule cron jobs');
    throw error;
  }
}

/**
 * Remove all repeatable jobs (useful for graceful shutdown or reset)
 */
export async function stopCronJobs(): Promise<void> {
  try {
    const syncRepeatables = await syncQueue.getRepeatableJobs();
    for (const job of syncRepeatables) {
      await syncQueue.removeRepeatableByKey(job.key);
    }

    const cleanupRepeatables = await cleanupQueue.getRepeatableJobs();
    for (const job of cleanupRepeatables) {
      await cleanupQueue.removeRepeatableByKey(job.key);
    }

    const orderRepeatables = await orderQueue.getRepeatableJobs();
    for (const job of orderRepeatables) {
      await orderQueue.removeRepeatableByKey(job.key);
    }

    logger.info('All cron jobs removed');
  } catch (error) {
    logger.error({ error }, 'Failed to remove cron jobs');
  }
}
