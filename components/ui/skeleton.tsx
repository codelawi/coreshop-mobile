import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { ViewStyle, DimensionValue } from "react-native";
import { useThemeColors } from "@/lib/theme";

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height = 16,
  radius = 8,
  style,
}: SkeletonProps) {
  const c = useThemeColors();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 700 }),
        withTiming(1, { duration: 700 }),
      ),
      -1,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: c.border },
        animStyle,
        style,
      ]}
    />
  );
}

export function SkeletonProductCard() {
  const c = useThemeColors();
  return (
    <View
      style={{
        backgroundColor: c.card,
        borderRadius: 10,
        overflow: "hidden",
        flex: 1,
        margin: 4,
      }}
    >
      <Skeleton width="100%" height={140} radius={0} />
      <View style={{ padding: 10, gap: 6 }}>
        <Skeleton width="80%" height={12} />
        <Skeleton width="50%" height={10} />
        <Skeleton width="40%" height={14} />
      </View>
    </View>
  );
}

export function SkeletonOrderRow() {
  const c = useThemeColors();
  return (
    <View
      style={{
        backgroundColor: c.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Skeleton width={44} height={44} radius={10} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="60%" height={13} />
        <Skeleton width="40%" height={11} />
      </View>
      <Skeleton width={60} height={24} radius={20} />
    </View>
  );
}

export function SkeletonProductRow() {
  const c = useThemeColors();
  return (
    <View
      style={{
        backgroundColor: c.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Skeleton width={56} height={56} radius={10} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="70%" height={13} />
        <Skeleton width="40%" height={11} />
      </View>
      <Skeleton width={48} height={22} radius={6} />
    </View>
  );
}

export function SkeletonHomeSection() {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Skeleton width={120} height={18} />
        <Skeleton width={50} height={14} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ flex: 1, gap: 6 }}>
            <Skeleton width="100%" height={140} radius={10} />
            <Skeleton width="80%" height={12} />
            <Skeleton width="50%" height={10} />
          </View>
        ))}
      </View>
    </View>
  );
}
