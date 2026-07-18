import { View, ScrollView, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft02Icon,
  ArrowRight01Icon,
  ExternalLinkIcon,
  DocumentValidationIcon,
  SecurityLockIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import Constants from "expo-constants";
import { useLanguageStore } from "@/stores/language-store";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/lib/theme";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

interface AboutRowProps {
  icon: any;
  title: string;
  value?: string;
  onPress?: () => void;
  delay?: number;
  showArrow?: boolean;
}

function AboutRow({ icon, title, value, onPress, delay = 0, showArrow = false }: AboutRowProps) {
  const c = useThemeColors();
  const { language } = useLanguageStore();
  const ArrowIcon = language === "ar" ? ArrowLeft02Icon : ExternalLinkIcon;

  return (
    <Animated.View entering={FadeInUp.duration(400).delay(delay)}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
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
          {value ? (
            <Text className="mt-0.5 text-xs" style={{ color: c.secondary }}>
              {value}
            </Text>
          ) : null}
        </View>
        {showArrow && onPress ? (
          <HugeiconsIcon icon={ArrowIcon} size={16} color={c.muted} />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export default function About() {
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
          {t("settings.aboutTitle")}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <Animated.View
          entering={FadeInUp.duration(400).delay(40)}
          className="mx-4 mt-2 overflow-hidden rounded-xl bg-white dark:bg-bg-card"
        >
          <AboutRow
            icon={SecurityLockIcon}
            title={t("settings.version")}
            value={`v${APP_VERSION}`}
            delay={80}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(400).delay(120)}
          className="mx-4 mt-4 overflow-hidden rounded-xl bg-white dark:bg-bg-card"
        >
          <AboutRow
            icon={DocumentValidationIcon}
            title={t("settings.termsOfService")}
            onPress={() => router.push("/settings/terms-of-service" as any)}
            showArrow
            delay={160}
          />
          <View className="ml-[72px] h-px bg-brand-100 dark:bg-[#2A2A2A]" />
          <AboutRow
            icon={SecurityLockIcon}
            title={t("settings.privacyPolicy")}
            onPress={() => router.push("/settings/privacy-policy" as any)}
            showArrow
            delay={220}
          />
          <View className="ml-[72px] h-px bg-brand-100 dark:bg-[#2A2A2A]" />
          <AboutRow
            icon={StarIcon}
            title={t("settings.rateApp")}
            onPress={() => Linking.openURL("https://play.google.com/store/apps")}
            showArrow
            delay={280}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
