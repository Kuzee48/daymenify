/**
 * Job Data Type Definitions
 * Defines the payload structure for each queue's jobs.
 */

/** Order processing queue job payload */
export interface OrderJobData {
  /** Transaction ID from the database */
  transactionId: string;
  /** Product ID being ordered */
  productId: string;
  /** Preferred provider ID (optional, for manual routing) */
  providerId?: string;
  /** Customer number/ID (phone, game ID, meter number, etc.) */
  customerNumber: string;
  /** Additional customer data (e.g., server ID, zone) */
  customerData?: Record<string, string>;
  /** Product code as known by the provider */
  providerProductCode: string;
  /** Current attempt number (for retry tracking) */
  attemptNumber: number;
}

/** Product sync queue job payload */
export interface SyncJobData {
  /** Database ID of the provider to sync */
  providerId: string;
  /** Provider code (e.g., 'digiflazz', 'tokovoucher') */
  providerCode: string;
  /** Type of sync operation */
  syncType: 'full' | 'price_only';
  /** What triggered this sync */
  triggeredBy: 'cron' | 'admin' | 'webhook';
}

/** Notification dispatch queue job payload */
export interface NotificationJobData {
  /** Target user ID */
  userId: string;
  /** Notification type */
  type: 'transaction_success' | 'transaction_failed' | 'payment_received' | 'payment_expired' | 'system';
  /** Notification title */
  title: string;
  /** Notification message body */
  message: string;
  /** Delivery channel */
  channel: 'in_app' | 'email' | 'telegram' | 'push';
  /** Additional data payload */
  data?: Record<string, unknown>;
}

/** Webhook processing queue job payload */
export interface WebhookJobData {
  /** Source gateway/provider code */
  source: string;
  /** Endpoint that received the webhook */
  endpoint: string;
  /** Raw webhook payload */
  payload: unknown;
  /** Original request headers */
  headers: Record<string, string>;
  /** ID of the webhook log entry in the database */
  webhookLogId: string;
}

/** Cleanup queue job payload */
export interface CleanupJobData {
  /** Type of cleanup to perform */
  type: 'expired_payments' | 'old_logs' | 'stale_sessions' | 'old_notifications';
  /** Cleanup threshold (e.g., days old) */
  olderThanDays?: number;
}

/** Payment expiry check job payload */
export interface PaymentExpiryCheckJobData {
  /** Batch size for checking */
  batchSize?: number;
}

/** Provider health check job payload */
export interface ProviderHealthCheckJobData {
  /** Specific provider ID to check (all if omitted) */
  providerId?: string;
}
