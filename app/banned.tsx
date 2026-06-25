import { View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { useAuthStore } from "@/stores/auth-store";

export default function BannedScreen() {
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/sign-in" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-1 items-center justify-center px-8">
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="mb-8 h-24 w-24 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={48} color="#ef4444" />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(100)} className="items-center gap-3">
          <Text variant="bold" className="text-2xl text-neutral-900 dark:text-white">
            Account Suspended
          </Text>
          <Text className="text-center text-base leading-6 text-neutral-500 dark:text-neutral-400">
            Your account has been suspended due to a violation of our terms of service. Please
            contact support if you believe this is a mistake.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(200)} className="mt-10 w-full">
          <Pressable
            onPress={handleLogout}
            className="h-12 w-full items-center justify-center rounded-md bg-red-500 active:opacity-80"
          >
            <Text variant="semibold" style={{ color: "#ffffff", fontSize: 16 }}>
              Sign Out
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
