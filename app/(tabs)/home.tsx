import { View, ScrollView, RefreshControl, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Search01Icon, ShoppingCart01Icon, Notification03Icon } from "@hugeicons/core-free-icons";

import { Text } from "@/components/ui/text";
import { useHome } from "@/lib/queries/home";
import { useAuthStore } from "@/stores/auth-store";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { CategoryCircle } from "@/components/home/category-circle";
import { ProductCard } from "@/components/product/product-card";
import { StoreCard } from "@/components/home/store-card";
import { SectionHeader } from "@/components/home/section-header";

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isRefetching, refetch } = useHome();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg-light">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0A0A0A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-light" edges={["top"]}>
      <Animated.View entering={FadeInDown.duration(400)} className="flex-row items-center gap-3 px-6 pb-3 pt-2">
        <View className="flex-1">
          <Text className="text-xs" style={{ color: "#6B7280" }}>Hello,</Text>
          <Text variant="bold" className="text-lg text-brand" numberOfLines={1}>
            {user?.name ?? "Welcome"}
          </Text>
        </View>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white">
          <HugeiconsIcon icon={Notification03Icon} size={22} color="#0A0A0A" />
        </Pressable>
        <Pressable
          onPress={() => router.push("/(tabs)/cart" as any)}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <HugeiconsIcon icon={ShoppingCart01Icon} size={22} color="#0A0A0A" />
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(80)} className="px-6 pb-3">
        <Pressable
          onPress={() => router.push("/(tabs)/search" as any)}
          className="h-12 flex-row items-center rounded-md bg-white px-4"
        >
          <HugeiconsIcon icon={Search01Icon} size={20} color="#6B7280" />
          <Text className="ml-3 text-sm" style={{ color: "#9CA3AF" }}>Search products, stores...</Text>
        </Pressable>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0A0A0A" />}
      >
        {data?.banners && data.banners.length > 0 ? (
          <Animated.View entering={FadeInUp.duration(500).delay(150)} className="px-6">
            <BannerCarousel banners={data.banners} />
          </Animated.View>
        ) : null}

        {data?.categories && data.categories.length > 0 ? (
          <Animated.View entering={FadeInUp.duration(500).delay(200)} className="mt-6 px-6">
            <SectionHeader title="Categories" action="See all" onActionPress={() => router.push("/(tabs)/categories" as any)} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {data.categories.map((c) => (
                <CategoryCircle key={c.id} category={c} />
              ))}
            </ScrollView>
          </Animated.View>
        ) : null}

        {data?.flash_deals && data.flash_deals.length > 0 ? (
          <Animated.View entering={FadeInUp.duration(500).delay(250)} className="mt-6 px-6">
            <SectionHeader title="Flash Deals" action="See all" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {data.flash_deals.map((p) => (
                <View key={p.id} style={{ width: 160 }}>
                  <ProductCard product={p} width="100%" />
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        ) : null}

        {data?.top_stores && data.top_stores.length > 0 ? (
          <Animated.View entering={FadeInUp.duration(500).delay(300)} className="mt-6 px-6">
            <SectionHeader title="Top Stores" action="See all" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {data.top_stores.map((s) => (
                <StoreCard key={s.id} store={s} />
              ))}
            </ScrollView>
          </Animated.View>
        ) : null}

        {data?.trending && data.trending.length > 0 ? (
          <Animated.View entering={FadeInUp.duration(500).delay(350)} className="mt-6 px-6">
            <SectionHeader title="Trending Now" />
            <View className="flex-row flex-wrap justify-between">
              {data.trending.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </View>
          </Animated.View>
        ) : null}

        {data?.featured && data.featured.length > 0 ? (
          <Animated.View entering={FadeInUp.duration(500).delay(400)} className="mt-6 px-6">
            <SectionHeader title="Featured" />
            <View className="flex-row flex-wrap justify-between">
              {data.featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}