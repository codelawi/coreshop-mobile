import { View, Pressable } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ImageUpload01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner-native";

import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/onboarding/progress-bar";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeColors } from "@/lib/theme";
import { Spinner } from "@/components/ui/spinner";
import { API_URL } from "@/lib/api";

function dicebearUrl(userId: number | undefined): string {
  const seed = userId ?? Math.floor(Math.random() * 9999);
  return `https://api.dicebear.com/9.x/lorelei/png?seed=${seed}&size=200`;
}

export default function AvatarStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useThemeColors();
  const setAvatar = useOnboardingStore((s) => s.setAvatar);
  const userId = useAuthStore((s) => s.user?.id);

  const defaultAvatarUrl = dicebearUrl(userId);

  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const displayUri = previewUri ?? defaultAvatarUrl;
  const hasCustomAvatar = !!uploadedUrl;

  const pickAndUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast.error(t("onboarding.avatar.permissionDenied"));
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
    setPreviewUri(asset.uri);
    setUploadedUrl(null);
    setUploading(true);

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

      setUploadedUrl(json.data.url);
    } catch (e: any) {
      toast.error(e?.message ?? t("onboarding.avatar.uploadFailed"));
      setPreviewUri(null);
    } finally {
      setUploading(false);
    }
  };

  const onNext = () => {
    setAvatar(uploadedUrl ?? defaultAvatarUrl);
    router.push("/(onboarding)/location" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-1 px-6 pt-4">
        <ProgressBar current={2} total={5} />

        <Animated.View entering={FadeInDown.duration(500).springify()} className="mt-8">
          <Text variant="bold" className="text-3xl text-brand dark:text-white">
            {t("onboarding.avatar.title")}
          </Text>
          <Text className="mt-2 text-base" style={{ color: c.secondary }}>
            {t("onboarding.avatar.subtitle")}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(600).delay(150)}
          className="flex-1 items-center justify-center gap-6"
        >
          {/* Avatar circle — shows default or picked image */}
          <Pressable onPress={pickAndUpload} disabled={uploading}>
            <View
              className="h-40 w-40 overflow-hidden rounded-full"
              style={{
                borderWidth: 2.5,
                borderColor: hasCustomAvatar ? c.brand : c.border,
              }}
            >
              <Image
                source={{ uri: displayUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
              {uploading && (
                <View
                  className="absolute inset-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
                >
                  <Spinner
                    size={40}
                    color="#fff"
                    trackColor="rgba(255,255,255,0.3)"
                    strokeWidth={3}
                  />
                </View>
              )}
            </View>

            {/* Upload badge */}
            <View
              className="absolute bottom-0 right-0 h-10 w-10 items-center justify-center rounded-full bg-brand"
              style={{ elevation: 3 }}
            >
              <HugeiconsIcon icon={ImageUpload01Icon} size={18} color="#fff" />
            </View>
          </Pressable>

          <Text className="text-center text-sm" style={{ color: c.secondary }}>
            {uploading
              ? t("onboarding.avatar.uploading")
              : hasCustomAvatar
                ? t("onboarding.avatar.uploaded")
                : t("onboarding.avatar.tapToChoose")}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(300)} className="gap-3 pb-4">
          <Button
            label={t("common.next")}
            onPress={onNext}
            fullWidth
            size="lg"
            disabled={uploading}
          />
          <Pressable onPress={onNext} disabled={uploading} className="items-center py-2">
            <Text variant="medium" className="text-sm" style={{ color: c.muted }}>
              {t("common.skip")}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
