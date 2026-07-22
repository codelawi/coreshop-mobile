import { useEffect } from "react";
import { type InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PusherEvent } from "@pusher/pusher-websocket-react-native";
import { api } from "@/lib/api";
import { ensurePusher, pusher } from "@/lib/pusher";

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, any> | null;
  read_at: string | null;
  created_at: string;
}

type NotificationsPage = { data: AppNotification[]; meta: { has_more: boolean } };

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: async ({ pageParam }: { pageParam: number | undefined }) => {
      const params = pageParam ? { before_id: pageParam, limit: 10 } : { limit: 10 };
      const res = await api.get<{ success: boolean; data: AppNotification[]; meta: { has_more: boolean } }>(
        "/client/notifications",
        { params }
      );
      return res.data as NotificationsPage;
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta.has_more || lastPage.data.length === 0) { return undefined; }
      return lastPage.data[lastPage.data.length - 1].id;
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      try {
        const res = await api.get<{ success: boolean; data: { count: number } }>(
          "/client/notifications/unread-count"
        );
        return res.data.data.count;
      } catch {
        return 0;
      }
    },
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/client/notifications/${id}/read`);
    },
    onSuccess: (_data, id) => {
      const now = new Date().toISOString();
      qc.setQueryData<InfiniteData<NotificationsPage>>(["notifications"], (prev) => {
        if (!prev) { return prev; }
        return {
          ...prev,
          pages: prev.pages.map((page) => ({
            ...page,
            data: page.data.map((n) => n.id === id ? { ...n, read_at: now } : n),
          })),
        };
      });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.patch("/client/notifications/read-all");
    },
    onSuccess: () => {
      const now = new Date().toISOString();
      qc.setQueryData<InfiniteData<NotificationsPage>>(["notifications"], (prev) => {
        if (!prev) { return prev; }
        return {
          ...prev,
          pages: prev.pages.map((page) => ({
            ...page,
            data: page.data.map((n) => ({ ...n, read_at: n.read_at ?? now })),
          })),
        };
      });
      qc.setQueryData<number>(["notifications", "unread-count"], 0);
    },
  });
}

export function useUserChannel(userId: number | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId) { return; }

    const channelName = `private-user.${userId}`;
    let active = true;

    (async () => {
      try {
        await ensurePusher();
        if (!active) { return; }

        await pusher.subscribe({
          channelName,
          onEvent: (event: PusherEvent) => {
            try {
              if (event.eventName === "UserNotificationCreated") {
                qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
                qc.invalidateQueries({ queryKey: ["notifications"] });
              }
            } catch {}
          },
        });
      } catch {}
    })();

    return () => {
      active = false;
      pusher.unsubscribe({ channelName }).catch(() => {});
    };
  }, [userId, qc]);
}

export function useSupportUnreadCount() {
  return useQuery({
    queryKey: ["support", "unread-count"],
    queryFn: async () => {
      try {
        const res = await api.get<{ success: boolean; data: { count: number } }>(
          "/client/support/unread-count"
        );
        return res.data.data.count;
      } catch {
        return 0;
      }
    },
  });
}
