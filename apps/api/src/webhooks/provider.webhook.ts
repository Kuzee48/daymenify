import { Request, Response, RequestHandler } from 'express';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { eventBus } from '@/events';
import { notificationQueue } from '@/queues';
import { ProviderFactory } from '@/services/provider';
import type { NotificationJobData } from '@/queues/jobs';

/**
 * Generic Provider Webhook Handler Factory
 *
 * Returns Express middleware that handles incoming provider order status callbacks.
 * Flow:
 * 1. Log raw webhook payload
 * 2. Get provider adapter
 * 3. Verify webhook signature
 * 4. Parse payload (extract refId, status, serialNumber)
 * 5. Idempotency check via Redis SET NX
 * 6. Update transaction status in database
 * 7. Emit realtime event via event bus
 * 8. Queue notification for user
 *
 * @param providerCode - Provider identifier (e.g., 'digiflazz', 'tokovoucher')
 */
export function handleProviderWebhook(providerCode: string): RequestHandler {
  return async (req: Request, res: Response): Promise<void> => {
    const webhookLogger = logger.child({ provider: providerCode, path: req.path });

    try {
      // 1. Log raw webhook for audit
      webhookLogger.info({ body: req.body }, 'Provider webhook received');

      // Create webhook log entry via audit_logs
      const webhookLog = await prisma.auditLog.create({
        data: {
          action: 'WEBHOOK_RECEIVED',
          module: 'provider',
          entityType: 'webhook',
          entityId: providerCode,
          newData: { payload: req.body, headers: sanitizeHeaders(req.headers) },
        },
      });

      // 2. Get provider adapter
      const adapter = getProviderAdapter(providerCode);
      if (!adapter) {
        webhookLogger.error('Provider adapter not found');
        await updateWebhookLog(webhookLog.id, 'FAILED', 'Adapter not found');
        res.status(200).json({ success: true });
        return;
      }

      // 3. Verify webhook signature
      const signature = extractSignature(req, providerCode);
      const isValid = adapter.verifyWebhookSignature(req.body, signature);
      if (!isValid) {
        webhookLogger.warn('Invalid provider webhook signature');
        await updateWebhookLog(webhookLog.id, 'REJECTED', 'Invalid signature');
        res.status(200).json({ success: true });
        return;
      }

      // 4. Parse webhook payload
      const parsed = adapter.parseWebhookPayload(req.body);
      webhookLogger.info(
        { refId: parsed.refId, status: parsed.status, serialNumber: parsed.serialNumber },
        'Provider webhook parsed'
      );

      // 5. Idempotency check
      const idempotencyKey = `webhook:processed:${providerCode}:${parsed.refId}:${parsed.status}`;
      const isNew = await redis.set(idempotencyKey, '1', 'EX', 86400, 'NX');

      if (!isNew) {
        webhookLogger.info({ refId: parsed.refId }, 'Duplicate provider webhook, already processed');
        await updateWebhookLog(webhookLog.id, 'DUPLICATE', 'Already processed');
        res.status(200).json({ success: true });
        return;
      }

      // 6. Find and update transaction
      const transaction = await prisma.transaction.findFirst({
        where: {
          OR: [
            { invoiceId: parsed.refId },
            { providerRef: parsed.refId },
          ],
        },
        include: {
          product: true,
          user: { select: { id: true, username: true } },
        },
      });

      if (!transaction) {
        webhookLogger.warn({ refId: parsed.refId }, 'Transaction not found for provider webhook');
        await updateWebhookLog(webhookLog.id, 'FAILED', 'Transaction not found');
        res.status(200).json({ success: true });
        return;
      }

      const transactionAmount = Number(transaction.totalAmount);

      // Map provider status to internal status
      const mappedStatus = mapProviderStatus(parsed.status);

      switch (mappedStatus) {
        case 'COMPLETED': {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'COMPLETED',
              serialNumber: parsed.serialNumber || undefined,
              completedAt: new Date(),
            },
          });

          // Log the completion
          await prisma.transactionLog.create({
            data: {
              transactionId: transaction.id,
              action: 'PROVIDER_CALLBACK_SUCCESS',
              status: 'COMPLETED',
              message: `Provider confirmed success. SN: ${parsed.serialNumber || 'N/A'}`,
            },
          });

          // 7. Emit realtime events
          eventBus.emitTransactionCompleted({
            transactionId: transaction.id,
            invoiceId: transaction.invoiceId,
            userId: transaction.userId,
            status: 'COMPLETED',
            productName: transaction.product?.name,
            amount: transactionAmount,
            serialNumber: parsed.serialNumber,
          });

          eventBus.emitOrderFeed({
            username: transaction.user?.username || 'Anonymous',
            productName: transaction.product?.name || 'Unknown',
            timestamp: new Date().toISOString(),
          });

          // 8. Queue success notification
          await notificationQueue.add('transaction-success', {
            userId: transaction.userId,
            type: 'transaction_success',
            title: 'Transaksi Berhasil',
            message: `Pesanan ${transaction.product?.name || ''} berhasil diproses.${parsed.serialNumber ? ` SN: ${parsed.serialNumber}` : ''}`,
            channel: 'in_app',
            data: {
              transactionId: transaction.id,
              serialNumber: parsed.serialNumber,
            },
          } satisfies NotificationJobData);

          webhookLogger.info(
            { transactionId: transaction.id, serialNumber: parsed.serialNumber },
            'Transaction completed via provider webhook'
          );
          break;
        }

        case 'FAILED': {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'FAILED',
              providerStatus: parsed.message || 'Provider reported failure',
            },
          });

          await prisma.transactionLog.create({
            data: {
              transactionId: transaction.id,
              action: 'PROVIDER_CALLBACK_FAILED',
              status: 'FAILED',
              message: `Provider reported failure: ${parsed.message || 'Unknown reason'}`,
            },
          });

          // Emit failure event
          eventBus.emitTransactionFailed({
            transactionId: transaction.id,
            invoiceId: transaction.invoiceId,
            userId: transaction.userId,
            status: 'FAILED',
            productName: transaction.product?.name,
            amount: transactionAmount,
          });

          // Queue failure notification
          await notificationQueue.add('transaction-failed', {
            userId: transaction.userId,
            type: 'transaction_failed',
            title: 'Transaksi Gagal',
            message: `Pesanan ${transaction.product?.name || ''} gagal diproses. ${parsed.message || ''}`,
            channel: 'in_app',
            data: {
              transactionId: transaction.id,
              reason: parsed.message,
            },
          } satisfies NotificationJobData);

          webhookLogger.info(
            { transactionId: transaction.id, reason: parsed.message },
            'Transaction failed via provider webhook'
          );
          break;
        }

        case 'PROCESSING': {
          // Still processing, just log
          webhookLogger.info({ transactionId: transaction.id }, 'Transaction still processing per provider');
          break;
        }

        default:
          webhookLogger.warn({ status: parsed.status, mapped: mappedStatus }, 'Unknown provider status');
      }

      await updateWebhookLog(webhookLog.id, 'PROCESSED', `Status: ${parsed.status} → ${mappedStatus}`);

      // Always return 200
      res.status(200).json({ success: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      webhookLogger.error({ error: errorMessage }, 'Provider webhook processing error');

      // Always return 200 to provider
      res.status(200).json({ success: true });
    }
  };
}

/**
 * Get the provider adapter from the global factory
 */
function getProviderAdapter(providerCode: string) {
  try {
    const factory = (global as any).__providerFactory as ProviderFactory | undefined;
    if (factory) {
      const adapters = factory.getAllAdapters();
      return adapters.get(providerCode) || null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract webhook signature from request based on provider conventions
 */
function extractSignature(req: Request, providerCode: string): string {
  switch (providerCode) {
    case 'digiflazz':
      return (req.headers['x-hub-signature'] as string) || '';
    case 'tokovoucher':
      return (req.headers['x-signature'] as string) || '';
    default:
      return (req.headers['x-signature'] as string) || (req.headers['x-callback-signature'] as string) || '';
  }
}

/**
 * Map provider-specific status to internal transaction status
 */
function mapProviderStatus(providerStatus: string): string {
  const statusMap: Record<string, string> = {
    // Common success statuses
    success: 'COMPLETED',
    sukses: 'COMPLETED',
    completed: 'COMPLETED',
    delivered: 'COMPLETED',

    // Common failure statuses
    failed: 'FAILED',
    gagal: 'FAILED',
    error: 'FAILED',
    rejected: 'FAILED',

    // Processing statuses
    pending: 'PROCESSING',
    processing: 'PROCESSING',
    process: 'PROCESSING',
  };

  return statusMap[providerStatus.toLowerCase()] || 'PROCESSING';
}

/**
 * Update webhook log entry
 */
async function updateWebhookLog(id: string, status: string, message: string): Promise<void> {
  try {
    await prisma.auditLog.update({
      where: { id },
      data: {
        oldData: { status, message, processedAt: new Date().toISOString() },
      },
    });
  } catch (error) {
    logger.error({ webhookLogId: id, error }, 'Failed to update webhook log');
  }
}

/**
 * Sanitize request headers
 */
function sanitizeHeaders(headers: Record<string, any>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const sensitiveKeys = ['authorization', 'cookie'];

  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveKeys.includes(key.toLowerCase())) continue;
    if (typeof value === 'string') sanitized[key] = value;
    else if (Array.isArray(value)) sanitized[key] = value.join(', ');
  }

  return sanitized;
}
