import { View, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  ShoppingCart01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

import { useTranslation } from "react-i18next";

import { Text } from "@/components/ui/text";
import { Spinner } from "@/components/ui/spinner";
import { useSellerOrders } from "@/lib/queries/seller";
import { useSellerBadgeStore } from "@/stores/seller-badge-store";
import { useThemeColors } from "@/lib/theme";
import { SkeletonOrderRow } from "@/components/ui/skeleton";
import type { SellerOrder } from "@/lib/queries/seller";

const STATUS_COLOR: Record<string, string> = {
  pending: "#F59E0B",
  approved: "#6366F1",
  preparing: "#3B82F6",
  ready_for_pickup: "#22C55E",
  assigned: "#22C55E",
  out_for_delivery: "#0EA5E9",
  delivered: "#22C55E",
  completed: "#0A0A0A",
  cancelled: "#FF4D4F",
  refunded: "#9CA3AF",
};

const FILTER_KEYS = ["all", "pending", "approved", "preparing", "ready_for_pickup"] as const;

type FilterKey = (typeof FILTER_KEYS)[number];

function OrderCard({ order, onPress }: { order: SellerOrder; onPress: () => void }) {
  const c = useThemeColors();
  const { t } = useTranslation();
  const statusColor = STATUS_COLOR[order.status] ?? "#9CA3AF";
  const statusLabel = t(`seller.orderStatus.${order.status}`, { defaultValue: order.status });

  return (
    <Pressable onPress={onPress} className="bg-white dark:bg-bg-card px-4 py-4">
      <View className="flex-row items-center">
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text variant="bold" className="text-sm text-brand dark:text-white">
              Order #{order.id}
            </Text>
            <View
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: statusColor + "20" }}
            >
              <Text variant="semibold" style={{ color: statusColor, fontSize: 10 }}>
                {statusLabel}
              </Text>
            </View>
          </View>

          <Text className="text-xs" style={{ color: c.secondary }}>
            {order.client?.name ?? t("seller.customer")} · {order.items_count ?? 0} {t("common.items")}
          </Text>

          <Text className="text-xs" style={{ color: c.secondary }}>
            {order.address?.city ?? ""}{order.address?.address_line ? ` · ${order.address.address_line}` : ""}
          </Text>
        </View>

        <View className="items-end gap-1">
          <Text variant="bold" className="text-sm text-brand dark:text-white">
            JOD {Number(order.total).toFixed(2)}
          </Text>
          <Text className="text-xs" style={{ color: c.muted }}>
            {new Date(order.created_at).toLocaleDateString()}
          </Text>
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} color={c.muted} />
        </View>
      </View>
    </Pressable>
  );
}

export default function SellerOrders() {
  const router = useRouter();
  const c = useThemeColors();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  useFocusEffect(useCallback(() => {
    useSellerBadgeStore.getState().reset();
  }, []));

  const { data: orders, isLoading, isRefetching, refetch } = useSellerOrders(
    activeFilter === "all" ? undefined : activeFilter
  );

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-6 py-4">
        <Pressable onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={c.brand} />
        </Pressable>
        <Text variant="bold" className="flex-1 text-xl text-brand dark:text-white">{t("seller.ordersInbox")}</Text>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 8, paddingBottom: 12, alignItems: "center" }}
      >
        {FILTER_KEYS.map((key) => {
          const label = key === "all"
            ? t("seller.orderFilters.all")
            : key === "ready_for_pickup"
            ? t("seller.orderFilters.ready")
            : t(`seller.orderFilters.${key}`, { defaultValue: key });
          return (
            <Pressable
              key={key}
              onPress={() => setActiveFilter(key)}
              className="rounded-full px-4 py-2"
              style={{
                backgroundColor: activeFilter === key ? c.brand : c.card,
                borderWidth: 1,
                borderColor: activeFilter === key ? c.brand : c.border,
              }}
            >
              <Text
                variant="medium"
                className="text-xs"
                style={{ color: activeFilter === key ? (c.isDark ? "#000" : "#fff") : c.secondary }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View className="flex-1 px-6 pt-4">
          {[0, 1, 2, 3, 4].map((i) => <SkeletonOrderRow key={i} />)}
        </View>
      ) : !orders?.length ? (
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="flex-1 items-center justify-center gap-4 px-8"
        >
          <View className="h-20 w-20 items-center justify-center rounded-full bg-white dark:bg-bg-card">
            <HugeiconsIcon icon={ShoppingCart01Icon} size={40} color={c.muted} />
          </View>
          <Text variant="semibold" className="text-center text-base text-brand dark:text-white">
            {t("seller.noOrders")}
          </Text>
          <Text className="text-center text-sm" style={{ color: c.secondary }}>
            {t("seller.noOrdersDesc")}
          </Text>
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
            {orders.map((order, i) => (
              <Animated.View key={order.id} entering={FadeInDown.duration(300).delay(i * 40)}>
                {i > 0 ? <View className="ml-4 h-px bg-brand-100 dark:bg-[#2A2A2A]" /> : null}
                <OrderCard
                  order={order}
                  onPress={() => router.push(`/seller/orders/${order.id}` as any)}
                />
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
