import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

/**
 * Circuit Breaker States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit is broken, requests are rejected immediately
 * - HALF_OPEN: Testing phase, limited requests allowed to check recovery
 */
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/** Configuration for the circuit breaker */
export interface CircuitBreakerConfig {
  /** Number of failures before opening the circuit (default: 5) */
  failureThreshold: number;
  /** Time in seconds before attempting recovery (default: 60) */
  recoveryTimeout: number;
  /** Time window in seconds to track failures (default: 120) */
  monitorWindow: number;
  /** Number of successful requests needed to close from HALF_OPEN (default: 2) */
  successThreshold: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeout: 60,
  monitorWindow: 120,
  successThreshold: 2,
};

/** Redis key prefix for circuit breaker data */
const KEY_PREFIX = 'circuit_breaker';

/**
 * Redis-backed Circuit Breaker for provider health management.
 *
 * Uses Redis sorted sets to track failures within a sliding time window,
 * enabling horizontal scaling across multiple server instances.
 *
 * State transitions:
 * - CLOSED → OPEN: When failure count exceeds threshold within monitor window
 * - OPEN → HALF_OPEN: When recovery timeout has elapsed
 * - HALF_OPEN → CLOSED: When success threshold is met
 * - HALF_OPEN → OPEN: When a failure occurs during half-open state
 */
export class CircuitBreaker {
  private readonly config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get the Redis key for tracking failures (sorted set)
   */
  private getFailureKey(providerId: string): string {
    return `${KEY_PREFIX}:failures:${providerId}`;
  }

  /**
   * Get the Redis key for circuit state
   */
  private getStateKey(providerId: string): string {
    return `${KEY_PREFIX}:state:${providerId}`;
  }

  /**
   * Get the Redis key for tracking open timestamp
   */
  private getOpenTimeKey(providerId: string): string {
    return `${KEY_PREFIX}:open_at:${providerId}`;
  }

  /**
   * Get the Redis key for tracking half-open successes
   */
  private getHalfOpenSuccessKey(providerId: string): string {
    return `${KEY_PREFIX}:half_open_success:${providerId}`;
  }

  /**
   * Record a successful operation for a provider.
   * In HALF_OPEN state, may transition to CLOSED if success threshold is met.
   *
   * @param providerId - Unique identifier for the provider
   */
  async recordSuccess(providerId: string): Promise<void> {
    const currentState = await this.getState(providerId);

    if (currentState === CircuitState.HALF_OPEN) {
      const halfOpenKey = this.getHalfOpenSuccessKey(providerId);
      const successCount = await redis.incr(halfOpenKey);
      await redis.expire(halfOpenKey, this.config.recoveryTimeout);

      if (successCount >= this.config.successThreshold) {
        // Transition to CLOSED
        await this.transitionTo(providerId, CircuitState.CLOSED);
        logger.info(
          { providerId, successCount, threshold: this.config.successThreshold },
          'Circuit breaker closed after successful recovery'
        );
      }
    }
  }

  /**
   * Record a failed operation for a provider.
   * May transition to OPEN if failure threshold is exceeded.
   * In HALF_OPEN state, immediately transitions back to OPEN.
   *
   * @param providerId - Unique identifier for the provider
   */
  async recordFailure(providerId: string): Promise<void> {
    const currentState = await this.getState(providerId);

    if (currentState === CircuitState.HALF_OPEN) {
      // In HALF_OPEN, any failure immediately opens the circuit
      await this.transitionTo(providerId, CircuitState.OPEN);
      logger.warn(
        { providerId },
        'Circuit breaker re-opened from HALF_OPEN state'
      );
      return;
    }

    // Record failure in sorted set with current timestamp as score
    const now = Date.now();
    const failureKey = this.getFailureKey(providerId);
    const windowStart = now - this.config.monitorWindow * 1000;

    // Add failure timestamp and remove old entries outside window
    const pipeline = redis.pipeline();
    pipeline.zadd(failureKey, now, `${now}:${Math.random()}`);
    pipeline.zremrangebyscore(failureKey, 0, windowStart);
    pipeline.zcard(failureKey);
    pipeline.expire(failureKey, this.config.monitorWindow * 2);
    const results = await pipeline.exec();

    // Get the count from zcard result
    const failureCount = results?.[2]?.[1] as number || 0;

    if (failureCount >= this.config.failureThreshold) {
      await this.transitionTo(providerId, CircuitState.OPEN);
      logger.warn(
        { providerId, failureCount, threshold: this.config.failureThreshold },
        'Circuit breaker opened due to excessive failures'
      );
    }
  }

  /**
   * Get the current state of the circuit breaker for a provider.
   * Handles the automatic OPEN → HALF_OPEN transition based on recovery timeout.
   *
   * @param providerId - Unique identifier for the provider
   * @returns Current circuit state
   */
  async getState(providerId: string): Promise<CircuitState> {
    const stateKey = this.getStateKey(providerId);
    const storedState = await redis.get(stateKey);

    if (!storedState || storedState === CircuitState.CLOSED) {
      return CircuitState.CLOSED;
    }

    if (storedState === CircuitState.OPEN) {
      // Check if recovery timeout has elapsed
      const openTimeKey = this.getOpenTimeKey(providerId);
      const openAt = await redis.get(openTimeKey);

      if (openAt) {
        const elapsed = Date.now() - parseInt(openAt, 10);
        if (elapsed >= this.config.recoveryTimeout * 1000) {
          // Transition to HALF_OPEN
          await this.transitionTo(providerId, CircuitState.HALF_OPEN);
          return CircuitState.HALF_OPEN;
        }
      }

      return CircuitState.OPEN;
    }

    if (storedState === CircuitState.HALF_OPEN) {
      return CircuitState.HALF_OPEN;
    }

    return CircuitState.CLOSED;
  }

  /**
   * Check if a provider is available (circuit is not OPEN).
   * HALF_OPEN is considered available for testing purposes.
   *
   * @param providerId - Unique identifier for the provider
   * @returns Whether the provider is available for requests
   */
  async isAvailable(providerId: string): Promise<boolean> {
    const state = await this.getState(providerId);
    return state !== CircuitState.OPEN;
  }

  /**
   * Force reset the circuit breaker to CLOSED state.
   * Use when a provider is known to have recovered (e.g., manual intervention).
   *
   * @param providerId - Unique identifier for the provider
   */
  async reset(providerId: string): Promise<void> {
    await this.transitionTo(providerId, CircuitState.CLOSED);
    logger.info({ providerId }, 'Circuit breaker manually reset to CLOSED');
  }

  /**
   * Get the failure count within the current monitoring window.
   *
   * @param providerId - Unique identifier for the provider
   * @returns Number of failures in the current window
   */
  async getFailureCount(providerId: string): Promise<number> {
    const failureKey = this.getFailureKey(providerId);
    const windowStart = Date.now() - this.config.monitorWindow * 1000;

    // Remove expired entries and count remaining
    await redis.zremrangebyscore(failureKey, 0, windowStart);
    return redis.zcard(failureKey);
  }

  /**
   * Get detailed health information for a provider.
   *
   * @param providerId - Unique identifier for the provider
   * @returns Health status details
   */
  async getHealthInfo(providerId: string): Promise<{
    state: CircuitState;
    failureCount: number;
    isAvailable: boolean;
    openedAt?: number;
    recoversAt?: number;
  }> {
    const state = await this.getState(providerId);
    const failureCount = await this.getFailureCount(providerId);
    const available = state !== CircuitState.OPEN;

    let openedAt: number | undefined;
    let recoversAt: number | undefined;

    if (state === CircuitState.OPEN) {
      const openTimeKey = this.getOpenTimeKey(providerId);
      const openAtStr = await redis.get(openTimeKey);
      if (openAtStr) {
        openedAt = parseInt(openAtStr, 10);
        recoversAt = openedAt + this.config.recoveryTimeout * 1000;
      }
    }

    return {
      state,
      failureCount,
      isAvailable: available,
      openedAt,
      recoversAt,
    };
  }

  /**
   * Transition the circuit breaker to a new state
   */
  private async transitionTo(providerId: string, newState: CircuitState): Promise<void> {
    const stateKey = this.getStateKey(providerId);
    const pipeline = redis.pipeline();

    switch (newState) {
      case CircuitState.OPEN: {
        pipeline.set(stateKey, CircuitState.OPEN);
        pipeline.set(this.getOpenTimeKey(providerId), String(Date.now()));
        // Set expiry on state key so it auto-cleans if not checked
        pipeline.expire(stateKey, this.config.recoveryTimeout * 3);
        pipeline.expire(this.getOpenTimeKey(providerId), this.config.recoveryTimeout * 3);
        // Clean up half-open success counter
        pipeline.del(this.getHalfOpenSuccessKey(providerId));
        break;
      }
      case CircuitState.HALF_OPEN: {
        pipeline.set(stateKey, CircuitState.HALF_OPEN);
        pipeline.expire(stateKey, this.config.recoveryTimeout * 2);
        // Reset half-open success counter
        pipeline.del(this.getHalfOpenSuccessKey(providerId));
        break;
      }
      case CircuitState.CLOSED: {
        // Clean up all circuit breaker state
        pipeline.del(stateKey);
        pipeline.del(this.getOpenTimeKey(providerId));
        pipeline.del(this.getHalfOpenSuccessKey(providerId));
        pipeline.del(this.getFailureKey(providerId));
        break;
      }
    }

    await pipeline.exec();
  }
}

/** Singleton instance with default configuration */
export const circuitBreaker = new CircuitBreaker();
