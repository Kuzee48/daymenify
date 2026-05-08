'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, PackageOpen } from 'lucide-react';

import { categoryService } from '@/services/category.service';
import { productService } from '@/services/product.service';
import { Breadcrumb } from '@/components/storefront/Breadcrumb';
import { ProductCard } from '@/components/storefront/ProductCard';
import { ProductFilter, SortOption } from '@/components/storefront/ProductFilter';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Category, Product } from '@/services/api.types';

export default function CategoryDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [catRes, prodRes] = await Promise.all([
      categoryService.getCategoryBySlug(slug),
      productService.getProducts({
        category: slug,
        page,
        limit: 12,
        sort: sortBy === 'cheapest' || sortBy === 'expensive' ? 'price' : 'sold',
        order: sortBy === 'cheapest' ? 'asc' : sortBy === 'expensive' ? 'desc' : 'desc',
      }),
    ]);

    setCategory(catRes.data);
    setProducts(prodRes.data);
    setTotalPages(prodRes.meta?.totalPages || 1);
    setLoading(false);
  }, [slug, page, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
    setPage(1);
  };

  if (loading && !category) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-6 h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-96" />
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto flex flex-col items-center px-4 py-16 text-center">
        <PackageOpen className="h-16 w-16 text-gray-300" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900">
          Kategori Tidak Ditemukan
        </h2>
        <p className="mt-2 text-muted-foreground">
          Kategori yang kamu cari tidak tersedia.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumb
        items={[
          { label: 'Kategori', href: '/categories' },
          { label: category.name },
        ]}
      />

      {/* Category Header */}
      <div className="mt-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {category.name}
        </h1>
        <p className="mt-2 text-muted-foreground">{category.description}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {category.productCount} produk tersedia
        </p>
      </div>

      {/* Filter Bar */}
      <div className="mt-6">
        <ProductFilter sortBy={sortBy} onSortChange={handleSortChange} />
      </div>

      {/* Product Grid */}
      {products.length === 0 && !loading ? (
        <div className="flex flex-col items-center py-16 text-center">
          <PackageOpen className="h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Belum Ada Produk
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Produk untuk kategori ini belum tersedia saat ini.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Sebelumnya
          </Button>
          <span className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Selanjutnya
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
