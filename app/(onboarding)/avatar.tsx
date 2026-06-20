import { View, Pressable, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeInDown, FadeInUp, FadeIn } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ImageUpload01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner-native";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/progress-bar";
import { useOnboardingStore } from "@/stores/onboarding-store";

const AVATARS = [
  "https://api.dicebear.com/9.x/avataaars/png?seed=1",
  "https://api.dicebear.com/9.x/avataaars/png?seed=2",
  "https://api.dicebear.com/9.x/avataaars/png?seed=3",
  "https://api.dicebear.com/9.x/avataaars/png?seed=4",
  "https://api.dicebear.com/9.x/avataaars/png?seed=5",
  "https://api.dicebear.com/9.x/avataaars/png?seed=6",
  "https://api.dicebear.com/9.x/avataaars/png?seed=7",
  "https://api.dicebear.com/9.x/avataaars/png?seed=8",
];

export default function AvatarStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const setAvatar = useOnboardingStore((s) => s.setAvatar);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast.error("Media permission denied");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setSelected(result.assets[0].uri);
    }
  };

  

const onNext = () => {
  if (!selected) {
    toast.error("Please pick an avatar");
    return;
  }
  setAvatar(selected);
  router.push("/(onboarding)/profile" as any);
};

  return (
    <SafeAreaView className="flex-1 bg-bg-light">
      <View className="flex-1 px-6 pt-4">
        <ProgressBar current={1} total={5} />

        <Animated.View entering={FadeInDown.duration(500).springify()} className="mt-8">
          <Text variant="bold" className="text-3xl text-brand">
            {t("onboarding.avatar.title")}
          </Text>
          <Text className="mt-2 text-base" style={{ color: "#6B7280" }}>
            {t("onboarding.avatar.subtitle")}
          </Text>
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false} className="mt-8">
          <Animated.View
            entering={FadeInUp.duration(600).delay(150)}
            className="flex-row flex-wrap justify-between"
          >
            {AVATARS.map((url, i) => {
              const isSelected = selected === url;
              return (
                <Pressable
                  key={url}
                  onPress={() => setSelected(url)}
                  className="mb-4"
                  style={{ width: "23%" }}
                >
                  <View
                    className={`aspect-square overflow-hidden rounded-full border-2 ${
                      isSelected ? "border-brand" : "border-transparent"
                    }`}
                  >
                    <Image source={{ uri: url }} className="h-full w-full" />
                  </View>
                  {isSelected && (
                    <Animated.View
                      entering={FadeIn.duration(200)}
                      className="absolute right-0 top-0 h-6 w-6 items-center justify-center rounded-full bg-brand"
                    >
                      <HugeiconsIcon icon={Tick02Icon} size={14} color="#fff" />
                    </Animated.View>
                  )}
                </Pressable>
              );
            })}
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(600).delay(300)} className="mt-4">
            <Pressable
              onPress={pickImage}
              className="flex-row items-center justify-center gap-2 rounded-md border-2 border-dashed border-brand-100 bg-white py-6"
            >
              <HugeiconsIcon icon={ImageUpload01Icon} size={22} color="#0A0A0A" />
              <Text variant="semibold" className="text-brand">
                {t("onboarding.avatar.upload")}
              </Text>
            </Pressable>
            {selected && !AVATARS.includes(selected) && (
              <View className="mt-4 items-center">
                <Image source={{ uri: selected }} className="h-24 w-24 rounded-full" />
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <Animated.View entering={FadeInUp.duration(600).delay(400)} className="pb-4">
          <Button label={t("common.next")} onPress={onNext} fullWidth size="lg" />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}