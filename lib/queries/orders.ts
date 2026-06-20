import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string | null;
  variant_label: string | null;
  quantity: number;
  unit_price: string;
  total: string;
}

export interface Order {
  id: number;
  status: string;
  subtotal: string;
  discount: string;
  delivery_fee: string;
  distance_km: string;
  total: string;
  payment_method: string;
  payment_status: string;
  notes: string | null;
  store: { id: number; name: string; logo: string | null } | null;
  address: {
    label: string;
    recipient_name: string;
    address_line: string;
    city: string;
  } | null;
  coupon: { code: string } | null;
  items: OrderItem[] | null;
  items_count: number | null;
  created_at: string;
  approved_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
}

export interface PlaceOrderInput {
  address_id: number;
  coupon_code?: string;
  notes?: string;
  items: Array<{
    product_id: number;
    variant_id: number | null;
    quantity: number;
  }>;
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: PlaceOrderInput) => {
      const res = await api.post<{ success: boolean; data: Order }>("/client/orders", data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Order[] }>("/client/orders");
      return res.data.data;
    },
  });
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Order }>(`/client/orders/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export interface OrderReviewStatus {
  reviewed: boolean;
  rating: number | null;
  comment: string | null;
}

export function useOrderReviewStatus(orderId: number, enabled = true) {
  return useQuery({
    queryKey: ["orders", orderId, "review"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: OrderReviewStatus }>(
        `/client/orders/${orderId}/review`
      );
      return res.data.data;
    },
    enabled: enabled && !!orderId,
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      rating,
      comment,
    }: {
      orderId: number;
      rating: number;
      comment?: string;
    }) => {
      const res = await api.post<{ success: boolean; message: string }>(
        `/client/orders/${orderId}/review`,
        { rating, comment: comment || undefined }
      );
      return res.data;
    },
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: ["orders", orderId, "review"] });
    },
  });
}
