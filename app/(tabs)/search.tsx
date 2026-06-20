import { View, ScrollView, TextInput, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import Animated, { FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Search01Icon,
  CancelCircleIcon,
  FilterIcon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";

import { Text } from "@/components/ui/text";
import { ProductCard } from "@/components/product/product-card";
import { useProducts, type ProductFilters } from "@/lib/queries/home";

const SORTS: { id: NonNullable<ProductFilters["sort"]>; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "popular", label: "Popular" },
  { id: "rating", label: "Top Rated" },
  { id: "price_low", label: "Price: Low to High" },
  { id: "price_high", label: "Price: High to Low" },
];

function useDebounced<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ProductFilters["sort"]>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const debouncedQuery = useDebounced(query, 400);

  const filters: ProductFilters = {
    search: debouncedQuery.trim() || undefined,
    sort,
    per_page: 30,
  };

  const { data: products, isLoading, isFetching } = useProducts(filters);

  return (
    <SafeAreaView className="flex-1 bg-bg-light">
      <View className="px-6 pt-4">
        <Text variant="bold" className="text-2xl text-brand">Search</Text>
      </View>

      <View className="px-6 pt-3">
        <View className="h-12 flex-row items-center rounded-md bg-white px-3">
          <HugeiconsIcon icon={Search01Icon} size={20} color="#6B7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search products, stores..."
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            className="flex-1 px-3 text-base"
            style={{ fontFamily: "Manrope_400Regular", color: "#0A0A0A" }}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} hitSlop={6}>
              <HugeiconsIcon icon={CancelCircleIcon} size={18} color="#6B7280" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View className="flex-row items-center justify-between px-6 pt-3">
        <Pressable
          onPress={() => setSortOpen((p) => !p)}
          className="h-9 flex-row items-center gap-1.5 rounded-md border border-brand-100 bg-white px-3"
        >
          <Text variant="medium" className="text-xs text-brand">
            {SORTS.find((s) => s.id === sort)?.label}
          </Text>
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} color="#0A0A0A" />
        </Pressable>
        <Pressable className="h-9 flex-row items-center gap-1.5 rounded-md border border-brand-100 bg-white px-3">
          <HugeiconsIcon icon={FilterIcon} size={14} color="#0A0A0A" />
          <Text variant="medium" className="text-xs text-brand">Filters</Text>
        </Pressable>
      </View>

      {sortOpen ? (
        <Animated.View
          entering={FadeInUp.duration(200)}
          className="mx-6 mt-2 overflow-hidden rounded-md border border-brand-100 bg-white"
        >
          {SORTS.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => {
                setSort(s.id);
                setSortOpen(false);
              }}
              className={`px-4 py-3 ${sort === s.id ? "bg-brand-50" : ""}`}
            >
              <Text variant={sort === s.id ? "semibold" : "regular"} className="text-sm text-brand">
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
        {isLoading || isFetching ? (
          <View className="items-center pt-12">
            <ActivityIndicator color="#0A0A0A" />
          </View>
        ) : !products || products.length === 0 ? (
          <View className="items-center pt-12">
            <Text variant="semibold" className="text-base text-brand">No results</Text>
            <Text className="mt-1 text-sm" style={{ color: "#6B7280" }}>
              Try a different search
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