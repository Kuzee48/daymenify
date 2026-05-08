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

interface XenditInvoiceResponse {
  id: string;
  external_id: string;
  user_id: string;
  status: string;
  merchant_name: string;
  merchant_profile_picture_url: string;
  amount: number;
  payer_email: string;
  description: string;
  expiry_date: string;
  invoice_url: string;
  available_banks?: Array<{
    bank_code: string;
    collection_type: string;
    bank_account_number: string;
    transfer_amount: number;
    bank_branch: string;
    account_holder_name: string;
  }>;
  available_retail_outlets?: Array<{
    retail_outlet_name: string;
    payment_code: string;
    transfer_amount: number;
  }>;
  available_ewallets?: Array<{
    ewallet_type: string;
  }>;
  should_exclude_credit_card: boolean;
  should_send_email: boolean;
  created: string;
  updated: string;
  currency: string;
  fees_paid_with?: string;
}

interface XenditStatusResponse {
  id: string;
  external_id: string;
  status: string;
  amount: number;
  paid_amount?: number;
  paid_at?: string;
  payment_method?: string;
  payment_channel?: string;
}

interface XenditWebhookBody {
  id: string;
  external_id: string;
  user_id: string;
  is_high: boolean;
  status: string;
  merchant_name: string;
  amount: number;
  paid_amount?: number;
  paid_at?: string;
  payer_email?: string;
  description?: string;
  payment_method?: string;
  payment_channel?: string;
  bank_code?: string;
  retail_outlet_name?: string;
  ewallet_type?: string;
  fees_paid_amount?: number;
}

/** Fee structure for Xendit payment methods */
const XENDIT_FEE_MAP: Record<string, { flat: number; percent: number }> = {
  // Virtual Accounts
  BCA: { flat: 4000, percent: 0 },
  BNI: { flat: 4000, percent: 0 },
  BRI: { flat: 4000, percent: 0 },
  MANDIRI: { flat: 4000, percent: 0 },
  PERMATA: { flat: 4000, percent: 0 },
  BSI: { flat: 4000, percent: 0 },
  BJB: { flat: 4000, percent: 0 },
  CIMB: { flat: 4000, percent: 0 },
  // E-Wallets
  OVO: { flat: 0, percent: 2 },
  DANA: { flat: 0, percent: 1.5 },
  LINKAJA: { flat: 0, percent: 1.5 },
  SHOPEEPAY: { flat: 0, percent: 2 },
  // QRIS
  QRIS: { flat: 0, percent: 0.7 },
  // Retail
  ALFAMART: { flat: 5000, percent: 0 },
  INDOMARET: { flat: 5000, percent: 0 },
  // Credit Card
  CREDIT_CARD: { flat: 0, percent: 2.9 },
};

/**
 * Xendit Payment Gateway Adapter
 * @see https://developers.xendit.co
 */
export class XenditAdapter implements IPaymentAdapter {
  readonly name = 'Xendit';
  readonly code = 'xendit';

  private readonly secretKey: string;
  private readonly callbackToken: string;
  private readonly callbackUrl: string;
  private readonly client: AxiosInstance;

  constructor(config: PaymentGatewayConfig) {
    this.secretKey = config.privateKey;
    this.callbackToken = config.apiKey; // Xendit uses callback verification token
    this.callbackUrl = config.callbackUrl || '';

    const authString = Buffer.from(`${this.secretKey}:`).toString('base64');

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.xendit.co',
      timeout: 30000,
      headers: {
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createTransaction(params: CreatePaymentParams): Promise<PaymentCreatedResponse> {
    const expiryMinutes = params.expiryMinutes || 1440; // Default 24 hours for Xendit
    const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const payload: Record<string, unknown> = {
      external_id: params.orderId,
      amount: params.amount,
      payer_email: params.customerEmail,
      description: params.description,
      invoice_duration: expiryMinutes * 60, // in seconds
      customer: {
        given_names: params.customerName,
        email: params.customerEmail,
        mobile_number: params.customerPhone,
      },
      customer_notification_preference: {
        invoice_created: ['email'],
        invoice_reminder: ['email'],
        invoice_paid: ['email'],
      },
      success_redirect_url: this.callbackUrl,
      failure_redirect_url: this.callbackUrl,
      currency: 'IDR',
    };

    // Set payment method filter if specific method requested
    if (params.methodCode) {
      const methodUpper = params.methodCode.toUpperCase();
      // Determine payment method type based on the code
      if (['BCA', 'BNI', 'BRI', 'MANDIRI', 'PERMATA', 'BSI', 'BJB', 'CIMB'].includes(methodUpper)) {
        payload.payment_methods = ['BANK_TRANSFER'];
      } else if (['OVO', 'DANA', 'LINKAJA', 'SHOPEEPAY'].includes(methodUpper)) {
        payload.payment_methods = ['EWALLET'];
      } else if (methodUpper === 'QRIS') {
        payload.payment_methods = ['QR_CODE'];
      } else if (['ALFAMART', 'INDOMARET'].includes(methodUpper)) {
        payload.payment_methods = ['RETAIL_OUTLET'];
      } else if (methodUpper === 'CREDIT_CARD') {
        payload.payment_methods = ['CREDIT_CARD'];
      }
    }

    try {
      const response = await this.client.post<XenditInvoiceResponse>('/v2/invoices', payload);
      const data = response.data;

      let vaNumber: string | undefined;
      if (data.available_banks && data.available_banks.length > 0) {
        vaNumber = data.available_banks[0].bank_account_number;
      }

      const fee = this.calculateFee(params.amount, params.methodCode);

      logger.info(
        { gatewayRef: data.id, orderId: params.orderId },
        'Xendit invoice created'
      );

      return {
        success: true,
        gatewayRef: data.id,
        paymentUrl: data.invoice_url,
        vaNumber,
        expiresAt: expiryDate,
        amount: data.amount,
        fee,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        logger.error(
          { orderId: params.orderId, error: message, errorCode: error.response?.data?.error_code },
          'Xendit invoice creation failed'
        );
        throw new BusinessLogicError(`Xendit payment creation failed: ${message}`);
      }
      throw error;
    }
  }

  async checkStatus(gatewayRef: string): Promise<{ status: string; paidAt?: Date }> {
    try {
      const response = await this.client.get<XenditStatusResponse>(
        `/v2/invoices/${gatewayRef}`
      );

      const data = response.data;
      const statusMap: Record<string, string> = {
        PENDING: 'pending',
        PAID: 'paid',
        SETTLED: 'paid',
        EXPIRED: 'expired',
      };

      return {
        status: statusMap[data.status] || 'unknown',
        paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(
          { gatewayRef, error: error.response?.data?.message || error.message },
          'Xendit status check failed'
        );
        throw new BusinessLogicError(`Xendit status check failed: ${error.message}`);
      }
      throw error;
    }
  }

  verifyWebhookSignature(headers: Record<string, string>, body: unknown): boolean {
    const callbackToken = headers['x-callback-token'] || '';
    if (!callbackToken) {
      logger.warn('Xendit webhook missing x-callback-token header');
      return false;
    }

    try {
      const tokenBuffer = Buffer.from(callbackToken, 'utf-8');
      const expectedBuffer = Buffer.from(this.callbackToken, 'utf-8');

      if (tokenBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(tokenBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }

  parseWebhookPayload(body: unknown): PaymentWebhookData {
    const payload = body as XenditWebhookBody;

    const statusMap: Record<string, PaymentWebhookData['status']> = {
      PAID: 'paid',
      SETTLED: 'paid',
      EXPIRED: 'expired',
    };

    const status = statusMap[payload.status];
    if (!status) {
      throw new BusinessLogicError(`Unknown Xendit webhook status: ${payload.status}`);
    }

    // Determine the method used
    const method = payload.payment_method || payload.payment_channel ||
      payload.bank_code || payload.retail_outlet_name || payload.ewallet_type;

    return {
      gatewayRef: payload.id,
      orderId: payload.external_id,
      status,
      amount: payload.paid_amount || payload.amount,
      paidAt: payload.paid_at ? new Date(payload.paid_at) : undefined,
      method,
      rawData: body,
    };
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    // Xendit provides payment methods through the invoice creation
    // Return statically configured methods
    const methods: PaymentMethod[] = [
      { code: 'BCA', name: 'BCA Virtual Account', type: 'virtual_account', fee: 4000, feeType: 'fixed' },
      { code: 'BNI', name: 'BNI Virtual Account', type: 'virtual_account', fee: 4000, feeType: 'fixed' },
      { code: 'BRI', name: 'BRI Virtual Account', type: 'virtual_account', fee: 4000, feeType: 'fixed' },
      { code: 'MANDIRI', name: 'Mandiri Virtual Account', type: 'virtual_account', fee: 4000, feeType: 'fixed' },
      { code: 'PERMATA', name: 'Permata Virtual Account', type: 'virtual_account', fee: 4000, feeType: 'fixed' },
      { code: 'BSI', name: 'BSI Virtual Account', type: 'virtual_account', fee: 4000, feeType: 'fixed' },
      { code: 'OVO', name: 'OVO', type: 'e-wallet', fee: 2, feeType: 'percentage' },
      { code: 'DANA', name: 'DANA', type: 'e-wallet', fee: 1.5, feeType: 'percentage' },
      { code: 'LINKAJA', name: 'LinkAja', type: 'e-wallet', fee: 1.5, feeType: 'percentage' },
      { code: 'SHOPEEPAY', name: 'ShopeePay', type: 'e-wallet', fee: 2, feeType: 'percentage' },
      { code: 'QRIS', name: 'QRIS', type: 'qris', fee: 0.7, feeType: 'percentage' },
      { code: 'ALFAMART', name: 'Alfamart', type: 'convenience_store', fee: 5000, feeType: 'fixed' },
      { code: 'INDOMARET', name: 'Indomaret', type: 'convenience_store', fee: 5000, feeType: 'fixed' },
      { code: 'CREDIT_CARD', name: 'Credit Card', type: 'credit_card', fee: 2.9, feeType: 'percentage' },
    ];

    return methods;
  }

  calculateFee(amount: number, methodCode: string): number {
    const code = methodCode.toUpperCase();
    const feeConfig = XENDIT_FEE_MAP[code];
    if (!feeConfig) {
      return Math.ceil(amount * 0.02);
    }

    const flatFee = feeConfig.flat;
    const percentFee = Math.ceil(amount * (feeConfig.percent / 100));
    return flatFee + percentFee;
  }
}
