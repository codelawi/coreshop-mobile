import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export interface NotifPrefs {
  orders: boolean;
  promotions: boolean;
  newArrivals: boolean;
  account: boolean;
}

const PREFS_KEY = "notif_prefs";

const defaultPrefs: NotifPrefs = {
  orders: true,
  promotions: true,
  newArrivals: false,
  account: true,
};

interface NotifPrefsState {
  prefs: NotifPrefs;
  hydrate: () => Promise<void>;
  update: (key: keyof NotifPrefs, value: boolean) => Promise<void>;
}

export const useNotifPrefsStore = create<NotifPrefsState>((set, get) => ({
  prefs: defaultPrefs,

  hydrate: async () => {
    const raw = await SecureStore.getItemAsync(PREFS_KEY);
    if (raw) {
      try {
        set({ prefs: { ...defaultPrefs, ...JSON.parse(raw) } });
      } catch {}
    }
  },

  update: async (key, value) => {
    const next = { ...get().prefs, [key]: value };
    set({ prefs: next });
    await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(next));
  },
}));

export function isNotifTypeAllowed(type: string | undefined): boolean {
  const { prefs } = useNotifPrefsStore.getState();
  switch (type) {
    case "order_status":
    case "new_order":
      return prefs.orders;
    case "promotion":
    case "flash_deal":
      return prefs.promotions;
    case "new_arrival":
      return prefs.newArrivals;
    case "account_banned":
      return true;
    case "new_message":
    case "support_message":
      return true;
    default:
      return prefs.account;
  }
}
