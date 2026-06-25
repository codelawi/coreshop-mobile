import { View, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { StarIcon, FavouriteIcon } from "@hugeicons/core-free-icons";
import { Text } from "@/components/ui/text";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeColors } from "@/lib/theme";
import type { HomeProduct } from "@/lib/queries/home";

interface Props {
  product: HomeProduct;
  width?: number | string;
}

export function ProductCard({ product, width = "48%" }: Props) {
  const router = useRouter();
  const c = useThemeColors();
  const token = useAuthStore((s) => s.token);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));
  const toggle = useWishlistStore((s) => s.toggle);

  return (
    <Pressable
      onPress={() => router.push(`/product/${product.id}` as any)}
      style={{ width }}
      className="mb-3 overflow-hidden rounded-md bg-white dark:bg-bg-card"
    >
      <View className="aspect-square w-full bg-brand-50 dark:bg-[#2A2A2A]">
        {product.image ? (
          <Image
            source={{ uri: product.image }}
            style={{ flex: 1 }}
            contentFit="cover"
            transition={200}
          />
        ) : null}

        {product.discount_percent ? (
          <View
            className="absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5"
            style={{ backgroundColor: "#FF4D4F" }}
          >
            <Text style={{ color: "#fff", fontSize: 9, fontFamily: "Manrope_700Bold" }}>
              -{product.discount_percent}%
            </Text>
          </View>
        ) : null}

        {token ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              toggle(product.id);
            }}
            hitSlop={8}
            className="absolute right-2 top-2 h-7 w-7 items-center justify-center rounded-full"
            style={{
              backgroundColor: isWishlisted ? "#FF4D4F" : "#fff",
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <HugeiconsIcon
              icon={FavouriteIcon}
              size={15}
              color={isWishlisted ? "#fff" : "#9CA3AF"}
            />
          </Pressable>
        ) : null}
      </View>

      <View className="p-2.5">
        <Text variant="medium" numberOfLines={2} className="text-xs text-brand dark:text-white" style={{ minHeight: 32 }}>
          {product.name}
        </Text>
        <View className="mt-1.5 flex-row items-center gap-1.5 flex-wrap">
          <Text variant="bold" className="text-base text-brand dark:text-white">
            JOD {parseFloat(product.price).toFixed(2)}
          </Text>
          {product.original_price ? (
            <Text className="text-xs" style={{ color: c.muted, textDecorationLine: "line-through" }}>
              {parseFloat(product.original_price).toFixed(2)}
            </Text>
          ) : null}
        </View>
        <View className="mt-1 flex-row items-center gap-1">
          <HugeiconsIcon icon={StarIcon} size={12} color="#F59E0B" />
          <Text variant="medium" className="text-xs text-brand dark:text-white">
            {parseFloat(product.rating).toFixed(1)}
          </Text>
          <Text className="text-xs" style={{ color: c.muted }}>
            ({product.reviews_count})
          </Text>
          <Text className="ml-auto text-xs" style={{ color: c.muted }}>
            {product.sales_count} sold
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
