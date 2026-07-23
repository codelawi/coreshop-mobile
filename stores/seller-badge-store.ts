import { create } from "zustand";

interface SellerBadgeState {
  unseenOrderCount: number;
  increment: () => void;
  reset: () => void;
}

export const useSellerBadgeStore = create<SellerBadgeState>((set) => ({
  unseenOrderCount: 0,
  increment: () => set((s) => ({ unseenOrderCount: s.unseenOrderCount + 1 })),
  reset: () => set({ unseenOrderCount: 0 }),
}));
