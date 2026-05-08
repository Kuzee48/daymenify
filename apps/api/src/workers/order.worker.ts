import { Job } from 'bullmq';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { eventBus } from '@/events';
import { notificationQueue } from '@/queues';
import { ProviderFactory } from '@/services/provider';
import type { OrderJobData, NotificationJobData } from '@/queues/jobs';

const providerFactory = new ProviderFactory();

/**
 * Order Processing Worker
 *
 * Handles the complete order lifecycle:
 * 1. Load transaction and provider product data
 * 2. Submit order to provider (with fallback routing)
 * 3. Update transaction status in database
 * 4. Emit realtime events
 * 5. Queue notifications
 */
export async function processOrderJob(job: Job<OrderJobData>): Promise<void> {
  const { transactionId, productId, customerNumber, customerData, providerProductCode, attemptNumber } = job.data;

  const jobLogger = logger.child({
    jobId: job.id,
    transactionId,
    productId,
    attempt: attemptNumber,
  });

  jobLogger.info('Processing order job');

  try {
    // 1. Load transaction from database
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        product: true,
        user: { select: { id: true, username: true, email: true } },
      },
    });

    if (!transaction) {
      jobLogger.error('Transaction not found, skipping');
      return;
    }

    // Use totalAmount from schema
    const transactionAmount = Number(transaction.totalAmount);

    if (transaction.status !== 'PROCESSING' && transaction.status !== 'PAID') {
      jobLogger.warn({ currentStatus: transaction.status }, 'Transaction not in processable state, skipping');
      return;
    }

    // Extract customer number from customerData JSON field
    const txCustomerData = transaction.customerData as Record<string, string> | null;

    // 2. Update status to PROCESSING (optimistic lock to prevent double-spend)
    const result = await prisma.transaction.updateMany({
      where: { id: transactionId, status: 'PAID' },
      data: { status: 'PROCESSING' },
    });
    if (result.count === 0) {
      jobLogger.warn('Transaction already being processed by another worker, skipping');
      return; // Another worker got it first
    }

    // Log the processing start
    await logTransactionStep(transactionId, 'ORDER_SUBMITTED', `Submitting order to provider (attempt ${attemptNumber})`);

    // 3. Load provider products for routing
    const providerProducts = await prisma.providerProduct.findMany({
      where: {
        productId,
        isActive: true,
        provider: { isActive: true },
      },
      include: { provider: true },
    }) as any[];

    if (providerProducts.length === 0) {
      jobLogger.error('No active provider products found');
      await markTransactionFailed(transactionId, 'No active provider available');
      await emitFailureEvents(transaction, 'No active provider available');
      return;
    }

    // 4. Initialize providers and submit order
    const providerRecords = providerProducts.map((pp: any) => ({
      id: pp.provider.id,
      code: pp.provider.code,
      name: pp.provider.name,
      isActive: pp.provider.isActive,
      config: {
        baseUrl: pp.provider.apiUrl,
        apiKey: pp.provider.apiKey,
        secret: pp.provider.apiSecret || pp.provider.webhookSecret || '',
      } as Record<string, string>,
      balance: pp.provider.balance ? Number(pp.provider.balance) : undefined,
    }));

    providerFactory.initializeAll(providerRecords);

    const routingProducts = providerProducts.map((pp: any) => ({
      id: pp.id,
      providerId: pp.providerId,
      productId: pp.productId,
      providerProductCode: pp.providerCode,
      price: Number(pp.providerPrice),
      isActive: pp.isActive,
      priority: pp.priority ?? 0,
    }));

    const response = await providerFactory.processOrder(
      routingProducts,
      {
        refId: transaction.invoiceId,
        productCode: providerProductCode,
        customerNumber,
        customerData,
      },
      2 // maxRetries
    );

    // 5. Handle response
    if (response.success || response.status === 'processing' || response.status === 'success') {
      const updateData: Record<string, unknown> = {
        providerRef: response.providerRef,
        providerId: response.providerId,
      };

      if (response.status === 'success' && response.serialNumber) {
        // Immediately completed
        updateData.status = 'COMPLETED';
        updateData.serialNumber = response.serialNumber;
        updateData.completedAt = new Date();

        await prisma.transaction.update({
          where: { id: transactionId },
          data: updateData as any,
        });

        await logTransactionStep(transactionId, 'ORDER_COMPLETED', `Order completed. SN: ${response.serialNumber}`);

        // Emit success events
        eventBus.emitTransactionCompleted({
          transactionId,
          invoiceId: transaction.invoiceId,
          userId: transaction.userId,
          status: 'COMPLETED',
          productName: transaction.product?.name,
          amount: transactionAmount,
          serialNumber: response.serialNumber,
        });

        eventBus.emitOrderFeed({
          username: transaction.user?.username || 'Anonymous',
          productName: transaction.product?.name || 'Unknown',
          timestamp: new Date().toISOString(),
        });

        // Queue success notification
        await notificationQueue.add('transaction-success', {
          userId: transaction.userId,
          type: 'transaction_success',
          title: 'Transaksi Berhasil',
          message: `Pesanan ${transaction.product?.name} berhasil diproses. SN: ${response.serialNumber}`,
          channel: 'in_app',
          data: { transactionId, serialNumber: response.serialNumber },
        } satisfies NotificationJobData);
      } else {
        // Still processing - wait for webhook
        updateData.status = 'PROCESSING';

        await prisma.transaction.update({
          where: { id: transactionId },
          data: updateData as any,
        });

        await logTransactionStep(transactionId, 'ORDER_PROCESSING', `Order submitted, waiting for provider callback. Ref: ${response.providerRef}`);
      }

      jobLogger.info({ providerRef: response.providerRef, status: response.status }, 'Order submitted successfully');
    } else {
      // Provider explicitly rejected
      await markTransactionFailed(transactionId, response.message || 'Provider rejected order');
      await emitFailureEvents(transaction, response.message || 'Provider rejected order');
      jobLogger.warn({ message: response.message }, 'Provider rejected order');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    jobLogger.error({ error: errorMessage }, 'Order processing failed');

    await markTransactionFailed(transactionId, errorMessage);
    await logTransactionStep(transactionId, 'ORDER_FAILED', `Order processing error: ${errorMessage}`);

    // Load transaction for events
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { product: true },
    });

    if (transaction) {
      await emitFailureEvents(transaction, errorMessage);
    }

    // Re-throw to let BullMQ handle retry logic
    throw error;
  }
}

/**
 * Mark a transaction as failed in the database
 */
async function markTransactionFailed(transactionId: string, reason: string): Promise<void> {
  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status: 'FAILED',
      providerStatus: reason,
    },
  });

  await logTransactionStep(transactionId, 'ORDER_FAILED', reason);
}

/**
 * Emit failure events and queue notification
 */
async function emitFailureEvents(transaction: any, reason: string): Promise<void> {
  eventBus.emitTransactionFailed({
    transactionId: transaction.id,
    invoiceId: transaction.invoiceId,
    userId: transaction.userId,
    status: 'FAILED',
    productName: transaction.product?.name,
    amount: Number(transaction.totalAmount),
  });

  await notificationQueue.add('transaction-failed', {
    userId: transaction.userId,
    type: 'transaction_failed',
    title: 'Transaksi Gagal',
    message: `Pesanan ${transaction.product?.name || ''} gagal diproses. ${reason}`,
    channel: 'in_app',
    data: { transactionId: transaction.id, reason },
  } satisfies NotificationJobData);
}

/**
 * Log a step in the transaction processing lifecycle
 */
async function logTransactionStep(transactionId: string, step: string, message: string): Promise<void> {
  try {
    await prisma.transactionLog.create({
      data: {
        transactionId,
        action: step,
        status: step,
        message,
      },
    });
  } catch (error) {
    logger.error({ transactionId, step, error }, 'Failed to create transaction log');
  }
}
