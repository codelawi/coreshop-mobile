import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Address {
  id: number;
  label: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  building: string | null;
  floor: string | null;
  apartment: string | null;
  city: string;
  latitude: string;
  longitude: string;
  notes: string | null;
  is_default: boolean;
}

export interface AddressInput {
  label: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  building?: string | null;
  floor?: string | null;
  apartment?: string | null;
  city: string;
  latitude: number;
  longitude: number;
  notes?: string | null;
  is_default?: boolean;
}

export function useAddresses() {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Address[] }>("/addresses");
      return res.data.data;
    },
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AddressInput) => {
      const res = await api.post("/addresses", data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AddressInput }) => {
      const res = await api.put(`/addresses/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/addresses/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/addresses/${id}/default`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}