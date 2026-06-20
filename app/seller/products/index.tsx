import { View, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Image } from "expo-image";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Add01Icon,
  Package01Icon,
  Delete02Icon,
  Edit02Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner-native";

import { Text } from "@/components/ui/text";
import { useSellerProducts, useDeleteProduct } from "@/lib/queries/seller";
import type { SellerProduct } from "@/lib/queries/seller";

const STATUS_LABEL: Record<string, string> = {
  pending_review: "Pending",
  approved: "Approved",
  flagged: "Flagged",
  removed: "Removed",
};

const STATUS_COLOR: Record<string, string> = {
  pending_review: "#F59E0B",
  approved: "#22C55E",
  flagged: "#FF4D4F",
  removed: "#9CA3AF",
};

const FILTERS = ["all", "pending_review", "approved", "flagged"] as const;
type Filter = (typeof FILTERS)[number];

function ProductRow({ product, onEdit, onDelete }: {
  product: SellerProduct;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const primaryImage = product.images?.find((i) => i.is_primary) ?? product.images?.[0];
  const statusColor = STATUS_COLOR[product.status] ?? "#9CA3AF";
  const statusLabel = STATUS_LABEL[product.status] ?? product.status;

  return (
    <Pressable onPress={onEdit} className="flex-row items-center gap-3 bg-white px-4 py-3">
      <View className="h-16 w-16 overflow-hidden rounded-xl bg-brand-50">
        {primaryImage ? (
          <Image source={{ uri: primaryImage.url }} style={{ flex: 1 }} contentFit="cover" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <HugeiconsIcon icon={Package01Icon} size={24} color="#9CA3AF" />
          </View>
        )}
      </View>

      <View className="flex-1 gap-0.5">
        <Text variant="semibold" className="text-sm text-brand" numberOfLines={1}>
          {product.name}
        </Text>
        <Text className="text-xs" style={{ color: "#6B7280" }}>
          JOD {Number(product.price).toFixed(2)} · {product.stock} in stock
        </Text>
        <View className="mt-1 self-start rounded-full px-2 py-0.5" style={{ backgroundColor: statusColor + "20" }}>
          <Text variant="semibold" style={{ color: statusColor, fontSize: 10 }}>{statusLabel}</Text>
        </View>
      </View>

      <View className="flex-row gap-1">
        <Pressable
          onPress={onEdit}
          className="h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: "#F5F5F5" }}
        >
          <HugeiconsIcon icon={Edit02Icon} size={18} color="#0A0A0A" />
        </Pressable>
        <Pressable
          onPress={onDelete}
          className="h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: "#FEE2E2" }}
        >
          <HugeiconsIcon icon={Delete02Icon} size={18} color="#FF4D4F" />
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function SellerProducts() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const { data: products, isLoading } = useSellerProducts(
    activeFilter === "all" ? undefined : activeFilter
  );
  const deleteProduct = useDeleteProduct();

  const confirmDelete = (product: SellerProduct) => {
    Alert.alert(
      "Delete product?",
      `"${product.name}" will be permanently removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteProduct.mutate(product.id, {
              onSuccess: () => toast.success("Product deleted"),
              onError: () => toast.error("Failed to delete product"),
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-6 py-4">
        <Pressable onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#0A0A0A" />
        </Pressable>
        <Text variant="bold" className="flex-1 text-xl text-brand">My Products</Text>
        <Pressable
          onPress={() => router.push("/seller/products/new" as any)}
          className="h-9 w-9 items-center justify-center rounded-xl bg-brand"
        >
          <HugeiconsIcon icon={Add01Icon} size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 8, paddingBottom: 12, alignItems: "center" }}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setActiveFilter(f)}
            className="rounded-full px-4 py-2"
            style={{
              backgroundColor: activeFilter === f ? "#0A0A0A" : "#fff",
              borderWidth: 1,
              borderColor: activeFilter === f ? "#0A0A0A" : "#E5E7EB",
            }}
          >
            <Text
              variant="medium"
              className="text-xs"
              style={{ color: activeFilter === f ? "#fff" : "#374151" }}
            >
              {f === "all" ? "All" : STATUS_LABEL[f]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0A0A0A" />
        </View>
      ) : !products?.length ? (
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="flex-1 items-center justify-center px-8 gap-4"
        >
          <View className="h-20 w-20 items-center justify-center rounded-full bg-white">
            <HugeiconsIcon icon={Package01Icon} size={40} color="#9CA3AF" />
          </View>
          <Text variant="semibold" className="text-center text-base text-brand">No products yet</Text>
          <Text className="text-center text-sm" style={{ color: "#6B7280" }}>
            Add your first product to start selling
          </Text>
          <Pressable
            onPress={() => router.push("/seller/products/new" as any)}
            className="rounded-xl bg-brand px-6 py-3"
          >
            <Text variant="bold" style={{ color: "#fff" }}>Add Product</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="mx-6 overflow-hidden rounded-xl">
            {products.map((product, i) => (
              <Animated.View key={product.id} entering={FadeInDown.duration(300).delay(i * 40)}>
                {i > 0 ? <View className="ml-[76px] h-px bg-brand-100" /> : null}
                <ProductRow
                  product={product}
                  onEdit={() => router.push(`/seller/products/${product.id}` as any)}
                  onDelete={() => confirmDelete(product)}
                />
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
