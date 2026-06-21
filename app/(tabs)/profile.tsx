import { View, ScrollView, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import Animated, { FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  PackageIcon,
  Location01Icon,
  FavouriteIcon,
  Settings02Icon,
  Globe02Icon,
  Moon02Icon,
  Logout03Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  UserIcon,
  Store01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner-native";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/ui/text";
import { useAuthStore } from "@/stores/auth-store";
import { useLanguageStore } from "@/stores/language-store";
import { useCartStore } from "@/stores/cart-store";
import { api } from "@/lib/api";

interface RowProps {
  icon: any;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

function Row({ icon, label, value, onPress, danger }: RowProps) {
  const { language } = useLanguageStore();
  const ChevronIcon = language === "ar" ? ArrowLeft01Icon : ArrowRight01Icon;
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 px-4 py-4">
      <View
        className="h-10 w-10 items-center justify-center rounded-md"
        style={{ backgroundColor: danger ? "#FEE2E2" : "#F5F5F5" }}
      >
        <HugeiconsIcon icon={icon} size={20} color={danger ? "#FF4D4F" : "#0A0A0A"} />
      </View>
      <Text
        variant="medium"
        className="flex-1 text-sm"
        style={{ color: danger ? "#FF4D4F" : "#0A0A0A" }}
      >
        {label}
      </Text>
      {value ? (
        <Text className="text-sm" style={{ color: "#6B7280" }}>{value}</Text>
      ) : null}
      <HugeiconsIcon icon={ChevronIcon} size={18} color="#9CA3AF" />
    </Pressable>
  );
}

export default function Profile() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { language, setLanguage } = useLanguageStore();
  const clearCart = useCartStore((s) => s.clear);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await api.post("/auth/logout");
      } catch {}
    },
    onSettled: async () => {
      clearCart();
      await logout();
      router.replace("/(auth)/sign-in" as any);
    },
  });

  const confirmLogout = () => {
    Alert.alert("Log out?", "You'll need to sign in again.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => logoutMutation.mutate() },
    ]);
  };

  const switchLanguage = async () => {
    const next = language === "en" ? "ar" : "en";
    await setLanguage(next);
    toast.success(next === "ar" ? "تم تغيير اللغة" : "Language changed");
    Alert.alert(
      "Restart required",
      "Please close and reopen the app to apply the layout direction.",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-6 pb-4 pt-4">
          <Text variant="bold" className="text-2xl text-brand">Profile</Text>
        </View>

        <Animated.View entering={FadeInUp.duration(400)} className="mx-6 flex-row items-center gap-4 rounded-md bg-white p-4">
          <View className="h-16 w-16 overflow-hidden rounded-full bg-brand-50">
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ flex: 1 }} contentFit="cover" />
            ) : (
              <View className="flex-1 items-center justify-center">
                <HugeiconsIcon icon={UserIcon} size={28} color="#0A0A0A" />
              </View>
            )}
          </View>
          <View className="flex-1">
            <Text variant="bold" className="text-base text-brand">{user?.name ?? "User"}</Text>
            <Text className="text-xs" style={{ color: "#6B7280" }}>{user?.email}</Text>
            <View className="mt-1.5 self-start rounded-full bg-brand px-2 py-0.5">
              <Text variant="semibold" style={{ color: "#fff", fontSize: 10, textTransform: "capitalize" }}>
                {user?.role}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(80)} className="mx-6 mt-4 overflow-hidden rounded-md bg-white">
          <Row icon={PackageIcon} label="My Orders" onPress={() => router.push("/orders" as any)} />
          <View className="ml-16 h-px bg-brand-100" />
          <Row icon={FavouriteIcon} label="Wishlist" onPress={() => router.push("/wishlist" as any)} />
          <View className="ml-16 h-px bg-brand-100" />
          <Row icon={Location01Icon} label="Addresses" onPress={() => router.push("/addresses" as any)} />
        </Animated.View>

        {user?.role === "seller" ? (
          <Animated.View entering={FadeInUp.duration(400).delay(120)} className="mx-6 mt-4 overflow-hidden rounded-md bg-white">
            <Row icon={Store01Icon} label="My Store" onPress={() => router.push("/seller" as any)} />
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInUp.duration(400).delay(160)} className="mx-6 mt-4 overflow-hidden rounded-md bg-white">
          <Row
            icon={Globe02Icon}
            label="Language"
            value={language === "en" ? "English" : "العربية"}
            onPress={switchLanguage}
          />
          <View className="ml-16 h-px bg-brand-100" />
          <Row icon={Moon02Icon} label="Theme" value="System" onPress={() => toast("Coming soon")} />
          <View className="ml-16 h-px bg-brand-100" />
          <Row icon={Settings02Icon} label="Settings" onPress={() => toast("Coming soon")} />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(200)} className="mx-6 mt-4 overflow-hidden rounded-md bg-white">
          <Row icon={Logout03Icon} label="Log out" danger onPress={confirmLogout} />
        </Animated.View>

        <Text className="mt-6 text-center text-xs" style={{ color: "#9CA3AF" }}>
          CoreShop v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}