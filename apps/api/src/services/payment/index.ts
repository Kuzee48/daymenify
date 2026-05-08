import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { NotFoundError, BusinessLogicError } from '@/lib/errors';
import {
  IPaymentAdapter,
  CreatePaymentParams,
  PaymentCreatedResponse,
  PaymentGatewayConfig,
} from './payment.interface';
import { TripayAdapter } from './tripay.adapter';
import { MidtransAdapter } from './midtrans.adapter';
import { XenditAdapter } from './xendit.adapter';
import { DuitkuAdapter } from './duitku.adapter';
import { BayarGGAdapter } from './bayargg.adapter';
import { PakasirAdapter } from './pakasir.adapter';

export * from './payment.interface';
export { TripayAdapter } from './tripay.adapter';
export { MidtransAdapter } from './midtrans.adapter';
export { XenditAdapter } from './xendit.adapter';
export { DuitkuAdapter } from './duitku.adapter';
export { BayarGGAdapter } from './bayargg.adapter';
export { PakasirAdapter } from './pakasir.adapter';

/** Database gateway configuration record */
interface GatewayRecord {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  config: string; // Encrypted JSON string
  baseUrl?: string;
  callbackUrl?: string;
  sandbox: boolean;
}

/** Adapter constructor type */
type AdapterConstructor = new (config: PaymentGatewayConfig) => IPaymentAdapter;

/** Registry of supported payment gateway adapters */
const ADAPTER_REGISTRY: Record<string, AdapterConstructor> = {
  tripay: TripayAdapter,
  midtrans: MidtransAdapter,
  xendit: XenditAdapter,
  duitku: DuitkuAdapter,
  bayargg: BayarGGAdapter,
  pakasir: PakasirAdapter,
};

/**
 * Payment Gateway Factory
 *
 * Creates and manages payment gateway adapters from database configurations.
 * Handles config decryption, adapter instantiation, and provides a unified
 * interface for creating payments across multiple gateways.
 */
export class PaymentGatewayFactory {
  private readonly encryptionKey: string;
  private readonly adapters: Map<string, IPaymentAdapter> = new Map();

  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey;
  }

  /**
   * Decrypt gateway configuration stored in the database
   * Uses AES-256-GCM for authenticated encryption
   */
  private decryptConfig(encryptedConfig: string): PaymentGatewayConfig {
    try {
      const parts = encryptedConfig.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted config format');
      }

      const [ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const encrypted = Buffer.from(encryptedHex, 'hex');

      const key = crypto
        .createHash('sha256')
        .update(this.encryptionKey)
        .digest();

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return JSON.parse(decrypted.toString('utf-8')) as PaymentGatewayConfig;
    } catch (error) {
      logger.error({ error }, 'Failed to decrypt gateway configuration');
      throw new BusinessLogicError('Failed to decrypt gateway configuration');
    }
  }

  /**
   * Encrypt gateway configuration for storage in the database
   * Uses AES-256-GCM for authenticated encryption
   */
  static encryptConfig(config: PaymentGatewayConfig, encryptionKey: string): string {
    const key = crypto
      .createHash('sha256')
      .update(encryptionKey)
      .digest();

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const plaintext = JSON.stringify(config);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf-8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /**
   * Instantiate an adapter from a database gateway record
   */
  private createAdapterFromRecord(record: GatewayRecord): IPaymentAdapter {
    const AdapterClass = ADAPTER_REGISTRY[record.code];
    if (!AdapterClass) {
      throw new NotFoundError(`Payment gateway adapter: ${record.code}`);
    }

    const config = this.decryptConfig(record.config);

    // Override base URL and callback URL from record if provided
    if (record.baseUrl) {
      config.baseUrl = record.baseUrl;
    }
    if (record.callbackUrl) {
      config.callbackUrl = record.callbackUrl;
    }
    if (record.sandbox !== undefined) {
      config.sandbox = record.sandbox;
    }

    return new AdapterClass(config);
  }

  /**
   * Get a payment adapter by its code.
   * Caches adapters for reuse.
   *
   * @param code - Gateway code (e.g., 'tripay', 'midtrans')
   * @param record - Gateway record from database (required on first call)
   * @returns Payment adapter instance
   */
  getAdapter(code: string, record?: GatewayRecord): IPaymentAdapter {
    // Return cached adapter if available
    const cached = this.adapters.get(code);
    if (cached) {
      return cached;
    }

    if (!record) {
      throw new NotFoundError(`Payment gateway: ${code}`);
    }

    const adapter = this.createAdapterFromRecord(record);
    this.adapters.set(code, adapter);

    logger.info({ gateway: code }, 'Payment adapter instantiated');
    return adapter;
  }

  /**
   * Initialize all active gateways from database records
   *
   * @param records - Array of active gateway records from database
   * @returns Map of gateway code to adapter instance
   */
  initializeAll(records: GatewayRecord[]): Map<string, IPaymentAdapter> {
    for (const record of records) {
      if (!record.isActive) continue;

      try {
        const adapter = this.createAdapterFromRecord(record);
        this.adapters.set(record.code, adapter);
        logger.info({ gateway: record.code, name: record.name }, 'Payment gateway initialized');
      } catch (error) {
        logger.error(
          { gateway: record.code, error },
          'Failed to initialize payment gateway'
        );
      }
    }

    return this.adapters;
  }

  /**
   * Get all active (initialized) adapters
   */
  getAllActive(): Map<string, IPaymentAdapter> {
    return this.adapters;
  }

  /**
   * Create a payment transaction using a specific gateway
   *
   * @param gatewayCode - Gateway code to use
   * @param params - Payment creation parameters
   * @returns Payment creation response
   */
  async createPayment(
    gatewayCode: string,
    params: CreatePaymentParams
  ): Promise<PaymentCreatedResponse> {
    const adapter = this.adapters.get(gatewayCode);
    if (!adapter) {
      throw new NotFoundError(`Payment gateway: ${gatewayCode}`);
    }

    logger.info(
      { gateway: gatewayCode, orderId: params.orderId, amount: params.amount, method: params.methodCode },
      'Creating payment transaction'
    );

    const result = await adapter.createTransaction(params);

    logger.info(
      { gateway: gatewayCode, orderId: params.orderId, gatewayRef: result.gatewayRef, success: result.success },
      'Payment transaction created'
    );

    return result;
  }

  /**
   * Remove a cached adapter (e.g., when gateway config is updated)
   */
  invalidateAdapter(code: string): void {
    this.adapters.delete(code);
    logger.info({ gateway: code }, 'Payment adapter cache invalidated');
  }

  /**
   * Check if a gateway code is supported
   */
  static isSupported(code: string): boolean {
    return code in ADAPTER_REGISTRY;
  }

  /**
   * Get list of all supported gateway codes
   */
  static getSupportedGateways(): string[] {
    return Object.keys(ADAPTER_REGISTRY);
  }
}
