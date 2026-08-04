"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CatalogItem } from "./catalogService";

type CatalogStore = {
  /** The user's persisted design library. */
  items: CatalogItem[];
  /** Whether the library has been seeded from the template catalog. */
  seeded: boolean;
  isHydrated: boolean;

  seedCatalog: (items: CatalogItem[]) => void;
  addItem: (item: CatalogItem) => void;
  toggleFavorite: (id: string) => void;
  deleteItem: (id: string) => void;
  markHydrated: () => void;
};

export const useCatalogStore = create<CatalogStore>()(
  persist(
    (set) => ({
      items: [],
      seeded: false,
      isHydrated: false,

      seedCatalog: (items) => set({ items, seeded: true }),

      addItem: (item) => set((state) => ({ items: [...state.items, item] })),

      toggleFavorite: (id) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, favorite: !item.favorite, updatedAt: new Date().toISOString() } : item)),
        })),

      deleteItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

      markHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "ramesh-design-catalog",
      partialize: (state) => ({ items: state.items, seeded: state.seeded }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);
