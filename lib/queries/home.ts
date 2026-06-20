import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { UseQueryOptions } from "@tanstack/react-query";

export interface Banner {
  id: number;
  title: string | null;
  subtitle: string | null;
  image: string;
  link_type: string | null;
  link_value: string | null;
}

export interface HomeCategory {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  icon: string | null;
}

export interface HomeProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  original_price: string | null;
  discount_percent: number | null;
  rating: string;
  reviews_count: number;
  sales_count: number;
  image: string | null;
  store_id: number;
}

export interface HomeStore {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  banner: string | null;
  rating: string;
  reviews_count: number;
  city: string | null;
}

export interface HomeData {
  banners: Banner[];
  categories: HomeCategory[];
  flash_deals: HomeProduct[];
  trending: HomeProduct[];
  featured: HomeProduct[];
  top_stores: HomeStore[];
}

export function useHome() {
  return useQuery({
    queryKey: ["home"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: HomeData }>("/home");
      return res.data.data;
    },
  });
}

export interface ProductImageItem {
  id: number;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductVariant {
  id: number;
  size: string | null;
  color: string | null;
  color_hex: string | null;
  stock: number;
  price_adjustment: string;
}

export interface ProductStore {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  rating: string;
  reviews_count: number;
  city: string | null;
}

export interface ProductReview {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  user: { id: number; name: string; avatar: string | null };
}

export interface ProductDetail {
  id: number;
  name: string;
  description: string;
  price: string;
  original_price: string | null;
  stock: number;
  rating: string;
  reviews_count: number;
  sales_count: number;
  discount_percent: number | null;
  product_images: ProductImageItem[];
  variants: ProductVariant[];
  store: ProductStore;
  reviews: ProductReview[];
  category: { id: number; name: string };
}

export function useProduct(id: number | string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: ProductDetail }>(
        `/client/products/${id}`,
      );
      return res.data.data;
    },
    enabled: !!id,
  });
}

export interface ProductFilters {
  search?: string;
  category_id?: number;
  store_id?: number;
  min_price?: number;
  max_price?: number;
  sort?: "newest" | "price_low" | "price_high" | "rating" | "popular";
  per_page?: number;
}

export function useProducts(filters: ProductFilters, enabled = true) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: async () => {
      const res = await api.get<{
        success: boolean;
        data: HomeProduct[];
        meta: any;
      }>("/client/products", { params: filters });
      return res.data.data;
    },
    enabled,
  });
}
export interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  icon: string | null;
  parent_id: number | null;
  children: CategoryNode[];
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: CategoryNode[] }>(
        "/categories",
      );
      return res.data.data;
    },
  });
}
export interface StoreDetail {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  banner: string | null;
  description: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  latitude: string;
  longitude: string;
  rating: string;
  reviews_count: number;
  sales_count: number;
  is_open: boolean;
  products: HomeProduct[];
}

export function useStore(id: number | string) {
  return useQuery({
    queryKey: ["store", id],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: StoreDetail }>(
        `/stores/${id}`,
      );
      return res.data.data;
    },
    enabled: !!id,
  });
}
