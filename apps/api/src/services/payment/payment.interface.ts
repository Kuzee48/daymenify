/**
 * Payment Gateway Integration Interfaces
 * Defines the contract for all payment gateway adapters
 */

/** Parameters required to create a new payment transaction */
export interface CreatePaymentParams {
  /** Internal order ID reference */
  orderId: string;
  /** Payment amount in the smallest currency unit (e.g., IDR) */
  amount: number;
  /** Payment method code (e.g., 'BRIVA', 'QRIS', 'OVO') */
  methodCode: string;
  /** Customer full name */
  customerName: string;
  /** Customer email address */
  customerEmail: string;
  /** Customer phone number (optional) */
  customerPhone?: string;
  /** Transaction description */
  description: string;
  /** Payment expiry in minutes (default varies by gateway) */
  expiryMinutes?: number;
}

/** Response after successfully creating a payment transaction */
export interface PaymentCreatedResponse {
  /** Whether the transaction was successfully created */
  success: boolean;
  /** Gateway's unique reference for this transaction */
  gatewayRef: string;
  /** URL to redirect customer for payment (if applicable) */
  paymentUrl?: string;
  /** Virtual account number (for bank transfer methods) */
  vaNumber?: string;
  /** QR code string/URL (for QRIS payments) */
  qrCode?: string;
  /** When this payment expires */
  expiresAt: Date;
  /** Transaction amount */
  amount: number;
  /** Gateway fee for this transaction */
  fee: number;
}

/** Parsed webhook data from payment gateway callbacks */
export interface PaymentWebhookData {
  /** Gateway's unique reference */
  gatewayRef: string;
  /** Internal order ID */
  orderId: string;
  /** Payment status */
  status: 'paid' | 'expired' | 'failed' | 'refunded';
  /** Transaction amount */
  amount: number;
  /** When the payment was completed */
  paidAt?: Date;
  /** Payment method used */
  method?: string;
  /** Raw gateway response for audit logging */
  rawData: unknown;
}

/** Available payment method information */
export interface PaymentMethod {
  /** Unique method code */
  code: string;
  /** Human-readable method name */
  name: string;
  /** Method type (e.g., 'virtual_account', 'e-wallet', 'qris') */
  type: string;
  /** Fee amount */
  fee: number;
  /** Whether fee is a fixed amount or percentage of transaction */
  feeType: 'fixed' | 'percentage';
  /** Icon URL for display */
  icon?: string;
}

/** Gateway adapter configuration */
export interface PaymentGatewayConfig {
  /** API base URL */
  baseUrl: string;
  /** Merchant/API key */
  apiKey: string;
  /** Private/secret key for signatures */
  privateKey: string;
  /** Merchant code (if applicable) */
  merchantCode?: string;
  /** Callback/webhook URL */
  callbackUrl?: string;
  /** Whether this is sandbox/test mode */
  sandbox?: boolean;
}

/**
 * Interface that all payment gateway adapters must implement.
 * Each adapter encapsulates the logic for a specific payment provider.
 */
export interface IPaymentAdapter {
  /** Human-readable name of the payment gateway */
  readonly name: string;
  /** Unique code identifier for the gateway */
  readonly code: string;

  /**
   * Create a new payment transaction with the gateway
   * @param params - Transaction creation parameters
   * @returns Payment creation response with gateway reference and payment details
   */
  createTransaction(params: CreatePaymentParams): Promise<PaymentCreatedResponse>;

  /**
   * Check the current status of a transaction by its gateway reference
   * @param gatewayRef - The gateway's unique transaction reference
   * @returns Current status and payment timestamp if paid
   */
  checkStatus(gatewayRef: string): Promise<{ status: string; paidAt?: Date }>;

  /**
   * Verify the authenticity of a webhook request from the gateway
   * @param headers - HTTP headers from the webhook request
   * @param body - Raw body of the webhook request
   * @returns Whether the webhook signature is valid
   */
  verifyWebhookSignature(headers: Record<string, string>, body: unknown): boolean;

  /**
   * Parse webhook payload into a standardized format
   * @param body - Raw webhook body
   * @returns Standardized webhook data
   */
  parseWebhookPayload(body: unknown): PaymentWebhookData;

  /**
   * Get all available payment methods from this gateway
   * @returns Array of available payment methods
   */
  getPaymentMethods(): Promise<PaymentMethod[]>;

  /**
   * Calculate the fee for a given amount and payment method
   * @param amount - Transaction amount
   * @param methodCode - Payment method code
   * @returns Calculated fee amount
   */
  calculateFee(amount: number, methodCode: string): number;
}
