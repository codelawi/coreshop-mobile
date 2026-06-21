import { create } from "zustand";
import { api } from "@/lib/api";

interface WishlistState {
  ids: Set<number>;
  isLoading: boolean;
  hydrate: () => Promise<void>;
  toggle: (productId: number) => Promise<void>;
  isWishlisted: (productId: number) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: new Set(),
  isLoading: false,

  hydrate: async () => {
    try {
      const res = await api.get("/client/wishlist/ids");
      set({ ids: new Set(res.data.data as number[]) });
    } catch {
      // Not logged in or network error — silently ignore
    }
  },

  toggle: async (productId: number) => {
    const current = get().ids;
    const isCurrentlyWishlisted = current.has(productId);

    // Optimistic update
    const next = new Set(current);
    if (isCurrentlyWishlisted) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
    set({ ids: next });

    try {
      await api.post(`/client/wishlist/${productId}`);
    } catch {
      // Revert on failure
      set({ ids: current });
    }
  },

  isWishlisted: (productId: number) => get().ids.has(productId),
}));
