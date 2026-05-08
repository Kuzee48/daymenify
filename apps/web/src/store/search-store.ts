import { create } from 'zustand';

import type { Product } from '@/services/api.types';

export interface SearchState {
  query: string;
  results: Product[];
  recentSearches: string[];
  isOpen: boolean;
  isLoading: boolean;
}

export interface SearchActions {
  setQuery: (query: string) => void;
  setResults: (results: Product[]) => void;
  addRecentSearch: (search: string) => void;
  clearRecent: () => void;
  setOpen: (isOpen: boolean) => void;
  setLoading: (isLoading: boolean) => void;
}

export type SearchStore = SearchState & SearchActions;

const getStoredRecentSearches = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('daymenify-recent-searches');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const useSearchStore = create<SearchStore>()((set, get) => ({
  query: '',
  results: [],
  recentSearches: getStoredRecentSearches(),
  isOpen: false,
  isLoading: false,

  setQuery: (query) => {
    set({ query });
  },

  setResults: (results) => {
    set({ results, isLoading: false });
  },

  addRecentSearch: (search) => {
    const { recentSearches } = get();
    const trimmed = search.trim();
    if (!trimmed) return;

    const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(
      0,
      10
    );
    set({ recentSearches: updated });

    if (typeof window !== 'undefined') {
      localStorage.setItem('daymenify-recent-searches', JSON.stringify(updated));
    }
  },

  clearRecent: () => {
    set({ recentSearches: [] });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('daymenify-recent-searches');
    }
  },

  setOpen: (isOpen) => {
    set({ isOpen });
    if (!isOpen) {
      set({ query: '', results: [] });
    }
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },
}));
