import { View, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter, Link } from "expo-router";
import { useState, useEffect } from "react";
import { toast } from "sonner-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Mail01Icon,
  LockPasswordIcon,
  View as ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import Svg, { Path } from "react-native-svg";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeColors } from "@/lib/theme";

WebBrowser.maybeCompleteAuthSession();

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

function GoogleLogo() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Svg>
  );
}

export default function SignIn() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useThemeColors();
  const setAuth = useAuthStore((s) => s.setAuth);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const [showPassword, setShowPassword] = useState(false);

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

  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  const { mutate: googleLogin, isPending: googlePending } = useMutation({
    mutationFn: async (accessToken: string) => {
      const res = await api.post("/auth/google", { access_token: accessToken });
      return res.data;
    },
    onSuccess: async (res) => {
      await setAuth(res.data.user, res.data.token);
      toast.success(t("auth.welcomeBack"));
      router.replace("/");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? t("auth.loginFailed"));
    },
  });

  useEffect(() => {
    if (googleResponse?.type !== "success") return;
    const accessToken =
      googleResponse.authentication?.accessToken ??
      (googleResponse.params as any)?.access_token;
    if (accessToken) {
      googleLogin(accessToken);
    }
  }, [googleResponse, googleLogin]);

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

              <View className="flex-row items-center gap-3">
                <View className="h-px flex-1 bg-brand-100 dark:bg-[#2A2A2A]" />
                <Text className="text-sm" style={{ color: c.muted }}>
                  {t("auth.or")}
                </Text>
                <View className="h-px flex-1 bg-brand-100 dark:bg-[#2A2A2A]" />
              </View>

              <Button
                label={t("auth.continueWithGoogle")}
                variant="outline"
                leftIcon={<GoogleLogo />}
                onPress={() => googlePromptAsync()}
                loading={googlePending}
                fullWidth
                size="lg"
              />
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
