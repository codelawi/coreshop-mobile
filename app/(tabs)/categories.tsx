import { View, ScrollView, Pressable, RefreshControl } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";

import { useTranslation } from "react-i18next";

import { Text } from "@/components/ui/text";
import { Spinner } from "@/components/ui/spinner";
import { useCategories } from "@/lib/queries/home";
import { useThemeColors } from "@/lib/theme";
import { useLanguageStore } from "@/stores/language-store";

function localName(item: { name: string; name_ar?: string | null }, isAr: boolean): string {
  return isAr && item.name_ar ? item.name_ar : item.name;
}

export default function Categories() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useThemeColors();
  const language = useLanguageStore((s) => s.language);
  const isAr = language === "ar";
  const { data, isLoading, isRefetching, refetch } = useCategories();
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    if (data && data.length > 0 && activeId === null) {
      setActiveId(data[0].id);
    }
  }, [data, activeId]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <Spinner size={44} />
        </View>
      </SafeAreaView>
    );
  }

  const active = data?.find((cat) => cat.id === activeId);

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={["top"]}>
      <View className="px-6 pb-3 pt-4">
        <Text variant="bold" className="text-2xl text-brand dark:text-white">{t("categories.title")}</Text>
      </View>

      <View className="flex-1 flex-row">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 8 }}
          style={{ width: 96, backgroundColor: c.card }}
        >
          {data?.map((cat) => {
            const isActive = cat.id === activeId;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setActiveId(cat.id)}
                className={`px-3 py-4 ${isActive ? "bg-bg-light dark:bg-[#2A2A2A]" : ""}`}
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: isActive ? c.brand : "transparent",
                }}
              >
                <Text
                  variant={isActive ? "bold" : "medium"}
                  numberOfLines={2}
                  className="text-center text-xs text-brand dark:text-white"
                >
                  {localName(cat, isAr)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor="transparent"
              colors={["transparent"]}
              progressBackgroundColor="transparent"
            />
          }
        >
          {isRefetching ? (
            <View style={{ alignItems: "center", paddingBottom: 8 }}>
              <Spinner size={28} strokeWidth={2.5} />
            </View>
          ) : null}
          {active ? (
            <Animated.View key={active.id} entering={FadeIn.duration(250)}>
              <Pressable
                onPress={() => router.push(`/category/${active.id}` as any)}
                className="mb-4 h-32 overflow-hidden rounded-md bg-brand-50 dark:bg-[#2A2A2A]"
              >
                {active.image ? (
                  <Image source={{ uri: active.image }} style={{ flex: 1 }} contentFit="cover" />
                ) : null}
                <View
                  className="absolute inset-0 justify-end p-4"
                  style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
                >
                  <Text variant="bold" style={{ color: "#fff", fontSize: 20 }}>
                    {localName(active, isAr)}
                  </Text>
                  <Text variant="medium" style={{ color: "#fff", fontSize: 12, marginTop: 2 }}>
                    {t("categories.shopAll")}
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
                        className="overflow-hidden rounded-md bg-white dark:bg-bg-card"
                      >
                        <View className="aspect-square w-full bg-brand-50 dark:bg-[#2A2A2A]">
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
                            className="text-center text-xs text-brand dark:text-white"
                          >
                            {localName(sub, isAr)}
                          </Text>
                        </View>
                      </Pressable>
                    </Animated.View>
                  ))}
                </View>
              ) : (
                <View className="items-center pt-12">
                  <Text className="text-sm" style={{ color: c.secondary }}>
                    {t("categories.noSubcategories")}
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
