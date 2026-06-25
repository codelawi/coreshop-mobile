import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import Animated, { FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";

import { Text } from "@/components/ui/text";
import { ProductCard } from "@/components/product/product-card";
import { useProducts, type ProductFilters } from "@/lib/queries/home";
import { useThemeColors } from "@/lib/theme";
import { SkeletonProductCard } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

const SORTS: { id: NonNullable<ProductFilters["sort"]>; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "popular", label: "Popular" },
  { id: "rating", label: "Top Rated" },
  { id: "price_low", label: "Price: Low to High" },
  { id: "price_high", label: "Price: High to Low" },
];

export default function CategoryProducts() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = useThemeColors();
  const [sort, setSort] = useState<ProductFilters["sort"]>("popular");
  const [sortOpen, setSortOpen] = useState(false);

  const { data: category } = useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      const res = await api.get(`/categories/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const { data: products, isLoading } = useProducts({
    category_id: Number(id),
    sort,
    per_page: 40,
  });

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-bg-card"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color={c.brand} />
        </Pressable>
        <View className="flex-1">
          <Text variant="bold" className="text-xl text-brand dark:text-white" numberOfLines={1}>
            {category?.name ?? "Category"}
          </Text>
          {products ? (
            <Text className="text-xs" style={{ color: c.secondary }}>
              {products.length} products
            </Text>
          ) : null}
        </View>
      </View>

      <View className="flex-row items-center justify-between px-6 pt-2">
        <Pressable
          onPress={() => setSortOpen((p) => !p)}
          className="h-9 flex-row items-center gap-1.5 rounded-md border border-brand-100 dark:border-[#3A3A3A] px-3"
          style={{ backgroundColor: c.card }}
        >
          <Text variant="medium" className="text-xs text-brand dark:text-white">
            {SORTS.find((s) => s.id === sort)?.label}
          </Text>
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} color={c.brand} />
        </Pressable>
      </View>

      {sortOpen ? (
        <Animated.View
          entering={FadeInUp.duration(200)}
          className="mx-6 mt-2 overflow-hidden rounded-md border border-brand-100 dark:border-[#3A3A3A]"
          style={{ backgroundColor: c.card }}
        >
          {SORTS.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => {
                setSort(s.id);
                setSortOpen(false);
              }}
              className={`px-4 py-3 ${sort === s.id ? "bg-brand-50 dark:bg-[#2A2A2A]" : ""}`}
            >
              <Text variant={sort === s.id ? "semibold" : "regular"} className="text-sm text-brand dark:text-white">
                {s.label}
              </Text>
            </Pressable>
          ))}
        </Animated.View>
      ) : null}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View className="flex-row flex-wrap justify-between">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={{ width: "48%", marginBottom: 12 }}>
                <SkeletonProductCard />
              </View>
            ))}
          </View>
        ) : !products || products.length === 0 ? (
          <View className="items-center pt-12">
            <Text variant="semibold" className="text-base text-brand dark:text-white">No products</Text>
            <Text className="mt-1 text-sm" style={{ color: c.secondary }}>
              Nothing here yet
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
