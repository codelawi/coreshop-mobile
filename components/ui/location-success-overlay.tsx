import { View, Modal, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/ui/text";

interface Props {
  visible: boolean;
}

export function LocationSuccessOverlay({ visible }: Props) {
  const { t } = useTranslation();

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={[StyleSheet.absoluteFillObject, styles.backdrop]}>
        <Animated.View
          entering={ZoomIn.duration(300).springify()}
          exiting={FadeOut.duration(250)}
          style={styles.card}
        >
          <View style={styles.circle}>
            <HugeiconsIcon icon={Tick02Icon} size={56} color="#fff" />
          </View>
          <Text variant="bold" style={styles.label}>
            {t("onboarding.location.locationDetected")}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    alignItems: "center",
    gap: 20,
  },
  circle: {
    height: 112,
    width: 112,
    borderRadius: 56,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#fff",
    fontSize: 20,
  },
});
