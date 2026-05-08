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

interface DigiflazzTransactionResponse {
  data: {
    ref_id: string;
    customer_no: string;
    buyer_sku_code: string;
    message: string;
    status: string;
    rc: string;
    sn?: string;
    buyer_last_saldo: number;
    price: number;
    tele?: string;
    wa?: string;
  };
}

interface DigiflazzPriceListResponse {
  data: Array<{
    product_name: string;
    category: string;
    brand: string;
    type: string;
    seller_name: string;
    price: number;
    buyer_sku_code: string;
    buyer_product_status: boolean;
    seller_product_status: boolean;
    unlimited_stock: boolean;
    stock: number;
    multi: boolean;
    start_cut_off: string;
    end_cut_off: string;
    desc: string;
  }>;
}

interface DigiflazzBalanceResponse {
  data: {
    deposit: number;
  };
}

interface DigiflazzWebhookPayload {
  data: {
    ref_id: string;
    customer_no: string;
    buyer_sku_code: string;
    message: string;
    status: string;
    rc: string;
    sn?: string;
    buyer_last_saldo: number;
    price: number;
  };
  hook: string;
  secret: string;
}

/**
 * Digiflazz Provider Adapter
 * Digital product provider for pulsa, data, games, and more.
 *
 * @see https://developer.digiflazz.com/api
 */
export class DigiflazzAdapter implements IProviderAdapter {
  readonly name = 'Digiflazz';
  readonly code = 'digiflazz';

  private readonly username: string;
  private readonly apiKey: string;
  private readonly webhookSecret: string;
  private readonly client: AxiosInstance;

  constructor(config: ProviderConfig) {
    this.username = config.username;
    this.apiKey = config.apiKey;
    this.webhookSecret = config.secret || config.apiKey;

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.digiflazz.com',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generate MD5 signature for Digiflazz API
   * Format: MD5(username + apiKey + refId)
   */
  private generateSignature(refId: string): string {
    const raw = this.username + this.apiKey + refId;
    return crypto.createHash('md5').update(raw).digest('hex');
  }

  /**
   * Generate MD5 signature for deposit check
   * Format: MD5(username + apiKey + 'depo')
   */
  private generateDepositSignature(): string {
    const raw = this.username + this.apiKey + 'depo';
    return crypto.createHash('md5').update(raw).digest('hex');
  }

  /**
   * Generate MD5 signature for price list
   * Format: MD5(username + apiKey + 'pricelist')
   */
  private generatePriceListSignature(): string {
    const raw = this.username + this.apiKey + 'pricelist';
    return crypto.createHash('md5').update(raw).digest('hex');
  }

  async fetchProducts(): Promise<ProviderProductRaw[]> {
    const sign = this.generatePriceListSignature();

    try {
      const response = await this.client.post<DigiflazzPriceListResponse>(
        '/v1/price-list',
        {
          cmd: 'prepaid',
          username: this.username,
          sign,
        }
      );

      return response.data.data.map((product) => ({
        code: product.buyer_sku_code,
        name: product.product_name,
        category: product.category,
        price: product.price,
        status: this.mapProductStatus(product.buyer_product_status, product.seller_product_status),
        description: product.desc || undefined,
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(
          { error: error.response?.data || error.message },
          'Digiflazz fetch products failed'
        );
        throw new BusinessLogicError(`Failed to fetch Digiflazz products: ${error.message}`);
      }
      throw error;
    }
  }

  async createOrder(params: CreateOrderParams): Promise<ProviderOrderResponse> {
    const sign = this.generateSignature(params.refId);

    const payload: Record<string, unknown> = {
      username: this.username,
      buyer_sku_code: params.productCode,
      customer_no: params.customerNumber,
      ref_id: params.refId,
      sign,
    };

    // Some products need additional testing flag
    if (params.customerData?.testing) {
      payload.testing = true;
    }

    try {
      const response = await this.client.post<DigiflazzTransactionResponse>(
        '/v1/transaction',
        payload
      );

      const data = response.data.data;
      const status = this.mapOrderStatus(data.status);

      logger.info(
        {
          refId: params.refId,
          providerRef: data.ref_id,
          status: data.status,
          mappedStatus: status,
          rc: data.rc,
        },
        'Digiflazz order created'
      );

      return {
        success: status !== 'failed',
        providerRef: data.ref_id,
        status,
        serialNumber: data.sn || undefined,
        message: data.message,
        rawResponse: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data;
        const message = responseData?.data?.message || error.message;
        const rc = responseData?.data?.rc;

        logger.error(
          { refId: params.refId, error: message, rc },
          'Digiflazz order creation failed'
        );

        // Return failed response rather than throwing for provider errors
        if (responseData?.data) {
          return {
            success: false,
            providerRef: responseData.data.ref_id || params.refId,
            status: 'failed',
            message,
            rawResponse: responseData,
          };
        }

        throw new BusinessLogicError(`Digiflazz order failed: ${message}`);
      }
      throw error;
    }
  }

  async checkOrderStatus(refId: string): Promise<ProviderOrderResponse> {
    const sign = this.generateSignature(refId);

    try {
      const response = await this.client.post<DigiflazzTransactionResponse>(
        '/v1/transaction',
        {
          username: this.username,
          buyer_sku_code: '', // Empty for status check
          customer_no: '',
          ref_id: refId,
          sign,
          cmd: 'status',
        }
      );

      const data = response.data.data;
      const status = this.mapOrderStatus(data.status);

      return {
        success: status === 'success',
        providerRef: data.ref_id,
        status,
        serialNumber: data.sn || undefined,
        message: data.message,
        rawResponse: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(
          { refId, error: error.response?.data?.data?.message || error.message },
          'Digiflazz status check failed'
        );
        throw new BusinessLogicError(`Digiflazz status check failed: ${error.message}`);
      }
      throw error;
    }
  }

  async checkBalance(): Promise<ProviderBalance> {
    const sign = this.generateDepositSignature();

    try {
      const response = await this.client.post<DigiflazzBalanceResponse>(
        '/v1/cek-saldo',
        {
          cmd: 'deposit',
          username: this.username,
          sign,
        }
      );

      return {
        balance: response.data.data.deposit,
        currency: 'IDR',
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(
          { error: error.response?.data || error.message },
          'Digiflazz balance check failed'
        );
        throw new BusinessLogicError(`Digiflazz balance check failed: ${error.message}`);
      }
      throw error;
    }
  }

  verifyWebhookSignature(payload: unknown, signature: string): boolean {
    // Digiflazz sends a 'secret' field in the webhook payload
    // that matches the webhook secret configured in their dashboard
    const webhookData = payload as DigiflazzWebhookPayload;

    if (!webhookData.secret) {
      logger.warn('Digiflazz webhook missing secret field');
      return false;
    }

    try {
      const secretBuffer = Buffer.from(webhookData.secret, 'utf-8');
      const expectedBuffer = Buffer.from(this.webhookSecret, 'utf-8');

      if (secretBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(secretBuffer, expectedBuffer);
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
    const webhookData = payload as DigiflazzWebhookPayload;
    const data = webhookData.data;

    if (!data || !data.ref_id) {
      throw new BusinessLogicError('Invalid Digiflazz webhook payload');
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
   * Map Digiflazz order status to internal status
   */
  private mapOrderStatus(status: string): ProviderOrderResponse['status'] {
    const normalized = status.toLowerCase();
    switch (normalized) {
      case 'sukses':
        return 'success';
      case 'pending':
        return 'processing';
      case 'gagal':
        return 'failed';
      default:
        logger.warn({ status }, 'Unknown Digiflazz status, treating as processing');
        return 'processing';
    }
  }

  /**
   * Map product availability from Digiflazz
   */
  private mapProductStatus(
    buyerStatus: boolean,
    sellerStatus: boolean
  ): ProviderProductRaw['status'] {
    if (!buyerStatus || !sellerStatus) return 'unavailable';
    return 'available';
  }
}
