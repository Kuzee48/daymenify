'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ChevronRight } from 'lucide-react';

import { productService } from '@/services/product.service';
import type { Product } from '@/services/api.types';
import { ProductCard } from './ProductCard';

export function RecommendedSection() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    productService.getRecommendedProducts().then((res) => {
      if (res.success) setProducts(res.data);
    });
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent-600" />
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
            Rekomendasi Untukmu
          </h2>
        </div>
        <Link
          href="/products"
          className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Lihat Semua
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
