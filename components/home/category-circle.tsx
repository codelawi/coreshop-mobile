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

  return (
    <Pressable
      onPress={() => router.push(`/category/${category.id}` as any)}
      className="items-center"
      style={{ width: 72 }}
    >
      <View className="h-16 w-16 overflow-hidden rounded-full bg-brand-50">
        {category.image ? (
          <Image source={{ uri: category.image }} style={{ flex: 1 }} contentFit="cover" />
        ) : null}
      </View>
      <Text variant="medium" numberOfLines={1} className="mt-1.5 text-center text-xs text-brand">
        {label}
      </Text>
    </Pressable>
  );
}