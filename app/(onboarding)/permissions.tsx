import { View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Notification03Icon, Image01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import * as Notifications from "expo-notifications";
import * as ImagePicker from "expo-image-picker";
import Constants from "expo-constants";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { registerForPushNotifications } from "@/lib/notifications";

const isExpoGo = Constants.executionEnvironment === "storeClient";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/progress-bar";
import { useThemeColors } from "@/lib/theme";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";

interface PermissionCardProps {
  icon: any;
  title: string;
  desc: string;
  granted: boolean;
  onPress: () => void;
  delay: number;
  allowLabel: string;
  allowedLabel: string;
}

function PermissionCard({ icon, title, desc, granted, onPress, delay, allowLabel, allowedLabel }: PermissionCardProps) {
  const c = useThemeColors();
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(delay)}>
      <View className="flex-row items-center rounded-md border border-brand-100 dark:border-[#2A2A2A] bg-white dark:bg-bg-card p-4">
        <View className="h-12 w-12 items-center justify-center rounded-md bg-brand-50 dark:bg-[#2A2A2A]">
          <HugeiconsIcon icon={icon} size={24} color={c.brand} />
        </View>
        <View className="ml-4 flex-1">
          <Text variant="semibold" className="text-base text-brand dark:text-white">{title}</Text>
          <Text className="text-xs" style={{ color: c.secondary }}>{desc}</Text>
        </View>
        <Pressable
          onPress={onPress}
          disabled={granted}
          className={`h-9 flex-row items-center justify-center rounded-md px-4 ${
            granted ? "bg-brand-50 dark:bg-[#2A2A2A]" : "bg-brand"
          }`}
        >
          {granted && (
            <HugeiconsIcon icon={Tick02Icon} size={14} color={c.brand} style={{ marginRight: 4 }} />
          )}
          <Text
            variant="semibold"
            style={{ color: granted ? c.brand : "#FFFFFF", fontSize: 13 }}
          >
            {granted ? allowedLabel : allowLabel}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function PermissionsStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useThemeColors();
  const [notif, setNotif] = useState(false);
  const [media, setMedia] = useState(false);
  const onboarding = useOnboardingStore();
  const setUser = useAuthStore((s) => s.setUser);

  const reqNotif = async () => {
    if (isExpoGo) {
      setNotif(true);
      return;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === "granted";
    setNotif(granted);
    if (granted) {
      await registerForPushNotifications();
    }
  };

  const reqMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setMedia(status === "granted");
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
        interests: [],
      });
      return res.data;
    },
    onSuccess: (res) => {
      const updatedUser = res.data;
      setUser(updatedUser);
      onboarding.reset();
      toast.success(t("onboarding.interests.welcomeToApp"));
      if (updatedUser.role === "seller") {
        router.replace("/(onboarding)/store-prompt" as any);
      } else {
        router.replace("/(tabs)/home" as any);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? t("onboarding.interests.couldNotSave"));
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-1 px-6 pt-4">
        <ProgressBar current={4} total={4} />

        <Animated.View entering={FadeInDown.duration(500).springify()} className="mt-8">
          <Text variant="bold" className="text-3xl text-brand dark:text-white">
            {t("onboarding.permissions.title")}
          </Text>
          <Text className="mt-2 text-base" style={{ color: c.secondary }}>
            {t("onboarding.permissions.subtitle")}
          </Text>
        </Animated.View>

        <View className="mt-8 gap-3">
          <PermissionCard
            icon={Notification03Icon}
            title={t("onboarding.permissions.notifications")}
            desc={t("onboarding.permissions.notificationsDesc")}
            granted={notif}
            onPress={reqNotif}
            delay={150}
            allowLabel={t("onboarding.permissions.allow")}
            allowedLabel={t("onboarding.permissions.allowed")}
          />
          <PermissionCard
            icon={Image01Icon}
            title={t("onboarding.permissions.media")}
            desc={t("onboarding.permissions.mediaDesc")}
            granted={media}
            onPress={reqMedia}
            delay={250}
            allowLabel={t("onboarding.permissions.allow")}
            allowedLabel={t("onboarding.permissions.allowed")}
          />
        </View>

        <View className="flex-1" />

        <Animated.View entering={FadeInUp.duration(600).delay(400)} className="pb-4 gap-2">
          <Button
            label={t("onboarding.finish")}
            onPress={() => finishMutation.mutate()}
            loading={finishMutation.isPending}
            fullWidth
            size="lg"
          />
          <Button
            label={t("common.skip")}
            onPress={() => finishMutation.mutate()}
            variant="ghost"
            disabled={finishMutation.isPending}
            fullWidth
            size="md"
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
