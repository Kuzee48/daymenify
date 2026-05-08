'use client';

import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';

import { useFavoritesStore } from '@/store';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/storefront/ProductCard';
import type { Product } from '@/services/api.types';

// Mock product catalog - in production this would be fetched based on favorite IDs
const mockProducts: Product[] = [
  {
    id: 'fav1',
    slug: 'mobile-legends-86-diamonds',
    name: 'Mobile Legends - 86 Diamonds',
    description: 'Top up 86 diamonds Mobile Legends',
    category: 'Mobile Legends',
    categorySlug: 'mobile-legends',
    price: 22000,
    originalPrice: 25000,
    discount: 12,
    isPopular: true,
    isFlashSale: false,
    rating: 4.8,
    sold: 15230,
  },
  {
    id: 'fav2',
    slug: 'free-fire-100-diamonds',
    name: 'Free Fire - 100 Diamonds',
    description: 'Top up 100 diamonds Free Fire',
    category: 'Free Fire',
    categorySlug: 'free-fire',
    price: 15000,
    isPopular: true,
    isFlashSale: false,
    rating: 4.7,
    sold: 8920,
  },
  {
    id: 'fav3',
    slug: 'genshin-impact-welkin',
    name: 'Genshin Impact - Blessing of the Welkin Moon',
    description: 'Welkin Moon 30 days',
    category: 'Genshin Impact',
    categorySlug: 'genshin-impact',
    price: 75000,
    originalPrice: 85000,
    discount: 12,
    isPopular: true,
    isFlashSale: false,
    rating: 4.9,
    sold: 5430,
  },
  {
    id: 'fav4',
    slug: 'valorant-1000-vp',
    name: 'Valorant - 1000 VP',
    description: 'Top up 1000 Valorant Points',
    category: 'Valorant',
    categorySlug: 'valorant',
    price: 149000,
    originalPrice: 165000,
    discount: 10,
    isPopular: true,
    isFlashSale: false,
    rating: 4.8,
    sold: 3210,
  },
  {
    id: 'fav5',
    slug: 'pubg-mobile-60-uc',
    name: 'PUBG Mobile - 60 UC',
    description: 'Top up 60 UC PUBG Mobile',
    category: 'PUBG Mobile',
    categorySlug: 'pubg-mobile',
    price: 16000,
    isPopular: true,
    isFlashSale: false,
    rating: 4.6,
    sold: 7890,
  },
  {
    id: 'fav6',
    slug: 'honkai-star-rail-300-oneiric',
    name: 'Honkai Star Rail - 300 Oneiric Shard',
    description: 'Top up 300 Oneiric Shard',
    category: 'Honkai Star Rail',
    categorySlug: 'honkai-star-rail',
    price: 79000,
    originalPrice: 89000,
    discount: 11,
    isPopular: true,
    isFlashSale: false,
    rating: 4.9,
    sold: 4560,
  },
];

export default function FavoritesPage() {
  const { items: favoriteIds } = useFavoritesStore();

  // Filter products that are in favorites
  const favoriteProducts = mockProducts.filter((product) =>
    favoriteIds.includes(product.id)
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Produk Favorit</h2>
        <p className="text-muted-foreground">
          Produk yang kamu tandai sebagai favorit.
        </p>
      </div>

      {favoriteProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {favoriteProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Heart className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-foreground">
            Belum ada produk favorit
          </h3>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Tandai produk yang kamu suka dengan menekan ikon hati untuk
            menyimpannya di sini.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/products">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Jelajahi Produk
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
