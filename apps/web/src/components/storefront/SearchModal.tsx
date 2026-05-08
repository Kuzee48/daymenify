'use client';

import { useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, X, Clock, TrendingUp, Loader2, ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSearchStore } from '@/store/search-store';
import { useDebounce } from '@/hooks/use-debounce';
import { productService } from '@/services/product.service';

const trendingSearches = [
  'Mobile Legends',
  'Free Fire',
  'PUBG Mobile',
  'Genshin Impact',
  'Pulsa Telkomsel',
  'Token PLN',
];

export function SearchModal() {
  const {
    query,
    results,
    recentSearches,
    isOpen,
    isLoading,
    setQuery,
    setResults,
    addRecentSearch,
    clearRecent,
    setOpen,
    setLoading,
  } = useSearchStore();

  const debouncedQuery = useDebounce(query, 300);

  const handleSearch = useCallback(async () => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const response = await productService.searchProducts(debouncedQuery);
    if (response.success) {
      setResults(response.data);
    }
  }, [debouncedQuery, setResults, setLoading]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, setOpen]);

  const handleSelectSearch = (term: string) => {
    setQuery(term);
    addRecentSearch(term);
  };

  const handleResultClick = () => {
    if (query.trim()) addRecentSearch(query.trim());
    setOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Modal Content */}
      <div className="relative mx-auto mt-4 w-full max-w-2xl px-4 sm:mt-20">
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              autoFocus
              type="text"
              placeholder="Cari game, voucher, pulsa..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 border-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Results Area */}
          <div className="max-h-[60vh] overflow-y-auto p-4">
            {/* Search Results */}
            {query.trim() && results.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500">
                  {results.length} hasil ditemukan
                </p>
                <div className="space-y-1">
                  {results.slice(0, 8).map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={handleResultClick}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">{product.category}</p>
                      </div>
                      <span className="ml-3 text-sm font-semibold text-primary-600">
                        {formatCurrency(product.price)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {query.trim() && !isLoading && results.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">
                  Tidak ada produk ditemukan untuk &ldquo;{query}&rdquo;
                </p>
              </div>
            )}

            {/* Default State: Trending & Recent */}
            {!query.trim() && (
              <>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-6">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs font-medium text-gray-500">
                          Pencarian Terakhir
                        </span>
                      </div>
                      <button
                        onClick={clearRecent}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Hapus Semua
                      </button>
                    </div>
                    <div className="space-y-0.5">
                      {recentSearches.slice(0, 5).map((term) => (
                        <button
                          key={term}
                          onClick={() => handleSelectSearch(term)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Clock className="h-3.5 w-3.5 text-gray-300" />
                          {term}
                          <ArrowRight className="ml-auto h-3.5 w-3.5 text-gray-300" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Searches */}
                <div>
                  <div className="mb-2 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500">
                      Pencarian Populer
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSelectSearch(term)}
                        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
