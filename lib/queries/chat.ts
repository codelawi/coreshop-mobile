import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

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

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
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
    refetchInterval: 3000,
  });
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
    mutationFn: async (body: string) => {
      const res = await api.post<{ success: boolean; data: Message }>(path, { body });
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", role, conversationId] }),
  });
}
