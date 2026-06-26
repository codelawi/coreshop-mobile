import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Store01Icon } from "@hugeicons/core-free-icons";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useThemeColors } from "@/lib/theme";

export default function StorePrompt() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useThemeColors();

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-1 items-center justify-center px-8">
        <Animated.View entering={FadeInDown.duration(500).springify()} className="items-center">
          <View className="h-28 w-28 items-center justify-center rounded-3xl bg-brand dark:bg-white">
            <HugeiconsIcon
              icon={Store01Icon}
              size={56}
              color={c.isDark ? "#0A0A0A" : "#FFFFFF"}
            />
          </View>
          <Text variant="bold" className="mt-6 text-center text-3xl text-brand dark:text-white">
            {t("seller.storePrompt.title")}
          </Text>
          <Text className="mt-3 text-center text-sm leading-6" style={{ color: c.secondary }}>
            {t("seller.storePrompt.subtitle")}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(200)} className="mt-10 w-full gap-3">
          <Button
            label={t("seller.storePrompt.setup")}
            onPress={() => router.replace("/seller/setup" as any)}
            fullWidth
            size="lg"
          />
          <Button
            label={t("seller.storePrompt.skip")}
            variant="outline"
            onPress={() => router.replace("/(tabs)/home" as any)}
            fullWidth
            size="lg"
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
