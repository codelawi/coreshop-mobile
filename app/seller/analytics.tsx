import { View, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Image } from "expo-image";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  ChartLineData02Icon,
  Package01Icon,
  ShoppingCart01Icon,
  MoneyReceive02Icon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons";

import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/lib/theme";
import { Spinner } from "@/components/ui/spinner";
import {
  useSellerAnalyticsOverview,
  useSellerRevenue,
  useSellerTopProducts,
} from "@/lib/queries/seller";

function StatCard({
  label,
  value,
  sub,
  icon,
  color = "#0A0A0A",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: any;
  color?: string;
}) {
  const c = useThemeColors();
  return (
    <View className="flex-1 rounded-xl bg-white dark:bg-bg-card p-4">
      <View
        className="mb-3 h-9 w-9 items-center justify-center rounded-lg"
        style={{ backgroundColor: color + "15" }}
      >
        <HugeiconsIcon icon={icon} size={18} color={color} />
      </View>
      <Text variant="bold" className="text-lg text-brand dark:text-white">{value}</Text>
      <Text className="mt-0.5 text-xs" style={{ color: c.secondary }}>{label}</Text>
      {sub ? (
        <Text className="mt-1 text-xs" style={{ color: c.muted }}>{sub}</Text>
      ) : null}
    </View>
  );
}

function RevenueBar({ point, maxRevenue }: { point: { date: string; revenue: number; orders: number }; maxRevenue: number }) {
  const c = useThemeColors();
  const { i18n } = useTranslation();
  const heightPct = maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0;
  const day = new Date(point.date).toLocaleDateString(i18n.language, { weekday: "short" }).slice(0, 2);

  return (
    <View className="flex-1 items-center gap-1">
      <View className="w-full items-center justify-end" style={{ height: 80 }}>
        <View
          className="w-full rounded-t-sm"
          style={{
            height: Math.max(heightPct * 0.8, point.revenue > 0 ? 3 : 1),
            backgroundColor: point.revenue > 0 ? c.brand : c.border,
          }}
        />
      </View>
      <Text style={{ color: c.muted, fontSize: 9 }}>{day}</Text>
    </View>
  );
}

export default function SellerAnalytics() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const c = useThemeColors();
  const { data: overview, isLoading: overviewLoading, isRefetching: overviewRefetching, refetch: refetchOverview } = useSellerAnalyticsOverview();
  const { data: revenue, isLoading: revenueLoading, isRefetching: revenueRefetching, refetch: refetchRevenue } = useSellerRevenue();
  const { data: topProducts, isLoading: topLoading, isRefetching: topRefetching, refetch: refetchTop } = useSellerTopProducts();
  const isRefetching = overviewRefetching || revenueRefetching || topRefetching;
  const refetch = () => { refetchOverview(); refetchRevenue(); refetchTop(); };

  const isLoading = overviewLoading || revenueLoading || topLoading;

  const revenueSlice = revenue?.slice(-14) ?? [];
  const maxRevenue = Math.max(...revenueSlice.map((p) => p.revenue), 0.01);

  const monthGrowth =
    overview && overview.last_month_revenue > 0
      ? (((overview.this_month_revenue - overview.last_month_revenue) / overview.last_month_revenue) * 100).toFixed(1)
      : null;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg-light dark:bg-bg-dark">
        <Spinner size={44} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-row items-center gap-3 px-6 py-4">
        <Pressable onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={c.brand} />
        </Pressable>
        <Text variant="bold" className="flex-1 text-xl text-brand dark:text-white">{t("seller.analytics.title")}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, gap: 16 }}
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
          <View style={{ alignItems: "center", paddingBottom: 4 }}>
            <Spinner size={28} strokeWidth={2.5} />
          </View>
        ) : null}
        {/* Top stats */}
        <Animated.View entering={FadeInDown.duration(300)} className="flex-row gap-3">
          <StatCard
            label={t("seller.analytics.totalRevenue")}
            value={`JOD ${(overview?.total_revenue ?? 0).toFixed(2)}`}
            sub={t("seller.analytics.allTime")}
            icon={MoneyReceive02Icon}
            color="#22C55E"
          />
          <StatCard
            label={t("seller.analytics.thisMonth")}
            value={`JOD ${(overview?.this_month_revenue ?? 0).toFixed(2)}`}
            sub={
              monthGrowth !== null
                ? t("seller.analytics.vsLastMonth", { pct: `${Number(monthGrowth) >= 0 ? "+" : ""}${monthGrowth}` })
                : undefined
            }
            icon={ArrowUp01Icon}
            color="#6366F1"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(300).delay(60)} className="flex-row gap-3">
          <StatCard
            label={t("seller.analytics.totalOrders")}
            value={String(overview?.total_orders ?? 0)}
            sub={t("seller.analytics.pendingOrders", { count: overview?.pending_orders ?? 0 })}
            icon={ShoppingCart01Icon}
            color="#F59E0B"
          />
          <StatCard
            label={t("seller.analytics.avgOrderValue")}
            value={`JOD ${(overview?.avg_order_value ?? 0).toFixed(2)}`}
            sub={t("seller.analytics.completedOrders", { count: overview?.completed_orders ?? 0 })}
            icon={ChartLineData02Icon}
            color="#0EA5E9"
          />
        </Animated.View>

        {/* Revenue chart */}
        <Animated.View entering={FadeInDown.duration(300).delay(120)} className="rounded-xl bg-white dark:bg-bg-card p-4">
          <Text variant="semibold" className="mb-4 text-sm text-brand dark:text-white">{t("seller.analytics.last14Days")}</Text>

          {revenueSlice.every((p) => p.revenue === 0) ? (
            <View className="items-center py-6">
              <Text className="text-sm" style={{ color: c.muted }}>
                {t("seller.analytics.noOrdersYet")}
              </Text>
            </View>
          ) : (
            <View className="flex-row gap-0.5">
              {revenueSlice.map((point, i) => (
                <RevenueBar key={i} point={point} maxRevenue={maxRevenue} />
              ))}
            </View>
          )}

          <View className="mt-3 flex-row justify-between">
            <Text style={{ color: c.muted, fontSize: 10 }}>
              {revenueSlice[0]?.date
                ? new Date(revenueSlice[0].date).toLocaleDateString(i18n.language, { month: "short", day: "numeric" })
                : ""}
            </Text>
            <Text style={{ color: c.muted, fontSize: 10 }}>
              {revenueSlice[revenueSlice.length - 1]?.date
                ? new Date(revenueSlice[revenueSlice.length - 1].date).toLocaleDateString(i18n.language, { month: "short", day: "numeric" })
                : ""}
            </Text>
          </View>
        </Animated.View>

        {/* Top products */}
        <Animated.View entering={FadeInDown.duration(300).delay(180)} className="rounded-xl bg-white dark:bg-bg-card p-4">
          <Text variant="semibold" className="mb-3 text-sm text-brand dark:text-white">{t("seller.analytics.topProducts")}</Text>

          {!topProducts?.length ? (
            <View className="items-center py-6">
              <Text className="text-sm" style={{ color: c.muted }}>{t("seller.analytics.noSalesData")}</Text>
            </View>
          ) : (
            <View className="gap-3">
              {topProducts.map((product, i) => (
                <View key={product.product_id} className="flex-row items-center gap-3">
                  <Text variant="bold" style={{ color: c.border, width: 18, fontSize: 13 }}>
                    {i + 1}
                  </Text>
                  <View className="h-10 w-10 overflow-hidden rounded-lg bg-brand-50 dark:bg-[#2A2A2A]">
                    {product.image ? (
                      <Image
                        source={{ uri: product.image }}
                        style={{ flex: 1 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="flex-1 items-center justify-center">
                        <HugeiconsIcon icon={Package01Icon} size={16} color={c.muted} />
                      </View>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text variant="medium" className="text-sm text-brand dark:text-white" numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text className="text-xs" style={{ color: c.secondary }}>
                      {t("seller.analytics.unitsSold", { count: product.units_sold })}
                    </Text>
                  </View>
                  <Text variant="semibold" className="text-sm text-brand dark:text-white">
                    JOD {product.revenue.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
