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
import { registerForPushNotifications } from "@/lib/notifications";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/progress-bar";

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
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(delay)}>
      <View className="flex-row items-center rounded-md border border-brand-100 bg-white p-4">
        <View className="h-12 w-12 items-center justify-center rounded-md bg-brand-50">
          <HugeiconsIcon icon={icon} size={24} color="#0A0A0A" />
        </View>
        <View className="ml-4 flex-1">
          <Text variant="semibold" className="text-base text-brand">{title}</Text>
          <Text className="text-xs" style={{ color: "#6B7280" }}>{desc}</Text>
        </View>
        <Pressable
          onPress={onPress}
          disabled={granted}
          className={`h-9 flex-row items-center justify-center rounded-md px-4 ${
            granted ? "bg-brand-50" : "bg-brand"
          }`}
        >
          {granted && (
            <HugeiconsIcon icon={Tick02Icon} size={14} color="#0A0A0A" style={{ marginRight: 4 }} />
          )}
          <Text
            variant="semibold"
            style={{ color: granted ? "#0A0A0A" : "#FFFFFF", fontSize: 13 }}
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
  const [notif, setNotif] = useState(false);
  const [media, setMedia] = useState(false);

  const reqNotif = async () => {
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

  return (
    <SafeAreaView className="flex-1 bg-bg-light">
      <View className="flex-1 px-6 pt-4">
        <ProgressBar current={4} total={5} />

        <Animated.View entering={FadeInDown.duration(500).springify()} className="mt-8">
          <Text variant="bold" className="text-3xl text-brand">
            {t("onboarding.permissions.title")}
          </Text>
          <Text className="mt-2 text-base" style={{ color: "#6B7280" }}>
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
            label={t("common.next")}
            onPress={() => router.push("/(onboarding)/interests" as any)}
            fullWidth
            size="lg"
          />
          <Button
            label={t("common.skip")}
            onPress={() => router.push("/(onboarding)/interests" as any)}
            variant="ghost"
            fullWidth
            size="md"
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}