import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getPusher } from "@/lib/pusher";

export interface ChatParticipant {
  id: number;
  name: string;
  avatar: string | null;
}

export interface LastMessage {
  body: string;
  sender_id: number;
  created_at: string;
}

export interface Conversation {
  id: number;
  order_id: number | null;
  last_message_at: string | null;
  client: ChatParticipant;
  store: { id: number; name: string; logo: string | null };
  last_message: LastMessage | null;
  unread_count: number;
  created_at: string;
}

export interface MessageReferenceData {
  id: number;
  name?: string;
  price?: number;
  image?: string | null;
  status?: string;
  total?: number;
  created_at?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar: string | null;
  body: string;
  type: "text" | "product" | "order";
  reference_id: number | null;
  reference_data: MessageReferenceData | null;
  read_at: string | null;
  created_at: string;
}

export interface SendMessagePayload {
  body?: string;
  type?: "text" | "product" | "order";
  reference_id?: number;
}

export function useConversations() {
  return useQuery({
    queryKey: ["conversations", "client"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Conversation[] }>("/client/conversations");
      return res.data.data;
    },
  });
}

export function useSellerConversations() {
  return useQuery({
    queryKey: ["conversations", "seller"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Conversation[] }>("/seller/conversations");
      return res.data.data;
    },
  });
}

export function useMessages(conversationId: number, role: "client" | "seller") {
  const path =
    role === "seller"
      ? `/seller/conversations/${conversationId}/messages`
      : `/client/conversations/${conversationId}/messages`;

  return useQuery({
    queryKey: ["chat", role, conversationId],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Message[] }>(path);
      return res.data.data;
    },
    enabled: !!conversationId,
  });
}

export function useChatChannel(
  conversationId: number,
  role: "client" | "seller",
  currentUserId: number,
) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const channelName = `private-conversation.${conversationId}`;
    const pusher = getPusher();
    const channel = pusher.subscribe(channelName);

    channel.bind("MessageSent", (data: Message) => {
      if (data.sender_id === currentUserId) return;

      qc.setQueryData<Message[]>(["chat", role, conversationId], (prev = []) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });

      qc.invalidateQueries({ queryKey: ["conversations", role] });
    });

    return () => {
      channel.unbind("MessageSent");
      pusher.unsubscribe(channelName);
    };
  }, [conversationId, currentUserId, role, qc]);
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { store_id: number; order_id?: number }) => {
      const res = await api.post<{ success: boolean; data: Conversation }>(
        "/client/conversations",
        data
      );
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations", "client"] }),
  });
}

export function useSendMessage(conversationId: number, role: "client" | "seller") {
  const qc = useQueryClient();
  const path =
    role === "seller"
      ? `/seller/conversations/${conversationId}/messages`
      : `/client/conversations/${conversationId}/messages`;

  return useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      const res = await api.post<{ success: boolean; data: Message }>(path, payload);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", role, conversationId] }),
  });
}

export function useClientOrders() {
  return useQuery({
    queryKey: ["orders", "client", "chat-picker"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: any[] }>("/client/orders");
      return res.data.data as Array<{
        id: number;
        status: string;
        total: string;
        created_at: string;
        store?: { name: string };
      }>;
    },
  });
}

function extractImageUrl(img: unknown): string | null {
  if (!img) return null;
  if (typeof img === "string") return img;
  if (typeof img === "object" && img !== null && "url" in img) return (img as { url: string }).url;
  return null;
}

function normalizeProducts(raw: any[]): Array<{ id: number; name: string; price: string; imageUrl: string | null }> {
  return raw.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    imageUrl: extractImageUrl(Array.isArray(p.images) ? p.images[0] : p.images),
  }));
}

export function useSellerProducts() {
  return useQuery({
    queryKey: ["products", "seller", "chat-picker"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: any[] }>("/seller/products");
      return normalizeProducts(res.data.data);
    },
  });
}

export function useClientStoreProducts(storeId: number) {
  return useQuery({
    queryKey: ["products", "store", storeId, "chat-picker"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: any[] }>(`/stores/${storeId}/products`);
      return normalizeProducts(res.data.data);
    },
    enabled: !!storeId,
  });
}
