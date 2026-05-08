'use client';

import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFavoritesStore } from '@/store/favorites-store';
import type { Product } from '@/services/api.types';

interface ProductCardProps {
  product: Product;
  showDiscount?: boolean;
  className?: string;
}

export function ProductCard({
  product,
  showDiscount = true,
  className,
}: ProductCardProps) {
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const isFav = isFavorite(product.id);

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white transition-all',
        'hover:border-gray-200 hover:shadow-lg hover:-translate-y-0.5',
        className
      )}
    >
      {/* Discount Badge */}
      {showDiscount && product.discount && (
        <div className="absolute left-2 top-2 z-10">
          <Badge variant="destructive" className="text-xs font-bold">
            -{product.discount}%
          </Badge>
        </div>
      )}

      {/* Favorite Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleFavorite(product.id);
        }}
        className="absolute right-2 top-2 z-10 rounded-full bg-white/80 p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
      >
        <Heart
          className={cn(
            'h-4 w-4',
            isFav ? 'fill-red-500 text-red-500' : 'text-gray-400'
          )}
        />
      </button>

      {/* Product Image Placeholder */}
      <Link href={`/products/${product.slug}`}>
        <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
            <ShoppingBag className="h-8 w-8" />
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3">
        <Link href={`/products/${product.slug}`}>
          <Badge variant="secondary" className="mb-1.5 w-fit text-[10px]">
            {product.category}
          </Badge>
          <h3 className="line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-primary-600">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-gray-900">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
          <Button size="sm" className="mt-2 w-full text-xs" asChild>
            <Link href={`/products/${product.slug}`}>Beli</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
