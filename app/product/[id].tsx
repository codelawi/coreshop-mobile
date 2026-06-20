import {
  View,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
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

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useProduct, type ProductVariant } from "@/lib/queries/home";
import { useCartStore } from "@/stores/cart-store";

const { width } = Dimensions.get("window");

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: product, isLoading } = useProduct(id);
  const [imageIndex, setImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [qty, setQty] = useState(1);

  const cartAdd = useCartStore((s) => s.add);
  const cartForceAdd = useCartStore((s) => s.forceAdd);
  const cartStoreName = useCartStore((s) => s.storeName);

  if (isLoading || !product) {
    return (
      <SafeAreaView className="flex-1 bg-bg-light">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0A0A0A" />
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

  const onAddToCart = () => {
    if (hasVariants && !selectedVariant) {
      toast.error("Please select a variant");
      return;
    }
    if (stock <= 0) {
      toast.error("Out of stock");
      return;
    }

    const result = cartAdd(product, selectedVariant, qty);
    if (result === "needs_clear") {
      Alert.alert(
        "Clear cart?",
        `Your cart has items from ${cartStoreName}. You can only order from one store at a time. Clear and add from ${product.store.name}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Clear & Add",
            style: "destructive",
            onPress: () => {
              cartForceAdd(product, selectedVariant, qty);
              toast.success("Added to cart");
            },
          },
        ]
      );
    } else {
      toast.success("Added to cart");
    }
  };

  return (
    <View className="flex-1 bg-bg-light">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / width);
              setImageIndex(i);
            }}
          >
            {images.map((img) => (
              <View key={img.id} style={{ width, height: width }} className="bg-brand-50">
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
                className="h-10 w-10 items-center justify-center rounded-full bg-white"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#0A0A0A" />
              </Pressable>
              <View className="flex-row gap-2">
                <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white">
                  <HugeiconsIcon icon={Share01Icon} size={20} color="#0A0A0A" />
                </Pressable>
                <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white">
                  <HugeiconsIcon icon={FavouriteIcon} size={20} color="#0A0A0A" />
                </Pressable>
              </View>
            </View>
          </SafeAreaView>

          {images.length > 1 ? (
            <View className="absolute bottom-3 left-0 right-0 flex-row items-center justify-center gap-1.5">
              {images.map((_, i) => (
                <View
                  key={i}
                  className="h-1.5 rounded-full"
                  style={{
                    width: i === imageIndex ? 16 : 6,
                    backgroundColor: i === imageIndex ? "#0A0A0A" : "#D1D5DB",
                  }}
                />
              ))}
            </View>
          ) : null}

          {product.discount_percent ? (
            <View
              className="absolute right-3 top-16 rounded-md px-3 py-1"
              style={{ backgroundColor: "#FF4D4F" }}
            >
              <Text variant="bold" style={{ color: "#fff", fontSize: 13 }}>
                -{product.discount_percent}%
              </Text>
            </View>
          ) : null}
        </View>

        <Animated.View entering={FadeInUp.duration(400)} className="bg-white px-5 py-4">
          <View className="flex-row items-baseline gap-2">
            <Text variant="bold" className="text-2xl text-brand">
              JOD {effectivePrice.toFixed(2)}
            </Text>
            {product.original_price ? (
              <Text className="text-base" style={{ color: "#9CA3AF", textDecorationLine: "line-through" }}>
                {parseFloat(product.original_price).toFixed(2)}
              </Text>
            ) : null}
          </View>
          <Text variant="semibold" className="mt-2 text-lg text-brand">
            {product.name}
          </Text>
          <View className="mt-2 flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <HugeiconsIcon icon={StarIcon} size={14} color="#F59E0B" />
              <Text variant="semibold" className="text-sm text-brand">
                {parseFloat(product.rating).toFixed(1)}
              </Text>
              <Text className="text-sm" style={{ color: "#6B7280" }}>
                ({product.reviews_count})
              </Text>
            </View>
            <View className="h-3 w-px bg-brand-100" />
            <Text className="text-sm" style={{ color: "#6B7280" }}>
              {product.sales_count} sold
            </Text>
            <View className="h-3 w-px bg-brand-100" />
            <Text className="text-sm" style={{ color: stock > 0 ? "#16A34A" : "#FF4D4F" }}>
              {stock > 0 ? `${stock} in stock` : "Out of stock"}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(80)} className="mt-2 bg-white">
          <Pressable
            onPress={() => router.push(`/store/${product.store.id}` as any)}
            className="flex-row items-center gap-3 px-5 py-4"
          >
            <View className="h-12 w-12 overflow-hidden rounded-full bg-brand-50">
              {product.store.logo ? (
                <Image source={{ uri: product.store.logo }} style={{ flex: 1 }} contentFit="cover" />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <HugeiconsIcon icon={Store01Icon} size={20} color="#0A0A0A" />
                </View>
              )}
            </View>
            <View className="flex-1">
              <Text variant="semibold" className="text-sm text-brand">{product.store.name}</Text>
              <View className="flex-row items-center gap-1">
                <HugeiconsIcon icon={StarIcon} size={12} color="#F59E0B" />
                <Text variant="medium" className="text-xs text-brand">
                  {parseFloat(product.store.rating).toFixed(1)}
                </Text>
                <Text className="text-xs" style={{ color: "#6B7280" }}>
                  · {product.store.city ?? ""}
                </Text>
              </View>
            </View>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#6B7280" />
          </Pressable>
        </Animated.View>

        {sizes.length > 0 ? (
          <Animated.View entering={FadeInUp.duration(400).delay(120)} className="mt-2 bg-white px-5 py-4">
            <Text variant="semibold" className="text-sm text-brand">Size</Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {sizes.map((v) => {
                const active = selectedVariant?.id === v.id;
                const disabled = v.stock === 0;
                return (
                  <Pressable
                    key={v.id}
                    disabled={disabled}
                    onPress={() => setSelectedVariant(v)}
                    className={`min-w-[48px] items-center justify-center rounded-md border px-3 py-2 ${
                      active ? "border-brand bg-brand" : "border-brand-100 bg-white"
                    } ${disabled ? "opacity-40" : ""}`}
                  >
                    <Text
                      variant="semibold"
                      style={{ color: active ? "#fff" : "#0A0A0A", fontSize: 13 }}
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
          <Animated.View entering={FadeInUp.duration(400).delay(140)} className="mt-2 bg-white px-5 py-4">
            <Text variant="semibold" className="text-sm text-brand">Color</Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {colors.map((v) => {
                const active = selectedVariant?.id === v.id;
                return (
                  <Pressable
                    key={v.id}
                    onPress={() => setSelectedVariant(v)}
                    className={`h-10 w-10 items-center justify-center rounded-full border-2 ${
                      active ? "border-brand" : "border-brand-100"
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

        <Animated.View entering={FadeInUp.duration(400).delay(160)} className="mt-2 bg-white px-5 py-4">
          <Text variant="semibold" className="text-sm text-brand">Quantity</Text>
          <View className="mt-3 flex-row items-center gap-3">
            <Pressable
              onPress={() => setQty(Math.max(1, qty - 1))}
              className="h-10 w-10 items-center justify-center rounded-md border border-brand-100 bg-white"
            >
              <HugeiconsIcon icon={MinusSignIcon} size={16} color="#0A0A0A" />
            </Pressable>
            <Text variant="bold" className="min-w-[32px] text-center text-base text-brand">
              {qty}
            </Text>
            <Pressable
              onPress={() => setQty(Math.min(stock, qty + 1))}
              className="h-10 w-10 items-center justify-center rounded-md border border-brand-100 bg-white"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={16} color="#0A0A0A" />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(180)} className="mt-2 bg-white px-5 py-4">
          <Text variant="semibold" className="text-sm text-brand">Description</Text>
          <Text className="mt-2 text-sm leading-5" style={{ color: "#374151" }}>
            {product.description}
          </Text>
        </Animated.View>

        {product.reviews.length > 0 ? (
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="mt-2 bg-white px-5 py-4">
            <View className="flex-row items-center justify-between">
              <Text variant="semibold" className="text-sm text-brand">
                Reviews ({product.reviews_count})
              </Text>
              <Pressable hitSlop={6}>
                <Text variant="medium" className="text-sm" style={{ color: "#6B7280" }}>
                  See all
                </Text>
              </Pressable>
            </View>
            {product.reviews.map((r) => (
              <View key={r.id} className="mt-4 border-t border-brand-100 pt-4">
                <View className="flex-row items-center gap-2">
                  <View className="h-8 w-8 overflow-hidden rounded-full bg-brand-50">
                    {r.user.avatar ? (
                      <Image source={{ uri: r.user.avatar }} style={{ flex: 1 }} contentFit="cover" />
                    ) : null}
                  </View>
                  <View className="flex-1">
                    <Text variant="semibold" className="text-xs text-brand">{r.user.name}</Text>
                    <View className="flex-row items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <HugeiconsIcon
                          key={i}
                          icon={StarIcon}
                          size={11}
                          color={i < r.rating ? "#F59E0B" : "#E5E5E5"}
                        />
                      ))}
                    </View>
                  </View>
                </View>
                {r.comment ? (
                  <Text className="mt-2 text-sm" style={{ color: "#374151" }}>
                    {r.comment}
                  </Text>
                ) : null}
              </View>
            ))}
          </Animated.View>
        ) : null}
      </ScrollView>

      <SafeAreaView edges={["bottom"]} className="absolute bottom-0 left-0 right-0 bg-white">
        <Animated.View entering={FadeInDown.duration(500)} className="flex-row items-center gap-3 border-t border-brand-100 px-5 py-3">
          <Pressable className="h-12 w-12 items-center justify-center rounded-md border border-brand-100">
            <HugeiconsIcon icon={FavouriteIcon} size={22} color="#0A0A0A" />
          </Pressable>
          <View className="flex-1">
            <Button
              label="Add to Cart"
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