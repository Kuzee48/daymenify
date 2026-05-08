import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Markup Rule Definition
 */
export interface MarkupRule {
  id: string;
  /** Type of markup calculation */
  type: 'PERCENTAGE' | 'FIXED' | 'BOTH';
  /** Percentage markup (e.g., 10 = 10%) */
  percentage?: number;
  /** Fixed amount markup in IDR */
  fixedAmount?: number;
  /** Scope determines which products this rule applies to */
  scope: 'GLOBAL' | 'CATEGORY' | 'PRODUCT' | 'PROVIDER';
  /** ID of the scoped entity (productId, categoryId, or providerId) */
  scopeId?: string;
  /** Priority within the same scope (higher wins) */
  priority: number;
  /** Whether this rule is active */
  isActive: boolean;
}

/**
 * Markup Calculation Result
 */
export interface MarkupResult {
  basePrice: number;
  sellingPrice: number;
  markupAmount: number;
  ruleId: string | null;
  ruleScope: string | null;
}

/**
 * Markup Engine
 *
 * Calculates selling prices from base prices using a priority-based markup system.
 * Priority cascade: PRODUCT > CATEGORY > PROVIDER > GLOBAL
 * Within the same scope, the rule with the highest priority number wins.
 */
export class MarkupEngine {
  /**
   * Calculate the selling price from a base price using applicable markup rules.
   *
   * @param basePrice - The provider's base price
   * @param rules - Array of all available markup rules
   * @returns Calculated selling price (rounded to nearest integer)
   */
  calculateSellingPrice(basePrice: number, rules: MarkupRule[]): number {
    const activeRules = rules.filter((r) => r.isActive);

    if (activeRules.length === 0) {
      return basePrice;
    }

    // Find the highest-priority applicable rule using the scope cascade
    const applicableRule = this.findHighestPriorityRule(activeRules);

    if (!applicableRule) {
      return basePrice;
    }

    return this.applyMarkup(basePrice, applicableRule);
  }

  /**
   * Find the applicable markup rule for a specific product.
   * Uses the priority cascade: PRODUCT > CATEGORY > PROVIDER > GLOBAL
   *
   * @param rules - All available markup rules
   * @param productId - Product ID to match PRODUCT scope
   * @param categoryId - Category ID to match CATEGORY scope
   * @param providerId - Provider ID to match PROVIDER scope
   * @returns The most specific applicable rule, or null
   */
  findApplicableRule(
    rules: MarkupRule[],
    productId: string,
    categoryId: string,
    providerId: string
  ): MarkupRule | null {
    const activeRules = rules.filter((r) => r.isActive);

    // 1. Check PRODUCT scope (highest priority)
    const productRules = activeRules
      .filter((r) => r.scope === 'PRODUCT' && r.scopeId === productId)
      .sort((a, b) => b.priority - a.priority);

    if (productRules.length > 0) {
      return productRules[0];
    }

    // 2. Check CATEGORY scope
    const categoryRules = activeRules
      .filter((r) => r.scope === 'CATEGORY' && r.scopeId === categoryId)
      .sort((a, b) => b.priority - a.priority);

    if (categoryRules.length > 0) {
      return categoryRules[0];
    }

    // 3. Check PROVIDER scope
    const providerRules = activeRules
      .filter((r) => r.scope === 'PROVIDER' && r.scopeId === providerId)
      .sort((a, b) => b.priority - a.priority);

    if (providerRules.length > 0) {
      return providerRules[0];
    }

    // 4. Check GLOBAL scope (lowest priority)
    const globalRules = activeRules
      .filter((r) => r.scope === 'GLOBAL')
      .sort((a, b) => b.priority - a.priority);

    if (globalRules.length > 0) {
      return globalRules[0];
    }

    return null;
  }

  /**
   * Apply a single markup rule to a base price.
   *
   * For PERCENTAGE: sellingPrice = basePrice + (basePrice * percentage / 100)
   * For FIXED: sellingPrice = basePrice + fixedAmount
   * For BOTH: sellingPrice = basePrice + (basePrice * percentage / 100) + fixedAmount
   *
   * @param basePrice - The base price from provider
   * @param rule - The markup rule to apply
   * @returns Calculated selling price (rounded to nearest integer)
   */
  applyMarkup(basePrice: number, rule: MarkupRule): number {
    let markupAmount = 0;

    switch (rule.type) {
      case 'PERCENTAGE': {
        const percentage = rule.percentage || 0;
        markupAmount = Math.ceil(basePrice * (percentage / 100));
        break;
      }

      case 'FIXED': {
        markupAmount = rule.fixedAmount || 0;
        break;
      }

      case 'BOTH': {
        const percentage = rule.percentage || 0;
        const fixed = rule.fixedAmount || 0;
        markupAmount = Math.ceil(basePrice * (percentage / 100)) + fixed;
        break;
      }

      default:
        markupAmount = 0;
    }

    // Ensure selling price is never less than base price
    const sellingPrice = basePrice + markupAmount;
    return Math.max(sellingPrice, basePrice);
  }

  /**
   * Calculate markup with full result information
   */
  calculateWithDetails(
    basePrice: number,
    rules: MarkupRule[],
    productId: string,
    categoryId: string,
    providerId: string
  ): MarkupResult {
    const rule = this.findApplicableRule(rules, productId, categoryId, providerId);

    if (!rule) {
      return {
        basePrice,
        sellingPrice: basePrice,
        markupAmount: 0,
        ruleId: null,
        ruleScope: null,
      };
    }

    const sellingPrice = this.applyMarkup(basePrice, rule);

    return {
      basePrice,
      sellingPrice,
      markupAmount: sellingPrice - basePrice,
      ruleId: rule.id,
      ruleScope: rule.scope,
    };
  }

  /**
   * Bulk recalculate selling prices for all active products.
   * Used after markup rule changes to update the entire catalog.
   *
   * Loads markup rules from the system_settings table (key: 'markup_rules').
   * If a dedicated MarkupRule model is added later, update this method.
   *
   * @returns Count of updated and errored products
   */
  async recalculateAll(): Promise<{ updated: number; errors: number }> {
    let updated = 0;
    let errors = 0;

    try {
      // Load markup rules from system settings
      // When a dedicated MarkupRule model is added, switch to:
      // const markupRules = await prisma.markupRule.findMany({ where: { isActive: true } });
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'markup_rules' },
      });

      let rules: MarkupRule[] = [];
      if (setting?.value) {
        const rulesData = setting.value as unknown;
        if (Array.isArray(rulesData)) {
          rules = rulesData.map((r: any) => ({
            id: r.id || '',
            type: r.type || 'PERCENTAGE',
            percentage: r.percentage,
            fixedAmount: r.fixedAmount,
            scope: r.scope || 'GLOBAL',
            scopeId: r.scopeId,
            priority: r.priority || 0,
            isActive: r.isActive !== false,
          }));
        }
      }

      if (rules.length === 0) {
        logger.info('No active markup rules found, skipping recalculation');
        return { updated: 0, errors: 0 };
      }

      // Load all products with their provider products
      const products = await prisma.product.findMany({
        where: { status: 'ACTIVE' },
        include: {
          providerProducts: {
            where: { isActive: true },
            orderBy: { providerPrice: 'asc' },
            take: 1, // Get cheapest provider price as base
          },
        },
      });

      // Process in batches
      const BATCH_SIZE = 100;
      for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);

        const updates = batch
          .map((product) => {
            try {
              // Use the cheapest provider price as base price
              const basePrice = product.providerProducts[0]
                ? Number(product.providerProducts[0].providerPrice)
                : Number(product.basePrice);
              const categoryId = product.categoryId || '';
              const providerId = product.providerProducts[0]?.providerId || '';

              const applicableRule = this.findApplicableRule(rules, product.id, categoryId, providerId);

              if (!applicableRule) {
                return null; // No rule applies, skip
              }

              const newSellingPrice = this.applyMarkup(basePrice, applicableRule);

              // Only update if price actually changed
              if (newSellingPrice !== Number(product.sellingPrice)) {
                return {
                  id: product.id,
                  sellingPrice: newSellingPrice,
                  basePrice,
                };
              }

              return null;
            } catch (error) {
              errors++;
              logger.error({ productId: product.id, error }, 'Failed to recalculate markup for product');
              return null;
            }
          })
          .filter(Boolean);

        // Execute batch updates
        for (const update of updates) {
          if (!update) continue;
          try {
            await prisma.product.update({
              where: { id: update.id },
              data: {
                sellingPrice: update.sellingPrice,
                basePrice: update.basePrice,
              },
            });
            updated++;
          } catch (error) {
            errors++;
            logger.error({ productId: update.id, error }, 'Failed to update product price');
          }
        }
      }

      logger.info({ updated, errors, totalProducts: products.length }, 'Markup recalculation completed');
    } catch (error) {
      logger.error({ error }, 'Markup recalculation failed');
      throw error;
    }

    return { updated, errors };
  }

  /**
   * Find the highest priority rule from a flat list (scope-agnostic).
   * Used when scope context is not available.
   */
  private findHighestPriorityRule(rules: MarkupRule[]): MarkupRule | null {
    // Priority cascade by scope
    const scopeOrder: MarkupRule['scope'][] = ['PRODUCT', 'CATEGORY', 'PROVIDER', 'GLOBAL'];

    for (const scope of scopeOrder) {
      const scopedRules = rules.filter((r) => r.scope === scope);
      if (scopedRules.length > 0) {
        return scopedRules.sort((a, b) => b.priority - a.priority)[0];
      }
    }

    return null;
  }
}

/** Singleton markup engine instance */
export const markupEngine = new MarkupEngine();
