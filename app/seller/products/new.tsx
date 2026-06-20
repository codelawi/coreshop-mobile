import { View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner-native";

import { Text } from "@/components/ui/text";
import { ProductForm } from "@/components/product-form";
import { useCreateProduct } from "@/lib/queries/seller";
import type { CreateProductInput } from "@/lib/queries/seller";

export default function NewProduct() {
  const router = useRouter();
  const createProduct = useCreateProduct();

  const handleSubmit = async (data: CreateProductInput) => {
    await createProduct.mutateAsync(data);
    toast.success("Product submitted for review");
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light">
      <View className="flex-row items-center gap-3 px-6 py-4">
        <Pressable onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#0A0A0A" />
        </Pressable>
        <Text variant="bold" className="flex-1 text-xl text-brand">New Product</Text>
      </View>

      <ProductForm onSubmit={handleSubmit} submitLabel="Submit for Review" />
    </SafeAreaView>
  );
}
