import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { ProductDetail, ProductVariant } from "@/lib/queries/home";

export interface CartItem {
  id: string; // product_id + variant_id
  product_id: number;
  variant_id: number | null;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
  variant_label: string | null;
  store_id: number;
  store_name: string;
  stock: number;
}

interface CartState {
  items: CartItem[];
  storeId: number | null;
  storeName: string | null;
  add: (product: ProductDetail, variant: ProductVariant | null, qty: number) => "added" | "needs_clear";
  forceAdd: (product: ProductDetail, variant: ProductVariant | null, qty: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  hydrate: () => Promise<void>;
  total: () => number;
  count: () => number;
}

const STORAGE_KEY = "cart_v1";

async function persist(state: { items: CartItem[]; storeId: number | null; storeName: string | null }) {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(state));
}

function lineId(productId: number, variantId: number | null) {
  return `${productId}:${variantId ?? "default"}`;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  storeId: null,
  storeName: null,

  add: (product, variant, qty) => {
    const { storeId } = get();
    if (storeId && storeId !== product.store.id) return "needs_clear";
    get().forceAdd(product, variant, qty);
    return "added";
  },

  forceAdd: (product, variant, qty) => {
    const id = lineId(product.id, variant?.id ?? null);
    const items = [...get().items];
    const existing = items.find((i) => i.id === id);
    const price =
      parseFloat(product.price) +
      (variant ? parseFloat(variant.price_adjustment) : 0);
    const stock = variant ? variant.stock : product.stock;
    const image = product.product_images[0]?.url ?? null;
    const variantLabel = variant
      ? [variant.size, variant.color].filter(Boolean).join(" / ")
      : null;

    if (existing) {
      existing.quantity = Math.min(existing.quantity + qty, stock);
    } else {
      items.push({
        id,
        product_id: product.id,
        variant_id: variant?.id ?? null,
        name: product.name,
        image,
        price,
        quantity: Math.min(qty, stock),
        variant_label: variantLabel,
        store_id: product.store.id,
        store_name: product.store.name,
        stock,
      });
    }

    const next = {
      items,
      storeId: product.store.id,
      storeName: product.store.name,
    };
    set(next);
    persist(next);
  },

  remove: (id) => {
    const items = get().items.filter((i) => i.id !== id);
    const next =
      items.length === 0
        ? { items, storeId: null, storeName: null }
        : { items, storeId: get().storeId, storeName: get().storeName };
    set(next);
    persist(next);
  },

  setQty: (id, qty) => {
    const items = get().items.map((i) =>
      i.id === id ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock)) } : i
    );
    set({ items });
    persist({ items, storeId: get().storeId, storeName: get().storeName });
  },

  clear: () => {
    const next = { items: [], storeId: null, storeName: null };
    set(next);
    persist(next);
  },

  hydrate: async () => {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      set({
        items: data.items ?? [],
        storeId: data.storeId ?? null,
        storeName: data.storeName ?? null,
      });
    } catch {}
  },

  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));