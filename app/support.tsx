import {
  View,
  FlatList,
  TextInput,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect, useMemo } from "react";
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  CustomerSupportIcon,
  Image01Icon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import { toast } from "sonner-native";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import { useQueryClient } from "@tanstack/react-query";

import { Text } from "@/components/ui/text";
import { Spinner } from "@/components/ui/spinner";
import {
  useSupportConversation,
  useSupportMessages,
  useSendSupportMessage,
  useSupportChannel,
  type SupportMessage,
} from "@/lib/queries/chat";
import { useAuthStore } from "@/stores/auth-store";
import { useLanguageStore } from "@/stores/language-store";
import { useThemeColors } from "@/lib/theme";

const MINE_BG = "#0A0A0A";
const MINE_TEXT = "#FFFFFF";
const HEADER_HEIGHT = 52;

export default function SupportChat() {
  const router = useRouter();
  const { t } = useTranslation();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { language } = useLanguageStore();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const BackIcon = language === "ar" ? ArrowRight01Icon : ArrowLeft01Icon;

  const { data: conv } = useSupportConversation();
  const conversationId = conv?.id;

  const { data: messagePages, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useSupportMessages(conversationId);
  const messages = useMemo(
    () => [...(messagePages?.pages ?? [])].reverse().flatMap((p) => p.data),
    [messagePages]
  );
  const sendMessage = useSendSupportMessage(conversationId, user?.id ?? 0);
  useSupportChannel(conversationId, user?.id ?? 0);

  const [body, setBody] = useState("");
  const listRef = useRef<FlatList<SupportMessage>>(null);

  const keyboard = useAnimatedKeyboard();

  const avoidKeyboardStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboard.height.value,
  }));

  const inputBarPaddingStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboard.height.value > 0 ? 8 : insets.bottom,
  }));

  // Clear support unread badge immediately on open
  useEffect(() => {
    void Notifications.setBadgeCountAsync(0);
    qc.setQueryData(["support", "unread-count"], 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  const handleSend = () => {
    const text = body.trim();
    if (!text || sendMessage.isPending || !conversationId) { return; }
    setBody("");
    sendMessage.mutate({ body: text }, {
      onError: () => {
        setBody(text);
        toast.error(t("common.error"));
      },
    });
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error(t("common.permissionDenied"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) { return; }
    const uri = result.assets[0].uri;
    sendMessage.mutate({ imageUri: uri }, {
      onError: () => toast.error(t("common.error")),
    });
  };

  const renderMessage = ({ item }: { item: SupportMessage }) => {
    const isMine = item.sender_id === user?.id;
    const isImage = item.type === "image" || /^https?:\/\/.+\/chat\//i.test(item.body ?? "");

    return (
      <View
        style={{
          marginBottom: 12,
          maxWidth: "78%",
          alignSelf: isMine ? "flex-end" : "flex-start",
        }}
      >
        {!isMine && (
          <Text style={{ color: c.muted, fontSize: 11, marginBottom: 2 }}>
            {t("support.supportTeam")}
          </Text>
        )}
        <View
          style={{
            borderRadius: 18,
            overflow: "hidden",
            backgroundColor: isMine ? MINE_BG : c.brandLight,
          }}
        >
          {isImage ? (
            <View style={{ width: 200, height: 200 }}>
              <Image
                source={{ uri: item._localUri ?? item.body }}
                style={{ width: 200, height: 200 }}
                contentFit="cover"
              />
              {item._pending && (
                <View
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.35)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </View>
          ) : (
            <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text
                variant="medium"
                style={{ color: isMine ? MINE_TEXT : c.brand, fontSize: 14, lineHeight: 20 }}
              >
                {item.body}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={{
            color: c.muted,
            fontSize: 10,
            marginTop: 2,
            textAlign: isMine ? "right" : "left",
          }}
        >
          {new Date(item.created_at).toLocaleTimeString(
            language === "ar" ? "ar" : "en",
            { hour: "2-digit", minute: "2-digit" },
          )}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          height: HEADER_HEIGHT,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderColor: c.border,
          backgroundColor: c.card,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <HugeiconsIcon icon={BackIcon} size={22} color={c.brand} />
        </Pressable>
        <HugeiconsIcon icon={CustomerSupportIcon} size={20} color={c.brand} />
        <Text variant="bold" style={{ flex: 1, fontSize: 16, color: c.brand }}>
          {t("support.title")}
        </Text>
      </View>

      {/* Keyboard-avoiding content */}
      <Animated.View style={[{ flex: 1 }, avoidKeyboardStyle]}>
        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
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
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            onScroll={(e) => {
              if (e.nativeEvent.contentOffset.y < 80 && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            scrollEventThrottle={200}
            ListHeaderComponent={
              isFetchingNextPage ? (
                <View style={{ alignItems: "center", paddingVertical: 12 }}>
                  <ActivityIndicator color={c.brand} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 80,
                  gap: 12,
                }}
              >
                <HugeiconsIcon icon={CustomerSupportIcon} size={48} color={c.muted} />
                <Text style={{ color: c.muted, textAlign: "center" }}>
                  {t("support.empty")}
                </Text>
              </View>
            }
          />
        )}

        {/* Input bar */}
        <Animated.View
          style={[
            {
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 8,
              paddingHorizontal: 12,
              paddingTop: 10,
              borderTopWidth: 1,
              borderColor: c.border,
              backgroundColor: c.card,
            },
            inputBarPaddingStyle,
          ]}
        >
          {/* Image picker button */}
          <Pressable
            onPress={handlePickImage}
            disabled={sendMessage.isPending || !conversationId}
            style={{
              marginBottom: 4,
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: c.brandLight,
            }}
          >
            <HugeiconsIcon icon={Image01Icon} size={18} color={c.brand} />
          </Pressable>

          <TextInput
            value={body}
            onChangeText={setBody}
            onSubmitEditing={handleSend}
            placeholder={t("chat.inputPlaceholder")}
            placeholderTextColor={c.muted}
            multiline
            maxLength={2000}
            spellCheck={false}
            autoCorrect={false}
            style={{
              flex: 1,
              minHeight: 40,
              maxHeight: 120,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: c.isDark ? "#111111" : "#F0F0F0",
              color: c.brand,
              fontFamily:
                Platform.OS === "android"
                  ? language === "ar"
                    ? "IBMPlexSansArabic_400Regular"
                    : "Manrope_400Regular"
                  : undefined,
              fontSize: 14,
            }}
          />

          <Pressable
            onPress={handleSend}
            disabled={!body.trim() || sendMessage.isPending || !conversationId}
            style={{
              marginBottom: 4,
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: body.trim() ? MINE_BG : c.brandLight,
            }}
          >
            {sendMessage.isPending ? (
              <Spinner size={16} color={MINE_TEXT} />
            ) : (
              <HugeiconsIcon
                icon={ArrowUp01Icon}
                size={18}
                color={body.trim() ? MINE_TEXT : c.muted}
              />
            )}
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
