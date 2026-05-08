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

interface TripayTransactionResponse {
  success: boolean;
  message: string;
  data: {
    reference: string;
    merchant_ref: string;
    payment_selection_type: string;
    payment_method: string;
    payment_name: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    callback_url: string;
    return_url: string;
    amount: number;
    fee_merchant: number;
    fee_customer: number;
    total_fee: number;
    amount_received: number;
    pay_code?: string;
    pay_url?: string;
    checkout_url: string;
    qr_string?: string;
    qr_url?: string;
    expired_time: number;
    order_items: unknown[];
    status: string;
  };
}

interface TripayChannelResponse {
  success: boolean;
  message: string;
  data: Array<{
    group: string;
    code: string;
    name: string;
    type: string;
    fee_merchant: { flat: number; percent: number };
    fee_customer: { flat: number; percent: number };
    total_fee: { flat: number; percent: number };
    minimum_fee: number;
    maximum_fee: number;
    icon_url: string;
    active: boolean;
  }>;
}

interface TripayStatusResponse {
  success: boolean;
  message: string;
  data: {
    reference: string;
    merchant_ref: string;
    status: string;
    paid_at?: number;
  };
}

interface TripayWebhookBody {
  reference: string;
  merchant_ref: string;
  payment_method: string;
  payment_method_code: string;
  total_amount: number;
  fee_merchant: number;
  fee_customer: number;
  total_fee: number;
  amount_received: number;
  is_closed_payment: number;
  status: string;
  paid_at?: number;
  note?: string;
}

/** Fee structure for different Tripay payment methods */
const TRIPAY_FEE_MAP: Record<string, { flat: number; percent: number }> = {
  // Virtual Accounts
  BRIVA: { flat: 4000, percent: 0 },
  BCAVA: { flat: 4000, percent: 0 },
  MANDIRIVA: { flat: 4000, percent: 0 },
  BNIVA: { flat: 4000, percent: 0 },
  BSIVA: { flat: 4000, percent: 0 },
  CIMBVA: { flat: 4000, percent: 0 },
  PERMATAVA: { flat: 4000, percent: 0 },
  // QRIS
  QRIS: { flat: 0, percent: 0.7 },
  QRISC: { flat: 0, percent: 0.7 },
  QRIS2: { flat: 0, percent: 0.7 },
  // E-Wallets
  OVO: { flat: 0, percent: 2 },
  DANA: { flat: 0, percent: 1.5 },
  SHOPEEPAY: { flat: 0, percent: 1.5 },
  LINKAJA: { flat: 0, percent: 1.5 },
  // Convenience Store
  ALFAMART: { flat: 3500, percent: 0 },
  INDOMARET: { flat: 3500, percent: 0 },
};

/**
 * Tripay Payment Gateway Adapter
 * @see https://tripay.co.id/developer
 */
export class TripayAdapter implements IPaymentAdapter {
  readonly name = 'Tripay';
  readonly code = 'tripay';

  private readonly apiKey: string;
  private readonly privateKey: string;
  private readonly merchantCode: string;
  private readonly callbackUrl: string;
  private readonly client: AxiosInstance;

  constructor(config: PaymentGatewayConfig) {
    this.apiKey = config.apiKey;
    this.privateKey = config.privateKey;
    this.merchantCode = config.merchantCode || '';
    this.callbackUrl = config.callbackUrl || '';

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://tripay.co.id/api',
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generate HMAC-SHA256 signature for Tripay transaction creation
   */
  private generateSignature(merchantRef: string, amount: number): string {
    const payload = this.merchantCode + merchantRef + String(amount);
    return crypto
      .createHmac('sha256', this.privateKey)
      .update(payload)
      .digest('hex');
  }

  /**
   * Generate callback/webhook signature for verification
   */
  private generateCallbackSignature(body: string): string {
    return crypto
      .createHmac('sha256', this.privateKey)
      .update(body)
      .digest('hex');
  }

  async createTransaction(params: CreatePaymentParams): Promise<PaymentCreatedResponse> {
    const expiryMinutes = params.expiryMinutes || 60;
    const expiredTime = Math.floor(Date.now() / 1000) + expiryMinutes * 60;

    const signature = this.generateSignature(params.orderId, params.amount);

    const payload = {
      method: params.methodCode,
      merchant_ref: params.orderId,
      amount: params.amount,
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone || '',
      order_items: [
        {
          name: params.description,
          price: params.amount,
          quantity: 1,
        },
      ],
      callback_url: this.callbackUrl,
      return_url: this.callbackUrl,
      expired_time: expiredTime,
      signature,
    };

    try {
      const response = await this.client.post<TripayTransactionResponse>(
        '/transaction/create',
        payload
      );

      const data = response.data.data;
      const fee = this.calculateFee(params.amount, params.methodCode);

      logger.info(
        { gatewayRef: data.reference, orderId: params.orderId, method: params.methodCode },
        'Tripay transaction created'
      );

      return {
        success: true,
        gatewayRef: data.reference,
        paymentUrl: data.checkout_url || data.pay_url,
        vaNumber: data.pay_code,
        qrCode: data.qr_string || data.qr_url,
        expiresAt: new Date(data.expired_time * 1000),
        amount: data.amount,
        fee,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        logger.error(
          { orderId: params.orderId, error: message },
          'Tripay transaction creation failed'
        );
        throw new BusinessLogicError(`Tripay payment creation failed: ${message}`);
      }
      throw error;
    }
  }

  async checkStatus(gatewayRef: string): Promise<{ status: string; paidAt?: Date }> {
    try {
      const response = await this.client.get<TripayStatusResponse>(
        '/transaction/detail',
        { params: { reference: gatewayRef } }
      );

      const data = response.data.data;
      const statusMap: Record<string, string> = {
        PAID: 'paid',
        UNPAID: 'pending',
        EXPIRED: 'expired',
        FAILED: 'failed',
        REFUND: 'refunded',
      };

      return {
        status: statusMap[data.status] || 'unknown',
        paidAt: data.paid_at ? new Date(data.paid_at * 1000) : undefined,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(
          { gatewayRef, error: error.response?.data?.message || error.message },
          'Tripay status check failed'
        );
        throw new BusinessLogicError(`Tripay status check failed: ${error.message}`);
      }
      throw error;
    }
  }

  verifyWebhookSignature(headers: Record<string, string>, body: unknown): boolean {
    const signature = headers['x-callback-signature'] || '';
    if (!signature) {
      logger.warn('Tripay webhook missing x-callback-signature header');
      return false;
    }

    const jsonBody = typeof body === 'string' ? body : JSON.stringify(body);
    const expectedSignature = this.generateCallbackSignature(jsonBody);

    try {
      const sigBuffer = Buffer.from(signature, 'hex');
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
    const payload = body as TripayWebhookBody;

    const statusMap: Record<string, PaymentWebhookData['status']> = {
      PAID: 'paid',
      EXPIRED: 'expired',
      FAILED: 'failed',
      REFUND: 'refunded',
    };

    const status = statusMap[payload.status];
    if (!status) {
      throw new BusinessLogicError(`Unknown Tripay webhook status: ${payload.status}`);
    }

    return {
      gatewayRef: payload.reference,
      orderId: payload.merchant_ref,
      status,
      amount: payload.total_amount,
      paidAt: payload.paid_at ? new Date(payload.paid_at * 1000) : undefined,
      method: payload.payment_method_code,
      rawData: body,
    };
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await this.client.get<TripayChannelResponse>(
        '/merchant/payment-channel'
      );

      return response.data.data
        .filter((ch) => ch.active)
        .map((ch) => ({
          code: ch.code,
          name: ch.name,
          type: ch.group.toLowerCase(),
          fee: ch.total_fee.flat || ch.total_fee.percent,
          feeType: ch.total_fee.flat > 0 ? ('fixed' as const) : ('percentage' as const),
          icon: ch.icon_url,
        }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(
          { error: error.response?.data?.message || error.message },
          'Tripay fetch payment methods failed'
        );
        throw new BusinessLogicError(`Failed to fetch Tripay payment methods: ${error.message}`);
      }
      throw error;
    }
  }

  calculateFee(amount: number, methodCode: string): number {
    const feeConfig = TRIPAY_FEE_MAP[methodCode];
    if (!feeConfig) {
      // Default fee: 1% of amount
      return Math.ceil(amount * 0.01);
    }

    const flatFee = feeConfig.flat;
    const percentFee = Math.ceil(amount * (feeConfig.percent / 100));
    return flatFee + percentFee;
  }
}
