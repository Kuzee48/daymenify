import { Request, Response, RequestHandler } from 'express';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { eventBus } from '@/events';
import { orderQueue, notificationQueue } from '@/queues';
import { getPaymentFactory } from '@/lib/factories';
import type { OrderJobData, NotificationJobData } from '@/queues/jobs';

/**
 * Generic Payment Webhook Handler Factory
 *
 * Returns Express middleware that handles incoming payment gateway callbacks.
 * Flow:
 * 1. Log raw webhook payload
 * 2. Get payment adapter for the gateway
 * 3. Verify webhook signature
 * 4. Idempotency check via Redis SET NX
 * 5. Parse payload into standardized format
 * 6. Process payment status update
 * 7. Queue order processing if payment confirmed
 * 8. Always return 200 (process errors internally)
 *
 * @param gatewayCode - Payment gateway identifier (e.g., 'tripay', 'midtrans')
 */
export function handlePaymentWebhook(gatewayCode: string): RequestHandler {
  return async (req: Request, res: Response): Promise<void> => {
    const webhookLogger = logger.child({ gateway: gatewayCode, path: req.path });

    try {
      // 1. Request body size validation
      const bodySize = JSON.stringify(req.body).length;
      if (bodySize > 65536) { // 64KB max
        webhookLogger.warn({ bodySize }, 'Webhook request body too large');
        res.status(413).json({ success: false, message: 'Request body too large' });
        return;
      }

      // 2. Log raw webhook receipt (minimal - no DB write yet)
      webhookLogger.info({ bodySize }, 'Payment webhook received');

      // 3. Get payment adapter
      const adapter = getPaymentAdapter(gatewayCode);
      if (!adapter) {
        webhookLogger.error('Payment adapter not found');
        res.status(200).json({ success: true }); // Still return 200 to gateway
        return;
      }

      // 4. Verify webhook signature FIRST (before any DB writes)
      const headersRecord: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === 'string') headersRecord[key] = value;
      }

      const isValid = adapter.verifyWebhookSignature(headersRecord, req.body);
      if (!isValid) {
        webhookLogger.warn('Invalid webhook signature');
        res.status(200).json({ success: true }); // Still return 200
        return;
      }

      // 5. Create webhook log entry AFTER signature verification (prevents flood attacks filling DB)
      const webhookLog = await prisma.auditLog.create({
        data: {
          action: 'WEBHOOK_RECEIVED',
          module: 'payment',
          entityType: 'webhook',
          entityId: gatewayCode,
          newData: { payload: req.body, headers: sanitizeHeaders(req.headers) },
        },
      });

      // 6. Parse webhook payload
      const webhookData = adapter.parseWebhookPayload(req.body);
      webhookLogger.info(
        { orderId: webhookData.orderId, status: webhookData.status, gatewayRef: webhookData.gatewayRef },
        'Payment webhook parsed'
      );

      // 7. Idempotency check - prevent duplicate processing
      const idempotencyKey = `webhook:processed:${gatewayCode}:${webhookData.gatewayRef}:${webhookData.status}`;
      const isNew = await redis.set(idempotencyKey, '1', 'EX', 86400, 'NX'); // 24h TTL

      if (!isNew) {
        webhookLogger.info({ gatewayRef: webhookData.gatewayRef }, 'Duplicate webhook, already processed');
        await updateWebhookLog(webhookLog.id, 'DUPLICATE', 'Already processed');
        res.status(200).json({ success: true });
        return;
      }

      // 8. Process payment status update
      const transaction = await prisma.transaction.findFirst({
        where: { invoiceId: webhookData.orderId },
        include: { product: true },
      });

      if (!transaction) {
        webhookLogger.warn({ orderId: webhookData.orderId }, 'Transaction not found for webhook');
        await updateWebhookLog(webhookLog.id, 'FAILED', 'Transaction not found');
        res.status(200).json({ success: true });
        return;
      }

      // Get customer data from the transaction
      const customerData = transaction.customerData as Record<string, string> | null;
      const customerNumber = customerData?.customerNumber || customerData?.phone || '';


      switch (webhookData.status) {
        case 'paid': {
          // Update transaction to PAID status
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'PAID',
              paymentStatus: 'PAID',
              paidAt: webhookData.paidAt || new Date(),
              paymentMethod: webhookData.method,
              paymentGateway: gatewayCode,
              providerRef: webhookData.gatewayRef,
            },
          });

          // Emit payment received event
          eventBus.emitPaymentReceived({
            transactionId: transaction.id,
            userId: transaction.userId,
            amount: webhookData.amount,
            method: webhookData.method || gatewayCode,
            gatewayRef: webhookData.gatewayRef,
          });

          eventBus.emitTransactionPaid({
            transactionId: transaction.id,
            invoiceId: transaction.invoiceId,
            userId: transaction.userId,
            status: 'PAID',
            productName: transaction.product?.name,
            amount: Number(transaction.totalAmount),
          });

          // 9. Queue order processing
          await orderQueue.add(
            'process-order',
            {
              transactionId: transaction.id,
              productId: transaction.productId,
              customerNumber: customerNumber,
              customerData: customerData || undefined,
              providerProductCode: (customerData?.providerProductCode) || '',
              attemptNumber: 1,
            } satisfies OrderJobData,
            {
              jobId: `order-${transaction.id}`,
              priority: 1, // High priority for paid orders
            }
          );

          // Queue notification
          await notificationQueue.add('payment-received', {
            userId: transaction.userId,
            type: 'payment_received',
            title: 'Pembayaran Diterima',
            message: `Pembayaran untuk ${transaction.product?.name || 'pesanan Anda'} sebesar Rp ${webhookData.amount.toLocaleString('id-ID')} telah diterima. Pesanan sedang diproses.`,
            channel: 'in_app',
            data: { transactionId: transaction.id, amount: webhookData.amount },
          } satisfies NotificationJobData);

          webhookLogger.info({ transactionId: transaction.id }, 'Payment confirmed, order queued');
          break;
        }

        case 'expired': {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'EXPIRED',
              paymentStatus: 'EXPIRED',
            },
          });

          eventBus.emitPaymentExpired({
            transactionId: transaction.id,
            userId: transaction.userId,
            invoiceId: transaction.invoiceId,
          });

          await notificationQueue.add('payment-expired', {
            userId: transaction.userId,
            type: 'payment_expired',
            title: 'Pembayaran Kedaluwarsa',
            message: `Pembayaran untuk ${transaction.product?.name || 'pesanan Anda'} telah kedaluwarsa. Silakan buat pesanan baru.`,
            channel: 'in_app',
            data: { transactionId: transaction.id },
          } satisfies NotificationJobData);

          webhookLogger.info({ transactionId: transaction.id }, 'Payment expired');
          break;
        }

        case 'failed': {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'FAILED',
              paymentStatus: 'FAILED',
              providerStatus: 'Payment failed',
            },
          });

          webhookLogger.info({ transactionId: transaction.id }, 'Payment failed');
          break;
        }

        case 'refunded': {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'REFUNDED',
              paymentStatus: 'REFUNDED',
            },
          });

          webhookLogger.info({ transactionId: transaction.id }, 'Payment refunded');
          break;
        }

        default:
          webhookLogger.warn({ status: webhookData.status }, 'Unknown payment webhook status');
      }

      await updateWebhookLog(webhookLog.id, 'PROCESSED', `Status: ${webhookData.status}`);

      // 10. Always return 200
      res.status(200).json({ success: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      webhookLogger.error({ error: errorMessage }, 'Payment webhook processing error');

      // Always return 200 to gateway even on internal errors
      res.status(200).json({ success: true });
    }
  };
}

/**
 * Get the payment adapter from the module-scoped factory singleton.
 */
function getPaymentAdapter(gatewayCode: string) {
  try {
    const factory = getPaymentFactory();
    return factory.getAdapter(gatewayCode);
  } catch {
    return null;
  }
}

/**
 * Update webhook log entry with processing result
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
 * Sanitize request headers (remove sensitive values)
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
