import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useEffect } from "react";
import { Text } from "@/components/ui/text";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "@/lib/theme";

interface Props {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: Props) {
  const { t } = useTranslation();
  const c = useThemeColors();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(current / total, { duration: 400 });
  }, [current, total]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View className="w-full gap-2">
      <View className="flex-row justify-between">
        <Text variant="medium" className="text-xs" style={{ color: c.secondary }}>
          {t("onboarding.stepOf", { current, total })}
        </Text>
        <Text variant="semibold" className="text-xs text-brand dark:text-white">
          {Math.round((current / total) * 100)}%
        </Text>
      </View>
      <View className="h-1.5 w-full overflow-hidden rounded-full bg-brand-100 dark:bg-[#2A2A2A]">
        <Animated.View
          className="h-full rounded-full bg-brand dark:bg-white"
          style={animatedStyle}
        />
      </View>
    </View>
  );
}