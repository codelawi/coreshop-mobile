import { create } from "zustand";
import { api } from "@/lib/api";

interface WishlistState {
  ids: Set<number>;
  hydrate: () => Promise<void>;
  toggle: (productId: number) => Promise<void>;
  isWishlisted: (productId: number) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: new Set(),

  hydrate: async () => {
    try {
      console.log("[wishlist] hydrating...");
      const res = await api.get("/client/wishlist/ids");
      console.log("[wishlist] hydrate response:", res.data);
      set({ ids: new Set(res.data.data as number[]) });
    } catch (err: any) {
      console.log("[wishlist] hydrate error:", err?.response?.status, err?.response?.data ?? err?.message);
    }
  },

  toggle: async (productId: number) => {
    const current = get().ids;
    const isCurrentlyWishlisted = current.has(productId);
    console.log("[wishlist] toggle", productId, "currently wishlisted:", isCurrentlyWishlisted);

    // Optimistic update
    const next = new Set(current);
    if (isCurrentlyWishlisted) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
    set({ ids: next });

    try {
      const res = await api.post(`/client/wishlist/${productId}`);
      console.log("[wishlist] toggle response:", res.data);
    } catch (err: any) {
      console.log("[wishlist] toggle error:", err?.response?.status, err?.response?.data ?? err?.message);
      // Revert on failure
      set({ ids: current });
    }
  },

  isWishlisted: (productId: number) => get().ids.has(productId),
}));
