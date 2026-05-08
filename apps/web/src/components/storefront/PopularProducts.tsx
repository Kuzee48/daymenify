'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, ChevronRight, Gamepad2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { productService } from '@/services/product.service';
import type { Product } from '@/services/api.types';

export function PopularProducts() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    productService.getPopularProducts().then((res) => {
      if (res.success) setProducts(res.data);
    });
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
            Populer Saat Ini
          </h2>
        </div>
        <Link
          href="/categories/game-top-up"
          className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Lihat Semua
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className={cn(
              'group flex flex-col items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 transition-all',
              'hover:border-primary-200 hover:shadow-md'
            )}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 transition-colors group-hover:bg-primary-100">
              <Gamepad2 className="h-7 w-7 text-primary-600" />
            </div>
            <div className="text-center">
              <h3 className="line-clamp-2 text-xs font-medium text-gray-900 sm:text-sm">
                {product.name}
              </h3>
              <p className="mt-1 text-[10px] text-gray-500 sm:text-xs">
                {product.sold.toLocaleString('id-ID')} terjual
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
