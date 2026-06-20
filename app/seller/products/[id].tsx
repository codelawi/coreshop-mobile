import { View, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner-native";
import { useQuery } from "@tanstack/react-query";

import { Text } from "@/components/ui/text";
import { ProductForm } from "@/components/product-form";
import { useUpdateProduct } from "@/lib/queries/seller";
import type { CreateProductInput, SellerProduct } from "@/lib/queries/seller";
import { api } from "@/lib/api";

export default function EditProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const updateProduct = useUpdateProduct();

  const { data: product, isLoading } = useQuery({
    queryKey: ["seller", "products", Number(id)],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: SellerProduct }>(
        `/seller/products/${id}`
      );
      return res.data.data;
    },
    enabled: !!id,
  });

  const handleSubmit = async (data: CreateProductInput) => {
    await updateProduct.mutateAsync({ id: Number(id), ...data });
    toast.success("Product updated");
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light">
      <View className="flex-row items-center gap-3 px-6 py-4">
        <Pressable onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#0A0A0A" />
        </Pressable>
        <Text variant="bold" className="flex-1 text-xl text-brand">Edit Product</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0A0A0A" />
        </View>
      ) : product ? (
        <ProductForm initial={product} onSubmit={handleSubmit} submitLabel="Save Changes" />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: "#9CA3AF" }}>Product not found</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
