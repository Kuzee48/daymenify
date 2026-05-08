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

interface DuitkuInquiryResponse {
  merchantCode: string;
  reference: string;
  paymentUrl: string;
  vaNumber?: string;
  qrString?: string;
  amount: string;
  statusCode: string;
  statusMessage: string;
}

interface DuitkuStatusResponse {
  merchantCode: string;
  merchantOrderId: string;
  reference: string;
  amount: string;
  statusCode: string;
  statusMessage: string;
}

interface DuitkuWebhookBody {
  merchantCode: string;
  amount: string;
  merchantOrderId: string;
  productDetail: string;
  additionalParam: string;
  paymentCode: string;
  resultCode: string;
  merchantUserId: string;
  reference: string;
  signature: string;
  publisherOrderId?: string;
  settlementDate?: string;
}

interface DuitkuPaymentMethodResponse {
  paymentFee: Array<{
    paymentMethod: string;
    paymentName: string;
    paymentImage: string;
    totalFee: string;
  }>;
  responseCode: string;
  responseMessage: string;
}

/** Fee structure for Duitku payment methods */
const DUITKU_FEE_MAP: Record<string, { flat: number; percent: number }> = {
  // Virtual Accounts
  BC: { flat: 4000, percent: 0 }, // BCA VA
  M2: { flat: 4000, percent: 0 }, // Mandiri VA
  VA: { flat: 4000, percent: 0 }, // Maybank VA
  I1: { flat: 4000, percent: 0 }, // BNI VA
  B1: { flat: 4000, percent: 0 }, // CIMB Niaga VA
  BT: { flat: 4000, percent: 0 }, // Permata VA
  A1: { flat: 4000, percent: 0 }, // ATM Bersama
  AG: { flat: 4000, percent: 0 }, // Bank Artha Graha
  NC: { flat: 4000, percent: 0 }, // Bank Neo/BNC VA
  BR: { flat: 4000, percent: 0 }, // BRI VA
  S1: { flat: 4000, percent: 0 }, // BSI VA
  // QRIS
  SP: { flat: 0, percent: 0.7 }, // ShopeePay/QRIS
  // E-Wallets
  OV: { flat: 0, percent: 2 }, // OVO
  SA: { flat: 0, percent: 1.5 }, // ShopeePay App
  LF: { flat: 0, percent: 1.5 }, // LinkAja
  LA: { flat: 0, percent: 1.5 }, // LinkAja App
  DA: { flat: 0, percent: 1.5 }, // DANA
  // Retail
  FT: { flat: 5000, percent: 0 }, // Alfamart
  IR: { flat: 5000, percent: 0 }, // Indomaret
  // Credit Card
  VC: { flat: 0, percent: 2.9 }, // Visa/Mastercard
};

/**
 * Duitku Payment Gateway Adapter
 * @see https://docs.duitku.com
 */
export class DuitkuAdapter implements IPaymentAdapter {
  readonly name = 'Duitku';
  readonly code = 'duitku';

  private readonly merchantCode: string;
  private readonly apiKey: string;
  private readonly callbackUrl: string;
  private readonly client: AxiosInstance;

  constructor(config: PaymentGatewayConfig) {
    this.merchantCode = config.merchantCode || '';
    this.apiKey = config.privateKey;
    this.callbackUrl = config.callbackUrl || '';

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://passport.duitku.com',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generate MD5 signature for Duitku requests
   * Format: MD5(merchantCode + amount + datetime + apiKey)
   */
  private generateRequestSignature(amount: number, datetime: string): string {
    const raw = this.merchantCode + String(amount) + datetime + this.apiKey;
    return crypto.createHash('md5').update(raw).digest('hex');
  }

  /**
   * Generate MD5 signature for webhook verification
   * Format: MD5(merchantCode + amount + merchantOrderId + apiKey)
   */
  private generateCallbackSignature(merchantOrderId: string, amount: string): string {
    const raw = this.merchantCode + amount + merchantOrderId + this.apiKey;
    return crypto.createHash('md5').update(raw).digest('hex');
  }

  async createTransaction(params: CreatePaymentParams): Promise<PaymentCreatedResponse> {
    const expiryMinutes = params.expiryMinutes || 1440; // Default 24 hours
    const datetime = new Date().toISOString().replace(/[-T:.Z]/g, '').substring(0, 14);
    const signature = this.generateRequestSignature(params.amount, datetime);

    const payload = {
      merchantCode: this.merchantCode,
      paymentAmount: params.amount,
      paymentMethod: params.methodCode,
      merchantOrderId: params.orderId,
      productDetails: params.description,
      customerVaName: params.customerName,
      email: params.customerEmail,
      phoneNumber: params.customerPhone || '',
      callbackUrl: this.callbackUrl,
      returnUrl: this.callbackUrl,
      signature,
      timestamp: datetime,
      expiryPeriod: expiryMinutes,
    };

    try {
      const response = await this.client.post<DuitkuInquiryResponse>(
        '/api/merchant/v2/inquiry',
        payload
      );

      const data = response.data;

      if (data.statusCode !== '00') {
        throw new BusinessLogicError(`Duitku inquiry failed: ${data.statusMessage}`);
      }

      const fee = this.calculateFee(params.amount, params.methodCode);

      logger.info(
        { gatewayRef: data.reference, orderId: params.orderId, method: params.methodCode },
        'Duitku transaction created'
      );

      return {
        success: true,
        gatewayRef: data.reference,
        paymentUrl: data.paymentUrl,
        vaNumber: data.vaNumber,
        qrCode: data.qrString,
        expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
        amount: parseInt(data.amount, 10),
        fee,
      };
    } catch (error) {
      if (error instanceof BusinessLogicError) throw error;
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.statusMessage || error.message;
        logger.error(
          { orderId: params.orderId, error: message },
          'Duitku inquiry failed'
        );
        throw new BusinessLogicError(`Duitku payment creation failed: ${message}`);
      }
      throw error;
    }
  }

  async checkStatus(gatewayRef: string): Promise<{ status: string; paidAt?: Date }> {
    const datetime = new Date().toISOString().replace(/[-T:.Z]/g, '').substring(0, 14);
    const signature = this.generateRequestSignature(0, datetime);

    try {
      const response = await this.client.post<DuitkuStatusResponse>(
        '/api/merchant/transactionStatus',
        {
          merchantCode: this.merchantCode,
          merchantOrderId: gatewayRef,
          signature,
          timestamp: datetime,
        }
      );

      const data = response.data;
      const statusMap: Record<string, string> = {
        '00': 'paid',
        '01': 'pending',
        '02': 'expired',
        '03': 'failed',
      };

      return {
        status: statusMap[data.statusCode] || 'unknown',
        paidAt: data.statusCode === '00' ? new Date() : undefined,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(
          { gatewayRef, error: error.response?.data?.statusMessage || error.message },
          'Duitku status check failed'
        );
        throw new BusinessLogicError(`Duitku status check failed: ${error.message}`);
      }
      throw error;
    }
  }

  verifyWebhookSignature(headers: Record<string, string>, body: unknown): boolean {
    const payload = body as DuitkuWebhookBody;

    if (!payload.merchantOrderId || !payload.amount || !payload.signature) {
      logger.warn('Duitku webhook missing required fields');
      return false;
    }

    const expectedSignature = this.generateCallbackSignature(
      payload.merchantOrderId,
      payload.amount
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
    const payload = body as DuitkuWebhookBody;

    const statusMap: Record<string, PaymentWebhookData['status']> = {
      '00': 'paid',
      '01': 'failed',
      '02': 'expired',
    };

    const status = statusMap[payload.resultCode];
    if (!status) {
      throw new BusinessLogicError(`Unknown Duitku result code: ${payload.resultCode}`);
    }

    return {
      gatewayRef: payload.reference,
      orderId: payload.merchantOrderId,
      status,
      amount: parseInt(payload.amount, 10),
      paidAt: status === 'paid' ? new Date() : undefined,
      method: payload.paymentCode,
      rawData: body,
    };
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const datetime = new Date().toISOString().replace(/[-T:.Z]/g, '').substring(0, 14);
    // For payment method list, Duitku needs a dummy amount
    const signature = this.generateRequestSignature(10000, datetime);

    try {
      const response = await this.client.post<DuitkuPaymentMethodResponse>(
        '/api/merchant/paymentmethod/getpaymentmethod',
        {
          merchantCode: this.merchantCode,
          amount: 10000,
          datetime,
          signature,
        }
      );

      if (response.data.responseCode !== '00') {
        throw new BusinessLogicError(`Duitku get methods failed: ${response.data.responseMessage}`);
      }

      return response.data.paymentFee.map((method) => {
        const fee = parseInt(method.totalFee, 10);
        return {
          code: method.paymentMethod,
          name: method.paymentName,
          type: this.getMethodType(method.paymentMethod),
          fee: fee || 0,
          feeType: fee > 100 ? ('fixed' as const) : ('percentage' as const),
          icon: method.paymentImage,
        };
      });
    } catch (error) {
      if (error instanceof BusinessLogicError) throw error;
      if (axios.isAxiosError(error)) {
        logger.error(
          { error: error.response?.data?.responseMessage || error.message },
          'Duitku get payment methods failed'
        );
        throw new BusinessLogicError(`Failed to fetch Duitku payment methods: ${error.message}`);
      }
      throw error;
    }
  }

  calculateFee(amount: number, methodCode: string): number {
    const feeConfig = DUITKU_FEE_MAP[methodCode];
    if (!feeConfig) {
      return Math.ceil(amount * 0.02);
    }

    const flatFee = feeConfig.flat;
    const percentFee = Math.ceil(amount * (feeConfig.percent / 100));
    return flatFee + percentFee;
  }

  /**
   * Map Duitku payment method code to method type
   */
  private getMethodType(code: string): string {
    const vaTypes = ['BC', 'M2', 'VA', 'I1', 'B1', 'BT', 'A1', 'AG', 'NC', 'BR', 'S1'];
    const ewalletTypes = ['OV', 'SA', 'LF', 'LA', 'DA'];
    const retailTypes = ['FT', 'IR'];
    const qrisTypes = ['SP'];
    const ccTypes = ['VC'];

    if (vaTypes.includes(code)) return 'virtual_account';
    if (ewalletTypes.includes(code)) return 'e-wallet';
    if (retailTypes.includes(code)) return 'convenience_store';
    if (qrisTypes.includes(code)) return 'qris';
    if (ccTypes.includes(code)) return 'credit_card';
    return 'other';
  }
}
