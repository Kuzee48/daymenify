'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, PackageOpen } from 'lucide-react';

import { productService } from '@/services/product.service';
import { useSearchStore } from '@/store/search-store';
import { Breadcrumb } from '@/components/storefront/Breadcrumb';
import { ProductCard } from '@/components/storefront/ProductCard';
import { ProductFilter, SortOption } from '@/components/storefront/ProductFilter';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/services/api.types';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const { addRecentSearch } = useSearchStore();

  const fetchResults = useCallback(async () => {
    if (!query.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const res = await productService.searchProducts(query);
    let results = res.data;

    // Apply sort
    if (sortBy === 'cheapest') {
      results.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'expensive') {
      results.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'popular') {
      results.sort((a, b) => b.sold - a.sold);
    }

    setProducts(results);
    setLoading(false);
  }, [query, sortBy]);

  useEffect(() => {
    fetchResults();
    if (query.trim()) {
      addRecentSearch(query.trim());
    }
  }, [fetchResults, query, addRecentSearch]);

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: 'Pencarian' }]} />

      <div className="mt-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Hasil Pencarian
        </h1>
        {query && (
          <p className="mt-2 text-muted-foreground">
            Hasil pencarian untuk: &ldquo;
            <span className="font-medium text-foreground">{query}</span>&rdquo;
          </p>
        )}
        {!loading && (
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length} produk ditemukan
          </p>
        )}
      </div>

      {/* Filter */}
      {products.length > 0 && (
        <div className="mt-4">
          <ProductFilter sortBy={sortBy} onSortChange={handleSortChange} />
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <PackageOpen className="h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Produk Tidak Ditemukan
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {query
              ? `Tidak ada produk yang cocok dengan "${query}". Coba kata kunci lain.`
              : 'Masukkan kata kunci untuk mencari produk.'}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
