import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const PROJECT_ID = "ac7a0146-f6aa-4fa3-b939-a8bc4713c03e";

// expo-notifications remote push was removed from Expo Go in SDK 53
const isExpoGo = Constants.executionEnvironment === "storeClient";

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerForPushNotifications(): Promise<void> {
  if (isExpoGo) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
    await api.patch("/auth/push-token", { token: tokenData.data });
  } catch {
    // Silently ignore — push is non-critical
  }
}

export function setupNotificationListeners(): () => void {
  if (isExpoGo) return () => {};

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
    };

    if (data?.type === "account_banned") {
      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.getState().setUser({ ...user, status: "suspended" });
        router.replace("/banned" as any);
      }
    } else if (data?.type === "order_status" && data?.order_id) {
      router.push(`/orders/${data.order_id}` as any);
    } else if (data?.type === "new_order" && data?.order_id) {
      router.push(`/seller/orders` as any);
    }
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
