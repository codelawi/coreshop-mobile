import { View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  ShoppingCart01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

import { Text } from "@/components/ui/text";
import { useSellerOrders } from "@/lib/queries/seller";
import type { SellerOrder } from "@/lib/queries/seller";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  preparing: "Preparing",
  ready_for_pickup: "Ready for Pickup",
  assigned: "Driver Assigned",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

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

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "preparing", label: "Preparing" },
  { key: "ready_for_pickup", label: "Ready" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function OrderCard({ order, onPress }: { order: SellerOrder; onPress: () => void }) {
  const statusColor = STATUS_COLOR[order.status] ?? "#9CA3AF";
  const statusLabel = STATUS_LABEL[order.status] ?? order.status;

  return (
    <Pressable onPress={onPress} className="bg-white px-4 py-4">
      <View className="flex-row items-center">
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text variant="bold" className="text-sm text-brand">
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

          <Text className="text-xs" style={{ color: "#6B7280" }}>
            {order.client?.name ?? "Customer"} · {order.items_count ?? 0} items
          </Text>

          <Text className="text-xs" style={{ color: "#6B7280" }}>
            {order.address?.city ?? ""}{order.address?.address_line ? ` · ${order.address.address_line}` : ""}
          </Text>
        </View>

        <View className="items-end gap-1">
          <Text variant="bold" className="text-sm text-brand">
            JOD {Number(order.total).toFixed(2)}
          </Text>
          <Text className="text-xs" style={{ color: "#9CA3AF" }}>
            {new Date(order.created_at).toLocaleDateString()}
          </Text>
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="#9CA3AF" />
        </View>
      </View>
    </Pressable>
  );
}

export default function SellerOrders() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const { data: orders, isLoading } = useSellerOrders(
    activeFilter === "all" ? undefined : activeFilter
  );

  return (
    <SafeAreaView className="flex-1 bg-bg-light">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-6 py-4">
        <Pressable onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#0A0A0A" />
        </Pressable>
        <Text variant="bold" className="flex-1 text-xl text-brand">Orders Inbox</Text>
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
            key={f.key}
            onPress={() => setActiveFilter(f.key)}
            className="rounded-full px-4 py-2"
            style={{
              backgroundColor: activeFilter === f.key ? "#0A0A0A" : "#fff",
              borderWidth: 1,
              borderColor: activeFilter === f.key ? "#0A0A0A" : "#E5E7EB",
            }}
          >
            <Text
              variant="medium"
              className="text-xs"
              style={{ color: activeFilter === f.key ? "#fff" : "#374151" }}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0A0A0A" />
        </View>
      ) : !orders?.length ? (
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="flex-1 items-center justify-center gap-4 px-8"
        >
          <View className="h-20 w-20 items-center justify-center rounded-full bg-white">
            <HugeiconsIcon icon={ShoppingCart01Icon} size={40} color="#9CA3AF" />
          </View>
          <Text variant="semibold" className="text-center text-base text-brand">
            No orders yet
          </Text>
          <Text className="text-center text-sm" style={{ color: "#6B7280" }}>
            New orders will appear here when customers place them
          </Text>
        </Animated.View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="mx-6 overflow-hidden rounded-xl">
            {orders.map((order, i) => (
              <Animated.View key={order.id} entering={FadeInDown.duration(300).delay(i * 40)}>
                {i > 0 ? <View className="ml-4 h-px bg-brand-100" /> : null}
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
