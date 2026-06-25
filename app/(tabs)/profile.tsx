import { View, ScrollView, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Animated, { FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  PackageIcon,
  Location01Icon,
  FavouriteIcon,
  Settings02Icon,
  Globe02Icon,
  Moon02Icon,
  Logout03Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  UserIcon,
  Store01Icon,
  Notification03Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner-native";
import { useColorScheme } from "nativewind";

import { Text } from "@/components/ui/text";
import { useAuthStore } from "@/stores/auth-store";
import { useLanguageStore } from "@/stores/language-store";
import { useCartStore } from "@/stores/cart-store";
import { useThemeStore } from "@/stores/theme-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useThemeColors } from "@/lib/theme";
import { useUnreadCount } from "@/lib/queries/notifications";
import { useSellerStore } from "@/lib/queries/seller";
import { api } from "@/lib/api";
import type { ThemeMode } from "@/stores/theme-store";

interface RowProps {
  icon: any;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  badge?: number;
}

function Row({ icon, label, value, onPress, danger, badge }: RowProps) {
  const { language } = useLanguageStore();
  const c = useThemeColors();
  const ChevronIcon = language === "ar" ? ArrowLeft01Icon : ArrowRight01Icon;
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 px-4 py-4">
      <View
        className="h-10 w-10 items-center justify-center rounded-md"
        style={{ backgroundColor: danger ? "#FEE2E2" : c.brandLight }}
      >
        <HugeiconsIcon icon={icon} size={20} color={danger ? "#FF4D4F" : c.brand} />
      </View>
      <Text
        variant="medium"
        className="flex-1 text-sm"
        style={{ color: danger ? "#FF4D4F" : c.brand }}
      >
        {label}
      </Text>
      {badge !== undefined && badge > 0 ? (
        <View
          className="h-5 min-w-[20px] items-center justify-center rounded-full px-1"
          style={{ backgroundColor: "#FF4D4F" }}
        >
          <Text variant="bold" style={{ color: "#fff", fontSize: 10 }}>
            {badge > 99 ? "99+" : badge}
          </Text>
        </View>
      ) : null}
      {value ? (
        <Text className="text-sm" style={{ color: c.secondary }}>{value}</Text>
      ) : null}
      <HugeiconsIcon icon={ChevronIcon} size={18} color={c.muted} />
    </Pressable>
  );
}

export default function Profile() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { language, setLanguage } = useLanguageStore();
  const clearCart = useCartStore((s) => s.clear);
  const { mode, setMode } = useThemeStore();
  const { setColorScheme } = useColorScheme();
  const wishlistCount = useWishlistStore((s) => s.ids.size);
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: sellerStore } = useSellerStore();

  const themeLabels: Record<ThemeMode, string> = {
    system: t("profile.themeSystem"),
    light: t("profile.themeLight"),
    dark: t("profile.themeDark"),
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await api.post("/auth/logout");
      } catch {}
    },
    onSettled: async () => {
      clearCart();
      await logout();
      router.replace("/(auth)/sign-in" as any);
    },
  });

  const confirmLogout = () => {
    Alert.alert(t("profile.logoutTitle"), t("profile.logoutDesc"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("profile.logout"), style: "destructive", onPress: () => logoutMutation.mutate() },
    ]);
  };

  const switchLanguage = async () => {
    const next = language === "en" ? "ar" : "en";
    await setLanguage(next);
    toast.success(next === "ar" ? "تم تغيير اللغة" : "Language changed");
  };

  const switchTheme = () => {
    Alert.alert(t("profile.themeTitle"), t("profile.themeChoose"), [
      {
        text: t("profile.themeSystem"),
        onPress: async () => {
          await setMode("system");
          setColorScheme("system");
        },
      },
      {
        text: t("profile.themeLight"),
        onPress: async () => {
          await setMode("light");
          setColorScheme("light");
        },
      },
      {
        text: t("profile.themeDark"),
        onPress: async () => {
          await setMode("dark");
          setColorScheme("dark");
        },
      },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-6 pb-4 pt-4">
          <Text variant="bold" className="text-2xl text-brand dark:text-white">{t("profile.title")}</Text>
        </View>

        <Animated.View
          entering={FadeInUp.duration(400)}
          className="mx-6 flex-row items-center gap-4 rounded-md bg-white dark:bg-bg-card p-4"
        >
          <View className="h-16 w-16 overflow-hidden rounded-full bg-brand-50 dark:bg-[#2A2A2A]">
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ flex: 1 }} contentFit="cover" />
            ) : (
              <View className="flex-1 items-center justify-center">
                <HugeiconsIcon icon={UserIcon} size={28} color={c.brand} />
              </View>
            )}
          </View>
          <View className="flex-1">
            <Text variant="bold" className="text-base text-brand dark:text-white">{user?.name ?? "User"}</Text>
            <Text className="text-xs" style={{ color: c.secondary }}>{user?.email}</Text>
            <View className="mt-1.5 self-start rounded-full bg-brand dark:bg-white px-2 py-0.5">
              <Text
                variant="semibold"
                style={{ color: c.isDark ? "#0A0A0A" : "#fff", fontSize: 10, textTransform: "capitalize" }}
              >
                {user?.role}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(400).delay(80)}
          className="mx-6 mt-4 overflow-hidden rounded-md bg-white dark:bg-bg-card"
        >
          <Row
            icon={PackageIcon}
            label={t("profile.myOrders")}
            onPress={() => router.push("/orders" as any)}
          />
          <View className="ml-16 h-px bg-brand-100 dark:bg-[#2A2A2A]" />
          <Row
            icon={FavouriteIcon}
            label={t("profile.wishlist")}
            badge={wishlistCount}
            onPress={() => router.push("/wishlist" as any)}
          />
          <View className="ml-16 h-px bg-brand-100 dark:bg-[#2A2A2A]" />
          <Row
            icon={Notification03Icon}
            label={t("profile.notifications")}
            badge={unreadCount}
            onPress={() => router.push("/notifications" as any)}
          />
          <View className="ml-16 h-px bg-brand-100 dark:bg-[#2A2A2A]" />
          <Row
            icon={Location01Icon}
            label={t("profile.addresses")}
            onPress={() => router.push("/addresses" as any)}
          />
        </Animated.View>

        {user?.role === "seller" ? (
          <Animated.View
            entering={FadeInUp.duration(400).delay(120)}
            className="mx-6 mt-4 overflow-hidden rounded-md bg-white dark:bg-bg-card"
          >
            <Row
              icon={Store01Icon}
              label={t("profile.myStore")}
              badge={sellerStore?.pending_orders_count ?? 0}
              onPress={() => router.push("/seller" as any)}
            />
          </Animated.View>
        ) : null}

        <Animated.View
          entering={FadeInUp.duration(400).delay(160)}
          className="mx-6 mt-4 overflow-hidden rounded-md bg-white dark:bg-bg-card"
        >
          <Row
            icon={Globe02Icon}
            label={t("profile.language")}
            value={language === "en" ? t("profile.langEnglish") : t("profile.langArabic")}
            onPress={switchLanguage}
          />
          <View className="ml-16 h-px bg-brand-100 dark:bg-[#2A2A2A]" />
          <Row icon={Moon02Icon} label={t("profile.theme")} value={themeLabels[mode]} onPress={switchTheme} />
          <View className="ml-16 h-px bg-brand-100 dark:bg-[#2A2A2A]" />
          <Row icon={Settings02Icon} label={t("profile.settings")} onPress={() => router.push("/settings" as any)} />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(400).delay(200)}
          className="mx-6 mt-4 overflow-hidden rounded-md bg-white dark:bg-bg-card"
        >
          <Row icon={Logout03Icon} label={t("profile.logout")} danger onPress={confirmLogout} />
        </Animated.View>

        <Text className="mt-6 text-center text-xs" style={{ color: c.muted }}>
          CoreShop v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
