import { logger } from '@/lib/logger';
import { NotFoundError, BusinessLogicError } from '@/lib/errors';
import {
  IProviderAdapter,
  CreateOrderParams,
  ProviderOrderResponse,
  ProviderProductRaw,
  ProviderConfig,
  ProviderBalance,
} from './provider.interface';
import { DigiflazzAdapter } from './digiflazz.adapter';
import { VIPResellerAdapter } from './vipreseller.adapter';
import { TokovoucherAdapter } from './tokovoucher.adapter';
import { CircuitBreaker, circuitBreaker } from './circuit-breaker';
import { ProviderRouter, providerRouter, ProviderProductRecord, ProviderRecord, RoutingResult } from './router';

export * from './provider.interface';
export { DigiflazzAdapter } from './digiflazz.adapter';
export { VIPResellerAdapter } from './vipreseller.adapter';
export { TokovoucherAdapter } from './tokovoucher.adapter';
export { CircuitBreaker, circuitBreaker, CircuitState } from './circuit-breaker';
export { ProviderRouter, providerRouter } from './router';
export type { ProviderProductRecord, ProviderRecord, RoutingResult } from './router';

/** Database provider configuration record */
interface ProviderDbRecord {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  config: Record<string, string>;
  balance?: number;
  balanceThreshold?: number;
}

/** Adapter constructor type */
type AdapterConstructor = new (config: ProviderConfig) => IProviderAdapter;

/** Registry of supported provider adapters */
const ADAPTER_REGISTRY: Record<string, AdapterConstructor> = {
  digiflazz: DigiflazzAdapter,
  vipreseller: VIPResellerAdapter,
  tokovoucher: TokovoucherAdapter,
};

/**
 * Provider Factory
 *
 * Creates and manages provider adapters from database configurations.
 * Provides methods for product syncing, order processing with routing,
 * and adapter lifecycle management.
 */
export class ProviderFactory {
  private readonly adapters: Map<string, IProviderAdapter> = new Map();
  private readonly providers: Map<string, ProviderRecord> = new Map();
  private readonly breaker: CircuitBreaker;
  private readonly router: ProviderRouter;

  constructor(
    breaker: CircuitBreaker = circuitBreaker,
    router: ProviderRouter = providerRouter
  ) {
    this.breaker = breaker;
    this.router = router;
  }

  /**
   * Create a provider config from database record
   */
  private buildConfig(record: ProviderDbRecord): ProviderConfig {
    return {
      baseUrl: record.config.baseUrl || record.config.base_url || '',
      username: record.config.username || record.config.apiId || record.config.memberCode || '',
      apiKey: record.config.apiKey || record.config.api_key || '',
      secret: record.config.secret || record.config.webhookSecret || '',
      sandbox: record.config.sandbox === 'true',
    };
  }

  /**
   * Instantiate an adapter from a database record
   */
  private createAdapterFromRecord(record: ProviderDbRecord): IProviderAdapter {
    const AdapterClass = ADAPTER_REGISTRY[record.code];
    if (!AdapterClass) {
      throw new NotFoundError(`Provider adapter: ${record.code}`);
    }

    const config = this.buildConfig(record);
    return new AdapterClass(config);
  }

  /**
   * Get an adapter by provider code.
   * Returns cached instance if available.
   *
   * @param code - Provider code (e.g., 'digiflazz', 'vipreseller')
   * @param record - Provider database record (required on first access)
   * @returns Provider adapter instance
   */
  getAdapter(code: string, record?: ProviderDbRecord): IProviderAdapter {
    const cached = this.adapters.get(code);
    if (cached) return cached;

    if (!record) {
      throw new NotFoundError(`Provider: ${code}`);
    }

    const adapter = this.createAdapterFromRecord(record);
    this.adapters.set(code, adapter);

    // Also register the provider record
    this.providers.set(record.id, {
      id: record.id,
      code: record.code,
      name: record.name,
      isActive: record.isActive,
      balance: record.balance,
      balanceThreshold: record.balanceThreshold,
    });

    logger.info({ provider: code, name: record.name }, 'Provider adapter instantiated');
    return adapter;
  }

  /**
   * Initialize all active providers from database records
   *
   * @param records - Array of provider records from database
   */
  initializeAll(records: ProviderDbRecord[]): void {
    for (const record of records) {
      if (!record.isActive) continue;

      try {
        const adapter = this.createAdapterFromRecord(record);
        this.adapters.set(record.code, adapter);
        this.providers.set(record.id, {
          id: record.id,
          code: record.code,
          name: record.name,
          isActive: record.isActive,
          balance: record.balance,
          balanceThreshold: record.balanceThreshold,
        });
        logger.info({ provider: record.code, name: record.name }, 'Provider initialized');
      } catch (error) {
        logger.error(
          { provider: record.code, error },
          'Failed to initialize provider'
        );
      }
    }
  }

  /**
   * Sync products from a provider into the local system.
   * Fetches the latest product catalog from the provider.
   *
   * @param providerId - Database ID of the provider
   * @param providerCode - Provider code
   * @returns Array of raw products from the provider
   */
  async syncProducts(providerId: string, providerCode: string): Promise<ProviderProductRaw[]> {
    const adapter = this.adapters.get(providerCode);
    if (!adapter) {
      throw new NotFoundError(`Provider adapter: ${providerCode}`);
    }

    logger.info({ providerId, providerCode }, 'Starting product sync');

    try {
      const products = await adapter.fetchProducts();

      logger.info(
        { providerId, providerCode, productCount: products.length },
        'Product sync completed'
      );

      // Record success for circuit breaker
      await this.breaker.recordSuccess(providerId);

      return products;
    } catch (error) {
      // Record failure for circuit breaker
      await this.breaker.recordFailure(providerId);

      logger.error(
        { providerId, providerCode, error },
        'Product sync failed'
      );
      throw error;
    }
  }

  /**
   * Process an order using the smart routing system.
   * Selects the best provider and creates the order.
   * On failure, attempts fallback providers.
   *
   * @param providerProducts - Available provider_products for the target product
   * @param orderParams - Order creation parameters
   * @param maxRetries - Maximum number of fallback attempts (default: 2)
   * @returns Provider order response
   */
  async processOrder(
    providerProducts: ProviderProductRecord[],
    orderParams: CreateOrderParams,
    maxRetries: number = 2
  ): Promise<ProviderOrderResponse & { providerId: string; providerCode: string }> {
    const excludedProviders: string[] = [];
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // Select provider (first attempt uses router, subsequent use fallbacks)
      let routingResult: RoutingResult | null;

      if (attempt === 0) {
        routingResult = await this.router.selectProvider(
          providerProducts,
          this.providers,
          this.adapters
        );
      } else {
        const fallbacks = await this.router.getFallbackProviders(
          providerProducts,
          this.providers,
          this.adapters,
          excludedProviders
        );
        routingResult = fallbacks.length > 0 ? fallbacks[0] : null;
      }

      if (!routingResult) {
        logger.warn(
          { attempt, excludedCount: excludedProviders.length, refId: orderParams.refId },
          'No available provider found'
        );
        break;
      }

      const { providerProduct, provider, adapter } = routingResult;

      try {
        logger.info(
          {
            attempt,
            providerId: provider.id,
            providerCode: provider.code,
            refId: orderParams.refId,
          },
          'Attempting order with provider'
        );

        const response = await adapter.createOrder(orderParams);

        if (response.success || response.status === 'processing' || response.status === 'success') {
          // Record success
          await this.breaker.recordSuccess(provider.id);

          return {
            ...response,
            providerId: provider.id,
            providerCode: provider.code,
          };
        }

        // Order was rejected by provider (not a network error)
        logger.warn(
          {
            providerId: provider.id,
            providerCode: provider.code,
            status: response.status,
            message: response.message,
            refId: orderParams.refId,
          },
          'Provider rejected order'
        );

        // Record failure and exclude from next attempt
        await this.breaker.recordFailure(provider.id);
        excludedProviders.push(provider.id);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        logger.error(
          {
            attempt,
            providerId: provider.id,
            providerCode: provider.code,
            refId: orderParams.refId,
            error: lastError.message,
          },
          'Provider order attempt failed'
        );

        // Record failure and exclude from next attempt
        await this.breaker.recordFailure(provider.id);
        excludedProviders.push(provider.id);
      }
    }

    // All attempts exhausted
    const errorMessage = lastError?.message || 'No available provider';
    throw new BusinessLogicError(
      `Order processing failed after ${maxRetries + 1} attempts: ${errorMessage}`,
      'PROVIDER_UNAVAILABLE'
    );
  }

  /**
   * Check the balance of a specific provider
   *
   * @param providerCode - Provider code
   * @returns Balance information
   */
  async checkBalance(providerCode: string): Promise<ProviderBalance> {
    const adapter = this.adapters.get(providerCode);
    if (!adapter) {
      throw new NotFoundError(`Provider: ${providerCode}`);
    }

    return adapter.checkBalance();
  }

  /**
   * Check if a provider code is supported
   */
  static isSupported(code: string): boolean {
    return code in ADAPTER_REGISTRY;
  }

  /**
   * Get list of all supported provider codes
   */
  static getSupportedProviders(): string[] {
    return Object.keys(ADAPTER_REGISTRY);
  }

  /**
   * Get all initialized adapters
   */
  getAllAdapters(): Map<string, IProviderAdapter> {
    return this.adapters;
  }

  /**
   * Remove a cached adapter (e.g., when config changes)
   */
  invalidateAdapter(code: string): void {
    this.adapters.delete(code);
    logger.info({ provider: code }, 'Provider adapter cache invalidated');
  }
}
