import * as Notifications from "expo-notifications";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import { router } from "expo-router";
import { toast } from "sonner-native";
import React from "react";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  DeliveryTruck01Icon,
  Package01Icon,
  SaleTag01Icon,
  GiftIcon,
  Message01Icon,
  CustomerSupportIcon,
  Alert01Icon,
  Notification03Icon,
} from "@hugeicons/core-free-icons";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { isNotifTypeAllowed } from "@/stores/notif-prefs-store";
import { queryClient } from "@/lib/query-client";

interface NotificationData {
  type?: string;
  order_id?: number;
  conversation_id?: number;
  role?: string;
  store_name?: string;
}

function updateBadgesForNotification(data: NotificationData): void {
  switch (data.type) {
    case "support_message":
    case "new_support_message":
      queryClient.setQueryData<number>(["support", "unread-count"], (prev) => (prev ?? 0) + 1);
      break;
    case "new_order":
      // Increment seller store pending orders badge
      queryClient.setQueryData<{ pending_orders_count: number } & Record<string, unknown>>(
        ["seller", "store"],
        (prev) => prev ? { ...prev, pending_orders_count: prev.pending_orders_count + 1 } : prev
      );
      queryClient.setQueryData<number>(["notifications", "unread-count"], (prev) => (prev ?? 0) + 1);
      break;
    default:
      // order_status, promotion, flash_deal, new_arrival, etc.
      queryClient.setQueryData<number>(["notifications", "unread-count"], (prev) => (prev ?? 0) + 1);
  }
}

function navigateForNotification(data: NotificationData): void {
  switch (data.type) {
    case "support_message":
    case "new_support_message":
      router.push("/support" as any);
      break;
    case "new_message":
      if (data.conversation_id) {
        router.push({
          pathname: "/chat/[id]",
          params: { id: data.conversation_id, role: data.role ?? "client", title: data.store_name ?? "Chat" },
        } as any);
      }
      break;
    case "order_status":
      if (data.order_id) {
        router.push(`/orders/${data.order_id}` as any);
      }
      break;
    case "new_order":
      router.push("/seller/orders" as any);
      break;
    case "promotion":
    case "flash_deal":
    case "new_arrival":
      router.push("/(tabs)/home" as any);
      break;
    default:
      router.push("/notifications" as any);
  }
}

function getNotificationIcon(type: string | undefined): React.ReactNode {
  const color = type === "account_banned" ? "#FF4D4F" : "#0A0A0A";
  switch (type) {
    case "order_status":
      return React.createElement(HugeiconsIcon, { icon: DeliveryTruck01Icon, size: 20, color });
    case "new_order":
      return React.createElement(HugeiconsIcon, { icon: Package01Icon, size: 20, color });
    case "promotion":
    case "flash_deal":
      return React.createElement(HugeiconsIcon, { icon: SaleTag01Icon, size: 20, color: "#FF4D4F" });
    case "new_arrival":
      return React.createElement(HugeiconsIcon, { icon: GiftIcon, size: 20, color });
    case "new_message":
      return React.createElement(HugeiconsIcon, { icon: Message01Icon, size: 20, color });
    case "support_message":
    case "new_support_message":
      return React.createElement(HugeiconsIcon, { icon: CustomerSupportIcon, size: 20, color });
    case "account_banned":
      return React.createElement(HugeiconsIcon, { icon: Alert01Icon, size: 20, color });
    default:
      return React.createElement(HugeiconsIcon, { icon: Notification03Icon, size: 20, color });
  }
}

const PROJECT_ID =
  (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ??
  "ac7a0146-f6aa-4fa3-b939-a8bc4713c03e";

export const NOTIFICATION_CHANNEL_ID = "coreshop_v2";

const CHANNEL_CONFIG: Notifications.NotificationChannelInput = {
  name: "CoreShop",
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: "#FF4D4F",
  sound: "default",
  enableVibrate: true,
  showBadge: true,
  bypassDnd: false,
  lockScreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
};

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// ─── Run at module load ────────────────────────────────────────────────────────
// This fires the instant _layout.tsx imports this module — before any FCM
// message can be processed — so the channel always exists with MAX importance.
if (Platform.OS === "android") {
  void Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, CHANNEL_CONFIG);
}

// Suppress all system UI for foreground notifications — the addNotificationReceivedListener
// below handles in-app toasts and cache refreshes instead.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

// ─── Exported so _layout can call it on every app open ───────────────────────
export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, CHANNEL_CONFIG);
}

export async function registerForPushNotifications(): Promise<void> {
  if (isExpoGo) {
    if (__DEV__) {
      console.warn(
        "[Push] Expo Go (SDK 53+) cannot receive push notifications. " +
          "Run `eas build --profile development` to get a dev build that supports push."
      );
    }

    return;
  }

  await ensureNotificationChannel();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    if (__DEV__) {
      console.warn("[Push] Permission denied:", finalStatus);
    }

    return;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });

    if (__DEV__) {
      console.log("[Push] Token:", tokenData.data);
    }

    await api.patch("/auth/push-token", { token: tokenData.data });
  } catch (error: any) {
    if (__DEV__) {
      const msg: string = error?.message ?? String(error);
      console.warn("[Push] Token registration failed:", msg);

      if (msg.includes("physical device")) {
        console.warn("[Push] Push notifications require a real device, not a simulator/emulator.");
      } else if (Platform.OS === "android") {
        console.warn(
          "[Push] Android: ensure google-services.json is in the project root " +
            "and FCM credentials are configured via `eas credentials --platform android`."
        );
      } else if (Platform.OS === "ios") {
        console.warn("[Push] iOS: ensure APNs credentials are configured via `eas credentials --platform ios`.");
      }
    }
  }
}

export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
  await Notifications.setBadgeCountAsync(0);
}

export function setupNotificationListeners(): () => void {
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    const user = useAuthStore.getState().user;
    if (!user) { return; }

    const content = notification.request.content;
    const data = content.data as NotificationData;

    if (data?.type === "account_banned") {
      useAuthStore.getState().setUser({ ...user, status: "suspended" });
      router.replace("/banned" as any);
      return;
    }

    // Refresh support messages immediately when a push arrives — acts as Pusher fallback
    if (data?.type === "support_message") {
      void queryClient.invalidateQueries({ queryKey: ["support", "messages"] });
    }

    if (!isNotifTypeAllowed(data?.type)) { return; }

    updateBadgesForNotification(data);

    // Show in-app toast instead of OS banner
    const title = content.title ?? "";
    const body = content.body ?? "";
    if (title || body) {
      const toastId = toast(title || body, {
        description: title ? body : undefined,
        icon: getNotificationIcon(data?.type),
        onPress: () => {
          toast.dismiss(toastId);
          navigateForNotification(data);
        },
      });
    }
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as NotificationData;
    const user = useAuthStore.getState().user;

    if (data?.type === "account_banned") {
      if (user) {
        useAuthStore.getState().setUser({ ...user, status: "suspended" });
        router.replace("/banned" as any);
      }
      return;
    }

    if (!user) { return; }

    navigateForNotification(data);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
