import { View, FlatList, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon, FavouriteIcon } from "@hugeicons/core-free-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { ProductCard } from "@/components/product/product-card";
import { api } from "@/lib/api";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useThemeColors } from "@/lib/theme";
import type { HomeProduct } from "@/lib/queries/home";

function useWishlistProducts() {
  const ids = useWishlistStore((s) => s.ids);

  return useQuery({
    queryKey: ["wishlist", Array.from(ids).sort().join(",")],
    queryFn: async () => {
      const res = await api.get("/client/wishlist");
      return res.data.data as HomeProduct[];
    },
  });
}

export default function Wishlist() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useThemeColors();
  const { data: products = [], isLoading, isRefetching, refetch } = useWishlistProducts();

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={["top"]}>
      <View className="flex-row items-center gap-3 px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color={c.brand} />
        </Pressable>
        <Text variant="bold" className="text-xl text-brand dark:text-white">
          {t("wishlist.title")}
        </Text>
        {products.length > 0 && (
          <Text className="ml-auto text-sm" style={{ color: c.secondary }}>
            {products.length} {products.length === 1 ? t("common.item") : t("common.items")}
          </Text>
        )}
      </View>

      {!isLoading && products.length === 0 ? (
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="flex-1 items-center justify-center gap-4 px-8"
        >
          <View className="h-20 w-20 items-center justify-center rounded-full bg-white dark:bg-bg-card">
            <HugeiconsIcon icon={FavouriteIcon} size={36} color={c.border} />
          </View>
          <Text variant="bold" className="text-center text-xl text-brand dark:text-white">
            {t("wishlist.empty")}
          </Text>
          <Text className="text-center text-sm leading-5" style={{ color: c.secondary }}>
            {t("wishlist.emptyDesc")}
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={{ padding: 12, paddingTop: 4 }}
          columnWrapperStyle={{ gap: 8 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor="transparent"
              colors={["transparent"]}
              progressBackgroundColor="transparent"
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.duration(400).delay(index * 40)}
              style={{ flex: 1 }}
            >
              <ProductCard product={item} width="100%" />
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
