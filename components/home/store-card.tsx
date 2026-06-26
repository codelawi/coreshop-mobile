import { View, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { StarIcon } from "@hugeicons/core-free-icons";
import { Text } from "@/components/ui/text";
import type { HomeStore } from "@/lib/queries/home";

export function StoreCard({ store }: { store: HomeStore }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/store/${store.id}` as any)}
      style={{ width: 160 }}
      className="mr-3 overflow-hidden rounded-md bg-white dark:bg-bg-card"
    >
      <View className="h-20 w-full bg-brand-50">
        {store.banner ? (
          <Image source={{ uri: store.banner }} style={{ flex: 1 }} contentFit="cover" />
        ) : null}
      </View>
      <View className="p-2.5">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 overflow-hidden rounded-full bg-brand-50">
            {store.logo ? (
              <Image source={{ uri: store.logo }} style={{ flex: 1 }} contentFit="cover" />
            ) : null}
          </View>
          <View className="flex-1">
            <Text variant="semibold" numberOfLines={1} className="text-xs text-brand dark:text-white">{store.name}</Text>
            <View className="flex-row items-center gap-1">
              <HugeiconsIcon icon={StarIcon} size={10} color="#F59E0B" />
              <Text variant="medium" className="text-xs text-brand dark:text-white">{parseFloat(store.rating).toFixed(1)}</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}