import { View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner-native";
import { useQuery } from "@tanstack/react-query";

import { useTranslation } from "react-i18next";

import { Text } from "@/components/ui/text";
import { ProductForm } from "@/components/product-form";
import { useUpdateProduct } from "@/lib/queries/seller";
import type { CreateProductInput, SellerProduct } from "@/lib/queries/seller";
import { api } from "@/lib/api";
import { useThemeColors } from "@/lib/theme";
import { Spinner } from "@/components/ui/spinner";

export default function EditProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = useThemeColors();
  const { t } = useTranslation();
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
    toast.success(t("seller.editProduct.toastSuccess"));
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-row items-center gap-3 px-6 py-4">
        <Pressable onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={c.brand} />
        </Pressable>
        <Text variant="bold" className="flex-1 text-xl text-brand">{t("seller.editProduct.pageTitle")}</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Spinner size={44} />
        </View>
      ) : product ? (
        <ProductForm initial={product} onSubmit={handleSubmit} submitLabel={t("seller.editProduct.submitLabel")} />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: c.muted }}>{t("seller.editProduct.notFound")}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
