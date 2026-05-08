import { logger } from '@/lib/logger';
import { CircuitBreaker, circuitBreaker, CircuitState } from './circuit-breaker';
import { IProviderAdapter, ProviderBalance } from './provider.interface';

/** Provider product record from the database */
export interface ProviderProductRecord {
  id: string;
  providerId: string;
  providerCode: string;
  productId: string;
  providerProductCode: string;
  providerPrice: number;
  priority: number;
  isActive: boolean;
}

/** Provider record from the database */
export interface ProviderRecord {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  balance?: number;
  balanceThreshold?: number;
}

/** Result from the routing algorithm */
export interface RoutingResult {
  providerProduct: ProviderProductRecord;
  provider: ProviderRecord;
  adapter: IProviderAdapter;
}

/** Balance cache entry */
interface BalanceCacheEntry {
  balance: number;
  cachedAt: number;
}

/**
 * Smart Provider Router
 *
 * Selects the best provider for a given product based on:
 * 1. Provider health (circuit breaker state)
 * 2. Available balance
 * 3. Priority ordering
 * 4. Price optimization
 *
 * Algorithm:
 * 1. Get all active provider_products for the product
 * 2. Filter by health status (exclude OPEN circuit breakers)
 * 3. Filter by sufficient balance
 * 4. Sort by: priority DESC, then providerPrice ASC
 * 5. Return best candidate or null
 */
export class ProviderRouter {
  private readonly breaker: CircuitBreaker;
  private readonly balanceCache: Map<string, BalanceCacheEntry> = new Map();
  private readonly balanceCacheTTL: number; // in milliseconds

  constructor(
    breaker: CircuitBreaker = circuitBreaker,
    balanceCacheTTL: number = 60000 // 1 minute default
  ) {
    this.breaker = breaker;
    this.balanceCacheTTL = balanceCacheTTL;
  }

  /**
   * Select the best provider for a product.
   *
   * @param providerProducts - All provider_products for the target product
   * @param providers - Map of provider ID to provider record
   * @param adapters - Map of provider code to adapter instance
   * @returns Best routing result or null if no provider available
   */
  async selectProvider(
    providerProducts: ProviderProductRecord[],
    providers: Map<string, ProviderRecord>,
    adapters: Map<string, IProviderAdapter>
  ): Promise<RoutingResult | null> {
    // Step 1: Filter only active provider products
    const activeProducts = providerProducts.filter((pp) => pp.isActive);

    if (activeProducts.length === 0) {
      logger.warn('No active provider products available');
      return null;
    }

    // Step 2: Filter by circuit breaker health status
    const healthyProducts: ProviderProductRecord[] = [];

    for (const pp of activeProducts) {
      const provider = providers.get(pp.providerId);
      if (!provider || !provider.isActive) continue;

      const isAvailable = await this.breaker.isAvailable(pp.providerId);
      if (isAvailable) {
        healthyProducts.push(pp);
      } else {
        logger.debug(
          { providerId: pp.providerId, providerCode: pp.providerCode },
          'Provider excluded: circuit breaker OPEN'
        );
      }
    }

    if (healthyProducts.length === 0) {
      logger.warn('All providers have open circuit breakers');
      return null;
    }

    // Step 3: Filter by sufficient balance
    const fundedProducts: ProviderProductRecord[] = [];

    for (const pp of healthyProducts) {
      const provider = providers.get(pp.providerId);
      if (!provider) continue;

      const hasSufficientBalance = await this.checkBalance(
        pp.providerId,
        pp.providerCode,
        pp.providerPrice,
        provider,
        adapters.get(pp.providerCode)
      );

      if (hasSufficientBalance) {
        fundedProducts.push(pp);
      } else {
        logger.debug(
          { providerId: pp.providerId, providerCode: pp.providerCode, price: pp.providerPrice },
          'Provider excluded: insufficient balance'
        );
      }
    }

    if (fundedProducts.length === 0) {
      logger.warn('All healthy providers have insufficient balance');
      return null;
    }

    // Step 4: Sort by priority DESC, then providerPrice ASC
    fundedProducts.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.providerPrice - b.providerPrice; // Lower price first
    });

    // Step 5: Return best candidate
    const best = fundedProducts[0];
    const provider = providers.get(best.providerId);
    const adapter = adapters.get(best.providerCode);

    if (!provider || !adapter) {
      logger.error(
        { providerId: best.providerId, providerCode: best.providerCode },
        'Provider or adapter not found for best candidate'
      );
      return null;
    }

    logger.info(
      {
        providerId: best.providerId,
        providerCode: best.providerCode,
        priority: best.priority,
        price: best.providerPrice,
        candidateCount: fundedProducts.length,
      },
      'Provider selected by router'
    );

    return {
      providerProduct: best,
      provider,
      adapter,
    };
  }

  /**
   * Get fallback providers for a product, excluding specific provider IDs.
   * Used when the primary provider fails and we need to retry with alternatives.
   *
   * @param providerProducts - All provider_products for the target product
   * @param providers - Map of provider ID to provider record
   * @param adapters - Map of provider code to adapter instance
   * @param excludeIds - Provider IDs to exclude (already tried)
   * @returns Array of fallback routing results, ordered by priority
   */
  async getFallbackProviders(
    providerProducts: ProviderProductRecord[],
    providers: Map<string, ProviderRecord>,
    adapters: Map<string, IProviderAdapter>,
    excludeIds: string[]
  ): Promise<RoutingResult[]> {
    const excludeSet = new Set(excludeIds);

    // Filter out excluded and inactive
    const candidates = providerProducts.filter(
      (pp) => pp.isActive && !excludeSet.has(pp.providerId)
    );

    const results: RoutingResult[] = [];

    for (const pp of candidates) {
      const provider = providers.get(pp.providerId);
      if (!provider || !provider.isActive) continue;

      const adapter = adapters.get(pp.providerCode);
      if (!adapter) continue;

      // Check circuit breaker
      const isAvailable = await this.breaker.isAvailable(pp.providerId);
      if (!isAvailable) continue;

      // Check balance
      const hasSufficientBalance = await this.checkBalance(
        pp.providerId,
        pp.providerCode,
        pp.providerPrice,
        provider,
        adapter
      );
      if (!hasSufficientBalance) continue;

      results.push({
        providerProduct: pp,
        provider,
        adapter,
      });
    }

    // Sort by priority DESC, then price ASC
    results.sort((a, b) => {
      if (b.providerProduct.priority !== a.providerProduct.priority) {
        return b.providerProduct.priority - a.providerProduct.priority;
      }
      return a.providerProduct.providerPrice - b.providerProduct.providerPrice;
    });

    logger.info(
      { fallbackCount: results.length, excludedCount: excludeIds.length },
      'Fallback providers resolved'
    );

    return results;
  }

  /**
   * Check if a provider has sufficient balance for a transaction.
   * Uses a short-lived cache to avoid excessive API calls.
   */
  private async checkBalance(
    providerId: string,
    providerCode: string,
    requiredAmount: number,
    provider: ProviderRecord,
    adapter?: IProviderAdapter
  ): Promise<boolean> {
    // If provider has a known balance from database, use that first
    if (provider.balance !== undefined) {
      const threshold = provider.balanceThreshold || 0;
      return provider.balance - threshold >= requiredAmount;
    }

    // Check balance cache
    const cached = this.balanceCache.get(providerId);
    if (cached && Date.now() - cached.cachedAt < this.balanceCacheTTL) {
      return cached.balance >= requiredAmount;
    }

    // Fetch fresh balance if adapter is available
    if (adapter) {
      try {
        const balanceInfo = await adapter.checkBalance();
        this.balanceCache.set(providerId, {
          balance: balanceInfo.balance,
          cachedAt: Date.now(),
        });
        return balanceInfo.balance >= requiredAmount;
      } catch (error) {
        logger.warn(
          { providerId, providerCode, error },
          'Failed to check provider balance, assuming sufficient'
        );
        // On error, assume balance is sufficient to not block orders
        return true;
      }
    }

    // No way to check balance, assume sufficient
    return true;
  }

  /**
   * Update the cached balance for a provider (e.g., after a successful order)
   */
  updateBalanceCache(providerId: string, newBalance: number): void {
    this.balanceCache.set(providerId, {
      balance: newBalance,
      cachedAt: Date.now(),
    });
  }

  /**
   * Invalidate the balance cache for a provider
   */
  invalidateBalanceCache(providerId: string): void {
    this.balanceCache.delete(providerId);
  }

  /**
   * Get routing health information for all providers
   */
  async getRoutingHealth(
    providerIds: string[]
  ): Promise<Map<string, { state: CircuitState; failureCount: number; isAvailable: boolean }>> {
    const health = new Map<string, { state: CircuitState; failureCount: number; isAvailable: boolean }>();

    for (const providerId of providerIds) {
      const info = await this.breaker.getHealthInfo(providerId);
      health.set(providerId, {
        state: info.state,
        failureCount: info.failureCount,
        isAvailable: info.isAvailable,
      });
    }

    return health;
  }
}

/** Singleton instance of the provider router */
export const providerRouter = new ProviderRouter();
