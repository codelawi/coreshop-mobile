import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface WorkingHours {
  [day: string]: { open: boolean; from: string; to: string };
}

export interface SellerStore {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  banner: string | null;
  description: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  delivery_radius_km: number;
  status: "pending" | "active" | "suspended" | "closed";
  is_open: boolean;
  rating: string;
  reviews_count: number;
  sales_count: number;
  working_hours: WorkingHours | null;
  products_count: number;
  pending_orders_count: number;
  created_at: string;
}

export interface SellerProduct {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  original_price: string | null;
  stock: number;
  weight_grams: number | null;
  status: string;
  is_featured: boolean;
  category: { id: number; name: string } | null;
  images: Array<{ id: number; url: string; sort_order: number; is_primary: boolean }> | null;
  variants: Array<{
    id: number;
    size: string | null;
    color: string | null;
    color_hex: string | null;
    sku: string | null;
    price_adjustment: string;
    stock: number;
    is_active: boolean;
  }> | null;
  rating: string;
  reviews_count: number;
  sales_count: number;
  views_count: number;
  created_at: string;
}

export interface SellerOrder {
  id: number;
  status: string;
  payment_method: string | null;
  payment_status: string;
  subtotal: string;
  discount: string;
  delivery_fee: string;
  total: string;
  notes: string | null;
  client: { id: number; name: string; phone: string | null } | null;
  address: {
    address_line: string;
    city: string;
    recipient_name: string;
    phone: string | null;
  } | null;
  items: Array<{
    id: number;
    product_name: string;
    product_image: string | null;
    variant_label: string | null;
    quantity: number;
    unit_price: string;
    total: string;
  }> | null;
  items_count: number | null;
  created_at: string;
}

export interface CreateStoreInput {
  name: string;
  description?: string;
  phone?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  delivery_radius_km?: number;
  working_hours?: WorkingHours;
}

export interface UpdateStoreInput extends Partial<CreateStoreInput> {
  logo?: string;
  banner?: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  category_id: number;
  price: number;
  original_price?: number;
  stock: number;
  weight_grams?: number;
  images?: string[];
  variants?: Array<{
    size?: string;
    color?: string;
    color_hex?: string;
    sku?: string;
    price_adjustment?: number;
    stock: number;
  }>;
}

export function useSellerStore() {
  return useQuery({
    queryKey: ["seller", "store"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: SellerStore | null }>("/seller/store");
      return res.data.data;
    },
  });
}

export function useCreateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateStoreInput) => {
      const res = await api.post<{ success: boolean; data: SellerStore }>("/seller/store", data);
      return res.data.data;
    },
    onSuccess: (store) => qc.setQueryData(["seller", "store"], store),
  });
}

export function useUpdateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateStoreInput) => {
      const res = await api.put<{ success: boolean; data: SellerStore }>("/seller/store", data);
      return res.data.data;
    },
    onSuccess: (store) => qc.setQueryData(["seller", "store"], store),
  });
}

export function useToggleStoreOpen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.patch<{ success: boolean; data: { is_open: boolean } }>("/seller/store/open");
      return res.data.data;
    },
    onSuccess: ({ is_open }) =>
      qc.setQueryData<SellerStore | null>(["seller", "store"], (prev) =>
        prev ? { ...prev, is_open } : prev
      ),
  });
}

export function useSellerProducts(status?: string) {
  return useQuery({
    queryKey: ["seller", "products", status],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: SellerProduct[] }>("/seller/products", {
        params: status ? { status } : undefined,
      });
      return res.data.data;
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const res = await api.post<{ success: boolean; data: SellerProduct }>("/seller/products", data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seller", "products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CreateProductInput> & { id: number }) => {
      const res = await api.put<{ success: boolean; data: SellerProduct }>(`/seller/products/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seller", "products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/seller/products/${id}`);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seller", "products"] }),
  });
}

export function useSellerOrders(status?: string) {
  return useQuery({
    queryKey: ["seller", "orders", status],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: SellerOrder[] }>("/seller/orders", {
        params: status ? { status } : undefined,
      });
      return res.data.data;
    },
  });
}

export function useSellerOrder(id: number) {
  return useQuery({
    queryKey: ["seller", "orders", id],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: SellerOrder }>(`/seller/orders/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useUpdateSellerOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await api.patch<{ success: boolean; data: SellerOrder }>(
        `/seller/orders/${id}/status`,
        { status }
      );
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seller", "orders"] }),
  });
}

export interface SellerAnalyticsOverview {
  total_revenue: number;
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  avg_order_value: number;
  this_month_revenue: number;
  last_month_revenue: number;
  products_count: number;
}

export interface SellerRevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface SellerTopProduct {
  product_id: number;
  name: string;
  image: string | null;
  units_sold: number;
  revenue: number;
}

export function useSellerAnalyticsOverview() {
  return useQuery({
    queryKey: ["seller", "analytics", "overview"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: SellerAnalyticsOverview }>(
        "/seller/analytics/overview"
      );
      return res.data.data;
    },
  });
}

export function useSellerRevenue() {
  return useQuery({
    queryKey: ["seller", "analytics", "revenue"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: SellerRevenuePoint[] }>(
        "/seller/analytics/revenue"
      );
      return res.data.data;
    },
  });
}

export function useSellerTopProducts() {
  return useQuery({
    queryKey: ["seller", "analytics", "top-products"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: SellerTopProduct[] }>(
        "/seller/analytics/top-products"
      );
      return res.data.data;
    },
  });
}
