import Link from 'next/link';
import {
  Gamepad2,
  Smartphone,
  CreditCard,
  Zap,
  Wallet,
  Tv,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const iconMap = {
  Gamepad2,
  Smartphone,
  CreditCard,
  Zap,
  Wallet,
  Tv,
};

const categories = [
  { name: 'Game Top Up', slug: 'game-top-up', icon: 'Gamepad2', color: 'bg-primary-50 text-primary-600' },
  { name: 'Pulsa & Data', slug: 'pulsa-data', icon: 'Smartphone', color: 'bg-emerald-50 text-emerald-600' },
  { name: 'Voucher Digital', slug: 'voucher-digital', icon: 'CreditCard', color: 'bg-accent-50 text-accent-600' },
  { name: 'Token Listrik', slug: 'token-listrik', icon: 'Zap', color: 'bg-yellow-50 text-yellow-600' },
  { name: 'E-Wallet', slug: 'e-wallet', icon: 'Wallet', color: 'bg-pink-50 text-pink-600' },
  { name: 'Streaming', slug: 'streaming', icon: 'Tv', color: 'bg-orange-50 text-orange-600' },
];

export function CategoryGrid() {
  return (
    <section className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
          Kategori Produk
        </h2>
        <Link
          href="/categories"
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Lihat Semua
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
        {categories.map((category) => {
          const Icon = iconMap[category.icon as keyof typeof iconMap];
          return (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-4 transition-all',
                'hover:border-gray-200 hover:shadow-md'
              )}
            >
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  category.color
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-center text-xs font-medium text-gray-700 sm:text-sm">
                {category.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
