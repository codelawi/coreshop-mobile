import { View, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { useLanguageStore } from "@/stores/language-store";
import type { HomeCategory } from "@/lib/queries/home";

export function CategoryCircle({ category }: { category: HomeCategory }) {
  const router = useRouter();
  const language = useLanguageStore((s) => s.language);
  const label = language === "ar" && category.name_ar ? category.name_ar : category.name;
  const initial = label.charAt(0).toUpperCase();

  return (
    <Pressable
      onPress={() => router.push(`/category/${category.id}` as any)}
      className="items-center"
      style={{ width: 72 }}
    >
      <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand-50 dark:bg-[#2A2A2A]">
        {category.image ? (
          <Image source={{ uri: category.image }} style={{ flex: 1, width: "100%" }} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <Text variant="bold" style={{ fontSize: 22, color: "#FF4D4F" }}>{initial}</Text>
        )}
      </View>
      <Text variant="medium" numberOfLines={1} className="mt-1.5 text-center text-xs text-brand dark:text-white">
        {label}
      </Text>
    </Pressable>
  );
}