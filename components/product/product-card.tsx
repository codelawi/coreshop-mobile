import { View, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { StarIcon } from "@hugeicons/core-free-icons";
import { Text } from "@/components/ui/text";
import type { HomeProduct } from "@/lib/queries/home";

interface Props {
  product: HomeProduct;
  width?: number | string;
}

export function ProductCard({ product, width = "48%" }: Props) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/product/${product.id}` as any)}
      style={{ width }}
      className="mb-3 overflow-hidden rounded-md bg-white"
    >
      <View className="aspect-square w-full bg-brand-50">
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
            className="absolute left-2 top-2 rounded-md px-2 py-0.5"
            style={{ backgroundColor: "#FF4D4F" }}
          >
            <Text variant="bold" style={{ color: "#fff", fontSize: 11 }}>
              -{product.discount_percent}%
            </Text>
          </View>
        ) : null}
      </View>
      <View className="p-2.5">
        <Text variant="medium" numberOfLines={2} className="text-xs text-brand" style={{ minHeight: 32 }}>
          {product.name}
        </Text>
        <View className="mt-1.5 flex-row items-baseline gap-1.5">
          <Text variant="bold" className="text-base text-brand">
            JOD {parseFloat(product.price).toFixed(2)}
          </Text>
          {product.original_price ? (
            <Text className="text-xs" style={{ color: "#9CA3AF", textDecorationLine: "line-through" }}>
              {parseFloat(product.original_price).toFixed(2)}
            </Text>
          ) : null}
        </View>
        <View className="mt-1 flex-row items-center gap-1">
          <HugeiconsIcon icon={StarIcon} size={12} color="#F59E0B" />
          <Text variant="medium" className="text-xs text-brand">
            {parseFloat(product.rating).toFixed(1)}
          </Text>
          <Text className="text-xs" style={{ color: "#9CA3AF" }}>
            ({product.reviews_count})
          </Text>
          <Text className="ml-auto text-xs" style={{ color: "#9CA3AF" }}>
            {product.sales_count} sold
          </Text>
        </View>
      </View>
    </Pressable>
  );
}