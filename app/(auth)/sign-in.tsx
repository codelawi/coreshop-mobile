import { View, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter, Link } from "expo-router";
import { useState } from "react";
import { toast } from "sonner-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Mail01Icon,
  LockPasswordIcon,
  View as ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import { GoogleIcon } from "@/components/ui/google-icon";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useGoogleAuth } from "@/lib/useGoogleAuth";
import { useThemeColors } from "@/lib/theme";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function SignIn() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useThemeColors();
  const setAuth = useAuthStore((s) => s.setAuth);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const [showPassword, setShowPassword] = useState(false);
  const { ready: googleReady, loading: googleLoading, signInWithGoogle } = useGoogleAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await api.post("/auth/login", data);
      return res.data;
    },
    onSuccess: async (res) => {
      await setAuth(res.data.user, res.data.token);
      toast.success(t("auth.welcomeBack"));
      router.replace("/");
    },
    onError: async (err: any) => {
      const body = err.response?.data;
      if (body?.code === "email_unverified" && body?.data?.token) {
        await setAuth(body.data.user, body.data.token);
        router.replace("/(auth)/verify-email" as any);
      } else {
        toast.error(body?.message ?? t("auth.loginFailed"));
      }
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center px-6 py-8">
            <Animated.View
              entering={FadeInDown.duration(600).springify()}
              className="mb-10"
            >
              <Text variant="bold" className="text-4xl text-brand dark:text-white">
                {t("app.name")}
              </Text>
              <Text className="mt-2 text-base" style={{ color: c.secondary }}>
                {t("auth.signIn")}
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(700).delay(150).springify()}
              className="gap-4"
            >
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={t("auth.email")}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={value}
                    onChangeText={onChange}
                    error={errors.email?.message}
                    leftIcon={
                      <HugeiconsIcon icon={Mail01Icon} size={22} color={c.brand} />
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={t("auth.password")}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    error={errors.password?.message}
                    leftIcon={
                      <HugeiconsIcon icon={LockPasswordIcon} size={22} color={c.brand} />
                    }
                    rightIcon={
                      <Pressable
                        onPress={() => setShowPassword((p) => !p)}
                        hitSlop={10}
                      >
                        <HugeiconsIcon
                          icon={showPassword ? ViewOffSlashIcon : ViewIcon}
                          size={22}
                          color="#6B7280"
                        />
                      </Pressable>
                    }
                  />
                )}
              />

              <Link href={"/(auth)/forgot-password" as any} asChild>
                <Pressable className="self-end">
                  <Text variant="medium" className="text-sm text-brand dark:text-white">
                    {t("auth.forgotPassword")}
                  </Text>
                </Pressable>
              </Link>

              <Button
                label={t("auth.signIn")}
                onPress={handleSubmit((data) => loginMutation.mutate(data))}
                loading={loginMutation.isPending}
                fullWidth
                size="lg"
                className="mt-2"
              />

              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
                <Text style={{ color: c.muted, fontSize: 12 }}>{t("auth.or")}</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
              </View>

              <Pressable
                onPress={() => googleReady && signInWithGoogle()}
                disabled={!googleReady || googleLoading}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  borderRadius: 12,
                  paddingVertical: 13,
                  borderWidth: 1,
                  borderColor: c.border,
                  backgroundColor: c.card,
                  opacity: !googleReady || googleLoading ? 0.6 : 1,
                }}
              >
                <GoogleIcon size={20} />
                <Text variant="semibold" style={{ fontSize: 14, color: c.brand }}>
                  {t("auth.continueWithGoogle")}
                </Text>
              </Pressable>

            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(700).delay(350)}
              className="mt-8 flex-row justify-center gap-1"
            >
              <Text className="text-sm" style={{ color: c.secondary }}>
                {t("auth.noAccount")}
              </Text>
              <Link href={"/(auth)/sign-up" as any}>
                <Text variant="semibold" className="text-sm text-brand dark:text-white">
                  {t("auth.signUp")}
                </Text>
              </Link>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(700).delay(500)}
              className="mt-4 items-center"
            >
              <Pressable
                onPress={() => {
                  continueAsGuest();
                  router.replace("/(tabs)/home" as any);
                }}
                hitSlop={10}
              >
                <Text variant="medium" className="text-sm" style={{ color: c.muted }}>
                  {t("auth.browseAsGuest")}
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}