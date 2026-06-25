import { View, ScrollView, Pressable, RefreshControl } from "react-native";
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
import { useTranslation } from "react-i18next";

import { Text } from "@/components/ui/text";
import { useOrder, useOrderReviewStatus } from "@/lib/queries/orders";
import { useThemeColors } from "@/lib/theme";
import { Spinner } from "@/components/ui/spinner";

const TIMELINE_KEYS = [
  "pending",
  "approved",
  "preparing",
  "ready_for_pickup",
  "assigned",
  "out_for_delivery",
  "delivered",
  "completed",
];

const CANCELLED_KEYS = ["pending", "cancelled"];

function getTimelineSteps(status: string, t: (key: string) => string) {
  if (status === "cancelled" || status === "refunded") {
    return CANCELLED_KEYS.map((key) => ({
      key,
      label: key === "pending" ? t("orders.timeline.pending") : t("orders.timeline.cancelled"),
    }));
  }
  const idx = TIMELINE_KEYS.indexOf(status);
  return TIMELINE_KEYS.slice(0, Math.max(idx + 1, 2)).map((key) => ({
    key,
    label: t(`orders.timeline.${key}`),
  }));
}

export default function OrderDetail() {
  const router = useRouter();
  const c = useThemeColors();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading, isRefetching, refetch } = useOrder(Number(id));
  const isReviewable = order?.status === "delivered" || order?.status === "completed";
  const { data: reviewStatus } = useOrderReviewStatus(Number(id), isReviewable);

  if (isLoading || !order) {
    return (
      <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
        <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-bg-card"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color={c.brand} />
          </Pressable>
          <Text variant="bold" className="text-xl text-brand dark:text-white">{t("orders.detail.order")}</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Spinner size={44} />
        </View>
      </SafeAreaView>
    );
  }

  const isCancelled = order.status === "cancelled" || order.status === "refunded";
  const timelineSteps = getTimelineSteps(order.status, t);
  const currentStepIdx = timelineSteps.length - 1;

  const subtotal = parseFloat(order.subtotal);
  const discount = parseFloat(order.discount);
  const deliveryFee = parseFloat(order.delivery_fee);
  const total = parseFloat(order.total);

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-bg-card"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color={c.brand} />
        </Pressable>
        <View className="flex-1">
          <Text variant="bold" className="text-xl text-brand dark:text-white">{t("orders.detail.order")} #{order.id}</Text>
          <Text className="text-xs" style={{ color: c.secondary }}>
            {new Date(order.created_at).toLocaleString()}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
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
        {/* Status timeline */}
        <Animated.View entering={FadeInDown.duration(400)} className="mx-4 mt-2 rounded-md bg-white dark:bg-bg-card p-4">
          <Text variant="semibold" className="mb-4 text-sm text-brand dark:text-white">{t("orders.detail.orderStatus")}</Text>
          {timelineSteps.map((step, i) => {
            const isDone = i < currentStepIdx;
            const isCurrent = i === currentStepIdx;
            const isLast = i === timelineSteps.length - 1;
            const dotColor = isCancelled && isCurrent
              ? "#EF4444"
              : isDone || isCurrent
              ? c.brand
              : c.border;

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
                        backgroundColor: isDone ? c.brand : c.border,
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
                    style={{ color: isCurrent ? (isCancelled ? "#EF4444" : c.brand) : c.muted }}
                  >
                    {step.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </Animated.View>

        {/* Store + address */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)} className="mx-4 mt-3 rounded-md bg-white dark:bg-bg-card">
          {order.store && (
            <View className="flex-row items-center gap-3 border-b border-brand-100 dark:border-[#2A2A2A] p-4">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-50 dark:bg-[#2A2A2A]">
                <HugeiconsIcon icon={Store01Icon} size={18} color={c.brand} />
              </View>
              <View className="flex-1">
                <Text className="text-xs" style={{ color: c.secondary }}>{t("orders.detail.store")}</Text>
                <Text variant="semibold" className="text-sm text-brand dark:text-white">{order.store.name}</Text>
              </View>
            </View>
          )}
          {order.address && (
            <View className="flex-row items-center gap-3 p-4">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-50 dark:bg-[#2A2A2A]">
                <HugeiconsIcon icon={Location01Icon} size={18} color={c.brand} />
              </View>
              <View className="flex-1">
                <Text className="text-xs" style={{ color: c.secondary }}>{t("orders.detail.deliverTo")}</Text>
                <Text variant="semibold" className="text-sm text-brand dark:text-white">{order.address.label}</Text>
                <Text className="text-xs" style={{ color: c.secondary }}>
                  {order.address.address_line}, {order.address.city}
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(140)} className="mx-4 mt-3">
            <Text variant="semibold" className="mb-2 text-xs uppercase tracking-widest" style={{ color: c.secondary }}>
              {t("orders.detail.items")}
            </Text>
            <View className="rounded-md bg-white dark:bg-bg-card">
              {order.items.map((item, i) => (
                <View
                  key={item.id}
                  className={`flex-row gap-3 p-3 ${i < order.items!.length - 1 ? "border-b border-brand-100 dark:border-[#2A2A2A]" : ""}`}
                >
                  <View className="h-14 w-14 overflow-hidden rounded-md bg-brand-50 dark:bg-[#2A2A2A]">
                    {item.product_image ? (
                      <Image source={{ uri: item.product_image }} style={{ flex: 1 }} contentFit="cover" />
                    ) : null}
                  </View>
                  <View className="flex-1">
                    <Text variant="medium" numberOfLines={2} className="text-sm text-brand dark:text-white">
                      {item.product_name}
                    </Text>
                    {item.variant_label ? (
                      <Text className="text-xs" style={{ color: c.secondary }}>{item.variant_label}</Text>
                    ) : null}
                    <View className="mt-1 flex-row items-center justify-between">
                      <Text className="text-xs" style={{ color: c.muted }}>x{item.quantity}</Text>
                      <Text variant="semibold" className="text-sm text-brand dark:text-white">
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
          <Text variant="semibold" className="mb-2 text-xs uppercase tracking-widest" style={{ color: c.secondary }}>
            {t("orders.detail.payment")}
          </Text>
          <View className="rounded-md bg-white dark:bg-bg-card px-4 py-3">
            <View className="flex-row items-center gap-3 border-b border-brand-100 dark:border-[#2A2A2A] pb-3">
              <HugeiconsIcon icon={CreditCardIcon} size={18} color={c.secondary} />
              <Text variant="medium" className="flex-1 text-sm text-brand dark:text-white">{t("orders.detail.cashOnDelivery")}</Text>
            </View>
            <View className="mt-3 gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm" style={{ color: c.secondary }}>{t("orders.detail.subtotal")}</Text>
                <Text variant="medium" className="text-sm text-brand dark:text-white">JOD {subtotal.toFixed(2)}</Text>
              </View>
              {discount > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-sm" style={{ color: c.secondary }}>
                    {t("orders.detail.discount")}{order.coupon ? ` (${order.coupon.code})` : ""}
                  </Text>
                  <Text variant="medium" style={{ color: "#22C55E", fontSize: 14 }}>
                    -JOD {discount.toFixed(2)}
                  </Text>
                </View>
              )}
              <View className="flex-row justify-between">
                <Text className="text-sm" style={{ color: c.secondary }}>
                  {t("orders.detail.delivery")}{order.distance_km ? ` (~${parseFloat(order.distance_km).toFixed(1)} km)` : ""}
                </Text>
                <Text variant="medium" className="text-sm text-brand dark:text-white">JOD {deliveryFee.toFixed(2)}</Text>
              </View>
              <View className="mt-1 flex-row justify-between border-t border-brand-100 dark:border-[#2A2A2A] pt-2">
                <Text variant="bold" className="text-base text-brand dark:text-white">{t("orders.detail.total")}</Text>
                <Text variant="bold" className="text-lg text-brand dark:text-white">JOD {total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Driver placeholder */}
        {(order.status === "assigned" || order.status === "out_for_delivery") && (
          <Animated.View entering={FadeInDown.duration(400).delay(260)} className="mx-4 mt-3 rounded-md bg-white dark:bg-bg-card p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-50 dark:bg-[#2A2A2A]">
                <HugeiconsIcon icon={DeliveryTruck02Icon} size={18} color={c.brand} />
              </View>
              <View className="flex-1">
                <Text variant="semibold" className="text-sm text-brand dark:text-white">{t("orders.detail.driverOnTheWay")}</Text>
                <Text className="text-xs" style={{ color: c.secondary }}>{t("orders.detail.liveTracking")}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Review CTA */}
        {isReviewable && (
          <Animated.View entering={FadeInDown.duration(400).delay(300)} className="mx-4 mt-3 mb-2">
            {reviewStatus?.reviewed ? (
              <View className="flex-row items-center gap-3 rounded-xl border border-brand-100 dark:border-[#2A2A2A] bg-white dark:bg-bg-card p-4">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-50 dark:bg-[#2A2A2A]">
                  <HugeiconsIcon icon={StarIcon} size={18} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text variant="semibold" className="text-sm text-brand dark:text-white">{t("orders.detail.reviewSubmitted")}</Text>
                  <View className="mt-1 flex-row gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <HugeiconsIcon
                        key={s}
                        icon={StarIcon}
                        size={12}
                        color={s <= (reviewStatus.rating ?? 0) ? "#F59E0B" : c.border}
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
                  <Text variant="bold" style={{ color: "#fff" }}>{t("orders.detail.leaveReview")}</Text>
                  <Text style={{ color: "#ffffff99", fontSize: 12 }}>
                    {t("orders.detail.rateExperience")}
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
