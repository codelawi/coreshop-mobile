import {
  View,
  ScrollView,
  Pressable,
  Dimensions,
  Alert,
  Share,
} from "react-native";
import { useRef } from "react";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  FavouriteIcon,
  Share01Icon,
  StarIcon,
  ShoppingCart01Icon,
  PlusSignIcon,
  MinusSignIcon,
  Store01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner-native";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { useProduct, useProducts, type ProductVariant } from "@/lib/queries/home";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useThemeColors } from "@/lib/theme";
import { Spinner } from "@/components/ui/spinner";
import { resolveAvatar } from "@/lib/avatar";

const { width } = Dimensions.get("window");

function AnimatedDot({ active, color, activeColor }: { active: boolean; color: string; activeColor: string }) {
  const w = useSharedValue(active ? 16 : 6);
  useEffect(() => {
    w.value = withTiming(active ? 16 : 6, { duration: 250 });
  }, [active]);
  const style = useAnimatedStyle(() => ({ width: w.value }));
  return (
    <Animated.View
      style={[style, { height: 6, borderRadius: 999, backgroundColor: active ? activeColor : color }]}
    />
  );
}

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = useThemeColors();
  const { t } = useTranslation();
  const { data: product, isLoading } = useProduct(id);
  const [imageIndex, setImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [qty, setQty] = useState(1);
  const imageScrollRef = useRef<ScrollView>(null);
  const [tooltip, setTooltip] = useState<{ variant: ProductVariant; centerX: number; topY: number } | null>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const variantRefs = useRef<Record<number, View | null>>({});

  const showTooltip = (v: ProductVariant, ref: View | null) => {
    if (!v.description || !ref) return;
    ref.measureInWindow((x, y, w) => {
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
      setTooltip({ variant: v, centerX: x + w / 2, topY: y });
      tooltipTimer.current = setTimeout(() => setTooltip(null), 2500);
    });
  };

  const cartAdd = useCartStore((s) => s.add);
  const cartForceAdd = useCartStore((s) => s.forceAdd);
  const cartStoreName = useCartStore((s) => s.storeName);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(Number(id)));
  const wishlistToggle = useWishlistStore((s) => s.toggle);

  const { data: relatedRaw } = useProducts(
    { category_id: product?.category?.id, per_page: 10 },
    !!product?.category?.id,
  );

  if (isLoading || !product) {
    return (
      <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
        <View className="flex-1 items-center justify-center">
          <Spinner size={44} />
        </View>
      </SafeAreaView>
    );
  }

  const images = product.product_images.length > 0
    ? product.product_images
    : [{ id: 0, url: "", is_primary: true, sort_order: 0 }];

  const sizes = product.variants.filter((v) => v.size);
  const colors = product.variants.filter((v) => v.color);
  const hasVariants = product.variants.length > 0;
  const effectivePrice =
    parseFloat(product.price) +
    (selectedVariant ? parseFloat(selectedVariant.price_adjustment) : 0);
  const stock = selectedVariant ? selectedVariant.stock : product.stock;

  const selectColorVariant = (v: ProductVariant) => {
    setSelectedVariant(v);
    if (v.image_url) {
      const idx = images.findIndex((img) => img.url === v.image_url);
      if (idx >= 0) {
        setImageIndex(idx);
        imageScrollRef.current?.scrollTo({ x: idx * width, animated: true });
      }
    }
  };

  const onAddToCart = () => {
    if (hasVariants && !selectedVariant) {
      toast.error(t("product.selectVariant"));
      return;
    }
    if (stock <= 0) {
      toast.error(t("product.outOfStock"));
      return;
    }

    const result = cartAdd(product, selectedVariant, qty);
    if (result === "needs_clear") {
      Alert.alert(
        t("product.clearCartTitle"),
        t("product.clearCartDesc", { store: cartStoreName, newStore: product.store.name }),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("product.clearAndAdd"),
            style: "destructive",
            onPress: () => {
              cartForceAdd(product, selectedVariant, qty);
              toast.success(t("product.toastAdded"));
            },
          },
        ]
      );
    } else {
      toast.success(t("product.toastAdded"));
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: product.name,
        message: `${product.name}\nPrice: JOD ${Number(product.price).toFixed(2)}${product.store?.name ? `\nSold by ${product.store.name}` : ""}\n\nFind it on CoreShop!`,
      });
    } catch {
      // user dismissed share sheet
    }
  };

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View>
          <ScrollView
            ref={imageScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / width);
              setImageIndex(i);
            }}
          >
            {images.map((img) => (
              <View key={img.id} style={{ width, height: width }} className="bg-brand-50 dark:bg-[#2A2A2A]">
                {img.url ? (
                  <Image source={{ uri: img.url }} style={{ flex: 1 }} contentFit="cover" transition={200} />
                ) : null}
              </View>
            ))}
          </ScrollView>

          <SafeAreaView edges={["top"]} className="absolute left-0 right-0 top-0">
            <View className="flex-row items-center justify-between px-4 pt-2">
              <Pressable
                onPress={() => router.back()}
                className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-bg-card"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color={c.brand} />
              </Pressable>
              <View className="flex-row gap-2">
                <Pressable onPress={handleShare} className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-bg-card">
                  <HugeiconsIcon icon={Share01Icon} size={20} color={c.brand} />
                </Pressable>
                <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-bg-card">
                  <HugeiconsIcon icon={FavouriteIcon} size={20} color={c.brand} />
                </Pressable>
              </View>
            </View>
          </SafeAreaView>

          {images.length > 1 ? (
            <View className="absolute bottom-3 left-0 right-0 flex-row items-center justify-center gap-1.5">
              {images.map((_, i) => (
                <AnimatedDot key={i} active={i === imageIndex} color={c.border} activeColor={c.brand} />
              ))}
            </View>
          ) : null}
        </View>

        <Animated.View entering={FadeInUp.duration(400)} className="bg-white dark:bg-bg-card px-5 py-4">
          <View className="flex-row items-center gap-2 flex-wrap">
            <Text variant="bold" className="text-2xl text-brand dark:text-white">
              JOD {effectivePrice.toFixed(2)}
            </Text>
            {product.original_price ? (
              <Text className="text-base" style={{ color: c.muted, textDecorationLine: "line-through" }}>
                {parseFloat(product.original_price).toFixed(2)}
              </Text>
            ) : null}
            {product.discount_percent ? (
              <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: "#FF4D4F18" }}>
                <Text variant="semibold" style={{ color: "#FF4D4F", fontSize: 12 }}>
                  -{product.discount_percent}%
                </Text>
              </View>
            ) : null}
          </View>
          <Text variant="semibold" className="mt-2 text-lg text-brand dark:text-white">
            {product.name}
          </Text>
          <View className="mt-2 flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <HugeiconsIcon icon={StarIcon} size={14} color="#F59E0B" />
              <Text variant="semibold" className="text-sm text-brand dark:text-white">
                {parseFloat(product.rating).toFixed(1)}
              </Text>
              <Text className="text-sm" style={{ color: c.secondary }}>
                ({product.reviews_count})
              </Text>
            </View>
            <View className="h-3 w-px bg-brand-100 dark:bg-[#2A2A2A]" />
            <Text className="text-sm" style={{ color: c.secondary }}>
              {product.sales_count} {t("product.sold")}
            </Text>
            <View className="h-3 w-px bg-brand-100 dark:bg-[#2A2A2A]" />
            <Text className="text-sm" style={{ color: stock > 0 ? "#16A34A" : "#FF4D4F" }}>
              {stock > 0 ? t("product.inStock", { count: stock }) : t("product.outOfStock")}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(80)} className="mt-2 bg-white dark:bg-bg-card">
          <Pressable
            onPress={() => router.push(`/store/${product.store.id}` as any)}
            className="flex-row items-center gap-3 px-5 py-4"
          >
            <View className="h-12 w-12 overflow-hidden rounded-full bg-brand-50 dark:bg-[#2A2A2A]">
              {product.store.logo ? (
                <Image source={{ uri: product.store.logo }} style={{ flex: 1 }} contentFit="cover" />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <HugeiconsIcon icon={Store01Icon} size={20} color={c.brand} />
                </View>
              )}
            </View>
            <View className="flex-1">
              <Text variant="semibold" className="text-sm text-brand dark:text-white">{product.store.name}</Text>
              <View className="flex-row items-center gap-1">
                <HugeiconsIcon icon={StarIcon} size={12} color="#F59E0B" />
                <Text variant="medium" className="text-xs text-brand dark:text-white">
                  {parseFloat(product.store.rating).toFixed(1)}
                </Text>
                <Text className="text-xs" style={{ color: c.secondary }}>
                  · {product.store.city ?? ""}
                </Text>
              </View>
            </View>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={c.secondary} />
          </Pressable>
        </Animated.View>

        {sizes.length > 0 ? (
          <Animated.View entering={FadeInUp.duration(400).delay(120)} className="mt-2 bg-white dark:bg-bg-card px-5 py-4">
            <Text variant="semibold" className="text-sm text-brand dark:text-white">{t("product.size")}</Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {sizes.map((v) => {
                const active = selectedVariant?.id === v.id;
                const disabled = v.stock === 0;
                return (
                  <Pressable
                    key={v.id}
                    ref={(r) => { variantRefs.current[v.id] = r; }}
                    disabled={disabled}
                    onPress={() => {
                      setSelectedVariant(v);
                      showTooltip(v, variantRefs.current[v.id]);
                    }}
                    className={`min-w-[48px] items-center justify-center rounded-md border px-3 py-2 ${
                      active ? "border-brand bg-brand" : "border-brand-100 dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A]"
                    } ${disabled ? "opacity-40" : ""}`}
                  >
                    <Text
                      variant="semibold"
                      style={{ color: active ? "#fff" : c.brand, fontSize: 13 }}
                    >
                      {v.size}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        ) : null}

        {colors.length > 0 ? (
          <Animated.View entering={FadeInUp.duration(400).delay(140)} className="mt-2 bg-white dark:bg-bg-card px-5 py-4">
            <Text variant="semibold" className="text-sm text-brand dark:text-white">{t("product.color")}</Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {colors.map((v) => {
                const active = selectedVariant?.id === v.id;
                return (
                  <Pressable
                    key={v.id}
                    onPress={() => selectColorVariant(v)}
                    className={`h-10 w-10 items-center justify-center rounded-full border-2 ${
                      active ? "border-brand" : "border-brand-100 dark:border-[#3A3A3A]"
                    }`}
                    style={{ backgroundColor: v.color_hex ?? "#ddd" }}
                  >
                    {active ? <HugeiconsIcon icon={Tick02Icon} size={16} color="#fff" /> : null}
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInUp.duration(400).delay(160)} className="mt-2 bg-white dark:bg-bg-card px-5 py-4">
          <Text variant="semibold" className="text-sm text-brand dark:text-white">{t("product.quantity")}</Text>
          <View className="mt-3 flex-row items-center gap-3">
            <Pressable
              onPress={() => setQty(Math.max(1, qty - 1))}
              className="h-10 w-10 items-center justify-center rounded-md border border-brand-100 dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A]"
            >
              <HugeiconsIcon icon={MinusSignIcon} size={16} color={c.brand} />
            </Pressable>
            <Text variant="bold" className="min-w-[32px] text-center text-base text-brand dark:text-white">
              {qty}
            </Text>
            <Pressable
              onPress={() => setQty(Math.min(stock, qty + 1))}
              className="h-10 w-10 items-center justify-center rounded-md border border-brand-100 dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A]"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={16} color={c.brand} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(180)} className="mt-2 bg-white dark:bg-bg-card px-5 py-4">
          <Text variant="semibold" className="text-sm text-brand dark:text-white">{t("product.description")}</Text>
          <Text className="mt-2 text-sm leading-5" style={{ color: c.secondary }}>
            {product.description}
          </Text>
        </Animated.View>

        {product.reviews.length > 0 ? (
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="mt-2 bg-white dark:bg-bg-card px-5 py-4">
            <View className="flex-row items-center justify-between">
              <Text variant="semibold" className="text-sm text-brand dark:text-white">
                {t("product.reviews", { count: product.reviews_count })}
              </Text>
              <Pressable hitSlop={6}>
                <Text variant="medium" className="text-sm" style={{ color: c.secondary }}>
                  {t("common.seeAll")}
                </Text>
              </Pressable>
            </View>
            {product.reviews.map((r) => (
              <View key={r.id} className="mt-4 border-t border-brand-100 dark:border-[#2A2A2A] pt-4">
                <View className="flex-row items-center gap-2">
                  <View className="h-8 w-8 overflow-hidden rounded-full bg-brand-50 dark:bg-[#2A2A2A]">
                    <Image
                      source={{ uri: resolveAvatar(r.user.avatar, r.user.id) }}
                      style={{ flex: 1 }}
                      contentFit="cover"
                    />
                  </View>
                  <View className="flex-1">
                    <Text variant="semibold" className="text-xs text-brand dark:text-white">{r.user.name}</Text>
                    <View className="flex-row items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <HugeiconsIcon
                          key={i}
                          icon={StarIcon}
                          size={11}
                          color={i < r.rating ? "#F59E0B" : c.border}
                        />
                      ))}
                    </View>
                  </View>
                </View>
                {r.comment ? (
                  <Text className="mt-2 text-sm" style={{ color: c.secondary }}>
                    {r.comment}
                  </Text>
                ) : null}
              </View>
            ))}
          </Animated.View>
        ) : null}

        {(() => {
          const related = relatedRaw?.filter((p) => p.id !== Number(id)) ?? [];
          if (related.length === 0) { return null; }
          return (
            <Animated.View entering={FadeInUp.duration(400).delay(220)} className="mt-2 bg-white dark:bg-bg-card py-4">
              <Text variant="semibold" className="px-5 text-sm text-brand dark:text-white">
                {t("product.youMightAlsoLike")}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, gap: 12 }}
              >
                {related.map((p) => (
                  <View key={p.id} style={{ width: 155 }}>
                    <ProductCard product={p} width="100%" />
                  </View>
                ))}
              </ScrollView>
            </Animated.View>
          );
        })()}
      </ScrollView>

      {tooltip ? (
        <Pressable
          style={{ position: "absolute", inset: 0 }}
          onPress={() => setTooltip(null)}
        >
          <Animated.View
            entering={FadeInUp.duration(180)}
            exiting={FadeOut.duration(150)}
            style={{
              position: "absolute",
              left: Math.min(Math.max(tooltip.centerX - 110, 12), width - 232),
              top: tooltip.topY - 72,
              width: 220,
              backgroundColor: c.isDark ? "#1E1E2E" : "#0A0A0A",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
              shadowColor: "#000",
              shadowOpacity: 0.25,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 8,
            }}
          >
            {(tooltip.variant.size || tooltip.variant.color) ? (
              <Text variant="semibold" style={{ color: "#ffffff80", fontSize: 10, marginBottom: 2 }}>
                {tooltip.variant.size ?? tooltip.variant.color}
              </Text>
            ) : null}
            <Text variant="medium" style={{ color: "#fff", fontSize: 12, lineHeight: 17 }}>
              {tooltip.variant.description}
            </Text>
            <View
              style={{
                position: "absolute",
                bottom: -6,
                left: Math.min(
                  Math.max(tooltip.centerX - Math.min(Math.max(tooltip.centerX - 110, 12), width - 232) - 6, 10),
                  200
                ),
                width: 0,
                height: 0,
                borderLeftWidth: 6,
                borderRightWidth: 6,
                borderTopWidth: 6,
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderTopColor: c.isDark ? "#1E1E2E" : "#0A0A0A",
              }}
            />
          </Animated.View>
        </Pressable>
      ) : null}

      <SafeAreaView edges={["bottom"]} className="absolute bottom-0 left-0 right-0 bg-white dark:bg-bg-card">
        <Animated.View entering={FadeInDown.duration(500)} className="flex-row items-center gap-3 border-t border-brand-100 dark:border-[#2A2A2A] px-5 py-3">
          <Pressable
            onPress={() => wishlistToggle(Number(id))}
            className="h-12 w-12 items-center justify-center rounded-md border border-brand-100 dark:border-[#3A3A3A]"
            style={{ backgroundColor: isWishlisted ? "#FF4D4F" : undefined }}
          >
            <HugeiconsIcon icon={FavouriteIcon} size={22} color={isWishlisted ? "#fff" : c.brand} />
          </Pressable>
          <View className="flex-1">
            <Button
              label={t("product.addToCart")}
              onPress={onAddToCart}
              fullWidth
              size="lg"
              leftIcon={<HugeiconsIcon icon={ShoppingCart01Icon} size={20} color="#fff" />}
            />
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
