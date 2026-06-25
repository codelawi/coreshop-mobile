import { View, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Location01Icon,
  PlusSignIcon,
  Edit02Icon,
  Delete02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner-native";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useThemeColors } from "@/lib/theme";
import { Spinner } from "@/components/ui/spinner";
import {
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/lib/queries/addresses";

export default function AddressesList() {
  const router = useRouter();
  const c = useThemeColors();
  const { t } = useTranslation();
  const { data: addresses, isLoading } = useAddresses();
  const deleteMutation = useDeleteAddress();
  const setDefaultMutation = useSetDefaultAddress();

  const confirmDelete = (id: number) => {
    Alert.alert(t("addresses.removeTitle"), t("addresses.removeDesc"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.remove"),
        style: "destructive",
        onPress: () => {
          deleteMutation.mutate(id, {
            onSuccess: () => toast.success(t("addresses.toastRemoved")),
            onError: () => toast.error(t("addresses.toastRemoveError")),
          });
        },
      },
    ]);
  };

  const onSetDefault = (id: number) => {
    setDefaultMutation.mutate(id, {
      onSuccess: () => toast.success(t("addresses.toastDefaultUpdated")),
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-bg-card"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color={c.brand} />
        </Pressable>
        <Text variant="bold" className="text-xl text-brand dark:text-white">{t("addresses.title")}</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Spinner size={44} />
        </View>
      ) : !addresses || addresses.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-brand-50 dark:bg-[#2A2A2A]">
            <HugeiconsIcon icon={Location01Icon} size={40} color={c.brand} />
          </View>
          <Text variant="bold" className="mt-4 text-lg text-brand dark:text-white">{t("addresses.empty")}</Text>
          <Text className="mt-1 text-center text-sm" style={{ color: c.secondary }}>
            {t("addresses.emptyDesc")}
          </Text>
          <View className="mt-6 w-full">
            <Button
              label={t("addresses.addAddress")}
              onPress={() => router.push("/addresses/new" as any)}
              fullWidth
              size="lg"
              leftIcon={<HugeiconsIcon icon={PlusSignIcon} size={20} color="#fff" />}
            />
          </View>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            {addresses.map((a, i) => (
              <Animated.View
                key={a.id}
                entering={FadeInUp.duration(400).delay(i * 50)}
                className="mb-3 rounded-md bg-white dark:bg-bg-card p-4"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Text variant="bold" className="text-base text-brand dark:text-white">{a.label}</Text>
                    {a.is_default ? (
                      <View className="rounded-full bg-brand px-2 py-0.5">
                        <Text variant="semibold" style={{ color: "#fff", fontSize: 10 }}>
                          {t("addresses.default")}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => router.push(`/addresses/${a.id}` as any)}
                      hitSlop={6}
                    >
                      <HugeiconsIcon icon={Edit02Icon} size={18} color={c.brand} />
                    </Pressable>
                    <Pressable onPress={() => confirmDelete(a.id)} hitSlop={6}>
                      <HugeiconsIcon icon={Delete02Icon} size={18} color="#FF4D4F" />
                    </Pressable>
                  </View>
                </View>
                <Text variant="semibold" className="mt-2 text-sm text-brand dark:text-white">
                  {a.recipient_name}
                </Text>
                <Text className="text-sm" style={{ color: c.secondary }}>{a.phone}</Text>
                <Text className="mt-1 text-sm" style={{ color: c.secondary }}>
                  {a.address_line}, {a.city}
                  {a.building ? `, Bldg ${a.building}` : ""}
                  {a.floor ? `, Fl ${a.floor}` : ""}
                  {a.apartment ? `, Apt ${a.apartment}` : ""}
                </Text>
                {!a.is_default ? (
                  <Pressable
                    onPress={() => onSetDefault(a.id)}
                    className="mt-3 flex-row items-center gap-1.5 self-start"
                  >
                    <HugeiconsIcon icon={Tick02Icon} size={14} color={c.brand} />
                    <Text variant="medium" className="text-xs text-brand dark:text-white">
                      {t("addresses.setAsDefault")}
                    </Text>
                  </Pressable>
                ) : null}
              </Animated.View>
            ))}
          </ScrollView>

          <SafeAreaView edges={["bottom"]} className="absolute bottom-0 left-0 right-0 bg-white dark:bg-bg-card">
            <View className="border-t border-brand-100 dark:border-[#2A2A2A] px-6 py-3">
              <Button
                label={t("addresses.addNewAddress")}
                onPress={() => router.push("/addresses/new" as any)}
                fullWidth
                size="lg"
                leftIcon={<HugeiconsIcon icon={PlusSignIcon} size={20} color="#fff" />}
              />
            </View>
          </SafeAreaView>
        </>
      )}
    </SafeAreaView>
  );
}
