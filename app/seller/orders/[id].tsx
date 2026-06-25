import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Image } from "expo-image";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Package01Icon,
  Location01Icon,
  User02Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner-native";

import { Text } from "@/components/ui/text";
import { useSellerOrder, useUpdateSellerOrderStatus } from "@/lib/queries/seller";
import { useThemeColors } from "@/lib/theme";
import { Spinner } from "@/components/ui/spinner";

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

// Only transitions the seller can make
const NEXT_ACTION: Record<string, { status: string; label: string }> = {
  pending: { status: "approved", label: "Accept Order" },
  approved: { status: "preparing", label: "Start Preparing" },
  preparing: { status: "ready_for_pickup", label: "Mark as Ready" },
};

export default function SellerOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = useThemeColors();
  const { data: order, isLoading } = useSellerOrder(Number(id));
  const updateStatus = useUpdateSellerOrderStatus();

  const action = order ? NEXT_ACTION[order.status] : null;
  const statusColor = order ? (STATUS_COLOR[order.status] ?? "#9CA3AF") : "#9CA3AF";
  const statusLabel = order ? (STATUS_LABEL[order.status] ?? order.status) : "";

  const handleAction = () => {
    if (!order || !action) return;
    updateStatus.mutate(
      { id: order.id, status: action.status },
      {
        onSuccess: () => toast.success(`Order marked as ${STATUS_LABEL[action.status]}`),
        onError: (err: any) =>
          toast.error(err?.response?.data?.message ?? "Failed to update order"),
      }
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg-light dark:bg-bg-dark">
        <Spinner size={44} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg-light dark:bg-bg-dark">
        <Text style={{ color: c.muted }}>Order not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-row items-center gap-3 px-6 py-4">
        <Pressable onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={c.brand} />
        </Pressable>
        <Text variant="bold" className="flex-1 text-xl text-brand dark:text-white">Order #{order.id}</Text>
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: statusColor + "20" }}
        >
          <Text variant="semibold" style={{ color: statusColor, fontSize: 12 }}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: action ? 100 : 32, gap: 16 }}
      >
        {/* Customer + address */}
        <Animated.View entering={FadeInDown.duration(300)} className="rounded-xl bg-white dark:bg-bg-card p-4">
          <View className="gap-3">
          {order.client ? (
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-50 dark:bg-[#2A2A2A]">
                <HugeiconsIcon icon={User02Icon} size={20} color={c.brand} />
              </View>
              <View className="flex-1">
                <Text variant="semibold" className="text-sm text-brand dark:text-white">{order.client.name}</Text>
                {order.client.phone ? (
                  <Text className="text-xs" style={{ color: c.secondary }}>{order.client.phone}</Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {order.address ? (
            <View className="flex-row items-start gap-3">
              <View className="mt-0.5 h-10 w-10 items-center justify-center rounded-full bg-brand-50 dark:bg-[#2A2A2A]">
                <HugeiconsIcon icon={Location01Icon} size={20} color={c.brand} />
              </View>
              <View className="flex-1">
                <Text variant="semibold" className="text-sm text-brand dark:text-white">
                  {order.address.recipient_name}
                </Text>
                <Text className="text-xs leading-4" style={{ color: c.secondary }}>
                  {order.address.address_line}, {order.address.city}
                </Text>
                {order.address.phone ? (
                  <Text className="text-xs" style={{ color: c.secondary }}>{order.address.phone}</Text>
                ) : null}
              </View>
            </View>
          ) : null}
          </View>
        </Animated.View>

        {/* Items */}
        <Animated.View entering={FadeInDown.duration(300).delay(60)} className="rounded-xl bg-white dark:bg-bg-card p-4">
          <View className="gap-3">
          <Text variant="semibold" className="text-sm text-brand dark:text-white">
            Items ({order.items_count ?? order.items?.length ?? 0})
          </Text>

          {Array.isArray(order.items) && order.items.map((item, i) => (
            <View key={item.id}>
              {i > 0 ? <View className="h-px bg-brand-100 dark:bg-[#2A2A2A] mb-3" /> : null}
              <View className="flex-row items-center gap-3">
                <View className="h-14 w-14 overflow-hidden rounded-xl bg-brand-50 dark:bg-[#2A2A2A]">
                  {item.product_image ? (
                    <Image
                      source={{ uri: item.product_image }}
                      style={{ flex: 1 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <HugeiconsIcon icon={Package01Icon} size={20} color={c.muted} />
                    </View>
                  )}
                </View>
                <View className="flex-1">
                  <Text variant="medium" className="text-sm text-brand dark:text-white" numberOfLines={2}>
                    {item.product_name}
                  </Text>
                  {item.variant_label ? (
                    <Text className="text-xs" style={{ color: c.secondary }}>
                      {item.variant_label}
                    </Text>
                  ) : null}
                  <Text className="text-xs" style={{ color: c.secondary }}>
                    Qty: {item.quantity} · JOD {Number(item.unit_price).toFixed(2)} each
                  </Text>
                </View>
                <Text variant="semibold" className="text-sm text-brand dark:text-white">
                  JOD {Number(item.total).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
          </View>
        </Animated.View>

        {/* Payment summary */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(120)}
          className="rounded-xl bg-white dark:bg-bg-card p-4"
        >
          <View className="gap-2">
          <Text variant="semibold" className="mb-1 text-sm text-brand dark:text-white">Payment</Text>

          <View className="flex-row justify-between">
            <Text className="text-sm" style={{ color: c.secondary }}>Subtotal</Text>
            <Text className="text-sm text-brand dark:text-white">JOD {Number(order.subtotal).toFixed(2)}</Text>
          </View>

          {Number(order.discount) > 0 ? (
            <View className="flex-row justify-between">
              <Text className="text-sm" style={{ color: c.secondary }}>Discount</Text>
              <Text className="text-sm" style={{ color: "#22C55E" }}>
                - JOD {Number(order.discount).toFixed(2)}
              </Text>
            </View>
          ) : null}

          <View className="flex-row justify-between">
            <Text className="text-sm" style={{ color: c.secondary }}>Delivery fee</Text>
            <Text className="text-sm text-brand dark:text-white">JOD {Number(order.delivery_fee).toFixed(2)}</Text>
          </View>

          <View className="mt-1 h-px bg-brand-100 dark:bg-[#2A2A2A]" />

          <View className="flex-row justify-between">
            <Text variant="bold" className="text-sm text-brand dark:text-white">Total</Text>
            <Text variant="bold" className="text-sm text-brand dark:text-white">
              JOD {Number(order.total).toFixed(2)}
            </Text>
          </View>

          <View className="mt-1 flex-row items-center justify-between">
            <Text className="text-xs" style={{ color: c.secondary }}>Payment method</Text>
            <Text
              variant="medium"
              className="text-xs capitalize"
              style={{ color: c.secondary }}
            >
              {order.payment_method?.replace(/_/g, " ") ?? "Cash on Delivery"}
            </Text>
          </View>
          </View>
        </Animated.View>

        {/* Notes */}
        {order.notes ? (
          <Animated.View
            entering={FadeInDown.duration(300).delay(180)}
            className="rounded-xl bg-white dark:bg-bg-card p-4"
          >
            <Text variant="semibold" className="mb-1 text-sm text-brand dark:text-white">Note from customer</Text>
            <Text className="text-sm leading-5" style={{ color: c.secondary }}>{order.notes}</Text>
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* Action button */}
      {action ? (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-brand-100 dark:border-[#2A2A2A] bg-white dark:bg-bg-card px-6 pb-8 pt-4"
        >
          <Pressable
            onPress={handleAction}
            disabled={updateStatus.isPending}
            className="flex-row items-center justify-center gap-2 rounded-xl bg-brand py-4"
            style={{ opacity: updateStatus.isPending ? 0.6 : 1 }}
          >
            {updateStatus.isPending ? (
              <Spinner size={20} color="#fff" trackColor="rgba(255,255,255,0.3)" strokeWidth={2} />
            ) : (
              <HugeiconsIcon icon={Tick01Icon} size={18} color="#fff" />
            )}
            <Text variant="bold" style={{ color: "#fff" }}>{action.label}</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
