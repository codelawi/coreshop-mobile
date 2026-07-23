import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export interface SavedAccount {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  token: string;
}

const STORAGE_KEY = "saved_accounts_v1";
const MAX_ACCOUNTS = 5;

interface SavedAccountsState {
  accounts: SavedAccount[];
  addAccount: (account: SavedAccount) => Promise<void>;
  removeAccount: (id: number) => Promise<void>;
  hydrate: () => Promise<void>;
}

async function persist(accounts: SavedAccount[]): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(accounts));
}

export const useSavedAccountsStore = create<SavedAccountsState>((set, get) => ({
  accounts: [],

  addAccount: async (account) => {
    const filtered = get().accounts.filter((a) => a.id !== account.id);
    const next = [account, ...filtered].slice(0, MAX_ACCOUNTS);
    set({ accounts: next });
    await persist(next);
  },

  removeAccount: async (id) => {
    const next = get().accounts.filter((a) => a.id !== id);
    set({ accounts: next });
    await persist(next);
  },

  hydrate: async () => {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return;
    try {
      set({ accounts: JSON.parse(raw) });
    } catch {}
  },
}));
