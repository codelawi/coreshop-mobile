import * as Notifications from "expo-notifications";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const PROJECT_ID =
  (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ??
  "ac7a0146-f6aa-4fa3-b939-a8bc4713c03e";

/**
 * Expo Go no longer delivers push notifications in SDK 53+.
 * Google removed FCM Legacy (which Expo Go relied on) and per-app Firebase
 * credentials cannot be embedded in a shared Expo Go binary.
 *
 * Solution: use a development build for testing push.
 *   eas build --profile development --platform android
 *   eas build --profile development --platform ios
 */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Must be called unconditionally so foreground notifications always display,
// including in development builds and standalone apps.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0A0A0A",
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    });
  }

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
        console.warn(
          "[Push] iOS: ensure APNs credentials are configured via `eas credentials --platform ios`."
        );
      }
    }
  }
}

export function setupNotificationListeners(): () => void {
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data as { type?: string };

    if (data?.type === "account_banned") {
      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.getState().setUser({ ...user, status: "suspended" });
        router.replace("/banned" as any);
      }
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

    if (data?.type === "account_banned") {
      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.getState().setUser({ ...user, status: "suspended" });
        router.replace("/banned" as any);
      }
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
