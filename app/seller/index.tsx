import { View, ScrollView, Pressable, Switch, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Store01Icon,
  Package01Icon,
  ShoppingCart01Icon,
  ChartLineData02Icon,
  ArrowLeft01Icon,
  Add01Icon,
  Settings02Icon,
  StarIcon,
  MoneyReceive02Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner-native";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useSellerStore, useToggleStoreOpen } from "@/lib/queries/seller";
import { useThemeColors } from "@/lib/theme";
import { Spinner } from "@/components/ui/spinner";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: any;
  color?: string;
}

function StatCard({ label, value, icon, color = "#0A0A0A" }: StatCardProps) {
  const c = useThemeColors();
  return (
    <View className="flex-1 rounded-xl bg-white dark:bg-bg-card p-4">
      <View
        className="mb-3 h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: color + "15" }}
      >
        <HugeiconsIcon icon={icon} size={20} color={color} />
      </View>
      <Text variant="bold" className="text-xl text-brand dark:text-white">{value}</Text>
      <Text className="mt-0.5 text-xs" style={{ color: c.secondary }}>{label}</Text>
    </View>
  );
}

interface QuickActionProps {
  icon: any;
  label: string;
  onPress: () => void;
  badge?: number;
}

function QuickAction({ icon, label, onPress, badge }: QuickActionProps) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center gap-2 rounded-xl bg-white dark:bg-bg-card py-4"
    >
      <View className="relative">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-50 dark:bg-[#2A2A2A]">
          <HugeiconsIcon icon={icon} size={24} color={c.brand} />
        </View>
        {badge ? (
          <View
            className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full"
            style={{ backgroundColor: "#FF4D4F" }}
          >
            <Text variant="bold" style={{ color: "#fff", fontSize: 10 }}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text variant="medium" className="text-xs text-brand dark:text-white">{label}</Text>
    </Pressable>
  );
}

export default function SellerHome() {
  const router = useRouter();
  const c = useThemeColors();
  const { t } = useTranslation();
  const { data: store, isLoading, isRefetching, refetch } = useSellerStore();
  const toggleOpen = useToggleStoreOpen();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg-light dark:bg-bg-dark">
        <Spinner size={44} />
      </SafeAreaView>
    );
  }

  if (!store) {
    return (
      <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
        <View className="flex-row items-center gap-3 px-6 py-4">
          <Pressable onPress={() => router.back()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={c.brand} />
          </Pressable>
          <Text variant="bold" className="text-xl text-brand dark:text-white">{t("seller.hub")}</Text>
        </View>

        <Animated.View
          entering={FadeInDown.duration(500)}
          className="flex-1 items-center justify-center px-8"
        >
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-white dark:bg-bg-card">
            <HugeiconsIcon icon={Store01Icon} size={48} color={c.brand} />
          </View>
          <Text variant="bold" className="mb-2 text-center text-2xl text-brand dark:text-white">
            {t("seller.setupTitle")}
          </Text>
          <Text className="mb-8 text-center text-sm leading-5" style={{ color: c.secondary }}>
            {t("seller.setupDesc")}
          </Text>
          <Button
            label={t("seller.createStore")}
            onPress={() => router.push("/seller/setup" as any)}
            fullWidth
            size="lg"
          />
        </Animated.View>
      </SafeAreaView>
    );
  }

  if (store.status === "pending") {
    return (
      <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={c.brand}
              colors={[c.brand]}
            />
          }
        >
          {/* Header */}
          <View className="flex-row items-center gap-3 px-6 py-4">
            <Pressable onPress={() => router.back()}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={c.brand} />
            </Pressable>
            <Text variant="bold" className="flex-1 text-xl text-brand dark:text-white">
              {t("seller.hub")}
            </Text>
            <Pressable onPress={() => router.push("/seller/setup" as any)}>
              <HugeiconsIcon icon={Settings02Icon} size={22} color={c.brand} />
            </Pressable>
          </View>

          <Animated.View
            entering={FadeInDown.duration(500)}
            className="flex-1 items-center justify-center px-8 py-16"
          >
            {/* Animated clock icon in amber ring */}
            <View className="mb-8 items-center justify-center">
              <View
                className="h-32 w-32 items-center justify-center rounded-full"
                style={{ backgroundColor: "#FEF3C7" }}
              >
                <View
                  className="h-24 w-24 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#FDE68A" }}
                >
                  <HugeiconsIcon icon={Clock01Icon} size={48} color="#D97706" />
                </View>
              </View>
            </View>

            <Text variant="bold" className="mb-3 text-center text-2xl text-brand dark:text-white">
              {t("seller.pending.title")}
            </Text>

            {/* Store name chip */}
            <View
              className="mb-5 flex-row items-center gap-2 rounded-full px-4 py-2"
              style={{ backgroundColor: c.card }}
            >
              <HugeiconsIcon icon={Store01Icon} size={16} color={c.secondary} />
              <Text variant="medium" className="text-sm text-brand dark:text-white">
                {store.name}
              </Text>
            </View>

            <Text className="mb-8 text-center text-sm leading-6" style={{ color: c.secondary }}>
              {t("seller.pending.desc")}
            </Text>

            {/* Status badge */}
            <View
              className="mb-8 rounded-full px-5 py-2"
              style={{ backgroundColor: "#FEF3C7" }}
            >
              <Text variant="semibold" style={{ color: "#D97706", fontSize: 13 }}>
                {t("seller.status.pending")}
              </Text>
            </View>

            <View className="w-full gap-3">
              <Button
                label={t("seller.pending.editInfo")}
                variant="outline"
                onPress={() => router.push("/seller/setup" as any)}
                fullWidth
                size="lg"
              />
              <Button
                label={t("seller.pending.goHome")}
                onPress={() => router.replace("/(tabs)/home" as any)}
                fullWidth
                size="lg"
              />
            </View>

            <Text className="mt-6 text-center text-xs" style={{ color: c.muted }}>
              {t("seller.pending.hint")}
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const statusColor =
    store.status === "active" ? "#22C55E" :
    store.status === "suspended" ? "#FF4D4F" :
    "#F59E0B";

  const statusLabel =
    store.status === "active" ? t("seller.status.active") :
    store.status === "suspended" ? t("seller.status.suspended") :
    t("seller.status.closed");

  const handleToggleOpen = () => {
    toggleOpen.mutate(undefined, {
      onSuccess: ({ is_open }) => {
        toast.success(is_open ? t("seller.storeNowOpen") : t("seller.storeNowClosed"));
      },
      onError: () => toast.error(t("seller.updateStoreFailed")),
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
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
          <View style={{ alignItems: "center", paddingBottom: 8 }}>
            <Spinner size={28} strokeWidth={2.5} />
          </View>
        ) : null}
        {/* Header */}
        <View className="flex-row items-center gap-3 px-6 py-4">
          <Pressable onPress={() => router.back()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={c.brand} />
          </Pressable>
          <Text variant="bold" className="flex-1 text-xl text-brand dark:text-white">{t("seller.hub")}</Text>
          <Pressable onPress={() => router.push("/seller/setup" as any)}>
            <HugeiconsIcon icon={Settings02Icon} size={22} color={c.brand} />
          </Pressable>
        </View>

        {/* Store card */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="mx-6 rounded-xl bg-white dark:bg-bg-card p-5"
        >
          <View className="flex-row items-center gap-3">
            <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-brand-50 dark:bg-[#2A2A2A]">
              <HugeiconsIcon icon={Store01Icon} size={28} color={c.brand} />
            </View>
            <View className="flex-1">
              <Text variant="bold" className="text-base text-brand dark:text-white">{store.name}</Text>
              <View className="mt-1 flex-row items-center gap-1.5">
                <View
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: statusColor }}
                />
                <Text className="text-xs" style={{ color: statusColor }}>{statusLabel}</Text>
              </View>
            </View>
            <View className="items-end gap-1">
              <Text className="text-xs" style={{ color: c.secondary }}>
                {store.is_open ? t("seller.storeOpen") : t("seller.storeClosed")}
              </Text>
              <Switch
                value={store.is_open}
                onValueChange={handleToggleOpen}
                disabled={store.status !== "active" || toggleOpen.isPending}
                trackColor={{ false: c.border, true: c.brand }}
                thumbColor="#fff"
              />
            </View>
          </View>

        </Animated.View>

        {/* Stats */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(80)}
          className="mx-6 mt-4 flex-row gap-3"
        >
          <StatCard
            label={t("seller.stats.products")}
            value={store.products_count}
            icon={Package01Icon}
            color="#6366F1"
          />
          <StatCard
            label={t("seller.stats.totalSales")}
            value={store.sales_count}
            icon={ChartLineData02Icon}
            color="#22C55E"
          />
          <StatCard
            label={t("seller.stats.rating")}
            value={Number(store.rating).toFixed(1)}
            icon={StarIcon}
            color="#F59E0B"
          />
        </Animated.View>

        {/* Quick actions */}
        <Animated.View entering={FadeInDown.duration(400).delay(160)} className="mx-6 mt-4">
          <Text variant="semibold" className="mb-3 text-sm text-brand dark:text-white">{t("seller.actions.products")}</Text>
          <View className="flex-row gap-3">
            <QuickAction
              icon={Package01Icon}
              label={t("seller.actions.products")}
              onPress={() => router.push("/seller/products" as any)}
            />
            <QuickAction
              icon={ShoppingCart01Icon}
              label={t("seller.actions.orders")}
              onPress={() => router.push("/seller/orders" as any)}
              badge={store.pending_orders_count > 0 ? store.pending_orders_count : undefined}
            />
            <QuickAction
              icon={Add01Icon}
              label={t("seller.actions.addProduct")}
              onPress={() => router.push("/seller/products/new" as any)}
            />
          </View>
          <View className="mt-3 flex-row gap-3">
            <QuickAction
              icon={ChartLineData02Icon}
              label={t("seller.actions.analytics")}
              onPress={() => router.push("/seller/analytics" as any)}
            />
            <QuickAction
              icon={MoneyReceive02Icon}
              label={t("seller.actions.payouts")}
              onPress={() => router.push("/seller/payouts" as any)}
            />
            <View className="flex-1" />
          </View>
        </Animated.View>

        {/* Store details */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(240)}
          className="mx-6 mt-4 rounded-xl bg-white dark:bg-bg-card p-4 gap-3"
        >
          <Text variant="semibold" className="text-sm text-brand dark:text-white">{t("seller.storeInfo")}</Text>
          {store.description ? (
            <Text className="text-sm leading-5" style={{ color: c.secondary }}>{store.description}</Text>
          ) : null}
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-xs" style={{ color: c.secondary }}>{t("seller.city")}</Text>
              <Text variant="medium" className="mt-0.5 text-sm text-brand dark:text-white">
                {store.city ?? "—"}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs" style={{ color: c.secondary }}>{t("seller.deliveryRadius")}</Text>
              <Text variant="medium" className="mt-0.5 text-sm text-brand dark:text-white">
                {store.delivery_radius_km} km
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs" style={{ color: c.secondary }}>{t("seller.reviews")}</Text>
              <Text variant="medium" className="mt-0.5 text-sm text-brand dark:text-white">
                {store.reviews_count}
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
