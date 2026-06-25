import { View, ScrollView, TextInput, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import Animated, { FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Search01Icon,
  CancelCircleIcon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  StarIcon,
  Store01Icon,
} from "@hugeicons/core-free-icons";

import { useTranslation } from "react-i18next";
import { useLanguageStore } from "@/stores/language-store";

import { Text } from "@/components/ui/text";
import { ProductCard } from "@/components/product/product-card";
import {
  useProducts,
  useCategories,
  useStoresList,
  type ProductFilters,
  type HomeStore,
} from "@/lib/queries/home";
import { useThemeColors } from "@/lib/theme";
import { SkeletonProductCard } from "@/components/ui/skeleton";

// null = all products, number = category filter, 'stores' = stores mode
type CategoryMode = number | "stores" | null;
type OpenDropdown = "sort" | "category" | null;

function useDebounced<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function DropdownButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      className="h-9 flex-row items-center gap-1.5 rounded-md px-3"
      style={{
        backgroundColor: active ? c.brand : c.card,
        borderWidth: 1,
        borderColor: active ? c.brand : c.border,
      }}
    >
      <Text
        variant="medium"
        className="text-xs"
        style={{ color: active ? (c.isDark ? "#000" : "#fff") : c.brand }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <HugeiconsIcon
        icon={ArrowDown01Icon}
        size={13}
        color={active ? (c.isDark ? "#000" : "#fff") : c.brand}
      />
    </Pressable>
  );
}

function StoreListCard({ store }: { store: HomeStore }) {
  const router = useRouter();
  const c = useThemeColors();
  return (
    <Pressable
      onPress={() => router.push(`/store/${store.id}` as any)}
      className="mb-3 flex-row items-center gap-3 rounded-xl bg-white dark:bg-bg-card p-3"
    >
      <View className="h-12 w-12 overflow-hidden rounded-full bg-brand-50 dark:bg-[#2A2A2A]">
        {store.logo ? (
          <Image source={{ uri: store.logo }} style={{ flex: 1 }} contentFit="cover" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <HugeiconsIcon icon={Store01Icon} size={20} color={c.muted} />
          </View>
        )}
      </View>
      <View className="flex-1">
        <Text variant="semibold" className="text-sm text-brand dark:text-white">
          {store.name}
        </Text>
        {store.city ? (
          <Text className="text-xs" style={{ color: c.secondary }}>
            {store.city}
          </Text>
        ) : null}
        <View className="mt-0.5 flex-row items-center gap-1">
          <HugeiconsIcon icon={StarIcon} size={11} color="#F59E0B" />
          <Text variant="medium" className="text-xs" style={{ color: c.secondary }}>
            {parseFloat(store.rating).toFixed(1)}
          </Text>
          <Text className="text-xs" style={{ color: c.muted }}>
            · {store.reviews_count} reviews
          </Text>
        </View>
      </View>
      <HugeiconsIcon icon={ArrowRight01Icon} size={16} color={c.muted} />
    </Pressable>
  );
}

type SortId = NonNullable<ProductFilters["sort"]>;

export default function Search() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const language = useLanguageStore((s) => s.language);
  const isAr = language === "ar";
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ProductFilters["sort"]>("newest");

  const SORTS: { id: SortId; label: string }[] = [
    { id: "newest", label: t("search.sorts.newest") },
    { id: "popular", label: t("search.sorts.popular") },
    { id: "rating", label: t("search.sorts.rating") },
    { id: "price_low", label: t("search.sorts.price_low") },
    { id: "price_high", label: t("search.sorts.price_high") },
  ];
  const [categoryMode, setCategoryMode] = useState<CategoryMode>(null);
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
  const debouncedQuery = useDebounced(query, 400);

  const isStoresMode = categoryMode === "stores";
  const activeCategoryId = typeof categoryMode === "number" ? categoryMode : null;

  const { data: categories } = useCategories();
  const { data: stores, isLoading: storesLoading } = useStoresList(
    isStoresMode ? debouncedQuery : undefined,
  );

  const toggle = (name: OpenDropdown) =>
    setOpenDropdown((prev) => (prev === name ? null : name));

  const productFilters: ProductFilters = {
    search: debouncedQuery.trim() || undefined,
    sort,
    category_id: activeCategoryId ?? undefined,
    per_page: 30,
  };

  const { data: products, isLoading: productsLoading, isFetching, refetch } = useProducts(
    productFilters,
    !isStoresMode,
  );

  const categoryLabel = (() => {
    if (isStoresMode) { return t("search.stores"); }
    const cat = categories?.find((c) => c.id === activeCategoryId);
    if (!cat) { return t("search.category"); }
    return isAr && cat.name_ar ? cat.name_ar : cat.name;
  })();

  const sortLabel = SORTS.find((s) => s.id === sort)?.label ?? t("search.sort");

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={["top"]}>
      <View className="px-6 pt-4 pb-2">
        <Text variant="bold" className="text-2xl text-brand dark:text-white">{t("search.title")}</Text>
      </View>

      {/* Search input */}
      <View className="px-6">
        <View
          className="h-12 flex-row items-center rounded-md px-3"
          style={{ backgroundColor: c.card }}
        >
          <HugeiconsIcon icon={Search01Icon} size={20} color={c.secondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("search.placeholder")}
            placeholderTextColor={c.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            className="flex-1 px-3 text-base"
            style={{ fontFamily: "Manrope_400Regular", color: c.brand }}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} hitSlop={6}>
              <HugeiconsIcon icon={CancelCircleIcon} size={18} color={c.secondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Filter row — Sort left, Category right */}
      <View className="flex-row items-center justify-between px-6" style={{ paddingTop: 8, paddingBottom: 16 }}>
        <DropdownButton
          label={sortLabel}
          active={false}
          onPress={() => toggle("sort")}
        />
        <DropdownButton
          label={categoryLabel}
          active={categoryMode !== null}
          onPress={() => toggle("category")}
        />
      </View>

      {/* Sort dropdown */}
      {openDropdown === "sort" ? (
        <Animated.View
          entering={FadeInUp.duration(200)}
          className="mx-6 mb-4 overflow-hidden rounded-md border border-brand-100 dark:border-[#3A3A3A]"
          style={{ backgroundColor: c.card }}
        >
          {SORTS.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => {
                setSort(s.id);
                setOpenDropdown(null);
              }}
              className={`px-4 py-3 ${s.id !== SORTS[0].id ? "border-t border-brand-100 dark:border-[#2A2A2A]" : ""} ${sort === s.id ? "bg-brand-50 dark:bg-[#2A2A2A]" : ""}`}
            >
              <Text
                variant={sort === s.id ? "semibold" : "regular"}
                className="text-sm text-brand dark:text-white"
              >
                {s.label}
              </Text>
            </Pressable>
          ))}
        </Animated.View>
      ) : null}

      {/* Category dropdown — includes Stores as last option */}
      {openDropdown === "category" ? (
        <Animated.View
          entering={FadeInUp.duration(200)}
          className="mx-6 mb-4 overflow-hidden rounded-md border border-brand-100 dark:border-[#3A3A3A]"
          style={{ backgroundColor: c.card, maxHeight: 320 }}
        >
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <Pressable
              onPress={() => {
                setCategoryMode(null);
                setOpenDropdown(null);
              }}
              className={`px-4 py-3 ${categoryMode === null ? "bg-brand-50 dark:bg-[#2A2A2A]" : ""}`}
            >
              <Text
                variant={categoryMode === null ? "semibold" : "regular"}
                className="text-sm text-brand dark:text-white"
              >
                {t("search.allProducts")}
              </Text>
            </Pressable>

            {categories?.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => {
                  setCategoryMode(cat.id);
                  setOpenDropdown(null);
                }}
                className={`px-4 py-3 border-t border-brand-100 dark:border-[#2A2A2A] ${categoryMode === cat.id ? "bg-brand-50 dark:bg-[#2A2A2A]" : ""}`}
              >
                <Text
                  variant={categoryMode === cat.id ? "semibold" : "regular"}
                  className="text-sm text-brand dark:text-white"
                >
                  {isAr && cat.name_ar ? cat.name_ar : cat.name}
                </Text>
              </Pressable>
            ))}

            {/* Stores — last option */}
            <Pressable
              onPress={() => {
                setCategoryMode("stores");
                setOpenDropdown(null);
              }}
              className={`px-4 py-3 border-t border-brand-100 dark:border-[#2A2A2A] ${isStoresMode ? "bg-brand-50 dark:bg-[#2A2A2A]" : ""}`}
            >
              <Text
                variant={isStoresMode ? "semibold" : "regular"}
                className="text-sm text-brand dark:text-white"
              >
                {t("search.stores")}
              </Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      ) : null}

      {/* Results */}
      {isStoresMode ? (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {storesLoading ? (
            <View className="items-center pt-12">
              <Text className="text-sm" style={{ color: c.muted }}>{t("search.loadingStores")}</Text>
            </View>
          ) : !stores || stores.length === 0 ? (
            <View className="items-center pt-12">
              <Text variant="semibold" className="text-base text-brand dark:text-white">
                {t("search.noStores")}
              </Text>
              <Text className="mt-1 text-sm" style={{ color: c.secondary }}>
                {t("search.noStoresDesc")}
              </Text>
            </View>
          ) : (
            stores.map((store) => <StoreListCard key={store.id} store={store} />)
          )}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 }}
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
        >
          {productsLoading || isFetching ? (
            <View className="flex-row flex-wrap justify-between">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={{ width: "48%", marginBottom: 12 }}>
                  <SkeletonProductCard />
                </View>
              ))}
            </View>
          ) : !products || products.length === 0 ? (
            <View className="items-center pt-12">
              <Text variant="semibold" className="text-base text-brand dark:text-white">
                {t("search.noResults")}
              </Text>
              <Text className="mt-1 text-sm" style={{ color: c.secondary }}>
                {t("search.noResultsDesc")}
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
      )}
    </SafeAreaView>
  );
}
