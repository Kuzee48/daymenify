'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, PackageOpen } from 'lucide-react';

import { productService } from '@/services/product.service';
import { categoryService } from '@/services/category.service';
import { Breadcrumb } from '@/components/storefront/Breadcrumb';
import { ProductCard } from '@/components/storefront/ProductCard';
import { ProductFilter, SortOption } from '@/components/storefront/ProductFilter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import type { Category, Product } from '@/services/api.types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useDebounce(searchQuery, 400);

  const fetchCategories = useCallback(async () => {
    const res = await categoryService.getCategories();
    setCategories(res.data);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);

    if (debouncedSearch) {
      const res = await productService.searchProducts(debouncedSearch);
      let filtered = res.data;

      if (selectedCategories.length > 0) {
        filtered = filtered.filter((p) =>
          selectedCategories.includes(p.categorySlug)
        );
      }

      // Sort
      if (sortBy === 'cheapest') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'expensive') {
        filtered.sort((a, b) => b.price - a.price);
      } else if (sortBy === 'popular') {
        filtered.sort((a, b) => b.sold - a.sold);
      }

      setProducts(filtered);
      setTotalPages(1);
    } else {
      const res = await productService.getProducts({
        page,
        limit: 12,
        category: selectedCategories.length === 1 ? selectedCategories[0] : undefined,
        sort: sortBy === 'cheapest' || sortBy === 'expensive' ? 'price' : 'sold',
        order: sortBy === 'cheapest' ? 'asc' : 'desc',
      });
      setProducts(res.data);
      setTotalPages(res.meta?.totalPages || 1);
    }

    setLoading(false);
  }, [debouncedSearch, page, sortBy, selectedCategories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
    setPage(1);
  };

  const handleCategoryChange = (cats: string[]) => {
    setSelectedCategories(cats);
    setPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: 'Semua Produk' }]} />

      <div className="mt-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Semua Produk
        </h1>
        <p className="mt-2 text-muted-foreground">
          Temukan produk digital yang kamu butuhkan
        </p>
      </div>

      {/* Search Input */}
      <div className="mt-6 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari produk..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* Filters */}
      <div className="mt-4">
        <ProductFilter
          sortBy={sortBy}
          onSortChange={handleSortChange}
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
          selectedCategories={selectedCategories}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 12 }).map((_, i) => (
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
            Coba ubah filter atau kata kunci pencarian kamu.
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
      {totalPages > 1 && !debouncedSearch && (
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
