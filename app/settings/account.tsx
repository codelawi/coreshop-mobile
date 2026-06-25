import { View, ScrollView, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft02Icon,
  ArrowRight01Icon,
  View as ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import { useLanguageStore } from "@/stores/language-store";
import { useAuthStore } from "@/stores/auth-store";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useThemeColors } from "@/lib/theme";
import { api } from "@/lib/api";

const profileSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email"),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Required"),
    password: z.string().min(8, "At least 8 characters"),
    password_confirmation: z.string().min(1, "Required"),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function AccountSettings() {
  const router = useRouter();
  const { t } = useTranslation();
  const c = useThemeColors();
  const { language } = useLanguageStore();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const BackIcon = language === "ar" ? ArrowRight01Icon : ArrowLeft02Icon;

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "" },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: "", password: "", password_confirmation: "" },
  });

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await api.patch("/auth/profile", data);
      return res.data;
    },
    onSuccess: (res) => {
      setUser(res.data);
      toast.success(t("settings.toastProfileSaved"));
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? t("settings.toastProfileError"));
    },
  });

  const changePassword = useMutation({
    mutationFn: async (data: PasswordForm) => {
      const res = await api.patch("/auth/change-password", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success(t("settings.toastPasswordSaved"));
      passwordForm.reset();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? t("settings.toastPasswordError"));
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-bg-card"
        >
          <HugeiconsIcon icon={BackIcon} size={22} color={c.brand} />
        </Pressable>
        <Text variant="bold" className="text-xl text-brand dark:text-white">
          {t("settings.accountTitle")}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Profile Info */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(60)}
            className="mx-4 mt-2 overflow-hidden rounded-xl bg-white dark:bg-bg-card p-4"
          >
            <Text variant="semibold" className="mb-4 text-base text-brand dark:text-white">
              {t("settings.account")}
            </Text>
            <View className="gap-4">
              <Controller
                control={profileForm.control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={t("settings.fullName")}
                    value={value}
                    onChangeText={onChange}
                    error={profileForm.formState.errors.name?.message}
                    autoCapitalize="words"
                  />
                )}
              />
              <Controller
                control={profileForm.control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={t("settings.emailAddress")}
                    value={value}
                    onChangeText={onChange}
                    error={profileForm.formState.errors.email?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />
              <Button
                label={t("settings.saveChanges")}
                onPress={profileForm.handleSubmit((d) => updateProfile.mutate(d))}
                loading={updateProfile.isPending}
                fullWidth
              />
            </View>
          </Animated.View>

          {/* Change Password */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(140)}
            className="mx-4 mt-4 overflow-hidden rounded-xl bg-white dark:bg-bg-card p-4"
          >
            <Text variant="semibold" className="mb-4 text-base text-brand dark:text-white">
              {t("settings.changePassword")}
            </Text>
            <View className="gap-4">
              <Controller
                control={passwordForm.control}
                name="current_password"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={t("settings.currentPassword")}
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={!showCurrent}
                    error={passwordForm.formState.errors.current_password?.message}
                    rightIcon={
                      <Pressable onPress={() => setShowCurrent((p) => !p)} hitSlop={10}>
                        <HugeiconsIcon
                          icon={showCurrent ? ViewOffSlashIcon : ViewIcon}
                          size={20}
                          color={c.muted}
                        />
                      </Pressable>
                    }
                  />
                )}
              />
              <Controller
                control={passwordForm.control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={t("settings.newPassword")}
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={!showNew}
                    error={passwordForm.formState.errors.password?.message}
                    rightIcon={
                      <Pressable onPress={() => setShowNew((p) => !p)} hitSlop={10}>
                        <HugeiconsIcon
                          icon={showNew ? ViewOffSlashIcon : ViewIcon}
                          size={20}
                          color={c.muted}
                        />
                      </Pressable>
                    }
                  />
                )}
              />
              <Controller
                control={passwordForm.control}
                name="password_confirmation"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={t("settings.confirmNewPassword")}
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={!showConfirm}
                    error={passwordForm.formState.errors.password_confirmation?.message}
                    rightIcon={
                      <Pressable onPress={() => setShowConfirm((p) => !p)} hitSlop={10}>
                        <HugeiconsIcon
                          icon={showConfirm ? ViewOffSlashIcon : ViewIcon}
                          size={20}
                          color={c.muted}
                        />
                      </Pressable>
                    }
                  />
                )}
              />
              <Button
                label={t("settings.changePassword")}
                onPress={passwordForm.handleSubmit((d) => changePassword.mutate(d))}
                loading={changePassword.isPending}
                fullWidth
              />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
