import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowLeft02Icon,
  UserCircleIcon,
  Notification03Icon,
  SecurityLockIcon,
  InformationCircleIcon,
  Bug01Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons";
import { useLanguageStore } from "@/stores/language-store";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/lib/theme";

interface SettingsRowProps {
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
  delay?: number;
}

function SettingsRow({ icon, title, subtitle, onPress, delay = 0 }: SettingsRowProps) {
  const c = useThemeColors();
  const { language } = useLanguageStore();
  const ChevronIcon = language === "ar" ? ArrowLeft01Icon : ArrowRight01Icon;

  return (
    <Animated.View entering={FadeInUp.duration(400).delay(delay)}>
      <Pressable
        onPress={onPress}
        className="flex-row items-center gap-4 px-4 py-4 active:opacity-70"
      >
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
            {subtitle}
          </Text>
        </View>
        <HugeiconsIcon icon={ChevronIcon} size={18} color={c.muted} />
      </Pressable>
    </Animated.View>
  );
}

export default function SettingsIndex() {
  const router = useRouter();
  const { t } = useTranslation();
  const c = useThemeColors();
  const { language } = useLanguageStore();
  const BackIcon = language === "ar" ? ArrowRight01Icon : ArrowLeft02Icon;

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
          {t("settings.title")}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mx-4 mt-2 overflow-hidden rounded-xl bg-white dark:bg-bg-card">
          <SettingsRow
            icon={UserCircleIcon}
            title={t("settings.account")}
            subtitle={t("settings.accountDesc")}
            onPress={() => router.push("/settings/account" as any)}
            delay={60}
          />
          <View className="ml-[72px] h-px bg-brand-100 dark:bg-[#2A2A2A]" />
          <SettingsRow
            icon={Notification03Icon}
            title={t("settings.notifications")}
            subtitle={t("settings.notificationsDesc")}
            onPress={() => router.push("/settings/notifications" as any)}
            delay={120}
          />
          <View className="ml-[72px] h-px bg-brand-100 dark:bg-[#2A2A2A]" />
          <SettingsRow
            icon={InformationCircleIcon}
            title={t("settings.about")}
            subtitle={t("settings.aboutDesc")}
            onPress={() => router.push("/settings/about" as any)}
            delay={180}
          />
        </View>

        <View className="mx-4 mt-4 overflow-hidden rounded-xl bg-white dark:bg-bg-card">
          <SettingsRow
            icon={Bug01Icon}
            title={t("settings.reportBug")}
            subtitle={t("settings.reportBugDesc")}
            onPress={() => router.push("/settings/report-bug" as any)}
            delay={240}
          />
          <View className="ml-[72px] h-px bg-brand-100 dark:bg-[#2A2A2A]" />
          <SettingsRow
            icon={Alert02Icon}
            title={t("settings.reportProblem")}
            subtitle={t("settings.reportProblemDesc")}
            onPress={() => router.push("/settings/report-problem" as any)}
            delay={300}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
