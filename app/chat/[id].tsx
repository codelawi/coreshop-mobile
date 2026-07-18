import {
  View,
  FlatList,
  TextInput,
  Pressable,
  Platform,
  Modal,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  Tick02Icon,
  AttachmentSquareIcon,
  ShoppingBag01Icon,
  ShoppingCart01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/ui/text";
import { Spinner } from "@/components/ui/spinner";
import {
  useMessages,
  useSendMessage,
  useClientOrders,
  useSellerProducts,
  useClientStoreProducts,
  useChatChannel,
  type Message,
} from "@/lib/queries/chat";
import { useAuthStore } from "@/stores/auth-store";
import { useLanguageStore } from "@/stores/language-store";
import { useThemeColors } from "@/lib/theme";
import { resolveAvatar } from "@/lib/avatar";

// Fixed bubble colors — don't use c.brand (flips to white in dark mode)
const MINE_BG = "#0A0A0A";
const MINE_TEXT = "#FFFFFF";
const HEADER_HEIGHT = 52;

type PickerType = "product" | "order" | null;

export default function ChatRoom() {
  const { id, title, role: roleParam, store_id, avatar } = useLocalSearchParams<{
    id: string;
    title: string;
    role: string;
    store_id?: string;
    avatar?: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { language } = useLanguageStore();
  const user = useAuthStore((s) => s.user);
  const BackIcon = language === "ar" ? ArrowRight01Icon : ArrowLeft01Icon;

  const conversationId = Number(id);
  const role: "client" | "seller" = roleParam === "seller" ? "seller" : "client";
  const storeId = Number(store_id ?? 0);

  const { width: screenWidth } = useWindowDimensions();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(conversationId, role);
  const messages = useMemo(
    () => [...(data?.pages ?? [])].reverse().flatMap((p) => p.data),
    [data]
  );
  const sendMessage = useSendMessage(conversationId, role, user?.id);
  useChatChannel(conversationId, role, user?.id ?? 0);

  const [body, setBody] = useState("");
  const [pickerType, setPickerType] = useState<PickerType>(null);
  const listRef = useRef<FlatList<Message>>(null);

  const clientOrders = useClientOrders();
  const sellerProducts = useSellerProducts();
  const clientStoreProducts = useClientStoreProducts(storeId);

  const products = role === "seller" ? sellerProducts.data ?? [] : clientStoreProducts.data ?? [];
  const orders = clientOrders.data ?? [];

  // Reanimated keyboard — works correctly with edgeToEdgeEnabled on Android
  const keyboard = useAnimatedKeyboard();

  const avoidKeyboardStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboard.height.value,
  }));

  const inputBarPaddingStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboard.height.value > 0 ? 10 : Math.max(insets.bottom, 8),
  }));

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  const handleSend = () => {
    const text = body.trim();
    if (!text || sendMessage.isPending) return;
    setBody("");
    sendMessage.mutate({ body: text, type: "text" });
  };

  const handleShareProduct = (productId: number) => {
    setPickerType(null);
    sendMessage.mutate({ body: "", type: "product", reference_id: productId });
  };

  const handleShareOrder = (orderId: number) => {
    setPickerType(null);
    sendMessage.mutate({ body: "", type: "order", reference_id: orderId });
  };

  const renderProductCard = (item: Message, isMine: boolean) => {
    const d = item.reference_data;
    if (!d) return null;
    const cardBg = isMine ? "rgba(255,255,255,0.12)" : c.brandLight;
    return (
      <Pressable
        onPress={() => router.push(`/product/${d.id}` as any)}
        style={{ borderRadius: 12, overflow: "hidden", backgroundColor: cardBg, width: 200 }}
      >
        {d.image ? (
          <Image source={{ uri: d.image }} style={{ width: "100%", height: 120 }} contentFit="cover" />
        ) : (
          <View style={{ height: 100, alignItems: "center", justifyContent: "center", backgroundColor: c.border }}>
            <HugeiconsIcon icon={ShoppingBag01Icon} size={32} color={c.muted} />
          </View>
        )}
        <View style={{ padding: 10, gap: 2 }}>
          <Text variant="semibold" style={{ color: isMine ? MINE_TEXT : c.brand, fontSize: 13 }} numberOfLines={2}>
            {d.name}
          </Text>
          <Text variant="bold" style={{ color: isMine ? "rgba(255,255,255,0.85)" : c.brand, fontSize: 14 }}>
            {Number(d.price).toFixed(2)} JD
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderOrderCard = (item: Message, isMine: boolean) => {
    const d = item.reference_data;
    if (!d) return null;
    const cardBg = isMine ? "rgba(255,255,255,0.12)" : c.brandLight;
    return (
      <Pressable
        onPress={() => router.push(`/orders/${d.id}` as any)}
        style={{ borderRadius: 12, padding: 12, gap: 6, backgroundColor: cardBg, width: 200 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <HugeiconsIcon icon={ShoppingCart01Icon} size={18} color={isMine ? MINE_TEXT : c.brand} />
          <Text variant="semibold" style={{ color: isMine ? MINE_TEXT : c.brand, fontSize: 13 }}>
            {t("orders.order")} #{d.id}
          </Text>
        </View>
        <Text style={{ color: isMine ? "rgba(255,255,255,0.7)" : c.secondary, fontSize: 12 }}>
          {d.status?.replace(/_/g, " ")}
        </Text>
        <Text variant="bold" style={{ color: isMine ? "rgba(255,255,255,0.85)" : c.brand, fontSize: 14 }}>
          {Number(d.total).toFixed(2)} JD
        </Text>
      </Pressable>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.sender_id === user?.id;
    const isProduct = item.type === "product";
    const isOrder = item.type === "order";
    const isAttachment = isProduct || isOrder;
    const isPending = item.id < 0;

    const bubble = isAttachment ? (
      <View>
        {isProduct ? renderProductCard(item, isMine) : renderOrderCard(item, isMine)}
        {!!item.body && (
          <View
            style={{
              marginTop: 4,
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 8,
              backgroundColor: isMine ? MINE_BG : c.brandLight,
            }}
          >
            <Text style={{ color: isMine ? MINE_TEXT : c.brand, fontSize: 14 }}>{item.body}</Text>
          </View>
        )}
      </View>
    ) : (
      <View
        style={{
          borderRadius: 18,
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: isMine ? MINE_BG : c.brandLight,
          opacity: isPending ? 0.7 : 1,
        }}
      >
        <Text variant="medium" style={{ color: isMine ? MINE_TEXT : c.brand, fontSize: 14, lineHeight: 20 }}>
          {item.body}
        </Text>
      </View>
    );

    return (
      <View style={{ marginBottom: 12, maxWidth: "82%", alignSelf: isMine ? "flex-end" : "flex-start" }}>
        {isMine ? (
          bubble
        ) : (
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, overflow: "hidden", flexShrink: 0, marginBottom: 2 }}>
              <Image
                source={{ uri: resolveAvatar(item.sender_avatar, item.sender_id) }}
                style={{ width: 28, height: 28 }}
                contentFit="cover"
              />
            </View>
            <View style={{ flex: 1 }}>{bubble}</View>
          </View>
        )}

        {/* Time + read receipt */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2, justifyContent: isMine ? "flex-end" : "flex-start" }}>
          <Text style={{ color: c.muted, fontSize: 10 }}>
            {new Date(item.created_at).toLocaleTimeString(language === "ar" ? "ar" : "en", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          {isMine && (
            isPending ? (
              <HugeiconsIcon icon={Tick02Icon} size={11} color={c.muted} />
            ) : (
              <>
                <HugeiconsIcon icon={Tick02Icon} size={11} color={item.read_at ? "#22C55E" : c.muted} />
                <HugeiconsIcon icon={Tick02Icon} size={11} color={item.read_at ? "#22C55E" : c.muted} />
              </>
            )
          )}
        </View>
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
        <View style={{ width: 36, height: 36, borderRadius: 18, overflow: "hidden", flexShrink: 0 }}>
          <Image
            source={{ uri: resolveAvatar(avatar, id) }}
            style={{ width: 36, height: 36 }}
            contentFit="cover"
          />
        </View>
        <Text variant="bold" style={{ flex: 1, fontSize: 16, color: c.brand }} numberOfLines={1}>
          {title ?? t("chat.conversation")}
        </Text>
      </View>

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
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 }}>
                <Text style={{ color: c.muted }}>{t("chat.noMessages")}</Text>
              </View>
            }
          />
        )}

        {/* Attachment type chooser */}
        {pickerType !== null && (
          <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingBottom: 8 }}>
            <Pressable
              onPress={() => setPickerType("product")}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                borderRadius: 12,
                paddingVertical: 10,
                backgroundColor: pickerType === "product" ? MINE_BG : c.brandLight,
              }}
            >
              <HugeiconsIcon icon={ShoppingBag01Icon} size={18} color={pickerType === "product" ? MINE_TEXT : c.brand} />
              <Text variant="semibold" style={{ color: pickerType === "product" ? MINE_TEXT : c.brand, fontSize: 13 }}>
                {t("chat.shareProduct")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setPickerType("order")}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                borderRadius: 12,
                paddingVertical: 10,
                backgroundColor: pickerType === "order" ? MINE_BG : c.brandLight,
              }}
            >
              <HugeiconsIcon icon={ShoppingCart01Icon} size={18} color={pickerType === "order" ? MINE_TEXT : c.brand} />
              <Text variant="semibold" style={{ color: pickerType === "order" ? MINE_TEXT : c.brand, fontSize: 13 }}>
                {t("chat.shareOrder")}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Input bar */}
        <Animated.View
          style={[
            {
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 8,
              paddingHorizontal: 16,
              paddingTop: 10,
              borderTopWidth: 1,
              borderColor: c.border,
              backgroundColor: c.card,
            },
            inputBarPaddingStyle,
          ]}
        >
          <Pressable
            onPress={() => setPickerType(pickerType ? null : "product")}
            hitSlop={8}
            style={{ marginBottom: 10 }}
          >
            <HugeiconsIcon
              icon={AttachmentSquareIcon}
              size={24}
              color={pickerType ? MINE_BG : c.muted}
            />
          </Pressable>

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
              backgroundColor: c.isDark ? "#111111" : "#F0F0F0",
              color: c.brand,
              fontFamily: language === "ar" ? "IBMPlexSansArabic_400Regular" : "Manrope_400Regular",
              fontSize: 14,
            }}
          />

          <Pressable
            onPress={handleSend}
            disabled={!body.trim() || sendMessage.isPending}
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
              <HugeiconsIcon icon={ArrowUp01Icon} size={18} color={body.trim() ? MINE_TEXT : c.muted} />
            )}
          </Pressable>
        </Animated.View>
      </Animated.View>

      {/* Product picker modal */}
      <Modal
        visible={pickerType === "product"}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerType(null)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "75%" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: c.border }}>
              <Text variant="bold" style={{ fontSize: 16, color: c.brand }}>{t("chat.shareProduct")}</Text>
              <Pressable onPress={() => setPickerType(null)} hitSlop={8}>
                <HugeiconsIcon icon={Cancel01Icon} size={22} color={c.muted} />
              </Pressable>
            </View>
            {products.length === 0 ? (
              <View style={{ paddingVertical: 64, alignItems: "center" }}>
                <Text style={{ color: c.muted }}>{t("chat.noProducts")}</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 12 }}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {products.map((p) => {
                    const tileSize = (screenWidth - 24 - 10) / 2;
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => handleShareProduct(p.id)}
                        style={{ width: tileSize, borderRadius: 12, overflow: "hidden", backgroundColor: c.brandLight }}
                      >
                        {p.imageUrl ? (
                          <Image source={{ uri: p.imageUrl }} style={{ width: "100%", height: tileSize * 0.85 }} contentFit="cover" />
                        ) : (
                          <View style={{ width: "100%", height: tileSize * 0.85, alignItems: "center", justifyContent: "center", backgroundColor: c.border }}>
                            <HugeiconsIcon icon={ShoppingBag01Icon} size={36} color={c.muted} />
                          </View>
                        )}
                        <View style={{ padding: 10, gap: 3 }}>
                          <Text variant="semibold" style={{ fontSize: 13, color: c.brand }} numberOfLines={2}>{p.name}</Text>
                          <Text variant="bold" style={{ fontSize: 14, color: c.brand }}>{Number(p.price).toFixed(2)} JD</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Order picker modal */}
      <Modal
        visible={pickerType === "order"}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerType(null)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "65%" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: c.border }}>
              <Text variant="bold" style={{ fontSize: 16, color: c.brand }}>{t("chat.shareOrder")}</Text>
              <Pressable onPress={() => setPickerType(null)} hitSlop={8}>
                <HugeiconsIcon icon={Cancel01Icon} size={22} color={c.muted} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: insets.bottom + 12 }}>
              {orders.length === 0 ? (
                <View style={{ paddingVertical: 48, alignItems: "center" }}>
                  <Text style={{ color: c.muted }}>{t("chat.noOrders")}</Text>
                </View>
              ) : (
                orders.map((o) => (
                  <Pressable
                    key={o.id}
                    onPress={() => handleShareOrder(o.id)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, padding: 10, backgroundColor: c.brandLight }}
                  >
                    <View style={{ width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: c.border }}>
                      <HugeiconsIcon icon={ShoppingCart01Icon} size={20} color={c.brand} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="semibold" style={{ fontSize: 14, color: c.brand }}>{t("orders.order")} #{o.id}</Text>
                      <Text style={{ fontSize: 12, color: c.secondary }}>{o.status?.replace(/_/g, " ")}</Text>
                    </View>
                    <Text variant="bold" style={{ fontSize: 14, color: c.brand }}>{Number(o.total).toFixed(2)} JD</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
