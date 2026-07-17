import { useEffect } from "react";
import { View, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Notifications from "expo-notifications";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Notification03Icon,
  Tick02Icon,
  ShoppingBag01Icon,
  DeliveryTruck02Icon,
  CustomerSupportIcon,
  PercentCircleIcon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/ui/text";
import { Spinner } from "@/components/ui/spinner";
import { useThemeColors } from "@/lib/theme";
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  type AppNotification,
} from "@/lib/queries/notifications";

type IconType = typeof Notification03Icon;
const TYPE_ICON: Record<string, IconType> = {
  order_status: DeliveryTruck02Icon,
  new_order: ShoppingBag01Icon,
  promo: PercentCircleIcon,
  system: Notification03Icon,
  support_message: CustomerSupportIcon,
};

function useTimeAgo() {
  const { t } = useTranslation();
  return (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) { return t("notifications.justNow"); }
    if (mins < 60) { return t("notifications.minutesAgo", { count: mins }); }
    const hours = Math.floor(mins / 60);
    if (hours < 24) { return t("notifications.hoursAgo", { count: hours }); }
    const days = Math.floor(hours / 24);
    return t("notifications.daysAgo", { count: days });
  };
}

function NotificationRow({
  notif,
  onPress,
}: {
  notif: AppNotification;
  onPress: () => void;
}) {
  const c = useThemeColors();
  const timeAgo = useTimeAgo();
  const isUnread = !notif.read_at;
  const IconComponent = TYPE_ICON[notif.type] ?? Notification03Icon;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-start gap-3 px-4 py-3.5"
      style={{ backgroundColor: isUnread ? (c.isDark ? "#1E1E1E" : "#F8F8F8") : undefined }}
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: c.brandLight }}
      >
        <HugeiconsIcon icon={IconComponent} size={22} color={c.brand} />
      </View>

      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center justify-between">
          <Text
            variant={isUnread ? "semibold" : "medium"}
            className="flex-1 text-sm text-brand dark:text-white"
            numberOfLines={1}
          >
            {notif.title}
          </Text>
          <Text className="ml-2 text-xs" style={{ color: c.muted }}>
            {timeAgo(notif.created_at)}
          </Text>
        </View>
        <Text className="text-xs leading-4" style={{ color: c.secondary }} numberOfLines={2}>
          {notif.body}
        </Text>
      </View>

      {isUnread ? (
        <View className="mt-1 h-2 w-2 rounded-full" style={{ backgroundColor: "#FF4D4F" }} />
      ) : null}
    </Pressable>
  );
}

export default function Notifications() {
  const router = useRouter();
  const c = useThemeColors();
  const { t } = useTranslation();
  const { data: notifications = [], isLoading, isRefetching, refetch } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  useEffect(() => {
    markAllRead.mutate();
    void Notifications.setBadgeCountAsync(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasUnread = notifications.some((n) => !n.read_at);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayNotifs = notifications.filter(
    (n) => new Date(n.created_at) >= today
  );
  const earlierNotifs = notifications.filter(
    (n) => new Date(n.created_at) < today
  );

  const handlePress = (notif: AppNotification) => {
    if (!notif.read_at) {
      markRead.mutate(notif.id);
    }
    if (notif.data?.order_id) {
      if (notif.type === "new_order") {
        router.push("/seller/orders" as any);
      } else {
        router.push(`/orders/${notif.data.order_id}` as any);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={["top"]}>
      <View className="flex-row items-center gap-3 px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-bg-card"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color={c.brand} />
        </Pressable>
        <Text variant="bold" className="flex-1 text-xl text-brand dark:text-white">
          {t("notifications.title")}
        </Text>
        {hasUnread ? (
          <Pressable
            onPress={() => markAllRead.mutate()}
            hitSlop={6}
            className="flex-row items-center gap-1"
          >
            <HugeiconsIcon icon={Tick02Icon} size={16} color={c.secondary} />
            <Text variant="medium" className="text-sm" style={{ color: c.secondary }}>
              {t("notifications.markAllRead")}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Spinner size={44} />
        </View>
      ) : notifications.length === 0 ? (
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="flex-1 items-center justify-center gap-4 px-8"
        >
          <View
            className="h-20 w-20 items-center justify-center rounded-full bg-white dark:bg-bg-card"
          >
            <HugeiconsIcon icon={Notification03Icon} size={36} color={c.border} />
          </View>
          <Text variant="bold" className="text-center text-xl text-brand dark:text-white">
            {t("notifications.empty")}
          </Text>
          <Text className="text-center text-sm leading-5" style={{ color: c.secondary }}>
            {t("notifications.emptyDesc")}
          </Text>
        </Animated.View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#0A0A0A"
              colors={["#0A0A0A"]}
            />
          }
        >

          {todayNotifs.length > 0 ? (
            <View>
              <Text
                variant="semibold"
                className="px-4 pb-1 pt-3 text-xs uppercase tracking-widest"
                style={{ color: c.secondary }}
              >
                {t("notifications.today")}
              </Text>
              <View className="mx-4 overflow-hidden rounded-xl bg-white dark:bg-bg-card">
                {todayNotifs.map((n, i) => (
                  <Animated.View
                    key={n.id}
                    entering={FadeInDown.duration(300).delay(i * 40)}
                  >
                    {i > 0 ? (
                      <View className="ml-[64px] h-px bg-brand-100 dark:bg-[#2A2A2A]" />
                    ) : null}
                    <NotificationRow notif={n} onPress={() => handlePress(n)} />
                  </Animated.View>
                ))}
              </View>
            </View>
          ) : null}

          {earlierNotifs.length > 0 ? (
            <View>
              <Text
                variant="semibold"
                className="px-4 pb-1 pt-3 text-xs uppercase tracking-widest"
                style={{ color: c.secondary }}
              >
                {t("notifications.earlier")}
              </Text>
              <View className="mx-4 overflow-hidden rounded-xl bg-white dark:bg-bg-card">
                {earlierNotifs.map((n, i) => (
                  <Animated.View
                    key={n.id}
                    entering={FadeInDown.duration(300).delay(i * 40)}
                  >
                    {i > 0 ? (
                      <View className="ml-[64px] h-px bg-brand-100 dark:bg-[#2A2A2A]" />
                    ) : null}
                    <NotificationRow notif={n} onPress={() => handlePress(n)} />
                  </Animated.View>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
