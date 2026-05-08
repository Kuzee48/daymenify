import { Metadata } from 'next';
import Link from 'next/link';
import {
  Gamepad2,
  Smartphone,
  CreditCard,
  Zap,
  Wallet,
  Tv,
  ArrowRight,
} from 'lucide-react';

import { categoryService } from '@/services/category.service';
import { Breadcrumb } from '@/components/storefront/Breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Kategori Produk - Daymenify',
  description: 'Temukan produk digital berdasarkan kategori. Game top up, pulsa, voucher, token listrik, e-wallet, dan streaming.',
};

const iconMap: Record<string, React.ReactNode> = {
  Gamepad2: <Gamepad2 className="h-8 w-8" />,
  Smartphone: <Smartphone className="h-8 w-8" />,
  CreditCard: <CreditCard className="h-8 w-8" />,
  Zap: <Zap className="h-8 w-8" />,
  Wallet: <Wallet className="h-8 w-8" />,
  Tv: <Tv className="h-8 w-8" />,
};

export default async function CategoriesPage() {
  const response = await categoryService.getCategories();
  const categories = response.data;

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: 'Kategori' }]} />

      <div className="mt-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Kategori Produk
        </h1>
        <p className="mt-2 text-muted-foreground">
          Pilih kategori produk digital yang kamu butuhkan
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link key={category.id} href={`/categories/${category.slug}`}>
            <Card className="group h-full transition-all hover:border-primary-200 hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="flex flex-col p-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100">
                    {iconMap[category.icon] || <Gamepad2 className="h-8 w-8" />}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {category.productCount} Produk
                  </Badge>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-primary-600">
                  {category.name}
                </h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-2">
                  {category.description}
                </p>
                <div className="mt-4 flex items-center text-sm font-medium text-primary-600">
                  <span>Lihat Produk</span>
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
