import {
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
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
import Constants, { ExecutionEnvironment } from "expo-constants";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeColors } from "@/lib/theme";
import { useLanguageStore } from "@/stores/language-store";

WebBrowser.maybeCompleteAuthSession();

const isNativeBuild = [ExecutionEnvironment.Bare, ExecutionEnvironment.Standalone].includes(
  Constants.executionEnvironment
);
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "";
const GOOGLE_REDIRECT_URI = isNativeBuild
  ? (Platform.select({
      ios: `com.googleusercontent.apps.${IOS_CLIENT_ID.replace(".apps.googleusercontent.com", "")}:/oauthredirect`,
      android: `com.googleusercontent.apps.${ANDROID_CLIENT_ID.replace(".apps.googleusercontent.com", "")}:/oauthredirect`,
    }) ?? undefined)
  : undefined;

const schema = z
  .object({
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
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

export default function SignUp() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useThemeColors();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingData, setPendingData] = useState<FormData | null>(null);
  const { language } = useLanguageStore();
  const isAr = language === "ar";

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", password_confirmation: "" },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await api.post("/auth/register", data);
      return res.data;
    },
    onSuccess: async (res) => {
      await setAuth(res.data.user, res.data.token);
      router.replace("/(auth)/verify-email" as any);
    },
    onError: (err: any) => {
      console.log(
        "Register error:",
        JSON.stringify(err.response?.data, null, 2),
      );
      const errors = err.response?.data?.errors as
        | Record<string, string[]>
        | undefined;
      const firstError = errors ? Object.values(errors)[0]?.[0] : undefined;
      const msg =
        err.response?.data?.message ?? firstError ?? t("auth.registrationFailed");
      toast.error(msg);
    },
  });

  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    ...(GOOGLE_REDIRECT_URI ? { redirectUri: GOOGLE_REDIRECT_URI } : {}),
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
                {t("auth.createAccount")}
              </Text>
              <Text className="mt-2 text-base" style={{ color: c.secondary }}>
                {t("app.name")}
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
                      <HugeiconsIcon
                        icon={Mail01Icon}
                        size={22}
                        color={c.brand}
                      />
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
                      <HugeiconsIcon
                        icon={LockPasswordIcon}
                        size={22}
                        color={c.brand}
                      />
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

              <Controller
                control={control}
                name="password_confirmation"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={t("auth.confirmPassword")}
                    placeholder="••••••••"
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    error={errors.password_confirmation?.message}
                    leftIcon={
                      <HugeiconsIcon
                        icon={LockPasswordIcon}
                        size={22}
                        color={c.brand}
                      />
                    }
                    rightIcon={
                      <Pressable
                        onPress={() => setShowConfirm((p) => !p)}
                        hitSlop={10}
                      >
                        <HugeiconsIcon
                          icon={showConfirm ? ViewOffSlashIcon : ViewIcon}
                          size={22}
                          color="#6B7280"
                        />
                      </Pressable>
                    }
                  />
                )}
              />

              <Button
                label={t("auth.createAccount")}
                onPress={handleSubmit((data) => {
                  setPendingData(data);
                  setShowTermsModal(true);
                })}
                loading={registerMutation.isPending}
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
                {t("auth.haveAccount")}
              </Text>
              <Pressable onPress={() => router.back()} hitSlop={6}>
                <Text variant="semibold" className="text-sm text-brand dark:text-white">
                  {t("auth.signIn")}
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Terms of Service acceptance modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View className="flex-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View className="mt-20 flex-1 rounded-t-3xl bg-bg-light dark:bg-bg-dark">
            <View className="items-center py-4">
              <View className="h-1 w-10 rounded-full bg-brand-100 dark:bg-[#3A3A3A]" />
            </View>
            <View className="border-b border-brand-100 dark:border-[#2A2A2A] px-6 pb-4">
              <Text variant="bold" className="text-xl text-brand dark:text-white" style={{ textAlign: isAr ? "right" : "left" }}>
                {isAr ? "الشروط والأحكام" : "Terms of Service"}
              </Text>
              <Text className="mt-1 text-sm" style={{ color: c.secondary, textAlign: isAr ? "right" : "left" }}>
                {isAr
                  ? "يرجى قراءة الشروط والأحكام والموافقة عليها للمتابعة"
                  : "Please read and accept the Terms of Service to continue"}
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 24, paddingBottom: 16 }}
            >
              <Text className="text-sm leading-6" style={{ color: c.secondary, textAlign: isAr ? "right" : "left" }}>
                {isAr
                  ? "مرحباً بكم في منصة Core. باستخدامك لمنصة Core فإنك توافق على الالتزام بهذه الشروط والأحكام.\n\nCore هي منصة إلكترونية وسيطة تربط بين العملاء والمتاجر، ولا تعتبر مالكة أو مصنعة أو موردة للمنتجات.\n\nيجب على المستخدم تقديم معلومات صحيحة والحفاظ على سرية بيانات الدخول، وتحمل المسؤولية الكاملة عن جميع الأنشطة التي تتم من خلال حسابه.\n\nيُحظر استخدام المنصة لأغراض غير قانونية أو تقديم معلومات مضللة أو محاولة اختراق المنصة.\n\nتحتفظ Core بحق تعليق أو إغلاق أي حساب يخالف هذه الشروط.\n\nتخضع هذه الشروط لقوانين المملكة الأردنية الهاشمية."
                  : "Welcome to the Core platform. By using Core, you agree to comply with these Terms and Conditions.\n\nCore operates as an intermediary platform connecting customers and stores and is not the owner or manufacturer of listed products.\n\nYou must provide accurate information, keep your login credentials confidential, and take full responsibility for all activities on your account.\n\nUsing the platform for illegal purposes, providing false information, or attempting to breach platform security is strictly prohibited.\n\nCore reserves the right to suspend or close any account that violates these Terms.\n\nThese Terms are governed by the laws of the Hashemite Kingdom of Jordan."}
              </Text>
            </ScrollView>

            <View className="gap-3 border-t border-brand-100 dark:border-[#2A2A2A] px-6 py-4">
              <Button
                label={isAr ? "أوافق وأتابع" : "I Agree & Continue"}
                onPress={() => {
                  setShowTermsModal(false);
                  if (pendingData) {
                    registerMutation.mutate(pendingData);
                  }
                }}
                loading={registerMutation.isPending}
                fullWidth
                size="lg"
              />
              <Pressable
                onPress={() => setShowTermsModal(false)}
                className="items-center py-2"
              >
                <Text variant="semibold" className="text-sm" style={{ color: c.secondary }}>
                  {isAr ? "إلغاء" : "Decline"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
