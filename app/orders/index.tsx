import { View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon, PackageIcon } from "@hugeicons/core-free-icons";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/lib/queries/orders";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  preparing: "Preparing",
  ready_for_pickup: "Ready",
  assigned: "Driver assigned",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "#F59E0B",
  approved: "#3B82F6",
  preparing: "#8B5CF6",
  ready_for_pickup: "#06B6D4",
  assigned: "#0EA5E9",
  out_for_delivery: "#10B981",
  delivered: "#22C55E",
  completed: "#22C55E",
  cancelled: "#EF4444",
  refunded: "#6B7280",
};

export default function OrdersList() {
  const router = useRouter();
  const { data: orders, isLoading } = useOrders();

  return (
    <SafeAreaView className="flex-1 bg-bg-light">
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#0A0A0A" />
        </Pressable>
        <Text variant="bold" className="text-xl text-brand">My Orders</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0A0A0A" />
        </View>
      ) : !orders || orders.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-brand-50">
            <HugeiconsIcon icon={PackageIcon} size={40} color="#0A0A0A" />
          </View>
          <Text variant="bold" className="mt-4 text-lg text-brand">No orders yet</Text>
          <Text className="mt-1 text-center text-sm" style={{ color: "#6B7280" }}>
            Start shopping to place your first order
          </Text>
          <View className="mt-6 w-full">
            <Button
              label="Browse Products"
              onPress={() => router.push("/(tabs)/home" as any)}
              fullWidth
              size="lg"
            />
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {orders.map((order, i) => {
            const color = STATUS_COLOR[order.status] ?? "#6B7280";
            const label = STATUS_LABEL[order.status] ?? order.status;
            const firstItem = order.items?.[0];
            const itemsCount = order.items_count ?? order.items?.length ?? 0;

            return (
              <Animated.View
                key={order.id}
                entering={FadeInUp.duration(400).delay(i * 50)}
              >
                <Pressable
                  onPress={() => router.push(`/orders/${order.id}` as any)}
                  className="mb-3 rounded-md bg-white p-4"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text variant="semibold" className="text-sm text-brand">
                        {order.store?.name ?? "Order"}
                      </Text>
                      <Text className="mt-0.5 text-xs" style={{ color: "#6B7280" }}>
                        #{order.id} · {new Date(order.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View
                      className="rounded-full px-2.5 py-1"
                      style={{ backgroundColor: `${color}18` }}
                    >
                      <Text variant="semibold" style={{ color, fontSize: 11 }}>
                        {label}
                      </Text>
                    </View>
                  </View>

                  {firstItem && (
                    <View className="mt-3 flex-row items-center gap-3">
                      <View className="h-12 w-12 overflow-hidden rounded-md bg-brand-50">
                        {firstItem.product_image ? (
                          <Image
                            source={{ uri: firstItem.product_image }}
                            style={{ flex: 1 }}
                            contentFit="cover"
                          />
                        ) : null}
                      </View>
                      <View className="flex-1">
                        <Text variant="medium" numberOfLines={1} className="text-sm text-brand">
                          {firstItem.product_name}
                        </Text>
                        {itemsCount > 1 ? (
                          <Text className="text-xs" style={{ color: "#6B7280" }}>
                            +{itemsCount - 1} more item{itemsCount > 2 ? "s" : ""}
                          </Text>
                        ) : null}
                      </View>
                      <Text variant="bold" className="text-base text-brand">
                        JOD {parseFloat(order.total).toFixed(2)}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
