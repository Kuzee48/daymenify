import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';
import { logger } from '@/lib/logger';
import { BusinessLogicError } from '@/lib/errors';
import {
  IProviderAdapter,
  CreateOrderParams,
  ProviderOrderResponse,
  ProviderBalance,
  ProviderProductRaw,
  ProviderConfig,
} from './provider.interface';

interface TokovoucherOrderResponse {
  status: number;
  data: {
    id: string;
    ref_id: string;
    status: string;
    product_code: string;
    customer_no: string;
    price: number;
    message: string;
    sn?: string;
    balance: number;
    created_at: string;
  };
  message: string;
}

interface TokovoucherStatusResponse {
  status: number;
  data: {
    id: string;
    ref_id: string;
    status: string;
    product_code: string;
    customer_no: string;
    price: number;
    message: string;
    sn?: string;
    created_at: string;
    updated_at: string;
  };
  message: string;
}

interface TokovoucherProductResponse {
  status: number;
  data: Array<{
    code: string;
    name: string;
    category: string;
    brand: string;
    price: number;
    status: string;
    description: string;
    type: string;
  }>;
  message: string;
}

interface TokovoucherBalanceResponse {
  status: number;
  data: {
    balance: number;
    member_code: string;
    name: string;
  };
  message: string;
}

interface TokovoucherWebhookPayload {
  id: string;
  ref_id: string;
  status: string;
  product_code: string;
  customer_no: string;
  price: number;
  message: string;
  sn?: string;
  signature: string;
}

/**
 * Tokovoucher Provider Adapter
 * Digital product provider for game vouchers, pulsa, and utilities.
 *
 * @see https://docs.tokovoucher.id
 */
export class TokovoucherAdapter implements IProviderAdapter {
  readonly name = 'Tokovoucher';
  readonly code = 'tokovoucher';

  private readonly memberCode: string;
  private readonly secret: string;
  private readonly client: AxiosInstance;

  constructor(config: ProviderConfig) {
    this.memberCode = config.username;
    this.secret = config.apiKey;

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.tokovoucher.id',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generate MD5 signature for Tokovoucher
   * Format: MD5(member_code + secret + ref_id)
   */
  private generateSignature(refId: string): string {
    const raw = this.memberCode + this.secret + refId;
    return crypto.createHash('md5').update(raw).digest('hex');
  }

  /**
   * Generate general auth signature (no refId)
   * Format: MD5(member_code + secret)
   */
  private generateAuthSignature(): string {
    const raw = this.memberCode + this.secret;
    return crypto.createHash('md5').update(raw).digest('hex');
  }

  async fetchProducts(): Promise<ProviderProductRaw[]> {
    const signature = this.generateAuthSignature();

    try {
      const response = await this.client.post<TokovoucherProductResponse>(
        '/v1/produk/list',
        {
          member_code: this.memberCode,
          signature,
        }
      );

      if (response.data.status !== 1) {
        throw new BusinessLogicError(`Tokovoucher product fetch failed: ${response.data.message}`);
      }

      return response.data.data.map((product) => ({
        code: product.code,
        name: product.name,
        category: product.category || product.brand,
        price: product.price,
        status: this.mapProductStatus(product.status),
        description: product.description || undefined,
      }));
    } catch (error) {
      if (error instanceof BusinessLogicError) throw error;
      if (axios.isAxiosError(error)) {
        logger.error(
          { error: error.response?.data?.message || error.message },
          'Tokovoucher fetch products failed'
        );
        throw new BusinessLogicError(`Failed to fetch Tokovoucher products: ${error.message}`);
      }
      throw error;
    }
  }

  async createOrder(params: CreateOrderParams): Promise<ProviderOrderResponse> {
    const signature = this.generateSignature(params.refId);

    const payload: Record<string, unknown> = {
      member_code: this.memberCode,
      ref_id: params.refId,
      product_code: params.productCode,
      customer_no: params.customerNumber,
      signature,
    };

    // Add server/zone info for game products
    if (params.customerData?.server) {
      payload.server_id = params.customerData.server;
    }
    if (params.customerData?.zone) {
      payload.zone_id = params.customerData.zone;
    }

    try {
      const response = await this.client.post<TokovoucherOrderResponse>(
        '/v1/transaksi',
        payload
      );

      const data = response.data.data;

      if (response.data.status !== 1) {
        logger.error(
          { refId: params.refId, message: response.data.message },
          'Tokovoucher order rejected'
        );
        return {
          success: false,
          providerRef: data?.id || params.refId,
          status: 'failed',
          message: response.data.message || data?.message,
          rawResponse: response.data,
        };
      }

      const status = this.mapOrderStatus(data.status);

      logger.info(
        { refId: params.refId, providerRef: data.id, status: data.status },
        'Tokovoucher order created'
      );

      return {
        success: status !== 'failed',
        providerRef: data.id,
        status,
        serialNumber: data.sn || undefined,
        message: data.message,
        rawResponse: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        logger.error(
          { refId: params.refId, error: message },
          'Tokovoucher order creation failed'
        );
        throw new BusinessLogicError(`Tokovoucher order failed: ${message}`);
      }
      throw error;
    }
  }

  async checkOrderStatus(refId: string): Promise<ProviderOrderResponse> {
    const signature = this.generateSignature(refId);

    try {
      const response = await this.client.post<TokovoucherStatusResponse>(
        '/v1/transaksi/status',
        {
          member_code: this.memberCode,
          ref_id: refId,
          signature,
        }
      );

      if (response.data.status !== 1) {
        return {
          success: false,
          providerRef: response.data.data?.id || refId,
          status: 'failed',
          message: response.data.message,
          rawResponse: response.data,
        };
      }

      const data = response.data.data;
      const status = this.mapOrderStatus(data.status);

      return {
        success: status === 'success',
        providerRef: data.id,
        status,
        serialNumber: data.sn || undefined,
        message: data.message,
        rawResponse: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(
          { refId, error: error.response?.data?.message || error.message },
          'Tokovoucher status check failed'
        );
        throw new BusinessLogicError(`Tokovoucher status check failed: ${error.message}`);
      }
      throw error;
    }
  }

  async checkBalance(): Promise<ProviderBalance> {
    const signature = this.generateAuthSignature();

    try {
      const response = await this.client.post<TokovoucherBalanceResponse>(
        '/v1/member/saldo',
        {
          member_code: this.memberCode,
          signature,
        }
      );

      if (response.data.status !== 1) {
        throw new BusinessLogicError(`Tokovoucher balance check failed: ${response.data.message}`);
      }

      return {
        balance: response.data.data.balance,
        currency: 'IDR',
      };
    } catch (error) {
      if (error instanceof BusinessLogicError) throw error;
      if (axios.isAxiosError(error)) {
        logger.error(
          { error: error.response?.data?.message || error.message },
          'Tokovoucher balance check failed'
        );
        throw new BusinessLogicError(`Tokovoucher balance check failed: ${error.message}`);
      }
      throw error;
    }
  }

  verifyWebhookSignature(payload: unknown, signature: string): boolean {
    const webhookData = payload as TokovoucherWebhookPayload;

    if (!webhookData.ref_id || !signature) {
      logger.warn('Tokovoucher webhook missing required fields');
      return false;
    }

    // Tokovoucher webhook signature: MD5(member_code + secret + ref_id)
    const expectedSignature = this.generateSignature(webhookData.ref_id);

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

  parseWebhookPayload(payload: unknown): {
    refId: string;
    status: string;
    serialNumber?: string;
    message?: string;
  } {
    const data = payload as TokovoucherWebhookPayload;

    if (!data.ref_id) {
      throw new BusinessLogicError('Invalid Tokovoucher webhook payload');
    }

    const status = this.mapOrderStatus(data.status);

    return {
      refId: data.ref_id,
      status,
      serialNumber: data.sn || undefined,
      message: data.message,
    };
  }

  /**
   * Map Tokovoucher order status to internal status
   */
  private mapOrderStatus(status: string): ProviderOrderResponse['status'] {
    const normalized = status?.toLowerCase() || '';
    switch (normalized) {
      case 'success':
      case 'sukses':
      case 'berhasil':
        return 'success';
      case 'pending':
      case 'process':
      case 'proses':
        return 'processing';
      case 'failed':
      case 'gagal':
      case 'error':
        return 'failed';
      default:
        logger.warn({ status }, 'Unknown Tokovoucher status, treating as processing');
        return 'processing';
    }
  }

  /**
   * Map Tokovoucher product status
   */
  private mapProductStatus(status: string): ProviderProductRaw['status'] {
    const normalized = status?.toLowerCase() || '';
    switch (normalized) {
      case 'available':
      case 'active':
      case 'tersedia':
        return 'available';
      case 'unavailable':
      case 'inactive':
      case 'kosong':
        return 'unavailable';
      case 'maintenance':
      case 'gangguan':
        return 'maintenance';
      default:
        return 'unavailable';
    }
  }
}
