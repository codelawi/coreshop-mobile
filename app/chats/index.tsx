import { View, FlatList, Pressable, RefreshControl } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Message01Icon,
  Store01Icon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/ui/text";
import { Spinner } from "@/components/ui/spinner";
import { useConversations } from "@/lib/queries/chat";
import { useLanguageStore } from "@/stores/language-store";
import { useThemeColors } from "@/lib/theme";
import type { Conversation } from "@/lib/queries/chat";

export default function ChatsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const c = useThemeColors();
  const { language } = useLanguageStore();
  const BackIcon = language === "ar" ? ArrowRight01Icon : ArrowLeft01Icon;

  const { data: conversations = [], isLoading, refetch, isRefetching } = useConversations();

  const renderItem = ({ item, index }: { item: Conversation; index: number }) => {
    const title = item.store.name;
    const subtitle = item.last_message?.body ?? t("chat.noMessages");
    const time = item.last_message_at
      ? new Date(item.last_message_at).toLocaleTimeString(language === "ar" ? "ar" : "en", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return (
      <Animated.View entering={FadeInDown.duration(300).delay(index * 40)}>
        <Pressable
          className="flex-row items-center gap-3 px-4 py-3"
          onPress={() =>
            router.push({
              pathname: "/chat/[id]",
              params: { id: item.id, title, role: "client", avatar: item.store.logo ?? "" },
            } as any)
          }
        >
          <View className="relative h-12 w-12 overflow-hidden rounded-full bg-brand-50 dark:bg-[#2A2A2A]">
            {item.store.logo ? (
              <Image source={{ uri: item.store.logo }} style={{ flex: 1 }} contentFit="cover" />
            ) : (
              <View className="flex-1 items-center justify-center">
                <HugeiconsIcon icon={Store01Icon} size={20} color={c.brand} />
              </View>
            )}
          </View>

          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text variant="semibold" className="text-sm text-brand dark:text-white" numberOfLines={1} style={{ flex: 1 }}>
                {title}
              </Text>
              <Text style={{ color: c.muted, fontSize: 11, marginLeft: 8 }}>{time}</Text>
            </View>
            <View className="flex-row items-center justify-between mt-0.5">
              <Text style={{ color: c.secondary, fontSize: 13 }} numberOfLines={1} className="flex-1">
                {subtitle}
              </Text>
              {item.unread_count > 0 ? (
                <View
                  className="ml-2 h-5 min-w-[20px] items-center justify-center rounded-full px-1"
                  style={{ backgroundColor: c.brand }}
                >
                  <Text variant="bold" style={{ color: "#fff", fontSize: 10 }}>
                    {item.unread_count > 99 ? "99+" : item.unread_count}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </Pressable>
        <View className="ml-[76px] h-px bg-brand-100 dark:bg-[#2A2A2A]" />
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={["top"]}>
      <View className="flex-row items-center gap-3 px-4 py-4">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <HugeiconsIcon icon={BackIcon} size={22} color={c.brand} />
        </Pressable>
        <Text variant="bold" className="text-xl text-brand dark:text-white">
          {t("chat.myChats")}
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Spinner />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => String(c.id)}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          contentContainerStyle={{ flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-24 gap-3">
              <HugeiconsIcon icon={Message01Icon} size={48} color={c.muted} />
              <Text variant="semibold" className="text-base text-brand dark:text-white">
                {t("chat.empty")}
              </Text>
              <Text style={{ color: c.secondary, textAlign: "center", fontSize: 13 }}>
                {t("chat.emptyDesc")}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
