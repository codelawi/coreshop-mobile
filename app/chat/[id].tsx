import {
  View,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon, ArrowRight01Icon, MailSend01Icon } from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/ui/text";
import { Spinner } from "@/components/ui/spinner";
import { useMessages, useSendMessage } from "@/lib/queries/chat";
import { useAuthStore } from "@/stores/auth-store";
import { useLanguageStore } from "@/stores/language-store";
import { useThemeColors } from "@/lib/theme";
import type { Message } from "@/lib/queries/chat";

export default function ChatRoom() {
  const { id, title, role: roleParam } = useLocalSearchParams<{
    id: string;
    title: string;
    role: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();
  const c = useThemeColors();
  const { language } = useLanguageStore();
  const user = useAuthStore((s) => s.user);
  const BackIcon = language === "ar" ? ArrowRight01Icon : ArrowLeft01Icon;

  const conversationId = Number(id);
  const role: "client" | "seller" = roleParam === "seller" ? "seller" : "client";

  const { data: messages = [], isLoading } = useMessages(conversationId, role);
  const sendMessage = useSendMessage(conversationId, role);

  const [body, setBody] = useState("");
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const handleSend = () => {
    const text = body.trim();
    if (!text || sendMessage.isPending) {
      return;
    }
    setBody("");
    sendMessage.mutate(text);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.sender_id === user?.id;
    return (
      <View className={`mb-2 max-w-[80%] ${isMine ? "self-end" : "self-start"}`}>
        <View
          className="rounded-2xl px-4 py-2.5"
          style={{ backgroundColor: isMine ? c.brand : (c.isDark ? "#2A2A2A" : "#F0F0F0") }}
        >
          <Text
            variant="medium"
            style={{
              color: isMine ? "#fff" : c.text,
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            {item.body}
          </Text>
        </View>
        <Text
          style={{
            color: c.muted,
            fontSize: 10,
            marginTop: 2,
            textAlign: isMine ? "right" : "left",
          }}
        >
          {new Date(item.created_at).toLocaleTimeString(language === "ar" ? "ar" : "en", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark" edges={["top"]}>
      {/* Header */}
      <View
        className="flex-row items-center gap-3 border-b px-4 py-3"
        style={{ borderColor: c.isDark ? "#2A2A2A" : "#E5E7EB" }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <HugeiconsIcon icon={BackIcon} size={22} color={c.brand} />
        </Pressable>
        <Text variant="bold" className="flex-1 text-base text-brand dark:text-white" numberOfLines={1}>
          {title ?? t("chat.conversation")}
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Spinner />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => String(m.id)}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-20">
                <Text style={{ color: c.muted }}>{t("chat.noMessages")}</Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View
          className="flex-row items-end gap-2 border-t px-4 py-3"
          style={{ borderColor: c.isDark ? "#2A2A2A" : "#E5E7EB" }}
        >
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={t("chat.inputPlaceholder")}
            placeholderTextColor={c.muted}
            multiline
            maxLength={1000}
            spellCheck={false}
            autoCorrect={false}
            style={{
              flex: 1,
              minHeight: 40,
              maxHeight: 120,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: c.isDark ? "#1A1A1A" : "#F5F5F5",
              color: c.text,
              fontFamily: language === "ar" ? "IBMPlexSansArabic_400Regular" : "Manrope_400Regular",
              fontSize: 14,
            }}
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={!body.trim() || sendMessage.isPending}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{
              backgroundColor: body.trim() ? c.brand : (c.isDark ? "#2A2A2A" : "#E5E7EB"),
            }}
          >
            <HugeiconsIcon
              icon={MailSend01Icon}
              size={18}
              color={body.trim() ? "#fff" : c.muted}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
