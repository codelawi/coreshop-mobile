import * as Notifications from "expo-notifications";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import { router } from "expo-router";
import { toast } from "sonner-native";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { isNotifTypeAllowed } from "@/stores/notif-prefs-store";

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

// Suppress OS banners in foreground — we show in-app toasts instead.
// Background notifications always use the OS banner regardless of this setting.
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isLoggedIn = !!useAuthStore.getState().user;
    const data = notification.request.content.data as { type?: string };
    const allowed = isNotifTypeAllowed(data?.type);
    return {
      shouldPlaySound: isLoggedIn && allowed,
      shouldSetBadge: isLoggedIn && allowed,
      shouldShowBanner: false,
      shouldShowList: isLoggedIn && allowed,
    };
  },
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
    const data = content.data as { type?: string };

    if (data?.type === "account_banned") {
      useAuthStore.getState().setUser({ ...user, status: "suspended" });
      router.replace("/banned" as any);
      return;
    }

    if (!isNotifTypeAllowed(data?.type)) { return; }

    // Show in-app toast instead of OS banner
    const title = content.title ?? "";
    const body = content.body ?? "";
    if (title || body) {
      toast(title || body, { description: title ? body : undefined });
    }
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as {
      type?: string;
      order_id?: number;
      conversation_id?: number;
      role?: string;
      store_name?: string;
    };

    const user = useAuthStore.getState().user;

    if (data?.type === "account_banned") {
      if (user) {
        useAuthStore.getState().setUser({ ...user, status: "suspended" });
        router.replace("/banned" as any);
      }
      return;
    }

    // Ignore taps on notifications when logged out
    if (!user) { return; }

    if (data?.type === "support_message") {
      router.push("/support" as any);
    } else if (data?.type === "new_message" && data?.conversation_id) {
      router.push({
        pathname: "/chat/[id]",
        params: {
          id: data.conversation_id,
          role: data.role ?? "client",
          title: data.store_name ?? "Chat",
        },
      } as any);
    } else if (data?.type === "order_status" && data?.order_id) {
      router.push(`/orders/${data.order_id}` as any);
    } else if (data?.type === "new_order") {
      router.push("/seller/orders" as any);
    }
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
