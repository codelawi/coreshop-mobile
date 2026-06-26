import { View, ScrollView, Pressable, Alert, RefreshControl } from "react-native";
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
import { useTranslation } from "react-i18next";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSellerProducts, useDeleteProduct } from "@/lib/queries/seller";
import { useThemeColors } from "@/lib/theme";
import { SkeletonProductRow } from "@/components/ui/skeleton";
import type { SellerProduct } from "@/lib/queries/seller";

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
  const c = useThemeColors();
  const { t } = useTranslation();
  const primaryImage = product.images?.find((i) => i.is_primary) ?? product.images?.[0];
  const statusColor = STATUS_COLOR[product.status] ?? "#9CA3AF";
  const statusLabel = t(`seller.products.status.${product.status}`, { defaultValue: product.status });

  return (
    <Pressable onPress={onEdit} className="flex-row items-center gap-3 bg-white dark:bg-bg-card px-4 py-3">
      <View className="h-16 w-16 overflow-hidden rounded-xl bg-brand-50 dark:bg-[#2A2A2A]">
        {primaryImage ? (
          <Image source={{ uri: primaryImage.url }} style={{ flex: 1 }} contentFit="cover" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <HugeiconsIcon icon={Package01Icon} size={24} color={c.muted} />
          </View>
        )}
      </View>

      <View className="flex-1 gap-0.5">
        <Text variant="semibold" className="text-sm text-brand dark:text-white" numberOfLines={1}>
          {product.name}
        </Text>
        <Text className="text-xs" style={{ color: c.secondary }}>
          JOD {Number(product.price).toFixed(2)} · {t("product.inStock", { count: product.stock })}
        </Text>
        <View className="mt-1 self-start rounded-full px-2 py-0.5" style={{ backgroundColor: statusColor + "20" }}>
          <Text variant="semibold" style={{ color: statusColor, fontSize: 10 }}>{statusLabel}</Text>
        </View>
      </View>

      <View className="flex-row gap-1">
        <Pressable
          onPress={onEdit}
          className="h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: c.brandLight }}
        >
          <HugeiconsIcon icon={Edit02Icon} size={18} color={c.brand} />
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
  const c = useThemeColors();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const { data: products, isLoading, isRefetching, refetch } = useSellerProducts(
    activeFilter === "all" ? undefined : activeFilter
  );
  const deleteProduct = useDeleteProduct();

  const confirmDelete = (product: SellerProduct) => {
    Alert.alert(
      t("seller.products.deleteTitle"),
      `"${product.name}" ${t("seller.products.deleteDesc")}`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => {
            deleteProduct.mutate(product.id, {
              onSuccess: () => toast.success(t("seller.products.toastDeleted")),
              onError: () => toast.error(t("seller.products.toastDeleteError")),
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-6 py-4">
        <Pressable onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={c.brand} />
        </Pressable>
        <Text variant="bold" className="flex-1 text-xl text-brand dark:text-white">{t("seller.products.title")}</Text>
        <Pressable
          onPress={() => router.push("/seller/products/new" as any)}
          className="h-9 w-9 items-center justify-center rounded-xl bg-brand dark:bg-white"
        >
          <HugeiconsIcon icon={Add01Icon} size={20} color={c.isDark ? "#0A0A0A" : "#fff"} />
        </Pressable>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 8, paddingBottom: 12, alignItems: "center" }}
      >
        {FILTERS.map((f) => {
          const label = f === "all" ? t("seller.orderFilters.all") : t(`seller.products.status.${f}`, { defaultValue: f });
          return (
            <Pressable
              key={f}
              onPress={() => setActiveFilter(f)}
              className="rounded-full px-4 py-2"
              style={{
                backgroundColor: activeFilter === f ? c.brand : c.card,
                borderWidth: 1,
                borderColor: activeFilter === f ? c.brand : c.border,
              }}
            >
              <Text
                variant="medium"
                className="text-xs"
                style={{ color: activeFilter === f ? (c.isDark ? "#000" : "#fff") : c.secondary }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View className="flex-1 px-6 pt-4">
          {[0, 1, 2, 3, 4].map((i) => <SkeletonProductRow key={i} />)}
        </View>
      ) : !products?.length ? (
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="flex-1 items-center justify-center px-8 gap-4"
        >
          <View className="h-20 w-20 items-center justify-center rounded-full bg-white dark:bg-bg-card">
            <HugeiconsIcon icon={Package01Icon} size={40} color={c.muted} />
          </View>
          <Text variant="semibold" className="text-center text-base text-brand dark:text-white">{t("seller.products.noProducts")}</Text>
          <Text className="text-center text-sm" style={{ color: c.secondary }}>
            {t("seller.products.noProductsDesc")}
          </Text>
          <Button
            label={t("seller.products.addProduct")}
            onPress={() => router.push("/seller/products/new" as any)}
            size="lg"
          />
        </Animated.View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor="transparent"
              colors={["transparent"]}
              progressBackgroundColor="transparent"
            />
          }
        >
          {isRefetching ? (
            <View style={{ alignItems: "center", paddingVertical: 8 }}>
              <Spinner size={28} strokeWidth={2.5} />
            </View>
          ) : null}
          <View className="mx-6 overflow-hidden rounded-xl">
            {products.map((product, i) => (
              <Animated.View key={product.id} entering={FadeInDown.duration(300).delay(i * 40)}>
                {i > 0 ? <View className="ml-[76px] h-px bg-brand-100 dark:bg-[#2A2A2A]" /> : null}
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
