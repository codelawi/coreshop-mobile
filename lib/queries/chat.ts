import { useEffect } from "react";
import { type InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PusherEvent } from "@pusher/pusher-websocket-react-native";
import { api } from "@/lib/api";
import { ensurePusher, pusher } from "@/lib/pusher";

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

  return useInfiniteQuery({
    queryKey: ["chat", role, conversationId],
    queryFn: async ({ pageParam }: { pageParam: number | undefined }) => {
      const params = pageParam ? { before_id: pageParam, limit: 50 } : { limit: 50 };
      const res = await api.get<{ success: boolean; data: Message[]; meta: { has_more: boolean } }>(
        path,
        { params }
      );
      return res.data;
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (firstPage) => {
      if (!firstPage.meta.has_more || firstPage.data.length === 0) { return undefined; }
      return firstPage.data[0].id;
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
    let active = true;

    (async () => {
      try {
        await ensurePusher();
        if (!active) return;

        await pusher.subscribe({
          channelName,
          onEvent: (event: PusherEvent) => {
            if (event.eventName !== "MessageSent") return;
            try {
              const raw = event.data;
              const data: Message = typeof raw === "string" ? JSON.parse(raw) : raw as Message;
              if (data.sender_id === currentUserId) return;

              type ChatPage = { data: Message[]; meta: { has_more: boolean } };
              qc.setQueryData<InfiniteData<ChatPage>>(["chat", role, conversationId], (prev) => {
                if (!prev || prev.pages.length === 0) return prev;
                const lastIdx = prev.pages.length - 1;
                const alreadyExists = prev.pages.some((p) => p.data.some((m) => m.id === data.id));
                if (alreadyExists) return prev;
                return {
                  ...prev,
                  pages: prev.pages.map((page, i) =>
                    i === lastIdx ? { ...page, data: [...page.data, data] } : page
                  ),
                };
              });

              qc.invalidateQueries({ queryKey: ["conversations", role] });
            } catch {}
          },
        });
      } catch {}
    })();

    return () => {
      active = false;
      pusher.unsubscribe({ channelName }).catch(() => {});
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

export function useDeleteConversation(role: "client" | "seller") {
  const qc = useQueryClient();
  const path = role === "seller" ? "/seller/conversations" : "/client/conversations";
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${path}/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations", role] }),
  });
}

export function useSendMessage(conversationId: number, role: "client" | "seller", userId?: number) {
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
    onMutate: async (payload) => {
      type ChatPage = { data: Message[]; meta: { has_more: boolean } };
      await qc.cancelQueries({ queryKey: ["chat", role, conversationId] });
      const previous = qc.getQueryData<InfiniteData<ChatPage>>(["chat", role, conversationId]);
      const optimisticId = -Date.now();
      const optimistic: Message = {
        id: optimisticId,
        conversation_id: conversationId,
        sender_id: userId ?? 0,
        sender_name: "",
        sender_avatar: null,
        body: payload.body ?? "",
        type: payload.type ?? "text",
        reference_id: payload.reference_id ?? null,
        reference_data: null,
        read_at: null,
        created_at: new Date().toISOString(),
      };
      qc.setQueryData<InfiniteData<ChatPage>>(["chat", role, conversationId], (prev) => {
        if (!prev || prev.pages.length === 0) return prev;
        const lastIdx = prev.pages.length - 1;
        return {
          ...prev,
          pages: prev.pages.map((page, i) =>
            i === lastIdx ? { ...page, data: [...page.data, optimistic] } : page
          ),
        };
      });
      return { previous, optimisticId };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        qc.setQueryData(["chat", role, conversationId], context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["chat", role, conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations", role] });
    },
  });
}

export interface SupportMessage {
  id: number;
  support_conversation_id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar: string | null;
  sender_role: string;
  type: "text" | "image";
  body: string;
  read_at: string | null;
  created_at: string;
  _pending?: boolean;
  _localUri?: string;
}

export function useSupportConversation() {
  return useQuery({
    queryKey: ["support", "conversation"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: { id: number } }>(
        "/client/support/conversation"
      );
      return res.data.data;
    },
  });
}

export function useSupportMessages(conversationId: number | undefined) {
  return useInfiniteQuery({
    queryKey: ["support", "messages", conversationId],
    queryFn: async ({ pageParam }: { pageParam: number | undefined }) => {
      const params = pageParam ? { before_id: pageParam, limit: 50 } : { limit: 50 };
      const res = await api.get<{ success: boolean; data: SupportMessage[]; meta: { has_more: boolean } }>(
        `/client/support/${conversationId}/messages`,
        { params }
      );
      return res.data;
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (firstPage) => {
      if (!firstPage.meta.has_more || firstPage.data.length === 0) { return undefined; }
      return firstPage.data[0].id;
    },
    enabled: !!conversationId,
  });
}

export function useSendSupportMessage(conversationId: number | undefined, currentUserId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { body?: string; imageUri?: string }) => {
      let data: FormData | Record<string, string>;

      if (payload.imageUri) {
        const form = new FormData();
        const filename = payload.imageUri.split("/").pop() ?? "image.jpg";
        const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
        const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
        form.append("image", { uri: payload.imageUri, name: filename, type: mime } as any);
        data = form;
      } else {
        data = { body: payload.body ?? "" };
      }

      const res = await api.post<{ success: boolean; data: SupportMessage }>(
        `/client/support/${conversationId}/messages`,
        data
      );
      return res.data.data;
    },
    onMutate: async (payload) => {
      type SupportPage = { data: SupportMessage[]; meta: { has_more: boolean } };
      await qc.cancelQueries({ queryKey: ["support", "messages", conversationId] });
      const previous = qc.getQueryData<InfiniteData<SupportPage>>(["support", "messages", conversationId]);
      const optimistic: SupportMessage = {
        id: -Date.now(),
        support_conversation_id: conversationId ?? 0,
        sender_id: currentUserId,
        sender_name: "",
        sender_avatar: null,
        sender_role: "client",
        type: payload.imageUri ? "image" : "text",
        body: payload.imageUri ?? (payload.body ?? ""),
        read_at: null,
        created_at: new Date().toISOString(),
        _pending: true,
        _localUri: payload.imageUri,
      };
      qc.setQueryData<InfiniteData<SupportPage>>(
        ["support", "messages", conversationId],
        (prev) => {
          if (!prev || prev.pages.length === 0) return prev;
          const lastIdx = prev.pages.length - 1;
          return {
            ...prev,
            pages: prev.pages.map((page, i) =>
              i === lastIdx ? { ...page, data: [...page.data, optimistic] } : page
            ),
          };
        }
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        qc.setQueryData(["support", "messages", conversationId], context.previous);
      }
    },
    onSuccess: (serverMessage) => {
      type SupportPage = { data: SupportMessage[]; meta: { has_more: boolean } };
      qc.setQueryData<InfiniteData<SupportPage>>(
        ["support", "messages", conversationId],
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              data: page.data.map((m) =>
                m._pending && m.sender_id === currentUserId ? { ...serverMessage, _pending: false } : m
              ),
            })),
          };
        }
      );
      qc.invalidateQueries({ queryKey: ["support", "unread-count"] });
    },
  });
}

export function useSupportChannel(
  conversationId: number | undefined,
  currentUserId: number,
) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const channelName = `private-support.${conversationId}`;
    let active = true;

    (async () => {
      try {
        await ensurePusher();
        if (!active) return;

        await pusher.subscribe({
          channelName,
          onEvent: (event: PusherEvent) => {
            if (event.eventName !== "SupportMessageSent") return;
            try {
              const raw = event.data;
              const data: SupportMessage = typeof raw === "string" ? JSON.parse(raw) : raw as SupportMessage;
              if (data.sender_id === currentUserId) return;

              type SupportPage = { data: SupportMessage[]; meta: { has_more: boolean } };
              qc.setQueryData<InfiniteData<SupportPage>>(
                ["support", "messages", conversationId],
                (prev) => {
                  if (!prev || prev.pages.length === 0) return prev;
                  const alreadyExists = prev.pages.some((p) => p.data.some((m) => m.id === data.id));
                  if (alreadyExists) return prev;
                  const lastIdx = prev.pages.length - 1;
                  return {
                    ...prev,
                    pages: prev.pages.map((page, i) =>
                      i === lastIdx ? { ...page, data: [...page.data, data] } : page
                    ),
                  };
                }
              );
            } catch {}
          },
        });
      } catch {}
    })();

    return () => {
      active = false;
      pusher.unsubscribe({ channelName }).catch(() => {});
    };
  }, [conversationId, currentUserId, qc]);
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
