import { View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner-native";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/ui/text";
import { ProductForm } from "@/components/product-form";
import { useCreateProduct } from "@/lib/queries/seller";
import type { CreateProductInput } from "@/lib/queries/seller";
import { useThemeColors } from "@/lib/theme";

export default function NewProduct() {
  const router = useRouter();
  const c = useThemeColors();
  const { t } = useTranslation();
  const createProduct = useCreateProduct();

  const handleSubmit = async (data: CreateProductInput) => {
    await createProduct.mutateAsync(data);
    toast.success(t("seller.newProduct.toastSuccess"));
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-row items-center gap-3 px-6 py-4">
        <Pressable onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={c.brand} />
        </Pressable>
        <Text variant="bold" className="flex-1 text-xl text-brand">{t("seller.newProduct.pageTitle")}</Text>
      </View>

      <ProductForm onSubmit={handleSubmit} submitLabel={t("seller.newProduct.submitLabel")} />
    </SafeAreaView>
  );
}
