import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FavoritesState {
  items: string[];
}

export interface FavoritesActions {
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  clearAll: () => void;
}

export type FavoritesStore = FavoritesState & FavoritesActions;

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      items: [],

      toggleFavorite: (productId) => {
        const { items } = get();
        const isFav = items.includes(productId);

        if (isFav) {
          set({ items: items.filter((id) => id !== productId) });
        } else {
          set({ items: [...items, productId] });
        }
      },

      isFavorite: (productId) => {
        return get().items.includes(productId);
      },

      clearAll: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'daymenify-favorites',
    }
  )
);
