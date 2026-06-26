import { View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Mail01Icon, Refresh01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner-native";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeColors } from "@/lib/theme";
import { Spinner } from "@/components/ui/spinner";

export default function VerifyEmail() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [checking, setChecking] = useState(false);

  const resendMutation = useMutation({
    mutationFn: async () => {
      await api.post("/auth/email/resend");
    },
    onSuccess: () => toast.success(t("auth.verificationEmailSent")),
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("auth.couldNotResend")),
  });

  const checkVerified = async () => {
    setChecking(true);
    try {
      const res = await api.get("/auth/me");
      const freshUser = res.data.data;
      if (freshUser.email_verified_at) {
        setUser(freshUser);
        toast.success(t("auth.emailVerified"));
        if (!freshUser.onboarding_completed) {
          router.replace("/(onboarding)/avatar" as any);
        } else {
          router.replace("/(tabs)/home" as any);
        }
      } else {
        toast.error(t("auth.emailNotVerifiedYet"));
      }
    } catch {
      toast.error(t("auth.couldNotCheckVerification"));
    } finally {
      setChecking(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-1 items-center justify-center px-8">
        <Animated.View entering={FadeInDown.duration(500)} className="items-center gap-5">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-white dark:bg-bg-card">
            <HugeiconsIcon icon={Mail01Icon} size={48} color={c.brand} />
          </View>

          <View className="items-center gap-2">
            <Text variant="bold" className="text-center text-2xl text-brand dark:text-white">
              {t("auth.checkEmail")}
            </Text>
            <Text className="text-center text-sm leading-5" style={{ color: c.secondary }}>
              {t("auth.verificationSentTo")}
            </Text>
            <Text variant="semibold" className="text-center text-sm text-brand dark:text-white">
              {user?.email}
            </Text>
          </View>

          <View className="mt-2 w-full gap-3">
            <Button
              label={t("auth.iveVerifiedEmail")}
              onPress={checkVerified}
              loading={checking}
              fullWidth
              size="lg"
              leftIcon={<HugeiconsIcon icon={Tick02Icon} size={20} color="#fff" />}
            />

            <Pressable
              onPress={() => resendMutation.mutate()}
              disabled={resendMutation.isPending}
              className="flex-row items-center justify-center gap-2 py-3"
            >
              {resendMutation.isPending ? (
                <Spinner size={16} strokeWidth={2} />
              ) : (
                <HugeiconsIcon icon={Refresh01Icon} size={16} color={c.secondary} />
              )}
              <Text variant="medium" className="text-sm" style={{ color: c.secondary }}>
                {t("auth.resendEmail")}
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(500).delay(200)}
          className="absolute bottom-10 items-center"
        >
          <Text className="text-xs text-center leading-4" style={{ color: c.muted }}>
            {t("auth.didntGetIt")}
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
