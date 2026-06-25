import { View, ScrollView, Pressable, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import Animated, { FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft02Icon,
  ArrowRight01Icon,
  PackageIcon,
  DiscountTag01Icon,
  StarIcon,
  SecurityLockIcon,
} from "@hugeicons/core-free-icons";
import * as SecureStore from "expo-secure-store";
import { useLanguageStore } from "@/stores/language-store";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/lib/theme";

const PREFS_KEY = "notif_prefs";

interface Prefs {
  orders: boolean;
  promotions: boolean;
  newArrivals: boolean;
  account: boolean;
}

const defaultPrefs: Prefs = {
  orders: true,
  promotions: true,
  newArrivals: false,
  account: true,
};

interface NotifRowProps {
  icon: any;
  title: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
  delay?: number;
}

function NotifRow({ icon, title, desc, value, onChange, delay = 0 }: NotifRowProps) {
  const c = useThemeColors();
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(delay)}>
      <View className="flex-row items-center gap-4 px-4 py-4">
        <View
          className="h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: c.brandLight }}
        >
          <HugeiconsIcon icon={icon} size={22} color={c.brand} />
        </View>
        <View className="flex-1">
          <Text variant="semibold" className="text-sm text-brand dark:text-white">
            {title}
          </Text>
          <Text className="mt-0.5 text-xs" style={{ color: c.secondary }}>
            {desc}
          </Text>
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: "#E5E7EB", true: c.brand }}
          thumbColor="#FFFFFF"
        />
      </View>
    </Animated.View>
  );
}

export default function NotificationSettings() {
  const router = useRouter();
  const { t } = useTranslation();
  const c = useThemeColors();
  const { language } = useLanguageStore();
  const BackIcon = language === "ar" ? ArrowRight01Icon : ArrowLeft02Icon;
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);

  useEffect(() => {
    SecureStore.getItemAsync(PREFS_KEY).then((raw) => {
      if (raw) {
        try {
          setPrefs({ ...defaultPrefs, ...JSON.parse(raw) });
        } catch {}
      }
    });
  }, []);

  const update = async (key: keyof Prefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(next));
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-bg-card"
        >
          <HugeiconsIcon icon={BackIcon} size={22} color={c.brand} />
        </Pressable>
        <Text variant="bold" className="text-xl text-brand dark:text-white">
          {t("settings.notificationsTitle")}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <Animated.View
          entering={FadeInUp.duration(400).delay(40)}
          className="mx-4 mt-2 overflow-hidden rounded-xl bg-white dark:bg-bg-card"
        >
          <NotifRow
            icon={PackageIcon}
            title={t("settings.notifOrders")}
            desc={t("settings.notifOrdersDesc")}
            value={prefs.orders}
            onChange={(v) => update("orders", v)}
            delay={80}
          />
          <View className="ml-[72px] h-px bg-brand-100 dark:bg-[#2A2A2A]" />
          <NotifRow
            icon={DiscountTag01Icon}
            title={t("settings.notifPromotions")}
            desc={t("settings.notifPromotionsDesc")}
            value={prefs.promotions}
            onChange={(v) => update("promotions", v)}
            delay={140}
          />
          <View className="ml-[72px] h-px bg-brand-100 dark:bg-[#2A2A2A]" />
          <NotifRow
            icon={StarIcon}
            title={t("settings.notifNewArrivals")}
            desc={t("settings.notifNewArrivalsDesc")}
            value={prefs.newArrivals}
            onChange={(v) => update("newArrivals", v)}
            delay={200}
          />
          <View className="ml-[72px] h-px bg-brand-100 dark:bg-[#2A2A2A]" />
          <NotifRow
            icon={SecurityLockIcon}
            title={t("settings.notifAccount")}
            desc={t("settings.notifAccountDesc")}
            value={prefs.account}
            onChange={(v) => update("account", v)}
            delay={260}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
