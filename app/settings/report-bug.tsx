import { View, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft02Icon, ArrowRight01Icon, Bug01Icon } from "@hugeicons/core-free-icons";
import { useLanguageStore } from "@/stores/language-store";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useThemeColors } from "@/lib/theme";
import { api } from "@/lib/api";

export default function ReportBug() {
  const router = useRouter();
  const { t } = useTranslation();
  const c = useThemeColors();
  const { language } = useLanguageStore();
  const BackIcon = language === "ar" ? ArrowRight01Icon : ArrowLeft02Icon;

  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");

  const sendMutation = useMutation({
    mutationFn: async () => {
      await api.post("/feedback", {
        type: "bug",
        description,
        steps: steps || null,
      });
    },
    onSuccess: () => {
      toast.success(t("feedback.toastSent"));
      router.back();
    },
    onError: () => {
      toast.error(t("feedback.toastError"));
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
          {t("settings.reportBug")}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInUp.duration(400).delay(40)}>
            <Text className="text-sm leading-5" style={{ color: c.secondary }}>
              {t("feedback.reportBugSubtitle")}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(400).delay(80)}
            className="overflow-hidden rounded-xl bg-white dark:bg-bg-card p-4"
          >
            <Text variant="semibold" className="mb-2 text-sm text-brand dark:text-white">
              {t("feedback.descriptionLabel")} *
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={t("feedback.descriptionPlaceholder")}
              placeholderTextColor={c.muted}
              multiline
              numberOfLines={5}
              spellCheck={false}
              autoCorrect={false}
              style={{
                minHeight: 120,
                color: c.brand,
                fontSize: 14,
                textAlignVertical: "top",
                fontFamily: Platform.OS === "android"
                  ? (language === "ar" ? "IBMPlexSansArabic_400Regular" : "Manrope_400Regular")
                  : undefined,
              }}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(400).delay(120)}
            className="overflow-hidden rounded-xl bg-white dark:bg-bg-card p-4"
          >
            <Text variant="semibold" className="mb-2 text-sm text-brand dark:text-white">
              {t("feedback.stepsLabel")}
            </Text>
            <TextInput
              value={steps}
              onChangeText={setSteps}
              placeholder={t("feedback.stepsPlaceholder")}
              placeholderTextColor={c.muted}
              multiline
              numberOfLines={4}
              spellCheck={false}
              autoCorrect={false}
              style={{
                minHeight: 96,
                color: c.brand,
                fontSize: 14,
                textAlignVertical: "top",
                fontFamily: Platform.OS === "android"
                  ? (language === "ar" ? "IBMPlexSansArabic_400Regular" : "Manrope_400Regular")
                  : undefined,
              }}
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(400).delay(160)}>
            <Button
              label={t("feedback.send")}
              onPress={() => {
                if (!description.trim()) {
                  toast.error(t("feedback.descriptionPlaceholder"));
                  return;
                }
                sendMutation.mutate();
              }}
              loading={sendMutation.isPending}
              disabled={!description.trim()}
              fullWidth
              size="lg"
              leftIcon={<HugeiconsIcon icon={Bug01Icon} size={18} color="#fff" />}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
