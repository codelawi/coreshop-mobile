import { View, ScrollView, RefreshControl, Pressable, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Search01Icon, ShoppingCart01Icon, Notification03Icon, Store01Icon, MessageMultiple01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useHome } from "@/lib/queries/home";
import { useAuthStore } from "@/stores/auth-store";
import { useUnreadCount, useSupportUnreadCount } from "@/lib/queries/notifications";
import { useSellerStore } from "@/lib/queries/seller";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { CategoryCircle } from "@/components/home/category-circle";
import { ProductCard } from "@/components/product/product-card";
import { StoreCard } from "@/components/home/store-card";
import { SectionHeader } from "@/components/home/section-header";
import { useThemeColors } from "@/lib/theme";
import { Skeleton, SkeletonProductCard, SkeletonHomeSection } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isRefetching, refetch } = useHome();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: supportUnreadCount = 0 } = useSupportUnreadCount();
  const bellBadge = unreadCount + supportUnreadCount;
  const [storeModalDismissed, setStoreModalDismissed] = useState(false);
  const { data: sellerStore, isLoading: isLoadingStore } = useSellerStore(user?.role === "seller");
  const showStoreModal =
    user?.role === "seller" && !isLoadingStore && sellerStore === null && !storeModalDismissed;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={['top', 'left', 'right']}>
        <View style={{ paddingHorizontal: 24, paddingTop: 16, gap: 24 }}>
          <Skeleton width="55%" height={20} />
          <Skeleton width="100%" height={160} radius={10} />
          <View style={{ flexDirection: "row", gap: 14 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={{ alignItems: "center", gap: 6 }}>
                <Skeleton width={60} height={60} radius={30} />
                <Skeleton width={48} height={10} />
              </View>
            ))}
          </View>
          <SkeletonHomeSection />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={['top', 'left', 'right']}>
      <Animated.View entering={FadeInDown.duration(400)} className="flex-row items-center gap-3 px-6 pb-3 pt-2">
        <View className="flex-1">
          <Text className="text-xs" style={{ color: c.secondary }}>{t("home.hello")}</Text>
          <Text variant="bold" className="text-lg text-brand dark:text-white" numberOfLines={1}>
            {user?.name ?? t("home.welcome")}
          </Text>
        </View>
        {user?.role === "seller" ? (
          /* Seller: chats button */
          <Pressable
            onPress={() => router.push("/seller/chats" as any)}
            className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-bg-card"
          >
            <HugeiconsIcon icon={MessageMultiple01Icon} size={22} color={c.brand} />
          </Pressable>
        ) : (
          /* Client: notification bell */
          <Pressable
            onPress={() => router.push("/notifications" as any)}
            className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-bg-card"
          >
            <HugeiconsIcon icon={Notification03Icon} size={22} color={c.brand} />
            {bellBadge > 0 ? (
              <View
                className="absolute right-0.5 top-0.5 h-4 min-w-[16px] items-center justify-center rounded-full px-0.5"
                style={{ backgroundColor: "#FF4D4F" }}
              >
                <Text variant="bold" style={{ color: "#fff", fontSize: 8 }}>
                  {bellBadge > 9 ? "9+" : bellBadge}
                </Text>
              </View>
            ) : null}
          </Pressable>
        )}
        {user?.role === "seller" ? (
          /* Seller: store dashboard button */
          <Pressable
            onPress={() => router.push("/seller" as any)}
            className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-bg-card"
          >
            <HugeiconsIcon icon={Store01Icon} size={22} color={c.brand} />
            {(sellerStore?.pending_orders_count ?? 0) > 0 ? (
              <View
                className="absolute right-0.5 top-0.5 h-4 min-w-[16px] items-center justify-center rounded-full px-0.5"
                style={{ backgroundColor: "#FF4D4F" }}
              >
                <Text variant="bold" style={{ color: "#fff", fontSize: 8 }}>
                  {(sellerStore?.pending_orders_count ?? 0) > 9 ? "9+" : sellerStore?.pending_orders_count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ) : (
          /* Client: chats button */
          <Pressable
            onPress={() => router.push("/chats" as any)}
            className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-bg-card"
          >
            <HugeiconsIcon icon={MessageMultiple01Icon} size={22} color={c.brand} />
          </Pressable>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(80)} className="px-6 pb-3">
        <Pressable
          onPress={() => router.push("/(tabs)/search" as any)}
          className="h-12 flex-row items-center rounded-md bg-white dark:bg-bg-card px-4"
        >
          <HugeiconsIcon icon={Search01Icon} size={20} color={c.secondary} />
          <Text className="ml-3 text-sm" style={{ color: c.muted }}>{t("home.searchPlaceholder")}</Text>
        </Pressable>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#0A0A0A"
            colors={["#0A0A0A"]}
          />
        }
      >
        {data?.banners && data.banners.length > 0 ? (
          <Animated.View entering={FadeInUp.duration(500).delay(150)} className="px-6">
            <BannerCarousel banners={data.banners} />
          </Animated.View>
        ) : null}

        {data?.categories && data.categories.length > 0 ? (
          <Animated.View entering={FadeInUp.duration(500).delay(200)} className="mt-6 px-6">
            <SectionHeader
              title={t("home.categories")}
              action={t("common.seeAll")}
              onActionPress={() => router.push("/(tabs)/categories" as any)}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {data.categories.map((cat) => (
                <CategoryCircle key={cat.id} category={cat} />
              ))}
            </ScrollView>
          </Animated.View>
        ) : null}

        {data?.flash_deals && data.flash_deals.length > 0 ? (
          <Animated.View entering={FadeInUp.duration(500).delay(250)} className="mt-6 px-6">
            <SectionHeader title={t("home.flashDeals")} action={t("common.seeAll")} />
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
            <SectionHeader title={t("home.topStores")} action={t("common.seeAll")} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {data.top_stores.map((s) => (
                <StoreCard key={s.id} store={s} />
              ))}
            </ScrollView>
          </Animated.View>
        ) : null}

        {data?.trending && data.trending.length > 0 ? (
          <Animated.View entering={FadeInUp.duration(500).delay(350)} className="mt-6 px-6">
            <SectionHeader title={t("home.trending")} />
            <View className="flex-row flex-wrap justify-between">
              {data.trending.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </View>
          </Animated.View>
        ) : null}

        {data?.featured && data.featured.length > 0 ? (
          <Animated.View entering={FadeInUp.duration(500).delay(400)} className="mt-6 px-6">
            <SectionHeader title={t("home.featured")} />
            <View className="flex-row flex-wrap justify-between">
              {data.featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>

      <Modal visible={showStoreModal} transparent animationType="fade" statusBarTranslucent>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View className="mx-4 mb-8 rounded-2xl bg-white dark:bg-bg-card p-6">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-brand dark:bg-white">
              <HugeiconsIcon icon={Store01Icon} size={28} color={c.isDark ? "#0A0A0A" : "#FFFFFF"} />
            </View>
            <Text variant="bold" className="text-xl text-brand dark:text-white">
              {t("seller.storePrompt.modalTitle")}
            </Text>
            <Text className="mt-2 text-sm leading-5" style={{ color: c.secondary }}>
              {t("seller.storePrompt.modalDesc")}
            </Text>
            <View className="mt-5 gap-3">
              <Button
                label={t("seller.storePrompt.setupNow")}
                onPress={() => {
                  setStoreModalDismissed(true);
                  router.push("/seller/setup" as any);
                }}
                fullWidth
                size="lg"
              />
              <Button
                label={t("seller.storePrompt.later")}
                variant="outline"
                onPress={() => setStoreModalDismissed(true)}
                fullWidth
                size="lg"
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
