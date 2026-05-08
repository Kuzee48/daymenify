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

interface MidtransChargeResponse {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status?: string;
  redirect_url?: string;
  va_numbers?: Array<{ bank: string; va_number: string }>;
  permata_va_number?: string;
  bill_key?: string;
  biller_code?: string;
  actions?: Array<{ name: string; method: string; url: string }>;
  expiry_time?: string;
}

interface MidtransStatusResponse {
  status_code: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_status: string;
  fraud_status?: string;
  settlement_time?: string;
}

interface MidtransWebhookBody {
  transaction_id: string;
  order_id: string;
  status_code: string;
  gross_amount: string;
  payment_type: string;
  transaction_status: string;
  fraud_status?: string;
  signature_key: string;
  settlement_time?: string;
}

/** Fee structure for Midtrans payment methods */
const MIDTRANS_FEE_MAP: Record<string, { flat: number; percent: number }> = {
  // Virtual Accounts
  bca_va: { flat: 4000, percent: 0 },
  bni_va: { flat: 4000, percent: 0 },
  bri_va: { flat: 4000, percent: 0 },
  permata_va: { flat: 4000, percent: 0 },
  mandiri_bill: { flat: 4000, percent: 0 },
  cimb_va: { flat: 4000, percent: 0 },
  // E-Wallets
  gopay: { flat: 0, percent: 2 },
  shopeepay: { flat: 0, percent: 1.5 },
  // QRIS
  qris: { flat: 0, percent: 0.7 },
  // Credit Card
  credit_card: { flat: 0, percent: 2.9 },
  // Convenience Store
  alfamart: { flat: 5000, percent: 0 },
  indomaret: { flat: 5000, percent: 0 },
};

/**
 * Midtrans Payment Gateway Adapter
 * @see https://docs.midtrans.com
 */
export class MidtransAdapter implements IPaymentAdapter {
  readonly name = 'Midtrans';
  readonly code = 'midtrans';

  private readonly serverKey: string;
  private readonly clientKey: string;
  private readonly merchantId: string;
  private readonly client: AxiosInstance;

  constructor(config: PaymentGatewayConfig) {
    this.serverKey = config.privateKey;
    this.clientKey = config.apiKey;
    this.merchantId = config.merchantCode || '';

    const authString = Buffer.from(`${this.serverKey}:`).toString('base64');

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.midtrans.com',
      timeout: 30000,
      headers: {
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  /**
   * Build Midtrans charge payload based on payment method
   */
  private buildChargePayload(params: CreatePaymentParams): Record<string, unknown> {
    const expiryMinutes = params.expiryMinutes || 60;
    const methodCode = params.methodCode.toLowerCase();

    const basePayload: Record<string, unknown> = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.amount,
      },
      customer_details: {
        first_name: params.customerName,
        email: params.customerEmail,
        phone: params.customerPhone || '',
      },
      item_details: [
        {
          id: params.orderId,
          price: params.amount,
          quantity: 1,
          name: params.description.substring(0, 50),
        },
      ],
      custom_expiry: {
        expiry_duration: expiryMinutes,
        unit: 'minute',
      },
    };

    // Map method code to Midtrans payment type
    if (methodCode.includes('va') || methodCode.includes('bill')) {
      basePayload.payment_type = 'bank_transfer';
      if (methodCode === 'mandiri_bill') {
        basePayload.payment_type = 'echannel';
        basePayload.echannel = {
          bill_info1: 'Payment',
          bill_info2: params.description.substring(0, 20),
        };
      } else {
        const bank = methodCode.replace('_va', '');
        basePayload.bank_transfer = { bank };
      }
    } else if (methodCode === 'gopay') {
      basePayload.payment_type = 'gopay';
      basePayload.gopay = { enable_callback: true };
    } else if (methodCode === 'shopeepay') {
      basePayload.payment_type = 'shopeepay';
    } else if (methodCode === 'qris') {
      basePayload.payment_type = 'qris';
    } else if (methodCode === 'credit_card') {
      basePayload.payment_type = 'credit_card';
      basePayload.credit_card = { secure: true };
    } else if (methodCode === 'alfamart' || methodCode === 'indomaret') {
      basePayload.payment_type = 'cstore';
      basePayload.cstore = { store: methodCode };
    } else {
      basePayload.payment_type = methodCode;
    }

    return basePayload;
  }

  async createTransaction(params: CreatePaymentParams): Promise<PaymentCreatedResponse> {
    const payload = this.buildChargePayload(params);

    try {
      const response = await this.client.post<MidtransChargeResponse>('/v2/charge', payload);
      const data = response.data;

      let vaNumber: string | undefined;
      let paymentUrl: string | undefined;
      let qrCode: string | undefined;

      // Extract VA number
      if (data.va_numbers && data.va_numbers.length > 0) {
        vaNumber = data.va_numbers[0].va_number;
      } else if (data.permata_va_number) {
        vaNumber = data.permata_va_number;
      } else if (data.bill_key) {
        vaNumber = `${data.biller_code}${data.bill_key}`;
      }

      // Extract redirect URL or QR
      if (data.redirect_url) {
        paymentUrl = data.redirect_url;
      }
      if (data.actions) {
        const deeplink = data.actions.find((a) => a.name === 'deeplink-redirect');
        const qrAction = data.actions.find((a) => a.name === 'generate-qr-code');
        if (deeplink) paymentUrl = deeplink.url;
        if (qrAction) qrCode = qrAction.url;
      }

      const fee = this.calculateFee(params.amount, params.methodCode);
      const expiryMinutes = params.expiryMinutes || 60;
      const expiresAt = data.expiry_time
        ? new Date(data.expiry_time)
        : new Date(Date.now() + expiryMinutes * 60 * 1000);

      logger.info(
        { gatewayRef: data.transaction_id, orderId: params.orderId },
        'Midtrans transaction created'
      );

      return {
        success: true,
        gatewayRef: data.transaction_id,
        paymentUrl,
        vaNumber,
        qrCode,
        expiresAt,
        amount: params.amount,
        fee,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.status_message || error.message;
        logger.error(
          { orderId: params.orderId, error: message, statusCode: error.response?.status },
          'Midtrans charge failed'
        );
        throw new BusinessLogicError(`Midtrans payment creation failed: ${message}`);
      }
      throw error;
    }
  }

  async checkStatus(gatewayRef: string): Promise<{ status: string; paidAt?: Date }> {
    try {
      const response = await this.client.get<MidtransStatusResponse>(
        `/v2/${gatewayRef}/status`
      );

      const data = response.data;
      const status = this.mapTransactionStatus(data.transaction_status, data.fraud_status);

      return {
        status,
        paidAt: data.settlement_time ? new Date(data.settlement_time) : undefined,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(
          { gatewayRef, error: error.response?.data?.status_message || error.message },
          'Midtrans status check failed'
        );
        throw new BusinessLogicError(`Midtrans status check failed: ${error.message}`);
      }
      throw error;
    }
  }

  verifyWebhookSignature(headers: Record<string, string>, body: unknown): boolean {
    const payload = body as MidtransWebhookBody;

    if (!payload.signature_key || !payload.order_id || !payload.status_code || !payload.gross_amount) {
      logger.warn('Midtrans webhook missing required fields for signature verification');
      return false;
    }

    const rawSignature = payload.order_id + payload.status_code + payload.gross_amount + this.serverKey;
    const expectedSignature = crypto.createHash('sha512').update(rawSignature).digest('hex');

    try {
      const sigBuffer = Buffer.from(payload.signature_key, 'hex');
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
    const payload = body as MidtransWebhookBody;
    const status = this.mapTransactionStatus(payload.transaction_status, payload.fraud_status);

    const statusMap: Record<string, PaymentWebhookData['status']> = {
      paid: 'paid',
      pending: 'paid', // treat as paid for webhook
      expired: 'expired',
      failed: 'failed',
      refunded: 'refunded',
    };

    const mappedStatus = statusMap[status];
    if (!mappedStatus) {
      throw new BusinessLogicError(`Unknown Midtrans status: ${payload.transaction_status}`);
    }

    return {
      gatewayRef: payload.transaction_id,
      orderId: payload.order_id,
      status: mappedStatus,
      amount: parseInt(payload.gross_amount, 10),
      paidAt: payload.settlement_time ? new Date(payload.settlement_time) : undefined,
      method: payload.payment_type,
      rawData: body,
    };
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    // Midtrans doesn't have a payment methods API endpoint
    // Return statically configured methods
    const methods: PaymentMethod[] = [
      { code: 'bca_va', name: 'BCA Virtual Account', type: 'virtual_account', fee: 4000, feeType: 'fixed' },
      { code: 'bni_va', name: 'BNI Virtual Account', type: 'virtual_account', fee: 4000, feeType: 'fixed' },
      { code: 'bri_va', name: 'BRI Virtual Account', type: 'virtual_account', fee: 4000, feeType: 'fixed' },
      { code: 'permata_va', name: 'Permata Virtual Account', type: 'virtual_account', fee: 4000, feeType: 'fixed' },
      { code: 'mandiri_bill', name: 'Mandiri Bill Payment', type: 'virtual_account', fee: 4000, feeType: 'fixed' },
      { code: 'cimb_va', name: 'CIMB Virtual Account', type: 'virtual_account', fee: 4000, feeType: 'fixed' },
      { code: 'gopay', name: 'GoPay', type: 'e-wallet', fee: 2, feeType: 'percentage' },
      { code: 'shopeepay', name: 'ShopeePay', type: 'e-wallet', fee: 1.5, feeType: 'percentage' },
      { code: 'qris', name: 'QRIS', type: 'qris', fee: 0.7, feeType: 'percentage' },
      { code: 'credit_card', name: 'Credit Card', type: 'credit_card', fee: 2.9, feeType: 'percentage' },
      { code: 'alfamart', name: 'Alfamart', type: 'convenience_store', fee: 5000, feeType: 'fixed' },
      { code: 'indomaret', name: 'Indomaret', type: 'convenience_store', fee: 5000, feeType: 'fixed' },
    ];

    return methods;
  }

  calculateFee(amount: number, methodCode: string): number {
    const code = methodCode.toLowerCase();
    const feeConfig = MIDTRANS_FEE_MAP[code];
    if (!feeConfig) {
      return Math.ceil(amount * 0.02);
    }

    const flatFee = feeConfig.flat;
    const percentFee = Math.ceil(amount * (feeConfig.percent / 100));
    return flatFee + percentFee;
  }

  /**
   * Map Midtrans transaction status to internal status
   */
  private mapTransactionStatus(transactionStatus: string, fraudStatus?: string): string {
    if (fraudStatus === 'deny') return 'failed';

    switch (transactionStatus) {
      case 'capture':
        return fraudStatus === 'accept' ? 'paid' : 'pending';
      case 'settlement':
        return 'paid';
      case 'pending':
        return 'pending';
      case 'deny':
      case 'cancel':
        return 'failed';
      case 'expire':
        return 'expired';
      case 'refund':
      case 'partial_refund':
        return 'refunded';
      default:
        return 'unknown';
    }
  }
}
