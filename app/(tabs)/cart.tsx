import { View, ScrollView, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, FadeInUp, FadeOut } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  PlusSignIcon,
  MinusSignIcon,
  Delete02Icon,
  ShoppingCart01Icon,
  Store01Icon,
} from "@hugeicons/core-free-icons";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { useThemeColors } from "@/lib/theme";

export default function Cart() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useThemeColors();
  const items = useCartStore((s) => s.items);
  const storeName = useCartStore((s) => s.storeName);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const total = useCartStore((s) => s.total());
  const count = useCartStore((s) => s.count());

  const confirmClear = () => {
    Alert.alert(t("cart.clearTitle"), t("cart.clearDesc"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("cart.clear"), style: "destructive", onPress: clear },
    ]);
  };

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={["top"]}>
        <View className="px-6 pt-4">
          <Text variant="bold" className="text-2xl text-brand dark:text-white">{t("cart.title")}</Text>
        </View>
        <Animated.View
          entering={FadeInUp.duration(400)}
          className="flex-1 items-center justify-center px-6"
        >
          <View className="h-24 w-24 items-center justify-center rounded-full bg-brand-50 dark:bg-[#2A2A2A]">
            <HugeiconsIcon icon={ShoppingCart01Icon} size={40} color={c.brand} />
          </View>
          <Text variant="bold" className="mt-4 text-lg text-brand dark:text-white">{t("cart.empty")}</Text>
          <Text className="mt-1 text-center text-sm" style={{ color: c.secondary }}>
            {t("cart.emptyDesc")}
          </Text>
          <View className="mt-6 w-full">
            <Button
              label={t("cart.startShopping")}
              onPress={() => router.push("/(tabs)/home" as any)}
              fullWidth
              size="lg"
            />
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={["top"]}>
      <View className="flex-row items-center justify-between px-6 pb-2 pt-4">
        <View>
          <Text variant="bold" className="text-2xl text-brand dark:text-white">{t("cart.title")}</Text>
          <Text className="text-xs" style={{ color: c.secondary }}>
            {count} {count === 1 ? t("common.item") : t("common.items")}
          </Text>
        </View>
        <Pressable onPress={confirmClear} hitSlop={6}>
          <Text variant="medium" className="text-sm" style={{ color: "#FF4D4F" }}>
            {t("cart.clear")}
          </Text>
        </Pressable>
      </View>

      <Animated.View
        entering={FadeInDown.duration(400)}
        className="mx-6 mt-2 flex-row items-center gap-2 rounded-md bg-white dark:bg-bg-card p-3"
      >
        <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-50 dark:bg-[#2A2A2A]">
          <HugeiconsIcon icon={Store01Icon} size={18} color={c.brand} />
        </View>
        <View className="flex-1">
          <Text className="text-xs" style={{ color: c.secondary }}>{t("cart.orderingFrom")}</Text>
          <Text variant="semibold" className="text-sm text-brand dark:text-white">{storeName}</Text>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item, i) => (
          <Animated.View
            key={item.id}
            entering={FadeInUp.duration(400).delay(i * 50)}
            exiting={FadeOut.duration(200)}
            className="mb-3 flex-row gap-3 rounded-md bg-white dark:bg-bg-card p-3"
          >
            <View className="h-20 w-20 overflow-hidden rounded-md bg-brand-50 dark:bg-[#2A2A2A]">
              {item.image ? (
                <Image source={{ uri: item.image }} style={{ flex: 1 }} contentFit="cover" />
              ) : null}
            </View>
            <View className="flex-1">
              <View className="flex-row items-start justify-between gap-2">
                <Text variant="semibold" numberOfLines={2} className="flex-1 text-sm text-brand dark:text-white">
                  {item.name}
                </Text>
                <Pressable onPress={() => remove(item.id)} hitSlop={6}>
                  <HugeiconsIcon icon={Delete02Icon} size={18} color="#FF4D4F" />
                </Pressable>
              </View>
              {item.variant_label ? (
                <Text className="mt-0.5 text-xs" style={{ color: c.secondary }}>
                  {item.variant_label}
                </Text>
              ) : null}
              <View className="mt-2 flex-row items-center justify-between">
                <Text variant="bold" className="text-base text-brand dark:text-white">
                  JOD {(item.price * item.quantity).toFixed(2)}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => setQty(item.id, item.quantity - 1)}
                    className="h-8 w-8 items-center justify-center rounded-md border border-brand-100 dark:border-[#3A3A3A]"
                  >
                    <HugeiconsIcon icon={MinusSignIcon} size={14} color={c.brand} />
                  </Pressable>
                  <Text variant="bold" className="min-w-[24px] text-center text-sm text-brand dark:text-white">
                    {item.quantity}
                  </Text>
                  <Pressable
                    onPress={() => setQty(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="h-8 w-8 items-center justify-center rounded-md border border-brand-100 dark:border-[#3A3A3A]"
                    style={{ opacity: item.quantity >= item.stock ? 0.4 : 1 }}
                  >
                    <HugeiconsIcon icon={PlusSignIcon} size={14} color={c.brand} />
                  </Pressable>
                </View>
              </View>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      <View style={{ backgroundColor: c.card }}>
        <Animated.View
          entering={FadeInDown.duration(500)}
          className="border-t border-brand-100 dark:border-[#2A2A2A] px-6 py-4"
        >
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-sm" style={{ color: c.secondary }}>{t("cart.subtotal")}</Text>
            <Text variant="bold" className="text-xl text-brand dark:text-white">
              JOD {total.toFixed(2)}
            </Text>
          </View>
          <Text className="mb-3 text-xs" style={{ color: c.secondary }}>
            {t("cart.deliveryNote")}
          </Text>
          <Button
            label={t("cart.checkout")}
            onPress={() => router.push("/checkout" as any)}
            fullWidth
            size="lg"
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
