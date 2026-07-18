import { View, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { UserIcon, ShoppingBag01Icon, Store01Icon, Car01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner-native";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/onboarding/progress-bar";
import { useOnboardingStore, type Role } from "@/stores/onboarding-store";
import { useThemeColors } from "@/lib/theme";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type FormData = z.infer<typeof schema>;

const ROLES: { id: Role; icon: any; disabled?: boolean }[] = [
  { id: "client", icon: ShoppingBag01Icon },
  { id: "seller", icon: Store01Icon },
  { id: "driver", icon: Car01Icon, disabled: true },
];

export default function ProfileStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useThemeColors();
  const { name: storedName, role: storedRole, setName, setRole } = useOnboardingStore();
  const [selectedRole, setSelectedRole] = useState<Role | null>(storedRole);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: storedName },
  });

  const onNext = (data: FormData) => {
    if (!selectedRole) {
      toast.error(t("onboarding.profile.pleaseSelectRole"));
      return;
    }
    setName(data.name);
    setRole(selectedRole);
    router.push("/(onboarding)/avatar" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-4">
          <ProgressBar current={1} total={4} />

          <ScrollView
            className="mt-8"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={FadeInDown.duration(500).springify()}>
              <Text variant="bold" className="text-3xl text-brand dark:text-white">
                {t("onboarding.profile.title")}
              </Text>
              <Text className="mt-2 text-base" style={{ color: c.secondary }}>
                {t("onboarding.profile.subtitle")}
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(600).delay(150)}
              className="mt-8"
            >
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={t("onboarding.profile.name")}
                    placeholder="John Doe"
                    value={value}
                    onChangeText={onChange}
                    error={errors.name?.message}
                    leftIcon={<HugeiconsIcon icon={UserIcon} size={22} color={c.brand} />}
                  />
                )}
              />
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(600).delay(250)}
              className="mt-6 gap-3"
            >
              <Text variant="medium" className="text-sm text-brand dark:text-white">
                {t("onboarding.profile.role")}
              </Text>
              {ROLES.map((r) => {
                const isSelected = selectedRole === r.id;
                return (
                  <Pressable
                    key={r.id}
                    disabled={r.disabled}
                    onPress={() => setSelectedRole(r.id)}
                    className={`flex-row items-center rounded-md border bg-white dark:bg-bg-card p-4 ${
                      isSelected ? "border-brand" : "border-brand-100 dark:border-[#2A2A2A]"
                    } ${r.disabled ? "opacity-50" : ""}`}
                  >
                    <View className="h-12 w-12 items-center justify-center rounded-md bg-brand-50 dark:bg-[#2A2A2A]">
                      <HugeiconsIcon icon={r.icon} size={24} color={c.brand} />
                    </View>
                    <View className="ml-4 flex-1">
                      <Text variant="semibold" className="text-base text-brand dark:text-white">
                        {t(`onboarding.profile.roles.${r.id}`)}
                      </Text>
                      <Text className="text-xs" style={{ color: c.secondary }}>
                        {t(`onboarding.profile.roles.${r.id}Desc`)}
                      </Text>
                    </View>
                    {isSelected && (
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-brand">
                        <HugeiconsIcon icon={Tick02Icon} size={14} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </Animated.View>
          </ScrollView>

          <Animated.View entering={FadeInUp.duration(600).delay(400)} className="pb-4 pt-4">
            <Button
              label={t("common.next")}
              onPress={handleSubmit(onNext)}
              fullWidth
              size="lg"
            />
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}