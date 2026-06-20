import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  MoneyReceive02Icon,
  BankIcon,
  Invoice03Icon,
  LockIcon,
} from "@hugeicons/core-free-icons";

import { Text } from "@/components/ui/text";
import { useSellerAnalyticsOverview } from "@/lib/queries/seller";

export default function SellerPayouts() {
  const router = useRouter();
  const { data: overview } = useSellerAnalyticsOverview();

  const totalRevenue = overview?.total_revenue ?? 0;
  // Platform fee is 10% — seller earns 90%
  const platformFee = totalRevenue * 0.1;
  const netEarnings = totalRevenue - platformFee;

  return (
    <SafeAreaView className="flex-1 bg-bg-light">
      <View className="flex-row items-center gap-3 px-6 py-4">
        <Pressable onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#0A0A0A" />
        </Pressable>
        <Text variant="bold" className="flex-1 text-xl text-brand">Payouts</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, gap: 16 }}
      >
        {/* Balance card */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="rounded-2xl bg-brand p-6"
        >
          <Text className="mb-1 text-xs" style={{ color: "#9CA3AF" }}>Available balance</Text>
          <Text variant="bold" style={{ color: "#fff", fontSize: 36 }}>
            JOD {netEarnings.toFixed(2)}
          </Text>
          <View className="mt-4 flex-row gap-4">
            <View className="flex-1">
              <Text style={{ color: "#9CA3AF", fontSize: 11 }}>Gross sales</Text>
              <Text variant="semibold" style={{ color: "#fff", fontSize: 14 }}>
                JOD {totalRevenue.toFixed(2)}
              </Text>
            </View>
            <View className="flex-1">
              <Text style={{ color: "#9CA3AF", fontSize: 11 }}>Platform fee (10%)</Text>
              <Text variant="semibold" style={{ color: "#fff", fontSize: 14 }}>
                - JOD {platformFee.toFixed(2)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Withdraw button — coming soon */}
        <Animated.View entering={FadeInDown.duration(400).delay(60)}>
          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-xl py-4"
            style={{ backgroundColor: "#F3F4F6" }}
            disabled
          >
            <HugeiconsIcon icon={LockIcon} size={16} color="#9CA3AF" />
            <Text variant="semibold" style={{ color: "#9CA3AF" }}>Withdraw — Coming Soon</Text>
          </Pressable>
        </Animated.View>

        {/* Coming soon notice */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(120)}
          className="rounded-xl border p-4"
          style={{ borderColor: "#E5E7EB", backgroundColor: "#FAFAFA" }}
        >
          <View className="flex-row items-start gap-3">
            <View
              className="mt-0.5 h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: "#F59E0B15" }}
            >
              <HugeiconsIcon icon={BankIcon} size={18} color="#F59E0B" />
            </View>
            <View className="flex-1">
              <Text variant="semibold" className="text-sm text-brand">Bank payouts coming soon</Text>
              <Text className="mt-1 text-xs leading-4" style={{ color: "#6B7280" }}>
                We're working on direct bank transfers. Once live, you'll be able to withdraw
                your earnings to any Jordanian bank account or CliQ.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Payout history — empty placeholder */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(180)}
          className="rounded-xl bg-white p-4"
        >
          <Text variant="semibold" className="mb-4 text-sm text-brand">Payout History</Text>
          <View className="items-center py-8 gap-2">
            <View
              className="h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: "#F3F4F6" }}
            >
              <HugeiconsIcon icon={Invoice03Icon} size={28} color="#D1D5DB" />
            </View>
            <Text className="mt-1 text-sm" style={{ color: "#9CA3AF" }}>No payouts yet</Text>
            <Text className="text-xs text-center" style={{ color: "#D1D5DB" }}>
              Your payout history will appear here
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
