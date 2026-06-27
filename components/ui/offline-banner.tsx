import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { WifiOff01Icon } from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";

import { useNetworkStore } from "@/stores/network-store";
import { Text } from "@/components/ui/text";

export function OfflineBanner() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isOffline = useNetworkStore((s) => s.isOffline);
  const translateY = useSharedValue(-80);

  useEffect(() => {
    translateY.value = withTiming(isOffline ? 0 : -80, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [isOffline]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          paddingTop: insets.top,
        },
      ]}
      pointerEvents="none"
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          backgroundColor: "#1F2937",
          paddingVertical: 10,
          paddingHorizontal: 16,
        }}
      >
        <HugeiconsIcon icon={WifiOff01Icon} size={16} color="#fff" />
        <Text variant="medium" style={{ fontSize: 13, color: "#fff" }}>
          {t("common.offline")}
        </Text>
      </View>
    </Animated.View>
  );
}
