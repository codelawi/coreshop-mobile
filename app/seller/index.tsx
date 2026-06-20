import { View, ScrollView, Pressable, Switch, ActivityIndicator } from "react-native";
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
} from "@hugeicons/core-free-icons";
import { toast } from "sonner-native";

import { Text } from "@/components/ui/text";
import { useSellerStore, useToggleStoreOpen } from "@/lib/queries/seller";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: any;
  color?: string;
}

function StatCard({ label, value, icon, color = "#0A0A0A" }: StatCardProps) {
  return (
    <View className="flex-1 rounded-xl bg-white p-4">
      <View
        className="mb-3 h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: color + "15" }}
      >
        <HugeiconsIcon icon={icon} size={20} color={color} />
      </View>
      <Text variant="bold" className="text-xl text-brand">{value}</Text>
      <Text className="mt-0.5 text-xs" style={{ color: "#6B7280" }}>{label}</Text>
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
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center gap-2 rounded-xl bg-white py-4"
    >
      <View className="relative">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-50">
          <HugeiconsIcon icon={icon} size={24} color="#0A0A0A" />
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
      <Text variant="medium" className="text-xs text-brand">{label}</Text>
    </Pressable>
  );
}

export default function SellerHome() {
  const router = useRouter();
  const { data: store, isLoading } = useSellerStore();
  const toggleOpen = useToggleStoreOpen();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg-light">
        <ActivityIndicator size="large" color="#0A0A0A" />
      </SafeAreaView>
    );
  }

  if (!store) {
    return (
      <SafeAreaView className="flex-1 bg-bg-light">
        <View className="flex-row items-center gap-3 px-6 py-4">
          <Pressable onPress={() => router.back()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#0A0A0A" />
          </Pressable>
          <Text variant="bold" className="text-xl text-brand">Seller Hub</Text>
        </View>

        <Animated.View
          entering={FadeInDown.duration(500)}
          className="flex-1 items-center justify-center px-8"
        >
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-white">
            <HugeiconsIcon icon={Store01Icon} size={48} color="#0A0A0A" />
          </View>
          <Text variant="bold" className="mb-2 text-center text-2xl text-brand">
            Set up your store
          </Text>
          <Text className="mb-8 text-center text-sm leading-5" style={{ color: "#6B7280" }}>
            Start selling on CoreShop by creating your store. It takes just a few minutes.
          </Text>
          <Pressable
            onPress={() => router.push("/seller/setup" as any)}
            className="w-full items-center rounded-xl bg-brand py-4"
          >
            <Text variant="bold" style={{ color: "#fff" }}>Create My Store</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

  const statusColor =
    store.status === "active" ? "#22C55E" :
    store.status === "suspended" ? "#FF4D4F" :
    "#F59E0B";

  const statusLabel =
    store.status === "active" ? "Active" :
    store.status === "suspended" ? "Suspended" :
    store.status === "pending" ? "Pending Review" : "Closed";

  const handleToggleOpen = () => {
    toggleOpen.mutate(undefined, {
      onSuccess: ({ is_open }) => {
        toast.success(is_open ? "Store is now open" : "Store is now closed");
      },
      onError: () => toast.error("Failed to update store"),
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="flex-row items-center gap-3 px-6 py-4">
          <Pressable onPress={() => router.back()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#0A0A0A" />
          </Pressable>
          <Text variant="bold" className="flex-1 text-xl text-brand">Seller Hub</Text>
          <Pressable onPress={() => router.push("/seller/setup" as any)}>
            <HugeiconsIcon icon={Settings02Icon} size={22} color="#0A0A0A" />
          </Pressable>
        </View>

        {/* Store card */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="mx-6 rounded-xl bg-white p-5"
        >
          <View className="flex-row items-center gap-3">
            <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-brand-50">
              <HugeiconsIcon icon={Store01Icon} size={28} color="#0A0A0A" />
            </View>
            <View className="flex-1">
              <Text variant="bold" className="text-base text-brand">{store.name}</Text>
              <View className="mt-1 flex-row items-center gap-1.5">
                <View
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: statusColor }}
                />
                <Text className="text-xs" style={{ color: statusColor }}>{statusLabel}</Text>
              </View>
            </View>
            <View className="items-end gap-1">
              <Text className="text-xs" style={{ color: "#6B7280" }}>
                {store.is_open ? "Open" : "Closed"}
              </Text>
              <Switch
                value={store.is_open}
                onValueChange={handleToggleOpen}
                disabled={store.status !== "active" || toggleOpen.isPending}
                trackColor={{ false: "#E5E7EB", true: "#0A0A0A" }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {store.status === "pending" ? (
            <View className="mt-4 rounded-lg px-3 py-2.5" style={{ backgroundColor: "#FEF3C7" }}>
              <Text className="text-xs" style={{ color: "#92400E" }}>
                Your store is under review. You can set it up while waiting for approval.
              </Text>
            </View>
          ) : null}
        </Animated.View>

        {/* Stats */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(80)}
          className="mx-6 mt-4 flex-row gap-3"
        >
          <StatCard
            label="Products"
            value={store.products_count}
            icon={Package01Icon}
            color="#6366F1"
          />
          <StatCard
            label="Total Sales"
            value={store.sales_count}
            icon={ChartLineData02Icon}
            color="#22C55E"
          />
          <StatCard
            label="Rating"
            value={Number(store.rating).toFixed(1)}
            icon={StarIcon}
            color="#F59E0B"
          />
        </Animated.View>

        {/* Quick actions */}
        <Animated.View entering={FadeInDown.duration(400).delay(160)} className="mx-6 mt-4">
          <Text variant="semibold" className="mb-3 text-sm text-brand">Quick Actions</Text>
          <View className="flex-row gap-3">
            <QuickAction
              icon={Package01Icon}
              label="Products"
              onPress={() => router.push("/seller/products" as any)}
            />
            <QuickAction
              icon={ShoppingCart01Icon}
              label="Orders"
              onPress={() => router.push("/seller/orders" as any)}
              badge={store.pending_orders_count > 0 ? store.pending_orders_count : undefined}
            />
            <QuickAction
              icon={Add01Icon}
              label="Add Product"
              onPress={() => router.push("/seller/products/new" as any)}
            />
          </View>
          <View className="mt-3 flex-row gap-3">
            <QuickAction
              icon={ChartLineData02Icon}
              label="Analytics"
              onPress={() => router.push("/seller/analytics" as any)}
            />
            <QuickAction
              icon={MoneyReceive02Icon}
              label="Payouts"
              onPress={() => router.push("/seller/payouts" as any)}
            />
            <View className="flex-1" />
          </View>
        </Animated.View>

        {/* Store details */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(240)}
          className="mx-6 mt-4 rounded-xl bg-white p-4 gap-3"
        >
          <Text variant="semibold" className="text-sm text-brand">Store Info</Text>
          {store.description ? (
            <Text className="text-sm leading-5" style={{ color: "#374151" }}>{store.description}</Text>
          ) : null}
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-xs" style={{ color: "#6B7280" }}>City</Text>
              <Text variant="medium" className="mt-0.5 text-sm text-brand">
                {store.city ?? "—"}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs" style={{ color: "#6B7280" }}>Delivery radius</Text>
              <Text variant="medium" className="mt-0.5 text-sm text-brand">
                {store.delivery_radius_km} km
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs" style={{ color: "#6B7280" }}>Reviews</Text>
              <Text variant="medium" className="mt-0.5 text-sm text-brand">
                {store.reviews_count}
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
