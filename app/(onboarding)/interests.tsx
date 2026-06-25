import { View, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import Animated, { FadeInDown, FadeInUp, FadeIn } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Shirt01Icon,
  SmartPhone01Icon,
  Ring as MakeUpIcon,
  Home01Icon,
  FootballIcon,
  ToyBrickFreeIcons as TeddyBearIcon,
  Book02Icon,
  ShoppingCart01Icon,
  Car01Icon,
  CatIcon as DogIcon,
  Medicine01Icon,
  DiamondIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner-native";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/progress-bar";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeColors } from "@/lib/theme";
import { api } from "@/lib/api";

const CATEGORIES = [
  { id: "fashion", label: "Fashion", icon: Shirt01Icon },
  { id: "electronics", label: "Electronics", icon: SmartPhone01Icon },
  { id: "beauty", label: "Beauty", icon: MakeUpIcon },
  { id: "home", label: "Home", icon: Home01Icon },
  { id: "sports", label: "Sports", icon: FootballIcon },
  { id: "toys", label: "Toys", icon: TeddyBearIcon },
  { id: "books", label: "Books", icon: Book02Icon },
  { id: "grocery", label: "Grocery", icon: ShoppingCart01Icon },
  { id: "automotive", label: "Automotive", icon: Car01Icon },
  { id: "pets", label: "Pets", icon: DogIcon },
  { id: "health", label: "Health", icon: Medicine01Icon },
  { id: "jewelry", label: "Jewelry", icon: DiamondIcon },
];

export default function InterestsStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const onboarding = useOnboardingStore();
  const setUser = useAuthStore((s) => s.setUser);
  const [selected, setSelected] = useState<string[]>(onboarding.interests);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const finishMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch("/auth/onboarding", {
        name: onboarding.name,
        role: onboarding.role,
        avatar: onboarding.avatar,
        city: onboarding.city,
        latitude: onboarding.latitude,
        longitude: onboarding.longitude,
        interests: selected,
      });
      return res.data;
    },
    onSuccess: (res) => {
      setUser(res.data);
      onboarding.reset();
      toast.success("Welcome to CoreShop");
      router.replace("/(tabs)/home" as any);
    },
    onError: (err: any) => {
      console.log("Onboarding error:", JSON.stringify(err.response?.data, null, 2));
      toast.error(err.response?.data?.message ?? "Could not save");
    },
  });

  const onFinish = () => {
    if (selected.length < 3) {
      toast.error("Pick at least 3 categories");
      return;
    }
    finishMutation.mutate();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-1 px-6 pt-4">
        <ProgressBar current={5} total={5} />

        <Animated.View entering={FadeInDown.duration(500).springify()} className="mt-8">
          <Text variant="bold" className="text-3xl text-brand">
            {t("onboarding.interests.title")}
          </Text>
          <Text className="mt-2 text-base" style={{ color: colors.secondary }}>
            {t("onboarding.interests.subtitle")}
          </Text>
          <Text variant="medium" className="mt-2 text-sm" style={{ color: "#FF4D4F" }}>
            {t("onboarding.interests.selected", { count: selected.length })}
          </Text>
        </Animated.View>

        <ScrollView className="mt-6" showsVerticalScrollIndicator={false}>
          <Animated.View
            entering={FadeInUp.duration(600).delay(150)}
            className="flex-row flex-wrap justify-between"
          >
            {CATEGORIES.map((c) => {
              const isSelected = selected.includes(c.id);
              return (
                <Pressable
                  key={c.id}
                  onPress={() => toggle(c.id)}
                  style={{ width: "31.5%" }}
                  className={`mb-3 items-center justify-center rounded-md border bg-white dark:bg-bg-card p-4 ${
                    isSelected ? "border-brand" : "border-brand-100 dark:border-[#2A2A2A]"
                  }`}
                >
                  <View
                    className={`h-12 w-12 items-center justify-center rounded-full ${
                      isSelected ? "bg-brand" : "bg-brand-50"
                    }`}
                  >
                    <HugeiconsIcon
                      icon={c.icon}
                      size={24}
                      color={isSelected ? "#FFFFFF" : colors.brand}
                    />
                  </View>
                  <Text
                    variant="semibold"
                    className="mt-2 text-center text-xs text-brand dark:text-white"
                  >
                    {c.label}
                  </Text>
                  {isSelected && (
                    <Animated.View
                      entering={FadeIn.duration(150)}
                      className="absolute right-2 top-2 h-5 w-5 items-center justify-center rounded-full bg-brand"
                    >
                      <HugeiconsIcon icon={Tick02Icon} size={12} color="#fff" />
                    </Animated.View>
                  )}
                </Pressable>
              );
            })}
          </Animated.View>
        </ScrollView>

        <Animated.View entering={FadeInUp.duration(600).delay(400)} className="pb-4 pt-4">
          <Button
            label={t("onboarding.finish")}
            onPress={onFinish}
            loading={finishMutation.isPending}
            fullWidth
            size="lg"
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}