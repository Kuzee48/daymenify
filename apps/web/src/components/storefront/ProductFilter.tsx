'use client';

import { useState } from 'react';
import { Filter, ChevronDown, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type SortOption = 'newest' | 'popular' | 'cheapest' | 'expensive';

interface ProductFilterProps {
  categories?: { slug: string; name: string }[];
  selectedCategories?: string[];
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onCategoryChange?: (categories: string[]) => void;
  className?: string;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'popular', label: 'Terlaris' },
  { value: 'cheapest', label: 'Termurah' },
  { value: 'expensive', label: 'Termahal' },
];

export function ProductFilter({
  categories,
  selectedCategories = [],
  sortBy,
  onSortChange,
  onCategoryChange,
  className,
}: ProductFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const activeFilterCount = selectedCategories.length;

  const handleCategoryToggle = (slug: string) => {
    if (!onCategoryChange) return;
    const updated = selectedCategories.includes(slug)
      ? selectedCategories.filter((c) => c !== slug)
      : [...selectedCategories, slug];
    onCategoryChange(updated);
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Sort Dropdown */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsSortOpen(!isSortOpen);
            setIsFilterOpen(false);
          }}
          className="gap-1.5"
        >
          <span className="text-xs">
            {sortOptions.find((o) => o.value === sortBy)?.label || 'Urutkan'}
          </span>
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
        {isSortOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsSortOpen(false)}
            />
            <div className="absolute left-0 top-full z-50 mt-1 w-40 rounded-lg border bg-white p-1 shadow-lg">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setIsSortOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors',
                    sortBy === option.value
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'hover:bg-gray-50'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Category Filter */}
      {categories && categories.length > 0 && (
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsFilterOpen(!isFilterOpen);
              setIsSortOpen(false);
            }}
            className="gap-1.5"
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="text-xs">Filter</span>
            {activeFilterCount > 0 && (
              <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {isFilterOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsFilterOpen(false)}
              />
              <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border bg-white p-3 shadow-lg">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Kategori</span>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => onCategoryChange?.([])}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <label
                      key={cat.slug}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.slug)}
                        onChange={() => handleCategoryToggle(cat.slug)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      {cat.name}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Active filters display */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedCategories.map((slug) => {
            const cat = categories?.find((c) => c.slug === slug);
            return (
              <Badge
                key={slug}
                variant="secondary"
                className="gap-1 text-xs"
              >
                {cat?.name || slug}
                <button
                  onClick={() => handleCategoryToggle(slug)}
                  className="ml-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
