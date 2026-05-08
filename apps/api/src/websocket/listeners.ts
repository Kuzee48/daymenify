import { Server } from 'socket.io';
import { eventBus } from '@/events';
import { logger } from '@/lib/logger';
import type { TransactionEvent, PaymentReceivedEvent, ProviderDownEvent, OrderFeedEvent } from '@/events';

/**
 * Setup Event Bus Listeners
 *
 * Bridges the in-process event bus to Socket.io for realtime client delivery.
 * Listens to application events and broadcasts them to the appropriate namespaces/rooms.
 */
export function setupEventListeners(io: Server): void {
  const publicNsp = io.of('/public');
  const userNsp = io.of('/user');
  const adminNsp = io.of('/admin');

  // ──────────────────────────────────────────────────────────
  // Transaction Events → User Namespace
  // ──────────────────────────────────────────────────────────

  /**
   * Transaction completed - notify the user and public feed
   */
  eventBus.on('transaction.completed', (data: TransactionEvent) => {
    logger.debug({ transactionId: data.transactionId, userId: data.userId }, 'Broadcasting transaction.completed');

    // Emit to user's room
    userNsp.to(`user:${data.userId}`).emit('transaction:updated', {
      transactionId: data.transactionId,
      invoiceId: data.invoiceId,
      status: 'COMPLETED',
      productName: data.productName,
      serialNumber: data.serialNumber,
      amount: data.amount,
      timestamp: new Date().toISOString(),
    });

    // Emit to specific transaction room
    userNsp.to(`transaction:${data.transactionId}`).emit('transaction:status', {
      transactionId: data.transactionId,
      status: 'COMPLETED',
      serialNumber: data.serialNumber,
    });

    // Emit to admin for monitoring
    adminNsp.to('admin').emit('order:completed', {
      transactionId: data.transactionId,
      invoiceId: data.invoiceId,
      productName: data.productName,
      amount: data.amount,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Transaction failed - notify the user
   */
  eventBus.on('transaction.failed', (data: TransactionEvent) => {
    logger.debug({ transactionId: data.transactionId, userId: data.userId }, 'Broadcasting transaction.failed');

    userNsp.to(`user:${data.userId}`).emit('transaction:updated', {
      transactionId: data.transactionId,
      invoiceId: data.invoiceId,
      status: 'FAILED',
      productName: data.productName,
      amount: data.amount,
      timestamp: new Date().toISOString(),
    });

    userNsp.to(`transaction:${data.transactionId}`).emit('transaction:status', {
      transactionId: data.transactionId,
      status: 'FAILED',
    });

    // Emit to admin for monitoring
    adminNsp.to('admin').emit('order:failed', {
      transactionId: data.transactionId,
      invoiceId: data.invoiceId,
      productName: data.productName,
      amount: data.amount,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Transaction paid - notify user that payment was received
   */
  eventBus.on('transaction.paid', (data: TransactionEvent) => {
    logger.debug({ transactionId: data.transactionId, userId: data.userId }, 'Broadcasting transaction.paid');

    userNsp.to(`user:${data.userId}`).emit('transaction:updated', {
      transactionId: data.transactionId,
      invoiceId: data.invoiceId,
      status: 'PAID',
      productName: data.productName,
      amount: data.amount,
      timestamp: new Date().toISOString(),
    });

    userNsp.to(`transaction:${data.transactionId}`).emit('transaction:status', {
      transactionId: data.transactionId,
      status: 'PAID',
    });
  });

  // ──────────────────────────────────────────────────────────
  // Payment Events → User Namespace
  // ──────────────────────────────────────────────────────────

  /**
   * Payment received from gateway
   */
  eventBus.on('payment.received', (data: PaymentReceivedEvent) => {
    logger.debug({ transactionId: data.transactionId, userId: data.userId }, 'Broadcasting payment.received');

    userNsp.to(`user:${data.userId}`).emit('payment:received', {
      transactionId: data.transactionId,
      amount: data.amount,
      method: data.method,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Payment expired
   */
  eventBus.on('payment.expired', (data: { transactionId: string; userId: string; invoiceId: string }) => {
    userNsp.to(`user:${data.userId}`).emit('payment:expired', {
      transactionId: data.transactionId,
      invoiceId: data.invoiceId,
      timestamp: new Date().toISOString(),
    });
  });

  // ──────────────────────────────────────────────────────────
  // Provider Events → Admin Namespace
  // ──────────────────────────────────────────────────────────

  /**
   * Provider down alert - notify admins
   */
  eventBus.on('provider.down', (data: ProviderDownEvent) => {
    logger.warn({ providerId: data.providerId, providerName: data.providerName }, 'Broadcasting provider.down');

    adminNsp.to('admin-alerts').emit('provider:down', {
      providerId: data.providerId,
      providerName: data.providerName,
      error: data.error,
      timestamp: data.timestamp,
    });
  });

  // ──────────────────────────────────────────────────────────
  // Feed Events → Public Namespace
  // ──────────────────────────────────────────────────────────

  /**
   * New order for public live feed (anonymized)
   */
  eventBus.on('feed.new-order', (data: OrderFeedEvent) => {
    logger.debug({ username: data.username }, 'Broadcasting feed.new-order');

    // Mask username for privacy (show first 3 chars + ***)
    const maskedUsername = maskUsername(data.username);

    publicNsp.to('public-feed').emit('feed:new-order', {
      username: maskedUsername,
      productName: data.productName,
      timestamp: data.timestamp,
    });
  });

  // ──────────────────────────────────────────────────────────
  // Admin Alerts → Admin Namespace
  // ──────────────────────────────────────────────────────────

  /**
   * General admin alerts
   */
  eventBus.on('admin.alert', (data: { type: string; message: string; data?: Record<string, unknown> }) => {
    adminNsp.to('admin-alerts').emit('alert', {
      type: data.type,
      message: data.message,
      data: data.data,
      timestamp: new Date().toISOString(),
    });
  });

  // ──────────────────────────────────────────────────────────
  // Notification Events → User Namespace
  // ──────────────────────────────────────────────────────────

  /**
   * New notification created (from notification worker)
   */
  eventBus.on('notification.new', (data: { userId: string; notification: Record<string, unknown> }) => {
    userNsp.to(`user:${data.userId}`).emit('notification:new', data.notification);
  });

  logger.info('Socket.io event listeners registered');
}

/**
 * Mask a username for public display (privacy)
 * "johndoe" → "joh***"
 */
function maskUsername(username: string): string {
  if (username.length <= 3) {
    return username[0] + '***';
  }
  return username.substring(0, 3) + '***';
}
