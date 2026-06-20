import { View, ScrollView, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useState } from "react";
import { Text } from "@/components/ui/text";
import type { Banner } from "@/lib/queries/home";

const { width } = Dimensions.get("window");
const BANNER_WIDTH = width - 48;

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);

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
          <View
            key={i}
            className="h-1.5 rounded-full"
            style={{
              width: i === index ? 16 : 6,
              backgroundColor: i === index ? "#0A0A0A" : "#D1D5DB",
            }}
          />
        ))}
      </View>
    </View>
  );
}