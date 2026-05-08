/**
 * Provider Integration Interfaces
 * Defines the contract for all digital product provider adapters
 */

/** Parameters for creating an order with a provider */
export interface CreateOrderParams {
  /** Internal unique reference ID for this order */
  refId: string;
  /** Product code as known by the provider */
  productCode: string;
  /** Customer number/ID (e.g., phone number, game ID, meter number) */
  customerNumber: string;
  /** Additional customer data required by some products (e.g., server ID, zone) */
  customerData?: Record<string, string>;
}

/** Response from provider after creating an order */
export interface ProviderOrderResponse {
  /** Whether the API call was successful */
  success: boolean;
  /** Provider's unique reference for this order */
  providerRef: string;
  /** Current order status */
  status: 'pending' | 'processing' | 'success' | 'failed';
  /** Serial number or voucher code (for successful orders) */
  serialNumber?: string;
  /** Status message or error description */
  message?: string;
  /** Raw provider response for debugging/audit */
  rawResponse?: unknown;
}

/** Provider balance information */
export interface ProviderBalance {
  /** Current deposit/balance amount */
  balance: number;
  /** Currency code (e.g., 'IDR') */
  currency: string;
}

/** Raw product data from provider */
export interface ProviderProductRaw {
  /** Product code used for ordering */
  code: string;
  /** Human-readable product name */
  name: string;
  /** Product category (e.g., 'Pulsa', 'Data', 'Game') */
  category: string;
  /** Base price from provider */
  price: number;
  /** Product availability status */
  status: 'available' | 'unavailable' | 'maintenance';
  /** Additional product description */
  description?: string;
}

/** Provider adapter configuration */
export interface ProviderConfig {
  /** API base URL */
  baseUrl: string;
  /** API username or ID */
  username: string;
  /** API key or secret */
  apiKey: string;
  /** Additional secret for signatures (if needed) */
  secret?: string;
  /** Whether this is sandbox/test mode */
  sandbox?: boolean;
}

/**
 * Interface that all provider adapters must implement.
 * Each adapter handles communication with a specific digital product provider.
 */
export interface IProviderAdapter {
  /** Human-readable name of the provider */
  readonly name: string;
  /** Unique code identifier for the provider */
  readonly code: string;

  /**
   * Fetch all available products from the provider
   * @returns Array of raw product data
   */
  fetchProducts(): Promise<ProviderProductRaw[]>;

  /**
   * Create a new order/transaction with the provider
   * @param params - Order creation parameters
   * @returns Provider order response with status and reference
   */
  createOrder(params: CreateOrderParams): Promise<ProviderOrderResponse>;

  /**
   * Check the current status of an existing order
   * @param refId - The internal reference ID used when creating the order
   * @returns Updated order status information
   */
  checkOrderStatus(refId: string): Promise<ProviderOrderResponse>;

  /**
   * Check the current deposit/balance with the provider
   * @returns Balance information
   */
  checkBalance(): Promise<ProviderBalance>;

  /**
   * Verify the authenticity of a webhook/callback from the provider
   * @param payload - Raw webhook payload
   * @param signature - Signature string from the webhook
   * @returns Whether the signature is valid
   */
  verifyWebhookSignature(payload: unknown, signature: string): boolean;

  /**
   * Parse a webhook payload into a standardized format
   * @param payload - Raw webhook payload
   * @returns Parsed webhook data with refId, status, and optional serial number
   */
  parseWebhookPayload(payload: unknown): {
    refId: string;
    status: string;
    serialNumber?: string;
    message?: string;
  };
}
