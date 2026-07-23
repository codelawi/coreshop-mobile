import {
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  Dimensions,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowRight01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";

import { Text } from "@/components/ui/text";
import { Spinner } from "@/components/ui/spinner";
import { useCategories } from "@/lib/queries/home";
import { useThemeColors } from "@/lib/theme";
import { useLanguageStore } from "@/stores/language-store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 10;
const CONTENT_PADDING = 16;
const COLS = 3;
const CARD_SIZE = (SCREEN_WIDTH - CONTENT_PADDING * 2 - CARD_GAP * (COLS - 1)) / COLS;

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
  const chipScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!data || data.length === 0) { return; }
    if (activeId === null || !data.some((cat) => cat.id === activeId)) {
      setActiveId(data[0].id);
    }
  }, [data, activeId]);

  const active = data?.find((cat) => cat.id === activeId);
  const subcategories = active?.children ?? [];
  const ChevronIcon = isAr ? ArrowLeft01Icon : ArrowRight01Icon;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center">
          <Spinner size={44} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="px-6 pb-2 pt-4">
        <Text variant="bold" className="text-2xl text-brand dark:text-white">
          {t("categories.title")}
        </Text>
      </View>

      {/* Category chips — horizontal scroll */}
      <ScrollView
        ref={chipScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
      >
        {data?.map((cat) => {
          const isActive = cat.id === activeId;
          return (
            <Pressable
              key={cat.id}
              onPress={() => setActiveId(cat.id)}
              style={{
                paddingHorizontal: 18,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isActive ? c.brand : c.card,
                borderWidth: 1,
                borderColor: isActive ? c.brand : c.border,
              }}
            >
              <Text
                variant={isActive ? "bold" : "medium"}
                style={{ color: isActive ? c.bg : c.brand, fontSize: 13 }}
                numberOfLines={1}
              >
                {localName(cat, isAr)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Main content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: CONTENT_PADDING, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={c.brand}
            colors={[c.brand]}
          />
        }
      >
        {active ? (
          <Animated.View key={active.id} entering={FadeIn.duration(220)}>
            {/* Hero banner */}
            <Pressable
              onPress={() => router.push(`/category/${active.id}` as any)}
              style={{ borderRadius: 16, overflow: "hidden", height: 180, marginBottom: 16 }}
            >
              {active.image ? (
                <Image
                  source={{ uri: active.image }}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: c.brandLight }]} />
              )}
              {/* Gradient overlay */}
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end", padding: 20 },
                ]}
              >
                <Text variant="bold" style={{ color: "#fff", fontSize: 22, marginBottom: 4 }}>
                  {localName(active, isAr)}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text variant="medium" style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                    {t("categories.shopAll")}
                  </Text>
                  <HugeiconsIcon icon={ChevronIcon} size={14} color="rgba(255,255,255,0.85)" />
                </View>
              </View>
            </Pressable>

            {/* Subcategory grid */}
            {subcategories.length > 0 ? (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: CARD_GAP,
                }}
              >
                {subcategories.map((sub, i) => (
                  <Animated.View
                    key={sub.id}
                    entering={FadeInUp.duration(280).delay(i * 35)}
                    style={{ width: CARD_SIZE }}
                  >
                    <Pressable
                      onPress={() => router.push(`/category/${sub.id}` as any)}
                      style={{ borderRadius: 12, overflow: "hidden" }}
                    >
                      <View
                        style={{
                          width: CARD_SIZE,
                          height: CARD_SIZE,
                          backgroundColor: c.brandLight,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {sub.image ? (
                          <Image
                            source={{ uri: sub.image }}
                            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                          />
                        ) : (
                          <Text variant="bold" style={{ fontSize: 28, color: "#FF4D4F", opacity: 0.3 }}>
                            {localName(sub, isAr).charAt(0).toUpperCase()}
                          </Text>
                        )}
                        <View
                          style={[
                            StyleSheet.absoluteFillObject,
                            {
                              backgroundColor: "rgba(0,0,0,0.28)",
                              justifyContent: "flex-end",
                              padding: 7,
                            },
                          ]}
                        >
                          <Text
                            variant="semibold"
                            numberOfLines={2}
                            style={{ color: "#fff", fontSize: 10, lineHeight: 13 }}
                          >
                            {localName(sub, isAr)}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            ) : (
              <View style={{ alignItems: "center", paddingTop: 40 }}>
                <Text style={{ color: c.secondary, fontSize: 14 }}>
                  {t("categories.noSubcategories")}
                </Text>
              </View>
            )}
          </Animated.View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
