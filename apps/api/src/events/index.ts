import { EventEmitter } from 'events';

/**
 * Application Event Types
 */

export interface TransactionEvent {
  transactionId: string;
  invoiceId: string;
  userId: string;
  status: string;
  productName?: string;
  amount?: number;
  serialNumber?: string;
}

export interface PaymentReceivedEvent {
  transactionId: string;
  userId: string;
  amount: number;
  method: string;
  gatewayRef: string;
}

export interface ProviderDownEvent {
  providerId: string;
  providerName: string;
  error: string;
  timestamp: string;
}

export interface OrderFeedEvent {
  username: string;
  productName: string;
  timestamp: string;
}

/**
 * Application Event Bus
 *
 * Centralized in-process event emitter for decoupling business logic.
 * Events emitted here are picked up by Socket.io listeners for realtime delivery,
 * and can trigger additional side effects (notifications, analytics, etc.)
 */
class AppEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Allow many listeners for different consumers
  }

  /** Emit when a transaction payment is confirmed */
  emitTransactionPaid(data: TransactionEvent): void {
    this.emit('transaction.paid', data);
  }

  /** Emit when a transaction order is successfully completed */
  emitTransactionCompleted(data: TransactionEvent): void {
    this.emit('transaction.completed', data);
  }

  /** Emit when a transaction order has failed */
  emitTransactionFailed(data: TransactionEvent): void {
    this.emit('transaction.failed', data);
  }

  /** Emit when a payment is received from gateway */
  emitPaymentReceived(data: PaymentReceivedEvent): void {
    this.emit('payment.received', data);
  }

  /** Emit when a payment has expired */
  emitPaymentExpired(data: { transactionId: string; userId: string; invoiceId: string }): void {
    this.emit('payment.expired', data);
  }

  /** Emit when a provider goes down or circuit breaks */
  emitProviderDown(data: ProviderDownEvent): void {
    this.emit('provider.down', data);
  }

  /** Emit a new order for the public live feed */
  emitOrderFeed(data: OrderFeedEvent): void {
    this.emit('feed.new-order', data);
  }

  /** Emit admin alert */
  emitAdminAlert(data: { type: string; message: string; data?: Record<string, unknown> }): void {
    this.emit('admin.alert', data);
  }
}

export const eventBus = new AppEventBus();
