import Pusher from "pusher-js";
import * as SecureStore from "expo-secure-store";

const KEY = process.env.EXPO_PUBLIC_PUSHER_APP_KEY ?? "";
const CLUSTER = process.env.EXPO_PUBLIC_PUSHER_APP_CLUSTER ?? "eu";
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

let _client: Pusher | null = null;

export function getPusher(): Pusher {
  if (!_client) {
    _client = new Pusher(KEY, {
      cluster: CLUSTER,
      channelAuthorization: {
        customHandler: async (params, callback) => {
          try {
            const token = await SecureStore.getItemAsync("auth_token");
            const res = await fetch(`${API_URL}/broadcasting/auth`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token ?? ""}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                socket_id: params.socketId,
                channel_name: params.channelName,
              }),
            });
            const data = await res.json();
            callback(null, data as { auth: string });
          } catch (err) {
            callback(err instanceof Error ? err : new Error(String(err)), null);
          }
        },
      },
    });
  }
  return _client;
}

export function disconnectPusher(): void {
  _client?.disconnect();
  _client = null;
}
