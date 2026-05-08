'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useCountdown } from '@/hooks/use-countdown';
import { productService } from '@/services/product.service';
import type { Product } from '@/services/api.types';
import { ProductCard } from './ProductCard';

// Flash sale ends in 8 hours from now
const getFlashSaleEnd = () => {
  const end = new Date();
  end.setHours(end.getHours() + 8);
  return end;
};

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const { hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  if (isExpired) {
    return <span className="text-sm text-gray-500">Flash Sale telah berakhir</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-gray-500">Berakhir dalam</span>
      <div className="flex items-center gap-0.5">
        <span className="flex h-6 w-7 items-center justify-center rounded bg-red-600 text-xs font-bold text-white">
          {String(hours).padStart(2, '0')}
        </span>
        <span className="text-xs font-bold text-red-600">:</span>
        <span className="flex h-6 w-7 items-center justify-center rounded bg-red-600 text-xs font-bold text-white">
          {String(minutes).padStart(2, '0')}
        </span>
        <span className="text-xs font-bold text-red-600">:</span>
        <span className="flex h-6 w-7 items-center justify-center rounded bg-red-600 text-xs font-bold text-white">
          {String(seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

export function FlashSaleSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [flashSaleEnd] = useState(getFlashSaleEnd);

  useEffect(() => {
    productService.getFlashSaleProducts().then((res) => {
      if (res.success) setProducts(res.data);
    });
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-red-500" />
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
            Flash Sale
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <CountdownTimer targetDate={flashSaleEnd} />
          <Link
            href="/flash-sale"
            className="hidden items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 sm:flex"
          >
            Lihat Semua
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Horizontal Scrollable Products */}
      <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {products.map((product) => (
          <div key={product.id} className="w-[160px] flex-shrink-0 sm:w-[200px]">
            <ProductCard product={product} showDiscount />
          </div>
        ))}
      </div>

      {/* Mobile "Lihat Semua" */}
      <div className="mt-3 text-center sm:hidden">
        <Link
          href="/flash-sale"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Lihat Semua Promo
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
