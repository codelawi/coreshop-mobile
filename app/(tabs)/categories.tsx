import { View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { useCategories, type CategoryNode } from "@/lib/queries/home";

export default function Categories() {
  const router = useRouter();
  const { data, isLoading } = useCategories();
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    if (data && data.length > 0 && activeId === null) {
      setActiveId(data[0].id);
    }
  }, [data, activeId]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg-light">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0A0A0A" />
        </View>
      </SafeAreaView>
    );
  }

  const active = data?.find((c) => c.id === activeId);

  return (
    <SafeAreaView className="flex-1 bg-bg-light">
      <View className="px-6 pb-3 pt-4">
        <Text variant="bold" className="text-2xl text-brand">Categories</Text>
      </View>

      <View className="flex-1 flex-row">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 8 }}
          style={{ width: 96, backgroundColor: "#FFFFFF" }}
        >
          {data?.map((cat) => {
            const isActive = cat.id === activeId;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setActiveId(cat.id)}
                className={`px-3 py-4 ${isActive ? "bg-bg-light" : ""}`}
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: isActive ? "#0A0A0A" : "transparent",
                }}
              >
                <Text
                  variant={isActive ? "bold" : "medium"}
                  numberOfLines={2}
                  className="text-center text-xs text-brand"
                >
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {active ? (
            <Animated.View key={active.id} entering={FadeIn.duration(250)}>
              <Pressable
                onPress={() => router.push(`/category/${active.id}` as any)}
                className="mb-4 h-32 overflow-hidden rounded-md bg-brand-50"
              >
                {active.image ? (
                  <Image source={{ uri: active.image }} style={{ flex: 1 }} contentFit="cover" />
                ) : null}
                <View
                  className="absolute inset-0 justify-end p-4"
                  style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
                >
                  <Text variant="bold" style={{ color: "#fff", fontSize: 20 }}>
                    {active.name}
                  </Text>
                  <Text variant="medium" style={{ color: "#fff", fontSize: 12, marginTop: 2 }}>
                    Shop all
                  </Text>
                </View>
              </Pressable>

              {active.children.length > 0 ? (
                <View className="flex-row flex-wrap justify-between">
                  {active.children.map((sub, i) => (
                    <Animated.View
                      key={sub.id}
                      entering={FadeInUp.duration(300).delay(i * 40)}
                      style={{ width: "48%" }}
                      className="mb-3"
                    >
                      <Pressable
                        onPress={() => router.push(`/category/${sub.id}` as any)}
                        className="overflow-hidden rounded-md bg-white"
                      >
                        <View className="aspect-square w-full bg-brand-50">
                          {sub.image ? (
                            <Image
                              source={{ uri: sub.image }}
                              style={{ flex: 1 }}
                              contentFit="cover"
                            />
                          ) : null}
                        </View>
                        <View className="p-2">
                          <Text
                            variant="semibold"
                            numberOfLines={1}
                            className="text-center text-xs text-brand"
                          >
                            {sub.name}
                          </Text>
                        </View>
                      </Pressable>
                    </Animated.View>
                  ))}
                </View>
              ) : (
                <View className="items-center pt-12">
                  <Text className="text-sm" style={{ color: "#6B7280" }}>
                    No subcategories
                  </Text>
                </View>
              )}
            </Animated.View>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}