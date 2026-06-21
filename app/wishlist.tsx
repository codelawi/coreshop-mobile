import { View, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon, FavouriteIcon } from "@hugeicons/core-free-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { ProductCard } from "@/components/product/product-card";
import { api } from "@/lib/api";
import { useWishlistStore } from "@/stores/wishlist-store";
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
  const router = useRouter();
  const { data: products = [], isLoading } = useWishlistProducts();

  return (
    <SafeAreaView className="flex-1 bg-bg-light" edges={["top"]}>
      <View className="flex-row items-center gap-3 px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#0A0A0A" />
        </Pressable>
        <Text variant="bold" className="text-xl text-brand">
          Wishlist
        </Text>
        {products.length > 0 && (
          <Text className="ml-auto text-sm" style={{ color: "#6B7280" }}>
            {products.length} {products.length === 1 ? "item" : "items"}
          </Text>
        )}
      </View>

      {!isLoading && products.length === 0 ? (
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="flex-1 items-center justify-center gap-4 px-8"
        >
          <View className="h-20 w-20 items-center justify-center rounded-full bg-white">
            <HugeiconsIcon icon={FavouriteIcon} size={36} color="#D1D5DB" />
          </View>
          <Text variant="bold" className="text-center text-xl text-brand">
            No saved items yet
          </Text>
          <Text className="text-center text-sm leading-5" style={{ color: "#6B7280" }}>
            Tap the heart on any product to save it here for later.
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
