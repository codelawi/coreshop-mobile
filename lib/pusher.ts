import { Pusher } from "@pusher/pusher-websocket-react-native";
import * as SecureStore from "expo-secure-store";

const KEY = process.env.EXPO_PUBLIC_PUSHER_APP_KEY ?? "";
const CLUSTER = process.env.EXPO_PUBLIC_PUSHER_APP_CLUSTER ?? "eu";
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

const pusher = Pusher.getInstance();
let _ready = false;
let _pending: Promise<void> | null = null;

export function ensurePusher(): Promise<void> {
  if (_ready) return Promise.resolve();
  if (_pending) return _pending;

  _pending = (async () => {
    await pusher.init({
      apiKey: KEY,
      cluster: CLUSTER,
      onAuthorizer: async (channelName: string, socketId: string) => {
        const token = await SecureStore.getItemAsync("auth_token");
        const res = await fetch(`${API_URL}/broadcasting/auth`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token ?? ""}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ socket_id: socketId, channel_name: channelName }),
        });
        return res.json();
      },
    });
    await pusher.connect();
    _ready = true;
    _pending = null;
  })();

  return _pending;
}

export { pusher };

export function disconnectPusher(): void {
  if (_ready) {
    pusher.disconnect().catch(() => {});
    _ready = false;
    _pending = null;
  }
}
