import { View, ScrollView, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useState, useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import type { Banner } from "@/lib/queries/home";
import { useThemeColors } from "@/lib/theme";

const { width } = Dimensions.get("window");
const BANNER_WIDTH = width - 48;

function Dot({ active, activeColor, color }: { active: boolean; activeColor: string; color: string }) {
  const w = useSharedValue(active ? 16 : 6);
  const opacity = useSharedValue(active ? 1 : 0.5);

  useEffect(() => {
    w.value = withTiming(active ? 16 : 6, { duration: 250 });
    opacity.value = withTiming(active ? 1 : 0.5, { duration: 250 });
  }, [active]);

  const style = useAnimatedStyle(() => ({
    width: w.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[style, { height: 6, borderRadius: 999, backgroundColor: active ? activeColor : color }]}
    />
  );
}

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const c = useThemeColors();

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={BANNER_WIDTH + 12}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / (BANNER_WIDTH + 12));
          setIndex(i);
        }}
      >
        {banners.map((b, i) => (
          <Pressable
            key={b.id}
            style={{ width: BANNER_WIDTH, marginRight: i === banners.length - 1 ? 0 : 12 }}
            className="h-40 overflow-hidden rounded-md"
          >
            <Image source={{ uri: b.image }} style={{ flex: 1 }} contentFit="cover" />
            <View className="absolute inset-0 justify-end p-4" style={{ backgroundColor: "rgba(0,0,0,0.25)" }}>
              {b.title ? (
                <Text variant="bold" style={{ color: "#fff", fontSize: 22 }}>{b.title}</Text>
              ) : null}
              {b.subtitle ? (
                <Text variant="medium" style={{ color: "#fff", fontSize: 13, marginTop: 2 }}>{b.subtitle}</Text>
              ) : null}
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <View className="mt-2 flex-row items-center justify-center gap-1.5">
        {banners.map((_, i) => (
          <Dot key={i} active={i === index} activeColor={c.brand} color={c.border} />
        ))}
      </View>
    </View>
  );
}
