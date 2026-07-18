import { View, ScrollView, Pressable, KeyboardAvoidingView, Platform, Modal } from "react-native";
import { Image } from "expo-image";
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
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft02Icon,
  ArrowRight01Icon,
  View as ViewIcon,
  ViewOffSlashIcon,
  Alert02Icon,
  UserIcon,
  ImageUpload01Icon,
  Tick02Icon,
  Mail01Icon,
} from "@hugeicons/core-free-icons";
import { useLanguageStore } from "@/stores/language-store";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useThemeColors } from "@/lib/theme";
import { api, API_URL } from "@/lib/api";

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
  const logout = useAuthStore((s) => s.logout);
  const clearCart = useCartStore((s) => s.clear);
  const BackIcon = language === "ar" ? ArrowRight01Icon : ArrowLeft02Icon;

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const pickAndUploadAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast.error("Media library permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setAvatarPreview(asset.uri);
    setAvatarUploading(true);

    try {
      const token = await SecureStore.getItemAsync("auth_token");
      const upload = await FileSystem.uploadAsync(
        `${API_URL}/upload/avatar`,
        asset.uri,
        {
          httpMethod: "POST",
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: "avatar",
          headers: { Authorization: `Bearer ${token ?? ""}` },
        }
      );

      const json = JSON.parse(upload.body);
      if (upload.status >= 400) throw new Error(json?.message ?? "Upload failed");

      const avatarUrl: string = json.data.url;
      const res = await api.patch("/auth/profile", { avatar: avatarUrl });
      setUser(res.data.data);
      toast.success(t("settings.toastProfileSaved"));
    } catch (e: any) {
      toast.error(e?.message ?? "Avatar upload failed.");
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "" },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: "", password: "", password_confirmation: "" },
  });

  const resendVerification = useMutation({
    mutationFn: async () => { await api.post("/auth/email/resend"); },
    onSuccess: () => toast.success(t("auth.verificationEmailSent")),
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("auth.couldNotResend")),
  });

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await api.patch("/auth/profile", data);
      return res.data;
    },
    onSuccess: (res, variables) => {
      const updatedUser = res.data;
      setUser(updatedUser);
      if (variables.email !== user?.email) {
        toast.success(t("settings.emailChangedVerify"));
        router.push("/(auth)/verify-email" as any);
      } else {
        toast.success(t("settings.toastProfileSaved"));
      }
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

  const deleteAccount = useMutation({
    mutationFn: async () => {
      await api.delete("/auth/account", { data: { password: deletePassword } });
    },
    onSuccess: async () => {
      setShowDeleteModal(false);
      toast.success(t("settings.deleteAccountSuccess"));
      clearCart();
      await logout();
      router.replace("/(auth)/sign-in" as any);
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message;
      toast.error(
        message?.toLowerCase().includes("password") || err?.response?.status === 422
          ? t("settings.deleteAccountWrongPassword")
          : message ?? t("auth.somethingWentWrong")
      );
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

            {/* Avatar picker */}
            <View className="mb-4 items-center">
              <Pressable onPress={pickAndUploadAvatar} disabled={avatarUploading}>
                <View className="relative">
                  {avatarPreview || user?.avatar ? (
                    <Image
                      source={{ uri: avatarPreview ?? user!.avatar! }}
                      style={{ width: 80, height: 80, borderRadius: 40 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      className="h-20 w-20 items-center justify-center rounded-full"
                      style={{ backgroundColor: c.card }}
                    >
                      <HugeiconsIcon icon={UserIcon} size={36} color={c.secondary} />
                    </View>
                  )}
                  <View
                    className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full"
                    style={{ backgroundColor: c.brand }}
                  >
                    {avatarUploading ? (
                      <Spinner size={14} color="#fff" strokeWidth={2} />
                    ) : (
                      <HugeiconsIcon icon={ImageUpload01Icon} size={14} color="#fff" />
                    )}
                  </View>
                </View>
              </Pressable>
            </View>

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
              <View>
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
                <View className="mt-1.5 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1.5">
                    <HugeiconsIcon
                      icon={user?.email_verified_at ? Tick02Icon : Mail01Icon}
                      size={13}
                      color={user?.email_verified_at ? "#16A34A" : "#F59E0B"}
                    />
                    <Text
                      variant="medium"
                      style={{ fontSize: 11, color: user?.email_verified_at ? "#16A34A" : "#F59E0B" }}
                    >
                      {user?.email_verified_at ? t("settings.emailVerified") : t("settings.emailNotVerified")}
                    </Text>
                  </View>
                  {!user?.email_verified_at && (
                    <Pressable
                      onPress={() => resendVerification.mutate()}
                      disabled={resendVerification.isPending}
                      hitSlop={8}
                    >
                      <Text variant="semibold" style={{ fontSize: 11, color: c.brand }}>
                        {resendVerification.isPending ? t("common.loading") : t("settings.resendVerification")}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
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

          {/* Danger Zone */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(220)}
            className="mx-4 mt-4 mb-2 overflow-hidden rounded-xl p-4"
            style={{ backgroundColor: c.isDark ? "#1A0A0A" : "#FFF5F5", borderWidth: 1, borderColor: c.isDark ? "#3A1010" : "#FEE2E2" }}
          >
            <Text variant="semibold" className="mb-1 text-sm" style={{ color: "#FF4D4F" }}>
              {t("settings.deleteAccountDesc")}
            </Text>
            <Pressable
              onPress={() => {
                setDeletePassword("");
                setShowDeleteModal(true);
              }}
              className="mt-3 flex-row items-center gap-2 self-start rounded-lg px-4 py-2.5"
              style={{ backgroundColor: c.isDark ? "#2D1010" : "#FEE2E2" }}
            >
              <HugeiconsIcon icon={Alert02Icon} size={16} color="#FF4D4F" />
              <Text variant="semibold" style={{ color: "#FF4D4F", fontSize: 13 }}>
                {t("settings.deleteAccount")}
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <View className="mx-4 mb-8 rounded-2xl bg-white dark:bg-bg-card p-6">
            <View
              className="mb-4 h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: c.isDark ? "#2D1010" : "#FEE2E2" }}
            >
              <HugeiconsIcon icon={Alert02Icon} size={24} color="#FF4D4F" />
            </View>

            <Text variant="bold" className="text-lg text-brand dark:text-white">
              {t("settings.deleteAccountTitle")}
            </Text>
            <Text className="mt-2 text-sm leading-5" style={{ color: c.secondary }}>
              {t("settings.deleteAccountWarning")}
            </Text>

            <View className="mt-5">
              <Input
                label={t("settings.deleteAccountPasswordLabel")}
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry={!showDeletePassword}
                autoCapitalize="none"
                spellCheck={false}
                autoCorrect={false}
                rightIcon={
                  <Pressable onPress={() => setShowDeletePassword((p) => !p)} hitSlop={10}>
                    <HugeiconsIcon
                      icon={showDeletePassword ? ViewOffSlashIcon : ViewIcon}
                      size={20}
                      color={c.muted}
                    />
                  </Pressable>
                }
              />
            </View>

            <View className="mt-4 gap-3">
              <Pressable
                onPress={() => deleteAccount.mutate()}
                disabled={deletePassword.length < 1 || deleteAccount.isPending}
                className="h-14 w-full items-center justify-center rounded-md"
                style={{
                  backgroundColor: "#FF4D4F",
                  opacity: deletePassword.length < 1 ? 0.5 : 1,
                }}
              >
                {deleteAccount.isPending ? (
                  <Spinner size={22} color="#fff" trackColor="#ffffff40" strokeWidth={2} />
                ) : (
                  <Text variant="semibold" style={{ color: "#fff", fontSize: 16 }}>
                    {t("settings.deleteAccountConfirm")}
                  </Text>
                )}
              </Pressable>
              <Button
                label={t("common.cancel")}
                variant="outline"
                onPress={() => setShowDeleteModal(false)}
                disabled={deleteAccount.isPending}
                fullWidth
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
