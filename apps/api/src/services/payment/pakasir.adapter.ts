import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';
import { logger } from '@/lib/logger';
import { BusinessLogicError } from '@/lib/errors';
import {
  IPaymentAdapter,
  CreatePaymentParams,
  PaymentCreatedResponse,
  PaymentWebhookData,
  PaymentMethod,
  PaymentGatewayConfig,
} from './payment.interface';

interface PakasirCreateResponse {
  status: boolean;
  message: string;
  data: {
    transaction_id: string;
    merchant_ref: string;
    amount: number;
    fee: number;
    total: number;
    payment_method: string;
    payment_url?: string;
    pay_code?: string;
    qr_string?: string;
    expired_at: string;
    status: string;
  };
}

interface PakasirStatusResponse {
  status: boolean;
  message: string;
  data: {
    transaction_id: string;
    merchant_ref: string;
    status: string;
    amount: number;
    paid_at?: string;
  };
}

interface PakasirWebhookBody {
  transaction_id: string;
  merchant_ref: string;
  amount: number;
  fee: number;
  status: string;
  payment_method: string;
  paid_at?: string;
  signature: string;
}

interface PakasirMethodsResponse {
  status: boolean;
  data: Array<{
    code: string;
    name: string;
    group: string;
    fee_flat: number;
    fee_percent: number;
    min_amount: number;
    max_amount: number;
    active: boolean;
    icon?: string;
  }>;
}

/** Fee structure for Pakasir payment methods */
const PAKASIR_FEE_MAP: Record<string, { flat: number; percent: number }> = {
  // Virtual Accounts
  VA_BCA: { flat: 4000, percent: 0 },
  VA_BNI: { flat: 4000, percent: 0 },
  VA_BRI: { flat: 4000, percent: 0 },
  VA_MANDIRI: { flat: 4000, percent: 0 },
  VA_PERMATA: { flat: 4000, percent: 0 },
  VA_CIMB: { flat: 4000, percent: 0 },
  VA_BSI: { flat: 4000, percent: 0 },
  // QRIS
  QRIS: { flat: 0, percent: 0.7 },
  // E-Wallets
  EWALLET_OVO: { flat: 0, percent: 2 },
  EWALLET_DANA: { flat: 0, percent: 1.5 },
  EWALLET_SHOPEEPAY: { flat: 0, percent: 1.5 },
  EWALLET_GOPAY: { flat: 0, percent: 2 },
  EWALLET_LINKAJA: { flat: 0, percent: 1.5 },
  // Convenience Store
  STORE_ALFAMART: { flat: 3500, percent: 0 },
  STORE_INDOMARET: { flat: 3500, percent: 0 },
};

/**
 * Pakasir Payment Gateway Adapter
 * @see https://docs.pakasir.com
 */
export class PakasirAdapter implements IPaymentAdapter {
  readonly name = 'Pakasir';
  readonly code = 'pakasir';

  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly merchantCode: string;
  private readonly callbackUrl: string;
  private readonly client: AxiosInstance;

  constructor(config: PaymentGatewayConfig) {
    this.apiKey = config.apiKey;
    this.secretKey = config.privateKey;
    this.merchantCode = config.merchantCode || '';
    this.callbackUrl = config.callbackUrl || '';

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.pakasir.com',
      timeout: 30000,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  /**
   * Generate HMAC-SHA256 signature for Pakasir requests
   * Format: HMAC-SHA256(merchantCode + merchantRef + amount, secretKey)
   */
  private generateRequestSignature(merchantRef: string, amount: number): string {
    const payload = this.merchantCode + merchantRef + String(amount);
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(payload)
      .digest('hex');
  }

  /**
   * Generate signature for webhook verification
   * Format: HMAC-SHA256(transaction_id + merchant_ref + amount + status, secretKey)
   */
  private generateWebhookVerificationSignature(
    transactionId: string,
    merchantRef: string,
    amount: number,
    status: string
  ): string {
    const payload = transactionId + merchantRef + String(amount) + status;
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(payload)
      .digest('hex');
  }

  async createTransaction(params: CreatePaymentParams): Promise<PaymentCreatedResponse> {
    const expiryMinutes = params.expiryMinutes || 60;
    const signature = this.generateRequestSignature(params.orderId, params.amount);

    const payload = {
      merchant_code: this.merchantCode,
      merchant_ref: params.orderId,
      amount: params.amount,
      payment_method: params.methodCode,
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone || '',
      description: params.description,
      callback_url: this.callbackUrl,
      return_url: this.callbackUrl,
      expired_minutes: expiryMinutes,
      signature,
    };

    try {
      const response = await this.client.post<PakasirCreateResponse>(
        '/api/v1/transaction/create',
        payload
      );

      const data = response.data.data;

      if (!response.data.status) {
        throw new BusinessLogicError(`Pakasir transaction failed: ${response.data.message}`);
      }

      const fee = this.calculateFee(params.amount, params.methodCode);

      logger.info(
        { gatewayRef: data.transaction_id, orderId: params.orderId, method: params.methodCode },
        'Pakasir transaction created'
      );

      return {
        success: true,
        gatewayRef: data.transaction_id,
        paymentUrl: data.payment_url,
        vaNumber: data.pay_code,
        qrCode: data.qr_string,
        expiresAt: new Date(data.expired_at),
        amount: data.amount,
        fee,
      };
    } catch (error) {
      if (error instanceof BusinessLogicError) throw error;
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        logger.error(
          { orderId: params.orderId, error: message },
          'Pakasir transaction creation failed'
        );
        throw new BusinessLogicError(`Pakasir payment creation failed: ${message}`);
      }
      throw error;
    }
  }

  async checkStatus(gatewayRef: string): Promise<{ status: string; paidAt?: Date }> {
    try {
      const response = await this.client.get<PakasirStatusResponse>(
        `/api/v1/transaction/${gatewayRef}/status`
      );

      const data = response.data.data;
      const statusMap: Record<string, string> = {
        pending: 'pending',
        paid: 'paid',
        settled: 'paid',
        expired: 'expired',
        failed: 'failed',
        cancelled: 'failed',
        refunded: 'refunded',
      };

      return {
        status: statusMap[data.status] || 'unknown',
        paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(
          { gatewayRef, error: error.response?.data?.message || error.message },
          'Pakasir status check failed'
        );
        throw new BusinessLogicError(`Pakasir status check failed: ${error.message}`);
      }
      throw error;
    }
  }

  verifyWebhookSignature(headers: Record<string, string>, body: unknown): boolean {
    const payload = body as PakasirWebhookBody;

    if (!payload.transaction_id || !payload.merchant_ref || !payload.signature) {
      logger.warn('Pakasir webhook missing required fields');
      return false;
    }

    const expectedSignature = this.generateWebhookVerificationSignature(
      payload.transaction_id,
      payload.merchant_ref,
      payload.amount,
      payload.status
    );

    try {
      const sigBuffer = Buffer.from(payload.signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (sigBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }

  parseWebhookPayload(body: unknown): PaymentWebhookData {
    const payload = body as PakasirWebhookBody;

    const statusMap: Record<string, PaymentWebhookData['status']> = {
      paid: 'paid',
      settled: 'paid',
      expired: 'expired',
      failed: 'failed',
      cancelled: 'failed',
      refunded: 'refunded',
    };

    const status = statusMap[payload.status];
    if (!status) {
      throw new BusinessLogicError(`Unknown Pakasir webhook status: ${payload.status}`);
    }

    return {
      gatewayRef: payload.transaction_id,
      orderId: payload.merchant_ref,
      status,
      amount: payload.amount,
      paidAt: payload.paid_at ? new Date(payload.paid_at) : undefined,
      method: payload.payment_method,
      rawData: body,
    };
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await this.client.get<PakasirMethodsResponse>(
        '/api/v1/payment-methods'
      );

      if (!response.data.status) {
        return [];
      }

      return response.data.data
        .filter((m) => m.active)
        .map((m) => ({
          code: m.code,
          name: m.name,
          type: m.group.toLowerCase(),
          fee: m.fee_flat || m.fee_percent,
          feeType: m.fee_flat > 0 ? ('fixed' as const) : ('percentage' as const),
          icon: m.icon,
        }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(
          { error: error.response?.data?.message || error.message },
          'Pakasir get payment methods failed'
        );
        throw new BusinessLogicError(`Failed to fetch Pakasir payment methods: ${error.message}`);
      }
      throw error;
    }
  }

  calculateFee(amount: number, methodCode: string): number {
    const feeConfig = PAKASIR_FEE_MAP[methodCode];
    if (!feeConfig) {
      return Math.ceil(amount * 0.015);
    }

    const flatFee = feeConfig.flat;
    const percentFee = Math.ceil(amount * (feeConfig.percent / 100));
    return flatFee + percentFee;
  }
}
