import { Job } from 'bullmq';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { ProviderFactory } from '@/services/provider';
import { markupEngine } from '@/services/markup';
import type { SyncJobData } from '@/queues/jobs';

const providerFactory = new ProviderFactory();

/**
 * Product Sync Worker
 *
 * Syncs product catalogs from providers:
 * 1. Fetch products from provider API
 * 2. Upsert products in database (create new, update existing)
 * 3. Disable stale products no longer available
 * 4. Recalculate selling prices using markup rules
 * 5. Invalidate Redis cache for affected products
 */
export async function processSyncJob(job: Job<SyncJobData>): Promise<void> {
  const { providerId, providerCode, syncType, triggeredBy } = job.data;

  const jobLogger = logger.child({
    jobId: job.id,
    providerId,
    providerCode,
    syncType,
    triggeredBy,
  });

  jobLogger.info('Starting product sync');

  let newCount = 0;
  let updatedCount = 0;
  let disabledCount = 0;
  let errorCount = 0;

  try {
    // 1. Load provider from database and initialize adapter
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider || !provider.isActive) {
      jobLogger.warn('Provider not found or inactive, skipping sync');
      return;
    }

    const providerRecord = {
      id: provider.id,
      code: provider.code,
      name: provider.name,
      isActive: provider.isActive,
      config: {
        baseUrl: provider.apiUrl,
        apiKey: provider.apiKey,
        secret: provider.apiSecret || provider.webhookSecret || '',
      } as Record<string, string>,
    };

    providerFactory.getAdapter(providerCode, providerRecord);

    // 2. Fetch products from provider
    await job.updateProgress(10);
    const rawProducts = await providerFactory.syncProducts(providerId, providerCode);

    jobLogger.info({ productCount: rawProducts.length }, 'Fetched products from provider');
    await job.updateProgress(30);

    // 3. Get existing provider products for comparison
    const existingProducts = await prisma.providerProduct.findMany({
      where: { providerId },
      select: { id: true, providerCode: true, providerPrice: true, isActive: true },
    });

    const existingMap = new Map(existingProducts.map((p) => [p.providerCode, p]));
    const fetchedCodes = new Set(rawProducts.map((p) => p.code));

    // 4. Process each fetched product
    for (const rawProduct of rawProducts) {
      try {
        const existing = existingMap.get(rawProduct.code);

        if (existing) {
          // Update existing product
          const needsUpdate =
            Number(existing.providerPrice) !== rawProduct.price ||
            !existing.isActive;

          if (needsUpdate || syncType === 'full') {
            await prisma.providerProduct.update({
              where: { id: existing.id },
              data: {
                providerPrice: rawProduct.price,
                isActive: rawProduct.status === 'available',
                lastSyncAt: new Date(),
              },
            });
            updatedCount++;
          }
        } else {
          // Try to find or create the parent product
          let product = await prisma.product.findFirst({
            where: {
              OR: [
                { slug: rawProduct.code },
                { name: rawProduct.name },
              ],
            },
          });

          if (!product) {
            // Find the category or use a default
            let category = await prisma.category.findFirst({
              where: { name: rawProduct.category },
            });

            if (!category) {
              category = await prisma.category.create({
                data: {
                  name: rawProduct.category,
                  slug: rawProduct.category.toLowerCase().replace(/\s+/g, '-'),
                  isActive: true,
                },
              });
            }

            // Create new product record
            product = await prisma.product.create({
              data: {
                name: rawProduct.name,
                slug: `${rawProduct.code}-${Date.now()}`.toLowerCase().replace(/\s+/g, '-'),
                categoryId: category.id,
                type: mapCategoryToProductType(rawProduct.category),
                basePrice: rawProduct.price,
                sellingPrice: rawProduct.price, // Will be recalculated by markup engine
                status: rawProduct.status === 'available' ? 'ACTIVE' : 'INACTIVE',
                description: rawProduct.description || '',
              },
            });
          }

          // Create provider product mapping
          await prisma.providerProduct.create({
            data: {
              providerId,
              productId: product.id,
              providerCode: rawProduct.code,
              providerPrice: rawProduct.price,
              isActive: rawProduct.status === 'available',
              lastSyncAt: new Date(),
            },
          });
          newCount++;
        }
      } catch (error) {
        errorCount++;
        jobLogger.error(
          { productCode: rawProduct.code, error },
          'Failed to process product during sync'
        );
      }
    }

    await job.updateProgress(60);

    // 5. Disable products no longer available from provider
    for (const [code, existing] of existingMap) {
      if (!fetchedCodes.has(code) && existing.isActive) {
        await prisma.providerProduct.update({
          where: { id: existing.id },
          data: { isActive: false },
        });
        disabledCount++;
      }
    }

    await job.updateProgress(75);

    // 6. Recalculate selling prices for affected products
    if (syncType === 'full' || updatedCount > 0 || newCount > 0) {
      try {
        const result = await markupEngine.recalculateAll();
        jobLogger.info(
          { recalculated: result.updated, errors: result.errors },
          'Markup recalculation completed'
        );
      } catch (error) {
        jobLogger.error({ error }, 'Markup recalculation failed');
      }
    }

    await job.updateProgress(90);

    // 7. Invalidate Redis cache for products
    const cacheKeys = await redis.keys('products:*');
    if (cacheKeys.length > 0) {
      await redis.del(...cacheKeys);
      jobLogger.info({ keysInvalidated: cacheKeys.length }, 'Product cache invalidated');
    }

    // Also invalidate provider-specific caches
    await redis.del(`provider:${providerId}:products`);
    await redis.del(`provider:${providerCode}:products`);

    await job.updateProgress(100);

    // 8. Log sync results
    jobLogger.info(
      { new: newCount, updated: updatedCount, disabled: disabledCount, errors: errorCount },
      'Product sync completed'
    );

    // Store sync result for reporting
    await redis.set(
      `sync:last:${providerId}`,
      JSON.stringify({
        completedAt: new Date().toISOString(),
        new: newCount,
        updated: updatedCount,
        disabled: disabledCount,
        errors: errorCount,
        triggeredBy,
        syncType,
      }),
      'EX',
      86400 // 24 hours
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    jobLogger.error({ error: errorMessage }, 'Product sync failed');

    // Store failure for reporting
    await redis.set(
      `sync:last:${providerId}`,
      JSON.stringify({
        failedAt: new Date().toISOString(),
        error: errorMessage,
        triggeredBy,
        syncType,
      }),
      'EX',
      86400
    );

    throw error;
  }
}

/**
 * Map raw category string to ProductType enum
 */
function mapCategoryToProductType(category: string): string {
  const mapping: Record<string, string> = {
    pulsa: 'PULSA',
    data: 'DATA_PACKAGE',
    'data package': 'DATA_PACKAGE',
    game: 'GAME_TOPUP',
    'game topup': 'GAME_TOPUP',
    pln: 'PLN_TOKEN',
    'pln token': 'PLN_TOKEN',
    ewallet: 'EWALLET',
    'e-wallet': 'EWALLET',
    voucher: 'VOUCHER',
    streaming: 'STREAMING',
  };

  return mapping[category.toLowerCase()] || 'OTHER';
}
