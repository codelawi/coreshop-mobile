import { View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Tick02Icon,
  Location01Icon,
  DeliveryTruck02Icon,
  Store01Icon,
  CreditCardIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";

import { Text } from "@/components/ui/text";
import { useOrder, useOrderReviewStatus } from "@/lib/queries/orders";

const TIMELINE: Array<{ key: string; label: string }> = [
  { key: "pending", label: "Order placed" },
  { key: "approved", label: "Confirmed by store" },
  { key: "preparing", label: "Being prepared" },
  { key: "ready_for_pickup", label: "Ready for pickup" },
  { key: "assigned", label: "Driver assigned" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Completed" },
];

const CANCELLED_STEPS = ["pending", "cancelled"];

function getTimelineSteps(status: string) {
  if (status === "cancelled" || status === "refunded") {
    return CANCELLED_STEPS.map((key) => ({ key, label: key === "pending" ? "Order placed" : "Cancelled" }));
  }
  const idx = TIMELINE.findIndex((s) => s.key === status);
  return TIMELINE.slice(0, Math.max(idx + 1, 2));
}

export default function OrderDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(Number(id));
  const isReviewable = order?.status === "delivered" || order?.status === "completed";
  const { data: reviewStatus } = useOrderReviewStatus(Number(id), isReviewable);

  if (isLoading || !order) {
    return (
      <SafeAreaView className="flex-1 bg-bg-light">
        <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#0A0A0A" />
          </Pressable>
          <Text variant="bold" className="text-xl text-brand">Order</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0A0A0A" />
        </View>
      </SafeAreaView>
    );
  }

  const isCancelled = order.status === "cancelled" || order.status === "refunded";
  const timelineSteps = getTimelineSteps(order.status);
  const currentStepIdx = timelineSteps.length - 1;

  const subtotal = parseFloat(order.subtotal);
  const discount = parseFloat(order.discount);
  const deliveryFee = parseFloat(order.delivery_fee);
  const total = parseFloat(order.total);

  return (
    <SafeAreaView className="flex-1 bg-bg-light">
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#0A0A0A" />
        </Pressable>
        <View className="flex-1">
          <Text variant="bold" className="text-xl text-brand">Order #{order.id}</Text>
          <Text className="text-xs" style={{ color: "#6B7280" }}>
            {new Date(order.created_at).toLocaleString()}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status timeline */}
        <Animated.View entering={FadeInDown.duration(400)} className="mx-4 mt-2 rounded-md bg-white p-4">
          <Text variant="semibold" className="mb-4 text-sm text-brand">Order Status</Text>
          {timelineSteps.map((step, i) => {
            const isDone = i < currentStepIdx;
            const isCurrent = i === currentStepIdx;
            const isLast = i === timelineSteps.length - 1;
            const dotColor = isCancelled && isCurrent
              ? "#EF4444"
              : isDone || isCurrent
              ? "#0A0A0A"
              : "#E5E7EB";

            return (
              <View key={step.key} className="flex-row gap-3">
                {/* Dot + line */}
                <View className="items-center" style={{ width: 20 }}>
                  <View
                    className="h-5 w-5 items-center justify-center rounded-full"
                    style={{ backgroundColor: dotColor }}
                  >
                    {(isDone || (isCurrent && !isCancelled)) ? (
                      <HugeiconsIcon icon={Tick02Icon} size={11} color="#fff" />
                    ) : null}
                  </View>
                  {!isLast && (
                    <View
                      className="mt-1 w-0.5 flex-1"
                      style={{
                        backgroundColor: isDone ? "#0A0A0A" : "#E5E7EB",
                        minHeight: 24,
                      }}
                    />
                  )}
                </View>

                {/* Label */}
                <View className="flex-1 pb-4">
                  <Text
                    variant={isCurrent ? "semibold" : "medium"}
                    className="text-sm"
                    style={{ color: isCurrent ? (isCancelled ? "#EF4444" : "#0A0A0A") : "#9CA3AF" }}
                  >
                    {step.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </Animated.View>

        {/* Store + address */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)} className="mx-4 mt-3 rounded-md bg-white">
          {order.store && (
            <View className="flex-row items-center gap-3 border-b border-brand-100 p-4">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-50">
                <HugeiconsIcon icon={Store01Icon} size={18} color="#0A0A0A" />
              </View>
              <View className="flex-1">
                <Text className="text-xs" style={{ color: "#6B7280" }}>Store</Text>
                <Text variant="semibold" className="text-sm text-brand">{order.store.name}</Text>
              </View>
            </View>
          )}
          {order.address && (
            <View className="flex-row items-center gap-3 p-4">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-50">
                <HugeiconsIcon icon={Location01Icon} size={18} color="#0A0A0A" />
              </View>
              <View className="flex-1">
                <Text className="text-xs" style={{ color: "#6B7280" }}>Deliver to</Text>
                <Text variant="semibold" className="text-sm text-brand">{order.address.label}</Text>
                <Text className="text-xs" style={{ color: "#6B7280" }}>
                  {order.address.address_line}, {order.address.city}
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(140)} className="mx-4 mt-3">
            <Text variant="semibold" className="mb-2 text-xs uppercase tracking-widest" style={{ color: "#6B7280" }}>
              Items
            </Text>
            <View className="rounded-md bg-white">
              {order.items.map((item, i) => (
                <View
                  key={item.id}
                  className={`flex-row gap-3 p-3 ${i < order.items!.length - 1 ? "border-b border-brand-100" : ""}`}
                >
                  <View className="h-14 w-14 overflow-hidden rounded-md bg-brand-50">
                    {item.product_image ? (
                      <Image source={{ uri: item.product_image }} style={{ flex: 1 }} contentFit="cover" />
                    ) : null}
                  </View>
                  <View className="flex-1">
                    <Text variant="medium" numberOfLines={2} className="text-sm text-brand">
                      {item.product_name}
                    </Text>
                    {item.variant_label ? (
                      <Text className="text-xs" style={{ color: "#6B7280" }}>{item.variant_label}</Text>
                    ) : null}
                    <View className="mt-1 flex-row items-center justify-between">
                      <Text className="text-xs" style={{ color: "#9CA3AF" }}>x{item.quantity}</Text>
                      <Text variant="semibold" className="text-sm text-brand">
                        JOD {parseFloat(item.total).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Payment summary */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} className="mx-4 mt-3">
          <Text variant="semibold" className="mb-2 text-xs uppercase tracking-widest" style={{ color: "#6B7280" }}>
            Payment
          </Text>
          <View className="rounded-md bg-white px-4 py-3">
            <View className="flex-row items-center gap-3 border-b border-brand-100 pb-3">
              <HugeiconsIcon icon={CreditCardIcon} size={18} color="#6B7280" />
              <Text variant="medium" className="flex-1 text-sm text-brand">Cash on Delivery</Text>
            </View>
            <View className="mt-3 gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm" style={{ color: "#6B7280" }}>Subtotal</Text>
                <Text variant="medium" className="text-sm text-brand">JOD {subtotal.toFixed(2)}</Text>
              </View>
              {discount > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-sm" style={{ color: "#6B7280" }}>
                    Discount{order.coupon ? ` (${order.coupon.code})` : ""}
                  </Text>
                  <Text variant="medium" style={{ color: "#22C55E", fontSize: 14 }}>
                    -JOD {discount.toFixed(2)}
                  </Text>
                </View>
              )}
              <View className="flex-row justify-between">
                <Text className="text-sm" style={{ color: "#6B7280" }}>
                  Delivery{order.distance_km ? ` (~${parseFloat(order.distance_km).toFixed(1)} km)` : ""}
                </Text>
                <Text variant="medium" className="text-sm text-brand">JOD {deliveryFee.toFixed(2)}</Text>
              </View>
              <View className="mt-1 flex-row justify-between border-t border-brand-100 pt-2">
                <Text variant="bold" className="text-base text-brand">Total</Text>
                <Text variant="bold" className="text-lg text-brand">JOD {total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Driver placeholder */}
        {(order.status === "assigned" || order.status === "out_for_delivery") && (
          <Animated.View entering={FadeInDown.duration(400).delay(260)} className="mx-4 mt-3 rounded-md bg-white p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-50">
                <HugeiconsIcon icon={DeliveryTruck02Icon} size={18} color="#0A0A0A" />
              </View>
              <View className="flex-1">
                <Text variant="semibold" className="text-sm text-brand">Driver on the way</Text>
                <Text className="text-xs" style={{ color: "#6B7280" }}>Live tracking coming soon</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Review CTA */}
        {isReviewable && (
          <Animated.View entering={FadeInDown.duration(400).delay(300)} className="mx-4 mt-3 mb-2">
            {reviewStatus?.reviewed ? (
              <View className="flex-row items-center gap-3 rounded-xl border border-brand-100 bg-white p-4">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-50">
                  <HugeiconsIcon icon={StarIcon} size={18} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text variant="semibold" className="text-sm text-brand">Review submitted</Text>
                  <View className="mt-1 flex-row gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <HugeiconsIcon
                        key={s}
                        icon={StarIcon}
                        size={12}
                        color={s <= (reviewStatus.rating ?? 0) ? "#F59E0B" : "#E5E7EB"}
                      />
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => router.push(`/review/${order.id}` as any)}
                className="flex-row items-center gap-3 rounded-xl bg-brand p-4"
              >
                <HugeiconsIcon icon={StarIcon} size={20} color="#fff" />
                <View className="flex-1">
                  <Text variant="bold" style={{ color: "#fff" }}>Leave a Review</Text>
                  <Text style={{ color: "#ffffff99", fontSize: 12 }}>
                    Rate your experience with this order
                  </Text>
                </View>
              </Pressable>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
