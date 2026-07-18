import { View, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { StarIcon, Store01Icon } from "@hugeicons/core-free-icons";
import { Text } from "@/components/ui/text";
import type { HomeStore } from "@/lib/queries/home";

export function StoreCard({ store }: { store: HomeStore }) {
  const router = useRouter();
  const initial = store.name.charAt(0).toUpperCase();
  return (
    <Pressable
      onPress={() => router.push(`/store/${store.id}` as any)}
      style={{ width: 160 }}
      className="mr-3 overflow-hidden rounded-md bg-white dark:bg-bg-card"
    >
      <View className="h-20 w-full items-center justify-center bg-brand-50 dark:bg-[#2A2A2A]">
        {store.banner ? (
          <Image source={{ uri: store.banner }} style={{ flex: 1, width: "100%" }} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <Text variant="bold" style={{ fontSize: 32, color: "#FF4D4F", opacity: 0.25 }}>
            {initial}
          </Text>
        )}
      </View>
      <View className="p-2.5">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand-50 dark:bg-[#2A2A2A]">
            {store.logo ? (
              <Image source={{ uri: store.logo }} style={{ flex: 1, width: "100%" }} contentFit="cover" cachePolicy="memory-disk" />
            ) : (
              <HugeiconsIcon icon={Store01Icon} size={16} color="#FF4D4F" />
            )}
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