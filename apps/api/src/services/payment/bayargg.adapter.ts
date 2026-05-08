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

interface BayarGGOrderResponse {
  success: boolean;
  data: {
    id: string;
    external_id: string;
    status: string;
    amount: number;
    fee: number;
    total: number;
    payment_method: string;
    payment_url: string;
    va_number?: string;
    qr_code?: string;
    expired_at: string;
    created_at: string;
  };
  message?: string;
}

interface BayarGGStatusResponse {
  success: boolean;
  data: {
    id: string;
    external_id: string;
    status: string;
    amount: number;
    paid_at?: string;
    payment_method?: string;
  };
}

interface BayarGGWebhookBody {
  id: string;
  external_id: string;
  status: string;
  amount: number;
  fee: number;
  payment_method: string;
  paid_at?: string;
  signature: string;
}

interface BayarGGMethodsResponse {
  success: boolean;
  data: Array<{
    code: string;
    name: string;
    group: string;
    fee_flat: number;
    fee_percent: number;
    min_amount: number;
    max_amount: number;
    is_active: boolean;
    icon_url?: string;
  }>;
}

/** Fee structure for Bayar.gg payment methods */
const BAYARGG_FEE_MAP: Record<string, { flat: number; percent: number }> = {
  // Virtual Accounts
  va_bca: { flat: 4500, percent: 0 },
  va_bni: { flat: 4500, percent: 0 },
  va_bri: { flat: 4500, percent: 0 },
  va_mandiri: { flat: 4500, percent: 0 },
  va_permata: { flat: 4500, percent: 0 },
  va_cimb: { flat: 4500, percent: 0 },
  // QRIS
  qris: { flat: 0, percent: 0.7 },
  // E-Wallets
  ewallet_ovo: { flat: 0, percent: 2 },
  ewallet_dana: { flat: 0, percent: 1.5 },
  ewallet_shopeepay: { flat: 0, percent: 1.5 },
  ewallet_linkaja: { flat: 0, percent: 1.5 },
};

/**
 * Bayar.gg Payment Gateway Adapter
 * @see https://docs.bayar.gg
 */
export class BayarGGAdapter implements IPaymentAdapter {
  readonly name = 'Bayar.gg';
  readonly code = 'bayargg';

  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly callbackUrl: string;
  private readonly client: AxiosInstance;

  constructor(config: PaymentGatewayConfig) {
    this.apiKey = config.apiKey;
    this.secretKey = config.privateKey;
    this.callbackUrl = config.callbackUrl || '';

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.bayar.gg',
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  /**
   * Generate HMAC-SHA256 webhook signature
   */
  private generateWebhookSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(payload)
      .digest('hex');
  }

  async createTransaction(params: CreatePaymentParams): Promise<PaymentCreatedResponse> {
    const expiryMinutes = params.expiryMinutes || 60;

    const payload = {
      external_id: params.orderId,
      amount: params.amount,
      payment_method: params.methodCode,
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone || '',
      description: params.description,
      callback_url: this.callbackUrl,
      expiry_minutes: expiryMinutes,
    };

    try {
      const response = await this.client.post<BayarGGOrderResponse>('/v1/orders', payload);
      const data = response.data.data;

      const fee = this.calculateFee(params.amount, params.methodCode);

      logger.info(
        { gatewayRef: data.id, orderId: params.orderId, method: params.methodCode },
        'Bayar.gg order created'
      );

      return {
        success: true,
        gatewayRef: data.id,
        paymentUrl: data.payment_url,
        vaNumber: data.va_number,
        qrCode: data.qr_code,
        expiresAt: new Date(data.expired_at),
        amount: data.amount,
        fee,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        logger.error(
          { orderId: params.orderId, error: message },
          'Bayar.gg order creation failed'
        );
        throw new BusinessLogicError(`Bayar.gg payment creation failed: ${message}`);
      }
      throw error;
    }
  }

  async checkStatus(gatewayRef: string): Promise<{ status: string; paidAt?: Date }> {
    try {
      const response = await this.client.get<BayarGGStatusResponse>(
        `/v1/orders/${gatewayRef}`
      );

      const data = response.data.data;
      const statusMap: Record<string, string> = {
        pending: 'pending',
        paid: 'paid',
        settled: 'paid',
        expired: 'expired',
        failed: 'failed',
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
          'Bayar.gg status check failed'
        );
        throw new BusinessLogicError(`Bayar.gg status check failed: ${error.message}`);
      }
      throw error;
    }
  }

  verifyWebhookSignature(headers: Record<string, string>, body: unknown): boolean {
    const signature = headers['x-signature'] || headers['x-webhook-signature'] || '';
    if (!signature) {
      logger.warn('Bayar.gg webhook missing signature header');
      return false;
    }

    const jsonBody = typeof body === 'string' ? body : JSON.stringify(body);
    const expectedSignature = this.generateWebhookSignature(jsonBody);

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
    const payload = body as BayarGGWebhookBody;

    const statusMap: Record<string, PaymentWebhookData['status']> = {
      paid: 'paid',
      settled: 'paid',
      expired: 'expired',
      failed: 'failed',
      refunded: 'refunded',
    };

    const status = statusMap[payload.status];
    if (!status) {
      throw new BusinessLogicError(`Unknown Bayar.gg webhook status: ${payload.status}`);
    }

    return {
      gatewayRef: payload.id,
      orderId: payload.external_id,
      status,
      amount: payload.amount,
      paidAt: payload.paid_at ? new Date(payload.paid_at) : undefined,
      method: payload.payment_method,
      rawData: body,
    };
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await this.client.get<BayarGGMethodsResponse>('/v1/payment-methods');

      return response.data.data
        .filter((m) => m.is_active)
        .map((m) => ({
          code: m.code,
          name: m.name,
          type: m.group.toLowerCase(),
          fee: m.fee_flat || m.fee_percent,
          feeType: m.fee_flat > 0 ? ('fixed' as const) : ('percentage' as const),
          icon: m.icon_url,
        }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(
          { error: error.response?.data?.message || error.message },
          'Bayar.gg get payment methods failed'
        );
        throw new BusinessLogicError(`Failed to fetch Bayar.gg payment methods: ${error.message}`);
      }
      throw error;
    }
  }

  calculateFee(amount: number, methodCode: string): number {
    const feeConfig = BAYARGG_FEE_MAP[methodCode];
    if (!feeConfig) {
      return Math.ceil(amount * 0.015);
    }

    const flatFee = feeConfig.flat;
    const percentFee = Math.ceil(amount * (feeConfig.percent / 100));
    return flatFee + percentFee;
  }
}
