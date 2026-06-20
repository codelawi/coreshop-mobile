import { View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  StarIcon,
  Location01Icon,
  Call02Icon,
  Share01Icon,
  Store01Icon,
} from "@hugeicons/core-free-icons";

import { Text } from "@/components/ui/text";
import { ProductCard } from "@/components/product/product-card";
import { useStore } from "@/lib/queries/home";

export default function StoreProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: store, isLoading } = useStore(id);

  if (isLoading || !store) {
    return (
      <SafeAreaView className="flex-1 bg-bg-light">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0A0A0A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-bg-light">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="h-56 w-full bg-brand-50">
          {store.banner ? (
            <Image source={{ uri: store.banner }} style={{ flex: 1 }} contentFit="cover" />
          ) : null}
          <View className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.2)" }} />
          <SafeAreaView edges={["top"]} className="absolute left-0 right-0 top-0">
            <View className="flex-row items-center justify-between px-4 pt-2">
              <Pressable
                onPress={() => router.back()}
                className="h-10 w-10 items-center justify-center rounded-full bg-white"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#0A0A0A" />
              </Pressable>
              <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white">
                <HugeiconsIcon icon={Share01Icon} size={20} color="#0A0A0A" />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>

        <Animated.View entering={FadeInUp.duration(400)} className="-mt-16 items-center px-6">
          <View className="h-28 w-28 overflow-hidden rounded-full border-4 border-bg-light bg-white">
            {store.logo ? (
              <Image source={{ uri: store.logo }} style={{ flex: 1 }} contentFit="cover" />
            ) : (
              <View className="flex-1 items-center justify-center">
                <HugeiconsIcon icon={Store01Icon} size={36} color="#0A0A0A" />
              </View>
            )}
          </View>
          <Text variant="bold" className="mt-3 text-xl text-brand">{store.name}</Text>
          <View
            className="mt-1.5 rounded-full px-2.5 py-0.5"
            style={{ backgroundColor: store.is_open ? "#16A34A" : "#9CA3AF" }}
          >
            <Text variant="semibold" style={{ color: "#fff", fontSize: 11 }}>
              {store.is_open ? "Open Now" : "Closed"}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(400).delay(80)}
          className="mx-6 mt-4 flex-row rounded-md bg-white py-3"
        >
          <View className="flex-1 items-center">
            <View className="flex-row items-center gap-1">
              <HugeiconsIcon icon={StarIcon} size={14} color="#F59E0B" />
              <Text variant="bold" className="text-base text-brand">
                {parseFloat(store.rating).toFixed(1)}
              </Text>
            </View>
            <Text className="text-xs" style={{ color: "#6B7280" }}>
              {store.reviews_count} reviews
            </Text>
          </View>
          <View className="w-px bg-brand-100" />
          <View className="flex-1 items-center">
            <Text variant="bold" className="text-base text-brand">{store.sales_count}</Text>
            <Text className="text-xs" style={{ color: "#6B7280" }}>Sales</Text>
          </View>
          <View className="w-px bg-brand-100" />
          <View className="flex-1 items-center">
            <Text variant="bold" className="text-base text-brand">{store.products.length}</Text>
            <Text className="text-xs" style={{ color: "#6B7280" }}>Products</Text>
          </View>
        </Animated.View>

        {store.description ? (
          <Animated.View
            entering={FadeInUp.duration(400).delay(140)}
            className="mx-6 mt-3 rounded-md bg-white p-4"
          >
            <Text className="text-sm leading-5" style={{ color: "#374151" }}>
              {store.description}
            </Text>
          </Animated.View>
        ) : null}

        <Animated.View
          entering={FadeInUp.duration(400).delay(180)}
          className="mx-6 mt-3 gap-3 rounded-md bg-white p-4"
        >
          {store.address ? (
            <View className="flex-row items-center gap-3">
              <HugeiconsIcon icon={Location01Icon} size={18} color="#0A0A0A" />
              <Text className="flex-1 text-sm text-brand">
                {store.address}{store.city ? `, ${store.city}` : ""}
              </Text>
            </View>
          ) : null}
          {store.phone ? (
            <View className="flex-row items-center gap-3">
              <HugeiconsIcon icon={Call02Icon} size={18} color="#0A0A0A" />
              <Text className="flex-1 text-sm text-brand">{store.phone}</Text>
            </View>
          ) : null}
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(400).delay(220)}
          className="mt-4 px-6"
        >
          <Text variant="bold" className="text-lg text-brand">Products</Text>
          <View className="mt-3 flex-row flex-wrap justify-between">
            {store.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}