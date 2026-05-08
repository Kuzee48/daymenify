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

interface VIPResellerOrderResponse {
  result: boolean;
  data: {
    trxid: string;
    ref_id: string;
    destination: string;
    product_code: string;
    message: string;
    status: string;
    sn?: string;
    price: number;
    balance: number;
  };
  message?: string;
}

interface VIPResellerStatusResponse {
  result: boolean;
  data: {
    trxid: string;
    ref_id: string;
    destination: string;
    product_code: string;
    message: string;
    status: string;
    sn?: string;
    price: number;
  };
  message?: string;
}

interface VIPResellerProductResponse {
  result: boolean;
  data: Array<{
    product_code: string;
    product_name: string;
    category: string;
    brand: string;
    price: number;
    product_status: string;
    desc: string;
    type: string;
  }>;
}

interface VIPResellerBalanceResponse {
  result: boolean;
  data: {
    balance: number;
    name: string;
  };
}

interface VIPResellerWebhookPayload {
  trxid: string;
  ref_id: string;
  destination: string;
  product_code: string;
  message: string;
  status: string;
  sn?: string;
  price: number;
  signature: string;
}

/**
 * VIP-Reseller Provider Adapter
 * Provider for game vouchers, prepaid products, and digital services.
 *
 * @see https://vip-reseller.co.id/api
 */
export class VIPResellerAdapter implements IProviderAdapter {
  readonly name = 'VIP-Reseller';
  readonly code = 'vipreseller';

  private readonly apiId: string;
  private readonly apiKey: string;
  private readonly client: AxiosInstance;

  constructor(config: ProviderConfig) {
    this.apiId = config.username;
    this.apiKey = config.apiKey;

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://vip-reseller.co.id/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generate MD5 signature for VIP-Reseller
   * Format: MD5(apiId + apiKey + refId)
   */
  private generateSignature(refId: string): string {
    const raw = this.apiId + this.apiKey + refId;
    return crypto.createHash('md5').update(raw).digest('hex');
  }

  /**
   * Generate general auth signature
   * Format: MD5(apiId + apiKey)
   */
  private generateAuthSignature(): string {
    const raw = this.apiId + this.apiKey;
    return crypto.createHash('md5').update(raw).digest('hex');
  }

  async fetchProducts(): Promise<ProviderProductRaw[]> {
    const sign = this.generateAuthSignature();

    try {
      // Fetch prepaid products
      const prepaidResponse = await this.client.post<VIPResellerProductResponse>(
        '/prepaid',
        {
          key: this.apiKey,
          sign,
          type: 'services',
        }
      );

      // Fetch game products
      const gameResponse = await this.client.post<VIPResellerProductResponse>(
        '/game-feature',
        {
          key: this.apiKey,
          sign,
          type: 'services',
        }
      );

      const allProducts: ProviderProductRaw[] = [];

      if (prepaidResponse.data.result && prepaidResponse.data.data) {
        const mapped = prepaidResponse.data.data.map((p) => ({
          code: p.product_code,
          name: p.product_name,
          category: p.category || p.brand,
          price: p.price,
          status: this.mapProductStatus(p.product_status),
          description: p.desc || undefined,
        }));
        allProducts.push(...mapped);
      }

      if (gameResponse.data.result && gameResponse.data.data) {
        const mapped = gameResponse.data.data.map((p) => ({
          code: p.product_code,
          name: p.product_name,
          category: p.category || 'Game',
          price: p.price,
          status: this.mapProductStatus(p.product_status),
          description: p.desc || undefined,
        }));
        allProducts.push(...mapped);
      }

      logger.info(
        { totalProducts: allProducts.length },
        'VIP-Reseller products fetched'
      );

      return allProducts;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(
          { error: error.response?.data?.message || error.message },
          'VIP-Reseller fetch products failed'
        );
        throw new BusinessLogicError(`Failed to fetch VIP-Reseller products: ${error.message}`);
      }
      throw error;
    }
  }

  async createOrder(params: CreateOrderParams): Promise<ProviderOrderResponse> {
    const sign = this.generateSignature(params.refId);

    const payload: Record<string, unknown> = {
      key: this.apiKey,
      sign,
      type: 'order',
      service: params.productCode,
      data_no: params.customerNumber,
      ref_id: params.refId,
    };

    // Add additional customer data (e.g., server ID for games)
    if (params.customerData) {
      if (params.customerData.server) {
        payload.data_zone = params.customerData.server;
      }
      if (params.customerData.zone) {
        payload.data_zone = params.customerData.zone;
      }
    }

    try {
      const response = await this.client.post<VIPResellerOrderResponse>(
        '/game-feature',
        payload
      );

      const data = response.data.data;

      if (!response.data.result) {
        logger.error(
          { refId: params.refId, message: response.data.message },
          'VIP-Reseller order rejected'
        );
        return {
          success: false,
          providerRef: data?.trxid || params.refId,
          status: 'failed',
          message: response.data.message || data?.message,
          rawResponse: response.data,
        };
      }

      const status = this.mapOrderStatus(data.status);

      logger.info(
        { refId: params.refId, providerRef: data.trxid, status: data.status },
        'VIP-Reseller order created'
      );

      return {
        success: status !== 'failed',
        providerRef: data.trxid,
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
          'VIP-Reseller order failed'
        );
        throw new BusinessLogicError(`VIP-Reseller order failed: ${message}`);
      }
      throw error;
    }
  }

  async checkOrderStatus(refId: string): Promise<ProviderOrderResponse> {
    const sign = this.generateSignature(refId);

    try {
      const response = await this.client.post<VIPResellerStatusResponse>(
        '/game-feature',
        {
          key: this.apiKey,
          sign,
          type: 'status',
          ref_id: refId,
        }
      );

      const data = response.data.data;

      if (!response.data.result) {
        return {
          success: false,
          providerRef: data?.trxid || refId,
          status: 'failed',
          message: response.data.message || 'Status check failed',
          rawResponse: response.data,
        };
      }

      const status = this.mapOrderStatus(data.status);

      return {
        success: status === 'success',
        providerRef: data.trxid,
        status,
        serialNumber: data.sn || undefined,
        message: data.message,
        rawResponse: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(
          { refId, error: error.response?.data?.message || error.message },
          'VIP-Reseller status check failed'
        );
        throw new BusinessLogicError(`VIP-Reseller status check failed: ${error.message}`);
      }
      throw error;
    }
  }

  async checkBalance(): Promise<ProviderBalance> {
    const sign = this.generateAuthSignature();

    try {
      const response = await this.client.post<VIPResellerBalanceResponse>(
        '/profile',
        {
          key: this.apiKey,
          sign,
          type: 'profile',
        }
      );

      if (!response.data.result) {
        throw new BusinessLogicError('VIP-Reseller balance check failed');
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
          'VIP-Reseller balance check failed'
        );
        throw new BusinessLogicError(`VIP-Reseller balance check failed: ${error.message}`);
      }
      throw error;
    }
  }

  verifyWebhookSignature(payload: unknown, signature: string): boolean {
    const webhookData = payload as VIPResellerWebhookPayload;

    if (!webhookData.trxid || !signature) {
      logger.warn('VIP-Reseller webhook missing required fields');
      return false;
    }

    // VIP-Reseller uses MD5(apiId + apiKey + ref_id) as webhook signature
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
    const data = payload as VIPResellerWebhookPayload;

    if (!data.ref_id) {
      throw new BusinessLogicError('Invalid VIP-Reseller webhook payload');
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
   * Map VIP-Reseller order status to internal status
   */
  private mapOrderStatus(status: string): ProviderOrderResponse['status'] {
    const normalized = status?.toLowerCase() || '';
    switch (normalized) {
      case 'success':
      case 'sukses':
      case 'completed':
        return 'success';
      case 'pending':
      case 'process':
      case 'processing':
        return 'processing';
      case 'failed':
      case 'gagal':
      case 'error':
        return 'failed';
      default:
        logger.warn({ status }, 'Unknown VIP-Reseller status, treating as processing');
        return 'processing';
    }
  }

  /**
   * Map VIP-Reseller product status
   */
  private mapProductStatus(status: string): ProviderProductRaw['status'] {
    const normalized = status?.toLowerCase() || '';
    switch (normalized) {
      case 'available':
      case 'active':
      case 'normal':
        return 'available';
      case 'unavailable':
      case 'inactive':
      case 'empty':
        return 'unavailable';
      case 'maintenance':
      case 'gangguan':
        return 'maintenance';
      default:
        return 'unavailable';
    }
  }
}
