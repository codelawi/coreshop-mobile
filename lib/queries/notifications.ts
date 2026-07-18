import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      try {
        const res = await api.get<{ success: boolean; data: AppNotification[] }>("/client/notifications");
        return res.data.data;
      } catch {
        return [] as AppNotification[];
      }
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
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
      qc.invalidateQueries({ queryKey: ["notifications"] });
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
