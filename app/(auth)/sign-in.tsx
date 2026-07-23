import { View, Pressable, KeyboardAvoidingView, Platform, ScrollView, Modal } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter, Link } from "expo-router";
import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { toast } from "sonner-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Mail01Icon,
  LockPasswordIcon,
  View as ViewIcon,
  ViewOffSlashIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Image } from "expo-image";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeColors } from "@/lib/theme";
import { useSavedAccountsStore, type SavedAccount } from "@/stores/saved-accounts-store";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function SignIn() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore((s) => s.setAuth);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const [showPassword, setShowPassword] = useState(false);
  const { accounts, removeAccount } = useSavedAccountsStore();
  const [showSavedModal, setShowSavedModal] = useState(accounts.length > 0);
  const [loadingAccountId, setLoadingAccountId] = useState<number | null>(null);

  useEffect(() => {
    if (accounts.length === 0) {
      setShowSavedModal(false);
    }
  }, [accounts.length]);

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

  const loginWithSavedAccount = async (account: SavedAccount) => {
    if (loadingAccountId !== null) return;
    setLoadingAccountId(account.id);
    await SecureStore.setItemAsync("auth_token", account.token);
    try {
      const res = await api.get("/auth/me");
      await setAuth(res.data.data, account.token);
      router.replace("/");
    } catch (err: any) {
      await SecureStore.deleteItemAsync("auth_token");
      if (err?.response?.status === 401) {
        await removeAccount(account.id);
        toast.error(t("auth.sessionExpired"));
      } else {
        toast.error(t("auth.loginFailed"));
      }
    } finally {
      setLoadingAccountId(null);
    }
  };

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

              {accounts.length > 0 && (
                <Pressable
                  onPress={() => setShowSavedModal(true)}
                  className="items-center py-1"
                >
                  <Text variant="medium" className="text-sm text-brand dark:text-white">
                    {t("auth.savedAccounts")}
                  </Text>
                </Pressable>
              )}
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

      {/* Saved accounts bottom sheet */}
      <Modal
        visible={showSavedModal}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setShowSavedModal(false)}
      >
        <View className="flex-1 justify-end">
          <Pressable
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onPress={() => setShowSavedModal(false)}
          />
          <Animated.View
            entering={FadeInUp.duration(400).springify()}
            className="bg-bg-light dark:bg-bg-dark rounded-t-3xl"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            {/* Handle */}
            <View className="items-center pt-3 pb-2">
              <View className="h-1 w-10 rounded-full bg-brand-100 dark:bg-[#3A3A3A]" />
            </View>

            {/* Title */}
            <Text variant="bold" className="text-xl text-brand dark:text-white px-6 pt-2 pb-3">
              {t("auth.savedAccounts")}
            </Text>

            {/* Account rows */}
            {accounts.map((account) => (
              <Pressable
                key={account.id}
                onPress={() => loginWithSavedAccount(account)}
                className="flex-row items-center px-6 py-3 active:opacity-70"
              >
                <View className="h-12 w-12 rounded-full overflow-hidden bg-brand-50 dark:bg-[#2A2A2A] items-center justify-center">
                  {account.avatar ? (
                    <Image
                      source={{ uri: account.avatar }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : (
                    <Text variant="bold" className="text-lg text-brand">
                      {account.name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>

                <View className="flex-1 ml-3">
                  <Text variant="semibold" className="text-base text-brand dark:text-white" numberOfLines={1}>
                    {account.name}
                  </Text>
                  <Text className="text-sm" style={{ color: c.secondary }} numberOfLines={1}>
                    {account.email}
                  </Text>
                </View>

                {loadingAccountId === account.id ? (
                  <Spinner size={20} color={c.brand} strokeWidth={2.5} />
                ) : (
                  <Pressable
                    onPress={() => removeAccount(account.id)}
                    hitSlop={12}
                    className="p-1"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={18} color={c.muted} />
                  </Pressable>
                )}
              </Pressable>
            ))}

            {/* Use a different account */}
            <View className="mx-6 mt-1">
              <View className="h-px bg-brand-100 dark:bg-[#2A2A2A] mb-1" />
              <Pressable
                onPress={() => setShowSavedModal(false)}
                className="flex-row items-center py-3 gap-3 active:opacity-70"
              >
                <View className="h-12 w-12 rounded-full items-center justify-center border border-brand-100 dark:border-[#2A2A2A]">
                  <Text variant="bold" className="text-xl text-brand dark:text-white">+</Text>
                </View>
                <Text variant="medium" className="text-base text-brand dark:text-white">
                  {t("auth.useDifferentAccount")}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
