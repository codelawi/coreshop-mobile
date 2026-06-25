import { View, ScrollView, Pressable, RefreshControl } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon, PackageIcon } from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/lib/queries/orders";
import { useThemeColors } from "@/lib/theme";
import { SkeletonOrderRow } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

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
  const c = useThemeColors();
  const { t } = useTranslation();
  const { data: orders, isLoading, isRefetching, refetch } = useOrders();

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-bg-card"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color={c.brand} />
        </Pressable>
        <Text variant="bold" className="text-xl text-brand dark:text-white">{t("orders.title")}</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 px-6 pt-4">
          {[0, 1, 2, 3, 4].map((i) => <SkeletonOrderRow key={i} />)}
        </View>
      ) : !orders || orders.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-brand-50 dark:bg-[#2A2A2A]">
            <HugeiconsIcon icon={PackageIcon} size={40} color={c.brand} />
          </View>
          <Text variant="bold" className="mt-4 text-lg text-brand dark:text-white">{t("orders.empty")}</Text>
          <Text className="mt-1 text-center text-sm" style={{ color: c.secondary }}>
            {t("orders.emptyDesc")}
          </Text>
          <View className="mt-6 w-full">
            <Button
              label={t("orders.browseProducts")}
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
            <View style={{ alignItems: "center", paddingBottom: 12 }}>
              <Spinner size={28} strokeWidth={2.5} />
            </View>
          ) : null}
          {orders.map((order, i) => {
            const color = STATUS_COLOR[order.status] ?? "#6B7280";
            const label = t(`orders.status.${order.status}`, { defaultValue: order.status });
            const firstItem = order.items?.[0];
            const itemsCount = order.items_count ?? order.items?.length ?? 0;

            return (
              <Animated.View
                key={order.id}
                entering={FadeInUp.duration(400).delay(i * 50)}
              >
                <Pressable
                  onPress={() => router.push(`/orders/${order.id}` as any)}
                  className="mb-3 rounded-md bg-white dark:bg-bg-card p-4"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text variant="semibold" className="text-sm text-brand dark:text-white">
                        {order.store?.name ?? t("orders.detail.order")}
                      </Text>
                      <Text className="mt-0.5 text-xs" style={{ color: c.secondary }}>
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
                      <View className="h-12 w-12 overflow-hidden rounded-md bg-brand-50 dark:bg-[#2A2A2A]">
                        {firstItem.product_image ? (
                          <Image
                            source={{ uri: firstItem.product_image }}
                            style={{ flex: 1 }}
                            contentFit="cover"
                          />
                        ) : null}
                      </View>
                      <View className="flex-1">
                        <Text variant="medium" numberOfLines={1} className="text-sm text-brand dark:text-white">
                          {firstItem.product_name}
                        </Text>
                        {itemsCount > 1 ? (
                          <Text className="text-xs" style={{ color: c.secondary }}>
                            {t("orders.moreItems_other", { count: itemsCount - 1 })}
                          </Text>
                        ) : null}
                      </View>
                      <Text variant="bold" className="text-base text-brand dark:text-white">
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
